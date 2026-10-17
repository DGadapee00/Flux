import { sampleFn, taylorError, taylorHorner, taylorSum } from '../../math/calc2.js';
import { domain, kase, num, problem, range, sumTerms, sym, tf, xPow } from '../kit.js';
import { exprToTex } from '../engine.js';

function expTaylor(a) {
  return sumTerms(['1', xPow(a, 1, 1), xPow(a * a, 2, 2)]);
}

/** Order-3 Maclaurin polynomial of sin(ax): ax − a³x³/6. */
function sinTaylor(a) {
  return sumTerms([xPow(a, 1, 1), xPow(-(a ** 3), 6, 3)]);
}

/** Order-4 Maclaurin polynomial of cos(ax): 1 − a²x²/2 + a⁴x⁴/24. */
function cosTaylor(a) {
  return sumTerms(['1', xPow(-(a ** 2), 2, 2), xPow(a ** 4, 24, 4)]);
}

/** Order-3 Maclaurin polynomial of ln(1+ax): ax − a²x²/2 + a³x³/3. */
function lnTaylor(a) {
  return sumTerms([xPow(a, 1, 1), xPow(-(a ** 2), 2, 2), xPow(a ** 3, 3, 3)]);
}

/** Order-2 Taylor polynomial of 1/x about c: 1/c − (x−c)/c² + (x−c)²/c³. */
function recipTaylor(c) {
  if (c === 1) return '1-(x-1)+(x-1)^2';
  return `1/${c}-(x-${c})/${c * c}+(x-${c})^2/${c ** 3}`;
}

/** The term-by-term series of ln(1+u), through order n. */
function lnSeries(u, n) {
  let s = 0;
  for (let k = 1; k <= n; k++) s += ((k % 2 ? 1 : -1) * u ** k) / k;
  return s;
}

/** a·x as TeX, without a coefficient of 1. */
const axTex = (a) => (a === 1 ? 'x' : `${a}x`);

const frame = { xMin: -1.8, xMax: 2.4, yMin: -1.6, yMax: 1.6, plane: 'xy' };

