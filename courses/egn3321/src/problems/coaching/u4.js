/**
 * Impulse and momentum (id u4, Unit 3) coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was). Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI (slugs and ft/s for the US-customary rocket). A trap returns a value in
 * the part's own units, like the part's `get`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { collide1D } from '@flux/subjects/mechanics/momentum.js';
import { minDuration, stopPulse } from '@flux/subjects/mechanics/impact-pulse.js';

const DEG = Math.PI / 180;

/** The first interval's impulse: a ramp's area is its average force times its duration. */
const j1 = ($) => $.f1 * $.t1 + 0.5 * $.s1 * $.t1 * $.t1;

/** Momentum and restitution on the line of impact, with the restitution sign chosen. */
function line(m1, m2, u1, u2, e) {
  const p = m1 * u1 + m2 * u2;
  const rel = e * (u1 - u2);
  const v1 = (p - m2 * rel) / (m1 + m2);
  return { v1, v2: v1 + rel };
}

/** The rocket traps, for either unit system. */
const rocketTraps = (g) => [
  [($) => $.ve * Math.log10($.m0 / $.mf) - $.g * (($.m0 - $.mf) / $.mdot), 'The rocket equation uses the natural log, ln, not log base 10.'],
  [($) => ($.ve * ($.m0 - $.mf)) / $.m0 - $.g * (($.m0 - $.mf) / $.mdot), 'That holds the mass at its starting value. The rocket gets lighter as it burns, so the same thrust gives a growing acceleration: integrate, and the log appears.'],
  [
    ($) => $.ve * Math.log($.m0 / $.mf) - ($.g > 0 ? 0 : g * (($.m0 - $.mf) / $.mdot)),
    ($) => ($.g > 0 ? 'Gravity acts for the whole burn. Subtract g·t_b, the gravity loss.' : 'In free space there is no weight, so there is no g·t_b to subtract.'),
  ],
];

