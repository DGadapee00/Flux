/** Ch 4 · Motion in two and three dimensions. OpenStax University Physics Vol. 1, §§4.1–4.5. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  circularMotion, flight, headingForTrack, projectile, relativeVelocity, slopeLanding,
} from '@flux/subjects/mechanics/kinematics.js';
import { add, angle2D, fromAngle2D, mag, v } from '@flux/subjects/mechanics/vectors.js';
import { RAD_S_PER_RPM } from '@flux/subjects/convert.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u2', ch: '4' };
const DEG = Math.PI / 180;
const deg = (rad) => rad / DEG;

/** Bisect f on [lo, hi], where f changes sign once. */
function bisect(f, lo, hi, n = 200) {
  let a = lo;
  let b = hi;
  const fa = f(a);
  for (let i = 0; i < n; i += 1) {
    const m = 0.5 * (a + b);
    if (Math.sign(f(m)) === Math.sign(fa)) a = m;
    else b = m;
  }
  return 0.5 * (a + b);
}

/** A derivative by central differences with Richardson's step-halving. */
function deriv(f, t, h = 1e-3) {
  const d = (k) => (f(t + k * h) - f(t - k * h)) / (2 * k * h);
  return (4 * d(1) - d(2)) / 3;
}

/** The launch velocity of a level-ground template, from either representation. */
function launch($) {
  if ($.rep === 'parts') return { vx: $.vx, vy: $.vy, v0: Math.hypot($.vx, $.vy), theta: deg(Math.atan2($.vy, $.vx)) };
  return { vx: $.v0 * Math.cos($.theta * DEG), vy: $.v0 * Math.sin($.theta * DEG), v0: $.v0, theta: $.theta };
}

