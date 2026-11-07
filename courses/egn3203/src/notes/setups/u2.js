/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s3: [{ tag: 'the forward difference at h = 0.1', lab: 'truncation', scenario: 'tenth', read: (c) => ({ estimate: [c.methods.forward.value, 0.4974], error: [c.methods.forward.error, 0.0429], 'leading term': [c.methods.forward.predicted, 0.0421] }) }],
  s2: [{ tag: 'one minus cosine at 10⁻⁸', lab: 'roundoff', scenario: 'cosine', setup: (s) => { s.lx = -8; }, read: (c) => ({ rewritten: [c.stable, 0.5], 'as written + 0.5': [c.direct + 0.5, 0.5] }) }],
};
