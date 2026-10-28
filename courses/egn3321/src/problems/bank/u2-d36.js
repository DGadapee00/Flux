/**
 * Unit 2 additions (D36): pulley constraints (Hibbeler §12.9) with forces (§13.4), drag and terminal
 * speed (§13.4; 8.01SC 14.x), and the polar equations of motion (§13.6). Each opens its lab.
 */
import { quadraticFall, rk4Line } from '@flux/subjects/mechanics/drag.js';
import { polarComponents, polarNumeric } from '@flux/subjects/mechanics/polar.js';
import { tackle, tackleSpeed } from '@flux/subjects/mechanics/pulley.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

const RHO = 1.225;

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** The other body's motion from the rope's fixed length, −s_A + n s_B = L. */
const other = ($, q) => ($.given === 'A' ? q / $.n : q * $.n);

/** The same, by differentiating the constraint numerically: no ratio written down. */
function constraintNumeric($) {
  const s = (t) => $.v * t + 0.5 * $.a * t * t;
  const sOther = (t) => ($.given === 'A' ? s(t) / $.n : $.n * s(t));
  const h = 1e-3;
  return { v: (sOther(h) - sOther(-h)) / (2 * h), a: (sOther(h) - 2 * sOther(0) + sOther(-h)) / (h * h) };
}

const tk = ($) => tackle({ mA: $.mA, mB: $.mB, n: $.n, mus: $.mu, muk: $.mu });

/** Terminal speed and the time to reach 90% of it, from the drag area. */
function terminal($) {
  const CA = $.find === 'CA' ? (2 * $.m * G) / (RHO * $.vtGiven ** 2) : $.CA;
  const k = 0.5 * RHO * CA;
  const vt = Math.sqrt(($.m * G) / k);
  return { CA, k, vt, t90: (vt / G) * Math.atanh(0.9) };
}

/** Accelerations of a light and a heavy ball of one shape at a moment of the drop. */
const BALL = { k: 0.5 * RHO * 0.0015, light: 0.145, heavy: 1.16 };
function whoAccelerates(moment, numeric = false) {
  const accel = (m) => {
    if (moment === 'release') return G;
    if (moment === 'terminal') return 0;
    // Both moving at 10 m/s: a = g − k v²/m.
    if (!numeric) return G - (BALL.k * 100) / m;
    // From a time step of the equation of motion near 10 m/s, rather than the formula.
    const v0 = 10;
    const h = 1e-4;
    const r = rk4Line((v) => G - (BALL.k * v * v) / m, { v0, t1: h, steps: 4 });
    return (r.v - v0) / h;
  };
  const a1 = accel(BALL.light);
  const a2 = accel(BALL.heavy);
  if (Math.abs(a1) < 1e-9 && Math.abs(a2) < 1e-9) return 'zero';
  if (Math.abs(a1 - a2) < 1e-6 * G) return 'same-g';
  return a2 > a1 ? 'heavy' : 'light';
}

/** The polar forces on a collar: the cord's pull T inward, the arm's push N along θ. */
function collar($) {
  const rd = $.cord === 'in' ? -$.u : $.u;
  const thdd = $.arm === 'speeding' ? $.alpha : 0;
  const c = polarComponents({ r: $.r, rd, rdd: 0, thd: $.w, thdd });
  return { T: -$.m * c.ar, N: $.m * c.ath, rd, thdd, c };
}

