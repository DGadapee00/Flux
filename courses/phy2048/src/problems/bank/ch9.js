/** Ch 9 · Linear momentum and collisions. OpenStax University Physics Vol. 1, §§9.1–9.7. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import {
  centerOfMass, collide1D, discCollision, impactLoss, momentum, pulseForce, pulseImpulse, reducedMass, rocketDeltaV,
} from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { choice, kase, mc, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u5', ch: '9' };
const DEG = Math.PI / 180;

/** Speed after a drop from rest through h, with up positive on the way back only. */
const dropSpeed = (h) => Math.sqrt(2 * G * h);

/** Midpoint sum of one force pulse. A tent is split at its kink, where the midpoint rule is exact. */
function pulseArea(shape, peak, T) {
  const piece = (t0, t1) => {
    const n = 20000;
    const dt = (t1 - t0) / n;
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += pulseForce(shape, peak, T, t0 + (i + 0.5) * dt) * dt;
    return sum;
  };
  if (shape === 'tri') return piece(0, T / 2) + piece(T / 2, T);
  return piece(0, T);
}

/** Volume of a sphere by shells. The midpoint rule on r². */
function shellMass(R, rho) {
  const n = 12000;
  const dr = R / n;
  let m = 0;
  for (let i = 0; i < n; i += 1) {
    const r = (i + 0.5) * dr;
    m += rho * 4 * Math.PI * r * r * dr;
  }
  return m;
}

function stickVelocity(m1, m2, u1, u2) {
  return (m1 * u1 + m2 * u2) / (m1 + m2);
}

const METEOR_M = 7970 * (4 / 3) * Math.PI * 25 ** 3;

