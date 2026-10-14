import {
  accumArea,
  accumHeight,
  accumSimpson,
  accumStep,
  exactSquare01,
  leftSquare01,
  leftSquareLoop,
  lineIntegral,
  lineIntegralSimpson,
  midSquare01,
  midSquareLoop,
  powerIntegral,
  powerIntegralSimpson,
  simpsonSquare01,
  substExpanded,
  substIntegral,
} from '../../math/calc1.js';
import { domain, kase, num, problem, range, tf } from '../kit.js';

const plane = { xMin: -0.3, xMax: 1.4, yMin: -0.3, yMax: 1.4, plane: 'xy' };

export default [
  problem({
    id: 'u4.riem.left',
    exam: 'u4',
    ch: '5',
    lab: 'riemann',
    src: 'OpenStax Calc 1 §5.1',
    title: 'A left Riemann sum',
    kind: 'numeric',
    level: 1,
    topics: ['integration'],
    vars: { n: range(4, 8, 2) },
    derive: ($) => ({ sum: leftSquare01($.n) }),
    second: ($) => ({ sum: leftSquareLoop($.n) }),
    text: (T) => String.raw`Left Riemann sum of $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$.`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 1e-6 })],
    hints: [String.raw`$\Delta x=1/n$. Sample the left edge of each subinterval.`],
    steps: ($, f) => [
      String.raw`The closed form $(n-1)(2n-1)/(6n^2)$ gives $${f($.sum)}$.`,
      'Adding the rectangles one by one agrees.',
    ],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 1;
        slice.n = $.n;
        slice.sample = 'left';
        return domain(slice, plane);
      },
      read: (c) => ({ sum: c.sum }),
    },
    cases: [kase('n=4', { n: 4 }, { sum: 0.21875 })],
  }),

  problem({
    id: 'u4.riem.mid',
    exam: 'u4',
    ch: '5',
    lab: 'riemann',
    src: 'OpenStax Calc 1 §5.1',
    title: 'Midpoint sum and the exact area',
    kind: 'numeric',
    level: 2,
    topics: ['integration'],
    vars: { n: range(4, 8, 2) },
    derive: ($) => ({ sum: midSquare01($.n), exact: exactSquare01() }),
    second: ($) => ({ sum: midSquareLoop($.n), exact: simpsonSquare01() }),
    text: (T) =>
      String.raw`For $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$, give the midpoint Riemann sum and the exact integral.`,
    parts: [
      num('sum', ($) => $.sum, '', { label: 'midpoint sum', abs: 1e-6 }),
      num('exact', ($) => $.exact, '', { label: 'exact integral', abs: 1e-6 }),
    ],
    hints: [String.raw`The antiderivative of $x^2$ is $x^3/3$.`],
    steps: ($, f) => [
      String.raw`Midpoint sum $${f($.sum)}$.`,
      String.raw`Exact area $1/3\approx ${f($.exact)}$. Simpson's rule agrees with the exact area.`,
    ],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 1;
        slice.n = $.n;
        slice.sample = 'mid';
        return domain(slice, plane);
      },
      read: (c) => ({ sum: c.sum, exact: c.exact }),
    },
    cases: [kase('n=4', { n: 4 }, { sum: 0.328125, exact: 1 / 3 })],
  }),

  problem({
    id: 'u4.riem.order',
    exam: 'u4',
    ch: '5',
    src: 'OpenStax Calc 1 §5.1',
    title: 'Which side undershoots',
    kind: 'conceptual',
    level: 1,
    topics: ['integration'],
    vars: { n: range(4, 10, 2) },
    derive: ($) => ({ under: leftSquare01($.n) < exactSquare01() ? 1 : 0 }),
    second: ($) => ({ under: leftSquareLoop($.n) < simpsonSquare01() ? 1 : 0 }),
    text: (T) =>
      String.raw`True or false: for $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$, the left Riemann sum is less than the exact integral.`,
    parts: [tf('under', ($) => (leftSquare01($.n) < exactSquare01() ? 1 : 0), { label: 'left sum is smaller' })],
    hints: ['On this interval $x^2$ is increasing, so each left sample is the low side of its cell.'],
    steps: () => ['The left sum uses the smaller height in every cell, so it sits under the area.'],
    cases: [kase('n=4', { n: 4 }, { under: 1 })],
  }),

  problem({
    id: 'u4.ftc.accum',
    exam: 'u4',
    ch: '5',
    lab: 'accum',
    src: 'OpenStax Calc 1 §5.3',
    title: 'Accumulation and its derivative',
    kind: 'numeric',
    level: 2,
    topics: ['fundamental theorem'],
    vars: { x: range(1, 2, 0.5) },
    derive: ($) => ({ area: accumArea('quad', 0, $.x), height: accumHeight('quad', $.x) }),
    second: ($) => ({ area: accumSimpson('quad', 0, $.x), height: accumStep('quad', 0, $.x) }),
    text: (T) =>
      String.raw`Let $A(x)=\int_0^x t^2\,dt$. Find $A(${T.x})$ and $A'(${T.x})$.`,
    parts: [
      num('area', ($) => $.area, '', { label: '$A(x)$', abs: 1e-4 }),
      num('height', ($) => $.height, '', { label: "$A'$", abs: 1e-4 }),
    ],
    hints: [String.raw`The antiderivative of $t^2$ is $t^3/3$. The FTC says $A'(x)=x^2$.`],
    steps: ($, f) => [
      String.raw`$A(${$.x})=${$.x}^3/3=${f($.area)}$.`,
      String.raw`$A'(${$.x})=${$.x}^2=${f($.height)}$. A short step of $A$ agrees.`,
    ],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 2;
        slice.x = $.x;
        return domain(slice, { xMin: -0.35, xMax: 2.35, yMin: -0.45, yMax: 4.5, plane: 'xy' });
      },
      read: (c) => ({ area: c.area, height: c.height }),
    },
    cases: [kase('x=1', { x: 1 }, { area: 1 / 3, height: 1 })],
  }),

  problem({
    id: 'u4.power',
    exam: 'u4',
    ch: '5',
    src: 'OpenStax Calc 1 §5.4',
    title: 'A power integral',
    kind: 'numeric',
    level: 1,
    topics: ['antiderivatives'],
    vars: { n: range(2, 4, 1), b: range(1, 2, 1) },
    derive: ($) => ({ area: powerIntegral($.n, $.b) }),
    second: ($) => ({ area: powerIntegralSimpson($.n, $.b) }),
    text: (T) => String.raw`Evaluate $\int_0^{${T.b}} x^{${T.n}}\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [String.raw`The antiderivative of $x^n$ is $x^{n+1}/(n+1)$.`],
    steps: ($, f) => [
      String.raw`$${$.b}^{${$.n + 1}}/${$.n + 1}=${f($.area)}$.`,
      "Simpson's rule on the same interval agrees.",
    ],
    cases: [kase('n=3, b=2', { n: 3, b: 2 }, { area: 4 })],
  }),

  problem({
    id: 'u4.sub',
    exam: 'u4',
    ch: '5',
    src: 'OpenStax Calc 1 §5.5',
    title: 'A substitution',
    kind: 'numeric',
    level: 2,
    topics: ['substitution'],
    vars: { n: range(1, 3, 1) },
    derive: ($) => ({ area: substIntegral($.n) }),
    second: ($) => ({ area: substExpanded($.n) }),
    text: (T) => String.raw`Evaluate $\int_0^1 2x(x^2+1)^{${T.n}}\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [String.raw`Let $u=x^2+1$. Then $du=2x\,dx$, and $u$ runs from $1$ to $2$.`],
    steps: ($, f) => [
      String.raw`$\int_1^2 u^{${$.n}}\,du=(2^{${$.n + 1}}-1)/${$.n + 1}=${f($.area)}$.`,
      'Expanding the power and integrating term by term agrees.',
    ],
    cases: [kase('n=2', { n: 2 }, { area: 7 / 3 })],
  }),

  problem({
    id: 'u4.line',
    exam: 'u4',
    ch: '5',
    lab: 'accum',
    src: 'OpenStax Calc 1 §5.4',
    title: 'Net change along a line',
    kind: 'numeric',
    level: 1,
    topics: ['definite integral'],
    vars: { b: range(1, 3, 1) },
    derive: ($) => ({ area: lineIntegral($.b) }),
    second: ($) => ({ area: lineIntegralSimpson($.b) }),
    text: (T) => String.raw`Evaluate $\int_0^{${T.b}}(2x+1)\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [String.raw`The antiderivative of $2x+1$ is $x^2+x$.`],
    steps: ($, f) => [
      String.raw`$${$.b}^2+${$.b}=${f($.area)}$.`,
      "Simpson's rule agrees.",
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.graphId = 'line';
        slice.a = 0;
        slice.b = Math.max(2, $.b);
        slice.x = $.b;
        const yMax = 2 * slice.b + 1 + 0.5;
        return domain(slice, { xMin: -0.35, xMax: slice.b + 0.35, yMin: -0.45, yMax, plane: 'xy' });
      },
      read: (c) => ({ area: c.area }),
    },
    cases: [kase('b=1', { b: 1 }, { area: 2 })],
  }),
];
