/**
 * Slope and deflection by integrating M/EI, an off-center load whose lowest
 * point is not under the load, a propped cantilever, a pine shelf, two loads in one bracketed
 * equation, superposition from the table, and a beam fixed at both ends.
 */
import { M_PER_IN } from '@flux/subjects/convert.js';
import {
  cantileverTipDeflection, integrateFixed, integrateSimple, proppedUniform, rectInertia,
  simplePointDeflection, simpleUniformDeflection,
} from '@flux/subjects/mechanics/elastic.js';
import { fixedUniform, simpleMacaulay } from '@flux/subjects/mechanics/macaulay.js';
import { SHELF_B_IN, SHELF_H_IN, shelfOpen, shelfOpenInches } from '../../data/shelf.js';
import { choice, cite, kase, mc, num, problem, range, sym } from '../kit.js';

const KN = 1000;
const E = 200e9;
const ei = (b, h) => E * rectInertia(b, h);

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

function allowLoad($) {
  return (16 * ei($.b, $.h)) / (75 * $.L ** 3);
}

function allowByIntegral($) {
  const EI = ei($.b, $.h);
  const curve = integrateSimple((x) => ($.L * x) / 2 - (x * x) / 2, $.L, EI, 2000);
  const x = $.L / 2;
  let i = 1;
  while (i < curve.x.length && curve.x[i] < x) i += 1;
  const x0 = curve.x[i - 1];
  const x1 = curve.x[i];
  const t = (x - x0) / (x1 - x0);
  const yMid = curve.y[i - 1] * (1 - t) + curve.y[i] * t;
  return ($.L / 360) / (-yMid);
}

