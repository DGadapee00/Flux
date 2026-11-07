/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { LOOP_R, counts } from '../bank/u1.js';

export default {
  'u1.1.rails': {
    traps: {
      v: [
        [($) => ($.V1 / 2 + 6 / 3) / (1 / 2 + 1 / 3), 'Every branch at the node carries current: include 1/4 and 1/6 in the denominator.'],
        [($) => ($.V1 + 6) / 2, 'The rail is not the average of the sources: weight each by 1/R, and count the plain resistors too.'],
      ],
    },
  },
  'u1.2.loop': {
    traps: {
      vr: [
        [($) => ($.V * LOOP_R[$.which]) / 9, 'The source’s own 1 Ω is in the loop too: the total is 10 Ω.'],
        [($) => $.V, 'The source voltage is shared among all four resistances, in proportion to each.'],
      ],
    },
  },
  'u1.3.count': {
    traps: {
      count: [
        [($) => ($.ask === 'nodes' ? counts($.circuit).n : counts($.circuit).b), ($) => ($.ask === 'nodes' ? 'Ground is a node too, but its voltage is known: n − 1.' : 'Not every branch makes a window: b − n + 1.')],
        [($) => ($.ask === 'nodes' ? counts($.circuit).b - counts($.circuit).n + 1 : counts($.circuit).n - 1), 'That is the other method’s count.'],
      ],
    },
  },
};
