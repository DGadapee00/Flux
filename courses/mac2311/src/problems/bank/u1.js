import { deltaFor, deltaSearch, holeLimit, holePlugged, lawAverage, lawExact, polyAt, polyAverage } from '../../math/calc1.js';
import { coef, domain, kase, num, problem, range, tf } from '../kit.js';

function paren(n) {
  return n < 0 ? `(${n})` : String(n);
}

/** Signed product already carrying its operator, or empty when the coefficient is 0. */
function signedTerm(coeff, value) {
  if (coeff > 0) return String.raw`+${coeff}\cdot${paren(value)}`;
  if (coeff < 0) return String.raw`-${-coeff}\cdot${paren(value)}`;
  return '';
}

export default [
  problem({
    id: 'u1.lim.poly',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.2',
    title: 'Limit of a polynomial',
    kind: 'numeric',
    level: 1,
    topics: ['limits'],
    vars: { a: range(-4, 5, 1), b: range(-2, 2, 1) },
    derive: ($) => ({ lim: polyAt($.a, $.b) }),
    second: ($) => ({ lim: polyAverage($.a, $.b) }),
    text: (T, $) => {
      const n = Number($.b);
      const term = n === 0 ? '' : n > 0 ? `+${coef(n)}x` : `-${coef(-n)}x`;
      const at = $.a < 0 ? String.raw`(${$.a})` : String($.a);
      return String.raw`Find $\lim_{x\to ${at}}(x^2${term})$.`;
    },
    parts: [num('lim', ($) => $.lim, '', { label: 'limit' })],
    hints: [
      'A polynomial is continuous everywhere. Its limit at a point is its value there.',
      (T, $) => String.raw`Substitute $x=${$.a}$ into each term.`,
      (T, $) => String.raw`The square term gives $${$.a * $.a}$. Add the value of the linear term.`,
    ],
    steps: ($, f) => [
      String.raw`Plug in: $(${paren($.a)})^2${signedTerm($.b, $.a)}=${f($.lim)}$.`,
      'The values just left and right of that point average to the same number.',
    ],
    cases: [kase('a=2, b=3', { a: 2, b: 3 }, { lim: 10 })],
  }),

  problem({
    id: 'u1.lim.hole',
    exam: 'u1',
    ch: '2',
    lab: 'limits',
    src: 'OpenStax Calc 1 §2.3',
    title: 'A removable hole',
    kind: 'numeric',
    level: 2,
    topics: ['limits'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ aa: $.a * $.a, lim: holeLimit($.a) }),
    second: ($) => ({ lim: holePlugged($.a) }),
    text: (T, $) =>
      String.raw`Let $f(x)=\dfrac{x^2-${$.a * $.a}}{x-${T.a}}$ for $x\neq ${T.a}$. Find $\lim_{x\to ${T.a}}f(x)$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit' })],
    hints: [
      'Substitution gives $0/0$. That form says nothing yet, so simplify first.',
      (T, $) => String.raw`Factor the top: $x^2-${$.a * $.a}=(x-${$.a})(x+${$.a})$.`,
      (T, $) => String.raw`For $x\neq ${$.a}$ the quotient is $x+${$.a}$. That line has no hole, so substitute.`,
    ],
    steps: ($, f) => [
      String.raw`For $x\neq ${$.a}$, $f(x)=x+${$.a}$.`,
      String.raw`The limit is $${f($.lim)}$. The function itself is not defined at that point.`,
    ],
    sim: {
      scenario: 'hole',
      setup(slice, $) {
        slice.kind = 'hole';
        slice.a = $.a;
        slice.h = 0.35;
        return domain(slice, { xMin: $.a - 2.4, xMax: $.a + 2.4, yMin: -1, yMax: Math.abs(2 * $.a) + 2, plane: 'xy' });
      },
      read: (c) => ({ lim: c.limit }),
    },
    cases: [kase('a=1', { a: 1 }, { lim: 2 })],
  }),

  problem({
    id: 'u1.lim.oneside',
    exam: 'u1',
    ch: '2',
    lab: 'limits',
    src: 'OpenStax Calc 1 §2.2',
    title: 'One-sided limits disagree',
    kind: 'conceptual',
    level: 1,
    topics: ['limits'],
    vars: { c: range(-24, 25, 1) },
    derive: () => ({}),
    second: ($) => {
      const h = 1e-8;
      const f = (x) => Math.abs(x - $.c) / (x - $.c);
      return { exists: Math.abs(f($.c - h) - f($.c + h)) < 1e-6 ? 1 : 0 };
    },
    text: (T, $) => String.raw`True or false: $\lim_{x\to ${$.c}}\dfrac{|x-${paren($.c)}|}{x-${paren($.c)}}$ exists.`,
    parts: [tf('exists', false, { label: 'the limit exists' })],
    hints: [
      'A two-sided limit exists only when both one-sided limits exist and agree.',
      (T, $) => String.raw`For $x>${$.c}$ the top equals the bottom. For $x<${$.c}$ the top is minus the bottom.`,
      'Read off each one-sided limit, then compare them.',
    ],
    steps: ($, f) => {
      void f;
      return ['The two sides disagree, so the two-sided limit does not exist.'];
    },
    sim: {
      scenario: 'sign',
      setup(slice, $) {
        slice.kind = 'sign';
        slice.a = $.c;
        slice.h = 0.3;
        return domain(slice, { xMin: $.c - 2.4, xMax: $.c + 2.4, yMin: -2, yMax: 2, plane: 'xy' });
      },
      read: (c) => ({ exists: c.exists ? 1 : 0 }),
    },
    cases: [kase('at 0', { c: 0 }, { exists: 0 })],
  }),

  problem({
    id: 'u1.lim.cont',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.4',
    title: 'A hole is not continuous',
    kind: 'conceptual',
    level: 1,
    topics: ['continuity'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ aa: $.a * $.a }),
    second: ($) => {
      const value = ($.a * $.a - $.aa) / ($.a - $.a);
      return { cont: Number.isFinite(value) ? 1 : 0 };
    },
    text: (T, $) =>
      String.raw`Let $f(x)=\dfrac{x^2-${$.a * $.a}}{x-${T.a}}$ for $x\neq ${T.a}$, and do not give $f$ a value at $x=${T.a}$. True or false: $f$ is continuous at $x=${T.a}$.`,
    parts: [tf('cont', false, { label: 'continuous' })],
    hints: [
      'Continuity at a point needs three things: a value there, a limit there, and the two equal.',
      (T, $) => String.raw`Check the first condition at $x=${$.a}$ before computing anything.`,
    ],
    steps: ($, f) => [
      String.raw`The limit is $${f(holeLimit($.a))}$.`,
      'There is no function value there, so $f$ is not continuous at that point.',
    ],
    cases: [kase('a=2', { a: 2 }, { cont: 0 })],
  }),

  problem({
    id: 'u1.lim.laws',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.3',
    title: 'A limit law',
    kind: 'numeric',
    level: 1,
    topics: ['limits'],
    vars: { c: range(1, 10, 1), a: range(-2, 2, 1) },
    derive: ($) => ({ lim: lawExact($.c, $.a) }),
    second: ($) => ({ lim: lawAverage($.c, $.a) }),
    text: (T) => String.raw`Find $\lim_{x\to ${T.a}}\left(${coef(T.c)}x^2+3x\right)$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit' })],
    hints: [
      'The limit of a sum is the sum of the limits. A constant factor comes outside.',
      (T, $) => String.raw`Find the limit of $${coef($.c)}x^2$ and of $3x$ separately, as $x\to ${$.a}$.`,
      'Each term is continuous, so its limit is its value. Add the two values.',
    ],
    steps: ($, f) => [
      String.raw`$${$.c}\cdot(${paren($.a)})^2+3\cdot${paren($.a)}=${f($.lim)}$.`,
      'Sampling the function on both sides of the point agrees.',
    ],
    cases: [kase('c=2, a=2', { c: 2, a: 2 }, { lim: 14 })],
  }),

  problem({
    id: 'u1.lim.eps',
    exam: 'u1',
    ch: '2',
    lab: 'limits',
    src: 'OpenStax Calc 1 §2.5',
    title: 'A delta for a line',
    kind: 'numeric',
    level: 2,
    topics: ['epsilon-delta'],
    vars: { m: range(1, 10, 1), k: range(1, 5, 1) },
    derive: ($) => {
      const eps = $.k / 10;
      return { eps, delta: deltaFor($.m, eps) };
    },
    second: ($) => ({ delta: deltaSearch($.m, $.eps) }),
    text: (T, $, f) =>
      String.raw`Let $f(x)=${coef(T.m)}x$. For $\varepsilon=${f($.eps)}$, the largest $\delta$ with $|x-0|<\delta$ implying $|f(x)|<\varepsilon$ is`,
    parts: [num('delta', ($) => $.delta, '', { label: '$\\delta$', abs: 1e-4 })],
    hints: [
      String.raw`Start from the goal $|f(x)|<\varepsilon$. Rewrite it as a condition on $|x|$.`,
      (T, $, f) => String.raw`The goal is $${coef($.m)}|x|<${f($.eps)}$.`,
      String.raw`Divide by the slope. That bound on $|x|$ is the largest $\delta$ that works.`,
    ],
    steps: ($, f) => [
      String.raw`$|${$.m}x|<${f($.eps)}$ when $|x|<${f($.delta)}$.`,
      'A bisection that keeps the inequality strict lands on the same $\\delta$.',
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'line';
        slice.m = $.m;
        slice.a = 0;
        slice.eps = $.eps;
        slice.h = 0.05;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2, plane: 'xy' });
      },
      read: (c) => ({ delta: c.delta }),
    },
    cases: [kase('m=2, ε=0.1', { m: 2, k: 1 }, { delta: 0.05 })],
  }),

  problem({
    id: 'u1.lim.squeeze',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.3',
    title: 'A squeezed limit',
    kind: 'numeric',
    level: 2,
    topics: ['limits'],
    vars: { m: range(1, 50, 1) },
    derive: () => ({ lim: 0 }),
    second: ($) => {
      let ok = true;
      for (let i = 1; i <= 40; i++) {
        const x = i / 200;
        const f = Math.abs($.m * x * x * Math.sin(1 / x));
        if (f > $.m * x * x + 1e-9) ok = false;
      }
      return { lim: ok ? 0 : NaN };
    },
    text: (T) => String.raw`Define $f(0)=0$ and $f(x)=${coef(T.m)}x^2\sin(1/x)$ otherwise. Find $\lim_{x\to 0}f(x)$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 1e-6 })],
    hints: [
      String.raw`The sine factor stays in $[-1,1]$, whatever $1/x$ does.`,
      (T, $) => String.raw`So $-${coef($.m)}x^2\le f(x)\le ${coef($.m)}x^2$ for $x\neq 0$.`,
      'Find the limit of each bound at $0$. The squeeze theorem does the rest.',
    ],
    steps: ($, f) => {
      void f;
      return [
        String.raw`$-${$.m}x^2\le f(x)\le ${$.m}x^2$ for $x\neq 0$.`,
        'Both bounds have limit $0$, so $f$ does too.',
      ];
    },
    cases: [kase('m=1', { m: 1 }, { lim: 0 })],
  }),

  problem({
    id: 'u1.lim.abs',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.4',
    title: 'Continuous, not differentiable',
    kind: 'conceptual',
    level: 1,
    topics: ['continuity', 'derivatives'],
    vars: { c: range(-24, 25, 1) },
    derive: () => ({}),
    second: ($) => {
      const h = 1e-6;
      const f = (x) => Math.abs(x - $.c);
      const cont = Math.abs(f($.c + h) - f($.c)) < 1e-5 && Math.abs(f($.c - h) - f($.c)) < 1e-5;
      const left = (f($.c) - f($.c - h)) / h;
      const right = (f($.c + h) - f($.c)) / h;
      return { cont: cont ? 1 : 0, diff: Math.abs(left - right) < 1e-6 ? 1 : 0 };
    },
    text: (T, $) => String.raw`For $f(x)=|x-${paren($.c)}|$ at $x=${$.c}$, mark each statement.`,
    parts: [
      tf('cont', true, { label: 'continuous at the corner' }),
      tf('diff', false, { label: 'differentiable at the corner' }),
    ],
    hints: [
      'Continuity compares the value with the limit. Differentiability compares the two one-sided slopes.',
      (T, $) => String.raw`Right of $x=${$.c}$ the graph is a line of slope $1$. Left of it, the slope is $-1$.`,
      (T, $) => String.raw`Both pieces have height $0$ at $x=${$.c}$.`,
    ],
    steps: () => [
      'The two sides of the absolute value meet, so it is continuous there.',
      'The corner means the two one-sided derivatives disagree.',
    ],
    cases: [kase('at 0', { c: 0 }, { cont: 1, diff: 0 })],
  }),

  problem({
    id: 'u1.lim.line',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 1 §2.3',
    title: 'Limit of a line',
    kind: 'numeric',
    level: 1,
    topics: ['limits'],
    vars: { m: range(2, 5, 1), b: range(-2, 3, 1), a: range(-2, 3, 1) },
    derive: ($) => ({ lim: $.m * $.a + $.b }),
    second: ($) => {
      const f = (x) => $.m * x + $.b;
      const h = 1e-6;
      return { lim: 0.5 * (f($.a + h) + f($.a - h)) };
    },
    text: (T) => {
      const slope = T.b < 0 ? String.raw`${coef(T.m)}x-${-T.b}` : T.b > 0 ? String.raw`${coef(T.m)}x+${T.b}` : String.raw`${coef(T.m)}x`;
      return String.raw`Find $\lim_{x\to ${T.a}}(${slope})$.`;
    },
    parts: [num('lim', ($) => $.lim, '', { label: 'limit' })],
    hints: [
      'A line is continuous, so its limit at a point is its value there.',
      (T, $) => String.raw`Multiply the slope $${$.m}$ by $${paren($.a)}$.`,
      'Then add the constant term.',
    ],
    steps: ($, f) => [
      String.raw`$${$.m}\cdot${paren($.a)}${$.b < 0 ? String.raw`-${-$.b}` : $.b > 0 ? `+${$.b}` : ''}=${f($.lim)}$.`,
      'The same value shows up just left and just right of the point.',
    ],
    cases: [kase('m=2, b=-1, a=3', { m: 2, b: -1, a: 3 }, { lim: 5 })],
  }),

  problem({
    id: 'u1.lim.jump',
    exam: 'u1',
    ch: '2',
    lab: 'limits',
    src: 'OpenStax Calc 1 §2.2',
    title: 'A jump',
    kind: 'numeric',
    level: 2,
    topics: ['limits'],
    vars: { a: range(-4, 5, 1), k: range(1, 5, 1), c: range(6, 10, 1) },
    derive: ($) => ({ left: $.k, right: $.c }),
    second: ($) => {
      const f = (x) => (x < $.a ? $.k : $.c);
      const h = 1e-6;
      return { left: f($.a - h), right: f($.a + h) };
    },
    text: (T, $) =>
      String.raw`Let $f(x)=${$.k}$ when $x<${$.a}$, and $f(x)=${$.c}$ when $x\ge ${$.a}$. Find the one-sided limits at $x=${$.a}$.`,
    parts: [
      num('left', ($) => $.left, '', { label: 'left-hand limit' }),
      num('right', ($) => $.right, '', { label: 'right-hand limit' }),
    ],
    hints: [
      'A one-sided limit uses only the inputs on that side of the point.',
      (T, $) => String.raw`Just below $x=${$.a}$, use the rule for $x<${$.a}$. Just above, use the other rule.`,
      'Each rule is a constant. Do not average the two heights.',
    ],
    steps: ($, f) => [
      String.raw`From the left, $f$ is the constant $${$.k}$, so the limit is $${f($.left)}$.`,
      String.raw`From the right, $f$ is the constant $${$.c}$, so the limit is $${f($.right)}$.`,
    ],
    sim: {
      scenario: 'jump',
      setup(slice, $) {
        slice.kind = 'jump';
        slice.a = $.a;
        slice.leftValue = $.k;
        slice.rightValue = $.c;
        slice.h = 0.3;
        return domain(slice, { xMin: $.a - 2.4, xMax: $.a + 2.4, yMin: -1, yMax: Math.max($.k, $.c) + 1, plane: 'xy' });
      },
      read: (c) => ({ left: c.left, right: c.right }),
    },
    cases: [kase('a=1, k=2, c=4', { a: 1, k: 2, c: 4 }, { left: 2, right: 4 })],
  }),
];
