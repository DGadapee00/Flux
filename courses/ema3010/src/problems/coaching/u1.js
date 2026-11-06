/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { KE2, mie } from '@flux/subjects/matsci/bonding.js';
import { PAIR, SHAPE } from '../bank/u1.js';

const R = ($) => ($.where === 'in' ? 0.9 : 1.2) * $.r0;
const well = ($) => mie({ E0: $.E0, r0: $.r0, ...SHAPE[$.shape] });

export default {
  'u1.1.stiffness': {
    traps: {
      k: [
        [($) => $.E0 / $.r0 ** 2, 'That is the depth over r₀². The shape counts too: multiply by n·m.'],
        [($) => (SHAPE[$.shape].n * SHAPE[$.shape].m * $.E0) / $.r0, 'Curvature is a second derivative, so r₀ is squared: k = nmE₀/r₀².'],
      ],
    },
  },
  'u1.2.ion-pair': {
    traps: {
      E0: [
        [($) => KE2 / PAIR[$.pair], 'That is the Coulomb energy alone. At r₀ the repulsion already takes back a ninth of it.'],
        [($) => (KE2 / PAIR[$.pair]) * (1 + 1 / 9), 'The repulsion raises U, so it makes the well shallower: (1 − 1/9), not (1 + 1/9).'],
      ],
    },
  },
  'u1.3.force': {
    traps: {
      F: [
        [($) => Math.abs(well($).U(R($))) / R($), 'Energy over distance is not the force. The force is the slope, −dU/dr.'],
        [($) => well($).k * Math.abs(R($) - $.r0), 'The spring law F = k(r − r₀) holds only near the bottom of the well. This far out, take the slope of the full curve.'],
      ],
    },
  },
};
