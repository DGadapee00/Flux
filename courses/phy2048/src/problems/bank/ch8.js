/** Ch 8 · Potential energy and conservation of energy. OpenStax University Physics Vol. 1, §§8.1–8.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { gravitationalEnergy, kineticEnergy, speedFromEnergy, springEnergy, springWork } from '@flux/subjects/mechanics/energy.js';
import { forceFrom, simulate, turningPoints, wellAround } from '@flux/subjects/mechanics/potential.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u4', ch: '8' };
const DEG = Math.PI / 180;

/** Bisect f on [lo, hi], where f changes sign once. */
function bisect(f, lo, hi, n = 200) {
  let a = lo;
  let b = hi;
  const fa = f(a);
  for (let i = 0; i < n; i += 1) {
    const m = 0.5 * (a + b);
    if (Math.sign(f(m)) === Math.sign(fa)) a = m;
    else b = m;
  }
  return 0.5 * (a + b);
}

/** Positive root of ½kx² = mg(h + x). */
function compression($) {
  const mg = $.m * G;
  return (mg + Math.sqrt(mg * mg + 2 * $.k * mg * $.h)) / $.k;
}

const WELL = (x) => 2 * (x ** 4 - x * x);

export default [
  problem({
    ...U,
    id: 'ch8.hiker',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §8.1',
    title: 'Where is U zero?',
    topics: ['potential'],
    vars: {
      at: choice(['base', 'at the base'], ['summit', 'at the summit'], ['sea', 'at sea level, afterward']),
      zero: choice(['base', 'the base'], ['sea', 'sea level']),
      m: range(50, 100, 1, 'kg'),
      H: range(50, 300, 1, 'm'),
      E: range(20, 200, 1, 'm'),
    },
    derive: ($) => {
      // Heights measured up from the base; sea level is E below it.
      const y = { base: 0, summit: $.H, sea: -$.E };
      return { y, U: gravitationalEnergy($.m, G, y[$.at] - y[$.zero]) / 1000 };
    },
    // Heights measured up from sea level instead: the zero's own U cancels the choice of origin.
    second: ($) => {
      const y = { base: $.E, summit: $.E + $.H, sea: 0 };
      return { U: ($.m * G * y[$.at] - $.m * G * y[$.zero]) / 1000 };
    },
    valid: ($) => $.at !== $.zero,
    text: (T) => `The summit of a hill is ${T.H} m above its base, and the base is ${T.E} m above sea level. A ${T.m} kg hiker climbs to the summit and later walks down to the sea. Take g = ${G} m/s² and put the zero of gravitational potential energy at ${T.zero}. What is the potential energy of the hiker–Earth system with the hiker ${T.at}, in kJ?`,
    parts: [
      num('U', ($) => $.U, 'kJ', { label: 'potential energy' }),
    ],
    hints: [
      String.raw`$U = mgy$, with $y$ measured up from wherever $U = 0$. Below that level, $y$ is negative and so is $U$.`,
      'Find the height of the hiker above the zero level first. Only that difference matters.',
    ],
    steps: ($) => [
      String.raw`Height above the zero level: $${texNum($.y[$.at] - $.y[$.zero])}$ m`,
      String.raw`$U = mgy = ${texNum($.U)}\ \mathrm{kJ}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.1, "Gravitational Potential Energy of a Hiker": 75 kg, summit 147 m above the base, base 48 m above the sea, zero at the base', { at: 'summit', zero: 'base', m: 75, H: 147, E: 48 }, { U: 108.155 }, {
        note: 'The book uses g = 9.8 m/s² and prints 108 kJ; at sea level, −35.3 kJ.',
      }),
      kase('OpenStax University Physics Vol. 1 §8.1, Check Your Understanding: the same hiker at the base, zero at sea level', { at: 'base', zero: 'sea', m: 75, H: 147, E: 48 }, { U: 35.316 }, {
        note: 'The book prints 35.3 kJ.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.spring',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Launched by a spring',
    topics: ['spring', 'conservation'],
    vars: {
      rep: choice(['k', 'its spring constant'], ['hold', 'the force that holds it']),
      m: range(0.02, 2, 0.01, 'kg'),
      k: range(20, 600, 10, 'N/m'),
      x: range(0.05, 0.5, 0.01, 'm'),
    },
    derive: ($) => {
      const Us = springEnergy($.k, $.x);
      return { hold: $.k * $.x, Us, v: speedFromEnergy({ mass: $.m, u0: Us }) };
    },
    // The work the spring does as it relaxes: the area under F = kx, a triangle ½(kx)(x). Then K = W.
    second: ($) => {
      const W = 0.5 * ($.k * $.x) * $.x;
      return { Us: W, v: Math.sqrt((2 * W) / $.m) };
    },
    sampleValid: ($) => $.v < 60,
    text: (T, $, sig) => ($.rep === 'k'
      ? `A spring of constant ${T.k} N/m is compressed ${T.x} m against a ${T.m} kg block on a frictionless table, then released. Find the energy stored in the spring and the block's speed when it leaves the spring.`
      : `An archer pulls a bow back ${T.x} m and holds it there with a force of ${sig($.hold)} N. Treat the bow as an ideal spring. The arrow has a mass of ${T.m} kg. Find the energy stored in the bow and the arrow's speed when it leaves the string.`),
    parts: [
      num('Us', ($) => $.Us, 'J', { label: 'stored energy' }),
      num('v', ($) => $.v, 'm/s', { label: 'launch speed' }),
    ],
    hints: [
      String.raw`An ideal spring stores $U = \tfrac12kx^2$. If you know the holding force instead, $k = F/x$, so $U = \tfrac12Fx$.`,
      String.raw`With no friction all of it becomes kinetic energy: $\tfrac12mv^2 = U$.`,
    ],
    steps: ($) => [
      String.raw`$U = \tfrac12kx^2 = ${texNum($.Us)}\ \mathrm{J}$, with $k = ${texNum($.k)}\ \mathrm{N/m}$`,
      String.raw`$v = \sqrt{2U/m} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.3, Check Your Understanding: a bow pulled back 50 cm, held with 150 N, a 50 g arrow', { rep: 'hold', m: 0.05, k: 300, x: 0.5 }, { Us: 37.5, v: 38.730 }, {
        note: 'The book prints 39 m/s.',
      }),
      kase('hand', { rep: 'k', m: 0.5, k: 200, x: 0.1 }, { Us: 1, v: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.hanging',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §8.1',
    title: 'A block let go on a hanging spring',
    topics: ['spring', 'potential'],
    vars: {
      q: choice(['max', 'how far the spring stretches at the lowest point'], ['speed', 'the speed halfway down']),
      w: range(0.5, 20, 0.1, 'N'),
      k: range(2, 200, 1, 'N/m'),
    },
    derive: ($) => {
      // From the relaxed length, at rest: mg y = ½ky² at the bottom, and K = w y − ½ky² halfway.
      const yC = (2 * $.w) / $.k;
      const yB = yC / 2;
      const K = $.w * yB - springEnergy($.k, yB);
      const m = $.w / G;
      return { yC, yB, K, m, ans: $.q === 'max' ? yC : Math.sqrt((2 * K) / m) };
    },
    // Newton's second law in time: let it go and step m a = mg − ky until it turns round, or passes halfway.
    second: ($) => {
      const m = $.w / G;
      const U = (y) => -$.w * y + springEnergy($.k, y);
      if ($.q === 'max') return { ans: simulate(U, m, 0, { dt: 1e-5, tMax: 50 }).hi };
      return { ans: Math.sqrt((2 * -U($.w / $.k)) / m) };
    },
    sampleValid: ($) => $.yC > 0.05 && $.yC < 1.5,
    text: (T) => `A block weighing ${T.w} N hangs from the end of a relaxed vertical spring of constant ${T.k} N/m. It is let go from rest. Take g = ${G} m/s². Find ${T.q}.`,
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'max' ? 'm' : 'm/s'), { label: 'the answer' }),
    ],
    hints: [
      String.raw`Two potential energies change: gravity's, $-wy$ as it drops $y$, and the spring's, $\tfrac12ky^2$. It starts at rest, so $K = wy - \tfrac12ky^2$.`,
      'At the lowest point it stops again: K = 0. Halfway down, y is half of that, and K is largest there.',
    ],
    steps: ($) => [
      String.raw`Lowest point: $wy_C = \tfrac12ky_C^2$, so $y_C = 2w/k = ${texNum($.yC)}\ \mathrm{m}$`,
      $.q === 'max'
        ? String.raw`It stretches $${texNum($.yC)}$ m, twice the stretch at which it would hang at rest.`
        : String.raw`Halfway, $K = wy_B - \tfrac12ky_B^2 = ${texNum($.K)}\ \mathrm{J}$; $v = \sqrt{2K/m} = ${texNum($.ans)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.1, "Potential Energy of a Vertical Mass-Spring System": a 1.2 N block on a 6.0 N/m spring', { q: 'max', w: 1.2, k: 6 }, { ans: 0.4 }, {
        note: 'The book prints 0.40 m.',
      }),
      kase('OpenStax University Physics Vol. 1 §8.1, "Potential Energy of a Vertical Mass-Spring System": the speed at point B, halfway', { q: 'speed', w: 1.2, k: 6 }, { ans: 1.4007 }, {
        note: 'The book prints 1.4 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.fromforce',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §8.1',
    title: 'Potential energy from a force',
    topics: ['potential'],
    vars: {
      q: choice(['dU', 'the change in potential energy from x_A to x_B'], ['U', 'the potential energy at x_1, given U(0)']),
      a: range(1, 6, 0.5, 'N/m²'),
      xA: range(0, 2, 0.5, 'm'),
      xB: range(1, 4, 0.5, 'm'),
      x1: range(0.5, 3, 0.5, 'm'),
      U0: range(0, 2, 0.1, 'J'),
    },
    derive: ($) => {
      // ΔU = −W = −∫F dx = ∫ a x² dx = a(x_B³ − x_A³)/3.
      const dU = ($.a * ($.xB ** 3 - $.xA ** 3)) / 3;
      const U1 = ($.a * $.x1 ** 3) / 3 + $.U0;
      return { dU, U1, ans: $.q === 'dU' ? dU : U1 };
    },
    // The work of the force by Simpson's rule, with its sign flipped.
    second: ($) => {
      const W = (lo, hi) => {
        const n = 200;
        const h = (hi - lo) / n;
        let s = 0;
        for (let i = 0; i <= n; i += 1) s += (i === 0 || i === n ? 1 : (i % 2 ? 4 : 2)) * -$.a * (lo + i * h) ** 2;
        return (s * h) / 3;
      };
      return { ans: $.q === 'dU' ? -W($.xA, $.xB) : $.U0 - W(0, $.x1) };
    },
    valid: ($) => $.xB > $.xA,
    text: (T, $) => ($.q === 'dU'
      ? `A particle moves along the x-axis under a force F = −ax², with a = ${T.a} N/m². Find the change in its potential energy as it moves from x = ${T.xA} m to x = ${T.xB} m.`
      : `A particle moves along the x-axis under a force F = −ax², with a = ${T.a} N/m². Its potential energy is ${T.U0} J at x = 0. Find its potential energy at x = ${T.x1} m.`),
    parts: [
      num('ans', ($) => $.ans, 'J', { label: 'potential energy' }),
    ],
    hints: [
      String.raw`The change in potential energy is minus the work the force does: $\Delta U = -\int_{x_A}^{x_B} F\,dx$.`,
      String.raw`Here $-F = ax^2$, which integrates to $ax^3/3$. For $U(x)$ itself, add the constant that makes $U(0)$ right.`,
    ],
    steps: ($) => [
      $.q === 'dU'
        ? String.raw`$\Delta U = \tfrac13a(x_B^3 - x_A^3) = ${texNum($.dU)}\ \mathrm{J}$`
        : String.raw`$U(x) = \tfrac13ax^3 + U(0)$, so $U(${texNum($.x1)}) = ${texNum($.U1)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.1, "Basic Properties of Potential Energy": F = −ax², a = 3 N/m², from 1 m to 2 m', { q: 'dU', a: 3, xA: 1, xB: 2, x1: 1, U0: 0.5 }, { ans: 7 }),
      kase('OpenStax University Physics Vol. 1 §8.1, "Basic Properties of Potential Energy": U(0) = 0.5 J, at x = 1 m', { q: 'U', a: 3, xA: 1, xB: 2, x1: 1, U0: 0.5 }, { ans: 1.5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.pendulum',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'A pendulum released from rest',
    topics: ['conservation'],
    vars: {
      q: choice(['v', 'its speed at the lowest point'], ['h', 'its height above the lowest point when its speed is v₁']),
      L: range(0.4, 3, 0.1, 'm'),
      theta: range(15, 75, 5, '°'),
      v1: range(0.2, 4, 0.01, 'm/s'),
    },
    derive: ($) => {
      const h0 = $.L * (1 - Math.cos($.theta * DEG));
      const vb = speedFromEnergy({ mass: 1, u0: gravitationalEnergy(1, G, h0) });
      return { h0, vb, ans: $.q === 'v' ? vb : h0 - ($.v1 * $.v1) / (2 * G) };
    },
    // The drop from the half-angle: L(1 − cos θ) = 2L sin²(θ/2).
    second: ($) => {
      const h0 = 2 * $.L * Math.sin(($.theta * DEG) / 2) ** 2;
      return { ans: $.q === 'v' ? Math.sqrt(2 * G * h0) : h0 - kineticEnergy(1, $.v1) / G };
    },
    valid: ($) => $.q === 'v' || $.v1 < 0.9 * $.vb,
    text: (T, $) => `A small bob hangs from a light string ${T.L} m long. It is pulled aside until the string makes ${T.theta}° with the vertical and released from rest. Take g = ${G} m/s² and ignore air resistance. Find ${$.q === 'v' ? 'its speed at the lowest point' : `its height above the lowest point when its speed is ${T.v1} m/s`}.`,
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'v' ? 'm/s' : 'm'), { label: 'the answer' }),
    ],
    hints: [
      String.raw`The tension is across the motion and does no work, so $K + U$ stays the same. The bob starts a height $L(1 - \cos\theta)$ above the lowest point.`,
      String.raw`Speed at the bottom: $\tfrac12mv^2 = mgh$. Height at speed $v_1$: $mgh_0 = \tfrac12mv_1^2 + mgh$.`,
    ],
    steps: ($) => [
      String.raw`$h_0 = L(1 - \cos\theta) = ${texNum($.h0)}\ \mathrm{m}$`,
      $.q === 'v'
        ? String.raw`$v = \sqrt{2gh_0} = ${texNum($.ans)}\ \mathrm{m/s}$`
        : String.raw`$h = h_0 - v_1^2/2g = ${texNum($.ans)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.3, "Simple Pendulum": a 1.0 m string released at 30°', { q: 'v', L: 1, theta: 30, v1: 1 }, { ans: 1.6213 }, {
        note: 'The book uses g = 9.8 m/s² and prints 1.62 m/s.',
      }),
      kase('OpenStax University Physics Vol. 1 §8.3, Check Your Understanding: the same pendulum, at 0.81 m/s', { q: 'h', L: 1, theta: 30, v1: 0.81 }, { ans: 0.10053 }, {
        note: 'The book prints 0.10 m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.panel',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Energy taken by air resistance',
    topics: ['energy', 'conservation'],
    vars: {
      q: choice(['loss', 'the mechanical energy air resistance took, in kJ'], ['frac', 'the fraction of its starting energy that air resistance took']),
      m: range(2, 50, 1, 'kg'),
      h: range(100, 2000, 50, 'm'),
      v: range(20, 80, 1, 'm/s'),
    },
    derive: ($) => {
      const U0 = gravitationalEnergy($.m, G, $.h);
      const K = kineticEnergy($.m, $.v);
      return { U0, K, ans: $.q === 'loss' ? (U0 - K) / 1000 : (U0 - K) / U0 };
    },
    // Per kilogram: the drop gives gh; what is left over at the ground is v²/2.
    second: ($) => {
      const lost = G * $.h - 0.5 * $.v * $.v;
      return { ans: $.q === 'loss' ? ($.m * lost) / 1000 : lost / (G * $.h) };
    },
    valid: ($) => $.v < 0.8 * Math.sqrt(2 * G * $.h),
    text: (T) => `A helicopter hovers ${T.h} m up when a ${T.m} kg panel breaks off its underside. The panel falls from rest and hits the ground at ${T.v} m/s. Take g = ${G} m/s². Find ${T.q}.`,
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'loss' ? 'kJ' : ''), { label: 'the answer' }),
    ],
    hints: [
      String.raw`With a non-conservative force, $K_i + U_i + W_{nc} = K_f + U_f$. The energy dissipated is $|W_{nc}|$.`,
      String.raw`At the top: $U = mgh$, $K = 0$. At the ground: $U = 0$, $K = \tfrac12mv^2$. The difference is what the air took.`,
    ],
    steps: ($) => [
      String.raw`$mgh = ${texNum($.U0)}\ \mathrm{J}$, $\tfrac12mv^2 = ${texNum($.K)}\ \mathrm{J}$`,
      $.q === 'loss'
        ? String.raw`Dissipated: $${texNum($.U0 - $.K)}\ \mathrm{J} = ${texNum($.ans)}\ \mathrm{kJ}$`
        : String.raw`Fraction: $(mgh - \tfrac12mv^2)/mgh = ${texNum($.ans)}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.3, "Air Resistance on a Falling Object": 15 kg from 1 km, landing at 45 m/s', { q: 'loss', m: 15, h: 1000, v: 45 }, { ans: 131.96 }, {
        note: 'The book uses g = 9.8 m/s² and prints 130 kJ.',
      }),
      kase('hand', { q: 'frac', m: 10, h: 500, v: 50 }, { ans: 0.74516 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.loop',
    level: 3,
    variety: ['unknown'],
    lab: 'track',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Around a loop',
    topics: ['conservation', 'centripetal-force'],
    vars: {
      q: choice(['min', 'the least release height that gets it round'], ['top', 'its speed at the top of the loop'], ['N', 'the force of the track on it at the top']),
      m: range(200, 800, 10, 'kg'),
      R: range(1, 2.5, 0.1, 'm'),
      h: range(4, 7.5, 0.1, 'm'),
    },
    derive: ($) => {
      const v2 = 2 * G * ($.h - 2 * $.R);
      const v = Math.sqrt(Math.max(0, v2));
      const N = ($.m * v2) / $.R - $.m * G;
      return { v2, v, N, ans: { min: 2.5 * $.R, top: v, N }[$.q] };
    },
    // The least height by bisection on the condition N ≥ 0 at the top, and the top from v² = v₀² − 2g(2R).
    second: ($) => {
      if ($.q === 'min') return { ans: bisect((h) => (2 * G * (h - 2 * $.R)) / $.R - G, 2 * $.R, 10 * $.R) };
      const vBottom2 = 2 * G * $.h;
      const v2 = vBottom2 - 2 * G * 2 * $.R;
      return { ans: $.q === 'top' ? Math.sqrt(v2) : $.m * (v2 / $.R - G) };
    },
    valid: ($) => $.q === 'min' || $.h > 2.55 * $.R,
    // Drawn versions keep a clear margin over the least height.
    sampleValid: ($) => $.q === 'min' || $.h > 2.5 * $.R + 0.2,
    text: (T, $) => ($.q === 'min'
      ? `A ${T.m} kg roller-coaster car starts from rest on a frictionless track and runs down into a vertical loop of radius ${T.R} m. Take g = ${G} m/s². How high above the bottom of the loop must it start to stay on the track at the top?`
      : `A ${T.m} kg roller-coaster car starts from rest ${T.h} m above the bottom of a vertical loop of radius ${T.R} m and runs down a frictionless track into it. Take g = ${G} m/s². Find ${T.q}.`),
    parts: [
      num('ans', ($) => $.ans, ($) => ({ min: 'm', top: 'm/s', N: 'N' }[$.q]), { label: 'the answer' }),
    ],
    hints: [
      String.raw`Energy from the start to the top of the loop, $2R$ above the bottom: $mgh = \tfrac12mv^2 + mg(2R)$.`,
      String.raw`At the top the track and gravity both push down, toward the centre: $N + mg = mv^2/R$. It stays on while $N \ge 0$, so it needs $v^2 \ge gR$.`,
    ],
    steps: ($) => [
      $.q === 'min'
        ? String.raw`$v^2 = gR$ at the top and $mgh = \tfrac12mgR + 2mgR$, so $h = 2.5R = ${texNum($.ans)}\ \mathrm{m}$`
        : String.raw`$v^2 = 2g(h - 2R) = ${texNum($.v2)}\ \mathrm{m^2/s^2}$, so $v = ${texNum($.v)}\ \mathrm{m/s}$`,
      ...($.q === 'N' ? [String.raw`$N = mv^2/R - mg = ${texNum($.N)}\ \mathrm{N}$`] : []),
    ],
    sim: {
      scenario: 'loop',
      setup: (s, $) => {
        Object.assign(s, { m: $.m, R: $.R, h: $.q === 'min' ? 2.5 * $.R : $.h, f: 0, v0: 0, zero: 0, at: 2.5, asked: $.q });
      },
      read: (c, s) => (s.asked === 'top' ? { ans: c.v } : (s.asked === 'N' ? { ans: c.Ntop } : {})),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.3, "Loop-the-Loop": the car must start higher than 5R/2; here R = 2.0 m', { q: 'min', m: 400, R: 2, h: 6 }, { ans: 5 }),
      kase('OpenStax University Physics Vol. 1 §7.3, Check Your Understanding: a 15 cm loop, the car released 45 cm above the bottom', { q: 'top', m: 400, R: 0.15, h: 0.45 }, { ans: 1.7155 }, {
        note: 'The book prints 3 m/s. That is √(2gh), the speed at the bottom of the loop, not the top. At the top the car has climbed 30 cm of the 45: v = √(2g × 0.15 m) = 1.72 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.springboard',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'A spring and gravity together',
    topics: ['spring', 'conservation'],
    vars: {
      way: choice(['drop', 'drop'], ['gun', 'gun']),
      m: range(0.2, 4, 0.2, 'kg'),
      h: range(0.2, 2, 0.1, 'm'),
      k: range(40, 400, 10, 'N/m'),
    },
    derive: ($) => {
      const x = compression($);
      return { x, U: springEnergy($.k, x), mg: $.m * G };
    },
    // The same root by bisection, so the check is not a second copy of the quadratic.
    second: ($) => {
      const x = bisect((s) => springEnergy($.k, s) - gravitationalEnergy($.m, G, $.h + s), 1e-9, 1e3);
      return { x, U: $.m * G * ($.h + x) };
    },
    text: (T, $) => ($.way === 'drop'
      ? `A ${T.m} kg block is released from rest ${T.h} m above the top of a relaxed vertical spring of constant ${T.k} N/m. Take g = ${G} m/s² and ignore friction. Find how far the spring is compressed at the lowest point, and the energy stored in it there.`
      : `A spring gun stands upright. Its spring, of constant ${T.k} N/m, is compressed and released, and fires a ${T.m} kg ball straight up to ${T.h} m above the end of the relaxed spring. Take g = ${G} m/s² and ignore friction. How far was the spring compressed, and how much energy did it store?`),
    parts: [
      num('x', ($) => $.x, 'm', { label: 'compression', abs: 0.002 }),
      num('U', ($) => $.U, 'J', { label: 'energy stored' }),
    ],
    hints: [
      String.raw`Put the gravitational zero at the lowest point. Between the highest and lowest points the body is at rest, so $mg(h + x) = \tfrac12kx^2$.`,
      String.raw`The drop is $h + x$, not $h$: the spring is compressed while the body is still going down. Solve the quadratic and keep the positive root.`,
    ],
    steps: ($) => [
      String.raw`$\tfrac12kx^2 - mgx - mgh = 0$, so $x = \dfrac{mg + \sqrt{(mg)^2 + 2kmgh}}{k} = ${texNum($.x)}\ \mathrm{m}$`,
      String.raw`$U_s = \tfrac12kx^2 = ${texNum($.U)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.3, Check Your Understanding: a spring gun with k = 12 N/m fires a 15 g ball 0.50 m above the end of the relaxed spring', { way: 'gun', m: 0.015, h: 0.5, k: 12 }, { x: 0.12368, U: 0.091779 }, {
        note: 'The book prints 0.12 m.',
      }),
      kase('hand', { way: 'drop', m: 1, h: 0.5, k: 200 }, { x: 0.275889, U: 7.61147 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.rough',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'A spring shot across a rough floor',
    topics: ['spring', 'friction', 'energy'],
    vars: {
      q: choice(['mu', 'the coefficient of kinetic friction'], ['d', 'how far it slides']),
      m: range(0.5, 5, 0.1, 'kg'),
      k: range(500, 6000, 100, 'N/m'),
      x: range(2, 12, 0.5, 'cm', 0.01),
      d: range(0.5, 5, 0.1, 'm'),
      mu: range(0.1, 0.6, 0.01, ''),
    },
    derive: ($) => {
      const Us = springEnergy($.k, $.x);
      return { Us, ans: $.q === 'mu' ? Us / ($.m * G * $.d) : Us / ($.mu * $.m * G) };
    },
    // Newton's second law: it leaves the spring at v = x√(k/m), then slows at μg, so d = v²/2μg.
    second: ($) => {
      const v2 = ($.x * $.x * $.k) / $.m;
      return { ans: $.q === 'mu' ? v2 / (2 * G * $.d) : v2 / (2 * $.mu * G) };
    },
    sampleValid: ($) => ($.q === 'mu' ? $.ans > 0.05 && $.ans < 0.9 : $.ans > 0.2 && $.ans < 10),
    text: (T, $) => ($.q === 'mu'
      ? `A ${T.m} kg block is pushed against a light spring of constant ${T.k} N/m, compressing it ${T.x} cm. Released, it slides ${T.d} m from where it was let go across a level floor before friction stops it. Take g = ${G} m/s². What is the coefficient of kinetic friction?`
      : `A ${T.m} kg block is pushed against a light spring of constant ${T.k} N/m, compressing it ${T.x} cm. Released, it slides across a level floor with μk = ${T.mu}. Take g = ${G} m/s². How far does it slide from where it was let go?`),
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'mu' ? '' : 'm'), { label: 'the answer' }),
    ],
    hints: [
      String.raw`From release to rest, the spring's energy $\tfrac12kx^2$ all ends up as thermal energy, $\mu_k mg\,d$.`,
      'The distance counts from where it was let go: friction acts while the spring is still pushing, too.',
    ],
    steps: ($) => [
      String.raw`$\tfrac12kx^2 = ${texNum($.Us)}\ \mathrm{J} = \mu_k mg\,d$`,
      $.q === 'mu' ? String.raw`$\mu_k = ${texNum($.ans)}$` : String.raw`$d = ${texNum($.ans)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.3, Check Your Understanding: 3.0 kg, k = 4.5 × 10³ N/m, compressed 8.0 cm, slides 2.0 m', { q: 'mu', m: 3, k: 4500, x: 8, d: 2, mu: 0.25 }, { ans: 0.24465 }, {
        note: 'The book prints 0.25.',
      }),
      kase('hand', { q: 'd', m: 2, k: 1000, x: 10, d: 2, mu: 0.25 }, { ans: 1.0194 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.turning',
    level: 2,
    variety: ['configuration'],
    lab: 'energy-diagram',
    src: 'OpenStax University Physics Vol. 1 §8.4',
    title: 'Turning points and the force there',
    topics: ['energy-diagram'],
    vars: {
      curve: choice(['well', 'U = 2(x⁴ − x²)'], ['quartic', 'U = ¼cx⁴']),
      E: range(-0.45, -0.05, 0.01, 'J'),
      Eq: range(0.5, 4, 0.1, 'J'),
      c: range(2, 10, 1, 'N/m³'),
      m: range(0.5, 4, 0.5, 'kg'),
    },
    derive: ($) => {
      if ($.curve === 'well') {
        // Outer turning point: 2(x⁴ − x²) = E gives x² = (1 + √(1 + 2E))/2.
        const x = Math.sqrt((1 + Math.sqrt(1 + 2 * $.E)) / 2);
        const inner = Math.sqrt((1 - Math.sqrt(1 + 2 * $.E)) / 2);
        // Fastest at the bottom of the well, x = 1/√2, where U = −0.5 J.
        return { x, inner, F: -2 * (4 * x ** 3 - 2 * x), Eused: $.E, Kmax: $.E + 0.5, v: Math.sqrt((2 * ($.E + 0.5)) / $.m) };
      }
      const x = ((4 * $.Eq) / $.c) ** 0.25;
      return { x, inner: null, F: -$.c * x ** 3, Eused: $.Eq, Kmax: $.Eq, v: Math.sqrt((2 * $.Eq) / $.m) };
    },
    // Numerically: the largest root of U = E by scanning, and the force as minus the slope there.
    second: ($) => {
      const Ux = $.curve === 'well' ? WELL : (x) => 0.25 * $.c * x ** 4;
      const tps = turningPoints(Ux, $.curve === 'well' ? $.E : $.Eq, -4, 4);
      const x = Math.max(...tps);
      // The fastest point by stepping F = ma from rest at the turning point.
      const run = simulate(Ux, $.m, x, { dt: 2e-5, tMax: 100 });
      return { x, F: forceFrom(Ux, x, 1e-6), v: run.vMax };
    },
    text: (T, $) => ($.curve === 'well'
      ? `A particle moves along the x-axis with potential energy U(x) = 2(x⁴ − x²), U in joules and x in metres. No non-conservative force acts, and its energy is E = ${T.E} J. It is in the well on the positive side, and its mass is ${T.m} kg. Find its outer turning point, the force on it there, and its greatest speed.`
      : `A particle moves along the x-axis with potential energy U(x) = ¼cx⁴, where c = ${T.c} N/m³. No non-conservative force acts, its mass is ${T.m} kg, and its energy is ${T.Eq} J. Find the turning point on the positive side, the force on it there, and its greatest speed.`),
    parts: [
      num('x', ($) => $.x, 'm', { label: 'turning point' }),
      num('F', ($) => $.F, 'N', { label: 'force there, + toward +x' }),
      num('v', ($) => $.v, 'm/s', { label: 'greatest speed' }),
    ],
    hints: [
      String.raw`At a turning point the kinetic energy is zero, so $U(x) = E$. Solve that for $x$.`,
      String.raw`The force is $F = -dU/dx$. Past a well's lowest point $U$ rises, so the force points back toward smaller $x$: negative.`,
      String.raw`The body is fastest where $U$ is least, since $K = E - U$ is largest there.`,
    ],
    steps: ($) => [
      $.curve === 'well'
        ? String.raw`$2(x^4 - x^2) = E$ gives $x^2 = \tfrac12(1 \pm \sqrt{1 + 2E})$; outer: $x = ${texNum($.x)}\ \mathrm{m}$`
        : String.raw`$\tfrac14cx^4 = E$ gives $x = (4E/c)^{1/4} = ${texNum($.x)}\ \mathrm{m}$`,
      $.curve === 'well'
        ? String.raw`$F = -(8x^3 - 4x) = ${texNum($.F)}\ \mathrm{N}$`
        : String.raw`$F = -cx^3 = ${texNum($.F)}\ \mathrm{N}$`,
      String.raw`Fastest where $U$ is least: $K = ${texNum($.Kmax)}\ \mathrm{J}$, so $v = \sqrt{2K/m} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'well',
      setup: (s, $) => {
        if ($.curve === 'well') Object.assign(s, { curve: 'well', E: $.E, x0: Math.SQRT1_2, k: 2, m: $.m });
        else Object.assign(s, { curve: 'quartic', E: $.Eq, x0: 0, k: $.c, m: $.m });
      },
      read: (c) => ({ x: c.b, F: c.Fb, v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.4, "Quartic and Quadratic Potential Energy Diagram": U = 2(x⁴ − x²), E = −0.25 J', { curve: 'well', E: -0.25, Eq: 2, c: 8, m: 1 }, { x: 0.92388, F: -2.6131, v: 0.70711 }, {
        note: 'The book prints the allowed region 0.38 m to 0.92 m.',
      }),
      kase('OpenStax University Physics Vol. 1 §8.2, "Force due to a Quartic Potential Energy": U = ¼cx⁴, c = 8 N/m³, E = 2 J', { curve: 'quartic', E: -0.25, Eq: 2, c: 8, m: 1 }, { x: 1, F: -8, v: 2 }, {
        note: 'The book prints ±1 m and 8 N toward the origin.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.concept-conservative',
    src: 'OpenStax University Physics Vol. 1 §8.2',
    title: 'Round trips',
    kind: 'conceptual',
    level: 1,
    lab: 'work-path',
    topics: ['conservative', 'work'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'You lift a book down from a shelf, carry it across the room, and later put it back. What total work does gravity do on it?'],
        [2, 'You push a couch across the floor and later push it straight back to where it was. What total work does friction do on it?'],
        [3, 'A spring is stretched 5 cm, then 10 cm, then let back to 5 cm. Compared with stretching it straight from 0 to 5 cm, the spring’s total work is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'zero', 2: 'neg', 3: 'same' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: Math.abs(-20 * (-1) + -20 * 0 + -20 * 1) < 1e-12 ? 'zero' : 'x' };
      if ($.q === 2) return { ans: -0.6 * 1000 * (3 + 1 + Math.sqrt(10)) < 0 ? 'neg' : 'x' };
      return { ans: Math.abs(springWork(100, 0, 0.05) + springWork(100, 0.05, 0.1) + springWork(100, 0.1, 0.05) - springWork(100, 0, 0.05)) < 1e-12 ? 'same' : 'x' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['zero', 'Zero', 'Right: gravity’s work is −mgΔy. The book ends where it began, so Δy = 0.'],
          ['neg', 'Negative', 'Gravity did negative work on the way up, but the same amount of positive work on the way down.'],
          ['pos', 'Positive, for the distance carried', 'Carrying it across is at right angles to gravity: no work. Distance does not enter.'],
        ],
        2: [
          ['zero', 'Zero: it ends where it started', 'That holds for a conservative force. Friction opposes the motion on both legs, so its work adds up.'],
          ['neg', 'Negative, and bigger for the longer path', 'Right: W = −μN times the whole path length, out and back.'],
          ['pos', 'Positive on the way back', 'Friction reverses with the motion. It is against the motion on both legs.'],
        ],
        3: [
          ['same', 'The same', 'Right: the spring force is conservative. Its work depends only on the start and end stretch, 0 and 5 cm.'],
          ['more', 'More, for the longer trip', 'The extra stretch and the return cancel: the spring takes energy going out and gives it back coming in.'],
          ['less', 'Less', 'Only the end points count for a spring.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'A conservative force does zero work round any closed path. Its work from A to B depends only on A and B.',
      'Friction is not conservative: it acts against the motion on every leg, so its work grows with the length of the path.',
    ],
    steps: ($) => [{ 1: 'Gravity: closed path, W = 0.', 2: 'Friction: W = −μN × path length < 0.', 3: 'Spring: W depends on the end stretches only.' }[$.q]],
    sim: {
      scenario: 'gravity',
      setup: (s, $) => {
        if ($.q === 1) s.path = 'round';
        if ($.q === 2) Object.assign(s, { field: 'friction', path: 'round' });
        if ($.q === 3) Object.assign(s, { field: 'spring', path: 'arc' });
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1, "Shelving a Book": gravity does zero work over the closed path', { q: 1 }, { ans: 'zero' }),
      kase('OpenStax University Physics Vol. 1 §7.1, "Moving a Couch": the work against friction round the closed path is 4.3 kJ, not zero', { q: 2 }, { ans: 'neg' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.concept-diagram',
    src: 'OpenStax University Physics Vol. 1 §8.4',
    title: 'Reading a potential-energy curve',
    kind: 'conceptual',
    level: 2,
    lab: 'energy-diagram',
    topics: ['energy-diagram'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'For U(x) = 2(x⁴ − x²), the hump at x = 0 is a point where dU/dx = 0. What kind of rest point is it?'],
        [2, 'For U(x) = 2(x⁴ − x²), a particle is at x = 0.9 m, where U is rising to the right. Which way does the force on it point?'],
        [3, 'A particle with E = −0.25 J sits in the right-hand well of U(x) = 2(x⁴ − x²). Can it reach x = −0.7 m?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'unstable', 2: 'minus', 3: 'no' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: (WELL(1e-3) + WELL(-1e-3) - 2 * WELL(0)) < 0 ? 'unstable' : 'stable' };
      if ($.q === 2) return { ans: forceFrom(WELL, 0.9) < 0 ? 'minus' : 'plus' };
      const w = wellAround(WELL, -0.25, 0.7, -3, 3);
      return { ans: w.a > -0.7 ? 'no' : 'yes' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['stable', 'Stable', 'A stable rest point is a minimum of U: nudged, the force pushes back. This is a maximum.'],
          ['unstable', 'Unstable', 'Right: it is a maximum of U. Nudged either way, the force points downhill, away from it.'],
          ['neutral', 'Neither: the force is zero everywhere near it', 'The force is zero only at the point itself. Either side, the slope is not zero.'],
        ],
        2: [
          ['plus', 'Toward +x', 'F = −dU/dx. Where U rises to the right, dU/dx > 0 and F is negative.'],
          ['minus', 'Toward −x', 'Right: the force points downhill on the curve, back toward the bottom of the well at 0.707 m.'],
          ['none', 'There is no force: it is in an allowed region', 'Being allowed means K ≥ 0. The force is the slope of U, which is not zero here.'],
        ],
        3: [
          ['yes', 'Yes, it rolls over the hump', 'The hump at x = 0 has U = 0, above E = −0.25 J. It would need negative kinetic energy there.'],
          ['no', 'No', 'Right: it is trapped between 0.38 and 0.92 m. To cross it would need E ≥ 0, the top of the hump.'],
          ['sometimes', 'Only if it starts moving fast enough', 'Its total energy is given. Starting faster would mean a bigger E.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$F = -dU/dx$: the force points downhill on the curve. Where $U$ has a minimum, it pushes back; where it has a maximum, it pushes away.`,
      String.raw`A body can be only where $E \ge U$, since $K = E - U$ cannot be negative.`,
    ],
    steps: ($) => [{ 1: 'd²U/dx² < 0 at x = 0: a maximum, unstable.', 2: 'dU/dx > 0 at 0.9 m, so F < 0.', 3: 'U(0) = 0 > E: the hump is a wall.' }[$.q]],
    sim: {
      scenario: 'well',
      setup: (s, $) => {
        if ($.q === 2) s.x0 = 0.9;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.4, "Quartic and Quadratic Potential Energy Diagram": x = 0 is a relative maximum, an unstable equilibrium', { q: 1 }, { ans: 'unstable' }),
      kase('OpenStax University Physics Vol. 1 §8.4, "Quartic and Quadratic Potential Energy Diagram": with E = −0.25 J the particle cannot escape its well', { q: 3 }, { ans: 'no' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.concept-zero',
    src: 'OpenStax University Physics Vol. 1 §8.1',
    title: 'The zero of potential energy',
    kind: 'conceptual',
    level: 1,
    lab: 'track',
    topics: ['potential'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A cart rolls down a frictionless track. You move the zero of potential energy from the ground to the top of the track. How does its speed at the bottom change?'],
        [2, 'With the zero of potential energy at the top of a hill, what is the potential energy of a hiker at its base?'],
        [3, 'A block hangs from a relaxed spring and is let go. With twice the mass, how does the largest stretch change?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'neg', 3: 'more' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const v = (zero) => Math.sqrt(2 * ((G * (5 - zero)) - (G * (0 - zero))));
        return { ans: Math.abs(v(0) - v(5)) < 1e-12 ? 'same' : 'x' };
      }
      if ($.q === 2) return { ans: gravitationalEnergy(75, G, -147) < 0 ? 'neg' : 'x' };
      return { ans: (2 * 2 * G) / 6 > (2 * 1 * G) / 6 ? 'more' : 'x' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['more', 'Faster', 'Every U shifts by the same amount, the start’s too. Only differences of U set the speed.'],
          ['same', 'No change', 'Right: the speed depends on U at the top minus U at the bottom, and that difference does not move.'],
          ['less', 'Slower', 'Only differences of U enter the energy equation; they do not change.'],
        ],
        2: [
          ['pos', 'Positive', 'Below the zero level, y is negative, so U = mgy is negative.'],
          ['zero', 'Zero', 'U is zero only at the chosen level, the top.'],
          ['neg', 'Negative', 'Right: the base is below the zero level, so y < 0 and U < 0. A negative U is fine; only changes matter.'],
        ],
        3: [
          ['same', 'The same', 'At the lowest point mgy = ½ky², so y = 2mg/k: it grows with the mass.'],
          ['more', 'Twice as far', 'Right: y = 2mg/k, so twice the mass stretches it twice as far.'],
          ['less', 'Less', 'A heavier block pulls harder. It stretches the spring further.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Only differences of potential energy are physical. Where U = 0 is your choice; it changes the numbers but no motion.',
      String.raw`For a hanging spring, compare the drop's loss of gravitational energy, $mgy$, with the spring's gain, $\tfrac12ky^2$.`,
    ],
    steps: ($) => [{ 1: 'ΔU is the same for any zero: v is unchanged.', 2: 'y < 0, so U < 0.', 3: 'y = 2mg/k: ×2.' }[$.q]],
    sim: {
      scenario: 'hills',
      setup: (s, $) => {
        if ($.q === 1) s.zero = 5;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.1: the potential energy at a point depends on the choice of zero, but its differences do not', { q: 1 }, { ans: 'same' }),
      kase('OpenStax University Physics Vol. 1 §8.1, Check Your Understanding: with the mass doubled, the largest stretch of the hanging spring increases', { q: 3 }, { ans: 'more' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.concept-friction',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Where friction sends the energy',
    kind: 'conceptual',
    level: 2,
    lab: 'track',
    topics: ['energy', 'friction'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A cart rolls down a hill and up the next one, with some rolling resistance. How high up the second hill does it get, compared with where it started?'],
        [2, 'With rolling resistance, the cart’s kinetic plus potential energy falls. Where has the missing energy gone?'],
        [3, 'The same cart runs between the same two points by a longer, wigglier track with the same resistance. How does the thermal energy compare?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'lower', 2: 'thermal', 3: 'more' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: 5 - (200 * 9) / (400 * G) < 5 ? 'lower' : 'x' };
      if ($.q === 2) return { ans: 'thermal' };
      return { ans: 200 * 15 > 200 * 11 ? 'more' : 'x' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['same', 'To the same height', 'That is the frictionless case. Here the resistance turns some energy into heat on the way.'],
          ['lower', 'Lower', 'Right: mg h₂ = mg h₁ − f s. The energy friction took never comes back to the cart.'],
          ['higher', 'Higher, because it speeds up going down', 'Speed gained going down is paid for by height. It cannot end up with more than it started with.'],
        ],
        2: [
          ['thermal', 'Into thermal energy of the wheels, track and air', 'Right: E_th = f s. The total energy, thermal included, is conserved.'],
          ['potential', 'Into potential energy, stored for later', 'Stored energy would come back. Friction’s share does not.'],
          ['gone', 'It is destroyed', 'Energy is never destroyed. It changes form, here into thermal energy.'],
        ],
        3: [
          ['same', 'The same: friction depends only on the ends', 'That is true of a conservative force. Friction’s work is f times the path length.'],
          ['more', 'More', 'Right: E_th = f s, and the wigglier track is longer.'],
          ['less', 'Less', 'A longer path gives friction more distance to act over.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`With friction, $K_0 + U_0 = K + U + E_{\text{th}}$, where $E_{\text{th}} = fs$ grows with the distance $s$ along the track.`,
      'Friction is not conservative: its share depends on the path, and none of it comes back.',
    ],
    steps: ($) => [{ 1: 'mgh₂ = mgh₁ − fs: lower.', 2: 'E_th = fs: thermal energy.', 3: 'E_th = fs, s longer: more.' }[$.q]],
    sim: { scenario: 'rough', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §8.3: with non-conservative forces, the mechanical energy changes by their work, W_nc = Δ(K + U)', { q: 1 }, { ans: 'lower' }),
      kase('OpenStax University Physics Vol. 1 §8.3: the energy dissipated by friction becomes internal (thermal) energy', { q: 2 }, { ans: 'thermal' }),
    ],
  }),
];
