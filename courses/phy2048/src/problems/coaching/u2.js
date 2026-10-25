/**
 * Unit 2 coaching: for each template, the wrong value a named mistake gives (`traps`) and the hints
 * that continue its ladder. The conceptual templates carry a `why` on every option themselves.
 * Folded into the bank by src/problems/index.js. A trap is [($) => wrongValue, 'what went wrong'].
 */
import { DEG } from '@flux/subjects/mechanics/vectors.js';
import { G } from '@flux/subjects/mechanics/constants.js';

const deg = (rad) => rad / DEG;
const mod360 = (x) => ((x % 360) + 360) % 360;

/** ω in degrees per second, the mistake of reading "one revolution" as 360 instead of 2π. */
const omegaDeg = ($) => ($.rep === 'rpm' ? ($.rpm * 360) / 60 : 360 / $.T);
/** The launch of a level-ground template, from either representation. */
const parts = ($) => ($.rep === 'parts' ? { vx: $.vx, vy: $.vy } : { vx: $.v0 * Math.cos($.theta * DEG), vy: $.v0 * Math.sin($.theta * DEG) });

export default {
  'ch4.motion': {
    traps: {
      speed: [
        [($) => $.rNow, 'That is the size of the position vector. The speed is the size of its derivative, the velocity.'],
        [($) => $.vxy, 'That leaves out the z component of the velocity. The speed uses all three.'],
      ],
      acc: [
        [($) => 2 * $.A, 'That differentiates At² twice. Here x grows as t³, so its second derivative is 6At and changes with time.'],
        [($) => $.speed / $.t1, 'That divides the speed by the time, which is an average from rest. The acceleration is the derivative of the velocity at that instant.'],
      ],
      avg: [
        [($) => $.speed, 'That is the speed at the middle instant. The average equals it only when the velocity changes linearly with time, and t³ does not.'],
        [($) => 2 * $.avg, 'That is the displacement over the two seconds. Divide by the 2 s to get a velocity.'],
      ],
    },
  },
  'ch4.skier': {
    hints: ['Check the signs: with y up, a skier going downhill has a negative v_y, and speeding up downhill gives a negative a_y.'],
    traps: {
      x: [
        [($) => $.x0 + $.v0 * Math.cos($.phi * DEG) * $.t + (($.mode === 'speed' ? 1 : -1) * $.a * $.t ** 2) / 2, 'That puts the whole acceleration along x. Only a cos φ of it is horizontal.'],
        [($) => $.x - $.x0, 'That is the displacement. The position adds the starting x₀.'],
      ],
      y: [
        [($) => $.y - $.ay * $.t ** 2, 'The sign of a_y: going down the slope while speeding up, the vertical part of the acceleration points down.'],
        [($) => $.y - $.y0, 'That is the vertical displacement. The position adds the starting y₀.'],
      ],
      v: [
        [($) => Math.abs($.vx), 'That is only the horizontal part of the velocity. The speed uses both parts.'],
        [($) => Math.hypot($.v0, $.a * $.t), 'That adds the starting speed and the gain at right angles. Both lie along the slope, so they add as numbers.'],
      ],
    },
  },
  'ch4.level': {
    hints: ['The horizontal and vertical parts share one clock. Find the time from the vertical motion, then use it for the horizontal.'],
    traps: {
      h: [
        [($) => ($.v0 * $.v0) / (2 * G), 'That uses the whole launch speed. The height comes from the vertical part only: h = v₀ᵧ²/(2g).'],
        [($) => (parts($).vy ** 2) / G, 'You dropped the 2: h = v₀ᵧ²/(2g).'],
      ],
      T: [
        [($) => parts($).vy / G, 'That is the time to the top. On level ground the fall takes as long again.'],
        [($) => (2 * $.v0) / G, 'That uses the whole launch speed. The flight time depends on the vertical part: 2v₀ᵧ/g.'],
      ],
      R: [
        [($) => ($.v0 * $.v0 * Math.sin($.theta * DEG)) / G, 'That uses sin θ. The range has sin 2θ = 2 sin θ cos θ in it.'],
        [($) => (parts($).vx * parts($).vy) / G, 'That uses the time to the top only. The ball keeps moving sideways while it falls.'],
      ],
    },
  },
  'ch4.golf': {
    traps: {
      v0: [
        [($) => Math.sqrt(($.R * G) / Math.sin($.theta * DEG)), 'That uses sin θ. The range formula has sin 2θ.'],
        [($) => ($.R * G) / Math.sin(2 * $.theta * DEG), 'That is v₀². Take the square root.'],
      ],
      other: [
        [($) => 180 - $.theta, 'The equal sines are sin 2θ and sin(180° − 2θ). Halve that: the other launch angle is 90° − θ.'],
        [() => 45, 'That is the angle of greatest range. Only one speed reaches R at 45°, and it is not this one.'],
      ],
    },
  },
  'ch4.height': {
    hints: ['Check the root: on the way up the ball also passes the landing height when it lands above the launch. The catch is the later time.'],
    traps: {
      t: [
        [($) => (2 * $.v0 * Math.sin($.theta * DEG)) / G, 'That is the level-ground flight time. The ball lands at a different height, so solve y(t) = Δy.'],
        [($) => Math.sqrt((2 * $.d) / G), 'That drops the ball from rest. It starts with an upward speed v₀ sin θ.'],
      ],
      R: [
        [($) => ($.v0 * $.v0 * Math.sin(2 * $.theta * DEG)) / G, 'That is the level-ground range formula. It holds only when the ball lands at the height it left.'],
        [($) => $.v0 * $.t, 'That uses the whole launch speed. The horizontal distance uses the horizontal part, v₀ cos θ.'],
      ],
      v: [
        [($) => $.v0, 'The ball keeps its launch speed only when it lands at the launch height. It has climbed or dropped Δy since.'],
        [($) => Math.abs($.vyL), 'That is only the vertical part. Combine it with the horizontal part, which never changes.'],
      ],
      phi: [
        [($) => $.theta, 'The landing angle equals the launch angle only on level ground.'],
        [($) => 90 - $.phi, 'That is the angle from the vertical. The question asks from the horizontal.'],
      ],
    },
  },
  'ch4.slope': {
    hints: [String.raw`A check: aim at $45^\circ + \varphi/2$ and the ball goes farthest up the slope.`],
    traps: {
      d: [
        [($) => ($.v0 * $.v0 * Math.sin(2 * $.theta * DEG)) / G, 'That is the level-ground range. The slope meets the ball before or after level ground would.'],
        [($) => $.d * Math.cos($.slope * DEG), 'That is the horizontal distance to the landing point. Along the slope is longer: divide by cos φ.'],
      ],
      t: [
        [($) => (2 * $.v0 * Math.sin($.theta * DEG)) / G, 'That is the level-ground flight time. The landing is on the slope, not at the launch height.'],
        [($) => (2 * $.v0 * Math.sin(($.theta - $.slope) * DEG)) / G, 'You dropped the cos φ: across the slope gravity has only g cos φ.'],
      ],
    },
  },
  'ch4.circle': {
    traps: {
      v: [
        [($) => omegaDeg($) * $.r, 'That puts ω in degrees per second. One turn is 2π radians, not 360, when you use v = ωr.'],
        [($) => ($.rep === 'rpm' ? ($.rpm / 60) * $.r : $.r / $.T), 'That counts turns per second and leaves out the 2π. Each turn carries the point 2πr.'],
      ],
      a: [
        [($) => omegaDeg($) ** 2 * $.r, 'That puts ω in degrees per second. a_c = ω²r needs radians per second.'],
        [($) => $.omega * $.r, 'That is ωr, the speed. The acceleration is ω²r = v²/r.'],
      ],
    },
  },
  'ch4.turn': {
    traps: {
      r: [
        [($) => $.v / $.acc, 'That divides the speed by the acceleration, which gives a time. The radius is v²/a_c.'],
        [($) => $.v * $.v * $.acc, 'Solve v²/r = a_c for r: r = v²/a_c, not v²·a_c.'],
      ],
      T: [
        [($) => $.r / $.v, 'That is the time to go one radius. A full circle is 2πr long.'],
        [($) => 2 * Math.PI * $.r, 'That is the length of the circle. Divide by the speed for the time.'],
      ],
    },
  },
  'ch4.total': {
    hints: ['When the speed is falling, a_T is negative, and the acceleration leans back against the motion.'],
    traps: {
      ac: [
        [($) => $.speed / $.r, 'That is v/r, which is ω. The centripetal acceleration is v²/r.'],
        [($) => $.speed ** 2, 'That is v² alone. Divide by the radius: a_c = v²/r.'],
      ],
      a: [
        [($) => $.ac + Math.abs($.aT), 'That adds the two parts as numbers. They are perpendicular, so add them as vectors: √(a_c² + a_T²).'],
        [($) => Math.abs($.aT), 'That is only the part along the motion. On a circle the acceleration also has a part toward the centre.'],
      ],
      ang: [
        [() => 90, 'The acceleration is perpendicular to the velocity only when the speed is steady. Here the speed changes.'],
        [($) => 90 - $.ang, 'That is the angle from the radius. The question asks for the angle from the velocity.'],
      ],
    },
  },
  'ch4.river': {
    traps: {
      v: [
        [($) => $.vb + $.vc, 'That adds the speeds as numbers. The current is at an angle to the boat’s heading, so the velocities add as vectors.'],
        [($) => ($.aim === 'across' ? Math.sqrt($.vb * $.vb - $.vc * $.vc) : Math.hypot($.vb, $.vc)), 'That is the other triangle. Pointing straight across, the boat’s velocity is one leg and the ground velocity the hypotenuse; aiming upstream, the boat’s velocity is the hypotenuse.'],
      ],
      ang: [
        [($) => ($.aim === 'across' ? deg(Math.asin(Math.min(1, $.vc / $.vb))) : deg(Math.atan($.vc / $.vb))), 'Sine or tangent: when the boat points across, v_b and v_c are the two legs, so use tan; when it aims upstream, v_b is the hypotenuse, so use sin.'],
        [($) => 90 - $.ang, 'That is the angle from the bank. The question measures from the straight-across line.'],
      ],
      t: [
        [($) => $.width / Math.hypot($.vb, $.vc), 'That uses the speed over the ground. Only the part across the river carries the boat over.'],
        [($) => $.width / $.vb, 'Aiming upstream, only part of the boat’s speed points across: √(v_b² − v_c²).'],
      ],
    },
  },
  'ch4.wind': {
    traps: {
      wca: [
        [() => 0, 'Pointing the nose at the destination lets the wind carry the plane sideways. The heading must cancel the crosswind.'],
        [($) => -$.wca, 'That turns away from the wind. The wind comes from that side, so the nose points into it.'],
      ],
      gs: [
        [($) => $.careless, 'That adds the wind to a plane pointed due north. Then the track is not north. Add the wind to the velocity that makes the track north.'],
        [($) => $.air - $.wind, 'That subtracts the speeds as numbers, as if the wind were head on. Only its northward part slows the plane, and the crosswind costs a little more.'],
      ],
    },
  },
  'ch4.truck': {
    traps: {
      v: [
        [($) => $.vc + $.vt, 'That adds the speeds. The velocities are at an angle, so subtract them as vectors.'],
        [($) => Math.abs($.vc - $.vt), 'That subtracts the speeds as numbers, as if the two moved along one line.'],
      ],
      dir: [
        [($) => mod360($.dir + 180), 'That is the truck seen from the car: v_TC = −v_CT. The question asks for the car seen from the truck.'],
        [($) => $.sum, 'That adds the truck’s velocity. Seen from the truck, subtract it: v_CT = v_CE − v_TE.'],
      ],
    },
  },
  'ch4.concept-accel': {},
  'ch4.concept-top': {},
  'ch4.concept-range': {},
  'ch4.concept-circle': {},
  'ch4.concept-frames': {},
};

