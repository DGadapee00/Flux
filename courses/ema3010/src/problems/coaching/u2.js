/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { CELSIUS, D2R, DIFF, caseHours, frac, schmidM } from '../bank/u2.js';

export default {
  'u2.5.schmid': {
    traps: {
      s: [
        [($) => ($.ask === 'tau' ? 3 * Math.cos($.phi * D2R) : 1 / Math.cos($.phi * D2R)), 'Both angles count: the shear on the plane is σ cos φ times its area factor, and only cos λ of it lies along the slip direction.'],
        [($) => ($.ask === 'tau' ? 3 / schmidM($) : schmidM($)), 'The Schmid factor turns σ into τ by multiplying: τ_R = mσ. To find the pull, divide τ_crss by m.'],
      ],
    },
  },
  'u2.3.case-time': {
    traps: {
      t: [
        [($) => caseHours($, DIFF($), 1), 'The argument is x/2√(Dt): square the 2 as well, so t = x²/(4z²D).'],
        [($) => caseHours($, DIFF($, false)), 'The Arrhenius factor needs kelvin: add 273 to the furnace temperature.'],
      ],
    },
  },
  'u2.1.fraction': {
    traps: {
      c: [
        [($) => frac($.Q, CELSIUS[$.temp]), 'The Boltzmann factor needs kelvin: add 273 to the Celsius temperature.'],
        [($) => frac($.Q, CELSIUS[$.temp] + 273) * 10, 'Check the exponent: c* = exp(−Q/kT), with k in eV/K.'],
      ],
    },
  },
};
