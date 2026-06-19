'use client';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RAIN_COUNT = 8500;
const FINE_COUNT = 4500;
const RAIN_SPAN_X = 14;
const RAIN_SPAN_Z_BACK = 42;
const RAIN_SPAN_Z_AHEAD = 18;
const RAIN_HEIGHT = 16;
const RAIN_SPEED = 22;
const FINE_SPEED = 28;
const STREAK_LEN = 0.42;
const FINE_LEN = 0.22;

const dummy = new THREE.Object3D();
const wind = new THREE.Vector3(0.35, 0, 0.08);

type RainLayerProps = {
  count: number;
  streakLen: number;
  baseSpeed: number;
  opacity: number;
  width: number;
  playerRef: React.MutableRefObject<THREE.Vector3>;
};

function RainLayer({
  count,
  streakLen,
  baseSpeed,
  opacity,
  width,
  playerRef,
}: RainLayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const speedsRef = useRef<Float32Array | null>(null);
  const offsetsRef = useRef<Float32Array | null>(null);

  const geometry = useMemo(
    () => new THREE.BoxGeometry(width, streakLen, width),
    [streakLen, width],
  );
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#C8DCF0',
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
    [opacity],
  );

  useLayoutEffect(() => {
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count * 3);
    speedsRef.current = speeds;
    offsetsRef.current = offsets;

    for (let i = 0; i < count; i += 1) {
      speeds[i] = baseSpeed * (0.75 + Math.random() * 0.55);
      offsets[i * 3] = (Math.random() - 0.5) * RAIN_SPAN_X;
      offsets[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
      offsets[i * 3 + 2] = Math.random() * (RAIN_SPAN_Z_BACK + RAIN_SPAN_Z_AHEAD) - RAIN_SPAN_Z_BACK;
    }

    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < count; i += 1) {
      dummy.position.set(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [baseSpeed, count]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const speeds = speedsRef.current;
    const offsets = offsetsRef.current;
    if (!mesh || !speeds || !offsets) return;

    const player = playerRef.current;
    const baseZ = player.z;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i += 1) {
      let oy = offsets[i * 3 + 1];

      oy -= speeds[i] * dt;
      if (oy < -0.2) {
        oy = RAIN_HEIGHT + Math.random() * 2.5;
        offsets[i * 3] = (Math.random() - 0.5) * RAIN_SPAN_X;
        offsets[i * 3 + 2] =
          Math.random() * (RAIN_SPAN_Z_BACK + RAIN_SPAN_Z_AHEAD) - RAIN_SPAN_Z_BACK;
      }

      offsets[i * 3 + 1] = oy;

      const ox = offsets[i * 3];
      const oz = offsets[i * 3 + 2];
      dummy.position.set(
        ox + wind.x * oy * 0.04,
        oy,
        baseZ + oz + wind.z * oy * 0.03,
      );
      dummy.rotation.x = -0.08;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={12}
    />
  );
}

export default function Rain({
  playerRef,
}: {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  return (
    <group name="rain">
      <RainLayer
        count={RAIN_COUNT}
        streakLen={STREAK_LEN}
        baseSpeed={RAIN_SPEED}
        opacity={0.44}
        width={0.018}
        playerRef={playerRef}
      />
      <RainLayer
        count={FINE_COUNT}
        streakLen={FINE_LEN}
        baseSpeed={FINE_SPEED}
        opacity={0.28}
        width={0.01}
        playerRef={playerRef}
      />
    </group>
  );
}