export default [
  problem({
    ...U,
    id: 'ch9.momentum',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.1',
    title: 'Momentum in components',
    topics: ['momentum'],
    vars: {
      where: choice(['line', 'along a line'], ['plane', 'in a plane']),
      m: range(0.5, 12, 0.5, 'kg'),
      vx: range(-12, 12, 1, 'm/s'),
      vy: range(-12, 12, 1, 'm/s'),
    },
    derive: ($) => {
      const vy = $.where === 'line' ? 0 : $.vy;
      const p = momentum($.m, v($.vx, vy, 0));
      return { vyUsed: vy, px: p.x, py: p.y, p: Math.hypot(p.x, p.y) };
    },
    second: ($) => {
      const vy = $.where === 'line' ? 0 : $.vy;
      const px = $.m * $.vx;
      const py = $.m * vy;
      return { px, py, p: Math.hypot(px, py) };
    },
    valid: ($) => $.p > 1 && ($.where === 'line' || (Math.abs($.vx) >= 1 && Math.abs($.vy) >= 1)),
    text: (T, $) => ($.where === 'line'
      ? `A ${T.m} kg cart moves along a straight track at ${T.vx} m/s. Take the track as +x. Find the momentum components and the magnitude of the momentum.`
      : `A ${T.m} kg particle moves in a plane with velocity (${T.vx}, ${T.vy}) m/s. Find the momentum components and the magnitude of the momentum.`),
    parts: [
      sym('pxsym', 'm*vx', { m: 'kg', vx: 'm/s' }, ($) => $.px, { unit: 'kg·m/s', label: String.raw`$p_x$ as a formula` }),
      num('px', ($) => $.px, 'kg·m/s', { label: String.raw`$p_x$` }),
      num('py', ($) => $.py, 'kg·m/s', { label: String.raw`$p_y$` }),
      num('p', ($) => $.p, 'kg·m/s', { label: String.raw`$|p|$` }),
    ],
    hints: [
      String.raw`Momentum is a vector. Each component is the mass times that component of velocity: $p_x = mv_x$.`,
      'The magnitude is the length of the vector. Add the squares of the components, then take the square root.',
    ],
    steps: ($) => [
      String.raw`$p_x = mv_x = ${texNum($.px)}\ \mathrm{kg\cdot m/s}$, $p_y = ${texNum($.py)}\ \mathrm{kg\cdot m/s}$`,
      String.raw`$|p| = ${texNum($.p)}\ \mathrm{kg\cdot m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.1: a 1400 kg car at 15 m/s', { where: 'line', m: 1400, vx: 15, vy: 4 }, { px: 21000, py: 0, p: 21000 }, {
        note: 'The section computes p = 21 000 kg·m/s. The car is on a line, so p_y = 0.',
      }),
      kase('hand', { where: 'plane', m: 3, vx: 3, vy: 4 }, { px: 9, py: 12, p: 15 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.impulse',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'Impulse from a change of velocity',
    topics: ['impulse'],
    lab: 'impulse',
    vars: {
      told: choice(['ends', 'the velocity at the end'], ['change', 'the change of velocity']),
      m: range(0.05, 8, 0.05, 'kg'),
      v0: range(-12, 12, 0.5, 'm/s'),
      vf: range(-20, 40, 0.5, 'm/s'),
      dv: range(-20, 20, 0.5, 'm/s'),
      dt: range(0.05, 2, 0.05, 's'),
    },
    derive: ($) => {
      const dv = $.told === 'change' ? $.dv : $.vf - $.v0;
      const J = $.m * dv;
      return { dvUsed: dv, J, F: J / $.dt };
    },
    second: ($) => {
      const dv = $.told === 'change' ? $.dv : $.vf - $.v0;
      const J = momentum($.m, dv);
      return { J, F: J / $.dt };
    },
    valid: ($) => Math.abs($.J) > 0.3,
    text: (T, $) => ($.told === 'ends'
      ? `A ${T.m} kg body changes velocity from ${T.v0} m/s to ${T.vf} m/s while a constant force acts for ${T.dt} s. Find the impulse and the average force.`
      : `A ${T.m} kg body changes its velocity by ${T.dv} m/s while a constant force acts for ${T.dt} s. Find the impulse and the average force.`),
    parts: [
      num('J', ($) => $.J, 'N·s', { label: 'impulse' }),
      num('F', ($) => $.F, 'N', { label: 'average force' }),
    ],
    hints: [
      String.raw`The impulse–momentum theorem: $J = \Delta p = m\Delta v$. The average force is that impulse divided by the time.`,
      'Keep the sign. A force that slows a positive velocity has a negative impulse.',
    ],
    steps: ($) => [
      String.raw`$\Delta v = ${texNum($.dvUsed)}\ \mathrm{m/s}$, so $J = m\Delta v = ${texNum($.J)}\ \mathrm{N\cdot s}$`,
      String.raw`$F_{\mathrm{avg}} = J/\Delta t = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'stop',
      setup: (s, $) => {
        Object.assign(s, { shape: 'rect', m: $.m, v0: 0, peak: $.F, T: $.dt });
      },
      read: (c) => ({ J: c.J, F: c.Favg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.2, "Calculating the Impulse": a 0.057 kg tennis ball served to 58 m/s in 5.0 ms', { told: 'ends', m: 0.057, v0: 0, vf: 58, dv: 58, dt: 0.005 }, { J: 3.3, F: 660 }, {
        note: 'The book prints Δp = 3.3 kg·m/s and F = 6.6×10² N. Ours are 3.306 N·s and 661.2 N.',
      }),
      kase('hand', { told: 'ends', m: 2, v0: 3, vf: -1, dv: 4, dt: 0.4 }, { J: -8, F: -20 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.graph',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'Impulse as the area under F(t)',
    topics: ['impulse'],
    lab: 'impulse',
    vars: {
      shape: choice(['rect', 'a rectangle'], ['tri', 'a triangle'], ['sine', 'a half-sine']),
      m: range(0.4, 20, 0.2, 'kg'),
      v0: range(-8, 12, 0.5, 'm/s'),
      peak: range(-80, 80, 2, 'N'),
      T: range(0.1, 2, 0.1, 's'),
    },
    derive: ($) => {
      const J = pulseImpulse($.shape, $.peak, $.T);
      return { J, vf: $.v0 + J / $.m, Favg: J / $.T };
    },
    second: ($) => {
      const J = pulseArea($.shape, $.peak, $.T);
      return { J, vf: $.v0 + J / $.m, Favg: J / $.T };
    },
    valid: ($) => Math.abs($.J) > 0.4,
    text: (T, $) => `A force on a ${T.m} kg body is ${T.shape} on a graph of F against t: peak ${T.peak} N, duration ${T.T} s. The body starts at ${T.v0} m/s. A triangle rises linearly to the peak at half the duration and falls linearly back to zero. A half-sine is F = F_peak sin(π t / T). Find the impulse, the velocity at the end, and the average force.`,
    parts: [
      num('J', ($) => $.J, 'N·s', { label: 'impulse' }),
      num('vf', ($) => $.vf, 'm/s', { label: 'velocity at the end' }),
      num('Favg', ($) => $.Favg, 'N', { label: 'average force' }),
    ],
    hints: [
      'The impulse is the area under F(t). A rectangle is peak times duration. A triangle is half of that. A half-sine is 2/π of that.',
      String.raw`Then $\Delta v = J/m$, and the average force is the same area divided by the duration.`,
    ],
    steps: ($) => [
      String.raw`$J = ${texNum($.J)}\ \mathrm{N\cdot s}$`,
      String.raw`$v_f = v_0 + J/m = ${texNum($.vf)}\ \mathrm{m/s}$, $F_{\mathrm{avg}} = ${texNum($.Favg)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'stop',
      setup: (s, $) => { Object.assign(s, { shape: $.shape, m: $.m, v0: $.v0, peak: $.peak, T: $.T }); },
      read: (c) => ({ J: c.J, vf: c.vf, Favg: c.Favg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.2, "The Benefits of Impulse": an 860 N driver stopped from 27 m/s in 2.5 s', {
        shape: 'rect', m: 860 / G, v0: 27, peak: -(860 / G) * 27 / 2.5, T: 2.5,
      }, { J: -(860 / G) * 27, vf: 0, Favg: -948 }, {
        note: 'The book uses g = 9.80 m/s² and prints −948 N. At g = 9.81 the steady force is −946.8 N. The same stop in 0.20 s is the next case.',
      }),
      kase('OpenStax University Physics Vol. 1 §9.2, "The Benefits of Impulse": the same driver stopped in 0.20 s', {
        shape: 'rect', m: 860 / G, v0: 27, peak: -(860 / G) * 27 / 0.2, T: 0.2,
      }, { J: -(860 / G) * 27, vf: 0, Favg: -11850 }, {
        note: 'The book prints −1.185×10⁴ N, above ten times the driver\'s weight.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.bounce',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'A stop and a bounce',
    topics: ['impulse'],
    lab: 'impulse',
    vars: {
      hit: choice(['stop', 'stops'], ['bounce', 'rebounds at the same speed']),
      m: range(0.05, 2, 0.01, 'kg'),
      h: range(0.4, 3, 0.1, 'm'),
      dt: range(0.01, 0.2, 0.01, 's'),
    },
    derive: ($) => {
      const speed = dropSpeed($.h);
      const J = ($.hit === 'bounce' ? 2 : 1) * $.m * speed;
      return { speed, J, F: J / $.dt };
    },
    // Constant g over the fall: n steps of Δv = g Δt recover √(2gh), then the floor's impulse.
    second: ($) => {
      const T = Math.sqrt((2 * $.h) / G);
      const n = 4000;
      let speed = 0;
      for (let i = 0; i < n; i += 1) speed += G * (T / n);
      const J = ($.hit === 'bounce' ? 2 : 1) * $.m * speed;
      return { J, F: J / $.dt };
    },
    valid: ($) => $.J > 0.2,
    text: (T, $) => `A ${T.m} kg object is dropped from rest through ${T.h} m and ${T.hit} when it hits. The contact lasts ${T.dt} s. Take g = ${G} m/s² and up as positive, so the hit delivers an upward impulse. Find that impulse and the average force during the contact.`,
    parts: [
      num('J', ($) => $.J, 'N·s', { label: 'impulse' }),
      num('F', ($) => $.F, 'N', { label: 'average force' }),
    ],
    hints: [
      String.raw`The speed at the floor is $\sqrt{2gh}$. Stopping removes $mv$. A rebound to the same speed reverses $mv$, so the impulse is $2mv$.`,
      'Divide the impulse by the contact time for the average force. Both are upward.',
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{2gh} = ${texNum($.speed)}\ \mathrm{m/s}$`,
      String.raw`$J = ${texNum($.J)}\ \mathrm{N\cdot s}$, $F_{\mathrm{avg}} = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'stop',
      setup: (s, $) => {
        Object.assign(s, { shape: 'rect', m: $.m, v0: -$.speed, peak: $.J / $.dt, T: $.dt });
      },
      read: (c) => ({ J: c.J, F: c.Favg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.2, "The iPhone Drop": 0.172 kg from 1.50 m, stopped in 26 ms', { hit: 'stop', m: 0.172, h: 1.5, dt: 0.026 }, { J: 0.172 * dropSpeed(1.5), F: 36 }, {
        note: 'The book uses g = 9.80 m/s² and prints 36 N. At g = 9.81 the average force is 35.89 N.',
      }),
      kase('OpenStax University Physics Vol. 1 §9.3, "Superball": 0.25 kg from 1.50 m, elastic rebound. Contact time 10 ms is ours', { hit: 'bounce', m: 0.25, h: 1.5, dt: 0.01 }, { J: 0.5 * dropSpeed(1.5), F: 50 * dropSpeed(1.5) }, {
        note: 'The book prints Δp = 2.8 kg·m/s from v = 5.4 m/s. At g = 9.81, v = 5.425 m/s and Δp = 2.712 kg·m/s, outside 1.5% of 2.8, so the case uses our value. The 10 ms contact is not in the example.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.meteor',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'A sphere stopped in a short time',
    topics: ['impulse'],
    lab: 'impulse',
    vars: {
      R: range(0.2, 1.5, 0.1, 'm'),
      rho: range(1500, 8000, 100, 'kg/m³'),
      speed: range(8, 40, 1, 'm/s'),
      t: range(0.4, 3, 0.1, 's'),
    },
    derive: ($) => {
      const m = $.rho * (4 / 3) * Math.PI * $.R ** 3;
      return { m, F: (m * $.speed) / $.t };
    },
    second: ($) => {
      const m = shellMass($.R, $.rho);
      return { m, F: (m * $.speed) / $.t };
    },
    valid: ($) => $.m > 1 && $.F > 10,
    text: (T) => `A sphere of radius ${T.R} m and density ${T.rho} kg/m³ is brought to rest from ${T.speed} m/s in ${T.t} s. Find its mass and the average force that stops it.`,
    parts: [
      num('m', ($) => $.m, 'kg', { label: 'mass' }),
      num('F', ($) => $.F, 'N', { label: 'average force' }),
    ],
    hints: [
      String.raw`The mass is the density times the volume of a sphere, $\tfrac43\pi R^3$.`,
      String.raw`The average force is the momentum removed, divided by the time: $F = mv/t$.`,
    ],
    steps: ($) => [
      String.raw`$m = \rho\tfrac43\pi R^3 = ${texNum($.m)}\ \mathrm{kg}$`,
      String.raw`$F_{\mathrm{avg}} = mv/t = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'stop',
      setup: (s, $) => {
        Object.assign(s, { shape: 'rect', m: $.m, v0: $.speed, peak: -$.F, T: $.t });
      },
      read: (c, s) => ({ m: s.m, F: -c.Favg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.2, "The Arizona Meteor Crater": radius 25 m, density 7970 kg/m³, 1.28×10⁴ m/s, stopped in 2 s', { R: 25, rho: 7970, speed: 12800, t: 2 }, { m: METEOR_M, F: 3.33e12 }, {
        note: 'The book prints 3.33×10¹² N. Our force is 3.338×10¹² N. The duration is an estimate in the example, not a measured time.',
      }),
      kase('hand', { R: 0.5, rho: 2000, speed: 10, t: 2 }, { m: 2000 * (4 / 3) * Math.PI * 0.125, F: 2000 * (4 / 3) * Math.PI * 0.125 * 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.elastic',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.4',
    title: 'An elastic collision in one dimension',
    topics: ['elastic', 'collision'],
    lab: 'collide',
    vars: {
      meet: choice(['rest', 'at rest'], ['move', 'already moving']),
      m1: range(0.2, 6, 0.1, 'kg'),
      m2: range(0.2, 6, 0.1, 'kg'),
      u1: range(0.5, 8, 0.1, 'm/s'),
      u2: range(-4, 4, 0.1, 'm/s'),
    },
    derive: ($) => {
      const u2 = $.meet === 'rest' ? 0 : $.u2;
      const hit = collide1D($.m1, $.m2, $.u1, u2, 1);
      const K = kineticEnergy($.m1, hit.v1) + kineticEnergy($.m2, hit.v2);
      return { u2s: u2, v1: hit.v1, v2: hit.v2, K };
    },
    second: ($) => {
      const u2 = $.meet === 'rest' ? 0 : $.u2;
      const total = $.m1 + $.m2;
      const p = $.m1 * $.u1 + $.m2 * u2;
      const rel = $.u1 - u2;
      const v1 = (p - $.m2 * rel) / total;
      const v2 = (p + $.m1 * rel) / total;
      return { v1, v2, K: 0.5 * $.m1 * v1 * v1 + 0.5 * $.m2 * v2 * v2 };
    },
    valid: ($) => $.u1 > $.u2s + 0.3,
    text: (T, $) => ($.meet === 'rest'
      ? `A ${T.m1} kg body at ${T.u1} m/s hits a ${T.m2} kg body at rest. The collision is elastic. Take the incoming direction as positive. Find both velocities afterward and the kinetic energy afterward.`
      : `A ${T.m1} kg body at ${T.u1} m/s hits a ${T.m2} kg body at ${T.u2} m/s. The collision is elastic. Take the incoming direction as positive. Find both velocities afterward and the kinetic energy afterward.`),
    parts: [
      num('v1', ($) => $.v1, 'm/s', { label: 'velocity of the incoming body' }),
      num('v2', ($) => $.v2, 'm/s', { label: 'velocity of the target' }),
      num('K', ($) => $.K, 'J', { label: 'kinetic energy afterward' }),
    ],
    hints: [
      String.raw`Elastic and one-dimensional: momentum is conserved, and $v_2 - v_1 = u_1 - u_2$.`,
      'Equal masses with the target at rest exchange velocities. Otherwise keep both equations.',
    ],
    steps: ($) => [
      String.raw`$v_1 = ${texNum($.v1)}\ \mathrm{m/s}$, $v_2 = ${texNum($.v2)}\ \mathrm{m/s}$`,
      String.raw`$K = ${texNum($.K)}\ \mathrm{J}$`,
    ],
    sim: {
      scenario: 'exchange',
      setup: (s, $) => { Object.assign(s, { m1: $.m1, m2: $.m2, u1: $.u1, u2: $.u2s, e: 1 }); },
      read: (c) => ({ v1: c.v1, v2: c.v2, K: c.K }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.4, "Ice Hockey 2": 12 g at 2.50 m/s into 15 g at rest, elastic', { meet: 'rest', m1: 0.012, m2: 0.015, u1: 2.5, u2: 0 }, { v1: -0.28, v2: 2.22, K: 0.0375 }, {
        note: 'The book takes the opposite direction as positive and prints 2.22 m/s and −0.28 m/s. On our axis the incoming puck leaves at −0.278 m/s and the target at 2.222 m/s. Kinetic energy stays 0.0375 J.',
      }),
      kase('OpenStax University Physics Vol. 1 §9.3, "Ice Hockey 1": equal 15 g pucks, 2.50 m/s into one at rest, elastic', { meet: 'rest', m1: 0.015, m2: 0.015, u1: 2.5, u2: 0 }, { v1: 0, v2: 2.5, K: 0.046875 }, {
        note: 'The book prints the exchange: the incoming puck stops and the target leaves at 2.50 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.stick',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.3',
    title: 'They stick',
    topics: ['inelastic', 'collision', 'momentum-conservation'],
    lab: 'collide',
    vars: {
      dir: choice(['same', 'the same way'], ['head', 'toward each other']),
      m1: range(0.2, 8, 0.1, 'kg'),
      m2: range(0.2, 8, 0.1, 'kg'),
      u1: range(0.4, 8, 0.1, 'm/s'),
      u2: range(0, 6, 0.1, 'm/s'),
    },
    derive: ($) => {
      const u2 = $.dir === 'head' ? -$.u2 : $.u2;
      const vel = stickVelocity($.m1, $.m2, $.u1, u2);
      const lost = impactLoss($.m1, $.m2, $.u1, u2, 0);
      return { u2s: u2, v: vel, lost };
    },
    second: ($) => {
      const u2 = $.dir === 'head' ? -$.u2 : $.u2;
      const p = $.m1 * $.u1 + $.m2 * u2;
      const v = p / ($.m1 + $.m2);
      const K0 = 0.5 * $.m1 * $.u1 * $.u1 + 0.5 * $.m2 * u2 * u2;
      const K = 0.5 * ($.m1 + $.m2) * v * v;
      return { v, lost: K0 - K };
    },
    valid: ($) => $.u1 > $.u2s + 0.2 && $.lost > 0.01,
    text: (T, $) => ($.dir === 'same'
      ? `A ${T.m1} kg cart at ${T.u1} m/s catches a ${T.m2} kg cart at ${T.u2} m/s. They stick. Find the shared velocity and the kinetic energy lost.`
      : `A ${T.m1} kg body at ${T.u1} m/s meets a ${T.m2} kg body at ${T.u2} m/s head-on. They stick. Take the first body's direction as positive. Find the shared velocity and the kinetic energy lost.`),
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'shared velocity' }),
      num('lost', ($) => $.lost, 'J', { label: 'kinetic energy lost' }),
    ],
    hints: [
      String.raw`They move as one mass afterward, so $v = (m_1u_1 + m_2u_2)/(m_1 + m_2)$. Momentum is conserved. Kinetic energy is not.`,
      'The lost kinetic energy is the kinetic energy before minus ½(m₁ + m₂)v². A head-on approach makes u₂ negative.',
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$\Delta K = ${texNum($.lost)}\ \mathrm{J}$`,
    ],
    sim: {
      scenario: 'stick',
      setup: (s, $) => { Object.assign(s, { m1: $.m1, m2: $.m2, u1: $.u1, u2: $.u2s, e: 0 }); },
      read: (c) => ({ v: c.v1, lost: c.lost }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.3, "Colliding Carts": 0.500 kg at 1.33 m/s catches 0.675 kg at 0.750 m/s', { dir: 'same', m1: 0.5, m2: 0.675, u1: 1.33, u2: 0.75 }, { v: 0.997, lost: impactLoss(0.5, 0.675, 1.33, 0.75, 0) }, {
        note: 'The book prints 0.997 m/s. The kinetic energy lost is 0.0483 J.',
      }),
      kase('OpenStax University Physics Vol. 1 §9.4, "Making Connections": a proton at 7.0×10⁶ m/s and a neutron at 4.0×10⁶ m/s form a deuteron', { dir: 'head', m1: 1, m2: 1, u1: 7e6, u2: 4e6 }, { v: 1.5e6, lost: impactLoss(1, 1, 7e6, -4e6, 0) }, {
        note: 'The book uses 1.67×10⁻²⁷ kg each and prints 1.5×10⁶ m/s. The mass cancels. This case uses 1 kg so the energy is not lost inside the 0.02 absolute tolerance. The lost energy is ours, not a printed nuclear energy.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.recoil',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §9.3',
    title: 'Recoil from rest',
    topics: ['momentum-conservation'],
    vars: {
      which: choice(['gun', 'the launcher\'s velocity'], ['bullet', 'the projectile\'s speed']),
      M: range(2, 20, 0.5, 'kg'),
      m: range(0.02, 0.8, 0.02, 'kg'),
      u: range(4, 40, 1, 'm/s'),
      Vp: range(0.2, 4, 0.1, 'm/s'),
    },
    derive: ($) => {
      // From rest: m u + M Vp = 0. u is the projectile's speed over the ground.
      const ans = $.which === 'gun' ? (-$.m * $.u) / $.M : (-$.M * $.Vp) / $.m;
      return { ans };
    },
    second: ($) => ({
      ans: $.which === 'gun' ? -momentum($.m, $.u) / $.M : -momentum($.M, $.Vp) / $.m,
    }),
    valid: ($) => $.m < $.M && Math.abs($.ans) > 0.05 && Math.abs($.ans) < 80,
    text: (T, $) => ($.which === 'gun'
      ? `A ${T.M} kg launcher is free on a frictionless track, at rest. It sends a ${T.m} kg projectile off at ${T.u} m/s over the ground. Find the launcher's velocity. Take the projectile's direction as positive.`
      : `A ${T.M} kg launcher is free on a frictionless track, at rest. After it fires, it recoils at ${T.Vp} m/s. The projectile has mass ${T.m} kg. Find the projectile's speed over the ground. Take the recoil direction as positive, so the projectile's speed comes out negative.`),
    parts: [
      num('ans', ($) => $.ans, 'm/s', { label: 'the velocity' }),
    ],
    hints: [
      'The system starts at rest, so the total momentum stays zero. The two momenta are equal in size and opposite in sign.',
      String.raw`With the stated positive direction, $m u + MV = 0$. Solve for the unknown velocity.`,
    ],
    steps: ($) => [
      $.which === 'gun'
        ? String.raw`$V = -mu/M = ${texNum($.ans)}\ \mathrm{m/s}$`
        : String.raw`$u = -MV/m = ${texNum($.ans)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.3: a cannon recoils when it fires, fresh numbers because that discussion has no printed speed', { which: 'gun', M: 8, m: 0.05, u: 12, Vp: 1 }, { ans: -0.075 }, {
        note: '§9.3 treats cannon recoil with no printed numerical example. These masses and this 12 m/s are fresh. The method is the section\'s: the total momentum stays zero.',
      }),
      kase('hand', { which: 'bullet', M: 4, m: 0.2, u: 10, Vp: 0.5 }, { ans: -10 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.oblique',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.5',
    title: 'Two vehicles stick at an angle',
    topics: ['oblique', 'inelastic'],
    lab: 'collide-2d',
    vars: {
      theta: range(30, 150, 5, '°'),
      m1: range(400, 4000, 50, 'kg'),
      m2: range(400, 4000, 50, 'kg'),
      u1: range(4, 30, 0.5, 'm/s'),
      u2: range(4, 30, 0.5, 'm/s'),
    },
    derive: ($) => {
      const th = $.theta * DEG;
      const px = $.m1 * $.u1 + $.m2 * $.u2 * Math.cos(th);
      const py = $.m2 * $.u2 * Math.sin(th);
      const total = $.m1 + $.m2;
      return { speed: Math.hypot(px, py) / total, angle: (Math.atan2(py, px) / DEG) };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const px = $.m1 * $.u1 + $.m2 * $.u2 * Math.cos(th);
      const py = $.m2 * $.u2 * Math.sin(th);
      const total = $.m1 + $.m2;
      const K = (px * px + py * py) / (2 * total);
      return { speed: Math.sqrt((2 * K) / total), angle: Math.atan2(py, px) / DEG };
    },
    valid: ($) => $.speed > 1,
    text: (T) => `A ${T.m1} kg vehicle at ${T.u1} m/s along +x hits a ${T.m2} kg vehicle at ${T.u2} m/s. The second vehicle's direction is ${T.theta}° from +x. They stick and move as one. Find the shared speed and the direction of that velocity, in degrees from +x.`,
    parts: [
      num('speed', ($) => $.speed, 'm/s', { label: 'shared speed' }),
      num('angle', ($) => $.angle, '°', { label: 'direction from +x' }),
    ],
    hints: [
      'Add the momenta as vectors. The shared velocity is the total momentum divided by the total mass.',
      String.raw`The direction is $\tan^{-1}(p_y/p_x)$, measured from the first vehicle's axis.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.speed)}\ \mathrm{m/s}$`,
      String.raw`$\theta = ${texNum($.angle)}^\circ$ from +x`,
    ],
    sim: {
      scenario: 'traffic',
      setup: (s, $) => {
        Object.assign(s, { mode: 'wreck', m1: $.m1, m2: $.m2, u1: $.u1, u2: $.u2, theta: $.theta, e: 0 });
      },
      read: (c) => ({ speed: c.speed, angle: c.angle }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.5, "Traffic Collision": 1200 kg at 16.67 m/s and 3000 kg at 11.1 m/s, at 90°', { theta: 90, m1: 1200, m2: 3000, u1: 16.67, u2: 11.1 }, { speed: Math.hypot(1200 * 16.67, 3000 * 11.1) / 4200, angle: 59 }, {
        note: 'The book prints components 4.76 m/s and 7.93 m/s, and 59°. It also describes that heading as 31° east of north.',
      }),
      kase('hand', { theta: 90, m1: 1, m2: 1, u1: 4, u2: 3 }, { speed: 2.5, angle: Math.atan2(3, 4) / DEG }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.crash',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.4',
    title: 'Speed from a skid',
    topics: ['collision', 'inelastic'],
    lab: 'crash-reconstruction',
    vars: {
      model: choice(['stop', 'the car stops and the truck skids'], ['stick', 'they stick and skid as one']),
      mc: range(600, 2500, 50, 'kg'),
      mt: range(800, 5000, 50, 'kg'),
      d: range(2, 30, 0.5, 'm'),
      mu: range(0.2, 0.9, 0.02, ''),
    },
    derive: ($) => {
      const vT = Math.sqrt(2 * $.mu * G * $.d);
      const vC = $.model === 'stick' ? (($.mc + $.mt) / $.mc) * vT : ($.mt / $.mc) * vT;
      return { vT, vC };
    },
    // Work–energy on the skid: μ mt g d = ½ mt vT². Momentum then gives the car.
    second: ($) => {
      const vT = Math.sqrt((2 * $.mu * $.mt * G * $.d) / $.mt);
      const vC = $.model === 'stick' ? (($.mc + $.mt) / $.mc) * vT : ($.mt / $.mc) * vT;
      return { vT, vC };
    },
    valid: ($) => Math.abs($.mt - $.mc) > 100 && $.vC > 1,
    text: (T, $) => `A ${T.mc} kg car hits a parked ${T.mt} kg truck. The truck skids ${T.d} m on a road with μ = ${T.mu} and then stops. Take g = ${G} m/s². Assume ${T.model}. Find the truck's speed after the hit and the car's speed before it.`,
    parts: [
      num('vT', ($) => $.vT, 'm/s', { label: 'truck speed after the hit' }),
      num('vC', ($) => $.vC, 'm/s', { label: 'car speed before the hit' }),
    ],
    hints: [
      String.raw`The skid stops under friction. From $v^2 = 2\mu g d$, or from $\mu m g d = \tfrac12 mv^2$, the speed after the hit is $\sqrt{2\mu g d}$.`,
      'The car stops: the truck carries the car\'s momentum, so m_c v_c = m_t v_t. They stick: (m_c + m_t) is the mass that skids, and the car was carrying both.',
    ],
    steps: ($) => [
      String.raw`$v_t = \sqrt{2\mu g d} = ${texNum($.vT)}\ \mathrm{m/s}$`,
      String.raw`$v_c = ${texNum($.vC)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { Object.assign(s, { model: $.model, mc: $.mc, mt: $.mt, d: $.d, mu: $.mu }); },
      read: (c) => ({ vT: c.vT, vC: c.vC }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.4, "Analyzing a Car Crash": 1200 kg into a parked 3000 kg truck, 10 m, μ = 0.62. The car stops.', { model: 'stop', mc: 1200, mt: 3000, d: 10, mu: 0.62 }, { vT: 11, vC: 27.5 }, {
        note: 'The book rounds √(2μgd) to 11.0 m/s and prints 27.5 m/s for the car. At g = 9.81 the truck speed is 11.03 m/s and the car speed is 27.57 m/s.',
      }),
      kase('hand', { model: 'stick', mc: 1000, mt: 2000, d: 5, mu: 0.5 }, {
        vT: Math.sqrt(2 * 0.5 * G * 5),
        vC: 3 * Math.sqrt(2 * 0.5 * G * 5),
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.cm',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.6',
    title: 'Center of mass of two bodies',
    topics: ['center-of-mass'],
    lab: 'center-of-mass',
    vars: {
      where: choice(['line', 'on a line'], ['plane', 'in a plane']),
      m1: range(0.5, 12, 0.5, 'kg'),
      m2: range(0.5, 12, 0.5, 'kg'),
      x1: range(-4, 4, 0.5, 'm'),
      y1: range(-3, 3, 0.5, 'm'),
      x2: range(-4, 4, 0.5, 'm'),
      y2: range(-3, 3, 0.5, 'm'),
    },
    derive: ($) => {
      const y1 = $.where === 'line' ? 0 : $.y1;
      const y2 = $.where === 'line' ? 0 : $.y2;
      const r = centerOfMass([
        { mass: $.m1, r: v($.x1, y1, 0) },
        { mass: $.m2, r: v($.x2, y2, 0) },
      ]).r;
      return { y1, y2, x: r.x, y: r.y };
    },
    second: ($) => {
      const y1 = $.where === 'line' ? 0 : $.y1;
      const y2 = $.where === 'line' ? 0 : $.y2;
      const total = $.m1 + $.m2;
      return {
        x: ($.m1 * $.x1 + $.m2 * $.x2) / total,
        y: ($.m1 * y1 + $.m2 * y2) / total,
      };
    },
    valid: ($) => Math.abs($.m1 - $.m2) > 0.4 && Math.abs($.x1 - $.x2) + Math.abs($.y1 - $.y2) > 0.5,
    text: (T, $) => ($.where === 'line'
      ? `A ${T.m1} kg mass sits at x = ${T.x1} m and a ${T.m2} kg mass at x = ${T.x2} m, both on the x axis. Find the center of mass.`
      : `A ${T.m1} kg mass sits at (${T.x1}, ${T.y1}) m and a ${T.m2} kg mass at (${T.x2}, ${T.y2}) m. Find the center of mass.`),
    parts: [
      num('x', ($) => $.x, 'm', { label: 'x of the center of mass' }),
      num('y', ($) => $.y, 'm', { label: 'y of the center of mass' }),
    ],
    hints: [
      String.raw`The center of mass is the mass-weighted average: $x_{\mathrm{cm}} = (m_1x_1 + m_2x_2)/(m_1 + m_2)$, and the same for y.`,
      'On a line, y is zero. The heavier mass pulls the average toward itself.',
    ],
    steps: ($) => [
      String.raw`$x_{\mathrm{cm}} = ${texNum($.x)}\ \mathrm{m}$`,
      String.raw`$y_{\mathrm{cm}} = ${texNum($.y)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'unequal',
      setup: (s, $) => {
        Object.assign(s, {
          kind: 'points', m1: $.m1, x1: $.x1, y1: $.y1, m2: $.m2, x2: $.x2, y2: $.y2,
        });
      },
      read: (c) => ({ x: c.x, y: c.y }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.6, "Center of Mass of the Earth–Moon System": Earth 5.97×10²⁴ kg, Moon 7.36×10²² kg, 3.82×10⁸ m apart', {
        where: 'line', m1: 5.97e24, m2: 7.36e22, x1: 0, y1: 0, x2: 3.82e8, y2: 0,
      }, { x: 4.64e6, y: 0 }, {
        note: 'The book prints 4.64×10⁶ m from Earth\'s center, and 1730 km below the surface if Earth\'s radius is 6.37×10⁶ m. Ours is 4.652×10⁶ m.',
      }),
      kase('hand', { where: 'plane', m1: 2, m2: 6, x1: 0, y1: 0, x2: 4, y2: 1 }, { x: 3, y: 0.75 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.rocket',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §9.7',
    title: 'A rocket burn',
    topics: ['rocket'],
    lab: 'rocket',
    vars: {
      drive: choice(['coast', 'coasting, with no gravity'], ['grav', 'fired straight up, with gravity']),
      m0: range(4000, 24000, 200, 'kg'),
      mf: range(800, 8000, 100, 'kg'),
      ve: range(150, 3000, 10, 'm/s'),
      mdot: range(20, 300, 5, 'kg/s'),
    },
    derive: ($) => {
      const g = $.drive === 'grav' ? G : 0;
      const r = rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g, v0: 0 });
      const thrust = $.mdot * $.ve;
      return { g, tb: r.tb, thrust, a0: thrust / $.m0 - g, dv: r.dv };
    },
    second: ($) => {
      const g = $.drive === 'grav' ? G : 0;
      const burned = $.m0 - $.mf;
      const tb = burned / $.mdot;
      const n = 8000;
      const dt = tb / n;
      let m = $.m0;
      let speed = 0;
      for (let i = 0; i < n; i += 1) {
        const mid = m - 0.5 * $.mdot * dt;
        speed += ($.mdot * $.ve / mid - g) * dt;
        m -= $.mdot * dt;
      }
      const thrust = $.mdot * $.ve;
      return { thrust, a0: thrust / $.m0 - g, dv: speed };
    },
    valid: ($) => {
      if (!($.m0 > $.mf * 1.15) || !($.mf < 0.98 * $.m0)) return false;
      const coast = $.ve * Math.log($.m0 / $.mf);
      const linear = $.ve * ($.m0 - $.mf) / $.m0 - $.g * $.tb;
      const logged = $.ve * Math.log10($.m0 / $.mf) - $.g * $.tb;
      return Math.abs($.dv) > 1
        && Math.abs($.dv - linear) > 0.04 * Math.max(1, Math.abs($.dv))
        && Math.abs($.dv - logged) > 0.04 * Math.max(1, Math.abs($.dv));
    },
    text: (T, $) => `A rocket burns ${T.mdot} kg/s of exhaust at ${T.ve} m/s relative to the rocket. It starts at ${T.m0} kg and shuts down at ${T.mf} kg, ${$.drive === 'grav' ? 'fired straight up' : 'coasting with gravity left out'}. Take g = ${G} m/s² when gravity is on. Find the thrust, the acceleration at ignition, and the change of velocity over the burn.`,
    parts: [
      num('thrust', ($) => $.thrust, 'N', { label: 'thrust' }),
      num('a0', ($) => $.a0, 'm/s²', { label: 'acceleration at ignition' }),
      num('dv', ($) => $.dv, 'm/s', { label: 'change of velocity' }),
    ],
    hints: [
      String.raw`Thrust is $\dot m v_e$. At ignition the acceleration is that thrust over the starting mass, minus g if the burn is upward.`,
      String.raw`The burn changes the velocity by $v_e\ln(m_0/m_f) - g t_b$. The time is the mass burned divided by the burn rate. A coast has g = 0.`,
    ],
    steps: ($) => [
      String.raw`Thrust $= \dot m v_e = ${texNum($.thrust)}\ \mathrm{N}$, $a(0) = ${texNum($.a0)}\ \mathrm{m/s^2}$`,
      String.raw`$\Delta v = ${texNum($.dv)}\ \mathrm{m/s}$ over $${texNum($.tb)}$ s`,
    ],
    sim: {
      scenario: 'coast',
      setup: (s, $) => {
        Object.assign(s, { gOn: $.drive === 'grav' ? 1 : 0, m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, v0: 0 });
      },
      read: (c) => ({ thrust: c.thrust, a0: c.a0, dv: c.dv }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.7, "Thrust on a Spacecraft": ve = 250 m/s, 200 kg/s, 20 000 kg down to 14 000 kg, coasting', { drive: 'coast', m0: 20000, mf: 14000, ve: 250, mdot: 200 }, { thrust: 50000, a0: 2.5, dv: rocketDeltaV({ m0: 20000, mf: 14000, ve: 250, mdot: 200, g: 0 }).dv }, {
        note: 'The book prints a thrust of 5.0×10⁴ N and a(0) = 2.5 m/s² from thrust over mass, with gravity left out. It also prints 2.9 m/s² at 15 s and 3.6 m/s² at burnout. The coasting Δv, 89.17 m/s, is ours.',
      }),
      kase('hand: the same thruster fired upward. Thrust is less than the weight, so the velocity falls.', { drive: 'grav', m0: 20000, mf: 14000, ve: 250, mdot: 200 }, {
        thrust: 50000,
        a0: 2.5 - G,
        dv: rocketDeltaV({ m0: 20000, mf: 14000, ve: 250, mdot: 200, g: G }).dv,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.partial',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §9.4',
    title: 'Restitution from the kinetic energy left',
    topics: ['restitution', 'collision'],
    lab: 'collide',
    vars: {
      meet: choice(['rest', 'at rest'], ['move', 'already moving']),
      m1: range(0.3, 5, 0.1, 'kg'),
      m2: range(0.3, 5, 0.1, 'kg'),
      u1: range(1, 8, 0.1, 'm/s'),
      u2: range(-3, 3, 0.1, 'm/s'),
      e: range(0, 1, 0.05, ''),
    },
    derive: ($) => {
      const u2 = $.meet === 'rest' ? 0 : $.u2;
      const K0 = kineticEnergy($.m1, $.u1) + kineticEnergy($.m2, u2);
      const lost = impactLoss($.m1, $.m2, $.u1, u2, $.e);
      return { u2s: u2, K0, K: K0 - lost, lost };
    },
    second: ($) => {
      const u2 = $.meet === 'rest' ? 0 : $.u2;
      const hit = collide1D($.m1, $.m2, $.u1, u2, $.e);
      const K0 = 0.5 * $.m1 * $.u1 * $.u1 + 0.5 * $.m2 * u2 * u2;
      const K = 0.5 * $.m1 * hit.v1 * hit.v1 + 0.5 * $.m2 * hit.v2 * hit.v2;
      const cap = 0.5 * reducedMass($.m1, $.m2) * ($.u1 - u2) ** 2;
      const e = Math.sqrt(Math.max(0, 1 - (K0 - K) / cap));
      return { e, lost: K0 - K };
    },
    valid: ($) => $.u1 > $.u2s + 0.4 && $.K0 > 0.01 && $.K > 0.02 * $.K0,
    text: (T, $, sig) => ($.meet === 'rest'
      ? `A ${T.m1} kg body at ${T.u1} m/s hits a ${T.m2} kg body at rest. After the collision the kinetic energy is ${sig($.K)} J. Find the coefficient of restitution and the kinetic energy lost.`
      : `A ${T.m1} kg body at ${T.u1} m/s hits a ${T.m2} kg body at ${T.u2} m/s. After the collision the kinetic energy is ${sig($.K)} J. Find the coefficient of restitution and the kinetic energy lost.`),
    parts: [
      num('e', ($) => $.e, '', { label: 'restitution e' }),
      num('lost', ($) => $.lost, 'J', { label: 'kinetic energy lost' }),
    ],
    hints: [
      String.raw`The most a direct collision can lose is $\tfrac12\mu(u_1 - u_2)^2$, with $\mu = m_1m_2/(m_1 + m_2)$. The fraction left in that relative motion is $e^2$.`,
      String.raw`So $e = \sqrt{1 - K_{\mathrm{lost}} / (\tfrac12\mu v_{\mathrm{rel}}^2)}$. The lost energy is the kinetic energy before minus the kinetic energy you were given.`,
    ],
    steps: ($) => [
      String.raw`$K_{\mathrm{lost}} = ${texNum($.lost)}\ \mathrm{J}$`,
      String.raw`$e = ${texNum($.e)}$`,
    ],
    sim: {
      scenario: 'exchange',
      setup: (s, $) => { Object.assign(s, { m1: $.m1, m2: $.m2, u1: $.u1, u2: $.u2s, e: $.e }); },
      read: (c, s) => ({ e: s.e, lost: c.lost }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.4, "Ice Hockey 2": the elastic collision keeps all 0.0375 J', { meet: 'rest', m1: 0.012, m2: 0.015, u1: 2.5, u2: 0, e: 1 }, { e: 1, lost: 0 }),
      kase('OpenStax University Physics Vol. 1 §9.3, "Colliding Carts": they stick, so e = 0', { meet: 'move', m1: 0.5, m2: 0.675, u1: 1.33, u2: 0.75, e: 0 }, { e: 0, lost: impactLoss(0.5, 0.675, 1.33, 0.75, 0) }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.concept-impulse',
    src: 'OpenStax University Physics Vol. 1 §9.2',
    title: 'What an impulse counts',
    kind: 'conceptual',
    level: 1,
    variety: ['unknown'],
    lab: 'impulse',
    topics: ['impulse'],
    vars: {
      q: choice(
        [1, 'A ball hits a wall and rebounds at the same speed. The impulse from the wall, compared with the ball\'s incoming momentum, is:'],
        [2, 'The same change of momentum is spread over twice the time. The average force:'],
        [3, 'A rectangular pulse and a triangular pulse have the same area on a graph of F against t. Their impulses are:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'twice', 2: 'half', 3: 'equal' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: 2 * 0.2 * 5 > 0.2 * 5 ? 'twice' : 'same' };
      if ($.q === 2) return { ans: Math.abs(-8) / 1 < Math.abs(-8) / 0.5 ? 'half' : 'same' };
      const same = Math.abs(pulseImpulse('rect', 10, 2) - pulseImpulse('tri', 20, 2)) < 1e-9;
      return { ans: same ? 'equal' : 'diff' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['twice', 'Twice the incoming momentum', 'The velocity reverses, so Δp = mv − (−mv) = 2mv.'],
          ['same', 'Equal to the incoming momentum', 'That is a stop. A rebound also has to supply the outgoing momentum.'],
          ['half', 'Half the incoming momentum', 'The change is larger than the incoming momentum, not smaller.'],
        ],
        2: [
          ['half', 'Is halved', 'J = F Δt is the same, so twice the time means half the average force.'],
          ['double', 'Doubles', 'A longer push is a gentler one when the area under F(t) is fixed.'],
          ['same', 'Is unchanged', 'The impulse is fixed. The force is that impulse divided by the time.'],
        ],
        3: [
          ['equal', 'Equal', 'Impulse is the area. The shape does not matter once the area is the same.'],
          ['tri', 'Larger for the triangle, because it is taller', 'The extra height is paid for by less width. Equal areas are equal impulses.'],
          ['rect', 'Larger for the rectangle, because it stays high', 'Time spent at the peak does not matter apart from the area it adds.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Impulse equals the change of momentum. Compare the momentum before the hit with the momentum after it.',
      'On a graph of force against time, the impulse is the area, and the average force is that area divided by the duration.',
    ],
    steps: ($) => [{ 1: 'Δp = 2mv for a rebound at the same speed.', 2: 'F = J/Δt, so twice the time halves F.', 3: 'Equal areas, equal impulses.' }[$.q]],
    sim: { scenario: 'tent', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.3, "Superball": the rebound impulse is 2mv, not mv', { q: 1 }, { ans: 'twice' }),
      kase('OpenStax University Physics Vol. 1 §9.2, "The Benefits of Impulse": a longer stop means a smaller average force', { q: 2 }, { ans: 'half' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.concept-collide',
    src: 'OpenStax University Physics Vol. 1 §9.3',
    title: 'Which collisions can happen',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'collide',
    topics: ['collision', 'momentum-conservation'],
    vars: {
      q: choice(
        [1, 'Two equal masses collide elastically, and the target is at rest. Afterward:'],
        [2, 'Two bodies collide and stick. Which statement is true?'],
        [3, 'A 2 kg body at 3 m/s hits a 4 kg body at rest, and both are at rest afterward. That outcome is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'exchange', 2: 'p-only', 3: 'no' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const hit = collide1D(2, 2, 4, 0, 1);
        return { ans: Math.abs(hit.v1) < 1e-9 && Math.abs(hit.v2 - 4) < 1e-9 ? 'exchange' : 'other' };
      }
      if ($.q === 2) {
        const lost = impactLoss(2, 3, 4, 0, 0);
        const p0 = 2 * 4;
        const v = stickVelocity(2, 3, 4, 0);
        return { ans: lost > 0 && Math.abs(5 * v - p0) < 1e-9 ? 'p-only' : 'both' };
      }
      return { ans: Math.abs(2 * 3 + 4 * 0) > 0 ? 'no' : 'yes' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['exchange', 'They exchange velocities', 'Equal masses, elastic, target at rest: the incoming one stops and the target leaves at the incoming speed.'],
          ['stop', 'Both stop', 'That would erase the momentum. Nothing outside the pair takes it.'],
          ['through', 'The incoming one keeps its speed and the target stays put', 'The target has to move. The incoming one cannot keep all of the momentum.'],
        ],
        2: [
          ['p-only', 'Momentum is conserved and kinetic energy is not', 'Sticking is perfectly inelastic. The shared motion keeps the momentum and drops the kinetic energy of the relative motion.'],
          ['both', 'Both momentum and kinetic energy are conserved', 'Kinetic energy is conserved only for an elastic collision, e = 1.'],
          ['k-only', 'Kinetic energy is conserved and momentum is not', 'Momentum is the conserved one, for any e, when no outside force acts.'],
        ],
        3: [
          ['no', 'Impossible: the momentum would vanish', 'The momentum before is 6 kg·m/s. Both at rest means zero. No outside force accounts for it.'],
          ['stick', 'Possible if they stick', 'Sticking gives one shared velocity, (2×3)/6 = 1 m/s, not zero.'],
          ['elastic', 'Possible if the collision is elastic', 'An elastic collision with a heavier target sends the incoming body back. It does not stop both.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'With no outside force, the total momentum is the same before and after. That is true whether or not kinetic energy is conserved.',
      'Equal masses in an elastic collision with a target at rest exchange their velocities. Sticking loses the most kinetic energy this pair can lose.',
    ],
    steps: ($) => [{ 1: 'Equal masses, elastic, target at rest: velocities exchange.', 2: 'e = 0 keeps momentum and loses kinetic energy.', 3: 'Momentum before is 6 kg·m/s, not zero.' }[$.q]],
    sim: { scenario: 'exchange', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.3, "Ice Hockey 1": equal masses exchange velocities', { q: 1 }, { ans: 'exchange' }),
      kase('OpenStax University Physics Vol. 1 §9.3, "Colliding Carts": the carts stick and kinetic energy drops', { q: 2 }, { ans: 'p-only' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.concept-cm',
    src: 'OpenStax University Physics Vol. 1 §9.6',
    title: 'Where the center of mass sits',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'center-of-mass',
    topics: ['center-of-mass'],
    vars: {
      q: choice(
        [1, 'A 1 kg mass is at x = 0 and a 3 kg mass is at x = 4 m. The center of mass is:'],
        [2, 'A shell bursts into fragments in flight, and the forces of the burst are internal. The center of mass:'],
        [3, 'A uniform hoop has all of its mass on the rim. Its center of mass is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'heavy', 2: 'parabola', 3: 'center' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const x = (1 * 0 + 3 * 4) / 4;
        return { ans: x > 2 ? 'heavy' : 'mid' };
      }
      if ($.q === 2) {
        const th = 50 * DEG;
        const t = 1.2;
        const x = 8 * Math.cos(th) * t;
        const y = 8 * Math.sin(th) * t - 0.5 * G * t * t;
        const rel = [[3, 0], [-1.5, 1.5], [-1.5, -1.5]];
        const parts = rel.map(([rx, ry]) => ({ x: x + rx * t, y: y + ry * t }));
        const ax = parts.reduce((s, p) => s + p.x, 0) / 3;
        return { ans: Math.abs(ax - x) < 1e-9 ? 'parabola' : 'jump' };
      }
      let sx = 0;
      const n = 3600;
      for (let i = 0; i < n; i += 1) sx += Math.cos((2 * Math.PI * (i + 0.5)) / n);
      return { ans: Math.abs(sx / n) < 1e-6 ? 'center' : 'rim' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['heavy', 'Closer to the 3 kg mass', 'The average is weighted by mass: x = 3 m, not the midpoint at 2 m.'],
          ['mid', 'At the midpoint, x = 2 m', 'A midpoint is the center of mass only when the masses are equal.'],
          ['light', 'Closer to the 1 kg mass', 'The heavier mass pulls the average its way.'],
        ],
        2: [
          ['parabola', 'Stays on the parabola the shell was already on', 'Internal forces cancel in pairs. The center of mass feels only the outside forces, here gravity.'],
          ['jump', 'Jumps toward the heaviest fragment', 'The fragments move apart around the center of mass. They do not move it.'],
          ['stop', 'Stops where the shell bursts', 'Gravity is still an outside force. The center of mass keeps falling.'],
        ],
        3: [
          ['center', 'At the center, where there is no material', 'Every mass element has an opposite partner. The weighted average is the center.'],
          ['rim', 'On the rim, because that is where the mass is', 'The mass is spread around the rim. The average of a full circle is the middle.'],
          ['none', 'Undefined, because the center is empty', 'Empty space can still be the average position. No mass has to sit there.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Weight each position by its mass, then divide by the total mass. Equal masses are the only case where the midpoint wins.',
      'Internal forces come in pairs and cancel in the total momentum. The center of mass moves as if all the outside forces acted on the total mass.',
    ],
    steps: ($) => [{ 1: 'x = (3×4)/4 = 3 m, closer to the heavy mass.', 2: 'Internal forces do not move the center of mass.', 3: 'A uniform hoop averages to its center.' }[$.q]],
    sim: { scenario: 'burst', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.6: the center of mass is the mass-weighted average, not the midpoint', { q: 1 }, { ans: 'heavy' }),
      kase('OpenStax University Physics Vol. 1 §9.6: a burst\'s internal forces leave the center of mass on its parabola', { q: 2 }, { ans: 'parabola' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.concept-rocket',
    src: 'OpenStax University Physics Vol. 1 §9.7',
    title: 'What a burn buys',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'rocket',
    topics: ['rocket'],
    vars: {
      q: choice(
        [1, 'A rocket coasts, with gravity left out. Doubling the exhaust speed, at the same mass ratio:'],
        [2, 'A thruster pushes with 5.0×10⁴ N on a 20 000 kg spacecraft. Can that thrust lift the craft off the ground?'],
        [3, 'The same coasting rocket burns twice the propellant and finishes at the same final mass. The change of velocity:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'double', 2: 'no', 3: 'less' }[$.q] }),
    second: ($) => {
      const coast = rocketDeltaV({ m0: 20000, mf: 14000, ve: 250, mdot: 200, g: 0 });
      if ($.q === 1) {
        const fast = rocketDeltaV({ m0: 20000, mf: 14000, ve: 500, mdot: 200, g: 0 });
        return { ans: Math.abs(fast.dv - 2 * coast.dv) < 1e-9 ? 'double' : 'other' };
      }
      if ($.q === 2) return { ans: 5.0e4 < 20000 * G ? 'no' : 'yes' };
      const more = rocketDeltaV({ m0: 26000, mf: 14000, ve: 250, mdot: 200, g: 0 });
      return { ans: more.dv < 2 * coast.dv ? 'less' : 'double' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['double', 'Doubles the change of velocity', 'Δv = ve ln(m0/mf) on a coast. The logarithm does not involve ve, so Δv scales with ve.'],
          ['ratio', 'Doubles the mass ratio', 'The mass ratio is the masses. The exhaust speed does not change it.'],
          ['none', 'Does not change the velocity', 'A faster exhaust pushes harder for the same mass thrown back.'],
        ],
        2: [
          ['no', 'No. The thrust is less than the weight', 'The weight is about 1.96×10⁵ N. The thrust is about a quarter of that, so the craft accelerates downward.'],
          ['yes', 'Yes. Any upward thrust lifts it', 'It lifts only when the thrust exceeds the weight. This one does not.'],
          ['long', 'Only if the burn lasts longer', 'A longer burn of this engine spends more mass. The thrust itself stays below the weight.'],
        ],
        3: [
          ['less', 'Grows, by less than a factor of two', 'Δv follows ln(m0/mf). Doubling the burned mass from 6000 kg to 12 000 kg, with mf fixed, raises the ratio from 1.43 to 1.86, and the logarithm rises by less than double.'],
          ['double', 'Doubles', 'That would be true if Δv were proportional to the mass burned. It is proportional to the logarithm of the mass ratio.'],
          ['more', 'More than doubles, because the rocket gets lighter', 'The rocket does get lighter, and that is already inside the logarithm. The logarithm still grows slower than the burned mass.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`On a coast, $\Delta v = v_e\ln(m_0/m_f)$. Gravity subtracts $g$ times the burn time when the rocket is fired upward.`,
      'Compare the thrust, exhaust speed times burn rate, with the weight mg before you decide that a rocket can lift itself.',
    ],
    steps: ($) => [{ 1: 'Δv scales with ve on a coast.', 2: '5.0×10⁴ N is less than 20 000×9.81 N.', 3: 'ln grows slower than the burned mass.' }[$.q]],
    sim: { scenario: 'coast', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.7, "Thrust on a Spacecraft": thrust 5.0×10⁴ N on 20 000 kg cannot lift the craft', { q: 2 }, { ans: 'no' }),
      kase('OpenStax University Physics Vol. 1 §9.7: Δv = ve ln(m0/mf), so it scales with the exhaust speed', { q: 1 }, { ans: 'double' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch9.concept-2d',
    src: 'OpenStax University Physics Vol. 1 §9.5',
    title: 'Momentum in a plane',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'collide-2d',
    topics: ['oblique', 'elastic'],
    vars: {
      q: choice(
        [1, 'Two discs of equal mass collide elastically, one of them at rest, and the hit is not head-on. The angle between their outgoing velocities is:'],
        [2, 'Two vehicles hit at a right angle and stick. Adding their momenta as if the velocities were parallel, then dividing by the total mass, compared with the real shared speed:'],
        [3, 'Two smooth discs collide, with no friction. Each disc\'s velocity along the contact face:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'right', 2: 'high', 3: 'same' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const d = discCollision({ m1: 1, m2: 1, u1x: 3, thetaDeg: 40, e: 1 });
        return { ans: Math.abs(d.v1x * d.v2x + d.v1y * d.v2y) < 1e-9 ? 'right' : 'other' };
      }
      if ($.q === 2) {
        const along = (2 * 4 + 3 * 3) / 5;
        const real = Math.hypot(2 * 4, 3 * 3) / 5;
        return { ans: along > real ? 'high' : 'low' };
      }
      const d = discCollision({ m1: 1, m2: 2, u1x: 3, thetaDeg: 40, e: 0.5 });
      const tx = -Math.sin(40 * DEG);
      const ty = Math.cos(40 * DEG);
      const ut0 = 3 * tx;
      const ut1 = d.v1x * tx + d.v1y * ty;
      return { ans: Math.abs(ut0 - ut1) < 1e-9 ? 'same' : 'other' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['right', '90°', 'Equal masses, elastic, one at rest: the two outgoing velocities are perpendicular. Head-on is the exception, where one of them is zero.'],
          ['contact', 'The contact angle', 'The contact angle sets how the momentum is split. The angle between the outgoing velocities is 90° for this case.'],
          ['together', '0°. They leave together', 'Leaving together is a stick, e = 0. An elastic collision of equal masses does not do that.'],
        ],
        2: [
          ['high', 'Comes out too high', 'The momenta are perpendicular, so the size of the sum is less than the sum of the sizes. Adding them as a single line overstates the shared speed.'],
          ['exact', 'Is exact', 'That would be true if the vehicles were already moving on the same line.'],
          ['low', 'Comes out too low', 'Dropping the angle drops a positive contribution. The parallel sum is the larger number.'],
        ],
        3: [
          ['same', 'Is unchanged', 'With no friction there is no tangent force. Only the velocity along the contact normal changes.'],
          ['reverse', 'Reverses', 'A reversal would need a tangent force. Smooth discs have none.'],
          ['zero', 'Drops to zero', 'The face of the contact does not grab. The sideways velocity keeps going.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Conserve each component of momentum on its own. The magnitude of a momentum is not a conserved quantity.',
      'For smooth discs, split the velocity into a normal piece and a tangent piece. Only the normal piece is a one-dimensional collision.',
    ],
    steps: ($) => [{ 1: 'Equal masses, elastic, one at rest: the paths leave at 90°.', 2: 'A right angle makes |p1 + p2| smaller than |p1| + |p2|.', 3: 'No friction, so the tangent velocities pass through.' }[$.q]],
    sim: { scenario: 'equal', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §9.4: equal masses, one at rest, elastic, leave at a right angle when the hit is off center', { q: 1 }, { ans: 'right' }),
      kase('OpenStax University Physics Vol. 1 §9.5, "Traffic Collision": the momenta add as vectors, not as speeds', { q: 2 }, { ans: 'high' }),
    ],
  }),
];
