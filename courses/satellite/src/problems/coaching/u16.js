/**
 * Unit 16 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { latchEnergy, margin } from '../bank/u16.js';

export default {
  'u16.1.tm': {
    traps: {
      m: [
        [($) => margin($, 'noFactor'), 'Multiply the variable torques by the safety factor for their source before dividing.'],
        [($) => margin($, 'noMinus'), 'Subtract 1: a margin of zero means exactly enough.'],
      ],
    },
  },
  'u16.2.latch': {
    traps: {
      e: [
        [($) => latchEnergy($, 'noFriction'), 'Friction takes T_r θ_d of the spring’s work before the latch.'],
        [($) => latchEnergy($, 'endTorque'), 'The spring’s torque falls as it unwinds: integrate k(θ₀ − θ), do not use its end value throughout.'],
      ],
    },
  },
};
