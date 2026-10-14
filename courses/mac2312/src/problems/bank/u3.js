import { sampleFn, taylorError, taylorHorner, taylorSum } from '../../math/calc2.js';
import { domain, kase, num, problem, range, tf } from '../kit.js';

const frame = { xMin: -1.8, xMax: 2.4, yMin: -1.6, yMax: 1.6, plane: 'xy' };

export default [
  problem({
    id: 'u3.tay.line',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Tangent line for sine',
    kind: 'numeric',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 1, $.x), err: taylorError('sin', 0, 1, $.x) }),
    second: ($) => ({ poly: taylorHorner('sin', 0, 1, $.x), err: Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 1, $.x)) }),
    text: (T) =>
      String.raw`The Maclaurin polynomial of order $1$ for $\sin x$ is the tangent line at $0$. Evaluate it at $x=${T.x}$, and give the absolute error against $\sin x$.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_1', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [String.raw`$P_1(x)=x$ when the centre is $0$.`],
    steps: ($, f) => [
      String.raw`$P_1(${f($.x)})=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
      'Horner form gives the same value.',
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 1;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly, err: c.err }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 0.5, err: Math.abs(Math.sin(0.5) - 0.5) })],
  }),

  problem({
    id: 'u3.tay.cubic',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 3 for sine',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 3, $.x) }),
    second: ($) => ({ poly: taylorHorner('sin', 0, 3, $.x) }),
    text: (T) => String.raw`Evaluate the Maclaurin polynomial of order $3$ for $\sin x$ at $x=${T.x}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_3', abs: 1e-6 })],
    hints: [String.raw`$P_3(x)=x-x^3/6$.`],
    steps: ($, f) => [
      String.raw`$P_3=${f($.poly)}$.`,
      'Nesting the same coefficients (Horner) agrees.',
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 3;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 23 / 48 })],
  }),

  problem({
    id: 'u3.tay.fifth',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 5 for sine',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 5, $.x), err: taylorError('sin', 0, 5, $.x) }),
    second: ($) => ({
      poly: taylorHorner('sin', 0, 5, $.x),
      err: Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 5, $.x)),
    }),
    text: (T) =>
      String.raw`Evaluate the Maclaurin polynomial of order $5$ for $\sin x$ at $x=${T.x}$, and give the absolute error.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_5', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [String.raw`$P_5(x)=x-x^3/6+x^5/120$.`],
    steps: ($, f) => [
      String.raw`$P_5=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
    ],
    sim: {
      scenario: 'fifth',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 5;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly, err: c.err }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 1841 / 3840, err: Math.abs(Math.sin(0.5) - 1841 / 3840) })],
  }),

  problem({
    id: 'u3.tay.tighter',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Higher order, smaller error',
    kind: 'conceptual',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ tighter: taylorError('sin', 0, 5, $.x) < taylorError('sin', 0, 1, $.x) ? 1 : 0 }),
    second: ($) => ({
      tighter:
        Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 5, $.x)) <
        Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 1, $.x))
          ? 1
          : 0,
    }),
    text: (T) =>
      String.raw`True or false: at $x=${T.x}$, the Maclaurin polynomial of order $5$ for $\sin x$ has a smaller absolute error than the order-$1$ polynomial.`,
    parts: [tf('tighter', ($) => (taylorError('sin', 0, 5, $.x) < taylorError('sin', 0, 1, $.x) ? 1 : 0), { label: 'order 5 is closer' })],
    hints: ['Each new odd term of sine is the next piece of the error.'],
    steps: () => ['Order 5 adds the $x^3$ and $x^5$ terms that order 1 leaves out, so the gap shrinks on this interval.'],
    cases: [kase('x=1/2', { x: 0.5 }, { tighter: 1 })],
  }),

  problem({
    id: 'u3.tay.exp',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Maclaurin polynomial for the exponential',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ poly: taylorSum('exp', 0, 4, $.x) }),
    second: ($) => ({ poly: taylorHorner('exp', 0, 4, $.x) }),
    text: (T) => String.raw`Evaluate the Maclaurin polynomial of order $4$ for $e^x$ at $x=${T.x}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_4', abs: 1e-6 })],
    hints: [String.raw`$P_4(x)=1+x+x^2/2+x^3/6+x^4/24$.`],
    steps: ($, f) => [
      String.raw`$P_4=${f($.poly)}$.`,
      'Horner form uses the same coefficients and agrees.',
    ],
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 633 / 384 })],
  }),

  problem({
    id: 'u3.tay.shift',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Taylor polynomial about π/2',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { h: range(0.2, 0.6, 0.1) },
    derive: ($) => ({ poly: taylorSum('sin', Math.PI / 2, 2, Math.PI / 2 + $.h) }),
    second: ($) => ({ poly: taylorHorner('sin', Math.PI / 2, 2, Math.PI / 2 + $.h) }),
    text: (T) =>
      String.raw`The Taylor polynomial of order $2$ for $\sin x$ about $\pi/2$ is $1-(x-\pi/2)^2/2$. Evaluate it at $x=\pi/2+${T.h}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_2', abs: 1e-6 })],
    hints: [String.raw`$\sin(\pi/2)=1$ and $\cos(\pi/2)=0$, so the linear term drops out.`],
    steps: ($, f) => [
      String.raw`$P_2=1-h^2/2=${f($.poly)}$.`,
      'Horner form agrees.',
    ],
    sim: {
      scenario: 'shift',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 2;
        slice.a = Math.PI / 2;
        slice.x = Math.PI / 2 + $.h;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly }),
    },
    cases: [kase('h=0.4', { h: 0.4 }, { poly: 0.92 })],
  }),

  problem({
    id: 'u3.tay.center',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Match at the centre',
    kind: 'conceptual',
    level: 1,
    topics: ['taylor'],
    vars: { n: range(1, 5, 1) },
    derive: ($) => ({ match: taylorError('sin', 0, $.n, 0) < 1e-9 ? 1 : 0 }),
    second: ($) => ({ match: Math.abs(sampleFn('sin', 0) - taylorHorner('sin', 0, $.n, 0)) < 1e-9 ? 1 : 0 }),
    text: (T) =>
      String.raw`True or false: the Maclaurin polynomial of order $${T.n}$ for $\sin x$ equals $\sin 0$ at $x=0$.`,
    parts: [tf('match', ($) => (taylorError('sin', 0, $.n, 0) < 1e-9 ? 1 : 0), { label: 'matches at 0' })],
    hints: ['Every term with a positive power of $x$ is zero at the centre.'],
    steps: () => ['At the centre only the constant term survives, and that constant is the function value.'],
    cases: [kase('n=3', { n: 3 }, { match: 1 })],
  }),

  problem({
    id: 'u3.tay.cos',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 2 for cosine',
    kind: 'numeric',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.1) },
    derive: ($) => ({ poly: taylorSum('cos', 0, 2, $.x), err: taylorError('cos', 0, 2, $.x) }),
    second: ($) => ({
      poly: taylorHorner('cos', 0, 2, $.x),
      err: Math.abs(sampleFn('cos', $.x) - taylorHorner('cos', 0, 2, $.x)),
    }),
    text: (T) =>
      String.raw`Evaluate the Maclaurin polynomial of order $2$ for $\cos x$ at $x=${T.x}$, and give the absolute error.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_2', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [String.raw`$P_2(x)=1-x^2/2$.`],
    steps: ($, f) => [
      String.raw`$P_2=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
    ],
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 7 / 8, err: Math.abs(Math.cos(0.5) - 7 / 8) })],
  }),
];
