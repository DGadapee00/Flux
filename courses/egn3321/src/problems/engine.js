/**
 * Problem engine for this course. Sampling and grading live in @flux/core.
 * Answers print three significant figures, four when the leading digit is 1.
 */
import { createEngine } from '@flux/core';
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
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
  consts: { pi: Math.PI, g: G, gft: G_FT },
  greek: { 'π': 'pi', 'θ': 'th', 'ρ': 'rho', 'μ': 'mu', 'α': 'alpha', 'ω': 'w', 'm₁': 'm1', 'm₂': 'm2' },
  // The palette shows the symbols as written in the problem, and the preview typesets them.
  glyph: { pi: 'π', th: 'θ', mu: 'μ', alpha: 'α', w: 'ω', m1: 'm₁', m2: 'm₂' },
  texSym: { pi: '\\pi', th: '\\theta', mu: '\\mu', alpha: '\\alpha', w: '\\omega', m1: 'm_1', m2: 'm_2' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true, leadingOne: true },
  // A wrong option's `why` comes back as its feedback.
  choiceNotes: true,
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
