'use client';
import { useEffect, useState } from 'react';
import { touchMove } from '@/lib/playerInput';

type Direction = keyof typeof touchMove;

const NO_HIGHLIGHT: React.CSSProperties = {
  touchAction: 'none',
  WebkitTapHighlightColor: 'transparent',
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  outline: 'none',
  cursor: 'default',
};

function setDirection(dir: Direction, active: boolean) {
  touchMove[dir] = active;
}

function ArrowButton({
  dir,
  label,
}: {
  dir: Direction;
  label: string;
}) {
  const [pressed, setPressed] = useState(false);
  const bind = (active: boolean) => {
    setPressed(active);
    setDirection(dir, active);
  };

  return (
    <div
      role="button"
      aria-label={label}
      tabIndex={-1}
      style={{
        ...NO_HIGHLIGHT,
        width: 58,
        height: 58,
        borderRadius: 14,
        border: `1px solid rgba(200, 220, 240, ${pressed ? 0.5 : 0.28})`,
        background: pressed ? 'rgba(32, 48, 78, 0.88)' : 'rgba(16, 26, 48, 0.72)',
        color: '#D8E8F8',
        fontSize: 22,
        lineHeight: 1,
        display: 'grid',
        placeItems: 'center',
        boxShadow: pressed
          ? '0 2px 10px rgba(0, 0, 0, 0.35)'
          : '0 4px 18px rgba(0, 0, 0, 0.28)',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 80ms ease, background 80ms ease, border-color 80ms ease',
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        bind(true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        bind(false);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        bind(false);
      }}
      onLostPointerCapture={() => bind(false)}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {label}
    </div>
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
        ...NO_HIGHLIGHT,
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
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ArrowButton dir="up" label="Move up" />
      </div>
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <ArrowButton dir="left" label="Move left" />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2 }}>
        <ArrowButton dir="down" label="Move down" />
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <ArrowButton dir="right" label="Move right" />
      </div>
    </div>
  );
}
