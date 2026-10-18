/**
 * Chapter 1: stress. Internal loads by the method of sections, average normal and shear stress,
 * stress on an inclined plane, truss member stress, pins in shear and bearing, and the factor of
 * safety. Each answer has a second route: the transformation equations, the method of joints, a
 * pin's segments, a bisection on the allowable, or the same numbers worked in other units.
 */
import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { axialStress, circleArea, inclined, pinSegments, pinShear, requiredArea, transform } from '@flux/subjects/mechanics/materials.js';
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
    vars: {
      P: range(5, 80, 1, 'kN', KN),
      d: range(8, 40, 1, 'mm', MM),
    },
    text: (T) => String.raw`A solid round rod of diameter $${T.d}$ mm carries an axial tension of $${T.P}$ kN. Find the average normal stress in the rod.`,
    parts: [num('sigma', ($) => axialStress($.P, circleArea($.d)), 'MPa', { scale: MPA, label: 'normal stress' })],
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
    vars: {
      P: range(1, 30, 0.5, 'kip', KIP),
      d: range(0.25, 2, 0.125, 'in', M_PER_IN),
    },
    text: (T) => String.raw`A steel tie rod of diameter $${T.d}$ in carries an axial tension of $${T.P}$ kip. Find the average normal stress in ksi.`,
    parts: [num('sigma', ($) => axialStress($.P, circleArea($.d)), 'ksi', { scale: KSI, label: 'normal stress' })],
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
    vars: {
      P: range(5, 60, 1, 'kN', KN),
      A: range(100, 800, 10, 'mm²', MM2),
      th: range(5, 80, 5, '°'),
    },
    text: (T) => String.raw`A bar of cross-sectional area $${T.A}\ \mathrm{mm^2}$ carries an axial tension of $${T.P}$ kN. A plane is cut through it, with its normal at $\theta = ${T.th}^\circ$ to the bar's axis. Find the normal and shear stress on that plane.`,
    parts: [
      num('sigma', ($) => inclined($.P, $.A, $.th).sigma, 'MPa', { scale: MPA, label: 'normal stress σ' }),
      num('tau', ($) => inclined($.P, $.A, $.th).tau, 'MPa', { scale: MPA, label: 'shear stress τ' }),
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
    vars: {
      A: range(200, 1000, 50, 'mm²', MM2),
      th: range(20, 70, 5, '°'),
      sa: range(4, 12, 0.5, 'MPa', MPA),
      ta: range(3, 8, 0.5, 'MPa', MPA),
    },
    valid: ($) => {
      const s = scarf($);
      return Math.abs(s.Psig - s.Ptau) > 0.03 * s.P;
    },
    text: (T) => String.raw`Two pieces of a bar of area $${T.A}\ \mathrm{mm^2}$ are glued on a plane whose normal is $${T.th}^\circ$ from the bar's axis. The glue allows $${T.sa}$ MPa in tension and $${T.ta}$ MPa in shear. Find the largest axial tension the joint can carry, and say which allowable governs.`,
    parts: [
      num('P', ($) => scarf($).P, 'kN', { scale: KN, label: 'largest load' }),
      mc('governs', [['normal', 'the normal stress'], ['shear', 'the shear stress']], ($) => scarf($).governs, { label: 'governs' }),
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
    vars: {
      L: range(3, 10, 0.5, 'm'),
      F: range(5, 50, 1, 'kN', KN),
      f: range(0.4, 0.8, 0.05, ''),
      T: range(0, 20, 2, 'kN', KN),
    },
    derive: ($) => ({ a: $.L * $.f, x: ($.L * $.f) / 2 }),
    text: (T, $, sig) => String.raw`A beam of span $${T.L}$ m is pinned at its left end A and rests on a roller at its right end B. A downward load of $${T.F}$ kN acts $${sig($.a)}$ m from A, and a horizontal pull of $${T.T}$ kN acts at B, away from A. Find the normal force, shear force and bending moment on the section $${sig($.x)}$ m from A.`,
    parts: [
      num('N', ($) => $.T, 'kN', { scale: KN, label: 'normal force N' }),
      num('V', ($) => ($.F * ($.L - $.a)) / $.L, 'kN', { scale: KN, label: 'shear force V' }),
      num('M', ($) => (($.F * ($.L - $.a)) / $.L) * $.x, 'kN·m', { scale: KN, label: 'bending moment M' }),
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
    vars: {
      P: range(10, 40, 1, 'kN', KN),
      Ac: range(200, 800, 50, 'mm²', MM2),
      Aw: range(200, 800, 50, 'mm²', MM2),
      m: choice(['BC', 'BC'], ['EF', 'EF'], ['BF', 'BF']),
    },
    text: (T) => String.raw`The Pratt truss in the lab has 2 m panels and is 2 m deep: A, B, C, D along the bottom, E above B and F above C. It is pinned at A, rests on a roller at D, and carries $${T.P}$ kN down at B and twice that at C. The chords (AB, BC, CD, AE, EF, FD) have area $${T.Ac}\ \mathrm{mm^2}$, and the web (BE, CF, BF) has $${T.Aw}\ \mathrm{mm^2}$. Find the normal stress in member ${T.m}, positive in tension.`,
    parts: [num('sigma', ($) => axialStress(sectionForce($.P, $.m), CHORDS.includes($.m) ? $.Ac : $.Aw), 'MPa', { scale: MPA, label: `stress` })],
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
    vars: {
      P: range(10, 40, 1, 'kN', KN),
      sY: range(200, 350, 10, 'MPa', MPA),
      FS: range(1.5, 3, 0.25, ''),
    },
    text: (T) => String.raw`The lab's Pratt truss (2 m panels, 2 m deep, pinned at A and on a roller at D) carries $${T.P}$ kN down at B and twice that at C. Every chord (AB, BC, CD, AE, EF, FD) is to have the same area. The steel yields at $${T.sY}$ MPa. Find the smallest chord area for a factor of safety of ${T.FS} against yield.`,
    parts: [num('A', ($) => requiredArea(Math.max(...memberTable({ P: $.P, Ac: 1, Aw: 1 }).rows.filter((r) => r.group === 'chord').map((r) => Math.abs(r.F))), $.sY, $.FS), 'mm²', { scale: MM2, label: 'chord area' })],
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
    vars: {
      P: range(2, 40, 0.5, 'kN', KN),
      d: range(6, 25, 1, 'mm', MM),
    },
    text: (T) => String.raw`A bar carrying $${T.P}$ kN is held between the two legs of a clevis by a pin of diameter $${T.d}$ mm. Find the average shear stress in the pin.`,
    parts: [num('tau', ($) => pinShear($.P, $.d, 2), 'MPa', { scale: MPA, label: 'shear stress' })],
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
    vars: {
      d: range(8, 20, 1, 'mm', MM),
      t: range(4, 20, 1, 'mm', MM),
      tc: range(4, 12, 1, 'mm', MM),
      ta: choice([80e6, '80'], [100e6, '100'], [120e6, '120']),
      ba: range(150, 250, 25, 'MPa', MPA),
    },
    valid: ($) => {
      const loads = clevis($).list.map((m) => 1 / m.use).sort((a, b) => a - b);
      return loads[1] - loads[0] > 0.03 * loads[0];
    },
    text: (T) => String.raw`A bar of thickness $${T.t}$ mm sits between the two legs of a clevis, each $${T.tc}$ mm thick, joined by a pin of diameter $${T.d}$ mm. The pin's allowable shear stress is $${T.ta}$ MPa, and the allowable bearing stress on every plate is $${T.ba}$ MPa. Find the largest load the joint may carry, and what limits it.`,
    parts: [
      num('P', ($) => clevis($).P, 'kN', { scale: KN, label: 'allowable load' }),
      mc('governs', [['shear', 'shear in the pin'], ['bar', 'bearing on the bar'], ['leg', 'bearing on a leg']], ($) => clevis($).governs, { label: 'governs' }),
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
    vars: {
      P: range(1, 20, 0.5, 'kip', KIP),
      tf: range(20, 60, 5, 'ksi', KSI),
      FS: range(1.5, 3, 0.25, ''),
    },
    text: (T) => String.raw`A clevis pin in double shear carries $${T.P}$ kip. The pin's steel fails in shear at $${T.tf}$ ksi, and the design calls for a factor of safety of ${T.FS}. Find the smallest pin diameter, in inches.`,
    parts: [num('d', ($) => Math.sqrt((4 * requiredArea($.P, $.tf, $.FS)) / (2 * Math.PI)), 'in', { scale: M_PER_IN, label: 'pin diameter' })],
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
    vars: {
      P: range(10, 100, 5, 'kN', KN),
      d: range(10, 40, 1, 'mm', MM),
      sY: choice([250e6, '250'], [345e6, '345'], [275e6, '275'], [505e6, '505']),
    },
    valid: ($) => $.sY / axialStress($.P, circleArea($.d)) > 0.8,
    text: (T) => String.raw`A round rod of diameter $${T.d}$ mm carries $${T.P}$ kN in tension. Its material yields at $${T.sY}$ MPa. Find the factor of safety against yield.`,
    parts: [num('FS', ($) => $.sY / axialStress($.P, circleArea($.d)), '', { label: 'factor of safety' })],
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
];

export default ch1;
