import * as THREE from 'three';
import { curvedMaterialRegistry } from './curvedRegistry';

/** Per-surface tuning — adjust these to tune the whole diorama feel. */
export const CURVE_TUNING = {
  road:     { strength: 0.014, side: 0.0015 },
  sidewalk: { strength: 0.014, side: 0.0015 },
  curb:     { strength: 0.014, side: 0.0015 },
  prop:     { strength: 0.011, side: 0.0012 },
  building: { strength: 0.006, side: 0.0008 },
} as const;

/** Meters of vertical drop per meter traveled toward -Z (ahead). */
export const STREET_GRADE = 0.042;

export type CurveTier = keyof typeof CURVE_TUNING;

export interface CurvedWorldUniforms {
  uCurveCenter: THREE.IUniform<THREE.Vector3>;
  uCurveStrength: THREE.IUniform<number>;
  uSideCurveStrength: THREE.IUniform<number>;
  uStreetGrade: THREE.IUniform<number>;
}

const CURVE_VERTEX = /* glsl */`
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  float dz = worldPos.z - uCurveCenter.z;
  worldPos.y += dz * uStreetGrade;

  vec2 offset = worldPos.xz - uCurveCenter.xz;
  float radialDistance = length(offset);
  float curveAmount = radialDistance * radialDistance * uCurveStrength;
  worldPos.y -= curveAmount;

  float sideBend = radialDistance * radialDistance * uSideCurveStrength;
  if (radialDistance > 0.001) {
    vec2 dir = offset / radialDistance;
    worldPos.x -= dir.x * sideBend;
    worldPos.z -= dir.y * sideBend * 0.25;
  }

  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
`;

export function streetSlopeOffset(worldZ: number, centerZ: number): number {
  return (worldZ - centerZ) * STREET_GRADE;
}

export function applyCurvedWorld(
  material: THREE.Material,
  tier: CurveTier = 'road',
): CurvedWorldUniforms {
  const { strength, side } = CURVE_TUNING[tier];

  const uniforms: CurvedWorldUniforms = {
    uCurveCenter: { value: new THREE.Vector3() },
    uCurveStrength: { value: strength },
    uSideCurveStrength: { value: side },
    uStreetGrade: { value: STREET_GRADE },
  };

  const mat = material as THREE.Material & {
    onBeforeCompile?: (s: THREE.WebGLProgramParametersWithUniforms) => void;
    curvedUniforms?: CurvedWorldUniforms;
    curvedTier?: CurveTier;
  };

  mat.curvedTier = tier;
  mat.curvedUniforms = uniforms;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uCurveCenter: uniforms.uCurveCenter,
      uCurveStrength: uniforms.uCurveStrength,
      uSideCurveStrength: uniforms.uSideCurveStrength,
      uStreetGrade: uniforms.uStreetGrade,
    });

    shader.vertexShader = `
      uniform vec3 uCurveCenter;
      uniform float uCurveStrength;
      uniform float uSideCurveStrength;
      uniform float uStreetGrade;
      ${shader.vertexShader}
    `.replace('#include <project_vertex>', CURVE_VERTEX);
  };

  material.needsUpdate = true;
  curvedMaterialRegistry.push(material);
  return uniforms;
}

export function syncCurvedMaterials(
  materials: THREE.Material[],
  center: THREE.Vector3,
) {
  for (const mat of materials) {
    const u = (mat as THREE.Material & { curvedUniforms?: CurvedWorldUniforms }).curvedUniforms;
    if (u) u.uCurveCenter.value.copy(center);
  }
}

/** Match curved + sloped ground height (buildings/props sit here, not shader-bent). */
export function groundSurfaceY(
  worldX: number,
  worldZ: number,
  center: THREE.Vector3,
  baseY = 0.02,
  tier: CurveTier = 'sidewalk',
): number {
  const dx = worldX - center.x;
  const dz = worldZ - center.z;
  const r2 = dx * dx + dz * dz;
  return baseY + streetSlopeOffset(worldZ, center.z) - r2 * CURVE_TUNING[tier].strength;
}

/** Road surface height at a world point. */
export function roadSurfaceY(
  worldX: number,
  worldZ: number,
  center: THREE.Vector3,
  baseY = 0.01,
): number {
  return groundSurfaceY(worldX, worldZ, center, baseY, 'road');
}
