import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {TouchControls,useTouchDevice,emptyTouch} from '../controls/TouchControls';
import { Canvas, useThree } from "@react-three/fiber";
import { useProgress, Environment } from "@react-three/drei";
import type { Room } from "@colyseus/sdk";
import { MapScene } from "./MapScene";
import {Crowd} from '../characters/Crowd';
import type {MapId} from '../world';
import { Character } from "../characters/Character";
import { Controller } from "../controls/Controller";
import type { Player, ChatMessage } from "../types";
import {activeChatBubbles} from '../multiplayer/chatBubbles';
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-error">
        Không thể mở cảnh 3D. Hãy bật tăng tốc đồ họa trong trình duyệt rồi tải
        lại trang.<button onClick={() => location.reload()}>Tải lại</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function ContextGuard() {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      alert("Kết nối đồ họa bị gián đoạn. Vui lòng tải lại trang.");
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  return null;
}
function HomeCamera({ active }: { active: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (active) {
      camera.position.set(27, 23, 32);
      camera.lookAt(0, 0, 0);
    }
  }, [active, camera]);
  return null;
}
function LoadingOverlay() {
  const { active } = useProgress();
  return active ? <div className="scene-loading" role="status">Đang mở cổng chùa…</div> : null;
}
export function World({
  mapId,
  room,
  players,
  me,
  messages,
  enabled,
  onSelect,
}: {
  mapId:MapId;
  room: Room | null;
  players: Player[];
  me?: string;
  messages: ChatMessage[];
  enabled: boolean;
  onSelect: (id: string) => void;
}) {
  const touch=useTouchDevice(),touchInput=useRef(emptyTouch());
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{if(!messages.length)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[messages]);
  const bubbles=activeChatBubbles(messages,now);
  const self=players.find(p=>p.id===me);
  const ordered=[...players].sort((a,b)=>Math.hypot(a.x-(self?.x??0),a.z-(self?.z??0))-Math.hypot(b.x-(self?.x??0),b.z-(self?.z??0)));
  const detailed=ordered.filter((p,i)=>p.id===me||(i<(touch?12:24)&&Math.hypot(p.x-(self?.x??0),p.z-(self?.z??0))<18));
  const detailIds=new Set(detailed.map(p=>p.id));
  const distant=players.filter(p=>!detailIds.has(p.id));
  return (
    <Boundary>
      <Canvas
        shadows
        dpr={touch?1:[1, 1.5]}
        camera={{ position: [27, 23, 32], fov: 42, near: 0.1, far: 180 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#c7d1d0"]} />
        <fog attach="fog" args={["#c7d1d0", 42, 105]} />
        <ambientLight intensity={0.25} />
        <hemisphereLight args={["#e6f0ff", "#595c42", 0.45]} />
        <directionalLight
          position={[-15, 25, 10]}
          intensity={2.1}
          color="#fff2df"
          castShadow
          shadow-mapSize={touch?[1024,1024]:[2048, 2048]}
          shadow-normalBias={0.03}
          shadow-camera-left={-26}
          shadow-camera-right={26}
          shadow-camera-top={26}
          shadow-camera-bottom={-26}
          shadow-bias={-0.001}
        />
        <Suspense fallback={null}>
          <Environment files="/textures/morning-sky.hdr" environmentIntensity={0.55}/>
          <MapScene key={mapId} mapId={mapId} room={room}/>
          {room&&distant.length>0&&<Crowd players={distant} onSelect={onSelect} barefoot={mapId==='hall'} bubbles={bubbles}/>}
          {room &&
            detailed.map((p) => (
              <Character
                key={p.id}
                player={p}
                barefoot={mapId==='hall'}
                self={p.id === me}
                onSelect={() => onSelect(p.id)}
                bubble={bubbles.get(p.id)}
              />
            ))}
          {room && (
            <Controller
              key={room.roomId}
              mapId={mapId}
              room={room}
              player={players.find((p) => p.id === me)}
              enabled={enabled}
              touchInput={touchInput}
            />
          )}
        </Suspense>
        <ContextGuard />
        <HomeCamera active={!room} />
      </Canvas>
      <LoadingOverlay />
      {touch&&room&&<TouchControls input={touchInput} enabled={enabled}/>}
    </Boundary>
  );
}
