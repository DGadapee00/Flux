/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'the tie line at 1550 K', lab: 'lever', scenario: 'mid', read: (c) => ({ 'Ni in liquid': [c.xL, 0.471], 'Ni in α': [c.xS, 0.541] }) }],
  s2: [{ tag: '50% nickel at 1550 K', lab: 'lever', scenario: 'mid', read: (c) => ({ W_L: [c.WL, 0.586], W_α: [c.WS, 0.414] }) }],
};
