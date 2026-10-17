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
import { exprToTex } from '../engine.js';

const plane = { xMin: -2.4, xMax: 2.4, yMin: -0.5, yMax: 4.5, plane: 'xy' };

/** x to a power, as TeX: x for 1, x^{n} otherwise. */
const xTex = (n) => (n === 1 ? 'x' : `x^{${n}}`);

/** The same, as a formula key. */
const xKey = (n) => (n === 1 ? 'x' : `x^${n}`);

/** Coefficient times a factor in a key, dropping a coefficient of 1. */
const times = (c, rest) => (c === 1 ? rest : `${c}*${rest}`);

/** k·x inside a function, as a key. */
const kx = (k) => (k === 1 ? 'x' : `${k}*x`);

/** d/dx (ax+b)^n = n·a·(ax+b)^(n−1). */
function chainKey(a, b, n) {
  const inner = `(${kx(a)}+${b})`;
  return times(n * a, n - 1 === 1 ? inner : `${inner}^${n - 1}`);
}

/** d/dx a·sin(kx) = a·k·cos(kx). */
const sineKey = (a, k) => times(a * k, `cos(${kx(k)})`);

/** d/dx x^n·sin(kx) = n·x^(n−1)·sin(kx) + k·x^n·cos(kx). */
const productKey = (n, k) => `${times(n, `${xKey(n - 1)}*sin(${kx(k)})`)}+${times(k, `${xKey(n)}*cos(${kx(k)})`)}`;

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
      String.raw`Write the difference quotient $\dfrac{f(x_0+h)-f(x_0)}{h}$. Simplify it before letting $h\to 0$.`,
      (T) => String.raw`With $x_0=${T.x0}$, the top is $(x_0+h)^2-x_0^2=2x_0h+h^2$.`,
      String.raw`Divide by $h$, then let $h\to 0$. Only the term without $h$ survives.`,
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
      String.raw`Use the power rule: $\dfrac{d}{dx}x^n=nx^{n-1}$.`,
      (T, $) => String.raw`Here $f'(x)=${$.n}${$.n === 2 ? 'x' : `x^{${$.n - 1}}`}$.`,
      (T) => String.raw`Substitute $x=${T.x}$.`,
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
      String.raw`Use the product rule: $(uv)'=u'v+uv'$.`,
      (T, $) => String.raw`Take $u=x^2$ and $v=${$.c}x+${$.d}$. Then $u'=2x$ and $v'=${$.c}$.`,
      (T, $) => String.raw`Form $2x(${$.c}x+${$.d})+${$.c}x^2$, then substitute $x=${$.x}$.`,
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
      String.raw`Use the quotient rule: $(u/v)'=(u'v-uv')/v^2$.`,
      (T, $) => String.raw`Take $u=x^2$ and $v=x+${$.k}$. Then $u'=2x$ and $v'=1$.`,
      (T, $) => String.raw`Evaluate $\dfrac{2x(x+${$.k})-x^2}{(x+${$.k})^2}$ at $x=${$.x}$.`,
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
      'Use the chain rule: the outer derivative at the inner function, times the inner derivative.',
      (T, $) => String.raw`The outer function is $u^3$, with $u=${coef($.a)}x+${$.b}$. Its derivative is $3u^2$.`,
      (T, $) => String.raw`Multiply $3(${coef($.a)}x+${$.b})^2$ by $${$.a}$, then substitute $x=${$.x}$.`,
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
      String.raw`Differentiate both sides in $x$. Treat $y$ as a function of $x$, so $y^2$ needs the chain rule.`,
      String.raw`That gives $2x+2y\,y'=0$.`,
      (T, $, f) => String.raw`Solve for $y'$, then use $x=${$.x}$ and $y=${f($.y)}$.`,
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
      'Write one equation that relates the two lengths. Then differentiate it in time.',
      String.raw`$x^2+y^2=100$, so $2x\,x'+2y\,y'=0$.`,
      (T) => String.raw`Find $y$ from $x=${T.x}$ first. Then solve for $y'$ with $x'=${T.v}$.`,
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
      String.raw`Use the chain rule on $\sin(kx)$: the outer derivative times the inner derivative.`,
      (T, $) => String.raw`The inner function is $${coef($.k)}x$. Its derivative is $${$.k}$.`,
      (T, $) => String.raw`So $f'(x)=${coef($.k)}\cos(${coef($.k)}x)$. Substitute $x=${$.x}$, in radians.`,
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
      'Use the power rule. A constant factor stays in front.',
      (T, $) => String.raw`The exponent $${$.n}$ comes down and multiplies the coefficient $${$.a}$.`,
      (T, $) => String.raw`The new exponent is $${$.n - 1}$. For the number, substitute $x=2$.`,
    ],
    steps: ($, f) => [
      String.raw`$f'(x)=${exprToTex(xPow($.a * $.n, 1, $.n - 1), ['x'])}$.`,
      String.raw`At $x=2$, $f'(2)=${f($.fp)}$.`,
    ],
    cases: [
      kase('a=1, n=2', { a: 1, n: 2 }, { formula: '2*x', fp: 4 }, {
        accept: { formula: ['2x'] },
        reject: { formula: ['x^2'] },
      }),
    ],
  }),
  problem({
    id: 'u2.sym.chain',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.6',
    title: 'Chain rule as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['derivatives', 'symbolic'],
    vars: { a: range(1, 5, 1), b: range(1, 5, 1), n: range(2, 5, 1) },
    derive: ($) => ({ x: 1, fp: $.n * $.a * ($.a + $.b) ** ($.n - 1) }),
    second: ($) => ({
      formula: chainKey($.a, $.b, $.n),
      fp: df1((t) => ($.a * t + $.b) ** $.n, 1),
    }),
    text: (T) => String.raw`Let $f(x)=(${coef(T.a)}x+${T.b})^{${T.n}}$. Write $f'(x)$ as a formula in $x$, and give $f'(1)$.`,
    parts: [
      sym('formula', ($) => chainKey($.a, $.b, $.n), ['x'], ($) => $.n * $.a * ($.a * $.x + $.b) ** ($.n - 1), {
        label: "$f'(x)$",
      }),
      num('fp', ($) => $.fp, '', { label: "$f'(1)$" }),
    ],
    hints: [
      'Use the chain rule: the outer derivative at the inner function, times the inner derivative.',
      (T, $) => String.raw`The outer function is $u^{${$.n}}$, with $u=${coef($.a)}x+${$.b}$. Its derivative is $${$.n}${$.n === 2 ? 'u' : `u^{${$.n - 1}}`}$.`,
      (T, $) => String.raw`Multiply by the inner derivative, $${$.a}$. For the number, substitute $x=1$.`,
    ],
    steps: ($, f) => [
      String.raw`$f'(x)=${exprToTex(chainKey($.a, $.b, $.n), ['x'])}$.`,
      String.raw`At $x=1$, $f'(1)=${f($.fp)}$.`,
    ],
    cases: [
      kase('a=2, b=1, n=3', { a: 2, b: 1, n: 3 }, { formula: '6*(2*x+1)^2', fp: 54 }, {
        accept: { formula: ['24*x^2+24*x+6'] },
        reject: { formula: ['3*(2*x+1)^2'] },
      }),
    ],
  }),

  problem({
    id: 'u2.sym.trig',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.5',
    title: 'Derivative of a sine, as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['derivatives', 'symbolic'],
    vars: { a: range(1, 9, 1), k: range(1, 9, 1) },
    derive: ($) => ({ x: 1, fp: $.a * $.k * Math.cos($.k) }),
    second: ($) => ({
      formula: sineKey($.a, $.k),
      fp: df1((t) => $.a * Math.sin($.k * t), 1),
    }),
    text: (T) => String.raw`Let $f(x)=${coef(T.a)}\sin(${coef(T.k)}x)$. Write $f'(x)$ as a formula in $x$, and give $f'(1)$.`,
    parts: [
      sym('formula', ($) => sineKey($.a, $.k), ['x'], ($) => $.a * $.k * Math.cos($.k * $.x), {
        label: "$f'(x)$",
      }),
      num('fp', ($) => $.fp, '', { label: "$f'(1)$", abs: 1e-6 }),
    ],
    hints: [
      'Differentiate the sine, then apply the chain rule to what is inside it.',
      String.raw`$\dfrac{d}{dx}\sin u=\cos u\cdot u'$.`,
      (T, $) => String.raw`Here $u=${coef($.k)}x$, so $u'=${$.k}$.${$.a === 1 ? '' : ` The factor $${$.a}$ stays in front.`} For the number, substitute $x=1$, in radians.`,
    ],
    steps: ($, f) => [
      String.raw`$f'(x)=${exprToTex(sineKey($.a, $.k), ['x'])}$.`,
      String.raw`At $x=1$, $f'(1)=${f($.fp)}$.`,
    ],
    cases: [
      kase('a=3, k=2', { a: 3, k: 2 }, { formula: '6*cos(2*x)', fp: 6 * Math.cos(2) }, {
        accept: { formula: ['6cos(2x)'] },
        reject: { formula: ['3*cos(2*x)'] },
      }),
    ],
  }),

  problem({
    id: 'u2.sym.product',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 1 §3.3',
    title: 'Product rule as a formula',
    kind: 'derivation',
    level: 3,
    topics: ['derivatives', 'symbolic'],
    vars: { n: range(2, 6, 1), k: range(1, 10, 1) },
    derive: ($) => ({ x: 1, fp: $.n * Math.sin($.k) + $.k * Math.cos($.k) }),
    second: ($) => ({
      formula: productKey($.n, $.k),
      fp: df1((t) => t ** $.n * Math.sin($.k * t), 1),
    }),
    text: (T, $) => String.raw`Let $f(x)=${xTex($.n)}\sin(${coef(T.k)}x)$. Write $f'(x)$ as a formula in $x$, and give $f'(1)$.`,
    parts: [
      sym('formula', ($) => productKey($.n, $.k), ['x'], ($) => $.n * $.x ** ($.n - 1) * Math.sin($.k * $.x) + $.k * $.x ** $.n * Math.cos($.k * $.x), {
        label: "$f'(x)$",
      }),
      num('fp', ($) => $.fp, '', { label: "$f'(1)$", abs: 1e-6 }),
    ],
    hints: [
      'The function is a product. Use the product rule, then the chain rule inside the sine.',
      (T, $) => String.raw`Take $u=${xTex($.n)}$ and $v=\sin(${coef($.k)}x)$.`,
      (T, $) => String.raw`Then $u'=${$.n}${xTex($.n - 1)}$ and $v'=${coef($.k)}\cos(${coef($.k)}x)$. Form $u'v+uv'$, then substitute $x=1$.`,
    ],
    steps: ($, f) => [
      String.raw`$f'(x)=${exprToTex(productKey($.n, $.k), ['x'])}$.`,
      String.raw`At $x=1$, $f'(1)=${f($.fp)}$.`,
    ],
    cases: [
      kase('n=2, k=1', { n: 2, k: 1 }, { formula: '2*x*sin(x)+x^2*cos(x)', fp: 2 * Math.sin(1) + Math.cos(1) }, {
        accept: { formula: ['x^2*cos(x)+2x*sin(x)'] },
        reject: { formula: ['2*x*cos(x)'] },
      }),
    ],
  }),
];
