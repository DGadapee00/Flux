/** Ch 10 · Fixed-axis rotation. OpenStax University Physics Vol. 1, §§10.2–10.7. */
import { moment2D } from '@flux/subjects/mechanics/statics.js';
import {
  angularAcceleration, constAlpha, inertiaDisk, inertiaRodCenter, inertiaRodEnd,
  parallelAxisMass, rotationalKE, torqueMag,
} from '@flux/subjects/mechanics/rotation.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { trap1D } from '../integrate.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u5', ch: '10' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch10.spin',
    src: 'OpenStax University Physics Vol. 1 §10.2',
    title: 'Constant angular acceleration',
    topics: ['rotation', 'kinematics'],
    vars: {
      theta0: range(0, 2, 0.25, 'rad'),
      w0: range(-4, 8, 0.5, 'rad/s'),
      alpha: range(-2, 2, 0.25, 'rad/s²'),
      t: range(0.5, 6, 0.5, 's'),
    },
    derive: ($) => {
      const spun = constAlpha({ theta0: $.theta0, omega0: $.w0, alpha: $.alpha, t: $.t });
      return { theta: spun.theta, w: spun.omega };
    },
    second: ($) => {
      const num = trap1D($.theta0, $.w0, $.alpha, $.t);
      return { theta: num.x, w: num.v };
    },
    valid: ($) => Math.abs($.w) > 0.3,
    text: (T) => `A wheel starts at angle ${T.theta0} rad with angular velocity ${T.w0} rad/s. The angular acceleration is constant at ${T.alpha} rad/s². Angles are in radians. Find the angle and the angular velocity after ${T.t} s.`,
    parts: [
      num('theta', ($) => $.theta, 'rad', { label: 'angle' }),
      num('w', ($) => $.w, 'rad/s', { label: 'angular velocity' }),
    ],
    hints: [
      String.raw`The rules match linear motion, with radians: $\theta = \theta_0 + \omega_0 t + \frac{1}{2}\alpha t^2$ and $\omega = \omega_0 + \alpha t$.`,
    ],
    steps: ($) => [
      String.raw`$\theta = ${texNum($.theta)}\ \mathrm{rad}$`,
      String.raw`$\omega = ${texNum($.w)}\ \mathrm{rad/s}$`,
    ],
    cases: [
      kase('hand', { theta0: 0, w0: 2, alpha: 0.5, t: 4 }, { theta: 12, w: 4 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.torque',
    src: 'OpenStax University Physics Vol. 1 §10.6',
    title: 'Torque of one force',
    topics: ['torque'],
    vars: {
      r: range(0.1, 2, 0.1, 'm'),
      F: range(2, 40, 1, 'N'),
      phi: range(15, 165, 15, '°'),
    },
    derive: ($) => ({ tau: torqueMag($.r, $.F, $.phi) }),
    second: ($) => {
      const phi = $.phi * DEG;
      const tau = moment2D(v(0, 0, 0), v($.r, 0, 0), v($.F * Math.cos(phi), $.F * Math.sin(phi), 0));
      return { tau };
    },
    text: (T) => `A force of ${T.F} N is applied ${T.r} m from a fixed axis. The angle between the lever arm and the force is ${T.phi}°. Find the torque about the axis.`,
    parts: [
      num('tau', ($) => $.tau, 'N·m', { label: 'torque' }),
    ],
    hints: [
      String.raw`The magnitude is $rF\sin\phi$. The same number is the z component of $\vec r\times\vec F$ when the lever arm lies along x.`,
    ],
    steps: ($) => [
      String.raw`$\tau = rF\sin\phi = ${texNum($.tau)}\ \mathrm{N\cdot m}$`,
    ],
    cases: [
      kase('hand', { r: 0.4, F: 20, phi: 90 }, { tau: 8 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.disk',
    src: 'OpenStax University Physics Vol. 1 §10.4',
    title: 'Rotational energy of a disk',
    topics: ['inertia', 'energy'],
    vars: {
      m: range(0.4, 8, 0.2, 'kg'),
      R: range(0.1, 0.8, 0.05, 'm'),
      w: range(1, 20, 0.5, 'rad/s'),
    },
    derive: ($) => {
      const I = inertiaDisk($.m, $.R);
      return { I, K: rotationalKE(I, $.w) };
    },
    second: ($) => {
      const I = 0.5 * $.m * $.R * $.R;
      return { I, K: 0.5 * I * $.w * $.w };
    },
    text: (T) => `A uniform disk has mass ${T.m} kg and radius ${T.R} m. It spins at ${T.w} rad/s about its center, perpendicular to its face. Find its moment of inertia and its rotational kinetic energy.`,
    parts: [
      num('I', ($) => $.I, 'kg·m²', { label: 'moment of inertia' }),
      num('K', ($) => $.K, 'J', { label: 'rotational kinetic energy' }),
    ],
    hints: [
      String.raw`A solid disk about its center has $I = \frac{1}{2}mR^2$. The kinetic energy is $\frac{1}{2}I\omega^2$.`,
    ],
    steps: ($) => [
      String.raw`$I = \frac{1}{2}mR^2 = ${texNum($.I)}\ \mathrm{kg\cdot m^2}$`,
      String.raw`$K = \frac{1}{2}I\omega^2 = ${texNum($.K)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { m: 3, R: 0.2, w: 10 }, { I: 0.06, K: 3 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.newton',
    src: 'OpenStax University Physics Vol. 1 §10.7',
    title: 'Angular acceleration of a disk',
    topics: ['torque', 'newton'],
    vars: {
      m: range(0.4, 6, 0.2, 'kg'),
      R: range(0.1, 0.6, 0.05, 'm'),
      F: range(1, 30, 0.5, 'N'),
    },
    derive: ($) => {
      const tau = torqueMag($.R, $.F, 90);
      const I = inertiaDisk($.m, $.R);
      return { tau, I, alpha: angularAcceleration(tau, I) };
    },
    second: ($) => {
      const tau = $.R * $.F;
      const I = 0.5 * $.m * $.R * $.R;
      return { tau, I, alpha: tau / I };
    },
    text: (T) => `A force of ${T.F} N is applied at the rim of a uniform disk, tangent to the rim. The disk has mass ${T.m} kg and radius ${T.R} m, and it is free to turn about its center. Find the torque, the moment of inertia, and the angular acceleration.`,
    parts: [
      num('tau', ($) => $.tau, 'N·m', { label: 'torque' }),
      num('I', ($) => $.I, 'kg·m²', { label: 'moment of inertia' }),
      num('alpha', ($) => $.alpha, 'rad/s²', { label: 'angular acceleration' }),
    ],
    hints: [
      String.raw`The force is perpendicular to the radius, so $\tau = RF$. Then $\alpha = \tau/I$ with $I = \frac{1}{2}mR^2$.`,
    ],
    steps: ($) => [
      String.raw`$\tau = RF = ${texNum($.tau)}\ \mathrm{N\cdot m}$, $I = ${texNum($.I)}\ \mathrm{kg\cdot m^2}$`,
      String.raw`$\alpha = \tau/I = ${texNum($.alpha)}\ \mathrm{rad/s^2}$`,
    ],
    cases: [
      kase('hand', { m: 2, R: 0.5, F: 4 }, { tau: 2, I: 0.25, alpha: 8 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.rod',
    src: 'OpenStax University Physics Vol. 1 §10.5',
    title: 'A rod about its center and about one end',
    topics: ['inertia', 'parallel-axis'],
    vars: {
      m: range(0.4, 8, 0.2, 'kg'),
      L: range(0.4, 3, 0.1, 'm'),
    },
    derive: ($) => ({
      Icm: inertiaRodCenter($.m, $.L),
      Iend: inertiaRodEnd($.m, $.L),
    }),
    second: ($) => {
      const Icm = ($.m * $.L * $.L) / 12;
      return { Icm, Iend: parallelAxisMass(Icm, $.m, $.L / 2) };
    },
    text: (T) => `A uniform rod has mass ${T.m} kg and length ${T.L} m. Find its moment of inertia about a perpendicular axis through its center, and about a perpendicular axis through one end.`,
    parts: [
      num('Icm', ($) => $.Icm, 'kg·m²', { label: 'about the center' }),
      num('Iend', ($) => $.Iend, 'kg·m²', { label: 'about one end' }),
    ],
    hints: [
      String.raw`About the center, $I = \frac{1}{12}mL^2$. The end is a distance $L/2$ from the center, so add $m(L/2)^2$.`,
    ],
    steps: ($) => [
      String.raw`$I_{\mathrm{cm}} = \frac{1}{12}mL^2 = ${texNum($.Icm)}\ \mathrm{kg\cdot m^2}$`,
      String.raw`$I_{\mathrm{end}} = ${texNum($.Iend)}\ \mathrm{kg\cdot m^2}$`,
    ],
    cases: [
      kase('hand', { m: 3, L: 2 }, { Icm: 1, Iend: 4 }),
    ],
  }),
];
