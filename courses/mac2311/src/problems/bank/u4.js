import { exactSquare01, leftSquare01, leftSquareLoop, midSquare01, midSquareLoop, simpsonSquare01 } from '../../math/calc1.js';
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
];
