/**
 * Closed forms and region descriptions for double-integral labs.
 * Route A when the antiderivative is a polynomial / a known polar integral.
 */

const P = (p) => ({ a: p?.a ?? 1, b: p?.b ?? 1, c: p?.c ?? 0 });

function x1(xa, xb) {
  return (xb * xb - xa * xa) / 2;
}
function y1(ya, yb) {
  return (yb * yb - ya * ya) / 2;
}
function x2(xa, xb) {
  return (xb * xb * xb - xa * xa * xa) / 3;
}
function y2(ya, yb) {
  return (yb * yb * yb - ya * ya * ya) / 3;
}

export function closedRect(id, xa, xb, ya, yb, p) {
  const { a, b, c } = P(p);
  const dx = xb - xa;
  const dy = yb - ya;
  if (id === 'one') return dx * dy;
  if (id === 'xy') return a * x1(xa, xb) * y1(ya, yb);
  if (id === 'paraboloid') return a * x2(xa, xb) * dy + b * y2(ya, yb) * dx;
  if (id === 'saddle') return a * x2(xa, xb) * dy - b * y2(ya, yb) * dx;
  if (id === 'plane') return a * x1(xa, xb) * dy + b * y1(ya, yb) * dx + c * dx * dy;
  if (id === 'prod2') return a * x2(xa, xb) * y1(ya, yb);
  return NaN;
}

/** Disk of radius R about the origin. */
export function closedDisk(id, R, p) {
  const { a, b, c } = P(p);
  const area = Math.PI * R * R;
  if (id === 'one') return area;
  if (id === 'paraboloid') return (Math.PI * R ** 4 / 4) * (a + b);
  if (id === 'saddle') return (Math.PI * R ** 4 / 4) * (a - b);
  if (id === 'xy') return 0;
  if (id === 'plane') return c * area;
  if (id === 'gaussian') return Math.PI * (1 - Math.exp(-R * R));
  return NaN;
}

/** Right triangle x≥0, y≥0, x+y≤1. */
export function closedTriangle(id, p) {
  const { a } = P(p);
  if (id === 'one') return 0.5;
  if (id === 'xy') return a / 24;
  if (id === 'paraboloid') return 1 / 6;
  return NaN;
}

export function diskTypeI(R) {
  const r2 = R * R;
  return {
    xa: -R,
    xb: R,
    yLo: (x) => -Math.sqrt(Math.max(0, r2 - x * x)),
    yHi: (x) => Math.sqrt(Math.max(0, r2 - x * x)),
  };
}

export function diskTypeII(R) {
  const r2 = R * R;
  return {
    ya: -R,
    yb: R,
    xLo: (y) => -Math.sqrt(Math.max(0, r2 - y * y)),
    xHi: (y) => Math.sqrt(Math.max(0, r2 - y * y)),
  };
}

export function triangleBounds() {
  return {
    xa: 0,
    xb: 1,
    yLo: () => 0,
    yHi: (x) => 1 - x,
    ya: 0,
    yb: 1,
    xLo: () => 0,
    xHi: (y) => 1 - y,
  };
}

export function parabolaBounds() {
  return {
    xa: -1,
    xb: 1,
    yLo: () => 0,
    yHi: (x) => 1 - x * x,
  };
}
