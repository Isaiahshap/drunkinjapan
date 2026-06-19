'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { createInkOutline } from '@/lib/toonMaterials';
import { outlineScaleForThickness } from '@/lib/outlineUtils';

interface OutlinedMeshProps {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  /** World-unit ink thickness (inverted hull). */
  outlineThickness?: number;
  outlineOpacity?: number;
}

export default function OutlinedMesh({
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  outlineThickness = 0.04,
  outlineOpacity = 0.9,
}: OutlinedMeshProps) {
  const outline = useMemo(() => createInkOutline(outlineOpacity), [outlineOpacity]);
  const oScale = useMemo(() => {
    const g = geometry.clone();
    g.scale(scale[0], scale[1], scale[2]);
    const s = outlineScaleForThickness(g, outlineThickness);
    return [scale[0] * s, scale[1] * s, scale[2] * s] as [number, number, number];
  }, [geometry, scale, outlineThickness]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={material} scale={scale} />
      <mesh geometry={geometry} material={outline} scale={oScale} />
    </group>
  );
}
