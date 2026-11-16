/**
 * Unit 15 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { combined, presentValue, unitCost } from '../bank/u15.js';

export default {
  'u15.1.unit': {
    traps: {
      c: [
        [($) => unitCost($, 'perUnit'), 'The slope applies per doubling of the quantity, not per unit: T_n = T₁ n^{log₂ S}.'],
        [($) => unitCost($, 'cumAvg'), 'That is the cumulative-average form. The unit form gives T_n = T₁ n^b directly.'],
      ],
    },
  },
  'u15.2.pv': {
    traps: {
      p: [
        [($) => presentValue($, 'noDiscount'), 'Money paid later is worth less today: discount each year by (1 + r)^t.'],
        [($) => presentValue($, 'lastYear'), 'Each payment is discounted by its own year, not all by the last.'],
      ],
    },
  },
  'u15.3.combine': {
    traps: {
      c: [
        [($) => combined($, 'mean'), 'A plain average ignores which estimate is tighter: weight each by 1/σ².'],
        [($) => combined($, 'invSigma'), 'Weight by the inverse of the variance, 1/σ², not of the standard error.'],
      ],
    },
  },
};
