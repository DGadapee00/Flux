/**
 * Unit 10 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { loadFor, passMin, responseC, sentGbit } from '../bank/u10.js';

export default {
  'u10.1.load': {
    traps: {
      U: [
        [($) => loadFor($, 'noSpeed'), 'That is the load on the baseline processor. Divide each run time by the flight processor’s speed.'],
        [($) => loadFor($, 'times'), 'A faster processor takes less time per run: divide by the speed, not multiply.'],
      ],
    },
  },
  'u10.2.response': {
    traps: {
      R: [
        [($) => responseC($, 'once'), 'A and B can run more than once before C finishes. Count every release: ⌈R/T⌉ of each.'],
        [($) => responseC($, 'alone'), 'C has the lowest priority, so every run of A and B that starts before it finishes delays it.'],
      ],
    },
  },
  'u10.4.pass': {
    traps: {
      t: [
        [($) => passMin($, 'noEps'), 'The station uses the craft only above the elevation mask: subtract ε and use cos ε in λ.'],
        [($) => passMin($, 'halfArc'), 'λ is the half-angle of the pass on each side of overhead: the pass is Tλ/π, not Tλ/2π.'],
      ],
    },
  },
  'u10.5.sent': {
    traps: {
      G: [
        [($) => sentGbit($, 'oneGroup'), 'The station sees the craft in two groups of passes a day, twelve hours apart.'],
        [($) => sentGbit($, 'minutes'), 'Turn the pass length into seconds before multiplying by a rate in bits per second.'],
      ],
    },
  },
};
