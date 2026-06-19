'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { palette } from '@/lib/palette';
import { createCurvedPaintedMaterial } from '@/lib/paintedMaterials';
import { groundSurfaceY, type CurveTier } from '@/lib/curvedWorld';

export const SEAM_WIDTH = 0.028;
export const SEAM_HEIGHT = 0.036;
const SEAM_DIVISIONS = 64;
const SEAM_OPACITY = 0.62;
const SEAM_LIFT = 0.02;
const SEAM_RENDER_ORDER = 2;

function curvedInkMat(tier: CurveTier) {
  const m = createCurvedPaintedMaterial(palette.ink, tier, {
    transparent: true,
    opacity: SEAM_OPACITY,
  });
  m.depthWrite = false;
  return m;
}

function seamSurfaceY(x: number, z: number, center: THREE.Vector3, tier: CurveTier = 'sidewalk') {
  return groundSurfaceY(x, z, center, 0.02, tier) + SEAM_LIFT;
}

function seamSurfaceYMax(
  points: [number, number][],
  center: THREE.Vector3,
  tier: CurveTier = 'sidewalk',
) {
  let y = groundSurfaceY(points[0][0], points[0][1], center, 0.02, tier);
  for (let i = 1; i < points.length; i++) {
    y = Math.max(y, groundSurfaceY(points[i][0], points[i][1], center, 0.02, tier));
  }
  return y + SEAM_LIFT;
}

interface GroundSeamLineProps {
  x: number;
  z: number;
  length: number;
  tier?: CurveTier;
  y?: number;
}

/** Ink stroke along Z in world space — vertex shader bends with ground. */
export function GroundSeamLine({
  x,
  z,
  length,
  tier = 'sidewalk',
  y = 0.04,
}: GroundSeamLineProps) {
  const geo = useMemo(
    () => new THREE.BoxGeometry(SEAM_WIDTH, SEAM_HEIGHT, length, 1, 1, SEAM_DIVISIONS),
    [length],
  );
  const mat = useMemo(() => curvedInkMat(tier), [tier]);
  return (
    <mesh geometry={geo} material={mat} position={[x, y, z]} renderOrder={SEAM_RENDER_ORDER} />
  );
}

interface GroundSeamSpanProps {
  z: number;
  xStart: number;
  xEnd: number;
  tier?: CurveTier;
  y?: number;
}

/** Ink stroke along X in world space. */
export function GroundSeamSpan({
  z,
  xStart,
  xEnd,
  tier = 'sidewalk',
  y = 0.04,
}: GroundSeamSpanProps) {
  const length = Math.abs(xEnd - xStart);
  const geo = useMemo(
    () => new THREE.BoxGeometry(length, SEAM_HEIGHT, SEAM_WIDTH, SEAM_DIVISIONS, 1, 1),
    [length],
  );
  const mat = useMemo(() => curvedInkMat(tier), [tier]);
  return (
    <mesh
      geometry={geo}
      material={mat}
      position={[(xStart + xEnd) / 2, y, z]}
      renderOrder={SEAM_RENDER_ORDER}
    />
  );
}

function GroundSeamCorner({ x, z, y = 0.04 }: { x: number; z: number; y?: number }) {
  const geo = useMemo(
    () => new THREE.BoxGeometry(0.038, SEAM_HEIGHT, 0.038, 4, 2, 4),
    [],
  );
  const mat = useMemo(() => curvedInkMat('sidewalk'), []);
  return (
    <mesh geometry={geo} material={mat} position={[x, y, z]} renderOrder={SEAM_RENDER_ORDER} />
  );
}

interface LiftedSeamLineProps {
  x: number;
  z: number;
  length: number;
  playerRef: React.MutableRefObject<THREE.Vector3>;
  tier?: CurveTier;
}

function LiftedSeamLine({ x, z, length, playerRef, tier = 'sidewalk' }: LiftedSeamLineProps) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(
    () => new THREE.BoxGeometry(SEAM_WIDTH, SEAM_HEIGHT, length, 1, 1, SEAM_DIVISIONS),
    [length],
  );
  const mat = useMemo(() => curvedInkMat(tier), [tier]);

  useFrame(() => {
    if (!ref.current) return;
    const center = playerRef.current;
    const z0 = z - length / 2;
    const z1 = z + length / 2;
    const y = seamSurfaceYMax([[x, z0], [x, z1]], center, tier);
    ref.current.position.set(x, y, z);
  });

  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={SEAM_RENDER_ORDER} />;
}

interface LiftedSeamSpanProps {
  z: number;
  xStart: number;
  xEnd: number;
  playerRef: React.MutableRefObject<THREE.Vector3>;
  tier?: CurveTier;
}

