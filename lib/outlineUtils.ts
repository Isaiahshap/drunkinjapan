import * as THREE from 'three';

/** Compute inverted-hull scale for a target world-unit outline thickness. */
export function outlineScaleForThickness(
  geometry: THREE.BufferGeometry,
  thickness: number,
): number {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  return 1 + (thickness * 2) / maxDim;
}
