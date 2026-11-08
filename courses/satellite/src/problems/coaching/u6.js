/**
 * Unit 6 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { deepT } from '../bank/u6.js';
import { radiatorC } from '../bank/u6.js';

export default {
  'u6.1.deep': {
    traps: {
      T: [
        [($) => deepT($, 1), 'That is a flat plate facing the Sun and radiating from one face. A sphere catches sunlight on πR² but radiates from 4πR².'],
        [($) => deepT($, 4, 0.5), 'Radiated power goes as T⁴: take the fourth root, not the square root.'],
      ],
    },
  },
  'u6.3.radiator': {
    traps: {
      T: [
        [($) => radiatorC($, 'kelvin'), 'That is in kelvin. Subtract 273.15 for °C.'],
        [($) => radiatorC($, 'black'), 'Include the emissivity: the radiator emits εσAT⁴ with ε = 0.85.'],
      ],
    },
  },
};
