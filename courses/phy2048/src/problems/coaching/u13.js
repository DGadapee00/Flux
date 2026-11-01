/**
 * Unit 13 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */

export default {
  'ch17.air': {
    traps: {
      v: [
        [() => 331, 'That is the speed at 0 °C. The speed rises with the square root of the kelvin temperature.'],
        [($) => 331 * ($.temp + 273) / 273, 'That left out the square root. The speed is 331 m/s times the square root of T/273 K.'],
      ],
      lambdaMax: [
        [($) => $.v * $.fLow, 'That multiplies by the frequency. The wavelength is v/f.'],
        [($) => $.v / $.fHigh, 'That is the shortest wavelength. The longest one uses the lowest frequency.'],
      ],
      lambdaMin: [
        [($) => $.v / $.fLow, 'That is the longest wavelength. The shortest one uses the highest frequency.'],
        [($) => $.lambdaMin * 100, 'That is the wavelength in centimetres typed as metres. Divide by 100.'],
      ],
    },
  },
  'ch17.level': {
    traps: {
      I: [
        [($) => $.dp / (2 * $.rho * $.speed), 'That left out the square on the pressure. The intensity follows (Δp)².'],
        [($) => ($.dp * $.dp) / ($.rho * $.speed), 'That left out the 2. The average of a squared cosine is one half.'],
      ],
      beta: [
        [($) => 10 * Math.log10($.I), 'That forgot the threshold. The level is 10 log10(I/10⁻¹²), not 10 log10(I).'],
        [($) => 20 * Math.log10($.I / 1e-12), 'That is 20 log, which belongs to a pressure ratio. An intensity uses 10 log.'],
      ],
    },
  },
  'ch17.ratio': {
    traps: {
      delta: [
        [($) => $.ratio, 'That is the intensity ratio itself. The level difference is 10 log10 of the ratio.'],
        [($) => 20 * Math.log10($.ratio), 'That is 20 log. A ratio of intensities uses 10 log10.'],
      ],
    },
  },
  'ch17.distance': {
    traps: {
      delta: [
        [($) => 10 * Math.log10($.near / $.far), 'That is proportional to 1/r. Intensity follows 1/r², so the ratio of intensities is squared.'],
        [($) => -$.delta, 'That reports the drop as a rise. Moving farther from the source lowers the level.'],
      ],
    },
  },
  'ch17.pair': {
    traps: {
      both: [
        [($) => 2 * $.beta, 'That adds the decibel readings. Incoherent sources add intensities, which is about 3 dB, not a second copy of the level.'],
        [($) => $.beta, 'That leaves the level unchanged. A second equal source doubles the intensity.'],
      ],
    },
  },
  'ch17.stopped': {
    traps: {
      v: [
        [() => 331, 'That is the speed at 0 °C. Use 331 m/s times the square root of (θ + 273)/273.'],
        [() => 343, 'That is a round figure for about 20 °C. This temperature has its own speed.'],
      ],
      L: [
        [($) => $.v / (2 * $.f), 'That is an open pipe, which fits half a wavelength. A stopped pipe fits a quarter, so L = v/(4f).'],
        [($) => $.v / $.f, 'That is a whole wavelength. The stopped fundamental fits only a quarter of one.'],
      ],
      f9: [
        [($) => 4 * $.f, 'That counts the fourth overtone as n = 4. A stopped pipe skips the even numbers, so the fourth overtone is n = 9.'],
        [($) => 7 * $.f, 'That is the third overtone, n = 7. The fourth overtone is the next odd number, n = 9.'],
      ],
    },
  },
  'ch17.open': {
    traps: {
      f: [
        [($) => (331 * Math.sqrt(($.temp + 273) / 273)) / (4 * $.length), 'That is the fundamental of a stopped pipe. Both ends open, so the fundamental is v/(2L).'],
        [($) => (331 * Math.sqrt(($.temp + 273) / 273)) / $.length, 'That forgot the 2, or used it once for every harmonic. The frequency is n v/(2L).'],
      ],
    },
  },
  'ch17.beats': {
    traps: {
      fb: [
        [($) => $.f1 + $.f2, 'That adds the two frequencies. The beat is the absolute difference.'],
        [($) => ($.f1 + $.f2) / 2, 'That is the average pitch. The beat frequency is |f2 − f1|.'],
      ],
    },
  },
  'ch17.path': {
    traps: {
      r1: [
        [($) => $.x + $.y1, 'That adds the two sides. The path is the hypotenuse.'],
        [($) => $.x, 'That is only the distance along the centre line. The speaker is off that line.'],
      ],
      r2: [
        [($) => $.x + $.y2, 'That adds the two sides. The path is the hypotenuse.'],
        [($) => $.x, 'That is only the distance along the centre line. The speaker is off that line.'],
      ],
      f: [
        [($) => $.speed / Math.abs($.r2 - $.r1), 'That left out the 2. The first minimum is half a wavelength, so λ = 2|r2 − r1|.'],
        [($) => $.speed / $.r2, 'That uses one path as the wavelength. The wavelength comes from the difference of the paths.'],
      ],
    },
  },
  'ch17.horn': {
    traps: {
      fObs: [
        [($) => ($.f * $.v) / ($.v + $.vs), 'That is the pitch as the horn recedes. Check which way the motion points before choosing the sign.'],
        [($) => $.f + $.vs, 'That adds a speed, in m/s, to a frequency, in Hz. The shift is f times a ratio of speeds.'],
      ],
    },
  },
  'ch17.mach': {
    traps: {
      sound: [
        [($) => $.kmh / $.mach, 'That divides the speed in km/h by the Mach number and leaves the unit. Convert to m/s first.'],
        [($) => $.mach * ($.kmh * 1000) / 3600, 'That multiplies by the Mach number. The sound speed is the jet speed divided by M.'],
      ],
      angle: [
        [($) => 90 / $.mach, 'That divides 90° by the Mach number. The half-angle is the inverse sine of 1/M.'],
        [($) => Math.asin(1 / $.mach), 'That is the angle in radians. The question asks for degrees.'],
      ],
    },
  },
};
