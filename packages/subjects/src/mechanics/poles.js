/**
 * Poles and the step response of a second-order system (the satellite's attitude loop, seen through
 * its transfer function).
 *
 * A pair of poles p, p̄ = σ ± jω gives
 *   G(s) = K / ((s − p)(s − p̄)) = K / (s² − 2σ s + σ² + ω²),
 * with K = σ² + ω² so that a settling response ends at 1. Each pole is a mode e^{pt} of the response,
 * so its real part σ decides everything about the long run: σ < 0 decays, σ > 0 grows without bound
 * however small σ is. The Routh test for a quadratic reads the same off the coefficients: stable
 * exactly when −2σ > 0 and σ² + ω² > 0.
 *
 * The closed form is the inverse Laplace transform of G(s)/s by partial fractions:
 *   ω > 0:        y = K [ 1/|p|² + 2 Re( e^{pt} / (p (p − p̄)) ) ],
 *   ω = 0, σ ≠ 0: y = 1 + e^{σt} (σt − 1)   (a double pole, K = σ²),
 *   p = 0:        y = t²/2   (K taken as 1).
 * The second method integrates y'' − 2σ y' + (σ² + ω²) y = K by RK4 and compares at every sample.
 */

const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cexp = (z) => [Math.exp(z[0]) * Math.cos(z[1]), Math.exp(z[0]) * Math.sin(z[1])];

/** K: the DC gain made 1, except for poles at the origin, where there is no DC gain to fix. */
export const gainOf = (sigma, omega) => (sigma * sigma + omega * omega > 1e-12 ? sigma * sigma + omega * omega : 1);

/** The closed-form step response at time t. */
export function stepAt(sigma, omega, t) {
  const K = gainOf(sigma, omega);
  if (omega > 0) {
    const p = [sigma, omega];
    const term = cdiv(cexp([sigma * t, omega * t]), cmul(p, [0, 2 * omega]));
    return K * (1 / (sigma * sigma + omega * omega) + 2 * term[0]);
  }
  // The double pole, with K = σ² multiplied through: no division by σ.
  if (sigma * sigma > 1e-12) return 1 + Math.exp(sigma * t) * (sigma * t - 1);
  return (t * t) / 2;
}

/** RK4 on the differential equation, from rest, sampled every `dt` with `sub` steps between samples. */
export function stepRK4(sigma, omega, T, samples, sub = 20) {
  const K = gainOf(sigma, omega);
  const a1 = -2 * sigma;
  const a0 = sigma * sigma + omega * omega;
  const f = (y, v) => [v, K - a1 * v - a0 * y];
  let y = 0;
  let v = 0;
  const out = [0];
  const h = T / samples / sub;
  for (let n = 0; n < samples; n++) {
    for (let k = 0; k < sub; k++) {
      const k1 = f(y, v);
      const k2 = f(y + (h / 2) * k1[0], v + (h / 2) * k1[1]);
      const k3 = f(y + (h / 2) * k2[0], v + (h / 2) * k2[1]);
      const k4 = f(y + h * k3[0], v + h * k3[1]);
      y += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      v += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    }
    out.push(y);
  }
  return out;
}

/** Both routes over [0, T], and what the poles predict. */
export function polesChecked({ sigma, omega, T = 12, samples = 240 }) {
  const ts = Array.from({ length: samples + 1 }, (_, i) => (T * i) / samples);
  const closed = ts.map((t) => stepAt(sigma, omega, t));
  const numeric = stepRK4(sigma, omega, T, samples);
  const big = Math.max(...closed.map(Math.abs), 1e-12);
  const gap = Math.max(...closed.map((y, i) => Math.abs(y - numeric[i]))) / big;
  const stable = sigma < 0;
  const wn = Math.hypot(sigma, omega);
  const zeta = wn > 0 ? -sigma / wn : null;
  // For a stable, oscillating pair: peak overshoot and the 2% settling time, 4/|σ|.
  const overshoot = stable && omega > 0 ? Math.exp((Math.PI * sigma) / omega) : stable ? 0 : null;
  const settle = stable ? 4 / -sigma : null;
  return {
    ts, closed, numeric, gap, stable,
    routh: { a1: -2 * sigma, a0: sigma * sigma + omega * omega },
    wn, zeta, overshoot, settle,
    period: omega > 0 ? (2 * Math.PI) / omega : null,
    // Where a growing response has got to by the end, and how fast it doubles.
    yEnd: closed[closed.length - 1],
    doubling: sigma > 0 ? Math.log(2) / sigma : null,
  };
}
