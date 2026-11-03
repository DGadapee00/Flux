/**
 * Problem engine for this course. Sampling, parsing, and grading live in @flux/core.
 * g and gft, and the dimension table, stay here. Typed prefixes are not read inside grade.
 */
import { createEngine } from '@flux/core';
import { G, G_FT } from './kit.js';
import { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale } from '../physics/units.js';

const engine = createEngine({
  consts: { pi: Math.PI, g: G, gft: G_FT },
  greek: { 'π': 'pi', 'λ': 'lam', 'σ': 'sig', 'ρ': 'rho', 'θ': 'th', 'ω': 'omega', 'ε0': 'eps0', 'ε₀': 'eps0', 'μ0': 'mu0', 'μ₀': 'mu0', 'φ': 'phi', 'α': 'alpha' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  optionWhy: true,
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true },
});

export const {
  GLYPH,
  exprToTex,
  choiceOptions,
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
} = engine;
