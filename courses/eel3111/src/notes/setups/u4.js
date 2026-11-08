/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'switched in and out', lab: 'switch', scenario: 'rc', read: (c) => ({ 'R_th closed (Ω)': [c.on.Rth, 867], 'τ closed (ms)': [c.tauOn * 1e3, 8.67], 'final (V)': [c.final, 8], 'τ open (ms)': [c.tauOff * 1e3, 22], 'at 40 ms (V)': [c.atT1, 7.92] }) }],
  s2: [{ tag: 'opening on an inductor', lab: 'switch', scenario: 'rl', read: (c) => ({ 'final (mA)': [c.final * 1000, 9.23], 'at 40 ms (mA)': [c.atT1 * 1000, 8.94], 'v_L after (V)': [c.vOpen, -19.7], 'τ open (ms)': [c.tauOff * 1e3, 4.55] }) }],
  s4: [
    { tag: 'L = 10 mH, C = 1 µF', lab: 'rlc', scenario: 'ring', read: (c) => ({ ζ: [c.zeta, 0.1], overshoot: [c.overshoot, 0.729] }) },
  ],
};
