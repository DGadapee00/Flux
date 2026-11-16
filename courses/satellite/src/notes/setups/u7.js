/** Unit 7 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  budgets: [
    { tag: 'the magnetometer craft', lab: 'mission', scenario: 'base', read: (c) => ({ 'mass (kg)': [c.mass.mean, 10.2], 'power use': [c.use.power, 0.87], 'battery use': [c.use.battery, 0.76], 'link margin (dB)': [c.link.margin, 12.7], 'data use': [c.use.data, 0.57], 'life (years)': [c.life, 4.4] }) },
  ],
  trades: [
    { tag: 'a slower radio', lab: 'mission', scenario: 'uhf', read: (c) => ({ 'mass use': [c.use.mass, 0.83], 'power use': [c.use.power, 0.84], 'data use': [c.use.data, 59] }) },
    { tag: 'a camera instead', lab: 'mission', scenario: 'camera', read: (c) => ({ 'data use': [c.use.data, 0.66], 'pointing use': [c.use.pointing, 0.5], 'life (years)': [c.life, 4.0], 'life use': [c.use.life, 0.8] }) },
  ],
};
