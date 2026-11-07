/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { LOOP_R, amp, ampFull, counts } from '../bank/u1.js';

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
  'u1.5.amp': {
    traps: {
      v: [
        [($) => ($.ask === 'v2' ? amp(0).v2 : amp(0).v1), 'A dependent source is never switched off: with μ = 0 the amplifier is gone.'],
        [($) => ($.ask === 'v2' ? $.mu * (10 / 11) : 10 / 11), 'R_f carries current from the output back into node 1, so v_x is not the plain divider 10/11 V.'],
      ],
    },
  },
  'u1.7.rout': {
    traps: {
      r: [
        [($) => ampFull($.mu, Number($.Rf)).Rout0, 'Switch off only the independent source. With μ zeroed the feedback is gone and the output looks far softer.'],
        [($) => {
          // The source opened instead of shorted: node 1 keeps only R_in and R_f.
          const Rf = 1000 * Number($.Rf);
          const k = 1 / Rf / (1 / 10000 + 1 / Rf);
          return 1 / (1 / 100 + 1 / Rf - k * (1 / Rf + $.mu / 100));
        }, 'A voltage source switched off is a wire, not a break: its 1 kΩ still runs from node 1 to ground and sets v_x.'],
      ],
    },
  },
  'u1.8.gain': {
    traps: {
      g: [
        [($) => -Number($.Rf), 'That is the limit as μ → −∞. At a finite μ, v₁ is small but not zero, and the gain falls a little short.'],
        [($) => $.mu * (10 / 11), 'μ v_x with v_x from the plain divider ignores R_f: the output feeds back and holds v_x near zero.'],
      ],
    },
  },
};
