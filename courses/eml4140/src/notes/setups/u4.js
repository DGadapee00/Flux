/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [
    { tag: 'equal streams at NTU 2', lab: 'exchanger', scenario: 'counter', read: (c) => ({ ε: [c.eps, 0.667], 'q (kW)': [c.q / 1000, 46.7], 'T_c,o (°C)': [c.Tco, 66.7] }) },
  ],
  s3: [
    { tag: 'air at 30 °C and 50%', lab: 'wetbulb', scenario: 'mild', read: (c) => ({ 'T_w (°C)': [c.Tw, 21.5], 'dew (°C)': [c.dew, 18.45] }) },
  ],
};
