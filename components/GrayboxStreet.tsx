'use client';
import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { palette } from '@/lib/palette';
import { mainStreetExtensions, type BuildingSpec } from '@/lib/buildingFactory';
import { playerFacingSideSigns, playerFacingStreetSigns } from '@/lib/buildingSideSigns';
import { STREET_GROUND_LEN, STREET_GROUND_Z } from '@/lib/streetLayout';
import {
  ASPHALT_TEXTURE_PATHS,
  configureAsphaltTextures,
  createCurvedAsphaltMaterial,
} from '@/lib/asphaltRoadMaterial';
import { buildWindowGrid } from '@/lib/buildingFacades';
import { syncCurvedMaterials, groundSurfaceY } from '@/lib/curvedWorld';
import { CULL, nearPlayer } from '@/lib/sceneCulling';
import { curvedMaterialRegistry } from '@/lib/curvedRegistry';
import {
  createCurvedPaintedMaterial,
  createCurvedRoadMarkingMaterial,
  createPaintedMaterial,
} from '@/lib/paintedMaterials';
import { GroundSeamSet, BuildingGroundSeams } from './GroundSeams';
import OutlinedMesh from './OutlinedMesh';
import AnimeSky from './AnimeSky';
import {
  WindowFrame,
  DepthWindowFrame,
  DoorFrame,
  PipeLine,
  FacadeSeam,
  FacadeShadow,
  RoofTrim,
  UtilityBox,
  Awning,
} from './FacadeDetails';
import { BuildingNeonSign, AwningNeonTag, FacadeSecondarySign, StreetSpanSigns, neonPalette, type NeonSignVariant, type SecondarySignSpec, type SignPlacement } from './FacadeSignage';
import StreetLamps from './StreetLamps';
import StreetTrees from './StreetTrees';
import { StreetNeonSignage } from './StreetNeonSignage';
import StringLights from './StringLights';
import Rain from './Rain';

useTexture.preload([
  ASPHALT_TEXTURE_PATHS.map,
  ASPHALT_TEXTURE_PATHS.normalMap,
  ASPHALT_TEXTURE_PATHS.roughnessMap,
  ASPHALT_TEXTURE_PATHS.aoMap,
]);

const BUILDING_SINK_DEPTH = 2.2;
const BUILDING_Y_OFFSET = -0.55;

function sideNeonSet(
  lx: number,
  nearHigh: string,
  nearHighColor: string,
  farHigh: string,
  farHighColor: string,
  nearLow: string,
  nearLowColor: string,
  farLow: string,
  farLowColor: string,
): SecondarySignSpec[] {
  return [
    { kind: 'facadeVertical', wall: 'sideNear', lx: -lx, text: nearHigh, color: nearHighColor, cy: 3.7, cz: 0, lite: true },
    { kind: 'facadeBanner', wall: 'sideFar', lx, text: farHigh, color: farHighColor, cy: 4.85, cz: 0, lite: true },
    { kind: 'blade', wall: 'sideNear', lx, text: nearLow, color: nearLowColor, cy: 2.65, cz: 0, lite: true },
    { kind: 'facadeBanner', wall: 'sideFar', lx: -lx, text: farLow, color: farLowColor, cy: 3.55, cz: 0, lite: true },
  ];
}

