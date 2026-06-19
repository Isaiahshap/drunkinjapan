'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { createSketchLineMaterial } from '@/lib/toonMaterials';
import { jitteredLine, handDrawnRect, handDrawnFacadeDoor, type Point3 } from '@/lib/sketchLines';

interface SketchLineProps {
  points: Point3[];
  seed?: number;
  jitter?: number;
  opacity?: number;
}

export function SketchLine({ points, seed = 1, jitter = 0.022, opacity = 0.62 }: SketchLineProps) {
  const line = useMemo(() => {
    const pts = jitter > 0 ? jitteredLine(points, jitter, seed) : points;
    const geo = new THREE.BufferGeometry().setFromPoints(
      pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    return new THREE.Line(geo, createSketchLineMaterial(opacity));
  }, [points, seed, jitter, opacity]);

  return <primitive object={line} />;
}

interface HandDrawnRectProps {
  cx: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  seed: number;
  jitter?: number;
  opacity?: number;
  cross?: boolean;
}

export function HandDrawnRectLine({
  cx, cy, cz, w, h, seed, jitter = 0.024, opacity = 0.58, cross = false,
}: HandDrawnRectProps) {
  const points = useMemo(() => handDrawnRect(cx, cy, cz, w, h, jitter, seed), [cx, cy, cz, w, h, jitter, seed]);
  const crossPts = useMemo(() => {
    if (!cross) return null;
    return jitteredLine(
      [[cx, cy - h / 2, cz], [cx, cy + h / 2, cz]],
      jitter * 0.6,
      seed + 17,
    );
  }, [cross, cx, cy, cz, h, jitter, seed]);

  return (
    <>
      <SketchLine points={points} seed={seed} jitter={0} opacity={opacity} />
      {crossPts && <SketchLine points={crossPts} seed={seed + 17} jitter={0} opacity={opacity * 0.7} />}
    </>
  );
}

export function HandDrawnDoorLine({
  cx, cy, cz, w, h, seed, jitter = 0.026, opacity = 0.65,
}: Omit<HandDrawnRectProps, 'cross'>) {
  const points = useMemo(
    () => handDrawnFacadeDoor(cx, cy, cz, w, h, jitter, seed),
    [cx, cy, cz, w, h, jitter, seed],
  );
  return <SketchLine points={points} seed={seed} jitter={0} opacity={opacity} />;
}
