/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { harmonicOut, rcVolt } from '../bank/u2.js';

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
};
