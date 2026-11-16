/**
 * Unit 17 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { bound, drift, matchings } from '../bank/u17.js';

export default {
  'u17.1.drift': {
    traps: {
      y: [
        [($) => drift($, 'once'), 'The craft does not just coast ahead at the push: its higher orbit is slower, and it drifts at 3ẏ₀.'],
        [($) => drift($, 'twice'), 'The drift is 3ẏ₀, from the change in period, not 2ẏ₀.'],
      ],
    },
  },
  'u17.2.bound': {
    traps: {
      b: [
        [($) => bound($, 'two'), 'y = (2ẋ₀/n)(cos nt − 1) swings between 0 and −4ẋ₀/n: its largest size is 4ẋ₀/n.'],
        [($) => bound($, 'one'), 'That is the radial swing, ẋ₀/n. Along the track it is four times as large.'],
      ],
    },
  },
  'u17.3.match': {
    traps: {
      m: [
        [($) => matchings($, 'square'), 'Each name takes a track the others cannot: N × (N − 1) × … × 1, not N².'],
        [($) => matchings($, 'power'), 'Count orderings, not subsets: N!, not 2^N.'],
      ],
    },
  },
};
