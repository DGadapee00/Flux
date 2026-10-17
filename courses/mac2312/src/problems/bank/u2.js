import { simpson } from '@flux/subjects/math/quadrature.js';
import {
  arcsinHalf,
  improperArea,
  improperSimpson,
  improperTail,
  partialLn,
  partsXSin,
  sinExact,
  sinSimpson,
  sinSimpson4,
  sinSimpsonPanels,
  sinSquaredHalf,
  sinTrap,
  sinTrap4,
  sinTrapPanels,
} from '../../math/calc2.js';
import { domain, kase, num, piTex, problem, range, sym, tf } from '../kit.js';
import { exprToTex } from '../engine.js';

const numFrame = { xMin: -0.3, xMax: 3.5, yMin: -0.35, yMax: 1.45, plane: 'xy' };
const impFrame = { xMin: 0.2, xMax: 8.8, yMin: -0.25, yMax: 1.35, plane: 'xy' };

function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

/** Antiderivative of a cos(bx) that is 0 at 0, with the coefficient in lowest terms. */
function cosAnti(a, b) {
  const g = gcd(a, b);
  const n = Math.round(a) / g;
  const d = Math.round(b) / g;
  const arg = b === 1 ? 'x' : `${b}*x`;
  if (d === 1 && n === 1) return `sin(${arg})`;
  if (d === 1) return `${n}*sin(${arg})`;
  return `${n}/${d}*sin(${arg})`;
}

/** The antiderivative of x·sin(ax) that is 0 at 0: sin(ax)/a² − x·cos(ax)/a. */
function partsKey(a) {
  if (a === 1) return 'sin(x)-x*cos(x)';
  return `sin(${a}*x)/${a * a}-x*cos(${a}*x)/${a}`;
}

