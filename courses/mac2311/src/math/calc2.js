/**
 * Calc II rules used by the labs and the problem bank.
 * A closed form and a second method (the other slicing, or Simpson, or Horner) both live here.
 */
import { simpson } from '@flux/subjects/math/quadrature.js';

/** Volume of y = √x on [0, b], rotated about the x-axis, by disks: π ∫ x dx. */
export function diskVolume(b) {
  return (Math.PI * b * b) / 2;
}

/**
 * The same solid by shells. A shell at height y has radius y and length b − y².
 * ∫ from 0 to √b of 2π y (b − y²) dy.
 */
export function shellVolume(b) {
  const y = Math.sqrt(b);
  return 2 * Math.PI * ((b / 2) * y * y - y ** 4 / 4);
}

/** Disks again, with the integrand handed to Simpson instead of the antiderivative. */
export function diskSimpson(b) {
  return Math.PI * simpson((x) => x, 0, b);
}

/** Shells again, by Simpson on the shell integrand. */
export function shellSimpson(b) {
  const yMax = Math.sqrt(b);
  return simpson((y) => 2 * Math.PI * y * (b - y * y), 0, yMax);
}

/** Area between y = x and y = x² on [0, b], with the line above the parabola when b is in (0, 1]. */
export function areaBetween(b = 1) {
  return (b * b) / 2 - (b * b * b) / 3;
}

export function areaBetweenSimpson(b = 1) {
  return simpson((x) => x - x * x, 0, b);
}

/** Washer volume of that region about the x-axis: π ∫ (x² − x⁴) dx. On [0, 1] this is 2π/15. */
export function washerVolume(b = 1) {
  return Math.PI * (b ** 3 / 3 - b ** 5 / 5);
}

/** Same washer by shells: 2π ∫ y (√y − y) dy. */
export function washerShell() {
  return 2 * Math.PI * (2 / 5 - 1 / 3);
}

export function washerSimpson(b = 1) {
  return Math.PI * simpson((x) => x * x - x ** 4, 0, b);
}

/** Length of y = x from (0, 0) to (b, b). */
export function segmentLength(b = 1) {
  return Math.abs(b) * Math.SQRT2;
}

export function segmentSimpson(b = 1) {
  return simpson(() => Math.SQRT2, 0, b);
}

/** Chord from (0, 0) to (b, b²), the straight shortcut under y = x². */
export function parabolaChord(b) {
  return Math.hypot(b, b * b);
}

/** Work to stretch a spring F = kx from 0 to d. */
export function springWork(k, d) {
  return (k * d * d) / 2;
}

export function springSimpson(k, d) {
  return simpson((x) => k * x, 0, d);
}

export function sampleFn(kind, x) {
  if (kind === 'exp') return Math.exp(x);
  if (kind === 'cos') return Math.cos(x);
  return Math.sin(x);
}

function deriv(kind, a, k) {
  if (kind === 'exp') return Math.exp(a);
  if (kind === 'cos') return Math.cos(a + (k * Math.PI) / 2);
  return Math.sin(a + (k * Math.PI) / 2);
}

/** Taylor polynomial of order n about a, summed term by term. */
export function taylorSum(kind, a, n, x) {
  let sum = 0;
  let dx = 1;
  let fact = 1;
  const order = Math.max(0, Math.round(n));
  for (let k = 0; k <= order; k++) {
    if (k > 0) {
      dx *= x - a;
      fact *= k;
    }
    sum += (deriv(kind, a, k) * dx) / fact;
  }
  return sum;
}

/** The same polynomial, nested from the inside (Horner). */
export function taylorHorner(kind, a, n, x) {
  const order = Math.max(0, Math.round(n));
  const c = [];
  let fact = 1;
  for (let k = 0; k <= order; k++) {
    if (k > 0) fact *= k;
    c.push(deriv(kind, a, k) / fact);
  }
  let y = c[order];
  for (let k = order - 1; k >= 0; k--) y = c[k] + (x - a) * y;
  return y;
}

export function taylorError(kind, a, n, x) {
  return Math.abs(sampleFn(kind, x) - taylorSum(kind, a, n, x));
}

/** Trapezoidal estimate, added one panel at a time. */
export function trapPanels(f, a, b, n) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h;
    sum += (h / 2) * (f(x0) + f(x0 + h));
  }
  return sum;
}

/** The same trapezoid, from the weighted endpoint formula. */
export function trapWeights(f, a, b, n) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += 2 * f(a + i * h);
  return (h / 2) * sum;
}

/** Simpson's rule, added one pair of panels at a time. n is even. */
export function simpsonPanels(f, a, b, n) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i += 2) {
    const x0 = a + i * h;
    sum += (h / 3) * (f(x0) + 4 * f(x0 + h) + f(x0 + 2 * h));
  }
  return sum;
}

/** The same Simpson estimate, from the 1-4-2-4-1 weights. */
export function simpsonWeights(f, a, b, n) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (h / 3) * sum;
}

