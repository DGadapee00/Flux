/**
 * Calculus I, pure. Each rule has a second route in the selftest:
 * a closed form against a difference quotient, a sum formula against a loop.
 */
import { df1, df1left, df1right } from '@flux/subjects/math/ndiff.js';
import { riemann1d } from '@flux/subjects/math/riemann.js';
import { simpson } from '@flux/subjects/math/quadrature.js';

export const GRAPHS = {
 weightParabola:{id:'weightParabola',name:'4−(x−1)²',tex:'4-(x-1)^2',f:x=>4-(x-1)**2,fp:x=>-2*(x-1),F:x=>4*x-(x-1)**3/3},
 weightRoot:{id:'weightRoot',name:'2√x',tex:'2\\sqrt{x}',f:x=>2*Math.sqrt(x),fp:x=>1/Math.sqrt(x),F:x=>4*x**1.5/3},
 normalizedForce:{id:'normalizedForce',name:'Normalized external spring force F/k',tex:'F_{ext}/k=x',f:x=>x,fp:()=>1,F:x=>x*x/2},
 strip:{id:'strip',name:'6x−2x²',tex:'6x-2x^2',f:x=>6*x-2*x*x,fp:x=>6-4*x,F:x=>3*x*x-2*x**3/3},
 cap:{id:'cap',name:'1−x²',tex:'1-x^2',f:x=>1-x*x,fp:x=>-2*x,F:x=>x-x**3/3},
  tangent1: {id:'tangent1',name:'(x−1)²+1',tex:'(x-1)^2+1',f:x=>(x-1)**2+1,fp:x=>2*(x-1),F:x=>(x-1)**3/3+x},
  tangent2: {id:'tangent2',name:'x²+4',tex:'x^2+4',f:x=>x*x+4,fp:x=>2*x,F:x=>x**3/3+4*x},
  fall: {id:'fall',name:'Height 400−16t² (ft)',tex:'400-16x^2',f:x=>400-16*x*x,fp:x=>-32*x,F:x=>400*x-16*x**3/3},
  mathlet: {id:'mathlet',name:'0.5x³−x',tex:'x^3/2-x',f:x=>.5*x**3-x,fp:x=>1.5*x*x-1,F:x=>x**4/8-x*x/2},
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

/** A shifted parabola (x−h)²+c named 'parabola:h:c', so a problem can open the lab at its own curve. */
function parabola(h, c) {
  const sh = h === 0 ? 'x' : h > 0 ? `(x-${h})` : `(x+${-h})`;
  return {
    id: `parabola:${h}:${c}`,
    name: `${sh.replace('-', '−')}²+${c}`,
    tex: `${sh}^2+${c}`,
    f: (x) => (x - h) ** 2 + c,
    fp: (x) => 2 * (x - h),
    F: (x) => (x - h) ** 3 / 3 + c * x,
  };
}

/** A polynomial 'poly:c0,c1,c2,...' (ascending coefficients), with its derivative and antiderivative. */
function poly(cs) {
  const terms = cs
    .map((c, k) => (c === 0 ? '' : `${c < 0 ? '−' : '+'}${Math.abs(c) === 1 && k ? '' : Math.abs(c)}${k ? 'x' : ''}${k > 1 ? `^${k}` : ''}`))
    .filter(Boolean)
    .reverse()
    .join('')
    .replace(/^\+/, '');
  return {
    id: `poly:${cs.join(',')}`,
    name: terms || '0',
    tex: (terms || '0').replace(/−/g, '-'),
    f: (x) => cs.reduce((s, c, k) => s + c * x ** k, 0),
    fp: (x) => cs.reduce((s, c, k) => s + (k ? k * c * x ** (k - 1) : 0), 0),
    F: (x) => cs.reduce((s, c, k) => s + (c * x ** (k + 1)) / (k + 1), 0),
  };
}

/** A power 'pow:c:p', c·x^p for x ≥ 0. */
function power(c, p) {
  return {
    id: `pow:${c}:${p}`,
    name: `${c}x^${p}`,
    tex: `${c}x^{${p}}`,
    f: (x) => c * x ** p,
    fp: (x) => c * p * x ** (p - 1),
    F: (x) => (c * x ** (p + 1)) / (p + 1),
  };
}

export function graphById(id) {
  if (GRAPHS[id]) return GRAPHS[id];
  const num = '(-?[\\d.]+(?:e-?\\d+)?)';
  let m = new RegExp(`^parabola:${num}:${num}$`).exec(id || '');
  if (m) return parabola(Number(m[1]), Number(m[2]));
  m = /^poly:([-\d.,e]+)$/.exec(id || '');
  if (m) return poly(m[1].split(',').map(Number));
  m = new RegExp(`^pow:${num}:${num}$`).exec(id || '');
  if (m) return power(Number(m[1]), Number(m[2]));
  return GRAPHS.quad;
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

/** ∫_a^x f, from the antiderivative. */
export function accumArea(id, a, x) {
  const g = graphById(id);
  return g.F(x) - g.F(a);
}

/** FTC: the accumulation grows at f(x). */
export function accumHeight(id, x) {
  return graphById(id).f(x);
}

/** Same area by Simpson's rule. */
export function accumSimpson(id, a, x) {
  return simpson(graphById(id).f, a, x);
}

/** Same growth rate from a short move of the upper limit. */
export function accumStep(id, a, x, h = 1e-4) {
  return (accumArea(id, a, x + h) - accumArea(id, a, x - h)) / (2 * h);
}

/** ∫_0^b x^n dx. */
export function powerIntegral(n, b) {
  return b ** (n + 1) / (n + 1);
}

export function powerIntegralSimpson(n, b) {
  return simpson((t) => t ** n, 0, b);
}

/** ∫_0^b (2x+1) dx. */
export function lineIntegral(b) {
  return b * b + b;
}

export function lineIntegralSimpson(b) {
  return simpson((t) => 2 * t + 1, 0, b);
}

function binom(n, k) {
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c;
}

/** ∫_0^1 2x (x^2+1)^n dx, by the substitution u=x^2+1. */
export function substIntegral(n) {
  return (2 ** (n + 1) - 1) / (n + 1);
}

/** Same integral after expanding the binomial and integrating term by term. */
export function substExpanded(n) {
  let s = 0;
  for (let k = 0; k <= n; k++) s += binom(n, k) / (k + 1);
  return s;
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

/** Same top speed from a short slide of the base. */
export function ladderStep(length, x, dx, dt = 1e-4) {
  const y = Math.sqrt(length * length - x * x);
  const y2 = Math.sqrt(length * length - (x + dx * dt) * (x + dx * dt));
  return (y2 - y) / dt;
}

/** Open box: square sheet of side `side`, corner squares of side `cut`. */
export function boxVolume(side, cut) {
  const w = side - 2 * cut;
  return cut * w * w;
}

/** dV/dx = (side − 2x)(side − 6x). Zero at x = side/6 inside (0, side/2). */
export function boxVolumeRate(side, cut) {
  return (side - 2 * cut) * (side - 6 * cut);
}

export function boxBestCut(side) {
  return side / 6;
}

/** Same rate from a short change in the cut, centered so the peak reads as zero. */
export function boxVolumeStep(side, cut, dt = 1e-4) {
  return (boxVolume(side, cut + dt) - boxVolume(side, cut - dt)) / (2 * dt);
}

/** The cut that maximizes volume, found by bisection on the difference quotient. */
export function boxBestCutSearch(side) {
  let lo = side * 1e-3;
  let hi = side / 2 - side * 1e-3;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (boxVolumeStep(side, mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Tangent line to √x at a², evaluated at a²+1. */
export function sqrtLinear(a) {
  return a + 1 / (2 * a);
}

/** Same value written as one fraction. */
export function sqrtLinearQuotient(a) {
  return (2 * a * a + 1) / (2 * a);
}

/** Positive critical point of x³ − kx. */
export function cubicCritical(k) {
  return Math.sqrt(k / 3);
}

export function cubicCriticalValue(k) {
  const x = cubicCritical(k);
  return x * x * x - k * x;
}

/** Same critical point by bisection on f'. */
export function cubicCriticalSearch(k) {
  let lo = 0;
  let hi = Math.sqrt(k) + 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (3 * mid * mid - k < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** c from the Mean Value Theorem for x² on [a, b]. */
export function squareMvt(a, b) {
  return (a + b) / 2;
}

/** Same c from the secant slope divided by f'. */
export function squareMvtQuotient(a, b) {
  return (b * b - a * a) / (b - a) / 2;
}

/** Inflection of x³ + a x². */
export function cubicInflection(a) {
  return -a / 3;
}

/** Same point by bisection on f''. */
export function cubicInflectionSearch(a) {
  let lo = -Math.abs(a) - 1;
  let hi = Math.abs(a) + 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (6 * mid + 2 * a < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** lim (x→a) (x² − a²)/(x − a), after cancelling. */
export function differenceLimit(a) {
  return 2 * a;
}

/** Same limit by differentiating the top and the bottom. */
export function differenceLimitHopital(a) {
  return df1((x) => x * x, a) / df1((x) => x - a, a);
}

/** lim (x→0) sin(kx)/x. */
export function sincLimit(k) {
  return k;
}

export function sincLimitHopital(k) {
  return df1((x) => Math.sin(k * x), 0) / df1((x) => x, 0);
}

/** One Newton step for x² − c, from the Babylonian form. */
export function newtonSqrt(c, x0) {
  return (x0 + c / x0) / 2;
}

/** Same step from x − f(x)/f'(x). */
export function newtonSqrtStep(c, x0) {
  return x0 - (x0 * x0 - c) / (2 * x0);
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

/**
 * One picture of a limit: a line, a hole, a jump, or a sign change.
 * `left` and `right` are the one-sided limits. `probeLeft` and `probeRight`
 * are the function a tiny step away, the second route.
 */
export function limitPicture(kind, { a = 0, h = 0.4, eps = 0.5, m = 2, leftValue = 0, rightValue = 1 } = {}) {
  const step = Math.max(1e-4, h);
  const axis = a === 0 ? 'x' : a < 0 ? `x+${-a}` : `x-${a}`;
  let f;
  let left;
  let right;
  let value;
  let tex;
  if (kind === 'hole') {
    f = (x) => (x === a ? NaN : x + a);
    left = a + a;
    right = a + a;
    value = NaN;
    tex = `\\dfrac{x^2-${a * a}}{${axis}}`;
  } else if (kind === 'jump') {
    f = (x) => (x < a ? leftValue : rightValue);
    left = leftValue;
    right = rightValue;
    value = rightValue;
    tex = 'jump';
  } else if (kind === 'sign') {
    f = (x) => (x < a ? -1 : x > a ? 1 : NaN);
    left = -1;
    right = 1;
    value = NaN;
    tex = `\\dfrac{${axis}}{|${axis}|}`;
  } else {
    f = (x) => m * x;
    left = m * a;
    right = m * a;
    value = m * a;
    tex = `${m}x`;
  }
  const near = 1e-6;
  const probeLeft = f(a - near);
  const probeRight = f(a + near);
  const exists = Math.abs(left - right) <= 1e-9;
  const delta = kind === 'line' || kind == null ? eps / Math.abs(m) : NaN;
  const deltaAlt = Number.isFinite(delta) ? deltaSearch(m, eps) : NaN;
  const inside = Number.isFinite(delta) && step < delta;
  return {
    f,
    a,
    h: step,
    eps,
    m,
    tex,
    left,
    right,
    value,
    sampleLeft: f(a - step),
    sampleRight: f(a + step),
    probeLeft,
    probeRight,
    exists,
    limit: exists ? left : NaN,
    delta,
    deltaAlt,
    inside,
    kind: kind === 'jump' || kind === 'hole' || kind === 'sign' ? kind : 'line',
  };
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
