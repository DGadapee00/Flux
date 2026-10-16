/**
 * Problem engine for this course. Sampling and grading live in @flux/core.
 * The constants are π and e.
 */
import { createEngine } from '@flux/core';

const engine = createEngine({
  consts: { pi: Math.PI, e: Math.E },
  greek: { 'π': 'pi', 'θ': 'th', 'ε': 'eps', 'δ': 'delta' },
  glyph: { pi: 'π', th: 'θ', eps: 'ε', delta: 'δ', e: 'e' },
  texSym: { pi: '\\pi', th: '\\theta', eps: '\\varepsilon', delta: '\\delta' },
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
