/**
 * Unit 7 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { avgLoad, dataUse, powerUse } from '../bank/u7.js';

export default {
  'u7.1.load': {
    traps: {
      P: [
        [($) => avgLoad($, 'txAlways'), 'The transmitter runs only while a station sees the craft: multiply its draw by the minutes in view over 1440.'],
        [($) => avgLoad($, 'payAlways'), 'The payload runs only its duty share of each orbit: multiply its draw by d.'],
      ],
    },
  },
  'u7.2.power': {
    traps: {
      u: [
        [($) => powerUse($, 'average'), 'The array works only in sunlight, so it must cover the eclipse too: compare energies over the orbit, not powers.'],
        [($) => powerUse($, 'noLoss'), 'Energy used in eclipse goes into the battery and out again: divide the eclipse share by η_c η_d = 0.81.'],
      ],
    },
  },
  'u7.3.data': {
    traps: {
      u: [
        [($) => dataUse($, 'noDuty'), 'The payload records only while it runs: multiply its rate by its duty.'],
        [($) => dataUse($, 'noSixty'), 'The contact time is in minutes: multiply by 60 to get the seconds the radio sends.'],
      ],
    },
  },
};
