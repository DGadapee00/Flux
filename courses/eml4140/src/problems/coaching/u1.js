/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { ALPHA } from '@flux/subjects/heat/rod.js';
import { HALF, midTheta } from '../bank/u1.js';

export default {
  'u1.1.half-time': {
    traps: {
      t: [
        [($) => (Math.log(2) * $.L ** 2) / ALPHA[$.material], 'The decay rate of the half sine is π²α/L², not α/L². Divide by π².'],
        [($) => (HALF * $.L) / ALPHA[$.material], 'The time scales with L², not L: square the length.'],
      ],
    },
  },
  'u1.2.middle': {
    traps: {
      T: [
        [($) => 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.01), 'That is the excess above the ends. Add the ends’ 20 °C.'],
        [($) => 20 + 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.1), 'Fo = αt/L² takes L squared: 0.1² = 0.01 m².'],
      ],
    },
  },
  'u1.3.scale': {
    traps: {
      t2: [
        [($) => $.t1 * ($.L2 / 0.1) * (ALPHA.copper / ALPHA[$.material]), 'The time grows as the square of the length.'],
        [($) => $.t1 * ($.L2 / 0.1) ** 2 * (ALPHA[$.material] / ALPHA.copper), 'A smaller diffusivity is slower, so it takes longer: multiply by α₁/α₂.'],
      ],
    },
  },
};
