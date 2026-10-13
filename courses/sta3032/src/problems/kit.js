/**
 * Authoring kit for problem generators. A template is a generator: variables with ranges, answers
 * computed from them, and a worked solution that reads like the teacher's: formula, numbers in,
 * result, with every table lookup named. See PROBLEMS.md.
 */
import { zTable, zCritTable, tTable, chi2Table, fTable, binomTable, poisTable } from '../stats/tables.js';

// ---------- variables ----------
export const range = (min, max, step, opts = {}) => ({ type: 'range', min, max, step, ...opts });
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });
/**
 * A data set drawn fresh for each version. `make(rand, values)` returns an array; it runs after
 * the ranges and choices, so it can use them (a sample of size n). `format` writes it for the text.
 */
export const data = (make, format = null) => ({ type: 'data', make, format });

// ---------- parts ----------
/**
 * Numeric answer. `get($)` is the exact answer. Options:
 *   alt($)  other accepted answers (the table route): a number or a list
 *   tol     relative tolerance (default 0.5%)   abs  absolute tolerance
 *   traps   [[valueFn, message], …]: a named mistake, recognised when typed
 *   unit    text after the box ("minutes")        label  the part's question
 */
export const num = (id, get, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  alt: o.alt ?? null,
  tol: o.tol ?? 0.005,
  abs: o.abs ?? 0,
  traps: o.traps ?? [],
  unit: o.unit ?? null,
  label: o.label ?? null,
  prob: false,
  // How far a table route may legitimately sit from the exact answer (for the check), when more
  // than the default 1%: a count out of N inherits N times the table's rounding.
  altGap: o.altGap ?? null,
});

/**
 * A probability. Graded to about table precision: within 0.001 of the exact value or of the
 * table route in `alt`, so 0.309 and 0.3085 are both right for 0.30854, and 25% reads as 0.25.
 */
export const prob = (id, get, o = {}) => ({ ...num(id, get, { abs: 0.001, tol: 0, ...o }), prob: true });

/** Multiple choice. An option may carry a third entry: why that answer is wrong. */
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

/** Free response (a sketch, a sentence of interpretation), checked by the student against a rubric. */
export const self = (id, prompt, rubric) => ({ id, kind: 'self', label: prompt, rubric });

// ---------- template ----------
export function problem(spec) {
  return {
    level: 1,
    kind: 'numeric',
    topics: [],
    vars: {},
    derive: () => ({}),
    valid: () => true,
    hints: [],
    steps: () => [],
    cases: [],
    ...spec,
  };
}

/** A worked case: the notes' or a worksheet's own numbers. want: partId → expected value. */
export const kase = (src, v, want, o = {}) => ({ src, v, want, key: o.key ?? null, note: o.note ?? null });

// ---------- numbers in TeX ----------