const ch12 = [
  problem({
    id: 'u8.12.tip',
    title: 'Cantilever tip deflection',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'cantilever'],
    variety: ['representation'],
    level: 1,
    vars: {
      P: range(1, 8, 1, 'kN', KN),
      L: range(1, 4, 0.5, 'm'),
      b: range(20, 60, 20, 'mm', 1e-3),
      h: range(40, 120, 20, 'mm', 1e-3),
    },
    derive: ($) => ({ E, I: rectInertia($.b, $.h) }),
    text: (T) => String.raw`A cantilever of length ${T.L} m has a rectangular section ${T.b} mm by ${T.h} mm and E of 200 GPa. A downward tip load of ${T.P} kN is applied. How far does the tip drop? Then write the drop as a formula in $P$, $L$, $E$ and $I$.`,
    parts: [
      num('drop', ($) => cantileverTipDeflection($.P, $.L, ei($.b, $.h)).drop, 'mm', {
        scale: 1e-3,
        label: 'tip deflection downward',
        traps: [
          [($) => ($.P * $.L ** 3) / (8 * ei($.b, $.h)), 'That is the tip drop of a uniform load, wL^4/8EI, with wL written in place of P. A point load is PL^3/3EI.'],
          [($) => ($.P * $.L ** 3) / (48 * ei($.b, $.h)), 'PL^3/48EI is the midspan drop of a simple span. This beam is fixed at one end.'],
        ],
      }),
      sym('dsym', 'P*L^3/(3*E*I)', { P: 'N', L: 'm', E: 'Pa', I: 'm^4' }, ($) => ($.P * $.L ** 3) / (3 * $.E * $.I), { unit: 'm', label: 'tip drop, as a formula' }),
    ],
    hints: [
      'Integrate EI y\'\' = M from the fixed end. The wall kills both the deflection and the slope.',
      String.raw`The tip moves down by $PL^3/(3EI)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = bh^3/12 = ${sig(rectInertia($.b, $.h) / 1e-12 / 1e6)}\times 10^6$ mm⁴, so $EI = ${sig(ei($.b, $.h))}$ N·m².`,
      String.raw`Integrating $EIy'' = -P(L - x)$ from the wall, with $y = y' = 0$ there, gives $\delta = PL^3/3EI$.`,
      String.raw`$\delta = ${sig(cantileverTipDeflection($.P, $.L, ei($.b, $.h)).drop * 1000)}$ mm.`,
    ],
    second: ($) => ({ drop: ($.P * $.L ** 3) / (3 * ei($.b, $.h)) * 1000 }),
    sim: {
      scenario: 'cantilever',
      setup(s, $) {
        s.scenarioId = 'cantilever';
        s.P = $.P;
        s.L = $.L;
        s.b = $.b;
        s.h = $.h;
        s.E = E;
      },
      read: (c) => ({ drop: c.drop }),
    },
    cases: [kase(cite('deflection'), { P: 2, L: 2, b: 40, h: 80 }, { drop: 15.625 })],
  }),

  problem({
    id: 'u8.12.uniform',
    title: 'Simple-span midspan deflection',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'uniform'],
    variety: ['representation'],
    level: 2,
    vars: {
      w: range(2, 10, 1, 'kN/m', KN),
      L: range(2, 6, 0.5, 'm'),
      b: range(20, 60, 20, 'mm', 1e-3),
      h: range(40, 120, 20, 'mm', 1e-3),
    },
    derive: ($) => ({ E, I: rectInertia($.b, $.h) }),
    text: (T) => String.raw`A beam ${T.L} m long is supported at both ends and carries ${T.w} kN/m downward. The section is ${T.b} mm by ${T.h} mm and E is 200 GPa. How far does midspan drop? Then write the drop as a formula in $w$, $L$, $E$ and $I$.`,
    parts: [
      num('drop', ($) => simpleUniformDeflection($.w, $.L, ei($.b, $.h)).drop, 'mm', {
        scale: 1e-3,
        label: 'midspan deflection downward',
        traps: [
          [($) => ($.w * $.L ** 4) / (8 * ei($.b, $.h)), 'wL^4/8EI is a cantilever with the same uniform load. A simple span is 5wL^4/384EI.'],
          [($) => ($.w * $.L ** 4) / (384 * ei($.b, $.h)), 'The 5 in the numerator is missing. The midspan drop is five times that.'],
        ],
      }),
      sym('dsym', '5*w*L^4/(384*E*I)', { w: 'N/m', L: 'm', E: 'Pa', I: 'm^4' }, ($) => (5 * $.w * $.L ** 4) / (384 * $.E * $.I), { unit: 'm', label: 'midspan drop, as a formula' }),
    ],
    hints: [
      'The moment is sagging. Integrate EI y\'\' = M and set the deflection to zero at both supports.',
      String.raw`Midspan drops $5wL^4/(384EI)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = bh^3/12 = ${sig(rectInertia($.b, $.h) / 1e-12 / 1e6)}\times 10^6$ mm⁴, so $EI = ${sig(ei($.b, $.h))}$ N·m².`,
      String.raw`With $y = 0$ at both supports and zero slope at midspan by symmetry, $\delta = 5wL^4/384EI$.`,
      String.raw`$\delta = ${sig(simpleUniformDeflection($.w, $.L, ei($.b, $.h)).drop * 1000)}$ mm.`,
    ],
    second: ($) => ({ drop: (5 * $.w * $.L ** 4) / (384 * ei($.b, $.h)) * 1000 }),
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.scenarioId = 'uniform';
        s.w = $.w;
        s.L = $.L;
        s.b = $.b;
        s.h = $.h;
        s.E = E;
      },
      read: (c) => ({ drop: c.drop }),
    },
    cases: [kase(cite('deflection'), { w: 5, L: 4, b: 40, h: 80 }, { drop: 48.828125 })],
  }),

  problem({
    id: 'u8.12.offset',
    title: 'Lowest point of an off-center load',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'offset'],
    variety: ['position'],
    level: 2,
    vars: {
      P: range(5, 15, 1, 'kN', KN),
      L: range(3, 6, 0.5, 'm'),
      aFrac: range(0.2, 0.35, 0.05, ''),
    },
    valid: ($) => {
      const beam = simplePointDeflection($.P, $.L, $.aFrac * $.L, ei(0.04, 0.08));
      const centered = ($.P * $.L ** 3) / (48 * ei(0.04, 0.08));
      return rel(beam.xMax, $.aFrac * $.L) && rel(beam.xMax, $.L / 2)
        && rel(beam.drop, beam.under) && rel(beam.drop, centered);
    },
    text: (T) => String.raw`A simple span of ${T.L} m carries ${T.P} kN at ${T.aFrac} of the span from the left. The section is 40 mm by 80 mm and E is 200 GPa. Where is the beam lowest, and how far does that point drop?`,
    parts: [
      num('x', ($) => simplePointDeflection($.P, $.L, $.aFrac * $.L, ei(0.04, 0.08)).xMax, 'm', {
        label: 'station of the lowest point',
        traps: [
          [($) => $.aFrac * $.L, 'That is the load. The moment peaks there. The slope is not zero there, so the deflection does not peak there.'],
          [($) => $.L / 2, 'Midspan is the lowest point only when the load is at midspan.'],
        ],
      }),
      num('drop', ($) => simplePointDeflection($.P, $.L, $.aFrac * $.L, ei(0.04, 0.08)).drop, 'mm', {
        scale: 1e-3,
        label: 'deflection at the lowest point',
        traps: [
          [($) => simplePointDeflection($.P, $.L, $.aFrac * $.L, ei(0.04, 0.08)).under, 'That is the drop under the load, not at the station where the slope is zero.'],
          [($) => ($.P * $.L ** 3) / (48 * ei(0.04, 0.08)), 'PL^3/48EI puts the load at midspan. This load is off center.'],
        ],
      }),
    ],
    hints: [
      'The moment peaks at the load. The deflection peaks where the slope is zero, in the longer part of the span.',
      String.raw`With the load a distance a from the left and a less than L/2, the lowest point is at $L - \sqrt{(L^2 - a^2)/3}$.`,
    ],
    steps: ($, sig) => {
      const beam = simplePointDeflection($.P, $.L, $.aFrac * $.L, ei(0.04, 0.08));
      const a = $.aFrac * $.L;
      return [
        String.raw`The load is at $a = ${sig(a)}$ m, so the longer side runs from the load to the right support.`,
        String.raw`Setting the slope of that side's curve to zero gives $x = L - \sqrt{(L^2 - a^2)/3} = ${sig(beam.xMax)}$ m.`,
        String.raw`There the curve drops $${sig(beam.drop * 1000)}$ mm, more than the $${sig(beam.under * 1000)}$ mm under the load.`,
      ];
    },
    second: ($) => {
      const a = $.aFrac * $.L;
      const b = $.L - a;
      const x = a >= b ? Math.sqrt(($.L * $.L - b * b) / 3) : $.L - Math.sqrt(($.L * $.L - a * a) / 3);
      const k = $.P / (6 * ei(0.04, 0.08) * $.L);
      const u = $.L - x;
      const y = x <= a
        ? -k * b * x * ($.L * $.L - b * b - x * x)
        : -k * a * u * ($.L * $.L - a * a - u * u);
      return { x, drop: -y * 1000 };
    },
    sim: {
      scenario: 'offset',
      setup(s, $) {
        s.scenarioId = 'offset';
        s.P = $.P;
        s.L = $.L;
        s.a = $.aFrac * $.L;
        s.b = 0.04;
        s.h = 0.08;
        s.E = E;
      },
      read: (c) => ({ x: c.xMax, drop: c.drop }),
    },
    cases: [kase(cite('deflection'), { P: 10, L: 4, aFrac: 0.25 }, { x: 4 - Math.sqrt(5), drop: 27.295751678464224 })],
  }),

  problem({
    id: 'u8.12.prop',
    title: 'Prop reaction and wall moment',
    exam: 'u8',
    ch: '12',
    lab: 'propped',
    src: cite('deflection'),
    topics: ['deflection', 'propped'],
    variety: ['configuration'],
    level: 2,
    vars: {
      w: range(1, 8, 0.5, 'kN/m', KN),
      L: range(2, 5, 0.5, 'm'),
    },
    text: (T) => String.raw`A cantilever of length ${T.L} m carries ${T.w} kN/m and is propped at the tip so the tip cannot move. The section is 40 mm by 80 mm and E is 200 GPa. Find the prop reaction and the wall moment.`,
    parts: [
      num('R', ($) => proppedUniform($.w, $.L, ei(0.04, 0.08)).R, 'kN', {
        scale: KN,
        label: 'upward prop reaction',
        traps: [
          [($) => ($.w * $.L) / 2, 'wL/2 is each reaction of a simple span. The prop on a cantilever carries 3wL/8.'],
          [($) => $.w * $.L, 'wL is the whole load, which is what the wall carries when there is no prop.'],
        ],
      }),
      num('M', ($) => proppedUniform($.w, $.L, ei(0.04, 0.08)).Mwall, 'kN·m', {
        scale: KN,
        label: 'wall moment',
        traps: [
          [($) => -($.w * $.L * $.L) / 2, 'wL²/2 is the wall moment with the prop removed. With the prop, that moment is a quarter as large.'],
          [($) => -($.w * $.L * $.L) / 12, 'wL²/12 is the end moment of a beam fixed at both ends. This far end is pinned, so the moment is wL²/8.'],
        ],
      }),
    ],
    hints: [
      'Equilibrium has one unknown too many. The extra equation is that the tip deflection is zero.',
      String.raw`Superpose a cantilever uniform load and an upward tip force. The prop is $3wL/8$, and the wall moment is $-wL^2/8$.`,
    ],
    steps: ($, sig) => {
      const beam = proppedUniform($.w, $.L, ei(0.04, 0.08));
      return [
        String.raw`Remove the prop: the tip would drop $wL^4/8EI$. A tip force $R$ lifts it $RL^3/3EI$.`,
        String.raw`The tip does not move: $R = 3wL/8 = ${sig(beam.R / KN)}$ kN upward.`,
        String.raw`Wall moment: $RL - wL^2/2 = -wL^2/8 = ${sig(beam.Mwall / KN)}$ kN·m, hogging.`,
      ];
    },
    second: ($) => ({
      R: (3 * $.w * $.L) / 8 / KN,
      M: (-($.w * $.L * $.L) / 8) / KN,
    }),
    sim: {
      scenario: 'held',
      setup(s, $) {
        s.scenarioId = 'held';
        s.released = false;
        s.w = $.w;
        s.L = $.L;
        s.b = 0.04;
        s.h = 0.08;
        s.E = E;
      },
      read: (c) => ({ R: c.R, M: c.Mwall }),
    },
    cases: [kase(cite('deflection'), { w: 4, L: 3 }, { R: 4.5, M: -4.5 })],
  }),

  problem({
    id: 'u8.12.shelf',
    title: 'Sag of a pine shelf',
    exam: 'u8',
    ch: '12',
    lab: 'shelf',
    src: cite('deflection'),
    topics: ['deflection', 'english'],
    variety: ['units'],
    level: 2,
    vars: {
      span: range(36, 84, 6, 'in'),
      load: range(10, 50, 5, 'lb/ft'),
    },
    text: (T) => String.raw`A dressed 1 by 12 of eastern white pine, 0.75 in by 11.25 in, lies flat over ${T.span} in. Books weigh ${T.load} lb/ft. E is 1.24 million psi. How far does midspan drop, with no center bracket?`,
    parts: [
      num('sag', ($) => shelfOpen($.span, $.load).drop, 'in', {
        scale: M_PER_IN,
        label: 'midspan sag',
        traps: [
          [($) => shelfOpen($.span, $.load, 12, 1).drop, 'That uses the nominal 1 in by 12 in rectangle. The dressed board is 0.75 in by 11.25 in.'],
          [($) => shelfOpen($.span, $.load).drop * (384 / 40), 'wL^4/8EI is a cantilever. This shelf sits on a support at each end.'],
        ],
      }),
    ],
    hints: [
      'The shelf is a simple span with a uniform load. Stay in inches and pounds, and use the dressed thickness as the depth.',
      String.raw`Midspan drops $5wL^4/(384EI)$. I is $bh^3/12$ with h equal to 0.75 in.`,
    ],
    steps: ($, sig) => [
      String.raw`The 1×12 lies flat, so $h = 0.75$ in: $I = 11.25(0.75)^3/12 = 0.396$ in⁴, and $E = 1.24\times 10^6$ psi.`,
      String.raw`$w = ${sig($.load)}$ lb/ft $= ${sig($.load / 12)}$ lb/in.`,
      String.raw`$\delta = 5wL^4/384EI = ${sig(shelfOpenInches($.span, $.load))}$ in.`,
    ],
    second: ($) => ({ sag: shelfOpenInches($.span, $.load) }),
    sim: {
      scenario: 'open',
      setup(s, $) {
        s.scenarioId = 'open';
        s.brace = false;
        s.spanIn = $.span;
        s.plf = $.load;
        s.bIn = SHELF_B_IN;
        s.hIn = SHELF_H_IN;
      },
      read: (c) => ({ sag: c.drop }),
    },
    cases: [kase(cite('deflection'), { span: 72, load: 40 }, { sag: 2.3783225806451616 })],
  }),

  problem({
    id: 'u8.12.allow',
    title: 'Load that reaches L/360',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'uniform'],
    variety: ['goal'],
    level: 3,
    vars: {
      L: range(2, 6, 0.5, 'm'),
      b: range(20, 80, 20, 'mm', 1e-3),
      h: range(40, 120, 20, 'mm', 1e-3),
    },
    text: (T) => String.raw`A beam ${T.L} m long is supported at both ends. The section is ${T.b} mm by ${T.h} mm and E is 200 GPa. It carries a uniform load. Find the load that makes the midspan drop equal to L/360.`,
    parts: [
      num('w', ($) => allowLoad($), 'kN/m', {
        scale: KN,
        label: 'uniform load',
        traps: [
          [($) => (8 * ei($.b, $.h)) / (360 * $.L ** 3), 'That sets a cantilever tip, wL^4/8EI, equal to L/360. This beam is simply supported.'],
          [($) => (384 * ei($.b, $.h)) / (360 * $.L ** 3), 'The 5 in 5wL^4/384EI was dropped, so the load is five times too large.'],
        ],
      }),
    ],
    hints: [
      'Set the simple-span midspan drop equal to the span divided by 360, then solve for w.',
      String.raw`$5wL^4/(384EI) = L/360$, so $w = 16EI/(75L^3)$.`,
    ],
    steps: ($, sig) => [
      String.raw`The limit is $L/360 = ${sig(($.L / 360) * 1000)}$ mm at midspan.`,
      String.raw`Set $5wL^4/384EI = L/360$ and solve: $w = 384EI/(1800L^3)$, with $EI = ${sig(ei($.b, $.h))}$ N·m².`,
      String.raw`$w = ${sig(allowLoad($) / KN)}$ kN/m.`,
    ],
    second: ($) => ({ w: allowByIntegral($) / KN }),
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.scenarioId = 'uniform';
        s.L = $.L;
        s.b = $.b;
        s.h = $.h;
        s.E = E;
        s.w = allowLoad($);
      },
      read: (c) => ({ w: c.limitW }),
    },
    cases: [kase(cite('deflection'), { L: 4, b: 40, h: 80 }, { w: 256 / 225 })],
  }),

  problem({
    id: 'u8.12.where',
    title: 'Where the deflection peaks',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'offset'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 1,
    vars: {
      place: choice(['quarter', 'a quarter of the span from the left'], ['mid', 'at midspan']),
      mag: range(2, 8, 0.1, 'kN', KN),
    },
    text: (T) => String.raw`A simple span carries ${T.mag} kN downward, placed ${T.place}. Where is the beam lowest?`,
    parts: [
      mc('which', [
        ['off', 'Past the load, where the slope is zero.', 'The moment peaks under the load. With the load off center, the slope is still changing there, so the lowest point lies farther into the long half.'],
        ['at', 'Under the load.', 'When the load is at midspan, symmetry puts zero slope under the load. That is the one station where the two peaks coincide.'],
        ['wall', 'At a support.', 'Both supports are held at zero deflection. The beam cannot be lowest there.'],
        ['end', 'At the right-hand end, whatever the load position.', 'The right-hand end is a support. Its deflection is zero.'],
      ], ($) => ($.place === 'mid' ? 'at' : 'off')),
    ],
    hints: [
      'Deflection peaks where the slope changes sign. Moment peaks where the shear changes sign. Those stations match only in a symmetric case.',
      'Move the load to midspan and the two stations land on each other. Leave it at quarter span and they separate.',
    ],
    steps: ($) => [
      $.place === 'mid'
        ? 'The load is at midspan, and the slope is zero there, so the beam is lowest under the load.'
        : 'The load is at quarter span. The slope is zero farther along, so the lowest point is not under the load.',
    ],
    second: ($) => ({ which: $.place === 'mid' ? 'at' : 'off' }),
    sim: {
      scenario: 'offset',
      setup(s, $) {
        s.scenarioId = 'offset';
        s.P = $.mag;
        s.L = 4;
        s.a = $.place === 'mid' ? 2 : 1;
        s.b = 0.04;
        s.h = 0.08;
        s.E = E;
      },
      read: (c) => ({ which: Math.abs(c.xMax - c.a) < 0.02 * c.L ? 'at' : 'off' }),
    },
    cases: [kase(cite('deflection'), { place: 'quarter', mag: 10 }, { which: 'off' })],
  }),

  problem({
    id: 'u8.12.stiff',
    title: 'What doubles the stiffness',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('deflection'),
    topics: ['deflection', 'cantilever'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      change: choice(
        ['depth', 'the depth'],
        ['width', 'the width'],
        ['load', 'the tip load'],
      ),
      mag: range(1, 8, 0.2, 'kN', KN),
    },
    text: (T) => String.raw`A cantilever has a tip load of ${T.mag} kN. Double ${T.change}. What happens to the tip deflection?`,
    parts: [
      mc('which', [
        ['eighth', 'It falls to one eighth.', 'I of a rectangle grows with the depth cubed. Doubling the depth multiplies I by 8, and the deflection by 1/8. Bending stress would have fallen only to a quarter.'],
        ['half', 'It falls to one half.', 'Doubling the width doubles I and halves the deflection. Depth is the dimension that cubes.'],
        ['double', 'It doubles.', 'The tip deflection is linear in the load. Doubling the load doubles the drop. It does not square.'],
        ['same', 'It does not change.', 'Load, width, and depth all sit in PL^3/3EI. None of them leaves the tip where it was.'],
      ], ($) => ($.change === 'depth' ? 'eighth' : $.change === 'width' ? 'half' : 'double')),
    ],
    hints: [
      'The tip drop is PL^3 over 3EI. I is bh^3/12, so depth and width do not enter the same way.',
      'A factor of two in the load stays a factor of two. A factor of two in the depth becomes eight in I.',
    ],
    steps: ($) => [
      $.change === 'depth'
        ? 'Doubling the depth multiplies I by 8, so the tip drop falls to one eighth.'
        : $.change === 'width'
          ? 'Doubling the width doubles I, so the tip drop halves.'
          : 'The drop is linear in P, so doubling the load doubles it.',
    ],
    second: ($) => ({ which: $.change === 'depth' ? 'eighth' : $.change === 'width' ? 'half' : 'double' }),
    sim: {
      scenario: 'cantilever',
      setup(s, $) {
        s.scenarioId = 'cantilever';
        s.P = $.change === 'load' ? $.mag * 2 : $.mag;
        s.L = 2;
        s.b = $.change === 'width' ? 0.08 : 0.04;
        s.h = $.change === 'depth' ? 0.16 : 0.08;
        s.E = E;
      },
      read: (c, _state, $) => {
        const base = cantileverTipDeflection($.mag, 2, ei(0.04, 0.08)).drop;
        const ratio = c.drop / base;
        let which = 'same';
        if (Math.abs(ratio - 0.125) < 0.01) which = 'eighth';
        else if (Math.abs(ratio - 0.5) < 0.01) which = 'half';
        else if (Math.abs(ratio - 2) < 0.02) which = 'double';
        return { which };
      },
    },
    cases: [kase(cite('deflection'), { change: 'depth', mag: 2 }, { which: 'eighth' })],
  }),

  problem({
    id: 'u8.12.held',
    title: 'What the prop does to the tip',
    exam: 'u8',
    ch: '12',
    lab: 'propped',
    src: cite('deflection'),
    topics: ['deflection', 'propped'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      support: choice(['held', 'held by a prop'], ['free', 'left free']),
      mag: range(1, 8, 0.2, 'kN/m', KN),
    },
    text: (T) => String.raw`A uniform load of ${T.mag} kN/m stands on a cantilever. The tip is ${T.support}. What does the tip do?`,
    parts: [
      mc('which', [
        ['none', 'It stays put. The prop reaction is whatever force that requires.', 'Compatibility says the tip deflection is zero. That one condition finds the redundant force, 3wL/8 upward.'],
        ['full', 'It drops by wL^4/8EI, and the wall moment is wL^2/2.', 'With no prop the beam is a cantilever. The whole drop lands at the tip.'],
        ['half', 'It drops half as far as the unpropped tip.', 'The prop does not split the difference. It removes the tip deflection entirely.'],
        ['up', 'It rises, because the prop pushes up.', 'The prop pushes up, and the load pushes down. On this beam they meet at zero tip deflection, not at an upward one.'],
      ], ($) => ($.support === 'held' ? 'none' : 'full')),
    ],
    hints: [
      'A prop is a support you add because the deflection there is required to be zero.',
      'Take the prop away and the tip drop is the ordinary cantilever value, wL^4/8EI.',
    ],
    steps: ($) => [
      $.support === 'held'
        ? 'The prop holds the tip at zero deflection. The reaction is 3wL/8.'
        : 'The free tip drops by wL^4/8EI. The wall moment is wL^2/2.',
    ],
    second: ($) => ({ which: $.support === 'held' ? 'none' : 'full' }),
    sim: {
      scenario: 'held',
      setup(s, $) {
        s.w = $.mag;
        s.L = 3;
        s.b = 0.04;
        s.h = 0.08;
        s.E = E;
        s.released = $.support === 'free';
        s.scenarioId = $.support === 'free' ? 'free' : 'held';
      },
      read: (c) => ({ which: c.tipDrop < 1e-9 ? 'none' : 'full' }),
    },
    cases: [kase(cite('deflection'), { support: 'held', mag: 4 }, { which: 'none' })],
  }),
  problem({
    id: 'u8.12.two-loads',
    title: 'Two loads in one equation',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('discontinuity'),
    topics: ['discontinuity'],
    variety: ['configuration'],
    level: 3,
    vars: {
      L: range(3, 6, 0.5, 'm', 1),
      f1: range(0.15, 0.4, 0.05, '', 1),
      f2: range(0.7, 0.9, 0.05, '', 1),
      P1: range(2, 10, 1, 'kN', KN),
      P2: range(2, 10, 1, 'kN', KN),
      h: range(80, 160, 20, 'mm', 1e-3),
    },
    derive: ($) => {
      const a1 = Math.round($.L * $.f1 * 10) / 10;
      const a2 = Math.round($.L * $.f2 * 10) / 10;
      const EI = ei(0.04, $.h);
      const b = simpleMacaulay({ L: $.L, EI, points: [{ a: a1, P: $.P1 }, { a: a2, P: $.P2 }] });
      return { a1, a2, EI, RA: b.RA, C1: b.C1, mid: -b.y($.L / 2), slope0: -b.slope(0) };
    },
    valid: ($) => $.a2 - $.a1 >= 1 && $.mid > 1e-3 && $.mid < 0.08,
    text: (T, $) => String.raw`A steel beam ($E = 200$ GPa), 40 mm wide and $${T.h}$ mm deep, spans $${T.L}$ m on a pin and a roller. It carries $${T.P1}$ kN down at $${$.a1}$ m and $${T.P2}$ kN down at $${$.a2}$ m from the pin. Using one moment expression with discontinuity functions, find the left reaction, the midspan deflection, and the slope at the pin (as a magnitude).`,
    parts: [
      num('RA', ($) => $.RA, 'kN', { scale: KN, label: 'left reaction' }),
      num('mid', ($) => $.mid, 'mm', {
        scale: 1e-3,
        label: 'midspan drop',
        traps: [
          [($) => -(($.RA * ($.L / 2) ** 3) / 6 - ($.P1 * ($.L / 2 - $.a1) ** 3) / 6 - ($.P2 * ($.L / 2 - $.a2) ** 3) / 6 + $.C1 * ($.L / 2)) / $.EI, 'The second bracket was kept before its load. At midspan $\\langle x - a_2\\rangle$ is zero, not a negative cube.'],
          [($) => -simpleMacaulay({ L: $.L, EI: $.EI, points: [{ a: $.a1, P: $.P1 }] }).y($.L / 2), 'That is the first load alone. Both loads deflect midspan.'],
        ],
      }),
      num('slope0', ($) => $.slope0, 'rad', {
        abs: 1e-5,
        label: 'slope at the pin',
        traps: [
          [() => 0, 'A pin lets the beam turn. Its slope is $C_1/EI$, not zero.'],
        ],
      }),
    ],
    hints: [
      'Write one moment for the whole span: the left reaction times $x$, minus each load times its bracket $\\langle x - a\\rangle$. Integrate twice and use the two supports.',
      String.raw`$EI\,y = R_Ax^3/6 - P_1\langle x-a_1\rangle^3/6 - P_2\langle x-a_2\rangle^3/6 + C_1x$. $y(L) = 0$ fixes $C_1$, and the slope at the pin is $C_1/EI$.`,
    ],
    steps: ($, sig) => [
      String.raw`Moments about the pin: $R_A = ${sig($.RA / KN)}$ kN. $EI = ${sig($.EI)}$ N·m².`,
      String.raw`$y(L) = 0$ gives $C_1 = ${sig($.C1)}$ N·m², so the pin turns by $|C_1|/EI = ${sig($.slope0)}$ rad.`,
      String.raw`At midspan only the first bracket is on${$.a2 < $.L / 2 ? ' (and the second, since it is left of midspan)' : ''}: $\delta = ${sig($.mid * 1000)}$ mm.`,
    ],
    second: ($) => {
      // Superpose the two single-load closed forms.
      const one = simplePointDeflection($.P1, $.L, $.a1, $.EI);
      const two = simplePointDeflection($.P2, $.L, $.a2, $.EI);
      return {
        RA: ($.P1 * ($.L - $.a1) + $.P2 * ($.L - $.a2)) / $.L / KN,
        mid: -(one.at($.L / 2).y + two.at($.L / 2).y) / 1e-3,
        slope0: -(one.at(0).slope + two.at(0).slope),
      };
    },
    cases: [kase(cite('discontinuity'), { L: 4, f1: 0.25, f2: 0.75, P1: 6, P2: 4, h: 80 }, { RA: 5.5, mid: 26.85546875, slope0: 7750 / 341333.3333333333 })],
  }),

  problem({
    id: 'u8.12.superpose',
    title: 'Two loads by superposition',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('superposition'),
    topics: ['superposition'],
    variety: ['configuration'],
    level: 2,
    vars: {
      kind: choice(['simple', 'a simple span, with the point load at midspan'], ['cantilever', 'a cantilever, with the point load at the free end']),
      L: range(2, 5, 0.5, 'm', 1),
      w: range(1, 6, 0.5, 'kN/m', KN),
      P: range(2, 12, 1, 'kN', KN),
      h: range(100, 200, 20, 'mm', 1e-3),
    },
    derive: ($) => {
      const EI = ei(0.04, $.h);
      const [dw, dp] = $.kind === 'simple'
        ? [(5 * $.w * $.L ** 4) / (384 * EI), ($.P * $.L ** 3) / (48 * EI)]
        : [($.w * $.L ** 4) / (8 * EI), ($.P * $.L ** 3) / (3 * EI)];
      return { EI, dw, dp, total: dw + dp };
    },
    valid: ($) => $.total < 0.1 && $.total > 2e-3 && rel($.dw, $.dp),
    text: (T) => String.raw`A steel beam ($E = 200$ GPa), 40 mm wide and $${T.h}$ mm deep and $${T.L}$ m long, is ${T.kind}. It carries a uniform $${T.w}$ kN/m and a point load of $${T.P}$ kN. Find the largest deflection.`,
    parts: [
      num('total', ($) => $.total, 'mm', {
        scale: 1e-3,
        label: 'largest drop',
        traps: [
          [($) => $.dw, 'That is the uniform load alone. The point load adds its own deflection at the same station.'],
          [($) => $.dp, 'That is the point load alone.'],
          [($) => ($.kind === 'simple' ? ($.w * $.L ** 4) / (8 * $.EI) + ($.P * $.L ** 3) / (3 * $.EI) : (5 * $.w * $.L ** 4) / (384 * $.EI) + ($.P * $.L ** 3) / (48 * $.EI)), 'Those are the other support\'s formulas.'],
        ],
      }),
    ],
    hints: [
      'The deflection equation is linear in the loads. Find each load\'s deflection alone, at the same station, on the same supports, and add.',
      String.raw`Simple span, midspan: $5wL^4/384EI$ and $PL^3/48EI$. Cantilever, tip: $wL^4/8EI$ and $PL^3/3EI$.`,
    ],
    steps: ($, sig) => [
      String.raw`$EI = ${sig($.EI)}$ N·m². The uniform load alone: $${sig($.dw * 1000)}$ mm.`,
      String.raw`The point load alone: $${sig($.dp * 1000)}$ mm. Both peak at the same station.`,
      String.raw`Sum: $${sig($.total * 1000)}$ mm.`,
    ],
    second: ($) => {
      // One moment expression with both loads, integrated numerically.
      const M = $.kind === 'simple'
        ? (x) => ($.w * $.L / 2 + $.P / 2) * x - ($.w * x * x) / 2 - $.P * Math.max(0, x - $.L / 2)
        : (x) => -($.w * ($.L - x) ** 2) / 2 - $.P * ($.L - x);
      const curve = $.kind === 'simple' ? integrateSimple(M, $.L, $.EI, 4000, [$.L / 2]) : integrateFixed(M, $.L, $.EI, 4000);
      const i = $.kind === 'simple' ? curve.x.findIndex((x) => x >= $.L / 2 - 1e-12) : curve.x.length - 1;
      return { total: -curve.y[i] / 1e-3 };
    },
    cases: [kase(cite('superposition'), { kind: 'simple', L: 4, w: 5, P: 10, h: 80 }, { total: 87.890625 })],
  }),

  problem({
    id: 'u8.12.fixed',
    title: 'A beam fixed at both ends',
    exam: 'u8',
    ch: '12',
    lab: 'crossing',
    src: cite('fixed-ends'),
    topics: ['fixed-ends'],
    variety: ['unknown'],
    level: 2,
    vars: {
      L: range(3, 8, 0.5, 'm', 1),
      w: range(2, 12, 1, 'kN/m', KN),
      h: range(120, 240, 20, 'mm', 1e-3),
    },
    derive: ($) => ({ EI: ei(0.05, $.h), ...fixedUniform($.w, $.L, ei(0.05, $.h)) }),
    valid: ($) => $.drop > 1e-3 && $.drop < 0.05,
    text: (T) => String.raw`A steel beam ($E = 200$ GPa), 50 mm wide and $${T.h}$ mm deep, spans $${T.L}$ m between two rigid walls that it is fixed to. It carries a uniform $${T.w}$ kN/m. Find the size of the end moment, the midspan moment, and the midspan deflection.`,
    parts: [
      num('Me', ($) => $.Me, 'kN·m', {
        scale: KN,
        label: 'end moment',
        traps: [
          [($) => ($.w * $.L * $.L) / 8, 'That is the simple span\'s midspan moment. Fixed ends take $wL^2/12$.'],
        ],
      }),
      num('Mmid', ($) => $.Mmid, 'kN·m', {
        scale: KN,
        label: 'midspan moment',
        traps: [
          [($) => ($.w * $.L * $.L) / 8, 'That ignores the end moments, which lower the whole diagram by $wL^2/12$.'],
        ],
      }),
      num('drop', ($) => $.drop, 'mm', {
        scale: 1e-3,
        label: 'midspan drop',
        traps: [
          [($) => $.simpleDrop, 'That is the simple span. The fixed ends lift midspan by $M_eL^2/8EI$.'],
        ],
      }),
    ],
    hints: [
      'By symmetry the end moments are equal. Free the ends: the load turns each by $wL^3/24EI$, and the end moments must turn them back.',
      String.raw`Equal end moments turn each end of a simple span by $M_eL/2EI$, so $M_e = wL^2/12$. Midspan: $wL^2/8 - M_e$, and $\delta = 5wL^4/384EI - M_eL^2/8EI$.`,
    ],
    steps: ($, sig) => [
      String.raw`$wL^3/24EI = M_eL/2EI$ gives $M_e = wL^2/12 = ${sig($.Me / KN)}$ kN·m, hogging.`,
      String.raw`Midspan: $wL^2/8 - M_e = ${sig($.Mmid / KN)}$ kN·m.`,
      String.raw`$\delta = wL^4/384EI = ${sig($.drop * 1000)}$ mm, a fifth of the simple span's.`,
    ],
    second: ($) => {
      // Integrate from the left wall with the end moment unknown; pick it to leave the right end level.
      const slopeAt = (Me) => {
        const c = integrateFixed((x) => ($.w * $.L / 2) * x - ($.w * x * x) / 2 - Me, $.L, $.EI, 2000);
        return c.slope[c.slope.length - 1];
      };
      const s0 = slopeAt(0);
      const s1 = slopeAt(1000);
      const Me = (-s0 * 1000) / (s1 - s0);
      const c = integrateFixed((x) => ($.w * $.L / 2) * x - ($.w * x * x) / 2 - Me, $.L, $.EI, 2000);
      const mid = c.x.findIndex((x) => x >= $.L / 2 - 1e-12);
      return { Me: Me / KN, Mmid: (($.w * $.L * $.L) / 8 - Me) / KN, drop: -c.y[mid] / 1e-3 };
    },
    cases: [kase(cite('fixed-ends'), { L: 4, w: 5, h: 120 }, { Me: 6.666666666666667, Mmid: 3.3333333333333335, drop: (5e3 * 256) / (384 * 200e9 * (0.05 * 0.12 ** 3) / 12) / 1e-3 })],
  }),
  problem({
    id: 'u8.12.prop-point',
    title: 'A propped cantilever with a point load',
    exam: 'u8',
    ch: '12',
    lab: 'propped',
    src: cite('superposition'),
    topics: ['deflection', 'propped', 'superposition'],
    variety: ['configuration'],
    level: 3,
    vars: {
      P: range(4, 30, 1, 'kN', KN),
      L: range(2, 6, 0.5, 'm', 1),
    },
    text: (T) => String.raw`A beam $${T.L}$ m long is fixed to a wall at its left end and rests on a prop at its right end. It carries $${T.P}$ kN at midspan. Find the prop reaction, the size of the wall moment, and the moment under the load.`,
    parts: [
      num('R', ($) => (5 * $.P) / 16, 'kN', {
        scale: KN,
        label: 'prop reaction',
        traps: [
          [($) => $.P / 2, 'Half the load is the simple-span share. The wall is stiffer than a pin, so it takes more and the prop less.'],
        ],
      }),
      num('Mw', ($) => (3 * $.P * $.L) / 16, 'kN·m', {
        scale: KN,
        label: 'wall moment',
        traps: [
          [($) => ($.P * $.L) / 8, 'That is the end moment of a beam fixed at both ends. This far end is pinned, so the wall keeps more.'],
          [($) => ($.P * $.L) / 2, 'That is the cantilever with no prop.'],
        ],
      }),
      num('Mload', ($) => (5 * $.P * $.L) / 32, 'kN·m', {
        scale: KN,
        label: 'moment under the load',
        traps: [
          [($) => ($.P * $.L) / 4, 'That is the simple span. The wall\'s hogging moment lowers the whole diagram.'],
        ],
      }),
    ],
    hints: [
      'One support too many: take the prop force as the redundant. Remove the prop, find how far the tip would drop under the load, and how far the prop force alone lifts it.',
      String.raw`A cantilever with $P$ at $L/2$ drops at its tip by $5PL^3/48EI$. A tip force $R$ lifts it by $RL^3/3EI$. The real tip does not move.`,
    ],
    steps: ($, sig) => [
      String.raw`Compatibility: $5PL^3/48EI = RL^3/3EI$, so $R = 5P/16 = ${sig((5 * $.P) / 16 / KN)}$ kN.`,
      String.raw`Wall moment: $P(L/2) - RL = 3PL/16 = ${sig((3 * $.P * $.L) / 16 / KN)}$ kN·m, hogging.`,
      String.raw`Under the load, from the prop side: $R(L/2) = 5PL/32 = ${sig((5 * $.P * $.L) / 32 / KN)}$ kN·m, sagging.`,
    ],
    second: ($) => {
      // Integrate from the wall with the prop force unknown; pick it so the far end does not move.
      const EI = 1e6;
      const tip = (R) => {
        const M = (x) => R * ($.L - x) - $.P * Math.max(0, $.L / 2 - x);
        const c = integrateFixed(M, $.L, EI, 4000, [$.L / 2]);
        return c.y[c.y.length - 1];
      };
      const y0 = tip(0);
      const y1 = tip(1000);
      const R = (-y0 * 1000) / (y1 - y0);
      return { R: R / KN, Mw: ($.P * ($.L / 2) - R * $.L) / KN, Mload: (R * ($.L / 2)) / KN };
    },
    cases: [kase(cite('superposition'), { P: 10, L: 4 }, { R: 3.125, Mw: 7.5, Mload: 6.25 })],
  }),

  problem({
    id: 'u8.12.can-add',
    title: 'When two deflections may be added',
    exam: 'u8',
    ch: '12',
    lab: 'curve',
    src: cite('superposition'),
    kind: 'conceptual',
    topics: ['superposition'],
    variety: ['representation'],
    level: 2,
    vars: {
      sit: choice(
        ['same', 'both deflections are taken at midspan of the same simple span'],
        ['peaks', 'each deflection is that load\'s own largest one, and the two largest sit at different points'],
        ['yield', 'the combined load takes the beam past yield'],
        ['supports', 'one deflection is for the beam as a cantilever and the other as a simple span'],
      ),
      L: range(2, 6, 0.25, 'm', 1),
    },
    text: (T) => String.raw`A beam $${T.L}$ m long carries two loads. A student finds each load's deflection alone and adds them, where ${T.sit}. Is the sum the deflection under both loads?`,
    parts: [
      mc('verdict', [
        ['yes', 'Yes.', 'With the same supports, the same station and an elastic beam, $EIy\'\' = M$ is linear in the loads, so deflections add.'],
        ['over', 'No: it overstates the largest deflection.', 'Each case\'s largest deflection sits at its own point. At any one point the sum is smaller than the sum of the two peaks.'],
        ['yield', 'No: the beam is no longer linear.', 'Past yield, stiffness falls with load, so the response to both loads is not the sum of the responses.'],
        ['supports', 'No: the two cases are different beams.', 'Superposition adds solutions of one structure. A cantilever and a simple span have different boundary conditions.'],
      ], ($) => ({ same: 'yes', peaks: 'over', yield: 'yield', supports: 'supports' }[$.sit])),
    ],
    hints: [
      'Superposition rests on one equation, $EIy\'\' = M$, being linear, on one structure.',
      'Check three things: the same supports, the same station, and a material still on its elastic line.',
    ],
    steps: ($) => [
      {
        same: 'Same beam, same station, elastic: the deflections add.',
        peaks: 'The peaks sit at different points, so adding them overstates the true largest deflection.',
        yield: 'Past yield the beam is not linear, so superposition fails.',
        supports: 'Different supports make different structures; their solutions do not add.',
      }[$.sit],
    ],
    second: ($) => {
      if ($.sit !== 'same' && $.sit !== 'peaks') return { verdict: $.sit };
      // Two point loads on one span: compare the sum of peaks with the true peak.
      const EI = 1e6;
      const one = simpleMacaulay({ L: $.L, EI, points: [{ a: 0.2 * $.L, P: 1000 }] });
      const two = simpleMacaulay({ L: $.L, EI, points: [{ a: 0.8 * $.L, P: 1000 }] });
      const both = simpleMacaulay({ L: $.L, EI, points: [{ a: 0.2 * $.L, P: 1000 }, { a: 0.8 * $.L, P: 1000 }] });
      let p1 = 0;
      let p2 = 0;
      let pb = 0;
      for (let i = 0; i <= 400; i++) {
        const x = ($.L * i) / 400;
        p1 = Math.max(p1, -one.y(x));
        p2 = Math.max(p2, -two.y(x));
        pb = Math.max(pb, -both.y(x));
      }
      const mid = Math.abs(-one.y($.L / 2) - two.y($.L / 2) + both.y($.L / 2)) < 1e-12;
      return { verdict: $.sit === 'same' ? (mid ? 'yes' : 'over') : (p1 + p2 > pb * (1 + 1e-6) ? 'over' : 'yes') };
    },
    cases: [
      kase(cite('superposition'), { sit: 'same', L: 4 }, { verdict: 'yes' }),
      kase(cite('superposition'), { sit: 'peaks', L: 4 }, { verdict: 'over' }),
      kase(cite('superposition'), { sit: 'supports', L: 4 }, { verdict: 'supports' }),
    ],
  }),

];

export default ch12;
