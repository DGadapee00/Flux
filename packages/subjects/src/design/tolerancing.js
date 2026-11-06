/**
 * Tolerancing: fits, stack-ups, position zones and process capability. Our own derivations.
 *
 * Every closed form here has a numeric partner. Sizes are binned onto a grid of step h: a part's
 * size distribution becomes the probability of each bin, found from its CDF, so the masses sum to one
 * exactly. The distribution of a sum or a difference is then a discrete convolution of those masses,
 * which makes no assumption about the shape of the result. Binning adds h²/12 to each variance
 * (Sheppard's correction); the numeric variances below subtract it.
 *
 * Fits use the hole-basis deviations of ISO 286 as given by Wikipedia's Engineering fit article for a
 * 50 mm diameter (read 6 November 2026). The limits themselves are inputs.
 */
import { normCdf, normSf } from '../stats/dist.js';

/** Extreme clearances from the limits, in the units given (μm in the labs). Negative is interference. */
export function fitLimits({ holeLo, holeHi, shaftLo, shaftHi }) {
  const cMin = holeLo - shaftHi;
  const cMax = holeHi - shaftLo;
  const type = cMin >= 0 ? 'clearance' : cMax <= 0 ? 'interference' : 'transition';
  return { cMin, cMax, type };
}

/** A part's size spread: normal with the band as ±3σ/cp about its middle, or uniform across the band. */
export function spread(lo, hi, { kind = 'normal', cp = 1 } = {}) {
  const mid = (lo + hi) / 2;
  if (kind === 'uniform') return { kind, mid, lo, hi, sd: (hi - lo) / Math.sqrt(12) };
  return { kind, mid, lo, hi, sd: (hi - lo) / (6 * cp) };
}

const cdfOf = (s) => (s.kind === 'uniform'
  ? (x) => (x <= s.lo ? 0 : x >= s.hi ? 1 : (x - s.lo) / (s.hi - s.lo))
  : (x) => normCdf(x, s.mid, s.sd));

/** Bin a spread onto the grid x = k h. Returns { k0, w } with w[i] the mass of bin k0 + i. */
export function binned(s, h) {
  const reach = s.kind === 'uniform' ? 0 : 9 * s.sd;
  const kLo = Math.floor((Math.min(s.lo, s.mid - reach)) / h) - 1;
  const kHi = Math.ceil((Math.max(s.hi, s.mid + reach)) / h) + 1;
  const F = cdfOf(s);
  const w = [];
  for (let k = kLo; k <= kHi; k++) w.push(F((k + 0.5) * h) - F((k - 0.5) * h));
  return { k0: kLo, w };
}

/** Discrete convolution of two binned distributions (the distribution of the sum). */
export function convolve(a, b) {
  const w = new Array(a.w.length + b.w.length - 1).fill(0);
  for (let i = 0; i < a.w.length; i++) {
    const ai = a.w[i];
    if (ai < 1e-300) continue;
    for (let j = 0; j < b.w.length; j++) w[i + j] += ai * b.w[j];
  }
  return { k0: a.k0 + b.k0, w };
}

/** The negative of a binned variable. */
export const negate = (a) => ({ k0: -(a.k0 + a.w.length - 1), w: [...a.w].reverse() });

/** Mean and variance of a binned distribution, with Sheppard's correction for `parts` binned inputs. */
export function moments(g, h, parts = 1) {
  let m = 0;
  let m2 = 0;
  g.w.forEach((p, i) => {
    const x = (g.k0 + i) * h;
    m += p * x;
    m2 += p * x * x;
  });
  return { mean: m, variance: m2 - m * m - (parts * h * h) / 12 };
}

/** Mass below x, taking each bin's mass as spread evenly across its width. */
export function massBelow(g, h, x) {
  let s = 0;
  g.w.forEach((p, i) => {
    const a = (g.k0 + i - 0.5) * h;
    if (x >= a + h) s += p;
    else if (x > a) s += (p * (x - a)) / h;
  });
  return s;
}

/** Chance that a hole and shaft drawn from their spreads interfere: closed form for normal spreads. */
export function interferenceChance(hole, shaft) {
  const mu = hole.mid - shaft.mid;
  const sd = Math.hypot(hole.sd, shaft.sd);
  return { mean: mu, sd, p: normCdf(0, mu, sd) };
}

/** The same chance by convolving the binned hole with the negated binned shaft. */
export function interferenceChanceNumeric(hole, shaft, h) {
  const c = convolve(binned(hole, h), negate(binned(shaft, h)));
  return { p: massBelow(c, h, 0), ...moments(c, h, 2), dist: c };
}

/**
 * A stack of n parts, each ±T about its nominal. Worst case is ±nT; root-sum-square is ±3σ√n with σ
 * the part's spread. The share outside ±S uses the normal approximation for the sum.
 */
export function stackClosed({ n, T, S, kind = 'normal' }) {
  const sd1 = kind === 'uniform' ? (2 * T) / Math.sqrt(12) : T / 3;
  const sd = sd1 * Math.sqrt(n);
  return { worst: n * T, rss: 3 * sd, sd, outside: 2 * normSf(S, 0, sd) };
}

