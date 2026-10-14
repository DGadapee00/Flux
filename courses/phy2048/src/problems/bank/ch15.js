/** Ch 15 · Oscillations. OpenStax University Physics Vol. 1, §§15.1–15.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { speedFromEnergy, springEnergy } from '@flux/subjects/mechanics/energy.js';
import { inertiaPoint, inertiaRodEnd } from '@flux/subjects/mechanics/rotation.js';
import {
  pendulumPeriod, physicalPendulumPeriod, shm, shmEnergy, springOmega, springPeriod,
} from '@flux/subjects/mechanics/oscillation.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u8', ch: '15' };

export default [
  problem({
    ...U,
    id: 'ch15.spring',
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Period of a mass on a spring',
    topics: ['shm', 'spring'],
    vars: {
      m: range(0.1, 4, 0.1, 'kg'),
      k: range(10, 400, 10, 'N/m'),
    },
    derive: ($) => ({
      w: springOmega($.m, $.k),
      T: springPeriod($.m, $.k),
    }),
    second: ($) => {
      const w = Math.sqrt($.k / $.m);
      return { w, T: (2 * Math.PI) / w };
    },
    text: (T) => `A ${T.m} kg mass is attached to a spring of constant ${T.k} N/m. The surface is frictionless. Find the angular frequency and the period.`,
    parts: [
      num('w', ($) => $.w, 'rad/s', { label: 'angular frequency' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      String.raw`$\omega = \sqrt{k/m}$ and $T = 2\pi/\omega$.`,
    ],
    steps: ($) => [
      String.raw`$\omega = \sqrt{k/m} = ${texNum($.w)}\ \mathrm{rad/s}$`,
      String.raw`$T = 2\pi/\omega = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { m: 0.5, k: 200 }, { w: 20, T: Math.PI / 10 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.shm',
    src: 'OpenStax University Physics Vol. 1 §15.1',
    title: 'Position and velocity in SHM',
    topics: ['shm'],
    vars: {
      A: range(0.02, 0.3, 0.01, 'm'),
      w: range(0.5, 8, 0.5, 'rad/s'),
      t: range(0, 4, 0.25, 's'),
    },
    derive: ($) => {
      const at = shm({ A: $.A, omega: $.w, phi: 0, t: $.t });
      return { x: at.x, v: at.v, a: at.a };
    },
    second: ($) => {
      const phase = $.w * $.t;
      const x = $.A * Math.cos(phase);
      return { x, v: -$.A * $.w * Math.sin(phase), a: -$.w * $.w * x };
    },
    text: (T) => `A particle in simple harmonic motion has amplitude ${T.A} m and angular frequency ${T.w} rad/s. The phase is zero, so x = A at t = 0. Find the position, velocity, and acceleration at t = ${T.t} s.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: 'position' }),
      num('v', ($) => $.v, 'm/s', { label: 'velocity' }),
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
    ],
    hints: [
      String.raw`$x = A\cos(\omega t)$. The velocity is the time derivative, $-A\omega\sin(\omega t)$, and $a = -\omega^2 x$.`,
    ],
    steps: ($) => [
      String.raw`$x = ${texNum($.x)}\ \mathrm{m}$, $v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$a = -\omega^2 x = ${texNum($.a)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { A: 0.1, w: 2, t: Math.PI / 6 }, { x: 0.05, v: -0.173205, a: -0.2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.energy',
    src: 'OpenStax University Physics Vol. 1 §15.2',
    title: 'Energy of a spring oscillator',
    topics: ['shm', 'energy'],
    vars: {
      m: range(0.2, 3, 0.1, 'kg'),
      k: range(20, 400, 10, 'N/m'),
      A: range(0.05, 0.3, 0.01, 'm'),
      x: range(0, 0.2, 0.01, 'm'),
    },
    derive: ($) => {
      const E = shmEnergy($.k, $.A);
      const v = speedFromEnergy({ mass: $.m, u0: E, u: springEnergy($.k, $.x) });
      return { E, v };
    },
    second: ($) => {
      const E = 0.5 * $.k * $.A * $.A;
      const w = Math.sqrt($.k / $.m);
      return { E, v: w * Math.sqrt($.A * $.A - $.x * $.x) };
    },
    valid: ($) => $.A > $.x + 0.02,
    text: (T) => `A ${T.m} kg mass on a spring of constant ${T.k} N/m oscillates with amplitude ${T.A} m. Find the total energy, and the speed as the mass passes x = ${T.x} m. Measure x from the relaxed length.`,
    parts: [
      num('E', ($) => $.E, 'J', { label: 'total energy' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
    ],
    hints: [
      String.raw`The total energy is $\frac{1}{2}kA^2$. At displacement $x$ the spring holds $\frac{1}{2}kx^2$, and the rest is kinetic.`,
    ],
    steps: ($) => [
      String.raw`$E = \frac{1}{2}kA^2 = ${texNum($.E)}\ \mathrm{J}$`,
      String.raw`$v = \omega\sqrt{A^2-x^2} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 0.5, k: 200, A: 0.1, x: 0.06 }, { E: 1, v: 1.6 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.pendulum',
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'Simple pendulum',
    topics: ['pendulum'],
    vars: {
      L: range(0.2, 3, 0.1, 'm'),
    },
    derive: ($) => ({ T: pendulumPeriod($.L, G) }),
    second: ($) => ({
      T: physicalPendulumPeriod(inertiaPoint(1, $.L), 1, $.L, G),
    }),
    text: (T) => `A simple pendulum has length ${T.L} m. The angle stays small. Take g = ${G} m/s². Find the period.`,
    parts: [
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      String.raw`For a small angle, $T = 2\pi\sqrt{L/g}$. The mass cancels.`,
    ],
    steps: ($) => [
      String.raw`$T = 2\pi\sqrt{L/g} = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { L: 1 }, { T: 2.00607 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch15.rod',
    src: 'OpenStax University Physics Vol. 1 §15.4',
    title: 'A rod swinging about one end',
    topics: ['pendulum', 'physical'],
    vars: {
      m: range(0.2, 5, 0.2, 'kg'),
      L: range(0.3, 2.5, 0.1, 'm'),
    },
    derive: ($) => ({
      T: physicalPendulumPeriod(inertiaRodEnd($.m, $.L), $.m, $.L / 2, G),
    }),
    second: ($) => ({
      T: 2 * Math.PI * Math.sqrt((2 * $.L) / (3 * G)),
    }),
    text: (T) => `A uniform rod of mass ${T.m} kg and length ${T.L} m swings about a perpendicular axis through one end. The angle stays small. Take g = ${G} m/s². Find the period.`,
    parts: [
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      String.raw`The moment about the end is $\frac{1}{3}mL^2$, and the center of mass is $L/2$ from the pivot. Then $T = 2\pi\sqrt{2L/(3g)}$. The mass cancels.`,
    ],
    steps: ($) => [
      String.raw`$T = 2\pi\sqrt{2L/(3g)} = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { m: 2, L: 1.2 }, { T: 1.79428 }),
    ],
  }),
];
