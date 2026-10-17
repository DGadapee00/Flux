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
    hints: [
      'Take the first partials, then differentiate each one again.',
      (T, $) => String.raw`$f_x=${2 * $.a}x$ and $f_y=${2 * $.b}y$.`,
      String.raw`Differentiate $f_x$ in $x$ for $f_{xx}$, and in $y$ for $f_{xy}$.`,
    ],
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
    hints: [
      String.raw`$f_{xy}$ means: differentiate in $x$, then in $y$.`,
      (T, $) => String.raw`$f_x=${2 * $.a}xy$.`,
      (T) => String.raw`Differentiate that in $y$, then evaluate at $(${T.x0}, ${T.y0})$.`,
    ],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}x^2 y$. True or false: if the mixed partials of $f$ are continuous on a disk about $P$, then $f_{xy}(P)=f_{yx}(P)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'Recall the hypothesis of the theorem on mixed partials, often named for Clairaut or Schwarz.',
      'Compare the hypothesis in the statement with the one in the theorem.',
    ],
    steps: () => ['True — that is Theorem 12.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}x^2+y$. The partial $\\partial f/\\partial x$ at $P$ is the derivative of which one-variable slice?`,
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
    hints: [
      String.raw`$\partial f/\partial x$ is the rate of change of $f$ when only $x$ moves.`,
      'So the slice must hold $y$ fixed and let $x$ vary.',
    ],
    steps: () => ['$P_y$, the slice that holds $y$ fixed.'],
    cases: [kase('sample', { n: 1 }, { slice: 'Py' })],
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
    vars: { deg: range(0, 350, 5) },
    derive: ($) => {
      const t = $.deg * Math.PI / 180;
      return { t, gp: Math.cos(2 * t) };
    },
    text: (T) =>
      `Let $f(x,y)=xy$ and $\\gamma(t)=(\\cos t,\\sin t)$. For $g=f\\circ\\gamma$, find $g'(t)$ at the angle $${T.deg}^\\circ$.`,
    parts: [num('gp', ($) => $.gp, '', { label: "$g'(t)$", abs: 0.03 })],
    hints: [
      String.raw`Chain rule along a curve: $g'(t)=f_x\,x'(t)+f_y\,y'(t)$.`,
      String.raw`Here $f_x=y$, $f_y=x$, $x'(t)=-\sin t$, and $y'(t)=\cos t$.`,
      (T) => String.raw`Substitute $x=\cos t$ and $y=\sin t$, then evaluate at $t=${T.deg}^\circ$.`,
    ],
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
    cases: [kase('sample', { deg: 0 }, { gp: 1 })],
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
    vars: { t0: range(-1.4, 1.4, 0.05) },
    derive: ($) => ({ gp: 2 * $.t0 + 4 * $.t0 * $.t0 * $.t0 }),
    text: (T) =>
      `Let $f(x,y)=x^2+y^2$ and $\\gamma(t)=(t, t^2)$. For $g=f\\circ\\gamma$, find $g'(${T.t0})$.`,
    parts: [num('gp', ($) => $.gp, '', { label: "$g'$", abs: 0.03 })],
    hints: [
      String.raw`Chain rule along a curve: $g'(t)=f_x\,x'(t)+f_y\,y'(t)$.`,
      String.raw`Here $f_x=2x$, $f_y=2y$, $x'(t)=1$, and $y'(t)=2t$.`,
      (T) => String.raw`Substitute $x=t$ and $y=t^2$, then evaluate at $t=${T.t0}$.`,
    ],
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
      s0: range(0.4, 1.9, 0.1),
      deg: range(0, 330, 30),
    },
    derive: ($) => ({ hs: 2 * $.s0, ht: 0, t: ($.deg * Math.PI) / 180 }),
    text: (T) =>
      `Let $f(x,y)=x^2+y^2$ and $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Find $\\partial h/\\partial s$ at $s=${T.s0}$, $t=${T.deg}^\\circ$.`,
    parts: [num('hs', ($) => $.hs, '', { label: '$h_s$', abs: 0.03 })],
    hints: [
      String.raw`$h_s=f_x\,x_s+f_y\,y_s$, with $x=s\cos t$ and $y=s\sin t$.`,
      String.raw`Here $x_s=\cos t$ and $y_s=\sin t$.`,
      (T) => String.raw`Simplify with $\cos^2t+\sin^2t=1$, then use $s=${T.s0}$.`,
    ],
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
    vars: { s0: range(1, 4, 1), deg: range(0, 330, 15) },
    derive: ($) => {
      const t = ($.deg * Math.PI) / 180;
      return { s: $.s0, t, ht: $.s0 * $.s0 * Math.cos(2 * t) };
    },
    text: (T) =>
      `Let $f(x,y)=xy$ and $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Find $\\partial h/\\partial t$ at $s=${T.s0}$, $t=${T.deg}^\\circ$.`,
    parts: [num('ht', ($) => $.ht, '', { label: '$h_t$', abs: 0.03 })],
    hints: [
      String.raw`$h_t=f_x\,x_t+f_y\,y_t$, with $x=s\cos t$ and $y=s\sin t$.`,
      String.raw`Here $f_x=y$, $f_y=x$, $x_t=-s\sin t$, and $y_t=s\cos t$.`,
      (T) => String.raw`The sum simplifies to $s^2\cos 2t$. Evaluate at $s=${T.s0}$ and $t=${T.deg}^\circ$.`,
    ],
    steps: ($, f) => [`$h_t=\\cos 2t=${f($.ht)}$.`],
    sim: {
      scenario: 'xy-polar',
      setup(slice, $) {
        slice.mode = 'map';
        slice.surfaceId = 'xy';
        slice.innerId = 'polar';
        slice.params = { a: 1, b: 1, c: 0 };
        slice.sMin = 0.3;
        slice.sMax = 4;
        slice.t0 = 0;
        slice.t1 = 2 * Math.PI;
        slice.s = $.s;
        slice.t = $.t;
        return domain(slice, box);
      },
      read: (c) => ({ ht: c.ht }),
    },
    cases: [kase('sample', { s0: 1, deg: 0 }, { ht: 1 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}xy$ and let $\\gamma$ be a smooth curve. True or false: if $g=f\\circ\\gamma$, then $g'(t)=\\nabla f(\\gamma(t))\\cdot\\gamma'(t)$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      String.raw`Write both sides in components: $\nabla f=(f_x, f_y)$ and $\gamma'=(x', y')$.`,
      'Expand the dot product and compare it with the chain rule along a curve.',
    ],
    steps: () => ["True — that is Theorem 15 rewritten with a dot product."],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y)=${coef(T.n)}(x^2+y^2)$ and $h(s,t)=f(s\\cos t,\\, s\\sin t)$. Finding $\\partial h/\\partial s$ and $\\partial h/\\partial t$ is which version of the chain rule?`,
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
    hints: [
      'Count the parameters of the inner map.',
      String.raw`The inner map here is $(s,t)\mapsto(s\cos t,\, s\sin t)$.`,
    ],
    steps: () => ['Second version: $g(s,t)=(s\\cos t,\\, s\\sin t)$ and $h=f\\circ g$.'],
    cases: [kase('sample', { n: 1 }, { ver: 'two' })],
  }),
];
