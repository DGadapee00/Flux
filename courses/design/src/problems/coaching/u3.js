/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { SCORES } from '../bank/u3.js';

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
};
