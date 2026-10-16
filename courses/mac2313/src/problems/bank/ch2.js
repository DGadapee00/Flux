import { problem, range, num, mc, tf, sym, kase, domain, DEG, coef, prod } from '../kit.js';

const box = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };

function loadParaboloid(slice, $, extra = {}) {
  slice.surfaceId = 'paraboloid';
  slice.params = { a: $.a, b: $.b ?? 1, c: 0 };
  slice.probe = { x: $.x0, y: $.y0, z: 0 };
  if ($.theta != null) slice.theta = $.theta;
  Object.assign(slice, extra);
  return domain(slice, box);
}

function loadSaddle(slice, $) {
  slice.surfaceId = 'saddle';
  slice.params = { a: $.a, b: $.b, c: 0 };
  slice.probe = { x: $.x0, y: $.y0, z: 0 };
  return domain(slice, box);
}

function loadPlane(slice, $) {
  slice.surfaceId = 'plane';
  slice.params = { a: $.a, b: $.b, c: 0 };
  slice.probe = { x: $.x0, y: $.y0, z: 0 };
  if ($.theta != null) slice.theta = $.theta;
  return domain(slice, box);
}

export default [
  problem({
    id: 'ch2.partials.poly',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'First partials of a polynomial',
    kind: 'numeric',
    level: 1,
    topics: ['partials'],
    vars: {
      a: range(1, 4, 1),
      b: range(1, 4, 1),
      x0: range(-2, 2, 1),
      y0: range(-2, 2, 1),
    },
    derive: ($) => ({ fx: 2 * $.a * $.x0, fy: 2 * $.b * $.y0 }),
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}x^2 + ${coef(T.b)}y^2$. Find the first partial derivatives at $P = (${T.x0}, ${T.y0})$.`,
    parts: [
      num('fx', ($) => $.fx, '', { label: '$\\partial f/\\partial x$ at $P$' }),
      num('fy', ($) => $.fy, '', { label: '$\\partial f/\\partial y$ at $P$' }),
    ],
    hints: [
      'Treat $y$ as constant to get $\\partial f/\\partial x$; treat $x$ as constant to get $\\partial f/\\partial y$.',
      'Each first partial is linear: evaluate $2ax$ and $2by$ at the given point.',
    ],
    steps: ($, f, T) => [
      `$f_x = ${T.a === '1' ? '2x' : `2\\cdot${T.a}x = ${prod(2, T.a)}x`}$, so at $P$ we get $${f($.fx)}$.`,
      `$f_y = ${prod(2, T.b)}y$, so at $P$ we get $${f($.fy)}$.`,
    ],
    sim: {
      scenario: 'paraboloid',
      setup: loadParaboloid,
      read: (c) => ({ fx: c.fx, fy: c.fy }),
    },
    cases: [kase('sample', { a: 1, b: 1, x0: 1, y0: 2 }, { fx: 2, fy: 4 })],
  }),

  problem({
    id: 'ch2.partials.product',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'Partials of a product, as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['partials', 'symbolic'],
    vars: {
      a: range(1, 50, 1),
    },
    derive: ($) => ({ x: 1, y: 1, fx: $.a, fy: $.a }),
    valid: ($) => $.a !== 0,
    text: (T) => `Let $f(x,y) = ${coef(T.a)}xy$. Write $\\partial f/\\partial x$ as a formula in $x$ and $y$.`,
    parts: [
      sym('fx_sym', ($) => (Number($.a) === 1 ? 'y' : `${$.a}*y`), ['x', 'y'], ($) => $.a * $.y, {
        label: '$\\partial f/\\partial x$',
      }),
    ],
    hints: [
      '$y$ is a constant when differentiating with respect to $x$.',
      'The formula still contains $y$. Do not plug in a point.',
    ],
    steps: ($, f, T) => [`$f_x = ${T.a} y$.`],
    sim: {
      scenario: 'xy',
      setup(slice, $) {
        slice.surfaceId = 'xy';
        slice.params = { a: $.a, b: 1, c: 0 };
        slice.probe = { x: 1, y: 1, z: 0 };
        return domain(slice, box);
      },
      read: (c, s, $) => ({ '@fx': [c.fx, $.a * s.probe.y] }),
    },
    cases: [
      kase('sample', { a: 2 }, { fx_sym: '2*y' }, { accept: { fx_sym: ['2y'] }, reject: { fx_sym: ['a*y'] } }),
    ],
  }),

  problem({
    id: 'ch2.grad.point',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.6 type',
    title: 'Gradient at a point',
    kind: 'numeric',
    level: 1,
    topics: ['gradient'],
    vars: {
      a: range(1, 3, 1),
      b: range(1, 3, 1),
      x0: range(-2, 2, 1),
      y0: range(-2, 2, 1),
    },
    valid: ($) => !($.x0 === 0 && $.y0 === 0),
    derive: ($) => ({ fx: 2 * $.a * $.x0, fy: -2 * $.b * $.y0 }),
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}x^2 - ${coef(T.b)}y^2$. Compute $\\nabla f$ at $(${T.x0}, ${T.y0})$.`,
    parts: [
      num('fx', ($) => $.fx, '', { label: '$\\partial f/\\partial x$' }),
      num('fy', ($) => $.fy, '', { label: '$\\partial f/\\partial y$' }),
    ],
    hints: [
      '$\\nabla f = (f_x, f_y)$.',
      'Differentiate $ax^2$ in $x$ and $-by^2$ in $y$, then evaluate at the point.',
    ],
    steps: ($, f) => [`$\\nabla f = (${f($.fx)}, ${f($.fy)})$.`],
    sim: {
      scenario: 'saddle',
      setup: loadSaddle,
      read: (c) => ({ fx: c.fx, fy: c.fy }),
    },
    cases: [kase('sample', { a: 1, b: 1, x0: 1, y0: 1 }, { fx: 2, fy: -2 })],
  }),

  problem({
    id: 'ch2.grad.sym',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.6 type',
    title: 'Gradient as a formula',
    kind: 'derivation',
    level: 2,
    topics: ['gradient', 'symbolic'],
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: ($) => ({ x: 0.5, y: 0.5, fx: 2 * $.a * 0.5, fy: 2 * $.b * 0.5 }),
    text: (T) => `Let $f(x,y) = ${coef(T.a)}x^2 + ${coef(T.b)}y^2$. Write the $x$-component of $\\nabla f$ as a formula.`,
    parts: [
      sym('gx', ($) => `${2 * $.a}*x`, ['x', 'y'], ($) => 2 * $.a * $.x, { label: '$(\\nabla f)_x$' }),
    ],
    hints: [
      '$(\\nabla f)_x = \\partial f/\\partial x$.',
      'The $x$-component still depends on $x$. Leave $x$ in the formula.',
    ],
    steps: ($, f, T) => [`$(\\nabla f)_x = ${prod(2, T.a)}x$.`],
    sim: {
      scenario: 'paraboloid',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.probe = { x: 0.5, y: 0.5, z: 0 };
        return domain(slice, box);
      },
      read: (c, s, $) => ({ '@gx': [c.fx, 2 * $.a * s.probe.x] }),
    },
    cases: [
      kase('sample', { a: 1, b: 1 }, { gx: '2*x' }, { accept: { gx: ['2x'] }, reject: { gx: ['2*a*x'] } }),
    ],
  }),

  problem({
    id: 'ch2.du.unit',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.8 type',
    title: 'Directional derivative, unit vector',
    kind: 'numeric',
    level: 2,
    topics: ['directional'],
    vars: {
      a: range(1, 3, 1),
      b: range(1, 3, 1),
      x0: range(-1, 1, 1),
      y0: range(-1, 1, 1),
      deg: range(0, 180, 45),
    },
    derive: ($) => {
      const th = $.deg * DEG;
      const ux = Math.cos(th);
      const uy = Math.sin(th);
      const fx = $.a;
      const fy = $.b;
      return { theta: th, ux, uy, fx, fy, Du: fx * ux + fy * uy };
    },
    text: (T, $) =>
      `Let $f(x,y) = ${coef(T.a)}x + ${coef(T.b)}y$ and let $\\hat u$ make an angle $${T.deg}^\\circ$ with the positive $x$-axis. Find $D_{\\hat u} f$ at $(${T.x0}, ${T.y0})$.`,
    parts: [num('Du', ($) => $.Du, '', { label: '$D_{\\hat u} f$', abs: 0.02 })],
    hints: [
      '$D_{\\hat u} f = \\nabla f \\cdot \\hat u$, and $\\hat u = (\\cos\\theta, \\sin\\theta)$.',
      'For this plane, $\\nabla f=(a,b)$ at every point, so the base point does not change the value.',
    ],
    steps: ($, f) => [`$\\nabla f = (${f($.fx)}, ${f($.fy)})$, $\\hat u = (${f($.ux)}, ${f($.uy)})$, so $D_{\\hat u} f = ${f($.Du)}$.`],
    sim: {
      scenario: 'plane',
      setup: loadPlane,
      read: (c) => ({ Du: c.Du }),
    },
    cases: [kase('sample', { a: 3, b: 4, x0: 0, y0: 0, deg: 0 }, { Du: 3 })],
  }),

  problem({
    id: 'ch2.du.nonunit',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.8 type',
    title: 'Non-unit direction',
    kind: 'numeric',
    level: 2,
    topics: ['directional'],
    vars: {
      a: range(1, 3, 1),
      b: range(1, 3, 1),
      ux: range(2, 5, 1),
      uy: range(2, 5, 1),
    },
    derive: ($) => {
      const L = Math.hypot($.ux, $.uy);
      const hx = $.ux / L;
      const hy = $.uy / L;
      return { L, hx, hy, Du: $.a * hx + $.b * hy };
    },
    valid: ($) => $.ux !== 0 || $.uy !== 0,
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}x + ${coef(T.b)}y$ and $u = (${T.ux}, ${T.uy})$. The notes require a unit vector. Normalize $u$ and find $D_{\\hat u} f$ at the origin.`,
    parts: [num('Du', ($) => $.Du, '', { label: '$D_{\\hat u} f$', abs: 0.02 })],
    hints: [
      '$\\hat u = u/\\|u\\|$, then $D_{\\hat u} f = \\nabla f \\cdot \\hat u$. Do not plug the raw $(u_x, u_y)$ into Theorem 17.',
      'Divide each component of $u$ by $\\sqrt{u_x^2+u_y^2}$ before the dot product.',
    ],
    steps: ($, f) => [`$\\|u\\| = ${f($.L)}$, $\\hat u = (${f($.hx)}, ${f($.hy)})$, $D_{\\hat u} f = ${f($.Du)}$.`],
    sim: {
      scenario: 'plane',
      setup(slice, $) {
        slice.surfaceId = 'plane';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.probe = { x: 0, y: 0, z: 0 };
        slice.theta = Math.atan2($.uy, $.ux);
        return domain(slice, box);
      },
      read: (c) => ({ Du: c.Du }),
    },
    cases: [kase('sample', { a: 3, b: 4, ux: 3, uy: 4 }, { Du: 5 })],
  }),

  problem({
    id: 'ch2.steepest.mc',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.8 type',
    title: 'Direction of steepest ascent',
    kind: 'conceptual',
    level: 1,
    topics: ['gradient'],
    vars: {
      a: range(1, 4, 1),
      b: range(1, 4, 1),
      x0: range(1, 2, 1),
      y0: range(1, 2, 1),
    },
    derive: ($) => ({ fx: 2 * $.a * $.x0, fy: 2 * $.b * $.y0 }),
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}x^2 + ${coef(T.b)}y^2$ at $P = (${T.x0}, ${T.y0})$. In which direction does $f$ increase fastest?`,
    parts: [
      mc(
        'dir',
        [
          [1, 'Along $\\nabla f$'],
          [-1, 'Along $-\\nabla f$'],
          [0, 'Along a level curve'],
          [2, 'Independent of $P$'],
        ],
        1,
        { label: 'steepest ascent' },
      ),
    ],
    hints: [
      '$D_{\\hat u} f$ is largest when $\\hat u$ points the same way as $\\nabla f$.',
      'A level curve is the direction of zero change, and $-\\nabla f$ is steepest descent.',
    ],
    steps: () => ['Steepest ascent is the direction of $\\nabla f$.'],
    sim: {
      scenario: 'paraboloid',
      setup: loadParaboloid,
    },
    cases: [kase('sample', { a: 1, b: 1, x0: 1, y0: 1 }, { dir: 1 })],
  }),

  problem({
    id: 'ch2.level.tf',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.8 type',
    title: 'Level curves and $D_{\\hat u} f$',
    kind: 'conceptual',
    level: 1,
    topics: ['directional'],
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}x^2+y^2$. True or false: if $\\hat u$ is tangent to a level curve of $f$ at $P$, then $D_{\\hat u} f(P) = 0$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'Along a level curve $f$ is constant, so its rate of change in that direction is zero. Equivalently $\\hat u \\perp \\nabla f$.',
      'Changing the coefficient of $x^2$ rescales the gradient. It does not tilt the level-curve tangent off the perpendicular.',
    ],
    steps: () => ['True: $D_{\\hat u} f = \\nabla f \\cdot \\hat u = 0$ when $\\hat u$ is orthogonal to $\\nabla f$.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch2.linearize',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.5 type',
    title: 'Tangent-plane estimate',
    kind: 'numeric',
    level: 2,
    topics: ['linearization'],
    vars: {
      a: range(1, 2, 1),
      b: range(1, 2, 1),
      x0: range(0, 1, 1),
      y0: range(0, 1, 1),
      dx: range(0.1, 0.2, 0.1),
      dy: range(0.1, 0.2, 0.1),
    },
    derive: ($) => {
      const f0 = $.a * $.x0 * $.x0 + $.b * $.y0 * $.y0;
      const fx = 2 * $.a * $.x0;
      const fy = 2 * $.b * $.y0;
      return { f0, fx, fy, z: f0 + fx * $.dx + fy * $.dy };
    },
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}x^2 + ${coef(T.b)}y^2$. Using the tangent plane at $(${T.x0}, ${T.y0})$, estimate $f(${T.x0}+${T.dx}, ${T.y0}+${T.dy})$.`,
    parts: [num('z', ($) => $.z, '', { label: 'estimate', abs: 0.05 })],
    hints: [
      '$f(x_0+\\Delta x, y_0+\\Delta y) \\approx f(P) + f_x \\Delta x + f_y \\Delta y$.',
      'Use the partials at $(x_0,y_0)$, not at the shifted point.',
    ],
    steps: ($, f) => [`$f(P) = ${f($.f0)}$, $\\nabla f = (${f($.fx)}, ${f($.fy)})$, estimate $${f($.z)}$.`],
    sim: {
      scenario: 'paraboloid',
      setup: loadParaboloid,
      read: (c, s, $) => ({ z: c.f + c.fx * $.dx + c.fy * $.dy }),
    },
    cases: [kase('sample', { a: 1, b: 1, x0: 1, y0: 0, dx: 0.1, dy: 0.1 }, { z: 1.2 })],
  }),

  problem({
    id: 'ch2.mixed.du',
    exam: 'ch2',
    ch: '2',
    lab: 'gradient',
    src: 'Merino §2.8 type',
    title: 'Gradient, then $D_{\\hat u} f$',
    kind: 'numeric',
    level: 2,
    topics: ['gradient', 'directional'],
    vars: {
      a: range(1, 4, 1),
      x0: range(-2, 2, 1),
      y0: range(-2, 2, 1),
    },
    derive: ($) => {
      const fx = $.a * $.y0;
      const fy = $.a * $.x0;
      const ux = 1 / Math.SQRT2;
      const uy = 1 / Math.SQRT2;
      return { fx, fy, Du: fx * ux + fy * uy };
    },
    text: (T) =>
      `Let $f(x,y) = ${coef(T.a)}xy$ at $P = (${T.x0}, ${T.y0})$, and $\\hat u = (1/\\sqrt{2},\\, 1/\\sqrt{2})$. Find $\\nabla f$ and $D_{\\hat u} f$.`,
    parts: [
      num('fx', ($) => $.fx, '', { label: '$f_x$' }),
      num('fy', ($) => $.fy, '', { label: '$f_y$' }),
      num('Du', ($) => $.Du, '', { label: '$D_{\\hat u} f$', abs: 0.02 }),
    ],
    hints: [
      '$\\nabla f = (ay, ax)$ for $f = axy$. Then dot with $\\hat u$.',
      '$(1/\\sqrt{2}, 1/\\sqrt{2})$ is already a unit vector, so do not divide it again.',
    ],
    steps: ($, f) => [`$\\nabla f = (${f($.fx)}, ${f($.fy)})$, $D_{\\hat u} f = ${f($.Du)}$.`],
    sim: {
      scenario: 'xy',
      setup(slice, $) {
        slice.surfaceId = 'xy';
        slice.params = { a: $.a, b: 1, c: 0 };
        slice.probe = { x: $.x0, y: $.y0, z: 0 };
        slice.theta = Math.PI / 4;
        return domain(slice, box);
      },
      read: (c) => ({ fx: c.fx, fy: c.fy, Du: c.Du }),
    },
    cases: [kase('sample', { a: 1, x0: 1, y0: 1 }, { fx: 1, fy: 1, Du: Math.SQRT2 })],
  }),
];
