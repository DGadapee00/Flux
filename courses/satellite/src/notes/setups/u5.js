/** Unit 5 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a 20 W load at 500 km', lab: 'power', scenario: 'sized', read: (c) => ({ 'eclipse (min)': [c.Te / 60, 35.8], 'array needed (W)': [c.needSun, 35.0], 'depth of discharge': [c.dod, 0.331] }) }],
  s3: [
    { tag: '175 Wh for five years', lab: 'ageing', scenario: 'sized', read: (c) => ({ 'C (Wh)': [c.C, 132.1] }) },
  ],
};
