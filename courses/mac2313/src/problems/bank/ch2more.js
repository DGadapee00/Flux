import { problem, range, num, mc, tf, kase, domain, DEG, coef, prod } from '../kit.js';

const plane = { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };

function loadPolar(slice, $) {
  slice.probe = { x: $.x0, y: $.y0, z: 0 };
  const m = Math.max(2.5, Math.abs($.x0), Math.abs($.y0)) + 0.5;
  return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
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
      x0: range(-4, 4, 1),
      y0: range(-4, 4, 1),
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
    hints: [
      '$r=\\sqrt{x^2+y^2}$. $\\theta$ is the angle from the positive $x$-axis, taken in $[0,2\\pi)$.',
      'A point in the third or fourth quadrant has $\\theta$ past $180^\\circ$. Add $360^\\circ$ if the calculator returns a negative angle.',
    ],
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
      r: range(1, 4, 1),
      deg: range(0, 350, 10),
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
    hints: [
      '$x=r\\cos\\theta$, $y=r\\sin\\theta$. Convert degrees to radians first, or use a known angle.',
      'Cosine is the horizontal component and sine is the vertical one. Watch the quadrant.',
    ],
    steps: ($, f) => [`$(x,y)=(${f($.x)}, ${f($.y)})$.`],
    sim: {
      scenario: 'q1',
      setup(slice, $) {
        slice.probe = { x: $.x, y: $.y, z: 0 };
        const m = $.r + 0.5;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Take the point $(${T.n}, 1)$, which is not the origin. True or false: there is a unique pair $(r,\\theta)$ with $r>0$ and $\\theta\\in[0,2\\pi)$ such that $x=r\\cos\\theta$ and $y=r\\sin\\theta$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'This is Theorem 10. The origin is the only point excluded.',
      'Adding $2\\pi$ to $\\theta$ lands outside $[0,2\\pi)$, so it is not a second pair in the required range.',
    ],
    steps: () => ['True — that is the content of the polar-coordinate theorem.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { deg: range(0, 350, 5) },
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
    hints: [
      '$\\hat r$ is the unit vector pointing from the origin toward $P$.',
      'Its length is $1$, so the components are $\\cos\\theta$ and $\\sin\\theta$, not the coordinates of a longer vector.',
    ],
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
    vars: { deg: range(0, 350, 5) },
    derive: ($) => {
      const t = $.deg * DEG;
      return { t, x: Math.cos(t), y: Math.sin(t) };
    },
    text: (T) =>
      `Let $\\gamma(t)=(\\cos t,\\sin t)$. Find $\\gamma(t)$ at the angle $${T.deg}^\\circ$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x(t)$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y(t)$', abs: 0.02 }),
    ],
    hints: [
      'Plug the given angle into $(\\cos t,\\sin t)$. Convert degrees to radians first.',
      'The first component is cosine and the second is sine.',
    ],
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
    cases: [kase('sample', { deg: 90 }, { x: 0, y: 1 })],
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
    vars: { t0: range(-1.4, 1.4, 0.05) },
    derive: ($) => {
      const xp = 1;
      const yp = 2 * $.t0;
      return { xp, yp, slope: yp / xp };
    },
    text: (T) =>
      `Let $\\gamma(t)=(t, t^2)$. Find the slope of the tangent line at $t=${T.t0}$.`,
    parts: [num('slope', ($) => $.slope, '', { label: "$y'/x'$", abs: 0.02 })],
    hints: [
      "$x'=1$, $y'=2t$, so the slope is $2t$.",
      'The slope uses the parameter $t$, not the $y$-coordinate $t^2$.',
    ],
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
    vars: { t: range(-2, 2, 0.04) },
    derive: ($) => {
      const xp = 2 * $.t;
      const yp = 3 * $.t * $.t - 3;
      let kind = 'oblique';
      if (Math.abs(xp) < 1e-9 && Math.abs(yp) < 1e-9) kind = 'cusp';
      else if (Math.abs(xp) < 1e-9) kind = 'vertical';
      else if (Math.abs(yp) < 1e-9) kind = 'horizontal';
      return { kind };
    },
    text: (T) =>
      `Let $\\gamma(t)=(t^2, t^3-3t)$. At $t=${T.t}$, is the tangent horizontal, vertical, oblique, or a cusp?`,
    parts: [
      mc(
        'kind',
        [
          ['horizontal', 'Horizontal'],
          ['vertical', 'Vertical'],
          ['oblique', 'Neither — oblique'],
          ['cusp', 'Cusp (speed zero)'],
        ],
        ($) => $.kind,
        { label: 'tangent' },
      ),
    ],
    hints: [
      "A vertical tangent has $x'=0$ and $y'\\neq 0$. A horizontal tangent has $y'=0$ and $x'\\neq 0$.",
      "Here $x'=2t$ and $y'=3t^2-3$. Both vanish together nowhere on this curve, so the tangent is never a cusp.",
    ],
    steps: ($, f, T) => [`At $t=${T.t}$ the tangent is ${$.kind}.`],
    sim: {
      scenario: 'cubic',
      setup(slice, $) {
        slice.curveId = 'cubic';
        slice.t0 = -2;
        slice.t1 = 2;
        slice.t = $.t;
        return domain(slice, { xMin: -1, xMax: 5, yMin: -3, yMax: 3 });
      },
      read: (c) => ({ kind: c.tangent }),
    },
    cases: [kase('sample', { t: 0 }, { kind: 'vertical' })],
  }),

  problem({
    id: 'ch2.param.length',
    exam: 'ch2',
    ch: '2',
    lab: 'parametric',
    src: 'Merino §2.3 type',
    title: 'Arc length along the unit circle',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { tEnd: range(0.1, 6.2, 0.1) },
    derive: ($) => ({ L: $.tEnd }),
    text: (T) =>
      `Let $\\gamma(t)=(\\cos t, \\sin t)$. Find the length from $t=0$ to $t=${T.tEnd}$.`,
    parts: [num('L', ($) => $.L, '', { label: '$L(\\gamma)$', abs: 0.05 })],
    hints: [
      "$\\sqrt{x'^2+y'^2}=1$, so the integral is just the length of the interval.",
      'Speed $1$ times the elapsed parameter is the length. Do not multiply by an extra $2\\pi$ unless the interval has that length.',
    ],
    steps: ($, f) => [`Speed is $1$, so $L=${f($.L)}$.`],
    sim: {
      scenario: 'circle',
      setup(slice, $) {
        slice.curveId = 'circle';
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.tEnd;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ L: c.Lsimp }),
    },
    cases: [kase('sample', { tEnd: 2 * Math.PI }, { L: 2 * Math.PI })],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    derive: () => ({ x: 0, y: 0 }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2+${coef(T.b)}y^2$. Find the critical point $(x,y)$.`,
    parts: [
      num('x', ($) => $.x, '', { label: '$x$', abs: 0.02 }),
      num('y', ($) => $.y, '', { label: '$y$', abs: 0.02 }),
    ],
    hints: [
      'Solve $\\nabla f=(0,0)$. Here $f_x=2ax$, $f_y=2by$.',
      'With $a$ and $b$ nonzero, each equation forces the matching variable to be $0$.',
    ],
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
    vars: { a: range(1, 8, 1), b: range(1, 8, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2-${coef(T.b)}y^2$. What does the Hessian test say at $(0,0)$?`,
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
    hints: [
      '$D=f_{xx}f_{yy}-(f_{xy})^2$. Here $f_{xx}=2a>0$ and $f_{yy}=-2b<0$, so $D<0$.',
      'A negative $D$ is a saddle, whatever the sign of $f_{xx}$.',
    ],
    steps: () => ['$D<0$, so a saddle.'],
    sim: {
      scenario: 'saddle',
      setup(slice, $) {
        slice.surfaceId = 'saddle';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.probe = { x: 0, y: 0, z: 0 };
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ kind: c.kind }),
    },
    cases: [kase('sample', { a: 1, b: 1 }, { kind: 'saddle' })],
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
    vars: { x0: range(-2, 2, 0.5), y0: range(-2, 2, 0.5) },
    derive: ($) => ({ D: 36 * $.x0 * $.y0 - 9 }),
    text: (T) =>
      `Let $f(x,y)=x^3+y^3-3xy$. Compute $D=f_{xx}f_{yy}-(f_{xy})^2$ at $(${T.x0}, ${T.y0})$.`,
    parts: [num('D', ($) => $.D, '', { label: '$D$', abs: 0.05 })],
    hints: [
      '$f_{xx}=6x$, $f_{yy}=6y$, $f_{xy}=-3$, so $D=36xy-9$.',
      'Evaluate at the given point. The mixed partial is the constant $-3$, not a function of $x$ or $y$.',
    ],
    steps: ($, f) => [`$D=36xy-9=${f($.D)}$.`],
    sim: {
      scenario: 'cubic',
      setup(slice, $) {
        slice.surfaceId = 'cubic';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.probe = { x: $.x0, y: $.y0, z: 0 };
        return domain(slice, { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
      },
      read: (c) => ({ D: c.D }),
    },
    cases: [kase('sample', { x0: 1, y0: 1 }, { D: 27 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}x^2-y^2$. True or false: if $\\nabla f(a,b)=(0,0)$, then $f$ has a local min or max at $(a,b)$.`,
    parts: [tf('tf', false, { label: 'statement' })],
    hints: [
      'A saddle is a critical point that is neither a min nor a max.',
      'This $f$ has $\\nabla f=(0,0)$ at the origin, and it takes both signs in every neighbourhood.',
    ],
    steps: () => ['False — Theorem 13 is one direction only.'],
    cases: [kase('sample', { n: 1 }, { tf: 0 })],
  }),
];
