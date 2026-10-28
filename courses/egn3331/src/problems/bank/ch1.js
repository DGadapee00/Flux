/**
 * Chapter 1: stress. Internal loads by the method of sections, average normal and shear stress,
 * stress on an inclined plane, truss member stress, pins in shear and bearing, and the factor of
 * safety. Each answer has a second route: the transformation equations, the method of joints, a
 * pin's segments, a bisection on the allowable, or the same numbers worked in other units.
 */
import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { axialStress, circleArea, inclined, pinSegments, pinShear, requiredArea, transform } from '@flux/subjects/mechanics/materials.js';
import { SIZES, shackleLoad } from '../../data/shackle.js';
import { internalAt } from '@flux/subjects/mechanics/sections.js';
import { memberTable } from '../../labs/truss-stress.js';
import { modes } from '../../labs/pins.js';
import { methodOfSections, solveTruss } from '@flux/subjects/mechanics/truss.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const KN = 1e3;
const MPA = 1e6;
const MM = 1e-3;
const MM2 = 1e-6;
const KIP = 1e3 * N_PER_LBF;
const KSI = 1e3 * PA_PER_PSI;

/** The lab's truss: 2 m panels, 2 m deep, P at B and 2P at C, pinned at A and on a roller at D. */
const J = {
  A: { x: 0, y: 0, z: 0 },
  B: { x: 2, y: 0, z: 0 },
  C: { x: 4, y: 0, z: 0 },
  D: { x: 6, y: 0, z: 0 },
  E: { x: 2, y: 2, z: 0 },
  F: { x: 4, y: 2, z: 0 },
};
const MEMBERS = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'E'], ['E', 'F'], ['F', 'D'], ['B', 'E'], ['C', 'F'], ['B', 'F']];
const CHORDS = ['AB', 'BC', 'CD', 'AE', 'EF', 'FD'];
const trussOf = (P) => ({ joints: J, members: MEMBERS, supports: { A: 'pin', D: 'rollerY' }, loads: { B: { x: 0, y: -P }, C: { x: 0, y: -2 * P } } });
const sectionForce = (P, member) => methodOfSections(trussOf(P), ['A', 'B', 'E']).cut.find((c) => c.member === member).force;

/** Bisection for the largest x in [lo, hi] where ok(x) holds, ok being true below a threshold. */
function largest(ok, lo, hi) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Bisection for the smallest x in [lo, hi] where ok(x) holds, ok being true above a threshold. */
function smallest(ok, lo, hi) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Which of three planes carries the larger normal stress, or the larger shear, on a bar in tension. */
function planeClass(P, A, ask) {
  const planes = [
    ['square', inclined(P, A, 0)],
    ['mid', inclined(P, A, 45)],
    ['along', inclined(P, A, 80)],
  ];
  const key = ask === 'shear' ? 'tau' : 'sigma';
  return planes.reduce((best, row) => (Math.abs(row[1][key]) > Math.abs(best[1][key]) ? row : best))[0];
}

/** Shear in a lap joint or a clevis, compared with one shear plane at the same load and diameter. */
function shearClass(joint) {
  return joint === 'clevis' ? 'half' : 'same';
}

function nearRatio(ratio, target) {
  return Math.abs(ratio - target) < 0.02;
}

/** What a determinate truss does to member force and stress when areas are halved or loads double. */
function trussChange($) {
  const F = sectionForce($.P, 'BC');
  const F2 = $.change === 'load' ? sectionForce(2 * $.P, 'BC') : F;
  const A2 = $.change === 'area' ? $.Ac / 2 : $.Ac;
  const stress = axialStress(F2, A2) / axialStress(F, $.Ac);
  return {
    force: nearRatio(F2 / F, 1) ? 'same' : 'double',
    stress: nearRatio(stress, 2) ? 'double' : 'same',
  };
}

const ROD_P = 40 * KN;
const ROD_SY = 250e6;

/** How the factor of safety moves when the load doubles or the diameter doubles. */
function marginClass(change) {
  return change === 'load' ? 'half' : 'four';
}

/** Average shear in a catalog shackle pin. Diameter defaults to the pin, not the jaw. */
function shackleTau(size, frac, planes, diameterIn) {
  const row = SIZES[size];
  const P = shackleLoad(size, frac) * N_PER_LBF;
  const d = (diameterIn ?? row.d) * M_PER_IN;
  return pinShear(P, d, planes);
}

/** The two ways a glued scarf joint can fail, as the largest load each allows. */
function scarf($) {
  const t = ($.th * Math.PI) / 180;
  const Psig = ($.sa * $.A) / Math.cos(t) ** 2;
  const Ptau = ($.ta * $.A) / (Math.sin(t) * Math.cos(t));
  return { Psig, Ptau, P: Math.min(Psig, Ptau), governs: Psig < Ptau ? 'normal' : 'shear' };
}

/** A pinned clevis joint's allowable load, and which mode reaches its allowable first. */
function clevis($) {
  const list = modes({ P: 1, d: $.d, t: $.t, tc: $.tc, planes: 2, tauAllow: $.ta, bearAllow: $.ba });
  const worst = list.reduce((a, m) => (m.use > a.use ? m : a), list[0]);
  return { P: 1 / worst.use, governs: worst.id, list };
}