const Building = memo(function Building({
  spec,
  playerRef,
}: {
  spec: BuildingSpec;
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const detailRef = useRef<THREE.Group>(null);
  const signRef = useRef<THREE.Group>(null);
  const [px, , pz] = spec.position;
  const [w, baseH, d] = spec.size;
  const extraTop = spec.extraTop ?? 0;
  const h = baseH + extraTop;
  const facadeMid = baseH / 2;
  const totalH = h + BUILDING_SINK_DEPTH;
  const bodyCenterY = (h - BUILDING_SINK_DEPTH) / 2;
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(w, totalH, d), [w, totalH, d]);
  const roofGeo = useMemo(() => new THREE.BoxGeometry(w + 0.3, 0.25, d + 0.3), [w, d]);
  const balconyGeo = useMemo(() => new THREE.BoxGeometry(0.95, 0.06, 0.42), []);
  const bodyMat = useMemo(() => createPaintedMaterial(spec.color), [spec.color]);
  const roofMat = useMemo(() => createPaintedMaterial(palette.roofDark), []);
  const balconyMat = useMemo(() => createPaintedMaterial(palette.buildingGray), []);

  const faceX = spec.side === 'left' ? w / 2 + 0.015 : -(w / 2 + 0.015);
  const faceRotY = spec.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const groundX = spec.side === 'left' ? px + w / 2 : px - w / 2;
  const showAwning = spec.awning ?? spec.seed % 4 !== 2;
  const awningX = faceX + (spec.side === 'left' ? 0.46 : -0.46);
  const awningY = facadeMid + 1.38;
  const awningZ = 0.68;

  const windows = useMemo(
    () => buildWindowGrid(w, d, h, spec.door?.[2]),
    [w, d, h, spec.door],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      groundSurfaceY(groundX, pz, playerRef.current) + BUILDING_Y_OFFSET;

    const player = playerRef.current;
    if (detailRef.current) {
      detailRef.current.visible = nearPlayer(px, pz, player, CULL.facadeDetail);
    }
    if (signRef.current) {
      signRef.current.visible = nearPlayer(px, pz, player, CULL.signage);
    }
  });

  return (
    <group ref={groupRef} position={[px, 0, pz]}>
      <OutlinedMesh geometry={bodyGeo} material={bodyMat} position={[0, bodyCenterY, 0]} outlineThickness={0.048} outlineOpacity={0.92} />
      <OutlinedMesh geometry={roofGeo} material={roofMat} position={[0, h + 0.125, 0]} outlineThickness={0.032} outlineOpacity={0.88} />

      <group ref={detailRef}>
      <FacadeShadow faceX={faceX} cy={baseH * 0.38} cz={0} w={d * 0.88} h={baseH * 0.34} rotY={faceRotY} opacity={0.07} />

      <RoofTrim faceX={faceX} y={h + 0.01} zStart={-d / 2 + 0.15} zEnd={d / 2 - 0.15} seed={spec.seed + 100} />

      {windows.map((slot, i) => {
        if (slot.wall === 'street') {
          return (
            <WindowFrame
              key={`w-${i}`}
              faceX={faceX}
              cy={slot.cy}
              cz={slot.cz}
              w={slot.w}
              h={slot.h}
              seed={spec.seed + i * 7}
              rotY={faceRotY}
            />
          );
        }
        const faceZ = slot.wall === 'sideNear' ? d / 2 + 0.015 : -(d / 2 + 0.015);
        const sideRotY = slot.wall === 'sideNear' ? 0 : Math.PI;
        return (
          <DepthWindowFrame
            key={`w-${i}`}
            faceZ={faceZ}
            lx={slot.lx}
            cy={slot.cy}
            w={slot.w}
            h={slot.h}
            rotY={sideRotY}
            seed={spec.seed + i * 7}
          />
        );
      })}

      {spec.door && (
        <DoorFrame
          faceX={faceX}
          cy={facadeMid + spec.door[1] - 0.46}
          cz={spec.door[2]}
          w={0.56}
          h={0.94}
          seed={spec.seed + 31}
          rotY={faceRotY}
        />
      )}

      {showAwning && (
        <Awning
          position={[awningX, awningY, awningZ]}
          rotation={[0.44, faceRotY, 0]}
        />
      )}

      {spec.pipe && (
        <PipeLine faceX={faceX + (spec.side === 'left' ? 0.55 : -0.55)} y={baseH * 0.38} z={0.35} height={baseH * 0.62} seed={spec.seed + 44} />
      )}

      {spec.utilityBox && (
        <UtilityBox
          position={[faceX + (spec.side === 'left' ? 0.55 : -0.55), 0.58, -0.75]}
          rotation={[0, faceRotY, 0]}
        />
      )}

      {spec.balcony && (
        <>
          <OutlinedMesh
            geometry={balconyGeo}
            material={balconyMat}
            position={[faceX + (spec.side === 'left' ? 0.35 : -0.35), facadeMid + 0.55, 0.55]}
            rotation={[0, faceRotY, 0]}
            outlineThickness={0.012}
            outlineOpacity={0.82}
          />
          <FacadeSeam faceX={faceX + (spec.side === 'left' ? 0.35 : -0.35)} y={facadeMid + 0.72} zStart={0.35} zEnd={0.75} seed={spec.seed + 88} />
        </>
      )}
      </group>

      <group ref={signRef}>
      <BuildingNeonSign
        variant={spec.signage}
        faceX={faceX}
        rotY={faceRotY}
        side={spec.side}
        placement={spec.signPlacement}
      />

      {showAwning && (
        <AwningNeonTag
          faceX={faceX}
          cy={facadeMid + 1.22}
          cz={0.5}
          rotY={faceRotY}
          side={spec.side}
        />
      )}

      {spec.secondarySigns?.map((sign, i) => (
        <FacadeSecondarySign
          key={`sign-${i}`}
          spec={sign}
          faceX={faceX}
          rotY={faceRotY}
          side={spec.side}
          w={w}
          d={d}
        />
      ))}

      {spec.streetSpan && (
        <StreetSpanSigns
          buildingX={px}
          cy={spec.streetSpan.cy}
          cz={spec.streetSpan.cz}
          panels={spec.streetSpan.panels}
        />
      )}
      </group>
    </group>
  );
});

