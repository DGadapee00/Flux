/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { R_UNIVERSAL } from '@flux/subjects/thermo/idealgas.js';
import { mix } from '../bank/u1.js';
import { airFuel, dripped, humidity } from '../bank/u1.js';

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
  'u1.5.air-fuel': {
    traps: {
      af: [
        [($) => airFuel($, 'molar'), 'That is moles of air per mole of fuel. Multiply by the molar masses: 28.97 for air, 16.04 for methane.'],
        [($) => airFuel($, 'oxygen'), 'That counts only the oxygen. Each O₂ in air brings 3.76 N₂ with it.'],
      ],
    },
  },
  'u1.7.humidity': {
    traps: {
      w: [
        [($) => humidity($, 'phi'), 'Relative humidity is not the humidity ratio. Find p_v = φp_g, then ω = 0.622 p_v/(p − p_v).'],
        [($) => humidity($, 'nofactor'), 'That is p_v/(p − p_v), a mole ratio. Multiply by 0.622, water’s molar mass over air’s.'],
      ],
    },
  },
  'u1.9.dripped': {
    traps: {
      m: [
        [($) => dripped($, 'phi'), 'The air leaves saturated, at 100%: ω out uses p_g(T₂), not 60% of it.'],
        [($) => dripped($, 'out'), 'That is the water the air still carries. The water removed is ω in − ω out.'],
      ],
    },
  },
};
