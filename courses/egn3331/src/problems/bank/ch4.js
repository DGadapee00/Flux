/**
 * Axial load. Elongation of a uniform bar, a step, a taper, a bar fixed at both ends,
 * thermal stress in a held rail, a joint gap, and the same rail in ksi and °F; a bracket joint
 * that moves, three hangers sharing a load, and the peak stress at a hole.
 * Each numeric answer is computed again a second way.
 */
import { PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  barElongation, circleArea, constrainedThermal, fixedFixed, taperedElongation,
} from '@flux/subjects/mechanics/materials.js';
import {
  holeInStrip, jointFromElongations, kirsch, ktEllipse, ktStrip, ktTip, pinJoint, threeBar,
} from '@flux/subjects/mechanics/deformation.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const KN = 1e3;
const MM = 1e-3;
const MPA = 1e6;
const E = 200e9;
const L2 = 0.6;
const E_RAIL = 29000 * 1000 * PA_PER_PSI;
const ALPHA = 6.5e-6 * 1.8;
const KSI = 1000 * PA_PER_PSI;

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

const stepDelta = ($) => barElongation([
  { N: $.P + $.Q, L: $.L1, A: $.A1, E },
  { N: $.P, L: L2, A: $.A2, E },
]);

function simpsonTaper($) {
  const n = 800;
  const h = $.L / n;
  const f = (x) => {
    const d = $.d0 + ($.d1 - $.d0) * (x / $.L);
    return $.P / (circleArea(d) * E);
  };
  let sum = f(0) + f($.L);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(i * h);
  return (sum * h) / 3;
}

/** The bracket's two bars, wall pins to joint B at the origin: the level bar, then the slanted one. */
const bracketBars = ($) => [
  { from: [-$.Lh, 0], A: $.A1, E },
  { from: [-$.Lh, $.brace === 'tie' ? $.rise : -$.rise], A: $.A2, E },
];

