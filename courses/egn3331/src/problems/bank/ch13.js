/**
 * Euler buckling, effective length, the load at which yield takes over, an off-centre load by the
 * secant formula, and a stocky strut by the tangent modulus. The adjustable column is the English
 * problem. 2.001 does not teach this chapter, so the worked cases are original.
 */
import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  eulerLoad, rectColumn, rectI, secantColumn, tangentModulus, tangentModulusStress, transitionLength, tubeColumn,
  tubeSection,
} from '@flux/subjects/mechanics/buckling.js';
import { COLUMN_E_KSI, COLUMN_FY_KSI, COLUMN_OD_IN, COLUMN_T_IN } from '../../data/column.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const E = 200e9;
const E_AL = 70e9;
const MM = 1e-3;
const MPA = 1e6;
const SY = 250e6;
const B = 0.06;
const H = 0.02;
const KIP = 1000 * N_PER_LBF;
const KSI = 1000 * PA_PER_PSI;

const rel = (a, b) => Math.abs(a - b) > 0.08 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

function weak(L, K = 1) {
  return rectColumn(L, B, H, E, SY, K);
}

/** Depth is `h`. The weak axis uses the 20 mm side. */
function bar(s, axis = 'weak') {
  s.axis = axis;
  s.b = axis === 'strong' ? H : B;
  s.h = axis === 'strong' ? B : H;
}

