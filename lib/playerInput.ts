export const keys: Record<string, boolean> = {};

export const touchMove = {
  up: false,
  down: false,
  left: false,
  right: false,
};

export function getMoveInput() {
  const dx =
    (keys.ArrowRight || keys.d || keys.D || touchMove.right ? 1 : 0) -
    (keys.ArrowLeft || keys.a || keys.A || touchMove.left ? 1 : 0);
  const dz =
    (keys.ArrowDown || keys.s || keys.S || touchMove.down ? 1 : 0) -
    (keys.ArrowUp || keys.w || keys.W || touchMove.up ? 1 : 0);
  return { dx, dz };
}

export function isMoving() {
  const { dx, dz } = getMoveInput();
  return dx !== 0 || dz !== 0;
}
