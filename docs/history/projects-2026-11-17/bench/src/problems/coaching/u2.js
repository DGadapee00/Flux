/**
 * Unit 2 coaching: the wrong value a named mistake gives (`traps`), per template. Wrong options carry
 * their own `why` in the bank. Folded into the bank by src/problems/index.js.
 */
import { nextE12Up } from '@flux/subjects/em/diode.js';
import { prevE12Down } from '../bank/u2.js';

export default {
  'u2.pick-r': {
    traps: {
      R: [
        [($) => $.vs / ($.mA / 1000), 'That is V_s/I: it leaves out the LED. The LED keeps about V_f, so the resistor gets only V_s − V_f.'],
        [($) => $.vf / ($.mA / 1000), 'That puts the LED’s voltage across the resistor. The resistor takes what the LED leaves: V_s − V_f.'],
      ],
      Rbuy: [
        [($) => prevE12Down($.R), 'That rounds down. A smaller resistor lets more current through than you planned; round up.'],
        [($) => nextE12Up($.vs / ($.mA / 1000)), 'That is V_s/I rounded up: it leaves out the LED’s forward voltage.'],
      ],
    },
  },
  'u2.current': {
    traps: {
      I: [
        [($) => ($.vs / $.R) * 1000, 'That is V_s/R: it puts the whole supply across the resistor. The LED keeps its share.'],
        [($) => ($.vm / $.R) * 1000, 'That divides the LED’s voltage by the resistor. The resistor’s own voltage is V_s − V_LED.'],
      ],
    },
  },
  'u2.power': {
    traps: {
      P: [
        [($) => $.vs * $.Ia * 1000, 'That is V_s·I, the power the supply gives the whole circuit. The resistor gets only its own V_R·I.'],
        [($) => $.vm * $.Ia * 1000, 'That is the LED’s power, V_LED·I. The resistor’s is V_R·I.'],
      ],
    },
  },
  'u2.series': {
    traps: {
      R: [
        [($) => ($.vs - $.vf) / 0.02, 'That counts one LED. In series their voltages add: n·V_f.'],
        [($) => ($.vs - $.n * $.vf) / ($.n * 0.02), 'That adds the currents. In series every LED carries the same 20 mA.'],
        [($) => $.vs / 0.02, 'That leaves out the LEDs. They take n·V_f of the supply.'],
      ],
    },
  },
  'u2.parallel': {
    traps: {
      ans: [
        [($) => ({ R: ($.vs - 2) / ($.n * $.mA / 1000), I: $.mA, P: ($.mA / 1000) * ($.vs - 2) * 1000 }[$.q]), 'That treats the group as one LED. Each branch carries its own current, and the supply gives them all.'],
        [($) => ({ R: $.vs / ($.mA / 1000), I: ($.n * $.mA * $.vs) / ($.vs - 2), P: $.n * $.mA * $.vs }[$.q]), 'That puts the whole supply across each resistor. The LED keeps its 2.0 V, so each resistor gets only V_s − V_f.'],
      ],
    },
  },
  'u2.design': {
    traps: {
      Rbuy: [
        [($) => nextE12Up($.vs / ($.mA / 1000)), 'That is V_s/I rounded up: it leaves out the LED’s 2.0 V.'],
        [($) => prevE12Down($.Rx), 'That rounds down, so the current runs over your limit. Round up.'],
      ],
      I: [
        [($) => $.mA, 'That is your target, not what the part gives. The bought resistor is larger, so the current is a little less.'],
        [($) => ($.vs / $.Rbuy) * 1000, 'That is V_s/R: it leaves out the LED’s 2.0 V.'],
      ],
      P: [
        [($) => $.vs * $.I, 'That is V_s·I, the whole circuit’s power. The resistor’s is I²R.'],
        [($) => 2 * $.I, 'That is the LED’s power, 2.0 V times the current. The resistor’s is I²R.'],
      ],
    },
  },
};
