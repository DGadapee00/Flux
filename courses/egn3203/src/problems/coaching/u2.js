/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { U } from '@flux/subjects/math/roundoff.js';
import { ORDER, POWER, newtonStep, oneStep } from '../bank/u2.js';
import { quadAt } from '../bank/u2.js';
import { fwdErr } from '../bank/u2.js';
import { eulerLimit } from '../bank/u2.js';
import { piSE } from '../bank/u2.js';
import { stepX } from '../bank/u2.js';

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
  'u2.9.quadratic': {
    traps: {
      p: [
        [($) => quadAt($, 'true'), 'That is f itself. The question asks what the quadratic through the three points gives.'],
        [($) => quadAt($, 'line'), 'That joins (0, 1) and (1, 1/26) by a straight line. Fit the quadratic through all three.'],
      ],
    },
  },
  'u2.11.forward': {
    traps: {
      e: [
        [($) => fwdErr($, 'central'), 'That is the central difference’s error. The forward difference is first order: (h/2)|f″|.'],
        [($) => fwdErr($, 'half'), 'The Taylor term is (h²/2)f″; divided by h it leaves (h/2)f″, not hf″.'],
      ],
    },
  },
  'u2.13.limit': {
    traps: {
      h: [
        [($) => eulerLimit($, 1), 'That keeps 1 + hλ ≥ 0. Stability needs only |1 + hλ| ≤ 1, which allows h up to 2/|λ|.'],
        [($) => (1000 * Math.abs(Number($.lam))) / 2, 'Divide by |λ|: a faster mode needs a shorter step.'],
      ],
    },
  },
  'u2.15.pi-se': {
    traps: {
      se: [
        [($) => piSE($, 1), 'That is the standard error of the share inside. The estimate is 4 times the share, so its error is 4 times too.'],
        [($) => piSE($, 4, 1), 'Divide by √N, not N: the spread of an average shrinks as the square root of the count.'],
      ],
    },
  },
  'u2.17.newton-step': {
    traps: {
      x: [
        [($) => stepX($, 'one'), 'That steps x on the first equation alone, holding y. Newton solves for both corrections together: J Δ = −F.'],
        [($) => stepX($, 'sign'), 'Solve J Δ = −F, then add: x₁ = x₀ + Δx.'],
      ],
    },
  },
};
