'use client';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import NeonGlowOrb from './NeonGlowOrb';

import {
  PLAYER_X_MIN,
  PLAYER_X_MAX,
  PLAYER_Z_MIN,
  PLAYER_Z_MAX,
} from '@/lib/streetLayout';
import { getMoveInput, keys } from '@/lib/playerInput';

const SPEED = 4.5;
const X_MIN = PLAYER_X_MIN;
const X_MAX = PLAYER_X_MAX;
const Z_MIN = PLAYER_Z_MIN;
const Z_MAX = PLAYER_Z_MAX;

const FLOAT_BASE = 1.08;
const BLOB_CORE = '#FFF6EC';
const BLOB_WARM = '#FFE4C8';
const BLOB_SOFT = '#FFD8F0';

interface PlayerControllerProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

function createLumpyGeometry(radius: number, lumpSeed: number) {
  const geo = new THREE.IcosahedronGeometry(radius, 4);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n =
      Math.sin(x * 4.1 + lumpSeed) * 0.42 +
      Math.cos(y * 3.7 + lumpSeed * 1.3) * 0.38 +
      Math.sin(z * 5.2 + lumpSeed * 0.7) * 0.35;
    const len = Math.hypot(x, y, z) || 1;
    const r = radius * (1 + n * 0.22);
    pos.setXYZ(i, (x / len) * r, (y / len) * r, (z / len) * r);
  }
  geo.computeVertexNormals();
  return geo;
}

function glowMat(color: string, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

export default function PlayerController({ positionRef }: PlayerControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blobRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(0);
  const phase = useRef(0);

  const coreGeo = useMemo(() => createLumpyGeometry(0.22, 1.4), []);
  const shellGeo = useMemo(() => createLumpyGeometry(0.34, 2.8), []);
  const lobeGeo = useMemo(() => createLumpyGeometry(0.14, 4.2), []);

  const coreMat = useMemo(() => glowMat(BLOB_CORE, 0.92), []);
  const shellMat = useMemo(() => glowMat(BLOB_WARM, 0.38), []);
  const lobeMat = useMemo(() => glowMat(BLOB_SOFT, 0.55), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    const { dx, dz } = getMoveInput();

    if (dx !== 0 || dz !== 0) {
      targetRotY.current = Math.atan2(dx, dz);
    }

    phase.current += delta * (dx || dz ? 2.6 : 1.8);
    const t = phase.current;
    const speedWobble = 1 + Math.sin(t * 0.55) * 0.12;
    const step = SPEED * speedWobble * delta;

    positionRef.current.x = THREE.MathUtils.clamp(
      positionRef.current.x + dx * step,
      X_MIN,
      X_MAX,
    );
    positionRef.current.z = THREE.MathUtils.clamp(
      positionRef.current.z + dz * step,
      Z_MIN,
      Z_MAX,
    );

    const floatY =
      FLOAT_BASE +
      Math.sin(t * 1.7) * 0.26 +
      Math.sin(t * 2.9) * 0.1 +
      Math.cos(t * 3.7) * 0.06 +
      Math.sin(t * 4.8) * 0.03;
    const drunkX = Math.sin(t * 1.15) * 0.14 + Math.sin(t * 2.3) * 0.06 + Math.cos(t * 3.2) * 0.03;
    const drunkZ = Math.cos(t * 1.05) * 0.12 + Math.sin(t * 1.9) * 0.055 + Math.sin(t * 2.7) * 0.03;
    const moving = dx !== 0 || dz !== 0;

    if (groupRef.current) {
      groupRef.current.position.copy(positionRef.current);
      groupRef.current.position.x += drunkX;
      groupRef.current.position.z += drunkZ;
      groupRef.current.position.y = floatY;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY.current + Math.sin(t * 0.85) * 0.1,
        moving ? 0.085 : 0.03,
      );
      groupRef.current.rotation.x = Math.sin(t * 0.95) * 0.05;
      groupRef.current.rotation.z = Math.sin(t * 0.72) * 0.065;
    }

    if (blobRef.current) {
      const breathe = Math.sin(t * 2.1);
      const wobbleX = Math.sin(t * 1.3) * 0.18;
      const wobbleZ = Math.cos(t * 1.5) * 0.15;
      blobRef.current.rotation.x = wobbleX;
      blobRef.current.rotation.z = wobbleZ;
      blobRef.current.scale.set(
        1 + breathe * 0.08 + Math.sin(t * 3.4) * 0.03,
        1 - breathe * 0.06 + Math.sin(t * 2.6) * 0.04,
        1 + Math.cos(t * 2.8) * 0.07,
      );

      const children = blobRef.current.children;
      if (children[2]) {
        children[2].position.set(
          Math.sin(t * 1.9) * 0.12,
          Math.cos(t * 2.2) * 0.08,
          Math.sin(t * 1.6) * 0.1,
        );
      }
      if (children[3]) {
        children[3].position.set(
          Math.cos(t * 2.4) * 0.14,
          Math.sin(t * 1.7) * 0.1,
          Math.cos(t * 2.0) * 0.11,
        );
      }
      if (children[4]) {
        children[4].position.set(
          Math.sin(t * 2.6) * 0.1,
          Math.cos(t * 3.1) * 0.09,
          Math.sin(t * 2.3) * 0.13,
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={blobRef}>
        <NeonGlowOrb color={BLOB_WARM} radius={0.72} intensity={0.62} lite />
        <mesh geometry={shellGeo} material={shellMat} renderOrder={12} />
        <mesh geometry={coreGeo} material={coreMat} renderOrder={13} />
        <mesh geometry={lobeGeo} material={lobeMat} renderOrder={13} />
        <mesh geometry={lobeGeo} material={lobeMat} renderOrder={13} />
        <mesh geometry={lobeGeo} material={lobeMat} renderOrder={13} />
      </group>
    </group>
  );
}
