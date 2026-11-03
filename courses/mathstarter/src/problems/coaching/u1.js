/**
 * EXAMPLE COACHING. Traps (the wrong value a named mistake gives), `why` for each wrong option, and
 * extra hints, per template. Folded into the bank by src/problems/index.js.
 */
export default {
  'u1.1.fill-time': {
    traps: {
      T: [
        [($) => 0.3 / ($.qin - $.qout), 'That fills the whole 300 L. Some water is already in the tank.'],
        [($) => (0.3 - $.V0) / $.qin, 'The drain runs the whole time. Use inflow minus outflow.'],
      ],
    },
  },
  'u1.2.volume-at': {
    traps: {
      V: [
        [($) => $.V0 + $.qin * $.t, 'The drain runs too. Use the net rate, inflow minus outflow.'],
        [($) => ($.qin - $.qout) * $.t, 'That is only the change. Add what was in the tank at the start.'],
      ],
    },
  },
};
