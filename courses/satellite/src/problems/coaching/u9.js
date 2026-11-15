/**
 * Unit 9 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { partYears, rateFor, scaleFor, yearsBetween } from '../bank/u9.js';

export default {
  'u9.1.scale': {
    traps: {
      H: [
        [($) => scaleFor($, 'seaLevelG'), 'Use g at 300 km, 8.94 m/s², not at the ground: gravity is 9% weaker up there.'],
        [($) => scaleFor($, 'nitrogen'), 'Above 300 km the air is mostly atomic oxygen, 16 u, not nitrogen.'],
      ],
    },
  },
  'u9.2.rate': {
    traps: {
      r: [
        [($) => rateFor($, 'noCd'), 'Drag carries the drag coefficient: the factor is C_D A/m, not A/m.'],
        [($) => rateFor($, 'speed'), 'da/dt goes with √(μa), the orbital speed times the radius, not with the speed alone.'],
      ],
    },
  },
  'u9.4.dose': {
    traps: {
      t: [
        [($) => partYears($, 'noMargin'), 'Apply the margin of 2: the belt models are uncertain by at least that much.'],
        [($) => partYears($, 'trappedOnly'), 'Add the solar particle events to the trapped dose.'],
      ],
    },
  },
  'u9.5.lost': {
    traps: {
      y: [
        [($) => yearsBetween($, 'noHalf'), 'P₂ ≈ x²/2, not x²: the chance of two Poisson events carries the factor one half.'],
        [($) => yearsBetween($, 'noCode'), 'That is the time between upsets. The code corrects single ones; a word is lost only when two land in it.'],
      ],
    },
  },
};
