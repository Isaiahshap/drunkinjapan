import { palette } from '@/lib/palette';
import { neonPalette, type NeonSignVariant, type SecondarySignSpec } from '@/components/FacadeSignage';

export interface BuildingSpec {
  position: [number, number, number];
  size: [number, number, number];
  extraTop?: number;
  color: string;
  side: 'left' | 'right';
  seed: number;
  door?: [number, number, number];
  awning?: boolean;
  pipe?: boolean;
  signage: NeonSignVariant;
  signPlacement: { cy: number; cz: number };
  secondarySigns?: SecondarySignSpec[];
  streetSpan?: {
    cy: number;
    cz: number;
    panels: {
      text: string;
      color: string;
      width?: number;
      height?: number;
      fontSize?: number;
      y?: number;
    }[];
  };
  utilityBox?: boolean;
  balcony?: boolean;
}

const VARIANTS: NeonSignVariant[] = [
  'kissaten', 'ramen', 'teahouse', 'izakaya', 'yakitori', 'soba', 'konbini', 'gallery', 'slope',
];

const COLORS = [
  palette.buildingRed,
  palette.buildingPink,
  palette.buildingIndigo,
  palette.buildingAmber,
  palette.buildingTerracotta,
  palette.buildingLavender,
  palette.buildingSage,
  palette.buildingCream,
  palette.mutedRed,
  palette.buildingGreen,
];

const SIGN_TEXT: Record<NeonSignVariant, { proj: string; vert: string; vertTall: string; banner: string }> = {
  kissaten: { proj: '喫茶', vert: '珈琲', vertTall: '珈琲店', banner: 'コーヒー' },
  ramen: { proj: 'ラーメン', vert: '味噌', vertTall: '味噌麺', banner: '麺通' },
  teahouse: { proj: '茶館', vert: '抹茶', vertTall: '抹茶館', banner: '茶' },
  izakaya: { proj: '居酒屋', vert: '酒場', vertTall: '居酒屋', banner: '営業中' },
  yakitori: { proj: '焼鳥', vert: '炭火', vertTall: '焼鳥店', banner: '鳥' },
  soba: { proj: '蕎麦', vert: '手打', vertTall: '手打蕎麦', banner: '味' },
  konbini: { proj: '商店', vert: '深夜', vertTall: '商店街', banner: '営業中' },
  gallery: { proj: '画廊', vert: '展示', vertTall: '画廊通', banner: '通' },
  slope: { proj: '坂道', vert: '坂', vertTall: '坂道通', banner: '道' },
};

const SIGN_COLORS: Record<NeonSignVariant, [string, string, string]> = {
  kissaten: [neonPalette.electricYellow, neonPalette.hotPink, neonPalette.neonCyan],
  ramen: [neonPalette.ramenRed, neonPalette.electricYellow, neonPalette.warmCream],
  teahouse: [neonPalette.neonMagenta, neonPalette.neonCyan, neonPalette.hotPink],
  izakaya: [neonPalette.hotPink, neonPalette.neonOrange, neonPalette.neonCyan],
  yakitori: [neonPalette.neonOrange, neonPalette.electricYellow, neonPalette.warmCream],
  soba: [neonPalette.warmCream, neonPalette.neonTeal, neonPalette.neonCyan],
  konbini: [neonPalette.neonCyan, neonPalette.electricYellow, neonPalette.neonTeal],
  gallery: [neonPalette.neonMagenta, neonPalette.neonCyan, neonPalette.hotPink],
  slope: [neonPalette.neonTeal, neonPalette.neonCyan, neonPalette.electricYellow],
};

function compactSideNeon(
  lx: number,
  textA: string,
  colorA: string,
  textB: string,
  colorB: string,
  tallB = false,
): SecondarySignSpec[] {
  return [
    { kind: 'blade', wall: 'sideNear', lx, text: textA, color: colorA, cy: 2.65, cz: 0, lite: true },
    {
      kind: 'facadeVertical',
      wall: 'sideFar',
      lx: -lx,
      text: textB,
      color: colorB,
      cy: tallB ? 3.85 : 3.7,
      cz: 0,
      lite: true,
      tall: tallB,
    },
  ];
}

function makePair(z: number, index: number, seedBase: number): BuildingSpec[] {
  const variant = VARIANTS[index % VARIANTS.length];
  const color = COLORS[index % COLORS.length];
  const altColor = COLORS[(index + 3) % COLORS.length];
  const copy = SIGN_TEXT[variant];
  const [c1, c2, c3] = SIGN_COLORS[variant];
  const seed = seedBase + index * 7;
  const lx = 0.68 + (index % 3) * 0.04;
  const leftX = -4.5 + (index % 3) * 0.1;
  const rightX = 4.5 - (index % 3) * 0.1;
  const czStreet = index % 2 === 0 ? 1.45 : -1.45;
  const czStreetR = index % 2 === 0 ? -1.75 : 1.75;
  const h = 4.8 + (index % 4) * 0.4;
  const hR = 5.0 + (index % 3) * 0.35;

  const left: BuildingSpec = {
    position: [leftX, 0, z],
    size: [2.3 + (index % 3) * 0.15, h, 5],
    extraTop: 1.1 + (index % 2) * 0.1,
    color,
    side: 'left',
    seed,
    door: [0.1, -1.45, 0.01],
    awning: index % 2 === 0,
    pipe: index % 4 === 1,
    signage: variant,
    signPlacement: { cy: 3.4 + (index % 3) * 0.2, cz: czStreet },
    secondarySigns: [
      { kind: 'projecting', text: copy.proj, color: c1, cy: 2.58, cz: -czStreet },
      {
        kind: 'facadeVertical',
        text: index % 2 === 0 ? copy.vertTall : copy.vert,
        color: c2,
        cy: 4.85,
        cz: czStreet,
        tall: index % 2 === 0,
      },
      { kind: 'facadeBanner', text: copy.banner, color: c3, cy: 2.05, cz: 0 },
      ...compactSideNeon(lx, copy.vert.slice(0, 1), c1, copy.vertTall, c1, true),
    ],
  };

  const right: BuildingSpec = {
    position: [rightX, 0, z],
    size: [2.5 + (index % 2) * 0.2, hR, 6],
    extraTop: 1.15 + (index % 2) * 0.1,
    color: altColor,
    side: 'right',
    seed: seed + 3,
    door: [0.0, -1.55, 0.01],
    awning: index % 2 === 1,
    pipe: index % 3 === 0,
    balcony: index % 5 === 1,
    signage: VARIANTS[(index + 4) % VARIANTS.length],
    signPlacement: { cy: 3.5 + (index % 2) * 0.15, cz: czStreetR },
    secondarySigns: [
      { kind: 'projecting', text: copy.banner, color: c3, cy: 2.55, cz: -czStreetR },
      {
        kind: 'facadeVertical',
        text: index % 2 === 1 ? copy.vertTall : copy.vert,
        color: c1,
        cy: 4.85,
        cz: czStreetR,
        tall: index % 2 === 1,
      },
      { kind: 'facadeBanner', text: copy.vert, color: c2, cy: 2.05, cz: 0 },
      ...compactSideNeon(lx, copy.proj.slice(0, 1), c1, copy.vertTall, c2, true),
    ],
  };

  return [left, right];
}

export function mainStreetExtensions(): BuildingSpec[] {
  const specs: BuildingSpec[] = [];
  for (let i = 0; i < 7; i++) {
    specs.push(...makePair(-92 - i * 8, i, 143));
  }
  return specs;
}
