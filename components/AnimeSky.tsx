'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { palette } from '@/lib/palette';

function createNightSkyTexture() {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, palette.nightSkyTop);
  grad.addColorStop(0.45, palette.nightSky);
  grad.addColorStop(0.78, palette.nightSky);
  grad.addColorStop(1, palette.nightSkyHorizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const moon = (x: number, y: number, r: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(220,235,248,0.55)');
    g.addColorStop(0.35, 'rgba(180,205,230,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.nightMoon;
    ctx.globalAlpha = 0.82;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  moon(w * 0.72, h * 0.22, 42);

  const star = (x: number, y: number, size: number, alpha: number) => {
    ctx.fillStyle = `rgba(240,248,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  };

  let seed = 41823;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.72;
    const size = rand() * 1.4 + 0.3;
    const alpha = rand() * 0.55 + 0.15;
    star(x, y, size, alpha);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface AnimeSkyProps {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export default function AnimeSky({ playerRef }: AnimeSkyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createNightSkyTexture(), []);
  const geo = useMemo(() => new THREE.SphereGeometry(95, 64, 40), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    [texture],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const p = playerRef.current;
    meshRef.current.position.set(p.x, 6, p.z - 16);
  });

  return (
    <mesh ref={meshRef} geometry={geo} material={mat} position={[0, 6, -12]} renderOrder={-1} />
  );
}
