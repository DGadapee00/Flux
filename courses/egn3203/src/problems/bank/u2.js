/**
 * Unit 2 bank: round-off. Original problems, written for the Round-off lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { CUBICS, df, f } from '@flux/subjects/math/roots.js';
import { COST, run } from '@flux/subjects/math/rungekutta.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const POWER = { four: 4, five: 5, six: 6 };
/** One step of y′ = −2y from y = 1, by the polynomial each method reduces to. */
export const oneStep = (method, h) => ({ euler: 1 - 2 * h, midpoint: 1 - 2 * h + 2 * h * h, rk4: 1 - 2 * h + 2 * h * h - (4 / 3) * h ** 3 + (2 / 3) * h ** 4 })[method];
/** The order of each difference formula the problems name. */
export const ORDER = { central: 2, five: 4 };
/** One Newton step; `how` names the traps. */
export const newtonStep = ($, how = 'right') => {
  const c = CUBICS[$.fn];
  const [y, d] = [f(c, $.x0), df(c, $.x0)];
  return how === 'plus' ? $.x0 + y / d : how === 'flip' ? $.x0 - d / y : $.x0 - y / d;
};

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


  problem({
    id: 'u2.5.newton-step',
    title: 'One Newton step',
    exam: 'u2',
    ch: '2',
    lab: 'roots',
    src: 'Flux, written for the Roots lab',
    topics: ['roots'],
    principles: ['roots'],
    vars: { fn: choice(['cycle', 'f(x) = x³ − 2x + 2'], ['shifted', 'f(x) = x³ − 3x + 1']), x0: range(-3, -1.5, 0.5) },
    text: (T) => `Take one step of Newton’s method on ${T.fn} from x₀ = ${T.x0}. What is x₁?`,
    parts: [num('x1', ($) => newtonStep($), '', { label: 'x₁' })],
    level: 1,
    hints: ['x₁ = x₀ − f(x₀)/f′(x₀).', 'f′(x) = 3x² + p for x³ + px + q.'],
    steps: ($) => {
      const c = CUBICS[$.fn];
      return [String.raw`$f(${$.x0}) = ${Number(f(c, $.x0).toPrecision(4))}$, $f'(${$.x0}) = ${Number(df(c, $.x0).toPrecision(4))}$, so $x_1 = ${Number(newtonStep($).toPrecision(5))}$`];
    },
    sim: {
      scenario: 'good',
      setup(s, $) {
        Object.assign(s, { fn: $.fn, x0: $.x0 });
      },
      read: (c) => ({ x1: c.newton.xs[1] }),
    },
    cases: [kase('x³ − 2x + 2 from −2', { fn: 'cycle', x0: -2 }, { x1: -1.8 })],
  }),

  problem({
    id: 'u2.6.sure',
    title: 'Which one is sure?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'roots',
    src: 'Flux, written for the Roots lab',
    topics: ['roots'],
    principles: ['roots'],
    vars: { method: choice(['bisection', 'bisection on [−2, 2]'], ['newton', 'Newton’s method started at the bracket’s midpoint, 0']) },
    text: (T) => `f(x) = x³ − 2x + 2 has f(−2) = −2 and f(2) = 6, so it has a root in [−2, 2]. Is ${T.method} sure to find it?`,
    parts: [
      pick('d', 'the method', [
        ['yes', 'yes, it always closes in', 'A sign-change bracket, halved each step, keeps the root inside and shrinks to it.'],
        ['no', 'no, it can fail', 'Newton follows tangents, not the bracket: from 0 on this cubic it cycles between 0 and 1.'],
      ], ($) => ($.method === 'bisection' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['What does each method keep track of from step to step?', 'Try Newton from 0: f(0) = 2, f′(0) = −2.'],
    steps: ($) => [$.method === 'bisection' ? 'The bracket always holds the root and halves: sure.' : 'x₁ = 0 − 2/(−2) = 1, x₂ = 1 − 1/1 = 0: a cycle.'],
    sim: {
      scenario: 'cycle',
      setup(s) {
        Object.assign(s, { fn: 'cycle', x0: 0, a: -2, b: 2 });
      },
      read: (c, s, $) => ({ d: $.method === 'bisection' ? (c.bisect.valid ? 'yes' : 'no') : c.converged ? 'yes' : 'no' }),
    },
    cases: [kase('Newton from 0', { method: 'newton' }, { d: 'no' })],
  }),
  problem({
    id: 'u2.7.one-step',
    title: 'One step by hand',
    exam: 'u2',
    ch: '2',
    lab: 'rk',
    src: 'Flux, written for the Runge–Kutta lab',
    topics: ['ode'],
    principles: ['rk'],
    vars: { method: choice(['euler', 'Euler’s method'], ['rk4', 'classical RK4']), h: range(0.3, 0.6, 0.1, '') },
    text: (T) => `Take one step of ${T.method} with h = ${T.h} on y′ = −2y from y(0) = 1. What is y₁?`,
    parts: [num('y', ($) => oneStep($.method, $.h), '', { label: 'y₁', abs: 1e-6 })],
    level: 2,
    hints: ['Euler: y₁ = y₀ + h f(t₀, y₀).', 'RK4: k₁ = f(y₀), k₂ = f(y₀ + hk₁/2), k₃ = f(y₀ + hk₂/2), k₄ = f(y₀ + hk₃), then y₁ = y₀ + h(k₁ + 2k₂ + 2k₃ + k₄)/6.'],
    steps: ($) => [$.method === 'euler' ? String.raw`$y_1 = 1 + ${$.h}\times(-2) = ${Number(oneStep('euler', $.h).toPrecision(4))}$` : String.raw`$k_1 = -2$, $k_2 = -2(1 - ${$.h})$, $k_3 = -2(1 + ${$.h}k_2/2)$, $k_4 = -2(1 + ${$.h}k_3)$, so $y_1 = ${Number(oneStep('rk4', $.h).toPrecision(4))}$`],
    // Another route: the library's general stepper, one step's worth of slope evaluations.
    second: ($) => ({ y: run({ f: (t, y) => -2 * y, exact: (t) => Math.exp(-2 * t), y0: 1 }, $.method, COST[$.method], $.h).yT }),
    cases: [kase('RK4 at h = 0.5', { method: 'rk4', h: 0.5 }, { y: 0.375 })],
  }),

  problem({
    id: 'u2.8.how-many',
    title: 'A hundred times better',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'rk',
    src: 'Flux, written for the Runge–Kutta lab',
    topics: ['ode'],
    principles: ['rk'],
    vars: { method: choice(['euler', 'Euler’s method (order 1)'], ['midpoint', 'the midpoint method (order 2)'], ['rk4', 'RK4 (order 4)']) },
    text: (T) => `A solution by ${T.method} is a hundred times less accurate than you need. About how many times as many steps do you need?`,
    parts: [
      pick('n', 'steps', [
        ['hundred', 'about 100 times as many', 'For order 1, error ∝ h: a hundredth of the error needs a hundredth of h.'],
        ['ten', 'about 10 times as many', 'For order 2, error ∝ h²: √100 = 10.'],
        ['three', 'about 3 times as many', 'For order 4, error ∝ h⁴: 100^(1/4) ≈ 3.2.'],
      ], ($) => ({ euler: 'hundred', midpoint: 'ten', rk4: 'three' })[$.method]),
    ],
    level: 1,
    hints: ['Error goes as hᵖ for a method of order p.', 'Solve hᵖ ratio = 1/100 for the ratio of h.'],
    steps: ($) => [({ euler: '100^(1/1) = 100.', midpoint: '100^(1/2) = 10.', rk4: '100^(1/4) ≈ 3.2.' })[$.method]],
    // Another route: measure it on the lab's equation, the budget ratio that cuts the error 100-fold.
    second: ($) => {
      const eq = { f: (t, y) => y * Math.cos(t), exact: (t) => Math.exp(Math.sin(t)), y0: 1 };
      const e0 = run(eq, $.method, 1024, 4).error;
      let n = 1024;
      while (run(eq, $.method, n, 4).error > e0 / 100 && n < 1024 * 400) n = Math.ceil(n * 1.05);
      const r = n / 1024;
      return { n: r > 40 ? 'hundred' : r > 5 ? 'ten' : 'three' };
    },
    cases: [kase('RK4', { method: 'rk4' }, { n: 'three' })],
  }),
];
