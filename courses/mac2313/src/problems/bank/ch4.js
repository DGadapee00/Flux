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
      'The dot product multiplies matching components and adds the products.',
      (T, $) => {
        const p = (n) => (n < 0 ? `(${n})` : `${n}`);
        return String.raw`Form $${p($.ux)}\cdot${p($.vx)}+${p($.uy)}\cdot${p($.vy)}+${p($.uz)}\cdot${p($.vz)}$.`;
      },
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
      String.raw`Use the determinant with $\mathbf{i}$, $\mathbf{j}$, $\mathbf{k}$ in the first row.`,
      'Both vectors lie in the $xy$-plane, so their cross product points along the $z$-axis.',
      String.raw`The $\mathbf{k}$-component is $u_xv_y-u_yv_x$.`,
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
      'The cross product returns a vector perpendicular to both inputs.',
      String.raw`In $\mathbb{R}^2$, two independent vectors leave no direction perpendicular to both.`,
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
      String.raw`The parallelogram spanned by $u$ and $v$ has area $\|u\times v\|$.`,
      'These vectors are perpendicular, so the parallelogram is a rectangle.',
      'Its sides are the lengths of $u$ and $v$.',
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
      'Substitute the given $t$ into each component.',
      (T) => String.raw`Use radians for $\cos ${T.t}$ and $\sin ${T.t}$.`,
      'The third component is half of $t$.',
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
      String.raw`Length is $\int\|\gamma'(t)\|\,dt$.`,
      String.raw`$\gamma'(t)=(-\sin t,\cos t,\tfrac12)$.`,
      (T) => String.raw`Its length is constant. Multiply it by $${T.tEnd}$.`,
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
      String.raw`Speed is $\|\gamma'(t)\|$.`,
      String.raw`$\gamma'(t)=(1,-2\sin t,2\cos t)$.`,
      String.raw`Square the components and add them. Use $\sin^2t+\cos^2t=1$.`,
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
      String.raw`A direction of the tangent line at $t$ is $\gamma'(t)$.`,
      'Differentiate each component in $t$.',
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
      String.raw`$\nabla f=(f_x,f_y,f_z)$. For each one, hold the other two variables fixed.`,
      String.raw`$f_x=2x$, $f_y=2y$, and $f_z=2z$.`,
      (T) => String.raw`Evaluate at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
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
      String.raw`$f_{xy}$ means: differentiate in $x$, then in $y$.`,
      String.raw`$f_x=2xyz$.`,
      (T) => String.raw`Differentiate that in $y$, then evaluate at $(${T.x0}, ${T.y0}, ${T.z0})$.`,
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
      'Recall the hypothesis of the theorem on mixed partials. It does not depend on the number of variables.',
      'Each pair of mixed partials involves two of the variables, with the third held fixed.',
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
      'A critical point can be a minimum, a maximum, or neither.',
      String.raw`At the origin, $\nabla f=(0,0,0)$. Look at $f$ along the $x$-axis, then along the $z$-axis.`,
    ],
    steps: () => ['False — a critical point need not be a local min or max.'],
    cases: [kase('sample', { n: 1 }, { tf: 0 })],
  }),
];
