import { Room, type Client, ServerError } from "@colyseus/core";
import { consumeTicket } from "../guests/tickets.js";
import { blocked, type Guest } from "../db/store.js";
import { online } from "../realtime/presence.js";
import { cleanText } from "../moderation/validation.js";
import { SPEED, maps, mapSpots, walkable, interactionDistance, type MapId } from "../realtime/world.js";
import { gatheringAt } from '../realtime/gathering.js';
import {QuestActivity} from '../quests/activity.js';
import {progressFor,recordProgress,visitMap,releaseProgress,selectTitle,questSnapshot,questUpdate,equippedTitle} from '../quests/store.js';
import {quests} from '../quests/catalog.js';
import {BotPopulation} from '../realtime/bots.js';

type Player = {
  id: string;
  displayName: string;
  avatar: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  action: string;
  tray?: boolean;
  seat?: string;
  title?: string;
  isBot?: boolean;
};
type Actor = {
  player: Player;
  dx: number;
  dz: number;
  moveAt: number;
  chatAt: number;
  actionAt: number;
  until: number;
  prostrationReturn?:{action:string;seat?:string;rotationY:number};
  ip: string;
  questActivity?:QuestActivity;
};
const sources = new Map<string, number>();
const matchmakingAttempts = new Map<
  string,
  { count: number; expires: number }
>();
// Colyseus retries seat reservation using the same request context. A new HTTP
// request must still present a fresh one-time ticket.
const authenticatedRequests = new WeakMap<
  object,
  { ticket: string; expires: number; guest: Guest & { ip: string } }
>();
export class PublicTempleRoom extends Room {
  mapId:MapId='courtyard';

