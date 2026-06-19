import type { TreePreset } from '@dgreenheck/ez-tree';
import { mainStreetExtensions } from './buildingFactory';

export type TreePresetName = keyof typeof TreePreset;

export type TreeLeafStyle = 'green' | 'pink';

export interface TreePlacement {
  x: number;
  z: number;
  preset: TreePresetName;
  seed: number;
  scale: number;
  rotation: number;
  leafStyle: TreeLeafStyle;
}

const LEFT_WALK = -3.15;
const RIGHT_WALK = 3.15;
const DEFAULT_DEPTH = 5;
const EXT_DEPTH = 6;

const STREET_PRESETS: TreePresetName[] = ['Oak Small', 'Aspen Small', 'Ash Small'];

type Footprint = { z: number; depth: number; side: 'left' | 'right' };

/** Core strip footprints — z centers only, matched to GrayboxStreet CORE_BUILDINGS. */
const CORE_FOOTPRINTS: Footprint[] = [
  { z: 0, depth: 5, side: 'left' },
  { z: -8, depth: 5, side: 'left' },
  { z: -17, depth: 5, side: 'left' },
  { z: -26, depth: 5, side: 'left' },
  { z: -34, depth: 5, side: 'left' },
  { z: -42, depth: 5, side: 'left' },
  { z: -50, depth: 5, side: 'left' },
  { z: -58, depth: 5, side: 'left' },
  { z: -66, depth: 5, side: 'left' },
  { z: -74, depth: 5, side: 'left' },
  { z: -82, depth: 5, side: 'left' },
  { z: -3, depth: 6, side: 'right' },
  { z: -12, depth: 6, side: 'right' },
  { z: -21, depth: 6, side: 'right' },
  { z: -36, depth: 6, side: 'right' },
  { z: -44, depth: 6, side: 'right' },
  { z: -52, depth: 6, side: 'right' },
  { z: -60, depth: 6, side: 'right' },
  { z: -68, depth: 6, side: 'right' },
  { z: -76, depth: 6, side: 'right' },
  { z: -84, depth: 6, side: 'right' },
];

function extensionFootprints(): Footprint[] {
  return mainStreetExtensions().map((spec) => ({
    z: spec.position[2],
    depth: spec.size[2],
    side: spec.side,
  }));
}

function allFootprints(): Footprint[] {
  return [...CORE_FOOTPRINTS, ...extensionFootprints()];
}

function footprintSpan(f: Footprint) {
  const half = f.depth / 2;
  return { minZ: f.z - half, maxZ: f.z + half };
}

function overlapsBuilding(z: number, side: 'left' | 'right', footprints: Footprint[], margin = 1.1) {
  return footprints.some((f) => {
    if (f.side !== side) return false;
    const { minZ, maxZ } = footprintSpan(f);
    return z > minZ - margin && z < maxZ + margin;
  });
}

function gapSlots(
  buildings: Footprint[],
  side: 'left' | 'right',
  zMax: number,
  zMin: number,
): number[] {
  const sorted = buildings
    .filter((b) => b.side === side)
    .sort((a, b) => b.z - a.z);

  const slots: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const upper = footprintSpan(sorted[i]);
    const lower = footprintSpan(sorted[i + 1]);
    const gapStart = upper.minZ;
    const gapEnd = lower.maxZ;
    const gapLen = gapStart - gapEnd;
    if (gapLen < 2.4) continue;

    const mid = (gapStart + gapEnd) / 2;
    if (mid <= zMax && mid >= zMin) slots.push(mid);

    if (gapLen > 9) {
      const thirdA = gapStart - gapLen * 0.32;
      const thirdB = gapEnd + gapLen * 0.32;
      if (thirdA <= zMax && thirdA >= zMin) slots.push(thirdA);
      if (thirdB <= zMax && thirdB >= zMin) slots.push(thirdB);
    }
  }

  const lead = sorted[0];
  if (lead) {
    const leadFront = footprintSpan(lead).maxZ + 2.2;
    if (leadFront <= zMax && leadFront >= zMin) slots.push(leadFront);
  }

  const tail = sorted[sorted.length - 1];
  if (tail) {
    const tailBack = footprintSpan(tail).minZ - 2.2;
    if (tailBack <= zMax && tailBack >= zMin) slots.push(tailBack);
  }

  return slots;
}

export function generateStreetTreePlacements(): TreePlacement[] {
  const footprints = allFootprints();
  const zMax = 9;
  const zMin = -128;
  let seed = 521;

  const leftSlots = gapSlots(footprints, 'left', zMax, zMin);
  const rightSlots = gapSlots(footprints, 'right', zMax, zMin);

  const trees: TreePlacement[] = [];

  const addTree = (side: 'left' | 'right', z: number) => {
    const x = side === 'left' ? LEFT_WALK : RIGHT_WALK;
    const jitter = ((seed % 5) - 2) * 0.22;
    const tz = z + jitter;
    if (overlapsBuilding(tz, side, footprints)) return;

    trees.push({
      x,
      z: tz,
      preset: STREET_PRESETS[seed % STREET_PRESETS.length],
      seed: seed++,
      scale: 0.14 + (seed % 4) * 0.012,
      rotation: (seed % 12) * 0.52,
      leafStyle: seed % 3 === 0 ? 'pink' : 'green',
    });
  };

  for (const z of leftSlots) addTree('left', z);
  for (const z of rightSlots) addTree('right', z);

  return trees;
}

export const STREET_TREE_PLACEMENTS = generateStreetTreePlacements();