/** A number for the inside of `$…$`, to `n` significant figures, never in e-notation. */
export function tn(x, n = 4) {
  if (!Number.isFinite(x)) return x > 0 ? '\\infty' : x < 0 ? '-\\infty' : '-';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-4 && a < 1e7) return String(Number(x.toPrecision(n)));
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${Number(m)}\\times 10^{${Number(e)}}`;
}

/** A number to `dp` decimal places, trailing zeros kept: fx(0.3, 4) → "0.3000". */
export const fx = (x, dp = 4) => (Object.is(Math.round(x * 10 ** dp), -0) ? (0).toFixed(dp) : x.toFixed(dp));

/** A number in parentheses when negative, for a product or a subtraction: pn(-1.5) → "(-1.5)". */
export const pn = (x, n = 4) => (x < 0 ? `(${tn(x, n)})` : tn(x, n));

/** Round half away from zero, as a person does. */
export const roundTo = (x, dp) => Math.sign(x) * Math.round(Math.abs(x) * 10 ** dp + 1e-9) / 10 ** dp;

// ---------- table lookups, for solutions and `alt` ----------

/**
 * Φ(z) the two ways: exact, and read off Table A.3 after rounding z to 2 places. `line` is the
 * step to show, e.g. "Table A.3 at z = −1.24: 0.1075".
 */
export function zLook(z) {
  const t = zTable(z);
  const zs = fx(t.z, 2);
  const line = t.off
    ? String.raw`$z = ${zs}$ is past the end of Table A.3, so $\Phi(z) \approx ${fx(t.value, 4)}$ (or ${t.z < 0 ? 0 : 1})`
    : String.raw`Table A.3 at $z = ${zs}$: $\Phi(${zs}) = ${fx(t.value, 4)}$`;
  return { z: t.z, table: t.value, values: t.values, line };
}

/** z_α from the table, with the note on how it was read. */
export function zCritLook(alpha) {
  const t = zCritTable(alpha);
  const line = t.tie
    ? String.raw`Table A.3: the area $${fx(1 - alpha, 4)}$ falls halfway between $z = ${fx(t.values[1], 2)}$ and $${fx(t.values[2], 2)}$, so $z_{${alpha}} = ${t.z}$`
    : String.raw`Table A.3: the area closest to $${fx(1 - alpha, 4)}$ is at $z = ${fx(t.z, 2)}$, so $z_{${alpha}} = ${fx(t.z, 2)}$`;
  return { value: t.z, values: t.values, line };
}

const dfTex = (df) => (df === Infinity ? '\\infty' : String(df));

/** t_α(ν) from Table A.4, with the line for the solution (both rows when ν falls between them). */
export function tLook(alpha, df) {
  const t = tTable(alpha, df);
  if (!t.inTable) return { value: null, values: [], line: '' };
  const line =
    t.rows.length === 1 && t.rows[0] === df
      ? String.raw`Table A.4, $\nu = ${dfTex(df)}$, $\alpha = ${alpha}$: $t_{${alpha}} = ${fx(t.value, 3)}$`
      : String.raw`Table A.4 has no row for $\nu = ${df}$; the rows ${t.rows.map((r) => String.raw`$\nu = ${dfTex(r)}$`).join(' and ')} give ${t.values.map((v) => `$${fx(v, 3)}$`).join(' and ')} (either is accepted; the smaller $\nu$ is the safer choice)`;
  return { value: t.value, values: t.values, line };
}

/** χ²_α(ν) from Table A.5. */
export function chi2Look(alpha, df) {
  const t = chi2Table(alpha, df);
  if (!t.inTable) return { value: null, values: [], line: '' };
  const line =
    t.rows.length === 1 && t.rows[0] === df
      ? String.raw`Table A.5, $\nu = ${df}$, $\alpha = ${alpha}$: $\chi^2_{${alpha}} = ${t.value}$`
      : String.raw`Table A.5 has no row for $\nu = ${df}$; the rows ${t.rows.map((r) => String.raw`$\nu = ${r}$`).join(' and ')} give ${t.values.map((v) => `$${v}$`).join(' and ')}`;
  return { value: t.value, values: t.values, line };
}

/** f_α(ν₁, ν₂) from Table A.6, through the reciprocal rule for a lower point. */
export function fLook(alpha, v1, v2) {
  const t = fTable(alpha, v1, v2);
  if (!t.inTable) return { value: null, values: [], line: '' };
  const line = t.reciprocal
    ? String.raw`$f_{${fx(alpha, 2)}}(${v1}, ${v2}) = \dfrac{1}{f_{${t.reciprocal.alpha}}(${v2}, ${v1})} = \dfrac{1}{${fx(t.reciprocal.value, 2)}} = ${fx(t.value, 4)}$ (Table A.6)`
    : String.raw`Table A.6, $f_{${alpha}}(${v1}, ${v2}) = ${fx(t.value, 2)}$`;
  return { value: t.value, values: t.values, line };
}

export { binomTable, poisTable };

// ---------- hypothesis tests and intervals (Ch 7–10) ----------

/** The three alternatives, as the notes lay them out. */
export const SIDE = choice(['two', 'two-tailed'], ['left', 'left-tailed'], ['right', 'right-tailed']);
const REL = { two: '\\ne', left: '<', right: '>' };

/** "H_0: μ = 920" and "H_1: μ > 920" in TeX. */
export const hyp = (param, v0, side) => [String.raw`H_0: ${param} = ${v0}`, String.raw`H_1: ${param} ${REL[side]} ${v0}`];

/** The p-value as a probability statement, e.g. "P(Z > 1.84)" or "2P(T > |−1.53|)". */
export function pTex(side, name, stat, df = null) {
  const v = tn(stat, 4);
  const sub = df == null ? '' : `_{${typeof df === 'number' && !Number.isInteger(df) ? tn(df, 4) : df}}`;
  if (side === 'left') return String.raw`P(${name}${sub} < ${v})`;
  if (side === 'right') return String.raw`P(${name}${sub} > ${v})`;
  return String.raw`2P(${name}${sub} > ${tn(Math.abs(stat), 4)})`;
}

/** The notes' decision rule: reject when p-value < α. */
export const decide = (p, alpha) => (p < alpha ? 'reject' : 'fail');

export const decisionPart = (o = {}) =>
  mc(
    'dec',
    [
      ['reject', 'Reject H₀', 'Reject only when the p-value is less than α.'],
      ['fail', 'Fail to reject H₀', 'The p-value is less than α, so the data are unlikely under H₀: reject it.'],
    ],
    ($) => $.dec,
    { label: ($T, $) => `Decision at α = ${$.alpha}`, ...o },
  );

/** Choosing H₁ from the question's wording: its sign is the test's tail. */
export const h1Part = (o = {}) =>
  mc(
    'h1',
    [
      ['two', 'H₁ uses ≠ (two-tailed)', 'Read the claim again: “different from”, “changed” or “not equal” is ≠; “more than” is >; “less than” is <.'],
      ['left', 'H₁ uses < (left-tailed)', 'Read the claim again: “less than”, “below”, “decreased” is <; “more than” is >; “different from” is ≠.'],
      ['right', 'H₁ uses > (right-tailed)', 'Read the claim again: “more than”, “above”, “increased” is >; “less than” is <; “different from” is ≠.'],
    ],
    ($) => $.side,
    { label: 'The alternative hypothesis', ...o },
  );

/**
 * The conclusion in words, with the two classic wrong ones: "accepting" H₀ and "proving" H₁. A
 * test weighs evidence against H₀; it never proves either hypothesis.
 */
export const conclusionPart = (o = {}) =>
  mc(
    'concl',
    [
      ['yes', 'There is sufficient evidence to conclude H₁ (the claim being tested).', 'H₀ was not rejected (p-value ≥ α), so the data do not give sufficient evidence for H₁.'],
      ['no', 'There is not sufficient evidence to conclude H₁.', 'H₀ was rejected (p-value < α): there is sufficient evidence for H₁.'],
      ['accept', 'The data show that H₀ is true.', 'A test never shows H₀ is true. Failing to reject it only means the evidence against it is not strong enough.'],
      ['prove', 'The data prove that H₁ is true.', 'A test gives evidence, not proof: even when H₀ is true, a test at α = 0.05 rejects it 5% of the time.'],
    ],
    ($) => ($.dec === 'reject' ? 'yes' : 'no'),
    { label: 'The conclusion', ...o },
  );

/** Step lines for a test's decision and the notes' conclusion sentence. */
export function conclude($, claim) {
  const rej = $.dec === 'reject';
  const rel = rej ? '<' : String.raw`\ge`;
  return [
    String.raw`p-value $= ${fx($.p, 4)} ${rel} \alpha = ${$.alpha}$, so ${rej ? 'reject' : 'fail to reject'} $H_0$.`,
    `${rej ? 'There is sufficient evidence' : 'There is not sufficient evidence'} to conclude that ${claim}.`,
  ];
}

/** A z-based p-value read from Table A.3 after rounding z: the table route for `alt`. */
export function zTableP(side, z) {
  const T = (v) => zTable(v).value;
  if (side === 'left') return T(z);
  if (side === 'right') return 1 - T(z);
  return 2 * (1 - T(Math.abs(z)));
}

/** The critical values a student may use for a two-sided 100(1 − α)% interval: exact, then table. */
export function zCrits(alpha) {
  return [zCritTable(alpha / 2).values, zCritTable(alpha / 2).z].flat();
}

/** An interval endpoint: exact, or any table-route value; tolerance scales with the margin. */
export const endpoint = (id, get, o = {}) =>
  num(id, get, {
    tol: 0,
    abs: ($) => Math.max(0.004 * Math.abs(o.margin ? o.margin($) : 1), 0.0006),
    // A table route moves the endpoint by the table's error in the critical value: a few percent
    // of the margin at most (a df between rows, z rounded to 2 places).
    altGap: ($) => 0.05 * Math.abs(o.margin ? o.margin($) : 1),
    ...o,
    label: o.label ?? (id === 'lo' ? 'Lower bound' : 'Upper bound'),
  });

/** A test statistic, graded to the two decimals a calculator screen is copied at. */
export const statPart = (id, get, label, o = {}) => num(id, get, { tol: 0.004, abs: 0.006, label, ...o });

/** A p-value: to about 3 decimals, or the table route. */
export const pPart = (get, o = {}) => prob('p', get, { label: 'p-value', ...o });

export const confLabel = (conf) => `${Math.round(conf * 100)}%`;
