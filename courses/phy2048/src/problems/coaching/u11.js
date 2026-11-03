/**
 * Unit 11 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
import { G } from '@flux/subjects/mechanics/constants.js';

export default {
  'ch15.ultrasound': {
    traps: {
      f: [
        [($) => 1e-6 / $.T, 'That treats the number of microseconds as if it were already in seconds. Convert first: 0.400 μs is 4.00×10⁻⁷ s.'],
        [($) => (2 * Math.PI) / $.T, 'That is the angular frequency, 2π/T. The frequency in hertz is 1/T.'],
      ],
    },
  },
  'ch15.block': {
    traps: {
      w: [
        [($) => Math.sqrt($.m / $.k), 'That inverts the ratio. ω = √(k/m), not √(m/k).'],
        [($) => $.k / $.m, 'That left out the square root. The angular frequency is √(k/m).'],
      ],
      T: [
        [($) => 2 * Math.PI * Math.sqrt($.k / $.m), 'That swaps m and k. T = 2π√(m/k).'],
        [($) => $.T * (1 + $.A), 'The amplitude is not in the period. A larger swing is faster, and T stays 2π√(m/k).'],
      ],
      vmax: [
        [($) => $.A / $.T, 'That is amplitude over period. The maximum speed is Aω, and ω is 2π/T, not 1/T.'],
        [($) => $.A * $.w / (2 * Math.PI), 'That is A times the frequency in hertz. The maximum speed is Aω.'],
      ],
      amax: [
        [($) => $.A * $.w, 'That is the maximum speed. Acceleration brings a second factor of ω, so a_max = Aω².'],
        [($) => $.A / ($.T * $.T), 'The period is not the right divisor. a_max = Aω², and ω = 2π/T.'],
      ],
    },
  },
  'ch15.motion': {
    traps: {
      x: [
        [($) => $.A * Math.sin($.w * $.t), 'That uses sine. With phase zero, x = A at t = 0, which is a cosine.'],
        [($) => $.A, 'That is the position at t = 0. It has moved by the time in the question.'],
      ],
      v: [
        [($) => $.A * $.w * Math.sin($.w * $.t), 'The velocity of A cos(ωt) is −Aω sin(ωt). The sign says which way it is going.'],
        [($) => -$.A * $.w * Math.cos($.w * $.t), 'That keeps the cosine. Differentiating cos(ωt) brings a sine, and a factor of ω.'],
      ],
      a: [
        [($) => -$.w * $.x, 'That has one factor of ω. Acceleration is −ω² x.'],
        [($) => $.w * $.w * $.x, 'The sign is wrong. The acceleration points back toward equilibrium, so a = −ω² x.'],
      ],
    },
  },
  'ch15.energy': {
    traps: {
      E: [
        [($) => $.k * $.A * $.A, 'That left out the one half. The total energy is (1/2) k A².'],
        [($) => 0.5 * $.k * $.x * $.x, 'That is the potential at this x, not the total. The total is (1/2) k A², and it is the same at every x.'],
      ],
      v: [
        [($) => Math.sqrt($.k / $.m) * $.A, 'That is the maximum speed, at x = 0. At this displacement some of the energy is still potential.'],
        [($) => Math.sqrt($.k / $.m) * ($.A - $.x), 'The remaining stretch is not a difference of lengths. v = ω √(A² − x²).'],
      ],
    },
  },
  'ch15.vertical': {
    traps: {
      shift: [
        [($) => $.m / $.k, 'That left out g. The spring balances the weight, so the shift is mg/k.'],
        [($) => $.k / ($.m * G), 'That inverts the ratio. A stiffer spring, or a lighter block, shifts less: δ = mg/k.'],
      ],
    },
  },
  'ch15.pendulum-g': {
    traps: {
      g: [
        [($) => (2 * Math.PI * Math.sqrt($.L)) / $.T, 'That still has a square root on the length and only one power of the period. Square both sides of T = 2π√(L/g).'],
        [($) => (4 * Math.PI * Math.PI) / ($.L * $.T * $.T), 'That puts the length in the denominator. g = 4π² L / T², so a longer pendulum, at the same period, means a larger g.'],
      ],
    },
  },
  'ch15.skyscraper': {
    traps: {
      L: [
        [($) => G / (4 * Math.PI * Math.PI * $.f * $.f), 'That is a simple pendulum, L = g T² / (4π²). A uniform beam about one end is longer: L = 3g / (8π² f²).'],
        [($) => (3 * G * $.f * $.f) / (8 * Math.PI * Math.PI), 'That uses the frequency as if it were the period. The period is 1/f, and the length follows the period squared.'],
      ],
    },
  },
  'ch15.torsion': {
    traps: {
      kappa: [
        [($) => (($.m * $.L * $.L) / 3) * (2 * Math.PI / $.T) ** 2, 'That is the moment about one end. The string is at the center, so I = ML²/12, four times smaller.'],
        [($) => (($.m * $.L * $.L) / 12) * $.T, 'That multiplies by the period. κ = I ω², and ω = 2π/T.'],
      ],
    },
  },
  'ch15.damped': {
    traps: {
      envelope: [
        [($) => $.A0, 'That is the starting amplitude. The envelope has already fallen by e^(−bt/2m).'],
        [($) => $.A0 * Math.exp((-$.b * $.t) / $.m), 'The exponent is −bt/(2m), not −bt/m. The 2 comes from writing the decay as b/2m.'],
      ],
      omegaD: [
        [($) => Math.sqrt($.k / $.m), 'That is the undamped ω₀. Damping lowers the oscillation frequency to √(ω₀² − (b/2m)²).'],
        [($) => Math.sqrt($.k / $.m) - $.b / (2 * $.m), 'The correction is inside the square root, as a square, not subtracted afterward.'],
      ],
    },
  },
  'ch15.driven': {
    traps: {
      A: [
        [($) => $.F0 / ($.b * $.w), 'That is the resonance formula with the drive frequency in place of ω₀. Off resonance the full denominator is larger.'],
        [($) => $.F0 / $.k, 'That is the static stretch, F₀/k. A moving drive does not sit at that amplitude unless ω is zero.'],
      ],
      lag: [
        [($) => ($.lag * 180) / Math.PI, 'That is the lag in degrees. The part asks for radians.'],
        [($) => Math.PI / 2, 'The lag is π/2 only on resonance. Below ω₀ it is smaller, and above ω₀ it is larger, approaching π.'],
      ],
      Amax: [
        [($) => $.F0 / $.b, 'That left out ω₀. On resonance, A = F₀/(b ω₀).'],
        [($) => $.F0 / ($.b * $.w), 'That uses the drive frequency. The natural frequency is √(k/m), which is the ω in F₀/(b ω).'],
      ],
    },
  },
};
