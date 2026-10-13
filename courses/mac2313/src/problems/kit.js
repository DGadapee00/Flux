/**
 * Authoring kit for problem templates. A template is a *generator*: variables with ranges,
 * answers computed from them, and an optional hook that loads the matching lab so the sim
 * shows the same setup. See PROBLEMS.md.
 */
import { fitScale, lenLabel } from '../engine/frame.js';

export const DEG = Math.PI / 180;

export const range = (min, max, step, unit = '', si = 1, opts = {}) => ({ type: 'range', min, max, step, unit, si, ...opts });
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });
export const SIGN = choice([1, 'positive'], [-1, 'negative']);

export const num = (id, get, unit, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  unit,
  scale: o.scale ?? 1,
  tol: o.tol ?? 0.02,
  abs: o.abs ?? 0,
  wrap: o.wrap ?? 0,
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

export const tf = (id, correct, o = {}) => mc(id, [[1, 'True'], [0, 'False']], correct ? 1 : 0, o);

/**
 * Symbolic answer: the expression, before any numbers go in.
 * `vars` is a list of symbol names the student may use (plus pi).
 */
export const sym = (id, expr, vars, get, o = {}) => ({
  id,
  kind: 'symbolic',
  expr,
  vars: Array.isArray(vars) ? vars : Object.keys(vars),
  units: null,
  unit: o.unit ?? null,
  get,
  alias: o.alias ?? {},
  label: o.label ?? null,
});

export const self = (id, prompt, rubric) => ({ id, kind: 'self', label: prompt, rubric });

/**
 * A coefficient written directly in front of a variable: `1x^2` and `-1y` are not how anyone writes
 * mathematics, and with `range(1, 3, 1)` a third of the generated instances land on 1. Mirrors
 * fmtC() in math/surfaces.js, which does the same job for the labs' own f(x,y) titles.
 */
export const coef = (c) => (String(c) === '1' ? '' : String(c) === '-1' ? '-' : String(c));

/** The same, for a coefficient that is itself a product: prod(2, '1') is '2', not '2\\cdot1'. */
export const prod = (k, c) => {
  const n = Number(c);
  return Number.isFinite(n) ? String(k * n) : `${k}\\cdot${c}`;
};

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

export const kase = (src, v, want, o = {}) => ({ src, v, want, key: o.key ?? null, note: o.note ?? null });

/**
 * Frame a rectangular domain so the problem's own numbers sit in the scene.
 * Writes s.view = { upm, plane } the way layout() does in PHY 2049.
 */
export function domain(s, { xMin, xMax, yMin, yMax, plane = 'xyfloor' } = {}) {
  const extent = Math.max(1e-9, Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax));
  s.xMin = xMin;
  s.xMax = xMax;
  s.yMin = yMin;
  s.yMax = yMax;
  const upm = fitScale(extent);
  s.view = { upm, plane };
  return `Set to the problem's own numbers · 1 grid square = ${lenLabel(1 / upm)}`;
}

export function texNum(x, n = 3) {
  if (!Number.isFinite(x)) return '-';
  if (x === 0 || Math.abs(x) < 1e-300) return '0';
  const a = Math.abs(x);
  if (a >= 0.01 && a < 1e5) return String(Number(x.toPrecision(n))).replace('-', '-');
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${Number(m)}\\\\times 10^{${Number(e)}}`;
}

export const mag = (v) => Math.hypot(v.x, v.y, v.z || 0);
export const angleDeg = (x, y) => ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
