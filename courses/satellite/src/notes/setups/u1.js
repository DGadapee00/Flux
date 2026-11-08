/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a geostationary transfer orbit', lab: 'kepler', scenario: 'gto', setup: (s) => { s.frac = 0; }, read: (c) => ({ 'period (h)': [c.T / 3600, 10.53], 'perigee speed': [c.v, 10.2], e: [c.e, 0.728] }) }],
  s3: [{ tag: 'low orbit to geostationary', lab: 'transfer', scenario: 'geo', read: (c) => ({ 'Δv₁ (m/s)': [c.dv1 * 1000, 2426], 'Δv₂ (m/s)': [c.dv2 * 1000, 1467], 'coast (h)': [c.tTransfer / 3600, 5.27] }) }],
  s2: [{ tag: 'a quarter period on', lab: 'kepler', scenario: 'gto', read: (c) => ({ 'E (°)': [(c.E * 180) / Math.PI, 125.4], 'ν (°)': [(c.nu * 180) / Math.PI, 156.4] }) }],
  s5: [
    { tag: '400 km', lab: 'passes', scenario: 'iss', read: (c) => ({ 'T (min)': [c.Tmin, 92.4], 'eclipse (min)': [c.temin, 36.0], 'pass (min)': [c.tpmin, 6.2] }) },
  ],
};
