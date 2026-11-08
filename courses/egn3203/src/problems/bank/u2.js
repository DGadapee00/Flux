/**
 * Unit 2 bank: round-off. Original problems, written for the Round-off lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { CUBICS, df, f } from '@flux/subjects/math/roots.js';
import { COST, run } from '@flux/subjects/math/rungekutta.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { maxErr, newton as newtonForm, runge } from '@flux/subjects/math/interp.js';
import { errorsAt } from '@flux/subjects/math/fdiff.js';
import { factor } from '@flux/subjects/math/stiff.js';
import { quarterArea, stdErr } from '@flux/subjects/math/montecarlo.js';
import { newtonPath } from '@flux/subjects/math/newton2.js';

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

/** The quadratic through Runge's function at −1, 0, 1, at x; `how` reproduces the traps. */
export const quadAt = ($, how = 'right') => {
  const x = Number($.x);
  if (how === 'true') return runge(x);
  if (how === 'line') return 1 - (25 / 26) * x;
  return 1 - (25 / 26) * x * x;
};

/** The forward difference's leading error for sin at x = 1, step 10^−k; `how` reproduces the traps. */
export const fwdErr = ($, how = 'right') => {
  const h = 10 ** -Number($.k);
  if (how === 'central') return ((h * h) / 6) * Math.cos(1);
  if (how === 'half') return h * Math.sin(1);
  return (h / 2) * Math.sin(1);
};

/** Largest stable explicit-Euler step, in ms, for y′ = λy; `num` reproduces the traps. */
export const eulerLimit = ($, num = 2) => (num / Math.abs(Number($.lam))) * 1000;
/** The same by bisection on |1 + hλ| ≤ 1. */
export const limitByBisection = ($) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (Math.abs(factor('explicit', m, Number($.lam))) <= 1) lo = m;
    else hi = m;
  }
  return lo * 1000;
};

/** Standard error of the π estimate with N points; `four` and `pow` reproduce the traps. */
export const piSE = ($, four = 4, pow = 0.5) => four * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4)) / Number($.N) ** pow;

