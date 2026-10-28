/**
 * Unit 1, polar coordinates (Hibbeler §12.8, D36): the components of v and a from r(t) and θ(t),
 * a radar gun's readings, the direction of a collar's acceleration, and the formulas themselves.
 * Every one opens the `polar` lab at its setup. The second method differentiates x = r cos θ and
 * y = r sin θ numerically (polarNumeric).
 */
import { polarComponents, polarNumeric, straightPass } from '@flux/subjects/mechanics/polar.js';
import { choice, kase, num, problem, range, sym } from '../kit.js';

const DEG = Math.PI / 180;

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** r, θ and their rates at the instant asked, whichever way the problem gives them. */
function polarState($) {
  if ($.given === 'laws') {
    // r = c t², θ = k t²
    return { r: $.c * $.t * $.t, rd: 2 * $.c * $.t, rdd: 2 * $.c, thd: 2 * $.k * $.t, thdd: 2 * $.k };
  }
  return { r: $.R, rd: $.u, rdd: $.b, thd: $.w, thdd: $.al };
}

/** The same motion as functions of time, for the numerical second method (instant at s = 0). */
function polarLaws($) {
  if ($.given === 'laws') return { rOf: (s) => $.c * (s + $.t) ** 2, thOf: (s) => $.k * (s + $.t) ** 2 };
  return { rOf: (s) => $.R + $.u * s + 0.5 * $.b * s * s, thOf: (s) => $.w * s + 0.5 * $.al * s * s };
}

const solve = ($) => polarComponents(polarState($));

/** A radar gun d from a straight road: the car at speed u, the line of sight at φ to the road. */
function radar($) {
  const x = $.d / Math.tan($.phi * DEG);
  const p = straightPass({ d: $.d, u: -$.u, x0: x, t: 0 });
  return { ...p, x };
}

/** Which way the collar accelerates, in words the options use. */
const SCENES = {
  out: { u: 0.4, w: 2 },
  in: { u: -0.4, w: 2 },
  fixed: { u: 0, w: 2 },
  still: { u: 0.4, w: 0 },
};
function direction(ar, ath, scale = 1) {
  const eps = 1e-6 * Math.max(1, scale);
  const radial = ar < -eps ? 'in' : ar > eps ? 'out' : '';
  const side = ath > eps ? 'ahead' : ath < -eps ? 'behind' : '';
  if (!radial && !side) return 'zero';
  return [radial, side].filter(Boolean).join('-');
}
const dirClosed = (scene) => {
  const { u, w } = SCENES[scene];
  const c = polarComponents({ r: 0.5, rd: u, thd: w });
  return direction(c.ar, c.ath);
};
const dirNumeric = (scene) => {
  const { u, w } = SCENES[scene];
  const n = polarNumeric((s) => 0.5 + u * s, (s) => w * s, 0);
  return direction(n.ar, n.ath, 1e3);
};

