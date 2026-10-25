/** Ch 3 · Motion along a straight line. OpenStax University Physics Vol. 1, §§3.1–3.5. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  averageVelocity, constAccel1D, piecewiseMotion, speedFromDisplacement, stoppingDistance, timeAtSpeed,
} from '@flux/subjects/mechanics/kinematics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { gravitationalEnergy, kineticEnergy, speedFromEnergy } from '@flux/subjects/mechanics/energy.js';
import { trap1D } from '../integrate.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u1', ch: '3' };

/** Each stage of the acceleration graph lasts this long, in seconds (the Motion graphs lab's piece). */
const PIECE = 1.5;

/** At the initial instant: speeding up, slowing down, or neither. */
function pace($) {
  if (Math.abs($.a) < 1e-12) return 'neither';
  if (Math.abs($.v0) < 1e-12) return 'up';
  return $.v0 * $.a > 0 ? 'up' : 'down';
}


/** Position tables (m at t = 0, 1, 2, 3, 4 s) for the table-reading question. */
const TABLES = {
  1: [0, 4, 6, 6, 3],
  2: [3, 3, 7, 9, 6],
  3: [5, 2, 8, 8, 9],
};

/** Which interval the question picks, as the index "0" to "3": by the velocity in each. */
function pickInterval(xs, q) {
  const slopes = [0, 1, 2, 3].map((i) => xs[i + 1] - xs[i]);
  if (q === 1) return String(slopes.reduce((bi, s, i) => (Math.abs(s) > Math.abs(slopes[bi]) ? i : bi), 0));
  if (q === 2) return String(slopes.findIndex((s) => s < 0));
  return String(slopes.findIndex((s) => s === 0));
}

