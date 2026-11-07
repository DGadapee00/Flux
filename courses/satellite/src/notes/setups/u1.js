/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a geostationary transfer orbit', lab: 'kepler', scenario: 'gto', setup: (s) => { s.frac = 0; }, read: (c) => ({ 'period (h)': [c.T / 3600, 10.53], 'perigee speed': [c.v, 10.2], e: [c.e, 0.728] }) }],
  s2: [{ tag: 'a quarter period on', lab: 'kepler', scenario: 'gto', read: (c) => ({ 'E (°)': [(c.E * 180) / Math.PI, 125.4], 'ν (°)': [(c.nu * 180) / Math.PI, 156.4] }) }],
};
