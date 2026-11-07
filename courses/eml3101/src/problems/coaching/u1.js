/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { R_UNIVERSAL } from '@flux/subjects/thermo/idealgas.js';
import { mix } from '../bank/u1.js';

export default {
  'u1.1.fractions': {
    traps: {
      y: [
        [($) => mix($).xB, 'That is the mass fraction. Divide each mass by its molar mass first: molecules, not kilograms.'],
        [($) => mix($).NB / mix($).NA, 'That is the ratio of the second gas to nitrogen. The fraction divides by the total, N_A + N_B.'],
      ],
    },
  },
  'u1.2.partial': {
    traps: {
      p: [
        [($) => mix($, $.T).pBmass / 1000, 'That splits the pressure by mass. Partial pressure goes with the mole fraction: p_i = y_i p.'],
        [($) => mix($, $.T).p / 1000, 'That is the total pressure. The second gas contributes only its own molecules’ share.'],
      ],
    },
  },
  'u1.3.molar': {
    traps: {
      v: [
        [($) => {
          const r = mix($);
          const Mx = r.xA * r.MA + r.xB * r.MB;
          return $.ask === 'M' ? 1000 * Mx : R_UNIVERSAL / Mx;
        }, 'Molar mass is per mole: weight it by mole fraction, or take m/N. Weighting by mass overcounts the heavy gas.'],
        [($) => {
          const r = mix($);
          return $.ask === 'M' ? 500 * (r.MA + r.MB) : 0.5 * (R_UNIVERSAL / r.MA + R_UNIVERSAL / r.MB);
        }, 'A plain average ignores how much of each gas there is. Weight by the amounts.'],
      ],
    },
  },
};
