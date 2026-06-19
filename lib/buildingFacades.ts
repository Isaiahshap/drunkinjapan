export type SignWall = 'street' | 'sideNear' | 'sideFar';

export interface WindowSlot {
  wall: SignWall;
  /** Street facade: z along depth. Side walls: unused (use lx). */
  cz: number;
  /** Side walls: x along width. Street facade: unused. */
  lx: number;
  cy: number;
  w: number;
  h: number;
}

export interface SideSignSlot {
  wall: 'sideNear' | 'sideFar';
  text: string;
  color: string;
  cy: number;
  lx: number;
  kind: 'facadeVertical' | 'facadeBanner' | 'blade';
}

const ROW_HEIGHTS = [2.55, 3.7, 4.85, 6.0] as const;
const WIN_W = 0.44;
const WIN_H = 0.56;

function streetColumns(depth: number) {
  const inset = depth * 0.3;
  return [-inset, 0, inset] as const;
}

function sideColumns(width: number) {
  const inset = width * 0.28;
  return [-inset, inset] as const;
}

/** Regular grid windows on street face + both depth sides. */
export function buildWindowGrid(
  width: number,
  depth: number,
  totalHeight: number,
  doorCz?: number,
): WindowSlot[] {
  const rows = ROW_HEIGHTS.filter((cy) => cy < totalHeight - 0.3);
  const slots: WindowSlot[] = [];
  const streetCols = streetColumns(depth);
  const sideCols = sideColumns(width);

  for (const cy of rows) {
    for (const cz of streetCols) {
      if (doorCz !== undefined && cy < 2.7 && Math.abs(cz - doorCz) < 0.4) continue;
      slots.push({ wall: 'street', cz, lx: 0, cy, w: WIN_W, h: WIN_H });
    }
  }

  const sideRows = rows.slice(1);
  for (const cy of sideRows) {
    for (const lx of sideCols) {
      slots.push({ wall: 'sideNear', cz: 0, lx, cy, w: WIN_W * 0.88, h: WIN_H });
      slots.push({ wall: 'sideFar', cz: 0, lx, cy, w: WIN_W * 0.88, h: WIN_H });
    }
  }

  return slots;
}
