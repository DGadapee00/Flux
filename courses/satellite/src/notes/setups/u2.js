/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a small satellite’s downlink', lab: 'noise', scenario: 'cubesat', read: (c) => ({ 'noise (dBm)': [c.noiseDBm, -131.6], 'S/N (dB)': [c.snrDB, 11.6] }) }],
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
};
