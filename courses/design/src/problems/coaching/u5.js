/**
 * Unit 5 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { ACTIVE, strainAt } from '../bank/u5.js';

export default {
  'u5.1.bridge-output': {
    traps: {
      V: [
        [($) => 5 * ACTIVE[$.kind] * 2 * strainAt($.P) * 1000, 'Divide by 4: each active gauge gives a quarter of V GF ε.'],
        [($) => (5 * ACTIVE[$.kind] * strainAt($.P) * 1000) / 4, 'Multiply by the gauge factor, 2: it turns strain into a resistance change.'],
      ],
    },
  },
  'u5.3.alias': {
    traps: {
      fa: [
        [($) => $.f, 'Above the Nyquist frequency, 500 Hz, the data cannot show the true frequency. It folds back.'],
        [($) => $.f - 500, 'It folds about the sample rate, not about half of it: fₛ − f.'],
      ],
    },
  },
};
