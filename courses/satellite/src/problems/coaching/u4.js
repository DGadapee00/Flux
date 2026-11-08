/**
 * Unit 4 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { A_IN, outG } from '../bank/u4.js';
import { milesG } from '../bank/u4.js';

export default {
  'u4.1.output': {
    traps: {
      a: [
        [($) => outG($) / A_IN, 'T is a ratio: multiply it by the 2 g input.'],
        [($) => outG($, true), 'r is the shaking frequency over the natural frequency, f/f_n.'],
      ],
    },
  },
  'u4.3.miles': {
    traps: {
      g: [
        [($) => milesG($, 'nopi'), 'Keep the π/2 from integrating the resonance: g_rms = √((π/2) f_n Q W).'],
        [($) => milesG($, 'nosqrt'), 'That is the mean square, in g². Take the square root for g rms.'],
      ],
    },
  },
};
