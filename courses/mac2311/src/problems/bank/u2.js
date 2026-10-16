import {
  chainExpanded,
  chainRule,
  circleSlope,
  circleSlopeSolved,
  ladderVelocity,
  powerQuotient,
  powerRule,
  productExpanded,
  productRule,
  quotientQuotient,
  quotientRule,
  sineQuotient,
  sineRule,
} from '../../math/calc1.js';
import { df1 } from '@flux/subjects/math/ndiff.js';
import { coef, domain, kase, num, problem, range, sym, xPow } from '../kit.js';

const plane = { xMin: -2.4, xMax: 2.4, yMin: -0.5, yMax: 4.5, plane: 'xy' };

export default [
  problem({
    id: 'u2.def.quad',
    exam: 'u2',
    ch: '3',
    lab: 'secant',
    src: 'OpenStax Calc 1 §3.1',
    title: 'Derivative from the definition',
    kind: 'numeric',
    level: 1,
    topics: ['derivatives'],
    vars: { x0: range(-2, 2, 0.08) },
    derive: ($) => ({ fp: 2 * $.x0 }),
    second: ($) => ({ fp: df1((x) => x * x, $.x0) }),
    text: (T) => String.raw`Let $f(x)=x^2$. Find $f'(${T.x0})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`The limit of the difference quotient is $2x$.`,
      'Multiply the point by $2$.',
    ],
    steps: ($, f) => [
      String.raw`$f'(${$.x0})=2\cdot${$.x0}=${f($.fp)}$.`,
      'A central difference quotient at a tiny step agrees.',
    ],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.x0 = $.x0;
        slice.h = 0.4;
        slice.a = -2;
        slice.b = 2;
        return domain(slice, plane);
      },
      read: (c) => ({ fp: c.fp }),
    },
    cases: [kase('x=1', { x0: 1 }, { fp: 2 })],
  }),

  problem({
    id: 'u2.power',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.3',
    title: 'Power rule',
    kind: 'numeric',
    level: 1,
    topics: ['derivatives'],
    vars: { n: range(2, 8, 1), x: range(2, 9, 1) },
    derive: ($) => ({ fp: powerRule($.n, $.x) }),
    second: ($) => ({ fp: powerQuotient($.n, $.x) }),
    text: (T) => String.raw`Find the derivative of $f(x)=x^{${T.n}}$ at $x=${T.x}$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`$\dfrac{d}{dx}x^n=nx^{n-1}$.`,
      'Bring down the old exponent, then lower the power by one.',
    ],
    steps: ($, f) => [String.raw`$${$.n}\cdot(${$.x})^{${$.n - 1}}=${f($.fp)}$.`],
    cases: [kase('n=3, x=2', { n: 3, x: 2 }, { fp: 12 })],
  }),

  problem({
    id: 'u2.product',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.3',
    title: 'Product rule',
    kind: 'numeric',
    level: 2,
    topics: ['derivatives'],
    vars: { c: range(2, 6, 1), d: range(1, 5, 1), x: range(1, 3, 1) },
    derive: ($) => ({ fp: productRule($.c, $.d, $.x) }),
    second: ($) => ({ fp: productExpanded($.c, $.d, $.x) }),
    text: (T) => String.raw`Let $f(x)=x^2(${T.c}x+${T.d})$. Find $f'(${T.x})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`$(uv)'=u'v+uv'$. Take $u=x^2$ and $v$ the linear factor.`,
      'Add the two products, then substitute the given $x$.',
    ],
    steps: ($, f) => [
      String.raw`Product rule: $2x(${$.c}x+${$.d})+x^2\cdot${$.c}$ at $x=${$.x}$ is $${f($.fp)}$.`,
      'Expanding first, then differentiating, gives the same value.',
    ],
    cases: [kase('c=2, d=1, x=2', { c: 2, d: 1, x: 2 }, { fp: 28 })],
  }),

  problem({
    id: 'u2.quotient',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.3',
    title: 'Quotient rule',
    kind: 'numeric',
    level: 2,
    topics: ['derivatives'],
    vars: { k: range(1, 5, 1), x: range(1, 10, 1) },
    derive: ($) => ({ fp: quotientRule($.k, $.x) }),
    second: ($) => ({ fp: quotientQuotient($.k, $.x) }),
    text: (T) => String.raw`Let $f(x)=\dfrac{x^2}{x+${T.k}}$. Find $f'(${T.x})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`$(u/v)'=(u'v-uv')/v^2$.`,
      'The top is $2x(x+k)-x^2$. Divide by the square of the denominator.',
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{2x(x+${$.k})-x^2}{(x+${$.k})^2}$ at $x=${$.x}$ is $${f($.fp)}$.`,
    ],
    cases: [kase('k=1, x=2', { k: 1, x: 2 }, { fp: 8 / 9 })],
  }),

  problem({
    id: 'u2.chain',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.6',
    title: 'Chain rule',
    kind: 'numeric',
    level: 2,
    topics: ['derivatives'],
    vars: { a: range(1, 5, 1), b: range(1, 4, 1), x: range(0, 2, 1) },
    derive: ($) => ({ fp: chainRule($.a, $.b, $.x) }),
    second: ($) => ({ fp: chainExpanded($.a, $.b, $.x) }),
    text: (T) => String.raw`Let $f(x)=(${coef(T.a)}x+${T.b})^3$. Find $f'(${T.x})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`Outer derivative $3u^2$, times the inner derivative.`,
      'The inner derivative is the coefficient of $x$. Multiply, then substitute.',
    ],
    steps: ($, f) => [
      String.raw`$3(${$.a}\cdot${$.x}+${$.b})^2\cdot${$.a}=${f($.fp)}$.`,
      'Expanding the cube and differentiating term by term agrees.',
    ],
    cases: [kase('a=2, b=1, x=1', { a: 2, b: 1, x: 1 }, { fp: 54 })],
  }),

  problem({
    id: 'u2.implicit',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.8',
    title: 'Implicit differentiation',
    kind: 'numeric',
    level: 2,
    topics: ['derivatives'],
    vars: { r: range(6, 15, 1), x: range(1, 5, 1) },
    derive: ($) => {
      const y = Math.sqrt($.r * $.r - $.x * $.x);
      return { y, slope: circleSlope($.x, y) };
    },
    second: ($) => ({ slope: circleSlopeSolved($.r, $.x) }),
    text: (T, $, f) =>
      String.raw`The curve $x^2+y^2=${$.r * $.r}$ passes through $(${T.x},${f($.y)})$ in the first quadrant. Find $dy/dx$ there.`,
    parts: [num('slope', ($) => $.slope, '', { label: '$dy/dx$' })],
    hints: [
      String.raw`Differentiate both sides: $2x+2y\,y'=0$.`,
      'Solve for $y\'$. It is $-x/y$.',
    ],
    steps: ($, f) => [
      String.raw`$y'=-x/y=-${$.x}/${f($.y)}=${f($.slope)}$.`,
      'Solving for $y$ and differentiating that formula agrees.',
    ],
    cases: [kase('(3, 4)', { r: 5, x: 3 }, { slope: -0.75 })],
  }),

  problem({
    id: 'u2.rates',
    exam: 'u2',
    ch: '4',
    lab: 'rates',
    src: 'OpenStax Calc 1 §4.1',
    title: 'A sliding ladder',
    kind: 'numeric',
    level: 2,
    topics: ['related rates'],
    vars: { x: range(2, 8, 1), v: range(0.5, 4, 0.5) },
    derive: ($) => {
      const { y, dy } = ladderVelocity(10, $.x, $.v);
      return { y, dy };
    },
    second: ($) => {
      const y = Math.sqrt(100 - $.x * $.x);
      const dt = 1e-4;
      const y2 = Math.sqrt(100 - ($.x + $.v * dt) * ($.x + $.v * dt));
      return { y, dy: (y2 - y) / dt };
    },
    text: (T) =>
      String.raw`A ladder $10$ feet long leans on a wall. The base slides out at $${T.v}$ feet per second. When the base is $${T.x}$ feet from the wall, give the height of the top in feet, and its vertical velocity in feet per second. Up is positive.`,
    parts: [
      num('y', ($) => $.y, 'ft', { label: 'height', abs: 1e-3 }),
      num('dy', ($) => $.dy, 'ft/s', { label: 'vertical velocity', abs: 1e-3 }),
    ],
    hints: [
      "$x^2+y^2=100$. Differentiate in time: $2x x'+2y y'=0$.",
      'Solve for $y\'$. The height is the positive square root.',
    ],
    steps: ($, f) => [
      String.raw`The top is $${f($.y)}$ feet up.`,
      String.raw`$y'=-x x'/y=${f($.dy)}$. Negative means the top is moving down.`,
    ],
    sim: {
      scenario: 'mid',
      setup(slice, $) {
        slice.L = 10;
        slice.x = $.x;
        slice.v = $.v;
        return domain(slice, { xMin: -1, xMax: 12, yMin: -2, yMax: 11, plane: 'xy' });
      },
      read: (c) => ({ y: c.y, dy: c.dy }),
    },
    cases: [kase('base 6 ft, 2 ft/s', { x: 6, v: 2 }, { y: 8, dy: -1.5 })],
  }),

  problem({
    id: 'u2.sine',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.5',
    title: 'Derivative of sine',
    kind: 'numeric',
    level: 1,
    topics: ['derivatives'],
    vars: { k: range(1, 10, 1), x: range(0, 4, 1) },
    derive: ($) => ({ fp: sineRule($.k, $.x) }),
    second: ($) => ({ fp: sineQuotient($.k, $.x) }),
    text: (T) => String.raw`Find the derivative of $f(x)=\sin(${coef(T.k)}x)$ at $x=${T.x}$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      String.raw`$\dfrac{d}{dx}\sin(kx)=k\cos(kx)$.`,
      'The chain rule multiplies by the coefficient inside the sine. Then substitute $x$.',
    ],
    steps: ($, f) => [String.raw`$${$.k}\cos(${$.k}\cdot${$.x})=${f($.fp)}$.`],
    cases: [kase('k=2, x=0', { k: 2, x: 0 }, { fp: 2 })],
  }),

  problem({
    id: 'u2.sym.power',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.3',
    title: 'Power rule as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['derivatives', 'symbolic'],
    vars: { a: range(1, 10, 1), n: range(2, 6, 1) },
    derive: ($) => ({ x: 2, fp: $.a * $.n * 2 ** ($.n - 1) }),
    second: ($) => ({
      formula: xPow($.a * $.n, 1, $.n - 1),
      fp: df1((t) => $.a * t ** $.n, $.x),
    }),
    text: (T) =>
      String.raw`Let $f(x)=${coef(T.a)}x^{${T.n}}$. Write $f'(x)$ as a formula in $x$, and give $f'(2)$.`,
    parts: [
      sym('formula', ($) => xPow($.a * $.n, 1, $.n - 1), ['x'], ($) => $.a * $.n * $.x ** ($.n - 1), {
        label: "$f'(x)$",
      }),
      num('fp', ($) => $.fp, '', { label: "$f'(2)$" }),
    ],
    hints: [
      String.raw`$\dfrac{d}{dx}ax^n=anx^{n-1}$.`,
      'The coefficient is $a$ times $n$. The new power is one less than $n$.',
    ],
    steps: ($, f) => [
      String.raw`$f'(x)=${xPow($.a * $.n, 1, $.n - 1)}$.`,
      String.raw`At $x=2$, $f'(2)=${f($.fp)}$.`,
    ],
    cases: [
      kase('a=1, n=2', { a: 1, n: 2 }, { formula: '2*x', fp: 4 }, {
        accept: { formula: ['2x'] },
        reject: { formula: ['x^2'] },
      }),
    ],
  }),
];
