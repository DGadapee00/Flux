/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { LOADS, loadI, open1, open2, part1, part2, sign, th } from '../bank/u3.js';

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
  'u3.5.thevenin': {
    traps: {
      v: [
        [($) => ({ vth: th({ V1: $.V1, V2: 0 }).Vth, rth: 6, in: $.V2 / 4 })[$.ask], ($) => ({ vth: 'That is V₁’s part alone. V₂ adds its own part at the terminals.', rth: 'Switched off, each voltage source is a wire, not a break: its resistor stays, joined to ground.', in: 'That is V₂’s part alone. V₁ also drives current into the short.' })[$.ask]],
        [($) => ({ vth: th($).IN * 6, rth: 4 + 2 + 4 / 3, in: $.V2 / 4 + $.V1 / 2 })[$.ask], ($) => ({ vth: 'R_th has the sources switched off as wires: 4 Ω in parallel with 3.33 Ω, not 6 Ω.', rth: 'The 4 Ω of V₂’s branch is in parallel with the rest, not in series.', in: 'V₁’s current divides at node 1: part of it goes down the 4 Ω shunt and never reaches the short.' })[$.ask]],
      ],
    },
  },
  'u3.6.load-power': {
    traps: {
      p: [
        [($) => $.V ** 2 / (LOADS[$.load] * $.R), 'V_th is not across the load: R_th takes its share of the voltage.'],
        [($) => $.V ** 2 / ($.R + LOADS[$.load] * $.R), 'That is the total power, load and R_th together. The load takes R_L/(R_L + R_th) of it.'],
      ],
    },
  },
};
