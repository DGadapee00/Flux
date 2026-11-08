/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'the Sun', lab: 'radiation', scenario: 'sun', read: (c) => ({ peak: [c.peak, 0.502], Eb: [c.Eb, 6.32e7] }) }],
  s2: [{ tag: 'a plate in sunlight', lab: 'radiation', scenario: 'white', read: (c) => ({ 'white plate (K)': [c.plateT, 275], alpha: [c.alphaSolar, 0.215] }) }],
  s3: [
    { tag: 'two strips facing', lab: 'viewfactor', scenario: 'equal', read: (c) => ({ crossed: [c.crossed, 2.828], uncrossed: [c.uncrossed, 2], F12: [c.F12, 0.414] }) },
    { tag: 'a narrow strip over a wide one', lab: 'viewfactor', scenario: 'small', read: (c) => ({ F12: [c.F12, 0.141], F21: [c.F21, 0.704], 'w₁F₁₂': [c.A1F12, 0.141] }) },
  ],
  s5: [
    { tag: 'one polished shield', lab: 'shield', scenario: 'polished', read: (c) => ({ 'q (W/m²)': [c.q, 170], 'T_s (K)': [c.T[1], 512] }) },
  ],
};
