/**
 * Strain energy, Castigliano's theorem, and impact.
 * The crane rope is the English problem. The level-3 problem solves for the
 * drop height that reaches an allowable stress. Unit loads find a roof truss's joint movements and
 * a beam's slope and quarter-point drop.
 */
import { PA_PER_PSI } from '@flux/subjects/convert.js';
import { polarJ } from '@flux/subjects/mechanics/torsion.js';
import {
  axialBar, cantileverStation, dropHeightForStress, impactDrop, torsionStrain, twoBarTruss,
} from '@flux/subjects/mechanics/strain-energy.js';
import { simpleUniformDeflection } from '@flux/subjects/mechanics/elastic.js';
import { trussStiffness, unitLoadBeam, unitLoadTruss } from '@flux/subjects/mechanics/virtualwork.js';
import { ROPE_A_IN2, ROPE_E_PSI, ropeDrop, ropeInches } from '../../data/rope.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const E = 200e9;
const G = 75e9;
const KSI = 1000 * PA_PER_PSI;
const DEG = Math.PI / 180;
const MM = 1e-3;
const MPA = 1e6;

const rel = (a, b) => Math.abs(a - b) > 0.08 * Math.max(Math.abs(a), Math.abs(b), 1e-12);
const area = (d) => Math.PI * (d / 2) ** 2;
const beamEI = (b, h) => E * b * h ** 3 / 12;

/** The five-bar roof truss: chord A–B–C, apex D above B, hanger BD. */
const roofTruss = ($) => ({
  joints: { A: { x: 0, y: 0 }, B: { x: $.half, y: 0 }, C: { x: 2 * $.half, y: 0 }, D: { x: $.half, y: $.rise } },
  members: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'C'], ['B', 'D']],
  loads: { B: { y: -$.P } },
  supports: { A: 'pin', C: 'rollerY' },
});

function barSecond($) {
  const delta = ($.N * $.L) / ($.A * E);
  return { U: 0.5 * $.N * delta, delta: delta * 1e3 };
}

