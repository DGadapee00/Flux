import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import {
  collide1D, collideOblique, impulseRamp, momentum, particleAngularMomentum, rocketDeltaV,
} from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function solveLine(m1, m2, u1, u2, e) {
  const p = m1 * u1 + m2 * u2;
  const rel = e * (u1 - u2);
  const v1 = (p - m2 * rel) / (m1 + m2);
  return { v1, v2: v1 + rel };
}

function rampArea($) {
  const steps = 2000;
  let J = 0;
  if ($.t1 > 0) {
    const dt = $.t1 / steps;
    for (let i = 0; i < steps; i++) J += ($.f1 + $.s1 * ((i + 0.5) * dt)) * dt;
  }
  if ($.t2 > 0) {
    const dt = $.t2 / steps;
    for (let i = 0; i < steps; i++) J += $.f2 * dt;
  }
  return J;
}

function burn(spec, g) {
  const steps = 4000;
  const dt = ((spec.m0 - spec.mf) / spec.mdot) / steps;
  let m = spec.m0;
  let speed = 0;
  for (let i = 0; i < steps; i++) {
    const mid = m - 0.5 * spec.mdot * dt;
    speed += (spec.mdot * spec.ve / mid - g) * dt;
    m -= spec.mdot * dt;
  }
  return speed;
}

function oblique($) {
  const th = $.theta * DEG;
  return collideOblique({
    m1: $.m1,
    m2: $.m2,
    un1: $.u1 * Math.cos(th),
    ut1: $.u1 * Math.sin(th),
    un2: $.u2,
    ut2: 0,
    e: $.e,
  });
}

