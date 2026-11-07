/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { rcVolt } from '../bank/u2.js';

export default {
  'u2.1.rc-divider': {
    traps: {
      v: [
        [($) => rcVolt($, 'sum'), 'Impedances add as complex numbers: |Z| = √(R² + X_C²), not R + X_C.'],
        [($) => rcVolt($, 'phasor', $.f), 'X_C = 1/(ωC) with ω = 2πf in rad/s, not f in hertz.'],
      ],
    },
  },
};
