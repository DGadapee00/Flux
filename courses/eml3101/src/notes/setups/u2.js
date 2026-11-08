/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a 10 cm² throat', lab: 'nozzle', scenario: 'shock', read: (c) => ({ 'ṁ (kg/s)': [c.mdotChoked, 1.167], 'chokes at (kPa)': [500 * c.crit.p1, 469], 'design (kPa)': [500 * c.crit.pDesign, 47.0], 'exit Mach, design': [c.crit.Msup, 2.20] }) }],
  s2: [{ tag: 'a shock at 400 kPa', lab: 'nozzle', scenario: 'shock', read: (c) => ({ M1: [c.shock.M1, 1.66], M2: [c.shock.M2, 0.652], 'p₀ lost (%)': [100 * c.p0loss, 12.6], 'shock at exit (kPa)': [500 * c.crit.p2, 257] }) }],
  s4: [
    { tag: '40 MW at 250 m/s', lab: 'jet', scenario: 'turbojet', read: (c) => ({ 'V_e (m/s)': [c.Ve, 929], 'F (kN)': [c.F / 1000, 67.9] }) },
  ],
};
