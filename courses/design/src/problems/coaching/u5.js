/**
 * Unit 5 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { orificeFlow } from '@flux/subjects/design/instruments.js';
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
  'u5.4.thermocouple': {
    traps: {
      T: [
        [($) => $.tip, 'That is the true temperature. A logger that takes its terminals as 0 °C misses the room’s share.'],
        [($) => $.tip + $.room, 'The voltage measures tip minus terminals. The room’s temperature is lost, not added.'],
      ],
    },
  },
  'u5.5.orifice-flow': {
    traps: {
      Q: [
        [($) => (0.61 * (Math.PI / 4) * (Number($.beta) * 0.05) ** 2 * Math.sqrt((2 * $.dp) / 998)) * 3600, 'Include the velocity of approach: divide by √(1 − β⁴) inside the root.'],
        [($) => (orificeFlow({ dp: $.dp, D: 0.05, beta: Number($.beta) }) / 0.61) * 3600, 'Multiply by the discharge coefficient, 0.61: the jet narrows past the hole.'],
      ],
    },
  },
};
