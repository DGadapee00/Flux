/** Unit 3 worked examples the lab can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'the run of 1,000', lab: 'decision', scenario: 'production', read: (c) => ({ sheet: [c.totals.sheet, 3.4], machined: [c.totals.machined, 2.6] }) }],
  s2: [{ tag: 'how far the cost weight can fall', lab: 'decision', scenario: 'production', read: (c) => ({ lo: [c.ranges.cost.lo, 3] }) }],
  s3: [{ tag: 'widening the plate', lab: 'intent', scenario: 'chained', setup: (s) => { s.W = 100; }, read: (c) => ({ x1: [c.x1, 20], x2: [c.x2, 60], off: [c.misalign, 10] }) }],
  s4: [{ tag: 'the bracket on thin sheet', lab: 'verify', scenario: 'sheet', read: (c) => ({ stress: [c.stress, 46.9], ms: [c.msStrength, 2.43], rigid: [c.tipRigid, 0.574], test: [c.tipTest, 1.21], msTest: [c.msDeflTest, -0.17] }) }],
};
