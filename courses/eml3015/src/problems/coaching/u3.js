/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { bendPressure } from '@flux/subjects/mechanics/flowfields.js';
import { SCALE, STREAM, boxForce, deltaAt, laminarLoss, nuOf, parallelQA, pipeQ, vaneFx } from '../bank/u3.js';
import { footballDrag } from '../bank/u3.js';

const RATIO = { gentle: 2, medium: 4, sharp: 6 };
const RHO = { water: 998, air: 1.2 };
const bend = ($) => bendPressure({ rho: RHO[$.fluid] ?? 998, V: $.V, R: $.R, w: $.w, profile: 'vortex' });

export default {
  'u3.19.laminar-loss': {
    traps: {
      h: [
        [($) => laminarLoss($, 16), 'f = 16/Re is the Fanning factor, a quarter of Darcy’s. With h_L = f(L/D)V²/2g use f = 64/Re.'],
        [($) => laminarLoss($, 64, 1), 'Divide the dynamic head by 2g: h_L = f(L/D)V²/(2g).'],
      ],
    },
  },
  'u3.17.vane-force': {
    traps: {
      F: [
        [($) => vaneFx($, 'none'), 'The water still leaves with momentum: take its exit momentum flux away from the incoming, which gives the factor 1 − cos θ.'],
        [($) => vaneFx($, 'minus'), 'The incoming flux counts too: the change along the jet is w − w cos θ, not −w cos θ.'],
      ],
    },
  },
  'u3.15.box-force': {
    traps: {
      F: [
        [($) => boxForce($).box - boxForce($).flux, 'The flux term is out minus in. Water leaving the narrow face carries more momentum than water entering the wide one.'],
        [($) => boxForce($).box, 'Steady or not, the water leaves faster than it came in. The net outflow of momentum is a force too.'],
      ],
    },
  },
  'u3.13.delta': {
    traps: {
      d: [
        [($) => ((4.91 * $.x) / ((STREAM[$.flow].U * $.x) / nuOf(STREAM[$.flow].fluid))) * 1000, 'Take the square root of Re_x: δ = 4.91x/√Re_x.'],
        [($) => deltaAt($, 1) * 1000, 'Use the distance x to the point, not the whole plate, in both x and Re_x.'],
      ],
    },
  },
  'u3.11.froude': {
    traps: {
      Vm: [
        [($) => $.Vp / SCALE[$.scale], 'Fr has √L, not L: the speed scales with the square root of the length.'],
        [($) => $.Vp, 'At the ship’s own speed the model’s Froude number is √N times too big, and its waves are wrong.'],
      ],
    },
  },
  'u3.9.poiseuille': {
    traps: {
      Q: [
        [($) => pipeQ($, 2 * $.R) * 1e6, 'That uses the diameter where the formula wants the radius: 2⁴ = 16 times too much.'],
        [($) => pipeQ($) * 1e6 / ($.R * $.R), 'R is to the fourth power: the peak speed goes as R², and so does the area.'],
      ],
    },
  },
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
  'u3.21.parallel': {
    traps: {
      qa: [
        [($) => parallelQA($, 'area'), 'Not by area: the pipes share a head loss, which goes as LQ²/D⁵, so length and the fifth power of D decide.'],
        [($) => parallelQA($, 'even'), 'Not evenly: the pipes differ, and the split is whatever makes their losses equal.'],
      ],
    },
  },
  'u3.23.drag': {
    traps: {
      F: [
        [($) => footballDrag($, 1), 'Keep the ½: the dynamic pressure is ½ρV².'],
        [($) => footballDrag($, 0.5, (D) => D * D), 'The frontal area is πD²/4, not D².'],
      ],
    },
  },
};
