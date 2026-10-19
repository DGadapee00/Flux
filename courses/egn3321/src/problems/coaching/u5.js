/**
 * Unit 5 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI. A trap returns a value in SI, like the part's own `get`.
 */
import { M_PER_FT } from '@flux/subjects/convert.js';

const DEG = Math.PI / 180;

/** The driven sense: +1 when the driven member turns the same way as the driver. */
const beltSense = ($) => ($.belt === 'crossed' ? -1 : 1);
const gearSense = ($) => ($.mesh === 'external' ? -1 : 1);

export default {
  'u5.16.belt': {
    traps: {
      speed: [[($) => 2 * $.r1 * $.w1, 'That uses the diameter. The rim speed is the radius times ω.']],
      omega: [
        [($) => beltSense($) * ($.r2 / $.r1) * $.w1, 'The ratio is upside down. The belt speed is shared, so the larger pulley turns more slowly: ω₂ = (r₁/r₂)ω₁.'],
        [($) => -beltSense($) * ($.r1 / $.r2) * $.w1, ($) => ($.belt === 'crossed'
          ? 'A crossed belt reverses the sense: the driven pulley turns the other way.'
          : 'An open belt keeps the sense: both pulleys turn the same way.')],
      ],
    },
  },
  'u5.16.gears': {
    traps: {
      omega: [
        [($) => -gearSense($) * ($.r1 / $.r2) * $.w1, ($) => ($.mesh === 'external'
          ? 'External gears reverse the sense: the driven gear turns the other way.'
          : 'A ring gear meshes on its inside: it turns the same way as the pinion.')],
        [($) => gearSense($) * ($.r2 / $.r1) * $.w1, 'The ratio is upside down. The pitch-line speed is shared, so the larger gear turns more slowly.'],
      ],
      alpha: [[($) => gearSense($) * ($.r1 / $.r2) * $.w1, 'That is ω₂. The angular acceleration scales from the driver’s α, by the same ratio.']],
    },
  },
  'u5.16.pulley-ft': {
    traps: {
      speed: [[($) => $.r1 * $.w1 * M_PER_FT, 'No conversion is needed: radii in feet give a belt speed in ft/s.']],
      omega: [[($) => ($.r2 / $.r1) * $.w1, 'The ratio is upside down. The larger pulley turns more slowly: ω₂ = (r₁/r₂)ω₁.']],
    },
  },
  'u5.16.absolute': {
    traps: {
      x: [[($) => ($.r + $.l) * Math.cos($.theta * DEG), 'The rod is not parallel to the crank. Its angle φ comes from sin φ = (r/ℓ) sin θ, and its reach is ℓ cos φ.']],
      v: [[($) => -$.r * $.omega * Math.sin($.theta * DEG), 'That is only the crank pin’s speed along the slider line. The rod also rotates: keep the −ℓ sin φ φ̇ term.']],
    },
  },
  'u5.16.bar': {
    traps: {
      vx: [[($) => $.vax + $.omega * $.ry, 'Check the sign: ω × r = (−ω r_y, ω r_x). The x part carries a minus.']],
      vy: [[($) => $.omega * $.rx, 'Add the velocity of A. B moves with A, plus its rotation about A.']],
    },
  },
  'u5.16.ladder': {
    traps: {
      omega: [[($) => $.v / ($.L * Math.cos($.theta * DEG)), 'The foot is L sin θ from the instantaneous centre, which is level with the top. Divide by that, not L cos θ.']],
      vTop: [[($) => $.v * Math.tan($.theta * DEG), 'That is v tan θ. The top falls at v/tan θ: a steep ladder’s top moves slowly.']],
    },
  },
  'u5.16.wheel': {
    traps: {
      speed: [[($) => $.v, 'Rim points do not all move at the centre speed. The mark moves at ω times its distance from the contact point.']],
      vTop: [[($) => $.v, 'The top is 2R from the contact point, the instantaneous centre. It moves at 2v.']],
    },
  },
  'u5.16.accel': {
    traps: {
      a: [
        [($) => -$.r * $.omega * $.omega * Math.cos($.theta * DEG) - $.r * $.alpha * Math.sin($.theta * DEG), 'That is the crank pin’s acceleration along the slider line. The rod also rotates, and its ℓφ̇² and ℓφ̈ terms count.'],
        [($) => -$.r * $.omega * $.omega, 'rω² is the size of the crank pin’s acceleration, pointed at the crank centre. Only its part along the slider line counts, and the rod adds its own.'],
      ],
    },
  },

  'u5.16.rotor-tip': {
    traps: {
      speed: [
        [($) => $.r * $.w, 'That is the tip’s speed about the hub alone. The helicopter is moving too, so its velocity adds as a vector.'],
        [($) => $.w, 'ω is an angular rate. Multiply by the radius to get the tip’s speed, v = ωr.'],
      ],
      accel: [
        [($) => $.r * $.w, 'Acceleration toward the hub is ω²r. That is ωr, a speed, not an acceleration.'],
        [($) => $.w * $.w, 'The centripetal acceleration is ω²r. The radius is missing.'],
      ],
    },
  },
};
