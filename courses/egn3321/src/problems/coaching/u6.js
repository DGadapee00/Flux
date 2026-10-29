/**
 * Unit 6 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI. A trap returns a value in SI, like the part's own `get`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { centralInertia, diskWithHole } from '@flux/subjects/mechanics/inertia.js';
import { pulledWheel } from '../bank/deeper.js';

const DEG = Math.PI / 180;
const rodG = ($) => ($.m * $.L * $.L) / 12;

/** The plate-and-disk moment with one piece of it done wrong. */
function plateWith($, { plate, disk }) {
  const dx = $.d - $.ax;
  const P = plate ?? (($.mp * ($.w * $.w + $.h * $.h)) / 12 + $.mp * $.ax * $.ax);
  const D = disk ?? (0.5 * $.md * $.r * $.r + $.md * dx * dx);
  return P + D;
}

/** The friction rolling would need, k/(1 + k) of the downhill pull. */
function rollNeeds($) {
  const k = centralInertia($.shape, $.m, $.R) / ($.m * $.R * $.R);
  return ($.m * G * Math.sin($.theta * DEG) * k) / (1 + k);
}

export default {
  'u6.17.rod': {
    traps: {
      center: [[($) => ($.m * $.L * $.L) / 3, 'That is the moment about the end. About the centre it is mL²/12.']],
      end: [
        [($) => rodG($) + $.m * $.d, 'The parallel-axis term is m d², with d squared.'],
        [($) => $.m * $.d * $.d, 'That is only the parallel-axis term. Add the rod’s own moment about G, mL²/12.'],
      ],
    },
  },
  'u6.17.spread': {
    traps: {
      hoop: [[($) => 0.5 * $.m * $.R * $.R, 'That is the disk. All of a hoop’s mass sits at the rim, so it is mR².']],
      disk: [[($) => $.m * $.R * $.R, 'That is the hoop. A disk’s mass is spread inward from the rim: ½mR².']],
      sphere: [[($) => (2 / 3) * $.m * $.R * $.R, 'That is a thin spherical shell. A solid sphere is (2/5)mR².']],
    },
    why: {
      which: {
        hoop: 'All of its mass is at the full radius, as far from the axis as it can be.',
        disk: 'Half its mass is inside r = 0.71R. The hoop puts all of it at R.',
        sphere: 'A solid sphere packs mass near the axis: (2/5)mR², the smallest of the three.',
      },
    },
  },
  'u6.17.plate': {
    traps: {
      I: [
        [($) => plateWith($, { plate: ($.mp * ($.w * $.w + $.h * $.h)) / 3 }), 'm(w² + h²)/3 is the plate about a corner. About its centre it is m(w² + h²)/12; then add m d² to move it.'],
        [($) => plateWith($, { disk: -(0.5 * $.md * $.r * $.r + $.md * ($.d - $.ax) ** 2) }), 'The disk is added to the plate, not cut out of it. Add its share.'],
      ],
    },
  },
  'u6.17.hole': {
    traps: {
      I: [
        [($) => diskWithHole({ mass: $.full, radius: $.R, holeRadius: $.r, holeOffset: $.d }).I + 0.5 * $.full * $.R * $.R, 'A disk is ½mR², not mR². Use it for the full disk and for the hole.'],
        [($) => 0.5 * diskWithHole({ mass: $.full, radius: $.R, holeRadius: $.r, holeOffset: $.d }).kept * $.R * $.R, 'That treats what remains as a whole disk of smaller mass. Its mass is not spread like a disk’s: subtract the hole’s moment instead.'],
      ],
    },
  },
  'u6.17.crate': {
    traps: {
      slide: [[($) => $.mu * $.m, 'Friction is μ times the normal force, a weight in newtons, not μ times the mass.']],
      tip: [
        [($) => ($.m * G * $.b) / $.hp, 'The weight acts at the centre, so its arm about the corner is b/2, not b.'],
        [($) => ($.m * G * 2 * $.hp) / $.b, 'The arms are swapped: the weight’s arm is b/2 and the push’s arm is its height.'],
      ],
    },
    why: {
      mode: {
        slide: 'It slides first when μmg is less than the tipping force mg(b/2)/h_P.',
        tip: 'It tips first when mg(b/2)/h_P is less than μmg: a tall, narrow crate pushed high.',
      },
    },
  },
  'u6.17.pin': {
    traps: {
      pin: [[($) => $.m * G, 'The pin does not carry the whole weight while the bar accelerates. Use ΣF = m a_G.']],
      alpha: [[($) => (3 * G * Math.sin($.theta * DEG)) / $.L, 'The weight acts at the centre: its arm is (L/2) sin θ, not L sin θ.']],
    },
  },
  'u6.17.pin-ft': {
    traps: {
      pin: [[($) => $.W, 'The pin does not carry the whole weight while the bar accelerates. Use ΣF = m a_G.']],
      alpha: [[($) => (3 * G_FT * Math.sin($.th * DEG)) / $.L, 'The weight acts at the centre: its arm is (L/2) sin θ, not L sin θ.']],
    },
  },
  'u6.17.roll': {
    traps: {
      a: [[($) => G * Math.sin($.theta * DEG), 'That is a frictionless slide. Friction acts on the body, and turning it takes some of the pull.']],
      f: [[
        ($) => (barRolls($) ? $.mu * $.m * G * Math.cos($.theta * DEG) : rollNeeds($)),
        ($) => (barRolls($)
          ? 'μN is the most friction can give. Rolling needs less, only what spins the body up with the right α.'
          : 'That is what rolling would need, but it is more than μN. The body slips, and friction is μN.'),
      ]],
    },
    why: {
      mode: {
        roll: 'It rolls when the friction rolling needs, mg sin θ·k/(1 + k), is within μN.',
        slip: 'It slips when rolling would need more friction than μN can supply.',
      },
    },
  },
  'u6.17.pin-sym': {
    traps: {
      O: [
        [($) => ($.comp === 'along' ? $.m * G : $.m * G * Math.sin($.theta * DEG)), ($) => ($.comp === 'along'
          ? 'That is the whole weight. Along the bar the pin balances only the weight’s component, mg cos θ.'
          : 'That treats G as still. Across the bar G accelerates at (L/2)α, so the pin carries only a quarter of mg sin θ.')],
        [($) => ($.comp === 'along' ? $.m * G * Math.sin($.theta * DEG) : 2 * $.m * G * Math.sin($.theta * DEG)), ($) => ($.comp === 'along'
          ? 'Sine and cosine are swapped. θ is from the downward vertical, so the weight’s part along the bar is mg cos θ.'
          : 'That uses I_G = mL²/12 for the moment about the pin. The bar turns about its end: I_O = mL²/3.')],
      ],
    },
  },
  'u6.17.pulled-wheel': {
    traps: {
      q: [
        [($) => ($.find === 'f' ? -pulledWheel($).f : $.mu * $.m * G), ($) => {
          if ($.find === 'P') return 'That is the pull that would slide a block. The wheel slips when the friction rolling needs reaches μmg: solve for P.';
          return $.at === 'centre'
            ? 'Check the direction. Pulled at the centre, the pull has no moment about G, so friction alone spins the wheel up: it points back.'
            : 'Check the direction. The cord over the top would spin the wheel faster than it rolls, so friction points forward.';
        }],
        [($) => ($.find === 'f' ? Math.sign(pulledWheel($).f) * $.mu * $.m * G : $.mu * $.m * G * (1 + $.kr * $.kr)), ($) => ($.find === 'f'
          ? 'μN is the most friction can give. Rolling needs only the friction that turns the wheel at α = a/R.'
          : ($.at === 'centre'
            ? 'Friction is k/(1 + k) of the pull at the centre, not 1/(1 + k). Set kP/(1 + k) = μmg.'
            : 'Friction is (1 − k)/(1 + k) of the pull over the top. Set that equal to μmg.'))],
      ],
      a: [
        [($) => ($.find === 'f' ? $.P : pulledWheel($).Pmax) / $.m, 'That is a block sliding without friction. Part of the push goes into spinning the wheel.'],
        [($) => {
          const P = $.find === 'f' ? $.P : pulledWheel($).Pmax;
          return $.at === 'centre' ? (2 * P) / ($.m * (1 + $.kr * $.kr)) : P / ($.m * (1 + $.kr * $.kr));
        }, ($) => ($.at === 'centre'
          ? 'That gives the pull a moment about G. At the centre it has none: only friction turns the wheel.'
          : 'The cord over the top also turns the wheel. Its moment PR adds to the spin, and the centre gains 2P/(m(1 + k)).')],
      ],
    },
  },
};

function barRolls($) {
  return rollNeeds($) <= $.mu * $.m * G * Math.cos($.theta * DEG) + 1e-9;
}
