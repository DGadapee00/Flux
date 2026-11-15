/**
 * Unit 8 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { budget, expectedMass, neededAllowance } from '../bank/u8.js';

export default {
  'u8.1.budget': {
    traps: {
      P: [
        [($) => budget($, 'basic').P, 'That is the basic mass. The budget adds the allowance to it: P = B(1 + a).'],
        [($) => budget($, 'payloadOnly').P, 'The allowance goes on every item, the bus as well as the payload.'],
      ],
      m: [
        [($) => budget($, 'basic').m, 'Measure the margin from the predicted mass, with its allowance, not from the basic mass.'],
        [($) => budget($, 'flipped').m, 'The margin is the allocation minus the prediction: positive when the craft fits.'],
      ],
    },
  },
  'u8.2.expected': {
    traps: {
      E: [
        [($) => expectedMass($, 'growthOnly'), 'That is only the growth. Add it to the basic masses.'],
        [($) => expectedMass($, 'busFixed'), 'The bus grows too. Add its share, b(1 + μ), not its basic mass.'],
      ],
    },
  },
  'u8.3.needed': {
    traps: {
      a: [
        [($) => neededAllowance($, 'averaged'), 'Weight each growth by its mass. The plain average of the two percentages counts the 3 kg payload like the 6.5 kg bus.'],
        [($) => neededAllowance($, 'kg'), 'That is the growth in kilograms. Divide by the basic mass for a share.'],
      ],
    },
  },
};
