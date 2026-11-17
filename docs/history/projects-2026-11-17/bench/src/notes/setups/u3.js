/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    { tag: 'a 10 kΩ potentiometer at half way', lab: 'divider', scenario: 'pot10', read: (c) => ({ V: [c.v, 2.5], I: [c.iDiv * 1000, 0.5] }) },
    { tag: 'ratio, not size', lab: 'divider', scenario: 'pot100', read: (c) => ({ V: [c.v, 2.5], I: [c.iDiv * 1e6, 50] }) },
  ],
  s2: [
    {
      tag: 'a 1 kΩ load on a 100 kΩ divider',
      lab: 'divider',
      scenario: 'pot100',
      setup(s) {
        s.load = 1e3;
      },
      read: (c) => ({ V: [c.v, 0.096], rth: [c.rth, 25e3] }),
    },
  ],
  s3: [
    { tag: 'an LDR below 10 kΩ in room light', lab: 'divider', scenario: 'ldr', read: (c) => ({ R: [c.rSensor, 1950], V: [c.v, 0.814] }) },
    {
      tag: 'the LDR above the output',
      lab: 'divider',
      scenario: 'ldr',
      setup(s) {
        s.pos = 'top';
      },
      read: (c) => ({ V: [c.v, 4.19] }),
    },
    {
      tag: 'a thermistor at 0 °C',
      lab: 'divider',
      scenario: 'ntc',
      setup(s) {
        s.tC = 0;
      },
      read: (c) => ({ R: [c.rSensor, 33.6e3], V: [c.v, 3.87] }),
    },
  ],
  s4: [
    { tag: "the night light's fixed resistor", lab: 'nightlight', scenario: 'ten', read: (c) => ({ best: [c.best, 10.5e3], room: [c.countRoom, 166], night: [c.countNight, 869], swing: [c.swing, 703] }) },
    { tag: 'a 1 MΩ fixed resistor', lab: 'nightlight', scenario: 'meg', read: (c) => ({ night: [c.countNight, 54], swing: [c.swing, 53] }) },
  ],
  s5: [
    { tag: 'a floating input', lab: 'button', scenario: 'float', read: (c) => ({ lo: [c.vMin, 0.5], hi: [c.vMax, 4.5] }) },
    { tag: 'a 10 kΩ pull-up', lab: 'button', scenario: 'pullup', read: (c) => ({ lo: [c.vMin, 4.96], hi: [c.vMax, 5.0] }) },
  ],
  s6: [
    { tag: 'a 1 MΩ pull-up', lab: 'button', scenario: 'weak', read: (c) => ({ lo: [c.vMin, 2.75], hi: [c.vMax, 4.75] }) },
    {
      tag: 'a 100 Ω pull-up, held',
      lab: 'button',
      scenario: 'pressed',
      setup(s) {
        s.rp = 100;
      },
      read: (c) => ({ P: [c.pWaste * 1000, 250], I: [c.iPress * 1000, 50] }),
    },
  ],
};
