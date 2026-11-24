/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    { tag: 'the LED backwards', lab: 'led', scenario: 'flip', read: (c) => ({ V: [-c.Vled, 5.0] }) },
  ],
  s2: [
    {
      tag: 'halving the resistor',
      lab: 'led',
      scenario: 'red9',
      setup(s) {
        s.R = 330;
      },
      read: (c) => ({ I: [c.I * 1000, 21.17], V: [c.Vled, 2.01] }),
    },
    { tag: 'almost no resistor', lab: 'led', scenario: 'bare', read: (c) => ({ I: [c.I * 1000, 155], V: [c.Vled, 3.45] }) },
  ],
  s3: [
    { tag: 'a red LED on 5 V', lab: 'led', scenario: 'red5', read: (c) => ({ I: [c.I * 1000, 20.0], V: [c.Vled, 2.0] }) },
    {
      tag: "a blue LED with the red LED's resistor",
      lab: 'led',
      scenario: 'red5',
      setup(s) {
        s.color = 'blue';
      },
      read: (c) => ({ I: [c.I * 1000, 12.6], V: [c.Vled, 3.1] }),
    },
  ],
  s4: [
    { tag: 'an indicator on 9 V', lab: 'indicator', scenario: 'nine', read: (c) => ({ R: [c.Rpick, 390], I: [c.mA, 17.95], P: [c.PR * 1000, 126] }) },
    { tag: '12 V on a ⅛ W resistor', lab: 'indicator', scenario: 'twelve', read: (c) => ({ R: [c.Rpick, 560], I: [c.mA, 17.86], P: [c.PR * 1000, 179] }) },
  ],
  s5: [
    { tag: 'three red LEDs in series', lab: 'led-strings', scenario: 'series', read: (c) => ({ I: [c.I1 * 1000, 20.0], eff: [c.eff * 100, 66.7] }) },
    {
      tag: 'one LED fails open',
      lab: 'led-strings',
      scenario: 'series',
      setup(s) {
        s.open = 1;
      },
      read: (c) => ({ dark: [c.flows ? 1 : 0, 0] }),
    },
  ],
  s6: [
    { tag: 'two LEDs on one resistor', lab: 'led-strings', scenario: 'shared', read: (c) => ({ I1: [c.I1 * 1000, 23.4], I2: [c.I2 * 1000, 15.5], tot: [c.Itot * 1000, 38.9] }) },
    { tag: 'a resistor each', lab: 'led-strings', scenario: 'own', read: (c) => ({ I1: [c.I1 * 1000, 18.1], I2: [c.I2 * 1000, 17.9], tot: [c.Itot * 1000, 36.0] }) },
  ],
};
