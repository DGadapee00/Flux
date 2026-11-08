/**
 * Unit 4 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { duty } from '../bank/u4.js';
import { vapourIn } from '../bank/u4.js';

export default {
  'u4.1.duty': {
    traps: {
      q: [
        [($) => duty($, 'parallel') / 1000, 'That is the parallel-flow effectiveness. The streams run opposite ways: use the counterflow formula.'],
        [($) => duty($, 'counter', true) / 1000, 'q = εC_min(T_h,i − T_c,i): the most either stream can change is set by the smaller capacity rate.'],
      ],
    },
  },
  'u4.3.humidity': {
    traps: {
      rv: [
        [($) => vapourIn($, (T) => T), 'Saturation at the wick’s temperature, not the air’s: the vapour leaves from the wick’s surface.'],
        [($) => vapourIn($, undefined, 1), 'The air holds less vapour than the wick’s surface: subtract the correction, do not add it.'],
      ],
    },
  },
};
