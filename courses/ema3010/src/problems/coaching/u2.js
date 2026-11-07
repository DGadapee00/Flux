/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { CELSIUS, DIFF, caseHours, frac } from '../bank/u2.js';

export default {
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
