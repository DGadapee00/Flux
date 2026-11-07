/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'air over a warm plate', lab: 'thermal', scenario: 'air', read: (c) => ({ 'θ′(0)': [c.wall, 0.294], 'η at θ = 0.99': [c.etaT, 5.60], 'δt/δ': [c.ratio, 1.14] }) }],
  s2: [{ tag: 'water along a plate', lab: 'thermal', scenario: 'water', read: (c) => ({ 'θ′(0)': [c.wall, 0.607] }) }],
};
