/** Seeded PRNG — stable jitter, no per-frame flicker. */
export function seededRandom(seed: number) {
  let s = Math.abs(Math.floor(seed)) % 2147483646 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type Point3 = [number, number, number];

export function jitteredLine(points: Point3[], jitter: number, seed: number): Point3[] {
  const rand = seededRandom(seed);
  return points.map(([x, y, z]) => [
    x + (rand() - 0.5) * jitter,
    y + (rand() - 0.5) * jitter,
    z + (rand() - 0.5) * jitter,
  ]);
}

export function handDrawnRect(
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  jitter: number,
  seed: number,
  closed = true,
): Point3[] {
  const hw = w / 2;
  const hh = h / 2;
  const corners: Point3[] = [
    [cx - hw, cy - hh, cz],
    [cx + hw, cy - hh, cz],
    [cx + hw, cy + hh, cz],
    [cx - hw, cy + hh, cz],
  ];
  const pts = jitteredLine(corners, jitter, seed);
  if (closed) pts.push(pts[0]);
  return pts;
}

export function handDrawnFacadeRect(
  faceX: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  jitter: number,
  seed: number,
): Point3[] {
  const hw = w / 2;
  const hh = h / 2;
  const corners: Point3[] = [
    [faceX, cy - hh, cz - hw],
    [faceX, cy - hh, cz + hw],
    [faceX, cy + hh, cz + hw],
    [faceX, cy + hh, cz - hw],
  ];
  const pts = jitteredLine(corners, jitter, seed);
  pts.push(pts[0]);
  return pts;
}

export function handDrawnFacadeDoor(
  faceX: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  jitter: number,
  seed: number,
): Point3[] {
  const hw = w / 2;
  return jitteredLine(
    [
      [faceX, cy, cz - hw],
      [faceX, cy + h, cz - hw],
      [faceX, cy + h, cz + hw],
      [faceX, cy, cz + hw],
    ],
    jitter,
    seed,
  );
}
