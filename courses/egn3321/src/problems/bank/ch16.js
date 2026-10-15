import { ladder, relativeVelocity, rollContact, rollingPoint, sliderCrank } from '@flux/subjects/mechanics/rigid2d.js';
import { kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function constraint(r, l, theta) {
  const s = (r / l) * Math.sin(theta);
  if (!(l > 0) || Math.abs(s) > 1) return NaN;
  return r * Math.cos(theta) + l * Math.sqrt(1 - s * s);
}

function sliderStep($, t) {
  const th = $.theta * DEG;
  const ang = th + $.omega * t + 0.5 * ($.alpha || 0) * t * t;
  return constraint($.r, $.l, ang);
}

function sliderDiff($) {
  const h = 1e-5;
  const x0 = sliderStep($, 0);
  return {
    x: x0,
    v: (sliderStep($, h) - sliderStep($, -h)) / (2 * h),
    a: (sliderStep($, h) - 2 * x0 + sliderStep($, -h)) / (h * h),
  };
}

function rotate(x, y, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: c * x - s * y, y: s * x + c * y };
}

function rimFromCycloid($) {
  const phi = $.phi * DEG;
  const w = $.v / $.R;
  const h = 1e-5;
  const x = (p) => $.R * (p - Math.sin(p));
  const y = (p) => $.R * (1 - Math.cos(p));
  const vx = (x(phi + w * h) - x(phi - w * h)) / (2 * h);
  const vy = (y(phi + w * h) - y(phi - w * h)) / (2 * h);
  return Math.hypot(vx, vy);
}

