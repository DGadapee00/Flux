/**
 * Unit 4 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was). Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI (slugs and ft/s for the US-customary rocket). A trap returns a value in
 * the part's own units, like the part's `get`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';

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
};
