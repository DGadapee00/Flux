/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'an Na⁺Cl⁻ ion pair', lab: 'bond', scenario: 'nacl', read: (c) => ({ E0: [c.E0, 5.42], 'E0 by integration': [c.numeric.depth, 5.42] }) }],
  s2: [{ tag: 'squeezing the ion pair', lab: 'bond', scenario: 'squeeze', read: (c) => ({ F: [c.Fr, 9.55], B: [c.B, 1540] }) }],
  s3: [{ tag: 'a deep well and a shallow one', lab: 'bond', scenario: 'shallow', read: (c) => ({ k: [c.k, 3.84], 'k (N/m)': [c.kN, 61.5] }) }],
};