/** START points for one Newton step on the circle and y = 1 − eˣ. */
export const START = { a: [-1, 1], b: [-2, 2], c: [2, -2], d: [1, -1] };
/** x after one Newton step; `how` reproduces the traps. */
export const stepX = ($, how = 'right') => {
  const [x, y] = START[$.s];
  const f1 = x * x + y * y - 4;
  const f2 = Math.exp(x) + y - 1;
  if (how === 'one') return x - f1 / (2 * x);
  const det = 2 * x - 2 * y * Math.exp(x);
  const dx = (-f1 + 2 * y * f2) / det;
  return how === 'sign' ? x - dx : x + dx;
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
  problem({
    id: 'u2.9.quadratic',
    title: 'Three points of Runge’s function',
    exam: 'u2',
    ch: '2',
    lab: 'interp',
    src: 'Flux, written for the Interpolation lab',
    topics: ['interpolation'],
    principles: ['interpolation'],
    vars: { x: choice(['0.25', '0.25'], ['0.5', '0.5'], ['0.75', '0.75']) },
    text: (T) => `f(x) = 1/(1 + 25x²) is sampled at x = −1, 0 and 1. What does the quadratic through those three points give at x = ${T.x}?`,
    parts: [num('p', ($) => quadAt($), '', { label: 'p(x)' })],
    level: 2,
    hints: ['f(±1) = 1/26 and f(0) = 1.', 'By symmetry p(x) = 1 + cx²; fit c at x = 1.'],
    steps: ($) => [String.raw`$p(x) = 1 - \tfrac{25}{26}x^2 = ${Number(quadAt($).toPrecision(4))}$`],
    second: ($) => ({ p: newtonForm([-1, 0, 1], [-1, 0, 1].map(runge))(Number($.x)) }),
    cases: [kase('x = 0.5', { x: '0.5' }, { p: 0.7596 })],
  }),

  problem({
    id: 'u2.10.more-points',
    title: 'More points',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'interp',
    src: 'Flux, written for the Interpolation lab',
    topics: ['interpolation'],
    principles: ['interpolation'],
    vars: { n: choice(['12', 'from 9 to 13'], ['16', 'from 9 to 17']) },
    text: (T) => `You interpolate 1/(1 + 25x²) on [−1, 1] through equally spaced points, and raise their number ${T.n}. What happens to the largest error?`,
    parts: [
      pick('a', 'the largest error', [
        ['grows', 'it grows, near the ends', 'The product Π(x − x_i) is largest near the ends on equal spacing, and the polynomial swings there.'],
        ['falls', 'it falls', 'That is true of Chebyshev points, not equally spaced ones, for this function.'],
      ], () => 'grows'),
    ],
    level: 1,
    hints: ['Look at the error term’s product Π(x − x_i).', 'Where is it largest on equal spacing?'],
    steps: () => ['On equal spacing the error near ±1 grows with n for this function.'],
    sim: { scenario: 'eq8', setup(s, $) { s.n = Number($.n); }, read: (c) => ({ a: c.err > maxErr(8, 'equal') ? 'grows' : 'falls' }) },
    cases: [kase('to 17', { n: '16' }, { a: 'grows' })],
  }),
  problem({
    id: 'u2.11.forward',
    title: 'A forward difference’s error',
    exam: 'u2',
    ch: '2',
    lab: 'derivative',
    src: 'Flux, written for the Derivative lab',
    topics: ['differences'],
    principles: ['differences'],
    vars: { k: choice(['2', '0.01'], ['3', '0.001'], ['4', '0.0001']) },
    text: (T) => `You estimate the derivative of sin x at x = 1 by the forward difference with h = ${T.k}. About how large is its error, from the Taylor series’ leading term?`,
    parts: [num('e', ($) => fwdErr($), '', { label: 'error', tol: 0.02 })],
    level: 2,
    hints: ['f(x + h) = f + hf′ + (h²/2)f″ + …', 'Divide by h: the error is about (h/2)|f″(1)| = (h/2) sin 1.'],
    steps: ($) => [String.raw`$\tfrac{h}{2}\sin 1 = ${Number(fwdErr($).toPrecision(3))}$`],
    sim: { scenario: 'coarse', setup(s, $) { s.lh = -Number($.k); }, read: (c) => ({ e: c.errF }) },
    cases: [kase('h = 0.001', { k: '3' }, { e: 4.207e-4 })],
  }),

  problem({
    id: 'u2.12.smaller',
    title: 'A smaller step',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'derivative',
    src: 'Flux, written for the Derivative lab',
    topics: ['differences'],
    principles: ['differences'],
    vars: { k: choice(['12', '10⁻¹²'], ['14', '10⁻¹⁴']) },
    text: (T) => `A forward difference of sin x at x = 1 in double precision uses h = 10⁻⁸. Is h = ${T.k} more accurate?`,
    parts: [
      pick('a', 'the smaller step', [
        ['worse', 'no, less accurate', 'Round-off error grows as ε|f|/h; below 10⁻⁸ it outweighs truncation.'],
        ['better', 'yes, more accurate', 'Only the truncation error shrinks with h; round-off grows.'],
      ], () => 'worse'),
    ],
    level: 1,
    hints: ['What happens to f(x + h) − f(x) when h is tiny?', 'Round-off is about ε|f|/h.'],
    steps: () => ['Round-off dominates below about 10⁻⁸: the error grows as h shrinks.'],
    sim: { scenario: 'forward', setup(s, $) { s.lh = -Number($.k); }, read: (c) => ({ a: c.errF > errorsAt(-8).f ? 'worse' : 'better' }) },
    cases: [kase('10⁻¹²', { k: '12' }, { a: 'worse' })],
  }),
  problem({
    id: 'u2.13.limit',
    title: 'The explicit step limit',
    exam: 'u2',
    ch: '2',
    lab: 'stiff',
    src: 'Flux, written for the Stiff lab',
    topics: ['stiffness'],
    principles: ['stiffness'],
    vars: { lam: choice(['-200', '−200 per second'], ['-500', '−500 per second'], ['-1000', '−1000 per second'], ['-4000', '−4000 per second']) },
    text: (T) => `A system’s fastest mode decays at λ = ${T.lam}. What is the longest step, in milliseconds, for which explicit Euler keeps that mode from growing?`,
    parts: [num('h', ($) => eulerLimit($), 'ms', { label: 'h_max' })],
    level: 1,
    hints: ['Each step multiplies the mode by 1 + hλ.', 'Stable when |1 + hλ| ≤ 1.'],
    steps: ($) => [String.raw`$h \le 2/|\lambda| = ${Number(eulerLimit($).toPrecision(3))}$ ms`],
    second: ($) => ({ h: limitByBisection($) }),
    cases: [kase('λ = −1000', { lam: '-1000' }, { h: 2 })],
  }),

  problem({
    id: 'u2.14.invisible',
    title: 'A mode you cannot see',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'stiff',
    src: 'Flux, written for the Stiff lab',
    topics: ['stiffness'],
    principles: ['stiffness'],
    vars: { h: choice(['0.005', '5 ms'], ['0.01', '10 ms']) },
    text: (T) => `A system has modes decaying at rates 1 and 1000 per second. The fast one is gone within 10 ms, so you integrate with explicit Euler at h = ${T.h}. Does the answer stay sensible?`,
    parts: [
      pick('a', 'the answer', [
        ['no', 'no, it blows up', 'The fast mode’s factor 1 − 1000h is below −1: it grows every step, from round-off if nothing else.'],
        ['yes', 'yes, the fast mode is gone', 'Explicit Euler does not know the mode is gone: it multiplies whatever is left by 1 − 1000h each step.'],
      ], () => 'no'),
    ],
    level: 2,
    hints: ['Compare h with 2/1000 s.', 'What is 1 + hλ for λ = −1000?'],
    steps: ($) => [`1 − 1000 × ${$.h} = ${1 - 1000 * Number($.h)}: its size is above 1, so the fast mode grows.`],
    sim: { scenario: 'small', setup(s, $) { Object.assign(s, { method: 'explicit', lh: Math.log10(Number($.h)) }); }, read: (c) => ({ a: c.stable ? 'yes' : 'no' }) },
    cases: [kase('5 ms', { h: '0.005' }, { a: 'no' })],
  }),
  problem({
    id: 'u2.15.pi-se',
    title: 'How good is the estimate?',
    exam: 'u2',
    ch: '2',
    lab: 'montecarlo',
    src: 'Flux, written for the Monte Carlo lab',
    topics: ['monte-carlo'],
    principles: ['monte-carlo'],
    vars: { N: choice(['400', '400'], ['2500', '2500'], ['10000', '10 000'], ['40000', '40 000']) },
    text: (T) => `You estimate π as 4 × (share of ${T.N} random points in the unit square that land inside the quarter circle). What is the standard error of the estimate?`,
    parts: [num('se', ($) => piSE($), '', { label: 'standard error' })],
    level: 2,
    hints: ['Each point is inside with probability p = π/4: a 0-or-1 draw with variance p(1 − p).', 'The share’s standard error is √(p(1 − p)/N); the estimate is 4 times the share.'],
    steps: ($) => [String.raw`$4\sqrt{p(1 - p)/N} = 1.642/\sqrt{${$.N}} = ${Number(piSE($).toPrecision(3))}$`],
    second: ($) => ({ se: stdErr(Number($.N), quarterArea()) }),
    cases: [kase('N = 10 000', { N: '10000' }, { se: 0.01642 })],
  }),

  problem({
    id: 'u2.16.ten-times',
    title: 'Ten times the points',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'montecarlo',
    src: 'Flux, written for the Monte Carlo lab',
    topics: ['monte-carlo'],
    principles: ['monte-carlo'],
    vars: { N: choice(['1000', 'from 1000 to 10 000'], ['10000', 'from 10 000 to 100 000']) },
    text: (T) => `A Monte Carlo estimate uses ten times as many points, ${T.N}. About how much more accurate is it?`,
    parts: [
      pick('a', 'the accuracy', [
        ['three', 'about three times', 'The standard error falls as 1/√N: √10 ≈ 3.2.'],
        ['ten', 'ten times', 'That would need the error to fall as 1/N; random sampling gives 1/√N.'],
        ['same', 'no better', 'More independent points do shrink the spread of the average.'],
      ], () => 'three'),
    ],
    level: 1,
    hints: ['How does the spread of an average of N draws scale?', 'σ/√N.'],
    steps: () => ['Standard error ∝ 1/√N: ten times the points, about 3.2 times the accuracy.'],
    sim: { scenario: 'thousand', setup(s, $) { s.lN = Math.log10(Number($.N)) + 1; }, read: (c) => ({ a: Math.abs(stdErr(c.N / 10) / c.se - Math.sqrt(10)) < 0.1 ? 'three' : 'ten' }) },
    cases: [kase('1000 to 10 000', { N: '1000' }, { a: 'three' })],
  }),
  problem({
    id: 'u2.17.newton-step',
    title: 'One Newton step for two equations',
    exam: 'u2',
    ch: '2',
    lab: 'newton',
    src: 'Flux, written for the Newton in 2D lab',
    topics: ['newton-systems'],
    principles: ['newton-systems'],
    vars: { s: choice(['a', '(−1, 1)'], ['b', '(−2, 2)'], ['c', '(2, −2)'], ['d', '(1, −1)']) },
    text: (T) => `Solve x² + y² = 4 and eˣ + y = 1 by Newton’s method from ${T.s}. What is x after one step?`,
    parts: [num('x', ($) => stepX($), '', { label: 'x₁' })],
    level: 3,
    hints: ['F = (x² + y² − 4, eˣ + y − 1), J = [[2x, 2y], [eˣ, 1]].', 'Solve J Δ = −F, then x₁ = x₀ + Δx.'],
    steps: ($) => [String.raw`$x_1 = ${Number(stepX($).toPrecision(4))}$`],
    second: ($) => ({ x: newtonPath(...START[$.s], 1)[1][0] }),
    cases: [kase('from (−1, 1)', { s: 'a' }, { x: -2 })],
  }),

  problem({
    id: 'u2.18.together',
    title: 'One at a time',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'newton',
    src: 'Flux, written for the Newton in 2D lab',
    topics: ['newton-systems'],
    principles: ['newton-systems'],
    vars: { s: choice(['left', '(−1, 1)'], ['corner', '(−2, 2)']) },
    text: (T) => `To solve x² + y² = 4 and eˣ + y = 1 from ${T.s}, a student alternates: y from the second equation, then x from the first, and repeats. Against Newton’s method, how fast does the error fall?`,
    parts: [
      pick('a', 'the alternating scheme', [
        ['slower', 'far slower: a fixed fraction per step at best', 'Each half-step ignores the other equation and undoes part of the last move.'],
        ['same', 'about as fast', 'Newton squares the error near the root; alternating cannot.'],
        ['faster', 'faster, since each step is simpler', 'Cheaper steps, but many more of them.'],
      ], () => 'slower'),
    ],
    level: 1,
    hints: ['How does Newton’s error shrink near a root?', 'What does each half-step of the alternating scheme ignore?'],
    steps: () => ['Newton: error squared each step. Alternating: at best a fixed fraction.'],
    sim: { scenario: 'left', setup(s, $) { Object.assign(s, $.s === 'left' ? { x0: -1, y0: 1 } : { x0: -2, y0: 2 }); }, read: (c) => ({ a: (c.altErrs[8] ?? 1) > 100 * c.errs[4] ? 'slower' : 'same' }) },
    cases: [kase('from (−1, 1)', { s: 'left' }, { a: 'slower' })],
  }),
];
