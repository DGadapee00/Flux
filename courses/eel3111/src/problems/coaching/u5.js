/**
 * Unit 5 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */

export default {
  'u5.1.gain': {
    traps: {
      g: [
        [($) => -Number($.Rf) / $.R1, 'That is the ideal gain, for A → ∞. With A this small, the circuit falls short of it.'],
        [($) => -(10 ** Number($.lA)), 'The op amp’s own gain is not the circuit’s: feedback brings it down to near −R_f/R₁.'],
      ],
    },
  },
  'u5.2.headroom': {
    traps: {
      v: [
        [($) => Number($.Vs) / (Number($.Rf) / $.R1), 'The output stops 1.5 V inside the supply, not at it.'],
        [($) => Number($.Vs) - 1.5, 'That is the largest output. Divide by the gain to get the largest input.'],
      ],
    },
  },
};