/** The stack by convolving n binned parts: its exact spread, its reach, and the share outside ±S. */
export function stackNumeric({ n, T, S, kind = 'normal' }, bins = 160) {
  const h = (2 * T) / bins;
  const part = binned(spread(-T, T, { kind }), h);
  let g = part;
  for (let i = 1; i < n; i++) g = convolve(g, part);
  const { variance } = moments(g, h, n);
  let reach = 0;
  g.w.forEach((p, i) => {
    if (p > 0) reach = Math.max(reach, Math.abs((g.k0 + i) * h));
  });
  const outside = massBelow(g, h, -S) + (1 - massBelow(g, h, S));
  return { sd: Math.sqrt(Math.max(variance, 0)), reach, outside, dist: g, h };
}

/**
 * A hole placed with a round scatter of spread σ about its true position, inspected two ways: a square
 * box ±t in x and y, or a round position zone of diameter ⌀. Closed forms: the box accepts
 * (2Φ(t/σ) − 1)², the circle 1 − exp(−r²/2σ²) (a Rayleigh distance).
 */
export function positionYield({ t, sigma, dia }) {
  const box1 = 1 - 2 * normSf(t, 0, sigma);
  const r = dia / 2;
  return { box: box1 * box1, circle: -Math.expm1(-(r * r) / (2 * sigma * sigma)) };
}

/** The same yields by integrating the scatter's density over each zone with Simpson's rule in 2D. */
export function positionYieldNumeric({ t, sigma, dia }, n = 120) {
  const m = n % 2 ? n + 1 : n;
  const f = (x, y) => Math.exp(-(x * x + y * y) / (2 * sigma * sigma)) / (2 * Math.PI * sigma * sigma);
  const wt = (i) => (i === 0 || i === m ? 1 : i % 2 ? 4 : 2);
  const hb = (2 * t) / m;
  let box = 0;
  for (let i = 0; i <= m; i++) for (let j = 0; j <= m; j++) box += wt(i) * wt(j) * f(-t + i * hb, -t + j * hb);
  box *= (hb * hb) / 9;
  // Polar: r from 0 to the zone's radius, θ round the circle (the trapezoid rule is exact for a periodic integrand).
  const r = dia / 2;
  const hr = r / m;
  const nt = 64;
  let circle = 0;
  for (let i = 0; i <= m; i++) {
    const rr = i * hr;
    let ring = 0;
    for (let k = 0; k < nt; k++) {
      const th = (2 * Math.PI * k) / nt;
      ring += f(rr * Math.cos(th), rr * Math.sin(th));
    }
    circle += wt(i) * rr * ring * ((2 * Math.PI) / nt);
  }
  circle *= hr / 3;
  return { box, circle };
}

/** Capability of a normal process against its limits, with the share out by the closed form. */
export function capability({ mu, sigma, lsl, usl }) {
  const cp = (usl - lsl) / (6 * sigma);
  const cpk = Math.min(usl - mu, mu - lsl) / (3 * sigma);
  const out = normCdf(lsl, mu, sigma) + normSf(usl, mu, sigma);
  return { cp, cpk, out };
}

/** The share out by integrating the normal density between the limits with Simpson's rule. */
export function capabilityNumeric({ mu, sigma, lsl, usl }, n = 2000) {
  const m = n % 2 ? n + 1 : n;
  const h = (usl - lsl) / m;
  let s = 0;
  for (let i = 0; i <= m; i++) {
    const x = lsl + i * h;
    const z = (x - mu) / sigma;
    s += (i === 0 || i === m ? 1 : i % 2 ? 4 : 2) * Math.exp(-0.5 * z * z);
  }
  return { out: 1 - (s * h) / 3 / (sigma * Math.sqrt(2 * Math.PI)) };
}

/**
 * A process mean drifting up by δ per subgroup of n parts, from μ₀. The x̄ chart flags the first
 * subgroup whose mean passes μ₀ + 3σ/√n; parts start to fall out when the mean passes USL − 3σ.
 */
export function driftClosed({ mu0, sigma, usl, delta, n }) {
  // A tie (the mean lands exactly on a line) counts as not past it, in both methods.
  const flag = Math.floor((3 * sigma) / (Math.sqrt(n) * delta) + 1e-9) + 1;
  const out = Math.max(1, Math.floor((usl - 3 * sigma - mu0) / delta + 1e-9) + 1);
  return { flag, out };
}

/** The same two subgroup numbers by stepping the mean one subgroup at a time. */
export function driftNumeric({ mu0, sigma, usl, delta, n }, max = 10000) {
  let flag = null;
  let out = null;
  for (let k = 1; k <= max && (flag === null || out === null); k++) {
    const m = mu0 + k * delta;
    if (flag === null && m - (mu0 + (3 * sigma) / Math.sqrt(n)) > 1e-9 * delta) flag = k;
    if (out === null && m - (usl - 3 * sigma) > 1e-9 * delta) out = k;
  }
  return { flag, out };
}
