import * as THREE from 'three';
import { createToonRamp, createRoadToonRamp } from './toonRamp';
import { palette } from './palette';
import { applyCurvedWorld, type CurveTier } from './curvedWorld';

let ramp: THREE.DataTexture | null = null;
let roadRamp: THREE.DataTexture | null = null;

export function getToonRamp(): THREE.DataTexture {
  if (!ramp) ramp = createToonRamp();
  return ramp;
}

export function getRoadToonRamp(): THREE.DataTexture {
  if (!roadRamp) roadRamp = createRoadToonRamp();
  return roadRamp;
}

/** Toon bands — player and small props only. */
export function createToonMaterial(color: string): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getToonRamp(),
  });
}

export function createCurvedToonMaterial(
  color: string,
  tier: CurveTier,
  opts?: { transparent?: boolean; opacity?: number; side?: THREE.Side },
): THREE.MeshToonMaterial {
  const mat = createToonMaterial(color);
  if (opts?.transparent) {
    mat.transparent = true;
    mat.opacity = opts.opacity ?? 0.35;
    mat.depthWrite = false;
  }
  if (opts?.side !== undefined) mat.side = opts.side;
  applyCurvedWorld(mat, tier);
  return mat;
}

export function createInkOutline(opacity = 0.88): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: palette.ink,
    side: THREE.BackSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: true,
  });
}

export function createSketchLineMaterial(opacity = 0.62): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: palette.ink,
    transparent: true,
    opacity,
    linewidth: 1,
  });
}
