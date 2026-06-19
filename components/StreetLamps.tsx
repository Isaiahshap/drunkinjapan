'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { groundSurfaceY } from '@/lib/curvedWorld';
import { CULL, nearPlayer } from '@/lib/sceneCulling';
import { createPaintedMaterial } from '@/lib/paintedMaterials';
import { palette } from '@/lib/palette';
import OutlinedMesh from './OutlinedMesh';
import { LampGlowOrb } from './NeonGlowOrb';

const LAMP_WARM = '#B8A878';
const LAMP_CORE = '#C8B898';

const MAIN_LAMP_Z = [
  8, 1, -6, -13, -20, -27, -34, -41, -48, -55, -62, -69, -76, -83,
  -90, -97, -104, -111, -118, -125,
] as const;

const SIDEWALK_X = { left: -3.12, right: 3.12 } as const;

function StreetLampUnit({
  x,
  z,
  playerRef,
}: {
  x: number;
  z: number;
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.034, 0.044, 2.72, 6), []);
  const headGeo = useMemo(() => new THREE.BoxGeometry(0.2, 0.09, 0.16), []);
  const poleMat = useMemo(() => createPaintedMaterial(palette.ink), []);
  const headMat = useMemo(() => createPaintedMaterial('#2A3340'), []);

  const bulbCoreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(LAMP_CORE),
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  );

  const bulbGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(LAMP_WARM),
        transparent: true,
        opacity: 0.24,
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const y = groundSurfaceY(x, z, playerRef.current, 0.02, 'sidewalk');
    groupRef.current.position.set(x, y, z);
    groupRef.current.visible = nearPlayer(x, z, playerRef.current, CULL.lamps);
  });

  return (
    <group ref={groupRef}>
      <OutlinedMesh
        geometry={poleGeo}
        material={poleMat}
        position={[0, 1.36, 0]}
        outlineThickness={0.01}
        outlineOpacity={0.85}
      />
      <mesh geometry={headGeo} material={headMat} position={[0, 2.76, 0.05]} />

      <LampGlowOrb color={LAMP_WARM} />

      <mesh material={bulbGlowMat} position={[0, 2.73, 0.1]} renderOrder={12}>
        <sphereGeometry args={[0.055, 10, 10]} />
      </mesh>
      <mesh material={bulbCoreMat} position={[0, 2.73, 0.11]} renderOrder={13}>
        <sphereGeometry args={[0.022, 8, 8]} />
      </mesh>
    </group>
  );
}

interface StreetLampsProps {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export default function StreetLamps({ playerRef }: StreetLampsProps) {
  return (
    <group>
      {MAIN_LAMP_Z.map((z) => (
        <StreetLampUnit
          key={`l-${z}`}
          x={SIDEWALK_X.left}
          z={z}
          playerRef={playerRef}
        />
      ))}
      {MAIN_LAMP_Z.map((z) => (
        <StreetLampUnit
          key={`r-${z}`}
          x={SIDEWALK_X.right}
          z={z}
          playerRef={playerRef}
        />
      ))}
    </group>
  );
}
