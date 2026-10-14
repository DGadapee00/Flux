/** Ch 6 · Applications of Newton's laws. OpenStax University Physics Vol. 1, §§6.2–6.3. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { acceleration, atwood, centripetalForce, incline, weight } from '@flux/subjects/mechanics/dynamics.js';
import { centripetalAccel } from '@flux/subjects/mechanics/kinematics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u2', ch: '6' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch6.level',
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'Kinetic friction on level ground',
    topics: ['friction', 'newton'],
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      mu: range(0.1, 0.45, 0.05, ''),
      F: range(8, 60, 1, 'N'),
    },
    derive: ($) => {
      const N = -weight($.m, G).y;
      const f = $.mu * N;
      const a = acceleration(v($.F - f, 0, 0), $.m).x;
      return { N, f, a };
    },
    second: ($) => ({
      N: $.m * G,
      f: $.mu * $.m * G,
      a: $.F / $.m - $.mu * G,
    }),
    valid: ($) => $.a > 0.3,
    text: (T) => `A ${T.m} kg block is pushed along a level floor by a horizontal force of ${T.F} N. The coefficient of kinetic friction is ${T.mu}. Take g = ${G} m/s². Find the normal force, the friction force, and the acceleration. The block is sliding in the direction of the push.`,
    parts: [
      num('N', ($) => $.N, 'N', { label: 'normal force' }),
      num('f', ($) => $.f, 'N', { label: 'friction' }),
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
    ],
    hints: [
      String.raw`On level ground the normal force equals the weight. Kinetic friction is $\mu_k N$, opposite the velocity.`,
    ],
    steps: ($) => [
      String.raw`$N = mg = ${texNum($.N)}\ \mathrm{N}$, $f_k = \mu_k N = ${texNum($.f)}\ \mathrm{N}$`,
      String.raw`$a = (F - f_k)/m = ${texNum($.a)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m: 5, mu: 0.2, F: 20 }, { N: 49.05, f: 9.81, a: 2.038 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.smooth',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'Frictionless incline',
    topics: ['incline', 'newton'],
    vars: {
      m: range(0.5, 12, 0.5, 'kg'),
      theta: range(15, 60, 5, '°'),
    },
    derive: ($) => {
      const block = incline({ mass: $.m, thetaDeg: $.theta, mu: 0, g: G, motion: 'down' });
      return { a: block.aDown, N: block.N };
    },
    second: ($) => {
      const th = $.theta * DEG;
      return { a: G * Math.sin(th), N: $.m * G * Math.cos(th) };
    },
    text: (T) => `A ${T.m} kg block slides down a frictionless incline at ${T.theta}° to the horizontal. Take g = ${G} m/s². Find the acceleration down the plane and the normal force.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration down the plane' }),
      num('N', ($) => $.N, 'N', { label: 'normal force' }),
    ],
    hints: [
      String.raw`The weight splits into $mg\sin\theta$ down the plane and $mg\cos\theta$ into the surface.`,
    ],
    steps: ($) => [
      String.raw`$a = g\sin\theta = ${texNum($.a)}\ \mathrm{m/s}^2$`,
      String.raw`$N = mg\cos\theta = ${texNum($.N)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 2, theta: 30 }, { a: 4.905, N: 16.9914 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.rough',
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'Incline with kinetic friction',
    topics: ['incline', 'friction'],
    vars: {
      m: range(0.5, 10, 0.5, 'kg'),
      theta: range(30, 55, 5, '°'),
      mu: range(0.05, 0.25, 0.05, ''),
    },
    derive: ($) => {
      const block = incline({ mass: $.m, thetaDeg: $.theta, mu: $.mu, g: G, motion: 'down' });
      return { a: block.aDown, N: block.N, f: block.f };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const N = $.m * G * Math.cos(th);
      return { a: G * (Math.sin(th) - $.mu * Math.cos(th)), N, f: $.mu * N };
    },
    valid: ($) => $.a > 0.4,
    text: (T) => `A ${T.m} kg block slides down a ${T.theta}° incline. The coefficient of kinetic friction is ${T.mu}. Take g = ${G} m/s². Find the acceleration down the plane, the normal force, and the friction force.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration down the plane' }),
      num('N', ($) => $.N, 'N', { label: 'normal force' }),
      num('f', ($) => $.f, 'N', { label: 'friction' }),
    ],
    hints: [
      String.raw`Kinetic friction is $\mu_k N$ and points up the plane while the block slides down. Then $a = g(\sin\theta - \mu_k\cos\theta)$.`,
    ],
    steps: ($) => [
      String.raw`$N = mg\cos\theta = ${texNum($.N)}\ \mathrm{N}$, $f_k = ${texNum($.f)}\ \mathrm{N}$`,
      String.raw`$a = g(\sin\theta - \mu_k\cos\theta) = ${texNum($.a)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m: 3, theta: 40, mu: 0.15 }, { a: 5.17851, N: 22.5447, f: 3.38170 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.atwood',
    src: 'OpenStax University Physics Vol. 1 §6.1',
    title: 'Atwood machine',
    topics: ['atwood', 'newton'],
    vars: {
      m1: range(1, 6, 0.5, 'kg'),
      m2: range(2, 10, 0.5, 'kg'),
    },
    derive: ($) => atwood($.m1, $.m2, G),
    // T + m2 a = m2 g and T − m1 a = m1 g, solved as a 2×2 system.
    second: ($) => {
      const { m1, m2 } = $;
      const det = 1 * -m1 - m2 * 1;
      const T = (m2 * G * -m1 - m2 * m1 * G) / det;
      const a = (1 * m1 * G - m2 * G * 1) / det;
      return { a, T };
    },
    valid: ($) => $.m2 >= $.m1 + 0.5 && $.a > 0.2,
    text: (T) => `An Atwood machine has masses ${T.m1} kg and ${T.m2} kg, with the second mass on the side that can descend. The string and pulley are light, and the pulley is frictionless. Take g = ${G} m/s². Find the acceleration and the tension.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
      num('T', ($) => $.T, 'N', { label: 'tension' }),
    ],
    hints: [
      String.raw`Write $m_2 g - T = m_2 a$ and $T - m_1 g = m_1 a$, with $a$ positive when $m_2$ descends.`,
    ],
    steps: ($) => [
      String.raw`$a = (m_2-m_1)g/(m_1+m_2) = ${texNum($.a)}\ \mathrm{m/s}^2$`,
      String.raw`$T = 2 m_1 m_2 g/(m_1+m_2) = ${texNum($.T)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m1: 2, m2: 4 }, { a: 3.27, T: 26.16 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.circle',
    src: 'OpenStax University Physics Vol. 1 §6.3',
    title: 'Centripetal force',
    topics: ['circular', 'newton'],
    vars: {
      m: range(0.2, 5, 0.2, 'kg'),
      v0: range(2, 15, 0.5, 'm/s'),
      r: range(0.4, 8, 0.2, 'm'),
    },
    derive: ($) => ({
      F: centripetalForce($.m, $.v0, $.r),
      a: centripetalAccel($.v0, $.r),
    }),
    second: ($) => ({
      F: $.m * $.v0 * $.v0 / $.r,
      a: $.v0 * $.v0 / $.r,
    }),
    text: (T) => `A ${T.m} kg object moves in a horizontal circle of radius ${T.r} m at ${T.v0} m/s. Find the centripetal force and the centripetal acceleration.`,
    parts: [
      num('F', ($) => $.F, 'N', { label: 'centripetal force' }),
      num('a', ($) => $.a, 'm/s²', { label: 'centripetal acceleration' }),
    ],
    hints: [
      String.raw`The acceleration toward the center is $v^2/r$. The net force toward the center is $mv^2/r$.`,
    ],
    steps: ($) => [
      String.raw`$a = v^2/r = ${texNum($.a)}\ \mathrm{m/s}^2$`,
      String.raw`$F = mv^2/r = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 0.5, v0: 4, r: 0.8 }, { F: 10, a: 20 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch6.repose',
    src: 'OpenStax University Physics Vol. 1 §6.2',
    title: 'Will the block stay put?',
    topics: ['friction', 'incline'],
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      theta: range(10, 50, 5, '°'),
      mu: range(0.1, 0.9, 0.05, ''),
    },
    derive: ($) => {
      const block = incline({ mass: $.m, thetaDeg: $.theta, mu: $.mu, g: G, motion: 'rest' });
      return {
        N: block.N,
        f: block.f,
        holds: block.holds ? 'yes' : 'no',
        muMin: Math.tan($.theta * DEG),
      };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const N = $.m * G * Math.cos(th);
      const down = $.m * G * Math.sin(th);
      const holds = $.mu * N + 1e-9 >= down;
      return { N, f: holds ? down : $.mu * N, holds: holds ? 'yes' : 'no', muMin: Math.sin(th) / Math.cos(th) };
    },
    text: (T) => `A ${T.m} kg block sits on a ${T.theta}° incline. The coefficient of static friction is ${T.mu}. Take g = ${G} m/s². Find the normal force, the friction this model reports, the smallest coefficient that would hold the block, and whether this coefficient is enough. When the block stays put, friction equals the downhill part of the weight. When it does not, the model reports μ N, the most static friction can do.`,
    parts: [
      num('N', ($) => $.N, 'N', { label: 'normal force' }),
      num('f', ($) => $.f, 'N', { label: 'friction' }),
      num('muMin', ($) => $.muMin, '', { label: 'minimum μ to hold', abs: 0.002 }),
      mc('holds', [
        ['yes', 'It holds'],
        ['no', 'It slides'],
      ], ($) => $.holds, { label: 'at rest?' }),
    ],
    hints: [
      String.raw`The block holds when $\mu_s \ge \tan\theta$. If it holds, friction equals $mg\sin\theta$. If it does not, static friction cannot reach that value.`,
    ],
    steps: ($) => [
      String.raw`$N = mg\cos\theta = ${texNum($.N)}\ \mathrm{N}$, and $\mu_{\min} = \tan\theta = ${texNum($.muMin)}$`,
      String.raw`Friction in this model is $${texNum($.f)}\ \mathrm{N}$.`,
    ],
    cases: [
      kase('hand', { m: 4, theta: 25, mu: 0.6 }, {
        N: 35.5635, f: 16.5835, muMin: 0.46631, holds: 'yes',
      }),
    ],
  }),
];