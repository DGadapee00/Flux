/**
 * Unit 2 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { normSf } from '@flux/subjects/stats/dist.js';

const T = 0.1;
const R = T * Math.SQRT2;
const oneAxis = ($) => 1 - 2 * normSf(T, 0, $.sigma);
const box = ($) => oneAxis($) ** 2;
const circle = ($) => -Math.expm1(-(R * R) / (2 * $.sigma * $.sigma));

export default {
  'u2.1.position-yield': {
    traps: {
      y: [
        [($) => ($.zone === 'box' ? oneAxis($) : -Math.expm1(-(R * R) / ($.sigma * $.sigma))) * 100, ($) => ($.zone === 'box' ? 'That is one axis. A hole must pass in x and in y, so square it.' : 'The Rayleigh exponent is r²/(2σ²). Keep the 2.')],
        [($) => ($.zone === 'box' ? circle($) : box($)) * 100, 'That is the other zone. Check which one the holes are inspected against.'],
      ],
    },
  },
  'u2.3.cp-cpk': {
    traps: {
      cp: [
        [($) => 0.06 / (3 * $.sigma), 'Cp divides the band by six standard deviations, not three.'],
        [($) => 0.03 / (6 * $.sigma), 'The band is the whole width, 0.06 mm, from the lower limit to the upper.'],
      ],
      cpk: [
        [($) => (0.03 + $.offset) / (3 * $.sigma), 'That is the far limit. Cpk takes the nearer one.'],
        [($) => 0.06 / (6 * $.sigma), 'That is Cp. Cpk measures from the mean to the nearer limit.'],
      ],
    },
  },
  'u2.4.parts-out': {
    traps: {
      ppm: [
        [($) => 2 * normSf(0.03, 0, $.sigma) * 1e6, 'That is for a centred process. The mean sits high, so the upper limit is closer.'],
        [($) => (normSf(0.03 - $.offset, 0, $.sigma) + normSf(0.03 + $.offset, 0, $.sigma)) * 100, 'That is a percentage. Per million is ten thousand times that.'],
      ],
    },
  },
  'u2.5.allocate': {
    traps: {
      Ti: [
        [($) => ($.T / Math.sqrt(3)) * 1000, 'That is the equal split. The cheapest split gives more room to the parts dear to hold tight.'],
        [($) => (($.T * Math.sqrt([0.02, 0.08, 0.3][Number($.part)])) / [0.02, 0.08, 0.3].reduce((s, b) => s + Math.sqrt(b), 0)) * 1000, 'That is the worst-case split, T_i ∝ √b. By RSS it is T_i ∝ b^(1/3), scaled so the squares add to T².'],
      ],
    },
  },
};
