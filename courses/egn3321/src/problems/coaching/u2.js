/**
 * Unit 2 coaching: numeric `traps` for each template (the wrong value a known mistake produces, and
 * what the mistake was). Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI, or US customary for the -ft template. A trap returns a value in the
 * part's own unit, like its `get`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { hangingIncline } from '@flux/subjects/mechanics/dynamics.js';
import { inclineBlock, loopVb, pulley } from '../bank/ch13.js';

const DEG = Math.PI / 180;

/** The incline block with friction left out, and with μs used for the sliding friction. */
const noFriction = ($, g) => g * Math.sin($.theta * DEG);
const withMus = ($, g) => g * Math.sin($.theta * DEG) - $.mus * g * Math.cos($.theta * DEG);
const held = ($, g) => $.start !== 'up' && inclineBlock($, g).a === 0;

const inclineTraps = (g) => ({
  a: [
    [($) => noFriction($, g), ($) => (held($, g)
      ? 'That leaves out friction. Static friction can hold this block, and here it does: a = 0.'
      : 'That leaves out friction. Kinetic friction μₖN acts along the plane, against the sliding.')],
    [($) => ($.start === 'up' ? noFriction($, g) - $.muk * g * Math.cos($.theta * DEG) : withMus($, g)), ($) => {
      if ($.start === 'up') return 'Friction opposes the sliding. Sliding up, it points down the plane, with the weight: add the two.';
      return held($, g)
        ? 'A negative answer means friction would have to push the block uphill. Static friction only holds: a = 0.'
        : 'Once the block slides, friction is kinetic. Use μₖ, not μₛ.';
    }],
  ],
  N: [[($) => $.m * g, 'That is the weight. On a slope the normal force carries only the part across the plane, mg cos θ.']],
});

const tow = ($) => hangingIncline({ block: $.m, hang: $.M, thetaDeg: $.theta, muk: $.muk, mus: $.mus, g: G, v0: 0 });

export default {
  'u2.13.atwood': {
    traps: {
      a: [[($) => (pulley($).a * ($.m1 + $.m2)) / $.m2, 'That divides the net force by m₂ alone. Both masses accelerate together: divide by m₁ + m₂.']],
      T: [[($) => $.m2 * G, 'That is m₂’s weight. The string carries a hanging weight only when nothing accelerates.']],
    },
  },
  'u2.13.incline': { traps: inclineTraps(G) },
  'u2.13.incline-ft': {
    traps: {
      ...inclineTraps(G_FT),
      N: [
        [($) => $.m * G_FT, 'That is the weight. On a slope the normal force carries only the part across the plane, mg cos θ.'],
        [($) => $.m * G * Math.cos($.theta * DEG), 'In US units g = 32.2 ft/s². 9.81 belongs to metres.'],
      ],
    },
  },
  'u2.13.tow': {
    traps: {
      a: [
        [($) => ($.M * G - $.m * G * Math.sin($.theta * DEG)) / ($.m + $.M), ($) => (tow($).holds
          ? 'That leaves out friction. Static friction is strong enough here to hold the system: a = 0.'
          : 'That leaves out friction on the block. It acts along the plane, against the motion.')],
        [($) => ($.M * G - $.m * G * Math.sin($.theta * DEG) - $.muk * $.m * G * Math.cos($.theta * DEG)) / $.M, 'That divides by the hanging mass alone. Both bodies share the acceleration: divide by m + M.'],
      ],
      T: [[($) => $.M * Math.abs(tow($).a), 'That is M a alone. The hanging mass also has its weight: M g − T = M a, so T = M(g − a).']],
    },
  },
  'u2.13.bank': {
    traps: {
      vmin: [[($) => Math.sqrt($.R * G * Math.tan($.theta * DEG)), 'That is the no-friction speed. Friction up the bank lets the car go slower than that.']],
      vmax: [[($) => Math.sqrt($.R * G * Math.tan($.theta * DEG)), 'That is the no-friction speed. Friction down the bank lets the car go faster than that.']],
      N: [
        [($) => $.m * G, 'That is the weight. On a bank at speed, N must also supply the inward force, so it is bigger.'],
        [($) => {
          const t = $.theta * DEG;
          const vmax2 = ($.R * G * (Math.sin(t) + $.mu * Math.cos(t))) / (Math.cos(t) - $.mu * Math.sin(t));
          return ($.m * vmax2) / $.R;
        }, 'That is m v²/ρ, the whole inward force. N is tilted with the bank, so only part of it points inward.'],
      ],
    },
  },
  'u2.13.loop': {
    traps: {
      speed: [[($) => loopVb($), 'That is the speed at the bottom. The particle has climbed ρ(1 − cos φ) since then, so it is slower.']],
      N: [
        [($) => {
          const v2 = loopVb($) ** 2 - 2 * G * $.R * (1 - Math.cos($.phi * DEG));
          return $.m * (v2 / $.R - G * Math.cos($.phi * DEG));
        }, 'Check the sign of the weight term. Toward the centre, N − mg cos φ = mv²/ρ, measured from the bottom, so N = m(v²/ρ + g cos φ).'],
        [($) => $.m * G, 'That is the weight. In a loop N must also supply the inward force m v²/ρ.'],
      ],
    },
  },
  'u2.13.spring': {
    traps: {
      a: [
        [($) => G * Math.sin($.theta * DEG) + ($.k / $.m) * $.x, 'A stretched spring pulls the collar back up the rod. Subtract kx/m.'],
        [($) => G * Math.sin($.theta * DEG) - $.k * $.x, 'kx is a force. Divide by the mass before adding it to an acceleration.'],
      ],
      N: [[($) => $.m * G, 'That is the weight. The rod carries only the part across it, mg cos θ.']],
    },
  },
};