const CORE_BUILDINGS: BuildingSpec[] = [
  {
    position: [-4.4, 0, 0], size: [2.4, 4.4, 5], extraTop: 1.1, color: palette.buildingPink, side: 'left', seed: 11,
    door: [0.3, -1.2, 0.01], signage: 'kissaten',
    signPlacement: { cy: 3.45, cz: -1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '喫茶', color: neonPalette.electricYellow, cy: 2.65, cz: 1.45 },
      { kind: 'facadeVertical', text: '珈琲', color: neonPalette.hotPink, cy: 4.85, cz: -1.45 },
      { kind: 'facadeBanner', text: 'コーヒー', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '1F', color: neonPalette.neonTeal, cy: 0.82, cz: -1.45 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.67, text: '茶', color: neonPalette.neonMagenta, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.67, text: '店', color: neonPalette.electricYellow, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.67, text: '珈琲', color: neonPalette.hotPink, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: -0.67, text: '喫茶', color: neonPalette.electricYellow, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [-4.7, 0, -8], size: [2.8, 5.6, 5], extraTop: 1.2, color: palette.buildingRed, side: 'left', seed: 23,
    door: [0.0, -1.7, 0.01], awning: true, pipe: true, signage: 'ramen',
    signPlacement: { cy: 3.25, cz: 1.45 },
    secondarySigns: [
      { kind: 'projecting', text: 'ラーメン', color: neonPalette.ramenRed, cy: 2.55, cz: -1.45 },
      { kind: 'facadeVertical', text: '味噌', color: neonPalette.electricYellow, cy: 5.0, cz: 1.45 },
      { kind: 'facadeBanner', text: '麺通', color: neonPalette.warmCream, cy: 2.05, cz: 0 },
      { kind: 'blade', text: '味', color: neonPalette.neonOrange, cy: 4.0, cz: 1.45 },
      { kind: 'floorTag', text: '2F', color: neonPalette.neonTeal, cy: 0.78, cz: 1.35 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.78, text: '麺', color: neonPalette.ramenRed, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.78, text: '通', color: neonPalette.neonCyan, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.78, text: 'ラーメン', color: neonPalette.ramenRed, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeVertical', wall: 'sideFar', lx: -0.78, text: '味噌', color: neonPalette.electricYellow, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [-4.2, 0, -17], size: [2.2, 4.8, 5], extraTop: 1.2, color: palette.buildingIndigo, side: 'left', seed: 37,
    door: [0.0, -1.4, 0.01], utilityBox: true, signage: 'slope',
    signPlacement: { cy: 3.75, cz: 1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '坂道', color: neonPalette.neonTeal, cy: 2.7, cz: -1.45 },
      { kind: 'facadeVertical', text: '坂', color: neonPalette.neonCyan, cy: 4.85, cz: -1.45 },
      { kind: 'blade', text: '歩道', color: neonPalette.electricYellow, cy: 4.0, cz: 1.45 },
      { kind: 'facadeBanner', text: '道', color: neonPalette.neonTeal, cy: 2.05, cz: 0 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.62, text: '坂', color: neonPalette.neonTeal, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.62, text: '道', color: neonPalette.neonCyan, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.62, text: '歩道', color: neonPalette.electricYellow, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: -0.62, text: '坂道', color: neonPalette.neonTeal, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [4.5, 0, -3], size: [2.6, 5.2, 6], extraTop: 1.2, color: palette.buildingAmber, side: 'right', seed: 51,
    door: [0.0, -1.6, 0.01], balcony: true, signage: 'teahouse',
    signPlacement: { cy: 4.15, cz: -1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '茶館', color: neonPalette.neonMagenta, cy: 2.62, cz: 1.75 },
      { kind: 'facadeVertical', text: '抹茶', color: neonPalette.neonCyan, cy: 5.0, cz: 0.35 },
      { kind: 'facadeBanner', text: '茶', color: neonPalette.hotPink, cy: 2.05, cz: -1.75 },
      { kind: 'floorTag', text: '2F', color: neonPalette.neonTeal, cy: 0.8, cz: 1.75 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.73, text: '茶', color: neonPalette.neonMagenta, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.73, text: '館', color: neonPalette.hotPink, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.73, text: '抹茶', color: neonPalette.neonCyan, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeVertical', wall: 'sideFar', lx: -0.73, text: '茶館', color: neonPalette.neonMagenta, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [4.6, 0, -12], size: [2.8, 6.0, 6], extraTop: 1.2, color: palette.buildingTerracotta, side: 'right', seed: 67,
    door: [0.0, -1.9, 0.01], pipe: true, signage: 'izakaya',
    signPlacement: { cy: 4.45, cz: 1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '居酒屋', color: neonPalette.hotPink, cy: 2.58, cz: -1.75 },
      { kind: 'facadeVertical', text: '酒場', color: neonPalette.neonOrange, cy: 3.45, cz: 0 },
      { kind: 'blade', text: '酒', color: neonPalette.electricYellow, cy: 4.05, cz: -1.75 },
      { kind: 'facadeBanner', text: '営業中', color: neonPalette.neonCyan, cy: 2.05, cz: 1.75 },
      { kind: 'floorTag', text: 'B1', color: neonPalette.neonOrange, cy: 0.75, cz: -0.55 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.78, text: '酒', color: neonPalette.hotPink, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.78, text: '屋', color: neonPalette.neonOrange, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.78, text: '居酒屋', color: neonPalette.hotPink, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: -0.78, text: '酒場', color: neonPalette.neonOrange, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [-4.5, 0, -26], size: [2.6, 5.4, 5], extraTop: 1.1, color: palette.mutedRed, side: 'left', seed: 79,
    door: [0.2, -1.5, 0.01], pipe: true, signage: 'yakitori',
    signPlacement: { cy: 3.35, cz: -1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '焼鳥', color: neonPalette.neonOrange, cy: 2.6, cz: 1.45 },
      { kind: 'facadeVertical', text: '炭火', color: neonPalette.electricYellow, cy: 4.85, cz: -1.45 },
      { kind: 'blade', text: '串焼', color: neonPalette.warmCream, cy: 4.0, cz: 1.45 },
      { kind: 'facadeBanner', text: '鳥', color: neonPalette.neonOrange, cy: 2.05, cz: 0 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.73, text: '鳥', color: neonPalette.neonOrange, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.73, text: '焼', color: neonPalette.electricYellow, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.73, text: '炭火', color: neonPalette.neonOrange, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeVertical', wall: 'sideFar', lx: -0.73, text: '焼鳥', color: neonPalette.warmCream, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [-4.3, 0, -34], size: [2.4, 4.6, 5], extraTop: 1.1, color: palette.buildingLavender, side: 'left', seed: 91,
    door: [0.0, -1.3, 0.01], signage: 'gallery',
    signPlacement: { cy: 3.85, cz: 0.85 },
    secondarySigns: [
      { kind: 'projecting', text: '画廊', color: neonPalette.neonMagenta, cy: 2.68, cz: -1.45 },
      { kind: 'facadeVertical', text: '展示', color: neonPalette.neonCyan, cy: 4.85, cz: 1.45 },
      { kind: 'facadeBanner', text: '通', color: neonPalette.hotPink, cy: 2.05, cz: -1.1 },
      { kind: 'floorTag', text: '2F', color: neonPalette.neonMagenta, cy: 0.76, cz: 1.45 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.67, text: '画', color: neonPalette.neonMagenta, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.67, text: '廊', color: neonPalette.neonCyan, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.67, text: '展示', color: neonPalette.hotPink, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: -0.67, text: '画廊', color: neonPalette.neonMagenta, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [4.4, 0, -21], size: [2.5, 5.0, 6], extraTop: 1.2, color: palette.buildingSage, side: 'right', seed: 83,
    door: [0.0, -1.55, 0.01], awning: true, signage: 'konbini',
    signPlacement: { cy: 3.15, cz: -1.75 },
    streetSpan: {
      cy: 4.25,
      cz: 2.05,
      panels: [
        { text: '商店街へようこそ', color: neonPalette.hotPink, width: 5.9, height: 0.54, fontSize: 0.24, y: 0 },
        { text: '坂道商店街', color: neonPalette.neonTeal, width: 4.2, height: 0.44, fontSize: 0.2, y: 0.62 },
        { text: '夜の街へ歓迎', color: neonPalette.neonCyan, width: 4.6, height: 0.4, fontSize: 0.17, y: -0.58 },
      ],
    },
    secondarySigns: [
      { kind: 'projecting', text: '商店', color: neonPalette.neonCyan, cy: 2.5, cz: 1.75 },
      { kind: 'facadeVertical', text: '深夜', color: neonPalette.electricYellow, cy: 4.85, cz: -1.75 },
      { kind: 'facadeBanner', text: '営業中', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '1F', color: neonPalette.electricYellow, cy: 0.74, cz: -1.75 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.7, text: '商', color: neonPalette.neonCyan, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.7, text: '店', color: neonPalette.electricYellow, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.7, text: '深夜', color: neonPalette.neonTeal, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: -0.7, text: '商店', color: neonPalette.neonCyan, cy: 3.55, cz: 0, lite: true },
    ],
  },
  {
    position: [4.7, 0, -36], size: [2.7, 5.8, 6], extraTop: 1.2, color: palette.buildingCream, side: 'right', seed: 97,
    door: [0.0, -1.7, 0.01], balcony: true, pipe: true, signage: 'soba',
    signPlacement: { cy: 3.55, cz: 1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '蕎麦', color: neonPalette.warmCream, cy: 2.56, cz: -1.75 },
      { kind: 'facadeVertical', text: '手打', color: neonPalette.neonTeal, cy: 5.0, cz: 0.75 },
      { kind: 'blade', text: '麺', color: neonPalette.electricYellow, cy: 4.0, cz: -1.75 },
      { kind: 'facadeBanner', text: '味', color: neonPalette.neonCyan, cy: 2.05, cz: 1.75 },
      { kind: 'floorTag', text: 'B1', color: neonPalette.neonTeal, cy: 0.72, cz: -0.35 },
      { kind: 'facadeVertical', wall: 'sideNear', lx: -0.76, text: '蕎', color: neonPalette.warmCream, cy: 3.7, cz: 0, lite: true },
      { kind: 'facadeBanner', wall: 'sideFar', lx: 0.76, text: '麦', color: neonPalette.neonTeal, cy: 4.85, cz: 0, lite: true },
      { kind: 'blade', wall: 'sideNear', lx: 0.76, text: '手打', color: neonPalette.neonCyan, cy: 2.65, cz: 0, lite: true },
      { kind: 'facadeVertical', wall: 'sideFar', lx: -0.76, text: '蕎麦', color: neonPalette.warmCream, cy: 3.55, cz: 0, lite: true },
    ],
  },
  // ── extended stretch (6 per side) ──
  {
    position: [-4.6, 0, -42], size: [2.5, 5.2, 5], extraTop: 1.1, color: palette.buildingRed, side: 'left', seed: 103,
    door: [0.1, -1.6, 0.01], awning: true, signage: 'ramen',
    signPlacement: { cy: 3.3, cz: 1.45 },
    secondarySigns: [
      { kind: 'projecting', text: 'ラーメン', color: neonPalette.ramenRed, cy: 2.55, cz: -1.45 },
      { kind: 'facadeVertical', text: '味噌', color: neonPalette.electricYellow, cy: 4.85, cz: 1.45 },
      { kind: 'facadeBanner', text: '麺', color: neonPalette.warmCream, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '2F', color: neonPalette.neonTeal, cy: 0.78, cz: -1.45 },
      ...sideNeonSet(0.72, '麺', neonPalette.ramenRed, '通', neonPalette.neonCyan, 'ラーメン', neonPalette.ramenRed, '味噌', neonPalette.electricYellow),
    ],
  },
  {
    position: [-4.3, 0, -50], size: [2.6, 5.4, 5], extraTop: 1.2, color: palette.buildingAmber, side: 'left', seed: 109,
    door: [0.0, -1.55, 0.01], balcony: true, signage: 'teahouse',
    signPlacement: { cy: 3.6, cz: -1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '茶館', color: neonPalette.neonMagenta, cy: 2.6, cz: 1.45 },
      { kind: 'facadeVertical', text: '抹茶', color: neonPalette.neonCyan, cy: 4.85, cz: -1.45 },
      { kind: 'facadeBanner', text: '茶', color: neonPalette.hotPink, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.73, '茶', neonPalette.neonMagenta, '館', neonPalette.hotPink, '抹茶', neonPalette.neonCyan, '茶館', neonPalette.neonMagenta),
    ],
  },
  {
    position: [-4.5, 0, -58], size: [2.7, 5.8, 5], extraTop: 1.2, color: palette.buildingTerracotta, side: 'left', seed: 115,
    door: [0.0, -1.75, 0.01], pipe: true, signage: 'izakaya',
    signPlacement: { cy: 3.9, cz: 1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '居酒屋', color: neonPalette.hotPink, cy: 2.55, cz: -1.45 },
      { kind: 'facadeVertical', text: '酒場', color: neonPalette.neonOrange, cy: 4.85, cz: 1.45 },
      { kind: 'blade', text: '酒', color: neonPalette.electricYellow, cy: 4.0, cz: -1.45 },
      { kind: 'facadeBanner', text: '営業中', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.76, '酒', neonPalette.hotPink, '屋', neonPalette.neonOrange, '居酒屋', neonPalette.hotPink, '酒場', neonPalette.neonOrange),
    ],
  },
  {
    position: [-4.2, 0, -66], size: [2.4, 5.0, 5], extraTop: 1.1, color: palette.mutedRed, side: 'left', seed: 121,
    door: [0.2, -1.45, 0.01], pipe: true, signage: 'yakitori',
    signPlacement: { cy: 3.4, cz: -1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '焼鳥', color: neonPalette.neonOrange, cy: 2.6, cz: 1.45 },
      { kind: 'facadeVertical', text: '炭火', color: neonPalette.electricYellow, cy: 4.85, cz: -1.45 },
      { kind: 'facadeBanner', text: '鳥', color: neonPalette.neonOrange, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.67, '鳥', neonPalette.neonOrange, '焼', neonPalette.electricYellow, '炭火', neonPalette.neonOrange, '焼鳥', neonPalette.warmCream),
    ],
  },
  {
    position: [-4.7, 0, -74], size: [2.2, 4.8, 5], extraTop: 1.2, color: palette.buildingIndigo, side: 'left', seed: 127,
    door: [0.0, -1.35, 0.01], utilityBox: true, signage: 'slope',
    signPlacement: { cy: 3.7, cz: 0.85 },
    secondarySigns: [
      { kind: 'projecting', text: '坂道', color: neonPalette.neonTeal, cy: 2.65, cz: -1.45 },
      { kind: 'facadeVertical', text: '坂', color: neonPalette.neonCyan, cy: 4.85, cz: 1.45 },
      { kind: 'blade', text: '歩道', color: neonPalette.electricYellow, cy: 4.0, cz: -1.45 },
      { kind: 'facadeBanner', text: '道', color: neonPalette.neonTeal, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.62, '坂', neonPalette.neonTeal, '道', neonPalette.neonCyan, '歩道', neonPalette.electricYellow, '坂道', neonPalette.neonTeal),
    ],
  },
  {
    position: [-4.4, 0, -82], size: [2.5, 5.6, 5], extraTop: 1.1, color: palette.buildingLavender, side: 'left', seed: 133,
    door: [0.0, -1.65, 0.01], signage: 'gallery',
    signPlacement: { cy: 3.8, cz: -1.45 },
    secondarySigns: [
      { kind: 'projecting', text: '画廊', color: neonPalette.neonMagenta, cy: 2.62, cz: 1.45 },
      { kind: 'facadeVertical', text: '展示', color: neonPalette.neonCyan, cy: 4.85, cz: -1.45 },
      { kind: 'facadeBanner', text: '通', color: neonPalette.hotPink, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '3F', color: neonPalette.neonMagenta, cy: 0.76, cz: 1.45 },
      ...sideNeonSet(0.7, '画', neonPalette.neonMagenta, '廊', neonPalette.neonCyan, '展示', neonPalette.hotPink, '画廊', neonPalette.neonMagenta),
    ],
  },
  {
    position: [4.5, 0, -44], size: [2.6, 5.4, 6], extraTop: 1.2, color: palette.buildingPink, side: 'right', seed: 107,
    door: [0.0, -1.6, 0.01], signage: 'kissaten',
    signPlacement: { cy: 3.35, cz: -1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '喫茶', color: neonPalette.electricYellow, cy: 2.55, cz: 1.75 },
      { kind: 'facadeVertical', text: '珈琲', color: neonPalette.hotPink, cy: 4.85, cz: -1.75 },
      { kind: 'facadeBanner', text: 'コーヒー', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '1F', color: neonPalette.neonTeal, cy: 0.8, cz: 1.75 },
      ...sideNeonSet(0.73, '珈琲', neonPalette.hotPink, '店', neonPalette.electricYellow, '喫茶', neonPalette.electricYellow, 'コーヒー', neonPalette.neonCyan),
    ],
  },
  {
    position: [4.6, 0, -52], size: [2.8, 5.8, 6], extraTop: 1.2, color: palette.buildingRed, side: 'right', seed: 113,
    door: [0.0, -1.8, 0.01], awning: true, pipe: true, signage: 'ramen',
    signPlacement: { cy: 3.5, cz: 1.75 },
    secondarySigns: [
      { kind: 'projecting', text: 'ラーメン', color: neonPalette.ramenRed, cy: 2.55, cz: -1.75 },
      { kind: 'facadeVertical', text: '味噌', color: neonPalette.electricYellow, cy: 5.0, cz: 1.75 },
      { kind: 'blade', text: '味', color: neonPalette.neonOrange, cy: 4.0, cz: -1.75 },
      { kind: 'facadeBanner', text: '麺通', color: neonPalette.warmCream, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.78, '麺', neonPalette.ramenRed, '通', neonPalette.neonCyan, 'ラーメン', neonPalette.ramenRed, '味噌', neonPalette.electricYellow),
    ],
  },
  {
    position: [4.3, 0, -60], size: [2.5, 5.2, 6], extraTop: 1.1, color: palette.buildingCream, side: 'right', seed: 119,
    door: [0.0, -1.5, 0.01], balcony: true, signage: 'soba',
    signPlacement: { cy: 3.45, cz: -1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '蕎麦', color: neonPalette.warmCream, cy: 2.55, cz: 1.75 },
      { kind: 'facadeVertical', text: '手打', color: neonPalette.neonTeal, cy: 4.85, cz: -1.75 },
      { kind: 'blade', text: '麺', color: neonPalette.electricYellow, cy: 4.0, cz: 1.75 },
      { kind: 'facadeBanner', text: '味', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      ...sideNeonSet(0.7, '蕎', neonPalette.warmCream, '麦', neonPalette.neonTeal, '手打', neonPalette.neonCyan, '蕎麦', neonPalette.warmCream),
    ],
  },
  {
    position: [4.7, 0, -68], size: [2.5, 5.0, 6], extraTop: 1.2, color: palette.buildingSage, side: 'right', seed: 125,
    door: [0.0, -1.55, 0.01], awning: true, signage: 'konbini',
    signPlacement: { cy: 3.2, cz: 1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '商店', color: neonPalette.neonCyan, cy: 2.5, cz: -1.75 },
      { kind: 'facadeVertical', text: '深夜', color: neonPalette.electricYellow, cy: 4.85, cz: 1.75 },
      { kind: 'facadeBanner', text: '営業中', color: neonPalette.neonCyan, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: '1F', color: neonPalette.electricYellow, cy: 0.74, cz: -1.75 },
      ...sideNeonSet(0.7, '商', neonPalette.neonCyan, '店', neonPalette.electricYellow, '深夜', neonPalette.neonTeal, '商店', neonPalette.neonCyan),
    ],
  },
  {
    position: [4.4, 0, -76], size: [2.8, 6.0, 6], extraTop: 1.2, color: palette.buildingTerracotta, side: 'right', seed: 131,
    door: [0.0, -1.85, 0.01], pipe: true, signage: 'izakaya',
    signPlacement: { cy: 4.0, cz: -1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '居酒屋', color: neonPalette.hotPink, cy: 2.55, cz: 1.75 },
      { kind: 'facadeVertical', text: '酒場', color: neonPalette.neonOrange, cy: 3.5, cz: 0 },
      { kind: 'blade', text: '酒', color: neonPalette.electricYellow, cy: 4.05, cz: -1.75 },
      { kind: 'facadeBanner', text: '営業中', color: neonPalette.neonCyan, cy: 2.05, cz: 1.75 },
      ...sideNeonSet(0.78, '酒', neonPalette.hotPink, '屋', neonPalette.neonOrange, '居酒屋', neonPalette.hotPink, '酒場', neonPalette.neonOrange),
    ],
  },
  {
    position: [4.6, 0, -84], size: [2.6, 5.6, 6], extraTop: 1.1, color: palette.buildingIndigo, side: 'right', seed: 137,
    door: [0.1, -1.6, 0.01], pipe: true, signage: 'yakitori',
    signPlacement: { cy: 3.4, cz: 1.75 },
    secondarySigns: [
      { kind: 'projecting', text: '焼鳥', color: neonPalette.neonOrange, cy: 2.58, cz: -1.75 },
      { kind: 'facadeVertical', text: '炭火', color: neonPalette.electricYellow, cy: 4.85, cz: 1.75 },
      { kind: 'facadeBanner', text: '鳥', color: neonPalette.neonOrange, cy: 2.05, cz: 0 },
      { kind: 'floorTag', text: 'B1', color: neonPalette.neonTeal, cy: 0.72, cz: -1.75 },
      ...sideNeonSet(0.73, '鳥', neonPalette.neonOrange, '焼', neonPalette.electricYellow, '炭火', neonPalette.neonOrange, '焼鳥', neonPalette.warmCream),
    ],
  },
];

function withPlayerSideSigns(spec: BuildingSpec): BuildingSpec {
  const lx = 0.62 + (spec.seed % 4) * 0.06;
  return {
    ...spec,
    secondarySigns: [
      ...(spec.secondarySigns ?? []),
      ...playerFacingSideSigns(spec.signage, lx, spec.seed),
      ...playerFacingStreetSigns(spec.signage, spec.side, spec.seed),
    ],
  };
}

const BUILDINGS: BuildingSpec[] = [
  ...CORE_BUILDINGS,
  ...mainStreetExtensions(),
].map(withPlayerSideSigns);

function RoadDetails({ dashMat, groundLen }: { dashMat: THREE.Material; groundLen: number }) {
  const dashGeo = useMemo(() => new THREE.PlaneGeometry(0.06, 0.55), []);
  const dashCount = Math.floor(groundLen / 2.8);
  return (
    <>
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh
          key={i}
          geometry={dashGeo}
          material={dashMat}
          position={[0, 0.018, STREET_GROUND_LEN / 2 - 52 - i * 2.8]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </>
  );
}

function CulledBuildingSeams({
  px,
  pz,
  width,
  depth,
  side,
  playerRef,
}: {
  px: number;
  pz: number;
  width: number;
  depth: number;
  side: 'left' | 'right';
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = nearPlayer(px, pz, playerRef.current, CULL.groundSeams);
  });

  return (
    <group ref={ref}>
      <BuildingGroundSeams px={px} pz={pz} width={width} depth={depth} side={side} playerRef={playerRef} />
    </group>
  );
}

interface GrayboxStreetProps {
  playerZRef: React.MutableRefObject<THREE.Vector3>;
}

export default function GrayboxStreet({ playerZRef }: GrayboxStreetProps) {
  const groundLen = STREET_GROUND_LEN;
  const groundZ = STREET_GROUND_Z;

  const roadGeo = useMemo(() => new THREE.PlaneGeometry(5, groundLen, 8, 40), []);
  const walkGeo = useMemo(() => new THREE.PlaneGeometry(1.2, groundLen, 3, 40), []);
  const walkFillGeo = useMemo(() => new THREE.PlaneGeometry(0.22, groundLen, 2, 40), []);
  const grassGeo = useMemo(() => new THREE.PlaneGeometry(18, groundLen, 4, 40), []);
  const curbGeo = useMemo(() => new THREE.BoxGeometry(0.12, 0.08, groundLen, 1, 1, 40), []);
  const curbStrokeGeo = useMemo(() => new THREE.BoxGeometry(0.032, 0.028, groundLen, 1, 1, 40), []);
  const grateGeo = useMemo(() => new THREE.BoxGeometry(0.32, 0.012, 0.32), []);

  const asphaltTextures = useTexture(ASPHALT_TEXTURE_PATHS);
  const roadMat = useMemo(() => {
    configureAsphaltTextures(asphaltTextures);
    return createCurvedAsphaltMaterial(asphaltTextures, 'road');
  }, [asphaltTextures]);

  const walkMat = useMemo(() => createCurvedPaintedMaterial(palette.sidewalk, 'sidewalk'), []);
  const grassMat = useMemo(() => createCurvedPaintedMaterial(palette.grassVerge, 'sidewalk'), []);
  const curbMat = useMemo(() => createCurvedPaintedMaterial(palette.roadShadow, 'curb'), []);
  const curbStrokeMat = useMemo(() => createCurvedPaintedMaterial(palette.ink, 'curb'), []);
  const dashMat = useMemo(() => createCurvedRoadMarkingMaterial('road', 0.28), []);

  useLayoutEffect(() => {
    syncCurvedMaterials(curvedMaterialRegistry, playerZRef.current);
  }, [playerZRef]);

  useFrame(() => syncCurvedMaterials(curvedMaterialRegistry, playerZRef.current));

  return (
    <group>
      <AnimeSky playerRef={playerZRef} />

      <mesh geometry={grassGeo} material={grassMat} rotation={[-Math.PI / 2, 0, 0]} position={[-13, 0.015, groundZ]} renderOrder={0} />
      <mesh geometry={grassGeo} material={grassMat} rotation={[-Math.PI / 2, 0, 0]} position={[13, 0.015, groundZ]} renderOrder={0} />

      <mesh geometry={roadGeo} material={roadMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, groundZ]} renderOrder={1} />
      <mesh geometry={walkFillGeo} material={walkMat} rotation={[-Math.PI / 2, 0, 0]} position={[-2.71, 0.02, groundZ]} renderOrder={0} />
      <mesh geometry={walkFillGeo} material={walkMat} rotation={[-Math.PI / 2, 0, 0]} position={[2.71, 0.02, groundZ]} renderOrder={0} />
      <mesh geometry={walkGeo} material={walkMat} rotation={[-Math.PI / 2, 0, 0]} position={[-3.4, 0.02, groundZ]} renderOrder={0} />
      <mesh geometry={walkGeo} material={walkMat} rotation={[-Math.PI / 2, 0, 0]} position={[3.4, 0.02, groundZ]} renderOrder={0} />
      <mesh geometry={curbGeo} material={curbMat} position={[-2.56, 0.04, groundZ]} renderOrder={0} />
      <mesh geometry={curbGeo} material={curbMat} position={[2.56, 0.04, groundZ]} renderOrder={0} />
      <mesh geometry={curbStrokeGeo} material={curbStrokeMat} position={[-2.48, 0.088, groundZ]} renderOrder={1} />
      <mesh geometry={curbStrokeGeo} material={curbStrokeMat} position={[2.48, 0.088, groundZ]} renderOrder={1} />

      <GroundSeamSet groundZ={groundZ} groundLen={groundLen} />

      <StreetLamps playerRef={playerZRef} />

      <StreetTrees playerRef={playerZRef} />

      <StreetNeonSignage playerRef={playerZRef} />

      <StringLights playerRef={playerZRef} />

      <Rain playerRef={playerZRef} />

      <group position={[0, 0.02, groundZ]}>
        <RoadDetails dashMat={dashMat} groundLen={groundLen} />
        <mesh geometry={grateGeo} material={roadMat} position={[1.1, 0.005, 8]} />
      </group>

      {BUILDINGS.map((spec, i) => (
        <Building key={i} spec={spec} playerRef={playerZRef} />
      ))}

      {BUILDINGS.map((spec, i) => {
        const [px, , pz] = spec.position;
        const [w, , d] = spec.size;
        return (
          <CulledBuildingSeams
            key={`seam-${i}`}
            px={px}
            pz={pz}
            width={w}
            depth={d}
            side={spec.side}
            playerRef={playerZRef}
          />
        );
      })}

    </group>
  );
}
