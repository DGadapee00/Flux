import {
  boxBestCut,
  boxBestCutSearch,
  boxVolume,
  cubicCritical,
  cubicCriticalSearch,
  cubicCriticalValue,
  cubicInflection,
  cubicInflectionSearch,
  differenceLimit,
  differenceLimitHopital,
  newtonSqrt,
  newtonSqrtStep,
  sincLimit,
  sincLimitHopital,
  sqrtLinear,
  sqrtLinearQuotient,
  squareMvt,
  squareMvtQuotient,
} from '../../math/calc1.js';
import { domain, kase, num, problem, range } from '../kit.js';

export default [
  problem({
    id: 'u3.box',
    exam: 'u3',
    ch: '4',
    lab: 'box',
    src: 'OpenStax Calc 1 §4.7',
    title: 'An open box',
    kind: 'numeric',
    level: 2,
    topics: ['optimization'],
    vars: { side: range(12, 24, 6) },
    derive: ($) => {
      const cut = boxBestCut($.side);
      return { cut, vol: boxVolume($.side, cut) };
    },
    second: ($) => {
      const cut = boxBestCutSearch($.side);
      return { cut, vol: boxVolume($.side, cut) };
    },
    text: (T) =>
      String.raw`A square sheet of side $${T.side}$ inches has a square cut from each corner. The sides fold up into an open box. Find the cut, in inches, that gives the greatest volume, and that volume in cubic inches.`,
    parts: [
      num('cut', ($) => $.cut, 'in', { label: 'cut', abs: 1e-3 }),
      num('vol', ($) => $.vol, 'in^3', { label: 'volume', abs: 1e-2 }),
    ],
    hints: [String.raw`If the sheet has side $s$, then $V(x)=x(s-2x)^2$. The useful root of $V'(x)=0$ is $x=s/6$.`],
    steps: ($, f) => [
      String.raw`$V'(x)=(s-2x)(s-6x)=0$ gives the cut $${f($.cut)}$ inches.`,
      String.raw`The volume there is $${f($.vol)}$. A scan of $V$ peaks at the same cut.`,
    ],
    sim: {
      scenario: 'peak',
      setup(slice, $) {
        slice.side = $.side;
        slice.x = $.side / 6;
        const span = 1.5 * $.side;
        return domain(slice, { xMin: -1, xMax: span, yMin: -2, yMax: 0.62 * $.side, plane: 'xy' });
      },
      read: (c) => ({ cut: c.best, vol: c.vmax }),
    },
    cases: [kase('12 inch sheet', { side: 12 }, { cut: 2, vol: 128 })],
  }),

  problem({
    id: 'u3.linear',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.2',
    title: 'Linear approximation',
    kind: 'numeric',
    level: 2,
    topics: ['linear approximation'],
    vars: { a: range(2, 5, 1) },
    derive: ($) => ({ y: sqrtLinear($.a) }),
    second: ($) => ({ y: sqrtLinearQuotient($.a) }),
    text: (T, $) =>
      String.raw`Use the tangent line to $\sqrt{x}$ at $x=${$.a * $.a}$ to approximate $\sqrt{${$.a * $.a + 1}}$.`,
    parts: [num('y', ($) => $.y, '', { label: 'approximation', abs: 1e-6 })],
    hints: [String.raw`$\dfrac{d}{dx}\sqrt{x}=1/(2\sqrt{x})$. Add that slope times $1$.`],
    steps: ($, f) => [
      String.raw`At $x=${$.a * $.a}$ the slope is $1/(2\cdot${$.a})$.`,
      String.raw`The tangent line gives $${f($.y)}$.`,
    ],
    cases: [kase('near 4', { a: 2 }, { y: 2.25 })],
  }),

  problem({
    id: 'u3.extrema',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.3',
    title: 'A critical point',
    kind: 'numeric',
    level: 2,
    topics: ['extrema'],
    vars: { k: range(3, 12, 3) },
    derive: ($) => ({ x: cubicCritical($.k), y: cubicCriticalValue($.k) }),
    second: ($) => {
      const x = cubicCriticalSearch($.k);
      return { x, y: x * x * x - $.k * x };
    },
    text: (T) => String.raw`Let $f(x)=x^3-${T.k}x$. Find the positive critical point, and $f$ there.`,
    parts: [
      num('x', ($) => $.x, '', { label: 'critical point', abs: 1e-4 }),
      num('y', ($) => $.y, '', { label: '$f$', abs: 1e-4 }),
    ],
    hints: ['Differentiate. Set the derivative equal to zero.'],
    steps: ($, f) => [
      String.raw`$f'(x)=3x^2-${$.k}=0$ gives $x=${f($.x)}$.`,
      String.raw`$f$ there is $${f($.y)}$. Bisection on $f'$ finds the same point.`,
    ],
    cases: [kase('k=3', { k: 3 }, { x: 1, y: -2 })],
  }),

  problem({
    id: 'u3.mvt',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.4',
    title: 'Mean value theorem',
    kind: 'numeric',
    level: 2,
    topics: ['mean value theorem'],
    vars: { p: range(1, 2, 1), q: range(4, 6, 1) },
    derive: ($) => ({ c: squareMvt($.p, $.q) }),
    second: ($) => ({ c: squareMvtQuotient($.p, $.q) }),
    text: (T) =>
      String.raw`For $f(x)=x^2$ on $[${T.p},${T.q}]$, the Mean Value Theorem gives a $c$ where $f'(c)$ equals the secant slope. Find $c$.`,
    parts: [num('c', ($) => $.c, '', { label: '$c$', abs: 1e-6 })],
    hints: [String.raw`The secant slope is $(q^2-p^2)/(q-p)$, and $f'(c)=2c$.`],
    steps: ($, f) => [
      String.raw`The secant slope is $${$.p}+${$.q}$. Half of that is $c=${f($.c)}$.`,
      'Dividing that slope by $2$ gives the same $c$.',
    ],
    cases: [kase('[1, 5]', { p: 1, q: 5 }, { c: 3 })],
  }),

  problem({
    id: 'u3.inflect',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.5',
    title: 'An inflection point',
    kind: 'numeric',
    level: 2,
    topics: ['curve sketching'],
    vars: { a: range(3, 6, 1) },
    derive: ($) => ({ x: cubicInflection($.a) }),
    second: ($) => ({ x: cubicInflectionSearch($.a) }),
    text: (T) => String.raw`Let $f(x)=x^3+${T.a}x^2$. Find the $x$-coordinate of the inflection point.`,
    parts: [num('x', ($) => $.x, '', { label: 'inflection', abs: 1e-4 })],
    hints: ['Set the second derivative equal to zero.'],
    steps: ($, f) => [
      String.raw`$6x+2\cdot${$.a}=0$ gives $x=${f($.x)}$.`,
      'Bisection on the second derivative finds the same point.',
    ],
    cases: [kase('a=3', { a: 3 }, { x: -1 })],
  }),

  problem({
    id: 'u3.lhopital',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.8',
    title: "L'Hôpital, a cancelled factor",
    kind: 'numeric',
    level: 2,
    topics: ["l'hôpital"],
    vars: { a: range(2, 5, 1) },
    derive: ($) => ({ lim: differenceLimit($.a) }),
    second: ($) => ({ lim: differenceLimitHopital($.a) }),
    text: (T) => String.raw`Find $\lim_{x\to ${T.a}}\dfrac{x^2-${T.a}^2}{x-${T.a}}$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 1e-4 })],
    hints: [String.raw`The form is $0/0$. Differentiate the top and the bottom, or cancel $x-a$.`],
    steps: ($, f) => [
      String.raw`Cancelling leaves $x+${$.a}$, so the limit is $${f($.lim)}$.`,
      "Differentiating the top and the bottom agrees.",
    ],
    cases: [kase('a=2', { a: 2 }, { lim: 4 })],
  }),

  problem({
    id: 'u3.sinc',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.8',
    title: "L'Hôpital, sine over x",
    kind: 'numeric',
    level: 2,
    topics: ["l'hôpital"],
    vars: { k: range(2, 5, 1) },
    derive: ($) => ({ lim: sincLimit($.k) }),
    second: ($) => ({ lim: sincLimitHopital($.k) }),
    text: (T) => String.raw`Find $\lim_{x\to 0}\dfrac{\sin(${T.k}x)}{x}$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 1e-4 })],
    hints: [String.raw`The form is $0/0$. The derivative of $\sin(kx)$ at $0$ is $k$.`],
    steps: ($, f) => [
      String.raw`The limit is $${f($.lim)}$.`,
      'A difference quotient for the numerator, over $1$, agrees.',
    ],
    cases: [kase('k=2', { k: 2 }, { lim: 2 })],
  }),

  problem({
    id: 'u3.newton',
    exam: 'u3',
    ch: '4',
    src: 'OpenStax Calc 1 §4.9',
    title: "One step of Newton's method",
    kind: 'numeric',
    level: 2,
    topics: ["newton's method"],
    vars: { c: range(2, 5, 1), x0: range(2, 4, 1) },
    derive: ($) => ({ x1: newtonSqrt($.c, $.x0) }),
    second: ($) => ({ x1: newtonSqrtStep($.c, $.x0) }),
    text: (T) =>
      String.raw`Apply one step of Newton's method to $f(x)=x^2-${T.c}$, starting at $x=${T.x0}$.`,
    parts: [num('x1', ($) => $.x1, '', { label: 'next guess', abs: 1e-6 })],
    hints: [String.raw`$x_1=x_0-f(x_0)/f'(x_0)$, and $f'(x)=2x$.`],
    steps: ($, f) => [
      String.raw`$(${$.x0}+${$.c}/${$.x0})/2=${f($.x1)}$.`,
      "Subtracting $f/f'$ gives the same guess.",
    ],
    cases: [kase('c=2, start at 2', { c: 2, x0: 2 }, { x1: 1.5 })],
  }),
];
