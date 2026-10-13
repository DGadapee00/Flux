import { problem, range, num, mc, tf, kase, domain, DEG, coef, prod } from '../kit.js';

const plane = { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };

function loadPolar(slice, $) {
  slice.probe = { x: $.x0, y: $.y0, z: 0 };
  return domain(slice, plane);
}

export default [
  problem({
    id: 'ch2.polar.rth',
    exam: 'ch2',
    ch: '2',
    lab: 'polar',
    src: 'Merino §2.2 type',
    title: 'Cartesian to polar',
    kind: 'numeric',
    level: 1,
    topics: ['polar'],
    vars: {
      x0: range(-2, 2, 1),
      y0: range(-2, 2, 1),
    },
    valid: ($) => !($.x0 === 0 && $.y0 === 0),
    derive: ($) => {
      const r = Math.hypot($.x0, $.y0);
      let th = Math.atan2($.y0, $.x0);
      if (th < 0) th += 2 * Math.PI;
      return { r, th, thDeg: (th * 180) / Math.PI };
    },
    text: (T) =>
      `Write $(${T.x0}, ${T.y0})$ in polar form. Give $r$ and $\\theta\\in[0,360)$ in degrees.`,
    parts: [
      num('r', ($) => $.r, '', { label: '$r$', abs: 0.02 }),
      num('thDeg', ($) => $.thDeg, '°', { label: '$\\theta$', wrap: 360, abs: 1 }),
    ],
    hints: ['$r=\\sqrt{x^2+y^2}$. $\\theta$ is the angle from the positive $x$-axis, taken in $[0,2\\pi)$.'],
    steps: ($, f) => [`$r=${f($.r)}$, $\\theta=${f($.thDeg)}^\\circ$.`],
    sim: {
      scenario: 'q1',
      setup: loadPolar,
      read: (c) => ({ r: c.r, thDeg: c.thDeg }),
    },
    cases: [kase('sample', { x0: 0, y0: 1 }, { r: 1, thDeg: 90 })],
  }),

  problem({
    id: 'ch2.polar.cart',
    exam: 'ch2',
    ch: '2',
    lab: 'polar',
    src: 'Merino §2.2 type',
    title: 'Polar to Cartesian',
    kind: 'numeric',
    level: 1,
    topics: ['polar'],
    vars: {
      r: range(1, 3, 1),
      deg: range(0, 315, 45),
    },
    valid: ($) => $.r > 0,
    derive: ($) => {
      const th = $.deg * DEG;
      return { x: $.r * Math.cos(th), y: $.r * Math.sin(th), th };
    },
    text: (T) => `Convert $r=${T.r}$, $\\theta=${T.deg}^\\circ$ to Cartesian $(x,y)$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y$', abs: 0.02 }),
    ],
    hints: ['$x=r\\cos\\theta$, $y=r\\sin\\theta$. Convert degrees to radians first, or use a known angle.'],
    steps: ($, f) => [`$(x,y)=(${f($.x)}, ${f($.y)})$.`],
    sim: {
      scenario: 'q1',
      setup(slice, $) {
        slice.probe = { x: $.x, y: $.y, z: 0 };
        return domain(slice, { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 });
      },
      read: (c) => ({ x: c.back.x, y: c.back.y }),
    },
    cases: [kase('sample', { r: 2, deg: 180 }, { x: -2, y: 0 })],
  }),

  problem({
    id: 'ch2.polar.unique',
    exam: 'ch2',
    ch: '2',
    lab: 'polar',
    src: 'Merino §2.2 type',
    title: 'Uniqueness of $(r,\\theta)$',
    kind: 'conceptual',
    level: 1,
    topics: ['polar'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: for every $(x,y)\\neq(0,0)$ there is a unique pair $(r,\\theta)$ with $r>0$ and $\\theta\\in[0,2\\pi)$ such that $x=r\\cos\\theta$ and $y=r\\sin\\theta$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['This is Theorem 10. The origin is the only point excluded.'],
    steps: () => ['True — that is the content of the polar-coordinate theorem.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch2.polar.rhat',
    exam: 'ch2',
    ch: '2',
    lab: 'polar',
    src: 'Merino §2.2 type',
    title: 'The unit vector $\\hat r$',
    kind: 'numeric',
    level: 2,
    topics: ['polar'],
    vars: { deg: range(0, 270, 90) },
    derive: ($) => {
      const th = $.deg * DEG;
      return { rx: Math.cos(th), ry: Math.sin(th) };
    },
    text: (T) =>
      `At angle $\\theta=${T.deg}^\\circ$, what are the components of $\\hat r=(\\cos\\theta,\\sin\\theta)$?`,
    parts: [
      num('rx', ($) => $.rx, '', { label: '$\\hat r_x$', abs: 0.02 }),
      num('ry', ($) => $.ry, '', { label: '$\\hat r_y$', abs: 0.02 }),
    ],
    hints: ['$\\hat r$ is the unit vector pointing from the origin toward $P$.'],
    steps: ($, f) => [`$\\hat r=(${f($.rx)}, ${f($.ry)})$.`],
    sim: {
      scenario: 'q1',
      setup(slice, $) {
        slice.probe = { x: $.rx, y: $.ry, z: 0 };
        return domain(slice, plane);
      },
      read: (c) => ({ rx: c.rh.x, ry: c.rh.y }),
    },
    cases: [kase('sample', { deg: 90 }, { rx: 0, ry: 1 })],
  }),

  problem({
    id: 'ch2.param.point',
    exam: 'ch2',
    ch: '2',
    lab: 'parametric',
    src: 'Merino §2.3 type',
    title: 'A point on $\\gamma$',
    kind: 'numeric',
    level: 1,
    topics: ['parametric'],
    vars: { k: range(0, 3, 1) },
    derive: ($) => {
      const t = ($.k * Math.PI) / 2;
      return { t, x: Math.cos(t), y: Math.sin(t) };
    },
    text: (T, $) =>
      `Let $\\gamma(t)=(\\cos t,\\sin t)$. Find $\\gamma(t)$ at $t=${['0', '\\pi/2', '\\pi', '3\\pi/2'][Number(T.k)]}$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x(t)$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y(t)$', abs: 0.02 }),
    ],
    hints: ['Plug the given $t$ into $(\\cos t,\\sin t)$.'],
    steps: ($, f) => [`$\\gamma(t)=(${f($.x)}, ${f($.y)})$.`],
    sim: {
      scenario: 'circle',
      setup(slice, $) {
        slice.curveId = 'circle';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.t;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ x: c.x, y: c.y }),
    },
    cases: [kase('sample', { k: 1 }, { x: 0, y: 1 })],
  }),

  problem({
    id: 'ch2.param.tangent',
    exam: 'ch2',
    ch: '2',
    lab: 'parametric',
    src: 'Merino §2.3 type',
    title: 'Slope of the tangent',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { t0: range(0.5, 1.5, 0.5) },
    derive: ($) => {
      const xp = 1;
      const yp = 2 * $.t0;
      return { xp, yp, slope: yp / xp };
    },
    text: (T) =>
      `Let $\\gamma(t)=(t, t^2)$. Find the slope of the tangent line at $t=${T.t0}$.`,
    parts: [num('slope', ($) => $.slope, '', { label: "$y'/x'$", abs: 0.02 })],
    hints: ["$x'=1$, $y'=2t$, so the slope is $2t$."],
    steps: ($, f) => [`$\\text{slope}=2t=${f($.slope)}$.`],
    sim: {
      scenario: 'parabola',
      setup(slice, $) {
        slice.curveId = 'parabola';
        slice.t0 = -1.5;
        slice.t1 = 1.5;
        slice.t = $.t0;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.5 });
      },
      read: (c) => ({ slope: c.slope }),
    },
    cases: [kase('sample', { t0: 1 }, { slope: 2 })],
  }),

  problem({
    id: 'ch2.param.hv',
    exam: 'ch2',
    ch: '2',
    lab: 'parametric',
    src: 'Merino §2.3 type',
    title: 'Horizontal or vertical tangent',
    kind: 'conceptual',
    level: 2,
    topics: ['parametric'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `Let $\\gamma(t)=(t^2, t^3-3t)$. At $t=0$, is the tangent horizontal or vertical?`,
    parts: [
      mc(
        'kind',
        [
          ['horizontal', 'Horizontal'],
          ['vertical', 'Vertical'],
          ['oblique', 'Neither — oblique'],
          ['cusp', 'Undefined'],
        ],
        'vertical',
        { label: 'tangent' },
      ),
    ],
    hints: ["$x'=2t$ vanishes at $t=0$, while $y'=3t^2-3$ is $-3\\neq 0$."],
    steps: () => ['Vertical: $x\'(0)=0$ and $y\'(0)\\neq 0$.'],
    sim: {
      scenario: 'cubic',
      setup(slice) {
        slice.curveId = 'cubic';
        slice.t0 = -2;
        slice.t1 = 2;
        slice.t = 0;
        return domain(slice, { xMin: -1, xMax: 5, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ kind: c.tangent }),
    },
    cases: [kase('sample', { dummy: 1 }, { kind: 'vertical' })],
  }),

  problem({
    id: 'ch2.param.length',
    exam: 'ch2',
    ch: '2',
    lab: 'parametric',
    src: 'Merino §2.3 type',
    title: 'Arc length of the unit circle',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ L: 2 * Math.PI }),
    text: () =>
      `Let $\\gamma(t)=(\\cos t, \\sin t)$ on $[0,2\\pi]$. Find the length $L(\\gamma)$.`,
    parts: [num('L', ($) => $.L, '', { label: '$L(\\gamma)$', abs: 0.05 })],
    hints: ["$\\sqrt{x'^2+y'^2}=1$, so the integral is just the length of the interval."],
    steps: () => ['$L=\\int_0^{2\\pi} 1\\,dt=2\\pi$.'],
    sim: {
      scenario: 'circle',
      setup(slice) {
        slice.curveId = 'circle';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = 2 * Math.PI;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('sample', { dummy: 1 }, { L: 2 * Math.PI })],
  }),

  problem({
    id: 'ch2.ext.crit',
    exam: 'ch2',
    ch: '2',
    lab: 'extrema',
    src: 'Merino §2.6 type',
    title: 'Find the critical point',
    kind: 'numeric',
    level: 1,
    topics: ['extrema'],
    vars: { a: range(1, 3, 1), b: range(1, 3, 1) },
    derive: () => ({ x: 0, y: 0 }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2+${coef(T.b)}y^2$. Find the critical point $(x,y)$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y$', abs: 0.02 }),
    ],
    hints: ['Solve $\\nabla f=(0,0)$. Here $f_x=2ax$, $f_y=2by$.'],
    steps: () => ['$(0,0)$ is the only solution.'],
    sim: {
      scenario: 'paraboloid',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.probe = { x: 0, y: 0, z: 0 };
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ x: c.pts[0]?.x ?? NaN, y: c.pts[0]?.y ?? NaN }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { x: 0, y: 0 })],
  }),

  problem({
    id: 'ch2.ext.class',
    exam: 'ch2',
    ch: '2',
    lab: 'extrema',
    src: 'Merino §2.6 type',
    title: 'Classify the critical point',
    kind: 'conceptual',
    level: 2,
    topics: ['extrema'],
    vars: { dummy: range(1, 1, 1) },
    text: () => `Let $f(x,y)=x^2-y^2$. What does the Hessian test say at $(0,0)$?`,
    parts: [
      mc(
        'kind',
        [
          ['min', 'Local minimum'],
          ['max', 'Local maximum'],
          ['saddle', 'Saddle'],
          ['inconclusive', 'Inconclusive ($D=0$)'],
        ],
        'saddle',
        { label: 'classification' },
      ),
    ],
    hints: ['$D=f_{xx}f_{yy}-(f_{xy})^2=2\\cdot(-2)-0=-4<0$.'],
    steps: () => ['$D=-4<0$, so a saddle.'],
    sim: {
      scenario: 'saddle',
      setup(slice) {
        slice.surfaceId = 'saddle';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.probe = { x: 0, y: 0, z: 0 };
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ kind: c.kind }),
    },
    cases: [kase('sample', { dummy: 1 }, { kind: 'saddle' })],
  }),

  problem({
    id: 'ch2.ext.D',
    exam: 'ch2',
    ch: '2',
    lab: 'extrema',
    src: 'Merino §2.6 type',
    title: 'Compute $D$',
    kind: 'numeric',
    level: 2,
    topics: ['extrema'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ D: 27 }),
    text: () =>
      `Let $f(x,y)=x^3+y^3-3xy$. Compute $D=f_{xx}f_{yy}-(f_{xy})^2$ at $(1,1)$.`,
    parts: [num('D', ($) => $.D, '', { label: '$D(1,1)$', abs: 0.05 })],
    hints: ['$f_{xx}=6x$, $f_{yy}=6y$, $f_{xy}=-3$.'],
    steps: () => ['$D=6\\cdot6-(-3)^2=36-9=27$.'],
    sim: {
      scenario: 'cubic',
      setup(slice) {
        slice.surfaceId = 'cubic';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.probe = { x: 1, y: 1, z: 0 };
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ D: c.D }),
    },
    cases: [kase('sample', { dummy: 1 }, { D: 27 })],
  }),

  problem({
    id: 'ch2.ext.necessary',
    exam: 'ch2',
    ch: '2',
    lab: 'extrema',
    src: 'Merino §2.6 type',
    title: 'Necessary, not sufficient',
    kind: 'conceptual',
    level: 1,
    topics: ['extrema'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $\\nabla f(a,b)=(0,0)$, then $f$ has a local min or max at $(a,b)$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: ['A saddle is a critical point that is neither a min nor a max.'],
    steps: () => ['False — Theorem 13 is one direction only.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 0 })],
  }),
];
