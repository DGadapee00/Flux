/**
 * Unit 3 coaching, part two: traps for the pointing budget problems.
 * Folded into the bank by src/problems/index.js.
 */
import { insideNoBias, linearBudget } from '../bank/u3-budget.js';

export default {
  'u3.12.budget': {
    traps: {
      L: [
        [($) => linearBudget($, 'straight'), 'Independent random terms add in quadrature, √(σ₁² + σ₂²), not straight.'],
        [($) => linearBudget($, 'noBias'), 'Add the biases: the misalignment and the thermal bending move the whole spread.'],
      ],
    },
  },
  'u3.13.inside': {
    traps: {
      p: [
        [($) => insideNoBias($, 'oneAxis'), 'That is the chance for one axis. The boresight can miss in either cross-axis: in two dimensions the distance is Rayleigh, 1 − e^(−R²/2σ²).'],
        [($) => insideNoBias($, 'noSquare'), 'Square the ratio: the exponent is −R²/(2σ²).'],
      ],
    },
  },
};
