'use client';
import { Zen_Antique } from 'next/font/google';

const titleFont = Zen_Antique({
  weight: '400',
  subsets: ['latin'],
});

const HUD_COLOR = '#D8E8F8';

export default function StreetTitle() {
  return (
    <div
      className={titleFont.className}
      style={{
        position: 'absolute',
        top: 24,
        left: 28,
        zIndex: 20,
        color: HUD_COLOR,
        fontSize: 30,
        letterSpacing: '0.08em',
        lineHeight: 1.1,
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 0 22px rgba(180, 210, 255, 0.45), 0 1px 0 rgba(0,0,0,0.35)',
      }}
    >
      drunk in japan
    </div>
  );
}