const sinOn = (x) => Math.sin(x);

/** ∫ sin x on [0, π] is 2. */
export function sinExact() {
  return 2;
}

/** Four-panel trapezoid of that integral: (π/4)(1 + √2). */
export function sinTrap4() {
  return (Math.PI / 4) * (1 + Math.SQRT2);
}

/** Four-panel Simpson estimate: (π/6)(1 + 2√2). */
export function sinSimpson4() {
  return (Math.PI / 6) * (1 + 2 * Math.SQRT2);
}

export function sinTrap(n) {
  return trapWeights(sinOn, 0, Math.PI, n);
}

export function sinTrapPanels(n) {
  return trapPanels(sinOn, 0, Math.PI, n);
}

export function sinSimpson(n) {
  return simpsonWeights(sinOn, 0, Math.PI, n);
}

export function sinSimpsonPanels(n) {
  return simpsonPanels(sinOn, 0, Math.PI, n);
}

/** ∫_1^B x^{-2} dx = 1 − 1/B. The improper integral to infinity is 1. */
export function improperArea(b) {
  return 1 - 1 / b;
}

export function improperTail(b) {
  return 1 / b;
}

export function improperSimpson(b) {
  return simpson((x) => 1 / (x * x), 1, b);
}

/** ∫_0^π x sin x dx, by parts. */
export function partsXSin() {
  return Math.PI;
}

export function partsXSinSimpson() {
  return simpson((x) => x * Math.sin(x), 0, Math.PI);
}

/** ∫_0^{π/2} sin²x dx, from the double-angle identity. */
export function sinSquaredHalf() {
  return Math.PI / 4;
}

export function sinSquaredSimpson() {
  return simpson((x) => Math.sin(x) ** 2, 0, Math.PI / 2);
}

/** ∫_0^{1/2} dx/√(1−x²) = arcsin(1/2). */
export function arcsinHalf() {
  return Math.PI / 6;
}

export function arcsinHalfSimpson() {
  return simpson((x) => 1 / Math.sqrt(1 - x * x), 0, 0.5);
}

/** ∫_0^1 dx/((x+1)(x+2)) = ln(4/3), from the split 1/(x+1) − 1/(x+2). */
export function partialSplit() {
  return Math.log(2) - Math.log(3) - (Math.log(1) - Math.log(2));
}

export function partialLn() {
  return Math.log(4 / 3);
}

export function partialSimpson() {
  return simpson((x) => 1 / ((x + 1) * (x + 2)), 0, 1);
}

/** Sum of the first n powers of r, starting at r^0. */
export function geomPartial(r, n) {
  const count = Math.max(0, Math.round(n));
  if (count === 0) return 0;
  if (r === 1) return count;
  return (1 - r ** count) / (1 - r);
}

/** The same geometric sum, one term at a time. */
export function geomLoop(r, n) {
  const count = Math.max(0, Math.round(n));
  let sum = 0;
  let term = 1;
  for (let k = 0; k < count; k++) {
    sum += term;
    term *= r;
  }
  return sum;
}

export function geomTerm(r, n) {
  return r ** (Math.max(1, Math.round(n)) - 1);
}

export function harmonicSum(n) {
  let sum = 0;
  for (let k = 1; k <= n; k++) sum += 1 / k;
  return sum;
}

/** Odds and evens added separately, then combined. */
export function harmonicSplit(n) {
  let odd = 0;
  let even = 0;
  for (let k = 1; k <= n; k++) {
    if (k % 2) odd += 1 / k;
    else even += 1 / k;
  }
  return odd + even;
}

export function altSum(n) {
  let sum = 0;
  for (let k = 1; k <= n; k++) sum += (k % 2 ? 1 : -1) / k;
  return sum;
}

/** Pairs (1/(2k−1) − 1/(2k)), plus a leftover odd term. */
export function altGroups(n) {
  let sum = 0;
  const pairs = Math.floor(n / 2);
  for (let k = 1; k <= pairs; k++) sum += 1 / (2 * k - 1) - 1 / (2 * k);
  if (n % 2) sum += 1 / n;
  return sum;
}

export function squareSum(n) {
  let sum = 0;
  for (let k = 1; k <= n; k++) sum += 1 / (k * k);
  return sum;
}

export function squareSplit(n) {
  let odd = 0;
  let even = 0;
  for (let k = 1; k <= n; k++) {
    const term = 1 / (k * k);
    if (k % 2) odd += term;
    else even += term;
  }
  return odd + even;
}

export function onesSum(n) {
  return Math.round(n);
}

export function onesLoop(n) {
  let sum = 0;
  for (let k = 1; k <= n; k++) sum += 1;
  return sum;
}

export function ln2() {
  return Math.log(2);
}

export function ln2Recip() {
  return -Math.log(0.5);
}

