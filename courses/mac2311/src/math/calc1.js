/**
 * Calculus I, pure. Each rule has a second route in the selftest:
 * a closed form against a difference quotient, a sum formula against a loop.
 */
import { df1, df1left, df1right } from '@flux/subjects/math/ndiff.js';
import { riemann1d } from '@flux/subjects/math/riemann.js';
import { simpson } from '@flux/subjects/math/quadrature.js';

export const GRAPHS = {
  quad: {
    id: 'quad',
    name: 'x²',
    tex: 'x^2',
    f: (x) => x * x,
    fp: (x) => 2 * x,
    F: (x) => (x * x * x) / 3,
  },
  line: {
    id: 'line',
    name: '2x + 1',
    tex: '2x+1',
    f: (x) => 2 * x + 1,
    fp: () => 2,
    F: (x) => x * x + x,
  },
  cube: {
    id: 'cube',
    name: 'x³',
    tex: 'x^3',
    f: (x) => x * x * x,
    fp: (x) => 3 * x * x,
    F: (x) => (x * x * x * x) / 4,
  },
  abs: {
    id: 'abs',
    name: '|x|',
    tex: '|x|',
    f: (x) => Math.abs(x),
    fp: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN),
    F: (x) => (x * Math.abs(x)) / 2,
  },
  sine: {
    id: 'sine',
    name: 'sin x',
    tex: '\\sin x',
    f: (x) => Math.sin(x),
    fp: (x) => Math.cos(x),
    F: (x) => -Math.cos(x),
  },
};

export function graphById(id) {
  return GRAPHS[id] || GRAPHS.quad;
}

export function secantSlope(f, x, h) {
  return (f(x + h) - f(x)) / h;
}

/** Left sum of x² on [0, 1]: (n−1)(2n−1) / (6n²). */
export function leftSquare01(n) {
  return ((n - 1) * (2 * n - 1)) / (6 * n * n);
}

/** Same sum, added cell by cell. */
export function leftSquareLoop(n) {
  return riemann1d((x) => x * x, 0, 1, { n, sample: 'left' }).sum;
}

/** Midpoint sum of x² on [0, 1], from Σ(i+½)² / n³. */
export function midSquare01(n) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const t = i + 0.5;
    s += t * t;
  }
  return s / (n * n * n);
}

export function midSquareLoop(n) {
  return riemann1d((x) => x * x, 0, 1, { n, sample: 'mid' }).sum;
}

export function exactSquare01() {
  const F = GRAPHS.quad.F;
  return F(1) - F(0);
}

export function simpsonSquare01() {
  return simpson((x) => x * x, 0, 1);
}

export function powerRule(n, x) {
  return n * x ** (n - 1);
}

export function powerQuotient(n, x) {
  return df1((t) => t ** n, x);
}

export function productRule(c, d, x) {
  return 2 * x * (c * x + d) + x * x * c;
}

export function productExpanded(c, d, x) {
  return 3 * c * x * x + 2 * d * x;
}

export function quotientRule(k, x) {
  const den = x + k;
  return (2 * x * den - x * x) / (den * den);
}

export function quotientQuotient(k, x) {
  return df1((t) => (t * t) / (t + k), x);
}

/** Derivative of (ax+b)³. */
export function chainRule(a, b, x) {
  const u = a * x + b;
  return 3 * u * u * a;
}

/** Same derivative after expanding the cube. */
export function chainExpanded(a, b, x) {
  return 3 * a * a * a * x * x + 6 * a * a * b * x + 3 * a * b * b;
}

export function circleSlope(x, y) {
  return -x / y;
}

export function circleSlopeSolved(r, x) {
  const y = Math.sqrt(r * r - x * x);
  return -x / y;
}

export function ladderVelocity(length, x, dx) {
  const y = Math.sqrt(length * length - x * x);
  return { y, dy: (-x * dx) / y };
}

export function sineRule(k, x) {
  return k * Math.cos(k * x);
}

export function sineQuotient(k, x) {
  return df1((t) => Math.sin(k * t), x);
}

export function polyAt(a, b) {
  return a * a + b * a;
}

export function polyAverage(a, b) {
  const f = (x) => x * x + b * x;
  const h = 1e-6;
  return 0.5 * (f(a + h) + f(a - h));
}

export function holeLimit(a) {
  return a + a;
}

export function holePlugged(a) {
  const h = 1e-6;
  const f = (x) => (x * x - a * a) / (x - a);
  return 0.5 * (f(a + h) + f(a - h));
}

export function lawExact(c, a) {
  return c * a * a + 3 * a;
}

export function lawAverage(c, a) {
  const f = (x) => c * x * x + 3 * x;
  const h = 1e-6;
  return 0.5 * (f(a + h) + f(a - h));
}

export function deltaFor(m, eps) {
  return eps / Math.abs(m);
}

/** Largest step that still keeps |f(a+d)−L| under ε, found by bisection. */
export function deltaSearch(m, eps) {
  const f = (x) => m * x;
  let lo = 0;
  let hi = eps / Math.abs(m);
  // Start past the boundary, then walk down onto it.
  hi = Math.abs(f(hi) - 0) < eps ? hi * 2 : hi;
  while (Math.abs(f(hi)) < eps) hi *= 2;
  for (let i = 0; i < 50; i++) {
    const mid = 0.5 * (lo + hi);
    if (Math.abs(f(mid)) < eps) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function sidesOfAbs(c = 0) {
  const h = 1e-8;
  const left = Math.abs(c - h) / (c - h);
  const right = Math.abs(c + h) / (c + h);
  return { left, right, exists: Math.abs(left - right) < 1e-6 };
}

export function absContinuousAt(x = 0) {
  const h = 1e-6;
  return Math.abs(Math.abs(x + h) - Math.abs(x)) < 1e-5 && Math.abs(Math.abs(x - h) - Math.abs(x)) < 1e-5;
}

export function absDifferentiableAt0() {
  const left = df1left(Math.abs, 0);
  const right = df1right(Math.abs, 0);
  return Math.abs(left - right) < 1e-6;
}

export function squeezeHolds() {
  for (let i = 1; i <= 40; i++) {
    const x = i / 200;
    const f = Math.abs(x * x * Math.sin(1 / x));
    if (f > x * x + 1e-12) return false;
  }
  return true;
}

export { df1, riemann1d, simpson };
