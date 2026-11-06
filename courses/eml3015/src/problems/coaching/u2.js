/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { LIQUIDS } from '@flux/subjects/mechanics/pressure-fields.js';
import { G } from '../kit.js';

const rho = ($) => (LIQUIDS[$.fluid] || LIQUIDS.water).rho;
const TILT = { vertical: 90, sixty: 60, fortyfive: 45 };
const sin = ($) => Math.sin(((TILT[$.tilt] ?? 90) * Math.PI) / 180);

export default {
  'u2.1.gate-force': {
    traps: {
      F: [
        [($) => (rho($) * G * $.d * $.L * $.b) / 1000, 'That uses the depth of the top edge. Use the depth of the centroid, d + L/2.'],
        [($) => (rho($) * G * ($.d + $.L) * $.L * $.b) / 1000, 'That uses the depth of the bottom edge. The average pressure is at the centroid, d + L/2.'],
        [($) => (rho($) * G * ($.d + $.L / 2) * $.L) / 1000, 'Multiply by the width as well: the area is L times b.'],
      ],
    },
  },
  'u2.2.center-of-pressure': {
    traps: {
      hcp: [
        [($) => $.d + ($.L / 2) * sin($), 'That is the centroid’s depth. The force acts below it, by I/(y_c A) along the gate.'],
        [($) => (2 / 3) * ($.d + $.L * sin($)), 'Two thirds of the way down holds only when the top edge is at the surface.'],
      ],
    },
  },
  'u2.4.tank-tilt': {
    traps: {
      rise: [
        [($) => ($.a / G) * 100, 'That is the rise over the full length. The surface pivots about the middle, so the back wall rises over half the length.'],
        [($) => ($.a / (G + $.a)) * 50, 'The slope is a/g, not a/(g + a). Only upward acceleration adds to g.'],
      ],
      p: [
        [($) => (rho($) * G * 0.45) / 1000, 'That is the floor pressure at rest. At the back wall the liquid is deeper now.'],
        [($) => (rho($) * G * (0.45 - (0.5 * $.a) / G)) / 1000, 'That is the front wall. The liquid piles at the back when the truck speeds up.'],
      ],
    },
  },
  'u2.5.spin-dip': {
    traps: {
      drop: [
        [($) => ($.w * $.w * 9) / (2 * G), 'That is the climb from centre to rim. The centre drops only half of it; the rim rises the other half.'],
        [($) => ($.w * $.w * 36) / (4 * G), 'Use the radius, 0.3 m, not the diameter.'],
      ],
      p: [
        [($) => (rho($) * G * 0.45) / 1000, 'That is the floor pressure at rest. The liquid is deeper at the rim now.'],
        [($) => (rho($) * G * (0.45 - ($.w * $.w * 0.09) / (4 * G))) / 1000, 'That is the centre. The liquid is deepest at the rim.'],
      ],
    },
  },
};
