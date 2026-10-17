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
import { coef, domain, kase, num, problem, range } from '../kit.js';

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
    vars: { side: range(6, 55, 1) },
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
    hints: [
      'Write the volume as a function of the cut $x$. Then find where its derivative is zero.',
      (T) => String.raw`A cut $x$ leaves a base $${T.side}-2x$ on a side, and the height is $x$. So $V(x)=x(${T.side}-2x)^2$.`,
      String.raw`Set $V'(x)=0$. One root leaves no sheet to fold. Keep the other, and evaluate $V$ there.`,
    ],
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
    vars: { a: range(2, 51, 1) },
    derive: ($) => ({ y: sqrtLinear($.a) }),
    second: ($) => ({ y: sqrtLinearQuotient($.a) }),
    text: (T, $) =>
      String.raw`Use the tangent line to $\sqrt{x}$ at $x=${$.a * $.a}$ to approximate $\sqrt{${$.a * $.a + 1}}$.`,
    parts: [num('y', ($) => $.y, '', { label: 'approximation', abs: 1e-6 })],
    hints: [
      String.raw`Near a point $x_0$, $f(x)\approx f(x_0)+f'(x_0)(x-x_0)$.`,
      (T, $) => String.raw`Take $x_0=${$.a * $.a}$, where $\sqrt{x_0}=${$.a}$ exactly.`,
      (T, $) => String.raw`The slope there is $1/(2\sqrt{x_0})=1/${2 * $.a}$, and the step is $1$.`,
    ],
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
    vars: { k: range(3, 150, 3) },
    derive: ($) => ({ x: cubicCritical($.k), y: cubicCriticalValue($.k) }),
    second: ($) => {
      const x = cubicCriticalSearch($.k);
      return { x, y: x * x * x - $.k * x };
    },
    text: (T) => String.raw`Let $f(x)=x^3-${coef(T.k)}x$. Find the positive critical point, and $f$ there.`,
    parts: [
      num('x', ($) => $.x, '', { label: 'critical point', abs: 1e-4 }),
      num('y', ($) => $.y, '', { label: '$f$', abs: 1e-4 }),
    ],
    hints: [
      String.raw`A critical point is where $f'(x)=0$.`,
      (T) => String.raw`$f'(x)=3x^2-${T.k}$.`,
      (T) => String.raw`Solve $3x^2=${T.k}$. Keep the positive root, then evaluate $f$ there.`,
    ],
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
    vars: { p: range(0, 6, 1), q: range(8, 15, 1) },
    derive: ($) => ({ c: squareMvt($.p, $.q) }),
    second: ($) => ({ c: squareMvtQuotient($.p, $.q) }),
    text: (T) =>
      String.raw`For $f(x)=x^2$ on $[${T.p},${T.q}]$, the Mean Value Theorem gives a $c$ where $f'(c)$ equals the secant slope. Find $c$.`,
    parts: [num('c', ($) => $.c, '', { label: '$c$', abs: 1e-6 })],
    hints: [
      'Start with the slope of the secant line across the whole interval.',
      (T) => String.raw`The secant slope is $\dfrac{${T.q}^2-${T.p}^2}{${T.q}-${T.p}}$.`,
      String.raw`Set $2c$ equal to that slope and solve for $c$.`,
    ],
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
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ x: cubicInflection($.a) }),
    second: ($) => ({ x: cubicInflectionSearch($.a) }),
    text: (T) => String.raw`Let $f(x)=x^3+${coef(T.a)}x^2$. Find the $x$-coordinate of the inflection point.`,
    parts: [num('x', ($) => $.x, '', { label: 'inflection', abs: 1e-4 })],
    hints: [
      String.raw`An inflection point is where $f''$ changes sign.`,
      (T, $) => String.raw`$f''(x)=6x+${2 * $.a}$.`,
      'Set it to zero. A line crosses zero once, and its sign changes there.',
    ],
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
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ lim: differenceLimit($.a) }),
    second: ($) => ({ lim: differenceLimitHopital($.a) }),
    text: (T) => String.raw`Find $\lim_{x\to ${T.a}}\dfrac{x^2-${T.a}^2}{x-${T.a}}$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 1e-4 })],
    hints: [
      String.raw`Substitution gives $0/0$. Use L'Hôpital's rule, or factor the top.`,
      String.raw`L'Hôpital: differentiate the top and the bottom separately. The top gives $2x$. The bottom gives $1$.`,
      (T) => String.raw`Evaluate $2x/1$ at $x=${T.a}$.`,
    ],
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
    vars: { k: range(1, 50, 1) },
    derive: ($) => ({ lim: sincLimit($.k) }),
    second: ($) => ({ lim: sincLimitHopital($.k) }),
    text: (T) => String.raw`Find $\lim_{x\to 0}\dfrac{\sin(${coef(T.k)}x)}{x}$.`,
    parts: [num('lim', ($) => $.lim, '', { label: 'limit', abs: 1e-4 })],
    hints: [
      String.raw`Substitution gives $0/0$, so L'Hôpital's rule applies.`,
      String.raw`Differentiate the top with the chain rule. The bottom's derivative is $1$.`,
      String.raw`Evaluate at $x=0$, where $\cos 0=1$.`,
    ],
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
    vars: { c: range(2, 11, 1), x0: range(2, 6, 1) },
    derive: ($) => ({ x1: newtonSqrt($.c, $.x0) }),
    second: ($) => ({ x1: newtonSqrtStep($.c, $.x0) }),
    text: (T) =>
      String.raw`Apply one step of Newton's method to $f(x)=x^2-${T.c}$, starting at $x=${T.x0}$.`,
    parts: [num('x1', ($) => $.x1, '', { label: 'next guess', abs: 1e-6 })],
    hints: [
      String.raw`One Newton step is $x_1=x_0-f(x_0)/f'(x_0)$.`,
      (T, $) => String.raw`Here $f(${$.x0})=${$.x0 * $.x0 - $.c}$ and $f'(${$.x0})=${2 * $.x0}$.`,
      'Divide those, then subtract the quotient from the starting point.',
    ],
    steps: ($, f) => [
      String.raw`$(${$.x0}+${$.c}/${$.x0})/2=${f($.x1)}$.`,
      "Subtracting $f/f'$ gives the same guess.",
    ],
    cases: [kase('c=2, start at 2', { c: 2, x0: 2 }, { x1: 1.5 })],
  }),
];
