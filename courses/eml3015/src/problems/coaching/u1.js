/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { FLUIDS, couetteStress, settlingTime } from '@flux/subjects/mechanics/couette.js';
import { jump, rise, sink } from '../bank/u1.js';

const mu = ($) => FLUIDS[$.fluid].mu;
const nu = ($) => FLUIDS[$.fluid].mu / FLUIDS[$.fluid].rho;

export default {
  'u1.1.shear-stress': {
    traps: {
      tau: [
        [($) => mu($) * $.U, 'Divide by the gap. The stress follows the gradient U/h, not the speed alone.'],
        [($) => (mu($) * $.U) / ($.h * 1000), 'The gap is in millimetres. Convert it to metres before dividing.'],
      ],
    },
  },
  'u1.2.plate-force': {
    traps: {
      F: [
        [($) => couetteStress(mu($), $.U, $.h), 'That is the stress. Multiply by the plate’s 0.1 m² to get a force.'],
        [($) => mu($) * $.U * 0.1, 'Divide by the gap: the stress is μU/h.'],
      ],
    },
  },
  'u1.3.settling-time': {
    traps: {
      t1: [
        [($) => (($.h * $.h) / (Math.PI * Math.PI * mu($))) * Math.log(200 / Math.PI), 'Use the kinematic viscosity ν = μ/ρ, not μ. Motion spreads at ν.'],
        [($) => (($.h * $.h) / nu($)) * Math.log(200 / Math.PI), 'Divide by π² as well: the slowest mode decays on h²/(π²ν).'],
      ],
    },
  },
  'u1.5.rise': {
    traps: {
      h: [
        [($) => rise($, (r) => 2 * r), 'That uses the diameter. h = 2σ cos θ/(ρgr) takes the radius.'],
        [($) => rise($, (r) => r, 1), 'Put the radius in metres: 0.5 mm is 0.0005 m.'],
      ],
    },
  },
  'u1.7.sink': {
    traps: {
      d: [
        [($) => sink($, -1), 'Keep cos 140° = −0.77: the contact angle weakens the pull as well as reversing it.'],
        [($) => sink($, Math.cos((140 * Math.PI) / 180), (r) => 2 * r), 'That uses the diameter. Jurin’s law takes the radius.'],
      ],
    },
  },
  'u1.8.jump': {
    traps: {
      dp: [
        [($) => jump($, 1), 'A sphere curves both ways: Δp = σ(1/R + 1/R) = 2σ/R.'],
        [($) => jump($, 4), 'That is a soap bubble, which has two surfaces. A drop has one: 2σ/R.'],
      ],
    },
  },
};
