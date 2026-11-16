/**
 * Unit 13 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { damageFactor, grms, transitionTime } from '../bank/u13.js';

export default {
  'u13.1.grms': {
    traps: {
      g: [
        [($) => grms($, 'flatOnly'), 'The sloped ends carry energy too: integrate W over the rising and falling segments as well as the plateau.'],
        [($) => grms($, 'noSqrt'), 'The integral of W is g_rms squared: take the square root.'],
      ],
    },
  },
  'u13.2.db': {
    traps: {
      k: [
        [($) => damageFactor($, 'wRatio'), 'The spectrum’s ratio is not the damage ratio: the response goes as √W and damage as the response to the power b.'],
        [($) => damageFactor($, 'noHalf'), 'Damage goes as g_rms^b, and g_rms as √W: raise the spectrum’s ratio to b/2, not b.'],
      ],
    },
  },
  'u13.3.trans': {
    traps: {
      h: [
        [($) => transitionTime($, 'massOnly'), 'A lower emissivity radiates less: divide by ε/0.9 as well as multiplying by the mass ratio.'],
        [($) => transitionTime($, 'epsOnly'), 'More thermal mass takes longer at the same flux: multiply by the mass ratio too.'],
      ],
    },
  },
};
