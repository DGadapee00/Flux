import { problem, kase, range, sym } from '../kit.js';
import { exprToTex } from '../engine.js';
export const choose = (values) => ({
  type: 'choice',
  options: values.map((value) => ({ value, label: String(value) })),
});
export const citation = (unit, problem) =>
  `MIT OCW 18.01SC, Fall 2010, Unit ${unit}, Solutions to 18.01 Exercises, ${problem}`;
export const numeric = (id, get, label, traps, unit = '') => ({
  id,
  kind: 'numeric',
  get,
  label,
  unit,
  tol: 0.005,
  abs: 1e-7,
  traps,
});
/**
 * A form may be a recipe: `params` lists each coefficient's values, the first value of each being
 * the cited exercise's, and `make(p)` returns the form's fields for one choice. Combination 0 is
 * always the cited one, so the printed answer stays a worked case. `pick` walks the combinations
 * in mixed radix; a form with fewer than PICKS combinations rejects the picks past its count, so
 * the version count is exact and every version reads differently.
 */
export const PICKS = 24;
const comboCount = (f) => (f.params ? Object.values(f.params).reduce((n, list) => n * list.length, 1) : 1);
const paramsAt = (f, k) => {
  const out = {};
  let r = k;
  for (const [name, list] of Object.entries(f.params)) {
    out[name] = list[r % list.length];
    r = Math.floor(r / list.length);
  }
  return out;
};
/** Drop unit coefficients and first powers from a recipe's expression keys: 1*x → x, x^1 → x. */
export const tidy = (e) =>
  typeof e !== 'string'
    ? e
    : e
        .replace(/\^\(1\)(?![\d.])/g, '')
        .replace(/\^1(?![\d./])/g, '')
        .replace(/\(1\)\*/g, '')
        .replace(/(^|[^\d.)a-zA-Z^])1\*/g, '$1')
        .replace(/\*1(?![\d.^/])/g, '');
const tidied = (v) => ({ ...v, key: tidy(v.key), alt: tidy(v.alt), wrong: tidy(v.wrong) });
export const formAt = (f, k = 0) => (f.make ? tidied({ ...f, ...f.make(paramsAt(f, k)) }) : f);
const picks = (forms) => Math.min(PICKS, Math.max(...Object.values(forms).map(comboCount)));
const versionsOf = (forms) => Object.values(forms).reduce((n, f) => n + Math.min(comboCount(f), PICKS), 0);
const pickVar = (forms) => choose([...Array(picks(forms)).keys()]);
const pickValid = (forms) => ($) => $.pick < Math.min(comboCount(forms[$.form]), PICKS);
/** Symbolic families keep function and representation changes explicit, never a numeric range alone.
 * The second method differentiates the original function numerically before returning its equivalent key. */
export function symbolicFamily({ id, exam, ch, title, topics, forms, hints, level = 2 }) {
  const ids = Object.keys(forms),
    first = forms[ids[0]];
  return problem({
    id,
    exam,
    ch,
    title,
    topics,
    kind: 'symbolic',
    level,
    minVersions: versionsOf(forms),
    variety: ['function family', 'coefficients'],
    vars: { form: choose(ids), pick: pickVar(forms) },
    valid: pickValid(forms),
    derive: ($) => {
      const v = formAt(forms[$.form], $.pick);
      return { v, x: v.at ?? 0.7 };
    },
    text: (T, $) =>
      String.raw`Differentiate $f(x)=${$.v.tex}$. Give an expression valid on ${$.v.domain || 'its differentiable domain'}.`,
    parts: [
      sym(
        'formula',
        ($) => $.v.key,
        ['x'],
        ($) => $.v.df($.x),
        { label: "$f'(x)$" },
      ),
    ],
    hints,
    steps: ($) => [
      $.v.reason,
      String.raw`$f'(x)=${exprToTex($.v.key, ['x'])}$.`,
      $.v.check ||
        'Check by differentiating the original expression with a centred difference at an interior point.',
    ],
    second: ($) => {
      const h = 1e-5,
        fd = ($.v.fn($.x + h) - $.v.fn($.x - h)) / (2 * h),
        want = $.v.df($.x);
      if (Math.abs(fd - want) > 1e-4 * Math.max(1, Math.abs(want)))
        throw Error('Finite difference disagrees');
      return { formula: $.v.key };
    },
    cases: Object.entries(forms)
      .filter(([, v]) => v.source)
      .map(([form, f]) => {
        const v = formAt(f, 0);
        return kase(
          v.source,
          { form, pick: 0 },
          { formula: v.key },
          { accept: { formula: [v.alt] }, reject: { formula: [v.wrong] } },
        );
      }),
  });
}
export function conceptFamily({ id, exam, ch, title, topics, forms, hints }) {
  const ids = Object.keys(forms);
  return problem({
    id,
    exam,
    ch,
    title,
    topics,
    kind: 'conceptual',
    level: 2,
    minVersions: ids.length,
    variety: ['configuration', 'representation'],
    vars: { form: choose(ids), order: choose([0, 1, 2]) },
    derive: ($) => {
      const base = forms[$.form],
        k = $.order ?? 0;
      return {
        q: {
          ...base,
          options: base.options.map((_, i) => base.options[(i + k) % base.options.length]),
          correct: ((base.correct ?? 0) - k + base.options.length) % base.options.length,
        },
      };
    },
    text: (T, $) => $.q.ask,
    parts: [
      {
        id: 'reason',
        kind: 'choice',
        label: 'Choose the complete statement',
        options: ($) => $.q.options.map(([label, why], value) => ({ value, label, why })),
        correct: ($) => $.q.correct ?? 0,
      },
    ],
    hints,
    steps: ($) => [$.q.options[$.q.correct ?? 0][1]],
    second: ($) => ({ reason: $.q.correct ?? 0 }),
    cases: Object.entries(forms)
      .filter(([, v]) => v.source)
      .map(([form, v]) => kase(v.source, { form, order: 0 }, { reason: v.correct ?? 0 })),
  });
}

