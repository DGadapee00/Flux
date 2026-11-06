/**
 * Unit 6 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { boardError } from '../bank/u6.js';

export default {
  'u6.1.valve-flow': {
    traps: {
      Q: [
        [($) => 10 * $.x * 2, 'That gives the valve the whole 4 bar. The pipe and the pump’s droop take their share too: solve all three together.'],
        [($) => Math.sqrt(4 / (0.004 + 1 / (10 * $.x) ** 2)), 'Include the pipe’s loss, kQ², with k = Δp at 10 m³/h divided by 100.'],
      ],
    },
  },
  'u6.3.ground-error': {
    traps: {
      dV: [
        [($) => boardError($) / $.I, 'That is the resistance in milliohms. Multiply by the motor current to get the shift.'],
        [($) => boardError($) * 1000, 'Put every length in metres: the length and width are in millimetres.'],
      ],
    },
  },
};
