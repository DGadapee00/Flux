import { dirQuotient, gradNumeric } from './ndiff.js';

export function unitize(x, y) {
  const L = Math.hypot(x, y);
  if (L < 1e-15) return { x: 0, y: 0, z: 0, len: 0 };
  return { x: x / L, y: y / L, z: 0, len: L };
}

export function dirFromAngle(theta) {
  return { x: Math.cos(theta), y: Math.sin(theta), z: 0 };
}

export function directional(fx, fy, ux, uy) {
  return fx * ux + fy * uy;
}

/** Angle of ∇f in (−π, π]. Zero vector → NaN. */
export function steepestAngle(fx, fy) {
  if (Math.hypot(fx, fy) < 1e-15) return NaN;
  return Math.atan2(fy, fx);
}

/**
 * Sweep θ over [0, 2π) in `steps` samples, evaluate the forward difference quotient along
 * û(θ), and return the argmax and that maximum value.
 */
export function steepestSweep(f, x, y, { steps = 720, h = 1e-5 } = {}) {
  let bestTh = 0;
  let best = -Infinity;
  for (let i = 0; i < steps; i++) {
    const th = (2 * Math.PI * i) / steps;
    const ux = Math.cos(th);
    const uy = Math.sin(th);
    const d = dirQuotient(f, x, y, ux, uy, h);
    if (d > best) {
      best = d;
      bestTh = th;
    }
  }
  return { theta: bestTh, Du: best };
}

export function wrapPi(a) {
  let d = a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export { gradNumeric, dirQuotient };
