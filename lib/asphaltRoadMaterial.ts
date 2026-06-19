import * as THREE from 'three';
import { applyCurvedWorld, type CurveTier } from './curvedWorld';

export const ASPHALT_TEXTURE_PATHS = {
  map: '/Shingles_Asphalt_002_baseColor.jpg',
  normalMap: '/Shingles_Asphalt_002_normal.jpg',
  roughnessMap: '/Shingles_Asphalt_002_roughness.jpg',
  aoMap: '/Shingles_Asphalt_002_ambientOcclusion.jpg',
} as const;

/** Tile repeat tuned for ~5 m road width and long street planes. */
export const ASPHALT_TILE_REPEAT = { x: 5.5, y: 52 };

export interface AsphaltTextureSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  aoMap: THREE.Texture;
}

export function configureAsphaltTextures(textures: AsphaltTextureSet) {
  const { x, y } = ASPHALT_TILE_REPEAT;
  for (const tex of Object.values(textures)) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(x, y);
    tex.anisotropy = 4;
  }
  textures.map.colorSpace = THREE.SRGBColorSpace;
  return textures;
}

/** PBR asphalt with curved-world vertex bend — no displacement (avoids shadow artifacts). */
export function createCurvedAsphaltMaterial(
  textures: AsphaltTextureSet,
  tier: CurveTier = 'road',
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map: textures.map,
    normalMap: textures.normalMap,
    roughnessMap: textures.roughnessMap,
    aoMap: textures.aoMap,
    color: new THREE.Color('#b8b8b8'),
    roughness: 0.92,
    metalness: 0,
    normalScale: new THREE.Vector2(0.28, 0.28),
    aoMapIntensity: 0.55,
    emissive: new THREE.Color('#1a2228'),
    emissiveIntensity: 0.35,
  });
  mat.toneMapped = false;
  applyCurvedWorld(mat, tier);
  return mat;
}
