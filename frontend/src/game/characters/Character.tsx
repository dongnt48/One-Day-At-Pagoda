import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AnimationMixer, Group, LoopOnce, LoopRepeat, MathUtils, Vector3, type Object3D } from "three";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Action, Player } from "../types";
import {kitchenAnimations} from './kitchenAnimations';
import {createKitchenPose} from './kitchenPose';
import {setBarefoot} from './footwear';
import {createPrayerPose,prayerAnimation} from './prayerPose';
import {StrawBroom,WateringCan} from './HandTools';
import {createPoseBaseline} from './poseBaseline';
import {hallSurfaceHeight} from '../scene/hallSurface';
export function Model({
  avatar,
  action = "idle",
  tray = false,
  barefoot = false,
  animationFps = 60,
  castShadow = true,
}: {
  avatar: "male" | "female";
  action?: Action;
  tray?: boolean;
  barefoot?: boolean;
  animationFps?: number;
  castShadow?: boolean;
}) {
  const gltf = useGLTF(`/models/${avatar}_lam.glb`);
  const model = useMemo(() => {
    const instance = clone(gltf.scene);
    instance.traverse((o) => {
      o.castShadow = castShadow;
    });
    return instance;
  }, [gltf,castShadow]);
  useLayoutEffect(()=>{setBarefoot(model,barefoot);},[model,barefoot]);
  const clips=useMemo(()=>[...gltf.animations,...kitchenAnimations(gltf.animations),...prayerAnimation(gltf.animations)],[gltf.animations]);
  const mixer=useMemo(()=>new AnimationMixer(model),[model]);
  const actions=useMemo(()=>Object.fromEntries(clips.map(clip=>[clip.name,mixer.clipAction(clip)])),[clips,mixer]);
  const baseline=useMemo(()=>createPoseBaseline(model),[model]);
  useEffect(()=>()=>{mixer.stopAllAction();mixer.uncacheRoot(model);},[mixer,model]);
  // Finish the skeleton and pose before held tools read the wrists at priority 0.
  const animationStep=useRef({pending:0,delta:0});
  useFrame((_,dt)=>{
    const step=animationStep.current;step.pending+=dt;step.delta=0;
    if(animationFps<60&&step.pending<1/animationFps)return;
    step.delta=step.pending;step.pending=0;
    baseline.restore();mixer.update(step.delta);baseline.capture();
  },-.5);
  const kitchenPose=useMemo(()=>createKitchenPose(model),[model]);
  const prayerPose=useMemo(()=>createPrayerPose(model,gltf.animations),[model,gltf.animations]);
  const kitchenTime=useRef(0);
  useEffect(()=>{kitchenTime.current=0;},[action]);
  useFrame(()=>{const dt=animationStep.current.delta;if(!dt)return;kitchenTime.current+=dt;kitchenPose(action,kitchenTime.current);prayerPose(action,kitchenTime.current);},-.4);
  const clipName=action==='listen'?'meditate':tray&&action==='idle'?'carry':tray&&action==='walk'?'carry_walk':action;
  useEffect(() => {
    const next = actions[clipName];
    if(next){
      const once=action==='incense'||action==='bell'||action==='pray';
      next.setLoop(once?LoopOnce:LoopRepeat,once?1:Infinity);
      next.clampWhenFinished=once;
    }
    next?.reset().fadeIn(0.2).play();
    return () => {
      next?.fadeOut(0.2);
    };
  }, [action, clipName, actions]);
  return <group><primitive object={model} /><HeldProp model={model} action={action}/>{action==='wash'&&<WashingProps model={model}/>} {tray&&<MealTray model={model} eating={action==='eat'}/>}</group>;
}
function WashingProps({model}:{model:Object3D}){
 const plate=useRef<Group>(null),sponge=useRef<Group>(null),point=useMemo(()=>new Vector3(),[]);
 useFrame(()=>{
  model.updateWorldMatrix(true,true);
  for(const [name,ref] of [['LeftHand',plate],['RightHand',sponge]] as const){
   const hand=model.getObjectByName(name),prop=ref.current;
   if(!hand||!prop?.parent)continue;
   hand.getWorldPosition(point);prop.parent.worldToLocal(point);prop.position.copy(point);
  }
 });
 return <><group ref={plate}><mesh rotation={[.45,0,0]}><cylinderGeometry args={[.18,.16,.035,24]}/><meshStandardMaterial color="#e8e2d1" roughness={.35}/></mesh></group><group ref={sponge}><mesh><boxGeometry args={[.13,.055,.09]}/><meshStandardMaterial color="#b7af66" roughness={.9}/></mesh></group></>;
}
function MealTray({model,eating}:{model:Object3D;eating:boolean}){
  const tray=useRef<Group>(null),spoon=useRef<Group>(null);
  const points=useMemo(()=>[new Vector3(),new Vector3()],[]);
  useFrame(()=>{
    model.updateWorldMatrix(true,true);
    const left=model.getObjectByName('LeftHand'),right=model.getObjectByName('RightHand');
    if(!left||!right||!tray.current?.parent)return;
    left.getWorldPosition(points[0]);right.getWorldPosition(points[1]);
    tray.current.parent.worldToLocal(points[0]);tray.current.parent.worldToLocal(points[1]);
    tray.current.position.copy(points[0]).lerp(points[1],.5);tray.current.position.y-=.035;
    if(eating)tray.current.position.set(0,.82,.8);
    if(spoon.current){
      spoon.current.position.copy(points[1]);
      // Spoon tilts back toward the mouth as the hand rises from the tray.
      spoon.current.rotation.x=-2.2;
    }
  });
  return <><group ref={tray}>
    <mesh castShadow><boxGeometry args={[.72,.035,.4]}/><meshStandardMaterial color="#a4aaa4" metalness={.35} roughness={.6}/></mesh>
    {[-.20,.08,.25].map((x,i)=><mesh key={x} position={[x,.045,0]}><sphereGeometry args={[i===0?.10:.07,12,8]}/><meshStandardMaterial color={['#eee7d4','#70934e','#d39b54'][i]}/></mesh>)}
  </group>{eating&&<group ref={spoon}><mesh position={[0,0,.07]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.012,.012,.18,8]}/><meshStandardMaterial color="#aeb7b4"/></mesh><mesh position={[0,0,.17]} scale={[1,.4,1.4]}><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color="#aeb7b4"/></mesh></group>}</>;
}
function HeldProp({model,action}:{model:Object3D;action:Action}) {
  const ref=useRef<Group>(null),shaft=useRef<Group>(null),broomHead=useRef<Group>(null);
  const hand=useMemo(()=>model.getObjectByName('RightHand'),[model]);
  const point=useMemo(()=>new Vector3(),[]),up=useMemo(()=>new Vector3(0,1,0),[]),direction=useMemo(()=>new Vector3(),[]);
  useFrame(({clock})=>{
    const group=ref.current;if(!group||!hand||!group.parent)return;
    // Read the animated wrist after AnimationMixer; origin is the palm centre.
    model.updateWorldMatrix(true,true);hand.getWorldPosition(point);
    group.parent.worldToLocal(point);group.position.copy(point);
    if(action==='sweep'&&shaft.current){
      // Grip stays in the palm while the bristles follow the courtyard surface.
      direction.set(-.18,Math.max(.20,point.y-.06),-.18);
      const length=direction.length();group.quaternion.setFromUnitVectors(up,direction.normalize());
      shaft.current.scale.y=Math.max(.1,length-.26);
      if(broomHead.current)broomHead.current.position.y=-shaft.current.scale.y;
    }else if(action==='incense'){
      // Tilt away from the face while keeping the base anchored in the palm.
      group.rotation.set(.9,0,0);
    }else if(action==='water'){
      group.rotation.set(.28+Math.sin(clock.elapsedTime*3)*.08,0,0);
    }else group.quaternion.identity();
  });
  if(!hand||!['incense','sweep','water','cook','bell'].includes(action))return null;
  return <group ref={ref}>
    {action==='bell'&&<group rotation={[-.9,0,0]}><mesh position={[0,.12,0]}><cylinderGeometry args={[.026,.03,.42,10]}/><meshStandardMaterial color="#795838" roughness={.9}/></mesh><mesh position={[0,.36,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.10,.10,.24,12]}/><meshStandardMaterial color="#5d4030" roughness={.9}/></mesh></group>}
    {action==='cook'&&<group rotation={[-.65,0,0]}><mesh position={[0,-.16,0]}><cylinderGeometry args={[.022,.022,.42,8]}/><meshStandardMaterial color="#8d6845"/></mesh><mesh position={[0,-.39,0]} scale={[.09,.035,.13]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#aaa99b" metalness={.65} roughness={.35}/></mesh></group>}
    {action==='incense'&&<group>{[-.018,0,.018].map(x=><group key={x} position={[x,0,0]}><mesh position={[0,.105,0]}><cylinderGeometry args={[.006,.006,.31,6]}/><meshStandardMaterial color="#a77542"/></mesh><mesh position={[0,.260,0]}><sphereGeometry args={[.007,8,6]}/><meshBasicMaterial color="#e98b4a"/></mesh></group>)}</group>}
    {action==='sweep'&&<StrawBroom shaft={shaft} head={broomHead}/>}
    {action==='water'&&<WateringCan/>}
  </group>;
}
export function Character({
  player,
  barefoot=false,
  bubble,
  onSelect,
  self,
  showLabel=true,
  animationFps=60,
  castShadow=true,
}: {
  player: Player;
  barefoot?: boolean;
  bubble?: string;
  onSelect: () => void;
  self: boolean;
  showLabel?: boolean;
  animationFps?: number;
  castShadow?: boolean;
}) {
  const group = useRef<Group>(null);
  const initialPosition = useRef<[number, number, number]>([
    player.x,
    barefoot?hallSurfaceHeight(player.x,player.z):0,
    player.z,
  ]);
  // Move before the camera (-1) and HTML name projection (0).
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const alpha = 1 - Math.exp(-16 * dt);
    g.position.x = MathUtils.lerp(g.position.x, player.x, alpha);
    g.position.z = MathUtils.lerp(g.position.z, player.z, alpha);
    g.position.y = barefoot?hallSurfaceHeight(g.position.x,g.position.z):0;
    g.rotation.y +=
      Math.atan2(
        Math.sin(player.rotationY - g.rotation.y),
        Math.cos(player.rotationY - g.rotation.y),
      ) * alpha;
  },-2);
  return (
    <group
      name={`character-${player.id}`}
      ref={group}
      position={initialPosition.current}
      onClick={(e) => {
        e.stopPropagation();
        if(e.delta>5)return;
        if (!self) {
          document.exitPointerLock?.();
          onSelect();
        }
      }}
    >
      <Model avatar={player.avatar} action={player.action} tray={player.tray} barefoot={barefoot} animationFps={animationFps} castShadow={castShadow}/>
      {(showLabel||bubble)&&<Html
        position={[0, 1.95, 0]}
        center
        zIndexRange={[10, 0]}
      >
        <div className="overhead">
          {bubble && <div className="bubble">{bubble}</div>}
          <button
            className={`name-tag ${self ? "self" : ""}`}
            onClick={onSelect}
          >
            {player.displayName}
            {self ? " · bạn" : ""}
            {player.title&&<small className="fun-title">{player.title}</small>}
          </button>
        </div>
      </Html>}
    </group>
  );
}
useGLTF.preload("/models/male_lam.glb");
useGLTF.preload("/models/female_lam.glb");
