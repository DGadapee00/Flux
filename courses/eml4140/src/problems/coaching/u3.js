/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { STREAMS, avgH, corrWall, fluxWith } from '../bank/u3.js';
import { outletT, steadyRate } from '../bank/u3.js';
import { plumeH } from '../bank/u3.js';
import { condenseH } from '../bank/u3.js';

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
  'u3.5.outlet': {
    traps: {
      To: [
        [($) => steadyRate($), 'That assumes the water keeps warming at its inlet rate. The difference to the wall shrinks: use the exponential.'],
        [($) => outletT($, (D) => (Math.PI * D * D) / 4), 'The heated area per metre is the perimeter πD, not the cross-section πD²/4.'],
      ],
    },
  },
  'u3.7.plume': {
    traps: {
      h: [
        [($) => plumeH($, (Tf) => 1 / Tf), 'β = 1/T needs T in kelvin: the film is near 313 K, not 40.'],
        [($) => plumeH($, undefined, 1), 'That is the local value at the top of the plate. The average over the height is 4/3 of it.'],
      ],
    },
  },
  'u3.9.condense': {
    traps: {
      h: [
        [($) => condenseH($, 1), 'k_l is cubed inside the bracket: the film conducts, and its thickness depends on k too.'],
        [($) => condenseH($) * (100 - Number($.Ts)), 'That is the heat flux, h̄ΔT. The question asks for h̄.'],
      ],
    },
  },
};
