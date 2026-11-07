/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { ORDER, POWER, newtonStep, oneStep } from '../bank/u2.js';

export default {
  'u2.5.newton-step': {
    traps: {
      x1: [
        [($) => newtonStep($, 'plus'), 'Step against the function: x₁ = x₀ − f/f′. The tangent meets the axis on the side f slopes down to.'],
        [($) => newtonStep($, 'flip'), 'The step is f/f′, the height over the slope, not f′/f.'],
      ],
    },
  },
  'u2.1.estimate': {
    traps: {
      err: [
        [() => U, 'That is the error of one operation. The subtraction divides it by the small difference x²/2.'],
        [($) => 2 * U * 10 ** POWER[$.k], 'The difference 1 − cos x is about x²/2, not x: square x.'],
      ],
    },
  },
  'u2.3.halve': {
    traps: {
      E2: [
        [($) => $.E / 2, 'That is first order. This method’s error falls faster: divide by 2ᵖ.'],
        [($) => $.E / 4 ** ORDER[$.method], 'Halving h once divides the error by 2ᵖ, not 4ᵖ.'],
      ],
    },
  },
  'u2.7.one-step': {
    traps: {
      y: [
        [($) => ($.method === 'euler' ? 1 / (1 + 2 * $.h) : oneStep('euler', $.h)), ($) => ($.method === 'euler' ? 'That uses the slope at the end of the step, the backward Euler method. Forward Euler uses the slope at the start.' : 'That is a single Euler step. RK4 blends four slopes.')],
        [($) => ($.method === 'euler' ? Math.exp(-2 * $.h) : oneStep('midpoint', $.h)), ($) => ($.method === 'euler' ? 'That is the exact value, e^(−2h). Euler only follows the starting slope.' : 'That stops at the midpoint method, two slopes. RK4 needs all four.')],
      ],
    },
  },
};
