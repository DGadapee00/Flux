/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'nitrogen and carbon dioxide', lab: 'mixture', scenario: 'co2', read: (c) => ({ N_A: [c.NA, 35.7], N_B: [c.NB, 22.7], y_B: [c.yB, 0.389], x_B: [c.xB, 0.5] }) }],
  s2: [{ tag: 'a little hydrogen', lab: 'mixture', scenario: 'h2', read: (c) => ({ y_B: [c.yB, 0.582], 'p (kPa)': [c.p / 1000, 213], 'p_H2 (kPa)': [c.pB / 1000, 124], 'by mass (kPa)': [c.pBmass / 1000, 19.3] }) }],
  s3: [{ tag: 'the mixture’s M, R and c_p', lab: 'mixture', scenario: 'co2', read: (c) => ({ 'M (g/mol)': [1000 * c.M, 34.2], R: [c.R, 243], c_p: [c.cp, 942] }) }],
};
