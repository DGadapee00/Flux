/** Ch 3 · Motion along a straight line. OpenStax University Physics Vol. 1, §§3.1–3.5. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { averageVelocity, constAccel1D, speedFromDisplacement, timeAtSpeed } from '@flux/subjects/mechanics/kinematics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { gravitationalEnergy, kineticEnergy, speedFromEnergy } from '@flux/subjects/mechanics/energy.js';
import { trap1D } from '../integrate.js';
import { kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u1', ch: '3' };

/** At the initial instant: speeding up, slowing down, or neither. */
function pace($) {
  if (Math.abs($.a) < 1e-12) return 'neither';
  if (Math.abs($.v0) < 1e-12) return 'up';
  return $.v0 * $.a > 0 ? 'up' : 'down';
}

export default [
  problem({
    ...U,
    id: 'ch3.average',
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
      kase('hand', { xa: 0, xb: 80, xc: 20, t1: 16, t2: 12 }, { vAvg: 0.714286, speed: 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.const',
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
      kase('hand', { x0: 0, v0: 4, a: 1.5, t: 6 }, { x: 51, v: 13, pace: 'up' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.stop',
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
    cases: [
      kase('hand', { v0: 20, a: -4 }, { t: 5, x: 50 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.drop',
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
      kase('hand', { h: 20 }, { v: 19.8091, t: 2.01928 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch3.toss',
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
      kase('hand', { v0: 18 }, { h: 16.5138, tTop: 1.83486, tBack: 3.66972 }),
    ],
  }),
];
