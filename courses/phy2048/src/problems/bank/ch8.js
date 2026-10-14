/** Ch 8 · Potential energy and conservation. OpenStax University Physics Vol. 1, §§8.1 and 8.3. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { gravitationalEnergy, speedFromEnergy, springEnergy } from '@flux/subjects/mechanics/energy.js';
import { speedFromDisplacement } from '@flux/subjects/mechanics/kinematics.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u3', ch: '8' };
const DEG = Math.PI / 180;

/** Positive root of (1/2) k x² = mg(h + x). */
function compression($) {
  const mg = $.m * G;
  return (mg + Math.sqrt(mg * mg + 2 * $.k * mg * $.h)) / $.k;
}

/** Same root by bisection, so the check is not a second copy of the quadratic. */
function compressionBisect($) {
  const f = (x) => springEnergy($.k, x) - gravitationalEnergy($.m, G, $.h + x);
  let lo = 0;
  let hi = 0.05;
  while (f(hi) <= 0 && hi < 1e6) hi *= 2;
  for (let i = 0; i < 70; i++) {
    const mid = 0.5 * (lo + hi);
    if (f(mid) <= 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

export default [
  problem({
    ...U,
    id: 'ch8.drop',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Drop, by energy',
    topics: ['energy', 'gravity'],
    vars: {
      m: range(0.2, 8, 0.2, 'kg'),
      h: range(1, 25, 0.5, 'm'),
    },
    derive: ($) => {
      const U0 = gravitationalEnergy($.m, G, $.h);
      return { U0, v: speedFromEnergy({ mass: $.m, u0: U0 }) };
    },
    second: ($) => ({
      U0: $.m * G * $.h,
      v: speedFromDisplacement(0, G, $.h),
    }),
    text: (T) => `A ${T.m} kg object is dropped from rest through a height of ${T.h} m. Take g = ${G} m/s², set the potential energy to zero at the bottom, and ignore air resistance. Find the potential energy at the top and the speed at the bottom.`,
    parts: [
      num('U0', ($) => $.U0, 'J', { label: 'potential energy at the top' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed at the bottom' }),
    ],
    hints: [
      String.raw`The lost potential energy $mgh$ becomes kinetic energy. The speed is $\sqrt{2gh}$, so the mass cancels.`,
    ],
    steps: ($) => [
      String.raw`$U = mgh = ${texNum($.U0)}\ \mathrm{J}$`,
      String.raw`$v = \sqrt{2gh} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 2, h: 5 }, { U0: 98.1, v: 9.90454 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.spring',
    src: 'OpenStax University Physics Vol. 1 §8.1',
    title: 'A spring released from rest',
    topics: ['energy', 'spring'],
    vars: {
      m: range(0.2, 4, 0.2, 'kg'),
      k: range(20, 400, 10, 'N/m'),
      x: range(0.02, 0.4, 0.02, 'm'),
    },
    derive: ($) => {
      const Us = springEnergy($.k, $.x);
      return { Us, v: speedFromEnergy({ mass: $.m, u0: Us }) };
    },
    second: ($) => ({
      Us: 0.5 * $.k * $.x * $.x,
      v: Math.abs($.x) * Math.sqrt($.k / $.m),
    }),
    text: (T) => `A spring of constant ${T.k} N/m is stretched ${T.x} m from its relaxed length and holds a ${T.m} kg mass at rest. The other end of the spring is fixed, and the surface is frictionless. Find the potential energy in the spring, and the speed of the mass as it passes the relaxed length.`,
    parts: [
      num('Us', ($) => $.Us, 'J', { label: 'spring energy' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed at the relaxed length' }),
    ],
    hints: [
      String.raw`The spring energy is $\frac{1}{2}kx^2$. At the relaxed length that energy is all kinetic, so $v = |x|\sqrt{k/m}$.`,
    ],
    steps: ($) => [
      String.raw`$U_s = \frac{1}{2}kx^2 = ${texNum($.Us)}\ \mathrm{J}$`,
      String.raw`$v = |x|\sqrt{k/m} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 0.5, k: 200, x: 0.1 }, { Us: 1, v: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.slide',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Frictionless slide',
    topics: ['energy', 'incline'],
    vars: {
      m: range(0.5, 8, 0.5, 'kg'),
      h: range(0.5, 12, 0.5, 'm'),
      theta: range(20, 50, 5, '°'),
    },
    derive: ($) => {
      const U0 = gravitationalEnergy($.m, G, $.h);
      return { U0, v: speedFromEnergy({ mass: $.m, u0: U0 }) };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const a = G * Math.sin(th);
      const s = $.h / Math.sin(th);
      return { U0: $.m * G * $.h, v: Math.sqrt(2 * a * s) };
    },
    text: (T) => `A ${T.m} kg block starts from rest and slides down a frictionless incline of height ${T.h} m. The incline makes an angle of ${T.theta}° with the horizontal. Take g = ${G} m/s² and set the potential energy to zero at the bottom. Find the potential energy at the top and the speed at the bottom.`,
    parts: [
      num('U0', ($) => $.U0, 'J', { label: 'potential energy at the top' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed at the bottom' }),
    ],
    hints: [
      String.raw`The speed follows from $mgh = \frac{1}{2}mv^2$. The angle changes the path length and the acceleration together, so it cancels: $v = \sqrt{2gh}$.`,
    ],
    steps: ($) => [
      String.raw`$U = mgh = ${texNum($.U0)}\ \mathrm{J}$`,
      String.raw`$v = \sqrt{2gh} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 3, h: 4, theta: 30 }, { U0: 117.72, v: 8.85889 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.springboard',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Falling onto a spring',
    topics: ['energy', 'spring'],
    vars: {
      m: range(0.2, 4, 0.2, 'kg'),
      h: range(0.2, 2, 0.1, 'm'),
      k: range(40, 400, 10, 'N/m'),
    },
    derive: ($) => {
      const x = compression($);
      return { x, U: springEnergy($.k, x) };
    },
    second: ($) => {
      const x = compressionBisect($);
      return { x, U: $.m * G * ($.h + x) };
    },
    text: (T) => `A ${T.m} kg mass is released from rest a height ${T.h} m above the top of a relaxed vertical spring. The spring constant is ${T.k} N/m. Take g = ${G} m/s² and ignore friction. Find how far the spring is compressed at the lowest point, and the energy stored in the spring there.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: 'compression', abs: 0.002 }),
      num('U', ($) => $.U, 'J', { label: 'spring energy at the bottom' }),
    ],
    hints: [
      String.raw`Set the gravitational energy to zero at the lowest point. Then $mg(h+x) = \frac{1}{2}kx^2$. Take the positive root.`,
    ],
    steps: ($) => [
      String.raw`$\frac{1}{2}kx^2 = mg(h+x)$, so $x = ${texNum($.x)}\ \mathrm{m}$`,
      String.raw`$U_s = \frac{1}{2}kx^2 = ${texNum($.U)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { m: 1, h: 0.5, k: 200 }, { x: 0.275889, U: 7.61147 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch8.pendulum',
    src: 'OpenStax University Physics Vol. 1 §8.3',
    title: 'Pendulum released from rest',
    topics: ['energy', 'pendulum'],
    vars: {
      m: range(0.2, 5, 0.2, 'kg'),
      L: range(0.4, 3, 0.1, 'm'),
      theta: range(15, 75, 5, '°'),
    },
    derive: ($) => {
      const h = $.L * (1 - Math.cos($.theta * DEG));
      const U0 = gravitationalEnergy($.m, G, h);
      return { h, U0, v: speedFromEnergy({ mass: $.m, u0: U0 }) };
    },
    second: ($) => {
      const half = ($.theta * DEG) / 2;
      const h = 2 * $.L * Math.sin(half) * Math.sin(half);
      return { h, U0: $.m * G * h, v: speedFromDisplacement(0, G, h) };
    },
    text: (T) => `A pendulum bob of mass ${T.m} kg hangs from a string of length ${T.L} m. It is released from rest at ${T.theta}° from the vertical. Take g = ${G} m/s² and set the potential energy to zero at the bottom. Find the height of the release point above the bottom, the potential energy there, and the speed at the bottom.`,
    parts: [
      num('h', ($) => $.h, 'm', { label: 'height of the release' }),
      num('U0', ($) => $.U0, 'J', { label: 'potential energy' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed at the bottom' }),
    ],
    hints: [
      String.raw`The bob drops a height $L(1-\cos\theta)$. That potential energy becomes $\frac{1}{2}mv^2$ at the bottom.`,
    ],
    steps: ($) => [
      String.raw`$h = L(1-\cos\theta) = ${texNum($.h)}\ \mathrm{m}$, so $U = mgh = ${texNum($.U0)}\ \mathrm{J}$`,
      String.raw`$v = \sqrt{2gh} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 1, L: 2, theta: 60 }, { h: 1, U0: 9.81, v: 4.42945 }),
    ],
  }),
];
