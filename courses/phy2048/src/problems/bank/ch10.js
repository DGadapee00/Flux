/** Ch 10 · Fixed-axis rotation. OpenStax University Physics Vol. 1, §§10.1–10.8. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { atwoodPulley } from '@flux/subjects/mechanics/dynamics.js';
import { rodInertiaIntegral, sphereInertiaIntegral } from '@flux/subjects/mechanics/inertia.js';
import {
  angularAcceleration, constAlpha, inertiaDisk, inertiaHoop, inertiaPoint, inertiaRodCenter, inertiaRodEnd,
  inertiaSphere, parallelAxisMass, rotationalKE, torqueMag,
} from '@flux/subjects/mechanics/rotation.js';
import { moment2D } from '@flux/subjects/mechanics/statics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { trap1D } from '../integrate.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u6', ch: '10' };
const DEG = Math.PI / 180;

/** A disk of mass 2 kg needs this tangent force to have angular acceleration alpha. */
const diskForce = (alpha, R, m = 2) => (alpha * m * R) / 2;

function windAt(w0, T, frac) {
  const u = 1 - frac;
  return {
    omega: w0 * u * u,
    alphaAvg: -w0 / T,
    alphaNow: (-2 * w0 * u) / T,
  };
}

/** Central difference of ω = ω0 (1 − t/T)². Exact for this quadratic, apart from roundoff. */
function windAlphaNum(w0, T, frac) {
  const dt = 1e-4;
  const om = (t) => w0 * (1 - t / T) ** 2;
  const t = frac * T;
  return (om(t + dt) - om(t - dt)) / (2 * dt);
}

const TORQUES = [
  { r: 4, phi: 90, sign: 1 },
  { r: 3, phi: 90, sign: -1 },
  { r: 5, phi: 53, sign: 1 },
  { r: 1, phi: 30, sign: 1 },
];

function netTorque(F, squareOnly) {
  return TORQUES.reduce((sum, arm, i) => {
    if (squareOnly && i >= 2) return sum;
    return sum + arm.sign * torqueMag(arm.r, F[i], arm.phi);
  }, 0);
}

function netByCross(F, squareOnly) {
  return TORQUES.reduce((sum, arm, i) => {
    if (squareOnly && i >= 2) return sum;
    const phi = arm.phi * DEG;
    const fx = F[i] * Math.cos(phi);
    const fy = arm.sign * F[i] * Math.sin(phi);
    return sum + moment2D(v(0, 0, 0), v(arm.r, 0, 0), v(fx, fy, 0));
  }, 0);
}

function pairMoments(mRod, L, mSphere, R) {
  const rod = inertiaRodEnd(mRod, L);
  const sphere = inertiaSphere(mSphere, R);
  return {
    Ifar: rod + parallelAxisMass(sphere, mSphere, L + R),
    Inear: rod + parallelAxisMass(sphere, mSphere, R),
  };
}

function stopTime(w0, alpha) {
  return -w0 / alpha;
}

function stopAngle(w0, alpha) {
  const t = stopTime(w0, alpha);
  return constAlpha({ theta0: 0, omega0: w0, alpha, t }).theta;
}

