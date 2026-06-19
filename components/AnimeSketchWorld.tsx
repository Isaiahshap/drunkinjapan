'use client';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { palette } from '@/lib/palette';
import GrayboxStreet from './GrayboxStreet';
import PlayerController from './PlayerController';
import CameraRig from './CameraRig';
import SketchPostFX from './SketchPostFX';
import StreetAmbience from './StreetAmbience';
import StreetClock from './StreetClock';
import StreetTitle from './StreetTitle';
import MobileControls from './MobileControls';

function Scene() {
  const playerPos = useRef(new THREE.Vector3(0, 0, 4));

  return (
    <>
      <color attach="background" args={[palette.nightSky]} />

      <ambientLight intensity={0.06} color="#4A6088" />
      <fog attach="fog" args={['#101A30', 14, 78]} />
      <directionalLight
        position={[-3, 14, -10]}
        intensity={0.12}
        color="#A8C4E8"
      />

      <Suspense fallback={null}>
        <GrayboxStreet playerZRef={playerPos} />
      </Suspense>
      <PlayerController positionRef={playerPos} />
      <CameraRig playerRef={playerPos} />
      <SketchPostFX />
    </>
  );
}

export default function AnimeSketchWorld() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: palette.nightSky,
      }}
    >
      <StreetAmbience />
      <Canvas
        camera={{
          fov: 35,
          position: [0, 3.2, 9.5],
          near: 0.1,
          far: 220,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.1, -4);
        }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'block' }}
      >
        <Scene />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <StreetTitle />
        <StreetClock />
        <MobileControls />
        <div
          className="walk-hint"
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#A8B8C8',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            opacity: 0.65,
          }}
        >
          WASD / ↑↓←→ to walk · click or press a key for sound
        </div>
      </div>
    </div>
  );
}
