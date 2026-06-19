import * as THREE from 'three';
import { palette } from './palette';

export function createToonRamp(bands = 4): THREE.DataTexture {
  const stops = [
    palette.roofShadow,
    palette.roadShadow,
    palette.buildingGray,
    palette.buildingCream,
  ];

  return buildRamp(stops, bands);
}

/** Road-only bands — stays within blue-gray asphalt, never drops to ink/roof black. */
export function createRoadToonRamp(bands = 3): THREE.DataTexture {
  const stops = [
    palette.roadShadow,
    palette.road,
    palette.roadHighlight,
  ];

  return buildRamp(stops, bands);
}

function buildRamp(stops: string[], bands: number): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * 3);

  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const band = Math.min(Math.floor(t * bands), bands - 1);
    const c = new THREE.Color(stops[band]);
    data[i * 3 + 0] = Math.round(c.r * 255);
    data[i * 3 + 1] = Math.round(c.g * 255);
    data[i * 3 + 2] = Math.round(c.b * 255);
  }

  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