  get spots(){return mapSpots[this.mapId];}
  previous=new Map<string,string>();
  previousGathering='';
  bellAt=0;
  questSent=new Map<string,{revision:number;at:number}>();
  actors = new Map<string, Actor>();
  bots?:BotPopulation;
  get players():Player[]{return [...this.actors.values()].map(a=>a.player).concat(this.bots?.players??[]);}
  limits = new Map<string, { count: number; at: number }>();
  listen(type: string, handler: (c: Client, m: any) => void) {
    this.onMessage(type, (c, m) => {
      let limit = this.limits.get(c.sessionId);
      if (!limit || Date.now() - limit.at > 1000) {
        limit = { count: 0, at: Date.now() };
        this.limits.set(c.sessionId, limit);
      }
      if (++limit.count > 40) {
        c.leave(4008);
        return;
      }
      handler(c, m);
    });
  }
  maxClients = Math.max(
    2,
    Math.min(100, Number(process.env.ROOM_MAX_CLIENTS) || 100),
  );
  onCreate() {
    const botCount=Number(process.env.BOT_COUNT??(process.env.NODE_ENV==='production'?'20':'0'));
    this.bots=new BotPopulation(this.mapId,Math.min(this.maxClients,botCount),Math.random,id=>{
      const now=Date.now();
      if(now-this.bellAt<60000)return;
      this.bellAt=now;this.broadcast('bell',{playerId:id});
    });
    this.listen('resync',(c)=>this.snapshot(c));
    this.listen('quests',(c,m)=>{
      const a=this.actors.get(c.sessionId);if(!a)return;
      if(m?.op==='resync'){this.sendQuests(c,true);return;}
      if(m?.op!=='equip'||(m.titleId!==null&&typeof m.titleId!=='string'))return;
      try{a.player.title=selectTitle(a.player.id,m.titleId);this.sendQuests(c,true);}
      catch(error){c.send('notice',(error as Error).message);}
    });
    this.listen("move", (c, m) => {
      const a = this.actors.get(c.sessionId);
      if (
        !a ||
        !m ||
        !Number.isFinite(m.dx) ||
        !Number.isFinite(m.dz) ||
        !Number.isFinite(m.rotationY)
      )
        return;
      const now = Date.now();
      this.trackQuests(a,now);
      if(a.player.action==='pray'&&a.until>now)return;
      if (now - a.moveAt < 40) return;
      a.moveAt = now;
      if(a.player.action==='prostrate'){
        if(Math.hypot(m.dx,m.dz)<=.1)return;
        this.stand(a);
      }
      if(a.player.seat && Math.hypot(m.dx,m.dz)>.1) this.stand(a);
      const len = Math.max(1, Math.hypot(m.dx, m.dz));
      a.dx = m.dx / len;
      a.dz = m.dz / len;
      a.player.rotationY = m.rotationY % (Math.PI * 2);
      this.trackQuests(a,now);
    });
    this.listen("action", (c, m) => {
      const a = this.actors.get(c.sessionId);
      if (!a || typeof m !== "string") return;
      this.trackQuests(a,Date.now());
      try{
      if(a.player.action==='pray'&&a.until>Date.now())return;
      if(m==='stand' || (m==='prostrate'&&a.player.action==='prostrate') || (a.player.seat && m===a.player.seat)){
        if(a.player.action==='prostrate')this.stopProstration(a);else this.stand(a);
        a.actionAt=Date.now();return;
      }
      if(Date.now()-a.actionAt<700)return;
      if(m==='prostrate'){
        if(this.mapId!=='hall')return;
        if(a.player.tray){c.send('notice','Hãy trả khay trước khi lạy Phật.');return;}
        const previous={action:['sit','meditate','listen','seated'].includes(a.player.action)?a.player.action:'idle',seat:a.player.seat,rotationY:a.player.rotationY};
        this.stand(a);a.prostrationReturn=previous;a.player.seat=previous.seat;
        a.actionAt=Date.now();a.player.action='prostrate';a.player.rotationY=Math.PI;a.until=Infinity;
        return;
      }
      const portal=maps[this.mapId].portals.find(p=>p.id===m);
      if(portal){
        if(Math.hypot(a.player.x-portal.x,a.player.z-portal.z)>2.8){c.send('notice','Hãy đến gần cổng chuyển khu.');return;}
        if(a.player.tray){c.send('notice','Hãy trả khay trước khi rời Nhà ăn.');return;}
        a.actionAt=Date.now();a.dx=a.dz=0;c.send('travel',{mapId:portal.target});return;
      }
      const activity=this.spots.find(s=>s.id===m);
      const praying=m==='pray'||m.startsWith('pray-');
      if(this.mapId==='courtyard'&&activity&&m==='bell'){
        if(interactionDistance(this.mapId,activity,a.player.x,a.player.z)>=(activity.radius??1.1))return;
        if(a.player.tray){c.send('notice','Hãy trả khay trước khi gõ chuông.');return;}
        const now=Date.now();
        if(now-this.bellAt<4000){c.send('notice','Chờ tiếng chuông ngân xong rồi gõ tiếp nhé.');return;}
        this.bellAt=now;this.stand(a);a.actionAt=now;a.player.action='bell';a.player.rotationY=Math.PI;a.until=now+2200;
        this.broadcast('bell',{playerId:a.player.id});
        return;
      }
      if(this.mapId==='dining'&&activity&&(m==='cook'||m==='wash')){
        if(interactionDistance(this.mapId,activity,a.player.x,a.player.z)>=(activity.radius??1.6))return;
        if(a.player.tray){c.send('notice','Hãy trả khay trước khi phụ nấu cơm hoặc rửa chén.');return;}
        this.stand(a);a.actionAt=Date.now();a.player.action=m;a.player.rotationY=Math.PI;a.until=Date.now()+6000;
        return;
      }
      if(this.mapId==='courtyard'&&activity&&m.startsWith('garden-')){
        if(interactionDistance(this.mapId,activity,a.player.x,a.player.z)>=(activity.radius??1.2))return;
        this.stand(a);a.actionAt=Date.now();a.player.action='water';a.player.rotationY=Math.PI;a.until=Date.now()+4000;
        return;
      }
      if(activity && !['incense','sweep','water'].includes(m)){
        if(Math.hypot(activity.x-a.player.x,activity.z-a.player.z)>(activity.radius??2.8)){c.send('notice','Hãy đến gần vị trí tương tác.');return;}
        const seated=m.startsWith('eat-')||m.startsWith('meditate-')||m.startsWith('listen-');
        if(seated&&[...this.actors.values()].some(other=>other!==a&&other.player.seat===m)){c.send('notice','Chỗ này đang có người ngồi. Bạn chọn chỗ bên cạnh nhé.');return;}
        if(m==='meal'&&a.player.tray){c.send('notice','Bạn đang có một khay cơm rồi.');return;}
        if(m==='return-tray'&&!a.player.tray){c.send('notice','Bạn không có khay để trả.');return;}
        if(a.player.tray&&(praying||m.startsWith('meditate-')||m.startsWith('listen-'))){c.send('notice','Hãy trả khay trước khi vào sinh hoạt ở Chính điện.');return;}
        this.stand(a);a.actionAt=Date.now();a.dx=a.dz=0;
        if(m==='meal'||m==='return-tray'){a.player.tray=m==='meal';c.send('notice',m==='meal'?'Mời bạn chọn ghế để dùng cơm chay.':'Cảm ơn bạn đã trả khay.');return;}
        a.player.rotationY=Math.PI;
        if(seated){
          a.player.seat=m;a.player.x=activity.x;a.player.z=activity.z;
          a.player.action=m.startsWith('eat-')?(a.player.tray?'eat':'seated'):m.startsWith('listen-')&&gatheringAt(Date.now()).active?'listen':'meditate';
          a.until=Infinity;
        }
        else {a.player.action=praying?'pray':'bow';a.until=Date.now()+(praying?12000:2200);}
        return;
      }
      if (!["wave", "bow", "sit", "incense", "sweep", "water"].includes(m))
        return;
      if(a.player.tray&&['incense','sweep','water','bow','sit'].includes(m)){c.send('notice','Hãy trả khay trước khi làm hoạt động này.');return;}
      if(a.player.seat||a.player.action==='prostrate')this.stand(a);
      const spot = this.spots.find((s) => s.id === m);
      if(['incense','sweep','water'].includes(m)&&!spot)return;
      if (spot && Math.hypot(spot.x - a.player.x, spot.z - a.player.z) >= (spot.radius ?? 2.8)) {
        c.send("notice", "Hãy đến gần hơn để tương tác.");
        return;
      }
      if (spot)
        a.player.rotationY = Math.atan2(
          spot.x - a.player.x,
          spot.z - a.player.z,
        );
      a.actionAt = Date.now();
      a.dx = a.dz = 0;
      if (m === "sit" && a.player.action === "sit") {
        a.player.action = "idle";
        a.until = 0;
        return;
      }
      a.player.action = m;
      a.until = m === "sit" ? Infinity : Date.now() + (m === "incense" ? 6000 : spot ? 4000 : 2200);
      }finally{this.trackQuests(a,Date.now(),m);}
    });
    this.listen("chat", (c, m) => {
      const a = this.actors.get(c.sessionId);
      if (!a) return;
      const text = cleanText(m, 120);
      if (!text) {
        c.send("notice", "Tin nhắn cần từ 1–120 ký tự và nội dung phù hợp.");
        return;
      }
      if (Date.now() - a.chatAt < 1500) {
        c.send("notice", "Bạn gửi hơi nhanh. Hãy chờ một chút nhé.");
        return;
      }
      a.chatAt = Date.now();
      for (const peer of this.clients) {
        const b = this.actors.get(peer.sessionId);
        if (b && !blocked(a.player.id, b.player.id))
          peer.send("chat_message", {
            id: crypto.randomUUID(),
            playerId: a.player.id,
            name: a.player.displayName,
            text,
            at: Date.now(),
          });
      }
    });
    const tick = Math.max(
      10,
      Math.min(30, Number(process.env.NETWORK_TICK) || 10),
    );
    this.setSimulationInterval((dt) => {
      const now = Date.now();
      for (const a of this.actors.values()) {
        this.trackQuests(a,now);
        if(a.player.action!=='prostrate'&&a.player.seat?.startsWith('listen-'))a.player.action=gatheringAt(now).active?'listen':'meditate';
        if (a.until > now) continue;
        if (now - a.moveAt > 300) a.dx = a.dz = 0;
        const distance = SPEED * Math.min(dt / 1000, 0.1),
          x = a.player.x + a.dx * distance,
          z = a.player.z + a.dz * distance;
        if (walkable(x, a.player.z,this.mapId)) a.player.x = x;
        if (walkable(a.player.x, z,this.mapId)) a.player.z = z;
        a.player.action = a.dx || a.dz ? "walk" : "idle";
        this.trackQuests(a,now);
      }
      this.bots?.update(now,dt,[...this.actors.values()].map(a=>a.player),this.maxClients);
      this.publish(now);
    }, 1000 / tick);
  }
  stand(a: Actor) {
    a.prostrationReturn=undefined;a.player.seat=undefined;a.player.action='idle';a.until=0;a.dx=a.dz=0;
  }
  stopProstration(a:Actor){
    const previous=a.prostrationReturn;
    this.stand(a);
    if(!previous)return;
    a.player.action=previous.action;a.player.seat=previous.seat;a.player.rotationY=previous.rotationY;
    if(previous.seat?.startsWith('listen-'))a.player.action=gatheringAt(Date.now()).active?'listen':'meditate';
    a.until=a.player.action==='idle'?0:Infinity;
  }
  snapshot(client:Client){

    client.send('state',{players:this.players,capacity:this.maxClients,mapId:this.mapId,gathering:gatheringAt(Date.now())});
    this.sendQuests(client,true);
  }
  trackQuests(a:Actor,now:number,context?:string){
    if(!a.questActivity)a.questActivity=new QuestActivity((delta,distinct)=>{
      const result=recordProgress(a.player.id,delta,distinct);
      if(result.awarded.length){
        const client=this.clients.find(c=>this.actors.get(c.sessionId)===a);
        client?.send('quest_reward',{merit:result.merit,count:result.awarded.length,title:quests.find(q=>q.id===result.awarded[0])?.title});
      }
    });
    const nearby=[...this.actors.values()].some(other=>other!==a&&Math.hypot(other.player.x-a.player.x,other.player.z-a.player.z)<=6);
    a.questActivity.sample({action:a.player.action,startedAt:a.actionAt,until:a.until,seat:a.player.seat,tray:a.player.tray,x:a.player.x,z:a.player.z},now,context,nearby);
  }
  sendQuests(client:Client,full=false){
    const a=this.actors.get(client.sessionId);if(!a)return;
    const p=progressFor(a.player.id),last=this.questSent.get(client.sessionId),now=Date.now();
    if(!full&&last&&(last.revision===p.revision||now-last.at<1000))return;
    client.send(full?'quest_state':'quest_progress',full?questSnapshot(a.player.id):questUpdate(a.player.id));
    this.questSent.set(client.sessionId,{revision:p.revision,at:now});
  }
  publish(now:number){

    const added:Player[]=[],changed:unknown[][]=[],next=new Map<string,string>();
    for(const p of this.players){
      const row=[p.id,Math.round(p.x*1000)/1000,Math.round(p.z*1000)/1000,Math.round(p.rotationY*10000)/10000,p.action,p.seat||'',!!p.tray,p.title||''];
      const signature=JSON.stringify(row);next.set(p.id,signature);
      if(!this.previous.has(p.id))added.push({...p});
      else if(this.previous.get(p.id)!==signature)changed.push(row);
    }
    const removed=[...this.previous.keys()].filter(id=>!next.has(id));
    const gathering=gatheringAt(now),key=JSON.stringify(gathering);
    if(added.length||changed.length||removed.length||key!==this.previousGathering)
      this.broadcast('state_patch',{added,changed,removed,...(key!==this.previousGathering?{gathering}:{})});
    this.previous=next;this.previousGathering=key;
    for(const client of this.clients)this.sendQuests(client);
  }
  onReconnect(client:Client){this.snapshot(client);}
  static async onAuth(_token: string, options: any, context: any) {
    const cached = context && authenticatedRequests.get(context);
    if (
      cached &&
      cached.ticket === options?.ticket &&
      cached.expires > Date.now()
    )
      return cached.guest;
    const ip = context?.ip || "unknown";
    const now = Date.now();
    for (const [key, limit] of matchmakingAttempts)
      if (limit.expires <= now) matchmakingAttempts.delete(key);
    const limit = matchmakingAttempts.get(ip) || {
      count: 0,
      expires: now + 60000,
    };
    matchmakingAttempts.set(ip, limit);
    if (++limit.count > 240)
      throw new ServerError(429, "Quá nhiều lần vào chùa. Hãy chờ một phút.");
    const guest = consumeTicket(options?.ticket);
    if (!guest)
      throw new ServerError(401, "Phiên đã hết hạn. Hãy vào lại chùa.");
    if (online.has(guest.id))
      throw new ServerError(409, "Bạn đang ở chùa trong một cửa sổ khác.");
    if ((sources.get(ip) || 0) >= 120)
      throw new ServerError(429, "Có quá nhiều kết nối từ mạng này.");
    const auth = { ...guest, ip };
    if (context)
      authenticatedRequests.set(context, {
        ticket: options.ticket,
        expires: now + 30000,
        guest: auth,
      });
    return auth;
  }
  onJoin(client: Client, _options: any, guest: Guest & { ip: string }) {
    if (online.has(guest.id))
      throw new ServerError(409, "Phiên đã được mở ở cửa sổ khác.");
    online.set(guest.id, { roomId: this.roomId, sessionId: client.sessionId });
    sources.set(guest.ip, (sources.get(guest.ip) || 0) + 1);
    visitMap(guest.id,this.mapId);
    this.actors.set(client.sessionId, {
      player: {
        id: guest.id,
        displayName: guest.display_name,
        avatar: guest.avatar,
        x: maps[this.mapId].spawn.x + ((this.actors.size % 10) - 4.5) * (this.mapId==='dining'?.6:1.1),
        y: 0,
        z: maps[this.mapId].spawn.z - Math.floor(this.actors.size/10)*.8,
        rotationY: Math.PI,
        action: "idle",
        title:equippedTitle(progressFor(guest.id)),
      },
      dx: 0,
      dz: 0,
      moveAt: 0,
      chatAt: 0,
      actionAt: 0,
      until: 0,
      ip: guest.ip,
    });
    this.bots?.update(Date.now(),0,[...this.actors.values()].map(a=>a.player),this.maxClients);
    this.snapshot(client);
  }
  onDrop(client: Client, code?: number) {
    const a = this.actors.get(client.sessionId);
    if (a) {this.trackQuests(a,Date.now());this.stand(a);this.trackQuests(a,Date.now());}
    if (code !== 4008) this.allowReconnection(client, 15);
  }
  onLeave(client: Client) {
    const a = this.actors.get(client.sessionId);
    if (!a) return;
    this.trackQuests(a,Date.now());releaseProgress(a.player.id);this.questSent.delete(client.sessionId);
    this.actors.delete(client.sessionId);
    this.limits.delete(client.sessionId);
    online.delete(a.player.id);
    sources.set(a.ip, Math.max(0, (sources.get(a.ip) || 1) - 1));
  }
}
export class MainHallRoom extends PublicTempleRoom {mapId:MapId='hall';maxClients=Math.max(2,Math.min(100,Number(process.env.ROOM_MAX_CLIENTS)||100));}
export class DiningHallRoom extends PublicTempleRoom {mapId:MapId='dining';maxClients=Math.max(2,Math.min(50,Number(process.env.ROOM_MAX_CLIENTS)||50));}