/** A requested formula need not be a derivative. The family supplies an independent value check. */
export function formulaFamily({ id, exam, ch, title, topics, forms, hints, level = 2, variable = 'x' }) {
  const ids = Object.keys(forms);
  return problem({
    id,
    exam,
    ch,
    title,
    topics,
    kind: 'symbolic',
    level,
    minVersions: versionsOf(forms),
    variety: ['function family', 'representation', 'coefficients'],
    vars: { form: choose(ids), pick: pickVar(forms) },
    valid: pickValid(forms),
    derive: ($) => {
      const v = formAt(forms[$.form], $.pick);
      return { v, x: v.at ?? 0.6, [variable]: v.at ?? 0.6 };
    },
    text: (T, $) => $.v.ask,
    parts: [
      sym(
        'formula',
        ($) => $.v.key,
        [variable],
        ($) => $.v.get($.x),
        { label: 'requested formula' },
      ),
    ],
    hints,
    steps: ($) => [
      $.v.reason,
      String.raw`The formula is $${exprToTex($.v.key, [variable])}$.`,
      $.v.check || 'Substitute a nearby admissible input to check the expression.',
    ],
    second: ($) => {
      const got = $.v.second($.x),
        want = $.v.get($.x);
      if (Math.abs(got - want) > 1e-4 * Math.max(1, Math.abs(want)))
        throw Error('Independent formula check disagrees');
      return { formula: $.v.key };
    },
    cases: Object.entries(forms)
      .filter(([, v]) => v.source)
      .map(([form, f]) => {
        const v = formAt(f, 0);
        return kase(
          v.source,
          { form, pick: 0 },
          { formula: v.key },
          { accept: { formula: [v.alt] }, reject: { formula: [v.wrong] } },
        );
      }),
  });
}
export function numericFamily({
  id,
  exam,
  ch,
  title,
  topics,
  forms,
  hints,
  level = 2,
  lab,
  sim,
  tol = 0.005,
}) {
  const ids = Object.keys(forms);
  return problem({
    id,
    exam,
    ch,
    title,
    topics,
    kind: 'numeric',
    level,
    lab,
    sim,
    minVersions: versionsOf(forms),
    variety: ['configuration', 'unknown', 'coefficients'],
    vars: { form: choose(ids), pick: pickVar(forms) },
    valid: pickValid(forms),
    derive: ($) => ({ v: formAt(forms[$.form], $.pick) }),
    text: (T, $) => $.v.ask,
    parts: [
      {
        ...numeric('answer', ($) => $.v.answer, 'requested value', [
          [($) => $.v.traps[0][0], ($) => $.v.traps[0][1]],
          [($) => $.v.traps[1][0], ($) => $.v.traps[1][1]],
        ]),
        tol,
      },
    ],
    hints,
    steps: ($) => [$.v.reason, `The result is ${$.v.answer}${$.v.unit ? ' ' + $.v.unit : ''}.`],
    second: ($) => ({ answer: $.v.second() }),
    cases: Object.entries(forms)
      .filter(([, v]) => v.source)
      .map(([form, f]) => {
        const v = formAt(f, 0);
        return kase(v.source, { form, pick: 0 }, { answer: v.printed ?? v.answer }, { note: v.note });
      }),
  });
}

/** A coefficient in TeX or an expression: 1 prints nothing, −1 prints a minus sign. */
export const cf = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));
/** x shifted by h: x, (x−h) or (x+|h|). */
export const shift = (h, v = 'x') => (h === 0 ? v : h > 0 ? `(${v}-${h})` : `(${v}+${-h})`);
/** A rational number as exact text, for answers and keys: 0.25 → 1/4, −1.5 → −3/2. */
export const fr = (x) => {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  for (let d = 2; d <= 2000; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-12) return `${n}/${d}`;
  }
  return String(x);
};
/** The same as TeX: \tfrac{1}{4}, −\tfrac{3}{2}. */
export const frTex = (x) => {
  const t = fr(x);
  if (!t.includes('/')) return t;
  const [n, d] = t.split('/');
  return `${n.startsWith('-') ? '-' : ''}\\tfrac{${n.replace('-', '')}}{${d}}`;
};
/** A power in TeX that drops a first exponent: pw('x', 1) is x, pw('x', 3) is x^{3}. */
export const pw = (v, n) => (n === 1 ? v : `${v}^{${n}}`);
/**
 * A sum of terms as an expression key, signs joined properly and zero terms dropped:
 * sum([2, ''], [-1/8, '(x-3)^2']) is 2-(1/8)*(x-3)^2. A coefficient of ±1 multiplies nothing.
 */
export const sum = (...terms) => {
  let out = '';
  for (const [c, body] of terms) {
    if (Math.abs(c) < 1e-12) continue;
    const mag = Math.abs(c),
      m = fr(mag),
      piece = body ? (Math.abs(mag - 1) < 1e-12 ? body : `${m.includes('/') ? `(${m})` : m}*${body}`) : m;
    out += c < 0 ? `-${piece}` : `${out ? '+' : ''}${piece}`;
  }
  return out || '0';
};
/** x shifted by a rational c, as an expression: x, (x-1/2) or (x+3). */
export const shiftExpr = (c) => (c === 0 ? 'x' : c > 0 ? `(x-${fr(c)})` : `(x+${fr(-c)})`);
