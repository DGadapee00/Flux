/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a small satellite’s downlink', lab: 'noise', scenario: 'cubesat', read: (c) => ({ 'noise (dBm)': [c.noiseDBm, -131.6], 'S/N (dB)': [c.snrDB, 11.6] }) }],
  s3: [{ tag: 'a low-orbit downlink', lab: 'link', scenario: 'leo', read: (c) => ({ 'path loss (dB)': [c.terms.loss, 159.3], 'dish gain (dBi)': [c.terms.Gr, 34.2], 'E_b/N_0 (dB)': [c.ebn0dB, 27.7] }) }],
  s2: [
    {
      tag: 'a weak signal, a narrower band',
      lab: 'noise',
      scenario: 'weak',
      setup(s) {
        s.lB = 3;
      },
      read: (c) => ({ 'E_b/N_0 (dB)': [c.ebn0DB, 6.6], 'bits wrong': [c.ber, 1.24e-3] }),
    },
  ],
  tracking: [
    { tag: 'UHF at 500 km', lab: 'doppler', scenario: 'uhf', read: (c) => ({ 'pass (min)': [c.duration / 60, 7.38], 'range at edge (km)': [c.rhoEdge, 1695], 'closing (km/s)': [c.rateEdge, 6.96], 'shift (kHz)': [c.shift / 1000, 10.1], 'slope (Hz/s)': [c.slopeSeen, 157], 'light, edge (ms)': [c.lightEdge * 1000, 11.3] }) },
    { tag: 'S-band, two-way coherent', lab: 'doppler', scenario: 'coherent', read: (c) => ({ 'shift (kHz)': [c.shift / 1000, 102] }) },
  ],
};
