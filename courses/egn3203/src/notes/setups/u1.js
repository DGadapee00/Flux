/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a shear', lab: 'matrix', scenario: 'shear', read: (c) => ({ det: [c.det, 1] }) }],
  s2: [{ tag: 'a shear and a quarter turn', lab: 'matrix', scenario: 'shear-then-turn', read: (c) => ({ x: [c.col1[0] + 1, 1], y: [c.col1[1], 1] }) }],
  s3: [{ tag: 'a 3×3 system', lab: 'elimination', scenario: 'three', setup: (s) => { s.step = 6; }, read: (c) => ({ x: [c.x[0], 2], y: [c.x[1], 3], z: [c.x[2], -1] }) }],
  s5: [{ tag: 'two matrices with det 0.01', lab: 'inverse', scenario: 'nearly', read: (c) => ({ det: [c.det, 0.01], kappa: [c.kappa, 402], 'inverse a₁₁': [c.inv[0][0], 101] }) }],
  s6: [{ tag: 'a third row that adds nothing', lab: 'rank', scenario: 'line', read: (c) => ({ rank: [c.rankA, 2], 'null x': [c.xn[0], 1.5], 'null z': [c.xn[2], -2] }) }],
  s4: [{ tag: 'a tiny pivot', lab: 'elimination', scenario: 'tiny-pivot', read: (c) => ({ x1: [c.x[0], 1] }) }],
};
