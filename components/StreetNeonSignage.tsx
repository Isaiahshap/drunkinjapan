'use client';

import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FacingNeonPanel, neonPalette } from './FacadeSignage';
import { ROAD_SPANS, SIDEWALK_SIGNS, type RoadSpanSpec, type SidewalkSignSpec } from '@/lib/streetNeonLayout';
import { groundSurfaceY } from '@/lib/curvedWorld';
import { nearPlayer } from '@/lib/sceneCulling';

const SPAN_W = 8.8;
const SPAN_CULL = 52;
const SIDEWALK_CULL = 42;

function neonMat(color: string, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity,
  });
}

function RoadSpanUnit({
  spec,
  playerRef,
}: {
  spec: RoadSpanSpec;
  playerRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cableMat = useMemo(() => neonMat(neonPalette.deepInk, 0.95), []);
  const cableGeo = useMemo(() => new THREE.BoxGeometry(SPAN_W, 0.03, 0.03), []);
  const dropGeo = useMemo(() => new THREE.BoxGeometry(0.03, 0.48, 0.03), []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const pz = playerRef.current;
    g.visible = nearPlayer(0, spec.z, pz, SPAN_CULL);
    if (!g.visible) return;
    g.position.y = groundSurfaceY(0, spec.z, pz) + spec.height;
  });

  return (
    <group ref={groupRef} position={[0, 0, spec.z]}>
      <mesh geometry={cableGeo} material={cableMat} position={[0, 0.52, 0.04]} />
      <mesh geometry={cableGeo} material={cableMat} position={[0, -0.32, 0.04]} />
      <mesh geometry={dropGeo} material={cableMat} position={[-SPAN_W / 2 + 0.18, 0.12, 0.04]} />
      <mesh geometry={dropGeo} material={cableMat} position={[SPAN_W / 2 - 0.18, 0.12, 0.04]} />

      {spec.panels.map((panel, i) => (
        <group key={i} position={[panel.x ?? 0, panel.y ?? 0, 0.02]}>
          <FacingNeonPanel
            text={panel.text}
            color={panel.color}
            width={panel.width}
            height={panel.height}
            fontSize={panel.fontSize}
            flicker={panel.flicker}
            flickerSeed={panel.flickerSeed ?? i + spec.z}
          />
        </group>
      ))}
    </group>
  );
}

function SidewalkSignUnit({
  spec,
  playerRef,
}: {
  spec: SidewalkSignSpec;
  playerRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const poleMat = useMemo(() => neonMat(neonPalette.deepInk), []);
  const armMat = useMemo(() => neonMat('#1A2228'), []);
  const towardRoad = spec.x < 0 ? 1 : -1;
  const armLen = 0.92;
  const panelX = towardRoad * armLen;
  const h = spec.height ?? 3.05;

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const pz = playerRef.current;
    g.visible = nearPlayer(spec.x, spec.z, pz, SIDEWALK_CULL);
    if (!g.visible) return;
    g.position.y = groundSurfaceY(spec.x, spec.z, pz);
  });

  return (
    <group ref={groupRef} position={[spec.x, 0, spec.z]}>
      <mesh material={poleMat} position={[0, h * 0.45, 0]} renderOrder={10}>
        <cylinderGeometry args={[0.035, 0.04, h * 0.9, 6]} />
      </mesh>
      <mesh material={armMat} position={[towardRoad * armLen * 0.5, h, 0]} renderOrder={10}>
        <boxGeometry args={[armLen, 0.045, 0.045]} />
      </mesh>
      <mesh material={armMat} position={[0, h - 0.04, 0.04]} renderOrder={10}>
        <boxGeometry args={[0.07, 0.04, 0.07]} />
      </mesh>
      <group position={[panelX, h, 0.06]}>
        <FacingNeonPanel
          text={spec.text}
          color={spec.color}
          height={0.34}
          fontSize={0.11}
          flicker={spec.flicker}
          flickerSeed={spec.flickerSeed ?? spec.z}
        />
      </group>
    </group>
  );
}

export function StreetNeonSignage({ playerRef }: { playerRef: React.MutableRefObject<number> }) {
  return (
    <group>
      {ROAD_SPANS.map((span, i) => (
        <RoadSpanUnit key={`span-${i}`} spec={span} playerRef={playerRef} />
      ))}
      {SIDEWALK_SIGNS.map((sign, i) => (
        <SidewalkSignUnit key={`sw-${i}`} spec={sign} playerRef={playerRef} />
      ))}
    </group>
  );
}
