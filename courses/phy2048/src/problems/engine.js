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
  sig: { figures: 4, lo: 0.01, hi: 1e5, tiny: true },
});

export const {
  build,
  instance,
  render,
  expected,
  withinTol,
  grade,
  parseExpr,
  dimensionOf,
  gradeSymbolic,
  evalSymbolic,
} = engine;
