import {
  arcsinHalf,
  arcsinHalfSimpson,
  improperArea,
  improperSimpson,
  improperTail,
  partialLn,
  partialSimpson,
  partialSplit,
  partsXSin,
  partsXSinSimpson,
  sinExact,
  sinSimpson,
  sinSimpson4,
  sinSimpsonPanels,
  sinSquaredHalf,
  sinSquaredSimpson,
  sinTrap,
  sinTrap4,
  sinTrapPanels,
} from '../../math/calc2.js';
import { domain, kase, num, problem, range, tf } from '../kit.js';

const numFrame = { xMin: -0.3, xMax: 3.5, yMin: -0.35, yMax: 1.45, plane: 'xy' };
const impFrame = { xMin: 0.2, xMax: 8.8, yMin: -0.25, yMax: 1.35, plane: 'xy' };

export default [
  problem({
    id: 'u2.parts.xsin',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.1',
    title: 'Integration by parts',
    kind: 'numeric',
    level: 2,
    topics: ['parts'],
    vars: {},
    derive: () => ({ v: partsXSin() }),
    second: () => ({ v: partsXSinSimpson() }),
    text: () => String.raw`Find $\int_0^{\pi} x\sin x\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [String.raw`Let $u=x$ and $dv=\sin x\,dx$. Then $du=dx$ and $v=-\cos x$.`],
    steps: ($, f) => [
      String.raw`$-x\cos x+\sin x$ from $0$ to $\pi$ is $\pi$.`,
      String.raw`The value is $${f($.v)}$.`,
      "Simpson's rule on $x\\sin x$ agrees.",
    ],
    cases: [kase('0 to π', {}, { v: Math.PI })],
  }),

  problem({
    id: 'u2.trig.sq',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.2',
    title: 'A squared sine',
    kind: 'numeric',
    level: 2,
    topics: ['trig integrals'],
    vars: {},
    derive: () => ({ v: sinSquaredHalf() }),
    second: () => ({ v: sinSquaredSimpson() }),
    text: () => String.raw`Find $\int_0^{\pi/2} \sin^2 x\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [String.raw`$\sin^2 x=(1-\cos 2x)/2$.`],
    steps: ($, f) => [
      String.raw`The double-angle form integrates to $\pi/4$ on this interval.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('quarter turn', {}, { v: Math.PI / 4 })],
  }),

  problem({
    id: 'u2.trigsub.arc',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.3',
    title: 'A trigonometric substitution',
    kind: 'numeric',
    level: 2,
    topics: ['trig sub'],
    vars: {},
    derive: () => ({ v: arcsinHalf() }),
    second: () => ({ v: arcsinHalfSimpson() }),
    text: () => String.raw`Find $\int_0^{1/2} \dfrac{1}{\sqrt{1-x^2}}\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [String.raw`The substitution $x=\sin\theta$ turns the integrand into $1$. The antiderivative is $\arcsin x$.`],
    steps: ($, f) => [
      String.raw`$\arcsin(1/2)-\arcsin 0=\pi/6$.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('up to 1/2', {}, { v: Math.PI / 6 })],
  }),

  problem({
    id: 'u2.partial.ln',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.4',
    title: 'Partial fractions',
    kind: 'numeric',
    level: 2,
    topics: ['partial fractions'],
    vars: {},
    derive: () => ({ v: partialSplit() }),
    second: () => ({ v: partialSimpson() }),
    text: () => String.raw`Find $\int_0^1 \dfrac{1}{(x+1)(x+2)}\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [String.raw`$\dfrac{1}{(x+1)(x+2)}=\dfrac{1}{x+1}-\dfrac{1}{x+2}$.`],
    steps: ($, f) => [
      String.raw`$\ln(x+1)-\ln(x+2)$ from $0$ to $1$ is $\ln(4/3)$.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('unit interval', {}, { v: partialLn() })],
  }),

  problem({
    id: 'u2.num.trap',
    exam: 'u2',
    ch: '3',
    lab: 'numint',
    src: 'OpenStax Calc 2 §3.6',
    title: 'A trapezoidal estimate',
    kind: 'numeric',
    level: 1,
    topics: ['numerical'],
    vars: { n: range(2, 8, 2) },
    derive: ($) => ({ trap: sinTrap($.n), err: Math.abs(sinTrap($.n) - sinExact()) }),
    second: ($) => ({ trap: sinTrapPanels($.n), err: Math.abs(sinTrapPanels($.n) - sinExact()) }),
    text: (T) =>
      String.raw`Estimate $\int_0^{\pi} \sin x\,dx$ with the trapezoidal rule and $n=${T.n}$. Also give the absolute error against the exact value $2$.`,
    parts: [
      num('trap', ($) => $.trap, '', { label: 'trapezoid', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [String.raw`$h=\pi/n$. Weight the endpoints once and the interior samples twice.`],
    steps: ($, f) => [
      String.raw`The weighted sum is $${f($.trap)}$.`,
      String.raw`The absolute error is $${f($.err)}$.`,
      'Adding the panels one by one agrees.',
    ],
    sim: {
      scenario: 'coarse',
      setup(slice, $) {
        slice.n = $.n;
        return domain(slice, numFrame);
      },
      read: (c) => ({ trap: c.trap, err: c.trapErr }),
    },
    cases: [kase('n=4', { n: 4 }, { trap: sinTrap4(), err: Math.abs(sinTrap4() - 2) })],
  }),

  problem({
    id: 'u2.num.simp',
    exam: 'u2',
    ch: '3',
    lab: 'numint',
    src: 'OpenStax Calc 2 §3.6',
    title: 'A Simpson estimate',
    kind: 'numeric',
    level: 2,
    topics: ['numerical'],
    vars: { n: range(2, 8, 2) },
    derive: ($) => ({ simp: sinSimpson($.n), err: Math.abs(sinSimpson($.n) - sinExact()) }),
    second: ($) => ({ simp: sinSimpsonPanels($.n), err: Math.abs(sinSimpsonPanels($.n) - sinExact()) }),
    text: (T) =>
      String.raw`Estimate $\int_0^{\pi} \sin x\,dx$ with Simpson's rule and $n=${T.n}$. Also give the absolute error against the exact value $2$.`,
    parts: [
      num('simp', ($) => $.simp, '', { label: 'Simpson', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [String.raw`$n$ is even. The weights run $1,4,2,4,\ldots,2,4,1$, and the factor is $h/3$.`],
    steps: ($, f) => [
      String.raw`The weighted sum is $${f($.simp)}$.`,
      String.raw`The absolute error is $${f($.err)}$.`,
      'The paired-panel sum agrees.',
    ],
    sim: {
      scenario: 'coarse',
      setup(slice, $) {
        slice.n = $.n;
        return domain(slice, numFrame);
      },
      read: (c) => ({ simp: c.simp, err: c.simpErr }),
    },
    cases: [kase('n=4', { n: 4 }, { simp: sinSimpson4(), err: Math.abs(sinSimpson4() - 2) })],
  }),

  problem({
    id: 'u2.num.closer',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.6',
    title: 'Which rule is closer',
    kind: 'conceptual',
    level: 1,
    topics: ['numerical'],
    vars: { n: range(2, 8, 2) },
    derive: ($) => ({
      closer: Math.abs(sinSimpson($.n) - sinExact()) < Math.abs(sinTrap($.n) - sinExact()) ? 1 : 0,
    }),
    second: ($) => ({
      closer: Math.abs(sinSimpsonPanels($.n) - 2) < Math.abs(sinTrapPanels($.n) - 2) ? 1 : 0,
    }),
    text: (T) =>
      String.raw`True or false: for $\int_0^{\pi}\sin x\,dx$ with $n=${T.n}$ panels, Simpson's rule has a smaller absolute error than the trapezoidal rule.`,
    parts: [tf('closer', ($) => (Math.abs(sinSimpson($.n) - 2) < Math.abs(sinTrap($.n) - 2) ? 1 : 0), { label: 'Simpson is closer' })],
    hints: ['Simpson fits a parabola through each pair of panels. The trapezoid fits a chord.'],
    steps: () => ['On this hump the parabola follows the curve more closely than the chord, at every even panel count here.'],
    cases: [kase('n=4', { n: 4 }, { closer: 1 })],
  }),

  problem({
    id: 'u2.imp.tail',
    exam: 'u2',
    ch: '3',
    lab: 'improper',
    src: 'OpenStax Calc 2 §3.7',
    title: 'A finite piece of an improper integral',
    kind: 'numeric',
    level: 1,
    topics: ['improper'],
    vars: { b: range(2, 8, 2) },
    derive: ($) => ({ area: improperArea($.b), tail: improperTail($.b) }),
    second: ($) => ({ area: improperSimpson($.b), tail: 1 - improperArea($.b) }),
    text: (T) =>
      String.raw`For $\int_1^{${T.b}} x^{-2}\,dx$, give the area and the tail $1/B$ that is still missing from $\int_1^{\infty} x^{-2}\,dx$.`,
    parts: [
      num('area', ($) => $.area, '', { label: 'area', abs: 1e-6 }),
      num('tail', ($) => $.tail, '', { label: 'tail', abs: 1e-6 }),
    ],
    hints: [String.raw`The antiderivative of $x^{-2}$ is $-1/x$.`],
    steps: ($, f) => [
      String.raw`Area $1-1/B=${f($.area)}$.`,
      String.raw`Tail $1/B=${f($.tail)}$. They add to $1$.`,
    ],
    sim: {
      scenario: 'near',
      setup(slice, $) {
        slice.b = $.b;
        return domain(slice, impFrame);
      },
      read: (c) => ({ area: c.area, tail: c.tail }),
    },
    cases: [kase('B=2', { b: 2 }, { area: 0.5, tail: 0.5 })],
  }),
];