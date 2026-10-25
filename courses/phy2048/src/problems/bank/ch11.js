/** Ch 11 · Angular momentum. OpenStax University Physics Vol. 1, §§11.1–11.3. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  angularMomentum, inertiaDisk, inertiaHoop, inertiaPoint, rollingIncline, rotationalKE,
} from '@flux/subjects/mechanics/rotation.js';
import { kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u7', ch: '11' };
const DEG = Math.PI / 180;

function faster($) {
  if (Math.abs($.aDisk - $.aHoop) <= 1e-9 * Math.max(1, Math.abs($.aDisk))) return 'same';
  return $.aDisk > $.aHoop ? 'disk' : 'hoop';
}

export default [
  problem({
    ...U,
    id: 'ch11.roll',
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'A disk rolling down an incline',
    topics: ['rolling'],
    vars: {
      m: range(0.4, 6, 0.2, 'kg'),
      R: range(0.05, 0.4, 0.05, 'm'),
      theta: range(15, 45, 5, '°'),
    },
    derive: ($) => {
      const I = inertiaDisk($.m, $.R);
      const roll = rollingIncline({ mass: $.m, radius: $.R, I, thetaDeg: $.theta, g: G });
      return { a: roll.a, alpha: roll.alpha };
    },
    second: ($) => {
      const a = (G * Math.sin($.theta * DEG)) / 1.5;
      return { a, alpha: a / $.R };
    },
    text: (T) => `A uniform disk of mass ${T.m} kg and radius ${T.R} m rolls without slipping down a ${T.theta}° incline. Take g = ${G} m/s². Find the linear acceleration down the plane and the angular acceleration about the center.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration down the plane' }),
      num('alpha', ($) => $.alpha, 'rad/s²', { label: 'angular acceleration' }),
    ],
    hints: [
      String.raw`For a disk, $I = \frac{1}{2}mR^2$, so $a = g\sin\theta / (1 + \frac{1}{2})$. No slip means $\alpha = a/R$. The mass cancels. The radius stays in $\alpha$.`,
    ],
    steps: ($) => [
      String.raw`$a = g\sin\theta / 1.5 = ${texNum($.a)}\ \mathrm{m/s}^2$`,
      String.raw`$\alpha = a/R = ${texNum($.alpha)}\ \mathrm{rad/s^2}$`,
    ],
    cases: [
      kase('hand', { m: 2, R: 0.3, theta: 30 }, { a: 3.27, alpha: 10.9 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.race',
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Hoop and disk on the same incline',
    topics: ['rolling'],
    vars: {
      m: range(0.4, 5, 0.2, 'kg'),
      R: range(0.08, 0.4, 0.02, 'm'),
      theta: range(15, 40, 5, '°'),
    },
    derive: ($) => {
      const disk = rollingIncline({
        mass: $.m, radius: $.R, I: inertiaDisk($.m, $.R), thetaDeg: $.theta, g: G,
      });
      const hoop = rollingIncline({
        mass: $.m, radius: $.R, I: inertiaHoop($.m, $.R), thetaDeg: $.theta, g: G,
      });
      return { aDisk: disk.a, aHoop: hoop.a, who: faster({ aDisk: disk.a, aHoop: hoop.a }) };
    },
    second: ($) => {
      const along = G * Math.sin($.theta * DEG);
      const aDisk = along / 1.5;
      const aHoop = along / 2;
      return { aDisk, aHoop, who: faster({ aDisk, aHoop }) };
    },
    text: (T) => `A hoop and a uniform disk have the same mass, ${T.m} kg, and the same radius, ${T.R} m. Both roll without slipping down a ${T.theta}° incline. Take g = ${G} m/s². Find each acceleration, and say which one pulls ahead.`,
    parts: [
      num('aDisk', ($) => $.aDisk, 'm/s²', { label: 'disk acceleration' }),
      num('aHoop', ($) => $.aHoop, 'm/s²', { label: 'hoop acceleration' }),
      mc('who', [
        ['disk', 'The disk'],
        ['hoop', 'The hoop'],
        ['same', 'They match'],
      ], ($) => $.who, { label: 'reaches the bottom first' }),
    ],
    hints: [
      String.raw`A hoop has $I = mR^2$, so $a = g\sin\theta / 2$. A disk has $I = \frac{1}{2}mR^2$, so its acceleration is larger. Mass and radius cancel for both.`,
    ],
    steps: ($) => [
      String.raw`$a_{\mathrm{disk}} = ${texNum($.aDisk)}\ \mathrm{m/s}^2$, $a_{\mathrm{hoop}} = ${texNum($.aHoop)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m: 1, R: 0.2, theta: 30 }, { aDisk: 3.27, aHoop: 2.4525, who: 'disk' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.spinup',
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'Angular impulse',
    topics: ['angular-momentum', 'torque'],
    vars: {
      I: range(0.1, 4, 0.1, 'kg·m²'),
      w0: range(0, 8, 0.5, 'rad/s'),
      tau: range(0.2, 6, 0.2, 'N·m'),
      dt: range(0.2, 4, 0.2, 's'),
    },
    derive: ($) => {
      const L = angularMomentum($.I, $.w0) + $.tau * $.dt;
      return { L, w: L / $.I };
    },
    second: ($) => ({
      L: $.I * $.w0 + $.tau * $.dt,
      w: $.w0 + ($.tau * $.dt) / $.I,
    }),
    text: (T) => `A rigid body has moment of inertia ${T.I} kg·m² and spins at ${T.w0} rad/s. A constant torque of ${T.tau} N·m acts about the same axis for ${T.dt} s. Find the angular momentum at the end, and the angular velocity.`,
    parts: [
      num('L', ($) => $.L, 'kg·m²/s', { label: 'angular momentum' }),
      num('w', ($) => $.w, 'rad/s', { label: 'angular velocity' }),
    ],
    hints: [
      String.raw`The angular impulse $\tau\Delta t$ equals the change of angular momentum. Then $\omega = L/I$.`,
    ],
    steps: ($) => [
      String.raw`$L = I\omega_0 + \tau\Delta t = ${texNum($.L)}\ \mathrm{kg\cdot m^2/s}$`,
      String.raw`$\omega = L/I = ${texNum($.w)}\ \mathrm{rad/s}$`,
    ],
    cases: [
      kase('hand', { I: 0.4, w0: 2, tau: 0.5, dt: 3 }, { L: 2.3, w: 5.75 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.skater',
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'Pulling the arms in',
    topics: ['angular-momentum', 'conservation'],
    vars: {
      I1: range(1, 8, 0.5, 'kg·m²'),
      w1: range(0.5, 6, 0.5, 'rad/s'),
      I2: range(0.4, 5, 0.1, 'kg·m²'),
    },
    derive: ($) => {
      const L = angularMomentum($.I1, $.w1);
      const w2 = L / $.I2;
      return {
        w2,
        K1: rotationalKE($.I1, $.w1),
        K2: rotationalKE($.I2, w2),
      };
    },
    second: ($) => {
      const w2 = ($.I1 * $.w1) / $.I2;
      return {
        w2,
        K1: 0.5 * $.I1 * $.w1 * $.w1,
        K2: 0.5 * $.I2 * w2 * w2,
      };
    },
    valid: ($) => $.I1 > $.I2 + 0.3,
    text: (T) => `A skater spins at ${T.w1} rad/s with moment of inertia ${T.I1} kg·m². She pulls her arms in, and the moment becomes ${T.I2} kg·m². Friction is negligible. Find the new angular velocity, and the kinetic energy before and after.`,
    parts: [
      num('w2', ($) => $.w2, 'rad/s', { label: 'new angular velocity' }),
      num('K1', ($) => $.K1, 'J', { label: 'kinetic energy before' }),
      num('K2', ($) => $.K2, 'J', { label: 'kinetic energy after' }),
    ],
    hints: [
      String.raw`No external torque, so $I\omega$ stays the same. The kinetic energy does not: she does work pulling her arms in.`,
    ],
    steps: ($) => [
      String.raw`$\omega_2 = I_1\omega_1/I_2 = ${texNum($.w2)}\ \mathrm{rad/s}$`,
      String.raw`$K_1 = ${texNum($.K1)}\ \mathrm{J}$, $K_2 = ${texNum($.K2)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { I1: 4, w1: 2, I2: 1.5 }, { w2: 16 / 3, K1: 8, K2: 64 / 3 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.point',
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'Angular momentum of a point mass',
    topics: ['angular-momentum'],
    vars: {
      m: range(0.2, 5, 0.2, 'kg'),
      speed: range(1, 12, 0.5, 'm/s'),
      r: range(0.2, 4, 0.2, 'm'),
    },
    derive: ($) => ({
      L: angularMomentum(inertiaPoint($.m, $.r), $.speed / $.r),
    }),
    second: ($) => ({ L: $.m * $.speed * $.r }),
    text: (T) => `A ${T.m} kg point mass moves at ${T.speed} m/s, perpendicular to the line from an axis ${T.r} m away. Find its angular momentum about that axis.`,
    parts: [
      num('L', ($) => $.L, 'kg·m²/s', { label: 'angular momentum' }),
    ],
    hints: [
      String.raw`The moment is $mr^2$ and the angular velocity is $v/r$, so $L = mvr$.`,
    ],
    steps: ($) => [
      String.raw`$L = mvr = ${texNum($.L)}\ \mathrm{kg\cdot m^2/s}$`,
    ],
    cases: [
      kase('hand', { m: 0.5, speed: 4, r: 2 }, { L: 4 }),
    ],
  }),
];
