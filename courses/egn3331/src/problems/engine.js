/**
 * Problem engine for this course. Sampling and grading live in @flux/core.
 * Answers print three significant figures, four when the leading digit is 1.
 */
import { createEngine } from '@flux/core';
import {
  CONST_DIMS,
  ZERO,
  dimDiv,
  dimEqual,
  dimMul,
  dimScale,
  formatDim,
  isDimensionless,
  parseUnit,
} from '@flux/subjects/mechanics/units.js';

const engine = createEngine({
  consts: { pi: Math.PI },
  greek: { 'π': 'pi', 'θ': 'th' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true, leadingOne: true },
});

export const {
  rng,
  hashSeed,
  build,
  sampleValues,
  instance,
  sig,
  render,
  expected,
  answers,
  parseNumber,
  withinTol,
  grade,
  parseExpr,
  evalAst,
  compile,
  dimensionOf,
  checkUnits,
  gradeSymbolic,
  evalSymbolic,
  countVersions,
} = engine;
