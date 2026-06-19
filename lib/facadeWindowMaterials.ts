import * as THREE from 'three';
import { palette } from './palette';
import { createPaintedMaterial } from './paintedMaterials';

/** Glowing yellow window shades — ~1 in 6 stays dark for contrast. */
const LIT_YELLOWS = [
  '#FFF0B8',
  '#FFE898',
  '#FFD870',
  '#FFE8A0',
  '#FFDA78',
  '#FFF8D8',
] as const;

const DOOR_YELLOWS = ['#FFF4D0', '#FFEAB0', '#FFE090'] as const;

const matCache = new Map<string, THREE.MeshBasicMaterial>();
const darkWindowMat = createPaintedMaterial(palette.windowDark);

function glowMat(color: string): THREE.MeshBasicMaterial {
  const cached = matCache.get(color);
  if (cached) return cached;
  const mat = new THREE.MeshBasicMaterial({
    color,
    toneMapped: false,
  });
  matCache.set(color, mat);
  return mat;
}

export function getWindowGlassMaterial(seed: number): THREE.MeshBasicMaterial {
  if (seed % 9 !== 0) return darkWindowMat;
  return glowMat(LIT_YELLOWS[seed % LIT_YELLOWS.length]);
}

export function getDoorGlassMaterial(seed: number): THREE.MeshBasicMaterial {
  return glowMat(DOOR_YELLOWS[seed % DOOR_YELLOWS.length]);
}
