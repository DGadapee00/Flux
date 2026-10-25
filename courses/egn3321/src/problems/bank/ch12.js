import { projectile } from '@flux/subjects/mechanics/kinematics.js';
import {
  integrateAbsSpeed,
  integratePieces,
  normalTangential,
  normalTangentialOf,
  relativeNumeric,
  rk4Pieces,
} from '@flux/subjects/mechanics/path.js';
import { G, choice, kase, mc, num, problem, range, sym } from '../kit.js';

function polyAt($) {
  const t = $.t;
  return {
    s: $.s0 + $.v0 * t + 0.5 * $.a * t * t + ($.j * t * t * t) / 6,
    v: $.v0 + $.a * t + 0.5 * $.j * t * t,
    a: $.a + $.j * t,
  };
}

function simpson(f, a, b, n = 200) {
  const steps = n % 2 ? n + 1 : n;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Speed at s for a = ks (grows) or a = −kv (fades linearly with distance). */
function separated($) {
  return $.law === 'ks' ? Math.sqrt($.v0 ** 2 + $.k * $.s ** 2) : $.v0 - $.k * $.s;
}

function trip($) {
  const tStop = -$.v0 / $.a;
  const sAt = (t) => $.v0 * t + 0.5 * $.a * t * t;
  return {
    s: sAt($.t),
    v: $.v0 + $.a * $.t,
    dist: Math.abs(sAt(tStop)) + Math.abs(sAt($.t) - sAt(tStop)),
  };
}

function erratic($) {
  let s = 0;
  let v = $.v0;
  for (const [a, dt] of [[$.a1, $.dt1], [$.a2, $.dt2], [$.a3, $.dt3]]) {
    s += v * dt + 0.5 * a * dt * dt;
    v += a * dt;
  }
  return { s, v };
}

function flightOf($) {
  return projectile({ v0: $.v0, thetaDeg: $.theta, g: G, y0: $.y0 ?? 0, yLand: 0 });
}

/** The path's slope and curvature at x: a parabola y = ½cx², or a sine wave y = c sin x. */
const slopes = ($) => ($.shape === 'sine' ? { yp: $.c * Math.cos($.x), ypp: -$.c * Math.sin($.x) } : { yp: $.c * $.x, ypp: $.c });
const pathY = ($) => ($.shape === 'sine' ? (x) => $.c * Math.sin(x) : (x) => 0.5 * $.c * x * x);

function curveOf($) {
  return normalTangential({ ...slopes($), speed: $.speed, at: $.at });
}

const ch12 = [
  problem({
    id: 'u1.12.polynomial',
    title: 'Polynomial position',
    exam: 'u1',
    ch: '12',
    lab: 'rectilinear',
    src: 'Hibbeler §12.2',
    topics: ['rectilinear'],
    vars: {
      s0: range(-4, 4, 1, 'm'),
      v0: range(-6, 6, 1, 'm/s'),
      a: range(-4, 4, 0.5, 'm/s²'),
      j: range(-2, 2, 0.5, 'm/s³'),
      t: range(1, 5, 0.5, 's'),
    },
    text: (T) => String.raw`A particle's position, in metres with $t$ in seconds, is $s = ${T.s0} + (${T.v0})t + \frac{1}{2}(${T.a})t^2 + \frac{1}{6}(${T.j})t^3$. Find $s$, $v$ and $a$ at $t = ${T.t}\ \mathrm{s}$, and the formula for $v(t)$.`,
    parts: [
      num('s', ($) => polyAt($).s, 'm', { label: 'position' }),
      num('v', ($) => polyAt($).v, 'm/s', { label: 'velocity' }),
      num('a', ($) => polyAt($).a, 'm/s²', { label: 'acceleration' }),
      sym('vsym', 'v0 + a*t + (1/2)*j*t^2', { v0: 'm/s', a: 'm/s^2', j: 'm/s^3', t: 's' }, ($) => polyAt($).v, {
        unit: 'm/s',
        label: 'v(t) as a formula',
      }),
    ],
    level: 1,
    hints: ['Differentiate s once for v, and again for a. The jerk is the coefficient of t in a.',
      "Leave v(t) as that derivative, in symbols. The numbers for s, v, and a are those formulas at the given t.",
    ],
    steps: ($, sig) => {
      const row = polyAt($);
      return [
        String.raw`$v = ${sig($.v0)} + (${sig($.a)})t + \frac{1}{2}(${sig($.j)})t^2$.`,
        String.raw`$a = ${sig($.a)} + (${sig($.j)})t$.`,
        String.raw`At $t = ${sig($.t)}\ \mathrm{s}$: $s = ${sig(row.s)}\ \mathrm{m}$, $v = ${sig(row.v)}\ \mathrm{m/s}$, $a = ${sig(row.a)}\ \mathrm{m/s^2}$.`,
      ];
    },
    second: ($) => {
      const pieces = [{ t0: 0, t1: $.t, coeff: [$.a, $.j] }];
      const end = integratePieces(pieces, $.s0, $.v0)($.t);
      const rk = rk4Pieces(pieces, $.s0, $.v0, $.t, 32);
      return { s: rk.s, v: end.v, a: end.a };
    },
    sim: {
      scenario: 'ramp',
      setup(s, $) {
        s.s0 = $.s0;
        s.v0 = $.v0;
        s.pieces = [{ t0: 0, t1: $.t, coeff: [$.a, $.j] }];
        s.t = $.t;
        s.tEnd = $.t;
      },
      read: (c) => ({ s: c.s, v: c.v, a: c.a }),
    },
    cases: [kase('Hibbeler §12.2', { s0: 0, v0: 2, a: 3, j: 1, t: 2 }, { s: 11.333333333333334, v: 10, a: 5, vsym: 'v0 + a*t + (1/2)*j*t^2' })],
  }),

  problem({
    id: 'u1.12.separate',
    title: 'Acceleration proportional to position',
    exam: 'u1',
    ch: '12',
    lab: null,
    src: 'Hibbeler §12.2',
    topics: ['separation'],
    vars: {
      v0: range(1, 8, 0.5, 'm/s'),
      k: range(0.5, 4, 0.5, '1/s²'),
      s: range(1, 6, 0.5, 'm'),
      law: choice(['ks', 'a = ks'], ['kv', 'a = −kv']),
    },
    // A drag-like law slows the particle to rest at s = v0/k; keep the point asked before that.
    valid: ($) => $.law === 'ks' || $.s < 0.85 * ($.v0 / $.k),
    text: (T, $) => ($.law === 'ks'
      ? String.raw`A particle has $a = ks$ with $k = ${T.k}\ \mathrm{s^{-2}}$. It passes $s = 0$ at $v_0 = ${T.v0}\ \mathrm{m/s}$. Find the speed at $s = ${T.s}\ \mathrm{m}$.`
      : String.raw`A particle slowed by a resistance has $a = -kv$ with $k = ${T.k}\ \mathrm{s^{-1}}$. It passes $s = 0$ at $v_0 = ${T.v0}\ \mathrm{m/s}$. Find the speed at $s = ${T.s}\ \mathrm{m}$.`),
    parts: [
      num('v', ($) => separated($), 'm/s', { label: 'speed' }),
    ],
    level: 2,
    hints: ['The acceleration is given in terms of position or speed, not time. Which kinematic relation has no t in it?',
      String.raw`Use $v\,dv = a\,ds$ and separate the variables, then integrate from $s = 0$, where $v = v_0$.`,
    ],
    steps: ($, sig) => ($.law === 'ks'
      ? [
        String.raw`$\int_{v_0}^{v} v\,dv = \int_0^{s} ks\,ds$, so $v^2 = v_0^2 + ks^2$.`,
        String.raw`$v = ${sig(separated($))}\ \mathrm{m/s}$.`,
      ]
      : [
        String.raw`$v\,dv = -kv\,ds$, so $dv = -k\,ds$ and $v = v_0 - ks$.`,
        String.raw`$v = ${sig($.v0)} - ${sig($.k)}(${sig($.s)}) = ${sig(separated($))}\ \mathrm{m/s}$.`,
      ]),
    // Second: step v dv = a ds forward in s numerically (Runge–Kutta on dv/ds = a/v).
    second: ($) => {
      const acc = (s, v) => ($.law === 'ks' ? $.k * s : -$.k * v);
      const n = 400;
      const h = $.s / n;
      let v = $.v0;
      for (let i = 0; i < n; i++) {
        const s0 = i * h;
        const f = (s1, v1) => acc(s1, v1) / v1;
        const k1 = f(s0, v);
        const k2 = f(s0 + h / 2, v + (h / 2) * k1);
        const k3 = f(s0 + h / 2, v + (h / 2) * k2);
        const k4 = f(s0 + h, v + h * k3);
        v += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      }
      return { v };
    },
    cases: [
      kase('Hibbeler §12.2', { v0: 3, k: 2, s: 4, law: 'ks' }, { v: Math.sqrt(41) }),
      kase('Hibbeler §12.2', { v0: 6, k: 1, s: 2, law: 'kv' }, { v: 4 }),
    ],
  }),

  problem({
    id: 'u1.12.distance',
    title: 'Distance past a stop',
    exam: 'u1',
    ch: '12',
    lab: 'rectilinear',
    src: 'Hibbeler §12.2',
    topics: ['distance'],
    vars: {
      sp: range(3, 6, 1, 'm/s'),
      acc: range(1, 2.5, 0.5, 'm/s²'),
      t: range(3, 12, 0.5, 's'),
      way: choice(['brake', 'moving forward and braking'], ['back', 'moving backward, pushed forward']),
    },
    // Both set-ups turn round once: the speed and the push point opposite ways.
    derive: ($) => ($.way === 'brake' ? { v0: $.sp, a: -$.acc } : { v0: -$.sp, a: $.acc }),
    valid: ($) => $.t > $.sp / $.acc + 0.4,
    text: (T, $, sig) => String.raw`A particle starts from the origin ${T.way}: $v_0 = ${sig($.v0)}\ \mathrm{m/s}$ and constant $a = ${sig($.a)}\ \mathrm{m/s^2}$. Find $s$, $v$ and the distance travelled at $t = ${T.t}\ \mathrm{s}$.`,
    parts: [
      num('s', ($) => trip($).s, 'm', { label: 'displacement' }),
      num('v', ($) => trip($).v, 'm/s', { label: 'velocity' }),
      num('dist', ($) => trip($).dist, 'm', { label: 'distance' }),
    ],
    level: 2,
    hints: ['The particle turns round once. Distance and displacement part company there.',
      "Locate the stop from v0 + a t = 0. Each leg is the absolute change in s on that side of the stop; add the two.",
    ],
    steps: ($, sig) => {
      const row = trip($);
      const tStop = -$.v0 / $.a;
      return [
        String.raw`The velocity is zero at $t = ${sig(tStop)}\ \mathrm{s}$.`,
        String.raw`Displacement $s = ${sig(row.s)}\ \mathrm{m}$. Distance travelled $ = ${sig(row.dist)}\ \mathrm{m}$.`,
        String.raw`Velocity at the end: $v = ${sig(row.v)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => {
      const pieces = [{ t0: 0, t1: $.t, coeff: [$.a] }];
      const motion = integratePieces(pieces, 0, $.v0);
      return {
        s: motion($.t).s,
        v: motion($.t).v,
        dist: integrateAbsSpeed((t) => motion(t).v, 0, $.t, 2000),
      };
    },
    sim: {
      scenario: 'brake',
      setup(s, $) {
        s.s0 = 0;
        s.v0 = $.v0;
        s.pieces = [{ t0: 0, t1: $.t, coeff: [$.a] }];
        s.t = $.t;
        s.tEnd = $.t;
      },
      read: (c) => ({ s: c.s, v: c.v, dist: c.distance }),
    },
    cases: [
      kase('Hibbeler §12.2', { sp: 6, acc: 2, t: 5, way: 'brake' }, { s: 5, v: -4, dist: 13 }),
      kase('Hibbeler §12.2', { sp: 4, acc: 2, t: 4, way: 'back' }, { s: 0, v: 4, dist: 8 }),
    ],
  }),

  problem({
    id: 'u1.12.erratic',
    title: 'Three steps on the a–t graph',
    exam: 'u1',
    ch: '12',
    lab: 'rectilinear',
    src: 'Hibbeler §12.3',
    topics: ['erratic'],
    vars: {
      v0: range(0, 4, 1, 'm/s'),
      a1: range(-3, 4, 0.5, 'm/s²'),
      dt1: range(1, 3, 0.5, 's'),
      a2: range(-3, 3, 0.5, 'm/s²'),
      dt2: range(1, 3, 0.5, 's'),
      a3: range(-2, 2, 0.5, 'm/s²'),
      dt3: range(1, 3, 0.5, 's'),
    },
    text: (T) => String.raw`The a–t graph is three steps: $${T.a1}\ \mathrm{m/s^2}$ for $${T.dt1}\ \mathrm{s}$, then $${T.a2}$ for $${T.dt2}\ \mathrm{s}$, then $${T.a3}$ for $${T.dt3}\ \mathrm{s}$. $v_0 = ${T.v0}\ \mathrm{m/s}$ and $s_0 = 0$. Find $s$ and $v$ at the end.`,
    parts: [
      num('s', ($) => erratic($).s, 'm', { label: 'position' }),
      num('v', ($) => erratic($).v, 'm/s', { label: 'velocity' }),
    ],
    level: 2,
    hints: ['The area under each a–t step is that step’s Δv. Then step s forward with the average velocity on the step.',
      "The average velocity on a step is the mean of the velocities at its two ends. Multiply by the duration, then add the steps.",
    ],
    steps: ($, sig) => {
      const row = erratic($);
      return [
        String.raw`Add $a\,\Delta t$ on each step to update $v$.`,
        String.raw`At the end, $s = ${sig(row.s)}\ \mathrm{m}$ and $v = ${sig(row.v)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => {
      let t = 0;
      const pieces = [];
      for (const [a, dt] of [[$.a1, $.dt1], [$.a2, $.dt2], [$.a3, $.dt3]]) {
        pieces.push({ t0: t, t1: t + dt, coeff: [a] });
        t += dt;
      }
      const end = integratePieces(pieces, 0, $.v0)(t);
      return { s: end.s, v: end.v };
    },
    sim: {
      scenario: 'two',
      setup(s, $) {
        let t = 0;
        s.s0 = 0;
        s.v0 = $.v0;
        s.pieces = [[$.a1, $.dt1], [$.a2, $.dt2], [$.a3, $.dt3]].map(([a, dt]) => {
          const piece = { t0: t, t1: t + dt, coeff: [a] };
          t += dt;
          return piece;
        });
        s.t = t;
        s.tEnd = t;
      },
      read: (c) => ({ s: c.s, v: c.v }),
    },
    cases: [kase('Hibbeler §12.3', { v0: 0, a1: 2, dt1: 3, a2: -1, dt2: 2, a3: 0, dt3: 1 }, { s: 23, v: 4 })],
  }),

  problem({
    id: 'u1.12.projectile',
    title: 'Level-ground projectile',
    exam: 'u1',
    ch: '12',
    lab: null,
    src: 'Hibbeler §12.6',
    topics: ['projectile'],
    vars: {
      v0: range(12, 36, 2, 'm/s'),
      theta: range(20, 70, 5, '°'),
      h0: range(10, 40, 5, 'm'),
      ground: choice(['level', 'from level ground'], ['cliff', 'from the top of a cliff']),
    },
    derive: ($) => ({ y0: $.ground === 'cliff' ? $.h0 : 0 }),
    text: (T, $) => ($.ground === 'cliff'
      ? String.raw`A particle is launched from the top of a cliff $${T.h0}\ \mathrm{m}$ high, at $${T.v0}\ \mathrm{m/s}$ and $${T.theta}^\circ$ above the horizontal, and lands on the level ground below. Take $g = 9.81\ \mathrm{m/s^2}$. Find the horizontal distance to the landing point, the greatest height above the ground, and the time of flight.`
      : String.raw`A particle is launched from level ground at $${T.v0}\ \mathrm{m/s}$ and $${T.theta}^\circ$ above the horizontal. Take $g = 9.81\ \mathrm{m/s^2}$. Find the range, the maximum height and the time of flight.`),
    parts: [
      num('range', ($) => flightOf($).range, 'm', { label: 'range' }),
      num('h', ($) => flightOf($).hMax, 'm', { label: 'maximum height' }),
      num('t', ($) => flightOf($).tFlight, 's', { label: 'time of flight' }),
    ],
    level: 2,
    hints: ['Resolve the launch velocity. The vertical motion has constant acceleration; the horizontal velocity stays constant.',
      String.raw`The time of flight comes from the vertical motion alone: solve $y_0 + v_yt - \tfrac12gt^2 = 0$. The range is $v_x$ times that time.`,
    ],
    steps: ($, sig) => {
      const row = flightOf($);
      const th = ($.theta * Math.PI) / 180;
      return [
        String.raw`$v_x = ${sig($.v0 * Math.cos(th))}\ \mathrm{m/s}$, $v_y = ${sig($.v0 * Math.sin(th))}\ \mathrm{m/s}$.`,
        String.raw`Landing: $${sig($.y0)} + ${sig($.v0 * Math.sin(th))}t - 4.905t^2 = 0$ gives $t = ${sig(row.tFlight)}\ \mathrm{s}$.`,
        String.raw`Range $${sig(row.range)}\ \mathrm{m}$. Greatest height $${sig($.y0)} + v_y^2/2g = ${sig(row.hMax)}\ \mathrm{m}$.`,
      ];
    },
    // Second: step the flight forward in time until it lands.
    second: ($) => {
      const th = ($.theta * Math.PI) / 180;
      let x = 0;
      let y = $.y0;
      let vy = $.v0 * Math.sin(th);
      const vx = $.v0 * Math.cos(th);
      let t = 0;
      let top = y;
      const dt = 1e-4;
      while (true) {
        const yNext = y + vy * dt - 0.5 * G * dt * dt;
        if (yNext < 0) {
          // Land inside the step: solve the small parabola for its root.
          const tau = (vy + Math.sqrt(vy * vy + 2 * G * y)) / G;
          return { range: x + vx * tau, h: top, t: t + tau };
        }
        y = yNext;
        vy -= G * dt;
        x += vx * dt;
        t += dt;
        top = Math.max(top, y);
      }
    },
    cases: [
      kase('Hibbeler §12.6', { v0: 20, theta: 30, h0: 10, ground: 'level' }, {
        range: 35.311943069701876,
        h: 5.096839959225279,
        t: 2.0387359836901116,
      }),
      kase('Hibbeler §12.6', { v0: 20, theta: 30, h0: 30, ground: 'cliff' }, {
        range: 63.987340132816705,
        h: 35.09683995922528,
        t: 3.6943108050409865,
      }),
    ],
  }),

  problem({
    id: 'u1.12.path',
    title: 'Radius of a parabola',
    exam: 'u1',
    ch: '12',
    lab: 'path-nt',
    src: 'Hibbeler §12.7',
    topics: ['normal-tangential'],
    vars: {
      c: range(0.4, 1.4, 0.1, '1/m'),
      x: range(0.4, 2.4, 0.1, 'm'),
      speed: range(1, 6, 0.5, 'm/s'),
      at: range(-2, 2, 0.5, 'm/s²'),
      shape: choice(['parabola', 'a parabola'], ['sine', 'a sine wave']),
    },
    // Keep away from a sine wave's inflection, where the radius runs off to infinity.
    valid: ($) => Math.abs(slopes($).ypp) > 0.15,
    text: (T, $) => ($.shape === 'sine'
      ? String.raw`A particle moves on the sine-wave path $y = c\sin x$ ($x$ and $y$ in metres) with $c = ${T.c}\ \mathrm{m}$, at $x = ${T.x}\ \mathrm{m}$. Its speed is $${T.speed}\ \mathrm{m/s}$ and $a_t = ${T.at}\ \mathrm{m/s^2}$. Find $\rho$, $a_n$ and the magnitude of the acceleration.`
      : String.raw`A particle moves on $y = \frac{1}{2} c x^2$ with $c = ${T.c}\ \mathrm{m^{-1}}$, at $x = ${T.x}\ \mathrm{m}$. Its speed is $${T.speed}\ \mathrm{m/s}$ and $a_t = ${T.at}\ \mathrm{m/s^2}$. Find $\rho$, $a_n$ and the magnitude of the acceleration.`),
    parts: [
      num('rho', ($) => curveOf($).rho, 'm', { label: 'radius of curvature' }),
      num('an', ($) => curveOf($).an, 'm/s²', { label: 'normal acceleration' }),
      num('mag', ($) => curveOf($).magA, 'm/s²', { label: 'acceleration magnitude' }),
    ],
    level: 3,
    hints: ['On a curve the acceleration has two parts: one along the path, one toward the centre of curvature. Which one needs the shape of the path?',
      String.raw`$\rho = (1+y'^2)^{3/2}/|y''|$, with both derivatives taken at the given $x$. Then $a_n = v^2/\rho$.`,
      "The magnitude is the root of the two components squared and added.",
    ],
    steps: ($, sig) => {
      const row = curveOf($);
      const d = slopes($);
      return [
        String.raw`$y' = ${sig(d.yp)}$ and $y'' = ${sig(d.ypp)}$, so $\rho = ${sig(row.rho)}\ \mathrm{m}$.`,
        String.raw`$a_n = ${sig(row.an)}\ \mathrm{m/s^2}$ and $|a| = ${sig(row.magA)}\ \mathrm{m/s^2}$.`,
      ];
    },
    second: ($) => {
      const num = normalTangentialOf(pathY($), $.x, $.speed, $.at);
      return { rho: num.rho, an: num.an, mag: num.magA };
    },
    sim: {
      scenario: 'parabola',
      setup(s, $) {
        s.shape = $.shape;
        s.c = $.c;
        s.x = $.x;
        s.speed = $.speed;
        s.at = $.at;
      },
      read: (c) => ({ rho: c.rho, an: c.an, mag: c.magA }),
    },
    cases: [kase('Hibbeler §12.7', { c: 1, x: 2, speed: 3, at: 0, shape: 'parabola' }, {
      rho: (1 + 4) ** 1.5,
      an: 9 / (1 + 4) ** 1.5,
      mag: 9 / (1 + 4) ** 1.5,
    }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 2, Problem 1a', { c: 0.8, x: 2, speed: 8, at: 4, shape: 'parabola' }, { rho: 8.4, an: 7.623, mag: 8.608 }, { note: 'The printed radius is rounded to 8.4 m. The unrounded value is 8.396 m, and the other two figures use it.' }),
    ],
  }),

  problem({
    id: 'u1.12.relative',
    title: 'Relative velocity of two particles',
    exam: 'u1',
    ch: '12',
    lab: 'relative',
    src: 'Hibbeler §12.10',
    topics: ['relative'],
    vars: {
      vax: range(-6, 6, 0.5, 'm/s'),
      vay: range(-6, 6, 0.5, 'm/s'),
      vbx: range(-6, 6, 0.5, 'm/s'),
      vby: range(-6, 6, 0.5, 'm/s'),
      aax: range(-3, 3, 0.5, 'm/s²'),
      aay: range(-3, 3, 0.5, 'm/s²'),
      abx: range(-3, 3, 0.5, 'm/s²'),
      aby: range(-3, 3, 0.5, 'm/s²'),
      given: choice(['xy', 'as components'], ['roads', 'as two cars on crossing roads']),
    },
    // On crossing roads A moves only along x and B only along y.
    derive: ($) => ($.given === 'roads' ? { vay: 0, aay: 0, vbx: 0, abx: 0 } : {}),
    valid: ($) => Math.hypot($.vbx - $.vax, $.vby - $.vay) > 0.5 && ($.given === 'xy' || ($.vax !== 0 && $.vby !== 0)),
    text: (T, $) => ($.given === 'roads'
      ? String.raw`Car A drives along an east–west road (east is $+x$) at $${T.vax}$ m/s, changing speed at $${T.aax}$ m/s². Car B drives along a north–south road (north is $+y$) at $${T.vby}$ m/s, changing speed at $${T.aby}$ m/s². Find the relative velocity and the relative acceleration of B with respect to A, in components.`
      : String.raw`Particle A has $\vec v_A = (${T.vax})\,\hat{\imath} + (${T.vay})\,\hat{\jmath}$ m/s and $\vec a_A = (${T.aax})\,\hat{\imath} + (${T.aay})\,\hat{\jmath}$ m/s². Particle B has $\vec v_B = (${T.vbx})\,\hat{\imath} + (${T.vby})\,\hat{\jmath}$ m/s and $\vec a_B = (${T.abx})\,\hat{\imath} + (${T.aby})\,\hat{\jmath}$ m/s². Find the relative velocity and the relative acceleration of B with respect to A.`),
    parts: [
      num('vx', ($) => $.vbx - $.vax, 'm/s', { label: 'v_B/A,x' }),
      num('vy', ($) => $.vby - $.vay, 'm/s', { label: 'v_B/A,y' }),
      num('speed', ($) => Math.hypot($.vbx - $.vax, $.vby - $.vay), 'm/s', { label: '|v_B/A|' }),
      num('ax', ($) => $.abx - $.aax, 'm/s²', { label: 'a_B/A,x' }),
      num('ay', ($) => $.aby - $.aay, 'm/s²', { label: 'a_B/A,y' }),
    ],
    level: 2,
    hints: ['Ride along with A, on axes that translate with it. What does B seem to do?',
      'Use translating axes on A: subtract A’s vectors from B’s. The positions are not needed.',
      "The relative speed is the magnitude of that vector difference. Subtracting the two speeds loses the direction.",
    ],
    steps: ($, sig) => {
      const vx = $.vbx - $.vax;
      const vy = $.vby - $.vay;
      return [
        String.raw`$v_{B/A,x} = ${sig(vx)}\ \mathrm{m/s}$, $v_{B/A,y} = ${sig(vy)}\ \mathrm{m/s}$.`,
        String.raw`$|v_{B/A}| = ${sig(Math.hypot(vx, vy))}\ \mathrm{m/s}$.`,
        String.raw`$a_{B/A,x} = ${sig($.abx - $.aax)}\ \mathrm{m/s^2}$, $a_{B/A,y} = ${sig($.aby - $.aay)}\ \mathrm{m/s^2}$.`,
      ];
    },
    second: ($) => {
      const rA = (t) => ({ x: $.vax * t + 0.5 * $.aax * t * t, y: $.vay * t + 0.5 * $.aay * t * t, z: 0 });
      const rB = (t) => ({ x: $.vbx * t + 0.5 * $.abx * t * t, y: $.vby * t + 0.5 * $.aby * t * t, z: 0 });
      const num = relativeNumeric(rA, rB, 0);
      return {
        vx: num.v.x,
        vy: num.v.y,
        speed: Math.hypot(num.v.x, num.v.y),
        ax: num.a.x,
        ay: num.a.y,
      };
    },
    sim: {
      scenario: 'cross',
      setup(s, $) {
        Object.assign(s, {
          vax: $.vax, vay: $.vay, vbx: $.vbx, vby: $.vby,
          aax: $.aax, aay: $.aay, abx: $.abx, aby: $.aby,
        });
      },
      read: (c) => ({ vx: c.vx, vy: c.vy, speed: c.speed, ax: c.ax, ay: c.ay }),
    },
    cases: [
      kase('Hibbeler §12.10', {
        vax: 3, vay: 1, vbx: 1, vby: 4, aax: 0, aay: -2, abx: 1, aby: -2, given: 'xy',
      }, {
        vx: -2, vy: 3, speed: Math.sqrt(13), ax: 1, ay: 0,
      }),
      kase('Hibbeler §12.10', {
        vax: 4, vay: 0, vbx: 0, vby: 3, aax: 1, aay: 0, abx: 0, aby: -2, given: 'roads',
      }, {
        vx: -4, vy: 3, speed: 5, ax: -1, ay: -2,
      }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 1, Problem 2', { vax: 10 * Math.SQRT2, vay: 10 * Math.SQRT2, vbx: 5 * Math.sqrt(3), vby: 5, aax: 0, aay: 0, abx: 0, aby: 0, given: 'xy' }, { vx: -5.482, vy: -9.142, speed: 10.66 }, { note: 'A is the ship at 20 m/s, 45° above the x axis; B is the smoke, carried at the wind velocity, 10 m/s at 30°. The printed answer is the vector (5√3 − 10√2, 5 − 10√2) m/s.' }),
    ],
  }),
];

export default ch12;
