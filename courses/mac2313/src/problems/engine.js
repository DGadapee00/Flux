/**
 * Problem engine for this course. Sampling, parsing, and grading live in @flux/core.
 * The only constants are π and e. There is no dimension table.
 */
import { createEngine } from '@flux/core';

const engine = createEngine({
  consts: { pi: Math.PI, e: Math.E },
  greek: { 'π': 'pi', 'θ': 'th', 'φ': 'phi', 'ρ': 'rho', 'λ': 'lam', 'α': 'alpha', 'ω': 'omega' },
  glyph: { pi: 'π', th: 'θ', phi: 'φ', rho: 'ρ', lam: 'λ', alpha: 'α', omega: 'ω', e: 'e' },
  texSym: {
    pi: '\\pi', th: '\\theta', phi: '\\varphi', rho: '\\rho',
    lam: '\\lambda', alpha: '\\alpha', omega: '\\omega',
  },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true },
});

export const {
  rng,
  hashSeed,
  build,
  sampleValues,
  countVersions,
  instance,
  sig,
  render,
  expected,
  answers,
  parseNumber,
  withinTol,
  grade,
  parseExpr,
  GLYPH,
  astToTex,
  exprToTex,
  evalAst,
  compile,
  evalAtScope,
  gradeSymbolic,
  evalSymbolic,
} = engine;
