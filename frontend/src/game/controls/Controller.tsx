import { useEffect, useRef, type RefObject } from "react";
import {emptyTouch,type TouchInput} from './TouchControls';
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Raycaster, Vector3, type Object3D } from "three";
import type { Room } from "@colyseus/sdk";
import type { Player } from "../types";
import {type MapId} from "../world";
import {interactionForPlayer} from './interaction';
export function Controller({
  mapId,
  room,
  player,
  enabled,
  onNearby,
  touchInput,
}: {
  mapId:MapId;
  room: Room;
  player?: Player;
  enabled: boolean;
  onNearby?: (id: string | null) => void;
  touchInput: RefObject<TouchInput>;
}) {
  const { gl, camera, scene } = useThree();
  const keys = useRef(new Set<string>()),
    yaw = useRef(0),
    pitch = useRef(0.30),
    zoom = useRef(14),
    elapsed = useRef(0),
    target = useRef(new Vector3(0, 1.4, 15)),
    near = useRef<string | null>(null),
    ray = useMemoRay();
  useEffect(() => {
    let drag: {id:number;x:number;y:number}|null=null;
    const down = (e: KeyboardEvent) => {
      if (
        !enabled ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "KeyE",
          "Digit1",
          "Digit2",
          "Digit3",
          "Digit4",
        ].includes(e.code)
      )
        e.preventDefault();
      keys.current.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyE" && near.current) room.send("action", near.current);
      if(e.code==='Digit4'&&mapId==='hall')room.send('action','prostrate');
      if (/^Digit[123]$/.test(e.code))
        room.send(
          "action",
          ["wave", "bow", "sit"][Number(e.code.slice(-1)) - 1],
        );
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => {drag=null;keys.current.clear();touchInput.current=emptyTouch();};
    const move = (e: PointerEvent) => {
      if (enabled && drag && drag.id===e.pointerId && (e.buttons&1)) {
        yaw.current -= (e.clientX-drag.x) * 0.003;
        pitch.current = MathUtils.clamp(
          pitch.current + (e.clientY-drag.y) * 0.002,
          0.15,
          1.15,
        );
        drag.x=e.clientX;drag.y=e.clientY;
      } else if(e.pointerType==='mouse') {
        drag=null;
      }
    };
    const startDrag = (e: PointerEvent) => {
      if (enabled && e.pointerType==='mouse' && e.button===0) drag={id:e.pointerId,x:e.clientX,y:e.clientY};
    };
    const endDrag=()=>{drag=null;};
    const wheel = (e: WheelEvent) => {
      zoom.current = MathUtils.clamp(zoom.current + e.deltaY * 0.005, 3.5, 14);
    };
    const context = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("pointerlockchange", clear);
    window.addEventListener("pointermove", move);
    window.addEventListener('pointerup',endDrag);
    window.addEventListener('pointercancel',endDrag);
    gl.domElement.addEventListener("pointerdown", startDrag);
    document.addEventListener('visibilitychange',clear);
    gl.domElement.addEventListener("wheel", wheel);
    gl.domElement.addEventListener("contextmenu", context);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("pointerlockchange", clear);
      window.removeEventListener("pointermove", move);
      window.removeEventListener('pointerup',endDrag);
      window.removeEventListener('pointercancel',endDrag);
      gl.domElement.removeEventListener("pointerdown", startDrag);
      document.removeEventListener('visibilitychange',clear);
      gl.domElement.removeEventListener("wheel", wheel);
      gl.domElement.removeEventListener("contextmenu", context);
      clear();
      near.current=null;onNearby?.(null);
      room.send("move", { dx: 0, dz: 0, rotationY: player?.rotationY || 0 });
    };
  }, [enabled, room, gl, mapId]);
  // Finish camera movement before HTML overlays project this frame.
  useFrame((_, dt) => {
    if (!player) {
      if(near.current!==null){near.current=null;onNearby?.(null);}
      return;
    }
    const touch=touchInput.current;
    if(enabled){yaw.current-=touch.lookX*.004;pitch.current=MathUtils.clamp(pitch.current+touch.lookY*.003,.15,1.15);zoom.current=MathUtils.clamp(zoom.current+touch.zoom,3.5,14);}
    touch.lookX=0;touch.lookY=0;touch.zoom=0;
    const spot=interactionForPlayer(mapId,player)?.id??null;
    if (spot !== near.current) {
      near.current = spot;
      onNearby?.(spot);
    }
    elapsed.current += dt;
    if (elapsed.current > 0.08) {
      elapsed.current = 0;
      const k = keys.current;
      let x = enabled ? Number(k.has("KeyD")) - Number(k.has("KeyA"))+touch.x : 0,
        z = enabled ? Number(k.has("KeyS")) - Number(k.has("KeyW"))+touch.z : 0;
      const n = Math.max(1, Math.hypot(x, z));
      x /= n;
      z /= n;
      const dx = x * Math.cos(yaw.current) + z * Math.sin(yaw.current),
        dz = -x * Math.sin(yaw.current) + z * Math.cos(yaw.current);
      room.send("move", {
        dx,
        dz,
        rotationY: dx || dz ? Math.atan2(dx, dz) : player.rotationY,
      });
    }
    target.current.lerp(
      new Vector3(player.x, 1.3, player.z),
      1 - Math.exp(-15 * dt),
    );
    const offset = new Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current),
    ).multiplyScalar(zoom.current);
    ray.current.set(target.current, offset.clone().normalize());
    ray.current.far = zoom.current;
    // Decorative instanced leaves/tiles must never participate in camera rays.
    const colliders: Object3D[] = [];
    scene.traverse((object) => {
      if (object.userData.cameraCollider) colliders.push(object);
    });
    const hit = ray.current.intersectObjects(colliders, false)[0];
    if (hit) offset.setLength(Math.max(0.8, hit.distance - 0.3));
    camera.position.copy(target.current).add(offset);
    camera.lookAt(target.current);
  },-1);
  return null;
}
function useMemoRay() {
  return useRef(new Raycaster());
}
