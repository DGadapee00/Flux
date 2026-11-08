/**
 * Unit 4 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { iSteady, tauMs } from '../bank/u4.js';
import { zetaSeries } from '../bank/u4.js';
import { lcPeak } from '../bank/u4.js';

export default {
  'u4.1.tau': {
    traps: {
      tau: [
        [($) => tauMs($, $.R1), 'Not the source’s resistor alone: τ uses the Thévenin resistance the capacitor sees.'],
        [($) => tauMs($, $.R1 + Number($.R2) + 200), 'The resistors are not all in series: with the source switched off, R₁ and R₂ are in parallel, then in series with R₃.'],
      ],
    },
  },
  'u4.2.kick': {
    traps: {
      v: [
        [() => 12, 'An inductor’s voltage is not capped at the supply: it takes whatever pushes its current through the new path.'],
        [($) => iSteady($) * 200, 'With the switch open the current flows through R₂ as well as R₃.'],
      ],
    },
  },
  'u4.4.zeta': {
    traps: {
      z: [
        [($) => zetaSeries($, 'parallel'), 'That is the parallel circuit’s ζ. In series α = R/2L, so ζ = (R/2)√(C/L).'],
        [($) => zetaSeries($, 'two'), 'α is R/2L, not R/L: keep the 2.'],
      ],
    },
  },
  'u4.6.lc-peak': {
    traps: {
      I: [
        [($) => lcPeak($, 'inverted'), 'Upside down: ½LI² = ½CV₀² gives I = V₀√(C/L).'],
        [($) => lcPeak($, 'omega'), 'That is V₀ω₀. The peak current is V₀√(C/L) = V₀ω₀C.'],
      ],
    },
  },
};
