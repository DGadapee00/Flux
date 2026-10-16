import {
  cardioidArea,
  cardioidSimpson,
  circleAt,
  circleLength,
  circleLengthSimpson,
  circleSlopeImplicit,
  lineDistance,
  lineLength,
  paraLength,
  paraLengthSimpson,
  polarX,
  polarXCo,
  polarY,
  polarYCo,
  shiftArea,
  shiftSimpson,
  unitArea,
  unitAreaDisk,
  unitNaive,
} from '../../math/calc2.js';
import { domain, kase, num, piTex, problem, range, tf } from '../kit.js';

const paramFrame = { xMin: -1.5, xMax: 1.7, yMin: -1.6, yMax: 2.7, plane: 'xy' };
const polarFrame = { xMin: -1.5, xMax: 2.6, yMin: -1.8, yMax: 1.8, plane: 'xy' };

const circleT = (k) => (k * Math.PI) / 4;
const quarters = (k) => (k * Math.PI) / 2;

export default [
  problem({
    id: 'u4.par.point',
    exam: 'u4',
    ch: '7',
    lab: 'parametric',
    src: 'OpenStax Calc 2 §7.1',
    title: 'A point on the unit circle',
    kind: 'numeric',
    level: 1,
    topics: ['parametric'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => {
      const here = circleAt(circleT($.k));
      return { x: here.x, y: here.y };
    },
    second: ($) => ({ x: polarXCo(1, circleT($.k)), y: polarYCo(1, circleT($.k)) }),
    text: (T) => String.raw`The unit circle is $x=\cos t$, $y=\sin t$. Find the point at $t=${piTex(T.k, 4)}$.`,
    parts: [
      num('x', ($) => $.x, '', { label: 'x', abs: 1e-6 }),
      num('y', ($) => $.y, '', { label: 'y', abs: 1e-6 }),
    ],
    hints: [
      String.raw`$\cos$ and $\sin$ of a quarter turn are $0$ and $1$, in that order or swapped.`,
      'Reduce the angle by full turns first, then read cosine for $x$ and sine for $y$.',
    ],
    steps: ($, f) => [
      String.raw`$x=${f($.x)}$ and $y=${f($.y)}$.`,
      'The cofunction identities give the same point.',
    ],
    sim: {
      scenario: 'circle',
      setup(slice, $) {
        slice.kind = 'circle';
        slice.k = $.k;
        return domain(slice, paramFrame);
      },
      read: (c) => ({ x: c.x, y: c.y }),
    },
    cases: [kase('t=π/2', { k: 2 }, { x: 0, y: 1 })],
  }),

  problem({
    id: 'u4.par.slope',
    exam: 'u4',
    ch: '7',
    lab: 'parametric',
    src: 'OpenStax Calc 2 §7.2',
    title: 'Slope on the unit circle',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { k: range(1, 72, 1) },
    derive: ($) => ({ slope: circleAt(circleT($.k)).slope }),
    second: ($) => ({ slope: circleSlopeImplicit(circleT($.k)) }),
    text: (T) => String.raw`On $x=\cos t$, $y=\sin t$, find $dy/dx$ at $t=${piTex(T.k, 4)}$.`,
    parts: [num('slope', ($) => $.slope, '', { label: 'slope', abs: 1e-6 })],
    hints: [
      String.raw`$\dfrac{dy}{dx}=\dfrac{dy/dt}{dx/dt}=-\dfrac{\cos t}{\sin t}$.`,
      'A vertical tangent makes the denominator $0$. Those angles are not drawn by this problem. Reduce $t$ before you divide.',
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{\cos t}{-\sin t}=${f($.slope)}$.`,
      'Implicit differentiation of $x^2+y^2=1$ gives the same slope.',
    ],
    sim: {
      scenario: 'circle',
      setup(slice, $) {
        slice.kind = 'circle';
        slice.k = $.k;
        return domain(slice, paramFrame);
      },
      read: (c) => ({ slope: c.slope }),
    },
    cases: [kase('t=π/4', { k: 1 }, { slope: -1 })],
  }),

  problem({
    id: 'u4.par.length',
    exam: 'u4',
    ch: '7',
    lab: 'parametric',
    src: 'OpenStax Calc 2 §7.2',
    title: 'Arc length on the unit circle',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => ({ len: circleLength(circleT($.k)) }),
    second: ($) => ({ len: circleLengthSimpson(circleT($.k)) }),
    text: (T) => String.raw`How long is the unit circle $x=\cos t$, $y=\sin t$ from $t=0$ to $t=${piTex(T.k, 4)}$?`,
    parts: [num('len', ($) => $.len, '', { label: 'length', abs: 1e-6 })],
    hints: [
      'The speed is 1, so the length equals the change in $t$.',
      'That change is the angle itself, once it is written in radians.',
    ],
    steps: ($, f) => [
      String.raw`The length is $t=${f($.len)}$.`,
      'Simpson on the speed agrees.',
    ],
    sim: {
      scenario: 'circle',
      setup(slice, $) {
        slice.kind = 'circle';
        slice.k = $.k;
        return domain(slice, paramFrame);
      },
      read: (c) => ({ len: c.length }),
    },
    cases: [kase('quarter circle', { k: 2 }, { len: Math.PI / 2 })],
  }),

  problem({
    id: 'u4.par.line',
    exam: 'u4',
    ch: '7',
    lab: 'parametric',
    src: 'OpenStax Calc 2 §7.2',
    title: 'Slope and length of a line',
    kind: 'numeric',
    level: 1,
    topics: ['parametric'],
    vars: { t: range(0.02, 1, 0.02) },
    derive: ($) => ({ slope: 2, len: lineLength($.t) }),
    second: ($) => ({ slope: 2, len: lineDistance($.t) }),
    text: (T) => String.raw`The line $x=t$, $y=2t$ runs from $t=0$ to $t=${T.t}$. Give its slope and its length.`,
    parts: [
      num('slope', ($) => $.slope, '', { label: 'slope', abs: 1e-6 }),
      num('len', ($) => $.len, '', { label: 'length', abs: 1e-6 }),
    ],
    hints: [
      'Slope is rise over run. Length is the distance between the endpoints.',
      'The run is $t$ and the rise is $2t$, so the distance is $t\\sqrt{5}$.',
    ],
    steps: ($, f) => [
      String.raw`The slope is $2/1=${f($.slope)}$.`,
      String.raw`The distance from the origin to the endpoint is $${f($.len)}$.`,
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'line';
        slice.k = $.t * 4;
        return domain(slice, paramFrame);
      },
      read: (c) => ({ slope: c.slope, len: c.length }),
    },
    cases: [kase('t=1', { t: 1 }, { slope: 2, len: Math.sqrt(5) })],
  }),

  problem({
    id: 'u4.par.arc',
    exam: 'u4',
    ch: '7',
    lab: 'parametric',
    src: 'OpenStax Calc 2 §7.2',
    title: 'Arc length of a parabola',
    kind: 'numeric',
    level: 2,
    topics: ['parametric'],
    vars: { t: range(0.02, 1, 0.02) },
    derive: ($) => ({ len: paraLength($.t) }),
    second: ($) => ({ len: paraLengthSimpson($.t) }),
    text: (T) => String.raw`The parabola $x=t$, $y=t^2$ runs from $t=0$ to $t=${T.t}$. Give its arc length.`,
    parts: [num('len', ($) => $.len, '', { label: 'length', abs: 1e-6 })],
    hints: [
      String.raw`The speed is $\sqrt{1+4t^2}$. Integrate it.`,
      'The antiderivative is $(t/2)\\sqrt{1+4t^2}+(1/4)\\ln(2t+\\sqrt{1+4t^2})$. Evaluate it at the right end.',
    ],
    steps: ($, f) => [
      String.raw`The antiderivative gives $${f($.len)}$.`,
      'Simpson on the same speed agrees.',
    ],
    sim: {
      scenario: 'para',
      setup(slice, $) {
        slice.kind = 'para';
        slice.k = $.t * 4;
        return domain(slice, paramFrame);
      },
      read: (c) => ({ len: c.length }),
    },
    cases: [kase('t=1', { t: 1 }, { len: paraLength(1) })],
  }),

  problem({
    id: 'u4.pol.cart',
    exam: 'u4',
    ch: '7',
    src: 'OpenStax Calc 2 §7.3',
    title: 'Polar to Cartesian',
    kind: 'numeric',
    level: 1,
    topics: ['polar'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => {
      const theta = ($.k * Math.PI) / 6;
      return { x: polarX(2, theta), y: polarY(2, theta) };
    },
    second: ($) => {
      const theta = ($.k * Math.PI) / 6;
      return { x: polarXCo(2, theta), y: polarYCo(2, theta) };
    },
    text: (T) => String.raw`Convert the polar point $r=2$, $\theta=${piTex(T.k, 6)}$ to Cartesian coordinates.`,
    parts: [
      num('x', ($) => $.x, '', { label: 'x', abs: 1e-6 }),
      num('y', ($) => $.y, '', { label: 'y', abs: 1e-6 }),
    ],
    hints: [
      String.raw`$x=r\cos\theta$ and $y=r\sin\theta$.`,
      'Reduce the angle by full turns, then multiply the cosine and the sine by $r=2$.',
    ],
    steps: ($, f) => [
      String.raw`$x=${f($.x)}$ and $y=${f($.y)}$.`,
      'Writing the cosine as a sine of the complement gives the same point.',
    ],
    cases: [kase('θ=π/3', { k: 2 }, { x: 1, y: Math.sqrt(3) })],
  }),

  problem({
    id: 'u4.pol.disk',
    exam: 'u4',
    ch: '7',
    lab: 'polar',
    src: 'OpenStax Calc 2 §7.4',
    title: 'Area of a polar sector',
    kind: 'numeric',
    level: 1,
    topics: ['polar'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => ({ area: unitArea(quarters($.k)) }),
    second: ($) => ({ area: unitAreaDisk(quarters($.k)) }),
    text: (T) => String.raw`Find the area swept by $r=1$ from $\theta=0$ to $\theta=${piTex(T.k, 2)}$.`,
    parts: [num('area', ($) => $.area, '', { label: 'area', abs: 1e-6 })],
    hints: [
      String.raw`A sector of the unit disk is a fraction of $\pi$. The polar formula is $\frac12\int r^2\,d\theta$.`,
      'For $r=1$ the integral is half the angle. Write the angle in radians first.',
    ],
    steps: ($, f) => [
      String.raw`$\frac12\alpha=${f($.area)}$.`,
      'The same fraction of the disk $\\pi r^2$ agrees.',
    ],
    sim: {
      scenario: 'disk',
      setup(slice, $) {
        slice.kind = 'disk';
        slice.k = $.k;
        return domain(slice, polarFrame);
      },
      read: (c) => ({ area: c.area }),
    },
    cases: [kase('full turn', { k: 4 }, { area: Math.PI })],
  }),

  problem({
    id: 'u4.pol.card',
    exam: 'u4',
    ch: '7',
    lab: 'polar',
    src: 'OpenStax Calc 2 §7.4',
    title: 'Area of a cardioid',
    kind: 'numeric',
    level: 2,
    topics: ['polar'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => ({ area: cardioidArea(quarters($.k)) }),
    second: ($) => ({ area: cardioidSimpson(quarters($.k)) }),
    text: (T) => String.raw`Find the area swept by $r=1+\cos\theta$ from $\theta=0$ to $\theta=${piTex(T.k, 2)}$.`,
    parts: [num('area', ($) => $.area, '', { label: 'area', abs: 1e-6 })],
    hints: [
      String.raw`Expand $(1+\cos\theta)^2$ and integrate $\frac12 r^2$.`,
      'The antiderivative is $\\frac12\\left(\\frac32\\theta+2\\sin\\theta+\\frac14\\sin 2\\theta\\right)$. Evaluate it at the right end.',
    ],
    steps: ($, f) => [
      String.raw`The area is $${f($.area)}$.`,
      'Simpson on $\\frac12 r^2$ agrees.',
    ],
    sim: {
      scenario: 'card',
      setup(slice, $) {
        slice.kind = 'card';
        slice.k = $.k;
        return domain(slice, polarFrame);
      },
      read: (c) => ({ area: c.area }),
    },
    cases: [kase('full cardioid', { k: 4 }, { area: (3 * Math.PI) / 2 })],
  }),

  problem({
    id: 'u4.pol.shift',
    exam: 'u4',
    ch: '7',
    lab: 'polar',
    src: 'OpenStax Calc 2 §7.4',
    title: 'A circle written in polar form',
    kind: 'numeric',
    level: 2,
    topics: ['polar'],
    vars: { k: range(1, 4, 0.06) },
    derive: ($) => ({ area: shiftArea(-Math.PI / 2 + ($.k / 4) * Math.PI) }),
    second: ($) => ({ area: shiftSimpson(-Math.PI / 2 + ($.k / 4) * Math.PI) }),
    text: (T) =>
      String.raw`The curve $r=2\cos\theta$ starts at $\theta=-\pi/2$. Sweep $${T.k}$ fourths of the way toward $\theta=\pi/2$. Give the area.`,
    parts: [num('area', ($) => $.area, '', { label: 'area', abs: 1e-6 })],
    hints: [
      String.raw`A full sweep, four fourths, is a circle of radius $1$, so its area is $\pi$.`,
      'The polar integral is $\\frac12\\int r^2\\,d\\theta$ with $r=2\\cos\\theta$. Stop at the angle this sweep reaches.',
    ],
    steps: ($, f) => [
      String.raw`The polar integral gives $${f($.area)}$.`,
      'Simpson on $\\frac12 r^2$ agrees.',
    ],
    sim: {
      scenario: 'shift',
      setup(slice, $) {
        slice.kind = 'shift';
        slice.k = $.k;
        return domain(slice, polarFrame);
      },
      read: (c) => ({ area: c.area }),
    },
    cases: [kase('full circle', { k: 4 }, { area: Math.PI })],
  }),

  problem({
    id: 'u4.pol.factor',
    exam: 'u4',
    ch: '7',
    src: 'OpenStax Calc 2 §7.4',
    title: 'Which integral is the area',
    kind: 'conceptual',
    level: 1,
    topics: ['polar'],
    vars: { k: range(1, 50, 1) },
    derive: ($) => {
      const alpha = ($.k * Math.PI) / 2;
      return { ok: Math.abs(unitArea(alpha) - unitNaive(alpha)) < 1e-9 ? 1 : 0 };
    },
    second: ($) => {
      const alpha = ($.k * Math.PI) / 2;
      return { ok: Math.abs(unitAreaDisk(alpha) - unitNaive(alpha)) < 1e-9 ? 1 : 0 };
    },
    text: (T) =>
      String.raw`True or false: the area inside $r=1$ from $0$ to $${piTex(T.k, 2)}$ equals $\int r\,d\theta$ on that same interval.`,
    parts: [
      tf('ok', ($) => (Math.abs(unitArea(($.k * Math.PI) / 2) - unitNaive(($.k * Math.PI) / 2)) < 1e-9 ? 1 : 0), {
        label: 'the integral of r is the area',
      }),
    ],
    hints: [
      String.raw`The area element is $\frac12 r^2\,d\theta$, not $r\,d\theta$.`,
      'For $r=1$ the integral of $r$ equals the angle. The area is half of that angle. Those agree only when the angle is $0$.',
    ],
    steps: () => [
      'The integral of $r=1$ equals the angle.',
      'The area is half the angle. The two numbers differ on every interval here.',
    ],
    cases: [kase('full turn', { k: 4 }, { ok: 0 })],
  }),
];
