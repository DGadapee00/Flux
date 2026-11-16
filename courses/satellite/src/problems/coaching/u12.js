/**
 * Unit 12 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { capDeg, reachDeg } from '../bank/u12.js';

export default {
  'u12.1.cap': {
    traps: {
      l: [
        [($) => capDeg($, 'noMinus'), 'Subtract ε at the end: λ = arccos((R/(R + h)) cos ε) − ε.'],
        [($) => capDeg($, 'noCos'), 'The elevation mask enters twice: inside the arccos as cos ε, and subtracted after.'],
      ],
    },
  },
  'u12.2.reach': {
    traps: {
      r: [
        [($) => reachDeg($, 'incl'), 'The ground track stops at latitude i, but a station sees it from λ further away.'],
        [($) => reachDeg($, 'minus'), 'A station beyond the track still sees it within λ: add λ to i.'],
      ],
    },
  },
};