const more = [
  problem({
    id: 'u2.13.constraint',
    title: 'Speeds tied by a rope',
    exam: 'u2',
    ch: '13',
    lab: 'pulleys',
    src: 'Hibbeler §12.9',
    topics: ['constraint', 'pulley'],
    // Structure: the block's motion is given and the load's asked, or the other way round.
    vars: {
      given: choice(['A', 'the block A on the table'], ['B', 'the load B']),
      n: range(2, 4, 1, ''),
      v: range(0.5, 3, 0.5, 'm/s'),
      a: range(0.5, 3, 0.5, 'm/s²'),
    },
    text: (T, $) => String.raw`One rope runs from block A on a table, over a pulley at the table's edge, and down to a load B that hangs from ${T.n} segments of the same rope. At one instant ${T.given} moves at ${T.v} m/s and speeds up at ${T.a} m/s². Find the speed and acceleration of ${$.given === 'A' ? 'the load B' : 'the block A'}.`,
    parts: [
      num('v', ($) => other($, $.v), 'm/s', { label: ($) => ($.given === 'A' ? 'speed of the load B' : 'speed of the block A') }),
      num('a', ($) => other($, $.a), 'm/s²', { label: ($) => ($.given === 'A' ? 'acceleration of the load B' : 'acceleration of the block A') }),
    ],
    level: 1,
    hints: [
      'The rope’s length does not change. Write it in terms of the block’s position and the load’s depth.',
      'Each of the n segments holding the load shortens when it rises: s_A and n s_B change together, so v_A = n v_B.',
    ],
    steps: ($, sig) => [
      String.raw`The rope's length is fixed: $-s_A + n\,s_B = L$, so $v_A = n\,v_B$ and $a_A = n\,a_B$, with $n = ${$.n}$.`,
      $.given === 'A'
        ? String.raw`$v_B = v_A/n = ${sig(other($, $.v))}$ m/s and $a_B = a_A/n = ${sig(other($, $.a))}$ m/s².`
        : String.raw`$v_A = n\,v_B = ${sig(other($, $.v))}$ m/s and $a_A = n\,a_B = ${sig(other($, $.a))}$ m/s².`,
    ],
    second: ($) => constraintNumeric($),
    cases: [
      kase('Hibbeler §12.9', { given: 'A', n: 2, v: 2, a: 1 }, { v: 1, a: 0.5 }),
      kase('Hibbeler §12.9', { given: 'B', n: 3, v: 0.5, a: 1 }, { v: 1.5, a: 3 }),
    ],
  }),

  problem({
    id: 'u2.13.tackle',
    title: 'A load on n segments',
    exam: 'u2',
    ch: '13',
    lab: 'pulleys',
    src: 'Hibbeler §13.4',
    topics: ['constraint', 'pulley', 'tension'],
    // Structure: two or three segments hold the load; the table is smooth or rough.
    vars: {
      n: choice([2, 'two'], [3, 'three']),
      surface: choice(['smooth', 'smooth'], ['rough', 'rough, with μ_s = μ_k = 0.25']),
      mA: range(2, 10, 1, 'kg'),
      mB: range(4, 20, 2, 'kg'),
    },
    derive: ($) => ({ mu: $.surface === 'rough' ? 0.25 : 0 }),
    valid: ($) => !tk({ ...$, mu: $.surface === 'rough' ? 0.25 : 0 }).holds,
    text: (T) => String.raw`A ${T.mA} kg block A sits on a table that is ${T.surface}. A light rope runs from it over a light pulley at the table's edge and down to a ${T.mB} kg load B, which hangs from ${T.n} segments of the same rope. The system is released from rest. Find the load's acceleration and the rope's tension.`,
    parts: [
      num('aB', ($) => tk($).aB, 'm/s²', { label: 'acceleration of the load B' }),
      num('T', ($) => tk($).T, 'N', { label: 'tension in the rope' }),
    ],
    level: 2,
    hints: [
      'One light rope over light pulleys carries one tension. Draw a free-body diagram of each body.',
      'The rope’s fixed length gives a_A = n a_B. The load feels n T upward.',
      'Write ΣF = ma for each body, put a_A = n a_B into the block’s equation, and eliminate T.',
    ],
    steps: ($, sig) => {
      const r = tk($);
      return [
        String.raw`Constraint: $a_A = ${$.n}\,a_B$. Friction on A: $f = \mu_k m_A g = ${sig(r.f)}$ N.`,
        String.raw`A: $T - f = m_A a_A$. B: $m_B g - ${$.n}T = m_B a_B$.`,
        String.raw`Eliminate $T$: $a_B = \dfrac{m_B g - n f}{m_B + n^2 m_A} = ${sig(r.aB)}$ m/s².`,
        String.raw`$T = m_A(${$.n}a_B) + f = ${sig(r.T)}$ N.`,
      ];
    },
    second: ($) => {
      // Work and energy over a 1 m drop of the load, then a = v²/2h.
      const r = tk($);
      const e = tackleSpeed({ mA: $.mA, mB: $.mB, n: $.n, f: r.f, h: 1 });
      const aB = (e.vB * e.vB) / 2;
      return { aB, T: $.mA * $.n * aB + r.f };
    },
    sim: {
      scenario: 'movable',
      setup(s, $) {
        Object.assign(s, { mA: $.mA, mB: $.mB, n: $.n, mus: $.mu, muk: $.mu, t: 0.3 });
      },
      read: (c) => ({ aB: c.aB, T: c.T }),
    },
    cases: [
      kase('Hibbeler §13.4', { n: 2, surface: 'smooth', mA: 4, mB: 6 }, { aB: (6 * G) / 22, T: (4 * 2 * 6 * G) / 22 }),
      kase('Hibbeler §13.4', { n: 2, surface: 'rough', mA: 4, mB: 6 }, { aB: (6 * G - 2 * 0.25 * 4 * G) / 22, T: 4 * 2 * ((6 * G - 2 * 0.25 * 4 * G) / 22) + 0.25 * 4 * G }),
    ],
  }),

  problem({
    id: 'u2.13.terminal',
    title: 'Terminal speed of a skydiver',
    exam: 'u2',
    ch: '13',
    lab: 'drag',
    src: 'Hibbeler §13.4',
    topics: ['drag'],
    // Structure: from the drag area find the terminal speed, or from a measured terminal speed find the drag area.
    vars: {
      find: choice(['vt', 'find'], ['CA', 'given']),
      m: range(60, 110, 5, 'kg'),
      CA: range(0.3, 0.8, 0.05, 'm²'),
      vtGiven: range(40, 70, 1, 'm/s'),
    },
    text: (T, $) => ($.find === 'CA'
      ? String.raw`A ${T.m} kg skydiver, kit included, falls belly down and settles at ${T.vtGiven} m/s. Drag is $\tfrac12\rho C A v^2$ with $\rho = 1.225$ kg/m³. Find the drag area $C\!\cdot\!A$, and the time from leaving the aircraft to reach 90% of terminal speed.`
      : String.raw`A ${T.m} kg skydiver, kit included, falls belly down with a drag area $C\!\cdot\!A = ${T.CA}$ m². Drag is $\tfrac12\rho C A v^2$ with $\rho = 1.225$ kg/m³. Find the terminal speed, and the time from leaving the aircraft to reach 90% of it.`),
    parts: [
      num('q', ($) => ($.find === 'CA' ? terminal($).CA : terminal($).vt), ($) => ($.find === 'CA' ? 'm²' : 'm/s'), { label: ($) => ($.find === 'CA' ? 'drag area C·A' : 'terminal speed') }),
      num('t90', ($) => terminal($).t90, 's', { label: 'time to 90% of terminal speed' }),
    ],
    level: 2,
    hints: [
      'At terminal speed the drag equals the weight, so the acceleration is zero.',
      'Set ½ρ(C·A)v_t² = mg. For the time, separate m dv/dt = mg − kv² and integrate: v = v_t tanh(gt/v_t).',
    ],
    steps: ($, sig) => {
      const r = terminal($);
      return [
        $.find === 'CA'
          ? String.raw`$\tfrac12\rho(C\!\cdot\!A)v_t^2 = mg$ gives $C\!\cdot\!A = 2mg/(\rho v_t^2) = ${sig(r.CA)}$ m².`
          : String.raw`$k = \tfrac12\rho C A = ${sig(r.k)}$ kg/m, and $kv_t^2 = mg$ gives $v_t = \sqrt{mg/k} = ${sig(r.vt)}$ m/s.`,
        String.raw`$v = v_t\tanh(gt/v_t)$ reaches $0.9v_t$ when $gt/v_t = \tanh^{-1}0.9 = 1.472$: $t = ${sig(r.t90)}$ s.`,
      ];
    },
    second: ($) => {
      // Integrate the fall step by step until 90% of a speed found by integrating far longer.
      const r = terminal($);
      const k = r.k;
      const acc = (v) => G - (k * v * v) / $.m;
      const far = rk4Line(acc, { t1: 30 * (r.vt / G), steps: 6000 }).v;
      let lo = 0;
      let hi = 10 * (r.vt / G);
      for (let i = 0; i < 50; i++) {
        const mid = 0.5 * (lo + hi);
        if (rk4Line(acc, { t1: mid, steps: 400 }).v < 0.9 * far) lo = mid;
        else hi = mid;
      }
      const vt = far;
      return { q: $.find === 'CA' ? (2 * $.m * G) / (RHO * vt * vt) : vt, t90: 0.5 * (lo + hi) };
    },
    sim: {
      scenario: 'skydiver',
      setup(s, $) {
        Object.assign(s, { m: $.m, CA: terminal($).CA, t: 5 });
      },
      read: (c, s, $) => ({ q: $.find === 'CA' ? c.CA : c.vt, t90: c.t90 }),
    },
    cases: [kase('Hibbeler §13.4', { find: 'vt', m: 80, CA: 0.5, vtGiven: 50 }, { q: Math.sqrt((80 * G) / (0.5 * RHO * 0.5)), t90: (Math.sqrt((80 * G) / (0.5 * RHO * 0.5)) / G) * Math.atanh(0.9) })],
  }),

  problem({
    id: 'u2.13.drag-ask',
    title: 'Which ball accelerates more?',
    exam: 'u2',
    ch: '13',
    kind: 'conceptual',
    lab: 'drag',
    src: 'Hibbeler §13.4',
    topics: ['drag'],
    vars: {
      moment: choice(
        ['release', 'at the instant they are let go'],
        ['partway', 'when each is falling at 10 m/s'],
        ['terminal', 'after a very long fall, each at its own steady speed'],
      ),
    },
    text: (T) => `Two balls of the same size and shape are dropped together from a tall tower. One is a baseball; the other is steel, eight times as heavy. Air drag acts on both. Compare their accelerations ${T.moment}.`,
    parts: [
      pick('who', 'the accelerations', [
        ['same-g', 'both accelerate at g', 'At release neither is moving, so neither feels drag: each has only its weight, and a = g. Once moving, drag k v² takes a share of the weight that is larger for the lighter ball.'],
        ['heavy', 'the steel ball accelerates more', 'At the same speed both feel the same drag, k v², but it is a smaller fraction of the steel ball’s weight: a = g − k v²/m is larger for larger m.'],
        ['light', 'the baseball accelerates more', 'The lighter ball loses more of its acceleration to drag, not less: a = g − k v²/m, and m is in the denominator.'],
        ['zero', 'neither accelerates', 'At terminal speed drag equals weight, so a = 0 for each, although the steel ball’s steady speed is √8 times the baseball’s.'],
      ], ($) => whoAccelerates($.moment)),
    ],
    level: 1,
    hints: [
      'Drag depends on speed and shape: F = k v². Weight depends on mass.',
      'Write a = g − k v²/m for each ball at the moment asked.',
    ],
    steps: ($) => [
      'Each ball obeys m a = m g − k v², so a = g − k v²/m. The shape, and so k, is the same.',
      { release: 'At release v = 0, so a = g for both.', partway: 'At the same speed the drag is equal, and it takes less from the heavier ball: the steel ball accelerates more.', terminal: 'At terminal speed k v² = m g, so a = 0 for both.' }[$.moment],
    ],
    second: ($) => ({ who: whoAccelerates($.moment, true) }),
    sim: {
      scenario: 'ball',
      setup(s, $) {
        s.t = { release: 0, partway: 1.1, terminal: 8 }[$.moment];
      },
    },
    cases: [kase('Hibbeler §13.4', { moment: 'partway' }, { who: 'heavy' })],
  }),

  problem({
    id: 'u2.13.polar-eom',
    title: 'Cord and arm on a turning collar',
    exam: 'u2',
    ch: '13',
    lab: 'polar',
    src: 'Hibbeler §13.6',
    topics: ['polar'],
    // Structure: the cord draws the collar in or lets it out; the arm turns steadily or speeds up.
    vars: {
      cord: choice(['in', 'draws the collar in'], ['out', 'lets the collar slide out']),
      arm: choice(['steady', 'at a steady rate'], ['speeding', 'and speeds up']),
      m: range(0.5, 2, 0.25, 'kg'),
      r: range(0.4, 1.2, 0.1, 'm'),
      u: range(0.5, 2, 0.25, 'm/s'),
      w: range(2, 6, 0.5, 'rad/s'),
      alpha: range(1, 4, 0.5, 'rad/s²'),
    },
    text: (T, $) => String.raw`A smooth arm turns in a horizontal plane at $\dot\theta = ${T.w}$ rad/s${$.arm === 'speeding' ? `, speeding up at $\\ddot\\theta = ${T.alpha}$ rad/s²` : ''}. A ${T.m} kg collar slides on it. A cord through the pivot ${T.cord} at a steady ${T.u} m/s. When the collar is ${T.r} m from the pivot, find the cord's tension and the arm's push on the collar, positive in the sense of $\theta$.`,
    parts: [
      num('T', ($) => collar($).T, 'N', { label: 'cord tension' }),
      num('N', ($) => collar($).N, 'N', { label: 'the arm’s push N (positive along θ)' }),
    ],
    level: 3,
    hints: [
      'The forces along the arm and across it give m a_r and m a_θ: the polar equations of motion.',
      'The cord is the only force along the arm, pulling in: −T = m(r̈ − rθ̇²). The arm is the only force across it: N = m(rθ̈ + 2ṙθ̇).',
      'A steady cord speed gives r̈ = 0. Drawing in makes ṙ negative.',
    ],
    steps: ($, sig) => {
      const k = collar($);
      return [
        String.raw`$\dot r = ${sig(k.rd)}$ m/s, $\ddot r = 0$, $\dot\theta = ${sig($.w)}$ rad/s, $\ddot\theta = ${sig(k.thdd)}$ rad/s².`,
        String.raw`Along the arm: $-T = m(\ddot r - r\dot\theta^2)$, so $T = ${sig(k.T)}$ N.`,
        String.raw`Across it: $N = m(r\ddot\theta + 2\dot r\dot\theta) = ${sig(k.N)}$ N.`,
      ];
    },
    second: ($) => {
      const k = collar($);
      const n = polarNumeric((s) => $.r + k.rd * s, (s) => $.w * s + 0.5 * k.thdd * s * s, 0);
      return { T: -$.m * n.ar, N: $.m * n.ath };
    },
    sim: {
      scenario: 'arm',
      setup(s, $) {
        const k = collar($);
        Object.assign(s, { r0: $.r, u: k.rd, ad: 0, w: $.w, al: k.thdd, t: 0, tEnd: 1 });
      },
      read: (c, s, $) => ({ T: -$.m * c.ar, N: $.m * c.ath }),
    },
    cases: [kase('Hibbeler §13.6', { cord: 'in', arm: 'steady', m: 1, r: 0.5, u: 1, w: 4, alpha: 2 }, { T: 8, N: -8 })],
  }),
];

export default more;
