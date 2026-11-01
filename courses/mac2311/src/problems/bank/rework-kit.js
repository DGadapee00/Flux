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
    minVersions: ids.length,
    variety: ['function family'],
    vars: { form: choose(ids) },
    derive: ($) => ({ v: forms[$.form], x: forms[$.form].at ?? 0.7 }),
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
      .map(([form, v]) =>
        kase(
          v.source,
          { form },
          { formula: v.key },
          { accept: { formula: [v.alt] }, reject: { formula: [v.wrong] } },
        ),
      ),
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
    minVersions: ids.length,
    variety: ['function family', 'representation'],
    vars: { form: choose(ids) },
    derive: ($) => ({ v: forms[$.form], x: forms[$.form].at ?? 0.6, [variable]: forms[$.form].at ?? 0.6 }),
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
      .map(([form, v]) =>
        kase(
          v.source,
          { form },
          { formula: v.key },
          { accept: { formula: [v.alt] }, reject: { formula: [v.wrong] } },
        ),
      ),
  });
}
export function numericFamily({ id, exam, ch, title, topics, forms, hints, level = 2, lab, sim }) {
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
    minVersions: ids.length,
    variety: ['configuration', 'unknown'],
    vars: { form: choose(ids) },
    derive: ($) => ({ v: forms[$.form] }),
    text: (T, $) => $.v.ask,
    parts: [
      numeric('answer', ($) => $.v.answer, 'requested value', [
        [($) => $.v.traps[0][0], ($) => $.v.traps[0][1]],
        [($) => $.v.traps[1][0], ($) => $.v.traps[1][1]],
      ]),
    ],
    hints,
    steps: ($) => [$.v.reason, `The result is ${$.v.answer}${$.v.unit ? ' ' + $.v.unit : ''}.`],
    second: ($) => ({ answer: $.v.second() }),
    cases: Object.entries(forms)
      .filter(([, v]) => v.source)
      .map(([form, v]) => kase(v.source, { form }, { answer: v.printed ?? v.answer }, { note: v.note })),
  });
}
