/**
 * Unit 2 bank: round-off. Original problems, written for the Round-off lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const POWER = { four: 4, five: 5, six: 6 };

export default [
  problem({
    id: 'u2.1.estimate',
    title: 'How much is lost?',
    exam: 'u2',
    ch: '2',
    lab: 'roundoff',
    src: 'Flux, written for the Round-off lab',
    topics: ['cancellation'],
    principles: ['cancellation'],
    vars: { k: choice(['four', 'x = 10⁻⁴'], ['five', 'x = 10⁻⁵'], ['six', 'x = 10⁻⁶']) },
    text: (T) => String.raw`In double precision, with unit round-off $u = 1.11\times10^{-16}$, estimate the relative error of $(1 - \cos x)/x^2$ computed as written at ${T.k}.`,
    parts: [num('err', ($) => 2 * U * 10 ** (2 * POWER[$.k]), '', { label: 'relative error', abs: 0, tol: 0.05 })],
    level: 2,
    hints: ['1 and cos x each carry an error of about u. Their difference is about x²/2.', 'Relative error ≈ u·1/(x²/2) = 2u/x².'],
    steps: ($) => [String.raw`$\dfrac{2u}{x^2} = \dfrac{2(1.11\times10^{-16})}{10^{-${2 * POWER[$.k]}}} = ${(2 * U * 10 ** (2 * POWER[$.k])).toExponential(2)}$`],
    sim: {
      scenario: 'cosine',
      setup(s, $) {
        Object.assign(s, { family: 'cosine', lx: -POWER[$.k] });
      },
      read: (c) => ({ err: c.estimate }),
    },
    cases: [kase('x = 10⁻⁴', { k: 'four' }, { err: 2.22e-8 })],
  }),

  problem({
    id: 'u2.2.rewrite',
    title: 'Which way to compute it?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'roundoff',
    src: 'Flux, written for the Round-off lab',
    topics: ['cancellation'],
    principles: ['cancellation'],
    vars: { family: choice(['cosine', '(1 − cos x)/x² at x = 10⁻⁷, or 2 sin²(x/2)/x²'], ['expm1', '(eˣ − 1)/x at x = 10⁻⁹, or expm1(x)/x'], ['sqrt', '√(x² + 1) − x at x = 10⁷, or 1/(√(x² + 1) + x)']) },
    text: (T) => `In double precision you need ${T.family}. Which should you compute?`,
    parts: [
      pick('form', 'compute', [
        ['written', 'the first, as written', 'It subtracts two nearly equal numbers, and the shared leading digits cancel.'],
        ['rewritten', 'the second, rewritten', 'It never subtracts nearly equal numbers, so it stays near the round-off floor.'],
        ['either', 'either: both are exact algebra', 'They are equal on paper, not in floating point.'],
      ], () => 'rewritten'),
    ],
    level: 1,
    hints: ['Does either form subtract two numbers that are nearly equal at this x?', 'The relative error of a − b is about u|a|/|a − b|.'],
    steps: () => ['The first form subtracts nearly equal numbers and loses most of its digits; the rewritten form does not.'],
    sim: {
      scenario: 'cosine',
      setup(s, $) {
        Object.assign(s, { family: $.family, lx: { cosine: -7, expm1: -9, sqrt: 7 }[$.family] });
      },
      read: (c) => ({ form: c.relStable < c.relDirect ? 'rewritten' : 'written' }),
    },
    cases: [kase('the cosine', { family: 'cosine' }, { form: 'rewritten' })],
  }),
];
