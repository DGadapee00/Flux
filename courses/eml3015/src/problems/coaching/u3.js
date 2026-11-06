/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { bendPressure } from '@flux/subjects/mechanics/flowfields.js';

const RATIO = { gentle: 2, medium: 4, sharp: 6 };
const RHO = { water: 998, air: 1.2 };
const bend = ($) => bendPressure({ rho: RHO[$.fluid] ?? 998, V: $.V, R: $.R, w: $.w, profile: 'vortex' });

export default {
  'u3.1.exit-acceleration': {
    traps: {
      a: [
        [($) => (RATIO[$.shape] * (RATIO[$.shape] - 1) * $.u0) / $.L, 'That is ∂u/∂x alone. The acceleration is u times ∂u/∂x.'],
        [($) => (RATIO[$.shape] * (RATIO[$.shape] - 1) * $.u0 * $.u0) / $.L, 'That uses the inlet speed. At the exit the particle moves at the exit speed.'],
      ],
    },
  },
  'u3.2.transit-time': {
    traps: {
      T: [
        [($) => $.L / $.u0, 'That assumes the inlet speed all the way. The particle speeds up as it goes.'],
        [($) => $.L / ($.u0 * RATIO[$.shape]), 'That assumes the exit speed all the way. The particle starts slower.'],
        [($) => (2 * $.L) / ($.u0 * (1 + RATIO[$.shape])), 'Averaging the inlet and exit speeds does not work: the speed does not rise in a straight line in time. Integrate dx/u.'],
      ],
    },
  },
  'u3.4.bend-pressure': {
    traps: {
      dp: [
        [($) => 2 * bend($).dp, 'Integrating ρK²/r³ gives ρK²/2 times (1/r₁² − 1/r₂²). Keep the half.'],
        [($) => bendPressure({ rho: RHO[$.fluid] ?? 998, V: $.V, R: $.R, w: 2 * $.w, profile: 'vortex' }).dp, 'The walls are half the width from the centre line: r₁ = R − w/2 and r₂ = R + w/2.'],
      ],
    },
  },
  'u3.6.inner-speed': {
    traps: {
      u1: [
        [($) => $.V, 'That is the mean speed. In a free vortex the inside moves faster than the mean.'],
        [($) => bend($).uOut, 'That is the outer wall. The speed K/r is highest where r is smallest.'],
      ],
    },
  },
  'u3.7.cv-net': {
    traps: {
      net: [
        [($) => 1.2 * ($.field === 'piston' ? -$.a : 2 * $.a) * $.h, 'Multiply by the area, h², not the side.'],
        [($) => ($.field === 'piston' ? -$.a : 2 * $.a) * $.h * $.h, 'That is the volume rate. Multiply by the density, 1.2 kg/m³, for mass.'],
      ],
    },
  },
};