const ch14 = [
  problem({
    id: 'u10.14.axial',
    title: 'Energy in a uniform bar',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'axial'],
    variety: ['representation'],
    level: 1,
    vars: {
      N: range(10, 80, 10, 'kN', 1000),
      L: range(0.8, 2.4, 0.2, 'm'),
      A: range(200, 800, 100, 'mm²', 1e-6),
    },
    text: (T) => String.raw`A uniform steel bar, area ${T.A} mm² and length ${T.L} m, carries ${T.N} kN in tension. E is 200 GPa. Find the strain energy and the elongation.`,
    parts: [
      num('U', ($) => axialBar($.N, $.L, $.A, E).U, 'J', {
        traps: [
          [($) => $.N * axialBar($.N, $.L, $.A, E).delta, 'That is the load times the stretch. Strain energy keeps the one half.'],
          [($) => ($.N * $.L) / $.A, 'That dropped E, so it is not an energy.'],
        ],
      }),
      num('delta', ($) => axialBar($.N, $.L, $.A, E).delta, 'mm', {
        scale: MM,
        traps: [
          [($) => ($.N * $.L) / (2 * $.A * E), 'The one half belongs in the energy, not in the elongation.'],
          [($) => ($.N * $.L) / $.A, 'That elongation has no modulus.'],
        ],
      }),
    ],
    hints: [
      'For a linear bar the energy is half the axial force times the elongation.',
      'The elongation is NL/AE. The energy is N²L over 2AE.',
    ],
    steps: ($) => {
      const bar = axialBar($.N, $.L, $.A, E);
      return [
        `δ = NL/AE = ${bar.delta * 1e3} mm.`,
        `U = ½ Nδ = ${bar.U} J.`,
      ];
    },
    second: barSecond,
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.P = $.N;
        s.L = $.L;
        s.A = $.A;
      },
      read: (c) => ({ U: c.U, delta: c.delta }),
    },
    cases: [kase(cite('energy'), { N: 40, L: 1.5, A: 400 }, { U: 15, delta: 0.75 })],
  }),

  problem({
    id: 'u10.14.beam',
    title: 'Energy in a cantilever',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'bending'],
    variety: ['representation'],
    level: 2,
    vars: {
      P: range(400, 1600, 200, 'N'),
      L: range(1.2, 2.4, 0.2, 'm'),
      b: range(30, 50, 10, 'mm', MM),
      h: range(60, 100, 10, 'mm', MM),
    },
    text: (T) => String.raw`A cantilever is ${T.b} mm wide and ${T.h} mm deep, length ${T.L} m, with ${T.P} N downward at the tip. E is 200 GPa. Find the tip deflection and the bending strain energy.`,
    parts: [
      num('delta', ($) => {
        const EI = beamEI($.b, $.h);
        return ($.P * $.L ** 3) / (3 * EI);
      }, 'mm', {
        scale: MM,
        traps: [
          [($) => ($.P * $.L ** 3) / (48 * beamEI($.b, $.h)), 'That is a simple span with the load at midspan, not a cantilever.'],
          [($) => ($.P * $.L ** 3) / beamEI($.b, $.h), 'The cantilever tip is PL³ over 3EI, not over EI.'],
        ],
      }),
      num('U', ($) => {
        const EI = beamEI($.b, $.h);
        return ($.P * $.P * $.L ** 3) / (6 * EI);
      }, 'J', {
        traps: [
          [($) => $.P * ($.P * $.L ** 3) / (3 * beamEI($.b, $.h)), 'That is Pδ. The energy is half of that.'],
          [($) => ($.P * $.P * $.L ** 3) / (2 * beamEI($.b, $.h)), 'The bending integral of this cantilever is P²L³ over 6EI.'],
        ],
      }),
    ],
    hints: [
      'The tip drop of a cantilever is PL³ over 3EI, and the energy is half the load times that drop.',
      'I for a rectangle is bh³/12. Differentiate the energy with respect to P and the tip drop comes back.',
    ],
    steps: ($) => {
      const EI = beamEI($.b, $.h);
      const delta = ($.P * $.L ** 3) / (3 * EI);
      return [
        `δ = PL³/(3EI) = ${delta * 1e3} mm.`,
        `U = ½ Pδ = ${(0.5 * $.P * delta)} J.`,
      ];
    },
    second: ($) => {
      const EI = beamEI($.b, $.h);
      const delta = ($.P * $.L ** 3) / (3 * EI);
      return { delta: delta * 1e3, U: 0.5 * $.P * delta };
    },
    sim: {
      scenario: 'tip',
      setup(s, $) {
        s.P = $.P;
        s.L = $.L;
        s.b = $.b;
        s.h = $.h;
        s.a = $.L;
      },
      read: (c) => ({ delta: c.delta, U: c.U }),
    },
    cases: [kase(cite('energy'), { P: 800, L: 2, b: 40, h: 80 }, { delta: 6.25, U: 2.5 })],
  }),

  problem({
    id: 'u10.14.station',
    title: 'Deflection away from the load',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'dummy'],
    variety: ['configuration'],
    level: 2,
    vars: {
      P: range(400, 1600, 200, 'N'),
      L: range(1.6, 2.8, 0.2, 'm'),
      a: range(0.3, 0.7, 0.1, 'L'),
    },
    valid: ($) => {
      const EI = beamEI(0.04, 0.08);
      const tip = ($.P * $.L ** 3) / (3 * EI);
      const delta = cantileverStation($.P, $.L, $.a * $.L, EI).delta;
      return rel(delta, tip) && rel(delta, tip / 2);
    },
    text: (T) => String.raw`A steel cantilever with a 40 mm by 80 mm rectangular section, 80 mm deep, length ${T.L} m, carries ${T.P} N at the tip. E is 200 GPa. Find the downward deflection at ${T.a} of the length, measured from the wall. No load acts at that station.`,
    parts: [
      num('delta', ($) => cantileverStation($.P, $.L, $.a * $.L, beamEI(0.04, 0.08)).delta, 'mm', {
        scale: MM,
        traps: [
          [($) => ($.P * $.L ** 3) / (3 * beamEI(0.04, 0.08)), 'That is the tip, not the station.'],
          [($) => 0.5 * ($.P * $.L ** 3) / (3 * beamEI(0.04, 0.08)), 'The deflection does not grow in proportion to the distance from the wall.'],
        ],
      }),
    ],
    hints: [
      'A dummy load at the station, set to zero after differentiating, finds a deflection where no real load acts.',
      'With the tip load P and a dummy Q at distance a from the wall, ∂M/∂Q is (a − x) on the wall side of the station and zero beyond it.',
    ],
    steps: ($, sig) => {
      const x = $.a * $.L;
      const delta = cantileverStation($.P, $.L, x, beamEI(0.04, 0.08)).delta;
      return [
        String.raw`Put a dummy load $Q$ at $x = ${sig(x)}$ m. For a cut nearer the wall, $M = -P(L - s) - Q(x - s)$, so $\partial M/\partial Q = -(x - s)$; beyond $x$ it is zero.`,
        String.raw`Set $Q = 0$ after differentiating: $\delta = \frac{1}{EI}\int_0^x P(L - s)(x - s)\,ds = \frac{P}{EI}\left(\frac{Lx^2}{2} - \frac{x^3}{6}\right)$.`,
        String.raw`With $EI = ${sig(beamEI(0.04, 0.08))}$ N·m², $\delta = ${sig(delta * 1e3)}$ mm.`,
      ];
    },
    second: ($) => {
      const EI = beamEI(0.04, 0.08);
      const a = $.a * $.L;
      const delta = ($.P / EI) * ($.L * a * a / 2 - a ** 3 / 6);
      return { delta: delta * 1e3 };
    },
    sim: {
      scenario: 'station',
      setup(s, $) {
        s.P = $.P;
        s.L = $.L;
        s.b = 0.04;
        s.h = 0.08;
        s.a = $.a * $.L;
      },
      read: (c) => ({ delta: c.delta }),
    },
    cases: [kase(cite('energy'), { P: 800, L: 2, a: 0.5 }, { delta: 1.953125 })],
  }),

  problem({
    id: 'u10.14.truss',
    title: 'A two-bar truss',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'truss'],
    variety: ['configuration'],
    level: 2,
    vars: {
      P: range(2, 8, 1, 'kN', 1000),
      span: range(3, 5, 0.5, 'm'),
      rise: range(0.4, 1, 0.1, 'm'),
      A: range(80, 150, 10, 'mm²', 1e-6),
    },
    valid: ($) => {
      const t = twoBarTruss($.P, $.span, $.rise, $.A, E);
      const shortening = (t.F * t.len) / ($.A * E);
      const cos = Math.sqrt(Math.max(1 - t.sin * t.sin, 0));
      return rel(t.delta, shortening) && rel(t.F, $.P / 2) && rel(t.F, $.P / (2 * cos));
    },
    text: (T) => String.raw`Two steel bars meet at a joint ${T.rise} m above the line of the supports. The supports are ${T.span} m apart and pinned. Each bar has area ${T.A} mm². E is 200 GPa. A load of ${T.P} kN acts straight down at the joint. Find the compressive force in one bar and the downward displacement of the joint.`,
    parts: [
      num('F', ($) => twoBarTruss($.P, $.span, $.rise, $.A, E).F, 'kN', {
        scale: 1000,
        traps: [
          [($) => $.P / 2, 'Splitting the load in half ignores the slope of the bars.'],
          [($) => {
            const half = $.span / 2;
            const len = Math.hypot(half, $.rise);
            return $.P / (2 * (half / len));
          }, 'That used the horizontal direction cosine in place of the vertical one.'],
        ],
      }),
      num('delta', ($) => twoBarTruss($.P, $.span, $.rise, $.A, E).delta, 'mm', {
        scale: MM,
        traps: [
          [($) => {
            const t = twoBarTruss($.P, $.span, $.rise, $.A, E);
            return (t.F * t.len) / ($.A * E);
          }, 'That is how much the bar shortens. The joint moves farther, by that shortening over sin θ.'],
          [($) => ($.P * Math.hypot($.span / 2, $.rise)) / ($.A * E), 'That treats the load as if one vertical bar carried all of it.'],
        ],
      }),
    ],
    hints: [
      'Each bar force is the load over twice the sine of the angle to the horizontal.',
      'Castigliano differentiates the energy of both bars with respect to the joint load. The bar shortening divided by sin θ is the same joint drop.',
    ],
    steps: ($) => {
      const t = twoBarTruss($.P, $.span, $.rise, $.A, E);
      return [
        `Each bar carries ${t.F / 1000} kN.`,
        `The joint drops ${t.delta * 1e3} mm.`,
      ];
    },
    second: ($) => {
      const half = $.span / 2;
      const len = Math.hypot(half, $.rise);
      const sin = $.rise / len;
      const F = $.P / (2 * sin);
      const delta = (F * len) / ($.A * E * sin);
      return { F: F / 1000, delta: delta * 1e3 };
    },
    sim: {
      scenario: 'truss',
      setup(s, $) {
        s.P = $.P;
        s.span = $.span;
        s.rise = $.rise;
        s.A = $.A;
      },
      read: (c) => ({ F: c.F, delta: c.delta }),
    },
    cases: [kase(cite('energy'), { P: 4, span: 4, rise: 0.5, A: 100 }, { F: 8.246211251235321, delta: 3.504639781715113 })],
  }),

  problem({
    id: 'u10.14.shaft',
    title: 'Energy in a shaft',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'torsion'],
    variety: ['representation'],
    level: 2,
    vars: {
      T: range(200, 800, 100, 'N·m'),
      L: range(0.6, 1.8, 0.2, 'm'),
      d: range(25, 50, 5, 'mm', MM),
    },
    text: (T) => String.raw`A solid steel shaft, diameter ${T.d} mm and length ${T.L} m, carries a torque of ${T.T} N·m. G is 75 GPa. Find the strain energy and the angle of twist.`,
    parts: [
      num('U', ($) => torsionStrain($.T, $.L, G, polarJ($.d / 2, 0)).U, 'J', {
        traps: [
          [($) => $.T * torsionStrain($.T, $.L, G, polarJ($.d / 2, 0)).phi, 'That is Tφ. The energy is half of that.'],
          [($) => torsionStrain($.T, $.L, E, polarJ($.d / 2, 0)).U, 'That used E in place of G.'],
        ],
      }),
      num('phi', ($) => torsionStrain($.T, $.L, G, polarJ($.d / 2, 0)).phi, 'deg', {
        scale: DEG,
        traps: [
          [($) => torsionStrain($.T, $.L, E, polarJ($.d / 2, 0)).phi, 'That used E in place of G, so the angle is too small.'],
          [($) => 2 * torsionStrain($.T, $.L, G, polarJ($.d / 2, 0)).phi, 'A circle\'s second moment I is half of J. Using I doubles the angle.'],
        ],
      }),
    ],
    hints: [
      'Torsion energy is half the torque times the angle, and the angle is TL over GJ.',
      'J for a solid circle is πd⁴/32. G here is 75 GPa, not the 200 GPa tensile modulus.',
    ],
    steps: ($) => {
      const s = torsionStrain($.T, $.L, G, polarJ($.d / 2, 0));
      return [
        `φ = ${s.phi * 180 / Math.PI}°.`,
        `U = ½ Tφ = ${s.U} J.`,
      ];
    },
    second: ($) => {
      const J = Math.PI * $.d ** 4 / 32;
      const phi = ($.T * $.L) / (G * J);
      return { U: 0.5 * $.T * phi, phi: phi * 180 / Math.PI };
    },
    sim: {
      scenario: 'shaft',
      setup(s, $) {
        s.T = $.T;
        s.shaftL = $.L;
        s.d = $.d;
      },
      read: (c) => ({ U: c.U, phi: c.phi }),
    },
    cases: [kase(cite('energy'), { T: 500, L: 1.2, d: 40 }, { U: 7.957747154594768, phi: 1.82378130556208 })],
  }),

  problem({
    id: 'u10.14.impact',
    title: 'A weight dropped onto a rod',
    exam: 'u10',
    ch: '14',
    lab: 'drop',
    src: cite('impact'),
    topics: ['impact'],
    variety: ['representation'],
    level: 2,
    vars: {
      W: range(800, 2400, 200, 'N'),
      L: range(1.2, 2.4, 0.2, 'm'),
      d: range(12, 20, 2, 'mm', MM),
      h: range(1, 4, 0.5, 'mm', MM),
    },
    valid: ($) => {
      const hit = impactDrop($.W, $.L, area($.d), E, $.h);
      return hit.n > 3 && hit.stress < 400e6;
    },
    text: (T) => String.raw`A steel rod, diameter ${T.d} mm and length ${T.L} m, hangs vertically. E is 200 GPa. A weight of ${T.W} N is dropped ${T.h} mm onto a collar at the lower end. Find the maximum normal stress and the impact factor.`,
    parts: [
      num('sigma', ($) => impactDrop($.W, $.L, area($.d), E, $.h).stress, 'MPa', {
        scale: 1e6,
        traps: [
          [($) => $.W / area($.d), 'That is the static stress. The drop multiplies it.'],
          [($) => 2 * $.W / area($.d), 'A factor of 2 is the sudden load, released from contact. This weight falls a height.'],
        ],
      }),
      num('n', ($) => impactDrop($.W, $.L, area($.d), E, $.h).n, '', {
        traps: [
          [() => 1, 'A factor of 1 is the static load, set down gently.'],
          [() => 2, 'A factor of 2 is a drop of zero, not a drop from a height.'],
        ],
      }),
    ],
    hints: [
      'The factor is one plus the square root of one plus twice the drop over the static stretch.',
      'The static stretch is WL/AE. The maximum stress is the factor times W/A.',
    ],
    steps: ($) => {
      const hit = impactDrop($.W, $.L, area($.d), E, $.h);
      return [
        `δ_st = ${hit.deltaSt * 1e3} mm and the factor is ${hit.n}.`,
        `The maximum stress is ${hit.stress / 1e6} MPa.`,
      ];
    },
    second: ($) => {
      const A = area($.d);
      const dst = ($.W * $.L) / (A * E);
      const delta = dst + Math.sqrt(dst * dst + 2 * dst * $.h);
      const n = delta / dst;
      return { sigma: (n * $.W) / A / 1e6, n };
    },
    sim: {
      scenario: 'rod',
      setup(s, $) {
        s.load = $.W;
        s.length = $.L;
        s.drop = $.h;
        s.d = $.d;
      },
      read: (c) => ({ sigma: c.stress, n: c.n }),
    },
    cases: [kase(cite('impact'), { W: 1500, L: 2, d: 16, h: 2 }, { sigma: 62.59488325256016, n: 8.390298682818294 })],
  }),

  problem({
    id: 'u10.14.rope',
    title: 'A crane rope',
    exam: 'u10',
    ch: '14',
    lab: 'drop',
    src: cite('impact'),
    topics: ['impact', 'english'],
    variety: ['units'],
    level: 2,
    vars: {
      W: range(200, 600, 50, 'lbf'),
      L: range(15, 40, 5, 'ft'),
      h: range(0.5, 2, 0.25, 'in'),
    },
    text: (T) => String.raw`A 1/2 in 6×19 IWRC crane rope has metallic area 0.118 in² and modulus 12.2 million psi, the low-load value in the Caltrans Falsework Manual, Appendix D, Example 18. ${T.L} ft of that rope catches a ${T.W} lbf hook load dropped ${T.h} in. Find the maximum stress and the impact factor.`,
    parts: [
      num('sigma', ($) => ropeDrop($.W, $.L, $.h).stress, 'ksi', {
        scale: KSI,
        traps: [
          [($) => ($.W / ROPE_A_IN2) * PA_PER_PSI, 'That is the static stress. The drop multiplies it.'],
          [($) => (2 * $.W / ROPE_A_IN2) * PA_PER_PSI, 'Doubling is the sudden case, a drop of zero.'],
        ],
      }),
      num('n', ($) => ropeDrop($.W, $.L, $.h).n, '', {
        traps: [
          [() => 1, 'A factor of 1 would be the load set down gently.'],
          [() => 2, 'A factor of 2 is a drop of zero.'],
        ],
      }),
    ],
    hints: [
      'Work the stretch in inches: load times length over area times modulus, with the length in inches.',
      'The factor uses that static stretch and the drop, both in inches. Stress is the factor times the load over the area.',
    ],
    steps: ($) => {
      const inch = ropeInches($.W, $.L, $.h);
      return [
        `The static stretch is ${inch.deltaIn} in and the factor is ${inch.n}.`,
        `The maximum stress is ${inch.stressPsi / 1000} ksi.`,
      ];
    },
    second: ($) => {
      const inch = ropeInches($.W, $.L, $.h);
      return { sigma: inch.stressPsi / 1000, n: inch.n };
    },
    sim: {
      scenario: 'catch',
      setup(s, $) {
        s.load = $.W;
        s.length = $.L;
        s.drop = $.h;
      },
      read: (c) => ({ sigma: c.stress, n: c.n }),
    },
    cases: [kase(cite('impact'), { W: 400, L: 30, h: 1 }, { sigma: 18.921930488319744, n: 5.5819694940543245 })],
  }),

  problem({
    id: 'u10.14.height',
    title: 'How far the weight may fall',
    exam: 'u10',
    ch: '14',
    lab: 'drop',
    src: cite('impact'),
    topics: ['impact'],
    variety: ['goal'],
    level: 3,
    vars: {
      W: range(1000, 2000, 200, 'N'),
      L: range(1.5, 2.5, 0.25, 'm'),
      d: range(12, 18, 2, 'mm', MM),
      sig: range(60, 120, 10, 'MPa', 1e6),
    },
    valid: ($) => {
      const r = dropHeightForStress($.W, $.L, area($.d), E, $.sig);
      const wrong = (r.deltaSt / 2) * r.n ** 2;
      return r.n > 3 && r.n < 20 && r.h > 0.0004 && rel(r.h, wrong);
    },
    text: (T) => String.raw`A steel rod, diameter ${T.d} mm and length ${T.L} m, has E = 200 GPa. A weight of ${T.W} N will be dropped onto its collar. The maximum stress must stay at or below ${T.sig} MPa. Find the greatest drop height.`,
    parts: [
      num('h', ($) => dropHeightForStress($.W, $.L, area($.d), E, $.sig).h, 'mm', {
        scale: MM,
        traps: [
          [($) => {
            const r = dropHeightForStress($.W, $.L, area($.d), E, $.sig);
            return (r.deltaSt / 2) * r.n * r.n;
          }, 'That solves n = √(2h/δ) and leaves out the rest of the factor.'],
          [() => 0, 'A drop of zero is the sudden load. It is allowed only when the allowable is at least twice the static stress, and it is not the greatest height.'],
        ],
      }),
    ],
    hints: [
      'Turn the allowable stress into a factor on the static stress, then solve the impact factor for the height.',
      'With n = σA/W and δ_st = WL/AE, the height is (δ_st/2) times ((n − 1)² − 1).',
    ],
    steps: ($) => {
      const r = dropHeightForStress($.W, $.L, area($.d), E, $.sig);
      return [
        `The factor at the allowable is ${r.n}.`,
        `The greatest drop is ${r.h * 1e3} mm.`,
      ];
    },
    second: ($) => {
      const A = area($.d);
      const k = (E * A) / $.L;
      const delta = ($.sig * A) / k;
      const h = (k * delta * delta) / (2 * $.W) - delta;
      return { h: h * 1e3 };
    },
    sim: {
      scenario: 'rod',
      setup(s, $) {
        s.load = $.W;
        s.length = $.L;
        s.d = $.d;
        s.drop = dropHeightForStress($.W, $.L, area($.d), E, $.sig).h;
      },
      read: (c, state, $) => ({ h: Math.abs(c.stress - $.sig) / $.sig < 1e-3 ? state.drop : 0 }),
    },
    cases: [kase(cite('impact'), { W: 1500, L: 2, d: 16, sig: 80 }, { h: 3.489321169701264 })],
  }),

  problem({
    id: 'u10.14.scale',
    title: 'What squares the energy',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'axial'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 1,
    vars: {
      change: choice(['load', 'the force'], ['length', 'the length']),
      N: range(10, 80, 10, 'kN', 1000),
      L: range(0.8, 2.4, 0.2, 'm'),
    },
    text: (T) => String.raw`A steel bar of area 400 mm² and length ${T.L} m carries ${T.N} kN. E is 200 GPa. Double ${T.change}. What happens to the strain energy?`,
    parts: [
      mc('which', [
        ['quadruple', 'It quadruples.', 'Energy follows the square of the force. Doubling the force multiplies the energy by four.'],
        ['double', 'It doubles.', 'Energy is linear in the length. Doubling the length doubles the energy. The force is the change that squares.'],
        ['same', 'It stays the same.', 'Both the force and the length are in N²L/2AE.'],
        ['half', 'It falls by half.', 'Nothing in this change divides the energy by two.'],
      ], ($) => ($.change === 'load' ? 'quadruple' : 'double')),
    ],
    hints: [
      'Axial energy follows the square of the force and the first power of the length.',
      'Doubling the force is a factor of four. Doubling the length is a factor of two.',
    ],
    steps: ($) => [
      $.change === 'load'
        ? 'U follows N², so doubling the force quadruples the energy.'
        : 'U follows L, so doubling the length doubles the energy.',
    ],
    second: ($) => ({ which: $.change === 'load' ? 'quadruple' : 'double' }),
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.P = $.change === 'load' ? $.N * 2 : $.N;
        s.L = $.change === 'length' ? $.L * 2 : $.L;
        s.A = 4e-4;
      },
      read: (c, _s, $) => {
        const base = axialBar($.N, $.L, 4e-4, E).U;
        const ratio = c.U / base;
        let which = 'same';
        if (Math.abs(ratio - 4) < 0.05) which = 'quadruple';
        else if (Math.abs(ratio - 2) < 0.05) which = 'double';
        else if (Math.abs(ratio - 0.5) < 0.05) which = 'half';
        return { which };
      },
    },
    cases: [kase(cite('energy'), { change: 'load', N: 40, L: 1.5 }, { which: 'quadruple' })],
  }),

  problem({
    id: 'u10.14.release',
    title: 'Released from contact',
    exam: 'u10',
    ch: '14',
    lab: 'drop',
    src: cite('impact'),
    topics: ['impact'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      how: choice(['contact', 'from the contact point'], ['drop', 'from a height']),
      W: range(200, 600, 50, 'lbf'),
      h: range(0.5, 2, 0.25, 'in'),
    },
    text: (T) => String.raw`The crane rope is 30 ft of 1/2 in 6×19 IWRC. A hook load of ${T.W} lbf is released ${T.how}${T.how === 'from a height' ? ` of ${T.h} in` : ''}. Compared with the static stress, the maximum stress is`,
    parts: [
      mc('which', [
        ['twice', 'twice the static stress.', 'Released from contact, h = 0 and the factor is exactly 2.'],
        ['more', 'more than twice the static stress.', 'Any real drop makes the factor larger than 2.'],
        ['same', 'the static stress.', 'The static stress is the load set down gently, so that the stretch grows with the load and the mass never falls.'],
        ['half', 'half the static stress.', 'A falling weight does not unload the rope.'],
      ], ($) => ($.how === 'contact' ? 'twice' : 'more')),
    ],
    hints: [
      'A drop of zero is not a static load. The factor formula still has a one in front of the square root.',
      'At h = 0 the square root is 1, so the factor is 2. A positive drop makes the square root larger.',
    ],
    steps: ($) => [
      $.how === 'contact'
        ? 'h = 0, so the factor is 1 + 1 = 2.'
        : 'h is positive, so the factor is larger than 2.',
    ],
    second: ($) => ({ which: $.how === 'contact' ? 'twice' : 'more' }),
    sim: {
      scenario: 'catch',
      setup(s, $) {
        s.load = $.W;
        s.length = 30;
        s.drop = $.how === 'contact' ? 0 : $.h;
      },
      read: (c) => {
        if (Math.abs(c.n - 2) < 0.05) return { which: 'twice' };
        if (c.n > 2.2) return { which: 'more' };
        return { which: 'same' };
      },
    },
    cases: [kase(cite('impact'), { how: 'contact', W: 400, h: 1 }, { which: 'twice' })],
  }),

  problem({
    id: 'u10.14.dummy',
    title: 'Where the dummy load goes',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('energy'),
    topics: ['energy', 'dummy'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      want: choice(['tip', 'the tip'], ['midspan', 'midspan']),
      P: range(400, 1600, 200, 'N'),
      L: range(1.6, 2.8, 0.2, 'm'),
    },
    text: (T) => String.raw`A cantilever of length ${T.L} m already carries ${T.P} N at the tip. You want the downward deflection at ${T.want}. What do you add before differentiating the energy?`,
    parts: [
      mc('which', [
        ['real', 'Nothing. Differentiate with respect to the tip load.', 'The real load already acts at the tip, in the direction of the tip deflection.'],
        ['dummy', 'A dummy load at midspan, then set it to zero.', 'The dummy goes where the displacement is wanted, and in that direction. It is removed by setting it to zero after the derivative.'],
        ['support', 'A dummy load at the wall.', 'The wall does not move. A load there does not find a deflection along the span.'],
        ['replace', 'Replace the tip load with the dummy.', 'Removing the real load changes the beam you were asked about.'],
      ], ($) => ($.want === 'tip' ? 'real' : 'dummy')),
    ],
    hints: [
      'The derivative is taken with respect to a force that acts at the point, in the direction of the displacement.',
      'If that force is already there, use it. If it is not, add a dummy and set the dummy to zero at the end.',
    ],
    steps: ($) => [
      $.want === 'tip'
        ? 'The tip load is already the force at the tip. No dummy.'
        : 'Midspan has no real load, so a dummy goes there and is then set to zero.',
    ],
    second: ($) => ({ which: $.want === 'tip' ? 'real' : 'dummy' }),
    sim: {
      scenario: 'station',
      setup(s, $) {
        s.P = $.P;
        s.L = $.L;
        s.b = 0.04;
        s.h = 0.08;
        s.a = $.want === 'tip' ? $.L : $.L / 2;
      },
      read: (c, _s, $) => {
        const EI = beamEI(0.04, 0.08);
        const tip = ($.P * $.L ** 3) / (3 * EI);
        const mid = cantileverStation($.P, $.L, $.L / 2, EI).delta;
        if (Math.abs(c.delta - tip) <= 0.02 * tip) return { which: 'real' };
        if (Math.abs(c.delta - mid) <= 0.02 * Math.max(mid, 1e-12)) return { which: 'dummy' };
        return { which: 'support' };
      },
    },
    cases: [kase(cite('energy'), { want: 'midspan', P: 800, L: 2 }, { which: 'dummy' })],
  }),
  problem({
    id: 'u10.14.truss-unit',
    title: 'Joint movement by unit loads',
    exam: 'u10',
    ch: '14',
    lab: null,
    src: cite('unit-load'),
    topics: ['unit-load', 'truss-unit'],
    variety: ['unknown'],
    level: 3,
    vars: {
      half: range(1.5, 3, 0.25, 'm', 1),
      rise: range(1, 2.5, 0.25, 'm', 1),
      P: range(10, 40, 2, 'kN', 1000),
      A: range(200, 600, 50, 'mm²', 1e-6),
    },
    derive: ($) => {
      const t = roofTruss($);
      const AE = $.A * E;
      const v = unitLoadTruss(t, AE, 'B', [0, -1]);
      const slide = unitLoadTruss(t, AE, 'C', [1, 0]).delta;
      const stretches = v.rows.reduce((s, r) => s + Math.abs((r.N * r.L) / AE), 0);
      return { dropB: v.delta, slide, stretches, hanger: ($.P * $.rise) / AE };
    },
    valid: ($) => ($.P * Math.hypot($.half, $.rise)) / (2 * $.rise * $.A) < 200e6,
    text: (T) => String.raw`A roof truss spans $2\times ${T.half}$ m on a pin at A and a roller at C. Its bottom chord meets a hanger at midspan B, and the hanger rises $${T.rise}$ m to the apex D, which the rafters AD and DC join. Every bar is steel, $E = 200$ GPa, with area $${T.A}$ mm². $${T.P}$ kN hangs at B. By the unit-load method, find how far B drops and how far the roller C slides.`,
    parts: [
      num('dropB', ($) => $.dropB, 'mm', {
        scale: MM,
        label: 'drop at B',
        traps: [
          [($) => $.stretches, 'That adds the bars\' changes of length. Each must be weighted by the force a unit load at B puts in that bar.'],
          [($) => $.dropB - $.hanger, 'That leaves out the hanger. It carries the load, and its stretch moves B too.'],
        ],
      }),
      num('slide', ($) => $.slide, 'mm', {
        scale: MM,
        label: 'roller slide',
        traps: [
          [($) => 2 * $.slide, 'A horizontal unit load at C loads only the bottom chord, with $n = 1$ in each chord bar.'],
        ],
      }),
    ],
    hints: [
      'Solve the truss twice: once for the real load, once for a unit load at the joint along the direction you want. Then $\\Delta = \\sum nNL/AE$.',
      String.raw`A unit load down at B gives each bar $n = N/P$. A unit load across at C puts tension 1 in both chord bars and nothing in the others.`,
    ],
    steps: ($, sig) => {
      const Lr = Math.hypot($.half, $.rise);
      const Nr = -($.P * Lr) / (2 * $.rise);
      const Nc = ($.P * $.half) / (2 * $.rise);
      return [
        String.raw`Real forces: chords $${sig(Nc / 1000)}$ kN, rafters $${sig(Nr / 1000)}$ kN, hanger $${sig($.P / 1000)}$ kN. Rafter length $${sig(Lr)}$ m.`,
        String.raw`Unit load at B: $n = N/P$ in every bar, so $\Delta_B = \sum N^2L/(P\,AE) = ${sig($.dropB / MM)}$ mm.`,
        String.raw`Unit load across at C: $n = 1$ in the two chord bars, so the slide is $2N_cL_c/AE = ${sig($.slide / MM)}$ mm.`,
      ];
    },
    second: ($) => {
      // Direct stiffness on the whole truss: assemble K, solve for every joint.
      const k = trussStiffness(roofTruss($), $.A * E);
      return { dropB: -k.disp.B.y / MM, slide: k.disp.C.x / MM };
    },
    cases: [kase(cite('unit-load'), { half: 2, rise: 1.5, P: 20, A: 400 }, { dropB: 1.6875, slide: 0.6666666666666663 })],
  }),

  problem({
    id: 'u10.14.beam-unit',
    title: 'A slope and a deflection by unit loads',
    exam: 'u10',
    ch: '14',
    lab: 'castigliano',
    src: cite('unit-load'),
    topics: ['unit-load', 'beam-unit'],
    variety: ['unknown'],
    level: 2,
    vars: {
      L: range(2, 6, 0.5, 'm', 1),
      w: range(1, 8, 0.5, 'kN/m', 1000),
      h: range(80, 200, 20, 'mm', MM),
    },
    derive: ($) => {
      const EI = beamEI(0.04, $.h);
      const M = (x) => ($.w * $.L * x) / 2 - ($.w * x * x) / 2;
      return {
        EI,
        slope: unitLoadBeam(M, (x) => 1 - x / $.L, $.L, EI),
        quarter: unitLoadBeam(M, (x) => (x < $.L / 4 ? 0.75 * x : 0.25 * ($.L - x)), $.L, EI, 4000),
      };
    },
    valid: ($) => $.quarter > 1e-3 && $.quarter < 0.06,
    text: (T) => String.raw`A steel beam ($E = 200$ GPa), 40 mm wide and $${T.h}$ mm deep, spans $${T.L}$ m on a pin and a roller under a uniform $${T.w}$ kN/m. Using unit loads, find the slope at the pin and the deflection at a quarter of the span from the pin.`,
    parts: [
      num('slope', ($) => $.slope, 'rad', {
        abs: 1e-6,
        label: 'slope at the pin',
        traps: [
          [($) => ((5 * $.w * $.L ** 4) / (384 * $.EI)) / ($.L / 2), 'That is the midspan drop over half the span, as if the beam ran straight from the pin. It curves, so the end is steeper.'],
        ],
      }),
      num('quarter', ($) => $.quarter, 'mm', {
        scale: MM,
        label: 'quarter-span drop',
        traps: [
          [($) => (5 * $.w * $.L ** 4) / (384 * $.EI), 'That is the midspan drop. The quarter point moves less.'],
          [($) => (5 * $.w * $.L ** 4) / (384 * $.EI) / 2, 'Half the midspan drop is not the quarter-point drop; the curve is not a triangle.'],
        ],
      }),
    ],
    hints: [
      'For a slope, put a unit couple at the station; for a deflection, a unit force. Then $\\int mM/EI\\,dx$.',
      String.raw`$M = wLx/2 - wx^2/2$. A unit couple at the pin gives $m = 1 - x/L$. A unit force at $L/4$ gives $m = 3x/4$ before it and $(L-x)/4$ after.`,
    ],
    steps: ($, sig) => [
      String.raw`$EI = ${sig($.EI)}$ N·m².`,
      String.raw`Slope: $\int_0^L (1 - x/L)M\,dx/EI = wL^3/24EI = ${sig($.slope)}$ rad.`,
      String.raw`Quarter point: $\int m M/EI\,dx = 19wL^4/2048EI = ${sig($.quarter / MM)}$ mm.`,
    ],
    second: ($) => {
      // The elastic curve of Unit 8 at the same stations.
      const c = simpleUniformDeflection($.w, $.L, $.EI);
      return { slope: -c.at(0).slope, quarter: -c.at($.L / 4).y / MM };
    },
    cases: [kase(cite('unit-load'), { L: 4, w: 5, h: 80 }, { slope: 0.0390625, quarter: (19 * 5e3 * 256) / (2048 * 341333.3333333333) / MM })],
  }),
  problem({
    id: 'u10.14.beam-drop',
    title: 'A weight dropped on a beam',
    exam: 'u10',
    ch: '14',
    lab: 'drop',
    src: cite('impact'),
    topics: ['impact'],
    variety: ['configuration'],
    level: 3,
    vars: {
      W: range(100, 800, 50, 'N', 1),
      h: range(10, 100, 10, 'mm', MM),
      L: range(1.5, 3, 0.25, 'm', 1),
      hs: range(80, 160, 20, 'mm', MM),
    },
    derive: ($) => {
      const I = (0.05 * $.hs ** 3) / 12;
      const k = (48 * E * I) / $.L ** 3;
      const st = $.W / k;
      const n = 1 + Math.sqrt(1 + (2 * $.h) / st);
      return { I, k, st, n, peak: (n * $.W * $.L * ($.hs / 2)) / (4 * I) };
    },
    valid: ($) => $.peak < 220 * MPA && $.peak > 20 * MPA,
    text: (T) => String.raw`A steel beam ($E = 200$ GPa), 50 mm wide and $${T.hs}$ mm deep, spans $${T.L}$ m on two supports. A weight of $${T.W}$ N is dropped from $${T.h}$ mm above the beam onto its midspan. Find the static deflection the weight would cause at rest, the impact factor, and the largest bending stress.`,
    parts: [
      num('st', ($) => $.st, 'mm', { scale: MM, label: 'static deflection' }),
      num('n', ($) => $.n, '', {
        label: 'impact factor',
        traps: [
          [() => 2, 'Two is a load released from contact, $h = 0$. This one falls first.'],
        ],
      }),
      num('peak', ($) => $.peak, 'MPa', {
        scale: MPA,
        label: 'largest stress',
        traps: [
          [($) => ($.W * $.L * ($.hs / 2)) / (4 * $.I), 'That is the static stress. The impact multiplies it by $n$.'],
        ],
      }),
    ],
    hints: [
      'At midspan the beam is a spring. Its stiffness is the load over the deflection a midspan load causes.',
      String.raw`$k = 48EI/L^3$. The impact factor uses the static deflection $W/k$, and the peak load $nW$ bends the beam like any midspan load.`,
    ],
    steps: ($, sig) => [
      String.raw`$I = ${sig($.I / 1e-12 / 1e6)}\times 10^6$ mm⁴ and $k = 48EI/L^3 = ${sig($.k / 1e6)}$ N/mm, so $\delta_{st} = W/k = ${sig($.st / MM)}$ mm.`,
      String.raw`$n = 1 + \sqrt{1 + 2h/\delta_{st}} = ${sig($.n)}$.`,
      String.raw`The peak load $nW = ${sig($.n * $.W)}$ N at midspan gives $M = nWL/4$ and $\sigma = Mc/I = ${sig($.peak / MPA)}$ MPa.`,
    ],
    second: ($) => {
      // Energy balance solved directly: W(h + δ) = kδ²/2, the positive root.
      const I = (0.05 * $.hs ** 3) / 12;
      const k = (48 * E * I) / $.L ** 3;
      const d = ($.W + Math.sqrt($.W * $.W + 2 * k * $.W * $.h)) / k;
      const F = k * d;
      return { st: ($.W / k) / MM, n: F / $.W, peak: (F * $.L * ($.hs / 2)) / (4 * I) / 1e6 };
    },
    cases: [kase(cite('impact'), { W: 500, h: 50, L: 2, hs: 100 }, { st: 0.09999999999999998, n: 32.63858403911276, peak: 97.91575211733824 })],
  }),

];

export default ch14;
