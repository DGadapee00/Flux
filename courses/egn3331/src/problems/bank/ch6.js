/**
 * Shear and moment diagrams, bending stress in a rectangle and a tee,
 * a Southern Pine floor joist in psi, and the uniform load that reaches
 * an allowable bending stress.
 */
import { M_PER_FT, M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';
import { flexureFibers, rectFibersReduced, rectSection, simpleBendingStress, teeSection } from '@flux/subjects/mechanics/materials.js';
import { simplePoint, simpleUniform } from '@flux/subjects/mechanics/sections.js';
import { JOIST_B, JOIST_DEAD, JOIST_H, PA_PER_PSF, joistLine } from '../../data/joist.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const KN = 1000;
const MPA = 1e6;
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
    valid: ($) => {
      const left = $.P * (1 - $.aFrac);
      const M = left * $.aFrac * $.L;
      return rel(M, ($.P * $.L) / 4) && rel(left, $.P) && rel(left, $.P * $.aFrac);
    },
    text: (T) => String.raw`A simple beam of length ${T.L} m carries ${T.P} kN downward at ${T.aFrac} of the span from the left. Find the left reaction and the largest moment. Sagging is positive.`,
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
    ],
    hints: [
      'The left support carries the share of the load set by the distance that remains on the right. The moment is largest at the load.',
      String.raw`Left reaction $= P(L-a)/L$. Moment $= P a (L-a)/L$.`,
    ],
    steps: ($, sig) => {
      const left = $.P * (1 - $.aFrac);
      const M = left * $.aFrac * $.L;
      return [
        String.raw`Left reaction ${sig(left / KN)} kN.`,
        String.raw`Largest moment ${sig(M / KN)} kN·m.`,
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
    text: (T) => String.raw`A simple beam of length ${T.L} m carries ${T.w} kN/m downward, uniform along the span. Find the shear at the left support and the largest moment.`,
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
    ],
    hints: [
      'The two supports split a uniform load in half. The moment at midspan is the load times the span squared, over eight.',
      String.raw`Shear at the support $= wL/2$. Moment $= wL^2/8$. The shear is zero at that same midspan station.`,
    ],
    steps: ($, sig) => [
      String.raw`Left shear ${sig(($.w * $.L) / 2 / KN)} kN.`,
      String.raw`Midspan moment ${sig(($.w * $.L * $.L) / 8 / KN)} kN·m.`,
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
    text: (T) => String.raw`A rectangular section ${T.b} mm wide and ${T.h} mm deep carries a sagging moment of ${T.M} kN·m. Find the top and bottom fiber stresses. Tension is positive.`,
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
    ],
    hints: [
      'The section modulus of a rectangle is the width times the height squared, over six. Sagging compression is on top.',
      String.raw`$\sigma = 6M/(bh^2)$. The top stress is the negative of the bottom stress.`,
    ],
    steps: ($, sig) => {
      const f = flexureFibers($.M, rectSection($.b, $.h));
      return [
        String.raw`Top ${sig(f.top / MPA)} MPa.`,
        String.raw`Bottom ${sig(f.bot / MPA)} MPa.`,
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
    text: (T) => String.raw`A tee has a 120 mm by 12 mm flange on top of a 12 mm by 100 mm web. The sagging moment is ${T.M} kN·m. Find the top and bottom fiber stresses. Tension is positive.`,
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
      return [
        String.raw`Top ${sig(f.top / MPA)} MPa.`,
        String.raw`Bottom ${sig(f.bot / MPA)} MPa.`,
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
      return [String.raw`Bending stress ${sig(psi)} psi.`];
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
      String.raw`Section modulus $= bh^2/6$. Then $w = 8M/L^2$.`,
    ],
    steps: ($, sig) => [String.raw`Uniform load ${sig(allowW($) / KN)} kN/m.`],
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
];

export default ch6;
