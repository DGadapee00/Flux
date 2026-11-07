/** Unit 6 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a linear valve on a long pipe', lab: 'valve', scenario: 'long', read: (c) => ({ auth: [c.auth, 0.25], share: [c.share * 100, 77] }) }],
  s2: [{ tag: 'a shared return', lab: 'board', scenario: 'shared', read: (c) => ({ R: [c.Rtrace * 1000, 57.6], mV: [c.error * 1000, 115], counts: [c.counts, 143] }) }],
  s3: [{ tag: 'half the stall torque', lab: 'motor', scenario: 'half', read: (c) => ({ i: [c.i, 3], rpm: [c.rpm, 2865], P: [c.Pout, 18], eff: [c.eff * 100, 50] }) }],
  s4: [{ tag: '20 kHz against 200 Hz', lab: 'pwm', scenario: 'fast', read: (c) => ({ mean: [c.meanI, 3], ripple: [c.ripple, 0.15] }) }],
  s5: [{ tag: 'a step with no capacitor near', lab: 'decoupling', scenario: 'none', read: (c) => ({ est: [c.estimate * 1000, 500], dip: [c.dip * 1000, 466] }) }],
};
