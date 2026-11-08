/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { WIEN } from '@flux/subjects/heat/radiation.js';
import { EMITTER, strings } from '../bank/u2.js';
import { shieldFlux } from '../bank/u2.js';

export default {
  'u2.1.wien': {
    traps: {
      lam: [
        [($) => EMITTER[$.body] / WIEN, 'Wien’s law is λ_max = 2898/T: hotter bodies peak at shorter wavelengths.'],
        [($) => WIEN / (EMITTER[$.body] - 273.15), 'Wien’s law needs kelvin, not degrees Celsius.'],
      ],
    },
  },
  'u2.3.strings': {
    traps: {
      F: [
        [($) => strings($)[$.ask === 'F12' ? 'F21' : 'F12'], 'That is the other direction. Divide by twice the width of the surface the radiation leaves.'],
        [($) => strings($).crossed / (2 * ($.ask === 'F12' ? 1 : Number($.w2))), 'Subtract the uncrossed strings: crossed minus uncrossed, over twice the width.'],
      ],
    },
  },
  'u2.5.shield': {
    traps: {
      q: [
        [($) => shieldFlux($, (e) => 1 / e), 'A shield has two faces, each with its own surface resistance: it adds 2/ε_s − 1, not 1/ε_s.'],
        [() => shieldFlux({ N: 0, es: 1 }), 'That is the flux with no shield at all. Add each shield’s resistance.'],
      ],
    },
  },
};
