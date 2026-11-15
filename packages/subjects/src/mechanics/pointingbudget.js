/**
 * A pointing budget: how far a satellite's boresight lands from its target. Our own model.
 *
 * Errors come in two kinds. Random errors, such as sensor noise and control jitter, are independent
 * and normal on each of the two cross-axes; they add by root sum of squares into one spread σ per
 * axis. Biases, such as a sensor mounted a little off and the frame's thermal bending, are fixed for
 * a pass; the budget adds them straight, as if they all lean the same way, into one offset b.
 *
 * The boresight then lands at distance r from the target with the off-centre Rayleigh (Rice)
 * distribution. The chance it lands inside a requirement cone of half-angle R is, in closed form, a
 * Poisson mixture of gamma distributions:
 *   P(r < R) = Σₙ e^{−λ} λⁿ/n! · P(n + 1, R²/2σ²),   λ = b²/2σ²,
 * with P the regularized lower incomplete gamma function. With no bias it is 1 − e^{−R²/2σ²}.
 *
 * Second method: integrate the offset normal density over the disc in polar coordinates, Simpson's
 * rule in r and the trapezoid rule, exact for a periodic integrand, in θ.
 */
import { gammaP } from '../stats/dist.js';

/**
 * Sensors by the one-axis 1σ accuracy this course takes from NASA's small spacecraft report
 * (2026, Tables 5-5, 5-7 and 5-8), dividing a 3σ figure by 3: a star tracker's 30″, a fine Sun
 * sensor's 0.3° and a horizon sensor's 1°.
 */
export const SENSORS = Object.freeze({
  star: { name: 'Star tracker', sigma: 30 / 3600 / 3 },
  sun: { name: 'Fine Sun sensor', sigma: 0.3 / 3 },
  horizon: { name: 'Horizon sensor', sigma: 1 / 3 },
});

/** The budget's two totals, in degrees. */
export function budgetTotals({ sensor, jitter, misalign, thermal }) {
  const s = SENSORS[sensor].sigma;
  return { sensorSigma: s, sigma: Math.hypot(s, jitter), bias: misalign + thermal };
}

/** Closed form: the chance the boresight lands within R of the target. */
export function insideClosed(bias, sigma, R) {
  const lam = (bias * bias) / (2 * sigma * sigma);
  const x = (R * R) / (2 * sigma * sigma);
  if (lam === 0) return -Math.expm1(-x);
  // Sum the Poisson weights outward from their peak so neither tail underflows.
  const n0 = Math.floor(lam);
  const w0 = Math.exp(-lam + n0 * Math.log(lam) - lgammaInt(n0 + 1));
  let sum = w0 * gammaP(n0 + 1, x);
  let w = w0;
  for (let n = n0 + 1; n < n0 + 2000; n++) {
    w *= lam / n;
    const t = w * gammaP(n + 1, x);
    sum += t;
    if (w < 1e-17) break;
  }
  w = w0;
  for (let n = n0 - 1; n >= 0; n--) {
    w *= (n + 1) / lam;
    sum += w * gammaP(n + 1, x);
    if (w < 1e-17) break;
  }
  return Math.min(1, sum);
}

function lgammaInt(k) {
  let s = 0;
  for (let i = 2; i < k; i++) s += Math.log(i);
  return s;
}

/**
 * Second method: the offset normal density integrated over the disc. Only the ring where the density
 * lives, the bias ± 12σ, is integrated, and the θ grid is fine enough to resolve a spread of angular
 * width σ/b.
 */
export function insideNumeric(bias, sigma, R, nr = 400) {
  const lo = Math.max(0, bias - 12 * sigma);
  const hi = Math.min(R, bias + 12 * sigma);
  if (hi <= lo) return lo >= R ? 0 : 1;
  const m = nr % 2 ? nr + 1 : nr;
  const h = (hi - lo) / m;
  const nt = Math.max(128, Math.ceil((40 * bias) / sigma));
  const ht = (2 * Math.PI) / nt;
  const k = 1 / (2 * Math.PI * sigma * sigma);
  let total = 0;
  for (let i = 0; i <= m; i++) {
    const r = lo + i * h;
    let ring = 0;
    for (let j = 0; j < nt; j++) {
      const th = j * ht;
      const d2 = r * r + bias * bias - 2 * r * bias * Math.cos(th);
      ring += Math.exp(-d2 / (2 * sigma * sigma));
    }
    ring *= ht * k * r;
    total += (i === 0 || i === m ? 1 : i % 2 ? 4 : 2) * ring;
  }
  return (total * h) / 3;
}

/** Both methods, the budget's totals, and the linear "bias plus three sigma" figure. */
export function budgetChecked(state) {
  const t = budgetTotals(state);
  const p = insideClosed(t.bias, t.sigma, state.R);
  const q = insideNumeric(t.bias, t.sigma, state.R);
  return { ...t, p, pNum: q, gap: Math.abs(q - p), threeSigma: t.bias + 3 * t.sigma, rss: Math.hypot(t.bias, 3 * t.sigma) };
}