const ch15 = [
  problem({
    id: 'u4.15.impulse',
    title: 'Impulse of a force',
    exam: 'u4',
    ch: '15',
    lab: 'impulse',
    src: 'Hibbeler §15.1',
    topics: ['impulse'],
    vars: {
      m: range(1, 6, 0.5, 'kg'),
      v0: range(0, 4, 0.5, 'm/s'),
      f1: range(20, 200, 10, 'N'),
      s1: range(0, 40, 5, 'N/s'),
      t1: range(0.2, 2, 0.2, 's'),
      f2: range(10, 80, 5, 'N'),
      t2: range(0.2, 2, 0.2, 's'),
    },
    text: (T) => String.raw`A ${T.m} kg particle starts at ${T.v0} m/s. From $t = 0$ to $t = ${T.t1}$ s the force is $F = ${T.f1} + ${T.s1}t$ N. A constant ${T.f2} N then acts for ${T.t2} s. Find the total impulse and the final speed.`,
    parts: [
      num('J', ($) => impulseRamp($.f1, $.s1, 0, $.t1) + $.f2 * $.t2, 'N·s', { label: 'total impulse' }),
      num('v', ($) => $.v0 + (impulseRamp($.f1, $.s1, 0, $.t1) + $.f2 * $.t2) / $.m, 'm/s', { label: 'final speed' }),
    ],
    hints: ['The impulse is the area under F(t). A straight ramp has the area of the average force times the duration.'],
    steps: ($, sig) => {
      const j1 = impulseRamp($.f1, $.s1, 0, $.t1);
      const j2 = $.f2 * $.t2;
      const J = j1 + j2;
      return [
        String.raw`First area: $\int_0^{t_1}(F_1+s_1 t)\,dt = ${sig(j1)}\ \mathrm{N\cdot s}$.`,
        String.raw`Second area: $F_2 t_2 = ${sig(j2)}\ \mathrm{N\cdot s}$.`,
        String.raw`The total impulse is ${sig(J)} N·s, so the speed is ${sig($.v0 + J / $.m)} m/s.`,
      ];
    },
    second: ($) => {
      const J = rampArea($);
      return { J, v: $.v0 + J / $.m };
    },
    sim: {
      scenario: 'pair',
      setup(s, $) {
        s.mass = $.m;
        s.v0 = $.v0;
        s.f1 = $.f1;
        s.s1 = $.s1;
        s.t1 = $.t1;
        s.f2 = $.f2;
        s.t2 = $.t2;
      },
      read: (c) => ({ J: c.J, v: c.v }),
    },
    cases: [kase('Hibbeler §15.1', { m: 2, v0: 0, f1: 100, s1: 0, t1: 0.4, f2: 40, t2: 1 }, { J: 80, v: 40 })],
  }),

  problem({
    id: 'u4.15.recoil',
    title: 'Gun recoil',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.3',
    topics: ['recoil', 'conservation'],
    vars: {
      mb: range(0.01, 0.05, 0.01, 'kg'),
      vb: range(200, 500, 50, 'm/s'),
      Mg: range(2, 6, 0.5, 'kg'),
    },
    text: (T) => String.raw`A bullet of mass ${T.mb} kg leaves a gun of mass ${T.Mg} kg at ${T.vb} m/s. The gun was at rest. Find the recoil speed.`,
    parts: [
      num('vg', ($) => ($.mb * $.vb) / $.Mg, 'm/s', { label: 'recoil speed' }),
    ],
    hints: ['Take the bullet and the gun as one system. Their momenta sum to zero.'],
    steps: ($, sig) => [
      String.raw`$m_b v_b + m_g v_g = 0$.`,
      String.raw`The recoil speed is ${sig(($.mb * $.vb) / $.Mg)} m/s.`,
    ],
    second: ($) => ({ vg: momentum($.mb, $.vb) / $.Mg }),
    cases: [kase('Hibbeler §15.3', { mb: 0.02, vb: 400, Mg: 4 }, { vg: 2 })],
  }),

  problem({
    id: 'u4.15.ballistic',
    title: 'Bullet and block',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact', 'conservation'],
    vars: {
      mb: range(0.02, 0.08, 0.02, 'kg'),
      vb: range(200, 500, 50, 'm/s'),
      M: range(1, 4, 0.5, 'kg'),
    },
    valid: ($) => $.mb < $.M,
    text: (T) => String.raw`A ${T.mb} kg bullet moving at ${T.vb} m/s embeds in a ${T.M} kg block at rest. Find the shared speed.`,
    parts: [
      num('v', ($) => collide1D($.mb, $.M, $.vb, 0, 0).v1, 'm/s', { label: 'shared speed' }),
    ],
    hints: ['An embedded bullet is a perfectly inelastic collision. Momentum is conserved, and the two masses leave together.'],
    steps: ($, sig) => {
      const v = ($.mb * $.vb) / ($.mb + $.M);
      return [
        String.raw`$m_b v_b = (m_b + M) v$.`,
        String.raw`The shared speed is ${sig(v)} m/s.`,
      ];
    },
    second: ($) => ({ v: ($.mb * $.vb) / ($.mb + $.M) }),
    sim: {
      scenario: 'stick',
      setup(s, $) {
        s.m1 = $.mb;
        s.m2 = $.M;
        s.u1 = $.vb;
        s.u2 = 0;
        s.e = 0;
        s.theta = 0;
      },
      read: (c) => ({ v: c.vn1 }),
    },
    cases: [kase('Hibbeler §15.4', { mb: 0.05, vb: 400, M: 1.95 }, { v: 10 })],
  }),

  problem({
    id: 'u4.15.central',
    title: 'Central impact',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact'],
    vars: {
      m1: range(0.5, 4, 0.5, 'kg'),
      m2: range(0.5, 4, 0.5, 'kg'),
      u1: range(1, 8, 0.5, 'm/s'),
      u2: range(-2, 2, 0.5, 'm/s'),
      e: range(0, 1, 0.1, ''),
    },
    text: (T) => String.raw`Masses ${T.m1} kg and ${T.m2} kg meet along a line. Their speeds are ${T.u1} m/s and ${T.u2} m/s. The coefficient of restitution is ${T.e}. Find both speeds after the impact.`,
    parts: [
      num('v1', ($) => collide1D($.m1, $.m2, $.u1, $.u2, $.e).v1, 'm/s', { label: 'speed of the first mass' }),
      num('v2', ($) => collide1D($.m1, $.m2, $.u1, $.u2, $.e).v2, 'm/s', { label: 'speed of the second mass' }),
    ],
    hints: ['Write conservation of momentum and the restitution equation. Solve that pair.'],
    steps: ($, sig) => {
      const hit = solveLine($.m1, $.m2, $.u1, $.u2, $.e);
      return [
        String.raw`$m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$.`,
        String.raw`$v_2 - v_1 = e(u_1 - u_2)$.`,
        String.raw`The speeds are ${sig(hit.v1)} m/s and ${sig(hit.v2)} m/s.`,
      ];
    },
    second: ($) => solveLine($.m1, $.m2, $.u1, $.u2, $.e),
    sim: {
      scenario: 'central',
      setup(s, $) {
        s.m1 = $.m1;
        s.m2 = $.m2;
        s.u1 = $.u1;
        s.u2 = $.u2;
        s.e = $.e;
        s.theta = 0;
      },
      read: (c) => ({ v1: c.vn1, v2: c.vn2 }),
    },
    cases: [kase('Hibbeler §15.4', { m1: 1, m2: 1, u1: 4, u2: 0, e: 0.5 }, { v1: 1, v2: 3 })],
  }),

  problem({
    id: 'u4.15.oblique',
    title: 'Oblique impact',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['oblique', 'impact'],
    vars: {
      m1: range(0.5, 4, 0.5, 'kg'),
      m2: range(0.5, 4, 0.5, 'kg'),
      u1: range(1, 8, 0.5, 'm/s'),
      u2: range(-2, 2, 0.5, 'm/s'),
      e: range(0, 1, 0.1, ''),
      theta: range(0, 60, 5, 'deg'),
    },
    text: (T) => String.raw`A ${T.m1} kg body approaches at ${T.u1} m/s, ${T.theta}° from the line of impact. A ${T.m2} kg body moves along that line at ${T.u2} m/s. $e = ${T.e}$. Find the two normal speeds and the tangent speed of the first body.`,
    parts: [
      num('vn1', ($) => oblique($).vn1, 'm/s', { label: 'normal speed of the first body' }),
      num('vn2', ($) => oblique($).vn2, 'm/s', { label: 'normal speed of the second body' }),
      num('vt', ($) => oblique($).vt1, 'm/s', { label: 'tangent speed of the first body' }),
    ],
    hints: ['Split the incoming velocity into a normal part and a tangent part. The tangent part is unchanged.'],
    steps: ($, sig) => {
      const th = $.theta * DEG;
      const un1 = $.u1 * Math.cos(th);
      const hit = solveLine($.m1, $.m2, un1, $.u2, $.e);
      return [
        String.raw`Normal part of the first speed: $u_1\cos\theta = ${sig(un1)}\ \mathrm{m/s}$.`,
        String.raw`The tangent part stays ${sig($.u1 * Math.sin(th))} m/s.`,
        String.raw`The normal speeds after impact are ${sig(hit.v1)} m/s and ${sig(hit.v2)} m/s.`,
      ];
    },
    second: ($) => {
      const th = $.theta * DEG;
      const hit = solveLine($.m1, $.m2, $.u1 * Math.cos(th), $.u2, $.e);
      return { vn1: hit.v1, vn2: hit.v2, vt: $.u1 * Math.sin(th) };
    },
    sim: {
      scenario: 'oblique',
      setup(s, $) {
        s.m1 = $.m1;
        s.m2 = $.m2;
        s.u1 = $.u1;
        s.u2 = $.u2;
        s.e = $.e;
        s.theta = $.theta;
      },
      read: (c) => ({ vn1: c.vn1, vn2: c.vn2, vt: c.vt1 }),
    },
    cases: [kase('Hibbeler §15.4', { m1: 2, m2: 2, u1: 4, u2: 0, e: 1, theta: 30 }, { vn1: 0, vn2: 3.464101615137755, vt: 2 })],
  }),

  problem({
    id: 'u4.15.angular',
    title: 'Angular momentum about a point',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.5',
    topics: ['angular'],
    vars: {
      m: range(0.5, 4, 0.5, 'kg'),
      x: range(-2, 2, 0.5, 'm'),
      y: range(-2, 2, 0.5, 'm'),
      vx: range(-4, 4, 0.5, 'm/s'),
      vy: range(-4, 4, 0.5, 'm/s'),
    },
    text: (T) => String.raw`A ${T.m} kg particle is at $(${T.x}, ${T.y})$ m with velocity $(${T.vx}, ${T.vy})$ m/s. Find its angular momentum about the origin.`,
    parts: [
      num('L', ($) => particleAngularMomentum($.m, v($.x, $.y, 0), v($.vx, $.vy, 0)).z, 'kg·m²/s', { label: 'angular momentum' }),
    ],
    hints: ['The moment about the origin is m times x vy minus y vx.'],
    steps: ($, sig) => [
      String.raw`$L_z = m(x v_y - y v_x)$.`,
      String.raw`$L_z = ${sig($.m * ($.x * $.vy - $.y * $.vx))}\ \mathrm{kg\cdot m^2/s}$.`,
    ],
    second: ($) => ({ L: $.m * ($.x * $.vy - $.y * $.vx) }),
    cases: [kase('Hibbeler §15.5', { m: 2, x: 0.4, y: -0.3, vx: 1, vy: 3 }, { L: 3 })],
  }),

  problem({
    id: 'u4.15.rocket',
    title: 'Rocket in gravity',
    exam: 'u4',
    ch: '15',
    lab: 'rocket',
    src: 'Hibbeler §15.9',
    topics: ['rocket'],
    vars: {
      m0: range(150, 400, 10, 'kg'),
      mf: range(40, 120, 10, 'kg'),
      ve: range(800, 2500, 50, 'm/s'),
      mdot: range(10, 60, 5, 'kg/s'),
    },
    valid: ($) => $.mf > 0 && $.mdot > 0 && $.mf < $.m0 * 0.9,
    text: (T) => String.raw`A rocket burns from ${T.m0} kg to ${T.mf} kg. The exhaust speed is ${T.ve} m/s and the burn rate is ${T.mdot} kg/s. $g = 9.81$ m/s². Find $\Delta v$.`,
    parts: [
      num('dv', ($) => rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: G }).dv, 'm/s', { label: 'change in speed' }),
    ],
    hints: ['The speed gain is the exhaust speed times the log of the mass ratio, minus g times the burn time.'],
    steps: ($, sig) => {
      const row = rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: G });
      return [
        String.raw`Burn time: $t_b = (m_0 - m_f)/\dot m = ${sig(row.tb)}\ \mathrm{s}$.`,
        String.raw`$\Delta v = v_e\ln(m_0/m_f) - g t_b = ${sig(row.dv)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => ({ dv: burn($, G) }),
    sim: {
      scenario: 'gravity',
      setup(s, $) {
        s.m0 = $.m0;
        s.mf = $.mf;
        s.ve = $.ve;
        s.mdot = $.mdot;
        s.g = G;
      },
      read: (c) => ({ dv: c.dv }),
    },
    cases: [kase('Hibbeler §15.9', { m0: 200, mf: 80, ve: 1500, mdot: 40 }, { dv: 1345.0060978112326 })],
  }),

  problem({
    id: 'u4.15.rocket-ft',
    title: 'Rocket in US customary units',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.9',
    topics: ['rocket'],
    vars: {
      m0: range(8, 20, 1, 'slug'),
      mf: range(2, 6, 0.5, 'slug'),
      ve: range(2000, 6000, 200, 'ft/s'),
      mdot: range(1, 4, 0.5, 'slug/s'),
    },
    valid: ($) => $.mf > 0 && $.mdot > 0 && $.mf < $.m0 * 0.9,
    text: (T) => String.raw`A rocket burns from ${T.m0} slugs to ${T.mf} slugs. The exhaust speed is ${T.ve} ft/s and the burn rate is ${T.mdot} slug/s. $g = 32.2$ ft/s². Find $\Delta v$.`,
    parts: [
      num('dv', ($) => rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: G_FT }).dv, 'ft/s', { label: 'change in speed' }),
    ],
    hints: ['The equation is the same in US customary units. The mass is in slugs, and g is 32.2 ft/s².'],
    steps: ($, sig) => {
      const row = rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: G_FT });
      return [
        String.raw`Burn time: $(m_0 - m_f)/\dot m = ${sig(row.tb)}\ \mathrm{s}$.`,
        String.raw`$\Delta v = v_e\ln(m_0/m_f) - g t_b = ${sig(row.dv)}\ \mathrm{ft/s}$.`,
      ];
    },
    second: ($) => ({ dv: burn($, G_FT) }),
    cases: [kase('Hibbeler §15.9', { m0: 10, mf: 4, ve: 4000, mdot: 2 }, { dv: 3568.5629274966204 })],
  }),
];

export default ch15;
