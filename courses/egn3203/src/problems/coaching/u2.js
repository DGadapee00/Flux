/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { POWER } from '../bank/u2.js';

export default {
  'u2.1.estimate': {
    traps: {
      err: [
        [() => U, 'That is the error of one operation. The subtraction divides it by the small difference x²/2.'],
        [($) => 2 * U * 10 ** POWER[$.k], 'The difference 1 − cos x is about x²/2, not x: square x.'],
      ],
    },
  },
};
