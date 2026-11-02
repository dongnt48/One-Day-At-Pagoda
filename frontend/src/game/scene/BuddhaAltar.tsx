import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

/** Static, four-material altar shared by the courtyard facade and main hall. */
export function BuddhaAltar({ position, scale = 1 }: {
  position: [number, number, number]; scale?: number;
}) {
  const { scene } = useGLTF('/models/buddha-altar.glb');
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(object => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);
  return <primitive object={model} position={position} scale={scale} dispose={null} />;
}
