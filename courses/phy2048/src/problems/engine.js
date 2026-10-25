/**
 * Problem engine for PHY 2048. Sampling, parsing, and grading live in @flux/core.
 * g and the mechanics dimension table stay with the subject library.
 */
import { createEngine } from '@flux/core';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale,
} from '@flux/subjects/mechanics/units.js';

const engine = createEngine({
  consts: { pi: Math.PI, g: G },
  greek: { π: 'pi', θ: 'th', ω: 'omega' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  // A wrong option's `why` comes back as its feedback.
  choiceNotes: true,
  sig: { figures: 4, lo: 0.01, hi: 1e5, tiny: true },
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
  choiceOptions,
  exprToTex,
  GLYPH,
} = engine;
