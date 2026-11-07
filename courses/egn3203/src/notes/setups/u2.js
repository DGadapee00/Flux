/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [{ tag: 'one minus cosine at 10⁻⁸', lab: 'roundoff', scenario: 'cosine', setup: (s) => { s.lx = -8; }, read: (c) => ({ rewritten: [c.stable, 0.5], 'as written + 0.5': [c.direct + 0.5, 0.5] }) }],
};
