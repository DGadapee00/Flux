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
  simpson,
  substExpanded,
  substIntegral,
} from '../../math/calc1.js';
import { coef, domain, kase, num, problem, range, sym, tf, xPow } from '../kit.js';
import { exprToTex } from '../engine.js';

const plane = { xMin: -0.3, xMax: 1.4, yMin: -0.3, yMax: 1.4, plane: 'xy' };

/** The antiderivative of c·x·cos(a·x²) that is 0 at 0: (c/2a)·sin(a·x²). */
function subKey(a, c) {
  const k = xPow(c, 2 * a, 0);
  const inside = a === 1 ? 'x^2' : `${a}*x^2`;
  return k === '1' ? `sin(${inside})` : `${k}*sin(${inside})`;
}

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
    vars: { n: range(2, 51, 1) },
    derive: ($) => ({ sum: leftSquare01($.n) }),
    second: ($) => ({ sum: leftSquareLoop($.n) }),
    text: (T) => String.raw`Left Riemann sum of $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$.`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 1e-6 })],
    hints: [
      'A left sum samples each subinterval at its left edge, then multiplies each height by the width.',
      (T, $) => String.raw`The width is $1/${$.n}$. The left edges are $0,\ 1/${$.n},\ \ldots,\ ${$.n - 1}/${$.n}$.`,
      (T, $) => String.raw`Add $0^2+1^2+\cdots+${$.n - 1}^2$, then divide by $${$.n}^3$.`,
    ],
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
    vars: { n: range(2, 51, 1) },
    derive: ($) => ({ sum: midSquare01($.n), exact: exactSquare01() }),
    second: ($) => ({ sum: midSquareLoop($.n), exact: simpsonSquare01() }),
    text: (T) =>
      String.raw`For $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$, give the midpoint Riemann sum and the exact integral.`,
    parts: [
      num('sum', ($) => $.sum, '', { label: 'midpoint sum', abs: 1e-6 }),
      num('exact', ($) => $.exact, '', { label: 'exact integral', abs: 1e-6 }),
    ],
    hints: [
      'A midpoint sum samples each subinterval at its centre. The exact value comes from an antiderivative.',
      (T, $) => String.raw`The width is $1/${$.n}$. The centres are $1/${2 * $.n},\ 3/${2 * $.n},\ \ldots$`,
      String.raw`Add the squared centres and multiply by the width. For the exact value, evaluate $x^3/3$ from $0$ to $1$.`,
    ],
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
    vars: { n: range(2, 51, 1) },
    derive: ($) => ({ under: leftSquare01($.n) < exactSquare01() ? 1 : 0 }),
    second: ($) => ({ under: leftSquareLoop($.n) < simpsonSquare01() ? 1 : 0 }),
    text: (T) =>
      String.raw`True or false: for $f(x)=x^2$ on $[0,1]$ with $n=${T.n}$, the left Riemann sum is less than the exact integral.`,
    parts: [tf('under', ($) => (leftSquare01($.n) < exactSquare01() ? 1 : 0), { label: 'left sum is smaller' })],
    hints: [
      'Where $f$ is increasing, the left edge of each subinterval is its lowest point.',
      'So each left rectangle sits under the curve on its own subinterval.',
    ],
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
    vars: { x: range(0.25, 2, 0.025) },
    derive: ($) => ({ area: accumArea('quad', 0, $.x), height: accumHeight('quad', $.x) }),
    second: ($) => ({ area: accumSimpson('quad', 0, $.x), height: accumStep('quad', 0, $.x) }),
    text: (T) =>
      String.raw`Let $A(x)=\int_0^x t^2\,dt$. Find $A(${T.x})$ and $A'(${T.x})$.`,
    parts: [
      num('area', ($) => $.area, '', { label: '$A(x)$', abs: 1e-4 }),
      num('height', ($) => $.height, '', { label: "$A'$", abs: 1e-4 }),
    ],
    hints: [
      String.raw`The Fundamental Theorem gives $A'(x)$ without integrating. For $A(x)$, use an antiderivative.`,
      String.raw`An antiderivative of $t^2$ is $t^3/3$.`,
      (T) => String.raw`Evaluate $t^3/3$ from $0$ to $${T.x}$. For $A'$, evaluate the integrand at $t=${T.x}$.`,
    ],
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
    vars: { n: range(1, 10, 1), b: range(1, 5, 1) },
    derive: ($) => ({ area: powerIntegral($.n, $.b) }),
    second: ($) => ({ area: powerIntegralSimpson($.n, $.b) }),
    text: (T, $) => String.raw`Evaluate $\int_0^{${T.b}} ${$.n === 1 ? 'x' : `x^{${$.n}}`}\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [
      'Find an antiderivative with the power rule. Then evaluate it at the two limits.',
      (T, $) => String.raw`An antiderivative of $${$.n === 1 ? 'x' : `x^{${$.n}}`}$ is $x^{${$.n + 1}}/${$.n + 1}$.`,
      (T) => String.raw`Evaluate it at $${T.b}$. At $0$ it is $0$.`,
    ],
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
    vars: { n: range(1, 50, 1) },
    derive: ($) => ({ area: substIntegral($.n) }),
    second: ($) => ({ area: substExpanded($.n) }),
    text: (T, $) => String.raw`Evaluate $\int_0^1 2x(x^2+1)${$.n === 1 ? '' : `^{${$.n}}`}\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [
      'Look for a function whose derivative also sits in the integrand. That function is the substitution.',
      String.raw`Let $u=x^2+1$. Then $du=2x\,dx$, and $u$ runs from $1$ to $2$.`,
      (T, $) => String.raw`The integral becomes $\int_1^2 ${$.n === 1 ? 'u' : `u^{${$.n}}`}\,du$.`,
    ],
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
    vars: { b: range(1, 50, 1) },
    derive: ($) => ({ area: lineIntegral($.b) }),
    second: ($) => ({ area: lineIntegralSimpson($.b) }),
    text: (T) => String.raw`Evaluate $\int_0^{${T.b}}(2x+1)\,dx$.`,
    parts: [num('area', ($) => $.area, '', { label: 'integral', abs: 1e-4 })],
    hints: [
      'Integrate term by term with the power rule.',
      String.raw`An antiderivative of $2x+1$ is $x^2+x$.`,
      (T) => String.raw`Evaluate it at $${T.b}$, and subtract its value at $0$.`,
    ],
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

  problem({
    id: 'u4.sym.anti',
    exam: 'u4',
    ch: '5',
    src: 'OpenStax Calc 1 §5.4',
    title: 'An antiderivative as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['antiderivatives', 'symbolic'],
    vars: { a: range(1, 10, 1), n: range(1, 5, 1) },
    derive: ($) => ({ x: 1, val: $.a / ($.n + 1) }),
    second: ($) => ({
      formula: xPow($.a, $.n + 1, $.n + 1),
      val: simpson((t) => $.a * t ** $.n, 0, 1),
    }),
    text: (T, $) =>
      String.raw`Let $f(x)=${coef(T.a)}${$.n === 1 ? 'x' : `x^{${$.n}}`}$. Write the antiderivative that is $0$ at $x=0$, as a formula in $x$, and give its value at $x=1$.`,
    parts: [
      sym(
        'formula',
        ($) => xPow($.a, $.n + 1, $.n + 1),
        ['x'],
        ($) => ($.a / ($.n + 1)) * $.x ** ($.n + 1),
        { label: 'antiderivative' },
      ),
      num('val', ($) => $.val, '', { label: 'value at 1', abs: 1e-6 }),
    ],
    hints: [
      'Reverse the power rule: raise the exponent by one, then divide by the new exponent.',
      (T, $) => String.raw`The new exponent is $${$.n + 1}$. Divide the coefficient $${$.a}$ by it and reduce the fraction.`,
      String.raw`Pick the constant that makes the result $0$ at $x=0$. For the number, substitute $x=1$.`,
    ],
    steps: ($, f) => [
      String.raw`The antiderivative is $${exprToTex(xPow($.a, $.n + 1, $.n + 1), ['x'])}$.`,
      String.raw`At $x=1$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=2, n=2', { a: 2, n: 2 }, { formula: '2/3*x^3', val: 2 / 3 }, {
        accept: { formula: ['(2/3)*x^3'] },
        reject: { formula: ['2/3*x^3+C'] },
      }),
    ],
  }),
  problem({
    id: 'u4.sym.sub',
    exam: 'u4',
    ch: '5',
    src: 'OpenStax Calc 1 §5.5',
    title: 'An antiderivative by substitution',
    kind: 'derivation',
    level: 3,
    topics: ['antiderivatives', 'substitution', 'symbolic'],
    vars: { a: range(1, 10, 1), c: range(1, 10, 1) },
    derive: ($) => ({ x: 1, val: ($.c / (2 * $.a)) * Math.sin($.a) }),
    second: ($) => ({
      formula: subKey($.a, $.c),
      val: simpson((t) => $.c * t * Math.cos($.a * t * t), 0, 1),
    }),
    text: (T) =>
      String.raw`Let $f(x)=${coef(T.c)}x\cos(${coef(T.a)}x^2)$. Write the antiderivative that is $0$ at $x=0$, as a formula in $x$, and give its value at $x=1$.`,
    parts: [
      sym('formula', ($) => subKey($.a, $.c), ['x'], ($) => ($.c / (2 * $.a)) * Math.sin($.a * $.x * $.x), {
        label: 'antiderivative',
      }),
      num('val', ($) => $.val, '', { label: 'value at 1', abs: 1e-6 }),
    ],
    hints: [
      'Look for an inside function whose derivative is also a factor of the integrand. Substitute for it.',
      (T, $) => String.raw`Let $u=${coef($.a)}x^2$. Then $du=${2 * $.a}x\,dx$.`,
      (T, $) => String.raw`So the integrand is $\dfrac{${$.c}}{${2 * $.a}}\cos u\,du$. Reduce that fraction. $\sin u$ is $0$ at $x=0$, so no constant is added.`,
    ],
    steps: ($, f) => [
      String.raw`With $u=${coef($.a)}x^2$, the antiderivative is $${exprToTex(subKey($.a, $.c), ['x'])}$.`,
      String.raw`At $x=1$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=1, c=2', { a: 1, c: 2 }, { formula: 'sin(x^2)', val: Math.sin(1) }, {
        accept: { formula: ['sin(x*x)'] },
        reject: { formula: ['sin(x^2)+C', '2*sin(x^2)'] },
      }),
    ],
  }),
];
