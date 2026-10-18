/**
 * Unit 6 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI. A trap returns a value in SI, like the part's own `get`.
 */
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { centralInertia, diskWithHole } from '@flux/subjects/mechanics/inertia.js';
import { rotorInertia } from '../../labs/spinup.js';

const DEG = Math.PI / 180;
const RPM = (2 * Math.PI) / 60;
const SHAFT_M = 0.08;
const SHAFT_R = 0.005;
const SHAFT_MF = 0.02;
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
  'u6.17.spinup': {
    traps: {
      I: [
        [($) => $.md * $.R * $.R + 0.5 * SHAFT_M * SHAFT_R * SHAFT_R, 'mR² is a thin ring. A solid disk keeps much of its mass near the axis: ½mR².'],
        [($) => rotorInertia($.md, $.R * 1000, SHAFT_M, SHAFT_R * 1000), 'The radii are in millimetres. Convert them to metres before squaring.'],
      ],
      alpha0: [[($) => $.M / rotorInertia($.md, $.R, SHAFT_M, SHAFT_R), 'The bearings take 0.02 N·m from the start: α₀ = (M − M_f)/I.']],
      t: [
        [
          ($) => (rotorInertia($.md, $.R, SHAFT_M, SHAFT_R) * ($.load === 'pump' ? $.rpm * RPM : $.rpm)) / ($.M - SHAFT_MF),
          ($) => ($.load === 'pump'
            ? 'That holds α at its starting value. The pump load grows with ω and slows the climb: separate the variables.'
            : 'Convert rpm to rad/s: multiply by 2π/60.'),
        ],
        [
          ($) => (rotorInertia($.md, $.R, SHAFT_M, SHAFT_R) * ($.load === 'pump' ? $.rpm * RPM : $.rpm / 60)) / ($.M - SHAFT_MF - ($.load === 'pump' ? $.Mr : 0)),
          ($) => ($.load === 'pump'
            ? 'That charges the pump’s rated torque the whole way. It starts at zero and grows as ω².'
            : 'rpm/60 is in revolutions per second. One revolution is 2π rad.'),
        ],
      ],
    },
  },
};

function barRolls($) {
  return rollNeeds($) <= $.mu * $.m * G * Math.cos($.theta * DEG) + 1e-9;
}
