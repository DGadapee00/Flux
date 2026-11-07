/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a shear', lab: 'matrix', scenario: 'shear', read: (c) => ({ det: [c.det, 1] }) }],
  s2: [{ tag: 'a shear and a quarter turn', lab: 'matrix', scenario: 'shear-then-turn', read: (c) => ({ x: [c.col1[0] + 1, 1], y: [c.col1[1], 1] }) }],
  s3: [{ tag: 'a 3×3 system', lab: 'elimination', scenario: 'three', setup: (s) => { s.step = 6; }, read: (c) => ({ x: [c.x[0], 2], y: [c.x[1], 3], z: [c.x[2], -1] }) }],
  s5: [{ tag: 'two matrices with det 0.01', lab: 'inverse', scenario: 'nearly', read: (c) => ({ det: [c.det, 0.01], kappa: [c.kappa, 402], 'inverse a₁₁': [c.inv[0][0], 101] }) }],
  s6: [{ tag: 'a third row that adds nothing', lab: 'rank', scenario: 'line', read: (c) => ({ rank: [c.rankA, 2], 'null x': [c.xn[0], 1.5], 'null z': [c.xn[2], -2] }) }],
  s7: [{ tag: 'a symmetric matrix', lab: 'eigen', scenario: 'symmetric', read: (c) => ({ 'λ₁': [c.values[0], 3], 'λ₂': [c.values[1], 1], 'first direction (°)': [(c.found[0].angle * 180) / Math.PI, 45] }) }],
  s8: [{ tag: 'arrows at 45°', lab: 'projection', scenario: 'slant', read: (c) => ({ 'x̂₁': [c.xhat[0], 0.4], 'x̂₂': [c.xhat[1], 1.131], 'shadows miss by': [c.naiveErr, 1.02] }) }],
  s10: [{ tag: 'two nearly parallel lines', lab: 'condition', scenario: 'ill', read: (c) => ({ κ: [c.kappa, 402], 'nudge (%)': [100 * c.relB, 0.354], 'change in x (%)': [100 * c.relX, 70.7], 'residual (%)': [100 * c.relR, 0.353] }) }],
  s4: [{ tag: 'a tiny pivot', lab: 'elimination', scenario: 'tiny-pivot', read: (c) => ({ x1: [c.x[0], 1] }) }],
};
