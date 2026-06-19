import * as THREE from 'three';
import { palette } from './palette';
import { applyCurvedWorld, type CurveTier } from './curvedWorld';

/** Flat unlit anime background surface — no lighting bands. */
export function createPaintedMaterial(
  color: string,
  opts?: { transparent?: boolean; opacity?: number; side?: THREE.Side },
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: opts?.side ?? THREE.FrontSide,
  });
}

/** Curved-world ground/walls with flat painted color. */
export function createCurvedPaintedMaterial(
  color: string,
  tier: CurveTier,
  opts?: { transparent?: boolean; opacity?: number },
): THREE.MeshBasicMaterial {
  const mat = createPaintedMaterial(color, {
    transparent: opts?.transparent,
    opacity: opts?.opacity,
    side: THREE.DoubleSide,
  });
  applyCurvedWorld(mat, tier);
  return mat;
}

export function createCurvedRoadMaterial(tier: CurveTier = 'road'): THREE.MeshBasicMaterial {
  return createCurvedPaintedMaterial(palette.road, tier);
}

export function createCurvedRoadMarkingMaterial(
  tier: CurveTier = 'road',
  opacity = 0.28,
): THREE.MeshBasicMaterial {
  return createCurvedPaintedMaterial(palette.roadMarking, tier, {
    transparent: true,
    opacity,
  });
}

/** Hand-placed facade shadow wash. */
export function createShadowWashMaterial(opacity = 0.08): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: palette.ink,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}
