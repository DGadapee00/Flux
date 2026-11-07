/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { CELSIUS, frac } from '../bank/u2.js';

export default {
  'u2.1.fraction': {
    traps: {
      c: [
        [($) => frac($.Q, CELSIUS[$.temp]), 'The Boltzmann factor needs kelvin: add 273 to the Celsius temperature.'],
        [($) => frac($.Q, CELSIUS[$.temp] + 273) * 10, 'Check the exponent: c* = exp(−Q/kT), with k in eV/K.'],
      ],
    },
  },
};
