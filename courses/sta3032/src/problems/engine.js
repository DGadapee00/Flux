/**
 * Problem engine for this course. Sampling and grading live in @flux/core.
 * A numeric part carries `traps` (possibly empty), so grading accepts alternates and a trailing %.
 * There is no expression language.
 */
import { createEngine } from '@flux/core';

const engine = createEngine({
  prose: 'articles',
  steps: 'plain',
  optionWhy: true,
  figure: true,
  table: true,
  probFlag: true,
  choiceNotes: true,
  numbers: 'percent',
  sig: { figures: 4, lo: 1e-4, hi: 1e6, tiny: false },
});

export const {
  hashSeed,
  rng,
  build,
  sampleValues,
  CASE_SEED,
  caseIndex,
  seedForAttempt,
  instance,
  sig,
  choiceOptions,
  tidyProse,
  render,
  expected,
  accepted,
  answers,
  parseNumber,
  tolerance,
  withinTol,
  nearest,
  grade,
} = engine;
