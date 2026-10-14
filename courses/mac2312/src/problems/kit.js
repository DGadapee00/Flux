import { fitScale, lenLabel } from '../engine/frame.js';

export const range = (min, max, step, unit = '', si = 1, opts = {}) => ({
  type: 'range',
  min,
  max,
  step,
  unit,
  si,
  ...opts,
});

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

export const tf = (id, correct, o = {}) =>
  mc(id, [[1, 'True'], [0, 'False']], typeof correct === 'function' ? correct : correct ? 1 : 0, o);

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

export function domain(s, { xMin, xMax, yMin, yMax, plane = 'xy' } = {}) {
  const extent = Math.max(1e-9, Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax));
  s.xMin = xMin;
  s.xMax = xMax;
  s.yMin = yMin;
  s.yMax = yMax;
  s.view = { upm: fitScale(extent), plane };
  return `Set to the problem's own numbers. 1 grid square = ${lenLabel(1 / s.view.upm)}`;
}
