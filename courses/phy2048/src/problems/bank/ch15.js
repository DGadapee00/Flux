/** Ch 15 · Oscillations. OpenStax University Physics Vol. 1, §§15.1–15.6. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  criticalDamping, drivenAmplitude, drivenLag, gravityFromPendulum, pendulumPeriod,
  pendulumPeriodExact, resonanceAmplitude, shm, shmEnergy, speedAtDisplacement, springOmega,
  springPeriod, torsionConstant, tunedDamperLength, underdampedMotion, underdampedOmega,
  verticalShift,
} from '@flux/subjects/mechanics/oscillation.js';
import { inertiaRodCenter } from '@flux/subjects/mechanics/rotation.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u11', ch: '15' };
const DEG = Math.PI / 180;
const small = { abs: 1e-4 };

export default [
  problem({
    ...U,
    id: 'ch15.ultrasound',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Frequency of a medical ultrasound',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: { T: range(0.2, 2, 0.05, 'μs', 1e-6) },
    derive: ($) => ({ f: 1 / $.T }),
    second: ($) => ({ f: 1 / $.T }),
    text: (T) => `A medical ultrasound has period ${T.T} μs. Find the frequency in hertz.`,
    parts: [
      num('f', ($) => $.f, 'Hz', { label: 'frequency' }),
    ],
    hints: [
      'Frequency is the reciprocal of the period.',
      'A microsecond is 10⁻⁶ s. The answer is in hertz, which is 1/s.',
    ],
    steps: ($) => [
      String.raw`$f = 1/T = ${texNum($.f)}\ \mathrm{Hz}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        s.m = 1;
        s.k = (2 * Math.PI / $.T) ** 2;
        s.A = 0.02;
        s.t = 0;
        s.hang = 'flat';
      },
      read: (c) => ({ f: c.f }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, "Determining the Frequency of Medical Ultrasound"', {
        T: 0.4,
      }, { f: 2.5e6 }, {
        note: 'The period 0.400 μs is 4.00×10⁻⁷ s, and the frequency is exactly 2.50×10⁶ Hz.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.block',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'A block on a spring',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: {
      m: range(0.4, 6, 0.1, 'kg'),
      k: range(8, 80, 1, 'N/m'),
      A: range(0.01, 0.08, 0.005, 'm'),
    },
    derive: ($) => {
      const w = springOmega($.m, $.k);
      return { w, T: springPeriod($.m, $.k), vmax: $.A * w, amax: $.A * w * w };
    },
    second: ($) => {
      const w = Math.sqrt($.k / $.m);
      return { w, T: (2 * Math.PI) / w, vmax: $.A * w, amax: $.A * w * w };
    },
    text: (T) => `A ${T.m} kg block on a frictionless surface is attached to a spring of constant ${T.k} N/m. It is released from rest at x = ${T.A} m. Find the angular frequency, the period, the maximum speed, and the maximum acceleration.`,
    parts: [
      num('w', ($) => $.w, 'rad/s', { label: 'angular frequency' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
      num('vmax', ($) => $.vmax, 'm/s', { label: 'maximum speed' }),
      num('amax', ($) => $.amax, 'm/s²', { label: 'maximum acceleration' }),
    ],
    hints: [
      String.raw`$\omega = \sqrt{k/m}$ and $T = 2\pi/\omega$. The amplitude is not in either one.`,
      String.raw`$v_{\max} = A\omega$ and $a_{\max} = A\omega^{2}$.`,
    ],
    steps: ($) => [
      String.raw`$\omega = \sqrt{k/m} = ${texNum($.w)}\ \mathrm{rad/s}$, so $T = ${texNum($.T)}\ \mathrm{s}$`,
      String.raw`$v_{\max} = A\omega = ${texNum($.vmax)}\ \mathrm{m/s}$, and $a_{\max} = A\omega^{2} = ${texNum($.amax)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.m = $.m; s.k = $.k; s.A = $.A; s.t = 0; s.hang = 'flat'; },
      read: (c) => ({ w: c.omega, T: c.T, vmax: c.vmax, amax: c.amax }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, "Determining the Equations of Motion for a Block and a Spring"', {
        m: 2, k: 32, A: 0.02,
      }, { w: 4, T: 1.57, vmax: 0.08, amax: 0.32 }, {
        note: 'ω is exactly 4 rad/s. The period π/2 s prints as 1.57 s. The maximum speed is 0.0800 m/s and the maximum acceleration is 0.320 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.motion',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Position, velocity, and acceleration',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: {
      A: range(0.01, 0.08, 0.005, 'm'),
      w: range(1, 12, 0.5, 'rad/s'),
      t: range(0, 2, 0.05, 's'),
    },
    derive: ($) => shm({ A: $.A, omega: $.w, phi: 0, t: $.t }),
    second: ($) => {
      const phase = $.w * $.t;
      const x = $.A * Math.cos(phase);
      return { x, v: -$.A * $.w * Math.sin(phase), a: -$.w * $.w * x };
    },
    text: (T) => `A block oscillates with amplitude ${T.A} m and angular frequency ${T.w} rad/s. The phase is zero, so x = A at t = 0. Find x, v, and a at t = ${T.t} s. Keep the calculator in radians.`,
    parts: [
      num('x', ($) => $.x, 'm', { ...small, label: 'position' }),
      num('v', ($) => $.v, 'm/s', { ...small, label: 'velocity' }),
      num('a', ($) => $.a, 'm/s²', { ...small, label: 'acceleration' }),
    ],
    hints: [
      String.raw`$x = A\cos(\omega t)$. The velocity is $-A\omega\sin(\omega t)$.`,
      String.raw`$a = -\omega^{2} x$. The argument of the sine and cosine is in radians.`,
    ],
    steps: ($) => [
      String.raw`$x = ${texNum($.x)}\ \mathrm{m}$, $v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$a = -\omega^{2} x = ${texNum($.a)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.m = 1; s.k = $.w * $.w; s.A = $.A; s.t = $.t; s.hang = 'flat'; },
      read: (c) => ({ x: c.x, v: c.v, a: c.a }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, the block and spring, sampled at 0.200 s', {
        A: 0.02, w: 4, t: 0.2,
      }, { x: 0.01393, v: -0.05739, a: -0.2229 }, {
        note: 'The section gives x = (0.0200 m) cos(4.00 t). t = 0.200 s is a sample on that motion, not a printed instant.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.energy',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.2',
    title: 'Energy at a displacement',
    topics: ['shm-energy'],
    lab: 'spring-mass',
    vars: {
      m: range(0.4, 4, 0.1, 'kg'),
      k: range(10, 80, 1, 'N/m'),
      A: range(0.04, 0.2, 0.01, 'm'),
      x: range(0, 0.03, 0.005, 'm'),
    },
    valid: ($) => $.A > $.x + 0.005,
    derive: ($) => ({
      E: shmEnergy($.k, $.A),
      v: speedAtDisplacement($.m, $.k, $.A, $.x),
    }),
    second: ($) => {
      const E = 0.5 * $.k * $.A * $.A;
      const left = E - 0.5 * $.k * $.x * $.x;
      return { E, v: Math.sqrt((2 * left) / $.m) };
    },
    text: (T) => `A ${T.m} kg block on a spring of constant ${T.k} N/m oscillates with amplitude ${T.A} m. Find the total energy, and the speed at x = ${T.x} m.`,
    parts: [
      num('E', ($) => $.E, 'J', { abs: 1e-5, label: 'total energy' }),
      num('v', ($) => $.v, 'm/s', { ...small, label: 'speed' }),
    ],
    hints: [
      String.raw`The total energy is $\tfrac12 k A^{2}$. It does not depend on where the block is.`,
      String.raw`At displacement x the potential is $\tfrac12 k x^{2}$. The rest is kinetic, so $v = \omega\sqrt{A^{2}-x^{2}}$.`,
    ],
    steps: ($) => [
      String.raw`$E = \tfrac12 k A^{2} = ${texNum($.E)}\ \mathrm{J}$`,
      String.raw`$v = \omega\sqrt{A^{2}-x^{2}} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        s.m = $.m;
        s.k = $.k;
        s.A = $.A;
        s.hang = 'flat';
        s.t = Math.acos($.x / $.A) / Math.sqrt($.k / $.m);
      },
      read: (c) => ({ E: c.E, v: Math.abs(c.v) }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.2, energy of the §15.1 block', {
        m: 2, k: 32, A: 0.02, x: 0.01,
      }, { E: 0.0064, v: 0.06928 }, {
        note: 'Section 15.2 states the energy method and does not print this case. The mass, spring, and amplitude are the block in §15.1. The displacement 0.0100 m is ours.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.vertical',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Where a hanging spring rests',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: {
      m: range(0.4, 5, 0.1, 'kg'),
      k: range(10, 80, 1, 'N/m'),
    },
    derive: ($) => ({ shift: verticalShift($.m, $.k, G) }),
    second: ($) => ({ shift: ($.m * G) / $.k }),
    text: (T) => `A ${T.m} kg block hangs from a spring of constant ${T.k} N/m. Take g = ${G} m/s². How far below the unstretched position is the new equilibrium?`,
    parts: [
      num('shift', ($) => $.shift, 'm', { label: 'equilibrium shift' }),
    ],
    hints: [
      'At the new rest point the spring force equals the weight.',
      String.raw`The shift is $mg/k$. The period about that point is still $2\pi\sqrt{m/k}$.`,
    ],
    steps: ($) => [
      String.raw`$\delta = mg/k = ${texNum($.shift)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'hang',
      setup: (s, $) => { s.m = $.m; s.k = $.k; s.A = 0.02; s.t = 0; s.hang = 'hang'; },
      read: (c) => ({ shift: c.shift }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, the block’s spring hung vertically', {
        m: 2, k: 32,
      }, { shift: 0.6131 }, {
        note: 'The section describes the shift and does not print it. These are the §15.1 block and spring, with g = 9.81 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.pendulum-g',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'g from a pendulum',
    topics: ['pendulum'],
    lab: 'pendulum',
    vars: {
      L: range(0.4, 2, 0.01, 'm'),
      T: range(1, 3, 0.01, 's'),
    },
    derive: ($) => ({ g: gravityFromPendulum($.L, $.T) }),
    second: ($) => ({ g: (4 * Math.PI * Math.PI * $.L) / ($.T * $.T) }),
    text: (T) => `A simple pendulum of length ${T.L} m has a measured small-angle period of ${T.T} s. Find g.`,
    parts: [
      num('g', ($) => $.g, 'm/s²', { label: 'g' }),
    ],
    hints: [
      String.raw`For a small angle, $T = 2\pi\sqrt{L/g}$.`,
      String.raw`Solve for g: $g = 4\pi^{2} L / T^{2}$.`,
    ],
    steps: ($) => [
      String.raw`$g = 4\pi^{2} L / T^{2} = ${texNum($.g)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'gravity',
      setup: (s, $) => { s.L = $.L; s.Tmeas = $.T; s.theta = 5 * DEG; s.kind = 'simple'; },
      read: (c) => ({ g: c.gMeas }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.4, "Measuring Acceleration due to Gravity by the Period of a Pendulum"', {
        L: 0.75, T: 1.7357,
      }, { g: 9.8281 }, {
        note: 'The length is 75.000 cm. The section prints g = 9.8281 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.skyscraper',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'Length of a tower damper',
    topics: ['damper', 'physical'],
    lab: 'skyscraper-damper',
    vars: {
      f: range(0.25, 1.2, 0.05, 'Hz'),
      m: range(20000, 200000, 10000, 'kg'),
    },
    derive: ($) => ({ L: tunedDamperLength($.f, G) }),
    second: ($) => {
      const T = 1 / $.f;
      return { L: (3 * G * T * T) / (8 * Math.PI * Math.PI) };
    },
    text: (T) => `A building sways at ${T.f} Hz. A uniform beam of mass ${T.m} kg hangs as a physical pendulum from one end, tuned to that frequency. Take g = ${G} m/s². How long is the beam?`,
    parts: [
      num('L', ($) => $.L, 'm', { label: 'length' }),
    ],
    hints: [
      String.raw`About one end, $I = ML^{2}/3$ and the center of mass is at $L/2$, so $T = 2\pi\sqrt{2L/(3g)}$.`,
      'The mass cancels. The period is 1/f, and the length follows 1/f².',
    ],
    steps: ($) => [
      String.raw`$L = 3g/(8\pi^{2} f^{2}) = ${texNum($.L)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.f = $.f; s.m = $.m; s.t = 0; },
      read: (c) => ({ L: c.L }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.4, "Reducing the Swaying of a Skyscraper"', {
        f: 0.5, m: 1e5,
      }, { L: 1.49 }, {
        note: 'The section prints 1.49 m for 0.50 Hz and a 100 metric ton beam. The mass cancels. This bank uses g = 9.81 m/s². The print grades.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.torsion',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'Torsion constant of a string',
    topics: ['torsion'],
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      L: range(0.15, 0.6, 0.05, 'm'),
      T: range(0.3, 1.5, 0.1, 's'),
    },
    derive: ($) => ({ kappa: torsionConstant(inertiaRodCenter($.m, $.L), $.T) }),
    second: ($) => {
      const I = ($.m * $.L * $.L) / 12;
      const w = (2 * Math.PI) / $.T;
      return { kappa: I * w * w };
    },
    text: (T) => `A uniform rod of mass ${T.m} kg and length ${T.L} m hangs from a string at its center. Twisted and released, it has period ${T.T} s. Find the torsion constant of the string.`,
    parts: [
      num('kappa', ($) => $.kappa, 'N·m', { label: 'torsion constant' }),
    ],
    hints: [
      String.raw`The rod turns about its center, so $I = ML^{2}/12$.`,
      String.raw`$T = 2\pi\sqrt{I/\kappa}$, so $\kappa = I(2\pi/T)^{2}$.`,
    ],
    steps: ($) => [
      String.raw`$\kappa = I\omega^{2} = ${texNum($.kappa)}\ \mathrm{N\cdot m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.4, "Measuring the Torsion Constant of a String"', {
        m: 4, L: 0.3, T: 0.5,
      }, { kappa: 4.73 }, {
        note: 'The section prints 4.73 N·m for a 4.00 kg rod, 0.30 m long, with period 0.50 s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.damped',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.5',
    title: 'An underdamped ring-down',
    topics: ['damping'],
    lab: 'resonance',
    vars: {
      m: range(0.5, 2, 0.1, 'kg'),
      k: range(40, 160, 10, 'N/m'),
      b: range(0.4, 3, 0.2, 'kg/s'),
      A0: range(0.02, 0.1, 0.01, 'm'),
      t: range(0.1, 1.5, 0.1, 's'),
    },
    derive: ($) => {
      const motion = underdampedMotion({ A0: $.A0, mass: $.m, k: $.k, b: $.b, t: $.t });
      return { envelope: motion.envelope, omegaD: motion.omega };
    },
    second: ($) => {
      const gamma = $.b / (2 * $.m);
      const omegaD = Math.sqrt($.k / $.m - gamma * gamma);
      return { envelope: $.A0 * Math.exp(-gamma * $.t), omegaD };
    },
    text: (T) => `A ${T.m} kg block on a spring of constant ${T.k} N/m is underdamped, with damping constant ${T.b} kg/s. It is released from rest at ${T.A0} m. Find the envelope and the oscillation frequency at t = ${T.t} s.`,
    parts: [
      num('envelope', ($) => $.envelope, 'm', { ...small, label: 'envelope' }),
      num('omegaD', ($) => $.omegaD, 'rad/s', { label: 'damped angular frequency' }),
    ],
    hints: [
      String.raw`The envelope is $A_0 e^{-bt/(2m)}$.`,
      String.raw`$\omega = \sqrt{\omega_0^{2} - (b/(2m))^{2}}$, with $\omega_0 = \sqrt{k/m}$.`,
    ],
    steps: ($) => [
      String.raw`$A(t) = ${texNum($.envelope)}\ \mathrm{m}$`,
      String.raw`$\omega = ${texNum($.omegaD)}\ \mathrm{rad/s}$`,
    ],
    sim: {
      scenario: 'light',
      setup: (s, $) => {
        s.m = $.m;
        s.k = $.k;
        s.b = $.b;
        s.A0 = $.A0;
        s.t = $.t;
        s.F0 = 1;
        s.omega = Math.sqrt($.k / $.m);
      },
      read: (c) => ({ envelope: c.envelope, omegaD: c.omegaD }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.5, an underdamped release', {
        m: 1, k: 100, b: 2, A0: 0.05, t: 0.4,
      }, { envelope: 0.03352, omegaD: 9.95 }, {
        note: 'Section 15.5 states the underdamped solution and does not print a numerical case. These values are computed from that solution.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.driven',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §15.6',
    title: 'Steady amplitude and lag',
    topics: ['resonance'],
    lab: 'resonance',
    vars: {
      m: range(0.5, 2, 0.1, 'kg'),
      k: range(40, 160, 10, 'N/m'),
      b: range(0.4, 2, 0.1, 'kg/s'),
      F0: range(0.5, 4, 0.1, 'N'),
      w: range(2, 20, 0.5, 'rad/s'),
    },
    derive: ($) => ({
      A: drivenAmplitude({ F0: $.F0, mass: $.m, k: $.k, b: $.b, omega: $.w }),
      lag: drivenLag($.m, $.k, $.b, $.w),
      Amax: resonanceAmplitude($.F0, $.b, springOmega($.m, $.k)),
    }),
    second: ($) => {
      const w0 = Math.sqrt($.k / $.m);
      const delta = w0 * w0 - $.w * $.w;
      const A = $.F0 / Math.sqrt($.m * $.m * delta * delta + $.b * $.b * $.w * $.w);
      const phi = Math.atan2(-$.b * $.w, $.k - $.m * $.w * $.w);
      let lag = -phi;
      if (lag < 0) lag += 2 * Math.PI;
      if (lag > Math.PI + 1e-12) lag -= 2 * Math.PI;
      return { A, lag, Amax: $.F0 / ($.b * w0) };
    },
    text: (T) => `A ${T.m} kg block on a spring of constant ${T.k} N/m has damping constant ${T.b} kg/s. A drive of amplitude ${T.F0} N runs at angular frequency ${T.w} rad/s. Find the steady amplitude, the phase lag behind the drive, and the amplitude the same drive would have at the natural frequency.`,
    parts: [
      num('A', ($) => $.A, 'm', { ...small, label: 'steady amplitude' }),
      num('lag', ($) => $.lag, 'rad', { label: 'phase lag' }),
      num('Amax', ($) => $.Amax, 'm', { ...small, label: 'amplitude at the natural frequency' }),
    ],
    hints: [
      String.raw`$A = F_0 / \sqrt{m^{2}(\omega_0^{2}-\omega^{2})^{2} + b^{2}\omega^{2}}$.`,
      String.raw`At $\omega_0$ that amplitude is $F_0/(b\omega_0)$. The lag is $\pi/2$ there, and it is not $\pi/2$ off resonance.`,
    ],
    steps: ($) => [
      String.raw`$A = ${texNum($.A)}\ \mathrm{m}$, lag $= ${texNum($.lag)}\ \mathrm{rad}$`,
      String.raw`$A(\omega_0) = F_0/(b\omega_0) = ${texNum($.Amax)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'light',
      setup: (s, $) => {
        s.m = $.m;
        s.k = $.k;
        s.b = $.b;
        s.F0 = $.F0;
        s.omega = $.w;
        s.A0 = 0.05;
        s.t = 0;
      },
      read: (c) => ({ A: c.A, lag: c.lag, Amax: c.Amax }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.6, driven on resonance', {
        m: 1, k: 100, b: 0.5, F0: 2, w: 10,
      }, { A: 0.4, lag: 1.5708, Amax: 0.4 }, {
        note: 'Section 15.6 states the steady amplitude and does not print this case. On resonance the lag is π/2 and A = F₀/(b ω₀).',
      }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch15.concept-period',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'What changes the period',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: {
      q: choice(
        [1, 'A block on a spring has its amplitude doubled. The period:'],
        [2, 'The mass is doubled and the spring is left alone. The period:'],
        [3, 'The same spring is hung vertically, and the amplitude is unchanged. The period:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'longer', 3: 'same' }[$.q] }),
    second: ($) => {
      const flat = springPeriod(2, 32);
      if ($.q === 1) return { ans: flat === springPeriod(2, 32) ? 'same' : 'longer' };
      if ($.q === 2) return { ans: springPeriod(4, 32) > flat ? 'longer' : 'same' };
      return { ans: 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['same', 'stays the same', 'Amplitude is not in T = 2π√(m/k). Hanging the spring moves the equilibrium and leaves the period alone.'],
        ['longer', 'gets longer', 'T grows as √m. Twice the mass multiplies the period by √2.'],
        ['shorter', 'gets shorter', 'Neither a larger amplitude nor hanging the spring shortens the period.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`Write $T = 2\pi\sqrt{m/k}$ and see which change is in it.`,
      'Gravity shifts the rest point of a hanging spring. It does not change k or m.',
    ],
    steps: () => ['The period follows the mass and the spring constant. Amplitude and the equilibrium shift stay out of it.'],
    sim: { scenario: 'book', setup: (s) => { s.m = 2; s.k = 32; s.A = 0.02; s.hang = 'flat'; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, amplitude and a hanging spring', { q: 1 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch15.concept-phase',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Radians, ω, and f',
    topics: ['shm'],
    lab: 'spring-mass',
    vars: {
      q: choice(
        [1, 'Angular frequency and ordinary frequency are related by:'],
        [2, 'The argument of cos(ωt + φ) must be entered in:'],
        [3, 'A calculator left in degree mode, given ωt in radians, returns:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'two-pi', 2: 'radians', 3: 'wrong' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: Math.abs(springOmega(2, 32) / (1 / springPeriod(2, 32)) - 2 * Math.PI) < 1e-9 ? 'two-pi' : 'same' };
      if ($.q === 2) return { ans: 'radians' };
      return { ans: 'wrong' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['two-pi', 'ω = 2πf', 'One cycle is 2π radians, so the angular frequency is 2π times the frequency in hertz.'],
        ['radians', 'radians', 'The calculus derivatives of sine and cosine assume radians. Degree mode answers a different function.'],
        ['wrong', 'the wrong number', 'Degree mode treats a radian measure as if it were degrees, so the sine and cosine are not the motion.'],
        ['same', 'ω = f', 'That drops the 2π. The period would then be off by 2π.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Count how many radians there are in one cycle.',
      'The derivative of cos(θ) is −sin(θ) only when θ is in radians.',
    ],
    steps: () => ['ω = 2πf, and the phase in x = A cos(ωt + φ) is in radians.'],
    sim: { scenario: 'book', setup: (s) => { s.m = 2; s.k = 32; s.A = 0.02; s.t = 0.2; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.1, the block’s ω = 4.00 rad/s and f = 0.637 Hz', { q: 1 }, { ans: 'two-pi' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch15.concept-pendulum',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'What a pendulum’s period depends on',
    topics: ['pendulum'],
    lab: 'pendulum',
    vars: {
      q: choice(
        [1, 'The bob is replaced by one of twice the mass, at the same length and small angle. The period:'],
        [2, 'The string is made twice as long, still at a small angle. The period:'],
        [3, 'The release is opened from 5° to 60°, at the same length. The exact period:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'longer', 3: 'longer' }[$.q] }),
    second: ($) => {
      const L = 0.75;
      if ($.q === 1) return { ans: 'same' };
      if ($.q === 2) return { ans: pendulumPeriod(2 * L) > pendulumPeriod(L) ? 'longer' : 'same' };
      return { ans: pendulumPeriodExact(L, 60 * DEG) > pendulumPeriodExact(L, 5 * DEG) ? 'longer' : 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['same', 'stays the same', 'Mass is not in T = 2π√(L/g). A heavier bob has more inertia and more restoring force, in the same ratio.'],
        ['longer', 'gets longer', 'The small-angle period grows as √L. A large angle also lengthens the exact period.'],
        ['shorter', 'gets shorter', 'A longer string and a larger angle do not shorten the period. Mass does not change it.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`For a small angle, $T = 2\pi\sqrt{L/g}$. Look for m in that formula.`,
      'The exact period is longer than the small-angle period once the angle is tens of degrees.',
    ],
    steps: () => ['Small-angle period: length and g. Mass cancels. A large angle adds a longer exact period.'],
    sim: { scenario: 'gravity', setup: (s) => { s.L = 0.75; s.theta = 5 * DEG; s.kind = 'simple'; s.Tmeas = 1.7357; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.4, mass is absent from the small-angle period', { q: 1 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch15.concept-resonance',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §15.6',
    title: 'Damping and the resonance peak',
    topics: ['damping', 'resonance'],
    lab: 'resonance',
    vars: {
      q: choice(
        [1, 'A drive stays on the natural frequency and the damping is reduced. The steady amplitude:'],
        [2, 'Which free motion returns to equilibrium fastest without oscillating?'],
        [3, 'For light damping, the steady amplitude is largest when the drive is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'taller', 2: 'critical', 3: 'near' }[$.q] }),
    second: ($) => {
      const tall = drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 0.4, omega: 10 });
      const short = drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 2, omega: 10 });
      if ($.q === 1) return { ans: tall > short ? 'taller' : 'shorter' };
      if ($.q === 2) return { ans: Math.abs(criticalDamping(1, 100) - 20) < 1e-6 ? 'critical' : 'over' };
      const near = drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 0.5, omega: 10 });
      const far = drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 0.5, omega: 4 });
      return { ans: near > far ? 'near' : 'far' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['taller', 'grows', 'On resonance, A = F₀/(b ω₀). Less damping is a taller peak.'],
        ['shorter', 'shrinks', 'Less damping does not shrink the peak. More damping does.'],
        ['critical', 'critical damping', 'Critical damping is the smallest b that does not oscillate, and it returns sooner than a heavier damping.'],
        ['near', 'near the natural frequency', 'The peak of the steady amplitude sits at ω₀ when damping is light, and only slightly below it otherwise.'],
        ['far', 'far above the natural frequency', 'Far above ω₀ the amplitude falls toward zero. That is not the peak.'],
        ['over', 'heavy overdamping', 'Overdamping returns without oscillating, and more slowly than critical damping.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`On resonance, $A = F_0/(b\omega_0)$.`,
      'Critical damping is b = 2√(mk). Below that, the motion still oscillates. Above it, the return is slower.',
    ],
    steps: () => ['Less damping, taller peak, near ω₀. Critical damping is the quick return that does not oscillate.'],
    sim: { scenario: 'light', setup: (s) => { s.m = 1; s.k = 100; s.b = 0.5; s.F0 = 2; s.omega = 10; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §15.6, the peak near the natural frequency', { q: 3 }, { ans: 'near' }),
    ],
  }),
];
