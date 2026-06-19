'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { BlendFunction, Effect as PPEffect } from 'postprocessing';
import * as THREE from 'three';

const fragmentShader = /* glsl */`
  uniform float uGrain;
  uniform float uHatch;
  uniform float uNight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;
    float lum = dot(color, vec3(0.299, 0.587, 0.114));

    float nightFactor = mix(uNight, 1.0, smoothstep(0.58, 0.96, lum));
    color *= nightFactor;

    float skyLike = smoothstep(0.08, 0.22, color.b) * (1.0 - smoothstep(0.25, 0.45, lum));
    float paintedRoadLike =
      (1.0 - skyLike) *
      smoothstep(0.12, 0.28, color.g) *
      smoothstep(0.10, 0.26, color.b) *
      (1.0 - smoothstep(0.28, 0.42, color.r));
    float asphaltLike =
      (1.0 - skyLike) *
      smoothstep(0.32, 0.1, lum) *
      (1.0 - smoothstep(0.12, 0.28, abs(color.r - color.g)));
    float roadLike = max(paintedRoadLike, asphaltLike * 0.98);

    color = mix(color, floor(color * 10.0 + 0.5) / 10.0, (1.0 - roadLike) * 0.55);

    float shadowPocket =
      (1.0 - smoothstep(0.08, 0.22, lum)) *
      (1.0 - skyLike) *
      (1.0 - roadLike);

    float hatch = step(0.9, mod((uv.x - uv.y) * 72.0, 1.0));
    color = mix(color, vec3(0.08, 0.1, 0.12), hatch * shadowPocket * uHatch);

    float grainAmt = uGrain * mix(1.0, 0.18, roadLike);
    color += (hash(uv * 480.0) - 0.5) * grainAmt;

    outputColor = vec4(color, inputColor.a);
  }
`;

const drunkVisionShader = /* glsl */`
  uniform vec2 uGhostOffset;
  uniform vec2 uGhostOffset2;
  uniform float uGhostMix;
  uniform float uChroma;
  uniform float uBlurMix;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;

    vec3 ghostA = texture2D(inputBuffer, uv + uGhostOffset).rgb;
    vec3 ghostB = texture2D(inputBuffer, uv + uGhostOffset2).rgb;
    vec3 ghosts = (ghostA + ghostB) * 0.5;
    color = mix(color, ghosts, uGhostMix);

    float r = texture2D(inputBuffer, uv + vec2(uChroma, uChroma * 0.35)).r;
    float b = texture2D(inputBuffer, uv - vec2(uChroma, uChroma * 0.25)).b;
    color.r = mix(color.r, r, 0.55);
    color.b = mix(color.b, b, 0.55);

    vec3 soft = (
      texture2D(inputBuffer, uv + vec2(uBlurMix, 0.0)).rgb +
      texture2D(inputBuffer, uv - vec2(uBlurMix, 0.0)).rgb
    ) * 0.5;
    color = mix(color, soft, 0.12);

    outputColor = vec4(color, inputColor.a);
  }
`;

class SketchEffect extends PPEffect {
  constructor() {
    super('SketchEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform<unknown>>([
        ['uGrain', new THREE.Uniform(0.034)],
        ['uHatch', new THREE.Uniform(0.028)],
        ['uNight', new THREE.Uniform(0.4)],
      ]),
    });
  }
}

class DrunkVisionEffect extends PPEffect {
  constructor() {
    super('DrunkVisionEffect', drunkVisionShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform<unknown>>([
        ['uGhostOffset', new THREE.Uniform(new THREE.Vector2(0.004, 0.002))],
        ['uGhostOffset2', new THREE.Uniform(new THREE.Vector2(-0.003, 0.003))],
        ['uGhostMix', new THREE.Uniform(0.3)],
        ['uChroma', new THREE.Uniform(0.003)],
        ['uBlurMix', new THREE.Uniform(0.0012)],
      ]),
    });
  }
}

export default function SketchPostFX() {
  const sketchEffect = useMemo(() => new SketchEffect(), []);
  const drunkEffect = useMemo(() => new DrunkVisionEffect(), []);
  const ghostOffset = useRef(new THREE.Vector2());
  const ghostOffset2 = useRef(new THREE.Vector2());

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    ghostOffset.current.set(
      Math.sin(t * 0.92) * 0.009 + 0.004,
      Math.cos(t * 1.18) * 0.006 + 0.002,
    );
    ghostOffset2.current.set(
      Math.cos(t * 0.78) * -0.007 - 0.003,
      Math.sin(t * 1.05) * 0.007 + 0.003,
    );

    drunkEffect.uniforms.get('uGhostOffset')!.value = ghostOffset.current;
    drunkEffect.uniforms.get('uGhostOffset2')!.value = ghostOffset2.current;
    (drunkEffect.uniforms.get('uGhostMix') as THREE.Uniform<number>).value =
      0.32 + Math.sin(t * 1.4) * 0.08;
    (drunkEffect.uniforms.get('uChroma') as THREE.Uniform<number>).value =
      0.0035 + Math.sin(t * 0.65) * 0.002;
    (drunkEffect.uniforms.get('uBlurMix') as THREE.Uniform<number>).value =
      0.0014 + Math.sin(t * 0.88) * 0.0008;
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.34}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.04}
        mipmapBlur
        radius={0.28}
        levels={3}
      />
      <primitive object={sketchEffect} />
      <primitive object={drunkEffect} />
    </EffectComposer>
  );
}
