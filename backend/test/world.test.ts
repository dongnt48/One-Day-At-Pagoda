import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spots, walkable, nearestInteraction, mapSpots } from "../src/realtime/world.js";
import { cleanText } from "../src/moderation/validation.js";
process.env.DATABASE_PATH = ":memory:";
const { PublicTempleRoom } = await import("../src/rooms/PublicTempleRoom.js");
const { issueTicket } = await import("../src/guests/tickets.js");
test("matchmaking retries reuse authentication only within the same request", async () => {
  const guest = {
    id: "retry-guest",
    display_name: "Khách",
    avatar: "male" as const,
  };
  const ticket = issueTicket(guest),
    context = { ip: "retry-test" };
  const first = await PublicTempleRoom.onAuth("", { ticket }, context);
  assert.deepEqual(
    await PublicTempleRoom.onAuth("", { ticket }, context),
    first,
  );
  await assert.rejects(() =>
    PublicTempleRoom.onAuth("", { ticket }, { ip: "retry-test" }),
  );
});
test("Unicode moderation preserves Vietnamese names and rejects unsafe text", () => {
  assert.equal(cleanText("  An Nhiên  ", 20, 2), "An Nhiên");
  assert.equal(cleanText("đụ", 120), null);
  assert.equal(cleanText("<b>hello</b>", 120), null);
  assert.equal(cleanText("a".repeat(121), 120), null);
});
test("all activities require proximity, animate, and expire; sit toggles", () => {
  const room = new PublicTempleRoom();
  const handlers = new Map<string, Function>();
  room.listen = (type, fn) => {
    handlers.set(type, fn);
  };
  room.setSimulationInterval = (() => {}) as any;
  room.onCreate();
  const client = { sessionId: "test", send: () => {} } as any;
  const actor = {
    player: {
      id: "guest",
      displayName: "Test",
      avatar: "male",
      x: 0,
      y: 0,
      z: 10,
      rotationY: 0,
      action: "idle",
    },
    dx: 0,
    dz: 0,
    moveAt: 0,
    chatAt: 0,
    actionAt: 0,
    until: 0,
    ip: "local",
  };
  room.actors.set("test", actor);
  for(const mapId of ['courtyard','hall'] as const){
    room.mapId=mapId;
    const incense=mapSpots[mapId].find(s=>s.id==='incense')!;
    actor.player.x=incense.x;actor.player.z=incense.z+3.2;actor.player.action='idle';actor.actionAt=0;
    handlers.get('action')!({...client,send:()=>{}},'incense');
    assert.equal(actor.player.action,'idle','incense cannot be lit from a distance');
    assert.notEqual(nearestInteraction(mapId,incense.x,incense.z+3.2)?.id,'incense');
    actor.player.z=incense.z+2.4;
    assert.ok(walkable(actor.player.x,actor.player.z,mapId));
    assert.equal(nearestInteraction(mapId,actor.player.x,actor.player.z)?.id,'incense');
    handlers.get('action')!(client,'incense');
    assert.equal(actor.player.action,'incense','standing a little away from the burner allows incense');
  }
  room.mapId='courtyard';
  for (const spot of spots.filter(s=>['incense','sweep','water'].includes(s.id))) {
    actor.actionAt = 0;
    actor.player.x = spot.x;
    actor.player.z = spot.z + (spot.id==='incense'?1.5:2);
    assert.ok(walkable(actor.player.x, actor.player.z));
    const started = Date.now();
    handlers.get("action")!(client, spot.id);
    assert.equal(actor.player.action, spot.id);
    assert.ok(actor.until > Date.now());
    const duration = spot.id === "incense" ? 6000 : 4000;
    assert.ok(actor.until >= started + duration);
    assert.ok(actor.until <= Date.now() + duration);
  }
  actor.actionAt = 0;
  handlers.get("action")!(client, "sit");
  assert.equal(actor.player.action, "sit");
  actor.actionAt = 0;
  handlers.get("action")!(client, "sit");
  assert.equal(actor.player.action, "idle");
  room.clock.stop();
});
test("both GLB characters contain compatible activity animations", () => {
  for (const name of ["male", "female"]) {
    const data = readFileSync(`../frontend/public/models/${name}_lam.glb`);
    assert.equal(data.toString("utf8", 0, 4), "glTF");
    const length = data.readUInt32LE(12);
    const json = JSON.parse(data.toString("utf8", 20, 20 + length));
    assert.deepEqual(
      json.animations.map((a: any) => a.name).sort(),
      [
        "idle",
        "walk",
        "wave",
        "bow",
        "sit",
        "incense",
        "sweep",
        "water",
        "meditate", "eat", "carry", "carry_walk",
      ].sort(),
    );
    assert.ok(json.animations.every((a: any) => a.channels.length > 0));
  }
});
