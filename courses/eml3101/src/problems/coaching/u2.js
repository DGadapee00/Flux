/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { areaRatio, machFromArea, pressureRatio } from '@flux/subjects/thermo/isentropic.js';
import { choked } from '../bank/u2.js';

/** The isentropic subsonic flow with the same area ratio: what a shock is not. */
const noLoss = ($) => machFromArea(areaRatio($.M1), 'subsonic');

export default {
  'u2.1.choked': {
    traps: {
      m: [
        [($) => choked($, 1), 'That is ρ₀c₀A_t, the stagnation values. At the throat the gas has cooled and thinned: multiply by (2/(γ+1))^((γ+1)/(2(γ−1))) = 0.579.'],
        [($) => choked($, undefined, false), 'Take the square root of γ/(RT₀).'],
      ],
    },
  },
  'u2.2.shock': {
    traps: {
      v: [
        [($) => ({ M2: noLoss($), p: pressureRatio(noLoss($)) / pressureRatio($.M1), p0: 1 })[$.ask], ($) => ({ M2: 'That is the subsonic flow with the same area ratio, reached without loss. A shock is not isentropic.', p: 'That is an isentropic deceleration. The shock jump is 1 + 2γ(M₁² − 1)/(γ+1).', p0: 'The stagnation temperature is kept across a shock; the stagnation pressure is not.' })[$.ask]],
        [($) => ({ M2: 1 / $.M1, p: ((2.4 * $.M1 ** 2) / (2 + 0.4 * $.M1 ** 2)), p0: 1 / ((2 * 1.4 * $.M1 ** 2) / 2.4 - 0.4 / 2.4) })[$.ask], ($) => ({ M2: 'M₂ is not 1/M₁: use M₂² = (1 + (γ−1)M₁²/2)/(γM₁² − (γ−1)/2).', p: 'That is the density ratio ρ₂/ρ₁. The pressure jumps further: 1 + 2γ(M₁² − 1)/(γ+1).', p0: 'That is the inverse of the static pressure jump. The stagnation ratio needs the isentropic ratios on both sides too.' })[$.ask]],
      ],
    },
  },
};
