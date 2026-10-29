/**
 * Shear and moment diagrams, bending stress in a rectangle and a tee,
 * a Southern Pine floor joist in psi, the uniform load that reaches an allowable bending stress,
 * an overhang and a couple drawn by areas, a band-saw blade's curvature, a tilted moment, and a
 * timber with a steel plate.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { flexureFibers, rectFibersReduced, rectSection, simpleBendingStress, teeSection } from '@flux/subjects/mechanics/materials.js';
import { generalBeam, internalAt, simplePoint, simpleUniform } from '@flux/subjects/mechanics/sections.js';
import { bentStripStress, compositeSection, tiltedRect } from '@flux/subjects/mechanics/bending.js';
import { JOIST_B, JOIST_DEAD, JOIST_H, PA_PER_PSF, joistLine } from '../../data/joist.js';
import { choice, cite, kase, mc, num, problem, range, sym } from '../kit.js';

const KN = 1000;
const MPA = 1e6;
const MM = 1e-3;
const DEG = Math.PI / 180;
const KSI = 1000 * PA_PER_PSI;
const E_STEEL = 29000 * KSI;
const E_STEEL_SI = 200e9;
const E_WOOD = 12.5e9;
const TEE = { bf: 0.12, tf: 0.012, tw: 0.012, hw: 0.1 };

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

const teeFibers = (M) => flexureFibers(M, teeSection(TEE.bf, TEE.tf, TEE.tw, TEE.hw));

function allowW($) {
  const modulus = ($.b * $.h * $.h) / 6;
  return (8 * $.sig * modulus) / ($.L * $.L);
}

const ch6 = [
  problem({
    id: 'u6.6.point',
    title: 'Point load on a simple beam',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('shear-moment'),
    topics: ['shear-moment'],
    variety: ['position'],
    level: 1,
    vars: {
      P: range(5, 20, 1, 'kN', KN),
      L: range(3, 6, 0.5, 'm', 1),
      aFrac: range(0.2, 0.35, 0.05, '', 1),
    },
    derive: ($) => ({ a: $.aFrac * $.L }),
    valid: ($) => {
      const left = $.P * (1 - $.aFrac);
      const M = left * $.aFrac * $.L;
      return rel(M, ($.P * $.L) / 4) && rel(left, $.P) && rel(left, $.P * $.aFrac);
    },
    text: (T) => String.raw`A simple beam of length ${T.L} m carries ${T.P} kN downward at ${T.aFrac} of the span from the left. Find the left reaction and the largest moment. Sagging is positive. Then write the largest moment as a formula in $P$, the load's distance $a$ from the left, and $L$.`,
    parts: [
      num('V', ($) => $.P * (1 - $.aFrac), 'kN', {
        scale: KN,
        label: 'left reaction',
        traps: [
          [($) => $.P, 'That is the whole load. The left reaction is $P(L-a)/L$.'],
          [($) => $.P * $.aFrac, 'That is the right reaction, $Pa/L$.'],
        ],
      }),
      num('M', ($) => $.P * (1 - $.aFrac) * $.aFrac * $.L, 'kN·m', {
        scale: KN,
        label: 'largest moment',
        traps: [
          [($) => ($.P * $.L) / 4, '$PL/4$ is the moment only when the load is at midspan.'],
          [($) => $.P * $.L, 'That is $P$ times the whole span. The other support carries part of the load.'],
        ],
      }),
      sym('Msym', 'P*a*(L-a)/L', { P: 'N', a: 'm', L: 'm' }, ($) => ($.P * $.a * ($.L - $.a)) / $.L, { unit: 'N*m', label: 'largest moment, as a formula' }),
    ],
    hints: [
      'The left support carries the share of the load set by the distance that remains on the right. The moment is largest at the load.',
      'Take moments about the right support for the left reaction. The moment peaks under the load, where the shear changes sign.',
    ],
    steps: ($, sig) => {
      const left = $.P * (1 - $.aFrac);
      const M = left * $.aFrac * $.L;
      const a = $.aFrac * $.L;
      return [
        String.raw`The load sits $a = ${sig(a)}$ m from the left. Moments about the right support: $R_L = P(L-a)/L = ${sig(left / KN)}$ kN.`,
        String.raw`The shear is $R_L$ up to the load and changes sign there, so the moment peaks at the load.`,
        String.raw`$M = R_L a = ${sig(M / KN)}$ kN·m, which is $Pa(L-a)/L$.`,
      ];
    },
    second: ($) => {
      const m = simplePoint($.P, $.L, $.aFrac * $.L);
      return { V: m.left / KN, M: m.Mmax / KN };
    },
    sim: {
      scenario: 'point',
      setup(s, $) {
        s.scenarioId = 'point';
        s.P = $.P;
        s.L = $.L;
        s.a = $.aFrac * $.L;
        s.x = s.a;
      },
      read: (c) => ({ V: c.left, M: c.Mmax }),
    },
    cases: [kase(cite('shear-moment'), { P: 10, L: 4, aFrac: 0.25 }, { V: 7.5, M: 7.5 })],
  }),

  problem({
    id: 'u6.6.uniform',
    title: 'Uniform load on a simple beam',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('shear-moment'),
    topics: ['shear-moment', 'uniform'],
    variety: ['representation'],
    level: 2,
    vars: {
      w: range(2, 12, 1, 'kN/m', KN),
      L: range(2, 8, 0.5, 'm', 1),
    },
    text: (T) => String.raw`A simple beam of length ${T.L} m carries ${T.w} kN/m downward, uniform along the span. Find the shear at the left support and the largest moment. Then write that moment as a formula in $w$ and $L$.`,
    parts: [
      num('V', ($) => ($.w * $.L) / 2, 'kN', {
        scale: KN,
        label: 'left-support shear',
        traps: [
          [($) => $.w * $.L, 'That is the whole load. Each support carries half.'],
          [($) => ($.w * $.L) / 4, 'A quarter of the load is not the support shear.'],
        ],
      }),
      num('M', ($) => ($.w * $.L * $.L) / 8, 'kN·m', {
        scale: KN,
        label: 'largest moment',
        traps: [
          [($) => ($.w * $.L * $.L) / 4, 'Dividing by 4 leaves twice the simple-span moment. The midspan moment is $wL^2/8$.'],
          [($) => ($.w * $.L * $.L) / 2, 'That is the wall moment of a cantilever with this same uniform load.'],
        ],
      }),
      sym('Msym', 'w*L^2/8', { w: 'N/m', L: 'm' }, ($) => ($.w * $.L * $.L) / 8, { unit: 'N*m', label: 'largest moment, as a formula' }),
    ],
    hints: [
      'The two supports split a uniform load in half. The moment at midspan is the load times the span squared, over eight.',
      'By symmetry each support carries half the load. The moment peaks where the shear is zero: add up the area under the shear from the support to there.',
    ],
    steps: ($, sig) => [
      String.raw`The total load is $wL = ${sig(($.w * $.L) / KN)}$ kN; by symmetry each support takes half, $${sig(($.w * $.L) / 2 / KN)}$ kN.`,
      String.raw`The shear falls at $w$ per metre and is zero at midspan.`,
      String.raw`The area under the shear to midspan is $\tfrac12(wL/2)(L/2) = wL^2/8 = ${sig(($.w * $.L * $.L) / 8 / KN)}$ kN·m.`,
    ],
    second: ($) => {
      const m = simpleUniform($.w, $.L);
      return { V: m.Vmax / KN, M: m.Mmax / KN };
    },
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.scenarioId = 'uniform';
        s.w = $.w;
        s.L = $.L;
        s.x = $.L / 2;
      },
      read: (c) => ({ V: c.Vmax, M: c.Mmax }),
    },
    cases: [kase(cite('shear-moment'), { w: 5, L: 4 }, { V: 10, M: 10 })],
  }),

  problem({
    id: 'u6.6.rect',
    title: 'Bending stress in a rectangle',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('flexure'),
    topics: ['flexure'],
    variety: ['representation'],
    level: 1,
    vars: {
      M: range(0.5, 8, 0.5, 'kN·m', KN),
      b: range(20, 80, 10, 'mm', 1e-3),
      h: range(40, 160, 20, 'mm', 1e-3),
    },
    text: (T) => String.raw`A rectangular section ${T.b} mm wide and ${T.h} mm deep carries a sagging moment of ${T.M} kN·m. Find the top and bottom fiber stresses. Tension is positive. Then write the size of either outer-fiber stress as a formula in $M$, $b$ and $h$.`,
    parts: [
      num('top', ($) => flexureFibers($.M, rectSection($.b, $.h)).top, 'MPa', {
        scale: MPA,
        label: 'top fiber',
        traps: [
          [($) => -flexureFibers($.M, rectSection($.b, $.h)).top, 'The sign was dropped. A sagging moment compresses the top, so the stress is negative.'],
          [($) => 2 * flexureFibers($.M, rectSection($.b, $.h)).top, 'The full height was used as the fiber distance. The neutral axis is at mid-height, so $c = h/2$.'],
        ],
      }),
      num('bot', ($) => flexureFibers($.M, rectSection($.b, $.h)).bot, 'MPa', {
        scale: MPA,
        label: 'bottom fiber',
        traps: [
          [($) => -flexureFibers($.M, rectSection($.b, $.h)).bot, 'The bottom fiber of a sagging beam is in tension.'],
          [($) => 2 * flexureFibers($.M, rectSection($.b, $.h)).bot, 'Using $c = h$ instead of $h/2$ doubles the stress.'],
        ],
      }),
      sym('ssym', '6*M/(b*h^2)', { M: 'N*m', b: 'm', h: 'm' }, ($) => (6 * $.M) / ($.b * $.h * $.h), { unit: 'Pa', label: 'outer-fiber stress, as a formula' }),
    ],
    hints: [
      'The section modulus of a rectangle is the width times the height squared, over six. Sagging compression is on top.',
      String.raw`The outer fibers are $h/2$ from the neutral axis. Put that and the rectangle's $I$ into $-My/I$, and keep the sign.`,
    ],
    steps: ($, sig) => {
      const f = flexureFibers($.M, rectSection($.b, $.h));
      return [
        String.raw`$I = bh^3/12 = ${sig(f.I / 1e-12 / 1e6)}\times 10^6$ mm⁴, and the outer fibers are $h/2 = ${sig($.h / 2 / 1e-3)}$ mm out.`,
        String.raw`Top, $y = +h/2$: $\sigma = -My/I = ${sig(f.top / MPA)}$ MPa.`,
        String.raw`Bottom, $y = -h/2$: $\sigma = ${sig(f.bot / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const r = rectFibersReduced($.M, $.b, $.h);
      return { top: r.top / MPA, bot: r.bot / MPA };
    },
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.M = $.M;
        s.b = $.b;
        s.h = $.h;
      },
      read: (c) => ({ top: c.top, bot: c.bot }),
    },
    cases: [kase(cite('flexure'), { M: 2, b: 40, h: 80 }, { top: -46.875, bot: 46.875 })],
  }),

  problem({
    id: 'u6.6.tee',
    title: 'Top and bottom stress in a tee',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('flexure'),
    topics: ['flexure', 'tee'],
    variety: ['configuration'],
    level: 2,
    vars: {
      M: range(0.4, 6, 0.1, 'kN·m', KN),
    },
    text: (T) => String.raw`A tee has a 120 mm by 12 mm flange on top of a 12 mm by 100 mm web. The sagging moment is ${T.M} kN·m. Find the top and bottom fiber stresses. Tension is positive. Then write the size of either outer-fiber stress as a formula in $M$, $b$ and $h$.`,
    parts: [
      num('top', ($) => teeFibers($.M).top, 'MPa', {
        scale: MPA,
        label: 'top fiber',
        traps: [
          [($) => teeFibers($.M).bot, 'That is the bottom fiber. The flange is closer to the neutral axis, so the top stress is the smaller one.'],
          [($) => {
            const sec = teeSection(TEE.bf, TEE.tf, TEE.tw, TEE.hw);
            return (-$.M * (sec.height / 2)) / sec.I;
          }, 'Mid-height was used for both fibers. The neutral axis is not at mid-height.'],
        ],
      }),
      num('bot', ($) => teeFibers($.M).bot, 'MPa', {
        scale: MPA,
        label: 'bottom fiber',
        traps: [
          [($) => teeFibers($.M).top, 'That is the top fiber. The bottom of the web is farther from the axis.'],
          [($) => {
            const sec = teeSection(TEE.bf, TEE.tf, TEE.tw, TEE.hw);
            return ($.M * (sec.height / 2)) / sec.I;
          }, 'A single $c = h/2$ was used for both fibers.'],
        ],
      }),
    ],
    hints: [
      'Find the centroid from the bottom, then I about that axis. The two fiber distances are not equal, and sagging puts compression on the flange.',
      'The flange area sits high, so the neutral axis is above mid-height. The bottom fiber is farther away and carries the larger stress.',
    ],
    steps: ($, sig) => {
      const f = teeFibers($.M);
      const s = teeSection(TEE.bf, TEE.tf, TEE.tw, TEE.hw);
      return [
        String.raw`Centroid: $(1440\times 106 + 1200\times 50)/2640 = ${sig(s.ybar / 1e-3)}$ mm up. By parallel axes, $I = ${sig(s.I / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
        String.raw`Top fiber, $${sig(s.topY / 1e-3)}$ mm above the axis: $\sigma = ${sig(f.top / MPA)}$ MPa.`,
        String.raw`Bottom fiber, $${sig(-s.botY / 1e-3)}$ mm below: $\sigma = ${sig(f.bot / MPA)}$ MPa, the larger because it is farther.`,
      ];
    },
    second: ($) => {
      const { bf, tf, tw, hw } = TEE;
      const Af = bf * tf;
      const Aw = tw * hw;
      const ybar = (Af * (hw + tf / 2) + Aw * (hw / 2)) / (Af + Aw);
      const I = (bf * tf ** 3) / 12 + Af * (hw + tf / 2 - ybar) ** 2 + (tw * hw ** 3) / 12 + Aw * (hw / 2 - ybar) ** 2;
      return {
        top: (-$.M * (hw + tf - ybar)) / I / MPA,
        bot: ($.M * ybar) / I / MPA,
      };
    },
    sim: {
      scenario: 'tee',
      setup(s, $) {
        s.scenarioId = 'tee';
        s.M = $.M;
      },
      read: (c) => ({ top: c.top, bot: c.bot }),
    },
    cases: [kase(cite('flexure'), { M: 2 }, { top: -20.49199746041372, bot: 52.4737276009438 })],
  }),

  problem({
    id: 'u6.6.joist',
    title: 'Bending stress in a floor joist',
    exam: 'u6',
    ch: '6',
    lab: 'joist',
    src: cite('flexure'),
    topics: ['flexure', 'english'],
    variety: ['units'],
    level: 2,
    vars: {
      span: range(8, 16, 1, 'ft', M_PER_FT),
      space: range(12, 24, 6, 'in', M_PER_IN),
      live: range(20, 50, 5, 'psf', PA_PER_PSF),
    },
    text: (T) => String.raw`A dressed 2×10 joist, 1.5 in by 9.25 in, spans ${T.span} ft at ${T.space} in on center. The floor is ${T.live} psf live and 10 psf dead. Find the bending stress.`,
    parts: [
      num('stress', ($) => simpleBendingStress(joistLine($.live, $.space), $.span, JOIST_B, JOIST_H), 'psi', {
        scale: PA_PER_PSI,
        label: 'bending stress',
        traps: [
          [($) => simpleBendingStress(joistLine($.live, $.space), $.span, 2 * M_PER_IN, 10 * M_PER_IN), 'The nominal 2 in by 10 in was used. The dressed size is 1.5 in by 9.25 in.'],
          [($) => 2 * simpleBendingStress(joistLine($.live, $.space), $.span, JOIST_B, JOIST_H), 'The moment was taken as $wL^2/4$. A simple span is $wL^2/8$.'],
        ],
      }),
    ],
    hints: [
      'The joist carries the strip of floor out to half the spacing on each side. Moment on a simple span is the line load times the span squared, over eight.',
      'Use the dressed 1.5 in by 9.25 in. In inch-pounds, stress is the moment in lb·in times half the depth, divided by I.',
    ],
    steps: ($, sig) => {
      const psi = simpleBendingStress(joistLine($.live, $.space), $.span, JOIST_B, JOIST_H) / PA_PER_PSI;
      const wLbFt = joistLine($.live, $.space) / (N_PER_LBF / M_PER_FT);
      const ft = $.span / M_PER_FT;
      const M = (wLbFt * ft * ft) / 8;
      return [
        String.raw`The joist carries live plus dead load on its ${sig($.space / M_PER_IN)} in strip: $w = ${sig(wLbFt)}$ lb/ft.`,
        String.raw`$M = wL^2/8 = ${sig(M)}$ lb·ft $= ${sig(M * 12)}$ lb·in.`,
        String.raw`On the dressed 1.5 in by 9.25 in section, $S = bh^2/6 = 21.4$ in³, so $\sigma = M/S = ${sig(psi)}$ psi.`,
      ];
    },
    second: ($) => {
      const spanFt = $.span / M_PER_FT;
      const spaceIn = $.space / M_PER_IN;
      const live = $.live / PA_PER_PSF;
      const dead = JOIST_DEAD / PA_PER_PSF;
      const plf = (live + dead) * (spaceIn / 12);
      const M = (plf * spanFt * spanFt / 8) * 12;
      const I = (1.5 * 9.25 ** 3) / 12;
      return { stress: (M * (9.25 / 2)) / I };
    },
    sim: {
      scenario: 'table',
      setup(s, $) {
        s.L = $.span;
        s.space = $.space;
        s.live = $.live;
        s.b = JOIST_B;
        s.h = JOIST_H;
      },
      read: (c) => ({ stress: c.stress }),
    },
    cases: [kase(cite('flexure'), { span: 14, space: 16, live: 40 }, { stress: 916.2892622352081 })],
  }),

  problem({
    id: 'u6.6.allow',
    title: 'Uniform load at an allowable stress',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('flexure'),
    topics: ['flexure'],
    variety: ['goal'],
    level: 3,
    vars: {
      sig: range(10, 80, 5, 'MPa', MPA),
      L: range(2, 6, 0.5, 'm', 1),
      b: range(20, 60, 10, 'mm', 1e-3),
      h: range(60, 140, 20, 'mm', 1e-3),
    },
    text: (T) => String.raw`A simple beam ${T.L} m long has a rectangular section ${T.b} mm by ${T.h} mm. What uniform load, in kN/m, produces a bending stress of ${T.sig} MPa?`,
    parts: [
      num('w', allowW, 'kN/m', {
        scale: KN,
        label: 'uniform load',
        traps: [
          [($) => allowW($) / 2, 'The moment was taken as $wL^2/4$. That load is half of the simple-span answer.'],
          [($) => allowW($) / 4, 'That is the uniform load whose cantilever wall moment $wL^2/2$ reaches the same stress.'],
        ],
      }),
    ],
    hints: [
      'Turn the allowable stress into a moment with the section modulus, then turn that moment into a uniform load on a simple span.',
      'The allowable stress fixes the largest moment the section can carry. Then ask what uniform load makes that the peak moment on this span.',
    ],
    steps: ($, sig) => {
      const S = ($.b * $.h * $.h) / 6;
      return [
        String.raw`The largest moment the section allows is $\sigma S$, with $S = bh^2/6 = ${sig(S / 1e-9 / 1e3)}\times 10^3$ mm³: $M = ${sig(($.sig * S) / KN)}$ kN·m.`,
        String.raw`A uniform load on a simple span peaks at $wL^2/8$.`,
        String.raw`$w = 8M/L^2 = ${sig(allowW($) / KN)}$ kN/m.`,
      ];
    },
    second: ($) => {
      const moment = ($.sig * $.b * $.h * $.h) / 6;
      return { w: ((8 * moment) / ($.L * $.L)) / KN };
    },
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.scenarioId = 'uniform';
        s.w = allowW($);
        s.L = $.L;
        s.x = $.L / 2;
      },
      read: (c) => ({ w: c.w }),
    },
    cases: [kase(cite('flexure'), { sig: 46.875, L: 4, b: 40, h: 80 }, { w: 1 })],
  }),

  problem({
    id: 'u6.6.fiber',
    title: 'Which fiber is in compression',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('flexure'),
    kind: 'conceptual',
    topics: ['flexure'],
    variety: ['configuration'],
    level: 1,
    vars: {
      sense: choice(['sag', 'sagging'], ['hog', 'hogging']),
      mag: range(1, 8, 0.1, 'kN·m', KN),
    },
    text: (T) => String.raw`A rectangular beam carries a ${T.mag} kN·m moment that is ${T.sense}. What is the stress on the top fiber?`,
    parts: [
      mc('which', [
        ['compression', 'Compression.', 'A sagging moment compresses the top fiber. Tension is on the bottom.'],
        ['tension', 'Tension.', 'A hogging moment tensions the top fiber. The bottom is then in compression.'],
        ['zero', 'Zero. The top fiber is on the neutral axis.', 'The neutral axis is at mid-height, not at the top fiber.'],
        ['same', 'The same sign as the bottom fiber.', 'The two fibers are always opposite in sign when the moment is not zero.'],
      ], ($) => ($.sense === 'sag' ? 'compression' : 'tension')),
    ],
    hints: [
      'Sagging bends the beam concave upward. The top shortens and the bottom lengthens.',
      'Hogging is the reverse. The sign of the moment picks the sign of My/I.',
    ],
    steps: ($) => [
      $.sense === 'sag'
        ? 'Sagging compression is on top, so the top stress is negative.'
        : 'Hogging tension is on top, so the top stress is positive.',
    ],
    second: ($) => ({ which: $.sense === 'sag' ? 'compression' : 'tension' }),
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.scenarioId = 'rect';
        s.b = 0.04;
        s.h = 0.08;
        s.M = ($.sense === 'hog' ? -1 : 1) * $.mag;
      },
      read: (c) => ({ which: c.top < 0 ? 'compression' : 'tension' }),
    },
    cases: [
      kase(cite('flexure'), { sense: 'sag', mag: 2 }, { which: 'compression' }),
      kase(cite('flexure'), { sense: 'hog', mag: 2 }, { which: 'tension' }),
    ],
  }),

  problem({
    id: 'u6.6.peak',
    title: 'Where the shear is zero',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('shear-moment'),
    kind: 'conceptual',
    topics: ['shear-moment', 'cantilever'],
    variety: ['configuration'],
    level: 2,
    vars: {
      beam: choice(
        ['simple', 'a uniform load on a simple span'],
        ['cantilever', 'a downward tip load on a cantilever'],
      ),
      mag: range(2, 20, 0.5, 'kN', KN),
    },
    text: (T) => String.raw`The beam is ${T.beam}. The load magnitude is ${T.mag} kN, or kN/m for the uniform load. At the station of largest moment, what is the shear?`,
    parts: [
      mc('which', [
        ['zero', 'The shear is zero.', 'On a simple span the moment peaks where the shear diagram crosses zero. For a uniform load that station is midspan.'],
        ['whole', 'The shear equals the whole tip load, and it does not change sign.', 'A tip-loaded cantilever has constant shear. The moment is largest at the wall, where that shear is still the full load.'],
        ['half', 'The shear is half the load.', 'Half the load is the support reaction of the simple beam, but not the shear at the peak-moment station.'],
        ['none', 'There is no shear in the beam.', 'Both of these beams carry shear. The question is whether it is zero at the peak moment.'],
      ], ($) => ($.beam === 'simple' ? 'zero' : 'whole')),
    ],
    hints: [
      'dM/dx = V. The moment can peak inside the span only where the shear changes sign.',
      'A cantilever with an end load has the same shear everywhere. Its largest moment is at the wall.',
    ],
    steps: ($) => [
      $.beam === 'simple'
        ? 'The uniform-load moment peaks at midspan, and the shear there is zero.'
        : 'The cantilever moment peaks at the wall. The shear there equals the tip load.',
    ],
    second: ($) => ({ which: $.beam === 'simple' ? 'zero' : 'whole' }),
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        if ($.beam === 'cantilever') {
          s.scenarioId = 'cantilever';
          s.P = $.mag;
          s.L = 2;
          s.x = 0;
        } else {
          s.scenarioId = 'uniform';
          s.w = $.mag;
          s.L = 4;
          s.x = 2;
        }
      },
      read: (c) => {
        if (Math.abs(c.V) <= 1e-6 * Math.max(Math.abs(c.Vmax), 1)) return { which: 'zero' };
        if (Math.abs(Math.abs(c.V) - Math.abs(c.Vmax)) <= 1e-6 * Math.max(Math.abs(c.Vmax), 1)) return { which: 'whole' };
        return { which: 'half' };
      },
    },
    cases: [
      kase(cite('shear-moment'), { beam: 'simple', mag: 5 }, { which: 'zero' }),
      kase(cite('shear-moment'), { beam: 'cantilever', mag: 8 }, { which: 'whole' }),
    ],
  }),

  problem({
    id: 'u6.6.axis',
    title: 'Where the neutral axis sits',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('flexure'),
    kind: 'conceptual',
    topics: ['flexure', 'tee'],
    variety: ['configuration'],
    level: 1,
    vars: {
      shape: choice(['rect', 'a rectangle'], ['tee', 'a tee with the flange on top']),
      mag: range(0.5, 5, 0.1, 'kN·m', KN),
    },
    text: (T) => String.raw`The section is ${T.shape}, bent by a ${T.mag} kN·m sagging moment. Where is the neutral axis?`,
    parts: [
      mc('which', [
        ['middle', 'At mid-height.', 'A rectangle is symmetric, so the centroid, and the neutral axis, is at mid-height.'],
        ['high', 'Above mid-height, toward the flange.', 'The flange adds area near the top, so the centroid of a tee sits above mid-height.'],
        ['bottom', 'At the bottom of the section.', 'The neutral axis passes through the centroid. Neither of these sections has its centroid on the bottom edge.'],
        ['top', 'At the top of the flange.', 'The top fiber carries stress. It is not the neutral axis.'],
      ], ($) => ($.shape === 'rect' ? 'middle' : 'high')),
    ],
    hints: [
      'The neutral axis of elastic bending passes through the centroid of the area.',
      'A rectangle is symmetric about mid-height. A flange on top pulls the centroid up.',
    ],
    steps: ($) => [
      $.shape === 'rect'
        ? 'The rectangle centroid is at mid-height, so the two fiber stresses match in magnitude.'
        : 'The tee centroid is above mid-height, so the bottom fiber is the farther one.',
    ],
    second: ($) => ({ which: $.shape === 'rect' ? 'middle' : 'high' }),
    sim: {
      scenario: 'rect',
      setup(s, $) {
        s.M = $.mag;
        if ($.shape === 'tee') s.scenarioId = 'tee';
        else {
          s.scenarioId = 'rect';
          s.b = 0.04;
          s.h = 0.08;
        }
      },
      read: (c) => ({ which: c.yBar > c.height / 2 + 0.01 * c.height ? 'high' : 'middle' }),
    },
    cases: [
      kase(cite('flexure'), { shape: 'rect', mag: 2 }, { which: 'middle' }),
      kase(cite('flexure'), { shape: 'tee', mag: 2 }, { which: 'high' }),
    ],
  }),
  problem({
    id: 'u6.6.overhang',
    title: 'Diagrams for an overhanging beam',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('graphical-method'),
    topics: ['graphical-method'],
    variety: ['configuration'],
    level: 3,
    vars: {
      b: range(3, 6, 0.5, 'm', 1),
      c: range(1, 2.5, 0.5, 'm', 1),
      w: range(2, 10, 1, 'kN/m', KN),
      P: range(2, 12, 1, 'kN', KN),
    },
    derive: ($) => {
      const L = $.b + $.c;
      const beam = generalBeam({ L, b: $.b, udl: { w: $.w, a: 0, b: $.b }, points: [{ x: L, P: $.P }] });
      const RA = beam.reactions[0].Fy;
      const x0 = RA / $.w;
      return { L, RA, RB: beam.reactions[1].Fy, x0, sag: RA * x0 - ($.w * x0 * x0) / 2, hog: $.P * $.c };
    },
    valid: ($) => $.RA > 0.2 * $.w * $.b && rel($.sag, ($.w * $.b * $.b) / 8) && $.L <= 8,
    text: (T) => String.raw`A beam is pinned at A and rests on a roller at B, $${T.b}$ m to the right. It overhangs B by $${T.c}$ m to a free end C. A uniform $${T.w}$ kN/m acts downward on AB, and $${T.P}$ kN hangs at C. Find the roller reaction, the largest sagging moment in AB, and the size of the hogging moment over B.`,
    parts: [
      num('RB', ($) => $.RB, 'kN', {
        scale: KN,
        label: 'roller reaction',
        traps: [
          [($) => ($.w * $.b) / 2 + $.P, 'Half the span load plus the tip load ignores the overhang\'s lever. Take moments about A.'],
        ],
      }),
      num('sag', ($) => $.sag, 'kN·m', {
        scale: KN,
        label: 'largest sagging moment',
        traps: [
          [($) => ($.w * $.b * $.b) / 8, 'That is $wL^2/8$ for a simple span. The tip load lifts the span and moves the zero of shear.'],
        ],
      }),
      num('hog', ($) => $.hog, 'kN·m', {
        scale: KN,
        label: 'hogging moment over B',
        traps: [
          [($) => $.P * ($.b + $.c), 'The arm is the overhang only, from B to C.'],
        ],
      }),
    ],
    hints: [
      'Find the reactions by moments about A. Then walk from the left: the shear falls with the load, and the moment grows by the area under the shear.',
      String.raw`The sagging peak is where the shear crosses zero, $x_0 = R_A/w$. Over B, the overhang alone gives the moment: cut there and look right.`,
    ],
    steps: ($, sig) => [
      String.raw`Moments about A: $R_B = (w b^2/2 + P(b+c))/b = ${sig($.RB / KN)}$ kN, and $R_A = wb + P - R_B = ${sig($.RA / KN)}$ kN.`,
      String.raw`The shear $R_A - wx$ is zero at $x_0 = ${sig($.x0)}$ m. The area under it there is $R_A x_0/2 = ${sig($.sag / KN)}$ kN·m.`,
      String.raw`Cut just right of B and keep C: $|M_B| = Pc = ${sig($.hog / KN)}$ kN·m.`,
    ],
    second: ($) => {
      // Closed-form equilibrium, then the method of sections at the zero of shear.
      const RB = ($.w * $.b * $.b / 2 + $.P * ($.b + $.c)) / $.b;
      const RA = $.w * $.b + $.P - RB;
      const x0 = RA / $.w;
      const cut = internalAt(x0, {
        reactions: [{ x: 0, Fy: RA }, { x: $.b, Fy: RB }],
        loads: [{ x: $.b + $.c, Fy: -$.P }],
        dist: [{ a: 0, b: $.b, w: () => -$.w }],
      });
      return { RB: RB / KN, sag: cut.M / KN, hog: ($.P * $.c) / KN };
    },
    sim: {
      scenario: 'overhang',
      setup(s, $) {
        s.L = $.b + $.c;
        s.b = $.b;
        s.w = $.w;
        s.P = $.P;
        s.x = $.RA / $.w;
      },
      read: (c) => ({ RB: c.right, sag: c.M, hog: c.Mhog }),
    },
    cases: [kase(cite('graphical-method'), { b: 4, c: 2, w: 4, P: 5 }, { RB: 15.5, sag: 3.78125, hog: 10 })],
  }),

  problem({
    id: 'u6.6.couple',
    title: 'A couple on a simple span',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('graphical-method'),
    topics: ['graphical-method'],
    variety: ['unknown'],
    level: 2,
    vars: {
      L: range(3, 8, 0.5, 'm', 1),
      f: range(0.2, 0.8, 0.05, '', 1),
      M0: range(4, 20, 1, 'kN·m', KN),
    },
    derive: ($) => {
      const a = Math.round($.L * $.f * 10) / 10;
      const R = $.M0 / $.L;
      return { a, R, before: R * a, after: R * a - $.M0 };
    },
    valid: ($) => $.a > 0.5 && $.L - $.a > 0.5,
    text: (T, $) => String.raw`A simple beam $${T.L}$ m long, pinned at the left and on a roller at the right, carries only a counterclockwise couple of $${T.M0}$ kN·m at $${$.a}$ m from the left. Find the left reaction (positive up), the shear in the span, and the moment just left and just right of the couple.`,
    parts: [
      num('R', ($) => $.R, 'kN', {
        scale: KN,
        label: 'left reaction',
        traps: [
          [() => 0, 'With no force on the beam the reactions still form a couple. They are $M_0/L$, equal and opposite.'],
          [($) => -$.R, 'Right size, wrong direction. A counterclockwise couple needs a clockwise pair: up at the left, down at the right.'],
        ],
      }),
      num('before', ($) => $.before, 'kN·m', {
        scale: KN,
        label: 'moment just left',
        traps: [
          [($) => $.M0 * $.a / $.L - $.M0, 'That is the moment just right of the couple.'],
        ],
      }),
      num('after', ($) => $.after, 'kN·m', {
        scale: KN,
        label: 'moment just right',
        traps: [
          [($) => $.before + $.M0, 'A counterclockwise couple lowers the moment in this convention, it does not raise it.'],
        ],
      }),
    ],
    hints: [
      'Moments about one support give the other reaction. A couple has no net force, so the two reactions are equal and opposite.',
      String.raw`The shear is the left reaction everywhere. The moment rises by the area under the shear, then drops by $M_0$ across a counterclockwise couple.`,
    ],
    steps: ($, sig) => [
      String.raw`Moments about the right support: $R_A L = M_0$, so $R_A = ${sig($.R / KN)}$ kN up and the right reaction is the same, down.`,
      String.raw`The shear is $${sig($.R / KN)}$ kN all along. Just left of the couple $M = R_A a = ${sig($.before / KN)}$ kN·m.`,
      String.raw`Across the couple $M$ drops by $M_0$: just right, $M = ${sig($.after / KN)}$ kN·m. It then climbs back to zero at the roller.`,
    ],
    second: ($) => {
      // The method of sections, cutting just either side of the couple.
      const beam = generalBeam({ L: $.L, couples: [{ x: $.a, M: $.M0 }] });
      return { R: beam.reactions[0].Fy / KN, before: beam.at($.a - 1e-9).M / KN, after: beam.at($.a + 1e-9).M / KN };
    },
    sim: {
      scenario: 'couple',
      setup(s, $) {
        s.L = $.L;
        s.a = $.a;
        s.M0 = $.M0;
        s.x = $.a;
      },
      read: (c) => ({ R: c.left }),
    },
    cases: [kase(cite('graphical-method'), { L: 4, f: 0.25, M0: 6 }, { R: 1.5, before: 1.5, after: -4.5 })],
  }),

  problem({
    id: 'u6.6.bandsaw',
    title: 'A band-saw blade on its wheels',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('curvature'),
    topics: ['curvature', 'english'],
    variety: ['unknown'],
    level: 2,
    vars: {
      D: range(9, 20, 1, 'in', M_PER_IN),
      t: range(0.014, 0.035, 0.001, 'in', M_PER_IN),
      lim: range(30, 60, 5, 'ksi', KSI),
    },
    derive: ($) => ({ sig: bentStripStress(E_STEEL, $.t, $.D / 2), Dmin: (E_STEEL * $.t) / $.lim }),
    valid: ($) => $.sig < 90 * KSI,
    text: (T) => String.raw`A steel band-saw blade, $E = 29{,}000$ ksi, is $${T.t}$ in thick. It runs over wheels $${T.D}$ in in diameter. Find the bending stress at the blade's outer surface as it wraps a wheel. Then find the smallest wheel diameter that keeps that stress at $${T.lim}$ ksi.`,
    parts: [
      num('sig', ($) => $.sig, 'ksi', {
        scale: KSI,
        label: 'bending stress',
        traps: [
          [($) => bentStripStress(E_STEEL, $.t, $.D), 'The wheel\'s diameter was used as the radius of curvature. That halves the stress.'],
          [($) => bentStripStress(E_STEEL, 2 * $.t, $.D / 2), 'The whole thickness was used as the fiber distance. The surface is $t/2$ from the middle.'],
        ],
      }),
      num('Dmin', ($) => $.Dmin, 'in', {
        scale: M_PER_IN,
        label: 'smallest wheel',
        traps: [
          [($) => $.Dmin / 2, 'That is the radius. The question asks for the diameter.'],
        ],
      }),
    ],
    hints: [
      'Wrapped on a wheel, the blade bends to the wheel\'s radius. The strain at a fiber is its distance from the middle over that radius.',
      String.raw`$\sigma = E\,(t/2)/\rho$, with $\rho = D/2$. Turn it round for $D$: $D = Et/\sigma$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\rho = D/2 = ${sig($.D / 2 / M_PER_IN)}$ in. Surface strain $= (t/2)/\rho = ${sig($.t / $.D)}$.`,
      String.raw`$\sigma = E t/D = 29{,}000\times ${sig($.t / M_PER_IN)}/${sig($.D / M_PER_IN)} = ${sig($.sig / KSI)}$ ksi.`,
      String.raw`For $\sigma = ${sig($.lim / KSI)}$ ksi, $D = Et/\sigma = ${sig($.Dmin / M_PER_IN)}$ in.`,
    ],
    second: ($) => {
      // In inches and ksi throughout.
      const t = $.t / M_PER_IN;
      const D = $.D / M_PER_IN;
      return { sig: (29000 * t) / D, Dmin: (29000 * t) / ($.lim / KSI) };
    },
    cases: [kase(cite('curvature'), { D: 14, t: 0.025, lim: 40 }, { sig: 51.78571428571429, Dmin: 18.125 })],
  }),

  problem({
    id: 'u6.6.tilted',
    title: 'A beam loaded off its strong axis',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('unsymmetric-bending'),
    topics: ['unsymmetric-bending'],
    variety: ['representation'],
    level: 3,
    vars: {
      b: range(40, 100, 10, 'mm', MM),
      ratio: range(1.5, 3, 0.5, '', 1),
      M: range(2, 20, 1, 'kN·m', KN),
      th: range(5, 30, 5, '°', 1),
    },
    derive: ($) => {
      const h = $.b * $.ratio;
      const r = tiltedRect($.b, h, $.M, $.th);
      return { h, smax: r.max, alpha: r.alpha, upright: r.upright };
    },
    valid: ($) => $.smax < 250 * MPA && $.smax > 20 * MPA,
    text: (T, $) => String.raw`A rectangular beam $${T.b}$ mm wide and $${Math.round($.h / MM)}$ mm deep carries a bending moment of $${T.M}$ kN·m. The load that causes it leans $${T.th}^\circ$ from the vertical, so the moment vector is turned $${T.th}^\circ$ from the section's horizontal axis. Find the largest bending stress and the angle of the neutral axis from the horizontal.`,
    parts: [
      num('smax', ($) => $.smax, 'MPa', {
        scale: MPA,
        label: 'largest stress',
        traps: [
          [($) => $.upright, 'That is the stress with no lean. The lean adds bending about the weak axis.'],
        ],
      }),
      num('alpha', ($) => $.alpha, '°', {
        abs: 0.3,
        label: 'neutral axis angle',
        traps: [
          [($) => $.th, 'The neutral axis does not follow the moment unless the two I values match. It swings toward the weak axis.'],
        ],
      }),
    ],
    hints: [
      'Split the moment into parts about the two axes of symmetry. Each bends about its own axis, and the stresses add.',
      String.raw`$M_z = M\cos\theta$, $M_y = M\sin\theta$. At the worst corner $\sigma = M_z(h/2)/I_z + M_y(b/2)/I_y$. The neutral axis has $\tan\alpha = (I_z/I_y)\tan\theta$.`,
    ],
    steps: ($, sig) => {
      const Iz = ($.b * $.h ** 3) / 12;
      const Iy = ($.h * $.b ** 3) / 12;
      return [
        String.raw`$M_z = ${sig(($.M * Math.cos($.th * DEG)) / KN)}$ kN·m and $M_y = ${sig(($.M * Math.sin($.th * DEG)) / KN)}$ kN·m. $I_z = ${sig(Iz / 1e-12 / 1e6)}\times 10^6$ mm⁴, $I_y = ${sig(Iy / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
        String.raw`Worst corner: $${sig((($.M * Math.cos($.th * DEG)) * $.h) / 2 / Iz / MPA)} + ${sig((($.M * Math.sin($.th * DEG)) * $.b) / 2 / Iy / MPA)} = ${sig($.smax / MPA)}$ MPa.`,
        String.raw`$\tan\alpha = ${sig(Iz / Iy)}\tan ${sig($.th)}^\circ$, so $\alpha = ${sig($.alpha)}$°.`,
      ];
    },
    second: ($) => {
      // The two section moduli, bh²/6 and hb²/6, one per axis.
      const Sz = ($.b * $.h * $.h) / 6;
      const Sy = ($.h * $.b * $.b) / 6;
      const smax = ($.M * Math.cos($.th * DEG)) / Sz + ($.M * Math.sin($.th * DEG)) / Sy;
      return { smax: smax / MPA, alpha: Math.atan(($.h / $.b) ** 2 * Math.tan($.th * DEG)) / DEG };
    },
    cases: [kase(cite('unsymmetric-bending'), { b: 40, ratio: 2, M: 2, th: 10 }, { smax: 62.44238007872195, alpha: 35.195620072110245 })],
  }),

  problem({
    id: 'u6.6.composite',
    title: 'A timber with a steel plate',
    exam: 'u6',
    ch: '6',
    lab: 'flexure',
    src: cite('composite'),
    topics: ['composite'],
    variety: ['configuration'],
    level: 3,
    vars: {
      b: range(80, 150, 10, 'mm', MM),
      h: range(150, 300, 25, 'mm', MM),
      tp: range(6, 16, 2, 'mm', MM),
      M: range(10, 40, 2, 'kN·m', KN),
    },
    derive: ($) => {
      const sec = compositeSection([{ b: $.b, h: $.tp, E: E_STEEL_SI }, { b: $.b, h: $.h, E: E_WOOD }], E_WOOD);
      return { ybar: sec.ybar, It: sec.I, steel: sec.stress($.M, 0), wood: -sec.stress($.M, sec.H) };
    },
    valid: ($) => $.steel < 250 * MPA && $.wood < 30 * MPA && $.wood > 3 * MPA,
    text: (T) => String.raw`A timber $${T.b}$ mm wide and $${T.h}$ mm deep ($E_w = 12.5$ GPa) has a steel plate of the same width and $${T.tp}$ mm thick bonded under it ($E_s = 200$ GPa). It carries a sagging moment of $${T.M}$ kN·m. Find the neutral axis height above the bottom of the plate, the largest stress in the steel, and the largest compressive stress in the wood (as a magnitude).`,
    parts: [
      num('ybar', ($) => $.ybar, 'mm', {
        scale: MM,
        label: 'neutral axis',
        traps: [
          [($) => ($.tp + $.h) / 2, 'That is the geometric middle. The stiff plate pulls the neutral axis down to the transformed centroid.'],
        ],
      }),
      num('steel', ($) => $.steel, 'MPa', {
        scale: MPA,
        label: 'steel',
        traps: [
          [($) => $.steel / 16, 'That is the transformed stress. The real steel carries $n = 16$ times it.'],
        ],
      }),
      num('wood', ($) => $.wood, 'MPa', {
        scale: MPA,
        label: 'wood',
        traps: [
          [($) => (6 * $.M) / ($.b * $.h * $.h), 'That is the timber alone. The plate moves the neutral axis and adds stiffness.'],
        ],
      }),
    ],
    hints: [
      'Turn the steel into wood that carries the same force: widen it by $n = E_s/E_w$. The new section bends as one material.',
      String.raw`Find the transformed centroid and $I_t$. Wood: $\sigma = My/I_t$. Steel: $n$ times $My/I_t$ at its height.`,
    ],
    steps: ($, sig) => [
      String.raw`$n = 16$, so the plate becomes $${sig((16 * $.b) / MM)}$ mm wide. Centroid $\bar y = ${sig($.ybar / MM)}$ mm above the bottom.`,
      String.raw`$I_t = ${sig($.It / 1e-12 / 1e6)}\times 10^6$ mm⁴.`,
      String.raw`Steel, $${sig($.ybar / MM)}$ mm below: $16\,M\bar y/I_t = ${sig($.steel / MPA)}$ MPa. Wood top, $${sig(($.tp + $.h - $.ybar) / MM)}$ mm above: $${sig($.wood / MPA)}$ MPa.`,
    ],
    second: ($) => {
      // Shrink the wood instead: transform to steel with n = 1/16, and the stresses must agree.
      const sec = compositeSection([{ b: $.b, h: $.tp, E: E_STEEL_SI }, { b: $.b, h: $.h, E: E_WOOD }], E_STEEL_SI);
      return { ybar: sec.ybar / MM, steel: sec.stress($.M, 0) / MPA, wood: -sec.stress($.M, sec.H) / MPA };
    },
    cases: [kase(cite('composite'), { b: 100, h: 200, tp: 10, M: 20 }, { ybar: 63.33333333333335, steel: 122.97734627831717, wood: 17.799352750809057 })],
  }),
  problem({
    id: 'u6.6.where-max',
    title: 'Where the largest moment sits',
    exam: 'u6',
    ch: '6',
    lab: 'diagrams',
    src: cite('graphical-method'),
    kind: 'conceptual',
    topics: ['graphical-method', 'shear-moment'],
    variety: ['configuration'],
    level: 2,
    vars: {
      beam: choice(
        ['offset', 'a simple span with one point load a quarter of the way across'],
        ['uniform', 'a simple span under a uniform load'],
        ['cantilever', 'a cantilever with a load at its free end'],
        ['overhang', 'a beam on two supports that overhangs one of them, loaded only at the overhang\'s tip'],
      ),
      L: range(2, 8, 0.25, 'm', 1),
    },
    text: (T) => String.raw`A beam $${T.L}$ m long is ${T.beam}. Where is the bending moment largest in size?`,
    parts: [
      mc('where', [
        ['load', 'Under the point load.', 'Between point loads the shear is constant, so the moment is straight and its peak is at a corner, under a load.'],
        ['mid', 'At midspan.', 'A symmetric uniform load puts the zero of shear, and so the peak of $M$, at midspan.'],
        ['wall', 'At the fixed end.', 'A cantilever\'s shear never changes sign, so the moment grows all the way to the wall.'],
        ['support', 'Over the support next to the overhang.', 'The overhang is a short cantilever: its moment grows from the tip to that support, then falls back to zero across the span.'],
      ], ($) => ({ offset: 'load', uniform: 'mid', cantilever: 'wall', overhang: 'support' }[$.beam])),
    ],
    hints: [
      'The moment peaks where the shear changes sign, or at a support or load where the diagram has a corner.',
      'Sketch the shear: find where it crosses zero or jumps through zero.',
    ],
    steps: ($) => [
      {
        offset: 'The shear jumps through zero under the load, so the moment peaks there.',
        uniform: 'The shear falls linearly and crosses zero at midspan, where the moment peaks.',
        cantilever: 'The shear has one sign everywhere, so the largest moment is at the wall.',
        overhang: 'The span carries no load; the moment rises from the tip to the support and falls linearly to zero at the far end.',
      }[$.beam],
    ],
    second: ($) => {
      // Build the beam and read where the largest |M| is.
      const L = $.L;
      const b = {
        offset: generalBeam({ L, points: [{ x: L / 4, P: 1000 }] }),
        uniform: generalBeam({ L, udl: { w: 1000, a: 0, b: L } }),
        cantilever: generalBeam({ L, support: 'cantilever', points: [{ x: L, P: 1000 }] }),
        overhang: generalBeam({ L, b: 0.7 * L, points: [{ x: L, P: 1000 }] }),
      }[$.beam];
      const x = b.xM;
      const where = Math.abs(x - L / 4) < 1e-6 && $.beam === 'offset' ? 'load'
        : Math.abs(x - L / 2) < 0.02 * L ? 'mid'
          : x < 1e-6 ? 'wall'
            : Math.abs(x - 0.7 * L) < 1e-6 ? 'support' : 'load';
      return { where };
    },
    cases: [
      kase(cite('graphical-method'), { beam: 'offset', L: 4 }, { where: 'load' }),
      kase(cite('graphical-method'), { beam: 'cantilever', L: 2 }, { where: 'wall' }),
      kase(cite('graphical-method'), { beam: 'overhang', L: 6 }, { where: 'support' }),
    ],
  }),

];

export default ch6;
