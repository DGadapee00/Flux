/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { KE2, mie } from '@flux/subjects/matsci/bonding.js';
import { METAL, PAIR, SHAPE } from '../bank/u1.js';
import { STRUCTURES, crystal } from '@flux/subjects/matsci/crystal.js';

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
  'u1.5.lattice': {
    traps: {
      a: [
        [($) => 2 * $.R, 'a = 2R is simple cubic, where the atoms touch along an edge. Here they touch along a diagonal.'],
        [($) => STRUCTURES[$.st === 'bcc' ? 'fcc' : 'bcc'].aOfR($.R), 'That is the other cubic cell. BCC touches along the body diagonal (√3 a), FCC along a face diagonal (√2 a).'],
      ],
    },
  },
  'u1.6.density': {
    traps: {
      rho: [
        [($) => crystal({ structure: METAL[$.metal].st, R: METAL[$.metal].R, A: METAL[$.metal].A }).density / STRUCTURES[METAL[$.metal].st].N, 'That is one atom per cell. BCC holds 2 and FCC 4.'],
        [($) => (STRUCTURES[METAL[$.metal].st].N * METAL[$.metal].A) / ((2 * METAL[$.metal].R * 1e-7) ** 3 * 6.022e23), 'a = 2R holds only where atoms touch along an edge. Use the diagonal they touch along.'],
      ],
    },
  },
  'u1.7.packing-fraction': {
    traps: {
      apf: [
        [($) => crystal({ structure: $.st, R: 1, A: 1 }).apf / STRUCTURES[$.st].N, 'Count every share of an atom: 8 corners at ⅛ each, plus the centre or the face atoms.'],
        [($) => (STRUCTURES[$.st].N * Math.PI) / 6, 'a = 2R is simple cubic. Find a from the diagonal the atoms touch along.'],
      ],
    },
  },
};
