/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { STREAMS, avgH, corrWall, fluxWith } from '../bank/u3.js';

export default {
  'u3.3.average': {
    traps: {
      h: [
        [($) => avgH($, 0.332), 'That is the local h at the end of the plate. The average over a laminar plate is twice it: 0.664, not 0.332.'],
        [($) => avgH($, 0.664, 0), 'Keep Pr^(1/3): the thermal layer is not the velocity layer.'],
      ],
    },
  },
  'u3.1.flux': {
    traps: {
      q: [
        [($) => fluxWith($, 0.332), 'That is the Pr = 1 value. Multiply 0.332 by Pr^(1/3): the thermal layer is not the velocity layer.'],
        [($) => fluxWith($, corrWall($)) * Math.sqrt((STREAMS[$.fluid].U * $.x) / STREAMS[$.fluid].nu), 'The gradient grows as √Re_x, not Re_x: η = y√(U/νx).'],
      ],
    },
  },
};
