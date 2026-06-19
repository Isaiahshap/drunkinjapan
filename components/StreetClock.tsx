'use client';
import { useEffect, useState } from 'react';

const START_HOUR = 4;
const START_MINUTE = 34;
const HUD_COLOR = '#C8DCF0';

function formatClockTime(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function StreetClock() {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedMinutes((minutes) => minutes + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const display = formatClockTime(START_HOUR * 60 + START_MINUTE + elapsedMinutes);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 28,
        zIndex: 20,
        color: HUD_COLOR,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 15,
        letterSpacing: '0.06em',
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 0 14px rgba(160, 200, 255, 0.35)',
      }}
    >
      {display}
    </div>
  );
}
