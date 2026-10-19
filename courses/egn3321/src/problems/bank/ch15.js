import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import {
  collide1D, collideOblique, impulseRamp, momentum, particleAngularMomentum, rocketDeltaV,
} from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { choice, kase, num, problem, range } from '../kit.js';

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
    for (let i = 0; i < steps; i++) J += $.F2 * dt;
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
    // The force history is the structure: a rising force, two steady pushes, or a push then a brake.
    vars: {
      shape: choice(['ramp', 'a rising force'], ['steps', 'two steady forces'], ['brake', 'a push, then a braking force']),
      m: range(2, 6, 1, 'kg'),
      v0: range(0, 4, 1, 'm/s'),
      f1: range(20, 100, 10, 'N'),
      s1: range(10, 40, 10, 'N/s'),
      t1: range(0.5, 2, 0.5, 's'),
      f2: range(10, 60, 10, 'N'),
      t2: range(0.5, 2, 0.5, 's'),
    },
    derive: ($) => ({ s1: $.shape === 'ramp' ? $.s1 : 0, F2: $.shape === 'brake' ? -$.f2 : $.f2 }),
    text: (T, $) => {
      const first = $.shape === 'ramp'
        ? String.raw`From $t = 0$ to $t = ${T.t1}$ s the force is $F = ${T.f1} + ${T.s1}t$ N, along the motion.`
        : String.raw`From $t = 0$ to $t = ${T.t1}$ s a steady ${T.f1} N pushes it along the motion.`;
      const second = $.shape === 'brake'
        ? String.raw`Then a steady ${T.f2} N acts against the starting direction for ${T.t2} s.`
        : String.raw`Then a steady ${T.f2} N pushes it along the motion for ${T.t2} s.`;
      return String.raw`A ${T.m} kg particle starts at ${T.v0} m/s on a smooth line. ${first} ${second} Find the total impulse and the final velocity.`;
    },
    parts: [
      num('J', ($) => impulseRamp($.f1, $.s1, 0, $.t1) + $.F2 * $.t2, 'N·s', { label: 'total impulse' }),
      num('v', ($) => $.v0 + (impulseRamp($.f1, $.s1, 0, $.t1) + $.F2 * $.t2) / $.m, 'm/s', { label: 'final velocity, along the starting direction' }),
    ],
    level: 1,
    hints: ['The impulse is the area under F(t). A straight ramp has the area of the average force times the duration.',
      "The change in speed is the total impulse divided by the mass. Add that change to the starting speed.",
    ],
    steps: ($, sig) => {
      const j1 = impulseRamp($.f1, $.s1, 0, $.t1);
      const j2 = $.F2 * $.t2;
      const J = j1 + j2;
      return [
        String.raw`First area: $\int_0^{t_1}(F_1+s_1 t)\,dt = ${sig(j1)}\ \mathrm{N\cdot s}$.`,
        String.raw`Second area: $F_2 t_2 = ${sig(j2)}\ \mathrm{N\cdot s}$${$.shape === 'brake' ? ', negative because it acts backward' : ''}.`,
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
        s.f2 = $.F2;
        s.t2 = $.t2;
      },
      read: (c) => ({ J: c.J, v: c.v }),
    },
    cases: [
      kase('Hibbeler §15.1', { shape: 'steps', m: 2, v0: 0, f1: 100, s1: 10, t1: 0.4, f2: 40, t2: 1 }, { J: 80, v: 40 }),
      kase('Hibbeler §15.1', { shape: 'brake', m: 4, v0: 2, f1: 60, s1: 10, t1: 1, f2: 20, t2: 1.5 }, { J: 30, v: 9.5 }),
    ],
  }),

  problem({
    id: 'u4.15.recoil',
    title: 'Gun recoil',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.3',
    topics: ['recoil', 'conservation'],
    // Which frame the shell's speed is measured in is the structure: the ground, or the barrel.
    vars: {
      given: choice(['ground', 'relative to the ground'], ['muzzle', 'relative to the barrel']),
      mb: range(10, 30, 5, 'kg'),
      vb: range(100, 400, 50, 'm/s'),
      Mg: range(100, 300, 50, 'kg'),
    },
    text: (T) => String.raw`A cannon of mass ${T.Mg} kg sits at rest on smooth horizontal rails. It fires a ${T.mb} kg shell horizontally at ${T.vb} m/s ${T.given}. Find the cannon's recoil speed.`,
    parts: [
      num('vg', ($) => ($.given === 'muzzle' ? ($.mb * $.vb) / ($.Mg + $.mb) : ($.mb * $.vb) / $.Mg), 'm/s', { label: 'recoil speed' }),
    ],
    level: 1,
    hints: ['Take the shell and the cannon as one system. Nothing horizontal acts from outside, so their momenta sum to zero.',
      'If the speed is relative to the barrel, the shell’s ground speed is that speed less the recoil speed.',
    ],
    steps: ($, sig) => ($.given === 'muzzle'
      ? [
        String.raw`Shell over ground: $u - v_g$. Momentum: $m_b(u - v_g) - M v_g = 0$.`,
        String.raw`$v_g = m_b u/(M + m_b) = ${sig(($.mb * $.vb) / ($.Mg + $.mb))}\ \mathrm{m/s}$.`,
      ]
      : [
        String.raw`$m_b v_b - M v_g = 0$.`,
        String.raw`$v_g = m_b v_b/M = ${sig(($.mb * $.vb) / $.Mg)}\ \mathrm{m/s}$.`,
      ]),
    // Second: find the recoil speed at which the momenta balance, by bisection. (Iterating
    // v = m_b (u - v)/M diverges once the shell outweighs the cannon, as a girl leaping from a cart does.)
    second: ($) => {
      if ($.given !== 'muzzle') return { vg: momentum($.mb, $.vb) / $.Mg };
      let lo = 0;
      let hi = $.vb;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (momentum($.mb, $.vb - mid) - $.Mg * mid > 0) lo = mid;
        else hi = mid;
      }
      return { vg: (lo + hi) / 2 };
    },
    cases: [
      kase('Hibbeler §15.3', { given: 'ground', mb: 20, vb: 300, Mg: 200 }, { vg: 30 }),
      kase('Hibbeler §15.3', { given: 'muzzle', mb: 20, vb: 330, Mg: 200 }, { vg: 30 }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 3, Problem 3a', { given: 'muzzle', mb: 75, vb: 3, Mg: 50 }, { vg: 1.8 }, { note: 'A girl leaps from a cart at 3 m/s relative to the cart. The printed velocity of the cart is −1.8 m/s: it moves opposite to the leap.' }),
    ],
  }),

  problem({
    id: 'u4.15.ballistic',
    title: 'Bullet and block',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact', 'conservation'],
    // Forward or backward is the structure: the shared speed from the bullet, or the bullet from the block.
    vars: {
      find: choice(['shared', 'the speed the block moves off with'], ['bullet', 'the speed of the bullet']),
      mb: range(0.05, 0.2, 0.05, 'kg'),
      vb: range(200, 500, 50, 'm/s'),
      M: range(0.5, 2, 0.5, 'kg'),
    },
    valid: ($) => $.mb < $.M,
    derive: ($) => ({ V: ($.mb * $.vb) / ($.mb + $.M) }),
    text: (T, $, sig) => ($.find === 'bullet'
      ? String.raw`A ${T.mb} kg bullet embeds in a ${T.M} kg block at rest on smooth ice. Just after, the block and bullet move together at ${sig($.V)} m/s. Find ${T.find}.`
      : String.raw`A ${T.mb} kg bullet moving at ${T.vb} m/s embeds in a ${T.M} kg block at rest on smooth ice. Find ${T.find}.`),
    parts: [
      num('v', ($) => ($.find === 'bullet' ? ($.V * ($.mb + $.M)) / $.mb : collide1D($.mb, $.M, $.vb, 0, 0).v1), 'm/s', {
        label: (T, $) => ($.find === 'bullet' ? 'bullet speed' : 'shared speed'),
      }),
    ],
    level: 2,
    hints: ['An embedded bullet is a perfectly inelastic collision. Momentum is conserved, and the two masses leave together.',
      'The momentum before is the bullet’s alone. After, the bullet and block share one speed, so the moving mass is their sum.',
    ],
    steps: ($, sig) => ($.find === 'bullet'
      ? [
        String.raw`$m_b v_b = (m_b + M) V$.`,
        String.raw`$v_b = (m_b + M)V/m_b = ${sig(($.V * ($.mb + $.M)) / $.mb)}\ \mathrm{m/s}$.`,
      ]
      : [
        String.raw`$m_b v_b = (m_b + M) v$.`,
        String.raw`The shared speed is ${sig($.V)} m/s.`,
      ]),
    second: ($) => ({ v: $.find === 'bullet' ? momentum($.mb + $.M, $.V) / $.mb : collide1D($.mb, $.M, $.vb, 0, 0).v1 }),
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
      read: (c, s, $) => ({ v: $.find === 'bullet' ? (c.vn1 * ($.mb + $.M)) / $.mb : c.vn1 }),
    },
    cases: [
      kase('Hibbeler §15.4', { find: 'shared', mb: 0.05, vb: 400, M: 1.95 }, { v: 10 }),
      kase('Hibbeler §15.4', { find: 'bullet', mb: 0.1, vb: 300, M: 1.9 }, { v: 300 }),
    ],
  }),

  problem({
    id: 'u4.15.central',
    title: 'Central impact',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact'],
    // How they meet is the structure: B at rest, B overtaken, or B coming the other way.
    vars: {
      meet: choice(['rest', 'B is at rest'], ['chase', 'B moves the same way, more slowly'], ['headon', 'B comes the other way']),
      m1: range(1, 4, 0.5, 'kg'),
      m2: range(1, 4, 0.5, 'kg'),
      u1: range(3, 8, 0.5, 'm/s'),
      w: range(0.5, 2, 0.5, 'm/s'),
      e: range(0, 0.9, 0.1, ''),
    },
    derive: ($) => ({ u2: { rest: 0, chase: $.w, headon: -$.w }[$.meet] }),
    text: (T, $, sig) => String.raw`Body A, ${T.m1} kg, moves at ${T.u1} m/s along a line toward body B, ${T.m2} kg. ${T.meet}${$.meet === 'rest' ? '' : String.raw`, at ${T.w} m/s`}. The coefficient of restitution is ${T.e}. Take A's direction as positive. Find both velocities after the impact.`,
    parts: [
      num('v1', ($) => collide1D($.m1, $.m2, $.u1, $.u2, $.e).v1, 'm/s', { label: 'velocity of A' }),
      num('v2', ($) => collide1D($.m1, $.m2, $.u1, $.u2, $.e).v2, 'm/s', { label: 'velocity of B' }),
    ],
    level: 2,
    hints: ['Write conservation of momentum and the restitution equation. Solve that pair.',
      "Take the line as positive in the incoming direction of the first mass. A negative result is a rebound.",
    ],
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
    cases: [
      kase('Hibbeler §15.4', { meet: 'rest', m1: 1, m2: 1, u1: 4, w: 1, e: 0.5 }, { v1: 1, v2: 3 }),
      kase('Hibbeler §15.4', { meet: 'headon', m1: 2, m2: 1, u1: 3, w: 1, e: 0.8 }, { v1: 0.6, v2: 3.8 }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 1, Problem 6', { meet: 'headon', m1: 1000, m2: 2000, u1: 25, w: 25, e: 0 }, { v1: -8.333, v2: -8.333 }, { note: 'Two cars meet head-on and stick together, so e = 0. The printed kinetic energy lost is 833,333 J.' }),
    ],
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
      target: choice(['rest', 'is at rest'], ['moving', 'moves toward it along that line']),
      m1: range(1, 4, 0.5, 'kg'),
      m2: range(1, 4, 0.5, 'kg'),
      u1: range(2, 8, 0.5, 'm/s'),
      w: range(0.5, 2, 0.5, 'm/s'),
      e: range(0, 1, 0.1, ''),
      theta: range(15, 60, 5, 'deg'),
    },
    derive: ($) => ({ u2: $.target === 'rest' ? 0 : -$.w }),
    text: (T, $) => String.raw`A ${T.m1} kg disk approaches at ${T.u1} m/s, ${T.theta}° from the line of impact. A ${T.m2} kg disk ${T.target}${$.target === 'rest' ? '' : String.raw` at ${T.w} m/s`}. Both are smooth. $e = ${T.e}$. Take the first disk's normal direction as positive. Find the two normal velocities and the tangent speed of the first disk.`,
    parts: [
      num('vn1', ($) => oblique($).vn1, 'm/s', { label: 'normal speed of the first body' }),
      num('vn2', ($) => oblique($).vn2, 'm/s', { label: 'normal speed of the second body' }),
      num('vt', ($) => oblique($).vt1, 'm/s', { label: 'tangent speed of the first body' }),
    ],
    level: 3,
    hints: ['Split the incoming velocity into a normal part and a tangent part. The tangent part is unchanged.',
      "The normal part of the first body is u cos theta. Apply momentum and restitution to the normal parts only.",
      "The tangent speed is u sin theta. Do not multiply that part by e.",
    ],
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
    cases: [kase('Hibbeler §15.4', { target: 'rest', m1: 2, m2: 2, u1: 4, w: 1, e: 1, theta: 30 }, { vn1: 0, vn2: 3.464101615137755, vt: 2 })],
  }),

  problem({
    id: 'u4.15.angular',
    title: 'Angular momentum about a point',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.5',
    topics: ['angular'],
    // The reference point is the structure: the origin, or another point P.
    vars: {
      about: choice(['origin', 'the origin'], ['point', 'the point P']),
      m: range(0.5, 4, 0.5, 'kg'),
      x: range(-2, 2, 0.5, 'm'),
      y: range(-2, 2, 0.5, 'm'),
      vx: range(-4, 4, 1, 'm/s'),
      vy: range(-4, 4, 1, 'm/s'),
      px: range(-1, 1, 0.5, 'm'),
      py: range(-1, 1, 0.5, 'm'),
    },
    derive: ($) => (($.about === 'origin') ? { ax: 0, ay: 0 } : { ax: $.px, ay: $.py }),
    valid: ($) => {
      const ax = $.about === 'origin' ? 0 : $.px;
      const ay = $.about === 'origin' ? 0 : $.py;
      const L = ($.x - ax) * $.vy - ($.y - ay) * $.vx;
      const L0 = $.x * $.vy - $.y * $.vx;
      return Math.abs(L) >= 0.5 && ($.about === 'origin' || Math.abs(L - L0) >= 0.1 * Math.abs(L)) && Math.abs($.x * $.vx + $.y * $.vy) > 0;
    },
    text: (T, $) => String.raw`A ${T.m} kg particle is at $(${T.x}, ${T.y})$ m with velocity $(${T.vx}, ${T.vy})$ m/s.${$.about === 'point' ? String.raw` P is at $(${T.px}, ${T.py})$ m.` : ''} Find its angular momentum about ${T.about}, counterclockwise positive.`,
    parts: [
      num('L', ($) => particleAngularMomentum($.m, v($.x - $.ax, $.y - $.ay, 0), v($.vx, $.vy, 0)).z, 'kg·m²/s', { label: 'angular momentum' }),
    ],
    level: 2,
    hints: [String.raw`Angular momentum is the moment of the momentum: $\vec r \times m\vec v$, with $\vec r$ from the reference point to the particle.`,
      String.raw`In the plane, $L_z = m(r_x v_y - r_y v_x)$. Keep every sign.`,
    ],
    steps: ($, sig) => [
      ...($.about === 'point' ? [String.raw`From P: $\vec r = (${sig($.x - $.ax)}, ${sig($.y - $.ay)})$ m.`] : []),
      String.raw`$L_z = m(r_x v_y - r_y v_x)$.`,
      String.raw`$L_z = ${sig($.m * (($.x - $.ax) * $.vy - ($.y - $.ay) * $.vx))}\ \mathrm{kg\cdot m^2/s}$.`,
    ],
    // Second: the momentum's size times its perpendicular distance from the point, with the turning sense.
    second: ($) => {
      const rx = $.x - $.ax;
      const ry = $.y - $.ay;
      const sp = Math.hypot($.vx, $.vy);
      const d = Math.abs(rx * $.vy - ry * $.vx) / sp;
      return { L: Math.sign(rx * $.vy - ry * $.vx) * $.m * sp * d };
    },
    cases: [
      kase('Hibbeler §15.5', { about: 'origin', m: 2, x: 0.4, y: -0.3, vx: 1, vy: 3, px: 0, py: 0 }, { L: 3 }),
      kase('Hibbeler §15.5', { about: 'point', m: 2, x: 1.5, y: 1, vx: 2, vy: -1, px: 0.5, py: -1 }, { L: -10 }),
    ],
  }),

  problem({
    id: 'u4.15.rocket',
    title: 'Rocket in gravity',
    exam: 'u4',
    ch: '15',
    lab: 'rocket',
    src: 'Hibbeler §15.9',
    topics: ['rocket'],
    // Where it burns is the structure: straight up against g, or in free space.
    vars: {
      where: choice(['up', 'straight up from the ground, against gravity'], ['space', 'in free space, far from any planet']),
      m0: range(150, 400, 10, 'kg'),
      mf: range(40, 120, 10, 'kg'),
      ve: range(800, 2500, 50, 'm/s'),
      mdot: range(10, 60, 5, 'kg/s'),
    },
    // Designed so the gravity loss is at least 3% of the ideal Δv: big enough to see, and to grade.
    valid: ($) => $.mf > 0 && $.mdot > 0 && $.mf < $.m0 * 0.9 && $.ve * $.mdot > 1.5 * $.m0 * G
      && G * (($.m0 - $.mf) / $.mdot) >= 0.03 * $.ve * Math.log($.m0 / $.mf),
    derive: ($) => ({ g: $.where === 'up' ? G : 0 }),
    text: (T, $) => String.raw`A rocket burns ${T.where}, from ${T.m0} kg to ${T.mf} kg. The exhaust speed is ${T.ve} m/s and the burn rate is ${T.mdot} kg/s.${$.where === 'up' ? ' $g = 9.81$ m/s².' : ''} Ignore drag. Find $\Delta v$.`,
    parts: [
      num('dv', ($) => rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: $.g }).dv, 'm/s', { label: 'change in speed' }),
    ],
    level: 2,
    hints: ['The speed gain is the exhaust speed times the log of the mass ratio, minus g times the burn time.',
      "The burn time is the burned mass divided by the burn rate. Subtract g times that time from the logarithm term.",
    ],
    steps: ($, sig) => {
      const row = rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: $.g });
      return [
        String.raw`Burn time: $t_b = (m_0 - m_f)/\dot m = ${sig(row.tb)}\ \mathrm{s}$.`,
        $.g > 0
          ? String.raw`$\Delta v = v_e\ln(m_0/m_f) - g t_b = ${sig(row.dv)}\ \mathrm{m/s}$.`
          : String.raw`No gravity: $\Delta v = v_e\ln(m_0/m_f) = ${sig(row.dv)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => ({ dv: burn($, $.g) }),
    sim: {
      scenario: 'gravity',
      setup(s, $) {
        s.m0 = $.m0;
        s.mf = $.mf;
        s.ve = $.ve;
        s.mdot = $.mdot;
        s.g = $.g;
      },
      read: (c) => ({ dv: c.dv }),
    },
    cases: [
      kase('Hibbeler §15.9', { where: 'up', m0: 200, mf: 80, ve: 1500, mdot: 10 }, { dv: 1256.7160978112327 }),
      kase('Hibbeler §15.9', { where: 'space', m0: 200, mf: 80, ve: 1500, mdot: 10 }, { dv: 1374.4360978112326 }),
    ],
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
      where: choice(['up', 'straight up from the ground, against gravity'], ['space', 'in free space, far from any planet']),
      m0: range(8, 20, 1, 'slug'),
      mf: range(2, 6, 0.5, 'slug'),
      ve: range(2000, 6000, 200, 'ft/s'),
      mdot: range(1, 4, 0.5, 'slug/s'),
    },
    valid: ($) => $.mf > 0 && $.mdot > 0 && $.mf < $.m0 * 0.9 && $.ve * $.mdot > 1.5 * $.m0 * G_FT,
    derive: ($) => ({ g: $.where === 'up' ? G_FT : 0 }),
    text: (T, $) => String.raw`A rocket burns ${T.where}, from ${T.m0} slugs to ${T.mf} slugs. The exhaust speed is ${T.ve} ft/s and the burn rate is ${T.mdot} slug/s.${$.where === 'up' ? ' $g = 32.2$ ft/s².' : ''} Ignore drag. Find $\Delta v$.`,
    parts: [
      num('dv', ($) => rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: $.g }).dv, 'ft/s', { label: 'change in speed' }),
    ],
    level: 2,
    hints: ['The equation is the same in US customary units. The mass is in slugs, and g is 32.2 ft/s².',
      "The burned mass is m0 minus mf. Divide by the burn rate, then subtract g times the burn time from ve times the log of the mass ratio.",
    ],
    steps: ($, sig) => {
      const row = rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: $.g });
      return [
        String.raw`Burn time: $(m_0 - m_f)/\dot m = ${sig(row.tb)}\ \mathrm{s}$.`,
        $.g > 0
          ? String.raw`$\Delta v = v_e\ln(m_0/m_f) - g t_b = ${sig(row.dv)}\ \mathrm{ft/s}$.`
          : String.raw`No gravity: $\Delta v = v_e\ln(m_0/m_f) = ${sig(row.dv)}\ \mathrm{ft/s}$.`,
      ];
    },
    second: ($) => ({ dv: burn($, $.g) }),
    cases: [kase('Hibbeler §15.9', { where: 'up', m0: 10, mf: 4, ve: 4000, mdot: 2 }, { dv: 3568.5629274966204 })],
  }),
];

export default ch15;
