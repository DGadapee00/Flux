/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { ALPHA } from '@flux/subjects/heat/rod.js';
import { HALF, KINS, WALL, WOOL, midTheta } from '../bank/u1.js';
import { wall } from '@flux/subjects/heat/resistance.js';
import { FIN } from '@flux/subjects/heat/fins.js';
import { longFin } from '../bank/u1.js';
import { biot } from '../bank/u1.js';
import { jointT } from '../bank/u1.js';
import { fourier } from '../bank/u1.js';

export default {
  'u1.1.half-time': {
    traps: {
      t: [
        [($) => (Math.log(2) * $.L ** 2) / ALPHA[$.material], 'The decay rate of the half sine is π²α/L², not α/L². Divide by π².'],
        [($) => (HALF * $.L) / ALPHA[$.material], 'The time scales with L², not L: square the length.'],
      ],
    },
  },
  'u1.2.middle': {
    traps: {
      T: [
        [($) => 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.01), 'That is the excess above the ends. Add the ends’ 20 °C.'],
        [($) => 20 + 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.1), 'Fo = αt/L² takes L squared: 0.1² = 0.01 m².'],
      ],
    },
  },
  'u1.3.scale': {
    traps: {
      t2: [
        [($) => $.t1 * ($.L2 / 0.1) * (ALPHA.copper / ALPHA[$.material]), 'The time grows as the square of the length.'],
        [($) => $.t1 * ($.L2 / 0.1) ** 2 * (ALPHA[$.material] / ALPHA.copper), 'A smaller diffusivity is slower, so it takes longer: multiply by α₁/α₂.'],
      ],
    },
  },
  'u1.5.wall': {
    traps: {
      q: [
        [($) => (20 - $.Tout) / wall(WALL(WOOL[$.wool], $.Tout)).R.slice(1, -1).reduce((a, b) => a + b, 0), 'The air films resist too: add 1/h for each face.'],
        [($) => (20 - $.Tout) / (1 / 8 + 1 / 25 + WALL(WOOL[$.wool], $.Tout).layers.filter((l) => l.L > 0).reduce((a, l) => a + l.k / l.L, 0)), 'A layer’s resistance is L/k, not k/L.'],
      ],
    },
  },
  'u1.6.drop': {
    traps: {
      dT: [
        [($) => ((20 - $.Tout) * ($.layer === 'wool' ? 0.09 : 0.1)) / 0.203, 'The drop goes by resistance, not by thickness: glass wool is thin but resists far more.'],
        [($) => (20 - $.Tout) / 3, 'The layers do not share the drop equally: each takes q times its own resistance.'],
      ],
    },
  },
  'u1.7.critical': {
    traps: {
      r: [
        [($) => ((2 * KINS[$.mat]) / $.h) * 1000, 'That is the sphere’s critical radius, 2k/h. A cylinder’s is k/h.'],
        [($) => ($.h / KINS[$.mat]) * 1000, 'Upside down: r_crit = k/h.'],
      ],
    },
  },
  'u1.9.fin': {
    traps: {
      q: [
        [($) => longFin($, (D) => Math.PI * D * D), 'The cross-section is πD²/4, not πD².'],
        [($) => longFin($) ** 2 / (FIN.Tb - FIN.Tinf), 'Take the square root: q = √(hPkA_c) θ_b.'],
      ],
    },
  },
  'u1.11.biot': {
    traps: {
      bi: [
        [($) => biot($, 2 * 0.02), 'Cooled on both faces, use the half-thickness, 2 cm, not the full 4 cm.'],
        [($) => 1 / biot($), 'Bi = hL/k: the outside coefficient on top.'],
      ],
    },
  },
  'u1.13.touch': {
    traps: {
      T: [
        [($) => (34 + $.Tb) / 2, 'Not a plain average: the body that trades heat faster pulls the joint toward its own temperature.'],
        [($) => jointT($, (b) => b.k), 'Weight by √(kρc), the effusivity, not by k alone.'],
      ],
    },
  },
  'u1.15.fourier': {
    traps: {
      fo: [
        [($) => fourier({ ...$, N: Number($.N) }, false), 'Δx is squared: Fo = αΔt/Δx².'],
        [($) => fourier({ ...$, N: Number($.N) }) * 1000, 'Δt in seconds, not milliseconds.'],
      ],
    },
  },
};
