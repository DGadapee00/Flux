import { problem, range, num, tf, kase, domain } from '../kit.js';

const plane = { xMin: -2, xMax: 2, yMin: -1, yMax: 4, plane: 'xy' };

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
    vars: { x0: range(-1, 2, 1) },
    derive: ($) => ({ fp: 2 * $.x0 }),
    text: (T) => `Let $f(x)=x^2$. Find $f'(${T.x0})$.`,
    parts: [num('fp', ($) => $.fp, '', { label: "$f'$" })],
    hints: ["$f'(x)=2x$."],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ lim: 2 }),
    text: () =>
      `Let $f(x)=\\dfrac{x^2-1}{x-1}$ for $x\\neq 1$. Find $\\lim_{x\\to 1}f(x)$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 0.05 })],
    hints: ['Factor: $x^2-1=(x-1)(x+1)$. Cancel for $x\\neq 1$.'],
    steps: () => ['The limit is $2$. $f(1)$ itself is not defined.'],
    sim: {
      scenario: 'hole',
      setup(slice) {
        slice.graphId = 'hole';
        slice.x0 = 1;
        slice.a = -0.5;
        slice.b = 2.5;
        return domain(slice, { xMin: -0.8, xMax: 2.8, yMin: -0.2, yMax: 3.6, plane: 'xy' });
      },
      read: (c) => ({ lim: c.lim }),
    },
    cases: [kase('sample', { dummy: 1 }, { lim: 2 })],
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
    vars: { dummy: range(1, 1, 1) },
    text: () => `True or false: $f(x)=|x|$ is differentiable at $x=0$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: ['Left and right difference quotients go to $-1$ and $+1$. Continuity is weaker.'],
    steps: () => ['False — continuous at $0$, not differentiable there.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 0 })],
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
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $f'(c)=0$, then $f$ has a local min or max at $c$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: ['$f(x)=x^3$ has $f\'(0)=0$ and is strictly increasing.'],
    steps: () => ['False — $f\'=0$ is necessary for an interior extremum, not sufficient.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 0 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ f0: 0, fp: 0 }),
    text: () =>
      `Define $f(0)=0$ and $f(x)=x^2\\sin(1/x)$ for $x\\neq 0$. Find $f(0)$ and $f'(0)$.`,
    parts: [
      num('f0', ($) => $.f0, '', { label: '$f(0)$', abs: 0.02 }),
      num('fp', ($) => $.fp, '', { label: "$f'(0)$", abs: 0.05 }),
    ],
    hints: ['Squeeze: $|f(x)|\\le x^2$. The difference quotient is $x\\sin(1/x)\\to 0$.'],
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
    cases: [kase('sample', { dummy: 1 }, { f0: 0, fp: 0 })],
  }),

  problem({
    id: 'ch1.riemann.ftc',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'FTC on $[0,1]$',
    kind: 'numeric',
    level: 1,
    topics: ['riemann1'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 1 / 3 }),
    text: () => `Let $f(x)=x^2$ on $[0,1]$. Find $\\int_0^1 f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\int$', abs: 0.02 })],
    hints: ['$F(x)=x^3/3$, so $F(1)-F(0)=1/3$.'],
    steps: () => ['$1/3$.'],
    sim: {
      scenario: 'quad',
      setup(slice) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 1;
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, { xMin: 0, xMax: 1, yMin: 0, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 1 / 3 })],
  }),

  problem({
    id: 'ch1.riemann.mid',
    exam: 'ch1',
    ch: '1',
    lab: 'riemann1',
    src: 'Merino §1.4 type',
    title: 'A midpoint sum with $n=4$',
    kind: 'numeric',
    level: 2,
    topics: ['riemann1'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ sum: 0.328125 }),
    text: () =>
      `Let $f(x)=x^2$ on $[0,1]$. Compute the midpoint Riemann sum with $n=4$.`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 0.01 })],
    hints: ['Centres at $1/8, 3/8, 5/8, 7/8$. Each $\\Delta x=1/4$.'],
    steps: () => ['$0.328125$.'],
    sim: {
      scenario: 'quad',
      setup(slice) {
        slice.graphId = 'quad';
        slice.a = 0;
        slice.b = 1;
        slice.n = 4;
        slice.sample = 'mid';
        return domain(slice, { xMin: 0, xMax: 1, yMin: 0, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ sum: c.sum }),
    },
    cases: [kase('sample', { dummy: 1 }, { sum: 0.328125 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 6 }),
    text: () => `Let $f(x)=2x+1$ on $[0,2]$. Find $\\int_0^2 f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\int$', abs: 0.02 })],
    hints: ['$F(x)=x^2+x$, so $F(2)-F(0)=6$. Midpoint sums are exact on a line.'],
    steps: () => ['$6$.'],
    sim: {
      scenario: 'line',
      setup(slice) {
        slice.graphId = 'line';
        slice.a = 0;
        slice.b = 2;
        slice.n = 6;
        slice.sample = 'mid';
        return domain(slice, { xMin: 0, xMax: 2, yMin: 0, yMax: 5.5, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 6 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ L: Math.sqrt(5) }),
    text: () =>
      `Let $f(x)=2x+1$ on $[0,1]$. Find the length of the graph.`,
    parts: [num('L', ($) => $.L, '', { label: '$L$', abs: 0.04 })],
    hints: ["$\\sqrt{1+f'(x)^2}=\\sqrt{1+4}=\\sqrt{5}$, times the interval length $1$."],
    steps: () => ['$\\sqrt{5}$.'],
    sim: {
      scenario: 'line',
      setup(slice) {
        slice.graphId = 'line';
        slice.a = 0;
        slice.b = 1;
        slice.n = 8;
        slice.sample = 'mid';
        return domain(slice, { xMin: 0, xMax: 1, yMin: 0, yMax: 4, plane: 'xy' });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('sample', { dummy: 1 }, { L: Math.sqrt(5) })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: Math.PI / 2 }),
    text: () =>
      `Let $f(x)=\\sqrt{1-x^2}$ on $[-1,1]$. Find $\\int_{-1}^1 f(x)\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: 'area', abs: 0.05 })],
    hints: ['This is the area of the upper unit semicircle, $\\pi/2$. The unit disk has area $\\pi$.'],
    steps: () => ['$\\pi/2$.'],
    sim: {
      scenario: 'semi',
      setup(slice) {
        slice.graphId = 'semi';
        slice.a = -1;
        slice.b = 1;
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: 0, yMax: 1.2, plane: 'xy' });
      },
      read: (c) => ({ I: c.Iclosed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: Math.PI / 2 })],
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
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: for an increasing $f$ on $[a,b]$, the left Riemann sum is strictly less than the right Riemann sum (any $n\\ge 1$).`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['Each left sample is smaller than the matching right sample.'],
    steps: () => ['True.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),
];
