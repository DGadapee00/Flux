/** Ch 13 · Gravitation. OpenStax University Physics Vol. 1, §§13.1–13.4. */
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import {
  GRAV, circularOrbitEnergy, circularOrbitPeriod, circularOrbitSpeed, escapeSpeed, gravityField,
  gravityForce,
} from '@flux/subjects/mechanics/gravitation.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u7', ch: '13' };

const [mant, exp] = GRAV.toExponential().split('e');
const GTEX = String.raw`$G = ${mant}\times 10^{${Number(exp)}}$ N·m²/kg²`;

export default [
  problem({
    ...U,
    id: 'ch13.force',
    src: 'OpenStax University Physics Vol. 1 §13.1',
    title: 'Force between two masses',
    topics: ['gravitation'],
    vars: {
      m1: range(2e4, 2e5, 2e4, 'kg'),
      m2: range(2e4, 2e5, 2e4, 'kg'),
      r: range(0.5, 5, 0.5, 'm'),
    },
    derive: ($) => ({ F: gravityForce($.m1, $.m2, $.r) }),
    second: ($) => ({ F: (GRAV * $.m1 * $.m2) / ($.r * $.r) }),
    text: (T) => `Two spheres, of mass ${T.m1} kg and ${T.m2} kg, are ${T.r} m apart. Take ${GTEX}. Find the magnitude of the gravitational force between them.`,
    parts: [
      num('F', ($) => $.F, 'N', { label: 'force' }),
    ],
    hints: [
      String.raw`Newton's law is $F = Gm_1 m_2/r^2$. The force is attractive, and this part asks for the magnitude.`,
    ],
    steps: ($) => [
      String.raw`$F = Gm_1 m_2/r^2 = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m1: 1e5, m2: 1e5, r: 2 }, { F: 0.1668575 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.field',
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'Field at the surface of a sphere',
    topics: ['gravitation', 'field'],
    vars: {
      M: range(1e24, 8e24, 1e23, 'kg'),
      R: range(3e6, 8e6, 1e5, 'm'),
    },
    derive: ($) => ({ g: gravityField($.M, $.R) }),
    second: ($) => ({ g: (GRAV * $.M) / ($.R * $.R) }),
    text: (T) => `A uniform sphere has mass ${T.M} kg and radius ${T.R} m. Take ${GTEX}. Find the gravitational field at the surface.`,
    parts: [
      num('g', ($) => $.g, 'm/s²', { label: 'field' }),
    ],
    hints: [
      String.raw`Outside a uniform sphere the field is $GM/r^2$, with $r$ measured from the center. At the surface, $r$ is the radius.`,
    ],
    steps: ($) => [
      String.raw`$g = GM/R^2 = ${texNum($.g)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { M: 5.97e24, R: 6.37e6 }, { g: 9.81977 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.orbit',
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'Circular orbit',
    topics: ['gravitation', 'orbit'],
    vars: {
      M: range(1e24, 8e24, 1e23, 'kg'),
      r: range(6.5e6, 2e7, 5e5, 'm'),
    },
    derive: ($) => ({
      v: circularOrbitSpeed($.M, $.r),
      T: circularOrbitPeriod($.M, $.r),
    }),
    second: ($) => {
      const v = Math.sqrt((GRAV * $.M) / $.r);
      return { v, T: (2 * Math.PI * $.r) / v };
    },
    text: (T) => `A satellite is in a circular orbit of radius ${T.r} m about a body of mass ${T.M} kg. Take ${GTEX}. Find the orbital speed and the period.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'orbital speed' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      String.raw`Gravity supplies the centripetal acceleration: $v^2/r = GM/r^2$. The period is the circumference divided by that speed.`,
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{GM/r} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$T = 2\pi r/v = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { M: 5.97e24, r: 7e6 }, { v: 7544.68, T: 5829.58 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.escape',
    src: 'OpenStax University Physics Vol. 1 §13.3',
    title: 'Escape speed and circular-orbit speed',
    topics: ['gravitation', 'escape'],
    vars: {
      M: range(1e24, 8e24, 1e23, 'kg'),
      r: range(3e6, 1.2e7, 1e5, 'm'),
    },
    derive: ($) => ({
      vesc: escapeSpeed($.M, $.r),
      vorb: circularOrbitSpeed($.M, $.r),
    }),
    second: ($) => {
      const vorb = Math.sqrt((GRAV * $.M) / $.r);
      return { vorb, vesc: vorb * Math.SQRT2 };
    },
    text: (T) => `A body of mass ${T.M} kg is the center of a launch, a distance ${T.r} m from the center. Take ${GTEX}, and ignore any atmosphere. Find the escape speed from that distance, and the speed of a circular orbit there.`,
    parts: [
      num('vesc', ($) => $.vesc, 'm/s', { label: 'escape speed' }),
      num('vorb', ($) => $.vorb, 'm/s', { label: 'circular-orbit speed' }),
    ],
    hints: [
      String.raw`Escape makes the total energy zero, so $\frac{1}{2}mv^2 = GMm/r$. A circular orbit needs half of that kinetic energy, so the escape speed is $\sqrt{2}$ times the orbital speed.`,
    ],
    steps: ($) => [
      String.raw`$v_{\mathrm{orb}} = \sqrt{GM/r} = ${texNum($.vorb)}\ \mathrm{m/s}$`,
      String.raw`$v_{\mathrm{esc}} = \sqrt{2}\,v_{\mathrm{orb}} = ${texNum($.vesc)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { M: 5.97e24, r: 6.37e6 }, { vesc: 11185, vorb: 7908.98 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.energy',
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'Energy of a circular orbit',
    topics: ['gravitation', 'energy'],
    vars: {
      m: range(100, 2000, 50, 'kg'),
      M: range(1e24, 8e24, 1e23, 'kg'),
      r: range(6.5e6, 2e7, 5e5, 'm'),
    },
    derive: ($) => {
      const v = circularOrbitSpeed($.M, $.r);
      return {
        E: circularOrbitEnergy($.m, $.M, $.r),
        K: kineticEnergy($.m, v),
      };
    },
    second: ($) => {
      const K = (GRAV * $.M * $.m) / (2 * $.r);
      return { K, E: -K };
    },
    text: (T) => `A ${T.m} kg satellite is in a circular orbit of radius ${T.r} m about a body of mass ${T.M} kg. Take ${GTEX}, and take the potential energy to be zero at infinity. Find the mechanical energy and the kinetic energy.`,
    parts: [
      num('E', ($) => $.E, 'J', { label: 'mechanical energy' }),
      num('K', ($) => $.K, 'J', { label: 'kinetic energy' }),
    ],
    hints: [
      String.raw`For a circular orbit, $K = GMm/(2r)$ and $U = -GMm/r$, so $E = K + U = -K$.`,
    ],
    steps: ($) => [
      String.raw`$K = GMm/(2r) = ${texNum($.K)}\ \mathrm{J}$`,
      String.raw`$E = -K = ${texNum($.E)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { m: 800, M: 5.97e24, r: 7e6 }, { E: -22768897714, K: 22768897714 }),
    ],
  }),
];