const ch4 = [
  problem({
    id: 'u3.4.uniform',
    title: 'Elongation of a uniform bar',
    exam: 'u3',
    ch: '4',
    lab: 'axial',
    src: cite('axial-deformation'),
    topics: ['axial-deformation'],
    variety: ['unknown'],
    level: 1,
    vars: {
      P: range(8, 30, 1, 'kN', KN),
      L: range(0.9, 1.6, 0.1, 'm', 1),
      A: range(150, 400, 25, 'mm²', 1e-6),
    },
    valid: ($) => $.P / $.A < 180e6,
    text: (T) => String.raw`A uniform steel bar, fixed at the left, is $${T.L}$ m long and has area $${T.A}$ mm². The modulus is 200 GPa. An axial tension of $${T.P}$ kN pulls the free end. Find the elongation.`,
    parts: [
      num('delta', ($) => ($.P * $.L) / ($.A * E), 'mm', {
        scale: MM,
        label: 'elongation',
        traps: [
          [($) => ($.P * $.L * 1000) / ($.A * E), 'The length was left in millimetres while the area and the modulus were in metres.'],
          [($) => $.P / $.A, 'That is the stress. The elongation is still the stress times $L/E$.'],
        ],
      }),
    ],
    hints: [
      'For a uniform bar in tension the elongation is the load times the length, divided by the area times the modulus.',
      String.raw`Keep one unit system. With $P$ in kN, $L$ in m, $A$ in mm² and $E$ in GPa, $\delta$ in metres is $PL/(AE)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\delta = PL/AE = ${sig($.P / KN)}\times ${sig($.L)} / (${sig($.A / 1e-6)}\times 200) = ${sig(($.P * $.L) / ($.A * E) / MM)}$ mm.`,
    ],
    second: ($) => ({ delta: (($.P / KN) * $.L) / (($.A / 1e-6) * 200) * 1e3 }),
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.kind = 'step';
        s.Q = 0;
        s.P = $.P;
        s.L1 = $.L - L2;
        s.A1 = $.A;
        s.A2 = $.A;
      },
      read: (c) => ({ delta: c.delta }),
    },
    cases: [kase(cite('axial-deformation'), { P: 20, L: 1.4, A: 200 }, { delta: 0.7 })],
  }),

  problem({
    id: 'u3.4.stepped',
    title: 'Elongation of a stepped bar',
    exam: 'u3',
    ch: '4',
    lab: 'axial',
    src: cite('axial-deformation'),
    topics: ['stepped'],
    variety: ['configuration'],
    level: 2,
    vars: {
      P: range(8, 28, 2, 'kN', KN),
      Q: range(4, 20, 2, 'kN', KN),
      L1: range(0.3, 0.8, 0.1, 'm', 1),
      A1: range(250, 500, 50, 'mm²', 1e-6),
      A2: range(100, 200, 25, 'mm²', 1e-6),
    },
    valid: ($) => {
      if (($.P + $.Q) / $.A1 > 180e6 || $.P / $.A2 > 180e6) return false;
      if ($.Q < 0.2 * $.P) return false;
      const ans = stepDelta($);
      const forgotQ = barElongation([
        { N: $.P, L: $.L1, A: $.A1, E },
        { N: $.P, L: L2, A: $.A2, E },
      ]);
      const smallArea = (($.P + $.Q) * ($.L1 + L2)) / ($.A2 * E);
      return rel(ans, forgotQ) && rel(ans, smallArea);
    },
    text: (T) => String.raw`A stepped steel bar is fixed at the left. The first segment is $${T.L1}$ m long with area $${T.A1}$ mm². The second is 0.6 m long with area $${T.A2}$ mm². $E = 200$ GPa. A load $${T.Q}$ kN pulls at the step, and $${T.P}$ kN pulls the free end, both in tension. Find the end displacement and the largest internal force.`,
    parts: [
      num('delta', stepDelta, 'mm', {
        scale: MM,
        label: 'end displacement',
        traps: [
          [($) => barElongation([
            { N: $.P, L: $.L1, A: $.A1, E },
            { N: $.P, L: L2, A: $.A2, E },
          ]), 'The step load was left off the first segment. That segment carries $P+Q$.'],
          [($) => (($.P + $.Q) * ($.L1 + L2)) / ($.A2 * E), 'The whole length was given the smaller area, and the end load was left out of the sum.'],
        ],
      }),
      num('Nmax', ($) => $.P + $.Q, 'kN', {
        scale: KN,
        label: 'largest internal force',
        traps: [
          [($) => $.P, 'That is the end load only. The first segment also carries the step load.'],
          [($) => $.P + 2 * $.Q, 'The step load was added twice.'],
        ],
      }),
    ],
    hints: [
      'Cut the bar at the step. The free-end load runs through both segments, and the step load runs through the first segment only.',
      String.raw`Add $NL/AE$ for the two segments. The largest internal force is $P+Q$.`,
    ],
    steps: ($, sig) => {
      const d1 = (($.P + $.Q) * $.L1) / ($.A1 * E);
      const d2 = ($.P * L2) / ($.A2 * E);
      return [
        String.raw`First segment: $N = P+Q = ${sig(($.P + $.Q) / KN)}$ kN, so $\delta_1 = ${sig(d1 / MM)}$ mm.`,
        String.raw`Second segment: $N = P = ${sig($.P / KN)}$ kN, so $\delta_2 = ${sig(d2 / MM)}$ mm.`,
        String.raw`The end moves $${sig((d1 + d2) / MM)}$ mm. The largest force is ${sig(($.P + $.Q) / KN)} kN.`,
      ];
    },
    second: ($) => ({
      delta: ((($.P + $.Q) / KN) * $.L1) / (($.A1 / 1e-6) * 200) * 1e3
        + (($.P / KN) * L2) / (($.A2 / 1e-6) * 200) * 1e3,
      Nmax: ($.P + $.Q) / KN,
    }),
    sim: {
      scenario: 'step',
      setup(s, $) {
        s.kind = 'step';
        s.P = $.P;
        s.Q = $.Q;
        s.L1 = $.L1;
        s.A1 = $.A1;
        s.A2 = $.A2;
      },
      read: (c) => ({ delta: c.delta, Nmax: c.Nmax }),
    },
    cases: [kase(cite('axial-deformation'), { P: 20, Q: 12, L1: 0.4, A1: 300, A2: 150 }, { delta: 0.6133333333333335, Nmax: 32 })],
  }),

  problem({
    id: 'u3.4.taper',
    title: 'Elongation of a linearly tapered bar',
    exam: 'u3',
    ch: '4',
    lab: 'axial',
    src: cite('axial-deformation'),
    topics: ['taper'],
    variety: ['representation'],
    level: 2,
    vars: {
      P: range(10, 40, 2, 'kN', KN),
      L: range(0.4, 1.0, 0.1, 'm', 1),
      d0: range(32, 60, 2, 'mm', MM),
      d1: range(14, 28, 2, 'mm', MM),
    },
    valid: ($) => {
      if ($.d0 < $.d1 * 1.5) return false;
      if ($.P / circleArea($.d1) > 180e6) return false;
      const ans = taperedElongation($.P, $.L, E, $.d0, $.d1);
      const avg = (circleArea($.d0) + circleArea($.d1)) / 2;
      const mid = circleArea(($.d0 + $.d1) / 2);
      return rel(ans, ($.P * $.L) / (avg * E)) && rel(ans, ($.P * $.L) / (mid * E));
    },
    text: (T) => String.raw`A circular steel bar is fixed at the left and tapers linearly from diameter $${T.d0}$ mm to $${T.d1}$ mm over $${T.L}$ m. $E = 200$ GPa. A tension of $${T.P}$ kN pulls the free end. Find the elongation.`,
    parts: [
      num('delta', ($) => taperedElongation($.P, $.L, E, $.d0, $.d1), 'mm', {
        scale: MM,
        label: 'elongation',
        traps: [
          [($) => ($.P * $.L) / (((circleArea($.d0) + circleArea($.d1)) / 2) * E), 'That uses the average of the two end areas. $1/A$ is not linear in the diameter.'],
          [($) => ($.P * $.L) / (circleArea(($.d0 + $.d1) / 2) * E), 'That replaces the taper by a constant bar at the average diameter.'],
        ],
      }),
    ],
    hints: [
      'The force is constant, but the area changes. The elongation is the integral of $P/(AE)$ along the bar.',
      String.raw`For a linear taper the integral closes: $\delta = 4PL/(\pi E d_0 d_1)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\delta = 4PL/(\pi E d_0 d_1) = ${sig(taperedElongation($.P, $.L, E, $.d0, $.d1) / MM)}$ mm.`,
    ],
    second: ($) => ({ delta: simpsonTaper($) / MM }),
    sim: {
      scenario: 'taper',
      setup(s, $) {
        s.kind = 'taper';
        s.P = $.P;
        s.Q = 0;
        s.L1 = $.L;
        s.A1 = $.d0;
        s.A2 = $.d1;
      },
      read: (c) => ({ delta: c.delta }),
    },
    cases: [kase(cite('axial-deformation'), { P: 30, L: 0.6, d0: 40, d1: 20 }, { delta: 0.1432394487827058 })],
  }),

  problem({
    id: 'u3.4.walls',
    title: 'Reactions on a bar fixed at both ends',
    exam: 'u3',
    ch: '4',
    lab: 'indeterminate',
    src: cite('indeterminate-axial'),
    topics: ['indeterminate-axial'],
    variety: ['configuration'],
    level: 2,
    vars: {
      a: range(0.3, 1.7, 0.05, 'm', 1),
      P: range(10, 40, 2, 'kN', KN),
    },
    valid: ($) => Math.abs($.a - 1) >= 0.15,
    text: (T) => String.raw`A steel bar 2 m long and 400 mm² in area is fixed to rigid walls at both ends. $E = 200$ GPa. An axial load of $${T.P}$ kN is applied $${T.a}$ m from the left wall. Find the two wall reactions. The left reaction is positive when it pulls the bar to the left, so both reactions come out positive for a tensile load.`,
    parts: [
      num('left', ($) => fixedFixed($.P, 2, $.a).left, 'kN', {
        scale: KN,
        label: 'left-wall reaction',
        traps: [
          [($) => $.P / 2, 'That splits the load in half. The shares are equal only at midspan.'],
          [($) => ($.P * $.a) / 2, 'That uses the left-hand length. The left wall carries the right-hand length over the total.'],
        ],
      }),
      num('right', ($) => fixedFixed($.P, 2, $.a).right, 'kN', {
        scale: KN,
        label: 'right-wall reaction',
        traps: [
          [($) => $.P / 2, 'That splits the load in half. The shorter side carries more.'],
          [($) => ($.P * (2 - $.a)) / 2, 'That is the left-wall share. The two reactions add to $P$.'],
        ],
      }),
    ],
    hints: [
      'Statics gives one equation for two reactions. The walls do not move, so the two segments change length by the same amount and the stiffer side carries more.',
      String.raw`The left reaction is $P(L-a)/L$. The right reaction is the rest of $P$.`,
    ],
    steps: ($, sig) => {
      const r = fixedFixed($.P, 2, $.a);
      return [
        String.raw`Left reaction $= P(L-a)/L = ${sig($.P / KN)}\times ${sig(2 - $.a)}/2 = ${sig(r.left / KN)}$ kN.`,
        String.raw`Right reaction $= P - R_L = ${sig(r.right / KN)}$ kN.`,
      ];
    },
    second: ($) => {
      const A = 400e-6;
      const kL = (A * E) / $.a;
      const kR = (A * E) / (2 - $.a);
      return { left: ($.P * kL) / ((kL + kR) * KN), right: ($.P * kR) / ((kL + kR) * KN) };
    },
    sim: {
      scenario: 'mid',
      setup(s, $) {
        s.a = $.a;
        s.P = $.P;
      },
      read: (c) => ({ left: c.left, right: c.right }),
    },
    cases: [kase(cite('indeterminate-axial'), { a: 0.4, P: 20 }, { left: 16, right: 4 })],
  }),

  problem({
    id: 'u3.4.thermal',
    title: 'Stress in a rail held at both ends',
    exam: 'u3',
    ch: '4',
    lab: 'rail',
    src: cite('thermal-stress'),
    topics: ['thermal-stress'],
    variety: ['unknown'],
    level: 1,
    vars: {
      dT: range(-45, 45, 1, '°C', 1),
    },
    valid: ($) => Math.abs($.dT) >= 8,
    text: (T) => String.raw`A continuously welded steel rail is fastened so that it cannot change length. Take $E = 29{,}000$ ksi and a thermal coefficient of $6.5\times 10^{-6}$ per °F, which is $11.7\times 10^{-6}$ per °C. The temperature changes by $${T.dT}$ °C. Find the axial stress. Tension is positive.`,
    parts: [
      num('stress', ($) => constrainedThermal(E_RAIL, ALPHA, $.dT, { L: 1, gap: 0 }).stress, 'MPa', {
        scale: MPA,
        label: 'axial stress',
        traps: [
          [($) => -constrainedThermal(E_RAIL, ALPHA, $.dT, { L: 1, gap: 0 }).stress, 'The sign was dropped. Heating a held bar compresses it.'],
          [($) => -E_RAIL * 6.5e-6 * $.dT, 'That uses the per-°F coefficient on a Celsius change.'],
        ],
      }),
    ],
    hints: [
      'A fastened bar cannot change length, so the mechanical strain cancels the thermal strain. The length drops out.',
      String.raw`The stress is $-E\alpha\Delta T$. Heating is compression, so the sign is negative for a positive temperature change.`,
    ],
    steps: ($, sig) => [
      String.raw`$\sigma = -E\alpha\Delta T = -(${sig(E_RAIL * ALPHA / MPA)})\times ${sig($.dT)} = ${sig(constrainedThermal(E_RAIL, ALPHA, $.dT, { L: 1, gap: 0 }).stress / MPA)}$ MPa.`,
    ],
    second: ($) => {
      const free = ALPHA * $.dT * 1;
      return { stress: (E_RAIL * -free) / MPA };
    },
    sim: {
      scenario: 'summer',
      setup(s, $) {
        s.gap = 0;
        s.L = 20;
        s.dT = $.dT;
      },
      read: (c) => ({ stress: c.stress }),
    },
    cases: [kase(cite('thermal-stress'), { dT: 30 }, { stress: -70.18173448716072 })],
  }),

  problem({
    id: 'u3.4.gap',
    title: 'Stress after a joint gap closes',
    exam: 'u3',
    ch: '4',
    lab: 'rail',
    src: cite('thermal-stress'),
    topics: ['gap'],
    variety: ['configuration'],
    level: 3,
    vars: {
      dT: range(8, 50, 2, '°C', 1),
      L: range(8, 32, 2, 'm', 1),
      gap: range(2, 12, 1, 'mm', MM),
    },
    valid: ($) => {
      const model = constrainedThermal(E_RAIL, ALPHA, $.dT, { L: $.L, gap: $.gap });
      const full = -E_RAIL * ALPHA * $.dT;
      const perF = -E_RAIL * 6.5e-6 * $.dT;
      const freeMm = ALPHA * $.dT * $.L * 1e3;
      const got = model.stress / MPA;
      return rel(full / MPA, got) && rel(perF / MPA, got) && rel(freeMm, got);
    },
    text: (T) => String.raw`A steel rail $${T.L}$ m long is laid with a joint gap of $${T.gap}$ mm. $E = 29{,}000$ ksi and $\alpha = 11.7\times 10^{-6}$ per °C. The temperature rises $${T.dT}$ °C. Find the axial stress once the rail has done all the expanding it can. Tension is positive. A gap that is still open means zero stress.`,
    parts: [
      num('stress', ($) => constrainedThermal(E_RAIL, ALPHA, $.dT, { L: $.L, gap: $.gap }).stress, 'MPa', {
        scale: MPA,
        label: 'axial stress',
        traps: [
          [($) => -E_RAIL * ALPHA * $.dT, 'That is the stress in a rail with no gap. The gap has to close before any of this stress appears, and only the extra expansion counts.'],
          [($) => -E_RAIL * 6.5e-6 * $.dT, 'That uses the per-°F coefficient, and it ignores the gap.'],
        ],
      }),
    ],
    hints: [
      'Compare the free expansion with the gap. Nothing is stressed until the gap has closed, and then only the expansion past the gap is held back.',
      String.raw`Free expansion is $\alpha\Delta T L$. If it exceeds the gap, the mechanical shortening is the difference, and $\sigma = E$ times that shortening over $L$, in compression.`,
    ],
    steps: ($, sig) => {
      const model = constrainedThermal(E_RAIL, ALPHA, $.dT, { L: $.L, gap: $.gap });
      return [
        String.raw`Free expansion $= \alpha\Delta T L = ${sig(model.free * 1e3)}$ mm. The gap is ${sig($.gap * 1e3)} mm.`,
        model.closed
          ? String.raw`The gap closes. The extra shortening is ${sig(-model.mechanical * 1e3)} mm, so $\sigma = ${sig(model.stress / MPA)}$ MPa.`
          : 'The gap is still open, so the stress is 0.',
      ];
    },
    second: ($) => {
      const free = ALPHA * $.dT * $.L;
      const extra = Math.max(0, free - $.gap);
      return { stress: extra === 0 ? 0 : (-E_RAIL * extra) / ($.L * MPA) };
    },
    sim: {
      scenario: 'joint',
      setup(s, $) {
        s.L = $.L;
        s.gap = $.gap;
        s.dT = $.dT;
      },
      read: (c) => ({ stress: c.stress }),
    },
    cases: [kase(cite('thermal-stress'), { dT: 40, L: 20, gap: 6 }, { stress: -33.591257532316256 })],
  }),

  problem({
    id: 'u3.4.rail-english',
    title: 'Held-rail stress in ksi and °F',
    exam: 'u3',
    ch: '4',
    lab: 'rail',
    src: cite('thermal-stress'),
    topics: ['thermal-stress', 'english'],
    variety: ['representation'],
    level: 2,
    vars: {
      dT: range(15, 80, 1, '°F', 1),
    },
    text: (T) => String.raw`A continuously welded steel rail is fastened so that it cannot change length. The AISC specification takes $E = 29{,}000$ ksi and $6.5\times 10^{-6}$ per °F for structural steel. The temperature rises $${T.dT}$ °F. Find the axial stress in ksi. Tension is positive.`,
    parts: [
      num('stress', ($) => -29000 * 6.5e-6 * $.dT * KSI, 'ksi', {
        scale: KSI,
        label: 'axial stress',
        traps: [
          [($) => 29000 * 6.5e-6 * $.dT * KSI, 'Heating was reported as tension. A held rail goes into compression.'],
          [($) => -29000 * 6.5e-6 * 1.8 * $.dT * KSI, 'The per-°C coefficient was used on a Fahrenheit change.'],
        ],
      }),
    ],
    hints: [
      'Work the whole product in ksi and per °F. The length is not in the answer, and a temperature rise compresses a held rail.',
      String.raw`$\sigma = -E\alpha\Delta T$ with $E$ in ksi and $\alpha$ per °F gives the stress in ksi.`,
    ],
    steps: ($, sig) => [
      String.raw`$\sigma = -29000\times 6.5\times 10^{-6}\times ${sig($.dT)} = ${sig(-29000 * 6.5e-6 * $.dT)}$ ksi.`,
    ],
    second: ($) => ({
      stress: constrainedThermal(E_RAIL, ALPHA, $.dT / 1.8, { L: 1, gap: 0 }).stress / KSI,
    }),
    sim: {
      scenario: 'summer',
      setup(s, $) {
        s.gap = 0;
        s.L = 20;
        s.dT = $.dT / 1.8;
      },
      read: (c) => ({ stress: c.stress }),
    },
    cases: [kase(cite('thermal-stress'), { dT: 50 }, { stress: -9.425 })],
  }),

  problem({
    id: 'u3.4.short-side',
    title: 'Which wall carries more',
    exam: 'u3',
    ch: '4',
    lab: 'indeterminate',
    src: cite('indeterminate-axial'),
    kind: 'conceptual',
    topics: ['indeterminate-axial'],
    variety: ['configuration'],
    level: 1,
    vars: {
      place: choice([0.4, '0.40 m from the left wall'], [1, 'at midspan'], [1.6, '1.60 m from the left wall']),
      P: range(10, 60, 1, 'kN', KN),
    },
    text: (T) => String.raw`A 2 m bar is fixed to a wall at each end. A load of $${T.P}$ kN is applied ${T.place}. Which wall carries more of the load?`,
    parts: [
      mc('which', [
        ['left', 'The left wall.', 'The left segment is the short one only when the load sits left of midspan. Stiffness is $AE/L$, so the short side carries more.'],
        ['right', 'The right wall.', 'The right segment is the short one only when the load sits right of midspan.'],
        ['equal', 'The two walls carry the same load.', 'Equal lengths mean equal stiffness, and that happens at midspan.'],
        ['neither', 'Neither wall carries the load, because the bar is indeterminate.', 'Indeterminate means statics alone cannot find the split. The walls still carry the whole load.'],
      ], ($) => ($.place === 1 ? 'equal' : $.place < 1 ? 'left' : 'right')),
    ],
    hints: [
      'The segment that is shorter is the stiffer spring, and the stiffer spring carries more of the load.',
      'At midspan the two lengths match, so the reactions match. Move the load and the near wall takes the larger share.',
    ],
    steps: ($) => [
      $.place === 1
        ? 'The load is at midspan, so each wall carries half.'
        : $.place < 1
          ? 'The left segment is shorter, so the left wall carries more than half.'
          : 'The right segment is shorter, so the right wall carries more than half.',
    ],
    second: ($) => ({ which: $.place === 1 ? 'equal' : $.place < 1 ? 'left' : 'right' }),
    sim: {
      scenario: 'mid',
      setup(s, $) {
        s.a = $.place;
        s.P = $.P;
      },
      read: (c) => {
        if (Math.abs(c.left - c.right) / c.P < 0.02) return { which: 'equal' };
        return { which: c.left > c.right ? 'left' : 'right' };
      },
    },
    cases: [
      kase(cite('indeterminate-axial'), { place: 0.4, P: 20 }, { which: 'left' }),
      kase(cite('indeterminate-axial'), { place: 1, P: 20 }, { which: 'equal' }),
      kase(cite('indeterminate-axial'), { place: 1.6, P: 20 }, { which: 'right' }),
    ],
  }),

  problem({
    id: 'u3.4.sign',
    title: 'Tension, compression, or no stress yet',
    exam: 'u3',
    ch: '4',
    lab: 'rail',
    src: cite('thermal-stress'),
    kind: 'conceptual',
    topics: ['thermal-stress'],
    variety: ['configuration'],
    level: 2,
    vars: {
      sit: choice(
        ['heat', 'heated, with the ends fastened'],
        ['cool', 'cooled, with the ends fastened'],
        ['open', 'heated, but a 20 mm gap is still open'],
      ),
      dT: range(10, 40, 1, '°C', 1),
    },
    text: (T) => String.raw`A 20 m steel rail sees a temperature change of size $${T.dT}$ °C. The rail is ${T.sit}. What is the axial stress?`,
    parts: [
      mc('sign', [
        ['compression', 'Compression.', 'A temperature rise in a fastened rail is held back, so the stress is compressive.'],
        ['tension', 'Tension.', 'A temperature drop in a fastened rail wants to shrink, and the anchors stop it, so the stress is tensile.'],
        ['zero', 'Zero. The gap has not closed.', 'With a 20 mm gap and a rise of at most 40 °C, the free expansion of a 20 m rail stays under 10 mm.'],
        ['both', 'Tension at one end and compression at the other.', 'A uniform temperature change and a uniform rail give one axial stress, the same at every cross-section.'],
      ], ($) => ($.sit === 'heat' ? 'compression' : $.sit === 'cool' ? 'tension' : 'zero')),
    ],
    hints: [
      'A fastened rail cannot change length. Heating has to be cancelled by compression, and cooling by tension.',
      'If a gap is still larger than the free expansion, the rail is not pushing on anything yet and the stress is zero.',
    ],
    steps: ($) => [
      $.sit === 'open'
        ? 'The free expansion is under 10 mm and the gap is 20 mm, so the stress is still zero.'
        : $.sit === 'heat'
          ? 'The ends are fastened and the rail is heated, so the stress is compression.'
          : 'The ends are fastened and the rail is cooled, so the stress is tension.',
    ],
    second: ($) => ({ sign: $.sit === 'heat' ? 'compression' : $.sit === 'cool' ? 'tension' : 'zero' }),
    sim: {
      scenario: 'summer',
      setup(s, $) {
        s.L = 20;
        if ($.sit === 'open') {
          s.gap = 0.02;
          s.dT = $.dT;
        } else {
          s.gap = 0;
          s.dT = $.sit === 'cool' ? -$.dT : $.dT;
        }
      },
      read: (c) => {
        if (Math.abs(c.stress) < 1e3) return { sign: 'zero' };
        return { sign: c.stress < 0 ? 'compression' : 'tension' };
      },
    },
    cases: [
      kase(cite('thermal-stress'), { sit: 'heat', dT: 20 }, { sign: 'compression' }),
      kase(cite('thermal-stress'), { sit: 'cool', dT: 20 }, { sign: 'tension' }),
      kase(cite('thermal-stress'), { sit: 'open', dT: 20 }, { sign: 'zero' }),
    ],
  }),

  problem({
    id: 'u3.4.length',
    title: 'What the held-rail stress depends on',
    exam: 'u3',
    ch: '4',
    lab: 'rail',
    src: cite('thermal-stress'),
    kind: 'conceptual',
    topics: ['thermal-stress'],
    variety: ['representation'],
    level: 1,
    vars: {
      change: choice(
        ['length', 'the length is doubled'],
        ['area', 'the cross-section is doubled'],
        ['hotter', 'the temperature change is doubled'],
      ),
      dT: range(8, 26, 1, '°C', 1),
    },
    text: (T) => String.raw`A fastened steel rail is heated by $${T.dT}$ °C, and the stress is $-E\alpha\Delta T$. Then ${T.change}. What happens to the axial stress?`,
    parts: [
      mc('effect', [
        ['same', 'The stress is unchanged.', 'Length and area both cancel. The free expansion grows with length, and so does the stretch the anchors must cancel. The area changes the force, not the stress.'],
        ['doubles', 'The stress doubles.', 'The stress is proportional to $E$ and to $\Delta T$. It is not proportional to length or to area.'],
        ['halves', 'The stress is cut in half.', 'Nothing in this change divides the stress by two. A larger section lowers the stress only when the force is fixed, and here the force grows with the area.'],
        ['flips', 'The stress changes from compression to tension.', 'The rail is still being heated. The sign stays compressive.'],
      ], ($) => ($.change === 'hotter' ? 'doubles' : 'same')),
    ],
    hints: [
      'Write $\\sigma = -E\\alpha\\Delta T$ and see which symbol the change touches.',
      'Length is in the free expansion and in the mechanical strain that cancels it. The two cancel. Area is in neither.',
    ],
    steps: ($) => [
      $.change === 'hotter'
        ? 'The stress is proportional to the temperature change, so doubling that change doubles the stress.'
        : $.change === 'length'
          ? 'Free expansion and the cancelling stretch both double, so the stress stays the same.'
          : 'The stress does not contain the area, so doubling the section leaves the stress the same.',
    ],
    second: ($) => ({ effect: $.change === 'hotter' ? 'doubles' : 'same' }),
    sim: {
      scenario: 'summer',
      setup(s, $) {
        s.gap = 0;
        s.L = $.change === 'length' ? 40 : 20;
        s.dT = $.change === 'hotter' ? $.dT * 2 : $.dT;
      },
      read: (c, state, $) => {
        const base = constrainedThermal(E_RAIL, ALPHA, $.dT, { L: 20, gap: 0 }).stress;
        const ratio = c.stress / base;
        return { effect: Math.abs(ratio - 2) < 0.02 ? 'doubles' : 'same' };
      },
    },
    cases: [
      kase(cite('thermal-stress'), { change: 'length', dT: 15 }, { effect: 'same' }),
      kase(cite('thermal-stress'), { change: 'area', dT: 15 }, { effect: 'same' }),
      kase(cite('thermal-stress'), { change: 'hotter', dT: 15 }, { effect: 'doubles' }),
    ],
  }),

  problem({
    id: 'u3.4.joint',
    title: 'How far a bracket joint moves',
    exam: 'u3',
    ch: '4',
    lab: null,
    src: cite('truss-deformation'),
    topics: ['truss-deformation'],
    variety: ['configuration'],
    level: 3,
    vars: {
      brace: choice(['tie', 'above'], ['strut', 'below']),
      P: range(10, 40, 2, 'kN', KN),
      Lh: range(1.5, 3, 0.25, 'm', 1),
      rise: range(1, 2.5, 0.25, 'm', 1),
      A1: range(300, 800, 50, 'mm²', 1e-6),
      A2: range(300, 800, 50, 'mm²', 1e-6),
    },
    derive: ($) => {
      const s = pinJoint([0, 0], bracketBars($), [0, -$.P]);
      return { drop: -s.v, out: s.u, Nh: s.members[0].N, Ns: s.members[1].N, dh: s.members[0].delta, ds: s.members[1].delta };
    },
    valid: ($) => Math.abs($.Nh) / $.A1 < 200e6 && Math.abs($.Ns) / $.A2 < 200e6 && $.rise / $.Lh > 0.45,
    text: (T) => String.raw`A level steel bar AB, $${T.Lh}$ m long with area $${T.A1}$ mm², is pinned to a wall at A. A second steel bar runs from a pin C on the wall, $${T.rise}$ m ${T.brace} A, to the free end B, with area $${T.A2}$ mm². $E = 200$ GPa. Pin B carries $${T.P}$ kN downward. How far does B drop, and how far does it move horizontally (positive away from the wall)?`,
    parts: [
      num('drop', ($) => $.drop, 'mm', {
        scale: MM,
        label: 'drop of B',
        traps: [
          [($) => Math.abs($.ds) * Math.hypot($.Lh, $.rise) / $.rise, 'That divides the slanted bar\'s change of length by $\\sin\\theta$ and ignores the level bar. The level bar\'s change of length moves B too.'],
          [($) => Math.abs($.ds), 'That is the slanted bar\'s change of length. B moves farther than that, because the bar swings as well as stretching.'],
        ],
      }),
      num('out', ($) => $.out, 'mm', {
        scale: MM,
        label: 'horizontal move of B',
        abs: 1e-3,
        traps: [
          [($) => -$.out, 'The sign is backwards. A level bar in compression lets B move toward the wall, and one in tension pulls it away.'],
        ],
      }),
    ],
    hints: [
      'Find both bar forces from equilibrium at B. Each bar changes length by $NL/AE$, and that change equals the move of B projected on the bar.',
      String.raw`The level bar gives the horizontal move directly: $u = \delta_{AB}$. Put $u$ into the slanted bar's equation, $\delta_{CB} = u\cos\theta + v\sin\theta$, with $\theta$ measured from the wall pin to B.`,
      'Watch the signs: a compressed bar has a negative change of length, and a pin below A gives the slanted bar a positive $\\sin\\theta$ toward B.',
    ],
    steps: ($, sig) => {
      const Ls = Math.hypot($.Lh, $.rise);
      return [
        String.raw`The slanted bar is $${sig(Ls)}$ m long. Equilibrium at B: $N_{CB} = ${sig($.Ns / KN)}$ kN and $N_{AB} = ${sig($.Nh / KN)}$ kN (tension positive).`,
        String.raw`Changes of length: $\delta_{AB} = ${sig($.dh / MM)}$ mm and $\delta_{CB} = ${sig($.ds / MM)}$ mm.`,
        String.raw`The level bar fixes $u = ${sig($.out / MM)}$ mm. The slanted bar then gives $v = ${sig(-$.drop / MM)}$ mm, so B drops $${sig($.drop / MM)}$ mm.`,
      ];
    },
    second: ($) => {
      // Statics first, then compatibility alone: the hand method, with no stiffness matrix.
      const up = $.brace === 'tie' ? 1 : -1;
      const Ls = Math.hypot($.Lh, $.rise);
      const sin = (-up * $.rise) / Ls;
      const cos = $.Lh / Ls;
      const Ns = -$.P / sin;
      const Nh = -Ns * cos;
      const j = jointFromElongations([0, 0], [[-$.Lh, 0], [-$.Lh, up * $.rise]], [(Nh * $.Lh) / ($.A1 * E), (Ns * Ls) / ($.A2 * E)]);
      return { drop: -j.v / MM, out: j.u / MM };
    },
    cases: [kase(cite('truss-deformation'), { brace: 'tie', P: 30, Lh: 2, rise: 1.5, A1: 400, A2: 400 }, { drop: 3.9375, out: -1 })],
  }),

  problem({
    id: 'u3.4.three-bar',
    title: 'Three hangers share a load',
    exam: 'u3',
    ch: '4',
    lab: null,
    src: cite('indeterminate-truss'),
    topics: ['indeterminate-truss'],
    variety: ['unknown'],
    level: 3,
    vars: {
      P: range(20, 90, 5, 'kN', KN),
      L: range(0.8, 2, 0.1, 'm', 1),
      th: range(20, 60, 5, '°', 1),
      A: range(200, 600, 50, 'mm²', 1e-6),
    },
    derive: ($) => threeBar($.P, $.L, $.th, $.A, E),
    valid: ($) => $.sm < 220e6,
    text: (T) => String.raw`A joint hangs from a rigid ceiling on three steel bars, each of area $${T.A}$ mm², with $E = 200$ GPa. The middle bar is vertical and $${T.L}$ m long. The two side bars are pinned to the ceiling so that each leans $${T.th}^\circ$ from the vertical. The joint carries $${T.P}$ kN downward. Find the force in the middle bar, the force in each side bar, and how far the joint drops.`,
    parts: [
      num('Nm', ($) => $.Nm, 'kN', {
        scale: KN,
        label: 'middle bar',
        traps: [
          [($) => $.P / 3, 'An even split holds only for parallel bars. The leaning bars are longer and pull at an angle.'],
          [($) => $.P / (1 + 2 * Math.cos(($.th * Math.PI) / 180)), 'That keeps only the equilibrium cosine. The side bar\'s stretch is the drop times $\\cos\\theta$, and its length is $L/\\cos\\theta$, which add two more.'],
        ],
      }),
      num('Ns', ($) => $.Ns, 'kN', {
        scale: KN,
        label: 'each side bar',
        traps: [
          [($) => $.P / 3, 'An even split holds only for parallel bars.'],
          [($) => $.Nm / Math.cos(($.th * Math.PI) / 180) ** 2, 'The side bar carries less than the middle one, by $\\cos^2\\theta$, not more.'],
        ],
      }),
      num('drop', ($) => $.drop, 'mm', {
        scale: MM,
        label: 'drop of the joint',
        traps: [
          [($) => ($.P / 3) * $.L / ($.A * E), 'That uses an even split for the middle bar.'],
        ],
      }),
    ],
    hints: [
      'Two equilibrium equations, three bar forces: add one compatibility condition. By symmetry the joint only drops.',
      String.raw`If the joint drops $\Delta$, the middle bar stretches $\Delta$ and a side bar stretches $\Delta\cos\theta$ over a length $L/\cos\theta$. Compare their strains.`,
    ],
    steps: ($, sig) => [
      String.raw`Compatibility: $N_s = N_m\cos^2\theta = ${sig($.cos ** 2)}\,N_m$.`,
      String.raw`Equilibrium: $N_m + 2N_s\cos\theta = P$, so $N_m = P/(1+2\cos^3\theta) = ${sig($.P / KN)}/${sig(1 + 2 * $.cos ** 3)} = ${sig($.Nm / KN)}$ kN.`,
      String.raw`Each side bar: $N_s = ${sig($.Ns / KN)}$ kN. The drop is $N_mL/AE = ${sig($.drop / MM)}$ mm.`,
    ],
    second: ($) => {
      const t = ($.th * Math.PI) / 180;
      const side = $.L / Math.cos(t);
      const s = pinJoint([0, 0], [
        { from: [-side * Math.sin(t), $.L], A: $.A, E },
        { from: [0, $.L], A: $.A, E },
        { from: [side * Math.sin(t), $.L], A: $.A, E },
      ], [0, -$.P]);
      return { Nm: s.members[1].N / KN, Ns: s.members[0].N / KN, drop: -s.v / MM };
    },
    cases: [
      kase(cite('indeterminate-truss'), { P: 60, L: 1.2, th: 30, A: 300 }, { Nm: 26.09787104087197, Ns: 19.573403280653977, drop: 0.5219574208174393 }),
      kase(cite('indeterminate-truss'), { P: 60, L: 1.2, th: 60, A: 300 }, { Nm: 48, Ns: 12, drop: 0.96 }),
    ],
  }),

  problem({
    id: 'u3.4.hole',
    title: 'Peak stress at a bolt hole',
    exam: 'u3',
    ch: '4',
    lab: null,
    src: cite('stress-concentration'),
    topics: ['stress-concentration'],
    variety: ['unknown'],
    level: 2,
    vars: {
      w: range(40, 100, 5, 'mm', MM),
      d: range(6, 30, 2, 'mm', MM),
      t: range(6, 16, 2, 'mm', MM),
      P: range(10, 60, 2, 'kN', KN),
    },
    derive: ($) => holeInStrip($.P, $.w, $.d, $.t),
    valid: ($) => $.d / $.w >= 0.1 && $.d / $.w <= 0.5 && $.peak < 250e6 && $.peak > 60e6,
    text: (T) => String.raw`A flat steel bar $${T.w}$ mm wide and $${T.t}$ mm thick has a centred hole $${T.d}$ mm in diameter. It carries an axial tension of $${T.P}$ kN. On the net-section stress, the stress-concentration factor is $K_t = 2 + (1 - d/w)^3$. Find $K_t$ and the peak stress at the edge of the hole.`,
    parts: [
      num('Kt', ($) => $.Kt, '', {
        label: 'K_t',
        traps: [
          [() => 3, 'Three is the wide-plate value. This hole takes a real fraction of the width, so use the given fit.'],
        ],
      }),
      num('peak', ($) => $.peak, 'MPa', {
        scale: MPA,
        label: 'peak stress',
        traps: [
          [($) => $.Kt * $.gross, 'That puts $K_t$ on the gross stress $P/(wt)$. This $K_t$ was measured on the net stress $P/((w-d)t)$.'],
          [($) => $.net, 'That is the net-section average. The edge of the hole sees $K_t$ times it.'],
          [($) => 3 * $.net, 'That uses the wide-plate 3 on the net stress.'],
        ],
      }),
    ],
    hints: [
      'A stress-concentration factor multiplies the nominal stress it was defined on. Find which area this one uses.',
      String.raw`The net area is $(w-d)t$. Find $K_t$ from $d/w$, then multiply.`,
    ],
    steps: ($, sig) => [
      String.raw`Net area $(w-d)t = ${sig(($.w - $.d) / MM)}\times ${sig($.t / MM)} = ${sig((($.w - $.d) * $.t) / 1e-6)}$ mm², so $\sigma_{\mathrm{net}} = ${sig($.net / MPA)}$ MPa.`,
      String.raw`$d/w = ${sig($.d / $.w)}$, so $K_t = 2 + ${sig(1 - $.d / $.w)}^3 = ${sig($.Kt)}$.`,
      String.raw`Peak $= K_t\sigma_{\mathrm{net}} = ${sig($.peak / MPA)}$ MPa.`,
    ],
    second: ($) => ({
      Kt: 2 + (($.w - $.d) / $.w) ** 3,
      // The same peak from the gross stress and the ratio of the areas.
      peak: (ktStrip($.d, $.w) * ($.P / ($.w * $.t)) * ($.w / ($.w - $.d))) / MPA,
    }),
    cases: [kase(cite('stress-concentration'), { w: 60, d: 12, t: 10, P: 30 }, { Kt: 2.512, peak: 157 })],
  }),

  problem({
    id: 'u3.4.notch',
    title: 'What a change to a hole does to its peak',
    exam: 'u3',
    ch: '4',
    lab: null,
    src: cite('stress-concentration'),
    kind: 'conceptual',
    topics: ['stress-concentration'],
    variety: ['configuration'],
    level: 2,
    vars: {
      change: choice(
        ['bigger', 'a round hole in a very wide plate is drilled out to twice its diameter'],
        ['turn', 'an elliptical slot that ran along the load is turned to run across it'],
        ['stop', 'a small round hole is drilled at the tip of a sharp crack'],
        ['strip', 'the round hole in a narrow strip is drilled larger, at the same load'],
      ),
      S: range(20, 60, 2, 'MPa', MPA),
    },
    text: (T) => String.raw`A steel plate carries a far-field tension of $${T.S}$ MPa. Then ${T.change}. What happens to the peak stress at the edge of the opening?`,
    parts: [
      mc('effect', [
        ['same', 'It stays the same.', 'In a wide plate a round hole gives three times the far stress at any size. Size sets how far the bump reaches, not its height.'],
        ['rises', 'It rises.', 'The peak rises when the opening gets sharper across the load, or when the net section shrinks faster than the factor falls.'],
        ['falls', 'It falls.', 'The peak falls when the tip radius grows. A blunter tip spreads the crowded force lines.'],
      ], ($) => ($.change === 'bigger' ? 'same' : $.change === 'stop' ? 'falls' : 'rises')),
    ],
    hints: [
      'The peak depends on the shape of the opening across the load, through its tip radius, and on the nominal stress.',
      String.raw`Wide plate: $K_t = 1 + 2a/b = 1 + 2\sqrt{a/\rho}$, with no size alone in it. Strip: the net stress $P/((w-d)t)$ grows as $d$ grows.`,
    ],
    steps: ($) => [
      {
        bigger: 'A round hole in a wide plate has $K_t = 3$ at any diameter, and the far stress is unchanged. The peak stays the same.',
        turn: 'Across the load, $a > b$ and $K_t = 1 + 2a/b$ grows past 3. The peak rises.',
        stop: 'The hole raises the tip radius from near zero to the hole radius, and $1 + 2\\sqrt{a/\\rho}$ falls. The peak falls.',
        strip: 'In a strip the net stress rises as the ligament shrinks, faster than $K_t$ falls. The peak rises.',
      }[$.change],
    ],
    second: ($) => {
      const S = $.S;
      const peaks = {
        bigger: [kirsch(S, 0.004, 0.004, 90).st, kirsch(S, 0.008, 0.008, 90).st],
        turn: [S * ktEllipse(0.002, 0.01), S * ktEllipse(0.01, 0.002)],
        stop: [S * ktTip(0.01, 1e-5), S * ktTip(0.0115, 0.0015)],
        strip: [holeInStrip(30e3, 0.06, 0.012, 0.01).peak, holeInStrip(30e3, 0.06, 0.024, 0.01).peak],
      }[$.change];
      const r = peaks[1] / peaks[0];
      return { effect: Math.abs(r - 1) < 1e-9 ? 'same' : r > 1 ? 'rises' : 'falls' };
    },
    cases: [
      kase(cite('stress-concentration'), { change: 'bigger', S: 40 }, { effect: 'same' }),
      kase(cite('stress-concentration'), { change: 'turn', S: 40 }, { effect: 'rises' }),
      kase(cite('stress-concentration'), { change: 'stop', S: 40 }, { effect: 'falls' }),
      kase(cite('stress-concentration'), { change: 'strip', S: 40 }, { effect: 'rises' }),
    ],
  }),
];

export default ch4;
