/** Ch 7 · Work and kinetic energy. OpenStax University Physics Vol. 1, §§7.1–7.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { kineticEnergy, power, speedFromEnergy, work, workVector } from '@flux/subjects/mechanics/energy.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u3', ch: '7' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch7.work',
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Work by a constant force',
    topics: ['work'],
    vars: {
      F: range(2, 40, 1, 'N'),
      d: range(0.5, 12, 0.5, 'm'),
      theta: range(0, 180, 15, '°'),
    },
    derive: ($) => ({ W: work($.F, $.d, $.theta) }),
    second: ($) => {
      const th = $.theta * DEG;
      return { W: $.F * Math.cos(th) * $.d + $.F * Math.sin(th) * 0 };
    },
    text: (T) => `A constant force of magnitude ${T.F} N acts on an object while the object moves ${T.d} m in a straight line. The angle between the force and the displacement is ${T.theta}°. Find the work done by the force.`,
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`Work by a constant force is $W = Fd\cos\theta$, with $\theta$ the angle between the force and the displacement.`,
    ],
    steps: ($) => [
      String.raw`$W = Fd\cos\theta = ${texNum($.W)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { F: 10, d: 3, theta: 60 }, { W: 15 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.dot',
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Work from components',
    topics: ['work', 'dot'],
    vars: {
      Fx: range(-20, 20, 1, 'N'),
      Fy: range(-20, 20, 1, 'N'),
      dx: range(-8, 8, 0.5, 'm'),
      dy: range(-8, 8, 0.5, 'm'),
    },
    derive: ($) => ({ W: workVector(v($.Fx, $.Fy, 0), v($.dx, $.dy, 0)) }),
    second: ($) => ({ W: $.Fx * $.dx + $.Fy * $.dy }),
    valid: ($) => Math.abs($.W) > 1,
    text: (T) => `A force (${T.Fx}, ${T.Fy}) N moves its point of application by (${T.dx}, ${T.dy}) m. Find the work.`,
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`The work is the dot product: $W = F_x\Delta x + F_y\Delta y$.`,
    ],
    steps: ($) => [
      String.raw`$W = F_x\Delta x + F_y\Delta y = ${texNum($.W)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { Fx: 3, Fy: 4, dx: 2, dy: -1 }, { W: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.push',
    src: 'OpenStax University Physics Vol. 1 §7.3',
    title: 'Speed from the work done',
    topics: ['work', 'kinetic'],
    vars: {
      m: range(0.5, 10, 0.5, 'kg'),
      F: range(2, 40, 1, 'N'),
      d: range(0.5, 8, 0.5, 'm'),
    },
    derive: ($) => {
      const W = work($.F, $.d, 0);
      return { W, v: speedFromEnergy({ mass: $.m, wnc: W }) };
    },
    second: ($) => ({
      W: $.F * $.d,
      v: Math.sqrt((2 * $.F * $.d) / $.m),
    }),
    text: (T) => `A ${T.m} kg object starts at rest on a level frictionless surface. A horizontal force of ${T.F} N pushes it through ${T.d} m. Find the work done by the force and the speed at the end of the push.`,
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
    ],
    hints: [
      String.raw`The work equals the kinetic energy gained. From rest, $\frac{1}{2}mv^2 = Fd$.`,
    ],
    steps: ($) => [
      String.raw`$W = Fd = ${texNum($.W)}\ \mathrm{J}$`,
      String.raw`$v = \sqrt{2W/m} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 2, F: 8, d: 4 }, { W: 32, v: 5.65685 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.power',
    src: 'OpenStax University Physics Vol. 1 §7.4',
    title: 'Power and the work it delivers',
    topics: ['power', 'work'],
    vars: {
      F: range(2, 50, 1, 'N'),
      v: range(1, 20, 0.5, 'm/s'),
      t: range(1, 10, 0.5, 's'),
    },
    derive: ($) => {
      const P = power($.F, $.v);
      return { P, W: P * $.t };
    },
    second: ($) => ({ P: $.F * $.v, W: $.F * $.v * $.t }),
    text: (T) => `A force of ${T.F} N pushes an object in the direction of its velocity, and the speed stays ${T.v} m/s for ${T.t} s. Find the power and the work done in that time.`,
    parts: [
      sym('psym', 'F*v', { F: 'N', v: 'm/s' }, ($) => $.P, { unit: 'W', label: 'power as a formula' }),
      num('P', ($) => $.P, 'W', { label: 'power' }),
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`When the force and the velocity are parallel, $P = Fv$. Constant power does work $W = Pt$.`,
    ],
    steps: ($) => [
      String.raw`$P = Fv = ${texNum($.P)}\ \mathrm{W}$`,
      String.raw`$W = Pt = ${texNum($.W)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { F: 12, v: 3, t: 4 }, { P: 36, W: 144 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.brake',
    src: 'OpenStax University Physics Vol. 1 §7.3',
    title: 'Skidding to a stop',
    topics: ['work', 'friction'],
    vars: {
      m: range(400, 1600, 50, 'kg'),
      v0: range(8, 30, 1, 'm/s'),
      mu: range(0.2, 0.8, 0.05, ''),
    },
    derive: ($) => {
      const K = kineticEnergy($.m, $.v0);
      const perMeter = work($.mu * $.m * G, 1, 180);
      return { K, d: -K / perMeter };
    },
    second: ($) => ({
      K: 0.5 * $.m * $.v0 * $.v0,
      d: ($.v0 * $.v0) / (2 * $.mu * G),
    }),
    text: (T) => `A ${T.m} kg car skids to a stop from ${T.v0} m/s on level pavement. The coefficient of kinetic friction is ${T.mu}. Take g = ${G} m/s². Find the kinetic energy at the start and the stopping distance.`,
    parts: [
      num('K', ($) => $.K, 'J', { label: 'initial kinetic energy' }),
      num('d', ($) => $.d, 'm', { label: 'stopping distance' }),
    ],
    hints: [
      String.raw`Friction is $\mu_k mg$ and opposes the motion, so its work is $-\mu_k mg\,d$. That work removes the kinetic energy. The mass cancels, and $d = v^2/(2\mu_k g)$.`,
    ],
    steps: ($) => [
      String.raw`$K = \frac{1}{2}mv^2 = ${texNum($.K)}\ \mathrm{J}$`,
      String.raw`$d = v^2/(2\mu_k g) = ${texNum($.d)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('hand', { m: 1000, v0: 20, mu: 0.4 }, { K: 200000, d: 50.9684 }),
    ],
  }),
];
