import { problem, range, num, mc, tf, kase, domain, coef, prod } from '../kit.js';

const box = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };

export default [
  problem({
    id: 'ch2.partials.second',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'Second partials of a paraboloid',
    kind: 'numeric',
    level: 2,
    topics: ['partials'],
    vars: {
      a: range(1, 3, 1),
      b: range(1, 3, 1),
      x0: range(-1, 1, 1),
      y0: range(-1, 1, 1),
    },
    derive: ($) => ({ fxx: 2 * $.a, fyy: 2 * $.b, fxy: 0 }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2+${coef(T.b)}y^2$. Find $f_{xx}$, $f_{yy}$, and $f_{xy}$ at $(${T.x0}, ${T.y0})$.`,
    parts: [
      num('fxx', ($) => $.fxx, '', { label: '$f_{xx}$' }),
      num('fyy', ($) => $.fyy, '', { label: '$f_{yy}$' }),
      num('fxy', ($) => $.fxy, '', { label: '$f_{xy}$', abs: 0.02 }),
    ],
    hints: ['Differentiate $f_x=2ax$ and $f_y=2by$ once more. Mixed is zero because neither first partial sees the other variable.'],
    steps: ($, f) => [`$f_{xx}=${f($.fxx)}$, $f_{yy}=${f($.fyy)}$, $f_{xy}=${f($.fxy)}$.`],
    sim: {
      scenario: 'paraboloid',
      setup(slice, $) {
        slice.surfaceId = 'paraboloid';
        slice.params = { a: $.a, b: $.b, c: 0 };
        slice.probe = { x: $.x0, y: $.y0, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ fxx: c.fxx, fyy: c.fyy, fxy: c.fxy }),
    },
    cases: [kase('sample', { a: 1, b: 2, x0: 1, y0: 0 }, { fxx: 2, fyy: 4, fxy: 0 })],
  }),

  problem({
    id: 'ch2.partials.mixed',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'A mixed partial that is not zero',
    kind: 'numeric',
    level: 2,
    topics: ['partials'],
    vars: {
      a: range(1, 4, 1),
      x0: range(-1, 2, 1),
      y0: range(-1, 2, 1),
    },
    derive: ($) => ({ fxy: 2 * $.a * $.x0, fx: 2 * $.a * $.x0 * $.y0 }),
    text: (T) =>
      `Let $f(x,y)=${coef(T.a)}x^2 y$. Find $f_{xy}$ at $(${T.x0}, ${T.y0})$.`,
    parts: [num('fxy', ($) => $.fxy, '', { label: '$f_{xy}$', abs: 0.02 })],
    hints: ['$f_x=2axy$, then differentiate in $y$. Or $f_y=ax^2$, then differentiate in $x$. Schwarz says the two orders match.'],
    steps: ($, f, T) => [`$f_x=${prod(2, T.a)}xy$, so $f_{xy}=${prod(2, T.a)}x=${f($.fxy)}$.`],
    sim: {
      scenario: 'prod2',
      setup(slice, $) {
        slice.surfaceId = 'prod2';
        slice.params = { a: $.a, b: 1, c: 0 };
        slice.probe = { x: $.x0, y: $.y0, z: 0 };
        return domain(slice, box);
      },
      read: (c) => ({ fxy: c.fxy }),
    },
    cases: [kase('sample', { a: 1, x0: 2, y0: 1 }, { fxy: 4 })],
  }),

  problem({
    id: 'ch2.partials.schwarz',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'Schwarz on mixed partials',
    kind: 'conceptual',
    level: 1,
    topics: ['partials'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if the mixed partials of $f$ are continuous on a disk about $P$, then $f_{xy}(P)=f_{yx}(P)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['This is the equality of mixed partials when they are continuous.'],
    steps: () => ['True — that is Theorem 12.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch2.partials.slice',
    exam: 'ch2',
    ch: '2',
    lab: 'partials',
    src: 'Merino §2.5 type',
    title: 'Which slice is $f_x$?',
    kind: 'conceptual',
    level: 1,
    topics: ['partials'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `The partial $\\partial f/\\partial x$ at $P$ is the derivative of which one-variable slice?`,
    parts: [
      mc(
        'slice',
        [
          ['Py', '$P_y$: hold $y$ fixed, vary $x$'],
          ['Qx', '$Q_x$: hold $x$ fixed, vary $y$'],
          ['both', 'Either — they give the same number'],
          ['neither', 'Neither — you need both variables moving'],
        ],
        'Py',
        { label: 'slice' },
      ),
    ],
    hints: ['$P_y(x)=f(x,y)$ with $y$ locked. Its ordinary derivative is $f_x$.'],
    steps: () => ['$P_y$, the slice that holds $y$ fixed.'],
    cases: [kase('sample', { dummy: 1 }, { slice: 'Py' })],
  }),

  problem({
    id: 'ch2.chain.gprime',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: "$g'$ along the unit circle",
    kind: 'numeric',
    level: 2,
    topics: ['chain'],
    vars: { k: range(0, 3, 1) },
    derive: ($) => {
      const t = ($.k * Math.PI) / 6;
      return { t, gp: Math.cos(2 * t) };
    },
    text: (T, $) =>
      `Let $f(x,y)=xy$ and $\\gamma(t)=(\\cos t,\\sin t)$. For $g=f\\circ\\gamma$, find $g'(t)$ at $t=${['0', '\\pi/6', '\\pi/3', '\\pi/2'][Number(T.k)]}$.`,
    parts: [num('gp', ($) => $.gp, '', { label: "$g'(t)$", abs: 0.03 })],
    hints: ["$g'(t)=f_x x'+f_y y'$. Here $f_x=y$, $f_y=x$, $x'=-\\sin t$, $y'=\\cos t$."],
    steps: ($, f) => [`$g'(t)=\\cos 2t=${f($.gp)}$.`],
    sim: {
      scenario: 'xy-circle',
      setup(slice, $) {
        slice.mode = 'curve';
        slice.surfaceId = 'xy';
        slice.curveId = 'circle';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.t = $.t;
        return domain(slice, box);
      },
      read: (c) => ({ gp: c.gp }),
    },
    cases: [kase('sample', { k: 0 }, { gp: 1 })],
  }),

  problem({
    id: 'ch2.chain.parab',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: "$g'$ along a parabola",
    kind: 'numeric',
    level: 2,
    topics: ['chain'],
    vars: { t0: range(0.5, 1, 0.5) },
    derive: ($) => ({ gp: 2 * $.t0 + 4 * $.t0 * $.t0 * $.t0 }),
    text: (T) =>
      `Let $f(x,y)=x^2+y^2$ and $\\gamma(t)=(t, t^2)$. For $g=f\\circ\\gamma$, find $g'(${T.t0})$.`,
    parts: [num('gp', ($) => $.gp, '', { label: "$g'$", abs: 0.03 })],
    hints: ["$f_x=2x$, $f_y=2y$, $x'=1$, $y'=2t$, so $g'=2t+4t^3$."],
    steps: ($, f) => [`$g'=2t+4t^3=${f($.gp)}$.`],
    sim: {
      scenario: 'para-parab',
      setup(slice, $) {
        slice.mode = 'curve';
        slice.surfaceId = 'paraboloid';
        slice.curveId = 'parabola';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.t0 = -1.5;
        slice.t1 = 1.5;
        slice.t = $.t0;
        return domain(slice, { xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.5 });
      },
      read: (c) => ({ gp: c.gp }),
    },
    cases: [kase('sample', { t0: 1 }, { gp: 6 })],
  }),

  problem({
    id: 'ch2.chain.polarhs',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: 'Polar $h_s$ for $x^2+y^2$',
    kind: 'numeric',
    level: 2,
    topics: ['chain'],
    vars: {
      s0: range(0.5, 1.5, 0.5),
      deg: range(0, 180, 90),
    },
    derive: ($) => ({ hs: 2 * $.s0, ht: 0, t: ($.deg * Math.PI) / 180 }),
    text: (T) =>
      `Let $f(x,y)=x^2+y^2$ and $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Find $\\partial h/\\partial s$ at $s=${T.s0}$, $t=${T.deg}^\\circ$.`,
    parts: [num('hs', ($) => $.hs, '', { label: '$h_s$', abs: 0.03 })],
    hints: ['$h(s,t)=s^2$, so $h_s=2s$ at every angle.'],
    steps: ($, f) => [`$h_s=2s=${f($.hs)}$.`],
    sim: {
      scenario: 'para-polar',
      setup(slice, $) {
        slice.mode = 'map';
        slice.surfaceId = 'paraboloid';
        slice.innerId = 'polar';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.sMin = 0.3;
        slice.sMax = 2;
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.s = $.s0;
        slice.t = $.t;
        return domain(slice, box);
      },
      read: (c) => ({ hs: c.hs }),
    },
    cases: [kase('sample', { s0: 1, deg: 0 }, { hs: 2 })],
  }),

  problem({
    id: 'ch2.chain.polarht',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: 'Polar $h_t$ for $xy$',
    kind: 'numeric',
    level: 2,
    topics: ['chain'],
    vars: { k: range(0, 2, 1) },
    derive: ($) => {
      const t = ($.k * Math.PI) / 4;
      const s = 1;
      return { s, t, ht: s * s * Math.cos(2 * t) };
    },
    text: (T, $) =>
      `Let $f(x,y)=xy$ and $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Find $\\partial h/\\partial t$ at $s=1$, $t=${['0', '\\pi/4', '\\pi/2'][Number(T.k)]}$.`,
    parts: [num('ht', ($) => $.ht, '', { label: '$h_t$', abs: 0.03 })],
    hints: ['$h_t=f_x x_t+f_y y_t$ with $x_t=-s\\sin t$, $y_t=s\\cos t$. At $s=1$ this is $\\cos 2t$.'],
    steps: ($, f) => [`$h_t=\\cos 2t=${f($.ht)}$.`],
    sim: {
      scenario: 'xy-polar',
      setup(slice, $) {
        slice.mode = 'map';
        slice.surfaceId = 'xy';
        slice.innerId = 'polar';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.sMin = 0.3;
        slice.sMax = 2;
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.s = $.s;
        slice.t = $.t;
        return domain(slice, box);
      },
      read: (c) => ({ ht: c.ht }),
    },
    cases: [kase('sample', { k: 0 }, { ht: 1 })],
  }),

  problem({
    id: 'ch2.chain.dot',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: 'Chain rule as a dot product',
    kind: 'conceptual',
    level: 1,
    topics: ['chain'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $g=f\\circ\\gamma$, then $g'(t)=\\nabla f(\\gamma(t))\\cdot\\gamma'(t)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ["Write out $\\nabla f\\cdot\\gamma'=(f_x, f_y)\\cdot(x', y')$."],
    steps: () => ["True — that is Theorem 15 rewritten with a dot product."],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch2.chain.version',
    exam: 'ch2',
    ch: '2',
    lab: 'chain',
    src: 'Merino §2.7 type',
    title: 'Which chain-rule version?',
    kind: 'conceptual',
    level: 1,
    topics: ['chain'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `Let $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Finding $\\partial h/\\partial s$ and $\\partial h/\\partial t$ is which version of the chain rule?`,
    parts: [
      mc(
        'ver',
        [
          ['one', 'First version: $g=f\\circ\\gamma$ along a curve'],
          ['two', 'Second version: inner map $g\\colon\\mathbb{R}^2\\to\\mathbb{R}^2$'],
          ['none', 'Neither — this is just a directional derivative'],
          ['both', 'They are the same theorem'],
        ],
        'two',
        { label: 'version' },
      ),
    ],
    hints: ['The inner map takes two parameters $(s,t)$ to a point in the plane. That is the second version.'],
    steps: () => ['Second version: $g(s,t)=(s\\cos t,\\, s\\sin t)$ and $h=f\\circ g$.'],
    cases: [kase('sample', { dummy: 1 }, { ver: 'two' })],
  }),
];
