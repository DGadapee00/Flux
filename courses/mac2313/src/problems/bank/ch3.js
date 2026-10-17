import { coef, problem, range, num, mc, tf, kase, domain } from '../kit.js';

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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ A: $.a * $.b }),
    text: (T) =>
      `Let $f(x,y)=1$ on $D=[0,${T.a}]\\times[0,${T.b}]$. What is every Riemann sum, for any $n$ and any sample point?`,
    parts: [num('A', ($) => $.A, '', { label: 'sum', abs: 0.02 })],
    hints: [
      'Every sample height is $1$, so each term of the sum is the area of its cell.',
      'The cells tile $D$, with no overlap and no gap.',
    ],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ sum: 0.3125 * ($.a + $.b) }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2+${coef(T.b)}y^2$ on $[0,1]\\times[0,1]$. Compute the midpoint Riemann sum with $n=2$ (four equal squares).`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 0.02 })],
    hints: [
      'A midpoint sum samples each cell at its centre and multiplies by the cell area.',
      String.raw`The centres are $(\tfrac14,\tfrac14)$, $(\tfrac14,\tfrac34)$, $(\tfrac34,\tfrac14)$, and $(\tfrac34,\tfrac34)$. Each cell has area $\tfrac14$.`,
      (T, $) => String.raw`Evaluate $${coef($.a)}x^2+${coef($.b)}y^2$ at each centre, add, and multiply by $\tfrac14$.`,
    ],
    steps: ($, f) => [`The midpoint sum is $${f($.sum)}$.`],
    sim: {
      scenario: 'para-sq',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
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
    cases: [kase('sample', { a: 1, b: 1 }, { sum: 0.625 })],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ I: ($.a + $.b) / 3 }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2+${coef(T.b)}y^2$ on $D=[0,1]\\times[0,1]$. Find $\\iint_D f\\,dA$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.03 })],
    hints: [
      'On a rectangle, a double integral equals an iterated integral, in either order.',
      'Integrate in $y$ first. The $x^2$ term is a constant for that integral.',
      'Then integrate the result in $x$ from $0$ to $1$.',
    ],
    steps: ($, f) => [`$(a+b)/3 = ${f($.I)}$.`],
    sim: {
      scenario: 'para-sq',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.n = 12;
        slice.sample = 'mid';
        return domain(slice, sq);
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { I: 2 / 3 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}x^2+y^2$, which is continuous. True or false: on a closed rectangle $D$, every Riemann sum (any sample point) tends to $\\iint_D f\\,dA$ as the mesh goes to zero.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'Integrability on a closed rectangle needs a condition on $f$. Check whether this $f$ meets it.',
      'A continuous function on a closed rectangle is integrable, whatever the sample points.',
    ],
    steps: () => ['True — that is the content of the double-integral definition plus continuity.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}xy$, continuous on a rectangle $[a,b]\\times[c,d]$. True or false: $\\int_a^b\\int_c^d f\\,dy\\,dx = \\int_c^d\\int_a^b f\\,dx\\,dy$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      "Fubini's theorem says when the order of an iterated integral can be swapped.",
      'On a rectangle, its hypothesis is that $f$ is continuous there.',
    ],
    steps: () => ['True — Theorem 21.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ I: ($.a + $.b) / 3 }),
    text: (T) => `Evaluate $\\int_0^1\\int_0^1(${coef(T.a)}x^2+${coef(T.b)}y^2)\\,dy\\,dx$.`,
    parts: [num('I', ($) => $.I, '', { label: 'value', abs: 0.03 })],
    hints: [
      'Integrate in $y$ first. The $x^2$ term is a constant for that integral.',
      String.raw`$\int_0^1 y^2\,dy=\tfrac13$ and $\int_0^1 dy=1$.`,
      'Then integrate the result in $x$ from $0$ to $1$.',
    ],
    steps: ($, f) => [`$(a+b)/3 = ${f($.I)}$.`],
    sim: {
      scenario: 'para-sq',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.region = 'rect';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.order = 'xy';
        slice.xMin = 0;
        slice.xMax = 1;
        slice.yMin = 0;
        slice.yMax = 1;
        return domain(slice, sq);
      },
      read: (c) => ({ I: c.Ixy }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { I: 2 / 3 })],
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
    vars: { a: range(1, 5, 1), A: range(1, 4, 1), B: range(1, 3, 1) },
    derive: ($) => ({ I: $.a * (($.A * $.A) / 2) * (($.B * $.B) / 2) }),
    text: (T) => `Evaluate $\\iint_D ${coef(T.a)}xy\\,dA$ for $D=[0,${T.A}]\\times[0,${T.B}]$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.03 })],
    hints: [
      'The integrand is a function of $x$ times a function of $y$, and $D$ is a rectangle. The integral splits.',
      (T, $) => String.raw`It equals $${coef($.a)}\left(\int_0^{${T.A}}x\,dx\right)\left(\int_0^{${T.B}}y\,dy\right)$.`,
      'Each factor is half the square of its upper limit.',
    ],
    steps: ($, f) => [`$a \\cdot (A^2/2) \\cdot (B^2/2) = ${f($.I)}$.`],
    sim: {
      scenario: 'xy-rect',
      setup(slice, $) {
        slice.surfaceId = 'xy';
        slice.region = 'rect';
        slice.params = { a: $.a, b: 1, c: 0 };
        slice.xMin = 0;
        slice.xMax = $.A;
        slice.yMin = 0;
        slice.yMax = $.B;
        return domain(slice, { xMin: 0, xMax: $.A, yMin: 0, yMax: $.B });
      },
      read: (c) => ({ I: c.Ixy }),
    },
    cases: [kase('sample', { a: 1, A: 2, B: 1 }, { I: 1 })],
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
    vars: { c: range(1, 50, 1) },
    derive: ($) => ({ A: $.c / 2 }),
    text: (T) =>
      `Let $D=\\{(x,y): x\\ge 0,\\, y\\ge 0,\\, x+y\\le 1\\}$ and let $f(x,y)=${T.c}$. Find $\\iint_D f\\,dA$.`,
    parts: [num('A', ($) => $.A, '', { label: 'integral', abs: 0.03 })],
    hints: [
      'The integral of a constant over $D$ is the constant times the area of $D$.',
      String.raw`As a Type I region, $x$ runs from $0$ to $1$ and $y$ from $0$ to $1-x$.`,
      (T) => String.raw`Integrate $${T.c}$ over those limits, or multiply $${T.c}$ by the area of the triangle.`,
    ],
    steps: ($, f) => [`$c/2 = ${f($.A)}$.`],
    sim: {
      scenario: 'triangle',
      setup(slice, $) {
        slice.surfaceId = 'plane';
        slice.region = 'triangle';
        slice.params = { a: 0, b: 0, c: $.c };
        return domain(slice, sq);
      },
      read: (c) => ({ A: c.Ixy }),
    },
    cases: [kase('sample', { c: 1 }, { A: 0.5 })],
  }),

  problem({
    id: 'ch3.iter.disk',
    exam: 'ch3',
    ch: '3',
    lab: 'iterated',
    src: 'Merino §3.2 type',
    title: 'Disk area, Cartesian',
    kind: 'numeric',
    level: 2,
    topics: ['iterated'],
    vars: { R: range(1, 50, 1) },
    derive: ($) => ({ A: Math.PI * $.R * $.R }),
    text: (T) =>
      `Let $D$ be the disk $x^2+y^2\\le ${T.R}^2$. Find $\\iint_D 1\\,dA$ by iterating in Cartesian coordinates.`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.08 })],
    hints: [
      'Fix $x$ first, and find how far $y$ can run inside the disk.',
      (T) => String.raw`$y$ runs from $-\sqrt{${T.R}^2-x^2}$ to $\sqrt{${T.R}^2-x^2}$, and $x$ from $-${T.R}$ to $${T.R}$.`,
      (T) => String.raw`The inner integral is $2\sqrt{${T.R}^2-x^2}$. Substitute $x=${coef(T.R)}\sin\theta$ for the outer one.`,
    ],
    steps: ($, f) => [`The area is $\\pi R^2=${f($.A)}$.`],
    sim: {
      scenario: 'disk-one',
      setup(slice, $) {
        slice.surfaceId = 'one';
        slice.region = 'disk';
        slice.R = $.R;
        return domain(slice, { xMin: -$.R - 0.2, xMax: $.R + 0.2, yMin: -$.R - 0.2, yMax: $.R + 0.2 });
      },
      read: (c) => ({ A: c.Ixy }),
    },
    cases: [kase('sample', { R: 1 }, { A: Math.PI })],
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
    vars: { R: range(1, 50, 1) },
    derive: ($) => ({ A: Math.PI * $.R * $.R }),
    text: (T) =>
      `Let $D_R$ be the disk of radius ${T.R} about the origin. Using polar coordinates, find $\\iint_{D_R} 1\\,dA$.`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.08 })],
    hints: [
      String.raw`In polar coordinates, $dA=r\,dr\,d\theta$.`,
      (T) => String.raw`The disk is $0\le r\le ${T.R}$ and $0\le\theta<2\pi$.`,
      (T) => String.raw`Integrate $r$ from $0$ to $${T.R}$, then multiply by the angle range.`,
    ],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ I: (Math.PI / 4) * ($.a + $.b) }),
    text: (T) =>
      `Evaluate $\\iint_{D_1}(${coef(T.a)}x^2+${coef(T.b)}y^2)\\,dA$ in polar coordinates, where $D_1$ is the unit disk.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.05 })],
    hints: [
      String.raw`Switch to polar: $x=r\cos\theta$, $y=r\sin\theta$, and $dA=r\,dr\,d\theta$.`,
      (T, $) => String.raw`The integrand becomes $r^2(${coef($.a)}\cos^2\theta+${coef($.b)}\sin^2\theta)$, times $r$.`,
      String.raw`Over a full turn, $\int\cos^2\theta\,d\theta=\int\sin^2\theta\,d\theta=\pi$. The radial part is $\int_0^1 r^3\,dr$.`,
    ],
    steps: ($, f) => [`$\\pi(a+b)/4 = ${f($.I)}$.`],
    sim: {
      scenario: 'para',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { I: Math.PI / 2 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}(x^2+y^2)$. When changing $\\iint_{D_R} f(x,y)\\,dA$ to polar, the area element is which of the following?`,
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
    hints: [
      String.raw`The area element comes from the Jacobian of $(r,\theta)\mapsto(r\cos\theta,\, r\sin\theta)$.`,
      String.raw`That Jacobian is the determinant of $\begin{pmatrix}\cos\theta & -r\sin\theta\\ \sin\theta & r\cos\theta\end{pmatrix}$.`,
    ],
    steps: () => ['$dA=r\\,dr\\,d\\theta$.'],
    cases: [kase('sample', { n: 1 }, { dA: 'r' })],
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
    vars: { a: range(1, 10, 1), R: range(1, 5, 1) },
    derive: () => ({ I: 0 }),
    text: (T) => `Evaluate $\\iint_{D} ${coef(T.a)}xy\\,dA$, where $D$ is the disk of radius ${T.R} about the origin.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iint$', abs: 0.05 })],
    hints: [
      'Look for a symmetry of the region and of the integrand before computing.',
      String.raw`Replacing $x$ by $-x$ keeps the disk the same and flips the sign of $xy$.`,
    ],
    steps: () => ['$0$ by symmetry.'],
    sim: {
      scenario: 'xy',
      setup(slice, $) {
        slice.surfaceId = 'xy';
        slice.params = { a: $.a, b: 1, c: 0 };
        slice.R = $.R;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { a: 1, R: 1 }, { I: 0 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `The disk of radius ${T.n} about the origin is described, in these notes, with $\\theta$ in which interval?`,
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
    hints: [
      'The notes fix one convention for polar angles and keep it in every chapter.',
      'The interval covers one full turn. It is closed at one end and open at the other, so no ray is counted twice.',
    ],
    steps: () => ['$[0,2\\pi)$.'],
    cases: [kase('sample', { n: 1 }, { iv: 'tau' })],
  }),
];
