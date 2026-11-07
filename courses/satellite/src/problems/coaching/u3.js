/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { angleRate, offsetDeg, tumbleRate } from '../bank/u3.js';

export default {
  'u3.6.offset': {
    traps: {
      th: [
        [($) => offsetDeg($, 'rad'), 'd/K_p comes out in radians: multiply by 180/π for degrees.'],
        [($) => offsetDeg($, 'times'), 'A stiffer loop holds closer: the offset is d divided by K_p, not times it.'],
      ],
    },
  },
  'u3.4.tumble-rate': {
    traps: {
      lam: [
        [($) => tumbleRate($, false), 'The linearised equation gives λ², the rate squared: take the square root.'],
        [($) => tumbleRate($, true, 'middle'), 'The denominator is the product of the other two inertias, I₁I₃, not the spin axis’s own.'],
      ],
    },
  },
  'u3.1.rates': {
    traps: {
      rate: [
        [() => 1, 'An angle rate is not the body rate. Away from θ = 0 the yaw and roll axes are not the body z axis, so the angles must turn faster.'],
        [($) => ($.angle === 'yaw' ? Math.cos($.pitch) : Math.sin($.pitch)), 'Solve for the rate: ω_z = ψ̇ cos θ gives ψ̇ = 1/cos θ, which grows as θ nears 90°.'],
      ],
    },
  },
  'u3.2.nose': {
    traps: {
      n: [
        [($) => ($.comp === 'x' ? Math.cos($.psi) : Math.sin($.psi)), 'The pitch tilts the nose out of the x-y plane: multiply by cos θ.'],
        [($) => ($.comp === 'x' ? Math.sin($.psi) * Math.cos($.theta) : Math.cos($.psi) * Math.cos($.theta)), 'Yaw turns x toward y: the x component carries cos ψ and the y component sin ψ.'],
      ],
    },
  },
};
