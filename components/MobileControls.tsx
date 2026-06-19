'use client';
import { useEffect, useState } from 'react';
import { touchMove } from '@/lib/playerInput';

type Direction = keyof typeof touchMove;

function setDirection(dir: Direction, active: boolean) {
  touchMove[dir] = active;
}

function ArrowButton({
  dir,
  label,
  style,
}: {
  dir: Direction;
  label: string;
  style?: React.CSSProperties;
}) {
  const bind = (active: boolean) => setDirection(dir, active);

  return (
    <button
      type="button"
      aria-label={label}
      style={{
        width: 58,
        height: 58,
        borderRadius: 14,
        border: '1px solid rgba(200, 220, 240, 0.28)',
        background: 'rgba(16, 26, 48, 0.72)',
        color: '#D8E8F8',
        fontSize: 22,
        lineHeight: 1,
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        ...style,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        bind(true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        bind(false);
      }}
      onPointerCancel={() => bind(false)}
      onPointerLeave={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) bind(false);
      }}
      onLostPointerCapture={() => bind(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

function useMobileUi() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse), (max-width: 768px)');
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return show;
}

export default function MobileControls() {
  const show = useMobileUi();

  useEffect(() => {
    if (!show) return;
    return () => {
      touchMove.up = false;
      touchMove.down = false;
      touchMove.left = false;
      touchMove.right = false;
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        bottom: 28,
        zIndex: 20,
        pointerEvents: 'auto',
        display: 'grid',
        gridTemplateColumns: '58px 58px 58px',
        gridTemplateRows: '58px 58px',
        gap: 8,
      }}
    >
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ArrowButton dir="up" label="↑" />
      </div>
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <ArrowButton dir="left" label="←" />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2 }}>
        <ArrowButton dir="down" label="↓" />
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <ArrowButton dir="right" label="→" />
      </div>
    </div>
  );
}
