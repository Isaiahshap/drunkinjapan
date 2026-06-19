import { neonPalette } from '@/components/FacadeSignage';

export type SpanPanel = {
  text: string;
  color: string;
  width?: number;
  height?: number;
  fontSize?: number;
  y?: number;
  x?: number;
  flicker?: boolean;
  flickerSeed?: number;
};

export type RoadSpanSpec = {
  z: number;
  height: number;
  panels: SpanPanel[];
};

export type SidewalkSignSpec = {
  x: number;
  z: number;
  text: string;
  color: string;
  height?: number;
  flicker?: boolean;
  flickerSeed?: number;
};

const C = neonPalette;

/** Overhead neon spanning the road — faces the player. */
export const ROAD_SPANS: RoadSpanSpec[] = [
  {
    z: -4,
    height: 5.2,
    panels: [
      { text: '雨の夜・商店街へようこそ', color: C.neonCyan, width: 5.2, height: 0.68, fontSize: 0.25, y: 0.26, flicker: true, flickerSeed: 3 },
      { text: '坂道通り・深夜営業・立ち飲み・酒場', color: C.neonTeal, width: 5.0, height: 0.6, fontSize: 0.19, y: -0.46 },
    ],
  },
  {
    z: -16,
    height: 5.1,
    panels: [
      { text: '夜の街へ歓迎光臨', color: C.hotPink, width: 4.6, height: 0.66, fontSize: 0.24, y: 0.24 },
      { text: '下町商店街・中華・焼鳥・酒場・串焼', color: C.electricYellow, width: 5.2, height: 0.6, fontSize: 0.19, y: -0.46, flicker: true, flickerSeed: 11 },
    ],
  },
  {
    z: -28,
    height: 5.25,
    panels: [
      { text: '深夜ラーメン横丁', color: C.ramenRed, width: 4.4, height: 0.66, fontSize: 0.24, y: 0.26, flicker: true, flickerSeed: 7 },
      { text: '味噌・塩・醤油・餃子・炒飯・定食', color: C.neonOrange, width: 5.1, height: 0.6, fontSize: 0.19, y: -0.48 },
    ],
  },
  {
    z: -40,
    height: 5.05,
    panels: [
      { text: '居酒屋通り・炭火焼鳥・刺身', color: C.hotPink, width: 4.8, height: 0.66, fontSize: 0.23, y: 0.24 },
      { text: '生ビール・宴会歓迎・深夜営業', color: C.neonOrange, width: 5.0, height: 0.6, fontSize: 0.19, y: -0.46, flicker: true, flickerSeed: 19 },
    ],
  },
  {
    z: -52,
    height: 5.15,
    panels: [
      { text: '珈琲通り・喫茶・甘味・紅茶', color: C.warmCream, width: 4.8, height: 0.64, fontSize: 0.22, y: 0.26, flicker: true, flickerSeed: 23 },
      { text: '昭和通り・手打蕎麦・抹茶・うどん', color: C.neonMagenta, width: 5.1, height: 0.6, fontSize: 0.19, y: -0.48 },
    ],
  },
  {
    z: -64,
    height: 5.1,
    panels: [
      { text: '文化街・画廊通り・展示会', color: C.neonMagenta, width: 4.6, height: 0.64, fontSize: 0.22, y: 0.24 },
      { text: '歩道安全第一・展示会開催中', color: C.neonTeal, width: 5.2, height: 0.6, fontSize: 0.19, y: -0.46, flicker: true, flickerSeed: 31 },
    ],
  },
  {
    z: -76,
    height: 5.2,
    panels: [
      { text: '坂道商店街・味噌ラーメン', color: C.neonCyan, width: 5.0, height: 0.66, fontSize: 0.23, y: 0.26, flicker: true, flickerSeed: 37 },
      { text: 'とんかつ・定食・牛丼・豚汁・カレー', color: C.ramenRed, width: 5.2, height: 0.6, fontSize: 0.19, y: -0.48 },
    ],
  },
  {
    z: -88,
    height: 5.25,
    panels: [
      { text: '夜の街・雨宿り歓迎', color: C.hotPink, width: 4.4, height: 0.66, fontSize: 0.24, y: 0.24, flicker: true, flickerSeed: 41 },
      { text: '商店街へようこそ・駅前通り・歓迎', color: C.neonCyan, width: 5.2, height: 0.62, fontSize: 0.2, y: -0.48 },
    ],
  },
  {
    z: -100,
    height: 5.05,
    panels: [
      { text: '手打蕎麦・天ぷら・うどん・そば', color: C.warmCream, width: 5.1, height: 0.64, fontSize: 0.22, y: 0.26 },
      { text: '抹茶喫茶・紅茶・軽食・甘味処', color: C.neonTeal, width: 4.8, height: 0.6, fontSize: 0.19, y: -0.46, flicker: true, flickerSeed: 53 },
    ],
  },
  {
    z: -112,
    height: 5.15,
    panels: [
      { text: '下町歓迎・居酒屋通り・酒場', color: C.electricYellow, width: 4.8, height: 0.66, fontSize: 0.23, y: 0.24, flicker: true, flickerSeed: 59 },
      { text: '炭火串焼・酒・肴・深夜食堂・宴会', color: C.hotPink, width: 5.2, height: 0.6, fontSize: 0.19, y: -0.48 },
    ],
  },
  {
    z: -124,
    height: 5.1,
    panels: [
      { text: '画廊通り・坂道通り・文化街', color: C.neonMagenta, width: 4.8, height: 0.64, fontSize: 0.22, y: 0.26 },
      { text: '雨の夜の商店街・またお越しください', color: C.neonCyan, width: 5.3, height: 0.62, fontSize: 0.2, y: -0.48, flicker: true, flickerSeed: 67 },
    ],
  },
];

