/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [
    { tag: 'an aluminium plate', lab: 'griffith', scenario: 'alu', read: (c) => ({ 'σ_c (MPa)': [c.sc, 135] }) },
  ],
  s3: [
    { tag: 'a fifth of yield', lab: 'paris', scenario: 'fifth', read: (c) => ({ 'a_c (mm)': [c.ac * 1000, 91.4], N: [c.N, 723900] }) },
  ],
  s4: [
    { tag: 'a superalloy at 850 °C', lab: 'creep', scenario: 'base', read: (c) => ({ 'life (h)': [c.lifeH, 460] }) },
  ],
};
