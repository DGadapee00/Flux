/** Ch 4 · Motion in two and three dimensions. OpenStax University Physics Vol. 1, §§4.3–4.5. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { centripetalAccel, circularPeriod, projectile } from '@flux/subjects/mechanics/kinematics.js';
import { kineticEnergy, speedFromEnergy } from '@flux/subjects/mechanics/energy.js';
import { add, angle2D, fromAngle2D, mag, v } from '@flux/subjects/mechanics/vectors.js';
import { trapFlight } from '../integrate.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u2', ch: '4' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch4.level',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'Projectile on level ground',
    topics: ['kinematics', 'projectile'],
    vars: {
      v0: range(8, 40, 1, 'm/s'),
      theta: range(15, 75, 5, '°'),
    },
    derive: ($) => {
      const shot = projectile({ v0: $.v0, thetaDeg: $.theta, g: G });
      return { R: shot.range, h: shot.hMax, t: shot.tFlight };
    },
    // The level-ground formulas, against the vector flight's landing root.
    second: ($) => {
      const th = $.theta * DEG;
      const vy = $.v0 * Math.sin(th);
      return {
        R: ($.v0 * $.v0 * Math.sin(2 * th)) / G,
        h: (vy * vy) / (2 * G),
        t: (2 * vy) / G,
      };
    },
    text: (T) => `A projectile is launched from level ground at ${T.v0} m/s and ${T.theta}° above the horizontal. Take g = ${G} m/s² and ignore air resistance. Find the range, the maximum height, and the time of flight.`,
    parts: [
      num('R', ($) => $.R, 'm', { label: 'range' }),
      num('h', ($) => $.h, 'm', { label: 'maximum height' }),
      num('t', ($) => $.t, 's', { label: 'time of flight' }),
    ],
    hints: [
      String.raw`The horizontal velocity is constant. The vertical motion is free fall with $v_{0y} = v_0\sin\theta$.`,
      String.raw`On level ground, $R = v_0^2\sin 2\theta\,/\,g$.`,
    ],
    steps: ($) => [
      String.raw`$R = v_0^2\sin 2\theta\,/\,g = ${texNum($.R)}\ \mathrm{m}$`,
      String.raw`$h = v_0^2\sin^2\theta\,/\,(2g) = ${texNum($.h)}\ \mathrm{m}$, and $t = 2 v_0\sin\theta\,/\,g = ${texNum($.t)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { v0: 12, theta: 30 }, { R: 12.7123, h: 1.83486, t: 1.22324 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.cliff',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'Horizontal launch from a cliff',
    topics: ['kinematics', 'projectile'],
    vars: {
      h: range(5, 50, 1, 'm'),
      v: range(2, 25, 1, 'm/s'),
    },
    derive: ($) => {
      const shot = projectile({ v0: $.v, thetaDeg: 0, y0: $.h, g: G });
      return { t: shot.tFlight, R: shot.range, speed: shot.land.speed };
    },
    second: ($) => {
      const t = Math.sqrt((2 * $.h) / G);
      const speed = speedFromEnergy({
        mass: 1,
        k0: kineticEnergy(1, $.v),
        u0: $.h * G,
        u: 0,
      });
      return { t, R: $.v * t, speed };
    },
    text: (T) => `A ball rolls off a horizontal ledge ${T.h} m above the ground at ${T.v} m/s. Take g = ${G} m/s² and ignore air resistance. Find the time to the ground, the horizontal distance, and the speed at impact.`,
    parts: [
      num('t', ($) => $.t, 's', { label: 'time' }),
      num('R', ($) => $.R, 'm', { label: 'horizontal distance' }),
      num('speed', ($) => $.speed, 'm/s', { label: 'impact speed' }),
    ],
    hints: [
      'The horizontal velocity never changes. The vertical motion is a drop from rest.',
      'The impact speed also follows from energy: the lost height becomes kinetic energy.',
    ],
    steps: ($) => [
      String.raw`$t = \sqrt{2h/g} = ${texNum($.t)}\ \mathrm{s}$, so $R = vt = ${texNum($.R)}\ \mathrm{m}$`,
      String.raw`$v = \sqrt{v_0^2 + 2gh} = ${texNum($.speed)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { h: 45, v: 8 }, { t: 3.02891, R: 24.2313, speed: 30.7717 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.later',
    src: 'OpenStax University Physics Vol. 1 §4.3',
    title: 'Projectile position at a given time',
    topics: ['kinematics', 'projectile'],
    vars: {
      v0: range(25, 40, 1, 'm/s'),
      theta: range(30, 60, 5, '°'),
      t: range(0.4, 1.6, 0.2, 's'),
    },
    derive: ($) => {
      const s = projectile({ v0: $.v0, thetaDeg: $.theta, g: G }).state($.t);
      return { x: s.x, y: s.y, vx: s.vx, vy: s.vy };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const moved = trapFlight({
        v0x: $.v0 * Math.cos(th),
        v0y: $.v0 * Math.sin(th),
        g: G,
        t: $.t,
      });
      return { x: moved.x, y: moved.y, vx: moved.vx, vy: moved.vy };
    },
    valid: ($) => projectile({ v0: $.v0, thetaDeg: $.theta, g: G }).tFlight > $.t + 0.05,
    text: (T) => `A projectile leaves level ground at ${T.v0} m/s and ${T.theta}° above the horizontal. Take g = ${G} m/s² and ignore air resistance. Find its position and velocity components after ${T.t} s.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: String.raw`$x$` }),
      num('y', ($) => $.y, 'm', { label: String.raw`$y$` }),
      num('vx', ($) => $.vx, 'm/s', { label: String.raw`$v_x$` }),
      num('vy', ($) => $.vy, 'm/s', { label: String.raw`$v_y$` }),
    ],
    hints: [
      String.raw`$v_x$ stays $v_0\cos\theta$. $v_y = v_0\sin\theta - gt$.`,
    ],
    steps: ($) => [
      String.raw`$x = ${texNum($.x)}\ \mathrm{m}$, $y = ${texNum($.y)}\ \mathrm{m}$`,
      String.raw`$v_x = ${texNum($.vx)}\ \mathrm{m/s}$, $v_y = ${texNum($.vy)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('hand', { v0: 30, theta: 40, t: 1 }, {
        x: 22.9813, y: 14.3786, vx: 22.9813, vy: 9.47363,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.circle',
    src: 'OpenStax University Physics Vol. 1 §4.4',
    title: 'Uniform circular motion',
    topics: ['kinematics', 'circular'],
    vars: {
      v: range(2, 20, 0.5, 'm/s'),
      r: range(1, 15, 0.5, 'm'),
    },
    derive: ($) => ({
      a: centripetalAccel($.v, $.r),
      T: circularPeriod($.v, $.r),
    }),
    // ω² r and 2π/ω, against v²/r and 2πr/v.
    second: ($) => {
      const omega = $.v / $.r;
      return { a: omega * omega * $.r, T: (2 * Math.PI) / omega };
    },
    text: (T) => `A particle moves in a circle of radius ${T.r} m at a constant speed of ${T.v} m/s. Find the centripetal acceleration and the period.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'centripetal acceleration' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      String.raw`$a = v^2/r = \omega^2 r$, and one lap takes $2\pi r/v$.`,
    ],
    steps: ($) => [
      String.raw`$a = v^2/r = ${texNum($.a)}\ \mathrm{m/s}^2$`,
      String.raw`$T = 2\pi r/v = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    cases: [
      kase('hand', { v: 12, r: 8 }, { a: 18, T: 4.18879 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch4.river',
    src: 'OpenStax University Physics Vol. 1 §4.5',
    title: 'Boat in a current',
    topics: ['kinematics', 'relative-velocity'],
    vars: {
      vb: range(4, 12, 0.5, 'm/s'),
      vc: range(0.5, 4, 0.5, 'm/s'),
    },
    derive: ($) => {
      const ground = add(fromAngle2D($.vb, 0), v(0, $.vc, 0));
      const vStraight = Math.sqrt($.vb * $.vb - $.vc * $.vc);
      return {
        speed: mag(ground),
        heading: angle2D(ground),
        phi: (Math.asin($.vc / $.vb) / DEG),
        vStraight,
      };
    },
    second: ($) => {
      const vStraight = Math.sqrt($.vb * $.vb - $.vc * $.vc);
      return {
        speed: Math.hypot($.vb, $.vc),
        heading: (Math.atan2($.vc, $.vb) / DEG + 360) % 360,
        phi: Math.atan2($.vc, vStraight) / DEG,
        vStraight,
      };
    },
    valid: ($) => $.vb >= $.vc + 1 && $.vStraight > 0.5,
    text: (T) => `A boat's speed in still water is ${T.vb} m/s. A current of ${T.vc} m/s runs due north. If the boat points due east, find its ground speed and the direction of that velocity, measured counterclockwise from east. Then find the heading south of east that makes the ground track due east, and the ground speed on that track.`,
    parts: [
      num('speed', ($) => $.speed, 'm/s', { label: 'ground speed, pointed east' }),
      num('heading', ($) => $.heading, '°', { label: 'direction from east', abs: 0.05 }),
      num('phi', ($) => $.phi, '°', { label: 'heading south of east', abs: 0.05 }),
      num('vStraight', ($) => $.vStraight, 'm/s', { label: 'ground speed, straight across' }),
    ],
    hints: [
      'Velocities add as vectors. To cancel the current, the boat needs a southward component equal to the current.',
    ],
    steps: ($) => [
      String.raw`Pointed east: speed $${texNum($.speed)}\ \mathrm{m/s}$ at $${texNum($.heading)}^\circ$ north of east.`,
      String.raw`Aimed $${texNum($.phi)}^\circ$ south of east, the ground speed is $${texNum($.vStraight)}\ \mathrm{m/s}$ due east.`,
    ],
    cases: [
      kase('hand', { vb: 5, vc: 3 }, { speed: 5.83095, heading: 30.9638, phi: 36.8699, vStraight: 4 }),
    ],
  }),
];
