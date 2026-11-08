/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a bracket at resonance', lab: 'shake', scenario: 'resonant', read: (c) => ({ T: [c.T, 10.05], 'force (N)': [c.force, 197] }) }],
  s3: [
    { tag: 'a 100 Hz bracket', lab: 'random', scenario: 'bracket', read: (c) => ({ 'Miles (g)': [c.miles, 7.93], 'life (h)': [c.lifeS / 3600, 588] }) },
  ],
};
