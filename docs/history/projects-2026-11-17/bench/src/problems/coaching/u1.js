/**
 * Unit 1 coaching: the wrong value a named mistake gives (`traps`), per template. Wrong options carry
 * their own `why` in the bank. Folded into the bank by src/problems/index.js.
 */
const R_VOLT = 10e6;
const R_AMP = 0.5;
const AWG = { 28: 0.2129, 26: 0.1339, 24: 0.0842, 22: 0.053 };

export default {
  'u1.series': {
    traps: {
      I: [
        [($) => (5 / $.R1) * 1000, 'That counts R₁ alone. R₂ is in the same path, so the resistances add.'],
        [($) => (5 / $.R1 + 5 / $.R2) * 1000, 'That treats the resistors as side by side. They share one path, so they are in series.'],
      ],
      Vmid: [
        [($) => (5 * $.R1) / ($.R1 + $.R2), 'That is R₁’s drop, not the row’s voltage. Row 14 is what is left after R₁: 5 V minus R₁’s share.'],
        [() => 2.5, 'Half of 5 V holds only for equal resistors. The larger one takes the larger share.'],
      ],
    },
  },
  'u1.jumper': {
    traps: {
      ans: [
        [($) => ($.q === 'I' ? $.before : (5 * $.R2) / ($.R1 + $.R2)), 'That ignores the jumper. A jumper across R₂ joins its two rows, so R₂ drops out.'],
        [($) => ($.q === 'I' ? (5 / $.R2) * 1000 : 5), 'The jumper shorts R₂, not R₁. R₁ is the one left carrying the current.'],
      ],
    },
  },
  'u1.loading': {
    traps: {
      ans: [
        [($) => ($.q === 'read' ? $.ideal : 0), 'That is the voltage with no meter. The meter’s 10 MΩ sits in parallel with the resistor and pulls it down a little.'],
        [($) => ($.q === 'read' ? (9 * R_VOLT) / ($.R + R_VOLT) : -((9 * R_VOLT) / ($.R + R_VOLT) - $.ideal) / $.ideal * 100), 'That puts the meter in series with the upper resistor. A voltmeter goes across the lower one, in parallel with it.'],
      ],
    },
  },
  'u1.ammeter-across': {
    traps: {
      ans: [
        [($) => $.true, 'That is the circuit’s current with no meter. On amps the meter is 0.5 Ω across R₂, which shorts it and changes the circuit.'],
        [($) => (9 / R_AMP) * 1000, 'That puts the 9 V straight across the meter. R₁ is still in the path and limits the current.'],
      ],
    },
  },
  'u1.fuse': {
    traps: {
      I: [
        [($) => $.E / R_AMP, 'That leaves out the source’s own resistance. It is the only other thing limiting the current.'],
        [($) => $.E / $.r, 'That leaves out the meter. On amps it is 0.5 Ω, in series with the source’s resistance.'],
      ],
    },
  },
  'u1.ohms-in-circuit': {
    traps: {
      ans: [
        [($) => ($.q === 'read' ? $.R2 : $.read), ($) => ($.q === 'read' ? 'That is R₂ alone. The meter’s current also finds the other path between the rows, so it reads them in parallel.' : 'That is the reading itself. The reading is R₂ and R₃ together, in parallel.')],
        [($) => ($.q === 'read' ? $.R2 + $.R3 : $.R2 - $.read), 'Parallel resistances do not add or subtract. Their reciprocals do: 1/R = 1/R₂ + 1/R₃.'],
      ],
    },
  },
  'u1.cable': {
    traps: {
      V: [
        [($) => (5.1 * $.RL) / ($.RL + 0.1 + $.len * AWG[$.awg]), 'That counts one wire. The current goes out on one and back on the other: double it.'],
        [($) => (5.1 * $.RL) / ($.RL + 0.1), 'That leaves out the cable. Its wires are often the biggest resistance in the path.'],
      ],
    },
  },
  'u1.bank-life': {
    traps: {
      h: [
        [($) => $.Wh / $.P, 'That uses all of the stored energy. Only 85% reaches the 5 V output.'],
        [($) => ($.cap / 1000) * 5 * 0.85 / $.P, 'That counts the mAh at 5 V. A bank’s mAh are at its cell’s 3.7 V.'],
      ],
    },
  },
};