export default {
  'u4.15.impulse': {
    traps: {
      J: [
        [
          ($) => ({
            ramp: ($.f1 + $.s1 * $.t1) * $.t1 + $.F2 * $.t2,
            steps: 0.5 * ($.f1 + $.f2) * ($.t1 + $.t2),
            brake: j1($) + $.f2 * $.t2,
          })[$.shape],
          ($) => ({
            ramp: 'That uses the force at the end of the ramp for the whole interval. A ramp’s area is the average force times the duration.',
            steps: 'Averaging the two forces works only when they act for equal times. Add each force times its own duration.',
            brake: 'The braking force acts backward, so its impulse is negative. Subtract it.',
          })[$.shape],
        ],
        [j1, 'That is only the first interval. The second force adds its own area under F(t).'],
      ],
      v: [[($) => $.v0 + j1($) + $.F2 * $.t2, 'Impulse is a change of momentum, not of speed. Divide by the mass.']],
    },
  },
  'u4.15.recoil': {
    traps: {
      vg: [
        [
          ($) => ($.given === 'muzzle' ? ($.mb * $.vb) / $.Mg : ($.mb * $.vb) / ($.Mg + $.mb)),
          ($) => ($.given === 'muzzle'
            ? 'That speed is relative to the barrel, which is moving back. Over the ground the shell moves at u − v_g.'
            : 'The shell’s speed is already over the ground. Only the cannon recoils, so divide by its mass alone.'),
        ],
        [($) => $.vb * Math.sqrt($.mb / $.Mg), 'Firing turns chemical energy into motion, so kinetic energy is not conserved. Momentum is.'],
      ],
    },
  },
  'u4.15.ballistic': {
    traps: {
      v: [
        [
          ($) => ($.find === 'bullet' ? ($.M * $.V) / $.mb : ($.mb * $.vb) / $.M),
          'After the impact the bullet moves with the block. The moving mass is m_b + M.',
        ],
        [
          ($) => ($.find === 'bullet' ? $.V * Math.sqrt(($.mb + $.M) / $.mb) : $.vb * Math.sqrt($.mb / ($.mb + $.M))),
          'Kinetic energy is lost when the bullet embeds: it goes into heat and deformation. Use momentum.',
        ],
      ],
    },
  },
  'u4.15.central': {
    traps: {
      v1: [[($) => line($.m1, $.m2, $.u1, $.u2, -$.e).v1, 'Restitution compares separation with approach: v_B − v_A = e(u_A − u_B). That sign is reversed.']],
      v2: [[($) => line($.m1, $.m2, $.u1, $.u2, 1).v2, ($) => `That is the elastic answer. Here e = ${$.e}: some energy is lost.`]],
    },
  },
  'u4.15.oblique': {
    traps: {
      vn2: [[($) => line($.m1, $.m2, $.u1, $.u2, $.e).v2, 'Only the normal part, u cos θ, takes part in the impact. The tangent part passes by.']],
      vt: [
        [($) => $.u1 * Math.cos($.theta * DEG), 'θ is measured from the line of impact, so the tangent part is u sin θ.'],
        [($) => $.e * $.u1 * Math.sin($.theta * DEG), 'Smooth disks push only along the line of impact. The tangent part is unchanged: e applies to the normal parts only.'],
      ],
    },
  },
  'u4.15.angular': {
    traps: {
      L: [
        [($) => $.m * (($.y - $.ay) * $.vx - ($.x - $.ax) * $.vy), 'That is v × r. Angular momentum is r × mv: L = m(r_x v_y − r_y v_x).'],
        [
          ($) => ($.about === 'point' ? $.m * ($.x * $.vy - $.y * $.vx) : $.m * ($.x * $.vx + $.y * $.vy)),
          ($) => ($.about === 'point'
            ? 'That is about the origin. Measure r from P to the particle.'
            : 'That is a dot product, r·mv. Angular momentum is the cross product: m(x v_y − y v_x).'),
        ],
      ],
    },
  },
  'u4.15.rocket': { traps: { dv: rocketTraps(G) } },
  'u4.15.rocket-ft': { traps: { dv: rocketTraps(G_FT) } },
  'u4.15.helmet': {
    traps: {
      J: [
        [($) => 5 * $.v0, 'That stops the headform but does not throw it back. The rebound adds e·v0: the change is (1 + e)v0.'],
        [($) => 5 * Math.sqrt(2 * $.h), 'Find the impact speed from the drop: v0 = √(2gh), not √(2h).'],
      ],
      q: [
        // The shape factor misplaced: a half-sine read as flat, a flat pulse given the half-sine's π/2.
        [($) => {
          const k = $.shape === 'square' ? 2 / Math.PI : 1;
          if ($.find === 'tau') return minDuration({ v0: $.v0, e: $.e, shape: k === 1 ? 'square' : 'half-sine', limitG: 300 }) * 1000;
          return stopPulse({ m: 5, v0: $.v0, e: $.e, tau: $.tau / 1000, shape: k === 1 ? 'square' : 'half-sine' }).gPeak;
        }, ($) => ($.shape === 'square'
          ? 'A flat pulse uses its whole height: ∫F dt = F_pk τ, with no π/2.'
          : 'That is the mean force, as if the pulse were flat. A half-sine’s ∫F dt is 2F_pk τ/π, so its peak is π/2 times its mean.')],
        // 300 g read as 300 m/s², or the peak left in m/s².
        [($) => ($.find === 'tau'
          ? ((1 + $.e) * $.v0) / ((($.shape === 'square' ? 1 : 2 / Math.PI) * 300) - G) * 1000
          : stopPulse({ m: 5, v0: $.v0, e: $.e, tau: $.tau / 1000, shape: $.shape }).gPeak * G),
        ($) => ($.find === 'tau'
          ? 'The limit is 300 g, not 300 m/s². Set F_pk = 300mg.'
          : 'That is F_pk/m in m/s². Divide by g = 9.81 for the peak in g.')],
      ],
    },
  },
  'u4.15.collide-sym': {
    traps: {
      lost: [
        [($) => {
          const out = collide1D($.m1, $.m2, $.u, 0, $.e);
          return 0.5 * $.m1 * out.v1 ** 2 + 0.5 * $.m2 * out.v2 ** 2;
        }, 'That is the energy left after the impact, not the energy lost.'],
        [($) => {
          const out = collide1D($.m1, $.m2, $.u, 0, $.e);
          return 0.5 * $.m1 * ($.u ** 2 - out.v1 ** 2);
        }, 'That is the striker’s loss alone. The struck body gains part of it: subtract its ½m₂v₂² too.'],
      ],
    },
  },
  'u4.15.cart': {
    traps: {
      v: [
        [($) => ($.m * $.u) / $.M, 'That divides by the cart’s mass alone. Both bodies end at one speed: divide the momentum by m + M.'],
        [($) => $.u * Math.sqrt($.m / ($.m + $.M)), 'Kinetic energy is not kept: friction turns part of it into heat. Momentum is.'],
      ],
      q: [
        [($) => ($.find === 'time' ? $.u / ($.mu * G) : ($.u * $.u) / (2 * G * $.Lc)), ($) => ($.find === 'time'
          ? 'That holds the cart still. It speeds up too, so the speeds meet sooner: the gap closes at μg(1 + m/M).'
          : 'That holds the cart still. The cart moves off too, so the block slides less far along it.')],
        [($) => ($.find === 'time' ? $.u / ($.mu * G * (1 + $.M / $.m)) : ($.u * $.u) / (G * $.Lc * (1 + $.m / $.M))), ($) => ($.find === 'time'
          ? 'The mass ratio is upside down. Friction μmg speeds the cart at μmg/M.'
          : 'The relative slide is u²/2a: the factor of 2 is missing.')],
      ],
    },
  },
};
