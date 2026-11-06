/**
 * Unit 4 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { RATIO } from '../bank/u4.js';

const C = ($) => 1 / (1 + RATIO[$.members]);

export default {
  'u4.1.bolt-share': {
    traps: {
      Fb: [
        [($) => $.Fi + $.P, 'The bolt does not take the whole pull. Its share is C = k_b/(k_b + k_m); the rest unclamps the parts.'],
        [($) => $.Fi + (1 - C($)) * $.P, 'Those shares are swapped. The bolt takes C = k_b/(k_b + k_m) of the pull, the members the rest.'],
      ],
      Fm: [
        [($) => $.Fi - $.P, 'The clamp drops by (1 − C)P, not by the whole pull.'],
        [($) => $.Fi - C($) * $.P, 'That uses the bolt’s share. The clamp drops by the members’ share, 1 − C.'],
      ],
    },
  },
  'u4.2.separation': {
    traps: {
      Psep: [
        [($) => $.Fi, 'The joint holds past its preload: only part of the pull unclamps it.'],
        [($) => $.Fi / C($), 'Divide by the members’ share, 1 − C, not the bolt’s.'],
      ],
    },
  },
};
