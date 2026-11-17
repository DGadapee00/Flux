/**
 * Unit 3 coaching: the wrong value a named mistake gives (`traps`), per template. Wrong options carry
 * their own `why` in the bank. Folded into the bank by src/problems/index.js.
 */
import { divider, par } from '@flux/subjects/em/sensors.js';
import { swingAt } from '../bank/u3.js';

const flip = ($, r) => ($.pos === 'bottom' ? divider(5, r, $.fixed).v : divider(5, $.fixed, r).v);

export default {
  'u3.divider': {
    traps: {
      ans: [
        [($) => ($.q === 'V' ? divider(5, $.bottom, $.top).v : ($.top * (5 - $.V)) / $.V), 'That is the divider upside down: the upper resistor’s share. The output is the share of the part below it.'],
        [($) => ($.q === 'V' ? (5 * $.bottom) / $.top : ($.top * $.V) / 5), 'That leaves out one resistor from the total. The share is R_lower over the sum of both.'],
      ],
    },
  },
  'u3.ldr': {
    traps: {
      Vroom: [
        [($) => flip($, $.rr), 'That puts the LDR on the other side of the output. Its share of 5 V is the output only when it is the lower part.'],
        [() => 2.5, 'Half of 5 V holds only when the two parts are equal. In the room the LDR is far below the fixed resistor.'],
      ],
      Vnight: [
        [($) => flip($, $.rn), 'That puts the LDR on the other side of the output. Its share of 5 V is the output only when it is the lower part.'],
        [($) => ($.pos === 'bottom' ? divider(5, $.fixed, $.rr).v : divider(5, $.rr, $.fixed).v), 'That is the room’s value. At night the LDR’s resistance is much larger.'],
      ],
    },
  },
  'u3.best': {
    traps: {
      R: [
        [($) => ($.ra + $.rb) / 2, 'That is the arithmetic mean. The swing peaks at the geometric mean, √(R_light·R_dark), which sits far closer to the smaller value.'],
        [($) => $.rb, 'That matches the dark value. The best resistor sits between the two, at their geometric mean.'],
      ],
      swing: [
        [($) => swingAt($.ra, $.rb, ($.ra + $.rb) / 2), 'That is the swing with the arithmetic mean. The geometric mean gives more.'],
        [() => 5, 'The output never reaches 0 V or 5 V: the LDR is never zero or infinite.'],
      ],
    },
  },
  'u3.load': {
    traps: {
      ans: [
        [($) => ($.q === 'V' ? 2.5 : 0), 'That ignores the load. It joins the output to 0 V, in parallel with the lower resistor.'],
        [($) => {
          const v = divider(5, par($.R, $.L), $.R).v;
          return $.q === 'V' ? v : ((2.5 - v) / 2.5) * 100;
        }, 'That puts the load across the upper resistor. It goes from the output to 0 V, so it is across the lower one.'],
      ],
    },
  },
  'u3.ntc': {
    traps: {
      V: [
        [() => 2.5, 'That uses 10 kΩ, the thermistor’s value at 25 °C. At this temperature its resistance has changed.'],
        [($) => 5 - $.V, 'That is the divider upside down: the other part’s share of 5 V.'],
      ],
    },
  },
  'u3.pull-power': {
    traps: {
      P: [
        [($) => ($.vcc / $.rp) * 1000, 'That is the current, V/R, in mA. Power is V²/R, or V times that current.'],
        [($) => (($.vcc / 2) ** 2 / $.rp) * 1000, 'That puts half the supply across the pull-up. Held, the pin is at 0 V, so the whole supply is across it.'],
      ],
    },
  },
  'u3.pull-max': {
    traps: {
      R: [
        [($) => $.vcc / $.leak, 'That lets the pull-up drop the whole supply. The pin must stay above 0.6·V_cc, so it may drop only 0.4·V_cc.'],
        [($) => (0.6 * $.vcc) / $.leak, 'That uses the pin’s voltage. What the pull-up may drop is the rest: 0.4·V_cc.'],
      ],
      buy: [
        [($) => { const up = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2, 10]; const d = 10 ** Math.floor(Math.log10($.R)); return up.map((m) => Number((m * d).toPrecision(3))).find((v) => v > $.R * (1 + 1e-9)); }, 'That rounds up. A larger pull-up drops more than the input can afford; round down.'],
        [($) => $.vcc / $.leak, 'That lets the pull-up drop the whole supply. It may drop only 0.4·V_cc.'],
      ],
    },
  },
};
