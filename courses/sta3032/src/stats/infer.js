/**
 * Inference for Chapters 7–10: every test and interval in the notes, as the TI-84 computes them
 * (the class works them on the calculator). Each returns the pieces a worked solution shows.
 *
 * Tails: 'two' (≠), 'left' (<), 'right' (>). P-values are exact; Welch's df is the calculator's
 * fractional value.
 */
import { normCdf, normSf, zCrit, tSf, tCdf, tCrit, fSf, fCdf, fCrit } from './dist.js';
import { mean, sd, variance, regression } from './describe.js';

export const TAILS = ['two', 'left', 'right'];

/** P-value from a statistic and its distribution's lower and upper tails. */
export function pValue(side, stat, cdf, sf) {
  if (side === 'left') return cdf(stat);
  if (side === 'right') return sf(stat);
  return Math.min(1, 2 * Math.min(cdf(stat), sf(stat)));
}

const zP = (side, z) => pValue(side, z, (x) => normCdf(x), (x) => normSf(x));
const tP = (side, t, df) => pValue(side, t, (x) => tCdf(x, df), (x) => tSf(x, df));

/** z_{α/2} and the interval x ± z·SE. */
function zInt(est, se, conf) {
  const alpha = 1 - conf;
  const z = zCrit(alpha / 2);
  return { alpha, crit: z, E: z * se, lo: est - z * se, hi: est + z * se };
}
function tInt(est, se, df, conf) {
  const alpha = 1 - conf;
  const t = tCrit(alpha / 2, df);
  return { alpha, crit: t, E: t * se, lo: est - t * se, hi: est + t * se };
}

// ---------- one sample ----------
export function zTest({ xbar, sigma, n, mu0, side }) {
  const se = sigma / Math.sqrt(n);
  const z = (xbar - mu0) / se;
  return { se, z, p: zP(side, z) };
}
export const zInterval = ({ xbar, sigma, n, conf }) => ({ se: sigma / Math.sqrt(n), ...zInt(xbar, sigma / Math.sqrt(n), conf) });

export function tTest({ xbar, s, n, mu0, side }) {
  const se = s / Math.sqrt(n);
  const t = (xbar - mu0) / se;
  return { se, t, df: n - 1, p: tP(side, t, n - 1) };
}
export const tInterval = ({ xbar, s, n, conf }) => ({ se: s / Math.sqrt(n), df: n - 1, ...tInt(xbar, s / Math.sqrt(n), n - 1, conf) });

export function propTest({ x, n, p0, side }) {
  const phat = x / n;
  const se = Math.sqrt((p0 * (1 - p0)) / n);
  const z = (phat - p0) / se;
  return { phat, se, z, p: zP(side, z), check: n * p0 * (1 - p0) };
}
export function propInterval({ x, n, conf }) {
  const phat = x / n;
  const se = Math.sqrt((phat * (1 - phat)) / n);
  return { phat, se, check: n * phat * (1 - phat), ...zInt(phat, se, conf) };
}

// ---------- two samples ----------
export function twoPropTest({ x1, n1, x2, n2, side }) {
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pool = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
  const z = (p1 - p2) / se;
  return { p1, p2, pool, se, z, p: zP(side, z) };
}
export function twoPropInterval({ x1, n1, x2, n2, conf }) {
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  return { p1, p2, se, ...zInt(p1 - p2, se, conf) };
}

export function twoZTest({ x1, x2, v1, v2, n1, n2, d0 = 0, side }) {
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const z = (x1 - x2 - d0) / se;
  return { se, z, p: zP(side, z) };
}
export const twoZInterval = ({ x1, x2, v1, v2, n1, n2, conf }) => {
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  return { se, ...zInt(x1 - x2, se, conf) };
};

/** F test for σ₁² = σ₂², f = s₁²/s₂² on (n₁ − 1, n₂ − 1) df. */
export function fTest({ s1sq, s2sq, n1, n2, side }) {
  const f = s1sq / s2sq;
  const d1 = n1 - 1;
  const d2 = n2 - 1;
  return { f, d1, d2, p: pValue(side, f, (x) => fCdf(x, d1, d2), (x) => fSf(x, d1, d2)) };
}
/** CI for σ₁²/σ₂²: (ratio / f_{α/2}(ν₁, ν₂), ratio · f_{α/2}(ν₂, ν₁)). */
export function fInterval({ s1sq, s2sq, n1, n2, conf }) {
  const alpha = 1 - conf;
  const ratio = s1sq / s2sq;
  const fa = fCrit(alpha / 2, n1 - 1, n2 - 1);
  const fb = fCrit(alpha / 2, n2 - 1, n1 - 1);
  return { alpha, ratio, fa, fb, lo: ratio / fa, hi: ratio * fb };
}

export function pooledTest({ x1, x2, s1, s2, n1, n2, d0 = 0, side }) {
  const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2);
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  const df = n1 + n2 - 2;
  const t = (x1 - x2 - d0) / se;
  return { sp2, se, df, t, p: tP(side, t, df) };
}
export function pooledInterval({ x1, x2, s1, s2, n1, n2, conf }) {
  const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2);
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  return { sp2, se, df: n1 + n2 - 2, ...tInt(x1 - x2, se, n1 + n2 - 2, conf) };
}

/** Welch–Satterthwaite df, fractional as the TI-84 reports it. */
export function welchDf(s1, n1, s2, n2) {
  const a = (s1 * s1) / n1;
  const b = (s2 * s2) / n2;
  return (a + b) ** 2 / (a * a / (n1 - 1) + (b * b) / (n2 - 1));
}
export function welchTest({ x1, x2, s1, s2, n1, n2, d0 = 0, side }) {
  const se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);
  const df = welchDf(s1, n1, s2, n2);
  const t = (x1 - x2 - d0) / se;
  return { se, df, t, p: tP(side, t, df) };
}
export function welchInterval({ x1, x2, s1, s2, n1, n2, conf }) {
  const se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);
  const df = welchDf(s1, n1, s2, n2);
  return { se, df, ...tInt(x1 - x2, se, df, conf) };
}

export function pairedTest({ xs, ys, d0 = 0, side }) {
  const d = xs.map((x, i) => x - ys[i]);
  const n = d.length;
  const dbar = mean(d);
  const sdd = sd(d);
  const t = (dbar - d0) / (sdd / Math.sqrt(n));
  return { d, n, dbar, sd: sdd, df: n - 1, t, p: tP(side, t, n - 1) };
}
export function pairedInterval({ xs, ys, conf }) {
  const d = xs.map((x, i) => x - ys[i]);
  const n = d.length;
  const dbar = mean(d);
  const sdd = sd(d);
  return { d, n, dbar, sd: sdd, df: n - 1, ...tInt(dbar, sdd / Math.sqrt(n), n - 1, conf) };
}

// ---------- regression ----------
/** LinRegTTest: slope (equivalently ρ) = 0, t = r√(n−2)/√(1−r²) on n − 2 df. */
export function linRegTest({ xs, ys, side }) {
  const R = regression(xs, ys);
  const t = (R.r * Math.sqrt(R.n - 2)) / Math.sqrt(1 - R.r * R.r);
  return { ...R, a: R.b0, b: R.b1, t, df: R.n - 2, p: tP(side, t, R.n - 2) };
}

export { mean, sd, variance, regression };
