/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a shear', lab: 'matrix', scenario: 'shear', read: (c) => ({ det: [c.det, 1] }) }],
  s2: [{ tag: 'a shear and a quarter turn', lab: 'matrix', scenario: 'shear-then-turn', read: (c) => ({ x: [c.col1[0] + 1, 1], y: [c.col1[1], 1] }) }],
  s3: [{ tag: 'a 3×3 system', lab: 'elimination', scenario: 'three', setup: (s) => { s.step = 6; }, read: (c) => ({ x: [c.x[0], 2], y: [c.x[1], 3], z: [c.x[2], -1] }) }],
  s4: [{ tag: 'a tiny pivot', lab: 'elimination', scenario: 'tiny-pivot', read: (c) => ({ x1: [c.x[0], 1] }) }],
};