const ch16 = [
  problem({
    id: 'u5.16.belt',
    title: 'Open belt',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.3',
    topics: ['belt'],
    vars: {
      r1: range(0.05, 0.4, 0.05, 'm'),
      r2: range(0.1, 0.8, 0.05, 'm'),
      w1: range(4, 40, 2, 'rad/s'),
    },
    text: (T) => String.raw`An open belt joins pulleys of radii ${T.r1} m and ${T.r2} m. The driver turns at ${T.w1} rad/s. Find the belt speed and the driven angular velocity.`,
    parts: [
      num('speed', ($) => rollContact($.r1, $.w1, $.r2).speed, 'm/s', { label: 'belt speed' }),
      num('omega', ($) => rollContact($.r1, $.w1, $.r2).omega2, 'rad/s', { label: 'driven angular velocity' }),
    ],
    hints: ['The belt speed is the driver radius times its angular velocity. The driven pulley shares that speed, in the same sense.'],
    steps: ($, sig) => {
      const row = rollContact($.r1, $.w1, $.r2);
      return [
        String.raw`Belt speed: $r_1\omega_1 = ${sig(row.speed)}\ \mathrm{m/s}$.`,
        String.raw`The driven pulley turns the same way: $\omega_2 = ${sig(row.omega2)}\ \mathrm{rad/s}$.`,
      ];
    },
    second: ($) => {
      const arc = $.r1 * $.w1;
      return { speed: Math.abs(arc), omega: arc / $.r2 };
    },
    cases: [kase('Hibbeler §16.3', { r1: 0.15, r2: 0.3, w1: 20 }, { speed: 3, omega: 10 })],
  }),

  problem({
    id: 'u5.16.gears',
    title: 'External gears',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.3',
    topics: ['gears'],
    vars: {
      r1: range(0.05, 0.3, 0.05, 'm'),
      r2: range(0.1, 0.6, 0.05, 'm'),
      w1: range(2, 20, 1, 'rad/s'),
      a1: range(0.5, 8, 0.5, 'rad/s²'),
    },
    text: (T) => String.raw`Two external gears have pitch radii ${T.r1} m and ${T.r2} m. The driver turns at ${T.w1} rad/s and its angular acceleration is ${T.a1} rad/s². Find the driven angular velocity and angular acceleration.`,
    parts: [
      num('omega', ($) => rollContact($.r1, $.w1, $.r2, { external: true }).omega2, 'rad/s', { label: 'driven angular velocity' }),
      num('alpha', ($) => rollContact($.r1, $.w1, $.r2, { external: true }).ratio * $.a1, 'rad/s²', { label: 'driven angular acceleration' }),
    ],
    hints: ['External gears reverse the sense. The pitch line has one speed and one tangential acceleration.'],
    steps: ($, sig) => {
      const ratio = $.r1 / $.r2;
      return [
        String.raw`Pitch-line speed: $r_1\omega_1 = ${sig($.r1 * $.w1)}\ \mathrm{m/s}$.`,
        String.raw`The driven gear turns the other way: $\omega_2 = ${sig(-ratio * $.w1)}\ \mathrm{rad/s}$.`,
        String.raw`$\alpha_2 = ${sig(-ratio * $.a1)}\ \mathrm{rad/s^2}$.`,
      ];
    },
    second: ($) => {
      const pitchV = $.r1 * $.w1;
      const pitchA = $.r1 * $.a1;
      return { omega: -pitchV / $.r2, alpha: -pitchA / $.r2 };
    },
    cases: [kase('Hibbeler §16.3', { r1: 0.1, r2: 0.25, w1: 8, a1: 2 }, { omega: -3.2, alpha: -0.8 })],
  }),

  problem({
    id: 'u5.16.pulley-ft',
    title: 'Pulley in US customary units',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.3',
    topics: ['belt'],
    vars: {
      r1: range(0.25, 2, 0.25, 'ft'),
      r2: range(0.5, 4, 0.25, 'ft'),
      w1: range(2, 20, 1, 'rad/s'),
    },
    text: (T) => String.raw`An open belt joins pulleys of radii ${T.r1} ft and ${T.r2} ft. The driver turns at ${T.w1} rad/s. Find the belt speed and the driven angular velocity.`,
    parts: [
      num('speed', ($) => Math.abs($.r1 * $.w1), 'ft/s', { label: 'belt speed' }),
      num('omega', ($) => rollContact($.r1, $.w1, $.r2).omega2, 'rad/s', { label: 'driven angular velocity' }),
    ],
    hints: ['Work in feet and radians per second. An open belt does not reverse the rotation.'],
    steps: ($, sig) => [
      String.raw`Belt speed: $r_1\omega_1 = ${sig($.r1 * $.w1)}\ \mathrm{ft/s}$.`,
      String.raw`$\omega_2 = (r_1/r_2)\omega_1 = ${sig(($.r1 / $.r2) * $.w1)}\ \mathrm{rad/s}$.`,
    ],
    second: ($) => {
      const arc = $.r1 * $.w1;
      return { speed: Math.abs(arc), omega: arc / $.r2 };
    },
    cases: [kase('Hibbeler §16.3', { r1: 0.5, r2: 1.5, w1: 12 }, { speed: 6, omega: 4 })],
  }),

  problem({
    id: 'u5.16.absolute',
    title: 'Slider position and speed',
    exam: 'u5',
    ch: '16',
    lab: 'slider-crank',
    src: 'Hibbeler §16.4',
    topics: ['absolute'],
    vars: {
      r: range(0.1, 0.3, 0.05, 'm'),
      l: range(0.6, 1.2, 0.1, 'm'),
      theta: range(0, 180, 15, 'deg'),
      omega: range(2, 16, 2, 'rad/s'),
    },
    text: (T) => String.raw`A crank of radius ${T.r} m and a rod of length ${T.l} m drive a slider. The crank angle is ${T.theta}° and $\omega = ${T.omega}$ rad/s. $\alpha = 0$. Find the slider position and velocity.`,
    parts: [
      num('x', ($) => sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: 0 }).x, 'm', { label: 'slider position' }),
      num('v', ($) => sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: 0 }).v, 'm/s', { label: 'slider velocity' }),
    ],
    hints: ['Write the slider coordinate from the crank angle and the rod angle. Differentiate that coordinate.'],
    steps: ($, sig) => {
      const row = sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: 0 });
      return [
        String.raw`$\sin\phi=(r/\ell)\sin\theta$, and $x=${sig(row.x)}\ \mathrm{m}$.`,
        String.raw`Differentiating $x$ gives $v=${sig(row.v)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => {
      const row = sliderDiff({ ...$, alpha: 0 });
      return { x: row.x, v: row.v };
    },
    sim: {
      scenario: 'mid',
      setup(s, $) {
        s.r = $.r;
        s.l = $.l;
        s.theta = $.theta;
        s.omega = $.omega;
        s.alpha = 0;
      },
      read: (c) => ({ x: c.x, v: c.v }),
    },
    cases: [kase('Hibbeler §16.4', { r: 0.2, l: 0.8, theta: 90, omega: 10 }, { x: 0.8 * Math.sqrt(0.9375), v: -2 })],
  }),

  problem({
    id: 'u5.16.bar',
    title: 'Relative velocity of a bar',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.5',
    topics: ['relative'],
    vars: {
      vax: range(-4, 4, 0.5, 'm/s'),
      vay: range(-4, 4, 0.5, 'm/s'),
      omega: range(-6, 6, 0.5, 'rad/s'),
      rx: range(-1, 1, 0.1, 'm'),
      ry: range(-1, 1, 0.1, 'm'),
    },
    text: (T) => String.raw`Point A of a rigid bar has velocity $(${T.vax},\,${T.vay})$ m/s. Point B is at $\vec r_{B/A}=(${T.rx},\,${T.ry})$ m, and $\omega=${T.omega}$ rad/s. Find the velocity of B.`,
    parts: [
      num('vx', ($) => relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 }).x, 'm/s', { label: 'x component of v_B' }),
      num('vy', ($) => relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 }).y, 'm/s', { label: 'y component of v_B' }),
    ],
    hints: ['Add omega cross r to the velocity of A. That cross product is perpendicular to the bar.'],
    steps: ($, sig) => {
      const row = relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 });
      return [
        String.raw`$\omega\times\vec r = (${sig(-$.omega * $.ry)},\,${sig($.omega * $.rx)})$ m/s.`,
        String.raw`$\vec v_B = (${sig(row.x)},\,${sig(row.y)})$ m/s.`,
      ];
    },
    second: ($) => {
      const h = 1e-6;
      const ahead = rotate($.rx, $.ry, $.omega * h);
      const back = rotate($.rx, $.ry, -$.omega * h);
      return {
        vx: $.vax + (ahead.x - back.x) / (2 * h),
        vy: $.vay + (ahead.y - back.y) / (2 * h),
      };
    },
    cases: [kase('Hibbeler §16.5', { vax: 1, vay: 0.5, omega: 2, rx: 0.4, ry: 0.3 }, { vx: 0.4, vy: 1.3 })],
  }),

  problem({
    id: 'u5.16.ladder',
    title: 'Ladder and its instantaneous centre',
    exam: 'u5',
    ch: '16',
    lab: 'ic',
    src: 'Hibbeler §16.6',
    topics: ['ic'],
    vars: {
      L: range(2, 8, 0.5, 'm'),
      theta: range(20, 75, 5, 'deg'),
      v: range(0.5, 4, 0.5, 'm/s'),
    },
    text: (T) => String.raw`A ladder of length ${T.L} m leans on a wall. The angle with the floor is ${T.theta}°. The foot moves away from the wall at ${T.v} m/s. Find $\omega$ and the downward speed of the top.`,
    parts: [
      num('omega', ($) => ladder($.L, $.theta, $.v).omega, 'rad/s', { label: 'angular velocity' }),
      num('vTop', ($) => ladder($.L, $.theta, $.v).down, 'm/s', { label: 'downward speed of the top' }),
    ],
    hints: ['The instantaneous centre is the corner across from the ladder. Divide the foot speed by the height of the top.'],
    steps: ($, sig) => {
      const row = ladder($.L, $.theta, $.v);
      return [
        String.raw`$\omega = v/(L\sin\theta) = ${sig(row.omega)}\ \mathrm{rad/s}$.`,
        String.raw`The top falls at $v/\tan\theta = ${sig(row.down)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => {
      const th = $.theta * DEG;
      const thetaDot = -$.v / ($.L * Math.sin(th));
      const h = 1e-5;
      const y = (t) => $.L * Math.sin(th + thetaDot * t);
      return { omega: -thetaDot, vTop: -((y(h) - y(-h)) / (2 * h)) };
    },
    sim: {
      scenario: 'ladder',
      setup(s, $) {
        s.length = $.L;
        s.theta = $.theta;
        s.foot = $.v;
      },
      read: (c) => ({ omega: c.omega, vTop: c.speed }),
    },
    cases: [kase('Hibbeler §16.6', { L: 4, theta: 60, v: 2 }, { omega: 1 / Math.sqrt(3), vTop: 2 / Math.sqrt(3) })],
  }),

  problem({
    id: 'u5.16.wheel',
    title: 'Rolling wheel',
    exam: 'u5',
    ch: '16',
    lab: 'rolling',
    src: 'Hibbeler §16.6',
    topics: ['rolling'],
    vars: {
      R: range(0.2, 1, 0.1, 'm'),
      v: range(0.5, 5, 0.5, 'm/s'),
      phi: range(0, 180, 15, 'deg'),
    },
    text: (T) => String.raw`A wheel of radius ${T.R} m rolls without slip at ${T.v} m/s. A mark on the rim is ${T.phi}° clockwise from the contact point. Find the speed of the mark and the speed of the top point.`,
    parts: [
      num('speed', ($) => rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG }).speed, 'm/s', { label: 'speed of the mark' }),
      num('vTop', ($) => rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG }).vTop, 'm/s', { label: 'speed of the top point' }),
    ],
    hints: ['The contact point is the instantaneous centre. The top is two radii away, so it moves at twice the centre speed.'],
    steps: ($, sig) => {
      const row = rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG });
      return [
        String.raw`The mark moves at ${sig(row.speed)} m/s.`,
        String.raw`The top moves at $2v = ${sig(row.vTop)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => ({ speed: rimFromCycloid($), vTop: 2 * $.v }),
    sim: {
      scenario: 'contact',
      setup(s, $) {
        s.radius = $.R;
        s.speed = $.v;
        s.phi = $.phi;
      },
      read: (c) => ({ speed: c.speed, vTop: c.vTop }),
    },
    cases: [kase('Hibbeler §16.6', { R: 0.4, v: 2, phi: 0 }, { speed: 0, vTop: 4 })],
  }),

  problem({
    id: 'u5.16.accel',
    title: 'Slider acceleration',
    exam: 'u5',
    ch: '16',
    lab: 'slider-crank',
    src: 'Hibbeler §16.7',
    topics: ['acceleration'],
    vars: {
      r: range(0.1, 0.3, 0.05, 'm'),
      l: range(0.6, 1.2, 0.1, 'm'),
      theta: range(0, 180, 15, 'deg'),
      omega: range(2, 16, 2, 'rad/s'),
      alpha: range(-8, 8, 2, 'rad/s²'),
    },
    text: (T) => String.raw`A crank of radius ${T.r} m and a rod of length ${T.l} m drive a slider. The crank is at ${T.theta}°, with $\omega=${T.omega}$ rad/s and $\alpha=${T.alpha}$ rad/s². Find the slider acceleration.`,
    parts: [
      num('a', ($) => sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: $.alpha }).a, 'm/s²', { label: 'slider acceleration' }),
    ],
    hints: ['Differentiate the slider position a second time. Zero velocity at a dead centre does not make the acceleration zero.'],
    steps: ($, sig) => {
      const row = sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: $.alpha });
      return [
        String.raw`$a_B = a_A + \alpha\times r - \omega^2 r$.`,
        String.raw`The slider acceleration is ${sig(row.a)} m/s².`,
      ];
    },
    second: ($) => ({ a: sliderDiff($).a }),
    sim: {
      scenario: 'extended',
      setup(s, $) {
        s.r = $.r;
        s.l = $.l;
        s.theta = $.theta;
        s.omega = $.omega;
        s.alpha = $.alpha;
      },
      read: (c) => ({ a: c.a }),
    },
    cases: [kase('Hibbeler §16.7', { r: 0.2, l: 0.8, theta: 0, omega: 10, alpha: 0 }, { a: -25 })],
  }),
];

export default ch16;
