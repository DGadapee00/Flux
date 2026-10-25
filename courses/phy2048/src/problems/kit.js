/**
 * Authoring kit for the PHY 2048 bank. Sampling and grading live in @flux/core.
 * Values inside `$` are SI. A range is sampled in the unit the student sees.
 */
import { problem as defineProblem } from '@flux/core';

/** A range sampled in the unit the student sees; `si` turns it into SI for `$` (1 Mm → 1e6). */
export const range = (min, max, step, unit = '', si = 1) => ({ type: 'range', min, max, step, unit, si });

/** A variable that picks among named options, so a template can vary its structure and not only its numbers. */
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });

/** Numeric answer. get($) is the value in `unit`. */
export const num = (id, get, unit, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  unit,
  scale: o.scale ?? 1,
  tol: o.tol ?? 0.015,
  abs: o.abs ?? 0.02,
  wrap: o.wrap ?? 0,
  label: o.label ?? null,
});

/**
 * Multiple choice. `options` is a list of [value, label, why] (why is shown when a student picks that
 * option), or a function of $ that gives this version's list. `correct` is a value or a function of $.
 */
export const mc = (id, options, correct, o = {}) => {
  const norm = (list) => list.map(([value, label, why]) => (why ? { value, label, why } : { value, label }));
  return {
    id,
    kind: 'choice',
    options: typeof options === 'function' ? ($) => norm(options($)) : norm(options),
    correct,
    multi: !!o.multi,
    label: o.label ?? null,
  };
};

export const tf = (id, correct, o = {}) => mc(id, [[1, 'True'], [0, 'False']], correct ? 1 : 0, o);

/**
 * Symbolic answer. `vars` maps each symbol to its SI unit. The check confirms
 * that `expr` evaluates to `get($)` and that the units come out as `o.unit`.
 */
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
  return defineProblem(spec);
}

/** A worked instance. `want` maps a part id to the value a student would type. */
export const kase = (src, v, want, o = {}) => ({ src, v, want, note: o.note ?? null });

/** A number inside `$…$`: significant figures, with TeX scientific notation. */
export function texNum(x, n = 4) {
  if (!Number.isFinite(x)) return '-';
  if (x === 0 || Math.abs(x) < 1e-300) return '0';
  const a = Math.abs(x);
  if (a >= 0.01 && a < 1e5) return String(Number(x.toPrecision(n)));
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${Number(m)}\\times 10^{${Number(e)}}`;
}
