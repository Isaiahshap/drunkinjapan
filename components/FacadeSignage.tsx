'use client';
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { SignGlowOrb } from './NeonGlowOrb';
import type { SignWall } from '@/lib/buildingFacades';

export const neonPalette = {
  hotPink: '#FF2D78',
  ramenRed: '#FF2818',
  electricYellow: '#FFF018',
  neonTeal: '#18FFE8',
  neonCyan: '#30FFF8',
  warmCream: '#FFF8E0',
  deepInk: '#141C22',
  neonMagenta: '#FF40E8',
  neonOrange: '#FF9028',
} as const;

const JP_FONT =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.8/files/noto-sans-jp-japanese-700-normal.woff';

const JP_CHARS = 'ラーメン喫茶店味坂道麺通コーヒー茶館居酒屋酒営業中焼鳥蕎麦商店画廊珈琲味噌歩道抹茶酒場炭火串焼深夜手打展示喫茶茶鳥道通画館屋商店珈琲歓迎橋へようこそ通り下町夜の街戻りループ芸術会温安全昭和文化横丁麦';

export type NeonSignVariant =
  | 'kissaten'
  | 'ramen'
  | 'slope'
  | 'teahouse'
  | 'izakaya'
  | 'yakitori'
  | 'soba'
  | 'konbini'
  | 'gallery';

export type SecondarySignKind =
  | 'blade'
  | 'banner'
  | 'floorTag'
  | 'projecting'
  | 'facadeVertical'
  | 'facadeBanner';

export interface SecondarySignSpec {
  kind: SecondarySignKind;
  text: string;
  color: string;
  cy: number;
  cz: number;
  wall?: SignWall;
  lx?: number;
  lite?: boolean;
  /** Taller narrow panel for multi-character vertical copy. */
  tall?: boolean;
}

export interface SignPlacement {
  cy: number;
  cz: number;
}

function shouldFlickerMaterial(mat: THREE.Material) {
  const troika = mat as THREE.Material & { fillOpacity?: number };
  if (troika.fillOpacity !== undefined) return true;
  if (!(mat instanceof THREE.MeshBasicMaterial)) return false;
  return mat.transparent || mat.blending === THREE.AdditiveBlending;
}

function primeFlickerMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!shouldFlickerMaterial(mat)) continue;
      if ('opacity' in mat && mat.userData.baseOpacity === undefined) {
        mat.userData.baseOpacity = mat.opacity;
      }
      const troika = mat as THREE.MeshBasicMaterial & {
        fillOpacity?: number;
        outlineOpacity?: number;
      };
      if (troika.fillOpacity !== undefined && mat.userData.baseFillOpacity === undefined) {
        mat.userData.baseFillOpacity = troika.fillOpacity;
      }
      if (troika.outlineOpacity !== undefined && mat.userData.baseOutlineOpacity === undefined) {
        mat.userData.baseOutlineOpacity = troika.outlineOpacity;
      }
    }
  });
}

function applyFlickerMaterials(root: THREE.Object3D, intensity: number) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!shouldFlickerMaterial(mat)) continue;
      if ('opacity' in mat && mat.userData.baseOpacity !== undefined) {
        mat.opacity = mat.userData.baseOpacity * intensity;
      }
      const troika = mat as THREE.MeshBasicMaterial & {
        fillOpacity?: number;
        outlineOpacity?: number;
      };
      if (troika.fillOpacity !== undefined && mat.userData.baseFillOpacity !== undefined) {
        troika.fillOpacity = mat.userData.baseFillOpacity * intensity;
      }
      if (troika.outlineOpacity !== undefined && mat.userData.baseOutlineOpacity !== undefined) {
        troika.outlineOpacity = mat.userData.baseOutlineOpacity * intensity;
      }
      mat.needsUpdate = true;
    }
  });
}

/** Broken-neon intensity — buzzy drops with occasional hard cuts. */
export function neonFlickerIntensity(t: number, seed: number): number {
  const pulse = Math.sin(t * 37 + seed * 1.9) * Math.sin(t * 13.4 + seed * 0.7);
  const slot = Math.sin(Math.floor(t * 24 + seed) * 12.9898) * 43758.5453;
  const r = slot - Math.floor(slot);
  if (r < 0.05) return 0.06;
  if (r < 0.08) return 0.28;
  if (r < 0.1) return 0.04;
  if (pulse < -0.68) return 0.22 + (Math.sin(t * 95 + seed) * 0.5 + 0.5) * 0.3;
  return 0.9 + pulse * 0.1;
}

