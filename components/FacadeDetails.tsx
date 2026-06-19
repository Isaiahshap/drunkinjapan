'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { palette } from '@/lib/palette';
import { jitteredLine, seededRandom, type Point3 } from '@/lib/sketchLines';
import { createPaintedMaterial, createShadowWashMaterial } from '@/lib/paintedMaterials';
import { getWindowGlassMaterial, getDoorGlassMaterial } from '@/lib/facadeWindowMaterials';
import { createToonMaterial } from '@/lib/toonMaterials';
import OutlinedMesh from './OutlinedMesh';

const INK = palette.ink;

function edgeMat(opacity = 0.88) {
  return new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity });
}

function highlightMat() {
  return new THREE.MeshBasicMaterial({ color: palette.lineHighlight, transparent: true, opacity: 0.35 });
}

const highlightMaterial = highlightMat();

/** Thin ink stroke as a box mesh — visible unlike 1px LineBasicMaterial. */
function InkStroke({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => edgeMat(0.9), []);
  return <mesh geometry={geo} material={mat} position={position} scale={size} />;
}

interface WindowFrameProps {
  faceX: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  seed: number;
  rotY: number;
}

/** Window on depth-facing side wall. */
export function DepthWindowFrame({
  faceZ,
  lx,
  cy,
  w,
  h,
  rotY,
  seed,
}: {
  faceZ: number;
  lx: number;
  cy: number;
  w: number;
  h: number;
  rotY: number;
  seed: number;
}) {
  const depth = 0.012;
  const t = 0.014;
  const z = faceZ + (faceZ > 0 ? depth : -depth);
  const hw = w / 2;
  const hh = h / 2;
  const glassMat = getWindowGlassMaterial(seed);

  return (
    <>
      <mesh position={[lx, cy, faceZ]} rotation={[0, rotY, 0]} material={glassMat}>
        <planeGeometry args={[w - t * 2, h - t * 2]} />
      </mesh>
      <InkStroke position={[lx - hw, cy, z]} size={[t, h + t * 0.5, t]} />
      <InkStroke position={[lx + hw, cy, z]} size={[t, h + t * 0.5, t]} />
      <InkStroke position={[lx, cy - hh, z]} size={[w + t * 0.5, t, t]} />
      <InkStroke position={[lx, cy + hh, z]} size={[w + t * 0.5, t, t]} />
    </>
  );
}

export function WindowFrame({ faceX, cy, cz, w, h, seed, rotY }: WindowFrameProps) {
  const depth = 0.012;
  const t = 0.014;
  const x = faceX + (faceX > 0 ? depth : -depth);

  const corners = useMemo(() => {
    const hw = w / 2;
    const hh = h / 2;
    return jitteredLine(
      [
        [x, cy - hh, cz - hw],
        [x, cy - hh, cz + hw],
        [x, cy + hh, cz + hw],
        [x, cy + hh, cz - hw],
      ],
      0.018,
      seed,
    );
  }, [x, cy, cz, w, h, seed]);

  const hw = w / 2;
  const hh = h / 2;
  const glassMat = getWindowGlassMaterial(seed);

  return (
    <>
      <mesh position={[faceX, cy, cz]} rotation={[0, rotY, 0]} material={glassMat}>
        <planeGeometry args={[w - t * 2, h - t * 2]} />
      </mesh>
      <InkStroke position={[x, cy, cz - hw]} size={[t, h + t * 0.5, t]} />
      <InkStroke position={[x, cy, cz + hw]} size={[t, h + t * 0.5, t]} />
      <InkStroke position={[x, cy - hh, cz]} size={[t, t, w + t * 0.5]} />
      <InkStroke position={[x, cy + hh, cz]} size={[t, t, w + t * 0.5]} />
      <mesh position={[x, cy + hh * 0.35, cz - hw * 0.55]} material={highlightMaterial}>
        <boxGeometry args={[0.006, h * 0.22, 0.006]} />
      </mesh>
      <SketchLineMesh points={[...corners, corners[0]]} opacity={0.85} />
    </>
  );
}

