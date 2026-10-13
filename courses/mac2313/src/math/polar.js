/**
 * Polar coordinates as in Merino Theorem 10: for (x,y) ≠ (0,0) there is a unique pair
 * (r, θ) in (0, ∞) × [0, 2π) with x = r cos θ, y = r sin θ.
 *
 * atan2 returns (−π, π]; wrapTau sends that into [0, 2π).
 */

export function wrapTau(th) {
  const tau = 2 * Math.PI;
  let t = th % tau;
  if (t < 0) t += tau;
  if (t >= tau - 1e-12) t = 0;
  return t;
}

export function toPolar(x, y) {
  const r = Math.hypot(x, y);
  if (r < 1e-15) return { r: 0, theta: NaN };
  return { r, theta: wrapTau(Math.atan2(y, x)) };
}

export function toCart(r, theta) {
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

export function rHat(theta) {
  return { x: Math.cos(theta), y: Math.sin(theta), z: 0 };
}

export function thetaHat(theta) {
  return { x: -Math.sin(theta), y: Math.cos(theta), z: 0 };
}

export function thetaDeg(theta) {
  if (!Number.isFinite(theta)) return NaN;
  return (wrapTau(theta) * 180) / Math.PI;
}