function neonMat(color: string, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
  });
}

function NeonText({
  children,
  position,
  fontSize,
  color,
  outlineColor = neonPalette.deepInk,
  lite = false,
}: {
  children: string;
  position: [number, number, number];
  fontSize: number;
  color: string;
  outlineColor?: string;
  lite?: boolean;
}) {
  const glowZ = position[2] - 0.018;
  return (
    <>
      {!lite && (
        <Text
          font={JP_FONT}
          fontSize={fontSize * 1.2}
          color={color}
          fillOpacity={0.22}
          outlineWidth={fontSize * 0.32}
          outlineColor={color}
          outlineOpacity={0.7}
          anchorX="center"
          anchorY="middle"
          position={[position[0], position[1], glowZ]}
          characters={JP_CHARS}
          material-toneMapped={false}
          renderOrder={11}
        >
          {children}
        </Text>
      )}
      <Text
        font={JP_FONT}
        fontSize={fontSize}
        color={color}
        outlineWidth={fontSize * 0.06}
        outlineColor={outlineColor}
        outlineOpacity={0.9}
        anchorX="center"
        anchorY="middle"
        position={position}
        characters={JP_CHARS}
        material-toneMapped={false}
        renderOrder={13}
      >
        {children}
      </Text>
      {!lite && (
        <Text
          font={JP_FONT}
          fontSize={fontSize * 0.92}
          color="#FFFFFF"
          fillOpacity={0.55}
          anchorX="center"
          anchorY="middle"
          position={[position[0], position[1], position[2] + 0.006]}
          characters={JP_CHARS}
          material-toneMapped={false}
          renderOrder={14}
        >
          {children}
        </Text>
      )}
    </>
  );
}

function NeonBorder({
  width,
  height,
  depth = 0.06,
  color = neonPalette.deepInk,
}: {
  width: number;
  height: number;
  depth?: number;
  color?: string;
}) {
  const mat = useMemo(() => neonMat(color), [color]);
  const t = 0.045;
  return (
    <group>
      <mesh material={mat} position={[0, height / 2 + t / 2, 0]}>
        <boxGeometry args={[width + t * 2, t, depth]} />
      </mesh>
      <mesh material={mat} position={[0, -height / 2 - t / 2, 0]}>
        <boxGeometry args={[width + t * 2, t, depth]} />
      </mesh>
      <mesh material={mat} position={[-width / 2 - t / 2, 0, 0]}>
        <boxGeometry args={[t, height, depth]} />
      </mesh>
      <mesh material={mat} position={[width / 2 + t / 2, 0, 0]}>
        <boxGeometry args={[t, height, depth]} />
      </mesh>
    </group>
  );
}

function VerticalNeonText({
  text,
  position,
  fontSize,
  color,
  spacing,
}: {
  text: string;
  position: [number, number, number];
  fontSize: number;
  color: string;
  spacing: number;
}) {
  const chars = [...text];
  const startY = position[1] + ((chars.length - 1) * spacing) / 2;
  return (
    <>
      {chars.map((char, i) => (
        <NeonText
          key={`${char}-${i}`}
          position={[position[0], startY - i * spacing, position[2]]}
          fontSize={fontSize}
          color={color}
        >
          {char}
        </NeonText>
      ))}
    </>
  );
}

export interface BuildingNeonSignProps {
  variant: NeonSignVariant;
  faceX: number;
  rotY: number;
  side: 'left' | 'right';
  placement: SignPlacement;
}

function signOutset(side: 'left' | 'right') {
  return side === 'left' ? 0.05 : -0.05;
}

const PROJECTING_PANEL_Z = -Math.PI / 2;

