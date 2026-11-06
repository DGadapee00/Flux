/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { KTHETA, SCORES, bracket } from '../bank/u3.js';

const KEYS = ['mass', 'cost', 'defl', 'lead', 'temp'];
const W = ($) => ({ mass: $.wm, cost: $.wc, defl: $.wd, lead: $.wl, temp: $.wt });

export default {
  'u3.1.weighted-score': {
    traps: {
      S: [
        [($) => KEYS.reduce((a, k) => a + W($)[k] * SCORES[$.concept][k], 0), 'Divide by the sum of the weights, so the score stays between 1 and 5.'],
        [($) => KEYS.reduce((a, k) => a + SCORES[$.concept][k], 0) / 5, 'That is the plain average. Each score counts as much as its weight.'],
      ],
    },
  },
  'u3.4.strength-margin': {
    traps: {
      stress: [
        [($) => (3 * $.P * 100) / (20 * $.h * $.h), 'The section modulus of a rectangle is bh²/6, so the stress is 6PL/(bh²).'],
        [($) => (6 * $.P * 100) / ($.h * 20 * 20), 'Width and thickness are swapped. The arm bends across its thickness, so h is squared.'],
      ],
      ms: [
        [($) => 241 / bracket($).stress - 1, 'Apply the factor of safety: MS = allowable/(FS × applied) − 1.'],
        [($) => 241 / (1.5 * bracket($).stress), 'Subtract 1. A margin of zero means exactly at the allowable.'],
      ],
    },
  },
  'u3.5.tested-deflection': {
    traps: {
      tip: [
        [($) => bracket($).tipRigid, 'That is the analysis with a rigid root. The test also sees the mount turning.'],
        [($) => ($.P * 1e6) / (3 * 68e3 * ((8 * 20 ** 3) / 12)) + ($.P * 1e4) / KTHETA[$.mount], 'In I = bh³/12, h is the thickness the arm bends across: 8 mm, not 20.'],
      ],
    },
  },
};
