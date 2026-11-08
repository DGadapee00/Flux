/**
 * Unit 4 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { ALLOYS } from '@flux/subjects/matsci/fracture.js';
import { critA } from '../bank/u4.js';
import { PART } from '@flux/subjects/matsci/fatigue.js';
import { parisLife } from '../bank/u4.js';
import { creepRate } from '../bank/u4.js';

export default {
  'u4.1.critical': {
    traps: {
      a: [
        [($) => critA($, 1), 'Divide by π: K = σ√(πa), so a_c = (K_Ic/σ)²/π.'],
        [($) => critA($, Math.PI, ($$) => ALLOYS[$$.alloy].sy), 'That uses the yield strength. The crack runs at the stress the plate carries.'],
      ],
    },
  },
  'u4.3.paris': {
    traps: {
      N: [
        [($) => parisLife($, 1), 'Include the geometry factor: ΔK = 1.12Δσ√(πa) for an edge crack.'],
        [($) => parisLife($, PART.Y, 1), 'Put the crack depth in metres: C and K_Ic use metres.'],
      ],
    },
  },
  'u4.5.creep': {
    traps: {
      r: [
        [($) => creepRate($, 0), 'Use kelvin in exp(−Q/RT): 850 °C is 1123 K.'],
        [($) => creepRate($, 273.15, 1), 'The stress is raised to the power n = 5.'],
      ],
    },
  },
};