/** Neon kanban projecting from sidewalk posts toward the road. */
export const SIDEWALK_SIGNS: SidewalkSignSpec[] = [
  { x: -3.18, z: -6, text: 'ラーメン', color: C.ramenRed, height: 3.05 },
  { x: 3.18, z: -10, text: '喫茶店', color: C.electricYellow, height: 3.2 },
  { x: -3.18, z: -14, text: '居酒屋', color: C.hotPink, height: 2.95 },
  { x: 3.18, z: -18, text: '焼鳥', color: C.neonOrange, height: 3.1 },
  { x: -3.18, z: -22, text: '蕎麦', color: C.warmCream, height: 3.15 },
  { x: 3.18, z: -26, text: '抹茶', color: C.neonTeal, height: 2.9 },
  { x: -3.18, z: -30, text: '商店', color: C.neonCyan, height: 3.25 },
  { x: 3.18, z: -34, text: '画廊', color: C.neonMagenta, height: 3.0 },
  { x: -3.18, z: -38, text: '坂道', color: C.neonTeal, height: 3.1 },
  { x: 3.18, z: -42, text: '珈琲', color: C.warmCream, height: 3.2 },
  { x: -3.18, z: -46, text: '酒場', color: C.hotPink, height: 2.95 },
  { x: 3.18, z: -50, text: '炭火', color: C.neonOrange, height: 3.05 },
  { x: -3.18, z: -54, text: '手打', color: C.electricYellow, height: 3.15 },
  { x: 3.18, z: -58, text: '味噌', color: C.ramenRed, height: 2.9 },
  { x: -3.18, z: -62, text: '歓迎', color: C.neonCyan, height: 3.0 },
  { x: 3.18, z: -66, text: '喫茶', color: C.electricYellow, height: 3.2 },
  { x: -3.18, z: -70, text: '串焼', color: C.neonOrange, height: 3.05 },
  { x: 3.18, z: -74, text: '茶館', color: C.neonMagenta, height: 2.95 },
  { x: -3.18, z: -78, text: '深夜', color: C.hotPink, height: 3.1 },
  { x: 3.18, z: -82, text: '展示', color: C.neonMagenta, height: 3.0 },
  { x: -3.18, z: -86, text: '通り', color: C.neonTeal, height: 3.15 },
  { x: 3.18, z: -90, text: 'ラーメン', color: C.ramenRed, height: 3.05 },
  { x: -3.18, z: -94, text: '商店街', color: C.neonCyan, height: 3.2 },
  { x: 3.18, z: -98, text: '居酒屋', color: C.hotPink, height: 2.9 },
  { x: -3.18, z: -102, text: '焼鳥', color: C.neonOrange, height: 3.1 },
  { x: 3.18, z: -106, text: '蕎麦', color: C.warmCream, height: 3.0 },
  { x: -3.18, z: -110, text: '坂道', color: C.neonTeal, height: 3.15 },
  { x: 3.18, z: -114, text: '珈琲', color: C.warmCream, height: 3.05 },
  { x: -3.18, z: -118, text: '画廊', color: C.neonMagenta, height: 2.95 },
  { x: 3.18, z: -122, text: '抹茶', color: C.neonTeal, height: 3.1 },
];