/** Kissaten — big warm yellow neon 喫茶店 */
function KissatenNeon() {
  const boardMat = useMemo(() => neonMat('#2A2208', 0.92), []);
  const accentMat = useMemo(() => neonMat(neonPalette.hotPink), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.electricYellow} width={1.45} height={0.72} />
      <NeonBorder width={1.45} height={0.72} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[1.45, 0.72, 0.05]} />
      </mesh>
      <mesh material={accentMat} position={[0, -0.28, 0.04]} renderOrder={11}>
        <boxGeometry args={[1.2, 0.06, 0.02]} />
      </mesh>
      <NeonText position={[0, 0.06, 0.07]} fontSize={0.22} color={neonPalette.electricYellow}>
        喫茶店
      </NeonText>
      <NeonText position={[0, -0.28, 0.07]} fontSize={0.09} color={neonPalette.neonCyan}>
        コーヒー
      </NeonText>
    </group>
  );
}

/** Ramen — large red neon ラーメン with bowl graphic */
function RamenNeon() {
  const boardMat = useMemo(() => neonMat('#2A0C08', 0.92), []);
  const bowlMat = useMemo(() => neonMat(neonPalette.warmCream), []);
  const noodleMat = useMemo(() => neonMat(neonPalette.electricYellow), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.ramenRed} width={1.55} height={0.82} />
      <NeonBorder width={1.55} height={0.82} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[1.55, 0.82, 0.055]} />
      </mesh>
      <mesh
        material={bowlMat}
        position={[-0.42, -0.08, 0.05]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={11}
      >
        <cylinderGeometry args={[0.18, 0.14, 0.06, 12, 1, false, 0, Math.PI]} />
      </mesh>
      <mesh material={noodleMat} position={[-0.42, 0.02, 0.07]} renderOrder={11}>
        <boxGeometry args={[0.22, 0.025, 0.015]} />
      </mesh>
      <mesh material={noodleMat} position={[-0.38, 0.0, 0.07]} renderOrder={11}>
        <boxGeometry args={[0.18, 0.02, 0.015]} />
      </mesh>
      <mesh material={neonMat(neonPalette.warmCream, 0.9)} position={[-0.44, 0.28, 0.07]} renderOrder={11}>
        <boxGeometry args={[0.02, 0.14, 0.012]} />
      </mesh>
      <mesh material={neonMat(neonPalette.warmCream, 0.9)} position={[-0.36, 0.32, 0.07]} renderOrder={11}>
        <boxGeometry args={[0.018, 0.12, 0.012]} />
      </mesh>
      <NeonText position={[0.32, 0.04, 0.08]} fontSize={0.26} color={neonPalette.warmCream}>
        ラーメン
      </NeonText>
    </group>
  );
}

/** Slope / bridge area — teal neon 坂道 */
function SlopeNeon() {
  const tealMat = useMemo(() => neonMat('#0A2828', 0.9), []);
  const creamMat = useMemo(() => neonMat('#1A1810', 0.9), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.neonTeal} width={1.5} height={0.58} />
      <NeonBorder width={1.5} height={0.58} />
      <mesh material={tealMat} position={[-0.36, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.72, 0.58, 0.05]} />
      </mesh>
      <mesh material={creamMat} position={[0.36, 0, 0.03]} renderOrder={11}>
        <boxGeometry args={[0.72, 0.58, 0.05]} />
      </mesh>
      <NeonText position={[-0.36, 0, 0.08]} fontSize={0.28} color={neonPalette.neonTeal}>
        坂
      </NeonText>
      <NeonText position={[0.36, 0, 0.08]} fontSize={0.28} color={neonPalette.electricYellow}>
        道
      </NeonText>
      <NeonText position={[0, -0.34, 0.08]} fontSize={0.1} color={neonPalette.neonCyan}>
        坂道
      </NeonText>
    </group>
  );
}

/** Teahouse — vertical magenta/cyan 茶館 */
function TeahouseNeon() {
  const panelMat = useMemo(() => neonMat('#1E0820', 0.9), []);
  const bracketMat = useMemo(() => neonMat(neonPalette.deepInk), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.neonMagenta} width={0.38} height={1.55} />
      <mesh material={bracketMat} position={[0, 0.92, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.42, 0.07, 0.06]} />
      </mesh>
      <NeonBorder width={0.38} height={1.55} />
      <mesh material={panelMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.38, 1.55, 0.05]} />
      </mesh>
      <VerticalNeonText
        text="茶館"
        position={[0, 0, 0.08]}
        fontSize={0.2}
        color={neonPalette.neonMagenta}
        spacing={0.22}
      />
    </group>
  );
}

