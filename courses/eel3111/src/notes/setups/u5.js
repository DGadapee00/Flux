/** Unit 5 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a gain of ten', lab: 'opamp', scenario: 'weak', read: (c) => ({ gain: [c.G, -9.891], 'error (%)': [100 * c.error, 1.09], 'v₋ (mV)': [1000 * c.vmPeak, 4.95] }) }],
  s2: [{ tag: '2 V in', lab: 'opamp', scenario: 'clip', read: (c) => ({ 'peak (V)': [c.peak, 13.5], 'largest input (V)': [c.maxIn, 1.35] }) }],
};
