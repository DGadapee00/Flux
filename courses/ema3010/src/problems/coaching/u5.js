/**
 * Unit 5 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { numberAvg } from '../bank/u5.js';
import { logEta } from '../bank/u5.js';
import { COUPLE } from '@flux/subjects/matsci/galvanic.js';
import { ratioRate } from '../bank/u5.js';

export default {
  'u5.1.mn': {
    traps: {
      Mn: [
        [($) => numberAvg($, true), 'That is the weight average, M̄_w = m₀(1 + p)/(1 − p). The number average counts every chain once.'],
        [($) => numberAvg($, false, 1), 'That is the degree of polymerisation. Multiply by 104 g/mol.'],
      ],
    },
  },
  'u5.3.viscosity': {
    traps: {
      le: [
        [($) => logEta($, 0), 'Use kelvin: 546 °C is 819 K.'],
        [($) => logEta($, 273.15, -1), 'The bracket is 1/T − 1/T₁: a colder glass is more viscous, so below 546 °C log₁₀ η must exceed 12.'],
      ],
    },
  },
  'u5.5.ratio': {
    traps: {
      v: [
        [($) => ratioRate($, 1), 'That would hold if oxygen supply limited the cathode. With both on Tafel lines the rate grows as the ratio to the power b_c/(b_a + b_c).'],
        [($) => ratioRate($, COUPLE.ba / (COUPLE.ba + COUPLE.bc)), 'The power is b_c/(b_a + b_c) = 2/3: the steeper cathode line moves the potential further.'],
      ],
    },
  },
};