/** Izakaya — tall vertical pink neon 居酒屋 */
function IzakayaNeon() {
  const panelMat = useMemo(() => neonMat('#200810', 0.9), []);
  const accentMat = useMemo(() => neonMat(neonPalette.neonOrange), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.hotPink} width={0.42} height={1.75} />
      <mesh material={accentMat} position={[0, 1.02, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.48, 0.08, 0.06]} />
      </mesh>
      <NeonBorder width={0.42} height={1.75} />
      <mesh material={panelMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.42, 1.75, 0.055]} />
      </mesh>
      <VerticalNeonText
        text="居酒屋"
        position={[0, 0.05, 0.08]}
        fontSize={0.19}
        color={neonPalette.hotPink}
        spacing={0.2}
      />
      <NeonText position={[0, -0.72, 0.08]} fontSize={0.14} color={neonPalette.electricYellow}>
        酒
      </NeonText>
    </group>
  );
}

/** Yakitori — warm orange 焼鳥 */
function YakitoriNeon() {
  const boardMat = useMemo(() => neonMat('#281408', 0.9), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.neonOrange} width={1.35} height={0.68} />
      <NeonBorder width={1.35} height={0.68} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[1.35, 0.68, 0.05]} />
      </mesh>
      <NeonText position={[0, 0.04, 0.07]} fontSize={0.24} color={neonPalette.neonOrange}>
        焼鳥
      </NeonText>
      <NeonText position={[0, -0.22, 0.07]} fontSize={0.09} color={neonPalette.electricYellow}>
        串焼
      </NeonText>
    </group>
  );
}

/** Soba — cream horizontal 蕎麦 */
function SobaNeon() {
  const boardMat = useMemo(() => neonMat('#1A1A10', 0.9), []);
  const stripeMat = useMemo(() => neonMat(neonPalette.neonTeal, 0.85), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.warmCream} width={1.42} height={0.7} />
      <NeonBorder width={1.42} height={0.7} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[1.42, 0.7, 0.05]} />
      </mesh>
      <mesh material={stripeMat} position={[-0.52, 0, 0.04]} renderOrder={11}>
        <boxGeometry args={[0.06, 0.48, 0.02]} />
      </mesh>
      <NeonText position={[0.12, 0.04, 0.07]} fontSize={0.25} color={neonPalette.warmCream}>
        蕎麦
      </NeonText>
      <NeonText position={[0.12, -0.22, 0.07]} fontSize={0.09} color={neonPalette.neonCyan}>
        手打
      </NeonText>
    </group>
  );
}

/** Konbini — compact cyan 商店 */
function KonbiniNeon() {
  const boardMat = useMemo(() => neonMat('#081820', 0.9), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.neonCyan} width={1.28} height={0.62} />
      <NeonBorder width={1.28} height={0.62} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[1.28, 0.62, 0.05]} />
      </mesh>
      <NeonText position={[0, 0.05, 0.07]} fontSize={0.22} color={neonPalette.neonCyan}>
        商店
      </NeonText>
      <NeonText position={[0, -0.2, 0.07]} fontSize={0.08} color={neonPalette.electricYellow}>
        深夜
      </NeonText>
    </group>
  );
}

/** Gallery — vertical magenta 画廊 */
function GalleryNeon() {
  const panelMat = useMemo(() => neonMat('#180818', 0.9), []);
  return (
    <group>
      <SignGlowOrb color={neonPalette.neonMagenta} width={0.36} height={1.35} />
      <NeonBorder width={0.36} height={1.35} />
      <mesh material={panelMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.36, 1.35, 0.05]} />
      </mesh>
      <VerticalNeonText
        text="画廊"
        position={[0, 0, 0.08]}
        fontSize={0.18}
        color={neonPalette.neonMagenta}
        spacing={0.2}
      />
    </group>
  );
}

