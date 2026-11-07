/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'the Sun', lab: 'radiation', scenario: 'sun', read: (c) => ({ peak: [c.peak, 0.502], Eb: [c.Eb, 6.32e7] }) }],
  s2: [{ tag: 'a plate in sunlight', lab: 'radiation', scenario: 'white', read: (c) => ({ 'white plate (K)': [c.plateT, 275], alpha: [c.alphaSolar, 0.215] }) }],
};
