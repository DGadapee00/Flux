import { coef, problem, range, num, tf, kase, domain, choice } from '../kit.js';
import { riemann1d } from '../../math/riemann.js';
import { graphById } from '../../math/graphs1.js';

const plane = { xMin: -2, xMax: 2, yMin: -1, yMax: 4, plane: 'xy' };
const semi = graphById('semi');

export default [
  problem({
    id: 'ch1.limits.quad',
    exam: 'ch1',
    ch: '1',
    lab: 'limits',
    src: 'Merino §1.3 type',
    title: 'A derivative from the definition',
    kind: 'numeric',
    level: 1,
    topics: ['limits'],
    vars: { x0: range(-2, 2, 0.08) },
    derive: ($) => ({ fp: 2 * $.x0 }),
    text: (T) => `Let $f(x)=x^2$. Find $f'(${T.x0})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: [
      "$f'(x)=2x$.",
      'Multiply the x-coordinate of the point by 2.',
    ],
    steps: ($, f) => [`$f'(${$.x0})=${f($.fp)}$.`],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.x0 = $.x0;
        slice.a = -2;
        slice.b = 2;
        return domain(slice, plane);
      },
      read: (c) => ({ fp: c.fp }),
    },
    cases: [kase('sample', { x0: 1 }, { fp: 2 })],
  }),

  problem({
    id: 'ch1.limits.hole',
    exam: 'ch1',
    ch: '1',
    lab: 'limits',
    src: 'Merino §1.2 type',
    title: 'A removable hole',
    kind: 'numeric',
    level: 2,
    topics: ['limits'],
    vars: { x0: range(-0.4, 2.4, 0.05) },
    derive: ($) => ({ lim: $.x0 + 1 }),
    text: (T) =>
      `Let $f(x)=\\dfrac{x^2-1}{x-1}$ for $x\\neq 1$. Find $\\lim_{x\\to ${T.x0}}f(x)$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 0.05 })],
    hints: [
      'Factor: $x^2-1=(x-1)(x+1)$. Cancel for $x\\neq 1$.',
      'The cancelled factor leaves $x+1$. Substitute the point the limit approaches.',
    ],
    steps: ($, f) => [`The limit is $${f($.lim)}$. At $x=1$ the original formula is not defined.`],
    sim: {
      scenario: 'hole',
      setup(slice, $) {
        slice.graphId = 'hole';
        slice.x0 = $.x0;
        slice.a = -0.5;
        slice.b = 2.5;
        return domain(slice, { xMin: -0.8, xMax: 2.8, yMin: -0.2, yMax: 3.6, plane: 'xy' });
      },
      read: (c) => ({ lim: c.lim }),
    },
    cases: [kase('the hole', { x0: 1 }, { lim: 2 })],
  }),

  problem({
    id: 'ch1.limits.abs',
    exam: 'ch1',
    ch: '1',
    lab: 'limits',
    src: 'Merino §1.2 type',
    title: 'Continuous, not differentiable',
    kind: 'conceptual',
    level: 1,
    topics: ['limits'],
    vars: { c: range(-24, 25, 1) },
    text: (T) => `True or false: $f(x)=|x-${T.c}|$ is differentiable at $x=${T.c}$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: [
      'Left and right difference quotients go to $-1$ and $+1$. Continuity is weaker.',
      'Shift the corner to $c$. The two one-sided slopes are still $-1$ and $1$.',
    ],
    steps: () => ['False. The function is continuous at the corner, and the one-sided slopes disagree.'],
    cases: [kase('the origin', { c: 0 }, { tf: 0 })],
  }),

  problem({
    id: 'ch1.limits.cube',
    exam: 'ch1',
    ch: '1',
    lab: 'limits',
    src: 'Merino §1.3 type',
    title: 'Necessary, not sufficient',
    kind: 'conceptual',
    level: 1,
    topics: ['limits'],
    vars: { m: range(1, 50, 1) },
    text: (T) =>
      `True or false: if $f'(c)=0$, then $f$ has a local min or max at $c$. The counterexample family is $f(x)=${coef(T.m)}x^3$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: [
      "$f(x)=mx^3$ has $f'(0)=0$ and is strictly increasing when $m>0$.",
      'A zero derivative is required for an interior extremum. This family shows it is not enough.',
    ],
    steps: () => ['False. $f\'=0$ is necessary for an interior extremum, not sufficient.'],
    cases: [kase('m=1', { m: 1 }, { tf: 0 })],
  }),

  problem({
    id: 'ch1.limits.squeeze',
    exam: 'ch1',
    ch: '1',
    lab: 'limits',
    src: 'Merino §1.2 type',
    title: 'A squeeze at the origin',
    kind: 'numeric',
    level: 2,
    topics: ['limits'],
    vars: { m: range(1, 50, 1) },
    derive: () => ({ f0: 0, fp: 0 }),
    text: (T) =>
      `Define $f(0)=0$ and $f(x)=x^2\\sin(1/x)$ for $x\\neq 0$. The bound $|f(x)|\\le ${coef(T.m)}x^2$ holds. Find $f(0)$ and $f'(0)$.`,
    parts: [
      num('f0', ($) => $.f0, '', { label: '$f(0)$', abs: 0.02 }),
      num('fp', ($) => $.fp, '', { label: "$f'(0)$", abs: 0.05 }),
    ],
    hints: [
      'Squeeze: $|f(x)|\\le x^2$, and $x^2$ is at most $m x^2$ for this $m$.',
      'The difference quotient is $x\\sin(1/x)$, which is squeezed to $0$ with $x$.',
    ],
    steps: () => ['$f(0)=0$ and $f\'(0)=0$.'],
    sim: {
      scenario: 'squeeze',
      setup(slice) {
        slice.graphId = 'squeeze';
        slice.x0 = 0;
        slice.a = -1;
        slice.b = 1;
        return domain(slice, { xMin: -1.3, xMax: 1.3, yMin: -1.2, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ f0: c.f0, fp: c.fp }),
    },
    cases: [kase('m=1', { m: 1 }, { f0: 0, fp: 0 })],
  }),

  problem({
    id: 'ch1.riemann.ftc',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'FTC on a power',
    kind: 'numeric',
    level: 1,
    topics: ['riemann1'],
    vars: { b: range(0.5, 2, 0.03) },
    derive: ($) => ({ I: $.b ** 3 / 3 }),
    text: (T) => `Let $f(x)=x^2$ on $[0,${T.b}]$. Find $\\int_0^{${T.b}} f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\int$', abs: 0.02 })],
    hints: [
      'The antiderivative of $x^2$ is $x^3/3$.',
      'Subtract the value at $0$ from the value at the right end.',
    ],
    steps: ($, f) => [`$F(b)-F(0)=${f($.I)}$.`],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = $.b;
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, { xMin: -0.1, xMax: $.b + 0.15, yMin: -0.1, yMax: $.b * $.b + 0.3, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('unit interval', { b: 1 }, { I: 1 / 3 })],
  }),

  problem({
    id: 'ch1.riemann.mid',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'A Riemann sum for $x^2$',
    kind: 'numeric',
    level: 2,
    topics: ['riemann1'],
    vars: {
      n: range(2, 24, 1),
      sample: choice(['left', 'left'], ['mid', 'midpoint'], ['right', 'right']),
    },
    derive: ($) => ({ sum: riemann1d((x) => x * x, 0, 1, { n: $.n, sample: $.sample }).sum }),
    text: (T) =>
      `Let $f(x)=x^2$ on $[0,1]$. Compute the ${T.sample} Riemann sum with $n=${T.n}$.`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 0.01 })],
    hints: [
      'Each panel has width $1/n$. A midpoint sample sits at the centre of its panel.',
      'Multiply each sample height by the panel width, then add the panels.',
    ],
    steps: ($, f) => [`The sum is $${f($.sum)}$.`],
    sim: {
      scenario: 'quad',
      setup(slice, $) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 1;
        slice.n = $.n;
        slice.sample = $.sample;
        return domain(slice, { xMin: 0, xMax: 1, yMin: 0, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ sum: c.sum }),
    },
    cases: [kase('n=4 midpoint', { n: 4, sample: 'mid' }, { sum: 0.328125 })],
  }),

  problem({
    id: 'ch1.riemann.line',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'A linear integral',
    kind: 'numeric',
    level: 1,
    topics: ['riemann1'],
    vars: { b: range(1, 50, 1) },
    derive: ($) => ({ I: $.b * $.b + $.b }),
    text: (T) => `Let $f(x)=2x+1$ on $[0,${T.b}]$. Find $\\int_0^{${T.b}} f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\int$', abs: 0.02 })],
    hints: [
      'The antiderivative of $2x+1$ is $x^2+x$.',
      'Evaluate that antiderivative at the right end. It is $0$ at the left end.',
    ],
    steps: ($, f) => [`$F(b)-F(0)=${f($.I)}$.`],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.graphId = 'line';
        slice.a = 0;
        slice.b = $.b;
        slice.n = 6;
        slice.sample = 'mid';
        const yMax = 2 * $.b + 1 + 0.5;
        return domain(slice, { xMin: -0.2, xMax: $.b + 0.3, yMin: -0.2, yMax, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('b=2', { b: 2 }, { I: 6 })],
  }),

  problem({
    id: 'ch1.riemann.length',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.5 type',
    title: 'Length of a line segment',
    kind: 'numeric',
    level: 2,
    topics: ['riemann1'],
    vars: { b: range(1, 50, 1) },
    derive: ($) => ({ L: $.b * Math.sqrt(5) }),
    text: (T) => `Let $f(x)=2x+1$ on $[0,${T.b}]$. Find the length of the graph.`,
    parts: [num('L', ($) => $.L, '', { label: '$L$', abs: 0.04 })],
    hints: [
      "The speed is $\\sqrt{1+f'(x)^2}=\\sqrt{5}$, a constant.",
      'Multiply that speed by the length of the interval.',
    ],
    steps: ($, f) => [`The length is $${f($.L)}$.`],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.graphId = 'line';
        slice.a = 0;
        slice.b = $.b;
        slice.n = 8;
        slice.sample = 'mid';
        const yMax = 2 * $.b + 1 + 0.5;
        return domain(slice, { xMin: -0.2, xMax: $.b + 0.3, yMin: -0.2, yMax, plane: 'xy' });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('unit interval', { b: 1 }, { L: Math.sqrt(5) })],
  }),

  problem({
    id: 'ch1.riemann.semi',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.6 type',
    title: 'Area under a semicircle',
    kind: 'numeric',
    level: 2,
    topics: ['riemann1'],
    vars: { c: range(0.5, 1, 0.01) },
    derive: ($) => ({ I: semi.F($.c) - semi.F(-$.c) }),
    text: (T) => `Let $f(x)=\\sqrt{1-x^2}$ on $[-${T.c},${T.c}]$. Find $\\int_{-${T.c}}^{${T.c}} f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: 'area', abs: 0.05 })],
    hints: [
      'This is the area under the unit circle between $-c$ and $c$.',
      'The antiderivative is $\\tfrac12\\bigl(x\\sqrt{1-x^2}+\\arcsin x\\bigr)$. Evaluate the change from $-c$ to $c$.',
    ],
    steps: ($, f) => [`The area is $${f($.I)}$.`],
    sim: {
      scenario: 'semi',
      setup(slice, $) {
        slice.graphId = 'semi';
        slice.a = -$.c;
        slice.b = $.c;
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: 0, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('unit semicircle', { c: 1 }, { I: Math.PI / 2 })],
  }),

  problem({
    id: 'ch1.riemann.sample',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'Left versus right',
    kind: 'conceptual',
    level: 1,
    topics: ['riemann1'],
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `True or false: for an increasing $f$ on $[a,b]$, the left Riemann sum is strictly less than the right Riemann sum for every $n\\ge ${T.n}$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'Each left sample is smaller than the matching right sample.',
      'Every panel width is positive, so the inequality survives the sum, for every panel count at least $1$.',
    ],
    steps: () => ['True. The inequality holds for every $n\\ge 1$, so it holds from this $n$ upward.'],
    cases: [kase('n=1', { n: 1 }, { tf: 1 })],
  }),
];
