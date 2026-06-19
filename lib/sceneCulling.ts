import * as THREE from 'three';

export const CULL = {
  facadeDetail: 36,
  signage: 48,
  groundSeams: 26,
  lamps: 40,
  trees: 38,
} as const;

/** Cheap proximity test for street props and facade detail. */
export function nearPlayer(
  px: number,
  pz: number,
  player: THREE.Vector3,
  radiusZ: number,
  radiusX = 13,
): boolean {
  return Math.abs(player.z - pz) < radiusZ && Math.abs(player.x - px) < radiusX;
}