const polar = [
  problem({
    id: 'u1.12.polar',
    title: 'Polar components of v and a',
    exam: 'u1',
    ch: '12',
    lab: 'polar',
    src: 'Hibbeler §12.8',
    topics: ['polar'],
    // Structure: the motion is given as numbers at an instant, or as laws r(t) and θ(t) to differentiate.
    vars: {
      given: choice(['values', 'as numbers at the instant'], ['laws', 'as laws in time']),
      R: range(0.5, 2, 0.25, 'm'),
      u: range(-1, 2, 0.5, 'm/s'),
      b: range(-2, 2, 0.5, 'm/s²'),
      w: range(0.5, 4, 0.5, 'rad/s'),
      al: range(-2, 2, 0.5, 'rad/s²'),
      c: range(0.25, 1, 0.25, 'm/s²'),
      k: range(0.25, 1, 0.25, 'rad/s²'),
      t: range(1, 3, 0.5, 's'),
    },
    valid: ($) => {
      const p = solve($);
      return Math.abs(p.ar) > 0.05 && Math.abs(p.ath) > 0.05;
    },
    text: (T, $) => ($.given === 'laws'
      ? String.raw`A collar slides along a slotted arm. Its distance from the pivot is $r = ${T.c}\,t^2$ m and the arm's angle is $\theta = ${T.k}\,t^2$ rad, with $t$ in seconds. Find the collar's speed and the radial and transverse parts of its acceleration at $t = ${T.t}$ s.`
      : String.raw`At one instant a collar on a turning arm is at $r = ${T.R}$ m, sliding outward at $\dot r = ${T.u}$ m/s and speeding up along the arm at $\ddot r = ${T.b}$ m/s². The arm turns at $\dot\theta = ${T.w}$ rad/s with $\ddot\theta = ${T.al}$ rad/s². Find the collar's speed and the radial and transverse parts of its acceleration.`),
    parts: [
      num('v', ($) => solve($).v, 'm/s', { label: 'speed' }),
      num('ar', ($) => solve($).ar, 'm/s²', { label: 'radial acceleration a_r (outward positive)' }),
      num('ath', ($) => solve($).ath, 'm/s²', { label: 'transverse acceleration a_θ (in the sense of θ)' }),
    ],
    level: 2,
    hints: [
      'In polar components, v_r = ṙ and v_θ = rθ̇. Each unit vector turns as θ changes.',
      'Differentiating the turning unit vectors adds −rθ̇² to the radial part and 2ṙθ̇ to the transverse part.',
      'a_r = r̈ − rθ̇² and a_θ = rθ̈ + 2ṙθ̇. Find r, ṙ, r̈, θ̇ and θ̈ first.',
    ],
    steps: ($, sig) => {
      const m = polarState($);
      const p = solve($);
      return [
        $.given === 'laws'
          ? String.raw`At $t = ${sig($.t)}$ s: $r = ${sig(m.r)}$ m, $\dot r = ${sig(m.rd)}$ m/s, $\ddot r = ${sig(m.rdd)}$ m/s², $\dot\theta = ${sig(m.thd)}$ rad/s, $\ddot\theta = ${sig(m.thdd)}$ rad/s².`
          : String.raw`The instant gives $r$, $\dot r$, $\ddot r$, $\dot\theta$ and $\ddot\theta$ directly.`,
        String.raw`$v_r = \dot r = ${sig(p.vr)}$ m/s and $v_\theta = r\dot\theta = ${sig(p.vth)}$ m/s, so $v = ${sig(p.v)}$ m/s.`,
        String.raw`$a_r = \ddot r - r\dot\theta^2 = ${sig(m.rdd)} - ${sig(m.r)}(${sig(m.thd)})^2 = ${sig(p.ar)}$ m/s².`,
        String.raw`$a_\theta = r\ddot\theta + 2\dot r\dot\theta = ${sig(m.r * m.thdd)} + ${sig(2 * m.rd * m.thd)} = ${sig(p.ath)}$ m/s².`,
      ];
    },
    second: ($) => {
      const { rOf, thOf } = polarLaws($);
      const n = polarNumeric(rOf, thOf, 0);
      return { v: Math.hypot(n.vx, n.vy), ar: n.ar, ath: n.ath };
    },
    sim: {
      scenario: 'arm',
      setup(s, $) {
        if ($.given === 'laws') {
          Object.assign(s, { r0: 0, u: 0, ad: 2 * $.c, w: 0, al: 2 * $.k, t: $.t, tEnd: Math.max(1.6, 1.25 * $.t) });
        } else {
          Object.assign(s, { r0: $.R, u: $.u, ad: $.b, w: $.w, al: $.al, t: 0, tEnd: 1.6 });
        }
      },
      read: (c) => ({ v: c.v, ar: c.ar, ath: c.ath }),
    },
    cases: [
      kase('Hibbeler §12.8', { given: 'laws', R: 1, u: 0.5, b: 0, w: 2, al: 0, c: 0.5, k: 0.5, t: 2 }, { v: Math.hypot(2, 4), ar: -7, ath: 10 }),
      kase('Hibbeler §12.8', { given: 'values', R: 1, u: 0.5, b: 0, w: 2, al: 0, c: 0.5, k: 0.5, t: 2 }, { v: Math.hypot(0.5, 2), ar: -4, ath: 2 }),
    ],
  }),

  problem({
    id: 'u1.12.radar',
    title: 'What a radar gun reads',
    exam: 'u1',
    ch: '12',
    lab: 'polar',
    src: 'Hibbeler §12.8',
    topics: ['polar'],
    // Structure: the car comes toward the gun or drives away from it; the readings change sign, r̈ does not.
    vars: {
      way: choice(['toward', 'coming toward'], ['away', 'driving away from']),
      d: range(5, 30, 5, 'm'),
      u: range(15, 35, 5, 'm/s'),
      phi: range(10, 60, 5, 'deg'),
    },
    text: (T) => String.raw`A radar gun stands ${T.d} m from a straight road. A car on the road is ${T.way} it at a steady ${T.u} m/s. At this instant the line of sight makes ${T.phi}° with the road. In polar coordinates centred on the gun, find the range rate $\dot r$ the gun reads, the turning rate $\dot\theta$ of its line of sight, and $\ddot r$.`,
    parts: [
      num('rd', ($) => ($.way === 'away' ? -1 : 1) * radar($).rd, 'm/s', { label: 'range rate ṙ (positive when the range grows)' }),
      num('thd', ($) => Math.abs(radar($).thd), 'rad/s', { label: 'turning rate |θ̇| of the line of sight' }),
      num('rdd', ($) => radar($).rdd, 'm/s²', { label: 'r̈' }),
    ],
    level: 3,
    hints: [
      'The car does not accelerate, so a_r = r̈ − rθ̇² = 0 and a_θ = rθ̈ + 2ṙθ̇ = 0.',
      'Split the car’s velocity along the line of sight (that is ṙ) and across it (that is rθ̇). The range is r = d / sin φ.',
      'With ṙ and θ̇ known, a_r = 0 gives r̈ = rθ̇².',
    ],
    steps: ($, sig) => {
      const p = radar($);
      const s = $.way === 'away' ? -1 : 1;
      return [
        String.raw`The range is $r = d/\sin\varphi = ${sig(p.r)}$ m.`,
        String.raw`Along the line of sight the car's velocity has $u\cos\varphi = ${sig(Math.abs(p.rd))}$ m/s, so $\dot r = ${sig(s * p.rd)}$ m/s. Across it, $r\dot\theta = u\sin\varphi$, so $|\dot\theta| = ${sig(Math.abs(p.thd))}$ rad/s.`,
        String.raw`No acceleration means $a_r = \ddot r - r\dot\theta^2 = 0$, so $\ddot r = r\dot\theta^2 = ${sig(p.rdd)}$ m/s², positive whichever way the car drives.`,
      ];
    },
    second: ($) => {
      const x = $.d / Math.tan($.phi * DEG);
      const u = $.way === 'away' ? $.u : -$.u;
      const at = (s) => straightPass({ d: $.d, u, x0: x, t: s });
      const n = polarNumeric((s) => at(s).r, (s) => at(s).th, 0, 1e-3);
      const h = 1e-3;
      const r = (s) => at(s).r;
      return { rd: n.vr, thd: Math.abs(n.vth / at(0).r), rdd: (r(h) - 2 * r(0) + r(-h)) / (h * h) };
    },
    sim: {
      scenario: 'radar',
      setup(s, $) {
        const x = $.d / Math.tan($.phi * DEG);
        Object.assign(s, { d: $.d, u: $.way === 'away' ? $.u : -$.u, x0: x, t: 0, tEnd: (2 * x) / $.u + 1 });
      },
      read: (c) => ({ rd: c.rd, thd: Math.abs(c.thd), rdd: c.rdd }),
    },
    cases: [kase('Hibbeler §12.8', { way: 'toward', d: 10, u: 20, phi: 30 }, { rd: -20 * Math.cos(30 * DEG), thd: (20 * 0.5) / 20, rdd: 20 * 0.25 })],
  }),

  problem({
    id: 'u1.12.polar-dir',
    title: 'Which way does the collar accelerate?',
    exam: 'u1',
    ch: '12',
    kind: 'conceptual',
    lab: 'polar',
    src: 'Hibbeler §12.8',
    topics: ['polar'],
    vars: {
      scene: choice(
        ['out', 'slides outward at a steady rate while the arm turns at a steady rate'],
        ['in', 'slides inward at a steady rate while the arm turns at a steady rate'],
        ['fixed', 'is clamped to the arm, which turns at a steady rate'],
        ['still', 'slides outward at a steady rate along an arm that does not turn'],
      ),
    },
    text: (T) => `A collar on a straight arm ${T.scene}. Which way does the collar accelerate?`,
    parts: [
      pick('dir', 'the direction of the collar’s acceleration', [
        ['zero', 'it does not accelerate', 'Only a collar moving in a straight line at a steady speed has no acceleration. Any turning of the arm needs an inward part, rθ̇².'],
        ['in', 'straight toward the pivot', 'Inward is the rθ̇² part, there whenever the arm turns. If the collar also slides, 2ṙθ̇ adds a sideways part.'],
        ['in-ahead', 'toward the pivot and ahead, the way the arm turns', 'Sliding out at ṙ > 0 on an arm turning at θ̇ > 0 gives 2ṙθ̇ > 0: the arm pushes the collar forward to give it the larger sideways speed it needs farther out.'],
        ['in-behind', 'toward the pivot and back, against the turn', 'Sliding in, ṙ < 0, so 2ṙθ̇ < 0. The collar arrives with more sideways speed than the arm has there, and the arm holds it back.'],
      ], ($) => dirClosed($.scene)),
    ],
    level: 1,
    hints: [
      'With steady rates, r̈ = 0 and θ̈ = 0. What is left of a_r = r̈ − rθ̇² and a_θ = rθ̈ + 2ṙθ̇?',
      'The inward part needs θ̇ ≠ 0. The sideways part needs both ṙ ≠ 0 and θ̇ ≠ 0, and takes the sign of ṙθ̇.',
    ],
    steps: ($) => [
      'With steady rates, a_r = −rθ̇² and a_θ = 2ṙθ̇.',
      { out: 'θ̇ ≠ 0 gives an inward part; ṙ > 0 makes 2ṙθ̇ point ahead.', in: 'θ̇ ≠ 0 gives an inward part; ṙ < 0 makes 2ṙθ̇ point back.', fixed: 'ṙ = 0, so only −rθ̇² is left: straight toward the pivot.', still: 'θ̇ = 0 removes both terms: a straight line at a steady speed.' }[$.scene],
    ],
    second: ($) => ({ dir: dirNumeric($.scene) }),
    sim: {
      scenario: 'arm',
      setup(s, $) {
        Object.assign(s, { r0: 0.5, u: SCENES[$.scene].u, ad: 0, w: SCENES[$.scene].w, al: 0, t: 0, tEnd: 1 });
      },
      read: (c) => ({ dir: direction(c.ar, c.ath) }),
    },
    cases: [kase('Hibbeler §12.8', { scene: 'out' }, { dir: 'in-ahead' })],
  }),

  problem({
    id: 'u1.12.polar-sym',
    title: 'The transverse acceleration as a formula',
    exam: 'u1',
    ch: '12',
    lab: 'polar',
    src: 'Hibbeler §12.8',
    topics: ['polar'],
    // Structure: the arm turns steadily, or speeds up from rest; the answer is a formula either way.
    vars: {
      arm: choice(['steady', 'turns at a steady ω'], ['speeding', 'starts from rest and speeds up at a steady α']),
      c: range(0.1, 0.6, 0.1, 'm/s'),
      w: range(1, 4, 0.5, 'rad/s'),
      alpha: range(0.5, 3, 0.5, 'rad/s²'),
      t: range(0.5, 2, 0.5, 's'),
    },
    text: (T, $) => ($.arm === 'steady'
      ? String.raw`An arm turns at a steady $\omega$. A collar starts at the pivot and slides out along it at a steady speed $c$, so $r = ct$. Write the collar's transverse acceleration $a_\theta$ as a formula in $c$ and $\omega$.`
      : String.raw`An arm starts from rest and speeds up at a steady $\alpha$, so $\dot\theta = \alpha t$. A collar starts at the pivot and slides out at a steady speed $c$, so $r = ct$. Write the collar's transverse acceleration $a_\theta$ as a formula in $c$, $\alpha$ and $t$.`),
    parts: [
      // The key follows the structure: a steady arm gives 2cω, a speeding arm 3cαt.
      sym('ath', ($) => ($.arm === 'steady' ? '2*c*w' : '3*c*alpha*t'), { c: 'm/s', w: 'rad/s', alpha: 'rad/s^2', t: 's' },
        ($) => ($.arm === 'steady' ? 2 * $.c * $.w : 3 * $.c * $.alpha * $.t), { unit: 'm/s^2', label: 'a_θ' }),
    ],
    level: 2,
    hints: [
      'a_θ = rθ̈ + 2ṙθ̇. Write each of r, ṙ, θ̇ and θ̈ in the given symbols.',
      'With r = ct, ṙ = c. A steady arm has θ̈ = 0; a speeding arm has θ̈ = α and θ̇ = αt.',
    ],
    steps: ($) => ($.arm === 'steady'
      ? [String.raw`$r = ct$, $\dot r = c$, $\dot\theta = \omega$, $\ddot\theta = 0$.`, String.raw`$a_\theta = r\ddot\theta + 2\dot r\dot\theta = 0 + 2c\omega$.`]
      : [String.raw`$r = ct$, $\dot r = c$, $\dot\theta = \alpha t$, $\ddot\theta = \alpha$.`, String.raw`$a_\theta = (ct)\alpha + 2c(\alpha t) = 3c\alpha t$.`]),
    second: ($) => {
      const n = $.arm === 'steady'
        ? polarNumeric((s) => $.c * ($.t + s), (s) => $.w * ($.t + s), 0)
        : polarNumeric((s) => $.c * ($.t + s), (s) => 0.5 * $.alpha * ($.t + s) ** 2, 0);
      return { ath: n.ath };
    },
    sim: {
      scenario: 'arm',
      setup(s, $) {
        if ($.arm === 'steady') Object.assign(s, { r0: 0, u: $.c, ad: 0, w: $.w, al: 0, t: $.t, tEnd: Math.max(1.6, 1.25 * $.t) });
        else Object.assign(s, { r0: 0, u: $.c, ad: 0, w: 0, al: $.alpha, t: $.t, tEnd: Math.max(1.6, 1.25 * $.t) });
      },
      read: (c) => ({ ath: c.ath }),
    },
    cases: [kase('Hibbeler §12.8', { arm: 'steady', c: 0.5, w: 2, alpha: 1, t: 1 }, { ath: '2*c*w' })],
  }),
];

export default polar;
