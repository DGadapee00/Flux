/** Unit 3 worked examples the lab can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'the run of 1,000', lab: 'decision', scenario: 'production', read: (c) => ({ sheet: [c.totals.sheet, 3.4], machined: [c.totals.machined, 2.6] }) }],
  s2: [{ tag: 'how far the cost weight can fall', lab: 'decision', scenario: 'production', read: (c) => ({ lo: [c.ranges.cost.lo, 3] }) }],
};
