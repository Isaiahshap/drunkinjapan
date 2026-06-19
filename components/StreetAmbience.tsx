'use client';
import { useEffect, useRef } from 'react';
import { isMoving } from '@/lib/playerInput';
import { registerStreetAudioStart } from '@/lib/streetAudio';

/**
 * CC0 street ambience — BigSoundBank (Joseph SARDIN / Pierre SIBANARCO, public domain).
 * city-rain.ogg — "Rain under an umbrella" in street (#2679)
 * city-rain-bed.ogg — "Summer rain on terrace" (#1019)
 * urban-night.ogg — "Paris by Night" (#0680)
 * 雨のネオン.mp3 — background track
 * https://bigsoundbank.com
 */

const BG_MUSIC = '/audio/%E9%9B%A8%E3%81%AE%E3%83%8D%E3%82%AA%E3%83%B3.mp3';

const LAYERS = [
  { src: '/audio/city-rain.ogg', volume: 0.42, playbackRate: 1 },
  { src: '/audio/city-rain-bed.ogg', volume: 0.24, playbackRate: 1 },
  { src: '/audio/urban-night.ogg', volume: 0.12, playbackRate: 1 },
  { src: BG_MUSIC, volume: 0.34, playbackRate: 1, steady: true },
] as const;

function playSoftStep(ctx: AudioContext, t: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180 + Math.random() * 40, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.045, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

export default function StreetAmbience() {
  const startedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tracksRef = useRef<HTMLAudioElement[]>([]);
  const stepRef = useRef(0);

  useEffect(() => {
    const tracks = LAYERS.map(({ src, volume, playbackRate }) => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.preload = 'auto';
      return audio;
    });
    tracksRef.current = tracks;

    const startAudio = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      void ctx.resume().catch(() => {});

      for (const track of tracks) {
        void track.play().catch(() => {});
      }
    };

    const unregister = registerStreetAudioStart(startAudio);

    const onKey = () => {
      startAudio();
    };

    const onPointer = () => {
      startAudio();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('touchstart', onPointer, { passive: true });

    const drift = window.setInterval(() => {
      if (!startedRef.current) return;
      const wobble = 0.88 + Math.sin(Date.now() * 0.0009) * 0.14;
      tracks.forEach((track, i) => {
        const layer = LAYERS[i];
        if ('steady' in layer && layer.steady) {
          track.volume = layer.volume;
          return;
        }
        if (i === 0) {
          track.volume = layer.volume * (0.94 + wobble * 0.06);
        } else if (i === 1) {
          track.volume = layer.volume * (0.96 + wobble * 0.04);
        } else {
          track.volume = layer.volume * wobble;
        }
      });
    }, 120);

    const steps = window.setInterval(() => {
      if (!startedRef.current) return;
      if (!isMoving()) return;

      const ctx = audioCtxRef.current;
      if (!ctx) return;
      stepRef.current += 1;
      if (stepRef.current % 2 !== 0) return;
      playSoftStep(ctx, ctx.currentTime);
    }, 340);

    return () => {
      unregister();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('touchstart', onPointer);
      window.clearInterval(drift);
      window.clearInterval(steps);
      tracks.forEach((track) => {
        track.pause();
        track.src = '';
      });
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return null;
}
