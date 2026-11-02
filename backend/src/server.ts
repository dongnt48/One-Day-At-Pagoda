import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { rateLimit } from "express-rate-limit";
import {
  db,
  session,
  createGuest,
  blocked,
  friends,
  type Guest,
} from "./db/store.js";
import { issueTicket } from "./guests/tickets.js";
import { online } from "./realtime/presence.js";
import { cleanText } from "./moderation/validation.js";
import { PublicTempleRoom, MainHallRoom, DiningHallRoom } from "./rooms/PublicTempleRoom.js";
import {analyticsRouter} from './analytics.js';
const app = express();
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(express.json({ limit: "4kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.headers.origin) {
    const allowed = process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`;
    if (
      req.headers.origin !== allowed &&
      !(
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(req.headers.origin)
      )
    )
      return res.status(403).json({ error: "Nguồn truy cập không hợp lệ." });
  }
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: (req) => session(req.headers.cookie) ? 120 : 300,
    keyGenerator: (req) => session(req.headers.cookie)?.id || req.ip || 'unknown',
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Quá nhiều yêu cầu. Vui lòng chờ một phút." },
  }),
);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use('/api',analyticsRouter());
app.get("/api/me", (req, res) =>
  res.json({ guest: session(req.headers.cookie) || null }),
);
app.post(
  "/api/guest",
  rateLimit({ windowMs: 60000, limit: 120 }),
  (req, res) => {
    const name = cleanText(req.body?.displayName, 20, 2),
      avatar = req.body?.avatar;
    if (!name || !["male", "female"].includes(avatar))
      return res
        .status(400)
        .json({
          error:
            "Tên cần 2–20 ký tự, không chứa ký tự đặc biệt hoặc từ không phù hợp.",
        });
    let guest = session(req.headers.cookie);
    if (guest) {
      if (online.has(guest.id))
        return res
          .status(409)
          .json({ error: "Bạn đang ở chùa trong một cửa sổ khác." });
      db.prepare(
        "UPDATE guests SET display_name=?,avatar=?,last_seen_at=? WHERE id=?",
      ).run(name, avatar, Date.now(), guest.id);
      guest = { ...guest, display_name: name, avatar };
    } else {
      const created = createGuest(name, avatar);
      guest = created.guest as Guest;
      res.cookie("pagoda_session", created.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 90 * 86400000,
        path: "/",
      });
    }
    res.json({ guest });
  },
);
app.use("/api", (req, res, next) => {
  const guest = session(req.headers.cookie);
  if (!guest)
    return res
      .status(401)
      .json({ error: "Phiên đã hết hạn. Vui lòng vào lại." });
  res.locals.guest = guest;
  next();
});
app.post("/api/ticket", (_req, res) =>
  res.json({ ticket: issueTicket(res.locals.guest) }),
);
app.get("/api/social", (_req, res) => {
  const id = res.locals.guest.id;
  const list = db
    .prepare(
      "SELECT g.id,g.display_name FROM guests g JOIN friendships f ON (f.user_a_id=g.id AND f.user_b_id=?) OR (f.user_b_id=g.id AND f.user_a_id=?)",
    )
    .all(id, id)
    .map((g) => ({ ...g, roomId: online.get(g.id as string)?.roomId || null }));
  const requests = db
    .prepare(
      "SELECT r.id,r.sender_id,r.receiver_id,g.display_name FROM friend_requests r JOIN guests g ON g.id=r.sender_id WHERE r.receiver_id=? AND r.status='pending'",
    )
    .all(id);
  const sent = db
    .prepare(
      "SELECT receiver_id FROM friend_requests WHERE sender_id=? AND status='pending'",
    )
    .all(id);
  const blocks = db
    .prepare(
      "SELECT g.id,g.display_name FROM blocks b JOIN guests g ON g.id=b.blocked_id WHERE b.blocker_id=?",
    )
    .all(id);
  res.json({ friends: list, requests, sent, blocks });
});
app.post(
  "/api/social",
  rateLimit({ windowMs: 60000, limit: 30, keyGenerator: (_req,res) => res.locals.guest.id }),
  (req, res) => {
    const id = res.locals.guest.id,
      { action, target, requestId, reason } = req.body || {};
    if (["accept", "decline"].includes(action)) {
      const r = db
        .prepare(
          "SELECT * FROM friend_requests WHERE id=? AND receiver_id=? AND status='pending'",
        )
        .get(typeof requestId === "string" ? requestId : "", id);
      if (!r)
        return res.status(404).json({ error: "Lời mời không còn tồn tại." });
      if (blocked(id, r.sender_id as string))
        return res
          .status(403)
          .json({ error: "Không thể kết bạn với người bị chặn." });
      db.exec("BEGIN");
      try {
        db.prepare("UPDATE friend_requests SET status=? WHERE id=?").run(
          action === "accept" ? "accepted" : "declined",
          requestId,
        );
        if (action === "accept") {
          const [a, b] = [id, r.sender_id as string].sort();
          db.prepare("INSERT OR IGNORE INTO friendships VALUES(?,?,?)").run(
            a,
            b,
            Date.now(),
          );
          db.prepare(
            "UPDATE friend_requests SET status='accepted' WHERE sender_id=? AND receiver_id=?",
          ).run(id, r.sender_id);
        }
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    } else {
      if (
        typeof target !== "string" ||
        target === id ||
        !db.prepare("SELECT 1 FROM guests WHERE id=?").get(target)
      )
        return res.status(400).json({ error: "Người chơi không hợp lệ." });
      if (action === "request") {
        if (blocked(id, target))
          return res.status(403).json({ error: "Không thể gửi lời mời." });
        if (!friends(id, target))
          db.prepare(
            "INSERT INTO friend_requests VALUES(?,?,?,'pending',?) ON CONFLICT(sender_id,receiver_id) DO UPDATE SET status='pending'",
          ).run(randomUUID(), id, target, Date.now());
      } else if (action === "block") {
        db.prepare("INSERT OR IGNORE INTO blocks VALUES(?,?,?)").run(
          id,
          target,
          Date.now(),
        );
        db.prepare(
          "DELETE FROM friendships WHERE (user_a_id=? AND user_b_id=?) OR (user_a_id=? AND user_b_id=?)",
        ).run(id, target, target, id);
        db.prepare(
          "DELETE FROM friend_requests WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)",
        ).run(id, target, target, id);
      } else if (action === "unblock")
        db.prepare(
          "DELETE FROM blocks WHERE blocker_id=? AND blocked_id=?",
        ).run(id, target);
      else if (action === "report") {
        const text = cleanText(reason, 240, 3);
        if (!text)
          return res
            .status(400)
            .json({ error: "Vui lòng nhập lý do từ 3–240 ký tự." });
        if (
          db
            .prepare(
              "SELECT 1 FROM reports WHERE reporter_id=? AND created_at>?",
            )
            .get(id, Date.now() - 30000)
        )
          return res
            .status(429)
            .json({ error: "Báo cáo đã được ghi nhận. Hãy chờ 30 giây." });
        db.prepare("INSERT INTO reports VALUES(?,?,?,?,?)").run(
          randomUUID(),
          id,
          target,
          text,
          Date.now(),
        );
      } else return res.status(400).json({ error: "Thao tác không hợp lệ." });
    }
    res.json({ ok: true });
  },
);
app.post("/api/friend-room", async (req, res, next) => {
  try {
    const id = res.locals.guest.id,
      target = req.body?.target;
    if (
      typeof target !== "string" ||
      !friends(id, target) ||
      blocked(id, target)
    )
      return res
        .status(403)
        .json({ error: "Người này chưa có trong danh sách bạn." });
    const roomId = online.get(target)?.roomId;
    if (!roomId)
      return res.status(404).json({ error: "Bạn của bạn đã rời chùa." });
    if (online.get(id)?.roomId !== roomId) {
      const room = (await matchMaker.query({ roomId }))[0];
      if (!room || room.locked || room.clients >= room.maxClients)
        return res
          .status(409)
          .json({
            error:
              "Chùa của bạn đã đầy. Bạn vẫn ở phòng hiện tại, hãy thử lại sau nhé.",
          });
    }
    res.json({ roomId });
  } catch (e) {
    next(e);
  }
});
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.message);
    res.status(500).json({ error: "Có lỗi máy chủ. Vui lòng thử lại." });
  },
);
const http = createServer(app);
const game = new Server({
  transport: new WebSocketTransport({ server: http, maxPayload: 4096 }),
});
game.define("public_temple", PublicTempleRoom).sortBy({ clients: -1 });
game.define("main_hall", MainHallRoom).sortBy({ clients: -1 });
game.define("dining_hall", DiningHallRoom).sortBy({ clients: -1 });
await game.listen(Number(process.env.PORT) || 2567);
console.log(`Pagoda server http://localhost:${process.env.PORT || 2567}`);
