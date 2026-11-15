/**
 * Unit 2 coaching, part two: traps for the telemetry, tracking and command problems.
 * Folded into the bank by src/problems/index.js.
 */
import { frameRate, lightMs, shiftKHz } from '../bank/u2-ttc.js';

export default {
  'u2.5.shift': {
    traps: {
      d: [
        [($) => shiftKHz($, 'twoWay'), 'The craft sends from its own oscillator: one-way, so the shift is counted once, f ρ̇/c.'],
        [($) => shiftKHz($, 'orbitSpeed'), 'Only the part of the velocity along the line of sight shifts the carrier: use ρ̇, not the orbital speed.'],
      ],
    },
  },
  'u2.6.light': {
    traps: {
      t: [
        [($) => lightMs($, 'oneWay'), 'The code goes up and comes back: the time is 2ρ/c.'],
        [($) => lightMs($, 'altitude'), 'At the edge of the pass the craft is far off to the side: find the slant range, not the altitude.'],
      ],
    },
  },
  'u2.7.telemetry': {
    traps: {
      r: [
        [($) => frameRate($, 'noFraming'), 'Add the 10% for sync words, headers and error checks.'],
        [($) => frameRate($, 'onceEach'), 'Multiply each channel by how many times a second it is sampled.'],
      ],
    },
  },
};
