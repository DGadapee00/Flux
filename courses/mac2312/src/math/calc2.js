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

/** Area between y = x and y = x² on [0, 1]. */
export function areaBetween() {
  return 1 / 2 - 1 / 3;
}

export function areaBetweenSimpson() {
  return simpson((x) => x - x * x, 0, 1);
}

/** Washer volume of that region about the x-axis: π ∫ (x² − x⁴) dx = 2π/15. */
export function washerVolume() {
  return Math.PI * (1 / 3 - 1 / 5);
}

/** Same washer by shells: 2π ∫ y (√y − y) dy. */
export function washerShell() {
  return 2 * Math.PI * (2 / 5 - 1 / 3);
}

export function washerSimpson() {
  return Math.PI * simpson((x) => x * x - x ** 4, 0, 1);
}

/** Length of the segment from (0, 0) to (1, 1). */
export function segmentLength() {
  return Math.SQRT2;
}

export function segmentSimpson() {
  return simpson(() => Math.SQRT2, 0, 1);
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
