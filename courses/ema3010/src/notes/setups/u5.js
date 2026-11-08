/** Unit 5 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [
    { tag: 'polystyrene at p = 0.99', lab: 'chains', scenario: 'mid', read: (c) => ({ 'M̄_n': [c.Mn, 10400], 'T_g (°C)': [c.Tg, 90.4] }) },
  ],
  s3: [
    { tag: 'a pane at 500 °C', lab: 'pane', scenario: 'anneal', read: (c) => ({ 'log₁₀ η': [c.le, 13.78], 'log₁₀ t (s)': [c.lt, 6.17] }) },
  ],
  s4: [
    { tag: 'equal areas', lab: 'couple', scenario: 'equal', read: (c) => ({ 'E (V)': [c.E, -0.335], 'rate (mm/yr)': [c.rate, 0.0662] }) },
  ],
};
