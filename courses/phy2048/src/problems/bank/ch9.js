/** Ch 9 · Linear momentum and collisions. OpenStax University Physics Vol. 1, §§9.1–9.6. */
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { centerOfMass, collide1D, impulse, momentum } from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u4', ch: '9' };

export default [
  problem({
    ...U,
    id: 'ch9.momentum',
    src: 'OpenStax University Physics Vol. 1 §9.1',
    title: 'Momentum in a plane',
    topics: ['momentum'],
    vars: {
      m: range(0.5, 12, 0.5, 'kg'),
      vx: range(-12, 12, 1, 'm/s'),
      vy: range(-12, 12, 1, 'm/s'),
    },
    derive: ($) => {
      const p = momentum($.m, v($.vx, $.vy, 0));
      return { px: p.x, py: p.y, p: Math.hypot(p.x, p.y) };
    },
    second: ($) => ({
      px: $.m * $.vx,
      py: $.m * $.vy,
      p: $.m * Math.hypot($.vx, $.vy),
    }),
    valid: ($) => $.p > 1,
    text: (T) => `A ${T.m} kg particle has velocity (${T.vx}, ${T.vy}) m/s. Find the momentum components and the magnitude of the momentum.`,
    parts: [
      sym('pxsym', 'm*vx', { m: 'kg', vx: 'm/s' }, ($) => $.px, { unit: 'kg·m/s', label: String.raw`$p_x$ as a formula` }),
      num('px', ($) => $.px, 'kg·m/s', { label: String.raw`$p_x$` }),
      num('py', ($) => $.py, 'kg·m/s', { label: String.raw`$p_y$` }),
      num('p', ($) => $.p, 'kg·m/s', { label: String.raw`$|p|$` }),
    ],
    hints: [
      String.raw`Each component is mass times that velocity component. The magnitude is the length of that vector.`,
    ],
    steps: ($) => [
      String.raw`$p_x = m v_x = ${texNum($.px)}\ \mathrm{kg\cdot m/s}$, $p_y = ${texNum($.py)}\ \mathrm{kg\cdot m/s}$`,
      String.raw`$|p| = ${texNum($.p)}\ \mathrm{kg\cdot m/s}$`,
    ],
    cases: [
      kase('hand', { m: 3, vx: 3, vy: 4 }, { px: 9, py: 12, p: 15 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.impulse',
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'Impulse and the change of velocity',
    topics: ['impulse', 'momentum'],
    vars: {
      m: range(0.5, 10, 0.5, 'kg'),
      v0: range(-8, 8, 1, 'm/s'),
      F: range(-30, 30, 1, 'N'),
      dt: range(0.1, 2, 0.1, 's'),
    },
    derive: ($) => {
      const J = impulse($.F, $.dt);
      const vf = (momentum($.m, $.v0) + J) / $.m;
      return { J, vf };
    },
    second: ($) => ({
      J: $.F * $.dt,
      vf: $.v0 + ($.F * $.dt) / $.m,
    }),
    valid: ($) => Math.abs($.J) > 0.5,
    text: (T) => `A ${T.m} kg object moves at ${T.v0} m/s along a line. A constant force of ${T.F} N acts in that direction for ${T.dt} s. Find the impulse and the velocity at the end of the push.`,
    parts: [
      num('J', ($) => $.J, 'N·s', { label: 'impulse' }),
      num('vf', ($) => $.vf, 'm/s', { label: 'final velocity' }),
    ],
    hints: [
      String.raw`The impulse of a constant force is $F\Delta t$. It equals the change of momentum, so divide by the mass to get the change of velocity.`,
    ],
    steps: ($) => [
      String.raw`$J = F\Delta t = ${texNum($.J)}\ \mathrm{N\cdot s}$`,
      String.raw`$v = v_0 + J/m = ${texNum($.vf)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { m: 2, v0: 3, F: 10, dt: 0.4 }, { J: 4, vf: 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.elastic',
    src: 'OpenStax University Physics Vol. 1 §9.4',
    title: 'Elastic collision in one dimension',
    topics: ['collision', 'elastic'],
    vars: {
      m1: range(0.5, 6, 0.5, 'kg'),
      m2: range(0.5, 8, 0.5, 'kg'),
      u1: range(1, 10, 0.5, 'm/s'),
      u2: range(-4, 4, 0.5, 'm/s'),
    },
    derive: ($) => {
      const hit = collide1D($.m1, $.m2, $.u1, $.u2, 1);
      const K = kineticEnergy($.m1, hit.v1) + kineticEnergy($.m2, hit.v2);
      return { v1: hit.v1, v2: hit.v2, K };
    },
    second: ($) => {
      const { m1, m2, u1, u2 } = $;
      const p = m1 * u1 + m2 * u2;
      const rel = u1 - u2;
      const det = m1 + m2;
      const v1 = (p - m2 * rel) / det;
      const v2 = (p + m1 * rel) / det;
      const K = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      return { v1, v2, K };
    },
    valid: ($) => $.u1 > $.u2 + 0.5,
    text: (T) => `Mass 1 (${T.m1} kg) moves at ${T.u1} m/s and mass 2 (${T.m2} kg) moves at ${T.u2} m/s, on the same line. Mass 1 is catching mass 2, and the collision is elastic. Take the positive direction as the direction of the incoming mass. Find both velocities after the collision, and the kinetic energy after it.`,
    parts: [
      num('v1', ($) => $.v1, 'm/s', { label: 'velocity of mass 1' }),
      num('v2', ($) => $.v2, 'm/s', { label: 'velocity of mass 2' }),
      num('K', ($) => $.K, 'J', { label: 'kinetic energy afterward' }),
    ],
    hints: [
      String.raw`Momentum is conserved, and for an elastic collision $v_2 - v_1 = u_1 - u_2$. The kinetic energy is the same before and after.`,
    ],
    steps: ($) => [
      String.raw`$v_1 = ${texNum($.v1)}\ \mathrm{m/s}$, $v_2 = ${texNum($.v2)}\ \mathrm{m/s}$`,
      String.raw`$K = ${texNum($.K)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('hand', { m1: 2, m2: 5, u1: 4, u2: 0 }, { v1: -1.71429, v2: 2.28571, K: 16 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.stick',
    src: 'OpenStax University Physics Vol. 1 §9.4',
    title: 'Perfectly inelastic collision',
    topics: ['collision', 'inelastic'],
    vars: {
      m1: range(0.5, 8, 0.5, 'kg'),
      m2: range(0.5, 8, 0.5, 'kg'),
      u1: range(1, 10, 0.5, 'm/s'),
      u2: range(-6, 4, 0.5, 'm/s'),
    },
    derive: ($) => {
      const hit = collide1D($.m1, $.m2, $.u1, $.u2, 0);
      const before = kineticEnergy($.m1, $.u1) + kineticEnergy($.m2, $.u2);
      const after = kineticEnergy($.m1 + $.m2, hit.v1);
      return { v: hit.v1, lost: before - after };
    },
    second: ($) => {
      const v = ($.m1 * $.u1 + $.m2 * $.u2) / ($.m1 + $.m2);
      const before = 0.5 * $.m1 * $.u1 * $.u1 + 0.5 * $.m2 * $.u2 * $.u2;
      const after = 0.5 * ($.m1 + $.m2) * v * v;
      return { v, lost: before - after };
    },
    valid: ($) => $.u1 > $.u2 + 0.5 && $.lost > 0.2,
    text: (T) => `Mass 1 (${T.m1} kg) moves at ${T.u1} m/s and mass 2 (${T.m2} kg) moves at ${T.u2} m/s. They collide and stick. Find the shared velocity and the kinetic energy lost.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'shared velocity' }),
      num('lost', ($) => $.lost, 'J', { label: 'kinetic energy lost' }),
    ],
    hints: [
      String.raw`Sticking means one velocity afterward. Momentum still adds up. The lost kinetic energy is the difference of $\frac{1}{2}mv^2$ before and after.`,
    ],
    steps: ($) => [
      String.raw`$v = (m_1 u_1 + m_2 u_2)/(m_1+m_2) = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`The kinetic energy lost is $${texNum($.lost)}\ \mathrm{J}$.`,
    ],
    cases: [
      kase('hand', { m1: 3, m2: 1, u1: 4, u2: -2 }, { v: 2.5, lost: 13.5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.cm',
    src: 'OpenStax University Physics Vol. 1 §9.6',
    title: 'Center of mass of two particles',
    topics: ['center-of-mass'],
    vars: {
      m1: range(0.5, 8, 0.5, 'kg'),
      m2: range(0.5, 8, 0.5, 'kg'),
      x1: range(-4, 4, 0.5, 'm'),
      y1: range(-4, 4, 0.5, 'm'),
      x2: range(-4, 4, 0.5, 'm'),
      y2: range(-4, 4, 0.5, 'm'),
    },
    derive: ($) => {
      const cm = centerOfMass([
        { mass: $.m1, r: v($.x1, $.y1, 0) },
        { mass: $.m2, r: v($.x2, $.y2, 0) },
      ]);
      return { x: cm.r.x, y: cm.r.y };
    },
    second: ($) => {
      const mass = $.m1 + $.m2;
      return {
        x: ($.m1 * $.x1 + $.m2 * $.x2) / mass,
        y: ($.m1 * $.y1 + $.m2 * $.y2) / mass,
      };
    },
    valid: ($) => Math.hypot($.x2 - $.x1, $.y2 - $.y1) > 0.5,
    text: (T) => `Particle 1 has mass ${T.m1} kg and sits at (${T.x1}, ${T.y1}) m. Particle 2 has mass ${T.m2} kg and sits at (${T.x2}, ${T.y2}) m. Find the center of mass.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: String.raw`$x_{\mathrm{cm}}$` }),
      num('y', ($) => $.y, 'm', { label: String.raw`$y_{\mathrm{cm}}$` }),
    ],
    hints: [
      'The center of mass is the mass-weighted average of the positions. Each coordinate is separate.',
    ],
    steps: ($) => [
      String.raw`$x_{\mathrm{cm}} = ${texNum($.x)}\ \mathrm{m}$, $y_{\mathrm{cm}} = ${texNum($.y)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('hand', { m1: 2, m2: 6, x1: 0, y1: 1, x2: 4, y2: 3 }, { x: 3, y: 2.5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.recoil',
    src: 'OpenStax University Physics Vol. 1 §9.3',
    title: 'Recoil on frictionless ice',
    topics: ['momentum', 'conservation'],
    vars: {
      M: range(40, 90, 5, 'kg'),
      m: range(0.4, 4, 0.2, 'kg'),
      u: range(2, 12, 0.5, 'm/s'),
    },
    derive: ($) => ({ Vp: -momentum($.m, $.u) / $.M }),
    second: ($) => ({ Vp: -$.m * $.u / $.M }),
    text: (T) => `A ${T.M} kg person stands on frictionless ice and throws a ${T.m} kg ball at ${T.u} m/s relative to the ground. Both were at rest. Take the ball's velocity as positive. Find the person's velocity.`,
    parts: [
      num('Vp', ($) => $.Vp, 'm/s', { label: "person's velocity", abs: 0.002 }),
    ],
    hints: [
      'The total momentum stays zero. The ball\'s speed here is relative to the ground, so the person\'s momentum is the opposite of the ball\'s.',
    ],
    steps: ($) => [
      String.raw`$M V + m u = 0$, so $V = ${texNum($.Vp)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { M: 60, m: 2, u: 5 }, { Vp: -1 / 6 }),
    ],
  }),
];
