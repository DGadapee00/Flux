/**
 * Authoring kit. Values inside `$` are SI. A range is sampled in its display unit
 * and multiplied by `si`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';

export { G, G_FT };

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
});

export const mc = (id, options, correct, o = {}) => ({
  id,
  kind: 'choice',
  options: options.map(([value, label]) => ({ value, label })),
  correct,
  multi: !!o.multi,
  label: o.label ?? null,
});

export const sym = (id, expr, vars, get, o = {}) => ({
  id,
  kind: 'symbolic',
  expr,
  vars: Object.keys(vars),
  units: vars,
  unit: o.unit ?? null,
  get,
  alias: o.alias ?? {},
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

/** Three figures, or four when the first significant digit is 1. */
export function hibbeler(x) {
  if (!Number.isFinite(x) || x === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(x)) + 1e-12);
  const lead = Math.floor(Math.abs(x) / 10 ** exp + 1e-9);
  return Number(x.toPrecision(lead === 1 ? 4 : 3));
}

/** The same rounding, read off the exponential form instead of toPrecision. */
export function hibbelerExp(x) {
  if (!Number.isFinite(x) || x === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(x)) + 1e-12);
  const lead = Math.floor(Math.abs(x) / 10 ** exp + 1e-9);
  const n = lead === 1 ? 4 : 3;
  return Number(x.toExponential(n - 1));
}
