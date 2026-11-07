/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { correctingC, harmonicOut, lineCurrent, rcVolt } from '../bank/u2.js';

export default {
  'u2.1.rc-divider': {
    traps: {
      v: [
        [($) => rcVolt($, 'sum'), 'Impedances add as complex numbers: |Z| = √(R² + X_C²), not R + X_C.'],
        [($) => rcVolt($, 'phasor', $.f), 'X_C = 1/(ωC) with ω = 2πf in rad/s, not f in hertz.'],
      ],
    },
  },
  'u2.3.harmonic': {
    traps: {
      a: [
        [($) => harmonicOut($, undefined, 1), 'The square wave’s harmonics carry 4/π in front: the fundamental is 1.27 V, larger than the square itself.'],
        [($) => harmonicOut($, (x) => 1 / Math.sqrt(1 + (2 * Math.PI * x) ** 2)), 'Compare a frequency with a frequency: f/f_c in hertz, or ω/ω_c. Mixing ω with f_c puts in an extra 2π.'],
      ],
    },
  },
  'u2.5.pf': {
    traps: {
      v: [
        [($) => ($.ask === 'I' ? (1000 * $.P) / 240 : correctingC($) * 2 * Math.PI), ($) => ($.ask === 'I' ? 'That is P/V, the current at power factor 1. With a lagging power factor, the line carries more: P/(V cos θ).' : 'Use ω = 2πf in rad/s, not f in hertz.')],
        [($) => ($.ask === 'I' ? lineCurrent($) * Number($.pf) ** 2 : ((1000 * $.P * Math.sin(Math.acos(Number($.pf)))) / (240 ** 2 * 2 * Math.PI * 60)) * 1e6), ($) => ($.ask === 'I' ? 'Divide by the power factor, don’t multiply: I = P/(V cos θ).' : 'The reactive power is P tan θ, not P sin θ.')],
      ],
    },
  },
};
