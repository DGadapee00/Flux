/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const HALF = Math.log(2) / Math.PI ** 2;

export default {
  s1: [{ tag: 'a copper rod cools to half', lab: 'rod', scenario: 'copper', setup: (s) => { s.Fo = HALF; }, read: (c) => ({ t: [c.t, 6.0], 'middle (°C)': [c.midC, 60] }) }],
  s2: [{ tag: 'the ripple and the hump', lab: 'rod', scenario: 'wiggle', setup: (s) => { s.Fo = 0.02; }, read: (c) => ({ hump: [c.humpShare, 0.821], 'middle (°C)': [c.midC, 85.9] }) }],
  s3: [{ tag: 'a tent on 80 cells', lab: 'rod', scenario: 'tent', setup: (s) => { s.Fo = 0.01; }, read: (c) => ({ 'grid middle': [c.fd[40], 0.774], 'series middle': [c.mid, 0.774] }) }],
};
