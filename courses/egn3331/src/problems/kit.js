/**
 * Authoring kit. Values inside `$` are SI base units (N, m, Pa). A range is sampled in its display
 * unit and multiplied by `si`. A numeric part's `get` returns SI; `scale` divides it into the unit
 * the part asks for.
 */
export { cite } from '../data/textbook.js';

export const range = (min, max, step, unit = '', si = 1) => ({ type: 'range', min, max, step, unit, si });
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });

export const num = (id, get, unit, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  unit,
  scale: o.scale ?? 1,
  tol: o.tol ?? 0.02,
  abs: o.abs ?? 1e-6,
  label: o.label ?? null,
  ...(o.alt ? { alt: o.alt } : {}),
  // A trap returns SI, like `get`. The grader compares in the part's display unit.
  ...(o.traps ? { traps: o.traps.map(([fn, msg]) => [($) => fn($) / (o.scale ?? 1), msg]) } : {}),
});

export const mc = (id, options, correct, o = {}) => ({
  id,
  kind: 'choice',
  options: options.map(([value, label, why]) => ({ value, label, ...(why ? { why } : {}) })),
  correct,
  multi: !!o.multi,
  label: o.label ?? null,
});

export function problem(spec) {
  return {
    level: 1,
    topics: [],
    vars: {},
    derive: () => ({}),
    valid: () => true,
    hints: [],
    steps: () => [],
    sim: null,
    cases: [],
    ...spec,
  };
}

export const kase = (src, v, want, o = {}) => ({ src, v, want, note: o.note ?? null });
