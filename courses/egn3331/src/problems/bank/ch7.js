/**
 * Transverse shear in a rectangle and an I, nail spacing on three dressed 2×6 boards,
 * the force in one nail of the APA garage-door header, the flow around a flange, and the shear
 * centre of a channel.
 */
import { M_PER_FT, N_PER_LBF } from '@flux/subjects/convert.js';
import {
  bandQ, fastenerSpacing, iBands, iSection, rectShear, shearFlow, stackedBoards,
} from '@flux/subjects/mechanics/materials.js';
import { channel } from '@flux/subjects/mechanics/thinwall.js';
import {
  PLF_TO_NPM, headerInchForce, headerNail,
} from '../../data/header.js';
import {
  BOARD_B, BOARD_N, BOARD_T, EYE_BF, EYE_HW, EYE_TF, EYE_TW,
} from '../../data/shear.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const KN = 1000;
const MPA = 1e6;
const MM = 1e-3;

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
      String.raw`At the neutral axis $Q$ is the first moment of the upper half, and the width at the cut is $b$.`,
    ],
    steps: ($, sig) => [
      String.raw`At the neutral axis $Q = b(h/2)(h/4) = ${sig(($.b * $.h * $.h) / 8 / 1e-9 / 1e3)}\times 10^3$ mm³ and $I = bh^3/12 = ${sig(($.b * $.h ** 3) / 12 / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
      String.raw`$\tau = VQ/(Ib)$, which simplifies to $3V/(2bh)$ on a rectangle.`,
      String.raw`$\tau_{\max} = ${sig(rectShear($.V, $.b, $.h, 0).tau / MPA)}$ MPa.`,
    ],
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
      String.raw`$Q$ is the first moment of the area above the cut. Write it for a cut at height $y$; it shrinks to zero at the top.`,
    ],
    steps: ($, sig) => {
      const tau = rectShear($.V, $.b, $.h, $.f * $.h / 2).tau / MPA;
      const peak = rectShear($.V, $.b, $.h, 0).tau / MPA;
      return [
        String.raw`The peak, at the axis, is $3V/(2bh) = ${sig(peak)}$ MPa.`,
        String.raw`At $${sig($.f)}$ of the way up, $2y/h = ${sig($.f)}$, so the parabola keeps $1 - ${sig($.f)}^2 = ${sig(1 - $.f * $.f)}$ of the peak.`,
        String.raw`$\tau = ${sig(tau)}$ MPa.`,
      ];
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
      String.raw`At the axis the cut runs through the web, so $t$ is the web. $Q$ counts the flange and the upper half of the web.`,
    ],
    steps: ($, sig) => {
      const sec = eye();
      const Qf = sec.Af * sec.yf;
      const Qw = (sec.tw * (sec.hw / 2) ** 2) / 2;
      return [
        String.raw`$I = ${sig(sec.I / 1e-12 / 1e6)}\times 10^6$ mm⁴. Above the axis: the flange gives $120\times 10\times 85 = ${sig(Qf / 1e-9 / 1e3)}\times 10^3$ mm³ and half the web $${sig(Qw / 1e-9 / 1e3)}\times 10^3$ mm³.`,
        String.raw`$Q = ${sig((Qf + Qw) / 1e-9 / 1e3)}\times 10^3$ mm³, and the cut at the axis is the 6 mm web.`,
        String.raw`$\tau = VQ/(It_w) = ${sig(eyeTau($.V) / MPA)}$ MPa.`,
      ];
    },
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
      V: range(1, 8, 0.1, 'kN', KN),
    },
    text: (T) => String.raw`Three dressed 2×6 boards, each 5.5 in wide and 1.5 in thick, are laid flat and stacked into one beam that carries ${T.V} kN of shear. Find the shear flow that the fasteners must carry at the top joint, in kN/m.`,
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
      'Cut along the top joint. The top board is the piece the joint holds, so its first moment is the $Q$ that matters.',
      String.raw`The stack is three board thicknesses deep, and the top board's centroid sits one thickness above the stack's neutral axis.`,
    ],
    steps: ($, sig) => {
      const s = stackedBoards(BOARD_B, BOARD_T, BOARD_N);
      return [
        String.raw`The stack is $${sig((3 * BOARD_T) / 1e-3)}$ mm deep: $I = b(3t)^3/12 = ${sig(s.I / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
        String.raw`The top board's area is $bt$ and its centroid is $t$ above the axis: $Q = bt^2 = ${sig(s.Q / 1e-9 / 1e3)}\times 10^3$ mm³.`,
        String.raw`$q = VQ/I = ${sig(boardFlow($.V) / KN)}$ kN/m.`,
      ];
    },
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
        s.F = 500;
      },
      read: (c) => ({ q: c.q }),
    },
    cases: [kase(cite('shear-flow'), { V: 3 }, { q: 34.99562554680665 })],
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
      V: range(1, 8, 0.5, 'kN', KN),
      F: range(0.3, 1.2, 0.05, 'kN', KN),
    },
    text: (T) => String.raw`Three dressed 2×6 boards, each 5.5 in wide and 1.5 in thick, are laid flat and nailed into one beam that carries ${T.V} kN of shear. Two nails share the joint at each station, and each nail can carry ${T.F} kN. How far apart may the stations be?`,
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
      'Find the shear flow at the top joint first. It is a force per length the nails must carry along the beam.',
      String.raw`One station of nails holds the flow over the length from it to the next station. Two nails share that load.`,
    ],
    steps: ($, sig) => {
      const q = boardFlow($.V);
      return [
        String.raw`Top joint: $q = VQ/I = ${sig(q / KN)}$ kN/m, the same section as the shear-flow problem.`,
        String.raw`Two nails at a station carry $2F = ${sig((2 * $.F) / KN)}$ kN.`,
        String.raw`$s = 2F/q = ${sig(fastenerSpacing(q, $.F, 2) * 1e3)}$ mm.`,
      ];
    },
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
    cases: [kase(cite('shear-flow'), { V: 3, F: 0.5 }, { s: 28.574999999999996 })],
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
    steps: ($, sig) => {
      const V = ($.load / PLF_TO_NPM) * ($.span / M_PER_FT) / 2;
      const nail = headerNail($.load, $.span, 0).nail / N_PER_LBF;
      return [
        String.raw`At the support $V = wL/2 = ${sig(V)}$ lbf.`,
        String.raw`One flange is two 2×4s, 3.5 in by 3 in, centred 10.5 in from the axis: $Q = 3.5(3)(10.5) = 110.3$ in³. The flow is $q = VQ/I = ${sig((nail * 4) / 1.5)}$ lb/in.`,
        String.raw`Four nail lines share each 1.5 in: one nail carries $q(1.5)/4 = ${sig(nail)}$ lbf.`,
      ];
    },
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
  problem({
    id: 'u7.7.flange',
    title: 'Shear flow in a flange',
    exam: 'u7',
    ch: '7',
    lab: 'shear',
    src: cite('thin-wall-flow'),
    topics: ['thin-wall-flow'],
    variety: ['unknown'],
    level: 3,
    vars: {
      bf: range(100, 200, 10, 'mm', MM),
      tf: range(8, 16, 1, 'mm', MM),
      tw: range(5, 10, 1, 'mm', MM),
      hw: range(150, 300, 10, 'mm', MM),
      V: range(10, 60, 5, 'kN', KN),
    },
    derive: ($) => {
      const sec = iSection($.bf, $.tf, $.tw, $.hw);
      const qJoin = ($.V * ($.bf / 2) * $.tf * sec.yf) / sec.I;
      return { I: sec.I, yf: sec.yf, qJoin, tauF: qJoin / $.tf, tauW: (2 * qJoin) / $.tw };
    },
    valid: ($) => $.tauW < 120 * MPA && $.bf / $.tw >= 12,
    text: (T) => String.raw`A wide-flange beam has flanges $${T.bf}$ mm by $${T.tf}$ mm and a web $${T.tw}$ mm thick and $${T.hw}$ mm tall between the flanges. It carries a shear of $${T.V}$ kN. Find the shear flow in one half of the top flange where it meets the web, the shear stress in the flange there, and the shear stress in the web just below the flange.`,
    parts: [
      num('qJoin', ($) => $.qJoin, 'N/mm', {
        scale: 1000,
        label: 'flow at the web',
        traps: [
          [($) => 2 * $.qJoin, 'That uses the whole flange. Each half flows from its own tip to the web.'],
        ],
      }),
      num('tauF', ($) => $.tauF, 'MPa', {
        scale: MPA,
        label: 'flange stress',
        traps: [
          [($) => $.qJoin / $.tw, 'That divides the flange flow by the web thickness. Across the flange the wall is $t_f$ thick.'],
        ],
      }),
      num('tauW', ($) => $.tauW, 'MPa', {
        scale: MPA,
        label: 'web stress below the flange',
        traps: [
          [($) => $.qJoin / $.tw, 'That counts one flange half. Both halves feed the web.'],
          [($) => (2 * $.qJoin) / $.bf, 'That divides by the flange width. Just below the flange the cut runs through the web.'],
        ],
      }),
    ],
    hints: [
      'Walk in from a flange tip. The flow at a cut is $VQ/I$, with $Q$ the first moment of the flange strip between the tip and the cut.',
      String.raw`At the web, one half-flange has $Q = (b_f/2)\,t_f\,y_f$, with $y_f = h_w/2 + t_f/2$. Two halves meet there and turn into the web.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = ${sig($.I / 1e-12 / 1e6)}\times 10^6$ mm⁴ and $y_f = ${sig($.yf / MM)}$ mm.`,
      String.raw`$Q = ${sig($.bf / 2 / MM)}\times ${sig($.tf / MM)}\times ${sig($.yf / MM)}$ mm³, so $q = VQ/I = ${sig($.qJoin / 1000)}$ N/mm, and $\tau_f = q/t_f = ${sig($.tauF / MPA)}$ MPa.`,
      String.raw`The web takes $2q$: $\tau_w = 2q/t_w = ${sig($.tauW / MPA)}$ MPa.`,
    ],
    second: ($) => {
      // The web just below the flange, by VQ/It with the whole flange as Q.
      const sec = iSection($.bf, $.tf, $.tw, $.hw);
      const Qflange = bandQ(iBands(sec), $.hw / 2);
      const tauW = ($.V * Qflange) / (sec.I * $.tw);
      return { qJoin: (tauW * $.tw) / 2 / 1000, tauF: (tauW * $.tw) / 2 / $.tf / MPA, tauW: tauW / MPA };
    },
    cases: [kase(cite('thin-wall-flow'), { bf: 120, tf: 10, tw: 6, hw: 160, V: 20 }, { qJoin: 52.555647155812025, tauF: 5.255564715581202, tauW: 17.51854905193734 })],
  }),

  problem({
    id: 'u7.7.shear-centre',
    title: 'The shear centre of a channel',
    exam: 'u7',
    ch: '7',
    lab: 'strut',
    src: cite('shear-centre'),
    topics: ['shear-centre'],
    variety: ['unknown'],
    level: 3,
    vars: {
      b: range(30, 80, 5, 'mm', MM),
      h: range(100, 250, 10, 'mm', MM),
      t: range(2, 6, 0.5, 'mm', MM),
      V: range(2, 10, 1, 'kN', KN),
    },
    derive: ($) => channel($.V, $.b, $.h, $.t, $.t),
    valid: ($) => $.h >= 1.5 * $.b,
    text: (T) => String.raw`A channel bent from $${T.t}$ mm sheet has flanges $${T.b}$ mm long and $${T.h}$ mm between flange centrelines (all centreline dimensions). Find the distance from the web centreline to the shear centre. If a vertical shear of $${T.V}$ kN is applied through the web centreline instead, what twisting moment does that add?`,
    parts: [
      num('e', ($) => $.e, 'mm', {
        scale: MM,
        label: 'e',
        traps: [
          [($) => $.b / 2, 'Half the flange length is a guess, not a balance. Set the couple of the flange forces equal to $Ve$.'],
          [($) => ($.b * $.b) / (2 * $.b + $.h), 'That is the centroid\'s distance from the web, on the flange side. The shear centre is behind the web.'],
        ],
      }),
      num('T', ($) => $.twist, 'N·m', {
        label: 'twisting moment',
        traps: [
          [($) => $.V * ($.b / 2), 'That uses half the flange as the offset.'],
        ],
      }),
    ],
    hints: [
      'The flange flows run opposite ways in the two flanges, so their forces make a couple. The load must make an equal and opposite couple about the web.',
      String.raw`Each flange carries $F = V t b^2 h/(4I)$, with the thin-wall $I = t h^3/12 + b t h^2/2$. Then $Ve = Fh$.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = t h^3/12 + b t h^2/2 = ${sig($.I / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
      String.raw`Each flange carries $F = V t b^2 h/(4I) = ${sig($.F)}$ N. Then $e = Fh/V = ${sig($.e / MM)}$ mm behind the web.`,
      String.raw`Through the web the load is $e$ off the shear centre: $T = Ve = ${sig($.twist)}$ N·m.`,
    ],
    second: ($) => ({ e: ((3 * $.b * $.b) / ($.h + 6 * $.b)) / MM, T: ($.V * 3 * $.b * $.b) / ($.h + 6 * $.b) }),
    cases: [kase(cite('shear-centre'), { b: 50, h: 150, t: 3, V: 5 }, { e: 16.666666666666668, T: 83.33333333333334 })],
  }),

  problem({
    id: 'u7.7.load-where',
    title: 'Where to load a section so it does not twist',
    exam: 'u7',
    ch: '7',
    lab: 'strut',
    src: cite('shear-centre'),
    kind: 'conceptual',
    topics: ['shear-centre'],
    variety: ['representation'],
    level: 2,
    vars: {
      sec: choice(
        ['channel', 'a thin channel, flanges pointing right'],
        ['eye', 'a symmetric I'],
        ['angle', 'an equal-leg angle'],
        ['box', 'a closed square tube'],
      ),
      V: range(1, 20, 1, 'kN', KN),
    },
    text: (T) => String.raw`A vertical load of $${T.V}$ kN acts on ${T.sec}. Through which point must the load pass for the member to bend without twisting?`,
    parts: [
      mc('where', [
        ['centroid', 'The centroid.', 'A section with two axes of symmetry has its shear centre at the centroid; the flows balance by symmetry.'],
        ['behind', 'A point behind the web, on the side away from the flanges.', 'A channel\'s two flange forces make a couple, so the load must sit behind the web to balance it.'],
        ['corner', 'The corner where the legs meet.', 'An angle\'s flow runs along its two legs, and both legs\' forces pass through the corner.'],
        ['web', 'The web centreline.', 'The web carries the vertical shear, but in an open section the flange flows add a moment about it.'],
      ], ($) => ({ channel: 'behind', eye: 'centroid', angle: 'corner', box: 'centroid' }[$.sec])),
    ],
    hints: [
      'Follow the shear flow around the wall and ask where the resultant of all the wall forces acts.',
      'Symmetry about both axes cancels any twist at the centroid. In a channel the flange flows form a couple. In an angle every wall force passes through one point.',
    ],
    steps: ($) => [
      {
        channel: 'The flange forces form a couple, so the load must act a distance e behind the web.',
        eye: 'Two axes of symmetry: the shear centre is the centroid.',
        angle: 'Both legs\' forces pass through the corner, so the shear centre is there.',
        box: 'Two axes of symmetry: the shear centre is the centroid.',
      }[$.sec],
    ],
    second: ($) => {
      // A channel with real flanges has e > 0; with no flanges it collapses onto the web.
      if ($.sec === 'channel') return { where: channel($.V, 0.05, 0.15, 0.003, 0.003).e > 0 ? 'behind' : 'web' };
      return { where: $.sec === 'angle' ? 'corner' : 'centroid' };
    },
    cases: [
      kase(cite('shear-centre'), { sec: 'channel', V: 5 }, { where: 'behind' }),
      kase(cite('shear-centre'), { sec: 'eye', V: 5 }, { where: 'centroid' }),
      kase(cite('shear-centre'), { sec: 'angle', V: 5 }, { where: 'corner' }),
    ],
  }),
];

export default ch7;
