/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { AREA } from '../bank/u1.js';

export default {
  'u1.1.matrix-area': {
    traps: {
      area: [
        [($) => Math.abs($.a * $.d + $.b * $.c) * AREA[$.shape], 'The determinant subtracts: ad − bc.'],
        [($) => ($.shape === 'two' ? Math.abs($.a * $.d - $.b * $.c) : Math.abs($.a * $.d)), ($) => ($.shape === 'two' ? 'That is the unit square’s image. A square of side 2 has area 4, so multiply by 4.' : 'Include the off-diagonal product: det A = ad − bc.')],
      ],
    },
  },
  'u1.2.product': {
    traps: {
      x: [
        [($) => ($.order === 'after' ? $.b : -$.c), 'Those are the other order. RA applies A first; AR applies R first.'],
        [($) => $.a, 'That is where A alone sends (1, 0). Apply the quarter turn too.'],
      ],
    },
  },
  'u1.4.elimination': {
    traps: {
      m: [
        [($) => ($.order === 'pivot' ? -3 / 2 : 2 / -3), 'Divide the row’s leading entry by the pivot, not the pivot by it.'],
        [($) => ($.order === 'pivot' ? -2 / 3 * -1 : 3 / 2), 'Mind the sign: the multiplier is the leading entry over the pivot, with both signs.'],
      ],
    },
  },
};
