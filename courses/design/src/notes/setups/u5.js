/** Unit 5 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'one gauge at 100 N', lab: 'bridge', scenario: 'quarter', read: (c) => ({ strain: [c.strain * 1e6, 689], dR: [c.dR, 0.48], mV: [c.out * 1000, 1.72], counts: [c.counts, 2] }) }],
  s2: [{ tag: 'a warm room', lab: 'bridge', scenario: 'warm', read: (c) => ({ heat: [c.heatError * 1000, 0.25] }) }],
  s3: [{ tag: '950 Hz at 1 kHz', lab: 'sampling', scenario: 'alias', read: (c) => ({ fa: [c.fa, 50] }) }],
  s4: [{ tag: 'a 200 °C bath in a 25 °C room', lab: 'temperature', scenario: 'no-cjc', setup: (s) => { s.wires = 2; }, read: (c) => ({ mV: [c.emf * 1000, 7.18], tc: [c.tc, 175], R: [c.R, 176.86], rtd: [c.rtd, 202.7] }) }],
  s5: [{ tag: 'a fifth of design flow', lab: 'orifice', scenario: 'low', read: (c) => ({ kPa: [c.dp / 1000, 3.6], err: [c.flowErrPct, 3.5] }) }],
};