export default [
  problem({
    ...U,
    id: 'ch3.average',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §3.1',
    title: 'Average velocity and average speed',
    topics: ['kinematics', 'average'],
    vars: {
      xa: range(-20, 20, 2, 'm'),
      xb: range(-20, 20, 2, 'm'),
      xc: range(-20, 20, 2, 'm'),
      t1: range(2, 20, 1, 's'),
      t2: range(2, 20, 1, 's'),
    },
    derive: ($) => {
      const total = $.t1 + $.t2;
      const vAvg = averageVelocity(v($.xa, 0, 0), v($.xc, 0, 0), 0, total).x;
      const path = Math.abs($.xb - $.xa) + Math.abs($.xc - $.xb);
      return { vAvg, speed: path / total };
    },
    second: ($) => {
      const total = $.t1 + $.t2;
      const path = Math.abs($.xb - $.xa) + Math.abs($.xc - $.xb);
      return { vAvg: ($.xc - $.xa) / total, speed: path / total };
    },
    text: (T) => `A particle moves along a line from x = ${T.xa} m to x = ${T.xb} m in ${T.t1} s, then to x = ${T.xc} m in a further ${T.t2} s. Find the average velocity and the average speed over the whole trip. Take the +x direction as positive.`,
    parts: [
      num('vAvg', ($) => $.vAvg, 'm/s', { label: 'average velocity' }),
      num('speed', ($) => $.speed, 'm/s', { label: 'average speed', abs: 0.02 }),
    ],
    hints: [
      'Average velocity uses the net displacement. Average speed uses the distance traveled, both over the same time.',
    ],
    steps: ($) => [
      String.raw`$v_{\mathrm{avg}} = \Delta x/\Delta t = ${texNum($.vAvg)}\ \mathrm{m/s}$`,
      String.raw`$\mathrm{speed} = \mathrm{path}/\Delta t = ${texNum($.speed)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.2, "Instantaneous Velocity Versus Average Velocity": x(t) = 3.0t + 0.50t³ between 1.0 s and 3.0 s, sampled at 2.0 s', { xa: 3.5, xb: 10, xc: 22.5, t1: 1, t2: 1 }, { vAvg: 9.5, speed: 9.5 }, {
        note: 'The book prints v = 9.5 m/s. The motion never reverses, so the average speed is the same.',
      }),
      kase('hand', { xa: 0, xb: 80, xc: 20, t1: 16, t2: 12 }, { vAvg: 0.714286, speed: 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.const',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §3.4',
    title: 'Constant acceleration',
    topics: ['kinematics', 'constant-acceleration'],
    vars: {
      x0: range(0, 20, 1, 'm'),
      v0: range(-12, 12, 1, 'm/s'),
      a: range(-4, 4, 0.5, 'm/s²'),
      t: range(1, 8, 0.5, 's'),
    },
    derive: ($) => {
      const moved = constAccel1D({ x0: $.x0, v0: $.v0, a: $.a, t: $.t });
      return { x: moved.x, v: moved.v, pace: pace($) };
    },
    second: ($) => {
      const moved = trap1D($.x0, $.v0, $.a, $.t);
      return { x: moved.x, v: moved.v, pace: pace($) };
    },
    text: (T) => `A particle starts at x = ${T.x0} m with velocity ${T.v0} m/s. Its acceleration is a constant ${T.a} m/s². Find its position and velocity after ${T.t} s, and say whether it is speeding up or slowing down at the initial instant.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: 'position' }),
      num('v', ($) => $.v, 'm/s', { label: 'velocity' }),
      mc('pace', [
        ['up', 'Speeding up'],
        ['down', 'Slowing down'],
        ['neither', 'Neither'],
      ], ($) => $.pace, { label: 'at the start' }),
    ],
    hints: [
      String.raw`Use $v = v_0 + at$ and $x = x_0 + v_0 t + \frac{1}{2}at^2$.`,
      'It is speeding up when the acceleration and the velocity have the same sign. At rest, any nonzero acceleration speeds it up.',
    ],
    steps: ($) => [
      String.raw`$v = v_0 + at = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$x = x_0 + v_0 t + \frac{1}{2}at^2 = ${texNum($.x)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.4, "Calculating Final Velocity": 70.0 m/s landing, −1.50 m/s² for 40.0 s', { x0: 0, v0: 70, a: -1.5, t: 40 }, { x: 1600, v: 10, pace: 'down' }, {
        note: 'The book prints the final velocity, 10.0 m/s.',
      }),
      kase('OpenStax University Physics Vol. 1 §3.4, "Calculating Displacement of an Accelerating Object": a dragster from rest at 26.0 m/s² for 5.56 s', { x0: 0, v0: 0, a: 26, t: 5.56 }, { x: 401.9, v: 144.56, pace: 'up' }, {
        note: 'The book prints 402 m.',
      }),
      kase('hand', { x0: 0, v0: 4, a: 1.5, t: 6 }, { x: 51, v: 13, pace: 'up' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.stop',
    level: 1,
    variety: ['unknown'],
    lab: 'stopping-distance',
    src: 'OpenStax University Physics Vol. 1 §3.4',
    title: 'Stopping distance',
    topics: ['kinematics', 'constant-acceleration'],
    vars: {
      v0: range(4, 30, 1, 'm/s'),
      a: range(-8, -0.5, 0.5, 'm/s²'),
    },
    derive: ($) => ({
      t: timeAtSpeed($.v0, $.a, 0),
      x: (0 - $.v0 * $.v0) / (2 * $.a),
    }),
    // Time from v = v0 + a t, then integrate. The library distance comes from v² = v0² + 2 a Δx.
    second: ($) => {
      const t = (0 - $.v0) / $.a;
      return { t, x: trap1D(0, $.v0, $.a, t).x };
    },
    text: (T) => `A car moving at ${T.v0} m/s brakes at a constant ${T.a} m/s² until it stops. Find the time and the distance.`,
    parts: [
      num('t', ($) => $.t, 's', { label: 'time' }),
      num('x', ($) => $.x, 'm', { label: 'distance' }),
    ],
    hints: [
      String.raw`The stop is the instant $v = 0$. The distance also follows from $v^2 = v_0^2 + 2a\Delta x$ with no time in it.`,
    ],
    steps: ($) => [
      String.raw`$t = -v_0/a = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$\Delta x = -v_0^2/(2a) = ${texNum($.x)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'dry',
      setup: (s, $) => {
        s.v0 = $.v0;
        s.a = -$.a;
        s.tr = 0;
      },
      read: (c) => ({ t: c.tTotal, x: c.total }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.4, "How Far Does a Car Go?" (a): 30.0 m/s, −7.00 m/s² on dry concrete', { v0: 30, a: -7 }, { t: 4.28571, x: 64.2857 }, {
        note: 'The book prints 64.3 m.',
      }),
      kase('OpenStax University Physics Vol. 1 §3.4, "How Far Does a Car Go?" (b): −5.00 m/s² on wet concrete', { v0: 30, a: -5 }, { t: 6, x: 90 }, {
        note: 'The book prints 90.0 m.',
      }),
      kase('hand', { v0: 20, a: -4 }, { t: 5, x: 50 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.drop',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §3.5',
    title: 'Free fall from rest',
    topics: ['kinematics', 'free-fall'],
    vars: { h: range(2, 40, 1, 'm') },
    derive: ($) => {
      const vImpact = speedFromDisplacement(0, G, $.h);
      const t = timeAtSpeed(0, G, vImpact);
      return { v: vImpact, t };
    },
    second: ($) => ({
      v: speedFromEnergy({ mass: 1, u0: gravitationalEnergy(1, G, $.h), u: 0 }),
      t: Math.sqrt((2 * $.h) / G),
    }),
    text: (T) => `A stone is dropped from rest through ${T.h} m. Take g = ${G} m/s² downward, and ignore air resistance. Find the speed and the time at the bottom.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
      num('t', ($) => $.t, 's', { label: 'time' }),
    ],
    hints: [
      String.raw`Downward is positive here. Then $v^2 = 2gh$ and $h = \frac{1}{2}gt^2$.`,
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{2gh} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$t = \sqrt{2h/g} = ${texNum($.t)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.5, "Free Fall of a Ball", dropped from rest instead of thrown (the same quadratic with v0 = 0): 98 m', { h: 98 }, { v: 43.8, t: 4.46 }, {
        note: 'The book throws the ball down at 4.9 m/s and gets 4.0 s; from rest the same fall takes 4.5 s. The case is the same formulas without the throw.',
      }),
      kase('hand', { h: 20 }, { v: 19.8091, t: 2.01928 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.toss',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §3.5',
    title: 'Thrown straight up',
    topics: ['kinematics', 'free-fall'],
    vars: { v0: range(4, 25, 1, 'm/s') },
    derive: ($) => {
      const tTop = timeAtSpeed($.v0, -G, 0);
      const h = constAccel1D({ x0: 0, v0: $.v0, a: -G, t: tTop }).x;
      return { h, tTop, tBack: 2 * tTop };
    },
    // Energy at the apex, where the kinetic energy has all become m g h.
    second: ($) => {
      const h = kineticEnergy(1, $.v0) / G;
      const tTop = $.v0 / G;
      return { h, tTop, tBack: 2 * tTop };
    },
    text: (T) => `A ball is thrown straight up at ${T.v0} m/s. Take g = ${G} m/s² and ignore air resistance. Find how high it goes, the time to the top, and the time until it returns to the hand.`,
    parts: [
      num('h', ($) => $.h, 'm', { label: 'height' }),
      num('tTop', ($) => $.tTop, 's', { label: 'time to the top' }),
      num('tBack', ($) => $.tBack, 's', { label: 'time to return' }),
    ],
    hints: [
      'The velocity is zero at the top. The return takes twice as long as the trip up, because the acceleration is constant.',
    ],
    steps: ($) => [
      String.raw`$h = v_0^2/(2g) = ${texNum($.h)}\ \mathrm{m}$`,
      String.raw`$t_{\mathrm{top}} = v_0/g = ${texNum($.tTop)}\ \mathrm{s}$, so the return takes $${texNum($.tBack)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.5, "Vertical Motion of a Baseball": launched at 24.5 m/s', { v0: 24.5 }, { h: 30.6, tTop: 2.5, tBack: 5 }, {
        note: 'The book prints 30.6 m and 2.5 s, using g = 9.8 m/s². With 9.81 m/s² the time is 2.497 s.',
      }),
      kase('hand', { v0: 18 }, { h: 16.5138, tTop: 1.83486, tBack: 3.66972 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.legs',
    src: 'OpenStax University Physics Vol. 1 §3.1',
    title: 'A trip in four legs',
    topics: ['kinematics', 'average'],
    level: 1,
    variety: ['representation'],
    vars: {
      x1: range(200, 800, 100, 'm'),
      x2: range(0, 300, 100, 'm'),
      x3: range(600, 1200, 100, 'm'),
      x4: range(-1000, -200, 100, 'm'),
      t1: range(120, 900, 60, 's'),
      t2: range(120, 900, 60, 's'),
      t3: range(120, 900, 60, 's'),
      t4: range(120, 1800, 60, 's'),
    },
    derive: ($) => {
      const xs = [0, $.x1, $.x2, $.x3, $.x4];
      const total = $.t1 + $.t2 + $.t3 + $.t4;
      let path = 0;
      for (let i = 1; i < xs.length; i += 1) path += Math.abs(xs[i] - xs[i - 1]);
      return { disp: $.x4, vAvg: averageVelocity(v(0, 0, 0), v($.x4, 0, 0), 0, total).x, dist: path };
    },
    // Add the displacements of the legs one by one, then divide; the distance sums their magnitudes.
    second: ($) => {
      const legs = [$.x1 - 0, $.x2 - $.x1, $.x3 - $.x2, $.x4 - $.x3];
      const total = $.t1 + $.t2 + $.t3 + $.t4;
      const disp = legs.reduce((s, d) => s + d, 0);
      return { disp, vAvg: disp / total, dist: legs.reduce((s, d) => s + Math.abs(d), 0) };
    },
    text: (T) => `Jill walks east along a street from her house at x = 0. She is at ${T.x1} m after ${T.t1} s, back at ${T.x2} m after a further ${T.t2} s, at ${T.x3} m after a further ${T.t3} s, and at ${T.x4} m after a further ${T.t4} s. Take east as +x. Find her total displacement, her average velocity for the whole trip, and the total distance she walked.`,
    parts: [
      num('disp', ($) => $.disp, 'm', { label: 'total displacement' }),
      num('vAvg', ($) => $.vAvg, 'm/s', { label: 'average velocity' }),
      num('dist', ($) => $.dist, 'm', { label: 'distance walked' }),
    ],
    hints: [
      'Displacement only needs the start and the end. Distance adds the size of every leg, whichever way she was going.',
      'The average velocity is the total displacement over the total elapsed time, not an average of the leg velocities.',
    ],
    steps: ($) => [
      String.raw`$\Delta x = x_4 - x_0 = ${texNum($.disp)}\ \mathrm{m}$, so $\bar v = \Delta x/\Delta t = ${texNum($.vAvg)}\ \mathrm{m/s}$`,
      String.raw`distance $= \sum|\Delta x_i| = ${texNum($.dist)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.1, "Delivering Flyers": 0.5 km, back to 0, 1.0 km, then 0.75 km west of home, in 9, 9, 15 and 25 min', { x1: 500, x2: 0, x3: 1000, x4: -750, t1: 540, t2: 540, t3: 900, t4: 1500 }, { disp: -750, vAvg: -0.215517, dist: 3750 }, {
        note: 'The book writes the velocity as −0.013 km/min, which is −0.2155 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.slopes',
    src: 'OpenStax University Physics Vol. 1 §3.2',
    title: 'Velocity from a position table',
    topics: ['kinematics', 'average'],
    level: 2,
    variety: ['representation'],
    vars: {
      ta: range(0.5, 3, 0.5, 's'),
      xa: range(1, 6, 1, 'm'),
      tb: range(0.5, 2, 0.5, 's'),
      tc: range(0.5, 3, 0.5, 's'),
      xc: range(-3, 2, 1, 'm'),
    },
    derive: ($) => ({
      v1: $.xa / $.ta,
      v2: 0,
      v3: ($.xc - $.xa) / $.tc,
      dist: Math.abs($.xa) + Math.abs($.xc - $.xa),
    }),
    // The same table read the other way round: the time the object needs to cover each leg at its speed.
    second: ($) => {
      const v1 = $.xa / $.ta;
      const v3 = ($.xc - $.xa) / $.tc;
      return { v1, v2: 0, v3, dist: Math.abs(v1) * $.ta + Math.abs(v3) * $.tc };
    },
    valid: ($) => Math.abs($.v3) > 0.05 && Math.abs($.v3 - $.v1) > 0.3,
    text: (T) => `A cart’s position along a track is x = 0 at t = 0, x = ${T.xa} m at t = ${T.ta} s, still x = ${T.xa} m ${T.tb} s later, and x = ${T.xc} m a further ${T.tc} s after that. The position changes at a steady rate in each stage. Find the velocity in each stage and the total distance travelled.`,
    parts: [
      num('v1', ($) => $.v1, 'm/s', { label: 'velocity in stage 1' }),
      num('v2', ($) => $.v2, 'm/s', { label: 'velocity in stage 2' }),
      num('v3', ($) => $.v3, 'm/s', { label: 'velocity in stage 3', abs: 0.02 }),
      num('dist', ($) => $.dist, 'm', { label: 'distance travelled' }),
    ],
    hints: [
      'The velocity is the slope of position against time: the change in x over the change in t, in each stage separately.',
      'Distance counts the length of each stage whichever way it went. The velocity in the last stage can be negative.',
    ],
    steps: ($) => [
      String.raw`$v_1 = ${texNum($.v1)}$, $v_2 = 0$, $v_3 = ${texNum($.v3)}\ \mathrm{m/s}$`,
      String.raw`distance $= |{\Delta x_1}| + |{\Delta x_3}| = ${texNum($.dist)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.2, "Finding Velocity from a Position-Versus-Time Graph": 0.5 m at 0.5 s, rest to 1.0 s, back to the origin at 2.0 s', { ta: 0.5, xa: 0.5, tb: 0.5, tc: 1, xc: 0 }, { v1: 1, v2: 0, v3: -0.5, dist: 1 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.racehorse',
    src: 'OpenStax University Physics Vol. 1 §3.3',
    title: 'Average acceleration, with a sign',
    topics: ['kinematics', 'acceleration'],
    level: 1,
    variety: ['configuration'],
    vars: {
      v: range(8, 20, 1, 'm/s'),
      t: range(1, 4, 0.2, 's'),
      dir: choice([1, 'east'], [-1, 'west']),
    },
    derive: ($) => ({ a: ($.dir * $.v) / $.t, mag: $.v / $.t }),
    second: ($) => {
      const vf = $.dir * $.v;
      return { a: (vf - 0) / $.t, mag: Math.abs(vf) / $.t };
    },
    text: (T) => `A racehorse leaves the gate and speeds up from rest to ${T.v} m/s due ${T.dir} in ${T.t} s. Take east as the positive direction. Find its average acceleration, and the magnitude of that acceleration.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'average acceleration' }),
      num('mag', ($) => $.mag, 'm/s²', { label: 'its magnitude' }),
    ],
    hints: [
      String.raw`Average acceleration is $\Delta v/\Delta t$, with the velocity written as a signed number first.`,
      'West is the negative direction here, so a velocity due west is negative.',
    ],
    steps: ($) => [
      String.raw`$\bar a = \Delta v/\Delta t = (${texNum($.dir * $.v)} - 0)/${$.t} = ${texNum($.a)}\ \mathrm{m/s^2}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.3, "Calculating Average Acceleration: A Racehorse Leaves the Gate": 15.0 m/s due west in 1.80 s', { v: 15, t: 1.8, dir: -1 }, { a: -8.33333, mag: 8.33333 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.reaction',
    src: 'OpenStax University Physics Vol. 1 §3.4',
    title: 'Stopping a car, reaction time included',
    topics: ['kinematics', 'constant-acceleration'],
    level: 2,
    lab: 'stopping-distance',
    variety: ['unknown'],
    vars: {
      v0: range(10, 40, 5, 'm/s'),
      a: range(3, 9, 0.5, 'm/s²'),
      tr: range(0.3, 1.5, 0.1, 's'),
    },
    derive: ($) => {
      const r = stoppingDistance({ v0: $.v0, a: $.a, tReact: $.tr });
      return { reaction: r.reaction, braking: r.braking, total: r.total, tTotal: r.tTotal };
    },
    // The same stop as two pieces of constant acceleration, 0 then −a, added up with piecewiseMotion.
    second: ($) => {
      const m = piecewiseMotion({ v0: $.v0, pieces: [{ dt: $.tr, a: 0 }, { dt: $.v0 / $.a, a: -$.a }] });
      return { reaction: m.knots[1].x, braking: m.knots[2].x - m.knots[1].x, total: m.displacement, tTotal: m.duration };
    },
    text: (T) => `A driver sees a red light while moving at ${T.v0} m/s. The driver takes ${T.tr} s to get a foot on the brake, and then the car slows at a constant ${T.a} m/s². Find the distance travelled while the driver reacts, the braking distance, the total distance to a stop, and the total time.`,
    parts: [
      num('reaction', ($) => $.reaction, 'm', { label: 'reaction distance' }),
      num('braking', ($) => $.braking, 'm', { label: 'braking distance' }),
      num('total', ($) => $.total, 'm', { label: 'total distance' }),
      num('tTotal', ($) => $.tTotal, 's', { label: 'total time' }),
    ],
    hints: [
      'During the reaction time the car does not slow: it moves at the constant starting speed.',
      String.raw`For the braking, the final speed is zero, so $0 = v_0^2 - 2a\,d$ gives the distance with no time in it.`,
    ],
    steps: ($) => [
      String.raw`reaction: $v_0 t_r = ${texNum($.reaction)}\ \mathrm{m}$; braking: $v_0^2/(2a) = ${texNum($.braking)}\ \mathrm{m}$`,
      String.raw`total $= ${texNum($.total)}\ \mathrm{m}$ in $t_r + v_0/a = ${texNum($.tTotal)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'dry',
      setup: (s, $) => {
        s.v0 = $.v0;
        s.a = $.a;
        s.tr = $.tr;
      },
      read: (c) => ({ reaction: c.reaction, braking: c.braking, total: c.total, tTotal: c.tTotal }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.4, "How Far Does a Car Go?" (c), dry concrete: 30.0 m/s, 7.00 m/s², 0.500 s', { v0: 30, a: 7, tr: 0.5 }, { reaction: 15, braking: 64.2857, total: 79.2857, tTotal: 4.78571 }, { note: 'The book prints 64.3 m braking and 79.3 m in all.' }),
      kase('OpenStax University Physics Vol. 1 §3.4, "How Far Does a Car Go?" (c), wet concrete: 5.00 m/s²', { v0: 30, a: 5, tr: 0.5 }, { reaction: 15, braking: 90, total: 105, tTotal: 6.5 }, { note: 'The book prints 90.0 m braking and 105 m in all.' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.throwdown',
    src: 'OpenStax University Physics Vol. 1 §3.5',
    title: 'Thrown down from a building',
    topics: ['kinematics', 'free-fall', 'constant-acceleration'],
    level: 2,
    variety: ['unknown'],
    vars: {
      h: range(20, 120, 10, 'm'),
      v0: range(0, 15, 1, 'm/s'),
    },
    derive: ($) => {
      const t = (-$.v0 + Math.sqrt($.v0 * $.v0 + 2 * G * $.h)) / G;
      return { t, v: constAccel1D({ v0: -$.v0, a: -G, t }).v };
    },
    // Solve the other way: speed at the ground from v² = v0² + 2 g h, then the time from the speed change.
    second: ($) => {
      const speed = Math.sqrt($.v0 * $.v0 + 2 * G * $.h);
      return { t: (speed - $.v0) / G, v: -speed };
    },
    valid: ($) => $.t > 0.5,
    text: (T) => `A ball is thrown straight down at ${T.v0} m/s from the top of a ${T.h} m building. Take +y upward, g = ${G} m/s², and ignore air resistance. Find the time to reach the ground and the velocity as it arrives.`,
    parts: [
      num('t', ($) => $.t, 's', { label: 'time to the ground' }),
      num('v', ($) => $.v, 'm/s', { label: 'velocity on arrival (signed)' }),
    ],
    hints: [
      String.raw`With the origin at the top and +y up, $-h = -v_0 t - \tfrac12 g t^2$. This is a quadratic in $t$.`,
      'A quadratic has two roots. Only one is a time after the throw.',
    ],
    steps: ($) => [
      String.raw`$t = \dfrac{-v_0 + \sqrt{v_0^2 + 2gh}}{g} = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$v = -v_0 - gt = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.5, "Free Fall of a Ball": 4.9 m/s down from a 98 m building', { h: 98, v0: 4.9 }, { t: 3.99817, v: -44.1176 }, {
        note: 'The book uses g = 9.8 m/s² and prints 4.0 s and −44.1 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.hangtime',
    src: 'OpenStax University Physics Vol. 1 §3.5',
    title: 'A pop-up from its hang time',
    topics: ['kinematics', 'free-fall'],
    level: 2,
    variety: ['unknown'],
    vars: { T: range(2, 8, 0.5, 's') },
    derive: ($) => {
      const v0 = (G * $.T) / 2;
      return { v0, h: constAccel1D({ v0, a: -G, t: $.T / 2 }).x, tTop: $.T / 2, vEnd: constAccel1D({ v0, a: -G, t: $.T }).v, aTop: -G };
    },
    // From y = 0 = v0 T − g T²/2, then energy for the height.
    second: ($) => {
      const v0 = (G * $.T) / 2;
      return { v0, h: (v0 * v0) / (2 * G), tTop: $.T / 2, vEnd: -v0, aTop: -G };
    },
    text: (T) => `A baseball is hit straight up and caught at the same spot ${T.T} s later. Take +y upward and g = ${G} m/s². Find the launch velocity, the greatest height, the time to the top, the velocity as it is caught, and the acceleration at the top.`,
    parts: [
      num('v0', ($) => $.v0, 'm/s', { label: 'launch velocity' }),
      num('h', ($) => $.h, 'm', { label: 'greatest height' }),
      num('tTop', ($) => $.tTop, 's', { label: 'time to the top' }),
      num('vEnd', ($) => $.vEnd, 'm/s', { label: 'velocity when caught (signed)' }),
      num('aTop', ($) => $.aTop, 'm/s²', { label: 'acceleration at the top (signed)' }),
    ],
    hints: [
      String.raw`The ball returns to its starting height, so $y = 0$ at $t = T$. That fixes $v_0$.`,
      'At the top the velocity is zero for an instant. The acceleration is the same −g it has all the way up and down.',
    ],
    steps: ($) => [
      String.raw`$0 = v_0T - \tfrac12 gT^2$, so $v_0 = gT/2 = ${texNum($.v0)}\ \mathrm{m/s}$`,
      String.raw`$h = v_0^2/(2g) = ${texNum($.h)}\ \mathrm{m}$; it is caught at $${texNum($.vEnd)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.5, "Vertical Motion of a Baseball": caught 5.0 s later', { T: 5 }, { v0: 24.525, h: 30.6563, tTop: 2.5, vEnd: -24.525, aTop: -9.81 }, {
        note: 'The book uses g = 9.8 m/s² and prints 24.5 m/s, 30.6 m, 2.5 s, −24.5 m/s and 9.8 m/s² downward.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.piecewise',
    src: 'OpenStax University Physics Vol. 1 §3.6',
    title: 'Motion from an acceleration graph',
    topics: ['kinematics', 'integration'],
    level: 3,
    lab: 'kinematics-graphs',
    variety: ['representation'],
    vars: {
      v0: range(-8, 16, 2, 'm/s'),
      a1: range(-6, 6, 1, 'm/s²'),
      a2: range(-6, 6, 1, 'm/s²'),
      a3: range(-6, 6, 1, 'm/s²'),
      a4: range(-6, 6, 1, 'm/s²'),
    },
    derive: ($) => {
      const m = piecewiseMotion({ v0: $.v0, pieces: [$.a1, $.a2, $.a3, $.a4].map((a) => ({ dt: PIECE, a })) });
      return { vEnd: m.knots[4].v, disp: m.displacement, dist: m.distance, turns: m.turns.length };
    },
    // The areas under the acceleration graph, step by step, and under |v| with a fine trapezoid.
    second: ($) => {
      const pieces = [$.a1, $.a2, $.a3, $.a4];
      const N = 6000;
      let vel = $.v0;
      let x = 0;
      let path = 0;
      let turns = 0;
      for (const a of pieces) {
        const h = PIECE / N;
        for (let i = 0; i < N; i += 1) {
          const next = vel + a * h;
          x += 0.5 * (vel + next) * h;
          path += Math.abs(0.5 * (vel + next)) * h;
          if (vel * next < 0) turns += 1;
          vel = next;
        }
      }
      return { vEnd: vel, disp: x, dist: path, turns };
    },
    valid: ($) => $.dist - Math.abs($.disp) > 0.3 && $.turns >= 1 && Math.abs($.vEnd) > 0.5,
    text: (T) => `A cart moves along a line with an acceleration that is constant in four successive 1.5 s stages: ${T.a1}, ${T.a2}, ${T.a3} and ${T.a4} m/s². Its velocity at t = 0 is ${T.v0} m/s. Find its velocity at 6.0 s, its displacement over the 6.0 s, and the total distance it travels.`,
    parts: [
      num('vEnd', ($) => $.vEnd, 'm/s', { label: 'velocity at 6.0 s' }),
      num('disp', ($) => $.disp, 'm', { label: 'displacement' }),
      num('dist', ($) => $.dist, 'm', { label: 'distance travelled' }),
    ],
    hints: [
      'The change in velocity over a stage is the area under the acceleration graph there: a times 1.5 s. Add them to the starting velocity.',
      'The displacement is the net area under the velocity graph. The distance counts the part below zero as positive too, so find where the velocity crosses zero.',
    ],
    steps: ($) => [
      String.raw`$v(6\ \mathrm{s}) = v_0 + \sum a_i\,\Delta t = ${texNum($.vEnd)}\ \mathrm{m/s}$`,
      String.raw`displacement $= ${texNum($.disp)}\ \mathrm{m}$, distance $= ${texNum($.dist)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'outback',
      setup: (s, $) => {
        s.x0 = 0;
        s.v0 = $.v0;
        s.a = [$.a1, $.a2, $.a3, $.a4];
      },
      read: (c) => ({ vEnd: c.vEnd, disp: c.displacement, dist: c.distance }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.6 gives the method (the change in velocity is the area under a(t), the displacement the area under v(t)) but prints no piecewise example; this case is worked by hand and is the Motion graphs lab’s "Out, back, and out again" scenario', { v0: 6, a1: -3, a2: -3, a3: 3, a4: 3 }, { vEnd: 6, disp: 9, dist: 15 }, {
        note: 'Checked by hand: the stages end at 5.625, 4.5, 3.375 and 9 m, and the cart turns twice.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.integrate',
    src: 'OpenStax University Physics Vol. 1 §3.6',
    title: 'Velocity and position from an acceleration that changes',
    topics: ['kinematics', 'integration'],
    level: 3,
    variety: ['representation'],
    vars: {
      v0: range(2, 10, 1, 'm/s'),
      k: range(0.1, 0.5, 0.05, 'm/s³'),
    },
    derive: ($) => {
      // a = −k t, so v = v0 − k t²/2 and x = v0 t − k t³/6. The boat stops when v = 0.
      const tStop = Math.sqrt((2 * $.v0) / $.k);
      return { v2: $.v0 - ($.k * 4) / 2, tStop, xStop: $.v0 * tStop - ($.k * tStop ** 3) / 6 };
    },
    // Integrate a(t) = −k t with the trapezoid rule, to the stop and to 2 s.
    second: ($) => {
      const tStop = Math.sqrt((2 * $.v0) / $.k);
      const run = (T) => {
        const N = 200000;
        const h = T / N;
        let vel = $.v0;
        let x = 0;
        for (let i = 0; i < N; i += 1) {
          const t = i * h;
          const next = vel + (-$.k * t - $.k * (t + h)) / 2 * h;
          x += 0.5 * (vel + next) * h;
          vel = next;
        }
        return { x, v: vel };
      };
      return { v2: run(2).v, tStop, xStop: run(tStop).x };
    },
    valid: ($) => $.tStop > 2.5,
    text: (T) => `A motorboat moves at a steady ${T.v0} m/s when it starts to slow for the dock. Its acceleration is a(t) = −k t, with k = ${T.k} m/s³ and t = 0 at the start of the slowing. Find its velocity at t = 2.0 s, the time at which it stops, and how far it has gone by then.`,
    parts: [
      num('v2', ($) => $.v2, 'm/s', { label: 'velocity at 2.0 s' }),
      num('tStop', ($) => $.tStop, 's', { label: 'time to stop' }),
      num('xStop', ($) => $.xStop, 'm', { label: 'distance to the stop' }),
    ],
    hints: [
      'The velocity is the integral of the acceleration, plus the starting velocity as the constant of integration.',
      'Set the velocity function to zero and solve for t. The position is the integral of the velocity, starting from x = 0.',
    ],
    steps: ($) => [
      String.raw`$v(t) = v_0 - \tfrac12 k t^2$, so $v(2) = ${texNum($.v2)}\ \mathrm{m/s}$ and $t_{\mathrm{stop}} = \sqrt{2v_0/k} = ${texNum($.tStop)}\ \mathrm{s}$`,
      String.raw`$x(t) = v_0 t - \tfrac16 k t^3$, so $x(t_{\mathrm{stop}}) = ${texNum($.xStop)}\ \mathrm{m}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.6, "Motion of a Motorboat": 5.0 m/s and a(t) = −¼ t m/s³', { v0: 5, k: 0.25 }, { v2: 4.5, tStop: 6.32456, xStop: 21.0819 }, {
        note: 'The book prints 6.3 s and 21.1 m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.chase',
    src: 'OpenStax University Physics Vol. 1 §3.4',
    title: 'A cheetah catches a gazelle',
    topics: ['kinematics', 'constant-acceleration'],
    level: 3,
    variety: ['unknown', 'configuration'],
    vars: {
      vg: range(6, 14, 1, 'm/s'),
      a: range(2, 6, 0.5, 'm/s²'),
      d0: range(0, 40, 10, 'm'),
    },
    derive: ($) => {
      const t = ($.vg + Math.sqrt($.vg * $.vg + 2 * $.a * $.d0)) / $.a;
      return { t, x: $.vg * t + $.d0, vc: $.a * t };
    },
    // Both positions at the answer: the cheetah's and the gazelle's must agree.
    second: ($) => {
      const t = ($.vg + Math.sqrt($.vg * $.vg + 2 * $.a * $.d0)) / $.a;
      const cheetah = 0.5 * $.a * t * t;
      const gazelle = $.d0 + $.vg * t;
      return { t, x: Math.abs(cheetah - gazelle) < 1e-9 * (1 + cheetah) ? cheetah : NaN, vc: $.a * t };
    },
    text: (T) => `A gazelle runs past a hiding cheetah at a steady ${T.vg} m/s, ${T.d0} m ahead of it. At that instant the cheetah starts from rest and speeds up at ${T.a} m/s². Find the time the cheetah takes to catch the gazelle, the cheetah’s displacement by then, and the cheetah’s speed at that moment.`,
    parts: [
      num('t', ($) => $.t, 's', { label: 'time to catch it' }),
      num('x', ($) => $.x, 'm', { label: 'cheetah’s displacement' }),
      num('vc', ($) => $.vc, 'm/s', { label: 'cheetah’s speed when it catches up' }),
    ],
    hints: [
      'Write each animal’s position as a function of time. They are at the same place when the cheetah catches the gazelle.',
      String.raw`Set $\tfrac12 a t^2 = d_0 + v_g t$ and solve for $t$. A quadratic has two roots, and only one is physical.`,
    ],
    steps: ($) => [
      String.raw`$\tfrac12 a t^2 = d_0 + v_g t \Rightarrow t = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`$x = \tfrac12 a t^2 = ${texNum($.x)}\ \mathrm{m}$, $v_c = at = ${texNum($.vc)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.4, "Cheetah Catching a Gazelle": 10 m/s and 4 m/s², no head start', { vg: 10, a: 4, d0: 0 }, { t: 5, x: 50, vc: 20 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.concept-signs',
    src: 'OpenStax University Physics Vol. 1 §3.3',
    title: 'Speeding up or slowing down?',
    kind: 'conceptual',
    level: 1,
    topics: ['kinematics', 'acceleration'],
    variety: ['configuration'],
    vars: {
      sv: choice([1, 'positive'], [-1, 'negative']),
      sa: choice([1, 'positive'], [-1, 'negative']),
    },
    derive: ($) => ({ pace: $.sv * $.sa > 0 ? 'up' : 'down' }),
    second: ($) => ({ pace: Math.sign($.sv) === Math.sign($.sa) ? 'up' : 'down' }),
    text: (T) => `An object moves along a line. At one instant its velocity is ${T.sv} and its acceleration is ${T.sa}, in the same coordinate system. Is it speeding up or slowing down?`,
    parts: [
      mc('pace', ($) => {
        const up = $.sv * $.sa > 0;
        return [
          ['up', 'Speeding up', up ? 'Right: the acceleration points the same way as the velocity, so it adds speed.' : 'The acceleration points against the velocity, so it takes speed away. Speeding up needs the two to have the same sign.'],
          ['down', 'Slowing down', up ? 'The acceleration points the same way as the velocity, so it adds speed. A positive acceleration does not mean speeding up by itself: only the signs of both together do.' : 'Right: the acceleration points against the velocity, so it takes speed away.'],
        ];
      }, ($) => $.pace, { label: 'at that instant' }),
    ],
    hints: [
      'Compare the direction of the acceleration with the direction of the velocity.',
      'Same direction means the speed grows. Opposite directions mean the speed shrinks.',
    ],
    steps: ($) => [String.raw`${$.pace === 'up' ? 'The signs match, so the speed is growing.' : 'The signs are opposite, so the speed is shrinking.'}`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.3, "A Racehorse Leaves the Gate": velocity and acceleration both negative, speeding up', { sv: -1, sa: -1 }, { pace: 'up' }),
      kase('OpenStax University Physics Vol. 1 §3.3: acceleration opposite to the velocity slows the object', { sv: 1, sa: -1 }, { pace: 'down' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.concept-top',
    src: 'OpenStax University Physics Vol. 1 §3.5',
    title: 'A ball thrown straight up',
    kind: 'conceptual',
    level: 2,
    lab: 'kinematics-graphs',
    topics: ['kinematics', 'free-fall'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'its acceleration at the top of the flight, where its velocity is zero'],
        [2, 'its speed when it comes back down to the height it was thrown from, compared with its launch speed'],
        [3, 'the time the fall back to the launch height takes, compared with the time the climb took'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'g-down', 2: 'same', 3: 'same' }[$.q] }),
    second: ($) => ({ ans: { 1: 'g-down', 2: 'same', 3: 'same' }[$.q] }),
    text: (T) => `A ball is thrown straight up and caught at the height it left. Ignore air resistance. Take up as +y. Describe ${T.q}.`,
    parts: [
      mc('ans', ($) => {
        const lists = {
          1: [
            ['zero', 'Zero, because the ball is at rest for an instant', 'The velocity is zero, but it is changing: it goes from up to down. That needs an acceleration. It is −g the whole way.'],
            ['g-down', 'g downward, the same as everywhere else in the flight', 'Right: the acceleration is −g at every instant, including the top, where the velocity is only momentarily zero.'],
            ['g-up', 'g upward, because the ball is stopping', 'The ball’s velocity is upward on the way up, so the change in velocity is downward. The acceleration is always downward.'],
          ],
          2: [
            ['larger', 'Larger, because it has been speeding up on the way down', 'It also lost speed on the way up by exactly the same amount. The two changes cancel at the launch height.'],
            ['same', 'The same', 'Right: the speed lost on the way up is regained on the way down.'],
            ['smaller', 'Smaller, because of the climb', 'The ball lost speed going up and gains the same back coming down. It returns at the launch height with the launch speed.'],
          ],
          3: [
            ['longer', 'Longer than the climb', 'The acceleration is the same −g in both directions, so the speed lost climbing is gained back in the same time.'],
            ['same', 'The same as the climb', 'Right: the same acceleration acts both ways, so the fall mirrors the climb.'],
            ['shorter', 'Shorter than the climb', 'The acceleration is the same −g in both directions, so the fall takes exactly as long as the climb. Air resistance would break the symmetry, and it is left out here.'],
          ],
        };
        return lists[$.q];
      }, ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'The acceleration of a ball in flight is the same all the way, up, at the top, and down. Think about what changes the velocity.',
      'Use v = v₀ − gt on the way up and on the way down.',
    ],
    steps: ($) => [String.raw`${{ 1: 'The acceleration is −g at every instant, including the top.', 2: 'The speed lost on the way up is regained on the way down, so it returns at the launch speed.', 3: 'The climb and the fall have the same acceleration and the same speed change, so they take the same time.' }[$.q]}`],
    sim: { scenario: 'toss', setup: (s) => { s.t0 = 1.5; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.5, "Vertical Motion of a Baseball": the acceleration is 9.8 m/s² downward everywhere, even when the velocity is zero', { q: 1 }, { ans: 'g-down' }),
      kase('OpenStax University Physics Vol. 1 §3.5, "Vertical Motion of a Baseball": it returns with the speed it had when it left', { q: 2 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.concept-table',
    src: 'OpenStax University Physics Vol. 1 §3.2',
    title: 'Reading a position table',
    kind: 'conceptual',
    level: 2,
    topics: ['kinematics', 'average'],
    variety: ['representation', 'unknown'],
    vars: {
      tab: choice([1, '0, 4, 6, 6, 3'], [2, '3, 3, 7, 9, 6'], [3, '5, 2, 8, 8, 9']),
      q: choice([1, 'moving fastest'], [2, 'moving in the negative direction'], [3, 'at rest']),
    },
    derive: ($) => ({ ans: pickInterval(TABLES[$.tab], $.q) }),
    // Rank the intervals by the size and sign of Δx over Δt, written out interval by interval.
    second: ($) => {
      const xs = TABLES[$.tab];
      const slopes = [0, 1, 2, 3].map((i) => xs[i + 1] - xs[i]);
      let best = 0;
      if ($.q === 1) best = slopes.reduce((bi, s, i, all) => (Math.abs(s) > Math.abs(all[bi]) ? i : bi), 0);
      if ($.q === 2) best = slopes.findIndex((s) => s < 0);
      if ($.q === 3) best = slopes.findIndex((s) => s === 0);
      return { ans: String(best) };
    },
    valid: () => true,
    text: (T) => `An object’s positions along a line, in meters, at t = 0, 1, 2, 3 and 4 s are ${T.tab}. During which one-second interval is it ${T.q}?`,
    parts: [
      mc('ans', ($) => {
        const xs = TABLES[$.tab];
        const right = pickInterval(xs, $.q);
        return [0, 1, 2, 3].map((i) => {
          const dx = xs[i + 1] - xs[i];
          return [String(i), `${i} s to ${i + 1} s`, String(i) === right ? `Right: the position changes by ${dx} m in that interval, so the velocity there is ${dx} m/s.` : `In that interval the position changes by ${dx} m, so the velocity is ${dx} m/s. That is not the one the question asks for.`];
        });
      }, ($) => $.ans, { label: 'the interval' }),
    ],
    hints: [
      'The velocity in an interval is the change in position over the one second it takes.',
      'Moving fastest is the largest size of velocity, whatever its sign. Moving in the negative direction means a negative change in position. At rest means no change.',
    ],
    steps: ($) => [String.raw`The changes in position are $${[0, 1, 2, 3].map((i) => TABLES[$.tab][i + 1] - TABLES[$.tab][i]).join(',\ ')}\ \mathrm{m}$ in the four seconds.`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §3.2: the velocity is the slope of position against time, found interval by interval', { tab: 1, q: 1 }, { ans: '0' }),
      kase('OpenStax University Physics Vol. 1 §3.2: a flat stretch of the position graph is zero velocity', { tab: 1, q: 3 }, { ans: '2' }),
    ],
  }),
];