const ch13 = [
  problem({
    id: 'u11.13.euler',
    title: 'Euler load of a pinned bar',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['representation'],
    level: 1,
    vars: { L: range(0.8, 4, 0.05, 'm') },
    text: (T) => String.raw`A 20 mm by 60 mm steel bar, ${T.L} m long, is pinned at both ends. E is 200 GPa. Find the Euler load and the Euler stress about the weak axis. The depth for that axis is the 20 mm side.`,
    parts: [
      num('P', ($) => weak($.L).euler, 'kN', {
        scale: 1000,
        traps: [
          [($) => weak($.L).euler * 9, 'That is the strong axis. The weak-axis depth is the 20 mm side, and I follows the cube of the depth.'],
          [($) => weak($.L, 2).euler, 'That uses K = 2, a fixed-free column. This bar is pinned at both ends, so K = 1.'],
        ],
      }),
      num('stress', ($) => weak($.L).stress, 'MPa', {
        scale: 1e6,
        traps: [
          [($) => weak($.L).stress * 9, 'The strong axis raises the load, and the stress, by nine. This question is the weak axis.'],
          [($) => weak($.L, 2).stress, 'K = 2 quarters the stress. Both ends are pinned.'],
        ],
      }),
    ],
    hints: [
      'The pinned Euler load is pi squared times EI over L squared. The weak axis uses the smaller depth.',
      'I = b h cubed over 12, with h the 20 mm side. The stress is that load over the area.',
    ],
    steps: ($) => {
      const c = weak($.L);
      return [
        `I = bh^3/12 = ${c.I} m^4 with h = 20 mm.`,
        `P = π²EI/L² = ${c.euler / 1000} kN. The stress is ${c.stress / 1e6} MPa.`,
      ];
    },
    second: ($) => {
      const I = B * H ** 3 / 12;
      const P = (Math.PI ** 2 * E * I) / ($.L * $.L);
      return { P: P / 1000, stress: (P / (B * H)) / 1e6 };
    },
    sim: {
      scenario: 'weak',
      setup(s, $) {
        s.L = $.L;
        s.K = 1;
        bar(s);
        s.E = E;
      },
      read: (c) => ({ P: c.euler, stress: c.stress }),
    },
    cases: [kase(cite('buckling'), { L: 2 }, { P: 19.73920880217872, stress: 16.449340668482268 })],
  }),

  problem({
    id: 'u11.13.ends',
    title: 'Effective length',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['configuration'],
    level: 2,
    vars: {
      L: range(0.8, 3.2, 0.1, 'm'),
      K: choice(
        [1, 'pinned at both ends'],
        [2, 'fixed at the base and free at the top'],
        [0.5, 'fixed at both ends'],
        [0.7, 'fixed at the base and pinned at the top'],
      ),
    },
    text: (T) => String.raw`A 20 mm by 60 mm steel bar is ${T.L} m long and ${T.K}. E is 200 GPa. For fixed-pinned ends take K = 0.7, the exact root 0.699 rounded. Find the weak-axis Euler load.`,
    parts: [
      num('P', ($) => weak($.L, $.K).euler, 'kN', {
        scale: 1000,
        traps: [
          [($) => weak($.L, 1).euler, 'That is the pinned load, K = 1. The end conditions set K, and the load follows 1/K squared.'],
          [($) => weak($.L, 1 / $.K).euler, 'That swapped K with 1/K. A larger K is a longer column and a smaller load.'],
        ],
      }),
    ],
    valid: ($) => rel($.K, 1),
    hints: [
      'Replace L with KL in the pinned formula. Fixed-free is the longest of these.',
      'P = π²EI/(KL)² about the 20 mm depth. K = 0.7 is rounded from the root of tan μ = μ.',
    ],
    steps: ($) => {
      const c = weak($.L, $.K);
      return [`K = ${$.K}. P = π²EI/(KL)² = ${c.euler / 1000} kN.`];
    },
    second: ($) => {
      const I = B * H ** 3 / 12;
      const P = (Math.PI ** 2 * E * I) / ($.K * $.L) ** 2;
      return { P: P / 1000 };
    },
    sim: {
      scenario: 'weak',
      setup(s, $) {
        s.L = $.L;
        s.K = $.K;
        bar(s);
        s.E = E;
      },
      read: (c) => ({ P: c.euler }),
    },
    cases: [kase(cite('buckling'), { L: 2, K: 2 }, { P: 4.93480220054468 })],
  }),

  problem({
    id: 'u11.13.weak',
    title: 'Which axis buckles',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['representation'],
    level: 2,
    vars: { L: range(0.8, 4, 0.05, 'm') },
    text: (T) => String.raw`A pinned steel bar, ${T.L} m long, is 20 mm by 60 mm. E is 200 GPa. Find the weak-axis Euler load, and the ratio of the strong-axis load to that weak-axis load.`,
    parts: [
      num('P', ($) => weak($.L).euler, 'kN', {
        scale: 1000,
        traps: [
          [($) => weak($.L).euler * 9, 'That is the strong axis. The first buckle is about the smaller depth.'],
          [() => SY * B * H, 'That is the yield load, the area times 250 MPa. This question asks for the Euler load.'],
        ],
      }),
      num('ratio', ($) => {
        const strong = rectI(H, B);
        return eulerLoad(E, strong, $.L, 1) / weak($.L).euler;
      }, '', {
        traps: [
          [() => 3, 'That is 60/20. I follows the cube of the depth, so the load ratio is the square of the side ratio.'],
          [() => 1 / 9, 'That is the weak load over the strong load. The question asks for the strong over the weak.'],
        ],
      }),
    ],
    hints: [
      'The weak axis is the smaller depth. Turning the section multiplies I by the square of the side ratio.',
      'I_weak uses h = 20 mm. The ratio of the loads is (60/20) squared, and it does not depend on the length.',
    ],
    steps: ($) => {
      const c = weak($.L);
      return [
        `Weak-axis P = ${c.euler / 1000} kN.`,
        'The side ratio is 3. The load ratio is 3 squared, which is 9.',
      ];
    },
    second: ($) => {
      const Iw = B * H ** 3 / 12;
      const Is = H * B ** 3 / 12;
      const P = (Math.PI ** 2 * E * Iw) / ($.L * $.L);
      return { P: P / 1000, ratio: Is / Iw };
    },
    sim: {
      scenario: 'weak',
      setup(s, $) {
        s.L = $.L;
        s.K = 1;
        bar(s);
        s.E = E;
      },
      read: (c, s) => ({
        P: c.euler,
        ratio: eulerLoad(s.E, rectI(H, B), s.L, s.K) / c.euler,
      }),
    },
    cases: [kase(cite('buckling'), { L: 2 }, { P: 19.73920880217872, ratio: 9 })],
  }),

  problem({
    id: 'u11.13.transition',
    title: 'Where Euler meets yield',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['goal'],
    level: 3,
    vars: {
      b: range(30, 90, 10, 'mm', 1e-3),
      h: range(10, 40, 2, 'mm', 1e-3),
      K: choice([1, 'pinned at both ends'], [2, 'fixed-free'], [0.5, 'fixed at both ends']),
    },
    text: (T) => String.raw`A steel bar ${T.b} mm by ${T.h} mm is ${T.K}. E is 200 GPa and the yield stress is 250 MPa. Find the length at which the weak-axis Euler stress equals yield. Shorter than that, the course model stops using Euler.`,
    parts: [
      num('L', ($) => {
        const depth = Math.min($.b, $.h);
        return transitionLength(Math.max($.b, $.h), depth, E, SY, $.K);
      }, 'm', {
        traps: [
          [($) => {
            const depth = Math.max($.b, $.h);
            return transitionLength(Math.min($.b, $.h), depth, E, SY, $.K);
          }, 'That used the larger side as the depth. The weak axis is the smaller depth, and the radius of gyration is that depth over the square root of 12.'],
          [($) => {
            const depth = Math.min($.b, $.h);
            return transitionLength(Math.max($.b, $.h), depth, E, SY, $.K) / Math.PI;
          }, 'The length still has a factor of π. Dropping it shortens the answer by π.'],
        ],
      }),
    ],
    valid: ($) => {
      const ratio = Math.max($.b, $.h) / Math.min($.b, $.h);
      const depth = Math.min($.b, $.h);
      const other = transitionLength(Math.min($.b, $.h), Math.max($.b, $.h), E, SY, $.K);
      const right = transitionLength(Math.max($.b, $.h), depth, E, SY, $.K);
      return ratio > 1.25 && rel(other, right);
    },
    hints: [
      'Set π squared E over (KL/r) squared equal to the yield stress, and solve for L. The weak-axis r uses the smaller side.',
      'r = h / sqrt(12). Then L = π r sqrt(E/σY) / K.',
    ],
    steps: ($) => {
      const depth = Math.min($.b, $.h);
      const L = transitionLength(Math.max($.b, $.h), depth, E, SY, $.K);
      return [`The weak depth is ${depth * 1000} mm. L = π r sqrt(E/σY) / K = ${L} m.`];
    },
    second: ($) => {
      const depth = Math.min($.b, $.h);
      const r = depth / Math.sqrt(12);
      return { L: (Math.PI * r * Math.sqrt(E / SY)) / $.K };
    },
    sim: {
      scenario: 'weak',
      setup(s, $) {
        const depth = Math.min($.b, $.h);
        const width = Math.max($.b, $.h);
        s.b = width;
        s.h = depth;
        s.L = transitionLength(width, depth, E, SY, $.K);
        s.K = $.K;
        s.axis = 'weak';
        s.E = E;
      },
      read: (c) => ({ L: c.L }),
    },
    cases: [kase(cite('buckling'), { b: 60, h: 20, K: 1 }, { L: 0.5130199320647456 })],
  }),

  problem({
    id: 'u11.13.column',
    title: 'An adjustable column',
    exam: 'u11',
    ch: '13',
    lab: 'column',
    src: cite('buckling'),
    topics: ['buckling', 'english'],
    variety: ['units'],
    level: 3,
    vars: { L: range(48, 168, 2, 'in', M_PER_IN) },
    text: (T) => String.raw`ICC-ES ESR-1767, Table 2, lists a 3 in adjustable column with a design wall of 0.112 in and Fy = 42 ksi. The ends are free to rotate. The model takes E = 29000 ksi, which that report does not print. The length here is ${T.L} in. Find the Euler load and the Euler stress, and say whether yield is reached first.`,
    parts: [
      num('P', ($) => tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1).eulerN, 'kip', {
        scale: KIP,
        traps: [
          [($) => tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 2).eulerN, 'That is K = 2, a flagpole. The report holds the ends against translation and leaves them free to rotate, so K = 1.'],
          [($) => tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1).eulerN / (Math.PI ** 2), 'That dropped π squared from the Euler load.'],
        ],
      }),
      num('stress', ($) => {
        const c = tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1);
        return c.stressKsi * KSI;
      }, 'ksi', {
        scale: KSI,
        traps: [
          [($) => {
            const c = tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 2);
            return c.stressKsi * KSI;
          }, 'K = 2 quarters the stress. These ends are pinned, not fixed-free.'],
          [($) => {
            const c = tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1);
            const solid = Math.PI * (COLUMN_OD_IN / 2) ** 2;
            return (c.eulerKip / solid) * KSI;
          }, 'That spread the load over a solid 3 in circle. The wall is 0.112 in, so the area is a ring.'],
        ],
      }),
      mc('governs', [
        ['yield', 'Yield is reached first.', 'The Euler stress is at least 42 ksi, so the course model stops at the yield load.'],
        ['euler', 'Euler still governs.', 'The Euler stress is still below 42 ksi, so the Euler load is the one this model uses.'],
      ], ($) => (tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1).yielded ? 'yield' : 'euler')),
    ],
    hints: [
      'Use the design wall, not a solid circle. The report leaves the ends free to rotate.',
      'P = π²EI/L² in kip when E is in ksi and I is in in⁴. Compare the stress with 42 ksi.',
    ],
    steps: ($) => {
      const c = tubeColumn($.L / M_PER_IN, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, 1);
      return [
        `I = ${c.I} in^4 and A = ${c.A} in^2 for a 3 in tube with a 0.112 in design wall.`,
        `Euler load = ${c.eulerKip} kip, stress = ${c.stressKsi} ksi. ${c.yielded ? 'Yield is first.' : 'Euler is still below yield.'}`,
      ];
    },
    second: ($) => {
      const Lin = $.L / M_PER_IN;
      const { I, A } = tubeSection(COLUMN_OD_IN, COLUMN_T_IN);
      const P = (Math.PI ** 2 * COLUMN_E_KSI * I) / (Lin * Lin);
      const stress = P / A;
      return { P, stress, governs: stress >= COLUMN_FY_KSI ? 'yield' : 'euler' };
    },
    sim: {
      scenario: 'elastic',
      setup(s, $) {
        s.L = $.L / M_PER_IN;
        s.K = 1;
      },
      read: (c) => ({
        P: c.eulerN,
        stress: c.stressKsi * KSI,
        governs: c.yielded ? 'yield' : 'euler',
      }),
    },
    cases: [kase(cite('buckling'), { L: 124 }, { P: 19.750428707606396, stress: 19.43620373095339, governs: 'euler' })],
  }),

  problem({
    id: 'u11.13.length',
    title: 'What the length does',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 1,
    vars: {
      change: choice(['length', 'the length'], ['modulus', 'the modulus']),
      L: range(0.8, 3.6, 0.1, 'm'),
    },
    text: (T) => String.raw`A pinned 20 mm by 60 mm steel bar is ${T.L} m long. E is 200 GPa. Double ${T.change}. What happens to the weak-axis Euler load?`,
    parts: [
      mc('which', [
        ['quarter', 'It falls to a quarter.', 'The load follows 1/L squared. Doubling the length divides the load by four.'],
        ['double', 'It doubles.', 'The load is linear in E. Doubling the modulus doubles the load.'],
        ['same', 'It stays the same.', 'Both the length and the modulus appear in the Euler load.'],
        ['quadruple', 'It quadruples.', 'Halving the length would multiply the load by four. Doubling the length does the opposite.'],
      ], ($) => ($.change === 'length' ? 'quarter' : 'double')),
    ],
    hints: [
      'The Euler load follows E, and it follows one over the square of the length.',
      'Doubling the length is a factor of one quarter. Doubling E is a factor of two.',
    ],
    steps: ($) => [
      $.change === 'length'
        ? 'P follows 1/L squared, so doubling the length divides the load by four.'
        : 'P follows E, so doubling the modulus doubles the load.',
    ],
    second: ($) => ({ which: $.change === 'length' ? 'quarter' : 'double' }),
    sim: {
      scenario: 'weak',
      setup(s, $) {
        s.L = $.change === 'length' ? $.L * 2 : $.L;
        s.K = 1;
        bar(s);
        s.E = $.change === 'modulus' ? 2 * E : E;
      },
      read: (c, _s, $) => {
        const base = eulerLoad(E, rectI(B, H), $.L, 1);
        const ratio = c.euler / base;
        let which = 'same';
        if (Math.abs(ratio - 0.25) < 0.05) which = 'quarter';
        else if (Math.abs(ratio - 2) < 0.05) which = 'double';
        else if (Math.abs(ratio - 4) < 0.05) which = 'quadruple';
        return { which };
      },
    },
    cases: [kase(cite('buckling'), { change: 'length', L: 2 }, { which: 'quarter' })],
  }),

  problem({
    id: 'u11.13.axis',
    title: 'Turn the section',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 1,
    vars: {
      change: choice(['turn', 'turn the section'], ['length', 'double the length']),
      L: range(0.8, 3.6, 0.1, 'm'),
    },
    text: (T) => String.raw`A pinned 20 mm by 60 mm steel bar is ${T.L} m long. E is 200 GPa. You ${T.change}. The turn puts the 60 mm side into the depth. What happens to the Euler load?`,
    parts: [
      mc('which', [
        ['nine', 'It becomes nine times as large.', 'I follows the cube of the depth. The side ratio is 3, so the load ratio is 9.'],
        ['quarter', 'It falls to a quarter.', 'Doubling the length divides the load by four. The section did not change in that case.'],
        ['same', 'It stays the same.', 'The area is the same after the turn, but I is not. The length change is not zero either.'],
        ['double', 'It doubles.', 'Neither change multiplies the Euler load by two.'],
      ], ($) => ($.change === 'turn' ? 'nine' : 'quarter')),
    ],
    hints: [
      'Turning the section changes the depth that enters I. Doubling the length changes the denominator.',
      'The load ratio of the two axes is the square of 60/20. A doubled length is a factor of one quarter.',
    ],
    steps: ($) => [
      $.change === 'turn'
        ? 'The depth becomes 60 mm and the width becomes 20 mm. The load ratio is the square of 3, which is 9.'
        : 'The load follows 1/L squared, so doubling the length divides it by four.',
    ],
    second: ($) => ({ which: $.change === 'turn' ? 'nine' : 'quarter' }),
    sim: {
      scenario: 'weak',
      setup(s, $) {
        const turn = $.change === 'turn';
        s.L = turn ? $.L : $.L * 2;
        s.K = 1;
        bar(s, turn ? 'strong' : 'weak');
        s.E = E;
      },
      read: (c, _s, $) => {
        const base = eulerLoad(E, rectI(B, H), $.L, 1);
        const ratio = c.euler / base;
        let which = 'same';
        if (Math.abs(ratio - 9) < 0.05) which = 'nine';
        else if (Math.abs(ratio - 0.25) < 0.05) which = 'quarter';
        else if (Math.abs(ratio - 2) < 0.05) which = 'double';
        return { which };
      },
    },
    cases: [kase(cite('buckling'), { change: 'turn', L: 2 }, { which: 'nine' })],
  }),

  problem({
    id: 'u11.13.support',
    title: 'Which end is weakest',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('buckling'),
    topics: ['buckling'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: { L: range(0.8, 3.6, 0.05, 'm') },
    text: (T) => String.raw`A 20 mm by 60 mm steel bar is ${T.L} m long. E is 200 GPa. Which support gives the smallest weak-axis Euler load?`,
    parts: [
      mc('which', [
        ['free', 'Fixed at the base, free at the top.', 'K = 2 is the longest effective length here, so the load is the smallest.'],
        ['pinned', 'Pinned at both ends.', 'K = 1. Fixed-free is longer, so its load is smaller.'],
        ['fixed', 'Fixed at both ends.', 'K = 1/2 is the shortest effective length here, so the load is the largest.'],
        ['mixed', 'Fixed at the base, pinned at the top.', 'K is about 0.7, between pinned and fixed-fixed. Fixed-free is still the smallest load.'],
      ], () => 'free'),
    ],
    hints: [
      'The smallest load belongs to the largest effective length.',
      'Fixed-free has K = 2. Pinned is K = 1, fixed-pinned is about 0.7, and fixed-fixed is 0.5.',
    ],
    steps: () => ['K = 2 is the largest factor here, and the load follows 1/K squared, so fixed-free is the smallest load.'],
    second: () => ({ which: 'free' }),
    sim: {
      scenario: 'weak',
      setup(s, $) {
        s.L = $.L;
        s.K = 2;
        bar(s);
        s.E = E;
      },
      read: (_c, s) => {
        const ends = [['pinned', 1], ['fixed', 0.5], ['free', 2], ['mixed', 0.7]];
        let best = 'pinned';
        let load = Infinity;
        for (const [id, K] of ends) {
          const P = eulerLoad(s.E, rectI(B, H), s.L, K);
          if (P < load) {
            load = P;
            best = id;
          }
        }
        return { which: best };
      },
    },
    cases: [kase(cite('buckling'), { L: 2 }, { which: 'free' })],
  }),
  problem({
    id: 'u11.13.secant',
    title: 'A column loaded off centre',
    exam: 'u11',
    ch: '13',
    lab: 'buckling',
    src: cite('secant'),
    topics: ['secant'],
    variety: ['configuration'],
    level: 3,
    vars: {
      L: range(1, 3, 0.25, 'm', 1),
      h: range(20, 50, 5, 'mm', MM),
      e: range(2, 12, 1, 'mm', MM),
      f: range(0.2, 0.7, 0.05, '', 1),
    },
    derive: ($) => {
      const b = 0.06;
      const A = b * $.h;
      const I = rectI(b, $.h);
      const Pcr = eulerLoad(E, I, $.L);
      const P = Math.round(($.f * Pcr) / 100) * 100;
      const s = secantColumn(P, $.e, $.h / 2, A, I, E, $.L);
      return { A, I, Pcr, P, peak: s.sigma, bow: s.bow, sec: s.sec };
    },
    valid: ($) => $.peak < 300 * MPA && $.P >= 1000,
    text: (T, $) => String.raw`A steel bar ($E = 200$ GPa) 60 mm wide and $${T.h}$ mm deep, $${T.L}$ m long and pinned at both ends, carries $${($.P / 1000).toFixed(1)}$ kN applied $${T.e}$ mm off its axis, in the direction of the $${T.h}$ mm depth. Find the extra bow at mid-height and the largest compressive stress.`,
    parts: [
      num('bow', ($) => $.bow, 'mm', {
        scale: MM,
        label: 'bow at mid-height',
        traps: [
          [() => 0, 'An off-centre load bends the column from the start. The bow is $e(\\sec(kL/2) - 1)$.'],
        ],
      }),
      num('peak', ($) => $.peak, 'MPa', {
        scale: MPA,
        label: 'largest stress',
        traps: [
          [($) => $.P / $.A + ($.P * $.e * ($.h / 2)) / $.I, 'That uses the moment $Pe$ and leaves out the bow. The moment grows by $\\sec(kL/2)$.'],
          [($) => $.P / $.A, 'That is the average stress. The offset adds bending.'],
        ],
      }),
    ],
    hints: [
      'The moment at mid-height is $P(e + y_{\\max})$, and the bow depends on the load through $k = \\sqrt{P/EI}$.',
      String.raw`$y_{\max} = e(\sec(kL/2) - 1)$ and $\sigma_{\max} = (P/A)[1 + (ec/r^2)\sec(kL/2)]$, with $r^2 = I/A$ and $c = h/2$.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = ${sig($.I / 1e-12 / 1e6)}\times 10^6$ mm⁴, $A = ${sig($.A / 1e-6)}$ mm². $k = \sqrt{P/EI}$, so $kL/2 = ${sig(Math.acos(1 / $.sec))}$ rad and $\sec(kL/2) = ${sig($.sec)}$.`,
      String.raw`Bow: $e(\sec - 1) = ${sig($.bow / MM)}$ mm.`,
      String.raw`Peak: $P/A + P(e + y_{\max})c/I = ${sig($.peak / MPA)}$ MPa.`,
    ],
    second: ($) => {
      // The moment at mid-height from the bowed shape, then P/A + Mc/I.
      const k = Math.sqrt($.P / (E * $.I));
      const ymid = $.e / Math.cos((k * $.L) / 2) - $.e;
      return { bow: ymid / MM, peak: ($.P / $.A + ($.P * ($.e + ymid) * ($.h / 2)) / $.I) / MPA };
    },
    cases: [kase(cite('secant'), { L: 2, h: 20, e: 5, f: 0.5066 }, { bow: 6.429846065865277, peak: 36.907948497996524 })],
  }),

  problem({
    id: 'u11.13.tangent',
    title: 'A stocky strut by the tangent modulus',
    exam: 'u11',
    ch: '13',
    lab: null,
    src: cite('tangent-modulus'),
    topics: ['tangent-modulus'],
    variety: ['unknown'],
    level: 3,
    vars: {
      slender: range(25, 60, 5, '', 1),
      sy: range(200, 300, 20, 'MPa', MPA),
      n: range(10, 30, 5, '', 1),
    },
    derive: ($) => {
      const t = tangentModulusStress($.slender, E_AL, $.sy, $.n);
      return { scr: t.sigma, Et: t.Et, euler: t.euler };
    },
    valid: ($) => $.euler > 1.05 * $.sy && rel($.scr, $.sy),
    text: (T) => String.raw`An aluminium strut ($E = 70$ GPa) has a slenderness $KL/r = ${T.slender}$. Its tension curve is $\varepsilon = \sigma/E + 0.002(\sigma/\sigma_Y)^n$ with $\sigma_Y = ${T.sy}$ MPa and $n = ${T.n}$. Find the buckling stress by the tangent modulus, and the tangent modulus at that stress.`,
    parts: [
      num('scr', ($) => $.scr, 'MPa', {
        scale: MPA,
        label: 'buckling stress',
        traps: [
          [($) => $.euler, 'That is the Euler stress with the elastic $E$. It lies above yield, where the material is no longer that stiff.'],
          [($) => $.sy, 'Capping at yield overstates a column whose curve has already bent over.'],
        ],
      }),
      num('Et', ($) => $.Et, 'GPa', {
        scale: 1e9,
        label: 'tangent modulus',
        traps: [
          [() => E_AL, 'That is the elastic modulus. At the buckling stress the curve is flatter.'],
        ],
      }),
    ],
    hints: [
      'Replace $E$ in the Euler stress with the slope of the stress–strain curve at the buckling stress. That slope depends on the stress, so try values.',
      String.raw`$1/E_t = 1/E + 0.002\,n\,\sigma^{n-1}/\sigma_Y^n$. Find $\sigma$ with $\sigma = \pi^2E_t(\sigma)/(KL/r)^2$, by bisection between 0 and the Euler stress.`,
    ],
    steps: ($, sig) => [
      String.raw`Euler with $E$: $\pi^2E/(KL/r)^2 = ${sig($.euler / MPA)}$ MPa, above yield, so the curve's slope governs.`,
      String.raw`Bisect on $\sigma - \pi^2E_t(\sigma)/(KL/r)^2 = 0$: $\sigma_{cr} = ${sig($.scr / MPA)}$ MPa.`,
      String.raw`There $E_t = ${sig($.Et / 1e9)}$ GPa.`,
    ],
    second: ($) => {
      // Turn it round: each stress has the slenderness π√(Et/σ) that buckles at it. Find the stress
      // whose slenderness is this strut's, by bisection on that decreasing curve.
      const lam = (s) => Math.PI * Math.sqrt(tangentModulus(s, E_AL, $.sy, $.n) / s);
      let lo = 1e3;
      let hi = $.euler;
      for (let i = 0; i < 200; i++) {
        const mid = Math.sqrt(lo * hi);
        if (lam(mid) > $.slender) lo = mid;
        else hi = mid;
      }
      const s = Math.sqrt(lo * hi);
      return { scr: s / MPA, Et: tangentModulus(s, E_AL, $.sy, $.n) / 1e9 };
    },
    cases: [kase(cite('tangent-modulus'), { slender: 40, sy: 240, n: 20 }, { scr: 211.35748589472033, Et: 34.26398502803481 })],
  }),
];

export default ch13;
