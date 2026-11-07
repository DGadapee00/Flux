/**
 * Unit 5 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { arrayNeeded, eclipseMin } from '../bank/u5.js';

export default {
  'u5.1.eclipse': {
    traps: {
      t: [
        [($) => eclipseMin($, 'half'), 'Half the orbit is not in shadow: Earth’s shadow covers an arc of half-angle asin(R/r) on each side of midnight.'],
        [($) => eclipseMin($, 'oneSide'), 'asin(R/r) is half the shadow’s arc; the whole arc is twice it, so T_e = T asin(R/r)/π.'],
      ],
    },
  },
  'u5.2.array': {
    traps: {
      P: [
        [($) => arrayNeeded($, 'average'), 'Matching the average load in daylight misses the battery’s losses: divide the eclipse share by 0.9 × 0.9.'],
        [($) => arrayNeeded($, 'load'), 'The array must also refill the battery for the eclipse, not only run the load.'],
      ],
    },
  },
};
