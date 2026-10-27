/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    { tag: 'two resistors in series', lab: 'breadboard', scenario: 'series', read: (c) => ({ I: [c.I1 * 1000, 1.56], Vmid: [c.Vmid, 3.44] }) },
  ],
  s2: [
    { tag: 'a stray jumper', lab: 'breadboard', scenario: 'jumper', read: (c) => ({ I: [c.I1 * 1000, 5.0] }) },
  ],
  s3: [
    { tag: 'volts across R₂', lab: 'meter', scenario: 'volts', read: (c) => ({ V: [c.value, 4.4974], ideal: [c.vTrue, 4.4997] }) },
    {
      tag: 'a voltmeter on megohm resistors',
      lab: 'meter',
      scenario: 'volts',
      setup(s) {
        s.R1 = 1e6;
        s.R2 = 1e6;
      },
      read: (c) => ({ V: [c.value, 4.286] }),
    },
  ],
  s4: [
    { tag: 'breaking the circuit for amps', lab: 'meter', scenario: 'amps', read: (c) => ({ I: [c.value * 1000, 0.45] }) },
    { tag: 'amps across the battery', lab: 'meter', scenario: 'fuse', read: (c) => ({ I: [c.fuseI, 4.5] }) },
  ],
  s5: [
    { tag: 'ohms across R₂', lab: 'meter', scenario: 'ohms', read: (c) => ({ R: [c.value, 10000] }) },
  ],
  s6: [
    { tag: 'five LEDs on a power bank', lab: 'usb-rail', scenario: 'leds', read: (c) => ({ I: [c.I, 0.1009], V: [c.Vrail, 5.047], h: [c.hours, 61] }) },
    { tag: 'a motor on a thin cable', lab: 'usb-rail', scenario: 'motor', read: (c) => ({ I: [c.I, 0.923], V: [c.Vrail, 4.615], drop: [c.cableDrop, 0.393] }) },
    {
      tag: 'a thicker cable',
      lab: 'usb-rail',
      scenario: 'motor',
      setup(s) {
        s.awg = 22;
      },
      read: (c) => ({ I: [c.I, 0.98], V: [c.Vrail, 4.898] }),
    },
  ],
};
