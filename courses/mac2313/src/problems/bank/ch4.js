import { problem, range, num, mc, tf, kase, domain } from '../kit.js';

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
    hints: ['$u\\cdot v = u_1 v_1 + u_2 v_2 + u_3 v_3$.'],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ cx: 0, cy: 0, cz: 2.25 }),
    text: () => `Let $u=(1.5, 0, 0)$ and $v=(0, 1.5, 0)$. Find $u\\times v$.`,
    parts: [
      num('cx', ($) => $.cx, '', { label: '$(u\\times v)_x$', abs: 0.02 }),
      num('cy', ($) => $.cy, '', { label: '$(u\\times v)_y$', abs: 0.02 }),
      num('cz', ($) => $.cz, '', { label: '$(u\\times v)_z$', abs: 0.02 }),
    ],
    hints: ['The $k$-component is $u_x v_y - u_y v_x$.'],
    steps: () => ['$u\\times v=(0,0,2.25)$.'],
    sim: {
      scenario: 'ij',
      setup(slice) {
        slice.u = { x: 1.5, y: 0, z: 0 };
        slice.v = { x: 0, y: 1.5, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ cx: c.cr.x, cy: c.cr.y, cz: c.cr.z }),
    },
    cases: [kase('sample', { dummy: 1 }, { cx: 0, cy: 0, cz: 2.25 })],
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
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: the cross product $u\\times v$ of two vectors is defined in $\\mathbb{R}^2$ as well as in $\\mathbb{R}^3$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: ['The notes introduce the cross product only after moving to $\\mathbb{R}^3$. Its output is a vector orthogonal to both inputs, which needs a third dimension.'],
    steps: () => ['False — $u\\times v$ is an $\\mathbb{R}^3$ operation.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 0 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ A: 2.25 }),
    text: () =>
      `Let $u=(1.5,0,0)$ and $v=(0,1.5,0)$. What is the area of the parallelogram they span?`,
    parts: [num('A', ($) => $.A, '', { label: 'area', abs: 0.03 })],
    hints: ['That area is $\\|u\\times v\\|$.'],
    steps: () => ['$1.5\\times 1.5=2.25$.'],
    sim: {
      scenario: 'ij',
      setup(slice) {
        slice.u = { x: 1.5, y: 0, z: 0 };
        slice.v = { x: 0, y: 1.5, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ A: c.area }),
    },
    cases: [kase('sample', { dummy: 1 }, { A: 2.25 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ x: 0, y: 1, z: Math.PI / 4 }),
    text: () => `Let $\\gamma(t)=(\\cos t,\\sin t, t/2)$. Find $\\gamma(\\pi/2)$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y$', abs: 0.02 }),
      num('z', ($) => $.z, '', { label: '$z$', abs: 0.03 }),
    ],
    hints: ['Plug in $t=\\pi/2$.'],
    steps: () => ['$\\gamma(\\pi/2)=(0,1,\\pi/4)$.'],
    sim: {
      scenario: 'helix',
      setup(slice) {
        slice.curveId = 'helix';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = Math.PI / 2;
        return domain(slice, { xMin: -3, xMax: 3, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ x: c.x, y: c.y, z: c.z }),
    },
    cases: [kase('sample', { dummy: 1 }, { x: 0, y: 1, z: Math.PI / 4 })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ L: Math.PI * Math.sqrt(5) }),
    text: () =>
      `Let $\\gamma(t)=(\\cos t, \\sin t, t/2)$ on $[0,2\\pi]$. Find $L(\\gamma)$.`,
    parts: [num('L', ($) => $.L, '', { label: '$L(\\gamma)$', abs: 0.08 })],
    hints: ["$\\sqrt{x'^2+y'^2+z'^2}=\\sqrt{5}/2$, so the integral is that speed times $2\\pi$."],
    steps: () => ['$L=\\pi\\sqrt{5}$.'],
    sim: {
      scenario: 'helix',
      setup(slice) {
        slice.curveId = 'helix';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = 2 * Math.PI;
        return domain(slice, { xMin: -3, xMax: 7, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('sample', { dummy: 1 }, { L: Math.PI * Math.sqrt(5) })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ speed: Math.sqrt(5) }),
    text: () =>
      `Let $\\gamma(t)=(t, 2\\cos t, 2\\sin t)$. Find $\\|\\gamma'(t)\\|$.`,
    parts: [num('speed', ($) => $.speed, '', { label: "$\\|\\gamma'\\|$", abs: 0.03 })],
    hints: ["$x'=1$, $y'=-2\\sin t$, $z'=2\\cos t$, so the speed is $\\sqrt{1+4}=\\sqrt{5}$, constant."],
    steps: () => ['$\\sqrt{5}$.'],
    sim: {
      scenario: 'coil',
      setup(slice) {
        slice.curveId = 'coil';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = Math.PI / 2;
        return domain(slice, { xMin: -1, xMax: 7, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ speed: c.speed }),
    },
    cases: [kase('sample', { dummy: 1 }, { speed: Math.sqrt(5) })],
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
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ xp: 2, yp: 1, zp: -1 }),
    text: () =>
      `Let $\\gamma(t)=(2t, t, 1-t)$. A direction vector of the tangent line at any $t$ is:`,
    parts: [
      num('xp', ($) => $.xp, '', { label: "$x'$" }),
      num('yp', ($) => $.yp, '', { label: "$y'$" }),
      num('zp', ($) => $.zp, '', { label: "$z'$" }),
    ],
    hints: ["$\\gamma'(t)=(2,1,-1)$ is constant, so every tangent is parallel to that vector."],
    steps: () => ['$(2,1,-1)$.'],
    sim: {
      scenario: 'line',
      setup(slice) {
        slice.curveId = 'line';
        slice.t0 = -1;
        slice.t1 = 1.5;
        slice.t = 0.4;
        return domain(slice, { xMin: -3, xMax: 4, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ xp: c.xp, yp: c.yp, zp: c.zp }),
    },
    cases: [kase('sample', { dummy: 1 }, { xp: 2, yp: 1, zp: -1 })],
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
      x0: range(-1, 1, 1),
      y0: range(-1, 1, 1),
      z0: range(-1, 1, 1),
    },
    derive: ($) => ({ fx: 2 * $.x0, fy: 2 * $.y0, fz: 2 * $.z0 }),
    text: (T) =>
      `Let $f(x,y,z)=x^2+y^2+z^2$. Find $\\nabla f$ at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
    parts: [
      num('fx', ($) => $.fx, '', { label: '$f_x$' }),
      num('fy', ($) => $.fy, '', { label: '$f_y$' }),
      num('fz', ($) => $.fz, '', { label: '$f_z$' }),
    ],
    hints: ['Treat the other two variables as constant. $\\nabla f=(2x,2y,2z)$.'],
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
      x0: range(1, 2, 1),
      y0: range(-1, 1, 1),
      z0: range(1, 2, 1),
    },
    derive: ($) => ({ fxy: 2 * $.x0 * $.z0 }),
    text: (T) =>
      `Let $f(x,y,z)=x^2 y z$. Find $f_{xy}$ at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
    parts: [num('fxy', ($) => $.fxy, '', { label: '$f_{xy}$' })],
    hints: ['$f_x=2xyz$, then differentiate in $y$: $f_{xy}=2xz$. Schwarz says $f_{yx}$ is the same.'],
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
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if the second partials of $f:\\mathbb{R}^3\\to\\mathbb{R}$ are continuous near $P$, then $f_{xy}(P)=f_{yx}(P)$, $f_{xz}(P)=f_{zx}(P)$, and $f_{yz}(P)=f_{zy}(P)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['This is the three-variable analogue of the equality of mixed partials.'],
    steps: () => ['True — Theorem 25.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
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
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $\\nabla f(a,b,c)=(0,0,0)$, then $f$ has a local min or max at $(a,b,c)$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: ['$f=x^2+y^2-z^2$ has $\\nabla f=(0,0,0)$ at the origin and takes both signs nearby.'],
    steps: () => ['False — a critical point need not be a local min or max.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 0 })],
  }),
];
