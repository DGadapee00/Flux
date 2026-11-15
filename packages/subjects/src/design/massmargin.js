/**
 * A spacecraft mass budget: basic masses, a growth allowance, and the margin left under the launch
 * allocation. Our own model.
 *
 * Each item has a basic mass b, the best estimate today. Its finished mass is b(1 + g), where the
 * growth g is uncertain and larger for a less mature design. Following NASA/TM-20250008066
 * (Charoenboonvivat, 2025), g is drawn from a Beta distribution with mean μ set by maturity and
 * shape α = 10, so β = α(1 − μ)/μ and a larger mean brings a larger spread. The means by maturity,
 * GROWTH below, are this course's assumptions, not a standard's.
 *
 * The budget carries one flat allowance a on every item: the predicted mass is P = B(1 + a), with
 * B = Σb, and the margin is L − P under the allocation L. The allowance is bookkeeping. It does not
 * change what the craft will weigh.
 *
 * Closed form: the finished mass M = Σ b(1 + g) has mean Σ b(1 + μ) and variance Σ b²σ², with
 * σ² = αβ/((α + β)²(α + β + 1)). A normal curve with that mean and spread estimates the chance
 * that M exceeds L.
 *
 * Second method: bin each item's finished mass on a grid of width h from the Beta's own
 * cumulative distribution, convolve the items, and read the mean, the spread and the chance of
 * exceeding L off the result. The mean and spread must agree with the closed form; the chance is
 * the convolution's, since the sum of Betas is skewed and the normal curve only estimates it.
 */
import { betaI, normSf } from '../stats/dist.js';
import { convolve, massBelow, moments } from './tolerancing.js';

/** Mean growth by design maturity: this course's assumptions. */
export const GROWTH = Object.freeze({ measured: 0.02, catalog: 0.05, modified: 0.15, new: 0.3 });

/** Beta shape α, as NASA/TM-20250008066 sets it. */
export const ALPHA = 10;

/** Beta parameters, mean and spread of the growth for a maturity. */
export function growth(maturity) {
  const mu = GROWTH[maturity];
  if (!(mu > 0 && mu < 1)) throw new Error(`no growth for maturity "${maturity}"`);
  const a = ALPHA;
  const b = (ALPHA * (1 - mu)) / mu;
  const variance = (a * b) / ((a + b) ** 2 * (a + b + 1));
  return { mu, a, b, sd: Math.sqrt(variance) };
}

/** The closed form for a list of items { basic, maturity }, an allowance a and an allocation L. */
export function marginClosed(items, allowance, limit) {
  let basic = 0;
  let mean = 0;
  let variance = 0;
  for (const it of items) {
    const g = growth(it.maturity);
    basic += it.basic;
    mean += it.basic * (1 + g.mu);
    variance += (it.basic * g.sd) ** 2;
  }
  const predicted = basic * (1 + allowance);
  const sd = Math.sqrt(variance);
  return {
    basic,
    predicted,
    margin: limit - predicted,
    marginShare: (limit - predicted) / limit,
    mean,
    sd,
    pNormal: normSf(limit, mean, sd),
    needed: mean / basic - 1,
  };
}

/** One item's finished mass b(1 + g), binned on x = k h from the Beta's cumulative distribution. */
export function binItem(item, h, reach = 14) {
  const g = growth(item.maturity);
  const gLo = Math.max(0, g.mu - reach * g.sd);
  const gHi = Math.min(1, g.mu + reach * g.sd);
  const kLo = Math.floor((item.basic * (1 + gLo)) / h - 0.5);
  const kHi = Math.ceil((item.basic * (1 + gHi)) / h + 0.5);
  const F = (x) => {
    const u = x / item.basic - 1;
    return u <= 0 ? 0 : u >= 1 ? 1 : betaI(u, g.a, g.b);
  };
  const w = [];
  let prev = F((kLo - 0.5) * h);
  for (let k = kLo; k <= kHi; k++) {
    const next = F((k + 0.5) * h);
    w.push(next - prev);
    prev = next;
  }
  return { k0: kLo, w };
}

/** The second method: the items convolved on a grid of width h (kg). */
export function marginNumeric(items, limit, h = 0.004) {
  let dist = null;
  for (const it of items) {
    const one = binItem(it, h);
    dist = dist ? convolve(dist, one) : one;
  }
  const { mean, variance } = moments(dist, h, items.length);
  return { mean, sd: Math.sqrt(Math.max(variance, 0)), pExceed: 1 - massBelow(dist, h, limit), dist, h };
}

/** Both methods and their relative gap on the mean and the spread. The grid is a sixtieth of the spread, 4 g at most. */
export function marginChecked(items, allowance, limit, h) {
  const c = marginClosed(items, allowance, limit);
  const n = marginNumeric(items, limit, h ?? Math.min(0.004, c.sd / 60));
  const gap = Math.max(Math.abs(n.mean - c.mean) / c.mean, Math.abs(n.sd - c.sd) / c.sd);
  return { ...c, numMean: n.mean, numSd: n.sd, pExceed: n.pExceed, dist: n.dist, h: n.h, gap };
}
