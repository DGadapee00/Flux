/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { loadI, open1, open2, part1, part2, sign } from '../bank/u3.js';

export default {
  'u3.1.parts': {
    traps: {
      i: [
        [($) => ($.ask === 'one' ? open1($.V1) : open1($.V1) + open2($.V2)), 'A voltage source switched off is a wire, not a break: its series resistor stays, joined to ground.'],
        [($) => ($.ask === 'one' ? part1($.V1) + part2($.V2) : part1($.V1 + $.V2)), ($) => ($.ask === 'one' ? 'That is both sources on. For V₁’s part, set V₂ to zero.' : 'The sources sit in different places, so each reaches the load by its own path: find each part separately.')],
      ],
    },
  },
  'u3.2.power': {
    traps: {
      p: [
        [($) => 4 * (part1($.V1) ** 2 + part2($.V2) ** 2), 'Powers do not superpose: square the total current, not each part.'],
        [($) => 4 * (part1($.V1) - sign($) * part2($.V2)) ** 2, ($) => ($.way === 'oppose' ? 'Reversed, V₂’s part subtracts from V₁’s.' : 'Pushing the same way, the parts add.')],
      ],
    },
  },
};
