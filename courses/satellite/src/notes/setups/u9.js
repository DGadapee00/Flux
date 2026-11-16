/** Unit 9 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  drag: [
    { tag: 'a 6U craft at 500 km', lab: 'decay', scenario: 'moderate', read: (c) => ({ 'scale height (km)': [c.H, 58.1], 'density (kg/m³)': [c.rho0, 6.14e-13], 'falling (km/yr)': [c.rate0, 11], 'life (years)': [c.years, 5.2] }) },
    { tag: 'a quiet Sun', lab: 'decay', scenario: 'quiet', read: (c) => ({ 'T∞ (K)': [c.T, 738], 'scale height (km)': [c.H, 42.9], 'density (kg/m³)': [c.rho0, 1.81e-13], 'life (years)': [c.years, 13] }) },
  ],
  upsets: [
    { tag: "Cassini's rate in 1 Gbit", lab: 'upsets', scenario: 'daily', read: (c) => ({ 'upsets a day': [c.single, 112], 'mean per word': [c.x, 8.06e-6], 'lost a day': [c.uncorrectable, 4.52e-4] }) },
  ],
};
