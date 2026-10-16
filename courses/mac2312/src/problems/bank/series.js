import {
  altGroups,
  altSum,
  geomLoop,
  geomPartial,
  harmonicSplit,
  harmonicSum,
  ln2,
  squareSplit,
  squareSum,
} from '../../math/calc2.js';
import { domain, kase, num, problem, range, tf } from '../kit.js';

const frame = { xMin: -0.8, xMax: 13.2, yMin: -1.2, yMax: 13.2, plane: 'xy' };

export default [
  problem({
    id: 'u3.ser.geom',
    exam: 'u3',
    ch: '5',
    lab: 'series',
    src: 'OpenStax Calc 2 §5.2',
    title: 'A geometric partial sum',
    kind: 'numeric',
    level: 1,
    topics: ['series'],
    vars: { n: range(4, 53, 1) },
    derive: ($) => ({ sn: geomPartial(0.5, $.n) }),
    second: ($) => ({ sn: geomLoop(0.5, $.n) }),
    text: (T) => String.raw`Add the first $${T.n}$ terms of $\sum (1/2)^k$, starting at $k=0$.`,
    parts: [num('sn', ($) => $.sn, '', { label: 'partial sum', abs: 1e-6 })],
    hints: [
      String.raw`$\sum_{k=0}^{n-1} r^k=(1-r^n)/(1-r)$ with $r=1/2$.`,
      'That formula simplifies to $2(1-(1/2)^n)$. Substitute the given $n$.',
    ],
    steps: ($, f) => [
      String.raw`$2\left(1-(1/2)^n\right)=${f($.sn)}$.`,
      'Adding the powers one at a time agrees.',
    ],
    sim: {
      scenario: 'geom',
      setup(slice, $) {
        slice.kind = 'geom';
        slice.n = $.n;
        return domain(slice, frame);
      },
      read: (c) => ({ sn: c.sn }),
    },
    cases: [kase('n=8', { n: 8 }, { sn: 255 / 128 })],
  }),

  problem({
    id: 'u3.ser.limit',
    exam: 'u3',
    ch: '5',
    src: 'OpenStax Calc 2 §5.2',
    title: 'The sum of a geometric series',
    kind: 'numeric',
    level: 1,
    topics: ['series'],
    vars: { d: range(2, 51, 1) },
    derive: ($) => ({ sum: $.d / ($.d - 1) }),
    second: ($) => ({ sum: geomPartial(1 / $.d, 40) }),
    text: (T) => String.raw`The geometric series with ratio $1/${T.d}$ converges. Give its sum.`,
    parts: [num('sum', ($) => $.sum, '', { label: 'sum', abs: 1e-6 })],
    hints: [
      String.raw`For $|r|<1$, the sum is $1/(1-r)$.`,
      'Here $r=1/d$, so the sum is $d/(d-1)$.',
    ],
    steps: ($, f) => [
      String.raw`$1/(1-1/d)=d/(d-1)=${f($.sum)}$.`,
      'Forty terms of the series already sit on that value.',
    ],
    cases: [kase('ratio 1/2', { d: 2 }, { sum: 2 })],
  }),

  problem({
    id: 'u3.ser.harm',
    exam: 'u3',
    ch: '5',
    lab: 'series',
    src: 'OpenStax Calc 2 §5.3',
    title: 'A harmonic partial sum',
    kind: 'numeric',
    level: 1,
    topics: ['series'],
    vars: { n: range(4, 53, 1) },
    derive: ($) => ({ sn: harmonicSum($.n) }),
    second: ($) => ({ sn: harmonicSplit($.n) }),
    text: (T) => String.raw`Find the ${T.n}th harmonic number, $H_n=1+1/2+\cdots+1/n$.`,
    parts: [num('sn', ($) => $.sn, '', { label: 'H_n', abs: 1e-6 })],
    hints: [
      'Add the reciprocals. There is no shorter closed form.',
      'Add the odd denominators and the even denominators separately, then combine those two totals.',
    ],
    steps: ($, f) => [
      String.raw`$H_n=${f($.sn)}$.`,
      'The odd denominators and the even denominators add to the same total.',
    ],
    sim: {
      scenario: 'harm',
      setup(slice, $) {
        slice.kind = 'harm';
        slice.n = $.n;
        return domain(slice, frame);
      },
      read: (c) => ({ sn: c.sn }),
    },
    cases: [kase('n=8', { n: 8 }, { sn: 761 / 280 })],
  }),

  problem({
    id: 'u3.ser.diverge',
    exam: 'u3',
    ch: '5',
    src: 'OpenStax Calc 2 §5.3',
    title: 'Terms going to zero',
    kind: 'conceptual',
    level: 1,
    topics: ['series'],
    vars: { n: range(4, 53, 1) },
    derive: ($) => ({ conv: harmonicSum($.n) > Math.log($.n + 1) ? 0 : 1 }),
    second: ($) => ({ conv: harmonicSplit($.n) > Math.log($.n + 1) ? 0 : 1 }),
    text: (T) =>
      String.raw`True or false: the harmonic series converges. Through $${T.n}$ terms the partial sum is already above $\ln(n+1)$.`,
    parts: [tf('conv', ($) => (harmonicSum($.n) > Math.log($.n + 1) ? 0 : 1), { label: 'the series converges' })],
    hints: [
      String.raw`The integral of $1/x$ from 1 to infinity diverges, and the harmonic sum sits above it.`,
      'Compare $H_n$ with $\\ln(n+1)$. A sum that stays above a divergent integral cannot settle.',
    ],
    steps: () => ['The terms go to 0, and that is not enough. The integral test says the sums have no ceiling.'],
    cases: [kase('n=8', { n: 8 }, { conv: 0 })],
  }),

  problem({
    id: 'u3.ser.alt',
    exam: 'u3',
    ch: '5',
    lab: 'series',
    src: 'OpenStax Calc 2 §5.5',
    title: 'An alternating partial sum',
    kind: 'numeric',
    level: 2,
    topics: ['series'],
    vars: { n: range(4, 102, 2) },
    derive: ($) => ({ sn: altSum($.n) }),
    second: ($) => ({ sn: altGroups($.n) }),
    text: (T) => String.raw`Add the first $${T.n}$ terms of $\sum_{k=1}^{\infty}(-1)^{k+1}/k$.`,
    parts: [num('sn', ($) => $.sn, '', { label: 'partial sum', abs: 1e-6 })],
    hints: [
      'Pair each odd denominator with the next even one.',
      'Each pair is $1/(2k-1)-1/(2k)$. Add the pairs, and keep a leftover odd term when $n$ is odd.',
    ],
    steps: ($, f) => [
      String.raw`The partial sum is $${f($.sn)}$.`,
      'Grouping each pair agrees with adding the terms in order.',
    ],
    sim: {
      scenario: 'alt',
      setup(slice, $) {
        slice.kind = 'alt';
        slice.n = $.n;
        return domain(slice, frame);
      },
      read: (c) => ({ sn: c.sn }),
    },
    cases: [kase('n=8', { n: 8 }, { sn: 533 / 840 })],
  }),

  problem({
    id: 'u3.ser.ln2',
    exam: 'u3',
    ch: '5',
    src: 'OpenStax Calc 2 §5.5',
    title: 'The alternating harmonic sum',
    kind: 'numeric',
    level: 2,
    topics: ['series'],
    vars: { x: range(0.02, 1, 0.02) },
    derive: ($) => ({ s: Math.log(1 + $.x) }),
    second: ($) => ({ s: -Math.log(1 / (1 + $.x)) }),
    text: (T) => String.raw`The series $\sum_{k=1}^{\infty}(-1)^{k+1}\dfrac{x^k}{k}$ converges at $x=${T.x}$. Give its sum.`,
    parts: [num('s', ($) => $.s, '', { label: 'sum', abs: 1e-6 })],
    hints: [
      String.raw`This is the Taylor series for $\ln(1+x)$ on $0<x\le 1$.`,
      'The sum is $\\ln(1+x)$. At $x=1$ that is $\\ln 2$.',
    ],
    steps: ($, f) => [
      String.raw`The sum is $\ln(1+x)=${f($.s)}$.`,
      String.raw`$-\ln(1/(1+x))$ is the same number.`,
    ],
    cases: [kase('ln 2', { x: 1 }, { s: ln2() })],
  }),

  problem({
    id: 'u3.ser.square',
    exam: 'u3',
    ch: '5',
    src: 'OpenStax Calc 2 §5.3',
    title: 'A p-series partial sum',
    kind: 'numeric',
    level: 2,
    topics: ['series'],
    vars: { n: range(2, 51, 1) },
    derive: ($) => ({ sn: squareSum($.n) }),
    second: ($) => ({ sn: squareSplit($.n) }),
    text: (T) => String.raw`Add the first $${T.n}$ terms of $\sum 1/k^2$.`,
    parts: [num('sn', ($) => $.sn, '', { label: 'partial sum', abs: 1e-6 })],
    hints: [
      String.raw`The integral of $1/x^2$ converges, so this p-series converges. The partial sum is still a plain addition.`,
      'Add $1/k^2$ from $k=1$ through the given $n$. Odd and even denominators are a second way to total the same terms.',
    ],
    steps: ($, f) => [
      String.raw`The partial sum is $${f($.sn)}$.`,
      'Odd and even denominators agree with the single running total.',
    ],
    cases: [kase('n=4', { n: 4 }, { sn: 205 / 144 })],
  }),
];