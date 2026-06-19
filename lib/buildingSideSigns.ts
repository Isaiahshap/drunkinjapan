import { neonPalette, type NeonSignVariant, type SecondarySignSpec } from '@/components/FacadeSignage';

const SIDE_LONG: Record<NeonSignVariant, [string, string, string, string]> = {
  kissaten: ['喫茶店', '珈琲通', 'コーヒー', '喫茶'],
  ramen: ['ラーメン', '味噌麺', '麺通', '味噌'],
  teahouse: ['茶館道', '抹茶店', '茶道', '抹茶'],
  izakaya: ['居酒屋', '酒場通', '営業中', '酒場'],
  yakitori: ['焼鳥店', '炭火通', '串焼', '炭火'],
  soba: ['蕎麦店', '手打麺', '味通', '手打'],
  konbini: ['商店街', '深夜店', '営業中', '商店'],
  gallery: ['画廊通', '展示会', '芸術', '展示'],
  slope: ['坂道街', '歩道通', '商店街', '坂道'],
};

const VERTICAL_TALL: Record<NeonSignVariant, string> = {
  kissaten: '珈琲店',
  ramen: '味噌麺',
  teahouse: '抹茶館',
  izakaya: '居酒屋',
  yakitori: '焼鳥店',
  soba: '手打蕎麦',
  konbini: '商店街',
  gallery: '画廊通',
  slope: '坂道通',
};

const VERTICAL_SHORT: Record<NeonSignVariant, string> = {
  kissaten: '茶',
  ramen: '麺',
  teahouse: '茶',
  izakaya: '酒',
  yakitori: '鳥',
  soba: '麦',
  konbini: '店',
  gallery: '画',
  slope: '坂',
};

const SIDE_COLORS: Record<NeonSignVariant, [string, string, string, string]> = {
  kissaten: [neonPalette.electricYellow, neonPalette.hotPink, neonPalette.neonCyan, neonPalette.warmCream],
  ramen: [neonPalette.ramenRed, neonPalette.electricYellow, neonPalette.warmCream, neonPalette.neonOrange],
  teahouse: [neonPalette.neonMagenta, neonPalette.neonCyan, neonPalette.hotPink, neonPalette.electricYellow],
  izakaya: [neonPalette.hotPink, neonPalette.neonOrange, neonPalette.neonCyan, neonPalette.electricYellow],
  yakitori: [neonPalette.neonOrange, neonPalette.electricYellow, neonPalette.warmCream, neonPalette.ramenRed],
  soba: [neonPalette.warmCream, neonPalette.neonTeal, neonPalette.neonCyan, neonPalette.electricYellow],
  konbini: [neonPalette.neonCyan, neonPalette.electricYellow, neonPalette.neonTeal, neonPalette.hotPink],
  gallery: [neonPalette.neonMagenta, neonPalette.neonCyan, neonPalette.hotPink, neonPalette.electricYellow],
  slope: [neonPalette.neonTeal, neonPalette.neonCyan, neonPalette.electricYellow, neonPalette.hotPink],
};

const ACCENT: string[] = [
  '歓迎', '営業中', '深夜', '手打', '炭火', '商店街', '坂道', '歩道', '珈琲', '抹茶', '酒場', '味噌',
];

const PROJECTING_LONG: Record<NeonSignVariant, string> = {
  kissaten: 'コーヒー',
  ramen: 'ラーメン',
  teahouse: '茶館',
  izakaya: '居酒屋',
  yakitori: '焼鳥',
  soba: '手打蕎麦',
  konbini: '商店街',
  gallery: '画廊',
  slope: '坂道通',
};

/** Neon on the +Z side wall — faces the player walking downhill. */
export function playerFacingSideSigns(
  variant: NeonSignVariant,
  lx: number,
  seed: number,
): SecondarySignSpec[] {
  const [a, b, c, d] = SIDE_LONG[variant];
  const [c1, c2, c3, c4] = SIDE_COLORS[variant];
  const n = seed % 3;
  const accent = ACCENT[(seed + n) % ACCENT.length];
  const accent2 = ACCENT[(seed + n + 4) % ACCENT.length];
  const tallVert = VERTICAL_TALL[variant];
  const shortVert = VERTICAL_SHORT[variant];
  const useTall = seed % 2 === 0;

  return [
    { kind: 'facadeBanner', wall: 'sideNear', lx, text: a, color: c1, cy: 3.1 + n * 0.1, cz: 0, lite: true },
    {
      kind: 'facadeVertical',
      wall: 'sideNear',
      lx: -lx * 0.55,
      text: useTall ? tallVert : b,
      color: c2,
      cy: useTall ? 4.55 : 4.45,
      cz: 0,
      lite: true,
      tall: useTall,
    },
    { kind: 'blade', wall: 'sideNear', lx: lx * 0.65, text: c, color: c3, cy: 2.5 + n * 0.08, cz: 0, lite: true },
    { kind: 'facadeBanner', wall: 'sideNear', lx: -lx * 0.25, text: d, color: c4, cy: 3.75, cz: 0, lite: true },
    { kind: 'blade', wall: 'sideNear', lx: -lx * 0.85, text: accent, color: c1, cy: 4.9, cz: 0, lite: true },
    {
      kind: 'facadeVertical',
      wall: 'sideNear',
      lx: lx * 0.35,
      text: useTall ? accent2 : shortVert,
      color: c2,
      cy: useTall ? 2.35 : 2.15,
      cz: 0,
      lite: true,
      tall: !useTall && accent2.length >= 3,
    },
  ];
}

/** Extra street-face signs projecting from the facade. */
export function playerFacingStreetSigns(
  variant: NeonSignVariant,
  side: 'left' | 'right',
  seed: number,
): SecondarySignSpec[] {
  const [a, b, c] = SIDE_LONG[variant];
  const [c1, c2, c3] = SIDE_COLORS[variant];
  const czNear = side === 'left' ? 1.55 : -1.75;
  const czFar = side === 'left' ? -1.35 : 1.55;
  const n = seed % 2;
  const tallVert = VERTICAL_TALL[variant];
  const projLong = PROJECTING_LONG[variant];

  return [
    {
      kind: 'projecting',
      text: seed % 3 === 0 ? projLong : a,
      color: c1,
      cy: 3.65 + n * 0.15,
      cz: czNear,
    },
    { kind: 'projecting', text: b, color: c2, cy: 2.75, cz: czFar },
    { kind: 'facadeBanner', text: c, color: c3, cy: 2.15 + n * 0.1, cz: 0, lite: true },
    { kind: 'blade', text: ACCENT[(seed + 2) % ACCENT.length], color: c1, cy: 4.15, cz: czNear * 0.6, lite: true },
    {
      kind: 'facadeVertical',
      text: tallVert,
      color: c2,
      cy: 4.95,
      cz: side === 'left' ? -0.55 : 0.55,
      tall: true,
    },
  ];
}
