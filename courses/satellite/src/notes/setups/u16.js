/** Unit 16 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  margin: [
    { tag: 'a CubeSat panel', lab: 'hinge', scenario: 'panel', read: (c) => ({ 'spring at the end (mN·m)': [c.avail * 1000, 15.7], 'torque margin': [c.tm, 0.75] }) },
    { tag: 'less preload', lab: 'hinge', scenario: 'weak', read: (c) => ({ 'spring at the end (mN·m)': [c.avail * 1000, 5.2], 'time to latch (s)': [c.seconds, 0.91], 'torque margin': [c.tm, -0.42] }) },
    { tag: 'after testing', lab: 'hinge', scenario: 'tested', read: (c) => ({ 'torque margin': [c.tm, 1.62] }) },
  ],
  motion: [
    { tag: 'the panel’s latch', lab: 'hinge', scenario: 'panel', read: (c) => ({ 'time to latch (s)': [c.seconds, 0.7], 'speed (°/s)': [c.latchDegS, 230], 'energy (mJ)': [c.energyMJ, 32] }) },
    { tag: 'twice the spring', lab: 'hinge', scenario: 'stiff', read: (c) => ({ 'torque margin': [c.tm, 2.49], 'time to latch (s)': [c.seconds, 0.48], 'energy (mJ)': [c.energyMJ, 69] }) },
  ],
};
