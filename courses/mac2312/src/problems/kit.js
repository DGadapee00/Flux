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

/**
 * Symbolic answer. `expr` may be a string or a function of the version.
 * `vars` lists the symbols a student may type, plus pi.
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

function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

/** Lowest-terms coefficient times x^exp. xPow(4, 2, 3) is 2*x^3. */
export function xPow(num, den, exp) {
  let n = Math.round(num);
  let d = Math.round(den);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const sign = n < 0 ? '-' : '';
  const an = Math.abs(n);
  if (exp === 0) return d === 1 ? `${sign}${an}` : `${sign}${an}/${d}`;
  const pow = exp === 1 ? 'x' : `x^${exp}`;
  if (d === 1 && an === 1) return `${sign}${pow}`;
  const coeff = d === 1 ? String(an) : `${an}/${d}`;
  return `${sign}${coeff}*${pow}`;
}

/** Sum of terms that already carry their own sign. */
export function sumTerms(terms) {
  const parts = terms.filter((t) => t && t !== '0');
  if (!parts.length) return '0';
  return parts
    .map((t, i) => (i === 0 || t.startsWith('-') ? t : `+${t}`))
    .join('');
}

/** Lowest-terms multiple of π. piTex(4, 2) is \pi. piTex(3, 2) is 3\pi/2. */
export function piTex(numer, denom) {
  let n = Math.round(numer);
  let d = Math.round(denom);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const an = Math.abs(n);
  const body = an === 1 ? '\\pi' : `${an}\\pi`;
  return d === 1 ? `${sign}${body}` : `${sign}${body}/${d}`;
}

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

export const kase = (src, v, want, o = {}) => ({
  src,
  v,
  want,
  key: o.key ?? null,
  note: o.note ?? null,
  accept: o.accept ?? null,
  reject: o.reject ?? null,
});

export function domain(s, { xMin, xMax, yMin, yMax, plane = 'xy' } = {}) {
  const extent = Math.max(1e-9, Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax));
  s.xMin = xMin;
  s.xMax = xMax;
  s.yMin = yMin;
  s.yMax = yMax;
  s.view = { upm: fitScale(extent), plane };
  return `Set to the problem's own numbers. 1 grid square = ${lenLabel(1 / s.view.upm)}`;
}
