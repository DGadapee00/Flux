/** Ideal pin-connected devices. SI throughout; geometry is supplied by the caller. */
export function bridle({ W, theta }) {
  const a = (theta * Math.PI) / 180;
  const T = W / (2 * Math.sin(a));
  return { T, H: T * Math.cos(a), gap: Math.abs(2 * T * Math.sin(a) - W) };
}
/** Moments about the lower wall pin: upper tie force H at h balances W at x. */
export function shelf({ W, x, h }) {
  const H = (W * x) / h;
  return { H, R: Math.hypot(H, W), M: W * x, gap: Math.abs(H * h - W * x) };
}
/** Symmetric triangular panel. Apex equilibrium gives diagonal compression C. */
export function gantry({ W, L, h }) {
  const ell = Math.hypot(L / 2, h);
  const C = (W * ell) / (2 * h);
  const chord = (W * L) / (4 * h);
  return {
    C,
    chord,
    R: W / 2,
    gap: Math.max(Math.abs((2 * C * h) / ell - W), Math.abs((C * L) / (2 * ell) - chord)),
  };
}
/** Four equal arms of length a. Upper joint: 2 C sin(theta)=W.
 * Side joint: screw force Q=2 C cos(theta). Virtual work: Q dx = -W dH. */
export function scissorJack({ W, a, H }) {
  const x = Math.sqrt(4 * a * a - H * H);
  const C = (W * a) / H;
  const Q = (W * x) / H;
  return { x, C, Q, gap: Math.abs(Q * H - W * x) };
}
/** Horizontal push on a rectangular cabinet. Both possible failure thresholds must be checked. */
export function bookcase({ W, b, hp, mu }) {
  const tip = (W * b) / (2 * hp);
  const slip = mu * W;
  return { tip, slip, P: Math.min(tip, slip), tips: tip < slip, gap: Math.abs(tip * hp - (W * b) / 2) };
}
