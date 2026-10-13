/**
 * Problem engine for this course. Sampling, parsing, and grading live in @flux/core.
 * The constants and the typed-unit table stay here.
 */
import { createEngine } from '@flux/core';
import { K, EPS0, MU0, C_LIGHT, G } from './kit.js';
import { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale } from '../physics/units.js';

const DEG = Math.PI / 180;

const engine = createEngine({
  consts: { pi: Math.PI, k: K, eps0: EPS0, mu0: MU0, c: C_LIGHT, g: G },
  greek: { 'π': 'pi', 'λ': 'lam', 'σ': 'sig', 'ρ': 'rho', 'θ': 'th', 'ω': 'omega', 'ε0': 'eps0', 'ε₀': 'eps0', 'μ0': 'mu0', 'μ₀': 'mu0', 'φ': 'phi', 'α': 'alpha' },
  glyph: { pi: 'π', lam: 'λ', sig: 'σ', rho: 'ρ', th: 'θ', omega: 'ω', phi: 'φ', alpha: 'α', eps0: 'ε₀', mu0: 'μ₀' },
  texSym: {
    pi: '\\pi', lam: '\\lambda', sig: '\\sigma', rho: '\\rho', th: '\\theta',
    omega: '\\omega', phi: '\\varphi', alpha: '\\alpha',
    eps0: '\\varepsilon_0', mu0: '\\mu_0',
  },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  typed: {
    ZERO,
    parseUnit,
    dimMul,
    dimScale,
    dimEqual,
    special: [['kg', 'kg', 1]],
    noPrefix: ['°', 'deg', 'rad', 'min', 'h', 'D'],
    bases: {
      m: ['m', 1], g: ['kg', 1e-3], s: ['s', 1], A: ['A', 1], C: ['C', 1], N: ['N', 1], J: ['J', 1], W: ['W', 1],
      V: ['V', 1], F: ['F', 1], Ω: ['Ω', 1], ohm: ['Ω', 1], T: ['T', 1], Wb: ['Wb', 1], H: ['H', 1], Hz: ['Hz', 1],
      Pa: ['Pa', 1], eV: ['J', 1.602176634e-19], Wh: ['J', 3600], D: ['D', 1], rad: ['rad', 1], deg: ['rad', DEG], '°': ['rad', DEG],
      min: ['s', 60], h: ['s', 3600],
    },
    prefix: { p: 1e-12, n: 1e-9, μ: 1e-6, µ: 1e-6, u: 1e-6, m: 1e-3, c: 1e-2, k: 1e3, M: 1e6, G: 1e9 },
  },
  prose: 'full',
  steps: 'sig',
  optionWhy: true,
  figure: true,
  choiceNotes: true,
  unitFn: true,
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true },
});

export const {
  rng,
  hashSeed,
  build,
  sampleValues,
  instance,
  sig,
  choiceOptions,
  unitOf,
  tidyProse,
  render,
  expected,
  answers,
  parseNumber,
  typedUnit,
  unitFactor,
  convertTyped,
  withinTol,
  grade,
  parseExpr,
  GLYPH,
  astToTex,
  exprToTex,
  evalAst,
  compile,
  dimensionOf,
  checkUnits,
  gradeSymbolic,
  evalSymbolic,
} = engine;