export default [
  problem({
    id: 'u3.tay.line',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Tangent line for sine',
    kind: 'numeric',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 1, $.x), err: taylorError('sin', 0, 1, $.x) }),
    second: ($) => ({ poly: taylorHorner('sin', 0, 1, $.x), err: Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 1, $.x)) }),
    text: (T) =>
      String.raw`The Maclaurin polynomial of order $1$ for $\sin x$ is the tangent line at $0$. Evaluate it at $x=${T.x}$, and give the absolute error against $\sin x$.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_1', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [
      String.raw`The order-1 Maclaurin polynomial is $f(0)+f'(0)\,x$.`,
      String.raw`For $\sin x$, $\sin 0=0$ and $\cos 0=1$.`,
      (T) => String.raw`Evaluate at $x=${T.x}$. Compare with $\sin ${T.x}$, in radians.`,
    ],
    steps: ($, f) => [
      String.raw`$P_1(${f($.x)})=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
      'Horner form gives the same value.',
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 1;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly, err: c.err }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 0.5, err: Math.abs(Math.sin(0.5) - 0.5) })],
  }),

  problem({
    id: 'u3.tay.cubic',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 3 for sine',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 3, $.x) }),
    second: ($) => ({ poly: taylorHorner('sin', 0, 3, $.x) }),
    text: (T) => String.raw`Evaluate the Maclaurin polynomial of order $3$ for $\sin x$ at $x=${T.x}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_3', abs: 1e-6 })],
    hints: [
      String.raw`The Maclaurin polynomial is $\sum f^{(k)}(0)\,x^k/k!$, here through $k=3$.`,
      String.raw`The derivatives of $\sin x$ at $0$ cycle $0,1,0,-1$.`,
      (T) => String.raw`Keep the $x$ and $x^3$ terms, then substitute $x=${T.x}$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_3=${f($.poly)}$.`,
      'Nesting the same coefficients (Horner) agrees.',
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 3;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 23 / 48 })],
  }),

  problem({
    id: 'u3.tay.fifth',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 5 for sine',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ poly: taylorSum('sin', 0, 5, $.x), err: taylorError('sin', 0, 5, $.x) }),
    second: ($) => ({
      poly: taylorHorner('sin', 0, 5, $.x),
      err: Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 5, $.x)),
    }),
    text: (T) =>
      String.raw`Evaluate the Maclaurin polynomial of order $5$ for $\sin x$ at $x=${T.x}$, and give the absolute error.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_5', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [
      String.raw`The Maclaurin polynomial is $\sum f^{(k)}(0)\,x^k/k!$, here through $k=5$.`,
      'The derivatives of sine at $0$ cycle $0,1,0,-1$. Only odd powers survive, with alternating signs.',
      (T) => String.raw`Evaluate at $x=${T.x}$, then take the absolute difference from $\sin ${T.x}$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_5=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
    ],
    sim: {
      scenario: 'fifth',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 5;
        slice.a = 0;
        slice.x = $.x;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly, err: c.err }),
    },
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 1841 / 3840, err: Math.abs(Math.sin(0.5) - 1841 / 3840) })],
  }),

  problem({
    id: 'u3.tay.tighter',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Higher order, smaller error',
    kind: 'conceptual',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ tighter: taylorError('sin', 0, 5, $.x) < taylorError('sin', 0, 1, $.x) ? 1 : 0 }),
    second: ($) => ({
      tighter:
        Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 5, $.x)) <
        Math.abs(sampleFn('sin', $.x) - taylorHorner('sin', 0, 1, $.x))
          ? 1
          : 0,
    }),
    text: (T) =>
      String.raw`True or false: at $x=${T.x}$, the Maclaurin polynomial of order $5$ for $\sin x$ has a smaller absolute error than the order-$1$ polynomial.`,
    parts: [tf('tighter', ($) => (taylorError('sin', 0, 5, $.x) < taylorError('sin', 0, 1, $.x) ? 1 : 0), { label: 'order 5 is closer' })],
    hints: [
      'For a small $x$, the error of a Maclaurin polynomial is about the size of the first term it leaves out.',
      (T) => String.raw`Order $1$ leaves out $x^3/6$. Order $5$ leaves out $x^7/5040$. Compare them at $x=${T.x}$.`,
    ],
    steps: () => ['Order 5 adds the $x^3$ and $x^5$ terms that order 1 leaves out, so the gap shrinks on this interval.'],
    cases: [kase('x=1/2', { x: 0.5 }, { tighter: 1 })],
  }),

  problem({
    id: 'u3.tay.exp',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Maclaurin polynomial for the exponential',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ poly: taylorSum('exp', 0, 4, $.x) }),
    second: ($) => ({ poly: taylorHorner('exp', 0, 4, $.x) }),
    text: (T) => String.raw`Evaluate the Maclaurin polynomial of order $4$ for $e^x$ at $x=${T.x}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_4', abs: 1e-6 })],
    hints: [
      'Every derivative of $e^x$ is $e^x$, and $e^0=1$.',
      String.raw`So the coefficient of $x^k$ is $1/k!$, for $k=0$ through $4$.`,
      (T) => String.raw`Add the five terms at $x=${T.x}$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_4=${f($.poly)}$.`,
      'Horner form uses the same coefficients and agrees.',
    ],
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 633 / 384 })],
  }),

  problem({
    id: 'u3.tay.shift',
    exam: 'u3',
    ch: '6',
    lab: 'taylor',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Taylor polynomial about π/2',
    kind: 'numeric',
    level: 2,
    topics: ['taylor'],
    vars: { h: range(0.11, 0.6, 0.01) },
    derive: ($) => ({ poly: taylorSum('sin', Math.PI / 2, 2, Math.PI / 2 + $.h) }),
    second: ($) => ({ poly: taylorHorner('sin', Math.PI / 2, 2, Math.PI / 2 + $.h) }),
    text: (T) =>
      String.raw`The Taylor polynomial of order $2$ for $\sin x$ about $\pi/2$ is $1-(x-\pi/2)^2/2$. Evaluate it at $x=\pi/2+${T.h}$.`,
    parts: [num('poly', ($) => $.poly, '', { label: 'P_2', abs: 1e-6 })],
    hints: [
      'The polynomial is given. Write the input as the centre plus a step.',
      (T) => String.raw`Here $x-\pi/2=${T.h}$.`,
      (T) => String.raw`Square $${T.h}$, halve it, and subtract from $1$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_2=1-h^2/2=${f($.poly)}$.`,
      'Horner form agrees.',
    ],
    sim: {
      scenario: 'shift',
      setup(slice, $) {
        slice.kind = 'sin';
        slice.n = 2;
        slice.a = Math.PI / 2;
        slice.x = Math.PI / 2 + $.h;
        return domain(slice, frame);
      },
      read: (c) => ({ poly: c.poly }),
    },
    cases: [kase('h=0.4', { h: 0.4 }, { poly: 0.92 })],
  }),

  problem({
    id: 'u3.tay.center',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Match at the centre',
    kind: 'conceptual',
    level: 1,
    topics: ['taylor'],
    vars: { n: range(1, 50, 1) },
    derive: ($) => ({ match: taylorError('sin', 0, $.n, 0) < 1e-9 ? 1 : 0 }),
    second: ($) => ({ match: Math.abs(sampleFn('sin', 0) - taylorHorner('sin', 0, $.n, 0)) < 1e-9 ? 1 : 0 }),
    text: (T) =>
      String.raw`True or false: the Maclaurin polynomial of order $${T.n}$ for $\sin x$ equals $\sin 0$ at $x=0$.`,
    parts: [tf('match', ($) => (taylorError('sin', 0, $.n, 0) < 1e-9 ? 1 : 0), { label: 'matches at 0' })],
    hints: [
      'Every term with a positive power of $x$ is $0$ at $x=0$.',
      'Only the constant term is left. By construction it is $f(0)$.',
    ],
    steps: () => ['At the centre only the constant term survives, and that constant is the function value.'],
    cases: [kase('n=3', { n: 3 }, { match: 1 })],
  }),

  problem({
    id: 'u3.tay.cos',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'Order 2 for cosine',
    kind: 'numeric',
    level: 1,
    topics: ['taylor'],
    vars: { x: range(0.2, 0.8, 0.01) },
    derive: ($) => ({ poly: taylorSum('cos', 0, 2, $.x), err: taylorError('cos', 0, 2, $.x) }),
    second: ($) => ({
      poly: taylorHorner('cos', 0, 2, $.x),
      err: Math.abs(sampleFn('cos', $.x) - taylorHorner('cos', 0, 2, $.x)),
    }),
    text: (T) =>
      String.raw`Evaluate the Maclaurin polynomial of order $2$ for $\cos x$ at $x=${T.x}$, and give the absolute error.`,
    parts: [
      num('poly', ($) => $.poly, '', { label: 'P_2', abs: 1e-6 }),
      num('err', ($) => $.err, '', { label: 'error', abs: 1e-6 }),
    ],
    hints: [
      String.raw`The derivatives of $\cos x$ at $0$ cycle $1,0,-1,0$.`,
      String.raw`So the order-2 polynomial keeps the constant and the $x^2$ term, with $1/2!$ on the square.`,
      (T) => String.raw`Evaluate at $x=${T.x}$, then take the absolute difference from $\cos ${T.x}$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_2=${f($.poly)}$.`,
      String.raw`The error is $${f($.err)}$.`,
    ],
    cases: [kase('x=1/2', { x: 0.5 }, { poly: 7 / 8, err: Math.abs(Math.cos(0.5) - 7 / 8) })],
  }),

  problem({
    id: 'u3.sym.taylor',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'A quadratic for the exponential',
    kind: 'derivation',
    level: 2,
    topics: ['taylor', 'symbolic'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => {
      const x = 0.5;
      return { x, val: 1 + $.a * x + (($.a * $.a) / 2) * x * x };
    },
    second: ($) => {
      const quad = ($.a * $.a) / 2;
      return { formula: expTaylor($.a), val: 1 + $.x * ($.a + $.x * quad) };
    },
    text: (T) => {
      const ax = Number(T.a) === 1 ? 'x' : `${T.a}x`;
      return String.raw`Write the Maclaurin polynomial of order $2$ for $e^{${ax}}$, as a formula in $x$, and evaluate it at $x=1/2$.`;
    },
    parts: [
      sym('formula', ($) => expTaylor($.a), ['x'], ($) => 1 + $.a * $.x + (($.a * $.a) / 2) * $.x * $.x, {
        label: 'P_2(x)',
      }),
      num('val', ($) => $.val, '', { label: 'P_2(1/2)', abs: 1e-6 }),
    ],
    hints: [
      String.raw`The order-2 Maclaurin polynomial is $f(0)+f'(0)\,x+\tfrac12 f''(0)\,x^2$.`,
      (T, $) => String.raw`Each derivative of $e^{${$.a === 1 ? 'x' : `${$.a}x`}}$ brings down another factor $${$.a}$.`,
      'Evaluate the three derivatives at $0$, and reduce the fraction on $x^2$. For the number, substitute $x=1/2$.',
    ],
    steps: ($, f) => [
      String.raw`The polynomial is $${exprToTex(expTaylor($.a), ['x'])}$.`,
      String.raw`At $x=1/2$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=1', { a: 1 }, { formula: '1+x+1/2*x^2', val: 1.625 }, {
        accept: { formula: ['1+x+x^2/2'] },
        reject: { formula: ['1+x+x^2'] },
      }),
    ],
  }),
  problem({
    id: 'u3.sym.sin',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'A cubic for a sine',
    kind: 'derivation',
    level: 2,
    topics: ['taylor', 'symbolic'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ x: 0.5, val: $.a * 0.5 - ($.a ** 3 * 0.125) / 6 }),
    second: ($) => ({ formula: sinTaylor($.a), val: taylorSum('sin', 0, 3, $.a * 0.5) }),
    text: (T, $) => String.raw`Write the Maclaurin polynomial of order $3$ for $\sin(${axTex($.a)})$, as a formula in $x$, and evaluate it at $x=1/2$.`,
    parts: [
      sym('formula', ($) => sinTaylor($.a), ['x'], ($) => $.a * $.x - ($.a ** 3 * $.x ** 3) / 6, { label: 'P_3(x)' }),
      num('val', ($) => $.val, '', { label: 'P_3(1/2)', abs: 1e-6 }),
    ],
    hints: [
      (T, $) => String.raw`Start from the series of $\sin u$, then put $u=${axTex($.a)}$.`,
      String.raw`$\sin u=u-\dfrac{u^3}{6}+\cdots$. The $u^2$ term is $0$.`,
      (T, $) => String.raw`Cube the whole of $${axTex($.a)}$: its coefficient becomes $${$.a ** 3}$. Reduce the fraction, then substitute $x=1/2$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_3(x)=${exprToTex(sinTaylor($.a), ['x'])}$.`,
      String.raw`At $x=1/2$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=1', { a: 1 }, { formula: 'x-1/6*x^3', val: 0.5 - 0.125 / 6 }, {
        accept: { formula: ['x-x^3/6'] },
        reject: { formula: ['x-x^3/3'] },
      }),
    ],
  }),

  problem({
    id: 'u3.sym.cos',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'A quartic for a cosine',
    kind: 'derivation',
    level: 2,
    topics: ['taylor', 'symbolic'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ x: 0.5, val: 1 - ($.a ** 2 * 0.25) / 2 + ($.a ** 4 * 0.0625) / 24 }),
    second: ($) => ({ formula: cosTaylor($.a), val: taylorSum('cos', 0, 4, $.a * 0.5) }),
    text: (T, $) => String.raw`Write the Maclaurin polynomial of order $4$ for $\cos(${axTex($.a)})$, as a formula in $x$, and evaluate it at $x=1/2$.`,
    parts: [
      sym('formula', ($) => cosTaylor($.a), ['x'], ($) => 1 - ($.a ** 2 * $.x ** 2) / 2 + ($.a ** 4 * $.x ** 4) / 24, {
        label: 'P_4(x)',
      }),
      num('val', ($) => $.val, '', { label: 'P_4(1/2)', abs: 1e-6 }),
    ],
    hints: [
      (T, $) => String.raw`Start from the series of $\cos u$, then put $u=${axTex($.a)}$.`,
      String.raw`$\cos u=1-\dfrac{u^2}{2}+\dfrac{u^4}{24}-\cdots$. Only even powers appear.`,
      (T, $) => String.raw`The powers of $${axTex($.a)}$ give coefficients $${$.a ** 2}$ and $${$.a ** 4}$. Reduce each fraction, then substitute $x=1/2$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_4(x)=${exprToTex(cosTaylor($.a), ['x'])}$.`,
      String.raw`At $x=1/2$ it equals $${f($.val)}$.`,
    ],
    cases: [
      kase('a=1', { a: 1 }, { formula: '1-1/2*x^2+1/24*x^4', val: 1 - 0.125 + 0.0625 / 24 }, {
        accept: { formula: ['1-x^2/2+x^4/24'] },
        reject: { formula: ['1-x^2/2+x^4/4'] },
      }),
    ],
  }),

  problem({
    id: 'u3.sym.ln',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'A cubic for a logarithm',
    kind: 'derivation',
    level: 2,
    topics: ['taylor', 'symbolic'],
    vars: { a: range(1, 50, 1) },
    derive: ($) => ({ x: 0.5, val: $.a * 0.5 - ($.a ** 2 * 0.25) / 2 + ($.a ** 3 * 0.125) / 3 }),
    second: ($) => ({ formula: lnTaylor($.a), val: lnSeries($.a * 0.5, 3) }),
    text: (T, $) => String.raw`Write the Maclaurin polynomial of order $3$ for $\ln(1+${axTex($.a)})$, as a formula in $x$, and evaluate it at $x=1/2$.`,
    parts: [
      sym('formula', ($) => lnTaylor($.a), ['x'], ($) => $.a * $.x - ($.a ** 2 * $.x ** 2) / 2 + ($.a ** 3 * $.x ** 3) / 3, {
        label: 'P_3(x)',
      }),
      num('val', ($) => $.val, '', { label: 'P_3(1/2)', abs: 1e-6 }),
    ],
    hints: [
      (T, $) => String.raw`Start from the series of $\ln(1+u)$, then put $u=${axTex($.a)}$.`,
      String.raw`$\ln(1+u)=u-\dfrac{u^2}{2}+\dfrac{u^3}{3}-\cdots$. The signs alternate.`,
      (T, $) => String.raw`The powers of $${axTex($.a)}$ give coefficients $${$.a}$, $${$.a ** 2}$, and $${$.a ** 3}$. Reduce each fraction, then substitute $x=1/2$.`,
    ],
    steps: ($, f) => [
      String.raw`$P_3(x)=${exprToTex(lnTaylor($.a), ['x'])}$.`,
      String.raw`At $x=1/2$ it equals $${f($.val)}$. A polynomial can be evaluated anywhere. The series itself converges only for $|${axTex($.a)}|<1$ and at $${axTex($.a)}=1$.`,
    ],
    cases: [
      kase('a=1', { a: 1 }, { formula: 'x-1/2*x^2+1/3*x^3', val: 0.5 - 0.125 + 0.125 / 3 }, {
        accept: { formula: ['x-x^2/2+x^3/3'] },
        reject: { formula: ['x+x^2/2+x^3/3'] },
      }),
    ],
  }),

  problem({
    id: 'u3.sym.recip',
    exam: 'u3',
    ch: '6',
    src: 'OpenStax Calc 2 §6.3',
    title: 'A Taylor polynomial away from zero',
    kind: 'derivation',
    level: 3,
    topics: ['taylor', 'symbolic'],
    vars: { c: range(1, 50, 1) },
    derive: ($) => {
      const x = $.c + 0.5;
      return { x, val: 1 / $.c - 0.5 / $.c ** 2 + 0.25 / $.c ** 3 };
    },
    second: ($) => {
      const h = 0.5;
      return { formula: recipTaylor($.c), val: (1 / $.c) * (1 + (h / $.c) * (-1 + h / $.c)) };
    },
    text: (T) => String.raw`Write the Taylor polynomial of order $2$ for $1/x$ about $x=${T.c}$, as a formula in $x$, and evaluate it at $x=${T.c}.5$.`,
    parts: [
      sym('formula', ($) => recipTaylor($.c), ['x'], ($) => 1 / $.c - ($.x - $.c) / $.c ** 2 + ($.x - $.c) ** 2 / $.c ** 3, {
        label: 'P_2(x)',
      }),
      num('val', ($) => $.val, '', { label: 'value', abs: 1e-9 }),
    ],
    hints: [
      String.raw`About $x=c$, the order-2 polynomial is $f(c)+f'(c)(x-c)+\tfrac12 f''(c)(x-c)^2$.`,
      String.raw`For $f(x)=1/x$: $f'(x)=-1/x^2$ and $f''(x)=2/x^3$.`,
      (T) => String.raw`Evaluate those at $c=${T.c}$. The $\tfrac12$ cancels the $2$ in $f''$. Keep the powers of $x-${T.c}$ unexpanded.`,
    ],
    steps: ($, f) => [
      $.c === 1
        ? String.raw`$P_2(x)=1-(x-1)+(x-1)^2$.`
        : String.raw`$P_2(x)=\dfrac{1}{${$.c}}-\dfrac{x-${$.c}}{${$.c * $.c}}+\dfrac{(x-${$.c})^2}{${$.c ** 3}}$.`,
      String.raw`At $x=${$.c}.5$ it equals $${f($.val)}$. The function itself is $${f(1 / ($.c + 0.5))}$.`,
    ],
    cases: [
      kase('c=2', { c: 2 }, { formula: '1/2-(x-2)/4+(x-2)^2/8', val: 0.40625 }, {
        accept: { formula: ['0.5-0.25*(x-2)+0.125*(x-2)^2'] },
        reject: { formula: ['1/2+(x-2)/4+(x-2)^2/8'] },
      }),
    ],
  }),
];
