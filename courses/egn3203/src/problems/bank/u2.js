/**
 * Unit 2 bank: round-off. Original problems, written for the Round-off lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const POWER = { four: 4, five: 5, six: 6 };
/** The order of each difference formula the problems name. */
export const ORDER = { central: 2, five: 4 };

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

  problem({
    id: 'u2.3.halve',
    title: 'Halve the step',
    exam: 'u2',
    ch: '2',
    lab: 'truncation',
    src: 'Flux, written for the Truncation lab',
    topics: ['order'],
    principles: ['order'],
    vars: { method: choice(['central', 'the central difference (f(x+h) − f(x−h))/2h'], ['five', 'the five-point formula']), E: range(1, 9, 1, '× 10⁻⁴', 1e-4) },
    text: (T) => `A derivative estimated by ${T.method} has an error of ${T.E} × 10⁻⁴ at some step h, where round-off is negligible. Estimate the error at h/2.`,
    parts: [num('E2', ($) => $.E / 2 ** ORDER[$.method], '', { label: 'error at h/2', abs: 0, tol: 0.01 })],
    level: 1,
    hints: ['What order is the method? The central difference is second order, the five-point formula fourth.', 'Error ≈ K hᵖ, so halving h divides it by 2ᵖ.'],
    steps: ($) => [`Order ${ORDER[$.method]}: divide by 2^${ORDER[$.method]} = ${2 ** ORDER[$.method]}, giving ${($.E / 2 ** ORDER[$.method]).toExponential(2)}.`],
    sim: {
      scenario: 'tenth',
      setup(s) {
        s.lh = -1;
      },
      read: (c, s, $) => ({ E2: $.E * (c.methods[$.method].errorHalf / c.methods[$.method].error) }),
    },
    cases: [kase('central, 8 × 10⁻⁴', { method: 'central', E: 8 }, { E2: 2e-4 })],
  }),

  problem({
    id: 'u2.4.smallest',
    title: 'The smallest step?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'truncation',
    src: 'Flux, written for the Truncation lab',
    topics: ['order'],
    principles: ['order'],
    vars: { method: choice(['forward', 'a forward difference'], ['central', 'a central difference']) },
    text: (T) => `You estimate a derivative in double precision with ${T.method}. Should you use the smallest step h the computer can represent?`,
    parts: [
      pick('step', 'the step', [
        ['smallest', 'yes: the error falls as h shrinks', 'Only the truncation error falls. Round-off, about u|f|/h, grows as h shrinks.'],
        ['balance', 'no: there is a best h, where truncation and round-off balance', 'Below it the error climbs again; for a forward difference of sin x it is near h = 10⁻⁸.'],
        ['largest', 'no: a large h is always safest', 'A large h makes the truncation error large.'],
      ], () => 'balance'),
    ],
    level: 2,
    hints: ['Two errors: truncation, which falls with h, and round-off, which rises as 1/h.', 'Look at the error curve on log axes as h goes to 10⁻¹².'],
    steps: () => ['Truncation falls as hᵖ while round-off grows as u/h, so the total error has a minimum at a moderate h.'],
    sim: {
      scenario: 'small',
      setup(s) {
        s.lh = -12;
      },
      read: (c, s, $) => ({ step: c.methods[$.method].error > 1e-9 ? 'balance' : 'smallest' }),
    },
    cases: [kase('forward', { method: 'forward' }, { step: 'balance' })],
  }),

];