export default [
  problem({
    ...U,
    id: 'ch10.spin',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §10.2',
    title: 'Constant angular acceleration',
    topics: ['angular-kinematics'],
    lab: 'rotor',
    vars: {
      start: choice(['rest', 'from rest'], ['moving', 'already turning']),
      w0: range(1, 12, 0.5, 'rad/s'),
      alpha: range(0.5, 8, 0.5, 'rad/s²'),
      t: range(0.5, 6, 0.5, 's'),
    },
    derive: ($) => {
      const w0 = $.start === 'rest' ? 0 : $.w0;
      const spun = constAlpha({ theta0: 0, omega0: w0, alpha: $.alpha, t: $.t });
      return { w0Used: w0, theta: spun.theta, omega: spun.omega, revs: spun.theta / (2 * Math.PI) };
    },
    second: ($) => {
      const w0 = $.start === 'rest' ? 0 : $.w0;
      const numStep = trap1D(0, w0, $.alpha, $.t);
      return { theta: numStep.x, omega: numStep.v, revs: numStep.x / (2 * Math.PI) };
    },
    valid: ($) => Math.abs($.omega) > 0.4 && Math.abs($.theta) > 0.2,
    text: (T, $) => ($.start === 'rest'
      ? `A wheel starts from rest with a constant angular acceleration of ${T.alpha} rad/s². Angles are in radians. Find the angle, the angular velocity, and the number of revolutions after ${T.t} s.`
      : `A wheel is already turning at ${T.w0} rad/s. Its angular acceleration is constant at ${T.alpha} rad/s². Angles are in radians. Find the angle, the angular velocity, and the number of revolutions after ${T.t} s.`),
    parts: [
      num('theta', ($) => $.theta, 'rad', { label: 'angle' }),
      num('omega', ($) => $.omega, 'rad/s', { label: 'angular velocity' }),
      num('revs', ($) => $.revs, 'rev', { label: 'revolutions' }),
    ],
    hints: [
      String.raw`The rules match linear motion, in radians: $\theta = \omega_0 t + \frac12\alpha t^2$ and $\omega = \omega_0 + \alpha t$. From rest, $\omega_0 = 0$.`,
      'A revolution is one full turn, $2\\pi$ radians. Divide the angle by $2\\pi$.',
    ],
    steps: ($) => [
      String.raw`$\theta = ${texNum($.theta)}\ \mathrm{rad}$, $\omega = ${texNum($.omega)}\ \mathrm{rad/s}$`,
      String.raw`$\text{revolutions} = \theta/(2\pi) = ${texNum($.revs)}$`,
    ],
    sim: {
      scenario: 'reel',
      setup: (s, $) => {
        const R = 0.2;
        Object.assign(s, {
          shape: 'disk', m: 2, R, F: diskForce($.alpha, R), phi: 90, w0: $.w0Used, t: $.t, rider: 0, riderAt: 0,
        });
      },
      read: (c) => ({ theta: c.theta, omega: c.omega, revs: c.revs }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.2, "Calculating the Acceleration of a Fishing Reel": from rest at 110 rad/s² for 2.00 s', { start: 'rest', w0: 4, alpha: 110, t: 2 }, { theta: 220, omega: 220, revs: 35.0 }, {
        note: 'The book prints 35.0 rev. Ours is 220/(2π) = 35.01 rev. The 2 kg disk in the lab is ours: the example gives α, the radius, and the time, not the reel mass.',
      }),
      kase('hand', { start: 'moving', w0: 2, alpha: 0.5, t: 4 }, { theta: 12, omega: 4, revs: 12 / (2 * Math.PI) }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.stop',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.2',
    title: 'Time and angle to stop',
    topics: ['angular-kinematics'],
    lab: 'rotor',
    vars: {
      w0: range(4, 16, 1, 'rad/s'),
      alpha: range(1, 6, 0.5, 'rad/s²'),
    },
    derive: ($) => {
      const a = -$.alpha;
      return { a, t: stopTime($.w0, a), theta: stopAngle($.w0, a) };
    },
    second: ($) => {
      const a = -$.alpha;
      const t = -$.w0 / a;
      const numStep = trap1D(0, $.w0, a, t);
      return { t, theta: numStep.x };
    },
    valid: ($) => $.t > 0.2 && $.theta > 0.2,
    text: (T) => `A wheel turns at ${T.w0} rad/s. A brake gives a constant angular acceleration of −${T.alpha} rad/s², against the spin. Find how long the wheel takes to stop, and the angle it turns through while it stops.`,
    parts: [
      num('t', ($) => $.t, 's', { label: 'time to stop' }),
      num('theta', ($) => $.theta, 'rad', { label: 'angle while stopping' }),
    ],
    hints: [
      String.raw`Set $\omega = 0$ in $\omega = \omega_0 + \alpha t$. The acceleration is negative when the spin is positive, so the time comes out positive.`,
      String.raw`The angle is $\theta = \omega_0 t + \frac12\alpha t^2$. It is also $\omega_0^2/(2|\alpha|)$.`,
    ],
    steps: ($) => [
      String.raw`$t = -\omega_0/\alpha = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$\theta = ${texNum($.theta)}\ \mathrm{rad}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => {
        const R = 0.2;
        Object.assign(s, {
          shape: 'disk', m: 2, R, F: diskForce($.a, R), phi: 90, w0: $.w0, t: $.t, rider: 0, riderAt: 0,
        });
      },
      read: (c) => ({ t: c.tStop, theta: c.theta }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.2, "Calculating the Duration When the Fishing Reel Slows Down and Stops": braked at −300 rad/s² from 220 rad/s', { w0: 220, alpha: 300 }, { t: 0.733, theta: stopAngle(220, -300) }, {
        note: 'The book prints 0.733 s. Ours is 220/300 = 0.7333 s. The angle is ours: the example asks only for the time.',
      }),
      kase('hand', { w0: 10, alpha: 2 }, { t: 5, theta: 25 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.wind',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §10.1',
    title: 'A shutdown that is not constant α',
    topics: ['rotation'],
    vars: {
      w0: range(3, 18, 1, 'rad/s'),
      T: range(10, 40, 5, 's'),
      frac: range(0, 1, 0.25, ''),
    },
    derive: ($) => windAt($.w0, $.T, $.frac),
    second: ($) => {
      const t = $.frac * $.T;
      const omega = $.w0 * (1 - t / $.T) ** 2;
      return { omega, alphaAvg: (0 - $.w0) / $.T, alphaNow: windAlphaNum($.w0, $.T, $.frac) };
    },
    valid: ($) => $.T > 0,
    text: (T) => `A rotor coasts to a stop. Its angular velocity is ω = ω0 (1 − t/T)², with ω0 = ${T.w0} rad/s and T = ${T.T} s. It is at rest at t = T. Find ω at the start, the average angular acceleration over the whole stop, and the instantaneous angular acceleration at t = ${T.frac} T.`,
    parts: [
      num('omega', ($) => $.omega, 'rad/s', { label: 'ω at that instant' }),
      num('alphaAvg', ($) => $.alphaAvg, 'rad/s²', { label: 'average α' }),
      num('alphaNow', ($) => $.alphaNow, 'rad/s²', { label: 'instantaneous α' }),
    ],
    hints: [
      String.raw`Average α is the change of ω divided by the time: $(0 - \omega_0)/T$. That is not the value of α at every instant.`,
      String.raw`Differentiate $\omega = \omega_0(1 - t/T)^2$. You get $\alpha = -(2\omega_0/T)(1 - t/T)$. At the start this is twice the average. At the stop it is zero.`,
    ],
    steps: ($) => [
      String.raw`$\omega = ${texNum($.omega)}\ \mathrm{rad/s}$, $\alpha_{\mathrm{avg}} = ${texNum($.alphaAvg)}\ \mathrm{rad/s^2}$`,
      String.raw`$\alpha = ${texNum($.alphaNow)}\ \mathrm{rad/s^2}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.1, "Wind Turbine": ω = (t − 30)²/100, at the start', { w0: 9, T: 30, frac: 0 }, { omega: 9, alphaAvg: -0.3, alphaNow: -0.6 }, {
        note: 'ω(0) = 9.0 rad/s, the average α over 30 s is −0.30 rad/s², and α(0) = −0.60 rad/s². The rotor lab uses constant α, so this curve has no lab.',
      }),
      kase('OpenStax University Physics Vol. 1 §10.1, "Wind Turbine": the same shutdown at 15 s', { w0: 9, T: 30, frac: 0.5 }, { omega: 2.25, alphaAvg: -0.3, alphaNow: -0.3 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.rim',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.3',
    title: 'Tangential and centripetal acceleration',
    topics: ['tangential'],
    lab: 'rotor',
    vars: {
      rpm: range(200, 1200, 100, 'rpm'),
      R: range(0.1, 0.6, 0.05, 'm'),
      Tstop: range(15, 40, 5, 's'),
      t: range(1, 12, 1, 's'),
    },
    derive: ($) => {
      const w0 = $.rpm * 2 * Math.PI / 60;
      const alpha = -w0 / $.Tstop;
      const spun = constAlpha({ theta0: 0, omega0: w0, alpha, t: $.t });
      const at = $.R * alpha;
      const ac = $.R * spun.omega * spun.omega;
      return { w0, alpha, omega: spun.omega, at, ac, a: Math.hypot(at, ac) };
    },
    second: ($) => {
      const w0 = ($.rpm * Math.PI) / 30;
      const alpha = -w0 / $.Tstop;
      const omega = w0 + alpha * $.t;
      const at = $.R * alpha;
      const ac = $.R * omega * omega;
      return { at, ac, a: Math.sqrt(at * at + ac * ac) };
    },
    valid: ($) => $.t < $.Tstop && Math.abs($.at) > 0.05,
    text: (T) => `A disk of radius ${T.R} m spins at ${T.rpm} rpm and is brought to rest with constant α in ${T.Tstop} s. Find the tangential acceleration, the centripetal acceleration, and the magnitude of the total acceleration of a point on the rim, at t = ${T.t} s. The tangential acceleration keeps its sign: negative means the spin is slowing.`,
    parts: [
      num('at', ($) => $.at, 'm/s²', { label: 'tangential acceleration' }),
      num('ac', ($) => $.ac, 'm/s²', { label: 'centripetal acceleration' }),
      num('a', ($) => $.a, 'm/s²', { label: 'total acceleration' }),
    ],
    hints: [
      String.raw`Convert rpm to rad/s with $2\pi/60$. Then $\alpha = -\omega_0/T$, and $\omega = \omega_0 + \alpha t$ at the instant you were asked.`,
      String.raw`$a_t = R\alpha$ and $a_c = R\omega^2$. The two are perpendicular, so $|a| = \sqrt{a_t^2 + a_c^2}$.`,
    ],
    steps: ($) => [
      String.raw`$\omega_0 = ${texNum($.w0)}\ \mathrm{rad/s}$, $\alpha = ${texNum($.alpha)}\ \mathrm{rad/s^2}$, $\omega = ${texNum($.omega)}\ \mathrm{rad/s}$`,
      String.raw`$a_t = ${texNum($.at)}\ \mathrm{m/s^2}$, $a_c = ${texNum($.ac)}\ \mathrm{m/s^2}$, $|a| = ${texNum($.a)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'centrifuge',
      setup: (s, $) => {
        const R = $.R;
        Object.assign(s, {
          shape: 'disk', m: 2, R, F: diskForce($.alpha, R), phi: 90, w0: $.w0, t: $.t, rider: 0, riderAt: 0,
        });
      },
      read: (c) => ({ at: c.at, ac: c.ac, a: c.a }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.3, "Linear Acceleration of a Centrifuge": radius 20 cm, 10 000 rpm to rest in 30 s, at t = 29 s', { rpm: 10000, R: 0.2, Tstop: 30, t: 29 }, { at: -7.0, ac: 245, a: 245.1 }, {
        note: 'The book prints |at| = 7.0 m/s², ac = 245 m/s², and |a| = 245.1 m/s². Ours are −6.981, 243.7, and 243.8. The sign on at is ours: slowing is negative.',
      }),
      kase('hand', { rpm: 600, R: 0.2, Tstop: 20, t: 10 }, {
        at: -0.2 * (600 * 2 * Math.PI / 60) / 20,
        ac: 0.2 * (600 * Math.PI / 60) ** 2,
        a: Math.hypot(0.2 * (600 * 2 * Math.PI / 60) / 20, 0.2 * (600 * Math.PI / 60) ** 2),
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.heli',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.4',
    title: 'Energy in a helicopter rotor',
    topics: ['inertia', 'rotational-energy'],
    lab: 'helicopter-rotor',
    vars: {
      flight: choice(['fly', 'in flight'], ['hover', 'hovering']),
      n: range(2, 6, 1, ''),
      mBlade: range(20, 70, 5, 'kg'),
      L: range(2, 6, 0.5, 'm'),
      rpm: range(120, 480, 30, 'rpm'),
      mHeli: range(600, 1600, 100, 'kg'),
      v: range(5, 40, 5, 'm/s'),
    },
    derive: ($) => {
      const I = $.n * inertiaRodEnd($.mBlade, $.L);
      const omega = $.rpm * 2 * Math.PI / 60;
      const v = $.flight === 'hover' ? 0 : $.v;
      const Krot = rotationalKE(I, omega);
      const Ktrans = 0.5 * $.mHeli * v * v;
      return { I, omega, vUsed: v, Krot, Ktrans };
    },
    second: ($) => {
      const one = rodInertiaIntegral($.mBlade, 0, $.L, 0);
      const I = $.n * one;
      const omega = ($.rpm * Math.PI) / 30;
      const v = $.flight === 'hover' ? 0 : $.v;
      return { I, Krot: 0.5 * I * omega * omega, Ktrans: 0.5 * $.mHeli * v * v };
    },
    valid: ($) => $.Krot > 1,
    text: (T, $) => ($.flight === 'hover'
      ? `A helicopter has ${T.n} blades. Each is a uniform rod of mass ${T.mBlade} kg and length ${T.L} m, pivoted at one end. The rotor turns at ${T.rpm} rpm. The helicopter mass is ${T.mHeli} kg, and it is hovering, so the flight speed is zero. Find the moment of inertia of the blades, the rotational kinetic energy, and the translational kinetic energy.`
      : `A helicopter has ${T.n} blades. Each is a uniform rod of mass ${T.mBlade} kg and length ${T.L} m, pivoted at one end. The rotor turns at ${T.rpm} rpm. The helicopter mass is ${T.mHeli} kg and it flies at ${T.v} m/s. Find the moment of inertia of the blades, the rotational kinetic energy, and the translational kinetic energy.`),
    parts: [
      num('I', ($) => $.I, 'kg·m²', { label: 'moment of the blades' }),
      num('Krot', ($) => $.Krot, 'J', { label: 'rotational kinetic energy' }),
      num('Ktrans', ($) => $.Ktrans, 'J', { label: 'translational kinetic energy' }),
    ],
    hints: [
      String.raw`One blade about its end is $\frac13 m L^2$. Multiply by the number of blades. A blade about its center, $\frac{1}{12}mL^2$, is the wrong axis.`,
      String.raw`Convert rpm to rad/s before $K = \frac12 I\omega^2$. The flight energy is $\frac12 Mv^2$ of the whole helicopter, and it is zero in a hover.`,
    ],
    steps: ($) => [
      String.raw`$I = ${texNum($.I)}\ \mathrm{kg\cdot m^2}$, $\omega = ${texNum($.omega)}\ \mathrm{rad/s}$`,
      String.raw`$K_{\mathrm{rot}} = ${texNum($.Krot)}\ \mathrm{J}$, $K_{\mathrm{trans}} = ${texNum($.Ktrans)}\ \mathrm{J}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        Object.assign(s, { n: $.n, mBlade: $.mBlade, L: $.L, rpm: $.rpm, mHeli: $.mHeli, v: $.vUsed });
      },
      read: (c) => ({ I: c.I, Krot: c.Krot, Ktrans: c.Ktrans }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.4, "Calculating Helicopter Energies": four 4.00 m blades of 50.0 kg at 300 rpm, a 1000 kg helicopter at 20.0 m/s', { flight: 'fly', n: 4, mBlade: 50, L: 4, rpm: 300, mHeli: 1000, v: 20 }, { I: 1067, Krot: 5.26e5, Ktrans: 2.00e5 }, {
        note: 'The book prints I = 1067 kg·m², K_rot = 5.26×10⁵ J, and K_trans = 2.00×10⁵ J. Ours are 1067 kg·m² to four figures as 1067, 5.264×10⁵ J, and 2.000×10⁵ J.',
      }),
      kase('hand', { flight: 'hover', n: 1, mBlade: 3, L: 2, rpm: 60 / Math.PI, mHeli: 2, v: 10 }, { I: 4, Krot: 8, Ktrans: 0 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.rod',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §10.5',
    title: 'A rod about its center and about one end',
    topics: ['inertia', 'parallel-axis'],
    lab: 'inertia',
    vars: {
      told: choice(['length', 'the full length'], ['half', 'the distance from the center to one end']),
      m: range(0.5, 8, 0.5, 'kg'),
      L: range(0.4, 2.4, 0.2, 'm'),
      d: range(0.2, 1.2, 0.1, 'm'),
    },
    derive: ($) => {
      const L = $.told === 'half' ? 2 * $.d : $.L;
      const Icm = inertiaRodCenter($.m, L);
      return { Lused: L, Icm, Iend: parallelAxisMass(Icm, $.m, L / 2) };
    },
    second: ($) => {
      const L = $.told === 'half' ? 2 * $.d : $.L;
      const Icm = rodInertiaIntegral($.m, -L / 2, L / 2, 0);
      const Iend = rodInertiaIntegral($.m, -L / 2, L / 2, L / 2);
      return { Icm, Iend };
    },
    valid: ($) => $.Iend > $.Icm && $.Icm > 0.01,
    text: (T, $) => ($.told === 'half'
      ? `A uniform rod has mass ${T.m} kg. The center is ${T.d} m from either end. Find its moment of inertia about a perpendicular axis through the center, and about a perpendicular axis through one end.`
      : `A uniform rod has mass ${T.m} kg and length ${T.L} m. Find its moment of inertia about a perpendicular axis through the center, and about a perpendicular axis through one end.`),
    parts: [
      num('Icm', ($) => $.Icm, 'kg·m²', { label: 'about the center' }),
      num('Iend', ($) => $.Iend, 'kg·m²', { label: 'about one end' }),
    ],
    hints: [
      String.raw`About the center, $I = \frac{1}{12}mL^2$. The end is $L/2$ from the center.`,
      String.raw`The parallel-axis theorem adds $m(L/2)^2$. It does not subtract. The end result is $\frac13 mL^2$, four times the center result.`,
    ],
    steps: ($) => [
      String.raw`$L = ${texNum($.Lused)}\ \mathrm{m}$`,
      String.raw`$I_{\mathrm{cm}} = ${texNum($.Icm)}\ \mathrm{kg\cdot m^2}$, $I_{\mathrm{end}} = ${texNum($.Iend)}\ \mathrm{kg\cdot m^2}$`,
    ],
    sim: {
      scenario: 'end',
      setup: (s, $) => { Object.assign(s, { shape: 'rod', axis: 'end', m: $.m, L: $.Lused }); },
      read: (c) => ({ Icm: c.Icm, Iend: c.Iend }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.5, "Rod and Solid Sphere": the rod alone, 2.0 kg and 0.50 m, about one end', { told: 'length', m: 2, L: 0.5, d: 0.25 }, { Icm: 0.04167, Iend: 0.167 }, {
        note: 'The book prints 0.167 kg·m² for the rod about its end. Ours is 1/6 = 0.1667 kg·m². The center value is ours: (1/12)mL² = 0.04167 kg·m².',
      }),
      kase('hand', { told: 'length', m: 3, L: 2, d: 1 }, { Icm: 1, Iend: 4 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.pair',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.5',
    title: 'A rod with a sphere on the end',
    topics: ['inertia', 'parallel-axis'],
    lab: 'inertia',
    vars: {
      mRod: range(1, 4, 0.5, 'kg'),
      L: range(0.4, 1.2, 0.1, 'm'),
      mSphere: range(0.5, 3, 0.5, 'kg'),
      R: range(0.1, 0.4, 0.05, 'm'),
    },
    derive: ($) => pairMoments($.mRod, $.L, $.mSphere, $.R),
    second: ($) => {
      const rod = rodInertiaIntegral($.mRod, 0, $.L, 0);
      const sphere = sphereInertiaIntegral($.mSphere, $.R);
      return {
        Ifar: rod + sphere + $.mSphere * ($.L + $.R) ** 2,
        Inear: rod + sphere + $.mSphere * $.R ** 2,
      };
    },
    valid: ($) => $.Ifar > $.Inear && $.Inear > 0.02,
    text: (T) => `A uniform rod of mass ${T.mRod} kg and length ${T.L} m has a solid sphere on one end. The sphere has mass ${T.mSphere} kg and radius ${T.R} m, and its center is ${T.R} m past the end of the rod. Find the moment about a perpendicular axis at the far end of the rod, where the sphere is a full length away, and about a perpendicular axis at the near end, through the end the sphere sits on.`,
    parts: [
      num('Ifar', ($) => $.Ifar, 'kg·m²', { label: 'far axis' }),
      num('Inear', ($) => $.Inear, 'kg·m²', { label: 'near axis' }),
    ],
    hints: [
      String.raw`The rod about one end is $\frac13 m_{\mathrm{rod}} L^2$. The sphere about its own center is $\frac25 m R^2$.`,
      String.raw`Add $m d^2$ for the sphere, with $d$ the distance from the axis to the sphere's center. On the far axis, $d = L + R$. On the near axis, $d = R$.`,
    ],
    steps: ($) => [
      String.raw`$I_{\mathrm{far}} = ${texNum($.Ifar)}\ \mathrm{kg\cdot m^2}$`,
      String.raw`$I_{\mathrm{near}} = ${texNum($.Inear)}\ \mathrm{kg\cdot m^2}$`,
    ],
    sim: {
      scenario: 'far',
      setup: (s, $) => {
        Object.assign(s, { shape: 'pair', axis: 'far', mRod: $.mRod, L: $.L, mSphere: $.mSphere, R: $.R });
      },
      read: (c) => ({ Ifar: c.Ifar, Inear: c.Inear }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.5, "Rod and Solid Sphere": rod 2.0 kg and 0.50 m, sphere 1.0 kg and radius 0.20 m', { mRod: 2, L: 0.5, mSphere: 1, R: 0.2 }, { Ifar: 0.673, Inear: 0.223 }, {
        note: 'The book prints 0.673 kg·m² and 0.223 kg·m². Ours are 0.6727 kg·m² and 0.2227 kg·m².',
      }),
      kase('hand', { mRod: 3, L: 2, mSphere: 1, R: 0.2 }, {
        Ifar: pairMoments(3, 2, 1, 0.2).Ifar,
        Inear: pairMoments(3, 2, 1, 0.2).Inear,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.torque',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §10.6',
    title: 'Torque of one force',
    topics: ['torque'],
    lab: 'rotor',
    vars: {
      aim: choice(['angle', 'at an angle to the lever arm'], ['square', 'perpendicular to the lever arm']),
      r: range(0.2, 2, 0.1, 'm'),
      F: range(5, 80, 5, 'N'),
      phi: range(20, 160, 10, '°'),
    },
    derive: ($) => {
      const phi = $.aim === 'square' ? 90 : $.phi;
      return { phiUsed: phi, tau: torqueMag($.r, $.F, phi) };
    },
    second: ($) => {
      const phi = ($.aim === 'square' ? 90 : $.phi) * DEG;
      const tau = moment2D(v(0, 0, 0), v($.r, 0, 0), v($.F * Math.cos(phi), $.F * Math.sin(phi), 0));
      return { tau };
    },
    valid: ($) => $.tau > 0.5,
    text: (T, $) => ($.aim === 'square'
      ? `A force of ${T.F} N is applied ${T.r} m from a fixed axis. The force is perpendicular to the lever arm. Find the torque about the axis.`
      : `A force of ${T.F} N is applied ${T.r} m from a fixed axis. The angle between the lever arm and the force is ${T.phi}°. Find the torque about the axis.`),
    parts: [
      num('tau', ($) => $.tau, 'N·m', { label: 'torque' }),
    ],
    hints: [
      String.raw`The magnitude is $r F\sin\phi$. Measure $\phi$ between the lever arm and the force, and use the sine of that angle in degrees.`,
      'A perpendicular force has $\\sin 90^\\circ = 1$, so the torque is $rF$. A force along the lever arm has no torque.',
    ],
    steps: ($) => [
      String.raw`$\phi = ${texNum($.phiUsed)}^\circ$`,
      String.raw`$\tau = rF\sin\phi = ${texNum($.tau)}\ \mathrm{N\cdot m}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => {
        Object.assign(s, { shape: 'disk', m: 2, R: $.r, F: $.F, phi: $.phiUsed, w0: 0, t: 1, rider: 0, riderAt: 0 });
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.6, "Calculating Torque": the 5.0 m force of 30 N at 53°', { aim: 'angle', r: 5, F: 30, phi: 53 }, { tau: 120 }, {
        note: 'The book prints 120 N·m. Ours is 5.0 × 30 × sin 53° = 119.8 N·m.',
      }),
      kase('OpenStax University Physics Vol. 1 §10.6, "Calculating Torque": the 4.0 m force of 40 N at a right angle', { aim: 'square', r: 4, F: 40, phi: 53 }, { tau: 160 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.net',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.6',
    title: 'The net torque of several forces',
    topics: ['torque'],
    vars: {
      which: choice(['all', 'all four forces'], ['square', 'only the two forces at right angles']),
      F1: range(10, 60, 5, 'N'),
      F2: range(10, 40, 5, 'N'),
      F3: range(10, 50, 5, 'N'),
      F4: range(5, 40, 5, 'N'),
    },
    derive: ($) => {
      const F = [$.F1, $.F2, $.F3, $.F4];
      const square = $.which === 'square';
      return { tauA: torqueMag(4, $.F1, 90), tauNet: netTorque(F, square) };
    },
    second: ($) => {
      const F = [$.F1, $.F2, $.F3, $.F4];
      return { tauA: 4 * $.F1, tauNet: netByCross(F, $.which === 'square') };
    },
    valid: ($) => Math.abs($.tauNet) > 5,
    text: (T, $) => ($.which === 'square'
      ? `Two forces act on a body that can turn about the origin. A ${T.F1} N force sits 4.0 m out, perpendicular to its lever arm, and counterclockwise. A ${T.F2} N force sits 3.0 m out, also perpendicular, and clockwise. Find the torque of the 4.0 m force, and the net torque. Counterclockwise is positive.`
      : `Four forces act on a body that can turn about the origin. Take counterclockwise as positive. One is ${T.F1} N at 4.0 m and 90°, counterclockwise. One is ${T.F2} N at 3.0 m and 90°, clockwise. One is ${T.F3} N at 5.0 m and 53°, counterclockwise. One is ${T.F4} N at 1.0 m and 30°, counterclockwise. Find the torque of the 4.0 m force, and the net torque.`),
    parts: [
      num('tauA', ($) => $.tauA, 'N·m', { label: 'torque of the 4 m force' }),
      num('tauNet', ($) => $.tauNet, 'N·m', { label: 'net torque' }),
    ],
    hints: [
      String.raw`Each torque is $rF\sin\phi$, with a minus sign on the clockwise force. The 4.0 m force is perpendicular, so its torque is $4F_1$.`,
      'Add the signed torques. Dropping the minus sign, or using cosine on the angled forces, is a different total.',
    ],
    steps: ($) => [
      String.raw`$\tau_A = ${texNum($.tauA)}\ \mathrm{N\cdot m}$`,
      String.raw`$\tau_{\mathrm{net}} = ${texNum($.tauNet)}\ \mathrm{N\cdot m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.6, "Calculating Torque": 40 N at 4.0 m, 20 N at 3.0 m clockwise, 30 N at 5.0 m and 53°, 20 N at 1.0 m and 30°', { which: 'all', F1: 40, F2: 20, F3: 30, F4: 20 }, { tauA: 160, tauNet: 230 }, {
        note: 'The book prints 160 N·m for the first force and 230 N·m for the net. Ours for the net is 229.8 N·m, from sin 53° rather than the rounded 120 N·m piece.',
      }),
      kase('hand', { which: 'square', F1: 10, F2: 10, F3: 30, F4: 20 }, { tauA: 40, tauNet: 10 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.merry',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.7',
    title: 'A push on a merry-go-round',
    topics: ['torque', 'newton'],
    lab: 'rotor',
    vars: {
      seat: choice(['in', 'standing in from the rim'], ['rim', 'standing at the rim']),
      m: range(20, 80, 5, 'kg'),
      R: range(1, 2, 0.1, 'm'),
      F: range(50, 300, 10, 'N'),
      rider: range(10, 30, 2, 'kg'),
      at: range(0.4, 1, 0.1, ''),
    },
    derive: ($) => {
      const riderAt = $.seat === 'rim' ? $.R : $.at * $.R;
      const Ibare = inertiaDisk($.m, $.R);
      const I = Ibare + inertiaPoint($.rider, riderAt);
      const tau = torqueMag($.R, $.F, 90);
      return {
        riderAt,
        alphaBare: angularAcceleration(tau, Ibare),
        alpha: angularAcceleration(tau, I),
      };
    },
    second: ($) => {
      const riderAt = $.seat === 'rim' ? $.R : $.at * $.R;
      const Ibare = 0.5 * $.m * $.R * $.R;
      const I = Ibare + $.rider * riderAt * riderAt;
      const tau = $.R * $.F;
      return { alphaBare: tau / Ibare, alpha: tau / I };
    },
    valid: ($) => $.alphaBare + 1e-9 >= $.alpha && $.alpha > 0.2,
    text: (T, $) => ($.seat === 'rim'
      ? `A merry-go-round is a uniform disk of mass ${T.m} kg and radius ${T.R} m. A ${T.F} N force is applied at the rim, perpendicular to the radius. A child of mass ${T.rider} kg stands at the rim. Find the angular acceleration with no child, and the angular acceleration with the child.`
      : `A merry-go-round is a uniform disk of mass ${T.m} kg and radius ${T.R} m. A ${T.F} N force is applied at the rim, perpendicular to the radius. A child of mass ${T.rider} kg stands at ${T.at} of the radius. Find the angular acceleration with no child, and the angular acceleration with the child.`),
    parts: [
      num('alphaBare', ($) => $.alphaBare, 'rad/s²', { label: 'α with no child' }),
      num('alpha', ($) => $.alpha, 'rad/s²', { label: 'α with the child' }),
    ],
    hints: [
      String.raw`The disk about its center is $\frac12 mR^2$. The push is perpendicular, so $\tau = RF$, and $\alpha = \tau/I$.`,
      String.raw`The child is a point mass, $mr^2$, added to the disk. The child is not another disk, and the child's mass does not replace the disk.`,
    ],
    steps: ($) => [
      String.raw`$\alpha_{\mathrm{disk}} = ${texNum($.alphaBare)}\ \mathrm{rad/s^2}$`,
      String.raw`The child is at ${texNum($.riderAt)}\ \mathrm{m}, and $\alpha = ${texNum($.alpha)}\ \mathrm{rad/s^2}$`,
    ],
    sim: {
      scenario: 'child',
      setup: (s, $) => {
        Object.assign(s, {
          shape: 'disk', m: $.m, R: $.R, F: $.F, phi: 90, w0: 0, t: 1, rider: $.rider, riderAt: $.riderAt,
        });
      },
      read: (c) => ({ alphaBare: c.alphaBare, alpha: c.alpha }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.7, "Calculating the Effect of Mass Distribution on a Merry-Go-Round": a 50.0 kg disk of radius 1.50 m, a 250 N push, an 18.0 kg child at 1.25 m', { seat: 'in', m: 50, R: 1.5, F: 250, rider: 18, at: 1.25 / 1.5 }, { alphaBare: 6.67, alpha: 4.44 }, {
        note: 'The book prints 6.67 rad/s² with no child and 4.44 rad/s² with the child. Ours are 6.667 rad/s² and 4.444 rad/s².',
      }),
      kase('hand', { seat: 'rim', m: 2, R: 0.4, F: 8, rider: 0, at: 0.5 }, { alphaBare: 20, alpha: 20 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.pulley',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.7',
    title: 'Atwood machine with a massive pulley',
    topics: ['newton', 'torque'],
    lab: 'massive-pulley',
    vars: {
      kind: choice(['disk', 'a uniform disk'], ['light', 'light, with negligible mass']),
      m1: range(0.5, 4, 0.5, 'kg'),
      extra: range(0.8, 5, 0.2, 'kg'),
      mp: range(1, 6, 0.5, 'kg'),
      R: range(0.05, 0.3, 0.05, 'm'),
    },
    derive: ($) => {
      const m2 = $.m1 + $.extra;
      const mp = $.kind === 'light' ? 0 : $.mp;
      const I = mp > 0 ? inertiaDisk(mp, $.R) : 0;
      const run = atwoodPulley({ m1: $.m1, m2, I, R: $.R, g: G });
      return { m2, mpUsed: mp, I, a: run.a, T1: run.T1, T2: run.T2 };
    },
    second: ($) => {
      const m2 = $.m1 + $.extra;
      const mp = $.kind === 'light' ? 0 : $.mp;
      const share = mp > 0 ? 0.5 * mp : 0;
      const a = ((m2 - $.m1) * G) / ($.m1 + m2 + share);
      return { a, T1: $.m1 * (G + a), T2: m2 * (G - a) };
    },
    valid: ($) => $.a > 0.3 && $.T2 > $.T1,
    text: (T, $) => ($.kind === 'light'
      ? `Two masses hang from a light pulley: ${T.m1} kg on the rising side and ${T.extra} kg more than that on the descending side. The string does not slip. Find the acceleration, the tension on the lighter mass, and the tension on the heavier mass. Take g = 9.81 m/s².`
      : `Two masses hang from a uniform disk pulley of mass ${T.mp} kg and radius ${T.R} m: ${T.m1} kg on the rising side and ${T.extra} kg more than that on the descending side. The string does not slip. Find the acceleration, the tension on the lighter mass, and the tension on the heavier mass. Take g = 9.81 m/s².`),
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
      num('T1', ($) => $.T1, 'N', { label: 'tension on the lighter mass' }),
      num('T2', ($) => $.T2, 'N', { label: 'tension on the heavier mass' }),
    ],
    hints: [
      String.raw`A disk has $I = \frac12 m_p R^2$, so $I/R^2 = \frac12 m_p$. The radius cancels. A light pulley has $I = 0$.`,
      String.raw`$a = (m_2 - m_1)g / (m_1 + m_2 + I/R^2)$. Then $T_1 = m_1(g + a)$ and $T_2 = m_2(g - a)$. The two tensions differ by $I\alpha/R$ when the pulley has mass.`,
    ],
    steps: ($) => [
      String.raw`$m_2 = ${texNum($.m2)}\ \mathrm{kg}$, $I = ${texNum($.I)}\ \mathrm{kg\cdot m^2}$`,
      String.raw`$a = ${texNum($.a)}\ \mathrm{m/s^2}$, $T_1 = ${texNum($.T1)}\ \mathrm{N}$, $T_2 = ${texNum($.T2)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => { Object.assign(s, { m1: $.m1, m2: $.m2, mp: $.mpUsed, R: $.R }); },
      read: (c) => ({ a: c.a, T1: c.T1, T2: c.T2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.7: a disk pulley, worked with τ = Iα. The numbers are ours: 1.00 kg, 3.00 kg, pulley 2.00 kg, radius 0.100 m', { kind: 'disk', m1: 1, extra: 2, mp: 2, R: 0.1 }, { a: 3.924, T1: 13.734, T2: 17.658 }, {
        note: 'Section 10.7 derives the Atwood machine with a pulley moment and does not print this set of numbers. a = (2)(9.81)/(1 + 3 + 1) = 3.924 m/s².',
      }),
      kase('hand', { kind: 'light', m1: 1, extra: 1, mp: 4, R: 0.2 }, { a: (1 * 9.81) / 3, T1: 1 * (9.81 + 9.81 / 3), T2: 2 * (9.81 - 9.81 / 3) }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.work',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §10.8',
    title: 'Work done by a rope on a pulley',
    topics: ['rotational-work'],
    lab: 'rotor',
    vars: {
      told: choice(['distance', 'how far the rope is pulled'], ['turns', 'how many revolutions the pulley makes']),
      F: range(10, 80, 5, 'N'),
      R: range(0.05, 0.4, 0.05, 'm'),
      I: range(0.002, 0.02, 0.002, 'kg·m²'),
      d: range(0.4, 2, 0.2, 'm'),
      revs: range(1, 6, 1, 'rev'),
    },
    derive: ($) => {
      const d = $.told === 'turns' ? $.revs * 2 * Math.PI * $.R : $.d;
      const W = $.F * d;
      const omega = Math.sqrt((2 * W) / $.I);
      return { dUsed: d, W, omega };
    },
    second: ($) => {
      const d = $.told === 'turns' ? $.revs * 2 * Math.PI * $.R : $.d;
      const tau = $.F * $.R;
      const theta = d / $.R;
      const alpha = tau / $.I;
      const t = Math.sqrt((2 * theta) / alpha);
      const spun = constAlpha({ theta0: 0, omega0: 0, alpha, t });
      return { W: tau * theta, omega: spun.omega };
    },
    valid: ($) => $.W > 2 && $.omega > 1 && $.omega < 500,
    text: (T, $) => ($.told === 'turns'
      ? `A pulley has moment of inertia ${T.I} kg·m² and radius ${T.R} m. A rope is pulled with a steady ${T.F} N, tangent to the rim, and the pulley turns through ${T.revs} revolutions from rest. Find the angular velocity at the end, and the work the rope does.`
      : `A pulley has moment of inertia ${T.I} kg·m² and radius ${T.R} m. A rope is pulled with a steady ${T.F} N, tangent to the rim, through ${T.d} m, from rest. Find the angular velocity at the end, and the work the rope does.`),
    parts: [
      num('omega', ($) => $.omega, 'rad/s', { label: 'angular velocity' }),
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`The work is the force times the distance the rope moves, which is also $\tau\theta$. From rest, that work equals $\frac12 I\omega^2$.`,
      String.raw`So $\omega = \sqrt{2W/I}$. Do not use the rope distance as if it were an angle in radians.`,
    ],
    steps: ($) => [
      String.raw`$W = ${texNum($.W)}\ \mathrm{J}$`,
      String.raw`$\omega = \sqrt{2W/I} = ${texNum($.omega)}\ \mathrm{rad/s}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => {
        const R = $.R;
        const I = $.I;
        const m = (2 * I) / (R * R);
        const alpha = ($.F * R) / I;
        const theta = $.dUsed / R;
        const t = Math.sqrt((2 * theta) / alpha);
        Object.assign(s, { shape: 'disk', m, R, F: $.F, phi: 90, w0: 0, t, rider: 0, riderAt: 0 });
      },
      read: (c) => ({ omega: c.omega, W: c.W }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.8, "Rotational Work: A Pulley": 50 N through 1.0 m on a pulley of radius 0.10 m and I = 2.5×10⁻³ kg·m², from rest', { told: 'distance', F: 50, R: 0.1, I: 0.0025, d: 1, revs: 2 }, { omega: 200, W: 50 }, {
        note: 'The book prints ω = 200 rad/s. The work is τθ = Fd = 50 J, equal to the gain in rotational kinetic energy.',
      }),
      kase('hand', { told: 'distance', F: 4, R: 0.2, I: 0.5, d: 1, revs: 1 }, { omega: 4, W: 4 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.power',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §10.8',
    title: 'Torque from power and spin',
    topics: ['rotational-work'],
    vars: {
      told: choice(['rpm', 'the spin in revolutions per minute'], ['rad', 'the spin in radians per second']),
      P: range(500, 20000, 500, 'W'),
      rpm: range(60, 600, 30, 'rpm'),
      w: range(5, 40, 1, 'rad/s'),
    },
    derive: ($) => {
      const omega = $.told === 'rpm' ? ($.rpm * 2 * Math.PI) / 60 : $.w;
      return { omega, tau: $.P / omega };
    },
    second: ($) => {
      const omega = $.told === 'rpm' ? ($.rpm * Math.PI) / 30 : $.w;
      return { omega, tau: $.P / omega };
    },
    valid: ($) => $.tau > 1 && $.omega > 1,
    text: (T, $) => ($.told === 'rpm'
      ? `A shaft delivers ${T.P} W while it turns at ${T.rpm} rpm. Find the angular velocity in rad/s, and the torque.`
      : `A shaft delivers ${T.P} W while it turns at ${T.w} rad/s. Find the angular velocity in rad/s, and the torque.`),
    parts: [
      num('omega', ($) => $.omega, 'rad/s', { label: 'angular velocity' }),
      num('tau', ($) => $.tau, 'N·m', { label: 'torque' }),
    ],
    hints: [
      String.raw`Power is $\tau\omega$, so $\tau = P/\omega$. The angular velocity in that formula is in rad/s.`,
      String.raw`Revolutions per minute become rad/s by multiplying by $2\pi/60$. Leaving the spin in rpm makes the torque far too small.`,
    ],
    steps: ($) => [
      String.raw`$\omega = ${texNum($.omega)}\ \mathrm{rad/s}$`,
      String.raw`$\tau = P/\omega = ${texNum($.tau)}\ \mathrm{N\cdot m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.8, "Torque on a Boat Propeller": 9.0×10⁴ W at 300 rev/min', { told: 'rpm', P: 90000, rpm: 300, w: 10 }, { omega: 31.4, tau: 2864.8 }, {
        note: 'The book prints τ = 2864.8 N·m. Ours is 90000/(10π) = 2864.8 N·m, and ω = 10π = 31.42 rad/s. The book’s 31.4 rad/s is that value to three figures.',
      }),
      kase('hand', { told: 'rad', P: 100, rpm: 60, w: 2 * Math.PI }, { omega: 2 * Math.PI, tau: 100 / (2 * Math.PI) }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.flywheel',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §10.8',
    title: 'A flywheel spun by a constant torque',
    topics: ['rotational-work'],
    lab: 'rotor',
    vars: {
      start: choice(['rest', 'from rest'], ['moving', 'already turning']),
      tau: range(4, 20, 2, 'N·m'),
      I: range(8, 40, 2, 'kg·m²'),
      revs: range(2, 10, 1, 'rev'),
      w0: range(1, 6, 0.5, 'rad/s'),
    },
    derive: ($) => {
      const theta = $.revs * 2 * Math.PI;
      const w0 = $.start === 'rest' ? 0 : $.w0;
      const omega = Math.sqrt(w0 * w0 + (2 * $.tau * theta) / $.I);
      return { theta, w0Used: w0, omega, W: $.tau * theta };
    },
    second: ($) => {
      const theta = $.revs * 2 * Math.PI;
      const w0 = $.start === 'rest' ? 0 : $.w0;
      const alpha = $.tau / $.I;
      const disc = w0 * w0 + 2 * alpha * theta;
      const t = (-w0 + Math.sqrt(disc)) / alpha;
      const spun = constAlpha({ theta0: 0, omega0: w0, alpha, t });
      return { omega: spun.omega, W: rotationalKE($.I, spun.omega) - rotationalKE($.I, w0) };
    },
    valid: ($) => $.omega >= 1 && $.W > 1,
    text: (T, $) => ($.start === 'rest'
      ? `A flywheel has moment of inertia ${T.I} kg·m². A constant torque of ${T.tau} N·m turns it through ${T.revs} revolutions from rest. Find the angular velocity at the end, and the work done by the torque.`
      : `A flywheel has moment of inertia ${T.I} kg·m² and is already turning at ${T.w0} rad/s. A constant torque of ${T.tau} N·m turns it through a further ${T.revs} revolutions. Find the angular velocity at the end, and the work done by the torque.`),
    parts: [
      num('omega', ($) => $.omega, 'rad/s', { label: 'angular velocity' }),
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`The work is $\tau\theta$, and $\theta$ is the revolutions times $2\pi$. That work is the gain in $\frac12 I\omega^2$.`,
      String.raw`From rest, $\omega = \sqrt{2\tau\theta/I}$. If it is already turning, add $\omega_0^2$ inside the square root.`,
    ],
    steps: ($) => [
      String.raw`$\theta = ${texNum($.theta)}\ \mathrm{rad}$, $W = ${texNum($.W)}\ \mathrm{J}$`,
      String.raw`$\omega = ${texNum($.omega)}\ \mathrm{rad/s}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => {
        const R = 1;
        const alpha = $.tau / $.I;
        const disc = $.w0Used * $.w0Used + 2 * alpha * $.theta;
        const t = (-$.w0Used + Math.sqrt(disc)) / alpha;
        Object.assign(s, {
          shape: 'disk', m: 2 * $.I, R, F: $.tau / R, phi: 90, w0: $.w0Used, t, rider: 0, riderAt: 0,
        });
      },
      read: (c) => ({ omega: c.omega, W: c.W }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.8, "Rotational Work and Energy": 12.0 N·m, I = 30.0 kg·m², eight revolutions from rest', { start: 'rest', tau: 12, I: 30, revs: 8, w0: 2 }, { omega: 6.3, W: 12 * 16 * Math.PI }, {
        note: 'The book prints ω = 6.3 rad/s. Ours is 6.341 rad/s. The work, τθ = 12 × 16π = 603.2 J, is the same number as the gain in kinetic energy.',
      }),
      kase('hand', { start: 'rest', tau: 4, I: 8, revs: 1 / (2 * Math.PI), w0: 1 }, { omega: 1, W: 4 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.concept-shape',
    src: 'OpenStax University Physics Vol. 1 §10.4',
    title: 'Which body spins up fastest',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'rotor',
    topics: ['inertia', 'newton'],
    vars: {
      q: choice(
        [1, 'A hoop, a disk, and a solid sphere have the same mass and the same outer radius. The same torque acts on each about its center. The largest angular acceleration belongs to:'],
        [2, 'A disk and a hoop have the same mass and the same radius. A tangent force of the same size acts at the rim of each. The disk\'s angular acceleration, compared with the hoop\'s, is:'],
        [3, 'You double the radius of a disk and keep its mass. The same tangent force stays at the rim. The angular acceleration:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sphere', 2: 'twice', 3: 'half' }[$.q] }),
    second: ($) => {
      const I = { sphere: inertiaSphere(2, 0.4), disk: inertiaDisk(2, 0.4), hoop: inertiaHoop(2, 0.4) };
      if ($.q === 1) {
        const best = Object.entries(I).sort((a, b) => a[1] - b[1])[0][0];
        return { ans: best };
      }
      if ($.q === 2) {
        const aDisk = 0.4 * 8 / I.disk;
        const aHoop = 0.4 * 8 / I.hoop;
        return { ans: Math.abs(aDisk / aHoop - 2) < 1e-9 ? 'twice' : 'same' };
      }
      const a1 = (0.4 * 8) / inertiaDisk(2, 0.4);
      const a2 = (0.8 * 8) / inertiaDisk(2, 0.8);
      return { ans: Math.abs(a2 / a1 - 0.5) < 1e-9 ? 'half' : 'quarter' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['sphere', 'The solid sphere', 'The sphere has the smallest I, (2/5)mR². The same torque then gives the largest α.'],
          ['disk', 'The disk', 'A disk has (1/2)mR², which is more than the sphere and less than the hoop.'],
          ['hoop', 'The hoop', 'The hoop has the largest I, mR², so it has the smallest α.'],
        ],
        2: [
          ['twice', 'Twice the hoop\'s', 'The disk\'s I is half the hoop\'s, and the torque is the same, so α is twice as large.'],
          ['half', 'Half the hoop\'s', 'That swaps the two bodies. The hoop is the one that resists more.'],
          ['same', 'The same', 'Equal mass and radius do not mean equal I. The hoop keeps every bit of mass at R.'],
        ],
        3: [
          ['half', 'Is halved', 'I grows as R², so it becomes four times as large, and the torque only doubles because the force is at the new rim. α is halved.'],
          ['quarter', 'Is quartered', 'That would be right if the torque stayed fixed. A force at the new rim doubles the torque, so α falls by half, not by four.'],
          ['same', 'Is unchanged', 'The radius cancels only for a disk\'s I/R² in a different problem. Here both τ and I change.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$\alpha = \tau/I$. The body with the smallest moment has the largest angular acceleration, for one torque.`,
      String.raw`A solid sphere is $\frac25 mR^2$, a disk is $\frac12 mR^2$, and a thin hoop about its center is $mR^2$.`,
    ],
    steps: ($) => [{ 1: 'The sphere has the smallest I, so the largest α.', 2: 'The disk has half the hoop’s I, so twice the α.', 3: 'τ doubles and I quadruples, so α is halved.' }[$.q]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.4: the table of moments, a sphere under a disk under a hoop', { q: 1 }, { ans: 'sphere' }),
      kase('OpenStax University Physics Vol. 1 §10.4: a hoop has twice the moment of a disk of the same mass and radius', { q: 2 }, { ans: 'twice' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.concept-sign',
    src: 'OpenStax University Physics Vol. 1 §10.2',
    title: 'The sign of a spin',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'rotor',
    topics: ['angular-kinematics'],
    vars: {
      q: choice(
        [1, 'A wheel has a positive angular velocity. A brake gives it a negative angular acceleration. While the brake acts:'],
        [2, 'A wheel starts from rest. A positive constant α acts for a time t. The angle it turns through is:'],
        [3, 'A rotor turns at 300 rpm. Its angular velocity in rad/s is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'slows', 2: 'half', 3: 'tenpi' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const spun = constAlpha({ omega0: 4, alpha: -2, t: 1 });
        return { ans: spun.omega < 4 ? 'slows' : 'speeds' };
      }
      if ($.q === 2) {
        const full = constAlpha({ omega0: 0, alpha: 3, t: 2 });
        const half = 0.5 * 3 * 2 * 2;
        return { ans: Math.abs(full.theta - half) < 1e-9 ? 'half' : 'full' };
      }
      const w = 300 * 2 * Math.PI / 60;
      return { ans: Math.abs(w - 10 * Math.PI) < 1e-9 ? 'tenpi' : 'three' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['slows', 'The wheel slows down', 'α and ω have opposite signs, so ω moves toward zero. The wheel is not yet required to reverse.'],
          ['speeds', 'The wheel speeds up', 'A positive α would speed up a positive ω. The brake is the opposite sign.'],
          ['reverse', 'The wheel immediately reverses', 'It reverses only after ω reaches zero, if the brake is still on. Opposite signs first mean slowing.'],
        ],
        2: [
          ['half', '½ α t²', 'From rest, the ω0 t term is zero. The factor 1/2 stays, as it does for x = ½ a t².'],
          ['full', 'α t²', 'That drops the 1/2. The angle formula is the position formula, not α times t squared.'],
          ['omega', 'α t', 'That is the angular velocity from rest, in rad/s, not the angle.'],
        ],
        3: [
          ['tenpi', '10π rad/s', '300 rev/min is 5 rev/s, and each revolution is 2π radians, so 10π rad/s.'],
          ['three', '300 rad/s', 'rpm is not rad/s. A radian is a much smaller turn than a revolution.'],
          ['pi', '300π rad/s', 'That multiplies by π and forgets to divide by 60. The minute has to come out.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Angular velocity and angular acceleration use the same sign rule as v and a. Opposite signs mean the spin is slowing.',
      String.raw`From rest, $\theta = \frac12\alpha t^2$ and $\omega = \alpha t$. Convert rpm with $2\pi/60$ before you use a radian formula.`,
    ],
    steps: ($) => [{ 1: 'Opposite signs: the wheel slows.', 2: 'From rest, θ = ½ α t².', 3: '300 rpm = 10π rad/s.' }[$.q]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.2, "Calculating the Duration When the Fishing Reel Slows Down and Stops": the brake opposes the spin', { q: 1 }, { ans: 'slows' }),
      kase('OpenStax University Physics Vol. 1 §10.4, "Calculating Helicopter Energies": 300 rpm is 10π rad/s', { q: 3 }, { ans: 'tenpi' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.concept-axis',
    src: 'OpenStax University Physics Vol. 1 §10.5',
    title: 'Moving the axis',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'inertia',
    topics: ['parallel-axis', 'inertia'],
    vars: {
      q: choice(
        [1, 'A uniform rod has moment I_cm about its center. About one end, the moment is:'],
        [2, 'You move an axis a distance d away from the center of mass. The new moment is:'],
        [3, 'A student computes a rod about its end as mL²/12. That number is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'four', 2: 'add', 3: 'center' }[$.q] }),
    second: ($) => {
      const Icm = inertiaRodCenter(3, 2);
      const Iend = inertiaRodEnd(3, 2);
      if ($.q === 1) return { ans: Math.abs(Iend / Icm - 4) < 1e-9 ? 'four' : 'same' };
      if ($.q === 2) {
        const moved = parallelAxisMass(Icm, 3, 1);
        return { ans: moved > Icm ? 'add' : 'sub' };
      }
      return { ans: Math.abs(inertiaRodCenter(2, 0.5) - (2 * 0.25) / 12) < 1e-9 ? 'center' : 'end' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['four', 'Four times I_cm', 'I_end = I_cm + m(L/2)² = mL²/12 + mL²/4 = mL²/3, which is four times mL²/12.'],
          ['same', 'Equal to I_cm', 'The end is farther from the mass. The moment has to grow.'],
          ['twelve', 'mL², with no fraction', 'The end formula is mL²/3, not mL². The 1/3 is the integral of a uniform rod.'],
        ],
        2: [
          ['add', 'I_cm + m d²', 'The parallel-axis theorem adds md². Mass is farther from the new axis, so I grows.'],
          ['sub', 'I_cm − m d²', 'Subtracting would make the moment smaller, and it can go negative. The shift adds.'],
          ['md', 'I_cm + m d', 'The extra term is m times d squared, not m times d. A moment of inertia is mass times length squared.'],
        ],
        3: [
          ['center', 'The moment about the center, not about the end', 'mL²/12 is the center. The end is mL²/3, or the center plus m(L/2)².'],
          ['end', 'The moment about the end', 'The end is four times larger. mL²/12 is the smaller, central axis.'],
          ['zero', 'Zero, because the ends cancel', 'A rod has mass at a distance from the center. The center moment is not zero.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`The parallel-axis theorem is $I = I_{\mathrm{cm}} + md^2$. The added term is never negative.`,
      String.raw`For a thin rod, the center is $\frac{1}{12}mL^2$ and one end is $\frac13 mL^2$.`,
    ],
    steps: ($) => [{ 1: 'The end is four times the center.', 2: 'Add md².', 3: 'mL²/12 is the center.' }[$.q]],
    sim: { scenario: 'end', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.5: a rod about one end is mL²/3', { q: 1 }, { ans: 'four' }),
      kase('OpenStax University Physics Vol. 1 §10.5: the parallel-axis theorem adds md²', { q: 2 }, { ans: 'add' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.concept-pulley',
    src: 'OpenStax University Physics Vol. 1 §10.7',
    title: 'What a massive pulley changes',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'massive-pulley',
    topics: ['newton', 'torque'],
    vars: {
      q: choice(
        [1, 'An Atwood machine has a pulley with a nonzero moment of inertia. Compared with a light pulley and the same two masses, the acceleration is:'],
        [2, 'The string does not slip on that pulley. The two tensions are:'],
        [3, 'You double the radius of a uniform disk pulley and keep its mass. The acceleration of the two hanging masses:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'smaller', 2: 'differ', 3: 'same' }[$.q] }),
    second: ($) => {
      const light = atwoodPulley({ m1: 1, m2: 3, I: 0, R: 0.1, g: G });
      const heavy = atwoodPulley({ m1: 1, m2: 3, I: inertiaDisk(2, 0.1), R: 0.1, g: G });
      const wide = atwoodPulley({ m1: 1, m2: 3, I: inertiaDisk(2, 0.2), R: 0.2, g: G });
      if ($.q === 1) return { ans: heavy.a < light.a ? 'smaller' : 'larger' };
      if ($.q === 2) return { ans: Math.abs(heavy.T2 - heavy.T1) > 1e-6 ? 'differ' : 'equal' };
      return { ans: Math.abs(wide.a - heavy.a) < 1e-9 ? 'same' : 'changes' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['smaller', 'Smaller', 'I/R² is added in the denominator. The same imbalance of weight has more inertia to speed up.'],
          ['larger', 'Larger', 'A heavy pulley does not help the masses along. It has to be spun, which costs acceleration.'],
          ['same', 'Unchanged', 'That is true only when I = 0. A real pulley changes the number.'],
        ],
        2: [
          ['differ', 'Different. The larger tension is on the descending side', 'The tension difference supplies τ = Iα. A light pulley is the special case with one tension.'],
          ['equal', 'Equal', 'Equal tensions give no net torque, so a pulley with I would not angularly accelerate.'],
          ['zero', 'Both zero, because the pulley takes the load', 'Each mass still has its own T = m(g ± a). The pulley changes them. It does not remove them.'],
        ],
        3: [
          ['same', 'Stays the same', 'A disk has I = (1/2) m R², so I/R² = m/2. The radius cancels. Doubling R at fixed pulley mass does not change a.'],
          ['half', 'Is halved', 'That would happen if I stayed fixed while R doubled. For a disk, I grows with R² and the ratio does not.'],
          ['double', 'Doubles', 'Nothing in the acceleration grows when the disk is scaled up at fixed mass.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$a = (m_2 - m_1)g / (m_1 + m_2 + I/R^2)$. Anything that adds to the denominator lowers $a$.`,
      String.raw`A disk gives $I/R^2 = \frac12 m_p$. The two tensions satisfy $(T_2 - T_1)R = I\alpha$.`,
    ],
    steps: ($) => [{ 1: 'I/R² lowers the acceleration.', 2: 'The tensions differ by Iα/R.', 3: 'For a disk, the radius cancels.' }[$.q]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.7: a pulley with I adds I/R² to the Atwood denominator', { q: 1 }, { ans: 'smaller' }),
      kase('OpenStax University Physics Vol. 1 §10.7: the two string tensions differ by the pulley torque', { q: 2 }, { ans: 'differ' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch10.concept-work',
    src: 'OpenStax University Physics Vol. 1 §10.8',
    title: 'Where the rotational work goes',
    kind: 'conceptual',
    level: 2,
    variety: ['representation'],
    lab: 'rotor',
    topics: ['rotational-work'],
    vars: {
      q: choice(
        [1, 'A constant torque turns a body about a fixed axis, and friction in the bearing is negligible. The work τθ equals:'],
        [2, 'A shaft turns at a steady ω and delivers power P. The torque is:'],
        [3, 'A flywheel starts from rest and a constant torque turns it through 8 revolutions. Using 8 as the angle in the work τθ:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'gain', 2: 'over', 3: 'small' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const tau = 5;
        const theta = 2;
        const I = 0.5;
        const omega = Math.sqrt((2 * tau * theta) / I);
        return { ans: Math.abs(tau * theta - rotationalKE(I, omega)) < 1e-9 ? 'gain' : 'other' };
      }
      if ($.q === 2) {
        const right = 90000 / (10 * Math.PI);
        const asRpm = 90000 / 300;
        return { ans: asRpm < right ? 'over' : 'under' };
      }
      const asRev = 12 * 8;
      const asRad = 12 * 8 * 2 * Math.PI;
      return { ans: asRev < asRad ? 'small' : 'large' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['gain', 'The gain in rotational kinetic energy', 'With no other work, W = ΔK. From rest, τθ = ½Iω².'],
          ['force', 'The force times the radius', 'That product is the torque, in N·m, not the work. The work multiplies the torque by the angle in radians.'],
          ['zero', 'Zero, because the axis is fixed', 'The axis does no work. The force at the rim does. A fixed axis is not a reason to drop τθ.'],
        ],
        2: [
          ['over', 'P/ω, with ω in rad/s', 'P = τω, so τ = P/ω. An rpm in that division is not a radian per second.'],
          ['times', 'P times ω', 'Power is the product. The torque is the power divided by the angular velocity.'],
          ['rpm', 'P divided by the spin in rpm', 'That leaves a factor of 2π/60 out and gives a torque that is far too small.'],
        ],
        3: [
          ['small', 'Gives a work that is too small, by a factor of 2π', 'Eight revolutions are 16π radians. The angle in τθ is in radians.'],
          ['right', 'Is correct, because a revolution is the natural angle', 'The formula uses radians. A revolution has to be converted.'],
          ['large', 'Gives a work that is too large', 'Using 8 instead of 16π makes the work smaller, not larger.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`The work of a torque about a fixed axis is $\tau\theta$, with $\theta$ in radians. That work equals the change in $\frac12 I\omega^2$ when nothing else does work.`,
      String.raw`Power is $\tau\omega$. Solve for the torque, and keep $\omega$ in rad/s.`,
    ],
    steps: ($) => [{ 1: 'τθ equals the gain in rotational kinetic energy.', 2: 'τ = P/ω, with ω in rad/s.', 3: 'Eight revolutions are 16π radians.' }[$.q]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §10.8, "Rotational Work: A Pulley": the work equals the gain in rotational kinetic energy', { q: 1 }, { ans: 'gain' }),
      kase('OpenStax University Physics Vol. 1 §10.8, "Rotational Work and Energy": eight revolutions are 16π rad', { q: 3 }, { ans: 'small' }),
    ],
  }),
];
