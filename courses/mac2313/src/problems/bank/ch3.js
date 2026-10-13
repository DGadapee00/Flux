import { problem, range, num, mc, tf, kase, domain } from '../kit.js';

const sq = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

export default [
  problem({
    id: 'ch3.riemann.area',
    exam: 'ch3',
    ch: '3',
    lab: 'riemann',
    src: 'Merino §3.1 type',
    title: 'Riemann sum for $f=1$',
    kind: 'numeric',
    level: 1,
    topics: ['riemann'],
    vars: { a: range(1, 2, 1), b: range(1, 2, 1) },
    derive: ($) => ({ A: $.a * $.b }),
    text: (T) =>
      `Let $f(x,y)=1$ on $D=[0,${T.a}]\\times[0,${T.b}]$. What is every Riemann sum, for any $n$ and any sample point?`,
    parts: [num('A', ($) => $.A, '', { label: 'sum', abs: 0.02 })],
    hints: ['Each box has height 1, so the sum is just the area of $D$.'],
    steps: ($, f) => [`The sum is the area $${f($.A)}$.`],
    sim: {
      scenario: 'one-sq',
      setup(slice, $) {
        slice.surfaceId = 'one';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.xMin = 0;
        slice.xMax = $.a;
        slice.yMin = 0;
        slice.yMax = $.b;
        slice.n = 4;
        slice.sample = 'mid';
        return domain(slice, { xMin: 0, xMax: $.a, yMin: 0, yMax: $.b });
      },
      read: (c) => ({ A: c.sum }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { A: 1 })],
  }),

  problem({
    id: 'ch3.riemann.mid',
    exam: 'ch3',
    ch: '3',
    lab: 'riemann',
    src: 'Merino §3.1 type',
    title: 'A $2\\times 2$ midpoint sum',
    kind: 'numeric',
    level: 2,
    topics: ['riemann'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ sum: 0.625 }),
    text: () =>
      `Let $f(x,y)=x^2+y^2$ on $[0,1]\\times[0,1]$. Compute the midpoint Riemann sum with $n=2$ (four equal squares).`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 0.02 })],
    hints: ['Centres at $(1/4,1/4)$, $(1/4,3/4)$, $(3/4,1/4)$, $(3/4,3/4)$. Each $\\Delta A=1/4$.'],
    steps: () => ['The four heights sum to $2.5$, times $1/4$ is $0.625$.'],
    sim: {
      scenario: 'para-sq',
      setup(slice) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.n = 2;
        slice.sample = 'mid';
        slice.xMin = 0;
        slice.xMax = 1;
        slice.yMin = 0;
        slice.yMax = 1;
        return domain(slice, sq);
      },
      read: (c) => ({ sum: c.sum }),
    },
    cases: [kase('sample', { dummy: 1 }, { sum: 0.625 })],
  }),

  problem({
    id: 'ch3.riemann.closed',
    exam: 'ch3',
    ch: '3',
    lab: 'riemann',
    src: 'Merino §3.1 type',
    title: 'The integral the boxes approach',
    kind: 'numeric',
    level: 2,
    topics: ['riemann'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 2 / 3 }),
    text: () => `Let $f(x,y)=x^2+y^2$ on $D=[0,1]\\times[0,1]$. Find $\\iint_D f\\,dA$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.03 })],
    hints: ['Iterate: $\\int_0^1\\int_0^1(x^2+y^2)\\,dy\\,dx = \\int_0^1(x^2+1/3)\\,dx=2/3$.'],
    steps: () => ['$2/3$.'],
    sim: {
      scenario: 'para-sq',
      setup(slice) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, sq);
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 2 / 3 })],
  }),

  problem({
    id: 'ch3.riemann.limit',
    exam: 'ch3',
    ch: '3',
    lab: 'riemann',
    src: 'Merino §3.1 type',
    title: 'What the limit is',
    kind: 'conceptual',
    level: 1,
    topics: ['riemann'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $f$ is continuous on a rectangle $D$, then every Riemann sum (any sample point) tends to $\\iint_D f\\,dA$ as the mesh goes to zero.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['Continuity on a closed rectangle is enough for integrability, and the sample point in each cell does not matter in the limit.'],
    steps: () => ['True — that is the content of the double-integral definition plus continuity.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch3.iter.fubini',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.1 type',
    title: 'Fubini on a rectangle',
    kind: 'conceptual',
    level: 1,
    topics: ['fubini'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $f$ is continuous on $[a,b]\\times[c,d]$, then $\\int_a^b\\int_c^d f\\,dy\\,dx = \\int_c^d\\int_a^b f\\,dx\\,dy$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['This is Fubini on a rectangle.'],
    steps: () => ['True — Theorem 21.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch3.iter.rect',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.1 type',
    title: 'Iterate $x^2+y^2$ on the unit square',
    kind: 'numeric',
    level: 2,
    topics: ['iterated'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 2 / 3 }),
    text: () => `Evaluate $\\int_0^1\\int_0^1(x^2+y^2)\\,dy\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: 'value', abs: 0.03 })],
    hints: ['Inner: $\\int_0^1(x^2+y^2)\\,dy = x^2+1/3$. Then $\\int_0^1(x^2+1/3)\\,dx=2/3$.'],
    steps: () => ['$2/3$.'],
    sim: {
      scenario: 'para-sq',
      setup(slice) {
        slice.surfaceId = 'paraboloid';
        slice.region = 'rect';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.order = 'xy';
        slice.xMin = 0;
        slice.xMax = 1;
        slice.yMin = 0;
        slice.yMax = 1;
        return domain(slice, sq);
      },
      read: (c) => ({ I: c.Ixy }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 2 / 3 })],
  }),

  problem({
    id: 'ch3.iter.xy',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.1 type',
    title: 'A product on a rectangle',
    kind: 'numeric',
    level: 2,
    topics: ['iterated'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 1 }),
    text: () => `Evaluate $\\iint_D xy\\,dA$ for $D=[0,2]\\times[0,1]$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.03 })],
    hints: ['The variables separate: $\\bigl(\\int_0^2 x\\,dx\\bigr)\\bigl(\\int_0^1 y\\,dy\\bigr) = 2\\cdot(1/2)=1$.'],
    steps: () => ['$1$.'],
    sim: {
      scenario: 'xy-rect',
      setup(slice) {
        slice.surfaceId = 'xy';
        slice.region = 'rect';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.xMin = 0;
        slice.xMax = 2;
        slice.yMin = 0;
        slice.yMax = 1;
        return domain(slice, { xMin: 0, xMax: 2, yMin: 0, yMax: 1 });
      },
      read: (c) => ({ I: c.Ixy }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 1 })],
  }),

  problem({
    id: 'ch3.iter.triangle',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.2 type',
    title: 'Area of a triangle',
    kind: 'numeric',
    level: 1,
    topics: ['iterated'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ A: 0.5 }),
    text: () =>
      `Let $D=\\{(x,y): x\\ge 0,\\, y\\ge 0,\\, x+y\\le 1\\}$. Find $\\iint_D 1\\,dA$.`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.03 })],
    hints: ['Type I: $x$ from $0$ to $1$, $y$ from $0$ to $1-x$. The inner integral is $1-x$.'],
    steps: () => ['Area $1/2$.'],
    sim: {
      scenario: 'triangle',
      setup(slice) {
        slice.surfaceId = 'one';
        slice.region = 'triangle';
        slice.params = { a: 1, b: 1, c: 0 };
        return domain(slice, sq);
      },
      read: (c) => ({ A: c.Ixy }),
    },
    cases: [kase('sample', { dummy: 1 }, { A: 0.5 })],
  }),

  problem({
    id: 'ch3.iter.disk',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.2 type',
    title: 'Unit disk, Cartesian',
    kind: 'numeric',
    level: 2,
    topics: ['iterated'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ A: Math.PI }),
    text: () =>
      `Let $D_1=\\{(x,y): x^2+y^2\\le 1\\}$. Find $\\iint_{D_1} 1\\,dA$ by iterating in Cartesian coordinates.`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.08 })],
    hints: ['$x$ from $-1$ to $1$, $y$ from $-\\sqrt{1-x^2}$ to $\\sqrt{1-x^2}$. The inner length is $2\\sqrt{1-x^2}$.'],
    steps: () => ['The area is $\\pi$.'],
    sim: {
      scenario: 'disk-one',
      setup(slice) {
        slice.surfaceId = 'one';
        slice.region = 'disk';
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ A: c.Ixy }),
    },
    cases: [kase('sample', { dummy: 1 }, { A: Math.PI })],
  }),

  problem({
    id: 'ch3.dpolar.area',
    exam: 'ch3',
    ch: '3',
    lab: 'dpolar',
    src: 'Merino §3.2 type',
    title: 'Area of a disk, polar',
    kind: 'numeric',
    level: 1,
    topics: ['polar-integral'],
    vars: { R: range(1, 2, 1) },
    derive: ($) => ({ A: Math.PI * $.R * $.R }),
    text: (T) =>
      `Let $D_R$ be the disk of radius ${T.R} about the origin. Using polar coordinates, find $\\iint_{D_R} 1\\,dA$.`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.08 })],
    hints: ['$\\int_0^R\\int_0^{2\\pi} r\\,d\\theta\\,dr = 2\\pi\\cdot R^2/2 = \\pi R^2$. The $r$ is the Jacobian.'],
    steps: ($, f) => [`$\\pi R^2=${f($.A)}$.`],
    sim: {
      scenario: 'area',
      setup(slice, $) {
        slice.surfaceId = 'one';
        slice.R = $.R;
        slice.n = 8;
        return domain(slice, { xMin: -$.R - 0.2, xMax: $.R + 0.2, yMin: -$.R - 0.2, yMax: $.R + 0.2 });
      },
      read: (c) => ({ A: c.closed }),
    },
    cases: [kase('sample', { R: 1 }, { A: Math.PI })],
  }),

  problem({
    id: 'ch3.dpolar.r2',
    exam: 'ch3',
    ch: '3',
    lab: 'dpolar',
    src: 'Merino §3.2 type',
    title: '$x^2+y^2$ on the unit disk',
    kind: 'numeric',
    level: 2,
    topics: ['polar-integral'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: Math.PI / 2 }),
    text: () => `Evaluate $\\iint_{D_1}(x^2+y^2)\\,dA$ in polar coordinates.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.05 })],
    hints: ['$x^2+y^2=r^2$, so the integrand is $r^2\\cdot r=r^3$. $\\int_0^{2\\pi}d\\theta\\int_0^1 r^3\\,dr=2\\pi/4=\\pi/2$.'],
    steps: () => ['$\\pi/2$.'],
    sim: {
      scenario: 'para',
      setup(slice) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: Math.PI / 2 })],
  }),

  problem({
    id: 'ch3.dpolar.jac',
    exam: 'ch3',
    ch: '3',
    lab: 'dpolar',
    src: 'Merino §3.2 type',
    title: 'The Jacobian factor',
    kind: 'conceptual',
    level: 1,
    topics: ['polar-integral'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `When changing $\\iint_{D_R} f(x,y)\\,dA$ to polar, the area element is which of the following?`,
    parts: [
      mc(
        'dA',
        [
          ['r', '$r\\,dr\\,d\\theta$'],
          ['1', '$dr\\,d\\theta$'],
          ['r2', '$r^2\\,dr\\,d\\theta$'],
          ['sin', '$\\sin\\theta\\,dr\\,d\\theta$'],
        ],
        'r',
        { label: '$dA$' },
      ),
    ],
    hints: ['The Jacobian determinant of $(r\\cos\\theta, r\\sin\\theta)$ is $r$.'],
    steps: () => ['$dA=r\\,dr\\,d\\theta$.'],
    cases: [kase('sample', { dummy: 1 }, { dA: 'r' })],
  }),

  problem({
    id: 'ch3.dpolar.odd',
    exam: 'ch3',
    ch: '3',
    lab: 'dpolar',
    src: 'Merino §3.2 type',
    title: 'An odd integrand on a disk',
    kind: 'numeric',
    level: 2,
    topics: ['polar-integral'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 0 }),
    text: () => `Evaluate $\\iint_{D_1} xy\\,dA$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.05 })],
    hints: ['$xy$ is odd in $x$ and the disk is symmetric about $x=0$. Polar: $\\int_0^{2\\pi}\\cos\\theta\\sin\\theta\\,d\\theta=0$.'],
    steps: () => ['$0$ by symmetry.'],
    sim: {
      scenario: 'xy',
      setup(slice) {
        slice.surfaceId = 'xy';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 0 })],
  }),

  problem({
    id: 'ch3.dpolar.theta',
    exam: 'ch3',
    ch: '3',
    lab: 'dpolar',
    src: 'Merino §3.2 type',
    title: 'The $\\theta$-interval',
    kind: 'conceptual',
    level: 1,
    topics: ['polar-integral'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `In these notes, a full disk about the origin is described with $\\theta$ in which interval?`,
    parts: [
      mc(
        'iv',
        [
          ['tau', '$[0,2\\pi)$'],
          ['pi', '$(-\\pi,\\pi]$'],
          ['half', '$[0,\\pi]$'],
          ['deg', '$[0,360]$ in degrees'],
        ],
        'tau',
        { label: '$\\theta$' },
      ),
    ],
    hints: ['Same convention as Chapter 2: $\\theta\\in[0,2\\pi)$.'],
    steps: () => ['$[0,2\\pi)$.'],
    cases: [kase('sample', { dummy: 1 }, { iv: 'tau' })],
  }),
];