/** Unit circle x = cos t, y = sin t. Slope is null when the tangent is vertical. */
export function circleAt(t) {
  const x = Math.cos(t);
  const y = Math.sin(t);
  const dx = -y;
  const dy = x;
  return { x, y, dx, dy, speed: Math.hypot(dx, dy), slope: Math.abs(dx) < 1e-12 ? null : dy / dx };
}

/** Slope from x² + y² = 1, so y' = −x/y. */
export function circleSlopeImplicit(t) {
  const y = Math.sin(t);
  if (Math.abs(y) < 1e-12) return null;
  return -Math.cos(t) / y;
}

/** Arc length of the unit circle from 0 to t. The speed is 1. */
export function circleLength(t) {
  return t;
}

export function circleLengthSimpson(t) {
  if (t === 0) return 0;
  return simpson((s) => Math.hypot(-Math.sin(s), Math.cos(s)), 0, t);
}

/** Parabola x = t, y = t². */
export function paraAt(t) {
  const dy = 2 * t;
  return { x: t, y: t * t, dx: 1, dy, speed: Math.hypot(1, dy), slope: dy };
}

/** Same slope after eliminating the parameter: y = x². */
export function paraSlopeCart(t) {
  return 2 * t;
}

/** ∫₀ᵗ √(1+4u²) du = (t/2)√(1+4t²) + (1/4) ln(2t + √(1+4t²)). */
export function paraLength(t) {
  if (t === 0) return 0;
  const s = Math.hypot(1, 2 * t);
  return (t / 2) * s + 0.25 * Math.log(2 * t + s);
}

export function paraLengthSimpson(t) {
  if (t === 0) return 0;
  return simpson((u) => Math.hypot(1, 2 * u), 0, t);
}

/** Arc length of y = x² on [0, b]. The closed form is the parametric length at t = b. */
export function parabolaArc(b) {
  return paraLength(b);
}

export function parabolaArcSimpson(b) {
  return paraLengthSimpson(b);
}

/** Central difference of the distance, a second reading of the speed. */
export function paraSpeedDiff(t) {
  const h = 1e-4;
  const a = t - h;
  const b = t + h;
  return Math.hypot(b - a, b * b - a * a) / (2 * h);
}

/** Line x = t, y = 2t. */
export function lineAt(t) {
  return { x: t, y: 2 * t, dx: 1, dy: 2, speed: Math.sqrt(5), slope: 2 };
}

export function lineLength(t) {
  return Math.abs(t) * Math.sqrt(5);
}

/** Straight-line distance from the origin to (t, 2t). */
export function lineDistance(t) {
  return Math.hypot(t, 2 * t);
}

export function polarX(r, theta) {
  return r * Math.cos(theta);
}

export function polarY(r, theta) {
  return r * Math.sin(theta);
}

export function polarXCo(r, theta) {
  return r * Math.sin(Math.PI / 2 - theta);
}

export function polarYCo(r, theta) {
  return r * Math.cos(Math.PI / 2 - theta);
}

/** Area inside r = 1 from 0 to α: (1/2) ∫ r² dθ. */
export function unitArea(alpha) {
  return alpha / 2;
}

/** The same sector as a fraction of the disk π r². */
export function unitAreaDisk(alpha) {
  return Math.PI * (alpha / (2 * Math.PI));
}

/** ∫ r dθ, which is not the area. */
export function unitNaive(alpha) {
  return alpha;
}

export function cardioidR(theta) {
  return 1 + Math.cos(theta);
}

/** (1/2) ∫₀ᵅ (1+cos θ)² dθ. */
export function cardioidArea(alpha) {
  return 0.5 * (1.5 * alpha + 2 * Math.sin(alpha) + 0.25 * Math.sin(2 * alpha));
}

export function cardioidSimpson(alpha) {
  if (alpha === 0) return 0;
  const f = (th) => 0.5 * cardioidR(th) ** 2;
  // On a full period the Simpson error estimate cancels, so each piece stops at π.
  const step = Math.PI;
  let sum = 0;
  let t = 0;
  const end = Math.abs(alpha);
  const sign = alpha < 0 ? -1 : 1;
  while (t < end - 1e-12) {
    const next = Math.min(end, t + step);
    sum += simpson(f, sign * t, sign * next);
    t = next;
  }
  return sum;
}

export function cardioidNaive(alpha) {
  return alpha + Math.sin(alpha);
}

/** r = 2 cos θ, the circle of radius 1 centred at (1, 0). θ runs from −π/2. */
export function shiftR(theta) {
  return 2 * Math.cos(theta);
}

export function shiftArea(alpha) {
  return alpha + 0.5 * Math.sin(2 * alpha) + Math.PI / 2;
}

export function shiftSimpson(alpha) {
  return simpson((th) => 2 * Math.cos(th) ** 2, -Math.PI / 2, alpha);
}

export function shiftNaive(alpha) {
  return 2 * Math.sin(alpha) + 2;
}

export function shiftDisk() {
  return Math.PI;
}