function BladeSign({ text, color, lite = false }: { text: string; color: string; lite?: boolean }) {
  const boardMat = useMemo(() => neonMat('#141820', 0.88), []);
  const bracketMat = useMemo(() => neonMat(neonPalette.deepInk), []);
  const chars = [...text];
  const h = Math.max(0.52, chars.length * 0.2 + 0.16);
  const w = 0.24;
  const arm = 0.36;
  return (
    <group>
      <mesh material={bracketMat} position={[0, -0.04, arm / 2]} renderOrder={10}>
        <boxGeometry args={[0.04, 0.04, arm]} />
      </mesh>
      <group position={[0, 0, arm + 0.04]} rotation={[0, 0, PROJECTING_PANEL_Z]}>
        <SignGlowOrb color={color} width={w} height={h} lite={lite} />
        <NeonBorder width={w} height={h} depth={0.035} />
        <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
          <boxGeometry args={[w, h, 0.035]} />
        </mesh>
        <VerticalNeonText
          text={text}
          position={[0, 0, 0.05]}
          fontSize={0.11}
          color={color}
          spacing={0.15}
        />
      </group>
    </group>
  );
}

function BannerSign({ text, color, lite = false }: { text: string; color: string; lite?: boolean }) {
  const boardMat = useMemo(() => neonMat('#141820', 0.88), []);
  const w = Math.max(0.55, text.length * 0.14 + 0.28);
  const h = 0.18;
  return (
    <group>
      <SignGlowOrb color={color} width={w} height={h} lite={lite} />
      <NeonBorder width={w} height={h} depth={0.035} />
      <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
        <boxGeometry args={[w, h, 0.035]} />
      </mesh>
      <NeonText position={[0, 0, 0.05]} fontSize={0.09} color={color}>
        {text}
      </NeonText>
    </group>
  );
}

function FloorTagSign({ text, color, lite = false }: { text: string; color: string; lite?: boolean }) {
  const boardMat = useMemo(() => neonMat('#101418', 0.86), []);
  const w = 0.16;
  const h = 0.32;
  return (
    <group position={[0, 0, 0.03]}>
      <SignGlowOrb color={color} width={w} height={h} lite={lite} />
      <NeonBorder width={w} height={h} depth={0.03} />
      <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
        <boxGeometry args={[w, h, 0.03]} />
      </mesh>
      <NeonText position={[0, 0, 0.05]} fontSize={0.075} color={color}>
        {text}
      </NeonText>
    </group>
  );
}

/** Horizontal kanban on bracket — protrudes from the facade. */
function ProjectingKanban({ text, color, lite = false }: { text: string; color: string; lite?: boolean }) {
  const boardMat = useMemo(() => neonMat('#141820', 0.9), []);
  const bracketMat = useMemo(() => neonMat(neonPalette.deepInk), []);
  const w = Math.max(0.8, text.length * 0.17 + 0.36);
  const h = 0.32;
  const arm = 0.38;
  return (
    <group>
      <mesh material={bracketMat} position={[0, -0.05, arm / 2]} renderOrder={10}>
        <boxGeometry args={[0.05, 0.04, arm]} />
      </mesh>
      <mesh material={bracketMat} position={[0, -0.07, 0.06]} renderOrder={10}>
        <boxGeometry args={[0.09, 0.035, 0.08]} />
      </mesh>
      <group position={[0, 0, arm + 0.05]} rotation={[0, 0, PROJECTING_PANEL_Z]}>
        <SignGlowOrb color={color} width={w} height={h} lite={lite} />
        <NeonBorder width={w} height={h} depth={0.04} />
        <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
          <boxGeometry args={[w, h, 0.04]} />
        </mesh>
        <NeonText position={[0, 0, 0.06]} fontSize={0.12} color={color}>
          {text}
        </NeonText>
      </group>
    </group>
  );
}

