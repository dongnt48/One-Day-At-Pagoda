import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ArrowRight,
  ArrowLeft,
  Leaf,
  Volume2,
  VolumeX,
  Users,
  Settings,
  MessageCircle,
  Send,
  Hand,
  Heart,
  Armchair,
  LogOut,
  Flag,
  Ban,
  UserPlus,
  Check,
  ChevronRight,
  Flower2,
  Wind,
  ScrollText,
} from "lucide-react";
import type { Room } from "@colyseus/sdk";
import { World } from "../game/scene/World";
import { Model } from "../game/characters/Character";
import { api, client, enterRoom } from "../game/multiplayer/client";
import {leaveOnPageHide} from '../game/multiplayer/pageExit';
import {generateGuestName} from '../game/multiplayer/guestName';
import { Ambience } from "../game/audio";
import { maps,type MapId } from "../game/world";
import {interactionForPlayer} from '../game/controls/interaction';
import {fitGameViewport} from '../game/controls/gameViewport';
import {applyPatch,type StatePatch} from '../game/multiplayer/state';
import { Dialog } from "../components/Dialog";
import {MovementGuide} from '../components/MovementGuide';
import { ScheduleNotice } from "../components/ScheduleNotice";
import {QuestPanel} from '../components/QuestPanel';
import type {QuestData,QuestProfile} from '../game/quests/types';
import type { Player, Guest, ChatMessage, Social, Action, Gathering } from "../game/types";
const emptySocial: Social = { friends: [], requests: [], sent: [], blocks: [] };
function saved<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing may disable storage. */
  }
}
export function App() {
  const appElement=useRef<HTMLElement>(null);
  const nameEdited=useRef(false);
  const [mapId,setMapId]=useState<MapId>('courtyard');
  const currentMap=useRef<MapId>('courtyard'),travelling=useRef(false);
  const [page, setPage] = useState<"home" | "entry" | "game">("home"),
    [guest, setGuest] = useState<Guest | null>(null),
    [name, setName] = useState(generateGuestName),
    [avatar, setAvatar] = useState<"male" | "female">("male");
  useEffect(()=>{if(page==='game'&&appElement.current)return fitGameViewport(appElement.current);},[page]);
  const [room, setRoom] = useState<Room | null>(null),
    [players, setPlayers] = useState<Player[]>([]),
    [capacity, setCapacity] = useState(100),
    [busy, setBusy] = useState(false),
    [connection, setConnection] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [questData,setQuestData]=useState<QuestData|null>(null);
  const [modal, setModal] = useState<"social" | "settings" | "report" | "quests" | "guide" | null>(
      null,
    ),
    [socialTab, setSocialTab] = useState<"people" | "friends">("people"),
    [social, setSocial] = useState<Social>(emptySocial),
    [selected, setSelected] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [draft, setDraft] = useState(""),
    [typing, setTyping] = useState(false),
    [chatVisible, setChatVisible] = useState(() => saved("pagoda-chat", !matchMedia('(pointer: coarse)').matches));
  const [sound, setSound] = useState(true),
    [volume, setVolume] = useState(() => saved("pagoda-volume", 0.6));
  const audio = useRef(new Ambience()),
    active = useRef<Room | null>(null),
    generation = useRef(0),
    chatInput = useRef<HTMLInputElement>(null),
    chatLog = useRef<HTMLDivElement>(null),
    socialRef = useRef(social);
  const me = players.find((p) => p.id === guest?.id);
  const guideShown=useRef(false);
  useEffect(()=>{
    if(page!=='game'||!me||guideShown.current)return;
    guideShown.current=true;
    if(!saved('pagoda-movement-guide-v1',false))setModal('guide');
  },[page,me]);
  function closeGuide(){persist('pagoda-movement-guide-v1',true);setModal(null);}
  const humanPlayers = players.filter(p=>!p.isBot);
  const interaction=room?interactionForPlayer(mapId,me):undefined;
  useEffect(()=>leaveOnPageHide(window,()=>active.current,()=>{
    generation.current++;
    active.current=null;
    audio.current.stop();
  }),[]);
  useEffect(() => {
    api("me")
      .then(({ guest: g }) => {
        if (g) {
          setGuest(g);
          if(!nameEdited.current)setName(g.display_name);
          setAvatar(g.avatar);
        }
      })
      .catch(() => {});
    return () => {
      generation.current++;
      active.current?.leave();
      audio.current.stop();
    };
  }, []);
  useEffect(() => {
    socialRef.current = social;
    setMessages((ms) =>
      ms.filter((m) => !social.blocks.some((b) => b.id === m.playerId)),
    );
  }, [social]);
  useEffect(() => {
    persist("pagoda-chat", chatVisible);
  }, [chatVisible]);
  useEffect(() => {
    persist("pagoda-volume", volume);
    audio.current.volume(sound ? volume : 0);
  }, [sound, volume]);
  useEffect(() => {
    if (sound && me?.action === "walk") audio.current.step();
  }, [me, sound]);
  useEffect(()=>{
    if(!room)return;
    return room.onMessage('bell',()=>{if(sound)audio.current.bell();});
  },[room,sound]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    chatLog.current?.scrollTo({ top: chatLog.current.scrollHeight });
  }, [messages]);
  const refreshSocial = useCallback(async () => {
    try {
      setSocial(await api<Social>("social"));
    } catch (e) {
      setNotice((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (page !== "game") return;
    refreshSocial();
    const t = setInterval(refreshSocial, 5000);
    return () => clearInterval(t);
  }, [page, refreshSocial]);
  const open = useCallback((which: typeof modal) => {
    document.exitPointerLock?.();
    setModal(which);
    setTyping(false);
    setError("");
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const input = /INPUT|TEXTAREA|SELECT/.test(
        (e.target as HTMLElement).tagName,
      );
      if (e.key === "Escape") {
        setError("");
        if (modal) {
          if(modal==='guide')persist('pagoda-movement-guide-v1',true);
          setModal(null);
          setSelected(null);
        } else if (typing) {
          chatInput.current?.blur();
          setTyping(false);
        } else if (page === "game" && !document.pointerLockElement)
          open("settings");
        else if (page === "entry") returnHome();
      }
      if (page !== "game" || modal || input) return;
      if (e.key === "Enter") {
        e.preventDefault();
        document.exitPointerLock?.();
        setChatVisible(true);
        setTimeout(() => chatInput.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [page, modal, typing, open]);
  function attach(r: Room) {
    active.current = r;
    setRoom(r);
    setConnection("");
    setPlayers([]);
    setMessages([]);
    setQuestData(null);
    r.onMessage("state", (s: { players: Player[]; capacity: number; gathering?:Gathering;mapId:MapId }) => {
      if (active.current !== r) return;
      setPlayers(s.players);
      setCapacity(s.capacity);
      if(maps[s.mapId]){currentMap.current=s.mapId;setMapId(s.mapId);}
    });
    r.onMessage('state_patch',(patch:StatePatch)=>{
      if(active.current!==r)return;
      setPlayers(previous=>applyPatch(previous,patch));
    });
    r.onMessage('travel',({mapId:destination}:{mapId:MapId})=>{if(active.current===r&&maps[destination])void travelTo(destination);});
    r.onMessage('quest_state',(data:QuestData)=>{if(active.current===r)setQuestData(data);});
    r.onMessage('quest_progress',(profile:QuestProfile)=>{if(active.current===r)setQuestData(previous=>previous?{...previous,profile}:previous);});
    r.onMessage('quest_reward',(reward:{merit:number;count:number;title:string})=>{
      if(active.current===r)setNotice(`Hoàn thành ${reward.count>1?`${reward.count} nhiệm vụ`:reward.title}. +${reward.merit} công đức!`);
    });
    r.send('resync');
    r.onMessage("notice", (s: string) => setNotice(s));
    r.onMessage("chat_message", (m: ChatMessage) => {
      if (
        active.current === r &&
        !socialRef.current.blocks.some((b) => b.id === m.playerId)
      )
        setMessages((ms) => [...ms.slice(-59), { ...m, at: Date.now() }]);
    });
    r.onError((_code, message) => setNotice(message || "Kết nối gặp lỗi."));
    r.reconnection.maxRetries = 5;
    r.reconnection.minUptime = 0;
    r.onDrop(() => {
      if (active.current !== r) return;
      setConnection("Mất kết nối. Đang kết nối lại…");
      document.exitPointerLock?.();
    });
    r.onReconnect(() => {
      if (active.current !== r) return;
      setConnection("");
      r.send('resync');
      setNotice("Đã kết nối lại với chùa.");
    });
    r.onLeave(() => {
      if (active.current !== r) return;
      active.current = null;
      setRoom(null);
      setPlayers([]);
      setPage("entry");
      setConnection("");
      setError("Kết nối đã kết thúc. Bạn có thể vào chùa lại.");
    });
  }
  async function join() {
    const version = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await api("guest", { displayName: name, avatar });
      if (version !== generation.current) return;
      setGuest(result.guest);
      const r = await enterRoom();
      if (version !== generation.current) {
        await r.leave();
        return;
      }
      attach(r);
      setPage("game");
      if (sound) audio.current.start(volume);
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }
  async function travelTo(destination:MapId){
    if(travelling.current||!active.current)return;
    travelling.current=true;
    const version=++generation.current,previous=currentMap.current,old=active.current;
    setConnection(`Đang đến ${maps[destination].label}…`);setModal(null);setSelected(null);
    active.current=null;setRoom(null);setPlayers([]);setMessages([]);
    try{
      await old.leave();
      if(version!==generation.current)return;
      try{
        const next=await enterRoom(undefined,destination);
        if(version!==generation.current){await next.leave();return;}
        attach(next);setNotice(`Đã đến ${maps[destination].label}.`);
      }catch{
        const fallback=await enterRoom(undefined,previous);
        if(version!==generation.current){await fallback.leave();return;}
        attach(fallback);setNotice('Chưa thể chuyển khu. Bạn đã trở lại khu trước.');
      }
    }catch(e){if(version===generation.current){setConnection('');setPage('entry');setError((e as Error).message);}}
    finally{travelling.current=false;}
  }
  function returnHome() {
    generation.current++;
    setBusy(false);
    setPending(false);
    setPage("home");
  }
  async function leave() {
    generation.current++;
    const r = active.current;
    active.current = null;
    setRoom(null);
    setPlayers([]);
    setMessages([]);
    setModal(null);
    setSelected(null);
    setPage("home");
    setConnection("");
    setBusy(false);
    setPending(false);
    document.exitPointerLock?.();
    await r?.leave();
  }
  async function follow(target: string) {
    const version = ++generation.current;
    setPending(true);
    setError("");
    const previous = active.current?.roomId;
    try {
      const { roomId } = await api("friend-room", { target });
      if (version !== generation.current) return;
      if (roomId === previous) {
        setNotice("Bạn đang ở cùng chùa với người bạn này.");
        setModal(null);
        return;
      }
      const old = active.current;
      active.current = null;
      setRoom(null);
      await old?.leave();
      if (version !== generation.current) return;
      try {
        const next = await enterRoom(roomId);
        if (version !== generation.current) {
          await next.leave();
          return;
        }
        attach(next);
      } catch (e) {
        if (version !== generation.current) return;
        const fallback = await enterRoom();
        if (version !== generation.current) {
          await fallback.leave();
          return;
        }
        attach(fallback);
        throw Error(
          "Phòng của bạn đã đầy hoặc đóng. Đã đưa bạn vào một chùa còn chỗ.",
        );
      }
      setModal(null);
    } catch (e) {
      if (version !== generation.current) return;
      setError((e as Error).message);
      if (!active.current) {
        setPage("entry");
        setModal(null);
      }
    } finally {
      if (version === generation.current) setPending(false);
    }
  }
  async function socialAction(
    action: string,
    target?: string,
    requestId?: string,
  ) {
    setPending(true);
    setError("");
    try {
      await api("social", { action, target, requestId, reason });
      await refreshSocial();
      if (action === "report") {
        setModal("social");
        setReason("");
        setNotice(
          "Đã ghi nhận báo cáo. Cảm ơn bạn đã giữ gìn không gian chung.",
        );
      } else if (action === "request") setNotice("Đã gửi lời mời kết bạn.");
      else if (action === "block")
        setNotice("Đã chặn người chơi và ẩn tin nhắn của họ.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  function gesture(action: Action) {
    room?.send("action", action);
  }
  function toggleSound() {
    const next = !sound;
    setSound(next);
    if (next) audio.current.start(volume);
  }
  function select(id: string) {
    if(players.some(p=>p.id===id&&p.isBot)){setNotice('Đây là khách viếng chùa tự động.');return;}
    if (id === guest?.id) return;
    setSelected(id);
    setSocialTab("people");
    open("social");
  }
  const visibleMessages = useMemo(()=>messages.filter((m) => !social.blocks.some((b) => b.id === m.playerId)),[messages,social.blocks]);
  return (
    <main ref={appElement} className={`app ${page === "game" ? "playing" : ""}`}>
      <div className="world">
        <World
          mapId={mapId}
          room={room}
          players={players}
          me={guest?.id}
          messages={visibleMessages}
          enabled={page === "game" && !modal && !typing && !connection}
          onSelect={select}
        />
      </div>
      {page !== "game" && <div className="scene-wash" />}
      <header className="topbar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            if (page !== "game") returnHome();
          }}
          aria-label="Một Ngày Đi Chùa"
        >
          <Flower2 size={29} strokeWidth={1.25} />
          <span>
            MỘT NGÀY
            <br />
            <b>ĐI CHÙA</b>
          </span>
        </a>
        {page === "game" && <ScheduleNotice />}
        <div className="top-actions">
          {page==='game'&&<button className="quest-open" onClick={()=>open('quests')} aria-label="Mở nhiệm vụ và công đức" title="Nhiệm vụ và công đức"><ScrollText size={19}/><span>Nhiệm vụ <b>{(questData?.profile.merit??0).toLocaleString('vi-VN')}</b></span></button>}
          {page === "game" ? (
            <span className="room-badge">
              <span className="status-dot" />
              <span className="room-name">{maps[mapId].label}</span> <i /> <span>{humanPlayers.length}/{capacity}{players.length>humanPlayers.length?` · ${players.length-humanPlayers.length} khách viếng`:''}</span>
            </span>
          ) : (
            <span className="eyebrow desktop">
              CHẬM LẠI MỘT CHÚT, BÌNH YÊN THÊM MỘT CHÚT.
            </span>
          )}
          <button
            className="icon-button sound-button"
            onClick={toggleSound}
            aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </header>
      {page === "home" && (
        <>
          <section className="home-content">
            <div className="eyebrow intro-label">
              <span /> MỘT KHÔNG GIAN ĐỂ TRỞ VỀ
            </div>
            <h1>
              Gác lại bộn bề.
              <br />
              Ghé chùa <em>một chút.</em>
            </h1>
            <p>
              Dạo bước dưới bóng cây, lắng nghe tiếng chuông.
              <br className="desktop" /> Và gặp một người bạn, giữa một ngày
              bình yên.
            </p>
            <button
              className="primary enter"
              onClick={() => {
                setError("");
                setPage("entry");
                if (sound) audio.current.start(volume);
              }}
            >
              Vào chùa <ArrowRight size={19} />
            </button>
          </section>
          <div className="scene-caption">
            <span className="caption-line" />
            <span>
              CHÙA AN NHIÊN<small>Một góc nhỏ, một khoảng thảnh thơi.</small>
            </span>
          </div>
          <footer className="home-footer">
            <div>
              <Leaf size={17} /> Đi dạo thong dong
            </div>
            <div>
              <Users size={17} /> Gặp gỡ nhẹ nhàng
            </div>
            <div>
              <Wind size={17} /> Không vội, không đua
            </div>
            <span className="footer-index">
              MỘT NGÀY ĐI CHÙA <span> / </span> 01
            </span>
          </footer>
        </>
      )}
      {page === "entry" && (
        <section className="entry-card">
          <button className="text-button" onClick={returnHome}>
            <ArrowLeft size={16} /> Trở lại
          </button>
          <span className="eyebrow">CHÀO BẠN, NGƯỜI GHÉ CHÙA</span>
          <h1>Mình gọi bạn là gì?</h1>
          <p>Một cái tên, một bộ đồ lam. Vậy là đủ cho hôm nay.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              join();
            }}
          >
            <label htmlFor="display-name">Tên của bạn</label>
            <input
              id="display-name"
              value={name}
              minLength={2}
              maxLength={20}
              onChange={(e) => {nameEdited.current=true;setName(e.target.value);}}
              required
              placeholder="Nhập tên bạn muốn được gọi"
              autoComplete="nickname"
              disabled={busy}
            />
            <div className="field-note">
              Tên được điền sẵn, bạn có thể sửa · 2–20 ký tự.
            </div>
            <fieldset disabled={busy}>
              <legend>Chọn nhân vật</legend>
              <div className="avatar-options">
                {(["male", "female"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`avatar-choice ${avatar === a ? "chosen" : ""}`}
                    onClick={() => setAvatar(a)}
                    aria-pressed={avatar === a}
                  >
                    <div className="avatar-preview">
                      <Canvas
                        dpr={1}
                        camera={{ position: [0, 1.1, 3.15], fov: 36 }}
                      >
                        <ambientLight intensity={2} />
                        <directionalLight position={[2, 3, 4]} intensity={2} />
                        <Suspense fallback={null}>
                          <group
                            position={[0, -0.9, 0]}
                            rotation={[0, -0.15, 0]}
                          >
                            <Model avatar={a} />
                          </group>
                        </Suspense>
                      </Canvas>
                    </div>
                    <span className="avatar-caption">
                      <strong>{a === "male" ? "Nam" : "Nữ"}</strong>
                      <span className="avatar-selection" aria-hidden="true">
                        {avatar === a ? "Đang chọn" : "Chọn"}
                        <span className="avatar-check">{avatar === a && <Check size={12} strokeWidth={3} />}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "Đang mở cổng chùa…" : "Bắt đầu"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="privacy-note">
            Danh tính khách được ghi nhớ trên trình duyệt này.
            <br />
            Hãy tôn trọng không gian chùa và những người bạn gặp.
          </p>
          <p className="mobile-note">
            Dùng cần bên trái để di chuyển, kéo bên phải để xoay góc nhìn.
          </p>
        </section>
      )}
      {page === "game" && (
        <>
          {chatVisible ? (
            <section className="chat-panel" aria-label="Chat trong chùa">
              <div className="chat-header">
                <span>
                  <MessageCircle size={15} /> Chuyện trong chùa
                </span>
                <button
                  className="text-button"
                  onClick={() => setChatVisible(false)}
                >
                  Ẩn
                </button>
              </div>
              <div
                ref={chatLog}
                className="chat-messages"
                aria-live="polite"
                role="log"
              >
                {visibleMessages.length === 0 ? (
                  <p className="chat-empty">
                    Một lời chào cũng làm ngày dịu hơn.
                    <br />
                    Chạm ô bên dưới để trò chuyện cùng mọi người.
                  </p>
                ) : (
                  visibleMessages.map((m) => (
                    <p key={m.id}>
                      <button onClick={() => select(m.playerId)}>
                        {m.name}
                      </button>
                      <span>{m.text}</span>
                    </p>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) {
                    room?.send("chat", draft);
                    setDraft("");
                  }
                  chatInput.current?.blur();
                  setTyping(false);
                }}
              >
                <input
                  ref={chatInput}
                  aria-label="Tin nhắn"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={120}
                  placeholder="Gửi một lời chào…"
                  onFocus={() => {
                    document.exitPointerLock?.();
                    setTyping(true);
                  }}
                  onBlur={() => setTyping(false)}
                  disabled={!!connection}
                />
                <button
                  aria-label="Gửi tin nhắn"
                  disabled={!draft.trim() || !!connection}
                >
                  <Send size={17} />
                </button>
              </form>
            </section>
          ) : (
            <button
              className="chat-show pill"
              onClick={() => setChatVisible(true)}
            >
              <MessageCircle size={17} /> Mở chat
            </button>
          )}
          {interaction && (
            <button
              className="interaction-prompt"
              onClick={() => room?.send('action',interaction.id)}
            >
              <kbd>E</kbd>
              <span className="interaction-label">{interaction.label}</span>
              <ArrowRight className="interaction-icon" aria-hidden="true"/>
            </button>
          )}
          <nav className="game-toolbar" aria-label="Tương tác">
            <button onClick={() => gesture("wave")} title="Vẫy tay (1)">
              <Hand />
              <span>Vẫy tay</span>
              <kbd>1</kbd>
            </button>
            <button onClick={() => gesture("bow")} title="Cúi chào (2)">
              <Heart />
              <span>Cúi chào</span>
              <kbd>2</kbd>
            </button>
            <button onClick={() => me?.seat?room?.send('action','stand'):gesture("sit")} title="Quỳ / đứng (3)">
              <Armchair />
              <span>{me?.seat || me?.action === "sit" ? "Đứng lên" : "Quỳ xuống"}</span>
              <kbd>3</kbd>
            </button>
            {mapId==='hall'&&<button onClick={()=>me?.action==='prostrate'?room?.send('action','stand'):gesture('prostrate')} title="Lạy / dừng lạy (4)" aria-pressed={me?.action==='prostrate'}>
              <Flower2/>
              <span>{me?.action==='prostrate'?'Dừng lạy':'Lạy'}</span>
              <kbd>4</kbd>
            </button>}
            <i />
            <button onClick={() => open("settings")}>
              <Settings />
              <span>Cài đặt</span>
            </button>
          </nav>
          {connection && (
            <div className="connection" role="status">
              {connection}
              <button onClick={leave}>Về trang chủ</button>
            </div>
          )}
        </>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {modal==='guide'&&<MovementGuide onClose={closeGuide}/>}
      {modal === "settings" && (
        <Dialog title="Một chút tùy chỉnh" onClose={() => setModal(null)}>
          <div className="setting-row"><span>Di chuyển và tương tác</span><button className="pill" onClick={()=>setModal('guide')}>Xem hướng dẫn</button></div>
          <div className="setting-row">
            <span>Âm thanh không gian</span>
            <button className="pill" onClick={toggleSound}>
              {sound ? "Đang bật" : "Đang tắt"}
            </button>
          </div>
          <label className="volume-label" htmlFor="volume">
            Âm lượng <span>{Math.round(volume * 100)}%</span>
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <div className="setting-row">
            <span>Chat trong chùa</span>
            <button className="pill" onClick={() => setChatVisible((v) => !v)}>
              {chatVisible ? "Hiển thị" : "Đang ẩn"}
            </button>
          </div>
          <div className="controls-guide">
            <p>
              <kbd>W A S D</kbd> Di chuyển · Chuột xoay camera
            </p>
            <p>
              <kbd>E</kbd> Tương tác · <kbd>{mapId==='hall'?'1 2 3 4':'1 2 3'}</kbd> Cử chỉ
            </p>
            <p>
              <kbd>Enter</kbd> Chat
            </p>
          </div>
          <button className="leave-button" onClick={leave}>
            <LogOut size={18} /> Rời chùa
          </button>
        </Dialog>
      )}
      {modal==='quests'&&<QuestPanel data={questData} onClose={()=>setModal(null)} onEquip={titleId=>room?.send('quests',{op:'equip',titleId})} onRetry={()=>room?.send('quests',{op:'resync'})}/>}
      {modal === "social" && (
        <Dialog
          title="Những người bạn gặp"
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          wide
        >
          <div className="tabs">
            <button
              className={socialTab === "people" ? "active" : ""}
              onClick={() => setSocialTab("people")}
            >
              Trong chùa <span>{humanPlayers.length}</span>
            </button>
            <button
              className={socialTab === "friends" ? "active" : ""}
              onClick={() => setSocialTab("friends")}
            >
              Bạn bè <span>{social.friends.length}</span>
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="social-scroll">
            {social.requests.length > 0 && (
              <section className="requests">
                <h3>Lời mời kết bạn</h3>
                {social.requests.map((r) => (
                  <div className="person-row" key={r.id}>
                    <span>
                      {r.display_name}
                      <small>Muốn kết bạn với bạn</small>
                    </span>
                    <div className="row-actions">
                      <button
                        disabled={pending}
                        className="pill"
                        onClick={() => socialAction("accept", undefined, r.id)}
                      >
                        Chấp nhận
                      </button>
                      <button
                        disabled={pending}
                        className="text-button"
                        onClick={() => socialAction("decline", undefined, r.id)}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {socialTab === "people" ? (
              humanPlayers.map((p) => (
                <div
                  className={`person-row ${selected === p.id ? "selected" : ""}`}
                  key={p.id}
                >
                  <div className="person-avatar">
                    <Leaf size={20} />
                  </div>
                  <span>
                    {p.displayName}
                    <small>
                      {p.id === guest?.id
                        ? "Bạn · đang ở đây"
                        : social.blocks.some((b) => b.id === p.id)
                          ? "Đã chặn"
                          : "Đang dạo chùa"}
                    </small>
                  </span>
                  {p.id !== guest?.id && (
                    <div className="row-actions">
                      {social.blocks.some((b) => b.id === p.id) ? (
                        <button
                          className="pill"
                          disabled={pending}
                          onClick={() => socialAction("unblock", p.id)}
                        >
                          Bỏ chặn
                        </button>
                      ) : (
                        <>
                          <button
                            className="icon-button"
                            disabled={
                              pending ||
                              social.friends.some((f) => f.id === p.id) ||
                              social.sent.some((s) => s.receiver_id === p.id)
                            }
                            aria-label={`Kết bạn với ${p.displayName}`}
                            title={
                              social.friends.some((f) => f.id === p.id)
                                ? "Đã là bạn"
                                : social.sent.some(
                                      (s) => s.receiver_id === p.id,
                                    )
                                  ? "Đã gửi lời mời"
                                  : "Kết bạn"
                            }
                            onClick={() => socialAction("request", p.id)}
                          >
                            <UserPlus size={18} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={pending}
                            title="Chặn"
                            aria-label={`Chặn ${p.displayName}`}
                            onClick={() => socialAction("block", p.id)}
                          >
                            <Ban size={17} />
                          </button>
                        </>
                      )}
                      <button
                        className="icon-button"
                        title="Báo cáo"
                        aria-label={`Báo cáo ${p.displayName}`}
                        onClick={() => {
                          setSelected(p.id);
                          setReason("");
                          setModal("report");
                        }}
                      >
                        <Flag size={17} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <>
                {social.friends.length === 0 && (
                  <div className="empty-state">
                    <Users size={32} />
                    <h3>Một người lạ, rồi một người bạn.</h3>
                    <p>Gửi lời mời ở tab Trong chùa để giữ liên lạc.</p>
                  </div>
                )}
                {social.friends.map((f) => (
                  <div className="person-row" key={f.id}>
                    <div className="person-avatar">
                      <Leaf size={20} />
                    </div>
                    <span>
                      {f.display_name}
                      <small>{f.roomId ? "Đang ở chùa" : "Chưa online"}</small>
                    </span>
                    <button
                      className="pill"
                      disabled={!f.roomId || pending}
                      onClick={() => follow(f.id)}
                    >
                      Tham gia cùng <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
                {social.blocks.length > 0 && (
                  <section>
                    <h3 className="subheading">Người đã chặn</h3>
                    {social.blocks.map((b) => (
                      <div className="person-row" key={b.id}>
                        <span>{b.display_name}</span>
                        <button
                          className="text-button"
                          disabled={pending}
                          onClick={() => socialAction("unblock", b.id)}
                        >
                          Bỏ chặn
                        </button>
                      </div>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
          <p className="privacy-note">
            Một lời chào tử tế. Một khoảng riêng được tôn trọng.
          </p>
        </Dialog>
      )}
      {modal === "report" && (
        <Dialog title="Báo cáo người chơi" onClose={() => setModal("social")}>
          <p>Báo cáo sẽ được lưu để người quản trị xem xét.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              socialAction("report", selected || undefined);
            }}
          >
            <label htmlFor="reason">Lý do báo cáo</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={240}
              required
              placeholder="Hãy mô tả ngắn gọn điều đã xảy ra…"
            />
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary full" disabled={pending}>
              {pending ? "Đang gửi…" : "Gửi báo cáo"}
              <Flag size={17} />
            </button>
          </form>
        </Dialog>
      )}
    </main>
  );
}
