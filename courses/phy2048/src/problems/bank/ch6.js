/** Ch 6 · Applications of Newton's laws. OpenStax University Physics Vol. 1, §§6.1–6.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  apparentWeight, atwood, bankedCurve, crateOnTruck, hangingIncline, incline, verticalLoop,
} from '@flux/subjects/mechanics/dynamics.js';
import {
  dragConstant, linearCoast, quadraticRiseHeight, rk4Line, terminalSpeed,
} from '@flux/subjects/mechanics/drag.js';
import { MPS_PER_KMH } from '@flux/subjects/convert.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u3', ch: '6' };
const DEG = Math.PI / 180;
const RHO = 1.21;

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

export default [
  problem({
    ...U,
    id: 'ch6.atwood',
    level: 1,
    variety: ['representation'],
    lab: 'atwood',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'Atwood machine',
    topics: ['atwood', 'tension'],
    vars: {
      rep: choice(['kg', 'masses'], ['N', 'weights']),
      m1: range(1, 10, 0.5, 'kg'),
      m2: range(1, 10, 0.5, 'kg'),
    },
    derive: ($) => {
      const r = atwood($.m1, $.m2, G);
      return { a: r.a, T: r.T };
    },
    // Each block on its own: T − m1 g = m1 a and m2 g − T = m2 a, solved by Cramer's rule.
    second: ($) => {
      const det = $.m1 + $.m2;
      return { a: (($.m2 - $.m1) * G) / det, T: (2 * $.m1 * $.m2 * G) / det };
    },
    valid: ($) => $.m2 > $.m1 + 0.4,
    text: (T, $, sig) => ($.rep === 'N'
      ? `Two blocks hang from a light string over a frictionless pulley. They weigh ${sig($.m1 * G)} N and ${sig($.m2 * G)} N. Take g = ${G} m/s². Find the acceleration and the tension in the string.`
      : `Two blocks of ${T.m1} kg and ${T.m2} kg hang from a light string over a frictionless pulley. Take g = ${G} m/s². Find the acceleration and the tension in the string.`),
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
      num('T', ($) => $.T, 'N', { label: 'tension' }),
    ],
    hints: [
      String.raw`Draw each block alone. The same tension $T$ pulls both up; each has its own weight. Write $\sum F = ma$ for each, with the heavier one going down.`,
      String.raw`Add the two equations: $T$ cancels and $(m_2 - m_1)g = (m_1 + m_2)a$.`,
    ],
    steps: ($) => [
      String.raw`$a = \dfrac{(m_2 - m_1)g}{m_1 + m_2} = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`$T = m_1(g + a) = ${texNum($.T)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'atwood',
      setup: (s, $) => {
        s.m1 = $.m1;
        s.m2 = $.m2;
      },
      read: (c) => ({ a: c.a, T: c.T }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, "Atwood Machine": 2.00 kg and 4.00 kg', { rep: 'kg', m1: 2, m2: 4 }, { a: 3.27, T: 26.16 }, {
        note: 'The book uses g = 9.8 m/s² and prints 3.27 m/s² and 26.1 N.',
      }),
      kase('hand', { rep: 'N', m1: 3, m2: 5 }, { a: 2.4525, T: 36.7875 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.connected',
    level: 2,
    variety: ['configuration'],
    lab: 'atwood',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'A block on a table pulled by a hanging block',
    topics: ['tension', 'friction'],
    vars: {
      surface: choice(['smooth', 'smooth'], ['rough', 'rough']),
      m1: range(2, 10, 1, 'kg'),
      m2: range(1, 8, 1, 'kg'),
      mu: range(0.1, 0.5, 0.05, ''),
    },
    derive: ($) => {
      const mu = $.surface === 'rough' ? $.mu : 0;
      const r = hangingIncline({ block: $.m1, hang: $.m2, thetaDeg: 0, muk: mu, mus: mu, g: G });
      return { muUsed: mu, a: r.a, T: r.T, W2: $.m2 * G };
    },
    // Energy over a 1 m drop: ½(m1 + m2)v² = (m2 g − μ m1 g)(1 m); then a = v²/2, and T from block 1.
    second: ($) => {
      const mu = $.surface === 'rough' ? $.mu : 0;
      const v2 = (2 * ($.m2 * G - mu * $.m1 * G)) / ($.m1 + $.m2);
      const a = v2 / 2;
      return { a, T: $.m1 * a + mu * $.m1 * G };
    },
    valid: ($) => $.m2 > ($.surface === 'rough' ? $.mu : 0) * $.m1 + 0.5,
    text: (T, $) => `A ${T.m1} kg block on a ${T.surface} level table${$.surface === 'rough' ? ` (μk = ${T.mu})` : ''} is tied by a light string, over a frictionless pulley at the table's edge, to a ${T.m2} kg block hanging below. Released, the blocks move. Take g = ${G} m/s². Find the acceleration and the tension.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
      num('T', ($) => $.T, 'N', { label: 'tension' }),
    ],
    hints: [
      String.raw`Draw both blocks. On the table block: $T$ forward, friction $\mu_k m_1 g$ back. On the hanging block: $T$ up, $m_2 g$ down.`,
      String.raw`They share one acceleration: $T - \mu_k m_1 g = m_1 a$ and $m_2 g - T = m_2 a$. Add them to remove $T$.`,
    ],
    steps: ($) => [
      String.raw`$a = \dfrac{(m_2 - \mu_k m_1)g}{m_1 + m_2} = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`$T = m_2(g - a) = ${texNum($.T)}\ \mathrm{N}$, less than $m_2 g = ${texNum($.W2)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'table',
      setup: (s, $) => {
        s.m1 = $.m1;
        s.m2 = $.m2;
        s.mu = $.muUsed;
      },
      read: (c) => ({ a: c.a, T: c.T }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, Check Your Understanding 6.4: 5.00 kg on a smooth table, 3.00 kg hanging', { surface: 'smooth', m1: 5, m2: 3, mu: 0.2 }, { a: 3.6788, T: 18.394 }, {
        note: 'The book uses g = 9.8 m/s² and prints 3.68 m/s² and 18.4 N.',
      }),
      kase('hand', { surface: 'rough', m1: 5, m2: 3, mu: 0.2 }, { a: 2.4525, T: 22.0725 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.tractor',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'A force that grows with time, on a train of carts',
    topics: ['tension', 'second-law'],
    vars: {
      link: choice(['front', 'the cable between the tractor and the first cart'], ['back', 'the cable between the two carts']),
      k: range(400, 1200, 20, 'N/s'),
      mT: range(400, 900, 50, 'kg'),
      mA: range(100, 400, 25, 'kg'),
      mB: range(100, 300, 25, 'kg'),
      t: range(1, 5, 0.5, 's'),
    },
    derive: ($) => {
      const M = $.mT + $.mA + $.mB;
      const c = $.k / M;
      const aNow = c * $.t;
      // a = (k/M) t, so v = (k/2M) t². A cable pulls everything behind it.
      const behind = $.link === 'front' ? $.mA + $.mB : $.mB;
      return { M, aNow, v: 0.5 * c * $.t * $.t, T: behind * aNow };
    },
    // Step the whole train with RK4 for v; the tension from the tractor's own equation, F − T = m a.
    second: ($) => {
      const M = $.mT + $.mA + $.mB;
      const run = rk4Line((_, t) => ($.k * t) / M, { v0: 0, t1: $.t, steps: 400 });
      const a = ($.k * $.t) / M;
      const T = $.link === 'front' ? $.k * $.t - $.mT * a : $.k * $.t - ($.mT + $.mA) * a;
      return { v: run.v, T };
    },
    text: (T) => `A baggage tractor of ${T.mT} kg pulls two carts, A (${T.mA} kg) behind it and B (${T.mB} kg) behind A, from rest. The ground pushes the tractor forward with F = ${T.k}t N, with t in seconds; friction is negligible. After ${T.t} s, find the speed and the tension in ${T.link}.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
      num('T', ($) => $.T, 'N', { label: 'tension' }),
    ],
    hints: [
      String.raw`For the speed, take the whole train as the system: the cable forces are internal. $a = F/M$, and it grows with $t$.`,
      String.raw`The acceleration is not constant, so integrate: $v = \int_0^t a\,dt$.`,
      'For a tension, take as the system everything behind that cable. The cable is the only horizontal force on it.',
    ],
    steps: ($) => [
      String.raw`$a = kt/M$ with $M = ${texNum($.M)}\ \mathrm{kg}$; $v = kt^2/(2M) = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$T = m_{\text{behind}}\,a = ${texNum($.T)}\ \mathrm{N}$ at $a = ${texNum($.aNow)}\ \mathrm{m/s^2}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, "Baggage Tractor": 650.0 kg, carts of 250.0 and 150.0 kg, F = 820.0t N, after 3.00 s', { link: 'front', k: 820, mT: 650, mA: 250, mB: 150, t: 3 }, { v: 3.5143, T: 937.14 }, {
        note: 'The book prints 3.51 m/s and 938 N. Its tension step uses a = 0.7805t; 820/1050 = 0.7810, which gives 937 N.',
      }),
      kase('hand', { link: 'back', k: 1000, mT: 500, mA: 300, mB: 200, t: 2 }, { v: 2, T: 400 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.elevator',
    level: 1,
    variety: ['configuration'],
    lab: 'elevator-scale',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'What the scale reads in an elevator',
    topics: ['apparent-weight', 'normal'],
    vars: {
      phase: choice(
        ['up-fast', 'going up and speeding up'],
        ['up-slow', 'going up and slowing down'],
        ['down-fast', 'going down and speeding up'],
        ['down-slow', 'going down and slowing down'],
        ['steady', 'moving at a steady speed'],
      ),
      m: range(40, 110, 5, 'kg'),
      A: range(0.5, 3, 0.1, 'm/s²'),
    },
    derive: ($) => {
      const sign = { 'up-fast': 1, 'up-slow': -1, 'down-fast': -1, 'down-slow': 1, steady: 0 }[$.phase];
      const a = sign * $.A;
      const r = apparentWeight({ mass: $.m, a, g: G });
      return { a, N: r.N, kg: r.kg, W: r.weight };
    },
    // In the elevator's frame: the rider is at rest under N, mg and a pseudo-force −ma.
    second: ($) => {
      const sign = { 'up-fast': 1, 'up-slow': -1, 'down-fast': -1, 'down-slow': 1, steady: 0 }[$.phase];
      const N = $.m * G + $.m * sign * $.A;
      return { N, kg: N / G };
    },
    text: (T, $) => `A ${T.m} kg person stands on a bathroom scale in an elevator that is ${T.phase}${$.phase === 'steady' ? '' : ` at ${T.A} m/s²`}. Take g = ${G} m/s². What does the scale read, in newtons? What would a scale marked in kilograms show?`,
    parts: [
      num('N', ($) => $.N, 'N', { label: 'reading in newtons' }),
      num('kg', ($) => $.kg, 'kg', { label: 'reading in kilograms' }),
    ],
    hints: [
      String.raw`The scale reads the force it pushes up with, $N$. Two forces act on the person: $N$ up and $mg$ down, so $N - mg = ma$ with up positive.`,
      'Decide the direction of the acceleration, not of the motion. Speeding up on the way up and slowing down on the way down both mean a points up.',
    ],
    steps: ($) => [
      String.raw`$a = ${texNum($.a)}\ \mathrm{m/s^2}$ (up positive), so $N = m(g + a) = ${texNum($.N)}\ \mathrm{N}$`,
      String.raw`A kilogram scale divides by $g$: it shows $${texNum($.kg)}\ \mathrm{kg}$`,
    ],
    sim: {
      scenario: 'start',
      setup: (s, $) => {
        s.m = $.m;
        s.A = $.A;
        s.dir = $.phase.startsWith('down') ? 'down' : 'up';
        s.t = { 'up-fast': 2, 'up-slow': 8, 'down-fast': 2, 'down-slow': 8, steady: 5 }[$.phase];
      },
      read: (c) => ({ N: c.N, kg: c.kg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, "What Does the Bathroom Scale Read in an Elevator?" (a): 75.0 kg, 1.20 m/s² up', { phase: 'up-fast', m: 75, A: 1.2 }, { N: 825.75, kg: 84.174 }, {
        note: 'The book uses g = 9.80 m/s² and prints 825 N.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.1, "What Does the Bathroom Scale Read in an Elevator?" (b): at a constant speed', { phase: 'steady', m: 75, A: 1.2 }, { N: 735.75, kg: 75 }, {
        note: 'The book prints 735 N.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.incline',
    level: 1,
    variety: ['unknown'],
    lab: 'incline',
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'Sliding down a slope with friction',
    topics: ['friction', 'incline'],
    vars: {
      q: choice(['accel', 'the acceleration'], ['mu', 'the coefficient of kinetic friction']),
      m: range(40, 100, 1, 'kg'),
      th: range(5, 40, 1, '°'),
      mu: range(0.05, 0.4, 0.01, ''),
      f: range(20, 150, 5, 'N'),
    },
    derive: ($) => {
      const N = $.m * G * Math.cos($.th * DEG);
      const muk = $.q === 'mu' ? $.f / N : $.mu;
      const r = incline({ mass: $.m, thetaDeg: $.th, mu: muk, g: G, motion: 'down' });
      return { N, muk, a: r.aDown, ans: $.q === 'mu' ? muk : r.aDown };
    },
    // In horizontal and vertical axes: the net force projected on the slope.
    second: ($) => {
      const th = $.th * DEG;
      const N = $.m * G * Math.cos(th);
      if ($.q === 'mu') return { ans: $.f / Math.sqrt(($.m * G) ** 2 - ($.m * G * Math.sin(th)) ** 2) };
      const net = { x: N * Math.sin(th) - $.mu * N * Math.cos(th), y: N * Math.cos(th) + $.mu * N * Math.sin(th) - $.m * G };
      return { ans: (net.x * Math.cos(th) - net.y * Math.sin(th)) / $.m };
    },
    valid: ($) => $.q === 'accel' || $.muk < 0.6,
    text: (T, $) => ($.q === 'mu'
      ? `A ${T.m} kg skier slides down a ${T.th}° slope. The kinetic friction on her is ${T.f} N. Take g = ${G} m/s². Find the coefficient of kinetic friction.`
      : `A ${T.m} kg snowboarder glides down a ${T.th}° slope. The coefficient of kinetic friction is ${T.mu}. Take g = ${G} m/s². Find her acceleration down the slope (negative if she slows).`),
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'mu' ? '' : 'm/s²'), { label: 'the answer', abs: 0.002 }),
    ],
    hints: [
      String.raw`Tilt the axes along the slope. The weight splits into $mg\sin\theta$ along it and $mg\cos\theta$ into it, and the slope's normal force cancels the second: $N = mg\cos\theta$.`,
      String.raw`Kinetic friction is $\mu_k N$, up the slope. Along the slope, $mg\sin\theta - \mu_k N = ma$.`,
    ],
    steps: ($) => [
      String.raw`$N = mg\cos\theta = ${texNum($.N)}\ \mathrm{N}$`,
      $.q === 'mu'
        ? String.raw`$\mu_k = f/N = ${texNum($.muk)}$`
        : String.raw`$a = g(\sin\theta - \mu_k\cos\theta) = ${texNum($.a)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'snowboard',
      setup: (s, $) => {
        s.m = $.m;
        s.theta = $.th;
        s.mu = $.muk;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.2, "Snowboarding": 13°, μk = 0.20', { q: 'accel', m: 60, th: 13, mu: 0.2, f: 45 }, { ans: 0.29506 }, {
        note: 'The book prints 0.29 m/s².',
      }),
      kase('OpenStax University Physics Vol. 1 §6.2, "Downhill Skier": 62 kg, 25°, friction 45.0 N', { q: 'mu', m: 62, th: 25, mu: 0.2, f: 45 }, { ans: 0.081635 }, {
        note: 'The book prints 0.082.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.2, Check Your Understanding 6.7: the snowboarder on a 10.0° slope', { q: 'accel', m: 60, th: 10, mu: 0.2, f: 45 }, { ans: -0.22870 }, {
        note: 'The book prints −0.23 m/s²: she slows down.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.hold',
    level: 2,
    variety: ['configuration'],
    lab: 'incline',
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'Does it start to slide?',
    topics: ['friction', 'incline'],
    vars: {
      m: range(1, 20, 1, 'kg'),
      th: range(10, 45, 1, '°'),
      mus: range(0.2, 0.9, 0.05, ''),
      ratio: range(0.6, 0.85, 0.05, ''),
    },
    derive: ($) => {
      const muk = Number(($.mus * $.ratio).toFixed(3));
      const rest = incline({ mass: $.m, thetaDeg: $.th, mu: $.mus, g: G, motion: 'rest' });
      const a = rest.holds ? 0 : incline({ mass: $.m, thetaDeg: $.th, mu: muk, g: G, motion: 'down' }).aDown;
      return { muk, slides: rest.holds ? 'no' : 'yes', a, f: rest.holds ? $.m * G * Math.sin($.th * DEG) : muk * $.m * G * Math.cos($.th * DEG), tan: Math.tan($.th * DEG) };
    },
    // The angle of repose: it holds below tan⁻¹ μs. Then a = g(sin θ − μk cos θ) once it goes.
    second: ($) => {
      const muk = Number(($.mus * $.ratio).toFixed(3));
      const holds = $.th <= Math.atan($.mus) / DEG + 1e-9;
      const th = $.th * DEG;
      return { slides: holds ? 'no' : 'yes', a: holds ? 0 : G * (Math.sin(th) - muk * Math.cos(th)), f: holds ? $.m * G * Math.sin(th) : muk * $.m * G * Math.cos(th) };
    },
    valid: ($) => Math.abs($.tan - $.mus) > 0.04,
    text: (T, $) => `A ${T.m} kg crate is set down at rest on a ${T.th}° ramp. Between them μs = ${T.mus} and μk = ${$.muk}. Take g = ${G} m/s². Does the crate start to slide? What is the friction force on it, and its acceleration?`,
    parts: [
      mc('slides', [
        ['yes', 'It slides', 'It slides when the pull down the ramp, mg sin θ, beats the most static friction can give, μs mg cos θ: that is, when tan θ > μs.'],
        ['no', 'It stays put', 'It stays put when μs ≥ tan θ: static friction can match the pull down the ramp.'],
      ], ($) => $.slides, { label: 'does it slide?' }),
      num('f', ($) => $.f, 'N', { label: 'friction force' }),
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration down the ramp', abs: 0.005 }),
    ],
    hints: [
      String.raw`Whether it starts depends on static friction. The most it can give is $\mu_s N = \mu_s mg\cos\theta$; compare it with $mg\sin\theta$. The mass cancels: compare $\mu_s$ with $\tan\theta$.`,
      String.raw`If it holds, static friction is exactly $mg\sin\theta$, not $\mu_s N$. If it slides, friction becomes kinetic, $\mu_k N$.`,
    ],
    steps: ($) => [
      String.raw`$\tan\theta = ${texNum($.tan)}$ against $\mu_s = ${texNum($.mus)}$: it ${$.slides === 'yes' ? 'slides' : 'holds'}`,
      $.slides === 'yes'
        ? String.raw`$f = \mu_k mg\cos\theta = ${texNum($.f)}\ \mathrm{N}$, $a = g(\sin\theta - \mu_k\cos\theta) = ${texNum($.a)}\ \mathrm{m/s^2}$`
        : String.raw`$f = mg\sin\theta = ${texNum($.f)}\ \mathrm{N}$, less than $\mu_s N$; $a = 0$`,
    ],
    sim: {
      scenario: 'rest',
      setup: (s, $) => {
        s.m = $.m;
        s.theta = $.th;
        s.mu = $.mus;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.2: a body at rest slides when tan θ exceeds μs (the angle of repose); a 2 kg box on a 25° ramp with μs = 0.30', { m: 2, th: 25, mus: 0.3, ratio: 0.8 }, { slides: 'yes', f: 4.2676, a: 2.0121 }, {
        note: 'tan 25° = 0.466 exceeds 0.30, so it slides, with μk = 0.24.',
      }),
      kase('hand', { m: 10, th: 20, mus: 0.5, ratio: 0.8 }, { slides: 'no', f: 33.552, a: 0 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.truck',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'A crate on an accelerating truck',
    topics: ['friction'],
    vars: {
      m: range(20, 100, 5, 'kg'),
      mus: range(0.3, 0.7, 0.05, ''),
      gap: range(0.05, 0.15, 0.05, ''),
      aT: range(1, 7, 0.5, 'm/s²'),
    },
    derive: ($) => {
      const muk = $.mus - $.gap;
      const r = crateOnTruck({ mass: $.m, aTruck: $.aT, mus: $.mus, muk, g: G });
      return { muk, f: r.f, aCrate: r.aCrate, slips: r.slips ? 'yes' : 'no', limit: r.limit };
    },
    // The crate alone: assume it rides along and test; if not, kinetic friction gives f = μk m g.
    second: ($) => {
      const muk = $.mus - $.gap;
      const need = $.m * $.aT;
      const slips = need > $.mus * $.m * G;
      const f = slips ? muk * $.m * G : need;
      return { f, aCrate: f / $.m, slips: slips ? 'yes' : 'no' };
    },
    valid: ($) => Math.abs($.aT - $.mus * G) > 0.3 && $.muk > 0.1,
    text: (T, $) => `A ${T.m} kg crate sits on the flat bed of a truck. Between them μs = ${T.mus} and μk = ${Number($.muk.toFixed(2))}. The truck accelerates forward at ${T.aT} m/s². Take g = ${G} m/s². Does the crate slip? Find the friction force on the crate and its acceleration relative to the ground.`,
    parts: [
      mc('slips', [
        ['yes', 'It slips', 'It slips when riding along would need more than μs N of friction: when the truck’s acceleration exceeds μs g.'],
        ['no', 'It rides along', 'It rides along when static friction can give m a, that is when a ≤ μs g.'],
      ], ($) => $.slips, { label: 'does it slip?' }),
      num('f', ($) => $.f, 'N', { label: 'friction force' }),
      num('aCrate', ($) => $.aCrate, 'm/s²', { label: 'crate’s acceleration' }),
    ],
    hints: [
      'Friction is the only horizontal force on the crate, so it alone must accelerate it. Assume it rides along: friction must be m a. Check that against the most static friction can give, μs m g.',
      'If the check fails, the crate slips, friction becomes μk m g, and the crate falls behind the truck.',
    ],
    steps: ($) => [
      String.raw`To ride along it needs $m a = ${texNum($.m * $.aT)}\ \mathrm{N}$; static friction can give $\mu_s mg = ${texNum($.limit)}\ \mathrm{N}$`,
      $.slips === 'yes'
        ? String.raw`It slips: $f = \mu_k mg = ${texNum($.f)}\ \mathrm{N}$, $a = f/m = ${texNum($.aCrate)}\ \mathrm{m/s^2}$`
        : String.raw`It rides along: $f = ma = ${texNum($.f)}\ \mathrm{N}$, $a = ${texNum($.aCrate)}\ \mathrm{m/s^2}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.2, "A Crate on an Accelerating Truck" (a): 50.0 kg, μs 0.400, μk 0.300, 2.00 m/s²', { m: 50, mus: 0.4, gap: 0.1, aT: 2 }, { slips: 'no', f: 100, aCrate: 2 }, {
        note: 'The book prints 100 N.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.2, "A Crate on an Accelerating Truck" (b): the same at 5.00 m/s²', { m: 50, mus: 0.4, gap: 0.1, aT: 5 }, { slips: 'yes', f: 147.15, aCrate: 2.943 }, {
        note: 'The book uses g = 9.80 m/s² and prints 147 N and 2.94 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.flat',
    level: 1,
    variety: ['unknown', 'representation'],
    lab: 'banked-curve',
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'Friction on a flat curve',
    topics: ['centripetal-force', 'friction'],
    vars: {
      q: choice(['mu', 'the least coefficient of static friction'], ['speed', 'the highest speed']),
      unit: choice(['ms', 'm/s'], ['kmh', 'km/h']),
      r: range(30, 600, 10, 'm'),
      vms: range(10, 40, 1, 'm/s'),
      vkmh: range(40, 140, 5, 'km/h'),
      mu: range(0.2, 0.9, 0.05, ''),
    },
    derive: ($) => {
      // On a flat road friction is the whole centripetal force: μs m g ≥ m v²/r.
      const speed = $.unit === 'kmh' ? $.vkmh * MPS_PER_KMH : $.vms;
      const muNeed = (speed * speed) / ($.r * G);
      const vMax = Math.sqrt($.mu * G * $.r);
      return { speed, muNeed, vMax, ans: $.q === 'mu' ? muNeed : ($.unit === 'kmh' ? vMax / MPS_PER_KMH : vMax) };
    },
    // Drawn versions stay with road speeds and real tyres: up to about 130 km/h and μ ≤ 1.
    sampleValid: ($) => ($.q === 'mu' ? $.muNeed <= 1 : $.vMax <= 36),
    // From the banked-curve solver at 0°: the friction it needs over N, or the top of its band.
    second: ($) => {
      const speed = $.unit === 'kmh' ? $.vkmh * MPS_PER_KMH : $.vms;
      if ($.q === 'mu') {
        const b = bankedCurve({ mass: 1000, radius: $.r, thetaDeg: 0, speed, mu: 0, g: G });
        return { ans: Math.abs(b.f) / b.N };
      }
      const b = bankedCurve({ mass: 1000, radius: $.r, thetaDeg: 0, speed: 0, mu: $.mu, g: G });
      return { ans: $.unit === 'kmh' ? b.vMax / MPS_PER_KMH : b.vMax };
    },
    text: (T, $, sig) => {
      const sp = $.unit === 'kmh' ? `${T.vkmh} km/h` : `${T.vms} m/s`;
      return $.q === 'mu'
        ? `A car takes a flat, unbanked curve of radius ${T.r} m at ${sp}. Take g = ${G} m/s². What is the least coefficient of static friction that keeps it from sliding?`
        : `A car rounds a flat, unbanked curve of radius ${T.r} m. The coefficient of static friction between tyres and road is ${T.mu}. Take g = ${G} m/s². What is the highest speed at which it can take the curve, in ${$.unit === 'kmh' ? 'km/h' : 'm/s'}?`;
    },
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'mu' ? '' : ($.unit === 'kmh' ? 'km/h' : 'm/s')), { label: 'the answer', abs: 0.002 }),
    ],
    hints: [
      String.raw`The car moves on a circle, so the net force on it is $mv^2/r$ toward the centre. On a flat road only friction points that way.`,
      String.raw`Static friction can give at most $\mu_s N = \mu_s mg$. Set $mv^2/r = \mu_s mg$: the mass cancels.`,
    ],
    steps: ($) => [
      $.q === 'mu'
        ? String.raw`$\mu_s = v^2/(rg) = ${texNum($.muNeed)}$`
        : String.raw`$v_{\max} = \sqrt{\mu_s g r} = ${texNum($.vMax)}\ \mathrm{m/s}$${$.unit === 'kmh' ? String.raw` $= ${texNum($.ans)}\ \mathrm{km/h}$` : ''}`,
    ],
    sim: {
      scenario: 'flat',
      setup: (s, $) => {
        s.r = $.r;
        s.theta = 0;
        s.v = $.q === 'mu' ? $.speed : $.vMax;
        s.mu = $.q === 'mu' ? $.muNeed + 0.05 : $.mu;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.3, "What Coefficient of Friction Do Cars Need on a Flat Curve?": 500.0 m at 25.00 m/s', { q: 'mu', unit: 'ms', r: 500, vms: 25, vkmh: 90, mu: 0.5 }, { ans: 0.12742 }, {
        note: 'The book uses g = 9.80 m/s² and prints 0.13.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.3, Problem 6.53: 65 m, μs = 0.70', { q: 'speed', unit: 'ms', r: 65, vms: 20, vkmh: 90, mu: 0.7 }, { ans: 21.127 }, {
        note: 'The book prints 21 m/s.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.3, Check Your Understanding 6.9: 96.8 km/h on a flat 182.9 m curve', { q: 'mu', unit: 'kmh', r: 182.9, vms: 20, vkmh: 96.8, mu: 0.5 }, { ans: 0.40296 }, {
        note: 'The book prints 0.40.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.banked',
    level: 2,
    variety: ['unknown'],
    lab: 'banked-curve',
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'The ideal speed or angle of a banked curve',
    topics: ['centripetal-force', 'normal'],
    vars: {
      q: choice(['speed', 'the ideal speed'], ['angle', 'the ideal bank angle'], ['radius', 'the radius']),
      r: range(50, 1500, 10, 'm'),
      th: range(3, 40, 1, '°'),
      v: range(10, 45, 1, 'm/s'),
    },
    derive: ($) => {
      // With no friction: N sin θ = m v²/r and N cos θ = m g, so tan θ = v²/(r g).
      const vIdeal = Math.sqrt($.r * G * Math.tan($.th * DEG));
      const thIdeal = Math.atan(($.v * $.v) / ($.r * G)) / DEG;
      const rIdeal = ($.v * $.v) / (G * Math.tan($.th * DEG));
      return { vIdeal, thIdeal, rIdeal, ans: { speed: vIdeal, angle: thIdeal, radius: rIdeal }[$.q] };
    },
    // Drawn versions stay with road speeds, up to about 160 km/h, and banks up to 45°.
    sampleValid: ($) => ($.q === 'speed' ? $.vIdeal <= 45 : $.thIdeal <= 45 && $.rIdeal <= 2000),
    // From the general banked-curve solver: the speed at which friction is zero, found by bisection.
    second: ($) => {
      const fAt = (speed, r, th) => bankedCurve({ mass: 1, radius: r, thetaDeg: th, speed, g: G }).f;
      if ($.q === 'speed') return { ans: bisect((s) => fAt(s, $.r, $.th), 0.01, 300) };
      if ($.q === 'angle') return { ans: bisect((th) => fAt($.v, $.r, th), 0.001, 89) };
      return { ans: bisect((r) => fAt($.v, r, $.th), 1, 1e6) };
    },
    text: (T, $) => ({
      speed: `A curve of radius ${T.r} m is banked at ${T.th}°. Take g = ${G} m/s². At what speed can a car take it with no friction at all?`,
      angle: `A curve of radius ${T.r} m is to be taken at ${T.v} m/s with no help from friction. Take g = ${G} m/s². At what angle should it be banked?`,
      radius: `A bobsled run is banked at ${T.th}° and taken at ${T.v} m/s with no sideways friction. Take g = ${G} m/s². What is the radius of the turn?`,
    }[$.q]),
    parts: [
      num('ans', ($) => $.ans, ($) => ({ speed: 'm/s', angle: '°', radius: 'm' }[$.q]), { label: 'the answer', abs: 0.02 }),
    ],
    hints: [
      String.raw`With no friction only the normal force and the weight act. The normal force must lean toward the centre: its horizontal part gives $mv^2/r$, its vertical part holds up $mg$.`,
      String.raw`Divide the two equations: $\tan\theta = v^2/(rg)$. The mass cancels.`,
    ],
    steps: ($) => [
      String.raw`$\tan\theta = \dfrac{v^2}{rg}$`,
      { speed: String.raw`$v = \sqrt{rg\tan\theta} = ${texNum($.vIdeal)}\ \mathrm{m/s}$`, angle: String.raw`$\theta = \tan^{-1}(v^2/rg) = ${texNum($.thIdeal)}^\circ$`, radius: String.raw`$r = v^2/(g\tan\theta) = ${texNum($.rIdeal)}\ \mathrm{m}$` }[$.q],
    ],
    sim: {
      scenario: 'banked',
      setup: (s, $) => {
        s.r = $.q === 'radius' ? $.rIdeal : $.r;
        s.theta = $.q === 'angle' ? $.thIdeal : $.th;
        s.v = $.q === 'speed' ? $.vIdeal : $.v;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.3, "What Is the Ideal Speed to Take a Steeply Banked Tight Curve?": 100.0 m at 31.0°', { q: 'speed', r: 100, th: 31, v: 20 }, { ans: 24.278 }, {
        note: 'The book prints 24.3 m/s. It writes tan 31.0° = 0.6009 and then uses 0.609 in the line below; with 0.6009 and g = 9.80 the speed is 24.27 m/s.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.3, Problem 6.43: a 1.20 km curve for 105 km/h', { q: 'angle', r: 1200, th: 10, v: 29.1667 }, { ans: 4.1333 }, {
        note: 'The book uses g = 9.80 m/s² and prints 4.14°.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.3, Problem 6.45: a bobsled turn banked at 75.0°, taken at 30.0 m/s', { q: 'radius', r: 100, th: 75, v: 30 }, { ans: 24.582 }, {
        note: 'The book prints 24.6 m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.slowbank',
    level: 3,
    variety: ['configuration'],
    lab: 'banked-curve',
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'A banked curve off its design speed',
    topics: ['centripetal-force', 'friction'],
    vars: {
      side: choice(['slow', 'slower'], ['fast', 'faster']),
      r: range(50, 300, 10, 'm'),
      th: range(8, 30, 1, '°'),
      k: range(0.3, 0.7, 0.05, ''),
      K: range(1.2, 1.8, 0.1, ''),
    },
    derive: ($) => {
      const b0 = bankedCurve({ mass: 1, radius: $.r, thetaDeg: $.th, g: G });
      // The car runs at k times (slower) or K times (faster) the design speed.
      const speed = $.side === 'slow' ? $.k * b0.vDesign : $.K * b0.vDesign;
      const b = bankedCurve({ mass: 1, radius: $.r, thetaDeg: $.th, speed, g: G });
      return { vDesign: b0.vDesign, speed, kmh: speed / MPS_PER_KMH, muNeed: Math.abs(b.f) / b.N, fDir: b.f > 0 ? 'down' : 'up' };
    },
    // In horizontal and vertical components, solved for N and f by Cramer's rule.
    second: ($) => {
      const th = $.th * DEG;
      const vD = Math.sqrt($.r * G * Math.tan(th));
      const speed = $.side === 'slow' ? $.k * vD : $.K * vD;
      const Fx = (speed * speed) / $.r;
      const s = Math.sin(th);
      const c = Math.cos(th);
      const N = Fx * s + G * c;
      const f = Fx * c - G * s;
      return { vDesign: vD, muNeed: Math.abs(f) / N, fDir: f > 0 ? 'down' : 'up' };
    },
    text: (T, $, sig) => `A curve of radius ${T.r} m is banked at ${T.th}°. Take g = ${G} m/s². Find the speed it is designed for. A driver takes it at ${sig($.kmh)} km/h, ${T.side} than that. Which way must friction push the car, and what is the least coefficient of static friction that keeps it on its line?`,
    parts: [
      num('vDesign', ($) => $.vDesign, 'm/s', { label: 'design speed' }),
      mc('fDir', [
        ['up', 'Up the bank', 'Up the bank is right when the car is slower than the design speed: the normal force alone would pull it down and in.'],
        ['down', 'Down the bank', 'Down the bank is right when the car is faster than the design speed: it needs more inward force than the normal force gives.'],
      ], ($) => $.fDir, { label: 'friction points' }),
      num('muNeed', ($) => $.muNeed, '', { label: 'least μs', abs: 0.002 }),
    ],
    hints: [
      String.raw`Find the design speed from $\tan\theta = v^2/(rg)$. Off that speed, friction makes up the difference along the road.`,
      String.raw`Take $x$ horizontal toward the centre and $y$ up. With friction $f$ down the bank: $N\sin\theta + f\cos\theta = mv^2/r$ and $N\cos\theta - f\sin\theta = mg$. Solve for $N$ and $f$; a negative $f$ points up the bank.`,
      String.raw`The least coefficient is $|f|/N$.`,
    ],
    steps: ($) => [
      String.raw`$v_{\text{design}} = \sqrt{rg\tan\theta} = ${texNum($.vDesign)}\ \mathrm{m/s}$; the car does $${texNum($.speed)}\ \mathrm{m/s}$`,
      String.raw`Friction points ${$.fDir} the bank, and $\mu_s \ge |f|/N = ${texNum($.muNeed)}$`,
    ],
    sim: {
      scenario: 'banked',
      setup: (s, $) => {
        s.r = $.r;
        s.theta = $.th;
        s.v = $.speed;
        s.mu = $.muNeed + 0.02;
      },
      read: (c) => ({ vDesign: c.vDesign, muNeed: c.muNeeded }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.3, Problem 6.49: a 100.0 m curve banked at 15.0°, taken at 20.0 km/h', { side: 'slow', r: 100, th: 15, k: 5.5556 / 16.2129, K: 1.5 }, { vDesign: 16.212, fDir: 'up', muNeed: 0.2345 }, {
        note: 'The book prints 16.2 m/s and 0.234. Here k is chosen so the speed is 20.0 km/h.',
      }),
      kase('hand', { side: 'fast', r: 100, th: 20, k: 0.5, K: 1.5 }, { vDesign: 18.896, fDir: 'down', muNeed: 0.35049 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.loop',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'At the top of a loop',
    topics: ['centripetal-force', 'normal'],
    vars: {
      m: range(30, 90, 5, 'kg'),
      r: range(5, 20, 0.5, 'm'),
      vTop: range(8, 20, 0.5, 'm/s'),
    },
    derive: ($) => {
      // At the top both the seat's push and the weight point down, toward the centre: N + mg = mv²/r.
      const N = $.m * (($.vTop * $.vTop) / $.r - G);
      return { N, vMin: Math.sqrt(G * $.r) };
    },
    // From the loop solver: the seat force at the top for the speed that the bottom would need.
    second: ($) => {
      const vBottom = Math.sqrt($.vTop * $.vTop + 4 * G * $.r);
      const top = verticalLoop({ mass: $.m, radius: $.r, speedBottom: vBottom, phiDeg: 180, g: G });
      return { N: top.N, vMin: Math.sqrt(verticalLoop({ mass: 1, radius: $.r, speedBottom: Math.sqrt(5 * G * $.r), phiDeg: 180, g: G }).v2) };
    },
    valid: ($) => $.N > 20,
    text: (T) => `A ${T.m} kg rider in a roller-coaster car goes over the top of a vertical loop of radius ${T.r} m, upside down, at ${T.vTop} m/s. She wears no belt. Take g = ${G} m/s². What force does the seat exert on her at the top? What is the least speed at the top for which she stays in her seat?`,
    parts: [
      num('N', ($) => $.N, 'N', { label: 'seat force at the top' }),
      num('vMin', ($) => $.vMin, 'm/s', { label: 'least speed at the top' }),
    ],
    hints: [
      'At the top the centre of the loop is below her. Both forces on her, her weight and the seat’s push, point down, toward the centre.',
      String.raw`So $N + mg = mv^2/r$. She stays in the seat while $N \ge 0$: the least speed has $N = 0$.`,
    ],
    steps: ($) => [
      String.raw`$N = m(v^2/r - g) = ${texNum($.N)}\ \mathrm{N}$`,
      String.raw`$N = 0$ gives $v_{\min} = \sqrt{gr} = ${texNum($.vMin)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.3, Problem 6.51 (a) and (c): a 40.0 kg child, a 7.00 m loop, 10.0 m/s at the top', { m: 40, r: 7, vTop: 10 }, { N: 179.0, vMin: 8.2867 }, {
        note: 'The book prints 179 N and 8.3 m/s.',
      }),
      kase('hand', { m: 50, r: 10, vTop: 14 }, { N: 489.5, vMin: 9.9045 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.terminal',
    level: 2,
    variety: ['unknown'],
    lab: 'skydiver',
    src: 'OpenStax University Physics Vol. 1 §6.4',
    title: 'Terminal speed',
    topics: ['drag'],
    vars: {
      q: choice(['speed', 'the terminal speed'], ['b', 'the drag constant']),
      m: range(40, 120, 5, 'kg'),
      A: range(0.15, 0.9, 0.05, 'm²'),
      C: range(0.6, 1.2, 0.1, ''),
      vt: range(30, 90, 5, 'm/s'),
    },
    derive: ($) => {
      const k = dragConstant({ rho: RHO, C: $.C, A: $.A });
      const speed = terminalSpeed({ m: $.m, g: G, k });
      const b = ($.m * G) / ($.vt * $.vt);
      return { k, speed, b, ans: $.q === 'speed' ? speed : b };
    },
    // RK4 from rest for a long time for the speed; for b, the force balance written as F = ma = 0.
    second: ($) => {
      if ($.q === 'b') return { ans: (($.m * G) - 0) / $.vt ** 2 };
      const k = 0.5 * RHO * $.C * $.A;
      const end = rk4Line((v) => G - (k / $.m) * v * v, { v0: 0, t1: 120, steps: 12000 });
      return { ans: end.v };
    },
    text: (T, $) => ($.q === 'speed'
      ? `A ${T.m} kg skydiver falls with an area of ${T.A} m² facing the air and a drag coefficient of ${T.C}. The air's density is ${RHO} kg/m³. Take g = ${G} m/s². Find her terminal speed.`
      : `The drag on a ${T.m} kg skydiver is F = bv². Her terminal speed is ${T.vt} m/s. Take g = ${G} m/s². Find b.`),
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'speed' ? 'm/s' : 'kg/m'), { label: 'the answer', abs: 0.002 }),
    ],
    hints: [
      String.raw`At terminal speed the acceleration is zero, so drag balances the weight: $F_D = mg$.`,
      String.raw`With $F_D = \tfrac12\rho CAv^2$, solve for $v$: $v_t = \sqrt{2mg/(\rho CA)}$.`,
    ],
    steps: ($) => [
      $.q === 'speed'
        ? String.raw`$v_t = \sqrt{\dfrac{2mg}{\rho CA}} = ${texNum($.speed)}\ \mathrm{m/s}$`
        : String.raw`$bv_t^2 = mg$, so $b = mg/v_t^2 = ${texNum($.b)}\ \mathrm{kg/m}$`,
    ],
    sim: {
      scenario: 'spread',
      setup: (s, $) => {
        s.m = $.m;
        s.A = $.q === 'speed' ? $.A : (2 * $.b) / (RHO * 1);
        s.C = $.q === 'speed' ? $.C : 1;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.4, "Terminal Velocity of a Skydiver": 85 kg, 0.70 m², C = 1.0', { q: 'speed', m: 85, A: 0.7, C: 1, vt: 60 }, { ans: 44.373 }, {
        note: 'The book uses g = 9.80 m/s² and prints 44 m/s.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.4, Check Your Understanding 6.11: a 100 kg skydiver with a terminal speed of 60 m/s', { q: 'b', m: 100, A: 0.7, C: 1, vt: 60 }, { ans: 0.2725 }, {
        note: 'The book prints 0.27 kg/m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.coast',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §6.4',
    title: 'A boat coasting against linear drag',
    topics: ['drag'],
    vars: {
      v0: range(2, 10, 0.5, 'm/s'),
      ratio: range(2, 6, 1, ''),
      t1: range(5, 20, 1, 's'),
    },
    derive: ($) => {
      // v = v0 e^(−t/τ): falling to v0/ratio in t1 gives τ = t1 / ln(ratio).
      const tau = $.t1 / Math.log($.ratio);
      const c = linearCoast({ v0: $.v0, tau, t: $.t1 });
      return { tau, bm: 1 / tau, v1: $.v0 / $.ratio, xMax: c.xMax, x1: c.x };
    },
    // RK4 on m dv/dt = −bv for the distance by t1; the limit x_max = v0 τ from the area under v.
    second: ($) => {
      const tau = $.t1 / Math.log($.ratio);
      const run = rk4Line((v) => -v / tau, { v0: $.v0, t1: $.t1, steps: 4000 });
      const far = rk4Line((v) => -v / tau, { v0: $.v0, t1: 40 * tau, steps: 40000 });
      return { bm: Math.log($.v0 / run.v) / $.t1, x1: run.y, xMax: far.y };
    },
    text: (T, $, sig) => `A motorboat's engine cuts out at ${T.v0} m/s. Water drag, F = −bv, slows it to ${sig($.v1)} m/s in ${T.t1} s. Find b/m, how far it goes in those ${T.t1} s, and how far it goes before it stops.`,
    parts: [
      num('bm', ($) => $.bm, '1/s', { label: 'b/m' }),
      num('x1', ($) => $.x1, 'm', { label: 'distance in that time' }),
      num('xMax', ($) => $.xMax, 'm', { label: 'distance before it stops' }),
    ],
    hints: [
      String.raw`Newton's second law: $m\,dv/dt = -bv$. Separate and integrate: $v = v_0e^{-(b/m)t}$.`,
      String.raw`Integrate once more for the distance: $x = (mv_0/b)(1 - e^{-(b/m)t})$. As $t \to \infty$ it tends to $mv_0/b$.`,
    ],
    steps: ($) => [
      String.raw`$b/m = \ln(v_0/v)/t = ${texNum($.bm)}\ \mathrm{s^{-1}}$`,
      String.raw`$x(t) = (v_0 m/b)(1 - e^{-bt/m}) = ${texNum($.x1)}\ \mathrm{m}$; $x_{\max} = v_0 m/b = ${texNum($.xMax)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.4, "Effect of the Resistive Force on a Motorboat": 4.0 m/s to 1.0 m/s in 10 s', { v0: 4, ratio: 4, t1: 10 }, { bm: 0.13863, x1: 21.640, xMax: 28.854 }, {
        note: 'The book rounds b/m to 0.14 s⁻¹ and prints 29 m.',
      }),
      kase('hand', { v0: 6, ratio: 2, t1: 5 }, { bm: 0.13863, x1: 21.640, xMax: 43.281 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.mortar',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'How high a shell climbs against v² drag',
    topics: ['drag'],
    vars: {
      air: choice(['drag', 'with air drag'], ['none', 'in a vacuum']),
      m: range(2, 20, 1, 'kg'),
      k: range(0.002, 0.02, 0.002, 'kg/m'),
      v0: range(20, 80, 5, 'm/s'),
    },
    derive: ($) => {
      const h = $.air === 'drag' ? quadraticRiseHeight({ m: $.m, k: $.k, g: G, v0: $.v0 }) : ($.v0 * $.v0) / (2 * G);
      return { h, hFree: ($.v0 * $.v0) / (2 * G) };
    },
    // RK4 upward until v = 0, the top found by bisection on time.
    second: ($) => {
      const k = $.air === 'drag' ? $.k : 0;
      const acc = (v) => -G - (k / $.m) * v * Math.abs(v);
      const tTop = bisect((t) => rk4Line(acc, { v0: $.v0, t1: t, steps: 600 }).v, 1e-6, $.v0 / G + 1e-6, 60);
      return { h: rk4Line(acc, { v0: $.v0, t1: tTop, steps: 600 }).y };
    },
    text: (T, $) => `A ${T.m} kg shell is fired straight up at ${T.v0} m/s ${$.air === 'drag' ? `through air that drags on it with F = ${T.k}v² N (v in m/s)` : 'with no air resistance'}. Take g = ${G} m/s². How high does it climb?`,
    parts: [
      num('h', ($) => $.h, 'm', { label: 'height' }),
    ],
    hints: [
      String.raw`On the way up both the weight and the drag point down: $m\,dv/dt = -mg - kv^2$. The force depends on $v$, so use $a = v\,dv/dy$ to trade time for height.`,
      String.raw`Separate: $dy = -\dfrac{m v\,dv}{mg + kv^2}$. Integrate from $v_0$ to 0: $h = \dfrac{m}{2k}\ln\!\left(1 + \dfrac{kv_0^2}{mg}\right)$.`,
    ],
    steps: ($) => [
      $.air === 'drag'
        ? String.raw`$h = \dfrac{m}{2k}\ln\!\left(1 + \dfrac{kv_0^2}{mg}\right) = ${texNum($.h)}\ \mathrm{m}$, against $${texNum($.hFree)}\ \mathrm{m}$ with no air`
        : String.raw`$h = v_0^2/(2g) = ${texNum($.h)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, "Motion of a Projectile Fired Vertically": 10.0 kg at 50.0 m/s, F = 0.0100v²', { air: 'drag', m: 10, k: 0.01, v0: 50 }, { h: 113.50 }, {
        note: 'The book uses g = 9.80 m/s² and prints 114 m.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.1, Check Your Understanding 6.6: the same shell with no air resistance', { air: 'none', m: 10, k: 0.01, v0: 50 }, { h: 127.42 }, {
        note: 'The book uses g = 9.80 m/s² and prints 128 m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.concept-scale',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'When does the scale read most?',
    kind: 'conceptual',
    level: 2,
    lab: 'elevator-scale',
    topics: ['apparent-weight'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'Rank what a bathroom scale reads in an elevator. Which reads the most?'],
        [2, 'An elevator moves down at a steady speed. What does the scale read?'],
        [3, 'The elevator’s cable snaps and the car falls freely. What does the scale read?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'down-slow', 2: 'weight', 3: 'zero' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const r = { 'up-steady': 0, 'down-slow': 1.2, 'down-fast': -1.2 };
        return { ans: Object.entries(r).sort((a, b) => b[1] - a[1])[0][0] };
      }
      return { ans: $.q === 2 ? 'weight' : (apparentWeight({ mass: 70, a: -G }).N === 0 ? 'zero' : 'x') };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['up-steady', 'Going up at a steady 3 m/s', 'At a steady speed the acceleration is zero and the scale reads the weight, whatever the direction.'],
          ['down-slow', 'Going down and slowing at 1.2 m/s²', 'Right: slowing a downward motion needs an upward acceleration, so N = m(g + 1.2) is more than the weight.'],
          ['down-fast', 'Going down and speeding up at 1.2 m/s²', 'Speeding up downward is a downward acceleration: N = m(g − 1.2), less than the weight.'],
        ],
        2: [
          ['less', 'Less than the weight, because it is going down', 'The direction of motion does not matter. A steady velocity means no acceleration, so N = mg.'],
          ['weight', 'The weight', 'Right: constant velocity, zero acceleration, so the scale’s push balances the weight.'],
          ['more', 'More than the weight', 'Only an upward acceleration makes it read more.'],
        ],
        3: [
          ['weight', 'The weight: gravity still acts', 'Gravity does act, but the scale reads its push, not gravity. In free fall the rider and the scale fall together and do not press on each other.'],
          ['zero', 'Zero', 'Right: a = −g, so N = m(g − g) = 0. The rider is weightless in the sense that nothing holds him up.'],
          ['double', 'Twice the weight', 'That would need an upward acceleration of g. The car accelerates down.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`The scale reads the force $N$ it pushes with. For the rider, $N - mg = ma$ with up positive, so $N = m(g + a)$.`,
      'Find the direction of the acceleration, not of the motion. Slowing down means the acceleration points against the velocity.',
    ],
    steps: ($) => [{ 1: 'Upward acceleration reads highest: going down and slowing.', 2: 'Zero acceleration: N = mg.', 3: 'a = −g: N = 0.' }[$.q]],
    sim: {
      scenario: 'arrive',
      setup: (s, $) => {
        if ($.q === 2) s.t = 5;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1, "What Does the Bathroom Scale Read in an Elevator?": for any constant velocity, up, down or stationary, the scale reads the weight', { q: 2 }, { ans: 'weight' }),
      kase('OpenStax University Physics Vol. 1 §6.1: if the elevator accelerates downward, Fs − w = −ma, so the reading is less than the weight, and zero in free fall', { q: 3 }, { ans: 'zero' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.concept-tension',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'Tension and the hanging weight',
    kind: 'conceptual',
    level: 2,
    lab: 'atwood',
    topics: ['tension', 'atwood'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A block hangs from a string tied to a block on a smooth table; both are held at rest. How does the tension compare with the hanging weight?'],
        [2, 'The same blocks are released and the hanging one falls, speeding up. How does the tension compare with the hanging weight?'],
        [3, 'A crane lowers a crate at a steady speed. How does the cable’s tension compare with the crate’s weight?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'equal', 2: 'less', 3: 'equal' }[$.q] }),
    second: ($) => {
      if ($.q === 2) {
        const r = hangingIncline({ block: 5, hang: 3, thetaDeg: 0, g: G });
        return { ans: r.T < 3 * G ? 'less' : 'x' };
      }
      return { ans: 'equal' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => [
        ['less', 'Less than the weight', $.q === 2 ? 'Right: the hanging block speeds up downward, so the net force on it points down: T = m(g − a), less than mg.' : 'Nothing accelerates here, so the forces on the hanging block balance: T = mg.'],
        ['equal', 'Equal to the weight', $.q === 2 ? 'If T were mg the hanging block would have no net force and could not speed up.' : 'Right: zero acceleration, so the tension balances the weight exactly. A steady speed counts as zero acceleration.'],
        ['more', 'More than the weight', 'More would make the hanging block accelerate upward, or slow on its way down. Neither happens here.'],
      ], ($) => $.ans, { label: 'the tension' }),
    ],
    hints: [
      'Draw the hanging body alone: the string pulls up with T and gravity pulls down with mg. Their difference is m a.',
      'Ask which way it accelerates, if at all. Moving at a steady speed is not accelerating.',
    ],
    steps: ($) => [{ 1: 'At rest: T = mg.', 2: 'Accelerating down: T = m(g − a) < mg.', 3: 'Steady speed: T = mg.' }[$.q]],
    sim: { scenario: 'table', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.1: the tension in the string is less than the weight of the block hanging from it; setting T = m₂g is a common error', { q: 2 }, { ans: 'less' }),
      kase('OpenStax University Physics Vol. 1 §5.6: a body hanging at rest has a tension equal to its weight', { q: 1 }, { ans: 'equal' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.concept-terminal',
    src: 'OpenStax University Physics Vol. 1 §6.4',
    title: 'At terminal speed',
    kind: 'conceptual',
    level: 2,
    lab: 'drag',
    topics: ['drag'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A skydiver falls at her terminal speed. What is her acceleration?'],
        [2, 'Two skydivers of the same size, shape and position fall side by side; one has twice the mass. How do their terminal speeds compare?'],
        [3, 'A skydiver leaves a fast dive at well above her terminal speed and spreads out. What happens to her speed?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'zero', 2: 'root2', 3: 'slows' }[$.q] }),
    second: ($) => {
      const k = dragConstant({ rho: RHO, C: 1, A: 0.7 });
      if ($.q === 1) return { ans: 'zero' };
      if ($.q === 2) return { ans: Math.abs(terminalSpeed({ m: 170, k }) / terminalSpeed({ m: 85, k }) - Math.SQRT2) < 1e-9 ? 'root2' : 'x' };
      return { ans: rk4Line((v) => G - (k / 85) * v * v, { v0: 70, t1: 1 }).v < 70 ? 'slows' : 'x' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['g', 'g downward: she is still falling', 'She falls at a constant velocity. Drag now balances her weight, so the net force, and the acceleration, are zero.'],
          ['zero', 'Zero', 'Right: at terminal speed drag equals the weight, the net force is zero, and the velocity no longer changes.'],
          ['up', 'Upward, because drag is pushing up', 'Drag pushes up, but it only matches the weight. An upward acceleration would need it to exceed the weight.'],
        ],
        2: [
          ['same', 'The same: all bodies fall alike', 'That holds without air. With drag, the heavier one needs more drag to balance its weight, so a higher speed.'],
          ['root2', 'The heavier one’s is √2 times as large', 'Right: ½ρCAv_t² = mg, so v_t ∝ √m. Twice the mass gives 1.41 times the terminal speed.'],
          ['double', 'The heavier one’s is twice as large', 'That would be true for drag proportional to v. Air drag on a skydiver grows as v², so v_t grows as √m.'],
        ],
        3: [
          ['speeds', 'She keeps speeding up, as gravity still pulls', 'Above terminal speed, drag is bigger than her weight. The net force points up and slows her.'],
          ['slows', 'She slows down, toward her terminal speed', 'Right: drag beats the weight above v_t, so she decelerates until drag and weight balance again.'],
          ['steady', 'She keeps her dive speed', 'A steady speed needs zero net force. Drag at that speed exceeds her weight, so she slows.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`Two forces act: the weight $mg$ down and the drag $\tfrac12\rho CAv^2$ up. Terminal speed is where they are equal.`,
      'Compare drag with the weight at the speed in question. Whichever is bigger sets the direction of the acceleration.',
    ],
    steps: ($) => [{ 1: 'Drag = weight: a = 0.', 2: 'v_t = √(2mg/ρCA) ∝ √m.', 3: 'Drag > weight above v_t: she slows.' }[$.q]],
    sim: {
      scenario: 'skydiver',
      setup: (s, $) => {
        if ($.q === 3) s.v0 = 70;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.4: at terminal velocity the net force is zero, so there is no acceleration', { q: 1 }, { ans: 'zero' }),
      kase('OpenStax University Physics Vol. 1 §6.4: v_t = √(2mg/ρCA)', { q: 2 }, { ans: 'root2' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.concept-curve',
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'What turns a car',
    kind: 'conceptual',
    level: 1,
    lab: 'banked-curve',
    topics: ['centripetal-force'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A car turns on a flat road at a steady speed. What supplies the force toward the centre?'],
        [2, 'A car takes a banked curve at exactly its design speed. What supplies the force toward the centre?'],
        [3, 'On a flat curve a passenger feels pressed against the outer door. Seen from the ground, what is happening?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'friction', 2: 'normal', 3: 'inertia' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: bankedCurve({ mass: 1, radius: 50, thetaDeg: 0, speed: 10 }).f > 0 ? 'friction' : 'x' };
      if ($.q === 2) {
        const b0 = bankedCurve({ mass: 1, radius: 50, thetaDeg: 20 });
        return { ans: Math.abs(bankedCurve({ mass: 1, radius: 50, thetaDeg: 20, speed: b0.vDesign }).f) < 1e-9 ? 'normal' : 'x' };
      }
      return { ans: 'inertia' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['friction', 'Static friction from the road on the tyres', 'Right: it is the only horizontal force on the car, so it supplies all of mv²/r.'],
          ['centrifugal', 'A centrifugal force, balanced by friction', 'In the ground’s frame there is no outward force. The car is not in balance sideways: it accelerates toward the centre.'],
          ['engine', 'The engine', 'The engine drives the wheels forward. Turning needs a sideways force, and only the road can supply it.'],
        ],
        2: [
          ['friction', 'Friction, as on a flat curve', 'At the design speed friction is zero. The banked road does the job by tilting the normal force.'],
          ['normal', 'The horizontal part of the normal force', 'Right: the normal force leans toward the centre on a bank. At the design speed its horizontal part is exactly mv²/r.'],
          ['weight', 'The weight', 'The weight points straight down. It has no part toward the centre of a horizontal circle.'],
        ],
        3: [
          ['outward', 'A force pushes the passenger outward', 'Nothing pushes outward. The passenger tends to go straight, and the car turns under him.'],
          ['inertia', 'The passenger tends to keep going straight; the door pushes him inward to make him turn', 'Right: the door supplies his centripetal force. The outward “push” is his inertia, seen from inside the turning car.'],
          ['none', 'Nothing: the passenger moves with the car', 'He moves with the car only because something pushes him inward: the seat friction, then the door.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'A body on a circle needs a net force toward the centre, mv²/r. Ask which real force, from something touching the car or from gravity, points that way.',
      'In the ground’s frame every force has a source. There is no source for a force pushing outward.',
    ],
    steps: ($) => [{ 1: 'Friction from the road, inward.', 2: 'The normal force, tilted inward by the bank.', 3: 'Inertia carries him straight; the door pushes him inward.' }[$.q]],
    sim: {
      scenario: 'flat',
      setup: (s, $) => {
        if ($.q === 2) {
          s.theta = 31;
          s.r = 100;
          s.v = 24.28;
        }
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §6.3, "What Coefficient of Friction Do Cars Need on a Flat Curve?": friction is the only horizontal force, so it is the centripetal force', { q: 1 }, { ans: 'friction' }),
      kase('OpenStax University Physics Vol. 1 §6.3: on an ideally banked curve the horizontal component of the normal force is the centripetal force', { q: 2 }, { ans: 'normal' }),
    ],
  }),
];
