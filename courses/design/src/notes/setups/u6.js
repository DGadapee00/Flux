/** Unit 6 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a linear valve on a long pipe', lab: 'valve', scenario: 'long', read: (c) => ({ auth: [c.auth, 0.25], share: [c.share * 100, 77] }) }],
  s2: [{ tag: 'a shared return', lab: 'board', scenario: 'shared', read: (c) => ({ R: [c.Rtrace * 1000, 57.6], mV: [c.error * 1000, 115], counts: [c.counts, 143] }) }],
};