export default [
  problem({
    ...U,
    id: 'ch4.motion',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §4.1',
    title: 'Velocity and acceleration from a position vector',
    topics: ['position-vector', 'acceleration-vector'],
    vars: {
      A: range(0.5, 4, 0.5, 'm'),
      p: choice([2, 'grows as t²'], [3, 'grows as t³']),
      B: range(0, 5, 1, 'm'),
      C: range(0, 6, 1, 'm/s'),
      D: range(0, 6, 1, 'm/s'),
      t1: range(1, 4, 1, 's'),
    },
    derive: ($) => {
      const r = (t) => v($.A * t ** $.p, $.B + $.C * t, $.D * t);
      const vel = v($.p * $.A * $.t1 ** ($.p - 1), $.C, $.D);
      const acc = $.p * ($.p - 1) * $.A * $.t1 ** ($.p - 2);
      const a1 = r($.t1 + 1);
      const a0 = r($.t1 - 1);
      return {
        speed: mag(vel),
        acc: Math.abs(acc),
        avg: Math.hypot(a1.x - a0.x, a1.y - a0.y, a1.z - a0.z) / 2,
        rNow: mag(r($.t1)),
        vxy: Math.hypot(vel.x, vel.y),
      };
    },
    // Differentiate the position numerically instead of by the power rule.
    second: ($) => {
      const x = (t) => $.A * t ** $.p;
      const y = (t) => $.B + $.C * t;
      const z = (t) => $.D * t;
      const vx = deriv(x, $.t1);
      const ax = deriv((t) => deriv(x, t, 1e-4), $.t1, 1e-2);
      const mid = (f) => (f($.t1 + 1) - f($.t1 - 1)) / 2;
      return {
        speed: Math.hypot(vx, deriv(y, $.t1), deriv(z, $.t1)),
        acc: Math.abs(ax),
        avg: Math.hypot(mid(x), mid(y), mid(z)),
      };
    },
    text: (T, $) => String.raw`A particle's position is $\vec r(t) = ${T.A}t^{${$.p}}\,\hat\imath + (${T.B} + ${T.C}t)\,\hat\jmath + ${T.D}t\,\hat k$, in metres with $t$ in seconds. Find its speed and the size of its acceleration at $t = ${T.t1}$ s, and the size of its average velocity from $t = ${$.t1 - 1}$ s to $t = ${$.t1 + 1}$ s.`,
    parts: [
      num('speed', ($) => $.speed, 'm/s', { label: 'speed' }),
      num('acc', ($) => $.acc, 'm/s²', { label: 'size of the acceleration' }),
      num('avg', ($) => $.avg, 'm/s', { label: 'size of the average velocity' }),
    ],
    hints: [
      String.raw`Each component moves on its own. Differentiate each one: $\vec v = d\vec r/dt$ and $\vec a = d\vec v/dt$.`,
      String.raw`The average velocity is the displacement over the time: $(\vec r(t_2) - \vec r(t_1))/(t_2 - t_1)$. It equals the velocity at the middle instant only when the velocity changes linearly.`,
    ],
    steps: ($) => [
      String.raw`$\vec v(t) = ${$.p}(${texNum($.A)})t^{${$.p - 1}}\,\hat\imath + ${texNum($.C)}\,\hat\jmath + ${texNum($.D)}\,\hat k$, so $|\vec v| = ${texNum($.speed)}\ \mathrm{m/s}$`,
      String.raw`$\vec a$ has only an $x$ part, of size $${texNum($.acc)}\ \mathrm{m/s^2}$`,
      String.raw`$|\Delta\vec r|/\Delta t = ${texNum($.avg)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.1, "Calculating the Velocity Vector": r(t) = 2.0t² i + (2.0 + 3.0t) j + 5.0t k m at 2.0 s, average from 1.0 s to 3.0 s', { A: 2, p: 2, B: 2, C: 3, D: 5, t1: 2 }, { speed: 9.89949, acc: 4, avg: 9.89949 }, {
        note: 'The book prints 9.9 m/s, and an average velocity of (8.0, 3.0, 5.0) m/s equal to the velocity at 2.0 s, because that velocity is linear in t.',
      }),
      kase('OpenStax University Physics Vol. 1 §4.1, Check Your Understanding 4.1: r(t) = 3.0t³ i + 4.0 j at 3 s, average from 2 s to 4 s', { A: 3, p: 3, B: 4, C: 0, D: 0, t1: 3 }, { speed: 81, acc: 54, avg: 84 }, {
        note: 'The book prints 81.0 m/s and an average of 84 m/s. It labels the average 84 ĵ; the y position never changes, so it is 84 î.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.skier',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §4.2',
    title: 'Constant acceleration along a slope',
    topics: ['acceleration-vector'],
    vars: {
      a: range(0.5, 3, 0.1, 'm/s²'),
      phi: range(5, 30, 1, '°'),
      x0: range(0, 100, 5, 'm'),
      y0: range(-40, 0, 5, 'm'),
      v0: range(1, 8, 0.5, 'm/s'),
      t: range(2, 12, 1, 's'),
      mode: choice(['speed', 'speeding up'], ['slow', 'braking, so slowing down']),
    },
    derive: ($) => {
      const s = $.mode === 'speed' ? 1 : -1;
      const c = Math.cos($.phi * DEG);
      const n = Math.sin($.phi * DEG);
      const ax = s * $.a * c;
      const ay = -s * $.a * n;
      const vx = $.v0 * c + ax * $.t;
      const vy = -$.v0 * n + ay * $.t;
      return {
        x: $.x0 + $.v0 * c * $.t + 0.5 * ax * $.t ** 2,
        y: $.y0 - $.v0 * n * $.t + 0.5 * ay * $.t ** 2,
        vx,
        vy,
        v: Math.hypot(vx, vy),
        ax,
        ay,
      };
    },
    // Along the slope as one line: distance and speed in one dimension, then resolve.
    second: ($) => {
      const s = $.mode === 'speed' ? 1 : -1;
      const d = $.v0 * $.t + 0.5 * s * $.a * $.t ** 2;
      return { x: $.x0 + d * Math.cos($.phi * DEG), y: $.y0 - d * Math.sin($.phi * DEG), v: $.v0 + s * $.a * $.t };
    },
    valid: ($) => $.mode === 'speed' || $.v0 - $.a * $.t > 0.5,
    text: (T) => String.raw`A skier moves down a straight slope inclined at ${T.phi}° below the horizontal, ${T.mode} at ${T.a} m/s² along the slope. Take x horizontal (downhill positive) and y up. At t = 0 she is at (${T.x0} m, ${T.y0} m) with speed ${T.v0} m/s down the slope. Find her position and her speed at t = ${T.t} s.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: String.raw`$x$` }),
      num('y', ($) => $.y, 'm', { label: String.raw`$y$` }),
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
    ],
    hints: [
      'Resolve the acceleration and the initial velocity into x and y parts. Then each axis is a one-dimensional motion with constant acceleration.',
      String.raw`Down the slope, $a_x = a\cos\varphi$ and $a_y = -a\sin\varphi$. Braking reverses both.`,
    ],
    steps: ($) => [
      String.raw`$a_x = ${texNum($.ax)}\ \mathrm{m/s^2}$, $a_y = ${texNum($.ay)}\ \mathrm{m/s^2}$`,
      String.raw`$x = x_0 + v_{0x}t + \tfrac12 a_x t^2 = ${texNum($.x)}\ \mathrm{m}$, $y = ${texNum($.y)}\ \mathrm{m}$`,
      String.raw`$\vec v = (${texNum($.vx)}, ${texNum($.vy)})\ \mathrm{m/s}$, speed $${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.2, "A Skier": 2.1 m/s² down a 15° slope from (75.0, −20.0) m at (4.1, −1.1) m/s, after 10.0 s', { a: 2.1, phi: 15, x0: 75, y0: -20, v0: 4.245, t: 10, mode: 'speed' }, { x: 217.425, y: -58.163, v: 25.245 }, {
        note: 'The book rounds a_x to 2.0 m/s² and prints (216.0, −58.0) m and 25 m/s. Unrounded, a_x = 2.03 m/s², which adds 1.4 m to x.',
      }),
      kase('hand', { a: 2, phi: 30, x0: 0, y0: 0, v0: 6, t: 2, mode: 'slow' }, { x: 6.9282, y: -4, v: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.level',
    level: 1,
    variety: ['representation'],
    lab: 'projectile',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'Height, time and range on level ground',
    topics: ['projectile'],
    vars: {
      rep: choice(['angle', 'speed and angle'], ['parts', 'components']),
      v0: range(10, 40, 1, 'm/s'),
      theta: range(15, 75, 5, '°'),
      vx: range(5, 30, 1, 'm/s'),
      vy: range(5, 35, 1, 'm/s'),
    },
    derive: ($) => {
      const l = launch($);
      const shot = projectile({ v0: l.v0, thetaDeg: l.theta, g: G });
      return { ...l, h: shot.hMax, T: shot.tFlight, R: shot.range };
    },
    // The vertical motion alone gives the height and the time; the trajectory y(x) = 0 gives the range.
    second: ($) => {
      const { vx, vy } = launch($);
      return { h: (vy * vy) / (2 * G), T: (2 * vy) / G, R: (2 * vx * vy) / G };
    },
    text: (T, $) => ($.rep === 'parts'
      ? `A ball leaves level ground with velocity components ${T.vx} m/s horizontally and ${T.vy} m/s upward. Ignore air resistance and take g = ${G} m/s². Find its highest point, its time in the air, and its range.`
      : `A ball leaves level ground at ${T.v0} m/s, ${T.theta}° above the horizontal. Ignore air resistance and take g = ${G} m/s². Find its highest point, its time in the air, and its range.`),
    parts: [
      num('h', ($) => $.h, 'm', { label: 'highest point' }),
      num('T', ($) => $.T, 's', { label: 'time in the air' }),
      num('R', ($) => $.R, 'm', { label: 'range' }),
    ],
    hints: [
      'Split the launch into a horizontal part, which never changes, and a vertical part, which is a toss straight up.',
      String.raw`At the top $v_y = 0$, so $h = v_{0y}^2/(2g)$. On level ground the flight is twice the climb, and the range is $v_{0x}$ times the flight.`,
    ],
    steps: ($) => [
      String.raw`$v_{0x} = ${texNum($.vx)}\ \mathrm{m/s}$, $v_{0y} = ${texNum($.vy)}\ \mathrm{m/s}$`,
      String.raw`$h = v_{0y}^2/(2g) = ${texNum($.h)}\ \mathrm{m}$, $T = 2v_{0y}/g = ${texNum($.T)}\ \mathrm{s}$`,
      String.raw`$R = v_{0x}T = ${texNum($.R)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        s.v0 = $.v0;
        s.theta = $.theta;
        s.y0 = 0;
        s.yLand = 0;
        s.slope = 0;
      },
      read: (c) => ({ h: c.hMax, T: c.tFlight, R: c.range }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "A Fireworks Projectile Explodes High and Away": 70.0 m/s at 75.0°', { rep: 'angle', v0: 70, theta: 75, vx: 10, vy: 10 }, { h: 233.02, T: 13.785, R: 249.75 }, {
        note: 'The book uses g = 9.80 m/s² and prints 233 m at the top, reached after 6.90 s and 125 m downrange; on level ground the flight is twice that, 13.8 s and 250 m.',
      }),
      kase('hand', { rep: 'parts', v0: 10, theta: 30, vx: 12, vy: 14.715 }, { h: 11.036, T: 3, R: 36 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.golf',
    level: 2,
    variety: ['unknown', 'configuration'],
    lab: 'projectile',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'The launch speed for a given range',
    topics: ['projectile'],
    vars: {
      R: range(60, 180, 10, 'm'),
      shot: choice(['low', 'a low shot'], ['high', 'a high shot']),
      lo: range(15, 40, 5, '°'),
      hi: range(50, 75, 5, '°'),
    },
    derive: ($) => {
      const theta = $.shot === 'low' ? $.lo : $.hi;
      return { theta, v0: Math.sqrt(($.R * G) / Math.sin(2 * theta * DEG)), other: 90 - theta };
    },
    // Search for the speed that lands at R, then for the other angle that lands there at that speed.
    second: ($) => {
      const theta = $.shot === 'low' ? $.lo : $.hi;
      const reach = (v0, th) => projectile({ v0, thetaDeg: th, g: G }).range;
      const v0 = bisect((s) => reach(s, theta) - $.R, 1, 500);
      const other = theta < 45 ? bisect((th) => reach(v0, th) - $.R, 45, 89.9) : bisect((th) => reach(v0, th) - $.R, 0.1, 45);
      return { v0, other };
    },
    text: (T, $) => `A golfer wants ${T.shot} to carry ${T.R} m on level ground, launched at ${$.theta}° above the horizontal. Ignore air resistance and take g = ${G} m/s². What launch speed does it need? At that speed, what other launch angle carries the ball the same distance?`,
    parts: [
      num('v0', ($) => $.v0, 'm/s', { label: 'launch speed' }),
      num('other', ($) => $.other, '°', { label: 'the other angle', abs: 0.05 }),
    ],
    hints: [
      String.raw`On level ground the range is $R = v_0^2\sin 2\theta/g$. Here $R$ and $\theta$ are known.`,
      String.raw`$\sin 2\theta$ takes the same value at $2\theta$ and at $180^\circ - 2\theta$.`,
    ],
    steps: ($) => [
      String.raw`$v_0 = \sqrt{Rg/\sin 2\theta} = ${texNum($.v0)}\ \mathrm{m/s}$`,
      String.raw`$\sin 2\theta = \sin(180^\circ - 2\theta)$, so the other angle is $90^\circ - \theta = ${texNum($.other)}^\circ$`,
    ],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        s.v0 = Number($.v0.toFixed(2));
        s.theta = $.theta;
        s.y0 = 0;
        s.yLand = 0;
        s.slope = 0;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "Comparing Golf Shots" (a): 90.0 m at 30°', { R: 90, shot: 'low', lo: 30, hi: 70 }, { v0: 31.928, other: 60 }, {
        note: 'The book prints 31.9 m/s with g = 9.8 m/s².',
      }),
      kase('OpenStax University Physics Vol. 1 §4.3, "Comparing Golf Shots" (b): 90.0 m at 70°', { R: 90, shot: 'high', lo: 30, hi: 70 }, { v0: 37.048, other: 20 }, {
        note: 'The book prints 37.0 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.height',
    level: 2,
    variety: ['configuration'],
    lab: 'projectile',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'A launch to or from a height',
    topics: ['projectile'],
    vars: {
      where: choice(['up', 'above'], ['down', 'below']),
      v0: range(10, 30, 1, 'm/s'),
      theta: range(0, 60, 5, '°'),
      d: range(5, 40, 5, 'm'),
    },
    derive: ($) => {
      const dy = $.where === 'up' ? $.d : -$.d;
      const shot = projectile({ v0: $.v0, thetaDeg: $.theta, g: G, y0: 0, yLand: dy });
      const L = shot.land;
      return {
        dy,
        vx: L ? L.vx : NaN,
        vyL: L ? L.vy : NaN,
        t: shot.tFlight,
        R: shot.range,
        v: L ? L.speed : NaN,
        phi: L ? deg(Math.atan2(-L.vy, L.vx)) : NaN,
      };
    },
    // Energy for the speed, then the vertical velocity at landing gives the time and the angle.
    second: ($) => {
      const dy = $.where === 'up' ? $.d : -$.d;
      const vx = $.v0 * Math.cos($.theta * DEG);
      const vy = $.v0 * Math.sin($.theta * DEG);
      const speed = Math.sqrt($.v0 * $.v0 - 2 * G * dy);
      const vyL = -Math.sqrt(speed * speed - vx * vx);
      const t = (vy - vyL) / G;
      return { t, R: vx * t, v: speed, phi: deg(Math.acos(vx / speed)) };
    },
    valid: ($) => ($.where === 'down' || ($.theta >= 20 && ($.v0 * Math.sin($.theta * DEG)) ** 2 > 2 * G * $.d + 9)) && Number.isFinite($.t),
    text: (T, $) => ($.where === 'up'
      ? `A ball is struck at ${T.v0} m/s, ${T.theta}° above the horizontal. On its way down a fan catches it ${T.d} m above the point where it was struck. Ignore air resistance and take g = ${G} m/s². Find the time to the catch, the horizontal distance, and the ball's speed and its angle below the horizontal at the catch.`
      : `A ball leaves the edge of a ${T.d} m drop at ${T.v0} m/s, ${T.theta}° above the horizontal, and lands on the flat ground below. Ignore air resistance and take g = ${G} m/s². Find its time in the air, the horizontal distance, and its speed and its angle below the horizontal as it lands.`),
    parts: [
      num('t', ($) => $.t, 's', { label: 'time' }),
      num('R', ($) => $.R, 'm', { label: 'horizontal distance' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed at the end' }),
      num('phi', ($) => $.phi, '°', { label: 'angle below the horizontal', abs: 0.05 }),
    ],
    hints: [
      String.raw`Launch and landing are at different heights, so the level-ground formulas do not apply. The time comes from the vertical motion alone: $y(t) = v_{0y}t - \tfrac12 g t^2 = \Delta y$.`,
      String.raw`That is a quadratic in $t$. Take the later root: the ball passes the landing height on the way down.`,
    ],
    steps: ($) => [
      String.raw`$\Delta y = ${texNum($.dy)}\ \mathrm{m}$: $\tfrac12 g t^2 - v_{0y}t + \Delta y = 0$ gives $t = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$R = v_{0x}t = ${texNum($.R)}\ \mathrm{m}$`,
      String.raw`$v_y = v_{0y} - gt = ${texNum($.vyL)}\ \mathrm{m/s}$, so $v = ${texNum($.v)}\ \mathrm{m/s}$ at $${texNum($.phi)}^\circ$ below the horizontal`,
    ],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        s.v0 = $.v0;
        s.theta = $.theta;
        s.slope = 0;
        s.y0 = $.where === 'up' ? 0 : $.d;
        s.yLand = $.where === 'up' ? $.d : 0;
        s.frac = 0.6;
      },
      read: (c) => ({ t: c.tFlight, R: c.range, v: c.speed, phi: c.landAngle }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "Calculating Projectile Motion: Tennis Player": 30 m/s at 45°, caught 10 m above the hit', { where: 'up', v0: 30, theta: 45, d: 10 }, { t: 3.7864, R: 80.321, v: 26.529, phi: 36.907 }, {
        note: 'The book prints 3.79 s and 26.5 m/s at 36.9° below the horizontal.',
      }),
      kase('OpenStax University Physics Vol. 1 §4.3, Check Your Understanding 4.4: a rock thrown horizontally at 15.0 m/s off a 100.0 m cliff', { where: 'down', v0: 15, theta: 0, d: 100 }, { t: 4.5152, R: 67.729, v: 46.765, phi: 71.292 }, {
        note: 'The book prints 46.8 m/s at 71.3° below the horizontal.',
      }),
      kase('OpenStax University Physics Vol. 1 §4.3, Problem 4.53: a golfer 20 m above the green hits at 20 m/s and 40°', { where: 'down', v0: 20, theta: 40, d: 20 }, { t: 3.7177, R: 56.959, v: 28.150, phi: 57.025 }, {
        note: 'The book rounds the time to 3.7 s and prints 56.7 m; unrounded the ball lands 57.0 m out.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.slope',
    level: 3,
    variety: ['configuration'],
    lab: 'projectile',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'A launch onto a slope',
    topics: ['projectile'],
    vars: {
      dir: choice(['up', 'rises'], ['down', 'falls away']),
      v0: range(10, 30, 1, 'm/s'),
      theta: range(20, 70, 5, '°'),
      phi: range(10, 30, 5, '°'),
    },
    derive: ($) => {
      const slope = $.dir === 'up' ? $.phi : -$.phi;
      const L = slopeLanding({ v0: $.v0, thetaDeg: $.theta, slopeDeg: slope, g: G });
      return { slope, d: L ? L.d : NaN, t: L ? L.t : NaN };
    },
    // Fly the projectile and bisect for where its height meets the slope line.
    second: ($) => {
      const slope = $.dir === 'up' ? $.phi : -$.phi;
      const shot = flight({ r0: v(0, 0, 0), v0: fromAngle2D($.v0, $.theta), g: G });
      const gap = (t) => shot.state(t).y - shot.state(t).x * Math.tan(slope * DEG);
      const t = bisect(gap, 1e-6, 60);
      const p = shot.state(t);
      return { d: Math.hypot(p.x, p.y), t };
    },
    valid: ($) => $.theta - $.slope >= 15,
    text: (T, $) => `A ball is launched from a point on a straight slope that ${T.dir} at ${$.phi}° to the horizontal, ${$.dir === 'up' ? 'up the slope' : 'out over the slope'}, at ${T.v0} m/s and ${T.theta}° above the horizontal. Ignore air resistance and take g = ${G} m/s². How far along the slope does it land, and when?`,
    parts: [
      num('d', ($) => $.d, 'm', { label: 'distance along the slope' }),
      num('t', ($) => $.t, 's', { label: 'time in the air' }),
    ],
    hints: [
      String.raw`The landing point is on the line $y = x\tan\varphi$, where $\varphi$ is the slope, negative when it falls away. Write $x(t)$ and $y(t)$ and set $y = x\tan\varphi$.`,
      String.raw`Apart from $t = 0$, that gives $t = 2v_0\sin(\theta - \varphi)/(g\cos\varphi)$. The distance along the slope is $x/\cos\varphi$.`,
    ],
    steps: ($) => [
      String.raw`$v_0\sin\theta\,t - \tfrac12 g t^2 = v_0\cos\theta\,t\tan\varphi$ gives $t = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$d = v_0\cos\theta\,t/\cos\varphi = ${texNum($.d)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        s.v0 = $.v0;
        s.theta = $.theta;
        s.y0 = $.dir === 'up' ? 0 : 40;
        s.yLand = 0;
        s.slope = $.slope;
        s.frac = 0.5;
      },
      read: (c) => ({ d: c.along, t: c.tFlight }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "Comparing Golf Shots" (a), read as a slope of 0°: 31.9 m/s at 30° carries 90.0 m', { dir: 'up', v0: 31.928, theta: 30, phi: 0 }, { d: 90, t: 3.2547 }, {
        note: 'A slope of 0° is level ground, so the template must return the golf shot of §4.3. The book prints 90.0 m.',
      }),
      kase('hand', { dir: 'up', v0: 20, theta: 50, phi: 20 }, { d: 29.682, t: 2.1696 }),
      kase('hand', { dir: 'down', v0: 15, theta: 30, phi: 25 }, { d: 39.618, t: 2.7640 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.circle',
    level: 1,
    variety: ['representation'],
    lab: 'circular-motion',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'Speed and acceleration from a rate of turning',
    topics: ['circular'],
    vars: {
      rep: choice(['rpm', 'revolutions per minute'], ['period', 'the time for one turn']),
      r: range(0.1, 1.5, 0.1, 'm'),
      rpm: range(60, 1800, 60, 'rpm'),
      T: range(0.5, 10, 0.5, 's'),
    },
    // Drawn versions stay with fans and wheels a student can picture, tips under 40 m/s. A case (Venus) may go past.
    sampleValid: ($) => $.v <= 40,
    derive: ($) => {
      const omega = $.rep === 'rpm' ? $.rpm * RAD_S_PER_RPM : (2 * Math.PI) / $.T;
      const m = circularMotion({ r: $.r, v: omega * $.r });
      return { omega, v: omega * $.r, a: m.ac };
    },
    // One lap is 2πr in one period: v = 2πr/T, then a = v²/r.
    second: ($) => {
      const period = $.rep === 'rpm' ? 60 / $.rpm : $.T;
      const speed = (2 * Math.PI * $.r) / period;
      return { v: speed, a: (speed * speed) / $.r };
    },
    text: (T, $) => ($.rep === 'rpm'
      ? `A point sits ${T.r} m from the axis of a fan that turns at a steady ${T.rpm} rev/min. Find its speed and its acceleration.`
      : `A point sits ${T.r} m from the centre of a wheel that turns once every ${T.T} s at a steady rate. Find its speed and its acceleration.`),
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
    ],
    hints: [
      String.raw`The speed is steady but the direction turns, so the acceleration points at the centre: $a_c = v^2/r = \omega^2 r$.`,
      String.raw`$\omega$ must be in radians per second: one revolution is $2\pi$ rad, and a minute is 60 s.`,
    ],
    steps: ($) => [
      String.raw`$\omega = ${texNum($.omega)}\ \mathrm{rad/s}$, so $v = \omega r = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$a_c = \omega^2 r = ${texNum($.a)}\ \mathrm{m/s^2}$, toward the axis`,
    ],
    sim: {
      scenario: 'roundabout',
      setup: (s, $) => {
        s.r = $.r;
        s.v = $.v;
        s.aT = 0;
      },
      read: (c) => ({ a: c.ac }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.4, Problem 4.71: a fan at 360.0 rev/min, a point 10.0 cm from the axis', { rep: 'rpm', r: 0.1, rpm: 360, T: 1 }, { v: 3.7699, a: 142.12 }, {
        note: 'The book rounds the speed to 3.8 m/s and prints 144 m/s². Unrounded, 3.77²/0.100 = 142 m/s².',
      }),
      kase('OpenStax University Physics Vol. 1 §4.4, Problem 4.69: Venus, 1.082 × 10¹¹ m from the Sun, period 1.94 × 10⁷ s', { rep: 'period', r: 1.082e11, rpm: 30, T: 1.94e7 }, { v: 35043, a: 0.011350 }, {
        note: 'The book prints 3.5 × 10⁴ m/s and 1.135 × 10⁻² m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.turn',
    level: 1,
    variety: ['representation'],
    lab: 'circular-motion',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'The radius of a turn at a given acceleration',
    topics: ['circular'],
    vars: {
      rep: choice(['g', 'multiples of g'], ['si', 'm/s²']),
      v: range(50, 300, 10, 'm/s'),
      n: range(1, 6, 0.5, 'g'),
    },
    derive: ($) => {
      const a = $.n * G;
      const r = ($.v * $.v) / a;
      return { acc: a, r, T: circularMotion({ r, v: $.v }).period };
    },
    // Through the rate of turning: ω = a/v, r = v/ω, T = 2π/ω.
    second: ($) => {
      const omega = ($.n * G) / $.v;
      return { r: $.v / omega, T: (2 * Math.PI) / omega };
    },
    text: (T, $, sig) => `A jet flying at ${T.v} m/s turns in a level circle. Its centripetal acceleration is ${$.rep === 'g' ? `${T.n} g, with g = ${G} m/s²` : `${sig($.acc)} m/s²`}. Find the radius of the circle, and how long a full circle would take.`,
    parts: [
      num('r', ($) => $.r, 'm', { label: 'radius' }),
      num('T', ($) => $.T, 's', { label: 'time for a full circle' }),
    ],
    hints: [
      String.raw`Set the centripetal acceleration $v^2/r$ equal to the given value and solve for $r$.`,
      String.raw`A full circle is $2\pi r$ at speed $v$.`,
    ],
    steps: ($) => [
      String.raw`$r = v^2/a_c = ${texNum($.r)}\ \mathrm{m}$`,
      String.raw`$T = 2\pi r/v = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'jet',
      setup: (s, $) => {
        s.r = $.r;
        s.v = $.v;
        s.aT = 0;
      },
      read: (c) => ({ T: c.period }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.4, "Creating an Acceleration of 1 g": 134.1 m/s at 1 g', { rep: 'g', v: 134.1, n: 1 }, { r: 1833.1, T: 85.89 }, {
        note: 'The book takes g = 9.8 m/s² and prints 1835 m; with 9.81 m/s² it is 1833 m.',
      }),
      kase('hand', { rep: 'si', v: 200, n: 4 }, { r: 1019.37, T: 32.024 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.total',
    level: 3,
    variety: ['representation'],
    lab: 'circular-motion',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'Total acceleration when the speed changes on a circle',
    topics: ['circular', 'nonuniform-circular'],
    vars: {
      rep: choice(['values', 'values'], ['function', 'a formula']),
      r: range(1, 10, 0.5, 'm'),
      v: range(1, 10, 0.5, 'm/s'),
      at: { ...range(-4, 4, 0.5, 'm/s²'), exclude: [0] },
      c1: range(3, 8, 1, 'm/s'),
      c2: range(1, 12, 1, 'm·s'),
      t: range(1.5, 4, 0.5, 's'),
    },
    derive: ($) => {
      const speed = $.rep === 'function' ? $.c1 - $.c2 / $.t ** 2 : $.v;
      const aT = $.rep === 'function' ? (2 * $.c2) / $.t ** 3 : $.at;
      const m = circularMotion({ r: $.r, v: speed, aT });
      return { speed, aT, ac: m.ac, a: m.a, ang: m.angleFromV };
    },
    // dv/dt by differentiating the speed numerically; a_c as ω²r; the angle from cos θ = a_T/|a|.
    second: ($) => {
      const speedAt = (t) => $.c1 - $.c2 / t ** 2;
      const speed = $.rep === 'function' ? speedAt($.t) : $.v;
      const aT = $.rep === 'function' ? deriv(speedAt, $.t) : $.at;
      const omega = speed / $.r;
      const ac = omega * omega * $.r;
      const a = Math.sqrt(ac * ac + aT * aT);
      return { ac, a, ang: deg(Math.acos(aT / a)) };
    },
    valid: ($) => $.speed > 0.5,
    text: (T, $) => ($.rep === 'function'
      ? String.raw`A particle moves on a circle of radius ${T.r} m. Its speed is $v(t) = ${T.c1} - ${T.c2}/t^2$, with $v$ in m/s and $t$ in s. At $t = ${T.t}$ s, find the centripetal acceleration, the size of the total acceleration, and the angle between the acceleration and the velocity.`
      : `A particle moves on a circle of radius ${T.r} m. At one instant its speed is ${T.v} m/s and the speed is ${$.at > 0 ? 'increasing' : 'decreasing'} at ${Math.abs($.at)} m/s². Find the centripetal acceleration, the size of the total acceleration, and the angle between the acceleration and the velocity.`),
    parts: [
      num('ac', ($) => $.ac, 'm/s²', { label: 'centripetal acceleration' }),
      num('a', ($) => $.a, 'm/s²', { label: 'size of the total acceleration' }),
      num('ang', ($) => $.ang, '°', { label: 'angle between a and v', abs: 0.05 }),
    ],
    hints: [
      String.raw`The acceleration has two perpendicular parts: $a_c = v^2/r$ toward the centre, from the turning, and $a_T = dv/dt$ along the motion, from the change of speed.`,
      String.raw`Add them as perpendicular vectors: $|\vec a| = \sqrt{a_c^2 + a_T^2}$. The angle from $\vec v$ is $\tan^{-1}(a_c/a_T)$, more than $90^\circ$ when the particle slows.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.speed)}\ \mathrm{m/s}$ and $a_T = ${texNum($.aT)}\ \mathrm{m/s^2}$`,
      String.raw`$a_c = v^2/r = ${texNum($.ac)}\ \mathrm{m/s^2}$, so $|\vec a| = \sqrt{a_c^2 + a_T^2} = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`The angle from $\vec v$ is $${texNum($.ang)}^\circ$`,
    ],
    sim: {
      scenario: 'speeding',
      setup: (s, $) => {
        s.r = $.r;
        s.v = $.speed;
        s.aT = $.aT;
      },
      read: (c) => ({ ac: c.ac, a: c.a, ang: c.angleFromV }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.4, "Total Acceleration during Circular Motion": r = 2.0 m, v = 4.0 − 6.0/t² at 2.0 s', { rep: 'function', r: 2, v: 1, at: 1, c1: 4, c2: 6, t: 2 }, { ac: 3.125, a: 3.4664, ang: 64.359 }, {
        note: 'The book rounds a_c to 3.1 m/s² before squaring and prints 3.44 m/s². Unrounded, √(3.125² + 1.5²) = 3.47 m/s². Its angle, 64°, is measured from the tangent, which here is the direction of v.',
      }),
      kase('hand', { rep: 'values', r: 4, v: 4, at: -3, c1: 4, c2: 6, t: 2 }, { ac: 4, a: 5, ang: 126.87 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.river',
    level: 2,
    variety: ['configuration', 'unknown'],
    lab: 'relative-motion',
    src: 'OpenStax University Physics Vol. 1 §4.5',
    title: 'Crossing a river',
    topics: ['relative-velocity'],
    vars: {
      aim: choice(['across', 'points straight across'], ['straight', 'aims upstream so it lands straight across']),
      vb: range(2, 8, 0.5, 'm/s'),
      vc: range(0.5, 4, 0.5, 'm/s'),
      width: range(20, 200, 10, 'm'),
    },
    derive: ($) => {
      if ($.aim === 'across') {
        const ground = add(fromAngle2D($.vb, 90), v($.vc, 0, 0));
        return { v: mag(ground), ang: Math.abs(angle2D(ground) - 90), t: $.width / ground.y, heading: 90 };
      }
      const sol = headingForTrack({ airspeed: $.vb, wind: v($.vc, 0, 0), trackDeg: 90 });
      return { v: sol ? sol.groundSpeed : NaN, ang: sol ? Math.abs(sol.correctionDeg) : NaN, t: sol ? $.width / sol.groundSpeed : NaN, heading: sol ? sol.headingDeg : NaN };
    },
    // The right triangle by its sides: Pythagoras, and the angle from a sine or a tangent.
    second: ($) => {
      if ($.aim === 'across') return { v: Math.hypot($.vb, $.vc), ang: deg(Math.atan($.vc / $.vb)), t: $.width / $.vb };
      const vs = Math.sqrt($.vb * $.vb - $.vc * $.vc);
      return { v: vs, ang: deg(Math.asin($.vc / $.vb)), t: $.width / vs };
    },
    valid: ($) => $.vc <= $.vb - 1,
    text: (T, $) => `A river ${T.width} m wide flows at ${T.vc} m/s. A boat moves at ${T.vb} m/s relative to the water and ${T.aim}. Find its speed over the ground, ${$.aim === 'across' ? 'the angle between its track and the straight-across line' : 'the angle upstream from straight across at which it must point'}, and the time it takes to cross.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed over the ground' }),
      num('ang', ($) => $.ang, '°', { label: 'the angle', abs: 0.05 }),
      num('t', ($) => $.t, 's', { label: 'time to cross' }),
    ],
    hints: [
      String.raw`Velocities add: $\vec v_{BG} = \vec v_{BW} + \vec v_{WG}$, the boat over the ground is the boat in the water plus the water over the ground.`,
      'Only the part of the ground velocity across the river carries the boat to the far bank. The time is the width over that part.',
    ],
    steps: ($) => [
      $.aim === 'across'
        ? String.raw`The two velocities are at right angles: $v = \sqrt{v_b^2 + v_c^2} = ${texNum($.v)}\ \mathrm{m/s}$, at $\tan^{-1}(v_c/v_b) = ${texNum($.ang)}^\circ$ downstream of straight across`
        : String.raw`The boat's upstream part cancels the current: $v_b\sin\alpha = v_c$, so $\alpha = ${texNum($.ang)}^\circ$ and $v = \sqrt{v_b^2 - v_c^2} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$t = \text{width}/v_\perp = ${texNum($.t)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'river',
      setup: (s, $) => {
        s.u = { s: $.vb, dir: $.heading };
        s.w = { s: $.vc, dir: 0 };
        s.width = $.width;
      },
      read: (c) => ({ v: c.speed, t: c.crossTime }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.5, Check Your Understanding 4.7: 4.5 m/s due north across a 3.0 m/s current, on a river 60 m wide', { aim: 'across', vb: 4.5, vc: 3, width: 60 }, { v: 5.4083, ang: 33.690, t: 13.333 }, {
        note: 'The book prints 5.4 m/s at 33.7°. It gives no width; 60 m is added here for the time.',
      }),
      kase('hand', { aim: 'straight', vb: 5, vc: 3, width: 100 }, { v: 4, ang: 36.870, t: 25 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.wind',
    level: 3,
    variety: ['configuration'],
    lab: 'wind-triangle',
    src: 'OpenStax University Physics Vol. 1 §4.5',
    title: 'The heading that holds a course in a wind',
    topics: ['relative-velocity'],
    vars: {
      from: choice([45, 'the northeast'], [315, 'the northwest'], [90, 'the east'], [270, 'the west'], [135, 'the southeast'], [225, 'the southwest']),
      air: range(150, 400, 10, 'km/h'),
      wind: range(30, 120, 10, 'km/h'),
    },
    derive: ($) => {
      // The wind blows toward the bearing opposite where it comes from. North is +y, east +x.
      const toward = fromAngle2D($.wind, 90 - ($.from + 180));
      const sol = headingForTrack({ airspeed: $.air, wind: toward, trackDeg: 90 });
      const straight = add(v(0, $.air, 0), toward);
      return { wca: -sol.correctionDeg, gs: sol.groundSpeed, careless: mag(straight), cross: $.wind * Math.sin($.from * DEG), head: $.wind * Math.cos($.from * DEG) };
    },
    // The sine rule: sin(WCA) = crosswind / airspeed; the ground speed is the rest of the airspeed minus the headwind.
    second: ($) => {
      const wca = Math.asin(($.wind * Math.sin($.from * DEG)) / $.air);
      return { wca: deg(wca), gs: $.air * Math.cos(wca) - $.wind * Math.cos($.from * DEG) };
    },
    text: (T) => `A pilot must fly due north. The plane flies at ${T.air} km/h in still air, and a wind blows at ${T.wind} km/h from ${T.from}. In what direction must the pilot point the plane, in degrees east of north (west of north is negative)? What is the plane's speed over the ground?`,
    parts: [
      num('wca', ($) => $.wca, '°', { label: 'heading, degrees east of north', abs: 0.05 }),
      num('gs', ($) => $.gs, 'km/h', { label: 'ground speed' }),
    ],
    hints: [
      String.raw`The plane's velocity over the ground is its velocity through the air plus the wind: $\vec v_{PG} = \vec v_{PA} + \vec v_{AG}$. The ground velocity must point due north.`,
      String.raw`So the east–west part of $\vec v_{PA}$ must cancel the wind's east–west part: $v_{PA}\sin\theta = $ the crosswind.`,
      'The rest of the airspeed points north. Add the wind’s north–south part to it.',
    ],
    steps: ($) => [
      String.raw`Crosswind $${texNum(Math.abs($.cross))}\ \mathrm{km/h}$: $\sin\theta = ${texNum($.cross)}/${texNum($.air)}$, $\theta = ${texNum($.wca)}^\circ$`,
      String.raw`$v_{PG} = v_{PA}\cos\theta - ${texNum($.head)} = ${texNum($.gs)}\ \mathrm{km/h}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        s.air = $.air;
        s.wind = $.wind;
        s.from = $.from;
        s.track = 0;
      },
      read: (c) => ({ wca: c.correction, gs: c.ground }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.5, "Flying a Plane in a Wind": 300 km/h, a 90 km/h wind from the northeast', { from: 45, air: 300, wind: 90 }, { wca: 12.247, gs: 229.53 }, {
        note: 'The book prints 12° east of north and 230 km/h.',
      }),
      kase('hand', { from: 270, air: 200, wind: 120 }, { wca: -36.870, gs: 160 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.truck',
    level: 1,
    variety: ['configuration'],
    lab: 'relative-motion',
    src: 'OpenStax University Physics Vol. 1 §4.5',
    title: 'A velocity seen from a moving vehicle',
    topics: ['relative-velocity', 'reference-frames'],
    vars: {
      tdir: choice([270, 'south'], [90, 'north'], [180, 'west'], [0, 'east']),
      vc: range(40, 120, 10, 'km/h'),
      vt: range(30, 110, 10, 'km/h'),
    },
    derive: ($) => {
      const car = v($.vc, 0, 0);
      const truck = fromAngle2D($.vt, $.tdir);
      const rel = relativeVelocity(car, truck);
      return { v: mag(rel), dir: angle2D(rel), sum: angle2D(add(car, truck)) };
    },
    // The law of cosines for the size, and the angle from the components written out by hand.
    second: ($) => {
      const delta = $.tdir * DEG;
      const size = Math.sqrt($.vc * $.vc + $.vt * $.vt - 2 * $.vc * $.vt * Math.cos(delta));
      const ang = deg(Math.atan2(-$.vt * Math.sin(delta), $.vc - $.vt * Math.cos(delta)));
      return { v: size, dir: (ang + 360) % 360 };
    },
    valid: ($) => $.v > 5,
    text: (T) => `A car drives east at ${T.vc} km/h. A truck drives ${T.tdir} at ${T.vt} km/h. What is the velocity of the car as seen from the truck? Give its speed and its direction in degrees counterclockwise from east.`,
    parts: [
      num('v', ($) => $.v, 'km/h', { label: 'speed seen from the truck' }),
      num('dir', ($) => $.dir, '°', { label: 'direction from east', abs: 0.05, wrap: 360 }),
    ],
    hints: [
      String.raw`Seen from the truck, the car's velocity is $\vec v_{CT} = \vec v_{CE} + \vec v_{ET}$, and $\vec v_{ET} = -\vec v_{TE}$.`,
      'Subtract the truck’s velocity from the car’s, component by component, then find the size and the angle.',
    ],
    steps: ($) => [
      String.raw`$\vec v_{CT} = \vec v_{CE} - \vec v_{TE}$, of size $${texNum($.v)}\ \mathrm{km/h}$`,
      String.raw`at $${texNum($.dir)}^\circ$ counterclockwise from east`,
    ],
    sim: {
      scenario: 'truck',
      setup: (s, $) => {
        s.u = { s: $.vc, dir: 0 };
        s.w = { s: $.vt, dir: $.tdir };
      },
      read: (c) => ({ v: c.speed, dir: c.dirDeg }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.5, "Motion of a Car Relative to a Truck": car 80 km/h east, truck 70 km/h south', { tdir: 270, vc: 80, vt: 70 }, { v: 106.30, dir: 41.186 }, {
        note: 'The book prints 106 km/h at 41.2° north of east.',
      }),
      kase('hand', { tdir: 180, vc: 60, vt: 40 }, { v: 100, dir: 0 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.concept-accel',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'Which way the acceleration points',
    kind: 'conceptual',
    level: 1,
    lab: 'circular-motion',
    topics: ['circular', 'nonuniform-circular'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'a car going round a level curve at a steady speed'],
        [2, 'a car speeding up as it goes round a level curve'],
        [3, 'a car braking as it goes round a level curve'],
        [4, 'a thrown ball on its way up, with no air resistance'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'centre', 2: 'ahead', 3: 'behind', 4: 'down' }[$.q] }),
    second: ($) => ({ ans: { 1: 'centre', 2: 'ahead', 3: 'behind', 4: 'down' }[$.q] }),
    text: (T) => `Which way does the acceleration point for ${T.q}?`,
    parts: [
      mc('ans', ($) => {
        const ball = $.q === 4;
        return [
          ['along', 'Along the velocity', ball ? 'On the way up the velocity points up and the ball is slowing. An acceleration along the velocity would speed it up.' : 'Only the part that changes the speed lies along the velocity. Turning needs a part toward the centre, so the acceleration is never along the velocity on a curve.'],
          ['centre', 'Straight at the centre of the curve', $.q === 1 ? 'Right: the speed is steady, so the only change in the velocity is its turning, and that change points at the centre.' : ($.q === 4 ? 'A thrown ball is not held on a circle. The only force is gravity, so the acceleration is g downward.' : 'The turning gives a part toward the centre, but the speed is also changing, which adds a part along the tangent. The total is not straight at the centre.')],
          ['ahead', 'Between the centre and straight ahead', $.q === 2 ? 'Right: a_c points at the centre and a_T points forward, so the total lies between them.' : 'That needs a part forward along the motion, which only a car gaining speed has.'],
          ['behind', 'Between the centre and straight behind', $.q === 3 ? 'Right: braking adds a part backward along the motion to the part toward the centre.' : 'That needs a part backward along the motion, which only a car losing speed has.'],
          ['down', 'Straight down', $.q === 4 ? 'Right: in flight only gravity acts, so the acceleration is g downward, on the way up, at the top and on the way down.' : 'A car on a level road is held up by the road. Its acceleration lies in the horizontal plane of the curve.'],
        ];
      }, ($) => $.ans, { label: 'the direction' }),
    ],
    hints: [
      'The acceleration is the rate of change of the velocity. Ask what is changing: the direction, the speed, or both.',
      'Turning gives a part toward the centre. Speeding up adds a part forward; slowing adds a part backward.',
    ],
    steps: ($) => [{ 1: 'Steady speed: only the direction changes, so a points at the centre.', 2: 'a_c toward the centre plus a_T forward: the total lies between them.', 3: 'a_c toward the centre plus a_T backward: the total lies between them.', 4: 'Only gravity acts in flight: a = g, straight down.' }[$.q]],
    sim: {
      scenario: 'roundabout',
      setup: (s, $) => {
        s.aT = { 1: 0, 2: 3, 3: -3, 4: 0 }[$.q];
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.4: in uniform circular motion the acceleration points toward the centre of the circle', { q: 1 }, { ans: 'centre' }),
      kase('OpenStax University Physics Vol. 1 §4.4, "Total Acceleration during Circular Motion": the total acceleration lies between the centripetal and tangential parts', { q: 2 }, { ans: 'ahead' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.concept-top',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'A projectile at the top of its flight',
    kind: 'conceptual',
    level: 2,
    lab: 'projectile',
    topics: ['projectile'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'its speed'],
        [2, 'its acceleration'],
        [3, 'the direction of its velocity'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'vx', 2: 'g', 3: 'flat' }[$.q] }),
    second: ($) => ({ ans: { 1: 'vx', 2: 'g', 3: 'flat' }[$.q] }),
    text: (T) => `A ball is kicked from level ground at speed v₀, at an angle θ above the horizontal, with no air resistance. At the top of its flight, what is ${T.q}?`,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['zero', 'Zero', 'Only the vertical part of the velocity is zero at the top. The horizontal part, v₀ cos θ, never changes.'],
          ['vx', 'v₀ cos θ', 'Right: v_y = 0 at the top, so the speed is the horizontal part alone. That holds only at the top; anywhere else v² = vₓ² + v_y².'],
          ['v0', 'v₀', 'The ball has lost its vertical speed, v₀ sin θ, on the way up. Only the horizontal part is left.'],
        ],
        2: [
          ['zero', 'Zero', 'The vertical velocity is passing through zero, but it is still changing, from up to down. That change is g.'],
          ['g', 'g, downward', 'Right: gravity is the only force, so the acceleration is g downward at every point of the flight.'],
          ['less', 'Less than g, pointing down and forward', 'Nothing pushes the ball forward, so the acceleration has no horizontal part. It is g, straight down.'],
        ],
        3: [
          ['flat', 'Horizontal', 'Right: the vertical part is zero at the top, so the velocity is the horizontal part alone.'],
          ['up', 'Still up at angle θ', 'The ball has stopped climbing at the top. Its velocity has no vertical part there.'],
          ['none', 'It has no direction: the velocity is zero', 'The velocity is not zero at the top. The horizontal part, v₀ cos θ, carries on.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Split the motion: the horizontal velocity never changes, and the vertical motion is a toss straight up.',
      'The top is where the vertical velocity is zero. Ask what is left.',
    ],
    steps: ($) => [{ 1: 'At the top v_y = 0, so the speed is vₓ = v₀ cos θ.', 2: 'The acceleration is g downward everywhere in the flight.', 3: 'With v_y = 0, the velocity is horizontal.' }[$.q]],
    sim: { scenario: 'level', setup: (s) => { s.frac = 0.5; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "A Fireworks Projectile Explodes High and Away": the apex is where v_y = 0', { q: 3 }, { ans: 'flat' }),
      kase('OpenStax University Physics Vol. 1 §4.3: a_x = 0 and a_y = −g throughout the flight', { q: 2 }, { ans: 'g' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.concept-range',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'Which lands farther, and which lands first',
    kind: 'conceptual',
    level: 2,
    lab: 'projectile',
    topics: ['projectile'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'Two balls are kicked from level ground at the same speed, one at 30° and one at 60°. Which lands farther away?'],
        [2, 'Two balls are kicked from a 20 m roof at the same speed, one at 30° and one at 60°. Which lands farther from the wall?'],
        [3, 'From the same height, one ball is dropped and another is thrown horizontally at the same instant. Which hits the level ground first?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'low', 3: 'same' }[$.q] }),
    // The lab's own closed forms decide.
    second: ($) => {
      const reach = (th, y0) => projectile({ v0: 12, thetaDeg: th, g: G, y0 }).range;
      if ($.q === 1) return { ans: Math.abs(reach(30, 0) - reach(60, 0)) < 1e-9 ? 'same' : 'x' };
      if ($.q === 2) return { ans: reach(30, 20) > reach(60, 20) ? 'low' : 'high' };
      const t = (vx) => projectile({ v0: vx, thetaDeg: 0, g: G, y0: 20 }).tFlight;
      return { ans: Math.abs(t(0.001) - t(12)) < 1e-9 ? 'same' : 'x' };
    },
    text: (T) => `${T.q} Ignore air resistance.`,
    parts: [
      mc('ans', ($) => {
        const sameWhy = {
          1: 'Right: on level ground the range is v₀² sin 2θ / g, and sin 60° = sin 120°. The 60° ball goes higher and lands in the same place.',
          2: 'That tie holds only when launch and landing are at one height. From a roof the extra fall gives the flatter launch, with more horizontal speed, the advantage.',
          3: 'Right: both start with no vertical velocity and fall the same height under the same g. The horizontal motion does not change the vertical one.',
        };
        const first = $.q === 3 ? 'The dropped ball' : 'The 30° ball';
        const second = $.q === 3 ? 'The thrown ball' : 'The 60° ball';
        return [
          ['low', first, { 1: 'The ranges at 30° and 60° are equal on level ground: sin 60° = sin 120°.', 2: 'Right: both have 20 m more to fall than they climbed. The 30° ball has more horizontal speed for that extra time: 28.3 m against 20.0 m at 12 m/s.', 3: 'The vertical motions are identical: same start, same height, same g. Neither leads.' }[$.q]],
          ['high', second, { 1: 'The 60° ball goes higher and stays up longer, but its horizontal speed is smaller in the same proportion. The two ranges come out equal.', 2: 'The 60° ball spends longer in the air, but its horizontal speed is too small to make up for it.', 3: 'Its horizontal speed does not help it fall faster. Gravity sets the fall alone.' }[$.q]],
          ['same', $.q === 3 ? 'They land together' : 'They land the same distance away', sameWhy[$.q]],
        ];
      }, ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Split each launch into a horizontal part and a vertical part. The time in the air is set by the vertical motion alone.',
      String.raw`The level-ground range $v_0^2\sin 2\theta/g$ holds only when the ball lands at the height it left.`,
    ],
    steps: ($) => [{ 1: 'Level ground: R = v₀² sin 2θ/g, and sin 60° = sin 120°, so they tie.', 2: 'From a height the tie breaks: the 30° ball lands farther out.', 3: 'Same vertical motion, so they land together.' }[$.q]],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        if ($.q === 2) s.y0 = 20;
        if ($.q === 3) {
          s.theta = 0;
          s.y0 = 20;
        }
        s.show = { ...(s.show || {}), twin: $.q !== 3 };
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.3, "Range": the same range is found for two launch angles that sum to 90°', { q: 1 }, { ans: 'same' }),
      kase('OpenStax University Physics Vol. 1 §4.1, "Independence of Motion": a dropped ball and one thrown horizontally keep the same height at every instant', { q: 3 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.concept-circle',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'Steady speed on a circle',
    kind: 'conceptual',
    level: 1,
    lab: 'circular-motion',
    topics: ['circular'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A car goes round a curve at a steady 20 m/s. Is it accelerating?'],
        [2, 'A car goes round the same curve at twice the speed. By what factor does its centripetal acceleration change?'],
        [3, 'To use a_c = ω²r, in what unit must ω be?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'yes', 2: 'four', 3: 'rad' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: circularMotion({ r: 50, v: 20 }).ac > 0 ? 'yes' : 'no' };
      if ($.q === 2) return { ans: Math.abs(circularMotion({ r: 50, v: 40 }).ac / circularMotion({ r: 50, v: 20 }).ac - 4) < 1e-12 ? 'four' : 'x' };
      return { ans: 'rad' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['no', 'No, its speed does not change', 'Acceleration is the change of velocity, and velocity has a direction. The direction turns all the way round the curve.'],
          ['yes', 'Yes, toward the centre of the curve', 'Right: the velocity turns, so it changes. That change points at the centre: a_c = v²/r.'],
          ['out', 'Yes, outward, away from the centre', 'The outward push a passenger feels is the passenger’s own tendency to go straight. The car’s acceleration points inward.'],
        ],
        2: [
          ['two', '×2', 'The speed enters twice: twice as much velocity is turned, twice as fast. a_c = v²/r grows four times.'],
          ['four', '×4', 'Right: a_c = v²/r, so twice the speed is four times the acceleration.'],
          ['half', '×½', 'A faster car on the same curve turns its velocity faster, so the acceleration grows.'],
        ],
        3: [
          ['deg', 'Degrees per second', 'The formula comes from arc length s = rθ, which holds only with θ in radians. Degrees give an answer 57.3² times too big.'],
          ['rad', 'Radians per second', 'Right: v = ωr needs the angle in radians, and so does a_c = ω²r.'],
          ['rpm', 'Revolutions per minute', 'A revolution is 2π rad and a minute 60 s. Convert first: 1 rpm = 2π/60 rad/s.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Velocity is a vector. A change in its direction is a change in the velocity.',
      String.raw`The size of the centripetal acceleration is $a_c = v^2/r = \omega^2 r$, with $\omega$ in radians per second.`,
    ],
    steps: ($) => [{ 1: 'The velocity turns, so the car accelerates toward the centre.', 2: 'a_c ∝ v², so ×4.', 3: 'Radians per second.' }[$.q]],
    sim: {
      scenario: 'roundabout',
      setup: (s, $) => {
        s.v = $.q === 2 ? 20 : 10;
        s.aT = 0;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.4: even if the speed is constant, a particle on a circle has an acceleration, toward the centre', { q: 1 }, { ans: 'yes' }),
      kase('OpenStax University Physics Vol. 1 §4.4: the angular frequency has units of radians per second', { q: 3 }, { ans: 'rad' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.concept-frames',
    src: 'OpenStax University Physics Vol. 1 §4.5',
    title: 'What changes with the frame',
    kind: 'conceptual',
    level: 2,
    lab: 'relative-motion',
    topics: ['relative-velocity', 'reference-frames'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A boat points straight across a river. The current speeds up. What happens to the time it takes to cross?'],
        [2, 'A passenger on a train moving at a steady 30 m/s drops a ball. Where does it land, as the passenger sees it?'],
        [3, 'Two observers move at a steady velocity relative to each other. Both measure the acceleration of the same falling stone. How do their answers compare?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'feet', 3: 'same' }[$.q] }),
    second: ($) => {
      if ($.q === 1) {
        const t = (vc) => 60 / add(fromAngle2D(4.5, 90), v(vc, 0, 0)).y;
        return { ans: Math.abs(t(3) - t(6)) < 1e-9 ? 'same' : 'x' };
      }
      return { ans: { 2: 'feet', 3: 'same' }[$.q] };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['longer', 'It takes longer', 'The current runs along the river, so it adds nothing across it. Only the boat’s own velocity, straight across, gets it over.'],
          ['same', 'It is the same', 'Right: the crossing time is the width over the part of the velocity across the river, which is the boat’s own speed. The current only carries the boat farther downstream.'],
          ['shorter', 'It is shorter, because the boat goes faster over the ground', 'It does go faster over the ground, but the extra speed is along the river, not across it.'],
        ],
        2: [
          ['behind', 'Behind the passenger, because the train moves on', 'The ball shares the train’s 30 m/s when it is let go, and nothing slows it horizontally. It keeps pace with the passenger.'],
          ['feet', 'At the passenger’s feet, straight below', 'Right: in the train’s frame the ball starts at rest and falls straight down. The train moves at constant velocity, so its frame works like the ground’s.'],
          ['ahead', 'Ahead of the passenger', 'Nothing pushes the ball forward faster than the train. It lands straight below in the train’s frame.'],
        ],
        3: [
          ['differ', 'They differ by the relative velocity', 'Velocities differ by the relative velocity. Accelerations differ by the rate of change of that velocity, which is zero here.'],
          ['same', 'They are the same', 'Right: a_PS = a_PS′ + a_S′S, and a_S′S = 0 for frames moving at constant relative velocity.'],
          ['zero', 'The moving observer sees zero acceleration', 'Only an observer falling with the stone would see it at rest. A steady velocity cannot cancel an acceleration.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`Write the rule: $\vec v_{PS} = \vec v_{PS'} + \vec v_{S'S}$. Differentiate it for the accelerations.`,
      'Ask which part of the velocity does the job: across the river, or along the track of the train.',
    ],
    steps: ($) => [{ 1: 'The time is the width over the boat’s own speed across: unchanged.', 2: 'In the train’s frame the ball falls straight down.', 3: 'The relative velocity is constant, so the accelerations agree.' }[$.q]],
    sim: { scenario: 'river', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §4.5: the acceleration of a particle is the same as measured by two observers moving at a constant velocity relative to each other', { q: 3 }, { ans: 'same' }),
      kase('OpenStax University Physics Vol. 1 §4.5, Check Your Understanding 4.7: a boat heading north across a river running east', { q: 1 }, { ans: 'same' }),
    ],
  }),
];
