/**
 * Transverse shear in a rectangle and an I, nail spacing on three boards,
 * and the force in one nail of the APA garage-door header.
 */
import { M_PER_FT, N_PER_LBF } from '@flux/subjects/convert.js';
import {
  bandQ, fastenerSpacing, iBands, iSection, rectShear, shearFlow, stackedBoards,
} from '@flux/subjects/mechanics/materials.js';
import {
  PLF_TO_NPM, headerInchForce, headerNail,
} from '../../data/header.js';
import {
  BOARD_B, BOARD_N, BOARD_T, EYE_BF, EYE_HW, EYE_TF, EYE_TW,
} from '../../data/shear.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const KN = 1000;
const MPA = 1e6;

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

const eye = () => iSection(EYE_BF, EYE_TF, EYE_TW, EYE_HW);

function eyeTau(V) {
  const sec = eye();
  const Q = bandQ(iBands(sec), 0);
  return (V * Q) / (sec.I * sec.tw);
}

function boardFlow(V) {
  const boards = stackedBoards(BOARD_B, BOARD_T, BOARD_N);
  return shearFlow(V, boards.Q, boards.I);
}

const ch7 = [
  problem({
    id: 'u7.7.rect',
    title: 'Peak shear in a rectangle',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('transverse-shear'),
    topics: ['transverse-shear'],
    variety: ['representation'],
    level: 1,
    vars: {
      V: range(4, 24, 1, 'kN', KN),
      b: range(20, 80, 10, 'mm', 1e-3),
      h: range(40, 160, 20, 'mm', 1e-3),
    },
    text: (T) => String.raw`A rectangular section ${T.b} mm wide and ${T.h} mm deep carries a shear of ${T.V} kN. Find the shear stress at the neutral axis.`,
    parts: [
      num('tau', ($) => rectShear($.V, $.b, $.h, 0).tau, 'MPa', {
        scale: MPA,
        label: 'peak shear stress',
        traps: [
          [($) => $.V / ($.b * $.h), 'That is the average $V/A$. The peak on a rectangle is $3V/(2A)$.'],
          [($) => (2 * $.V) / ($.b * $.h), 'Twice the average is past the peak. The factor is three halves, not two.'],
        ],
      }),
    ],
    hints: [
      'On a rectangle the peak is three halves of the average shear. The average is the shear divided by the area.',
      String.raw`$\tau_{\max} = 3V/(2bh)$, at the neutral axis.`,
    ],
    steps: ($, sig) => [String.raw`Peak shear ${sig(rectShear($.V, $.b, $.h, 0).tau / MPA)} MPa.`],
    second: ($) => ({ tau: (3 * $.V) / (2 * $.b * $.h) / MPA }),
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.V = $.V;
        s.b = $.b;
        s.h = $.h;
        s.y = 0;
      },
      read: (c) => ({ tau: c.tmax }),
    },
    cases: [kase(cite('transverse-shear'), { V: 10, b: 40, h: 80 }, { tau: 4.6875 })],
  }),

  problem({
    id: 'u7.7.profile',
    title: 'Shear partway up a rectangle',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('transverse-shear'),
    topics: ['transverse-shear', 'profile'],
    level: 2,
    vars: {
      V: range(5, 16, 1, 'kN', KN),
      b: range(30, 60, 10, 'mm', 1e-3),
      h: range(80, 140, 20, 'mm', 1e-3),
      f: range(0.3, 0.5, 0.05, '', 1),
    },
    valid: ($) => {
      const peak = rectShear($.V, $.b, $.h, 0).tau;
      const tau = peak * (1 - $.f * $.f);
      return rel(tau, peak) && rel(tau, $.V / ($.b * $.h));
    },
    text: (T) => String.raw`A rectangle ${T.b} mm by ${T.h} mm carries ${T.V} kN of shear. Find the shear stress at ${T.f} of the distance from the neutral axis to the top fiber.`,
    parts: [
      num('tau', ($) => rectShear($.V, $.b, $.h, $.f * $.h / 2).tau, 'MPa', {
        scale: MPA,
        label: 'shear stress',
        traps: [
          [($) => rectShear($.V, $.b, $.h, 0).tau, 'That is the peak, at the axis. This station is up the parabola.'],
          [($) => $.V / ($.b * $.h), 'That is the average over the whole area, not the stress at this station.'],
        ],
      }),
    ],
    hints: [
      'The shear stress on a rectangle falls as a parabola from the axis to the outer fiber. The outer fiber is zero.',
      String.raw`$\tau = \tau_{\max}(1 - (2y/h)^2)$, with $y$ measured from the neutral axis.`,
    ],
    steps: ($, sig) => {
      const tau = rectShear($.V, $.b, $.h, $.f * $.h / 2).tau / MPA;
      return [String.raw`Shear stress ${sig(tau)} MPa.`];
    },
    second: ($) => {
      const peak = (3 * $.V) / (2 * $.b * $.h);
      return { tau: peak * (1 - $.f * $.f) / MPA };
    },
    sim: {
      scenario: 'high',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.V = $.V;
        s.b = $.b;
        s.h = $.h;
        s.y = $.f * $.h / 2;
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [kase(cite('transverse-shear'), { V: 10, b: 40, h: 80, f: 0.5 }, { tau: 3.515625 })],
  }),

  problem({
    id: 'u7.7.web',
    title: 'Web shear in an I',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('transverse-shear'),
    topics: ['transverse-shear', 'web'],
    level: 2,
    vars: {
      V: range(8, 40, 0.5, 'kN', KN),
    },
    text: (T) => String.raw`An I section has a 6 mm by 160 mm web and two 120 mm by 10 mm flanges. The shear is ${T.V} kN. Find the shear stress in the web at the neutral axis.`,
    parts: [
      num('tau', ($) => eyeTau($.V), 'MPa', {
        scale: MPA,
        label: 'web shear stress',
        traps: [
          [($) => eyeTau($.V) * (EYE_TW / EYE_BF), 'The flange width was used as the thickness at the axis. The cut through the web is the web thickness.'],
          [($) => $.V / eye().A, 'That is $V/A$ for the whole section. The web stress is $VQ/(It)$.'],
        ],
      }),
    ],
    hints: [
      'Q at the axis is the first moment of the flange plus the first moment of the upper half of the web. Divide by I and by the web thickness.',
      String.raw`$\tau = VQ/(I t_w)$ at the neutral axis.`,
    ],
    steps: ($, sig) => [String.raw`Web stress ${sig(eyeTau($.V) / MPA)} MPa.`],
    second: ($) => {
      const sec = eye();
      const Q = sec.Af * sec.yf + (sec.tw * sec.hw * sec.hw) / 8;
      return { tau: ($.V * Q) / (sec.I * sec.tw) / MPA };
    },
    sim: {
      scenario: 'eye',
      setup(s, $) {
        s.scenarioId = 'eye';
        s.V = $.V;
        s.y = 0;
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [kase(cite('transverse-shear'), { V: 20 }, { tau: 20.816158285243187 })],
  }),

  problem({
    id: 'u7.7.flow',
    title: 'Shear flow in the top board',
    exam: 'u7',
    ch: '7',
    lab: 'nails',
    src: cite('shear-flow'),
    topics: ['shear-flow'],
    level: 2,
    vars: {
      V: range(4, 16, 0.2, 'kN', KN),
    },
    text: (T) => String.raw`Three boards, each 40 mm by 30 mm, are stacked and carry ${T.V} kN of shear. Find the shear flow that the fasteners must carry at the top joint.`,
    parts: [
      num('q', ($) => boardFlow($.V), 'kN/m', {
        scale: KN,
        label: 'shear flow',
        traps: [
          [($) => boardFlow($.V) / BOARD_B, 'Dividing by the board width turns the flow into a stress. The flow is $VQ/I$, with no extra thickness.'],
          [($) => 0, 'The first moment of the whole stack about the neutral axis is zero. The flow uses only the area the fasteners are holding on, the top board.'],
        ],
      }),
    ],
    hints: [
      'The top board is the piece the joint is holding. Its first moment is its area times the distance from the neutral axis up to its own centroid.',
      String.raw`q = VQ/I. Q is the top board alone.`,
    ],
    steps: ($, sig) => [String.raw`Shear flow ${sig(boardFlow($.V) / KN)} kN/m.`],
    second: ($) => {
      const yf = (3 * BOARD_T) / 2 - BOARD_T / 2;
      const Q = BOARD_B * BOARD_T * yf;
      const I = (BOARD_B * (3 * BOARD_T) ** 3) / 12;
      return { q: ($.V * Q) / I / KN };
    },
    sim: {
      scenario: 'pair',
      setup(s, $) {
        s.V = $.V;
        s.b = BOARD_B;
        s.t = BOARD_T;
        s.lines = 2;
        s.F = 1200;
      },
      read: (c) => ({ q: c.q }),
    },
    cases: [kase(cite('shear-flow'), { V: 8 }, { q: 118.5185185185185 })],
  }),

  problem({
    id: 'u7.7.space',
    title: 'Nail spacing along the beam',
    exam: 'u7',
    ch: '7',
    lab: 'nails',
    src: cite('shear-flow'),
    topics: ['shear-flow'],
    variety: ['goal'],
    level: 3,
    vars: {
      V: range(4, 16, 1, 'kN', KN),
      F: range(0.6, 2.4, 0.2, 'kN', KN),
    },
    text: (T) => String.raw`Three boards, each 40 mm by 30 mm, are stacked flat and nailed into one beam that carries ${T.V} kN of shear. Two nails share the joint at each station, and each nail can carry ${T.F} kN. How far apart may the stations be?`,
    parts: [
      num('s', ($) => fastenerSpacing(boardFlow($.V), $.F, 2), 'mm', {
        scale: 1e-3,
        label: 'spacing',
        traps: [
          [($) => fastenerSpacing(boardFlow($.V), $.F, 1), 'That spacing belongs to one nail. Two nails share the flow, so they may sit twice as far apart.'],
          [($) => boardFlow($.V) / $.F, 'The flow was divided by the nail the wrong way up. Spacing is the capacity over the flow.'],
        ],
      }),
    ],
    hints: [
      'Find the shear flow first. The two nails together can carry twice one nail. Divide that capacity by the flow.',
      String.raw`s = nF/q, with two nails at each station.`,
    ],
    steps: ($, sig) => [String.raw`Spacing ${sig(fastenerSpacing(boardFlow($.V), $.F, 2) * 1e3)} mm.`],
    second: ($) => {
      const q = boardFlow($.V);
      return { s: (2 * $.F) / q * 1e3 };
    },
    sim: {
      scenario: 'pair',
      setup(s, $) {
        s.V = $.V;
        s.F = $.F;
        s.lines = 2;
        s.b = BOARD_B;
        s.t = BOARD_T;
      },
      read: (c) => ({ s: c.spacing }),
    },
    cases: [kase(cite('shear-flow'), { V: 8, F: 1.2 }, { s: 20.25 })],
  }),

  problem({
    id: 'u7.7.header',
    title: 'Nail force in a garage header',
    exam: 'u7',
    ch: '7',
    lab: 'header',
    src: cite('shear-flow'),
    topics: ['shear-flow', 'english'],
    variety: ['units'],
    level: 2,
    vars: {
      span: range(12, 24, 1, 'ft', M_PER_FT),
      load: range(200, 500, 25, 'lb/ft', PLF_TO_NPM),
    },
    valid: ($) => {
      const plf = $.load / PLF_TO_NPM;
      const nail = headerNail($.load, $.span, 0).nail;
      const moment = nail * ($.span / 4);
      return rel(plf, 413) && rel(nail, 2 * nail) && rel(nail, moment);
    },
    text: (T) => String.raw`A 24 in nailed box header, cross section B of APA Z416T, spans ${T.span} ft and carries ${T.load} lb/ft. Four nail lines share each flange, at 1.5 in along the beam. Find the force in one nail at the support.`,
    parts: [
      num('nail', ($) => headerNail($.load, $.span, 0).nail, 'lbf', {
        scale: N_PER_LBF,
        label: 'force in one nail',
        traps: [
          [($) => headerNail($.load * (413 / ($.load / PLF_TO_NPM)), $.span, 0).nail, '413 plf is the table allowable at 18 ft, not the load in this problem.'],
          [($) => 2 * headerNail($.load, $.span, 0).nail, 'Two lines were used. Section B has two laminations and two webs, so four lines share the flange.'],
        ],
      }),
    ],
    hints: [
      'The support shear on a simple span is the line load times half the span. The flange flow is that shear times Q/I, and four nails share each spacing.',
      'Work in inches. Q of one flange is its area times 10.5 in. Divide the flow by four lines and multiply by the 1.5 in spacing.',
    ],
    steps: ($, sig) => [String.raw`One nail carries ${sig(headerNail($.load, $.span, 0).nail / N_PER_LBF)} lbf.`],
    second: ($) => ({ nail: headerInchForce($.load / PLF_TO_NPM, $.span / M_PER_FT) }),
    sim: {
      scenario: 'design',
      setup(s, $) {
        s.L = $.span;
        s.w = $.load;
        s.x = 0;
      },
      read: (c) => ({ nail: c.nail }),
    },
    cases: [kase(cite('shear-flow'), { span: 18, load: 363 }, { nail: 39.598367414248024 })],
  }),

  problem({
    id: 'u7.7.where',
    title: 'Where the shear stress is largest',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('transverse-shear'),
    kind: 'conceptual',
    topics: ['transverse-shear', 'profile'],
    variety: ['configuration'],
    level: 1,
    vars: {
      station: choice(['axis', 'the neutral axis'], ['edge', 'near the outer fiber']),
      mag: range(4, 24, 0.5, 'kN', KN),
    },
    text: (T) => String.raw`A 40 mm by 80 mm rectangle carries ${T.mag} kN of shear. The cut is at ${T.station}. How does the shear stress there compare with the peak?`,
    parts: [
      mc('which', [
        ['peak', 'It is the peak.', 'On a rectangle the shear stress is largest at the neutral axis. Bending stress is zero there.'],
        ['smaller', 'It is smaller than the peak.', 'The parabola falls to zero at the outer fiber, so a cut near the surface is below the peak.'],
        ['zero', 'It is zero, because bending stress is zero on the axis.', 'Zero bending stress does not make the shear zero. The shear is largest where the bending stress is zero.'],
        ['larger', 'It is larger than the value at the axis.', 'Nothing on the section exceeds the stress at the neutral axis.'],
      ], ($) => ($.station === 'axis' ? 'peak' : 'smaller')),
    ],
    hints: [
      'Bending stress and shear stress peak in opposite places. The shear parabola is highest at the axis.',
      'The outer fiber is the end of that parabola, so the stress there is zero.',
    ],
    steps: ($) => [
      $.station === 'axis'
        ? 'The cut is on the axis, which is the peak.'
        : 'The cut is near the outer fiber, below the peak.',
    ],
    second: ($) => ({ which: $.station === 'axis' ? 'peak' : 'smaller' }),
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.V = $.mag;
        s.b = 0.04;
        s.h = 0.08;
        s.y = $.station === 'axis' ? 0 : 0.036;
      },
      read: (c) => ({ which: Math.abs(c.tau - c.tmax) / c.tmax < 0.02 ? 'peak' : 'smaller' }),
    },
    cases: [
      kase(cite('transverse-shear'), { station: 'axis', mag: 10 }, { which: 'peak' }),
      kase(cite('transverse-shear'), { station: 'edge', mag: 10 }, { which: 'smaller' }),
    ],
  }),

  problem({
    id: 'u7.7.carry',
    title: 'What doubling does to the peak',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('transverse-shear'),
    kind: 'conceptual',
    topics: ['transverse-shear'],
    variety: ['configuration'],
    level: 2,
    vars: {
      change: choice(['depth', 'the depth'], ['load', 'the shear']),
      mag: range(4, 20, 0.5, 'kN', KN),
    },
    text: (T) => String.raw`A rectangle carries ${T.mag} kN of shear. Double ${T.change} and leave the other dimensions alone. What happens to the peak shear stress?`,
    parts: [
      mc('which', [
        ['half', 'It halves.', 'Peak shear on a rectangle is $3V/(2bh)$. Twice the depth halves it. Bending stress would have fallen to a quarter.'],
        ['double', 'It doubles.', 'The peak is linear in the shear, so twice the shear is twice the stress.'],
        ['quarter', 'It falls to a quarter.', 'A quarter is the bending-stress rule for twice the depth. Shear only halves.'],
        ['same', 'It does not change.', 'Both the depth and the shear are in the formula. Changing either one changes the stress.'],
      ], ($) => ($.change === 'depth' ? 'half' : 'double')),
    ],
    hints: [
      'On a rectangle the peak shear depends on the area, so the depth appears once. Bending stress depends on the depth squared.',
      'The shear V is in the numerator. Doubling it doubles the stress at every station.',
    ],
    steps: ($) => [
      $.change === 'depth'
        ? 'Twice the depth halves the peak shear stress.'
        : 'Twice the shear doubles the peak shear stress.',
    ],
    second: ($) => ({ which: $.change === 'depth' ? 'half' : 'double' }),
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.V = $.change === 'load' ? 2 * $.mag : $.mag;
        s.b = 0.04;
        s.h = $.change === 'depth' ? 0.16 : 0.08;
        s.y = 0;
      },
      read: (c, _state, $) => {
        const base = (3 * $.mag) / (2 * 0.04 * 0.08);
        const ratio = c.tmax / base;
        const which = Math.abs(ratio - 0.5) < 0.05 ? 'half' : Math.abs(ratio - 2) < 0.05 ? 'double' : 'same';
        return { which };
      },
    },
    cases: [
      kase(cite('transverse-shear'), { change: 'depth', mag: 10 }, { which: 'half' }),
      kase(cite('transverse-shear'), { change: 'load', mag: 10 }, { which: 'double' }),
    ],
  }),

  problem({
    id: 'u7.7.nailwhere',
    title: 'Where the header nails work',
    exam: 'u7',
    ch: '7',
    lab: 'header',
    src: cite('shear-flow'),
    kind: 'conceptual',
    topics: ['shear-flow'],
    variety: ['position'],
    level: 1,
    vars: {
      station: choice(['support', 'the support'], ['middle', 'midspan']),
      load: range(200, 450, 10, 'lb/ft', PLF_TO_NPM),
    },
    text: (T) => String.raw`The garage header is a simple span carrying ${T.load} lb/ft. At ${T.station}, what do the flange nails carry?`,
    parts: [
      mc('which', [
        ['full', 'The largest force in the span.', 'Shear, and so the flange flow, is largest at the supports of a simple span.'],
        ['none', 'Essentially nothing.', 'The shear is zero at midspan, so the shear flow into the flange is zero there. The moment is largest at that same station.'],
        ['moment', 'A force that follows the bending moment.', 'The nails follow VQ/I. They do not follow the moment, which peaks where the shear is zero.'],
        ['half', 'Half of the support force, because the moment is half.', 'Midspan shear is zero, not half. Half the span is not half the shear.'],
      ], ($) => ($.station === 'support' ? 'full' : 'none')),
    ],
    hints: [
      'Shear flow is VQ/I. On a simple span, ask where V is largest and where it is zero.',
      'The bending moment peaks at midspan. That is the station where these nails go idle.',
    ],
    steps: ($) => [
      $.station === 'support'
        ? 'The support has the largest shear, so the nails carry their largest force there.'
        : 'Midspan shear is zero, so the flange nails carry nothing there.',
    ],
    second: ($) => ({ which: $.station === 'support' ? 'full' : 'none' }),
    sim: {
      scenario: 'design',
      setup(s, $) {
        s.w = $.load;
        s.L = 18 * M_PER_FT;
        s.x = $.station === 'support' ? 0 : s.L / 2;
      },
      read: (c) => ({ which: c.nail > 0.2 * c.nailMax ? 'full' : 'none' }),
    },
    cases: [
      kase(cite('shear-flow'), { station: 'support', load: 363 }, { which: 'full' }),
      kase(cite('shear-flow'), { station: 'middle', load: 363 }, { which: 'none' }),
    ],
  }),
];

export default ch7;
