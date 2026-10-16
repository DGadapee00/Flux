import { coef, problem, range, num, mc, tf, kase, domain } from '../kit.js';

const box = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };

export default [
  problem({
    id: 'ch4.r3.dot',
    exam: 'ch4',
    ch: '4',
    lab: 'r3',
    src: 'Merino §4.1 type',
    title: 'Dot product in $\\mathbb{R}^3$',
    kind: 'numeric',
    level: 1,
    topics: ['r3'],
    vars: {
      ux: range(1, 3, 1),
      uy: range(0, 2, 1),
      uz: range(-1, 1, 1),
      vx: range(0, 2, 1),
      vy: range(1, 3, 1),
      vz: range(0, 2, 1),
    },
    derive: ($) => ({ du: $.ux * $.vx + $.uy * $.vy + $.uz * $.vz }),
    text: (T) =>
      `Let $u=(${T.ux}, ${T.uy}, ${T.uz})$ and $v=(${T.vx}, ${T.vy}, ${T.vz})$. Compute $u\\cdot v$.`,
    parts: [num('du', ($) => $.du, '', { label: '$u\\cdot v$' })],
    hints: [
      '$u\\cdot v = u_1 v_1 + u_2 v_2 + u_3 v_3$.',
      'Pair matching components. A zero in one vector kills that term.',
    ],
    steps: ($, f) => [`$u\\cdot v=${f($.du)}$.`],
    sim: {
      scenario: 'generic',
      setup(slice, $) {
        slice.u = { x: $.ux, y: $.uy, z: $.uz };
        slice.v = { x: $.vx, y: $.vy, z: $.vz };
        return domain(slice, box);
      },
      read: (c) => ({ du: c.du }),
    },
    cases: [kase('sample', { ux: 1, uy: 0, uz: 0, vx: 0, vy: 1, vz: 0 }, { du: 0 })],
  }),

  problem({
    id: 'ch4.r3.cross',
    exam: 'ch4',
    ch: '4',
    lab: 'r3',
    src: 'Merino §4.1 type',
    title: 'A basic cross product',
    kind: 'numeric',
    level: 2,
    topics: ['r3'],
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ cx: 0, cy: 0, cz: $.a * $.b }),
    text: (T) => `Let $u=(${T.a}, 0, 0)$ and $v=(0, ${T.b}, 0)$. Find $u\\times v$.`,
    parts: [
      num('cx', ($) => $.cx, '', { label: '$(u\\times v)_x$', abs: 0.02 }),
      num('cy', ($) => $.cy, '', { label: '$(u\\times v)_y$', abs: 0.02 }),
      num('cz', ($) => $.cz, '', { label: '$(u\\times v)_z$', abs: 0.02 }),
    ],
    hints: [
      'The $k$-component is $u_x v_y - u_y v_x$.',
      'These vectors lie in the $xy$-plane, so the $i$ and $j$ components of the cross product are $0$.',
    ],
    steps: ($, f) => [`$u\\times v=(0, 0, ${f($.cz)})$.`],
    sim: {
      scenario: 'ij',
      setup(slice, $) {
        slice.u = { x: $.a, y: 0, z: 0 };
        slice.v = { x: 0, y: $.b, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ cx: c.cr.x, cy: c.cr.y, cz: c.cr.z }),
    },
    cases: [kase('sample', { a: 1.5, b: 1.5 }, { cx: 0, cy: 0, cz: 2.25 })],
  }),

  problem({
    id: 'ch4.r3.only3',
    exam: 'ch4',
    ch: '4',
    lab: 'r3',
    src: 'Merino §4.1 type',
    title: 'Where the cross product lives',
    kind: 'conceptual',
    level: 1,
    topics: ['r3'],
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $u=(${T.n}, 0, 0)$ and $v=(0, 1, 0)$. True or false: $u\\times v$ is still defined if the third component is dropped and $u$, $v$ are treated as vectors in $\\mathbb{R}^2$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: [
      'The notes introduce the cross product only after moving to $\\mathbb{R}^3$. Its output is a vector orthogonal to both inputs, which needs a third dimension.',
      'The dot product works in $\\mathbb{R}^2$. The cross product does not.',
    ],
    steps: () => ['False — $u\\times v$ is an $\\mathbb{R}^3$ operation.'],
    cases: [kase('sample', { n: 1 }, { tf: 0 })],
  }),

  problem({
    id: 'ch4.r3.area',
    exam: 'ch4',
    ch: '4',
    lab: 'r3',
    src: 'Merino §4.1 type',
    title: 'Parallelogram area',
    kind: 'numeric',
    level: 2,
    topics: ['r3'],
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ A: $.a * $.b }),
    text: (T) =>
      `Let $u=(${T.a},0,0)$ and $v=(0,${T.b},0)$. What is the area of the parallelogram they span?`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.03 })],
    hints: [
      'That area is $\\|u\\times v\\|$.',
      'For these axis-aligned vectors the area is the product of the two nonzero components.',
    ],
    steps: ($, f) => [`The area is $${f($.A)}$.`],
    sim: {
      scenario: 'ij',
      setup(slice, $) {
        slice.u = { x: $.a, y: 0, z: 0 };
        slice.v = { x: 0, y: $.b, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ A: c.area }),
    },
    cases: [kase('sample', { a: 1.5, b: 1.5 }, { A: 2.25 })],
  }),

  problem({
    id: 'ch4.space.point',
    exam: 'ch4',
    ch: '4',
    lab: 'space',
    src: 'Merino §4.3 type',
    title: 'A point on a helix',
    kind: 'numeric',
    level: 1,
    topics: ['space'],
    vars: { t: range(0, 6.2, 0.1) },
    derive: ($) => ({ x: Math.cos($.t), y: Math.sin($.t), z: $.t / 2 }),
    text: (T) => `Let $\\gamma(t)=(\\cos t,\\sin t, t/2)$. Find $\\gamma(${T.t})$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y$', abs: 0.02 }),
      num('z', ($) => $.z, '', { label: '$z$', abs: 0.03 }),
    ],
    hints: [
      'Plug the given $t$ into each component.',
      'The third component is half of $t$, not $t$ itself.',
    ],
    steps: ($, f) => [`$\\gamma(t)=(${f($.x)}, ${f($.y)}, ${f($.z)})$.`],
    sim: {
      scenario: 'helix',
      setup(slice, $) {
        slice.curveId = 'helix';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.t;
        return domain(slice, { xMin: -3, xMax: 3, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ x: c.x, y: c.y, z: c.z }),
    },
    cases: [kase('sample', { t: Math.PI / 2 }, { x: 0, y: 1, z: Math.PI / 4 })],
  }),

  problem({
    id: 'ch4.space.length',
    exam: 'ch4',
    ch: '4',
    lab: 'space',
    src: 'Merino §4.3 type',
    title: 'Length of a helix',
    kind: 'numeric',
    level: 2,
    topics: ['space'],
    vars: { tEnd: range(0.2, 6.2, 0.1) },
    derive: ($) => ({ L: (Math.sqrt(5) / 2) * $.tEnd }),
    text: (T) =>
      `Let $\\gamma(t)=(\\cos t, \\sin t, t/2)$. Find the length from $t=0$ to $t=${T.tEnd}$.`,
    parts: [num('L', ($) => $.L, '', { label: '$L(\\gamma)$', abs: 0.08 })],
    hints: [
      "$\\sqrt{x'^2+y'^2+z'^2}=\\sqrt{5}/2$, a constant speed.",
      'Multiply that speed by the length of the $t$-interval. Do not assume the interval is a full turn.',
    ],
    steps: ($, f) => [`$L=(\\sqrt{5}/2)\\,t = ${f($.L)}$.`],
    sim: {
      scenario: 'helix',
      setup(slice, $) {
        slice.curveId = 'helix';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.tEnd;
        return domain(slice, { xMin: -3, xMax: 7, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('sample', { tEnd: 2 * Math.PI }, { L: Math.PI * Math.sqrt(5) })],
  }),

  problem({
    id: 'ch4.space.speed',
    exam: 'ch4',
    ch: '4',
    lab: 'space',
    src: 'Merino §4.3 type',
    title: 'Speed of a coil',
    kind: 'numeric',
    level: 2,
    topics: ['space'],
    vars: { t: range(0, 6.2, 0.1) },
    derive: () => ({ speed: Math.sqrt(5) }),
    text: (T) =>
      `Let $\\gamma(t)=(t, 2\\cos t, 2\\sin t)$. Find $\\|\\gamma'(${T.t})\\|$.`,
    parts: [num('speed', ($) => $.speed, '', { label: "$\\|\\gamma'\\|$", abs: 0.03 })],
    hints: [
      "$x'=1$, $y'=-2\\sin t$, $z'=2\\cos t$, so the speed is $\\sqrt{1+4}=\\sqrt{5}$, constant.",
      'The $t$ in the question does not change the answer: $\\sin^2 t+\\cos^2 t=1$ at every point.',
    ],
    steps: () => ['$\\sqrt{5}$ at every $t$.'],
    sim: {
      scenario: 'coil',
      setup(slice, $) {
        slice.curveId = 'coil';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.t;
        return domain(slice, { xMin: -1, xMax: 7, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ speed: c.speed }),
    },
    cases: [kase('sample', { t: Math.PI / 2 }, { speed: Math.sqrt(5) })],
  }),

  problem({
    id: 'ch4.space.tangent',
    exam: 'ch4',
    ch: '4',
    lab: 'space',
    src: 'Merino §4.3 type',
    title: 'Direction of the tangent',
    kind: 'numeric',
    level: 2,
    topics: ['space'],
    vars: { t: range(-1, 1.5, 0.05) },
    derive: () => ({ xp: 2, yp: 1, zp: -1 }),
    text: (T) =>
      `Let $\\gamma(t)=(2t, t, 1-t)$. A direction vector of the tangent line at $t=${T.t}$ is:`,
    parts: [
      num('xp', ($) => $.xp, '', { label: "$x'$" }),
      num('yp', ($) => $.yp, '', { label: "$y'$" }),
      num('zp', ($) => $.zp, '', { label: "$z'$" }),
    ],
    hints: [
      "$\\gamma'(t)=(2,1,-1)$ is constant, so every tangent is parallel to that vector.",
      'Differentiate each component. None of them still contains $t$.',
    ],
    steps: () => ['$(2,1,-1)$.'],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.curveId = 'line';
        slice.t0 = -1;
        slice.t1 = 1.5;
        slice.t = $.t;
        return domain(slice, { xMin: -3, xMax: 4, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ xp: c.xp, yp: c.yp, zp: c.zp }),
    },
    cases: [kase('sample', { t: 0.4 }, { xp: 2, yp: 1, zp: -1 })],
  }),

  problem({
    id: 'ch4.p3.first',
    exam: 'ch4',
    ch: '4',
    lab: 'partials3',
    src: 'Merino §4.4 type',
    title: 'First partials in $\\mathbb{R}^3$',
    kind: 'numeric',
    level: 1,
    topics: ['partials3'],
    vars: {
      x0: range(-2, 2, 1),
      y0: range(-2, 2, 1),
      z0: range(-2, 2, 1),
    },
    derive: ($) => ({ fx: 2 * $.x0, fy: 2 * $.y0, fz: 2 * $.z0 }),
    text: (T) =>
      `Let $f(x,y,z)=x^2+y^2+z^2$. Find $\\nabla f$ at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
    parts: [
      num('fx', ($) => $.fx, '', { label: '$f_x$' }),
      num('fy', ($) => $.fy, '', { label: '$f_y$' }),
      num('fz', ($) => $.fz, '', { label: '$f_z$' }),
    ],
    hints: [
      'Treat the other two variables as constant. $\\nabla f=(2x,2y,2z)$.',
      'Each component is twice the matching coordinate. A zero coordinate gives a zero partial.',
    ],
    steps: ($, f) => [`$\\nabla f=(${f($.fx)}, ${f($.fy)}, ${f($.fz)})$.`],
    sim: {
      scenario: 'bowl',
      setup(slice, $) {
        slice.fieldId = 'bowl';
        slice.probe = { x: $.x0, y: $.y0, z: $.z0 };
        return domain(slice, box);
      },
      read: (c) => ({ fx: c.fx, fy: c.fy, fz: c.fz }),
    },
    cases: [kase('sample', { x0: 1, y0: 0, z0: -1 }, { fx: 2, fy: 0, fz: -2 })],
  }),

  problem({
    id: 'ch4.p3.mixed',
    exam: 'ch4',
    ch: '4',
    lab: 'partials3',
    src: 'Merino §4.4 type',
    title: 'A mixed partial in three variables',
    kind: 'numeric',
    level: 2,
    topics: ['partials3'],
    vars: {
      x0: range(-2, 2, 0.5),
      y0: range(-2, 2, 1),
      z0: range(-2, 2, 1),
    },
    derive: ($) => ({ fxy: 2 * $.x0 * $.z0 }),
    text: (T) =>
      `Let $f(x,y,z)=x^2 y z$. Find $f_{xy}$ at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
    parts: [num('fxy', ($) => $.fxy, '', { label: '$f_{xy}$' })],
    hints: [
      '$f_x=2xyz$, then differentiate in $y$: $f_{xy}=2xz$. Schwarz says $f_{yx}$ is the same.',
      'The $y$ coordinate drops out of $f_{xy}$. Multiply $2xz$ at the given point.',
    ],
    steps: ($, f) => [`$f_{xy}=2xz=${f($.fxy)}$.`],
    sim: {
      scenario: 'prod',
      setup(slice, $) {
        slice.fieldId = 'prod';
        slice.probe = { x: $.x0, y: $.y0, z: $.z0 };
        return domain(slice, box);
      },
      read: (c) => ({ fxy: c.fxy }),
    },
    cases: [kase('sample', { x0: 1, y0: 0, z0: 2 }, { fxy: 4 })],
  }),

  problem({
    id: 'ch4.p3.schwarz',
    exam: 'ch4',
    ch: '4',
    lab: 'partials3',
    src: 'Merino §4.4 type',
    title: 'Schwarz in $\\mathbb{R}^3$',
    kind: 'conceptual',
    level: 1,
    topics: ['partials3'],
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y,z)=${coef(T.n)}x^2 y z$. True or false: if the second partials of $f$ are continuous near $P$, then $f_{xy}(P)=f_{yx}(P)$, $f_{xz}(P)=f_{zx}(P)$, and $f_{yz}(P)=f_{zy}(P)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'This is the three-variable analogue of the equality of mixed partials.',
      'There are three pairs, not only $f_{xy}$ and $f_{yx}$. Continuity of the second partials is the hypothesis.',
    ],
    steps: () => ['True — Theorem 25.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch4.p3.crit',
    exam: 'ch4',
    ch: '4',
    lab: 'partials3',
    src: 'Merino §4.5 type',
    title: 'Necessary, not sufficient',
    kind: 'conceptual',
    level: 1,
    topics: ['partials3'],
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y,z)=${coef(T.n)}x^2+y^2-z^2$. True or false: if $\\nabla f(a,b,c)=(0,0,0)$, then $f$ has a local min or max at $(a,b,c)$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: [
      '$f=x^2+y^2-z^2$ has $\\nabla f=(0,0,0)$ at the origin and takes both signs nearby.',
      'A positive coefficient on $x^2$ does not remove the $-z^2$ direction, so the origin is still not a local extremum.',
    ],
    steps: () => ['False — a critical point need not be a local min or max.'],
    cases: [kase('sample', { n: 1 }, { tf: 0 })],
  }),
];
