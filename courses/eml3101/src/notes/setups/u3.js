/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [
    { tag: 'furnace heat for a room', lab: 'exergy', scenario: 'furnace', read: (c) => ({ 'X (kJ)': [c.fr, 0.811], 'destroyed (kJ)': [c.destroyed, 0.770] }) },
  ],
  s3: [
    { tag: 'both at r = 10', lab: 'cycles', scenario: 'same', read: (c) => ({ 'η Otto': [c.etaO, 0.602], 'η Diesel': [c.etaD, 0.534] }) },
  ],
  s4: [
    { tag: '6 MPa and 500 °C', lab: 'rankine', scenario: 'base', read: (c) => ({ η: [c.eta, 0.384], 'x₄': [c.x4, 0.831] }) },
  ],
  s5: [
    { tag: 'outdoors at 7 °C', lab: 'heatpump', scenario: 'mild', read: (c) => ({ COP: [c.cop, 6.23], 'w (kJ/kg)': [c.w, 32.9] }) },
  ],
};
