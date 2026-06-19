'use client';

import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { groundSurfaceY } from '@/lib/curvedWorld';
import { nearPlayer } from '@/lib/sceneCulling';
import { STRING_LIGHT_RUNS, type StringLightSpec } from '@/lib/stringLightsLayout';

const CULL = 46;
const BULB_COLORS = ['#FFE8B0', '#FFF4D8', '#FFD878', '#FFC8E8', '#FFE0A8'] as const;

const bulbGeo = new THREE.SphereGeometry(0.035, 6, 5);
const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 4);

const bulbMatCache = new Map<string, THREE.MeshBasicMaterial>();
const wireMat = new THREE.MeshBasicMaterial({ color: '#2a2830', toneMapped: false });

function bulbMat(color: string) {
  const cached = bulbMatCache.get(color);
  if (cached) return cached;
  const mat = new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
    transparent: true,
    opacity: 0.95,
  });
  bulbMatCache.set(color, mat);
  return mat;
}

function arcPoints(
  leftX: number,
  rightX: number,
  height: number,
  sag: number,
  bulbs: number,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < bulbs; i++) {
    const t = bulbs === 1 ? 0.5 : i / (bulbs - 1);
    const x = THREE.MathUtils.lerp(leftX, rightX, t);
    const y = height - sag * 4 * t * (1 - t);
    pts.push(new THREE.Vector3(x, y, 0));
  }
  return pts;
}

function facadePoints(
  x: number,
  z0: number,
  z1: number,
  height: number,
  bulbs: number,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < bulbs; i++) {
    const t = bulbs === 1 ? 0.5 : i / (bulbs - 1);
    pts.push(new THREE.Vector3(x, height, THREE.MathUtils.lerp(z0, z1, t)));
  }
  return pts;
}

function resolvePoints(spec: StringLightSpec): THREE.Vector3[] {
  if (spec.kind === 'facade') {
    return facadePoints(spec.x, spec.z0, spec.z1, spec.height, spec.bulbs);
  }
  return arcPoints(spec.leftX, spec.rightX, spec.height, spec.sag, spec.bulbs);
}

function anchorZ(spec: StringLightSpec) {
  if (spec.kind === 'facade') return (spec.z0 + spec.z1) * 0.5;
  return spec.z;
}

function anchorX(spec: StringLightSpec) {
  if (spec.kind === 'facade') return spec.x;
  return 0;
}

function WireSegment({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const mid = useMemo(() => from.clone().add(to).multiplyScalar(0.5), [from, to]);
  const len = useMemo(() => from.distanceTo(to), [from, to]);
  const quat = useMemo(() => {
    const dir = to.clone().sub(from).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [from, to]);

  return (
    <mesh
      geometry={wireGeo}
      material={wireMat}
      position={mid}
      quaternion={quat}
      scale={[1, len, 1]}
      renderOrder={5}
    />
  );
}

const StringLightRun = memo(function StringLightRun({
  spec,
  playerRef,
}: {
  spec: StringLightSpec;
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => resolvePoints(spec), [spec]);
  const az = anchorZ(spec);
  const ax = anchorX(spec);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const player = playerRef.current;
    g.visible = nearPlayer(ax, az, player, CULL, 14);
    if (!g.visible) return;

    const gy = groundSurfaceY(ax, az, player);
    if (spec.kind === 'facade') {
      g.position.set(0, gy, 0);
    } else {
      g.position.set(0, gy, az);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {points.map((pt, i) => {
        if (i === 0) return null;
        return <WireSegment key={`w-${i}`} from={points[i - 1]} to={pt} />;
      })}
      {points.map((pt, i) => (
        <mesh
          key={`b-${i}`}
          geometry={bulbGeo}
          material={bulbMat(BULB_COLORS[(spec.seed + i) % BULB_COLORS.length])}
          position={pt}
          renderOrder={8}
        />
      ))}
    </group>
  );
});

export default memo(function StringLights({
  playerRef,
}: {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  return (
    <group name="string-lights">
      {STRING_LIGHT_RUNS.map((spec, i) => (
        <StringLightRun key={`sl-${i}`} spec={spec} playerRef={playerRef} />
      ))}
    </group>
  );
});