export default [
  problem({
    id: 'u2.parts.xsin',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.1',
    title: 'Integration by parts',
    kind: 'numeric',
    level: 2,
    topics: ['parts'],
    vars: { n: range(1, 50, 1) },
    derive: ($) => ({ v: -$.n * Math.cos($.n) + Math.sin($.n) }),
    second: ($) => ({ v: simpson((x) => x * Math.sin(x), 0, $.n) }),
    text: (T) => String.raw`Find $\int_0^{${T.n}} x\sin x\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [
      'Integrate by parts. Choose $u$ as the factor that gets simpler when you differentiate it.',
      String.raw`Take $u=x$ and $dv=\sin x\,dx$. Then $du=dx$ and $v=-\cos x$.`,
      (T) => String.raw`So $\int x\sin x\,dx=-x\cos x+\int\cos x\,dx$. Evaluate from $0$ to $${T.n}$, in radians.`,
    ],
    steps: ($, f) => [
      String.raw`$-x\cos x+\sin x$ from $0$ to $n$ is $-n\cos n+\sin n$.`,
      String.raw`The value is $${f($.v)}$.`,
      "Simpson's rule on $x\\sin x$ agrees.",
    ],
    cases: [kase('0 to π', { n: Math.PI }, { v: partsXSin() })],
  }),

  problem({
    id: 'u2.trig.sq',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.2',
    title: 'A squared sine',
    kind: 'numeric',
    level: 2,
    topics: ['trig integrals'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => ({ v: ($.k * Math.PI) / 4 }),
    second: ($) => {
      const f = (x) => Math.sin(x) ** 2;
      let sum = 0;
      for (let i = 0; i < $.k; i++) sum += simpson(f, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
      return { v: sum };
    },
    text: (T) => String.raw`Find $\int_0^{${piTex(T.k, 2)}} \sin^2 x\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [
      'Lower the power of the sine with a double-angle identity first.',
      String.raw`$\sin^2 x=\tfrac12(1-\cos 2x)$.`,
      (T) => String.raw`An antiderivative is $x/2-\sin(2x)/4$. Evaluate it at $${piTex(T.k, 2)}$.`,
    ],
    steps: ($, f) => [
      String.raw`The double-angle form integrates to half the upper limit.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('quarter turn', { k: 1 }, { v: sinSquaredHalf() })],
  }),

  problem({
    id: 'u2.trigsub.arc',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.3',
    title: 'A trigonometric substitution',
    kind: 'numeric',
    level: 2,
    topics: ['trig sub'],
    vars: { c: range(0.1, 0.9, 0.01) },
    derive: ($) => ({ v: Math.asin($.c) }),
    second: ($) => ({ v: simpson((x) => 1 / Math.sqrt(1 - x * x), 0, $.c) }),
    text: (T) => String.raw`Find $\int_0^{${T.c}} \dfrac{1}{\sqrt{1-x^2}}\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [
      String.raw`The root $\sqrt{1-x^2}$ suggests $x=\sin\theta$.`,
      String.raw`Then $dx=\cos\theta\,d\theta$ and $\sqrt{1-x^2}=\cos\theta$. The integrand becomes $1$.`,
      (T) => String.raw`So the integral is the change in $\theta$, from $\arcsin 0$ to $\arcsin ${T.c}$.`,
    ],
    steps: ($, f) => [
      String.raw`$\arcsin c-\arcsin 0$ is the value.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('up to 1/2', { c: 0.5 }, { v: arcsinHalf() })],
  }),

  problem({
    id: 'u2.partial.ln',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.4',
    title: 'Partial fractions',
    kind: 'numeric',
    level: 2,
    topics: ['partial fractions'],
    vars: { b: range(1, 50, 1) },
    derive: ($) => ({ v: Math.log((2 * ($.b + 1)) / ($.b + 2)) }),
    second: ($) => ({ v: simpson((x) => 1 / ((x + 1) * (x + 2)), 0, $.b) }),
    text: (T) => String.raw`Find $\int_0^{${T.b}} \dfrac{1}{(x+1)(x+2)}\,dx$.`,
    parts: [num('v', ($) => $.v, '', { label: 'value', abs: 1e-6 })],
    hints: [
      'Split the fraction into partial fractions first.',
      String.raw`Write $\dfrac{1}{(x+1)(x+2)}=\dfrac{A}{x+1}+\dfrac{B}{x+2}$. Cover up each factor to find $A$ and $B$.`,
      (T) => String.raw`Each piece integrates to a logarithm. Evaluate from $0$ to $${T.b}$.`,
    ],
    steps: ($, f) => [
      String.raw`$\ln(b+1)-\ln(b+2)-\ln(1/2)$ is the value.`,
      String.raw`The value is $${f($.v)}$.`,
    ],
    cases: [kase('unit interval', { b: 1 }, { v: partialLn() })],
  }),

  problem({
    id: 'u2.num.trap',
    exam: 'u2',
    ch: '3',
    lab: 'numint',
    src: 'OpenStax Calc 2 §3.6',
    title: 'A trapezoidal estimate',
    kind: 'numeric',
    level: 1,
    topics: ['numerical'],
    vars: { n: range(2, 100, 2) },
    derive: ($) => ({ trap: sinTrap($.n), err: Math.abs(sinTrap($.n) - sinExact()) }),
    second: ($) => ({ trap: sinTrapPanels($.n), err: Math.abs(sinTrapPanels($.n) - sinExact()) }),
    text: (T) =>
      String.raw`Estimate $\int_0^{\pi} \sin x\,dx$ with the trapezoidal rule and $n=${T.n}$. Also give the absolute error against the exact value $2$.`,
    parts: [
      num('trap', ($) => $.trap, '', { label: 'trapezoid', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [
      'The trapezoidal rule joins neighbouring samples with straight lines.',
      (T) => String.raw`With $n=${T.n}$, $h=\pi/${T.n}$. The end samples weigh $1$ and the interior samples weigh $2$, all times $h/2$.`,
      'The error is the absolute difference between your estimate and $2$.',
    ],
    steps: ($, f) => [
      String.raw`The weighted sum is $${f($.trap)}$.`,
      String.raw`The absolute error is $${f($.err)}$.`,
      'Adding the panels one by one agrees.',
    ],
    sim: {
      scenario: 'coarse',
      setup(slice, $) {
        slice.n = $.n;
        return domain(slice, numFrame);
      },
      read: (c) => ({ trap: c.trap, err: c.trapErr }),
    },
    cases: [kase('n=4', { n: 4 }, { trap: sinTrap4(), err: Math.abs(sinTrap4() - 2) })],
  }),

  problem({
    id: 'u2.num.simp',
    exam: 'u2',
    ch: '3',
    lab: 'numint',
    src: 'OpenStax Calc 2 §3.6',
    title: 'A Simpson estimate',
    kind: 'numeric',
    level: 2,
    topics: ['numerical'],
    vars: { n: range(2, 100, 2) },
    derive: ($) => ({ simp: sinSimpson($.n), err: Math.abs(sinSimpson($.n) - sinExact()) }),
    second: ($) => ({ simp: sinSimpsonPanels($.n), err: Math.abs(sinSimpsonPanels($.n) - sinExact()) }),
    text: (T) =>
      String.raw`Estimate $\int_0^{\pi} \sin x\,dx$ with Simpson's rule and $n=${T.n}$. Also give the absolute error against the exact value $2$.`,
    parts: [
      num('simp', ($) => $.simp, '', { label: 'Simpson', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [
      "Simpson's rule fits a parabola through each pair of panels.",
      (T) => String.raw`With $n=${T.n}$, $h=\pi/${T.n}$. The weights run $1,4,2,4,\ldots,4,1$, all times $h/3$.`,
      'The error is the absolute difference between your estimate and $2$.',
    ],
    steps: ($, f) => [
      String.raw`The weighted sum is $${f($.simp)}$.`,
      String.raw`The absolute error is $${f($.err)}$.`,
      'The paired-panel sum agrees.',
    ],
    sim: {
      scenario: 'coarse',
      setup(slice, $) {
        slice.n = $.n;
        return domain(slice, numFrame);
      },
      read: (c) => ({ simp: c.simp, err: c.simpErr }),
    },
    cases: [kase('n=4', { n: 4 }, { simp: sinSimpson4(), err: Math.abs(sinSimpson4() - 2) })],
  }),

  problem({
    id: 'u2.num.closer',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.6',
    title: 'Which rule is closer',
    kind: 'conceptual',
    level: 1,
    topics: ['numerical'],
    vars: { n: range(2, 100, 2) },
    derive: ($) => ({
      closer: Math.abs(sinSimpson($.n) - sinExact()) < Math.abs(sinTrap($.n) - sinExact()) ? 1 : 0,
    }),
    second: ($) => ({
      closer: Math.abs(sinSimpsonPanels($.n) - 2) < Math.abs(sinTrapPanels($.n) - 2) ? 1 : 0,
    }),
    text: (T) =>
      String.raw`True or false: for $\int_0^{\pi}\sin x\,dx$ with $n=${T.n}$ panels, Simpson's rule has a smaller absolute error than the trapezoidal rule.`,
    parts: [tf('closer', ($) => (Math.abs(sinSimpson($.n) - 2) < Math.abs(sinTrap($.n) - 2) ? 1 : 0), { label: 'Simpson is closer' })],
    hints: [
      'With the same panels, a parabola follows a curved arc more closely than a chord does.',
      (T) => String.raw`Compute both estimates with $n=${T.n}$, then compare each one with $2$.`,
    ],
    steps: () => ['On this hump the parabola follows the curve more closely than the chord, at every even panel count here.'],
    cases: [kase('n=4', { n: 4 }, { closer: 1 })],
  }),

  problem({
    id: 'u2.imp.tail',
    exam: 'u2',
    ch: '3',
    lab: 'improper',
    src: 'OpenStax Calc 2 §3.7',
    title: 'A finite piece of an improper integral',
    kind: 'numeric',
    level: 1,
    topics: ['improper'],
    vars: { b: range(2, 8, 0.1) },
    derive: ($) => ({ area: improperArea($.b), tail: improperTail($.b) }),
    second: ($) => ({ area: improperSimpson($.b), tail: 1 - improperArea($.b) }),
    text: (T) =>
      String.raw`For $\int_1^{${T.b}} x^{-2}\,dx$, give the area and the tail $1/B$ that is still missing from $\int_1^{\infty} x^{-2}\,dx$.`,
    parts: [
      num('area', ($) => $.area, '', { label: 'area', abs: 1e-6 }),
      num('tail', ($) => $.tail, '', { label: 'tail', abs: 1e-6 }),
    ],
    hints: [
      'Find an antiderivative, then evaluate it at the two limits.',
      String.raw`An antiderivative of $x^{-2}$ is $-1/x$.`,
      'The integral all the way to infinity is $1$. The tail is the part the finite area has not reached.',
    ],
    steps: ($, f) => [
      String.raw`Area $1-1/B=${f($.area)}$.`,
      String.raw`Tail $1/B=${f($.tail)}$. They add to $1$.`,
    ],
    sim: {
      scenario: 'near',
      setup(slice, $) {
        slice.b = $.b;
        return domain(slice, impFrame);
      },
      read: (c) => ({ area: c.area, tail: c.tail }),
    },
    cases: [kase('B=2', { b: 2 }, { area: 0.5, tail: 0.5 })],
  }),

  problem({
    id: 'u2.sym.anti',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.2',
    title: 'An antiderivative of a cosine',
    kind: 'derivation',
    level: 2,
    topics: ['antiderivatives', 'symbolic'],
    vars: { a: range(1, 10, 1), b: range(1, 5, 1) },
    derive: ($) => ({ x: 1, val: ($.a / $.b) * Math.sin($.b) }),
    second: ($) => ({
      formula: cosAnti($.a, $.b),
      val: simpson((t) => $.a * Math.cos($.b * t), 0, 1),
    }),
    text: (T) => {
      const coeff = Number(T.a) === 1 ? '' : T.a;
      const arg = Number(T.b) === 1 ? 'x' : `${T.b}x`;
      return String.raw`Let $f(x)=${coeff}\cos(${arg})$. Write the antiderivative that is $0$ at $x=0$, as a formula in $x$, and give its value at $x=1$.`;
    },
    parts: [
      sym('formula', ($) => cosAnti($.a, $.b), ['x'], ($) => ($.a / $.b) * Math.sin($.b * $.x), {
        label: 'antiderivative',
      }),
      num('val', ($) => $.val, '', { label: 'value at 1', abs: 1e-6 }),
    ],
    hints: [
      String.raw`Undo the chain rule: $\dfrac{d}{dx}\sin(bx)=b\cos(bx)$.`,
      (T, $) => String.raw`So an antiderivative of $\cos(${$.b === 1 ? '' : $.b}x)$ is $\sin(${$.b === 1 ? '' : $.b}x)$ divided by $${$.b}$.`,
      (T, $) => String.raw`${$.a === 1 ? '' : `Multiply by $${$.a}$ and reduce the fraction. `}It is already $0$ at $x=0$. For the number, substitute $x=1$.`,
    ],
    steps: ($, f) => [
      String.raw`The antiderivative is $${exprToTex(cosAnti($.a, $.b), ['x'])}$.`,
      String.raw`At $x=1$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=2, b=2', { a: 2, b: 2 }, { formula: 'sin(2*x)', val: Math.sin(2) }, {
        accept: { formula: ['sin(2x)'] },
        reject: { formula: ['sin(2*x)+C'] },
      }),
    ],
  }),
  problem({
    id: 'u2.sym.parts',
    exam: 'u2',
    ch: '3',
    src: 'OpenStax Calc 2 §3.1',
    title: 'Integration by parts, as a formula',
    kind: 'derivation',
    level: 3,
    topics: ['parts', 'symbolic'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ x: 1, val: Math.sin($.a) / ($.a * $.a) - Math.cos($.a) / $.a }),
    second: ($) => ({
      formula: partsKey($.a),
      val: simpson((t) => t * Math.sin($.a * t), 0, 1),
    }),
    text: (T, $) =>
      String.raw`Let $f(x)=x\sin(${$.a === 1 ? '' : $.a}x)$. Write the antiderivative that is $0$ at $x=0$, as a formula in $x$, and give its value at $x=1$.`,
    parts: [
      sym('formula', ($) => partsKey($.a), ['x'], ($) => Math.sin($.a * $.x) / ($.a * $.a) - ($.x * Math.cos($.a * $.x)) / $.a, {
        label: 'antiderivative',
      }),
      num('val', ($) => $.val, '', { label: 'value at 1', abs: 1e-6 }),
    ],
    hints: [
      'Integrate by parts. Choose $u$ as the factor that gets simpler when you differentiate it.',
      (T, $) => {
        const ax = $.a === 1 ? 'x' : `${$.a}x`;
        return String.raw`Take $u=x$ and $dv=\sin(${ax})\,dx$. Then $du=dx$ and $v=-\cos(${ax})${$.a === 1 ? '' : `/${$.a}`}$.`;
      },
      String.raw`The parts formula leaves $\int v\,du$, a cosine integral. Check that your result is $0$ at $x=0$, so no constant is needed.`,
    ],
    steps: ($, f) => [
      String.raw`$uv=-x\cos(${$.a === 1 ? '' : $.a}x)${$.a === 1 ? '' : `/${$.a}`}$, and $\int v\,du$ adds the sine term.`,
      String.raw`The antiderivative is $${exprToTex(partsKey($.a), ['x'])}$.`,
      String.raw`At $x=1$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=1', { a: 1 }, { formula: 'sin(x)-x*cos(x)', val: Math.sin(1) - Math.cos(1) }, {
        accept: { formula: ['-x*cos(x)+sin(x)'] },
        reject: { formula: ['x*cos(x)-sin(x)', 'sin(x)-x*cos(x)+C'] },
      }),
    ],
  }),
];
