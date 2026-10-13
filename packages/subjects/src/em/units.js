/**
 * Dimensional analysis for the symbolic answers in the problem bank.
 *
 * A dimension is the exponent vector [M, L, T, I] — mass, length, time, current. Every unit the
 * course uses is one of those, so "N/C" and "V/m" compare equal, and an expression whose units
 * come out as kg·m/s² can be told apart from one that came out as kg·m²/s².
 *
 * This is the check a student does by hand: write the answer in symbols, read off the units, see
 * whether it lands in the right place. Here it runs on what they typed, before they submit.
 */

import { ZERO, createDim, dimDiv, dimEqual, dimMul, dimScale, isDimensionless } from '../dim.js';

export { ZERO, dimDiv, dimEqual, dimMul, dimScale, isDimensionless };

/** Unit name → dimension. SI only, no prefixes: the bank stores every value in SI. */
const M = [1, 0, 0, 0];
const L = [0, 1, 0, 0];
const T = [0, 0, 1, 0];
const I = [0, 0, 0, 1];

export const UNITS = {
  kg: M,
  m: L,
  // Prefixed lengths, because the optics and wave problems are written in them. Only the dimension
  // matters here, so cm and m compare equal — the declared string is what the panel shows.
  cm: L,
  mm: L,
  nm: L,
  km: L,
  s: T,
  A: I,
  C: dimMul(I, T),
  N: [1, 1, -2, 0],
  J: [1, 2, -2, 0],
  W: [1, 2, -3, 0],
  V: [1, 2, -3, -1],
  F: [-1, -2, 4, 2],
  ohm: [1, 2, -3, -2],
  'Ω': [1, 2, -3, -2],
  T: [1, 0, -2, -1], // tesla — inside a unit string, never "time"
  Wb: [1, 2, -2, -1],
  H: [1, 2, -2, -2],
  Hz: [0, 0, -1, 0],
  Pa: [1, -1, -2, 0],
  D: [0, -1, 0, 0], // diopter
  rad: ZERO,
  '': ZERO,
  '1': ZERO,
};

/** Dimensions of the constants the expression language provides. */
export const CONST_DIMS = {
  pi: ZERO,
  k: [1, 3, -4, -2], // N·m²/C²
  eps0: [-1, -3, 4, 2], // C²/(N·m²)
  mu0: [1, 1, -2, -2], // N/A²
  c: [0, 1, -1, 0], // m/s
  g: [0, 1, -2, 0], // m/s²
};

// Tried in order, so a composite that a student would recognise wins over raw base units.
const NAMED = [
  'N/C', 'V', 'C', 'N', 'J', 'W', 'F', 'Ω', 'T', 'Wb', 'H', 'Hz', 'Pa', 'A', 'm', 's', 'kg',
  'm/s', 'm/s²', 'C/m', 'C/m²', 'C/m³', 'W/m²', 'A/m²', 'N/m', 'J/C', 'N·m', 'N·m²/C', 'N·m²/C²',
  'V·s', 'V/s', 'C/V', 'J/s', 'kg·m/s', '1/m', '1/s',
];

export const { parseUnit, formatDim } = createDim({ units: UNITS, named: NAMED });
