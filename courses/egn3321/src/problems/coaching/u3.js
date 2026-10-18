/**
 * Unit 3 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI, except the US-unit templates, whose traps stay in their own units.
 */
import { convert, FT_LBF_PER_S_PER_HP } from '@flux/subjects/convert.js';
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { pathReport } from '../../labs/pathwork.js';
import { contactSpeed } from '../bank/ch14.js';

const DEG = Math.PI / 180;

/**
 * The collar's speed by T₁ + ΣU = T₂, with one term changed the way a known mistake changes it:
 * `half` 1 for ½k, 2 for k; `gsign` −1 flips the weight's work; `mu` and `normal` set the friction.
 */
function collar($, { half = 1, gsign = 1, mu = $.mu ?? 0, g = G, normal = 'cos' } = {}) {
  const th = $.theta * DEG;
  const spring = 0.5 * half * $.k * ($.x1 * $.x1 - $.x2 * $.x2);
  const gravity = gsign * $.m * g * Math.sin(th) * ($.x2 - $.x1);
  const N = normal === 'cos' ? $.m * g * Math.cos(th) : $.m * g;
  const friction = -mu * N * Math.abs($.x2 - $.x1);
  const t2 = 0.5 * $.m * $.v1 * $.v1 + spring + gravity + friction;
  return Math.sqrt(Math.max(0, (2 * t2) / $.m));
}

/** Pull up the incline, or the hoist's lift, with the friction left out. */
function pullNoFriction($) {
  return $.route === 'hoist' ? $.m : $.m * G * Math.sin($.theta * DEG);
}

function powerOut($) {
  const th = $.theta * DEG;
  const F = $.route === 'hoist' ? $.m * G : $.m * G * (Math.sin(th) + $.mu * Math.cos(th));
  return F * $.v;
}

const paths = ($) => pathReport({ mass: $.m, k: $.k, mu: $.mu, rise: $.rise, ax: $.ax, ay: $.ay, bx: $.bx, by: $.by, g: G });

export default {
  'u3.14.speed': {
    traps: {
      speed: [
        [($) => collar($, { gsign: 0 }), 'The collar climbs the rod as the spring relaxes. The weight does negative work, mg sin θ times the distance up the rod.'],
        [($) => collar($, { half: 2 }), 'The spring work is ½k(s₁² − s₂²). The factor of one half is missing.'],
      ],
    },
  },
  'u3.14.rough': {
    traps: {
      speed: [
        [($) => collar($, { mu: 0 }), 'That is the smooth-rod speed. Friction takes μ_k mg cos θ times the distance slid.'],
        [($) => collar($, { half: 2 }), 'The spring work is ½k(s₁² − s₂²). The factor of one half is missing.'],
        [($) => collar($, { gsign: -1 }), 'The collar moves up the rod, so the weight does negative work. The sign of the gravity term is flipped.'],
      ],
    },
  },
  'u3.14.stop': {
    traps: {
      x: [
        [($) => $.v * Math.sqrt($.m / $.k), 'That sets ½mv² = ½kx² and leaves friction out. Friction works over the whole slide, the compression included.'],
        [($) => {
          const vc = contactSpeed($);
          const f = $.mu * $.m * G;
          return (-f + Math.sqrt(f * f + 2 * $.k * $.m * vc * vc)) / (2 * $.k);
        }, 'The spring stores ½kx², not kx². The factor of one half is missing.'],
      ],
    },
  },
  'u3.14.power': {
    traps: {
      P: [[($) => pullNoFriction($) * $.v, ($) => ($.route === 'hoist'
        ? 'The pull is the weight, mg, not the mass. Multiply by g before multiplying by the speed.'
        : 'The pull must also overcome friction, μ_k mg cos θ, not only the weight component down the slope.')]],
      Pin: [
        [($) => powerOut($) * $.eta, 'The motor draws more than it delivers. Divide the output by the efficiency; do not multiply.'],
        [($) => powerOut($), 'That is the output power. The input is larger: divide by the efficiency.'],
      ],
    },
  },
  'u3.14.hp': {
    traps: {
      hp: [
        [($) => ($.units === 'si' ? ($.FN * $.vm) / FT_LBF_PER_S_PER_HP : convert($.F * $.v, 'W', 'hp')), ($) => ($.units === 'si'
          ? 'The power is in watts. A horsepower is 745.7 W; 550 is for ft·lb/s.'
          : 'The power is in ft·lb/s. A horsepower is 550 ft·lb/s; 745.7 is for watts.')],
        [($) => ($.units === 'si' ? ($.FN * $.vm) / 1000 : ($.F * $.v) / 33000), ($) => ($.units === 'si'
          ? 'That is kilowatts. A horsepower is 745.7 W, not 1,000 W.'
          : 'A horsepower is 33,000 ft·lb per minute. The speed is per second, so use 550.')],
      ],
    },
  },
  'u3.14.paths': {
    traps: {
      work: [[($) => -paths($).potential, 'The work of a conservative force is V₁ − V₂, minus the change in potential. That is the change itself.']],
      friction: [
        [($) => paths($).frictionLine, 'That is the friction work on the straight line. Friction follows the path taken, and the arch is longer.'],
        [($) => -paths($).frictionArch, 'Friction opposes the motion, so its work is negative.'],
      ],
    },
  },
  'u3.14.same': {
    why: {
      path: {
        1: 'A spring’s work depends only on its first and last stretch. The trip out and back cancels.',
        0: 'Kinetic friction opposes the motion on every leg. The extra out and back adds more negative work.',
      },
    },
  },
  'u3.14.us': {
    traps: {
      speed: [
        [($) => collar($, { g: G_FT, half: 2 }), 'The spring work is ½k(s₁² − s₂²). The factor of one half is missing.'],
        [($) => collar($, { g: G_FT, gsign: -1 }), 'The collar moves up the rod, so the weight does negative work. The sign of the gravity term is flipped.'],
      ],
    },
  },
};