interface DoorFrameProps {
  faceX: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  seed: number;
  rotY: number;
}

export function DoorFrame({ faceX, cy, cz, w, h, seed, rotY }: DoorFrameProps) {
  const glassMat = getDoorGlassMaterial(seed);
  const offset = faceX > 0 ? 0.012 : -0.012;
  const t = 0.016;
  const hw = w / 2;

  const framePts = useMemo(
    () =>
      jitteredLine(
        [
          [faceX + offset, cy, cz - hw],
          [faceX + offset, cy + h, cz - hw],
          [faceX + offset, cy + h, cz + hw],
          [faceX + offset, cy, cz + hw],
        ],
        0.022,
        seed,
      ),
    [faceX, cy, cz, w, h, seed, offset, hw],
  );

  return (
    <>
      <mesh position={[faceX, cy + h / 2, cz]} rotation={[0, rotY, 0]} material={glassMat}>
        <planeGeometry args={[w - t * 2, h - t]} />
      </mesh>
      <InkStroke position={[faceX + offset, cy + h / 2, cz - hw]} size={[t, h, t]} />
      <InkStroke position={[faceX + offset, cy + h / 2, cz + hw]} size={[t, h, t]} />
      <InkStroke position={[faceX + offset, cy + h, cz]} size={[t, t, w]} />
      <SketchLineMesh points={framePts} opacity={0.88} />
    </>
  );
}

export function PipeLine({
  faceX,
  y,
  z,
  height,
  seed,
}: {
  faceX: number;
  y: number;
  z: number;
  height: number;
  seed: number;
}) {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.038, 0.038, height, 6), [height]);
  const mat = useMemo(() => createToonMaterial(palette.buildingGray), []);
  const xJitter = useMemo(() => (seededRandom(seed)() - 0.5) * 0.012, [seed]);
  return (
    <OutlinedMesh
      geometry={geo}
      material={mat}
      position={[faceX + xJitter, y, z]}
      outlineThickness={0.012}
      outlineOpacity={0.82}
    />
  );
}

export function FacadeSeam({
  faceX,
  y,
  zStart,
  zEnd,
  seed,
}: {
  faceX: number;
  y: number;
  zStart: number;
  zEnd: number;
  seed: number;
}) {
  const pts = useMemo(
    () => jitteredLine([[faceX, y, zStart], [faceX, y, zEnd]], 0.014, seed),
    [faceX, y, zStart, zEnd, seed],
  );
  return <SketchLineMesh points={pts} opacity={0.42} />;
}

export function FacadeShadow({
  faceX,
  cy,
  cz,
  w,
  h,
  rotY,
  opacity = 0.08,
}: {
  faceX: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  rotY: number;
  opacity?: number;
}) {
  const mat = useMemo(() => createShadowWashMaterial(opacity), [opacity]);
  return (
    <mesh position={[faceX, cy, cz]} rotation={[0, rotY, 0]} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

export function RoofTrim({
  faceX,
  y,
  zStart,
  zEnd,
  seed,
}: {
  faceX: number;
  y: number;
  zStart: number;
  zEnd: number;
  seed: number;
}) {
  const pts = useMemo(
    () => jitteredLine([[faceX, y, zStart], [faceX, y, zEnd]], 0.016, seed),
    [faceX, y, zStart, zEnd, seed],
  );
  return <SketchLineMesh points={pts} opacity={0.78} thickness={0.016} />;
}

/** Mesh tube strokes instead of 1px lines. */
export function SketchLineMesh({
  points,
  opacity = 0.8,
  thickness = 0.012,
}: {
  points: Point3[];
  opacity?: number;
  thickness?: number;
}) {
  const segments = useMemo(() => {
    const out: { mid: Point3; len: number; rot: [number, number, number] }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(...points[i]);
      const b = new THREE.Vector3(...points[i + 1]);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      if (len < 0.001) continue;
      const dir = b.clone().sub(a).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const euler = new THREE.Euler().setFromQuaternion(quat);
      out.push({
        mid: [mid.x, mid.y, mid.z],
        len,
        rot: [euler.x, euler.y, euler.z],
      });
    }
    return out;
  }, [points]);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => edgeMat(opacity), [opacity]);

  return (
    <>
      {segments.map((s, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={mat}
          position={s.mid}
          rotation={s.rot}
          scale={[thickness, s.len, thickness]}
        />
      ))}
    </>
  );
}

