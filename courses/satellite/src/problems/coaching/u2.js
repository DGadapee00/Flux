/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { K_B, dB, fromDBm } from '@flux/subjects/em/noise.js';
import { PR_DBM, RX, pathLossDB, snrDB } from '../bank/u2.js';

export default {
  'u2.3.path-loss': {
    traps: {
      L: [
        [($) => pathLossDB($, 10), 'The loss is a squared ratio, so in decibels it is 20 log₁₀(4πd/λ), not 10 log₁₀.'],
        [($) => pathLossDB($, 20, 1e-3), 'Put d in metres, like λ: kilometres make the loss 60 dB too small.'],
      ],
    },
  },
  'u2.1.snr': {
    traps: {
      snr: [
        [($) => snrDB($, 290), 'Use the receiver’s own system noise temperature, not the 290 K reference.'],
        [($) => dB(fromDBm(PR_DBM) / (K_B * RX[$.rx])), 'k_B T is noise per hertz. Multiply by the bandwidth in hertz to get the noise power.'],
      ],
    },
  },
};
