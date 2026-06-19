'use client';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CAM_HEIGHT = 3.2;
const CAM_DISTANCE = 6.5;
const LOOK_AHEAD = 7;
const LOOK_HEIGHT = 1.05;
const CAM_LERP = 0.058;
const SWAY_X = 0.38;
const SWAY_Y = 0.3;
const SWAY_Z = 0.24;
const ROLL = 0.048;

const WORLD_UP = new THREE.Vector3(0, 1, 0);

interface CameraRigProps {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export default function CameraRig({ playerRef }: CameraRigProps) {
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const currentTarget = useRef(new THREE.Vector3(0, 1.1, -4));
  const rollRef = useRef(0);
  const fovRef = useRef(35);

  useFrame((state) => {
    const p = playerRef.current;
    const t = state.clock.elapsedTime;

    const swayX =
      Math.sin(t * 0.82) * SWAY_X +
      Math.sin(t * 1.52) * SWAY_X * 0.45 +
      Math.cos(t * 2.1) * SWAY_X * 0.18;
    const swayY =
      Math.sin(t * 0.96) * SWAY_Y +
      Math.cos(t * 1.78) * SWAY_Y * 0.48 +
      Math.sin(t * 2.4) * SWAY_Y * 0.15;
    const swayZ =
      Math.cos(t * 0.74) * SWAY_Z +
      Math.sin(t * 1.36) * SWAY_Z * 0.4 +
      Math.cos(t * 1.95) * SWAY_Z * 0.16;
    const targetSwayX = Math.sin(t * 0.9 + 0.7) * SWAY_X * 0.62;
    const targetSwayY = Math.cos(t * 1.12 + 1.2) * SWAY_Y * 0.45;

    desiredPos.current.set(
      p.x + swayX,
      p.y + CAM_HEIGHT + swayY,
      p.z + CAM_DISTANCE + swayZ,
    );
    desiredTarget.current.set(
      p.x + targetSwayX,
      p.y + LOOK_HEIGHT + targetSwayY,
      p.z - LOOK_AHEAD + Math.sin(t * 0.68) * 0.55,
    );

    const targetRoll =
      Math.sin(t * 0.6) * ROLL +
      Math.sin(t * 1.42) * ROLL * 0.55 +
      Math.cos(t * 2.05) * ROLL * 0.22;

    camera.position.lerp(desiredPos.current, CAM_LERP);
    currentTarget.current.lerp(desiredTarget.current, CAM_LERP);
    rollRef.current = THREE.MathUtils.lerp(rollRef.current, targetRoll, 0.048);

    const targetFov = 35 + Math.sin(t * 0.5) * 1.8;
    fovRef.current = THREE.MathUtils.lerp(fovRef.current, targetFov, 0.04);
    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov = fovRef.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    camera.up.copy(WORLD_UP);
    camera.lookAt(currentTarget.current);
    camera.rotation.z = rollRef.current;
  });

  return null;
}
