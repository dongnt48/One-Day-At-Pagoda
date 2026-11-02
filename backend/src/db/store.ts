import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, randomUUID, createHash } from "node:crypto";
const path = process.env.DATABASE_PATH || "./data/pagoda.sqlite";
mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS guests(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, avatar TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS guest_sessions(id TEXT PRIMARY KEY, guest_id TEXT REFERENCES guests(id), token_hash TEXT UNIQUE NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS friend_requests(id TEXT PRIMARY KEY, sender_id TEXT REFERENCES guests(id), receiver_id TEXT REFERENCES guests(id), status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, UNIQUE(sender_id,receiver_id));
CREATE TABLE IF NOT EXISTS friendships(user_a_id TEXT REFERENCES guests(id), user_b_id TEXT REFERENCES guests(id), created_at INTEGER NOT NULL, PRIMARY KEY(user_a_id,user_b_id));
CREATE TABLE IF NOT EXISTS blocks(blocker_id TEXT REFERENCES guests(id), blocked_id TEXT REFERENCES guests(id), created_at INTEGER NOT NULL, PRIMARY KEY(blocker_id,blocked_id));
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, reporter_id TEXT REFERENCES guests(id), target_id TEXT REFERENCES guests(id), reason TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS request_receiver ON friend_requests(receiver_id,status);`);
export type Guest = {
  id: string;
  display_name: string;
  avatar: "male" | "female";
};
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function session(cookie = ""): Guest | undefined {
  const token = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("pagoda_session="))
    ?.slice(15);
  if (!token || token.length > 100) return;
  return db
    .prepare(
      "SELECT g.id,g.display_name,g.avatar FROM guests g JOIN guest_sessions s ON s.guest_id=g.id WHERE s.token_hash=? AND s.expires_at>?",
    )
    .get(hash(token), Date.now()) as Guest | undefined;
}
export function createGuest(name: string, avatar: string) {
  const id = randomUUID(),
    token = randomBytes(32).toString("hex"),
    now = Date.now();
  db.prepare("INSERT INTO guests VALUES(?,?,?,?,?)").run(
    id,
    name,
    avatar,
    now,
    now,
  );
  db.prepare("INSERT INTO guest_sessions VALUES(?,?,?,?)").run(
    randomUUID(),
    id,
    hash(token),
    now + 1000 * 86400 * 90,
  );
  return { guest: { id, display_name: name, avatar }, token };
}
export const blocked = (a: string, b: string) =>
  !!db
    .prepare(
      "SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)",
    )
    .get(a, b, b, a);
export const friends = (a: string, b: string) =>
  !!db
    .prepare(
      "SELECT 1 FROM friendships WHERE (user_a_id=? AND user_b_id=?) OR (user_a_id=? AND user_b_id=?)",
    )
    .get(a, b, b, a);
