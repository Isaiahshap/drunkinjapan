export type FacadeStringSpec = {
  kind: 'facade';
  x: number;
  z0: number;
  z1: number;
  height: number;
  bulbs: number;
  seed: number;
};

export type SpanStringSpec = {
  kind: 'span';
  z: number;
  height: number;
  leftX: number;
  rightX: number;
  sag: number;
  bulbs: number;
  seed: number;
};

export type DrapeStringSpec = {
  kind: 'drape';
  z: number;
  height: number;
  leftX: number;
  rightX: number;
  sag: number;
  bulbs: number;
  seed: number;
};

export type StringLightSpec = FacadeStringSpec | SpanStringSpec | DrapeStringSpec;

/** Festoon lights — facade eaves, building-to-building spans, and street drapes. */
export const STRING_LIGHT_RUNS: StringLightSpec[] = [
  { kind: 'facade', x: -3.22, z0: -3, z1: 1.5, height: 5.1, bulbs: 7, seed: 11 },
  { kind: 'facade', x: 3.22, z0: -14, z1: -9, height: 5.4, bulbs: 6, seed: 23 },
  { kind: 'facade', x: -3.22, z0: -28, z1: -23, height: 5.2, bulbs: 6, seed: 37 },
  { kind: 'facade', x: 3.22, z0: -42, z1: -36, height: 5.5, bulbs: 7, seed: 41 },
  { kind: 'facade', x: -3.22, z0: -58, z1: -52, height: 5.3, bulbs: 6, seed: 53 },
  { kind: 'facade', x: 3.22, z0: -72, z1: -66, height: 5.6, bulbs: 7, seed: 67 },
  { kind: 'facade', x: -3.22, z0: -88, z1: -82, height: 5.2, bulbs: 6, seed: 79 },
  { kind: 'facade', x: 3.22, z0: -104, z1: -98, height: 5.4, bulbs: 7, seed: 91 },

  { kind: 'span', z: -12, height: 5.6, leftX: -3.05, rightX: 3.05, sag: 0.35, bulbs: 13, seed: 17 },
  { kind: 'span', z: -32, height: 5.8, leftX: -3.1, rightX: 3.1, sag: 0.4, bulbs: 14, seed: 29 },
  { kind: 'span', z: -48, height: 5.5, leftX: -3.05, rightX: 3.05, sag: 0.32, bulbs: 12, seed: 43 },
  { kind: 'span', z: -68, height: 5.7, leftX: -3.12, rightX: 3.12, sag: 0.38, bulbs: 14, seed: 61 },
  { kind: 'span', z: -92, height: 5.6, leftX: -3.08, rightX: 3.08, sag: 0.36, bulbs: 13, seed: 83 },
  { kind: 'span', z: -116, height: 5.5, leftX: -3.05, rightX: 3.05, sag: 0.34, bulbs: 12, seed: 97 },

  { kind: 'drape', z: -8, height: 4.9, leftX: -2.65, rightX: 2.65, sag: 1.05, bulbs: 11, seed: 13 },
  { kind: 'drape', z: -22, height: 4.7, leftX: -2.7, rightX: 2.7, sag: 1.2, bulbs: 12, seed: 31 },
  { kind: 'drape', z: -40, height: 4.85, leftX: -2.6, rightX: 2.6, sag: 1.15, bulbs: 11, seed: 47 },
  { kind: 'drape', z: -56, height: 4.75, leftX: -2.68, rightX: 2.68, sag: 1.25, bulbs: 12, seed: 59 },
  { kind: 'drape', z: -78, height: 4.8, leftX: -2.62, rightX: 2.62, sag: 1.1, bulbs: 11, seed: 71 },
  { kind: 'drape', z: -100, height: 4.7, leftX: -2.7, rightX: 2.7, sag: 1.18, bulbs: 12, seed: 89 },
  { kind: 'drape', z: -122, height: 4.85, leftX: -2.65, rightX: 2.65, sag: 1.08, bulbs: 11, seed: 101 },
];
