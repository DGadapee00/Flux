/** Unit 8 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  margin: [
    { tag: 'a catalog bus and a new payload', lab: 'margin', scenario: 'catalog', read: (c) => ({ 'predicted (kg)': [c.predicted, 11.4], 'margin (kg)': [c.margin, 0.6], 'expected (kg)': [c.mean, 10.73], 'spread (kg)': [c.sd, 0.24] }) },
    { tag: 'every part new', lab: 'margin', scenario: 'new', read: (c) => ({ 'margin (kg)': [c.margin, 0.6], 'expected (kg)': [c.mean, 12.35], 'chance over': [c.pExceed, 0.86] }) },
  ],
};
