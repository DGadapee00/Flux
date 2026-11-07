/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a 3-4-5 RC circuit', lab: 'phasors', scenario: 'rc345', read: (c) => ({ '|V_R|': [c.VRm, 3], '|V_C|': [c.VCm, 4], 'I (mA)': [c.Im * 1000, 3] }) }],
  s2: [{ tag: 'a series RLC at resonance', lab: 'phasors', scenario: 'resonance', read: (c) => ({ 'I (mA)': [c.Im * 1000, 500], '|V_L|': [c.VLm, 31.4], '|V_C|': [c.VCm, 31.4] }) }],
  s5: [
    { tag: 'a motor at 0.6', lab: 'power', scenario: 'poor', read: (c) => ({ 'Q (kvar)': [c.Qm / 1000, 6.67], 'S (kVA)': [c.S / 1000, 8.33], 'I (A)': [c.I, 34.7], 'loss (W)': [c.loss, 241] }) },
    { tag: 'correcting it', lab: 'power', scenario: 'fixed', read: (c) => ({ 'C (µF)': [c.Cfull, 307], 'I (A)': [c.I, 20.8], 'loss (W)': [c.loss, 86.8] }) },
  ],
  s3: [
    { tag: 'a corner at 1 kHz', lab: 'filter', scenario: 'equal', read: (c) => ({ '|H| at 1 kHz': [c.list[0].gain, 0.707], 'delay at 1 kHz (µs)': [c.list[0].delay * 1e6, 125], '|H| at 3 kHz': [c.list[1].gain, 0.316], 'delay at 3 kHz (µs)': [c.list[1].delay * 1e6, 66.3], '3rd over 1st': [c.ratio31, 0.149] }) },
    { tag: 'a corner at 200 Hz', lab: 'filter', scenario: 'low', read: (c) => ({ 'peak (V)': [c.Vp, 0.304], '3rd over 1st': [c.ratio31, 0.113] }) },
  ],
};