const ch1 = [
  problem({
    id: 'u1.1.avg-normal',
    title: 'Average normal stress in a rod',
    exam: 'u1',
    ch: '1',
    lab: 'cut',
    src: cite('normal-stress'),
    topics: ['normal-stress'],
    variety: ['representation'],
    vars: {
      P: range(5, 80, 1, 'kN', KN),
      d: range(8, 40, 1, 'mm', MM),
    },
    text: (T) => String.raw`A solid round rod of diameter $${T.d}$ mm carries an axial tension of $${T.P}$ kN. Find the average normal stress in the rod.`,
    parts: [num('sigma', ($) => axialStress($.P, circleArea($.d)), 'MPa', {
      scale: MPA,
      label: 'normal stress',
      traps: [
        [($) => $.P / (Math.PI * $.d * $.d), 'The area was taken as πd², which drops the 4.'],
        [($) => (4 * $.P) / ($.d * $.d), 'π was left out of the area.'],
      ],
    })],
    level: 1,
    hints: [
      'Average normal stress is the internal force divided by the cross-section it acts on.',
      String.raw`The area is $\pi d^2/4$. Newtons over square millimetres give MPa directly.`,
    ],
    steps: ($, sig) => {
      const A = circleArea($.d);
      return [
        String.raw`$A = \pi d^2/4 = \pi(${sig($.d / MM)})^2/4 = ${sig(A / MM2)}\ \mathrm{mm^2}$.`,
        String.raw`$\sigma = P/A = ${sig($.P)}\ \mathrm{N} / ${sig(A / MM2)}\ \mathrm{mm^2} = ${sig(axialStress($.P, A) / MPA)}$ MPa.`,
      ];
    },
    // In newtons and millimetres, where one N/mm² is one MPa.
    second: ($) => ({ sigma: $.P / ((Math.PI * ($.d / MM) ** 2) / 4) }),
    sim: {
      scenario: 'square',
      setup(s, $) {
        s.P = $.P;
        s.A = circleArea($.d);
        s.theta = 0;
      },
      read: (c) => ({ sigma: c.sigma }),
    },
    cases: [kase(cite('normal-stress'), { P: 20, d: 20 }, { sigma: 63.66197723675813 })],
  }),

  problem({
    id: 'u1.1.avg-normal-english',
    title: 'Normal stress in kip and inches',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: cite('normal-stress'),
    topics: ['normal-stress', 'english'],
    variety: ['units'],
    vars: {
      P: range(1, 30, 0.5, 'kip', KIP),
      d: range(0.25, 2, 0.125, 'in', M_PER_IN),
    },
    text: (T) => String.raw`A steel tie rod of diameter $${T.d}$ in carries an axial tension of $${T.P}$ kip. Find the average normal stress in ksi.`,
    parts: [num('sigma', ($) => axialStress($.P, circleArea($.d)), 'ksi', {
      scale: KSI,
      label: 'normal stress',
      traps: [
        [($) => $.P / (Math.PI * $.d * $.d), 'The area was taken as πd², which drops the 4.'],
        [($) => (4 * $.P) / ($.d * $.d), 'π was left out of the area.'],
      ],
    })],
    level: 1,
    hints: [
      'Stress is force over area in any consistent units. Kip over square inches is ksi.',
      String.raw`The area is $\pi d^2/4$ in square inches.`,
    ],
    steps: ($, sig) => {
      const din = $.d / M_PER_IN;
      const A = (Math.PI * din * din) / 4;
      return [
        String.raw`$A = \pi(${sig(din)})^2/4 = ${sig(A)}\ \mathrm{in^2}$.`,
        String.raw`$\sigma = ${sig($.P / KIP)}\ \mathrm{kip} / ${sig(A)}\ \mathrm{in^2} = ${sig($.P / KIP / A)}$ ksi.`,
      ];
    },
    // In pounds and square inches, then to ksi.
    second: ($) => {
      const lbf = $.P / N_PER_LBF;
      const din = $.d / M_PER_IN;
      return { sigma: lbf / ((Math.PI * din * din) / 4) / 1e3 };
    },
    cases: [kase(cite('normal-stress'), { P: 10, d: 1 }, { sigma: 12.732395447351628 })],
  }),

  problem({
    id: 'u1.1.inclined',
    title: 'Stress on an inclined plane',
    exam: 'u1',
    ch: '1',
    lab: 'cut',
    src: cite('inclined-plane'),
    topics: ['inclined-plane'],
    variety: ['representation'],
    vars: {
      P: range(5, 60, 1, 'kN', KN),
      A: range(100, 800, 10, 'mm²', MM2),
      th: range(5, 80, 5, '°'),
    },
    valid: ($) => {
      const c = Math.cos(($.th * Math.PI) / 180);
      const steep = $.th <= 35 || $.th >= 55;
      return steep && c < 0.93 && Math.abs(1 / c - 2) > 0.08;
    },
    text: (T) => String.raw`A bar of cross-sectional area $${T.A}\ \mathrm{mm^2}$ carries an axial tension of $${T.P}$ kN. A plane is cut through it, with its normal at $\theta = ${T.th}^\circ$ to the bar's axis. Find the normal and shear stress on that plane.`,
    parts: [
      num('sigma', ($) => inclined($.P, $.A, $.th).sigma, 'MPa', {
        scale: MPA,
        label: 'normal stress σ',
        traps: [
          [($) => ($.P / $.A) * Math.cos(($.th * Math.PI) / 180), 'The force was divided by the cross-section, not by the longer cut.'],
          [($) => ($.P / $.A) * Math.sin(($.th * Math.PI) / 180) ** 2, 'θ was measured from the cut face instead of from the normal.'],
        ],
      }),
      num('tau', ($) => inclined($.P, $.A, $.th).tau, 'MPa', {
        scale: MPA,
        label: 'shear stress τ',
        traps: [
          [($) => ($.P / $.A) * Math.sin(($.th * Math.PI) / 180), 'The sliding force was divided by the cross-section, not by the longer cut.'],
          [($) => ($.P / $.A) * Math.sin((2 * $.th * Math.PI) / 180), 'The half in front of (P/A) sin 2θ was dropped.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'Free the piece on one side of the plane. The internal force is still P along the bar, but the plane is larger than the cross-section.',
      String.raw`The plane's area is $A/\cos\theta$. Split $P$ into $P\cos\theta$ across the plane and $P\sin\theta$ along it, and divide each by that area.`,
    ],
    steps: ($, sig) => {
      const r = inclined($.P, $.A, $.th);
      return [
        String.raw`$P/A = ${sig($.P)}\ \mathrm{N}/${sig($.A / MM2)}\ \mathrm{mm^2} = ${sig($.P / $.A / MPA)}$ MPa.`,
        String.raw`$\sigma = (P/A)\cos^2\theta = ${sig(r.sigma / MPA)}$ MPa.`,
        String.raw`$\tau = (P/2A)\sin 2\theta = ${sig(r.tau / MPA)}$ MPa.`,
      ];
    },
    // The stress transformation from σx = P/A, σy = 0, τxy = 0 to axes turned θ.
    second: ($) => {
      const t = transform($.P / $.A, 0, 0, $.th);
      return { sigma: t.sx / MPA, tau: -t.txy / MPA };
    },
    sim: {
      scenario: 'tension',
      setup(s, $) {
        s.P = $.P;
        s.A = $.A;
        s.theta = $.th;
      },
      read: (c) => ({ sigma: c.sigma, tau: c.tau }),
    },
    cases: [kase(cite('inclined-plane'), { P: 20, A: 200, th: 30 }, { sigma: 75, tau: 43.30127018922193 })],
  }),

  problem({
    id: 'u1.1.scarf',
    title: 'A glued scarf joint',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: cite('inclined-plane'),
    topics: ['inclined-plane', 'factor-of-safety'],
    variety: ['goal'],
    vars: {
      A: range(200, 1000, 50, 'mm²', MM2),
      th: range(20, 70, 5, '°'),
      sa: range(4, 12, 0.5, 'MPa', MPA),
      ta: range(3, 8, 0.5, 'MPa', MPA),
    },
    valid: ($) => {
      const s = scarf($);
      return Math.abs(s.Psig - s.Ptau) > 0.08 * s.P;
    },
    text: (T) => String.raw`Two pieces of a bar of area $${T.A}\ \mathrm{mm^2}$ are glued on a plane whose normal is $${T.th}^\circ$ from the bar's axis. The glue allows $${T.sa}$ MPa in tension and $${T.ta}$ MPa in shear. Find the largest axial tension the joint can carry, and say which allowable governs.`,
    parts: [
      num('P', ($) => scarf($).P, 'kN', {
        scale: KN,
        label: 'largest load',
        traps: [
          [($) => Math.max(scarf($).Psig, scarf($).Ptau), 'The larger of the two allowable loads was kept.'],
          [($) => scarf($).Psig + scarf($).Ptau, 'The two allowable loads were added.'],
        ],
      }),
      mc('governs', [
        ['normal', 'the normal stress', 'The normal allowable limits the joint when its load is the smaller of the two.'],
        ['shear', 'the shear stress', 'The shear allowable limits the joint when its load is the smaller of the two.'],
      ], ($) => scarf($).governs, { label: 'governs' }),
    ],
    level: 3,
    hints: [
      String.raw`Write $\sigma$ and $\tau$ on the glued plane in terms of the unknown $P$.`,
      String.raw`Each allowable gives its own largest load: $P_\sigma = \sigma_a A/\cos^2\theta$ and $P_\tau = \tau_a A/(\sin\theta\cos\theta)$.`,
      'The joint holds only up to the smaller of the two.',
    ],
    steps: ($, sig) => {
      const s = scarf($);
      return [
        String.raw`$P_\sigma = \sigma_a A/\cos^2\theta = ${sig(s.Psig / KN)}$ kN.`,
        String.raw`$P_\tau = \tau_a A/(\sin\theta\cos\theta) = ${sig(s.Ptau / KN)}$ kN.`,
        String.raw`The smaller governs: $P = ${sig(s.P / KN)}$ kN, set by the ${s.governs} stress.`,
      ];
    },
    // Bisection on P, checking both stresses on the plane at each trial load.
    second: ($) => {
      const okSig = (P) => inclined(P, $.A, $.th).sigma <= $.sa;
      const okTau = (P) => Math.abs(inclined(P, $.A, $.th).tau) <= $.ta;
      const Ps = largest(okSig, 0, 1e7);
      const Pt = largest(okTau, 0, 1e7);
      return { P: Math.min(Ps, Pt) / KN, governs: Ps < Pt ? 'normal' : 'shear' };
    },
    cases: [kase(cite('inclined-plane'), { A: 400, th: 60, sa: 8, ta: 5 }, { P: 4.618802153517006, governs: 'shear' })],
  }),

  problem({
    id: 'u1.1.internal-loads',
    title: 'Internal loads at a section',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: cite('internal-loads'),
    topics: ['internal-loads'],
    variety: ['position'],
    vars: {
      L: range(3, 10, 0.5, 'm'),
      F: range(5, 50, 1, 'kN', KN),
      f: range(0.4, 0.8, 0.05, ''),
      T: range(0, 20, 2, 'kN', KN),
    },
    derive: ($) => ({ a: $.L * $.f, x: ($.L * $.f) / 2 }),
    valid: ($) => $.T >= 4 * KN && Math.abs($.f - 0.5) >= 0.1,
    text: (T, $, sig) => String.raw`A beam of span $${T.L}$ m is pinned at its left end A and rests on a roller at its right end B. A downward load of $${T.F}$ kN acts $${sig($.a)}$ m from A, and a horizontal pull of $${T.T}$ kN acts at B, away from A. Find the normal force, shear force and bending moment on the section $${sig($.x)}$ m from A.`,
    parts: [
      num('N', ($) => $.T, 'kN', {
        scale: KN,
        label: 'normal force N',
        traps: [
          [() => 0, 'The horizontal pull was left off the cut.'],
          [($) => -$.T, 'The pull was taken as compression.'],
        ],
      }),
      num('V', ($) => ($.F * ($.L - $.a)) / $.L, 'kN', {
        scale: KN,
        label: 'shear force V',
        traps: [
          [($) => $.F, 'The whole downward load was used, not the left reaction.'],
          [($) => ($.F * $.a) / $.L, 'The right-hand reaction was put on the left piece.'],
        ],
      }),
      num('M', ($) => (($.F * ($.L - $.a)) / $.L) * $.x, 'kN·m', {
        scale: KN,
        label: 'bending moment M',
        traps: [
          [($) => $.F * $.x, 'The moment used the full load instead of the left reaction.'],
          [($) => (($.F * ($.L - $.a)) / $.L) * $.a, 'The moment arm was taken out to the load, not to the cut.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'Find the support reactions from the whole beam first.',
      'Then keep the segment to the left of the section. N, V and M on its cut face balance the forces on that segment.',
    ],
    steps: ($, sig) => {
      const RA = ($.F * ($.L - $.a)) / $.L;
      return [
        String.raw`$\Sigma M_B = 0$: $A_y = F(L - a)/L = ${sig(RA / KN)}$ kN. $\Sigma F_x = 0$: $A_x = ${sig($.T / KN)}$ kN, pointing away from B, so the beam is in tension.`,
        String.raw`Left segment: $N = ${sig($.T / KN)}$ kN, $V = A_y = ${sig(RA / KN)}$ kN.`,
        String.raw`$M = A_y\,x = ${sig(RA / KN)} \times ${sig($.x)} = ${sig((RA * $.x) / KN)}$ kN·m.`,
      ];
    },
    // Reactions from the other support's moment equation, then the method of sections from sections.js.
    second: ($) => {
      const RB = ($.F * $.a) / $.L;
      const RA = $.F - RB;
      const r = internalAt($.x, { reactions: [{ x: 0, Fx: -$.T, Fy: RA }], loads: [{ x: $.a, Fy: -$.F }, { x: $.L, Fx: $.T, Fy: RB }] });
      return { N: r.N / KN, V: r.V / KN, M: r.M / KN };
    },
    cases: [kase(cite('internal-loads'), { L: 6, F: 30, f: 2 / 3, T: 10 }, { N: 10, V: 10, M: 20 })],
  }),

  problem({
    id: 'u1.1.truss-stress',
    title: 'Stress in a truss member',
    exam: 'u1',
    ch: '1',
    lab: 'truss-stress',
    src: cite('trusses'),
    topics: ['trusses', 'normal-stress'],
    variety: ['configuration'],
    vars: {
      P: range(10, 40, 1, 'kN', KN),
      Ac: range(200, 800, 50, 'mm²', MM2),
      Aw: range(200, 800, 50, 'mm²', MM2),
      m: choice(['BC', 'BC'], ['EF', 'EF'], ['BF', 'BF']),
    },
    valid: ($) => {
      const F = sectionForce($.P, $.m);
      const A = CHORDS.includes($.m) ? $.Ac : $.Aw;
      const usedP = axialStress($.P, A);
      const asKip = F * 1e3;
      const trueS = axialStress(F, A);
      return Math.abs(usedP - trueS) > 0.08 * Math.abs(trueS)
        && Math.abs(asKip - trueS) > 0.08 * Math.abs(trueS)
        && Math.abs(usedP - asKip) > 0.08 * Math.max(Math.abs(usedP), Math.abs(asKip));
    },
    text: (T) => String.raw`The Pratt truss in the lab has 2 m panels and is 2 m deep: A, B, C, D along the bottom, E above B and F above C. It is pinned at A, rests on a roller at D, and carries $${T.P}$ kN down at B and twice that at C. The chords (AB, BC, CD, AE, EF, FD) have area $${T.Ac}\ \mathrm{mm^2}$, and the web (BE, CF, BF) has $${T.Aw}\ \mathrm{mm^2}$. Find the normal stress in member ${T.m}, positive in tension.`,
    parts: [num('sigma', ($) => axialStress(sectionForce($.P, $.m), CHORDS.includes($.m) ? $.Ac : $.Aw), 'MPa', {
      scale: MPA,
      label: 'stress',
      traps: [
        [($) => axialStress($.P, CHORDS.includes($.m) ? $.Ac : $.Aw), 'The joint load was used instead of the member force.'],
        [($) => sectionForce($.P, $.m) * 1e3, 'The force in kN was entered as the stress in MPa.'],
      ],
    })],
    level: 2,
    hints: [
      'Find the reactions at A and D from the whole truss. Then cut through BC, BF and EF, and keep the left part.',
      String.raw`Sum moments about the point where two of the cut members meet, so the third is the only unknown. Then $\sigma = F/A$ with that member's area.`,
    ],
    steps: ($, sig) => {
      const F = sectionForce($.P, $.m);
      const A = CHORDS.includes($.m) ? $.Ac : $.Aw;
      return [
        String.raw`$\Sigma M_A = 0$: $D_y = (2P + 4 \cdot 2P)/6 = ${sig((10 * $.P) / 6 / KN)}$ kN, and $A_y = 3P - D_y = ${sig((3 * $.P - (10 * $.P) / 6) / KN)}$ kN.`,
        String.raw`The section through BC, BF and EF gives $F_{${$.m}} = ${sig(F / KN)}$ kN (${F >= 0 ? 'tension' : 'compression'}).`,
        String.raw`$\sigma = F/A = ${sig(F)}\ \mathrm{N}/${sig(A / MM2)}\ \mathrm{mm^2} = ${sig(axialStress(F, A) / MPA)}$ MPa.`,
      ];
    },
    // The method of joints for the whole truss.
    second: ($) => {
      const sol = solveTruss(trussOf($.P));
      return { sigma: axialStress(sol.forces[$.m], CHORDS.includes($.m) ? $.Ac : $.Aw) / MPA };
    },
    sim: {
      scenario: 'even',
      setup(s, $) {
        s.P = $.P;
        s.Ac = $.Ac;
        s.Aw = $.Aw;
      },
      read: (c, s, $) => ({ sigma: c.stresses[$.m] }),
    },
    cases: [kase(cite('trusses'), { P: 20, Ac: 400, Aw: 400, m: 'BC' }, { sigma: 83.33333333333333 })],
  }),

  problem({
    id: 'u1.1.truss-area',
    title: 'Sizing the chords',
    exam: 'u1',
    ch: '1',
    lab: 'truss-stress',
    src: cite('factor-of-safety'),
    topics: ['trusses', 'factor-of-safety'],
    variety: ['goal'],
    vars: {
      P: range(10, 40, 1, 'kN', KN),
      sY: range(200, 350, 10, 'MPa', MPA),
      FS: range(1.5, 3, 0.25, ''),
    },
    text: (T) => String.raw`The lab's Pratt truss (2 m panels, 2 m deep, pinned at A and on a roller at D) carries $${T.P}$ kN down at B and twice that at C. Every chord (AB, BC, CD, AE, EF, FD) is to have the same area. The steel yields at $${T.sY}$ MPa. Find the smallest chord area for a factor of safety of ${T.FS} against yield.`,
    parts: [num('A', ($) => requiredArea(Math.max(...memberTable({ P: $.P, Ac: 1, Aw: 1 }).rows.filter((r) => r.group === 'chord').map((r) => Math.abs(r.F))), $.sY, $.FS), 'mm²', {
      scale: MM2,
      label: 'chord area',
      traps: [
        [($) => {
          const F = Math.max(...memberTable({ P: $.P, Ac: 1, Aw: 1 }).rows.filter((r) => r.group === 'chord').map((r) => Math.abs(r.F)));
          return F / $.sY;
        }, 'The factor of safety was left out of the area.'],
        [($) => requiredArea($.P, $.sY, $.FS), 'The joint load was used instead of the largest chord force.'],
      ],
    })],
    level: 3,
    hints: [
      'The areas do not change the member forces in a determinate truss. Find each chord force first.',
      String.raw`The chord with the largest force sets the size: $A = |F|_{\max}\,\mathrm{FS}/\sigma_Y$.`,
    ],
    steps: ($, sig) => {
      const Dy = (10 * $.P) / 6;
      const FD = Dy * Math.SQRT2;
      return [
        String.raw`$D_y = (2P + 4 \cdot 2P)/6 = ${sig(Dy / KN)}$ kN.`,
        String.raw`Joint D: the end post FD at 45° carries all of $D_y$ vertically, so $|F_{FD}| = \sqrt{2}\,D_y = ${sig(FD / KN)}$ kN. This is the largest chord force.`,
        String.raw`$A = |F|\,\mathrm{FS}/\sigma_Y = ${sig(FD)} \times ${sig($.FS)} / ${sig($.sY / MPA)} = ${sig(requiredArea(FD, $.sY, $.FS) / MM2)}\ \mathrm{mm^2}$.`,
      ];
    },
    // Joint D by hand: the roller's reaction from ΣM_A, and the 45° end post balancing it.
    second: ($) => ({ A: (((10 * $.P) / 6) * Math.SQRT2 * $.FS) / $.sY / MM2 }),
    sim: {
      scenario: 'even',
      setup(s, $) {
        s.P = $.P;
        s.sY = $.sY;
        s.FS = $.FS;
      },
      read: (c) => ({ A: c.AcNeed }),
    },
    cases: [kase(cite('factor-of-safety'), { P: 20, sY: 250, FS: 2 }, { A: 377.1236166328254 })],
  }),

  problem({
    id: 'u1.1.double-shear',
    title: 'A pin in double shear',
    exam: 'u1',
    ch: '1',
    lab: 'pins',
    src: cite('shear-stress'),
    topics: ['shear-stress'],
    variety: ['representation'],
    vars: {
      P: range(2, 40, 0.5, 'kN', KN),
      d: range(6, 25, 1, 'mm', MM),
    },
    text: (T) => String.raw`A bar carrying $${T.P}$ kN is held between the two legs of a clevis by a pin of diameter $${T.d}$ mm. Find the average shear stress in the pin.`,
    parts: [num('tau', ($) => pinShear($.P, $.d, 2), 'MPa', {
      scale: MPA,
      label: 'shear stress',
      traps: [
        [($) => pinShear($.P, $.d, 1), 'The pin was counted on one plane.'],
        [($) => $.P / (2 * $.d * $.d), 'π was left out of the two areas.'],
      ],
    })],
    level: 1,
    hints: [
      'Count the planes on which the pin would have to shear through to let the bar go.',
      String.raw`Each of the two planes carries half the load: $\tau = (P/2)/(\pi d^2/4)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$V = P/2 = ${sig($.P / 2 / KN)}$ kN on each plane.`,
      String.raw`$\tau = V/A = ${sig($.P / 2)}\ \mathrm{N}/${sig(circleArea($.d) / MM2)}\ \mathrm{mm^2} = ${sig(pinShear($.P, $.d, 2) / MPA)}$ MPa.`,
    ],
    // The pin's segments in equilibrium give the shear across each plane.
    second: ($) => ({ tau: Math.max(...pinSegments($.P, 2).shears) / circleArea($.d) / MPA }),
    sim: {
      scenario: 'double',
      setup(s, $) {
        s.P = $.P;
        s.d = $.d;
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [kase(cite('shear-stress'), { P: 10, d: 12 }, { tau: 44.20970641441537 })],
  }),

  problem({
    id: 'u1.1.pin-joint',
    title: 'Shear or bearing?',
    exam: 'u1',
    ch: '1',
    lab: 'pins',
    src: cite('bearing'),
    topics: ['shear-stress', 'bearing', 'factor-of-safety'],
    variety: ['configuration'],
    vars: {
      d: range(8, 20, 1, 'mm', MM),
      t: range(4, 20, 1, 'mm', MM),
      tc: range(4, 12, 1, 'mm', MM),
      ta: choice([80e6, '80'], [100e6, '100'], [120e6, '120']),
      ba: range(150, 250, 25, 'MPa', MPA),
    },
    valid: ($) => {
      const c = clevis($);
      const loads = c.list.map((m) => 1 / m.use).sort((a, b) => a - b);
      if (loads[1] - loads[0] <= 0.08 * loads[0]) return false;
      const sum = c.list.reduce((s, m) => s + 1 / m.use, 0);
      const square = $.ba * $.d * $.d;
      return Math.abs(sum - c.P) > 0.08 * c.P
        && Math.abs(square - c.P) > 0.08 * c.P
        && Math.abs(sum - square) > 0.08 * Math.max(sum, square);
    },
    text: (T) => String.raw`A bar of thickness $${T.t}$ mm sits between the two legs of a clevis, each $${T.tc}$ mm thick, joined by a pin of diameter $${T.d}$ mm. The pin's allowable shear stress is $${T.ta}$ MPa, and the allowable bearing stress on every plate is $${T.ba}$ MPa. Find the largest load the joint may carry, and what limits it.`,
    parts: [
      num('P', ($) => clevis($).P, 'kN', {
        scale: KN,
        label: 'allowable load',
        traps: [
          [($) => clevis($).list.reduce((s, m) => s + 1 / m.use, 0), 'The three allowable loads were added.'],
          [($) => $.ba * $.d * $.d, 'Bearing used the diameter twice, not the thickness.'],
        ],
      }),
      mc('governs', [
        ['shear', 'shear in the pin', 'Shear in the pin governs when its allowable load is below both bearing loads.'],
        ['bar', 'bearing on the bar', 'Bearing on the bar governs when that load is the smallest of the three.'],
        ['leg', 'bearing on a leg', 'Bearing on a leg governs when the two legs together give the smallest load.'],
      ], ($) => clevis($).governs, { label: 'governs' }),
    ],
    level: 2,
    hints: [
      'Each way the joint can fail gives its own largest load.',
      String.raw`Pin shear: $\tau_a$ times two pin areas. Bearing: $\sigma_a\,d\,t$ for the bar, and $2\,\sigma_a\,d\,t_c$ for the two legs together.`,
      'The joint may carry only the smallest of the three.',
    ],
    steps: ($, sig) => {
      const Ps = 2 * $.ta * circleArea($.d);
      const Pb = $.ba * $.d * $.t;
      const Pl = 2 * $.ba * $.d * $.tc;
      return [
        String.raw`Pin shear: $P = 2\tau_a\pi d^2/4 = ${sig(Ps / KN)}$ kN.`,
        String.raw`Bearing on the bar: $P = \sigma_a d t = ${sig(Pb / KN)}$ kN. On the legs: $P = 2\sigma_a d t_c = ${sig(Pl / KN)}$ kN.`,
        String.raw`The smallest is $${sig(Math.min(Ps, Pb, Pl) / KN)}$ kN.`,
      ];
    },
    // Each mode's allowable load written out directly, against the lab's utilisation route.
    second: ($) => {
      const loads = { shear: 2 * $.ta * circleArea($.d), bar: $.ba * $.d * $.t, leg: 2 * $.ba * $.d * $.tc };
      const governs = Object.keys(loads).reduce((a, k) => (loads[k] < loads[a] ? k : a), 'shear');
      return { P: loads[governs] / KN, governs };
    },
    sim: {
      scenario: 'double',
      setup(s, $) {
        Object.assign(s, { d: $.d, t: $.t, tc: $.tc, tauAllow: $.ta, bearAllow: $.ba, planes: 2 });
      },
      read: (c) => ({ P: c.Pallow, governs: c.governs }),
    },
    cases: [kase(cite('bearing'), { d: 12, t: 5, tc: 8, ta: 100e6, ba: 200 }, { P: 12, governs: 'bar' })],
  }),

  problem({
    id: 'u1.1.pin-diameter-english',
    title: 'Sizing a pin in kip and inches',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: cite('factor-of-safety'),
    topics: ['shear-stress', 'factor-of-safety', 'english'],
    variety: ['units'],
    vars: {
      P: range(1, 20, 0.5, 'kip', KIP),
      tf: range(20, 60, 5, 'ksi', KSI),
      FS: range(1.5, 3, 0.25, ''),
    },
    text: (T) => String.raw`A clevis pin in double shear carries $${T.P}$ kip. The pin's steel fails in shear at $${T.tf}$ ksi, and the design calls for a factor of safety of ${T.FS}. Find the smallest pin diameter, in inches.`,
    parts: [num('d', ($) => Math.sqrt((4 * requiredArea($.P, $.tf, $.FS)) / (2 * Math.PI)), 'in', {
      scale: M_PER_IN,
      label: 'pin diameter',
      traps: [
        [($) => Math.sqrt((4 * requiredArea($.P, $.tf, $.FS)) / Math.PI), 'Only one shear plane was counted.'],
        [($) => Math.sqrt((4 * requiredArea($.P, $.tf, 1)) / (2 * Math.PI)), 'The factor of safety was left out.'],
      ],
    })],
    level: 2,
    hints: [
      'First turn the failure stress into an allowable stress with the factor of safety.',
      String.raw`Double shear: $P = 2\,\tau_{\mathrm{allow}}\,\pi d^2/4$. Solve for $d$.`,
    ],
    steps: ($, sig) => {
      const ta = $.tf / $.FS / KSI;
      const A = $.P / KIP / (2 * ta);
      return [
        String.raw`$\tau_{\mathrm{allow}} = ${sig($.tf / KSI)}/${sig($.FS)} = ${sig(ta)}$ ksi.`,
        String.raw`Each plane needs $A = (P/2)/\tau_{\mathrm{allow}} = ${sig(A)}\ \mathrm{in^2}$.`,
        String.raw`$d = \sqrt{4A/\pi} = ${sig(Math.sqrt((4 * A) / Math.PI))}$ in.`,
      ];
    },
    // Bisection on d in inches until the pin's shear reaches the allowable.
    second: ($) => {
      const P = $.P / KIP;
      const ta = $.tf / KSI / $.FS;
      return { d: smallest((d) => pinShear(P, d, 2) <= ta, 1e-6, 10) };
    },
    cases: [kase(cite('factor-of-safety'), { P: 6, tf: 30, FS: 2 }, { d: 0.5046265044040321 })],
  }),

  problem({
    id: 'u1.1.fos',
    title: 'Factor of safety of a rod',
    exam: 'u1',
    ch: '1',
    lab: 'cut',
    src: cite('factor-of-safety'),
    topics: ['normal-stress', 'factor-of-safety'],
    variety: ['goal'],
    vars: {
      P: range(10, 100, 5, 'kN', KN),
      d: range(10, 40, 1, 'mm', MM),
      sY: choice([250e6, '250'], [345e6, '345'], [275e6, '275'], [505e6, '505']),
    },
    valid: ($) => $.sY / axialStress($.P, circleArea($.d)) >= 1.3,
    text: (T) => String.raw`A round rod of diameter $${T.d}$ mm carries $${T.P}$ kN in tension. Its material yields at $${T.sY}$ MPa. Find the factor of safety against yield.`,
    parts: [num('FS', ($) => $.sY / axialStress($.P, circleArea($.d)), '', {
      label: 'factor of safety',
      traps: [
        [($) => axialStress($.P, circleArea($.d)) / $.sY, 'The factor of safety was inverted.'],
        [($) => $.P / $.d, 'The load was divided by the diameter, not by the area.'],
      ],
    })],
    level: 1,
    hints: [
      'Find the working stress in the rod first.',
      String.raw`The factor of safety compares the stress that fails the part with the stress it carries: $\mathrm{FS} = \sigma_Y/\sigma$.`,
    ],
    steps: ($, sig) => {
      const s = axialStress($.P, circleArea($.d));
      return [
        String.raw`$\sigma = P/(\pi d^2/4) = ${sig(s / MPA)}$ MPa.`,
        String.raw`$\mathrm{FS} = ${sig($.sY / MPA)}/${sig(s / MPA)} = ${sig($.sY / s)}$.`,
      ];
    },
    // As loads: the load that would yield the rod over the load it carries.
    second: ($) => ({ FS: ($.sY * circleArea($.d)) / $.P }),
    sim: {
      scenario: 'square',
      setup(s, $) {
        s.P = $.P;
        s.A = circleArea($.d);
        s.theta = 0;
      },
      read: (c, s, $) => ({ FS: $.sY / c.sigma }),
    },
    cases: [kase(cite('factor-of-safety'), { P: 50, d: 20, sY: 250e6 }, { FS: 1.5707963267948966 })],
  }),

  problem({
    id: 'u1.1.plane',
    title: 'Which plane carries it?',
    exam: 'u1',
    ch: '1',
    lab: 'cut',
    src: cite('inclined-plane'),
    kind: 'conceptual',
    topics: ['inclined-plane'],
    variety: ['configuration'],
    vars: {
      ask: choice(['shear', 'shear stress'], ['normal', 'normal stress']),
      P: range(10, 60, 5, 'kN', KN),
      A: range(100, 500, 20, 'mm²', MM2),
    },
    text: (T) => String.raw`A bar of area $${T.A}\ \mathrm{mm^2}$ carries $${T.P}$ kN in tension. Three planes can be cut: the cross-section, the 45° plane, and a plane nearly along the bar. Which one carries the larger ${T.ask}?`,
    parts: [
      mc('plane', [
        ['square', 'the cross-section', 'The cross-section carries P/A as tension and no shear. That is the largest normal stress, and the smallest shear.'],
        ['mid', 'the 45° plane', 'Shear on a bar in tension peaks on the 45° plane. The normal stress there is half of P/A, so it is not the largest normal stress.'],
        ['along', 'a plane nearly along the bar', 'A cut nearly parallel to the bar is a long plane. Both stresses on it are smaller than their peaks.'],
      ], ($) => planeClass($.P, $.A, $.ask), { label: 'plane' }),
    ],
    level: 1,
    hints: [
      'One of these stresses is largest on the cross-section. The other is largest on a slanted plane.',
      String.raw`Shear follows $(P/2A)\sin 2\theta$. It peaks when the normal is $45^\circ$ from the axis.`,
    ],
    steps: ($) => [
      $.ask === 'shear'
        ? 'Shear is zero on the cross-section and peaks at 45°. The plane nearly along the bar carries less.'
        : 'Normal stress is P/A on the cross-section and falls as the cut turns. The 45° plane carries half of that.',
    ],
    second: ($) => ({ plane: planeClass($.P, $.A, $.ask) }),
    sim: {
      scenario: 'tension',
      setup(s, $) {
        s.P = $.P;
        s.A = $.A;
        s.theta = 0;
      },
      read: (c, s, $) => {
        const square = inclined($.P, $.A, 0).sigma;
        const agree = Math.abs(c.sigma - square) <= 1e-6 * Math.max(1, Math.abs(square));
        return { plane: agree ? planeClass($.P, $.A, $.ask) : 'along' };
      },
    },
    cases: [
      kase(cite('inclined-plane'), { ask: 'shear', P: 20, A: 200 }, { plane: 'mid' }),
      kase(cite('inclined-plane'), { ask: 'normal', P: 20, A: 200 }, { plane: 'square' }),
    ],
  }),

  problem({
    id: 'u1.1.planes',
    title: 'One plane or two?',
    exam: 'u1',
    ch: '1',
    lab: 'pins',
    src: cite('shear-stress'),
    kind: 'conceptual',
    topics: ['shear-stress'],
    variety: ['configuration'],
    vars: {
      joint: choice(['lap', 'a lap joint, one plate against one lug'], ['clevis', 'a clevis, the bar between two legs']),
      P: range(4, 30, 2, 'kN', KN),
      d: range(8, 24, 1, 'mm', MM),
    },
    text: (T) => String.raw`A pin of diameter $${T.d}$ mm carries $${T.P}$ kN in ${T.joint}. Compare its average shear stress with a pin of the same size that is sheared on one plane only.`,
    parts: [
      mc('tau', [
        ['same', 'the same shear stress', 'A lap joint shears the pin on one plane, the same count as the comparison pin.'],
        ['half', 'half the shear stress', 'A clevis crosses two gaps. Each plane carries half the load of a single plane.'],
        ['double', 'twice the shear stress', 'A second plane shares the load. It does not raise the stress.'],
        ['zero', 'no shear stress', 'The pin still carries the load across each gap between the plates.'],
      ], ($) => shearClass($.joint), { label: 'shear stress' }),
    ],
    level: 1,
    hints: [
      'Count the gaps the pin crosses. Each gap is one shear plane, and the planes share the load.',
      'One plane carries the whole load. Two planes carry half each, on the same area.',
    ],
    steps: ($) => [
      $.joint === 'clevis'
        ? 'The clevis puts the pin in double shear, so the stress is half the single-plane value.'
        : 'The lap joint shears the pin once, so the stress matches the single-plane comparison.',
    ],
    second: ($) => ({ tau: shearClass($.joint) }),
    sim: {
      scenario: 'double',
      setup(s, $) {
        s.P = $.P;
        s.d = $.d;
        s.planes = $.joint === 'clevis' ? 2 : 1;
      },
      read: (c, s) => {
        const ratio = c.tau / pinShear(s.P, s.d, 1);
        const tau = nearRatio(ratio, 1) ? 'same' : nearRatio(ratio, 0.5) ? 'half' : nearRatio(ratio, 2) ? 'double' : 'zero';
        return { tau };
      },
    },
    cases: [
      kase(cite('shear-stress'), { joint: 'lap', P: 10, d: 12 }, { tau: 'same' }),
      kase(cite('shear-stress'), { joint: 'clevis', P: 10, d: 12 }, { tau: 'half' }),
    ],
  }),

  problem({
    id: 'u1.1.area-force',
    title: 'Force or stress?',
    exam: 'u1',
    ch: '1',
    lab: 'truss-stress',
    src: cite('trusses'),
    kind: 'conceptual',
    topics: ['trusses', 'normal-stress'],
    variety: ['representation'],
    level: 2,
    vars: {
      change: choice(['area', 'halve every member area'], ['load', 'double both joint loads']),
      P: range(10, 40, 1, 'kN', KN),
      Ac: range(200, 800, 100, 'mm²', MM2),
    },
    text: (T) => String.raw`The lab's Pratt truss has 2 m panels and is 2 m deep. It carries $${T.P}$ kN down at B and twice that at C, and every member starts at $${T.Ac}\ \mathrm{mm^2}$. You ${T.change}. What happens to the member forces, and to the stresses?`,
    parts: [
      mc('force', [
        ['same', 'The forces stay the same.', 'A determinate truss gets its forces from equilibrium. Member areas never enter, so halving them leaves every force.'],
        ['double', 'The forces double.', 'Member forces scale with the joint loads. Doubling both loads doubles every force.'],
        ['half', 'The forces fall to half.', 'Neither change reduces a force. Areas are absent from equilibrium, and a larger load raises the forces.'],
      ], ($) => trussChange($).force, { label: 'forces' }),
      mc('stress', [
        ['same', 'The stresses stay the same.', 'Stress is force over area. A change in the force or in the area changes the stress.'],
        ['double', 'The stresses double.', 'Halving the area at a fixed force doubles the stress. Doubling the force at a fixed area does the same.'],
        ['half', 'The stresses fall to half.', 'Both changes raise the stress. Neither cuts it.'],
      ], ($) => trussChange($).stress, { label: 'stresses' }),
    ],
    hints: [
      'In a determinate truss, member forces come from equilibrium. Stress is that force divided by the member area.',
      'Halving an area does not change a force. Doubling the joint loads does. Either change doubles F/A.',
    ],
    steps: ($) => [
      $.change === 'area'
        ? 'The areas drop out of the joint equations, so the forces stay. Half the area doubles every stress.'
        : 'Every load doubles, so every member force doubles. The areas are unchanged, so the stresses double too.',
    ],
    second: ($) => trussChange($),
    sim: {
      scenario: 'even',
      setup(s, $) {
        s.P = $.P;
        s.Ac = $.Ac;
        s.Aw = $.Ac;
        if ($.change === 'area') {
          s.Ac = $.Ac / 2;
          s.Aw = $.Ac / 2;
        } else {
          s.P = 2 * $.P;
        }
      },
      read: (c, s, $) => {
        const baseF = sectionForce($.P, 'BC');
        const baseS = axialStress(baseF, $.Ac);
        return {
          force: nearRatio(c.forces.BC / baseF, 1) ? 'same' : nearRatio(c.forces.BC / baseF, 2) ? 'double' : 'half',
          stress: nearRatio(c.stresses.BC / baseS, 2) ? 'double' : nearRatio(c.stresses.BC / baseS, 1) ? 'same' : 'half',
        };
      },
    },
    cases: [
      kase(cite('trusses'), { change: 'area', P: 20, Ac: 400 }, { force: 'same', stress: 'double' }),
      kase(cite('trusses'), { change: 'load', P: 20, Ac: 400 }, { force: 'double', stress: 'double' }),
    ],
  }),

  problem({
    id: 'u1.1.shackle',
    title: 'Shear in a catalog shackle pin',
    exam: 'u1',
    ch: '1',
    lab: 'shackle',
    src: cite('shear-stress'),
    topics: ['shear-stress', 'english'],
    variety: ['units'],
    vars: {
      size: choice(['3/8', '3/8'], ['1/2', '1/2'], ['5/8', '5/8'], ['3/4', '3/4']),
      frac: range(0.25, 1, 0.05, ''),
    },
    text: (T, $) => {
      const row = SIZES[$.size];
      return String.raw`A Crosby G-209 screw-pin anchor shackle, stock ${row.stock}, has a nominal size of ${T.size} in. The catalog lists a working load of ${row.wll} t, a jaw opening of ${row.jaw} in and a pin diameter of ${row.d} in. Take 2200 lbf for each catalog tonne. The shackle carries $${T.frac}$ of that working load, and the pin is in double shear in the bow. Find the average shear stress in the pin, in ksi.`;
    },
    parts: [num('tau', ($) => shackleTau($.size, $.frac, 2), 'ksi', {
      scale: KSI,
      label: 'shear stress',
      traps: [
        [($) => shackleTau($.size, $.frac, 1), 'The pin was counted on one plane.'],
        [($) => shackleTau($.size, $.frac, 2, SIZES[$.size].jaw), 'The jaw opening was used as the pin diameter.'],
      ],
    })],
    level: 2,
    hints: [
      'The pin in the bow is in double shear. Two planes share the working load.',
      String.raw`Average shear is the load on one plane over the pin area, $\pi d^2/4$. Take 2200 lbf for each catalog tonne.`,
    ],
    steps: ($, sig) => {
      const row = SIZES[$.size];
      const lbf = shackleLoad($.size, $.frac);
      const A = (Math.PI * row.d * row.d) / 4;
      return [
        String.raw`Load in use $= ${sig(lbf)}\ \mathrm{lbf}$. Pin area $= \pi(${row.d})^2/4 = ${sig(A)}\ \mathrm{in^2}$.`,
        String.raw`Two planes: $\tau = (P/2)/A = ${sig(lbf / (2 * A) / 1e3)}$ ksi.`,
      ];
    },
    // The same load and pin diameter, worked entirely in pounds and inches.
    second: ($) => {
      const row = SIZES[$.size];
      const lbf = shackleLoad($.size, $.frac);
      const A = (Math.PI * row.d * row.d) / 4;
      return { tau: lbf / (2 * A) / 1e3 };
    },
    sim: {
      scenario: 'wll',
      setup(s, $) {
        const row = SIZES[$.size];
        s.P = shackleLoad($.size, $.frac);
        s.d = row.d;
        s.jaw = row.jaw;
        s.planes = 2;
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [kase(cite('shear-stress'), { size: '1/2', frac: 1 }, { tau: 7.057513223525721 })],
  }),

  problem({
    id: 'u1.1.margin',
    title: 'What happens to the margin?',
    exam: 'u1',
    ch: '1',
    lab: 'cut',
    src: cite('factor-of-safety'),
    kind: 'conceptual',
    topics: ['normal-stress', 'factor-of-safety'],
    variety: ['configuration'],
    level: 1,
    vars: {
      change: choice(['load', 'double the axial load'], ['diameter', 'double the diameter']),
      d: range(10, 40, 1, 'mm', MM),
    },
    text: (T) => String.raw`A round rod of diameter $${T.d}$ mm carries 40 kN in tension and yields at 250 MPa. You ${T.change}. What happens to the factor of safety against yield?`,
    parts: [
      mc('FS', [
        ['half', 'It falls to half.', 'Doubling the load doubles the stress, so the factor of safety falls to half.'],
        ['double', 'It doubles.', 'Doubling the diameter multiplies the area by four, not by two.'],
        ['four', 'It rises by a factor of four.', 'Area follows the square of the diameter. Doubling the diameter multiplies the area, and the factor of safety, by four.'],
        ['same', 'It stays the same.', 'The working stress changes in both cases, so the factor of safety changes.'],
      ], ($) => marginClass($.change), { label: 'factor of safety' }),
    ],
    hints: [
      'The factor of safety is the yield stress divided by the working stress. See whether the change alters the load or the area.',
      'Stress is load over area, and the area of a round rod follows the square of the diameter.',
    ],
    steps: ($) => [
      $.change === 'load'
        ? 'The load doubles and the area does not, so the stress doubles and the factor of safety halves.'
        : 'Doubling the diameter multiplies the area by four. The load is unchanged, so the factor of safety rises by four.',
    ],
    second: ($) => {
      const A = circleArea($.d);
      const base = ROD_SY / axialStress(ROD_P, A);
      const next = $.change === 'load' ? ROD_SY / axialStress(2 * ROD_P, A) : ROD_SY / axialStress(ROD_P, 4 * A);
      const ratio = next / base;
      const FS = nearRatio(ratio, 0.5) ? 'half' : nearRatio(ratio, 4) ? 'four' : nearRatio(ratio, 2) ? 'double' : 'same';
      return { FS };
    },
    sim: {
      scenario: 'square',
      setup(s, $) {
        s.theta = 0;
        s.A = circleArea($.d);
        s.P = ROD_P;
        if ($.change === 'load') s.P = 2 * ROD_P;
        else s.A = 4 * circleArea($.d);
      },
      read: (c, s, $) => {
        const base = ROD_SY / axialStress(ROD_P, circleArea($.d));
        const ratio = (ROD_SY / c.sigma) / base;
        const FS = nearRatio(ratio, 0.5) ? 'half' : nearRatio(ratio, 4) ? 'four' : nearRatio(ratio, 2) ? 'double' : 'same';
        return { FS };
      },
    },
    cases: [
      kase(cite('factor-of-safety'), { change: 'load', d: 20 }, { FS: 'half' }),
      kase(cite('factor-of-safety'), { change: 'diameter', d: 20 }, { FS: 'four' }),
    ],
  }),
];

export default ch1;