function LiftedSeamSpan({ z, xStart, xEnd, playerRef, tier = 'sidewalk' }: LiftedSeamSpanProps) {
  const ref = useRef<THREE.Mesh>(null);
  const length = Math.abs(xEnd - xStart);
  const midX = (xStart + xEnd) / 2;
  const geo = useMemo(
    () => new THREE.BoxGeometry(length, SEAM_HEIGHT, SEAM_WIDTH, SEAM_DIVISIONS, 1, 1),
    [length],
  );
  const mat = useMemo(() => curvedInkMat(tier), [tier]);

  useFrame(() => {
    if (!ref.current) return;
    const center = playerRef.current;
    const y = seamSurfaceYMax([[xStart, z], [xEnd, z]], center, tier);
    ref.current.position.set(midX, y, z);
  });

  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={SEAM_RENDER_ORDER} />;
}

function LiftedSeamCorner({
  x,
  z,
  playerRef,
  tier = 'sidewalk',
}: {
  x: number;
  z: number;
  playerRef: React.MutableRefObject<THREE.Vector3>;
  tier?: CurveTier;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(
    () => new THREE.BoxGeometry(0.038, SEAM_HEIGHT, 0.038, 4, 2, 4),
    [],
  );
  const mat = useMemo(() => curvedInkMat(tier), [tier]);

  useFrame(() => {
    if (!ref.current) return;
    const y = seamSurfaceY(x, z, playerRef.current, tier);
    ref.current.position.set(x, y, z);
  });

  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={SEAM_RENDER_ORDER} />;
}

export interface BuildingGroundSeamsProps {
  px: number;
  pz: number;
  width: number;
  depth: number;
  side: 'left' | 'right';
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

/** Curved ground ink at facade footing + depth side edges. */
export function BuildingGroundSeams({
  px,
  pz,
  width,
  depth,
  side,
  playerRef,
}: BuildingGroundSeamsProps) {
  const edge = 0.015;
  const faceX = side === 'left' ? width / 2 + edge : -(width / 2 + edge);
  const worldX = px + faceX;
  const backX = side === 'left' ? px - width / 2 - edge : px + width / 2 + edge;
  const seamLen = depth - edge * 2;
  const half = seamLen / 2;
  const inward = side === 'left' ? -0.14 : 0.14;
  const zA = pz - half;
  const zB = pz + half;

  const zSideNear = pz - depth / 2 + edge;
  const zSideFar = pz + depth / 2 - edge;

  return (
    <group>
      <LiftedSeamLine x={worldX} z={pz} length={seamLen} playerRef={playerRef} />
      <LiftedSeamSpan z={zA} xStart={worldX} xEnd={worldX + inward} playerRef={playerRef} />
      <LiftedSeamSpan z={zB} xStart={worldX} xEnd={worldX + inward} playerRef={playerRef} />
      <LiftedSeamCorner x={worldX} z={zA} playerRef={playerRef} />
      <LiftedSeamCorner x={worldX} z={zB} playerRef={playerRef} />

      <LiftedSeamSpan z={zSideNear} xStart={backX} xEnd={worldX} playerRef={playerRef} />
      <LiftedSeamSpan z={zSideFar} xStart={backX} xEnd={worldX} playerRef={playerRef} />
      <LiftedSeamCorner x={worldX} z={zSideNear} playerRef={playerRef} />
      <LiftedSeamCorner x={worldX} z={zSideFar} playerRef={playerRef} />
      <LiftedSeamCorner x={backX} z={zSideNear} playerRef={playerRef} />
      <LiftedSeamCorner x={backX} z={zSideFar} playerRef={playerRef} />

      <LiftedSeamLine x={backX} z={pz} length={seamLen} playerRef={playerRef} />
      <LiftedSeamCorner x={backX} z={zA} playerRef={playerRef} />
      <LiftedSeamCorner x={backX} z={zB} playerRef={playerRef} />
    </group>
  );
}

interface GroundSeamSetProps {
  groundZ: number;
  groundLen: number;
}

/** All major ground-surface intersection strokes. */
export function GroundSeamSet({ groundZ, groundLen }: GroundSeamSetProps) {
  const half = groundLen / 2;
  const farZ = groundZ - half + 0.5;
  const nearZ = groundZ + half - 0.5;

  return (
    <group>
      <GroundSeamLine x={-2.62} z={groundZ} length={groundLen} tier="curb" y={0.04} />
      <GroundSeamLine x={2.62} z={groundZ} length={groundLen} tier="curb" y={0.04} />
      <GroundSeamLine x={-4.0} z={groundZ} length={groundLen} />
      <GroundSeamLine x={4.0} z={groundZ} length={groundLen} />
      <GroundSeamLine x={-22.0} z={groundZ} length={groundLen} />
      <GroundSeamLine x={22.0} z={groundZ} length={groundLen} />
      <GroundSeamSpan z={farZ} xStart={-22} xEnd={22} />
      <GroundSeamSpan z={nearZ} xStart={-22} xEnd={22} />
    </group>
  );
}