/** Vertical strip mounted flush on the facade — scales up for longer copy. */
function FacadeVerticalSign({
  text,
  color,
  lite = false,
  tall = false,
}: {
  text: string;
  color: string;
  lite?: boolean;
  tall?: boolean;
}) {
  const boardMat = useMemo(() => neonMat('#141820', 0.88), []);
  const chars = [...text];
  const isLong = tall || chars.length >= 3;
  const fontSize = isLong ? (chars.length >= 4 ? 0.086 : 0.098) : 0.11;
  const spacing = isLong ? (chars.length >= 4 ? 0.135 : 0.148) : 0.16;
  const h = Math.max(isLong ? 0.78 : 0.58, chars.length * spacing + 0.16);
  const w = isLong ? 0.28 + Math.min(chars.length - 3, 2) * 0.02 : 0.24;
  return (
    <group position={[0, 0, 0.03]}>
      <SignGlowOrb color={color} width={w} height={h} lite={lite} />
      <NeonBorder width={w} height={h} depth={0.03} />
      <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
        <boxGeometry args={[w, h, 0.03]} />
      </mesh>
      <VerticalNeonText
        text={text}
        position={[0, 0, 0.05]}
        fontSize={fontSize}
        color={color}
        spacing={spacing}
      />
    </group>
  );
}

/** Horizontal strip mounted flush on the facade. */
function FacadeBannerSign({ text, color, lite = false }: { text: string; color: string; lite?: boolean }) {
  const boardMat = useMemo(() => neonMat('#141820', 0.88), []);
  const w = Math.max(0.62, text.length * 0.15 + 0.3);
  const h = 0.2;
  return (
    <group position={[0, 0, 0.03]}>
      <SignGlowOrb color={color} width={w} height={h} lite={lite} />
      <NeonBorder width={w} height={h} depth={0.03} />
      <mesh material={boardMat} position={[0, 0, 0.01]} renderOrder={11}>
        <boxGeometry args={[w, h, 0.03]} />
      </mesh>
      <NeonText position={[0, 0, 0.05]} fontSize={0.1} color={color}>
        {text}
      </NeonText>
    </group>
  );
}

/** Neon panel facing +Z — readable by the player walking down the street. */
export function FacingNeonPanel({
  text,
  color,
  width,
  height = 0.42,
  fontSize = 0.14,
  flicker = false,
  flickerSeed = 0,
}: {
  text: string;
  color: string;
  width?: number;
  height?: number;
  fontSize?: number;
  flicker?: boolean;
  flickerSeed?: number;
}) {
  const w = width ?? Math.max(0.85, text.length * 0.16 + 0.34);
  const h = height;
  const boardMat = useMemo(() => neonMat('#141820', 0.9), []);
  const groupRef = useRef<THREE.Group>(null);
  const primedRef = useRef(false);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    primeFlickerMaterials(groupRef.current);
    primedRef.current = true;
  }, [text, color, w, h, fontSize]);

  useFrame(({ clock }) => {
    if (!flicker || !groupRef.current) return;
    if (!primedRef.current) {
      primeFlickerMaterials(groupRef.current);
      primedRef.current = true;
    }
    const intensity = neonFlickerIntensity(clock.elapsedTime, flickerSeed);
    applyFlickerMaterials(groupRef.current, intensity);
  });

  return (
    <group ref={groupRef}>
      <SignGlowOrb color={color} width={w} height={h} lite />
      <NeonBorder width={w} height={h} depth={0.04} />
      <mesh material={boardMat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[w, h, 0.04]} />
      </mesh>
      <NeonText position={[0, 0, 0.07]} fontSize={fontSize} color={color}>
        {text}
      </NeonText>
    </group>
  );
}

/** Wide neon panels spanning the road between buildings — parent to a building group for curve sync. */
export function StreetSpanSigns({
  buildingX,
  cy,
  cz,
  panels,
}: {
  buildingX: number;
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
}) {
  const spanW = 6.8;
  const cableMat = useMemo(() => neonMat('#0E1218', 0.95), []);
  const cableGeo = useMemo(() => new THREE.BoxGeometry(spanW, 0.03, 0.03), []);
  const dropGeo = useMemo(() => new THREE.BoxGeometry(0.03, 0.42, 0.03), []);

  return (
    <group position={[-buildingX, cy, cz]}>
      <mesh geometry={cableGeo} material={cableMat} position={[0, 0.42, 0.03]} />
      <mesh geometry={cableGeo} material={cableMat} position={[0, -0.22, 0.03]} />
      <mesh geometry={dropGeo} material={cableMat} position={[-spanW / 2 + 0.15, 0.1, 0.03]} />
      <mesh geometry={dropGeo} material={cableMat} position={[spanW / 2 - 0.15, 0.1, 0.03]} />

      {panels.map((panel, i) => (
        <group key={i} position={[0, panel.y ?? 0, 0]}>
          <FacingNeonPanel
            text={panel.text}
            color={panel.color}
            width={panel.width}
            height={panel.height}
            fontSize={panel.fontSize}
          />
        </group>
      ))}
    </group>
  );
}

