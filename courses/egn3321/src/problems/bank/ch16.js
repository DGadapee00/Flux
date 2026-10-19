import { ladder, relativeVelocity, rollContact, rollingPoint, sliderCrank } from '@flux/subjects/mechanics/rigid2d.js';
import { choice, kase, num, problem, range } from '../kit.js';

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

/** A rotor of radius r turning counterclockwise at w, on a base flying along +x. The blade's angle is measured from +x. */
const BLADE_DEG = { adv: 270, ret: 90 };
function rotorTip($) {
  const th = BLADE_DEG[$.blade] * DEG;
  const vx = $.vB - $.r * $.w * Math.sin(th);
  const vy = $.r * $.w * Math.cos(th);
  const ax = $.aB - $.r * $.w * $.w * Math.cos(th);
  const ay = -$.r * $.w * $.w * Math.sin(th);
  return { vx, vy, ax, ay, speed: Math.hypot(vx, vy), accel: Math.hypot(ax, ay) };
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
    // Structure: an open belt keeps the sense of rotation; a crossed belt reverses it.
    vars: {
      belt: choice(['open', 'An open belt'], ['crossed', 'A crossed belt']),
      r1: range(0.05, 0.4, 0.05, 'm'),
      r2: range(0.1, 0.8, 0.05, 'm'),
      w1: range(4, 40, 2, 'rad/s'),
    },
    valid: ($) => Math.abs($.r1 - $.r2) > 1e-9,
    text: (T) => String.raw`${T.belt} joins pulleys of radii ${T.r1} m and ${T.r2} m. The driver turns at ${T.w1} rad/s, counterclockwise. Find the belt speed and the driven angular velocity, counterclockwise positive.`,
    parts: [
      num('speed', ($) => rollContact($.r1, $.w1, $.r2, { external: $.belt === 'crossed' }).speed, 'm/s', { label: 'belt speed' }),
      num('omega', ($) => rollContact($.r1, $.w1, $.r2, { external: $.belt === 'crossed' }).omega2, 'rad/s', { label: 'driven angular velocity' }),
    ],
    level: 1,
    hints: ['The belt speed is the driver radius times its angular velocity. The driven pulley shares that rim speed.',
      "The driven angular velocity is the belt speed divided by the driven radius. An open belt keeps the sense; a crossed belt reverses it.",
    ],
    steps: ($, sig) => {
      const row = rollContact($.r1, $.w1, $.r2, { external: $.belt === 'crossed' });
      return [
        String.raw`Belt speed: $r_1\omega_1 = ${sig(row.speed)}\ \mathrm{m/s}$.`,
        $.belt === 'crossed'
          ? String.raw`The crossed belt reverses the sense: $\omega_2 = -(r_1/r_2)\,\omega_1 = ${sig(row.omega2)}\ \mathrm{rad/s}$.`
          : String.raw`The driven pulley turns the same way: $\omega_2 = (r_1/r_2)\,\omega_1 = ${sig(row.omega2)}\ \mathrm{rad/s}$.`,
      ];
    },
    second: ($) => {
      // The belt leaves the driver's rim at r1 ω1; follow it round to the driven rim.
      const arc = $.r1 * $.w1;
      const sense = $.belt === 'crossed' ? -1 : 1;
      return { speed: Math.abs(arc), omega: (sense * arc) / $.r2 };
    },
    cases: [kase('Hibbeler §16.3', { belt: 'open', r1: 0.15, r2: 0.3, w1: 20 }, { speed: 3, omega: 10 })],
  }),

  problem({
    id: 'u5.16.gears',
    title: 'External gears',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.3',
    topics: ['gears'],
    // Structure: two external gears reverse the sense; a pinion inside a ring gear keeps it.
    vars: {
      mesh: choice(['external', 'Two external gears'], ['internal', 'A pinion inside a ring gear']),
      r1: range(0.05, 0.3, 0.05, 'm'),
      r2: range(0.1, 0.6, 0.05, 'm'),
      w1: range(2, 20, 1, 'rad/s'),
      a1: range(0.5, 8, 0.5, 'rad/s²'),
    },
    valid: ($) => ($.mesh === 'internal' ? $.r2 > $.r1 + 0.04 : Math.abs($.r1 - $.r2) > 1e-9) && Math.abs($.w1 - $.a1) > 1e-9,
    text: (T, $) => String.raw`${$.mesh === 'internal' ? `A pinion of pitch radius ${T.r1} m drives a ring gear of pitch radius ${T.r2} m from inside.` : `Two external gears have pitch radii ${T.r1} m (the driver) and ${T.r2} m.`} The driver turns at ${T.w1} rad/s and its angular acceleration is ${T.a1} rad/s². Find the driven angular velocity and angular acceleration.`,
    parts: [
      num('omega', ($) => rollContact($.r1, $.w1, $.r2, { external: $.mesh === 'external' }).omega2, 'rad/s', { label: 'driven angular velocity' }),
      num('alpha', ($) => rollContact($.r1, $.w1, $.r2, { external: $.mesh === 'external' }).ratio * $.a1, 'rad/s²', { label: 'driven angular acceleration' }),
    ],
    level: 2,
    hints: ['The pitch circles roll on each other: one speed and one tangential acceleration where they touch.',
      "External gears reverse the sense; a ring gear turns the same way as its pinion. Use the same radius ratio, and the same sign, for the angular acceleration.",
    ],
    steps: ($, sig) => {
      const ratio = (($.mesh === 'external' ? -1 : 1) * $.r1) / $.r2;
      return [
        String.raw`Pitch-line speed: $r_1\omega_1 = ${sig($.r1 * $.w1)}\ \mathrm{m/s}$.`,
        $.mesh === 'external'
          ? String.raw`The driven gear turns the other way: $\omega_2 = -(r_1/r_2)\,\omega_1 = ${sig(ratio * $.w1)}\ \mathrm{rad/s}$.`
          : String.raw`The teeth touch on the inside of the ring, so it turns the same way: $\omega_2 = (r_1/r_2)\,\omega_1 = ${sig(ratio * $.w1)}\ \mathrm{rad/s}$.`,
        String.raw`$\alpha_2 = ${sig(ratio * $.a1)}\ \mathrm{rad/s^2}$.`,
      ];
    },
    second: ($) => {
      // The contact point, from each centre: the pinion's ω × r must match the driven gear's.
      // External: the contact is on the far side of the driven centre; internal: the same side.
      const side = $.mesh === 'external' ? -1 : 1;
      const pitchV = $.r1 * $.w1;
      const pitchA = $.r1 * $.a1;
      return { omega: (side * pitchV) / $.r2, alpha: (side * pitchA) / $.r2 };
    },
    cases: [kase('Hibbeler §16.3', { mesh: 'external', r1: 0.1, r2: 0.25, w1: 8, a1: 2 }, { omega: -3.2, alpha: -0.8 })],
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
    valid: ($) => Math.abs($.r1 - $.r2) > 1e-9,
    text: (T) => String.raw`An open belt joins pulleys of radii ${T.r1} ft and ${T.r2} ft. The driver turns at ${T.w1} rad/s. Find the belt speed and the driven angular velocity.`,
    parts: [
      num('speed', ($) => Math.abs($.r1 * $.w1), 'ft/s', { label: 'belt speed' }),
      num('omega', ($) => rollContact($.r1, $.w1, $.r2).omega2, 'rad/s', { label: 'driven angular velocity' }),
    ],
    level: 1,
    hints: ['Work in feet and radians per second. An open belt does not reverse the rotation.',
      "The belt speed is the driver radius in feet times omega in rad/s. Divide by the driven radius for its angular velocity.",
    ],
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
    valid: ($) => $.theta % 180 !== 0,
    text: (T) => String.raw`A crank of radius ${T.r} m and a rod of length ${T.l} m drive a slider. The crank angle is ${T.theta}° and $\omega = ${T.omega}$ rad/s. $\alpha = 0$. Find the slider position and velocity.`,
    parts: [
      num('x', ($) => sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: 0 }).x, 'm', { label: 'slider position' }),
      num('v', ($) => sliderCrank({ r: $.r, l: $.l, theta: $.theta * DEG, omega: $.omega, alpha: 0 }).v, 'm/s', { label: 'slider velocity' }),
    ],
    level: 2,
    hints: ['Write the slider coordinate from the crank angle and the rod angle. Differentiate that coordinate.',
      "The rod angle satisfies sin phi = (r/l) sin theta. Differentiate x = r cos theta + l cos phi, and keep omega equal to the crank rate.",
    ],
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
    // Structure: B's position is given as components, or as the bar's length and angle.
    vars: {
      given: choice(['xy', 'components'], ['polar', 'length and angle']),
      vax: range(-4, 4, 0.5, 'm/s'),
      vay: range(-4, 4, 0.5, 'm/s'),
      omega: range(-6, 6, 0.5, 'rad/s'),
      rx: range(-1, 1, 0.1, 'm'),
      ry: range(-1, 1, 0.1, 'm'),
      L: range(0.2, 1.2, 0.2, 'm'),
      ang: range(30, 330, 30, 'deg'),
    },
    derive: ($) => ($.given === 'polar' ? { rx: $.L * Math.cos($.ang * DEG), ry: $.L * Math.sin($.ang * DEG) } : {}),
    valid: ($) => $.omega !== 0 && Math.abs($.ry) > 1e-9 && Math.abs($.rx) > 1e-9,
    text: (T, $) => ($.given === 'polar'
      ? String.raw`Point A of a rigid bar has velocity $(${T.vax},\,${T.vay})$ m/s. The bar AB is ${T.L} m long, at ${T.ang}° counterclockwise from the $x$ axis, and $\omega=${T.omega}$ rad/s. Find the velocity of B.`
      : String.raw`Point A of a rigid bar has velocity $(${T.vax},\,${T.vay})$ m/s. Point B is at $\vec r_{B/A}=(${T.rx},\,${T.ry})$ m, and $\omega=${T.omega}$ rad/s. Find the velocity of B.`),
    parts: [
      num('vx', ($) => relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 }).x, 'm/s', { label: 'x component of v_B' }),
      num('vy', ($) => relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 }).y, 'm/s', { label: 'y component of v_B' }),
    ],
    level: 2,
    hints: ['Add omega cross r to the velocity of A. That cross product is perpendicular to the bar.',
      "With omega counterclockwise, the cross product is (−omega y, omega x). Add that vector to the velocity of A.",
    ],
    steps: ($, sig) => {
      const row = relativeVelocity({ x: $.vax, y: $.vay, z: 0 }, $.omega, { x: $.rx, y: $.ry, z: 0 });
      return [
        ...($.given === 'polar' ? [String.raw`$\vec r_{B/A} = L(\cos\theta,\,\sin\theta) = (${sig($.rx)},\,${sig($.ry)})$ m.`] : []),
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
    cases: [kase('Hibbeler §16.5', { given: 'xy', vax: 1, vay: 0.5, omega: 2, rx: 0.4, ry: 0.3, L: 0.6, ang: 30 }, { vx: 0.4, vy: 1.3 })],
  }),

  problem({
    id: 'u5.16.ladder',
    title: 'Ladder and its instantaneous centre',
    exam: 'u5',
    ch: '16',
    lab: 'ic',
    src: 'Hibbeler §16.6',
    topics: ['ic'],
    // Structure: the ladder's position is given as its angle, or as the height of its top.
    vars: {
      given: choice(['angle', 'angle'], ['height', 'height']),
      L: range(2, 8, 0.5, 'm'),
      theta: range(20, 75, 5, 'deg'),
      h: range(1, 7, 0.5, 'm'),
      v: range(0.5, 4, 0.5, 'm/s'),
    },
    derive: ($) => ($.given === 'height' ? { theta: Math.asin(Math.min(1, $.h / $.L)) / DEG } : {}),
    valid: ($) => $.theta >= 20 && $.theta <= 75 && Math.abs($.theta - 45) > 1,
    text: (T, $) => ($.given === 'height'
      ? String.raw`A ladder of length ${T.L} m leans on a wall, its top ${T.h} m above the floor. The foot moves away from the wall at ${T.v} m/s. Find $\omega$ and the downward speed of the top.`
      : String.raw`A ladder of length ${T.L} m leans on a wall. The angle with the floor is ${T.theta}°. The foot moves away from the wall at ${T.v} m/s. Find $\omega$ and the downward speed of the top.`),
    parts: [
      num('omega', ($) => ladder($.L, $.theta, $.v).omega, 'rad/s', { label: 'angular velocity' }),
      num('vTop', ($) => ladder($.L, $.theta, $.v).down, 'm/s', { label: 'downward speed of the top' }),
    ],
    level: 2,
    hints: ['The instantaneous centre is the corner across from the ladder. Divide the foot speed by the height of the top.',
      "The top speed is omega times the horizontal reach of the ladder. That reach is the distance from the corner to the top.",
    ],
    steps: ($, sig) => {
      const row = ladder($.L, $.theta, $.v);
      return [
        ...($.given === 'height' ? [String.raw`The top's height is $L\sin\theta$, so $\theta = \arcsin(${sig($.h)}/${sig($.L)}) = ${sig($.theta)}^\circ$.`] : []),
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
    cases: [kase('Hibbeler §16.6', { given: 'angle', L: 4, theta: 60, h: 3, v: 2 }, { omega: 1 / Math.sqrt(3), vTop: 2 / Math.sqrt(3) })],
  }),

  problem({
    id: 'u5.16.wheel',
    title: 'Rolling wheel',
    exam: 'u5',
    ch: '16',
    lab: 'rolling',
    src: 'Hibbeler §16.6',
    topics: ['rolling'],
    // Structure: the wheel's motion is given as its centre speed, or as its angular velocity.
    vars: {
      given: choice(['v', 'centre speed'], ['omega', 'angular velocity']),
      R: range(0.2, 1, 0.1, 'm'),
      v: range(0.5, 5, 0.5, 'm/s'),
      w: range(2, 20, 1, 'rad/s'),
      phi: range(15, 180, 15, 'deg'),
    },
    derive: ($) => ($.given === 'omega' ? { v: $.w * $.R } : {}),
    valid: ($) => Math.abs($.phi - 60) > 1,
    text: (T, $) => String.raw`A wheel of radius ${T.R} m rolls without slip ${$.given === 'omega' ? String.raw`at $\omega = ${T.w}$ rad/s` : `at ${T.v} m/s`}. A mark on the rim is ${T.phi}° clockwise from the contact point. Find the speed of the mark and the speed of the top point.`,
    parts: [
      num('speed', ($) => rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG }).speed, 'm/s', { label: 'speed of the mark' }),
      num('vTop', ($) => rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG }).vTop, 'm/s', { label: 'speed of the top point' }),
    ],
    level: 1,
    hints: ['The contact point is the instantaneous centre. The top is two radii away, so it moves at twice the centre speed.',
      "Measure the mark from the contact point. Its speed is omega times its distance to that point.",
    ],
    steps: ($, sig) => {
      const row = rollingPoint({ radius: $.R, speed: $.v, phi: $.phi * DEG });
      return [
        ...($.given === 'omega' ? [String.raw`No slip: the centre moves at $v = \omega R = ${sig($.v)}\ \mathrm{m/s}$.`] : []),
        String.raw`The mark is $2R\sin(\varphi/2)$ from the contact point. It moves at ${sig(row.speed)} m/s.`,
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
    cases: [kase('Hibbeler §16.6', { given: 'v', R: 0.4, v: 2, w: 5, phi: 90 }, { speed: 2 * Math.SQRT2, vTop: 4 })],
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
    level: 3,
    hints: ['Differentiate the slider position a second time. Zero velocity at a dead centre does not make the acceleration zero.',
      "The product rule on the angle leaves an omega-squared term in that second derivative.",
      "At a dead centre the velocity is zero. That omega-squared term in the acceleration remains.",
    ],
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

  problem({
    id: 'u5.16.rotor-tip',
    title: 'Tip of a rotor on a moving machine',
    exam: 'u5',
    ch: '16',
    lab: null,
    src: 'Hibbeler §16.5, §16.7',
    topics: ['relative-velocity', 'relative-acceleration'],
    // Which blade is the structure: the advancing tip adds the flight speed, the retreating tip subtracts it.
    vars: {
      blade: choice(['adv', 'the advancing blade, pointing to the right of the flight'], ['ret', 'the retreating blade, pointing to the left']),
      vB: range(5, 20, 1, 'm/s'),
      aB: range(0.5, 2, 0.5, 'm/s²'),
      r: range(1.5, 6, 0.5, 'm'),
      w: range(10, 30, 2, 'rad/s'),
    },
    valid: ($) => $.r * $.w > 2 * $.vB,
    text: (T) => String.raw`A helicopter flies level, east, at ${T.vB} m/s, speeding up at ${T.aB} m/s². Its rotor, radius ${T.r} m, turns counterclockwise seen from above at a steady ${T.w} rad/s. Find the speed and the acceleration of the tip of ${T.blade}, relative to the ground.`,
    parts: [
      num('speed', ($) => rotorTip($).speed, 'm/s', { label: 'speed of the tip' }),
      num('accel', ($) => rotorTip($).accel, 'm/s²', { label: 'acceleration of the tip' }),
    ],
    level: 2,
    hints: ['The tip’s velocity is the helicopter’s velocity plus the tip’s velocity about the hub, v = v_B + ω × r. Which way does ω × r point for this blade?',
      'The rotor turns at a steady rate, so the tip’s acceleration is a_B − ω²r: the helicopter’s plus one toward the hub. There is no α × r term.',
    ],
    steps: ($, sig) => {
      const e = rotorTip($);
      return [
        String.raw`$\vec v = \vec v_B + \vec\omega\times\vec r$: $v_x = ${sig(e.vx)}$ and $v_y = ${sig(e.vy)}\ \mathrm{m/s}$, so $v = ${sig(e.speed)}\ \mathrm{m/s}$.`,
        String.raw`$\vec a = \vec a_B - \omega^2\vec r$: $a_x = ${sig(e.ax)}$ and $a_y = ${sig(e.ay)}\ \mathrm{m/s^2}$, so $a = ${sig(e.accel)}\ \mathrm{m/s^2}$.`,
      ];
    },
    // Second: differentiate the tip's position twice by central differences.
    second: ($) => {
      const th = BLADE_DEG[$.blade] * DEG;
      const pos = (t) => [$.vB * t + 0.5 * $.aB * t * t + $.r * Math.cos($.w * t + th), $.r * Math.sin($.w * t + th)];
      const h = 1e-3 / $.w;
      const [xp, yp] = pos(h);
      const [xm, ym] = pos(-h);
      const [x0, y0] = pos(0);
      const v = Math.hypot((xp - xm) / (2 * h), (yp - ym) / (2 * h));
      const a = Math.hypot((xp - 2 * x0 + xm) / (h * h), (yp - 2 * y0 + ym) / (h * h));
      return { speed: v, accel: a };
    },
    cases: [
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 2, Problem 3', { blade: 'adv', vB: 5, aB: 0.5, r: 5.2, w: 10 * Math.PI }, { speed: 168.4, accel: 5132 }, { note: 'The rotor turns at 5 rev/s, which is 10π rad/s. The printed answers are 168.4 m/s and about 5,132 m/s², more than 500 g. The printed solution draws the tip at the instant the blade is perpendicular to the flight.' }),
    ],
  }),
];

export default ch16;
