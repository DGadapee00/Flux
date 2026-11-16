/**
 * Unit 14 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { ceiling, propellant, spiralDays, thrust } from '../bank/u14.js';

export default {
  'u14.1.prop': {
    traps: {
      p: [
        [($) => propellant($, 'linear'), 'The rocket equation is exponential: m_p = m_f(e^{Δv/u_e} − 1), not m_f Δv/u_e.'],
        [($) => propellant($, 'noG0'), 'Specific impulse is in seconds: multiply by g₀ = 9.81 m/s² for the exhaust speed.'],
      ],
    },
  },
  'u14.2.ceiling': {
    traps: {
      v: [
        [($) => ceiling($, 'noK'), 'At burnout the tank is still there: the final mass is k m_p, so the ratio is (1 + k)/k.'],
        [($) => ceiling($, 'noG0'), 'Multiply the specific impulse by g₀ = 9.81 m/s² for the exhaust speed.'],
      ],
    },
  },
  'u14.3.thrust': {
    traps: {
      F: [
        [($) => thrust($, 'noTwo'), 'The jet power is ½ F u_e, so F = 2ηP/u_e: the factor 2 comes from the half.'],
        [($) => thrust($, 'noG0'), 'u_e = I_sp g₀: divide by the exhaust speed, not the specific impulse.'],
      ],
    },
  },
  'u14.4.spiral': {
    traps: {
      d: [
        [($) => spiralDays($, 'noTwo'), 'Thrust is 2ηP/u_e: without the 2 it is half as large and the climb twice as long.'],
        [($) => spiralDays($, 'noG0'), 'The exhaust speed is I_sp g₀, nearly ten times the specific impulse in seconds.'],
      ],
    },
  },
};
