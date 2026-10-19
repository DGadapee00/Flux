/**
 * Problem engine for this course. Sampling and grading live in @flux/core.
 * Answers print four significant figures, the precision a property table prints.
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
  greek: { 'π': 'pi' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  choiceNotes: true,
  sig: { figures: 4, lo: 0.001, hi: 1e6, tiny: true, leadingOne: false },
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
