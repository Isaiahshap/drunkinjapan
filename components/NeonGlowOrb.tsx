'use client';
import { useMemo } from 'react';
import * as THREE from 'three';

const DEFAULT_SHELL_COUNT = 12;
const LITE_SHELL_COUNT = 5;
const UNIT_GEO = new THREE.SphereGeometry(1, 10, 8);

function smoothFalloff(t: number, intensity: number) {
  const eased = Math.pow(t, 1.08);
  return Math.exp(-2.1 * eased) * intensity * 0.095;
}

const glowMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

function getGlowMaterial(color: THREE.Color, alpha: number) {
  const key = `${color.getHexString()}-${alpha.toFixed(4)}`;
  const cached = glowMaterialCache.get(key);
  if (cached) return cached;
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: alpha,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  glowMaterialCache.set(key, mat);
  return mat;
}

export interface NeonGlowOrbProps {
  color: string;
  radius?: number;
  intensity?: number;
  position?: [number, number, number];
  lite?: boolean;
}

/** Smooth omnidirectional glow — dissipates evenly from a central source. */
export default function NeonGlowOrb({
  color,
  radius = 0.5,
  intensity = 0.55,
  position = [0, 0, 0],
  lite = false,
}: NeonGlowOrbProps) {
  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const shellCount = lite ? LITE_SHELL_COUNT : DEFAULT_SHELL_COUNT;

  const shells = useMemo(() => {
    return Array.from({ length: shellCount }, (_, i) => {
      const t = i / (shellCount - 1);
      const shellRadius = radius * Math.pow(t, 0.3);
      const alpha = smoothFalloff(t, intensity);
      return {
        shellRadius: Math.max(shellRadius, radius * 0.025),
        alpha,
        mat: getGlowMaterial(colorObj, alpha),
      };
    });
  }, [radius, intensity, colorObj, shellCount]);

  return (
    <group position={position}>
      {shells.map((shell, i) => (
        <mesh
          key={i}
          geometry={UNIT_GEO}
          material={shell.mat}
          scale={shell.shellRadius}
          renderOrder={9}
        />
      ))}
    </group>
  );
}

/** Globe glow centered on a facade sign. */
export function SignGlowOrb({
  color,
  width = 1.2,
  height = 0.7,
  lite = false,
}: {
  color: string;
  width?: number;
  height?: number;
  lite?: boolean;
}) {
  const radius = Math.max(width, height) * (lite ? 0.55 : 0.92);
  return (
    <NeonGlowOrb
      color={color}
      radius={radius}
      intensity={lite ? 0.22 : 0.38}
      position={[0, 0, 0.05]}
      lite={lite}
    />
  );
}

/** Globe glow centered on a street-lamp bulb. */
export function LampGlowOrb({ color }: { color: string }) {
  return (
    <NeonGlowOrb
      color={color}
      radius={1.35}
      intensity={0.08}
      position={[0, 2.73, 0.1]}
      lite
    />
  );
}