export function SignBoard({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const geo = useMemo(() => new THREE.BoxGeometry(0.72, 0.24, 0.05), []);
  const mat = useMemo(() => createToonMaterial(palette.mutedRed), []);
  return (
    <OutlinedMesh
      geometry={geo}
      material={mat}
      position={position}
      rotation={rotation}
      outlineThickness={0.014}
      outlineOpacity={0.88}
    />
  );
}

export function UtilityBox({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const geo = useMemo(() => new THREE.BoxGeometry(0.44, 0.52, 0.28), []);
  const mat = useMemo(() => createToonMaterial(palette.buildingGray), []);
  return (
    <OutlinedMesh
      geometry={geo}
      material={mat}
      position={position}
      rotation={rotation}
      outlineThickness={0.012}
      outlineOpacity={0.85}
    />
  );
}

export function Awning({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const geo = useMemo(() => new THREE.BoxGeometry(1.75, 0.1, 0.72), []);
  const mat = useMemo(() => createToonMaterial(palette.awning), []);
  const stripeGeo = useMemo(() => new THREE.BoxGeometry(1.68, 0.025, 0.66), []);
  const stripeMat = useMemo(() => createToonMaterial(palette.mutedRed), []);
  const bracketGeo = useMemo(() => new THREE.BoxGeometry(0.05, 0.05, 0.22), []);
  const bracketMat = useMemo(() => createToonMaterial(palette.ink), []);

  return (
    <group position={position} rotation={rotation}>
      <OutlinedMesh
        geometry={geo}
        material={mat}
        outlineThickness={0.013}
        outlineOpacity={0.86}
      />
      <mesh geometry={stripeGeo} material={stripeMat} position={[0, 0.045, 0]} />
      <mesh geometry={bracketGeo} material={bracketMat} position={[-0.72, -0.04, -0.18]} />
      <mesh geometry={bracketGeo} material={bracketMat} position={[0.72, -0.04, -0.18]} />
    </group>
  );
}

export function PottedPlant({ position }: { position: [number, number, number] }) {
  const potGeo = useMemo(() => new THREE.CylinderGeometry(0.14, 0.11, 0.22, 8), []);
  const leafGeo = useMemo(() => new THREE.SphereGeometry(0.24, 6, 5), []);
  const potMat = useMemo(() => createToonMaterial(palette.roadShadow), []);
  const leafMat = useMemo(() => createToonMaterial(palette.plantGreen), []);
  return (
    <group position={position}>
      <OutlinedMesh geometry={potGeo} material={potMat} position={[0, 0.11, 0]} outlineThickness={0.01} outlineOpacity={0.8} />
      <OutlinedMesh geometry={leafGeo} material={leafMat} position={[0, 0.42, 0]} outlineThickness={0.01} outlineOpacity={0.78} />
    </group>
  );
}

export function RoadSign({ position }: { position: [number, number, number] }) {
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.022, 0.022, 1.5, 6), []);
  const discGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, 0.035, 10), []);
  const poleMat = useMemo(() => createToonMaterial(palette.ink), []);
  const discMat = useMemo(() => createToonMaterial(palette.bridgeTeal), []);
  return (
    <group position={position}>
      <OutlinedMesh geometry={poleGeo} material={poleMat} position={[0, 0.75, 0]} outlineThickness={0.008} outlineOpacity={0.82} />
      <OutlinedMesh geometry={discGeo} material={discMat} position={[0, 1.55, 0]} outlineThickness={0.01} outlineOpacity={0.85} />
    </group>
  );
}
