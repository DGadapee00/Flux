/** Unit 6 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a black sphere at 500 km', lab: 'balance', scenario: 'black', read: (c) => ({ 'in sun for good (°C)': [c.Thot - 273.15, 45.2], 'in shadow for good (°C)': [c.Tcold - 273.15, -74.5], 'highest in orbit (°C)': [c.Tmax - 273.15, 35.8] }) }],
  s3: [
    { tag: 'full sun, a 1 W/K link', lab: 'nodes', scenario: 'link', read: (c) => ({ 'T₁ (°C)': [c.T1c, 59.9], 'T₂ (°C)': [c.T2c, 3.9] }) },
  ],
};
