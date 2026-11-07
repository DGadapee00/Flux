/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a 3-4-5 RC circuit', lab: 'phasors', scenario: 'rc345', read: (c) => ({ '|V_R|': [c.VRm, 3], '|V_C|': [c.VCm, 4], 'I (mA)': [c.Im * 1000, 3] }) }],
  s2: [{ tag: 'a series RLC at resonance', lab: 'phasors', scenario: 'resonance', read: (c) => ({ 'I (mA)': [c.Im * 1000, 500], '|V_L|': [c.VLm, 31.4], '|V_C|': [c.VCm, 31.4] }) }],
};
