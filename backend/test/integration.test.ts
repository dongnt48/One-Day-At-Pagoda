import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client, type Room } from "@colyseus/sdk";
import { walkable } from "../src/realtime/world.js";
import {leaveOnPageHide} from '../../frontend/src/game/multiplayer/pageExit.js';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const origin = "http://127.0.0.1:2569";
test(
  "MVP: authenticated multiplayer, social persistence and moderation",
  { timeout: 45000 },
  async (t) => {
    const dir = mkdtempSync(join(tmpdir(), "pagoda-test-"));
    const server = spawn(
      process.execPath,
      process.env.TEST_BUILT_SERVER === '1' ? ['dist/server.js'] : ["--import", "tsx", "src/server.ts"],
      {
        env: {
          ...process.env,
          PORT: "2569",
          ROOM_MAX_CLIENTS: "2",
          DATABASE_PATH: join(dir, "test.sqlite"),
        },
        stdio: "pipe",
      },
    );
    let logs = "";
    server.stderr?.on("data", (b) => (logs += b));
    server.stdout?.on("data", (b) => (logs += b));
    const rooms: Room[] = [];
    t.after(async () => {
      await Promise.race([
        Promise.all(rooms.map((r) => r.leave().catch(() => {}))),
        delay(300),
      ]);
      const exited = new Promise((r) => server.once("exit", r));
      server.kill();
      await exited;
      rmSync(dir, { recursive: true, force: true });
    });
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(origin + "/api/health")).ok) break;
      } catch {}
      await delay(100);
      if (i === 79) throw Error(logs);
    }
    async function request(path: string, body?: unknown, cookie = "") {
      const response = await fetch(origin + "/api/" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {
        status: response.status,
        data: await response.json(),
        cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie,
      };
    }
    const a = await request("guest", {
        displayName: "An Nhiên",
        avatar: "male",
      }),
      b = await request("guest", { displayName: "Bình Yên", avatar: "female" }),
      c = await request("guest", { displayName: "Mây Nhỏ", avatar: "female" });
    assert.equal(a.status, 200, logs);
    assert.ok(a.cookie.startsWith("pagoda_session="));
    await t.test(
      "unauthenticated matchmaking cannot allocate a room",
      async () => {
        const response = await fetch(
          origin + "/matchmake/create/public_temple",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket: "invalid" }),
          },
        );
        const result = await response.json();
        assert.ok(response.status >= 400, JSON.stringify(result));
        assert.equal(result.roomId, undefined);
      },
    );
    async function connect(person: typeof a) {
      const { data } = await request("ticket", {}, person.cookie);
      const r = await new Client(origin).joinOrCreate("public_temple", {
        ticket: data.ticket,
      });
      r.onMessage("notice", () => {});
      r.onMessage('quest_state',()=>{});r.onMessage('quest_progress',()=>{});r.onMessage('quest_reward',()=>{});
      r.onMessage('state_patch',(patch:any)=>{
        if(rooms[0]!==r||!state)return;
        const next=new Map<string,any>(state.players.map((p:any)=>[p.id,p]));
        for(const id of patch.removed)next.delete(id);
        for(const p of patch.added)next.set(p.id,p);
        for(const [id,x,z,rotationY,action,seat,tray,title] of patch.changed){const p=next.get(id);if(p)next.set(id,{...p,x,z,rotationY,action,seat:seat||undefined,tray,title:title||undefined});}
        state={...state,players:[...next.values()]};
      });
      rooms.push(r);
      return r;
    }
    let state: any;
    const one = await connect(a),
      two = await connect(b);
    one.reconnection.minUptime = 0;
    one.onMessage("state", (s) => (state = s));
    one.send('resync');
    two.onMessage("state", () => {});
    let chats: any[] = [];
    two.onMessage("chat_message", (m) => chats.push(m));
    one.onMessage("chat_message", () => {});
    await t.test("public matchmaking, presence and room overflow", async () => {
      assert.equal(one.roomId, two.roomId);
      await delay(150);
      assert.equal(state.players.length, 2);
      const three = await connect(c);
      three.onMessage("state", () => {});
      assert.notEqual(three.roomId, one.roomId);
      await three.leave();
    });
    await t.test(
      "reject missing identity, duplicate guest, HTML and long name",
      async () => {
        await assert.rejects(() =>
          new Client(origin).joinOrCreate("public_temple", { ticket: "bad" }),
        );
        await assert.rejects(() => connect(a));
        assert.equal(
          (await request("guest", { displayName: "<script>", avatar: "male" }))
            .status,
          400,
        );
        assert.equal(
          (
            await request("guest", {
              displayName: "a".repeat(21),
              avatar: "male",
            })
          ).status,
          400,
        );
        assert.equal((await request("ticket", {})).status, 401);
      },
    );
    await t.test('quests are private, reject forged rewards and sync equipped titles to the room',async()=>{
      let questState:any;const stop=one.onMessage('quest_state',data=>{questState=data;});
      one.send('quests',{op:'resync'});await delay(100);
      assert.equal(questState.catalog.length,300);assert.equal(questState.titles.length,12);
      assert.ok(questState.profile.merit>0,'first real map visit is counted');
      const merit=questState.profile.merit;
      one.send('quests',{op:'add',merit:999999});one.send('quests',{op:'equip',titleId:'happy-lotus'});await delay(100);
      one.send('quests',{op:'resync'});await delay(100);assert.equal(questState.profile.merit,merit);assert.equal(questState.profile.titleId,null);
      one.send('quests',{op:'equip',titleId:'sprout'});await delay(150);
      assert.equal(questState.profile.titleId,'sprout');assert.equal(state.players.find((p:any)=>p.id===a.data.guest.id).title,'Mầm Nhỏ');
      stop();
    });
    await t.test('page refresh releases presence immediately instead of reserving it for reconnection',async()=>{
      const person=await request('guest',{displayName:'Reload Test',avatar:'male'});
      const old=await connect(person);
      old.onMessage('state',()=>{});
      const closed=new Promise<void>(resolve=>old.onLeave(()=>resolve()));
      const page=new EventTarget();
      const cleanup=leaveOnPageHide(page,()=>old,()=>{});
      page.dispatchEvent(new Event('pagehide'));
      await closed;
      cleanup();
      const profile=await request('guest',{displayName:'Reload Test',avatar:'male'},person.cookie);
      assert.equal(profile.status,200,'refresh must not report a duplicate window');
      const replacement=await connect(person);
      replacement.onMessage('state',()=>{});
      await replacement.leave();
    });
    await t.test(
      "server movement ignores teleport coordinates and clamps input speed",
      async () => {
        const before = state.players.find((p: any) => p.id === a.data.guest.id);
        const z = before.z;
        one.send("move", { dx: 0, dz: -100000, rotationY: 0, x: 999, z: 999 });
        await delay(170);
        const after = state.players.find((p: any) => p.id === a.data.guest.id);
        assert.ok(after.z < z);
        assert.ok(z - after.z < 1.3);
        assert.ok(walkable(after.x, after.z));
        one.send("move", { dx: 0, dz: 0, rotationY: 0 });
        assert.equal(walkable(0, -12,'hall'), true);
        assert.equal(walkable(0, -32,'hall'), false);
        assert.equal(walkable(16, 2), false);
        assert.equal(walkable(49, 0), false);
      },
    );
    await t.test("actions sync and distant activity is rejected", async () => {
      one.send("action", "incense");
      await delay(100);
      assert.notEqual(
        state.players.find((p: any) => p.id === a.data.guest.id).action,
        "incense",
      );
      one.send("action", "wave");
      for(let i=0;i<20&&state.players.find((p:any)=>p.id===a.data.guest.id).action!=='wave';i++)await delay(25);
      assert.equal(
        state.players.find((p: any) => p.id === a.data.guest.id).action,
        "wave",
      );
    });
    await t.test("chat delivery, cooldown and content validation", async () => {
      one.send("chat", "Chào bạn nhé!");
      one.send("chat", "spam");
      await delay(100);
      assert.equal(chats.length, 1);
      assert.equal(chats[0].text, "Chào bạn nhé!");
      one.send("chat", "<img src=x>");
      one.send("chat", "a".repeat(121));
      await delay(100);
      assert.equal(chats.length, 1);
    });
    await t.test(
      "friend requests authorize receiver and survive a new session read",
      async () => {
        assert.equal(
          (
            await request(
              "social",
              { action: "request", target: b.data.guest.id },
              a.cookie,
            )
          ).status,
          200,
        );
        const list = await request("social", undefined, b.cookie),
          id = list.data.requests[0].id;
        assert.equal(
          (
            await request(
              "social",
              { action: "accept", requestId: id },
              a.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "social",
              { action: "accept", requestId: id },
              b.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request("me", undefined, a.cookie)).data.guest.id,
          a.data.guest.id,
        );
        assert.equal(
          (await request("social", undefined, a.cookie)).data.friends[0].id,
          b.data.guest.id,
        );
        assert.equal(
          (await request("friend-room", { target: b.data.guest.id }, a.cookie))
            .data.roomId,
          two.roomId,
        );
      },
    );
    await t.test(
      "block suppresses delivery and requests; reports are throttled",
      async () => {
        await request(
          "social",
          { action: "block", target: a.data.guest.id },
          b.cookie,
        );
        await delay(1600);
        one.send("chat", "Bạn có thấy không?");
        await delay(100);
        assert.equal(chats.length, 1);
        assert.equal(
          (
            await request(
              "social",
              { action: "request", target: b.data.guest.id },
              a.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (await request("social", undefined, a.cookie)).data.friends.length,
          0,
        );
        assert.equal(
          (
            await request(
              "social",
              {
                action: "report",
                target: a.data.guest.id,
                reason: "Nội dung không phù hợp",
              },
              b.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              "social",
              {
                action: "report",
                target: a.data.guest.id,
                reason: "Gửi liên tiếp",
              },
              b.cookie,
            )
          ).status,
          429,
        );
      },
    );
    await t.test("drop and automatic reconnect retains identity", async () => {
      const id = one.sessionId;
      const resumed = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("Reconnect timeout")),
          12000,
        );
        one.onReconnect(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      one.connection.close(4010);
      await resumed;
      assert.equal(one.sessionId, id);
      await delay(100);
      assert.ok(state.players.some((p: any) => p.id === a.data.guest.id));
    });
    await t.test("leaving removes player from other clients", async () => {
      let snapshot: any;
      two.onMessage("state", (s) => (snapshot = s));
      await one.leave();
      two.send('resync');
      await delay(180);
      assert.equal(snapshot.players.length, 1);
    });
  },
);
