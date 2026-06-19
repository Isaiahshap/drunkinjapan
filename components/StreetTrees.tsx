'use client';
import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Tree } from '@dgreenheck/ez-tree';
import * as THREE from 'three';
import { groundSurfaceY } from '@/lib/curvedWorld';
import { CULL, nearPlayer } from '@/lib/sceneCulling';
import { STREET_TREE_PLACEMENTS, type TreePlacement } from '@/lib/streetTrees';

const BARK_BROWNS = [0x7a4a2a, 0x6b4423, 0x8b5a3c, 0x725234] as const;
const GREEN_LEAVES = [0x5cb368, 0x4a9e55, 0x6ecf7a, 0x58b85e] as const;
const PINK_LEAVES = [0xff8fbf, 0xffa8d8, 0xff7eb8, 0xffb0d0] as const;

const WIND_STRENGTH = new THREE.Vector3(0.24, 0, 0.14);
const WIND_FREQUENCY = 0.52;
const WIND_SCALE = 72;

function pickColor<T extends readonly number[]>(palette: T, seed: number) {
  return palette[seed % palette.length];
}

function tuneTreeForStreet(tree: Tree, placement: TreePlacement) {
  const barkTint = pickColor(BARK_BROWNS, placement.seed);
  const leafTint =
    placement.leafStyle === 'pink'
      ? pickColor(PINK_LEAVES, placement.seed + 7)
      : pickColor(GREEN_LEAVES, placement.seed + 3);

  tree.options.bark.textured = false;
  tree.options.bark.flatShading = false;
  tree.options.bark.tint = barkTint;
  tree.options.leaves.tint = leafTint;
  tree.options.leaves.count = Math.max(5, Math.floor(tree.options.leaves.count * 0.48));
  tree.options.leaves.billboard = 'single';
  if (tree.options.branch.sections[2] !== undefined) {
    tree.options.branch.sections[2] = Math.min(tree.options.branch.sections[2], 4);
  }
  if (tree.options.branch.sections[1] !== undefined) {
    tree.options.branch.sections[1] = Math.min(tree.options.branch.sections[1], 5);
  }
  if (tree.options.branch.sections[0] !== undefined) {
    tree.options.branch.sections[0] = Math.min(tree.options.branch.sections[0], 10);
  }
}

function applyWind(tree: Tree) {
  const material = tree.leavesMesh.material;
  if (Array.isArray(material)) return false;

  const shader = material.userData.shader as {
    uniforms: {
      uWindStrength: { value: THREE.Vector3 };
      uWindFrequency: { value: number };
      uWindScale: { value: number };
    };
  } | undefined;

  if (!shader) return false;
  shader.uniforms.uWindStrength.value.copy(WIND_STRENGTH);
  shader.uniforms.uWindFrequency.value = WIND_FREQUENCY;
  shader.uniforms.uWindScale.value = WIND_SCALE;
  return true;
}

const EzTreeUnit = memo(function EzTreeUnit({
  placement,
  playerRef,
}: {
  placement: TreePlacement;
  playerRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const windReady = useRef(false);
  const activeRef = useRef(false);
  const { x, z, preset, seed, scale, rotation } = placement;

  const tree = useMemo(() => {
    const instance = new Tree();
    instance.loadPreset(preset);
    instance.options.seed = seed;
    tuneTreeForStreet(instance, placement);
    instance.generate();

    const bark = instance.branchesMesh.material as THREE.MeshPhongMaterial;
    bark.emissive.copy(bark.color);
    bark.emissiveIntensity = 0.28;

    const leaves = instance.leavesMesh.material as THREE.MeshPhongMaterial;
    leaves.emissive.copy(leaves.color);
    leaves.emissiveIntensity = placement.leafStyle === 'pink' ? 0.42 : 0.36;

    instance.scale.setScalar(scale);
    instance.rotation.y = rotation;
    instance.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) mat.toneMapped = false;
      }
    });
    return instance;
  }, [preset, seed, scale, rotation, placement]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const visible = nearPlayer(x, z, playerRef.current, CULL.trees, 14);
    if (!visible) {
      if (activeRef.current) {
        groupRef.current.visible = false;
        activeRef.current = false;
      }
      return;
    }

    if (!activeRef.current) {
      groupRef.current.position.set(
        x,
        groundSurfaceY(x, z, playerRef.current, 0.02, 'sidewalk'),
        z,
      );
      groupRef.current.visible = true;
      activeRef.current = true;
    } else {
      groupRef.current.position.y = groundSurfaceY(x, z, playerRef.current, 0.02, 'sidewalk');
    }

    tree.update(state.clock.elapsedTime);
    if (!windReady.current) windReady.current = applyWind(tree);
  });

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={tree} />
    </group>
  );
});

interface StreetTreesProps {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export default memo(function StreetTrees({ playerRef }: StreetTreesProps) {
  return (
    <group name="street-trees">
      {STREET_TREE_PLACEMENTS.map((placement, i) => (
        <EzTreeUnit key={`tree-${i}`} placement={placement} playerRef={playerRef} />
      ))}
    </group>
  );
});
