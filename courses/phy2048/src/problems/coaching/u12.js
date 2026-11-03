/**
 * Unit 12 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */

export default {
  'ch16.rope': {
    traps: {
      v: [
        [($) => $.distance * $.time, 'That multiplies the distance by the time. The speed is the distance divided by the time.'],
        [($) => $.distance / ($.time * $.time), 'That divides by the time twice. The speed is the distance over the time, once.'],
      ],
      T: [
        [($) => $.f, 'That is the frequency in hertz. The period is 1/f.'],
        [($) => 2 / $.f, 'That is two periods. One cycle takes 1/f.'],
      ],
      lambda: [
        [($) => $.v * $.f, 'That multiplies by the frequency. The wavelength is v/f, because v = fλ.'],
        [($) => $.distance, 'That is how far the pulse was watched, not the length of one cycle. λ = v/f.'],
      ],
    },
  },
  'ch16.snapshot': {
    traps: {
      v: [
        [($) => ($.shift / $.dt) * 100, 'That is the speed in cm/s typed as if it were m/s. A centimetre is 0.01 m, so 2.00 cm/s is 0.0200 m/s.'],
        [($) => $.shift * $.dt, 'That multiplies the shift by the time. The speed is the shift divided by the time, in metres per second.'],
      ],
      T: [
        [($) => $.lambda, 'That is the wavelength in metres, not the period. The period is λ/v.'],
        [($) => (2 * $.lambda) / $.v, 'That is two periods. One cycle is λ/v.'],
      ],
      f: [
        [($) => 2 * Math.PI * $.f, 'That is the angular frequency, 2πf. The frequency in hertz is 1/T.'],
        [($) => 1 / $.dt, 'That is the reciprocal of the travel time in the question, not of the period. The period is λ/v.'],
      ],
    },
  },
  'ch16.function': {
    traps: {
      lambda: [
        [($) => Math.PI / $.k, 'That left out the 2. One full cycle of the sine is 2π, so λ = 2π/k.'],
        [($) => $.k, 'That is the wave number, in rad/m. The wavelength is 2π/k.'],
      ],
      T: [
        [($) => Math.PI / $.omega, 'That left out the 2. The period is 2π/ω.'],
        [($) => $.omega, 'That is the angular frequency. The period is 2π/ω, in seconds.'],
      ],
      v: [
        [($) => $.omega * $.k, 'That multiplies k and ω. The wave speed is ω/k.'],
        [($) => $.omega / (2 * Math.PI), 'That is the frequency in hertz. The wave speed is ω/k, or fλ.'],
      ],
    },
  },
  'ch16.particle': {
    traps: {
      vmax: [
        [($) => $.A * $.omega / (2 * Math.PI), 'That is A times the frequency in hertz. The transverse speed has amplitude Aω.'],
        [($) => $.A, 'That is the amplitude, in metres. The maximum transverse speed is Aω.'],
      ],
      v: [
        [($) => $.omega * $.k, 'That multiplies k and ω. The wave speed is ω/k.'],
        [($) => $.A * $.omega, 'That is the largest speed of a point on the string. The wave speed is ω/k.'],
      ],
    },
  },
  'ch16.guitar': {
    traps: {
      v: [
        [($) => $.F / $.mu, 'That left out the square root. The speed is √(F/μ).'],
        [($) => Math.sqrt($.mu / $.F), 'That inverts the ratio. A tighter string is faster: v = √(F/μ).'],
      ],
      F2: [
        [($) => 20 * $.F, 'Twenty times the high-E tension is the section’s rough comparison. The tension that matches the speed is μ₂ v², and the density ratio is not exactly 20.'],
        [($) => $.mu * $.v * $.v, 'That uses the lighter string’s density. The heavier string needs F = μ₂ v².'],
      ],
    },
  },
  'ch16.pitch': {
    traps: {
      L: [
        [($) => $.v / $.fHigh, 'That left out the 2. A string fixed at both ends fits half a wavelength, so L = v/(2f).'],
        [($) => $.v / (2 * $.fLow), 'That used the lower pitch for the length. The length is set by the higher open frequency, L = v/(2f).'],
      ],
      vLow: [
        [($) => $.v, 'That keeps the original wave speed. Tuning down, at the same length, slows the wave: v = 2 L f.'],
        [($) => $.v * ($.fHigh / $.fLow), 'That raises the speed. The lower pitch is the smaller frequency, so the wave is slower.'],
      ],
    },
  },
  'ch16.power': {
    traps: {
      P: [
        [($) => $.P * 2, 'That left out the one half, or put it in twice. The average power is (1/2) μ A² ω² v.'],
        [($) => $.P / $.A, 'That is linear in the amplitude. The power follows A², so the amplitude has to be squared.'],
      ],
    },
  },
  'ch16.modes': {
    traps: {
      v: [
        [($) => ($.m * 9.81) / $.mu, 'That left out the square root. The speed is √(mg/μ).'],
        [($) => Math.sqrt($.mu / ($.m * 9.81)), 'That inverts the ratio. A heavier hanger, on the same string, is a faster wave.'],
      ],
      f1: [
        [($) => $.v / $.L, 'That left out the 2. The fundamental is v/(2L), one half-wavelength on the string.'],
        [($) => $.v / (4 * $.L), 'That is the fundamental of a tube closed at one end. This string is fixed at both ends, so f₁ = v/(2L).'],
      ],
      f3: [
        [($) => 2 * $.f1, 'That is the second mode. The third mode is 3 f₁.'],
        [($) => $.f1, 'That is the fundamental again. Mode n has frequency n f₁.'],
      ],
    },
  },
  'ch16.superpose': {
    traps: {
      y: [
        [($) => $.A * Math.sin($.k * $.x - $.omega * $.t), 'That is one of the two waves. The string shows the sum, 2 A sin(kx) cos(ωt).'],
        [($) => 2 * $.A, 'That adds the amplitudes everywhere. The sum reaches 2A only where sin(kx) and cos(ωt) are both ±1.'],
      ],
    },
  },
};
