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
