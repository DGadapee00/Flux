/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { WIEN } from '@flux/subjects/heat/radiation.js';
import { EMITTER } from '../bank/u2.js';

export default {
  'u2.1.wien': {
    traps: {
      lam: [
        [($) => EMITTER[$.body] / WIEN, 'Wien’s law is λ_max = 2898/T: hotter bodies peak at shorter wavelengths.'],
        [($) => WIEN / (EMITTER[$.body] - 273.15), 'Wien’s law needs kelvin, not degrees Celsius.'],
      ],
    },
  },
};
