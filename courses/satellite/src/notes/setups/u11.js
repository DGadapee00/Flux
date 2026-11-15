/** Unit 11 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  imager: [
    { tag: 'a 9 cm telescope at 580 mm', lab: 'imager', scenario: 'cube', read: (c) => ({ 'GSD (m)': [c.gsd, 4.74], 'blur (m)': [c.spot, 3.73], Q: [c.Q, 0.64], 'swath (km)': [c.swath, 19.4] }) },
    { tag: 'the same aperture at 1500 mm', lab: 'imager', scenario: 'long', read: (c) => ({ 'GSD (m)': [c.gsd, 1.83], 'blur (m)': [c.spot, 3.73], Q: [c.Q, 1.67], 'swath (km)': [c.swath, 7.5] }) },
  ],
  laser: [
    { tag: 'a 10 mm terminal at 1000 km', lab: 'laser', scenario: 'cube', read: (c) => ({ 'θ (µrad)': [c.theta * 1e6, 98.7], 'w (m)': [c.w, 98.7], share: [c.share, 8.2e-6], 'dBm': [c.dBm, -20.9], 'photons/bit': [c.photonsPerBit, 3.2e5] }) },
    { tag: 'pointed by the body alone', lab: 'laser', scenario: 'body', read: (c) => ({ 'loss (dB)': [c.lossDB, 109], 'dBm': [c.dBm, -130], '3 dB at (µrad)': [c.halfLoss * 1e6, 58] }) },
  ],
};