const VARIANTS: Record<NeonSignVariant, () => ReactNode> = {
  kissaten: KissatenNeon,
  ramen: RamenNeon,
  slope: SlopeNeon,
  teahouse: TeahouseNeon,
  izakaya: IzakayaNeon,
  yakitori: YakitoriNeon,
  soba: SobaNeon,
  konbini: KonbiniNeon,
  gallery: GalleryNeon,
};

export function BuildingNeonSign({
  variant,
  faceX,
  rotY,
  side,
  placement,
}: BuildingNeonSignProps) {
  const x = faceX + signOutset(side);
  const SignContent = VARIANTS[variant];

  return (
    <group position={[x, placement.cy, placement.cz]} rotation={[0, rotY, 0]}>
      <SignContent />
    </group>
  );
}

/** Small neon awning tag — 営業中 */
export function AwningNeonTag({
  faceX,
  cy,
  cz,
  rotY,
  side,
}: {
  faceX: number;
  cy: number;
  cz: number;
  rotY: number;
  side: 'left' | 'right';
}) {
  const mat = useMemo(() => neonMat('#081E22', 0.9), []);
  const x = faceX + signOutset(side);

  return (
    <group position={[x, cy, cz]} rotation={[0, rotY, -0.08]}>
      <SignGlowOrb color={neonPalette.neonCyan} width={0.62} height={0.22} />
      <NeonBorder width={0.62} height={0.22} depth={0.04} />
      <mesh material={mat} position={[0, 0, 0.02]} renderOrder={11}>
        <boxGeometry args={[0.62, 0.22, 0.04]} />
      </mesh>
      <NeonText position={[0, 0, 0.06]} fontSize={0.11} color={neonPalette.neonCyan}>
        営業中
      </NeonText>
    </group>
  );
}

/** Smaller secondary signs — blades, banners, floor tags. */
function SecondarySignBody({ spec, lite }: { spec: SecondarySignSpec; lite: boolean }) {
  const body = { text: spec.text, color: spec.color, lite };
  switch (spec.kind) {
    case 'blade':
      return <BladeSign {...body} />;
    case 'banner':
      return <BannerSign {...body} />;
    case 'floorTag':
      return <FloorTagSign {...body} />;
    case 'projecting':
      return <ProjectingKanban {...body} />;
    case 'facadeVertical':
      return <FacadeVerticalSign {...body} tall={spec.tall} />;
    case 'facadeBanner':
      return <FacadeBannerSign {...body} />;
    default:
      return null;
  }
}

export function FacadeSecondarySign({
  spec,
  faceX,
  rotY,
  side,
  w,
  d,
}: {
  spec: SecondarySignSpec;
  faceX: number;
  rotY: number;
  side: 'left' | 'right';
  w: number;
  d: number;
}) {
  const wall = spec.wall ?? 'street';
  const lite = spec.lite ?? wall !== 'street';

  if (wall === 'street') {
    const x = faceX + signOutset(side);
    return (
      <group position={[x, spec.cy, spec.cz]} rotation={[0, rotY, 0]}>
        <SecondarySignBody spec={spec} lite={lite} />
      </group>
    );
  }

  const faceZ = wall === 'sideNear' ? d / 2 + 0.015 : -(d / 2 + 0.015);
  const zOut = wall === 'sideNear' ? 0.05 : -0.05;
  const sideRotY = wall === 'sideNear' ? 0 : Math.PI;

  return (
    <group position={[spec.lx ?? 0, spec.cy, faceZ + zOut]} rotation={[0, sideRotY, 0]}>
      <SecondarySignBody spec={spec} lite={lite} />
    </group>
  );
}
