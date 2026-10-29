/** Unit 8 worked examples the labs can show. See ../setups.js. */
const MPH = 0.44704;

export default {
  s1: [
    {
      tag: 'a swinging bar',
      lab: 'strike',
      scenario: 'pinned',
      setup(s) {
        s.t = 0.05;
      },
      read: (c) => ({ w: [c.w, 7 / 3], HO: [c.IO * c.w, 3.36], vG: [c.vG, 1.4] }),
    },
  ],
  s3: [
    {
      tag: 'pulling in two weights',
      lab: 'spin',
      scenario: 'skater',
      setup(s) {
        s.r = 0.4;
      },
      read: (c) => ({ I1: [c.I1, 4.56], H: [c.H, 13.68], I2: [c.I2, 2.64], w2: [c.w2, 5.182], T1: [c.T1, 20.52], T2: [c.T2, 35.44], work: [c.work, 14.92] }),
    },
    { tag: 'an office chair', lab: 'spin', scenario: 'chair', read: (c) => ({ I1: [c.I1, 5.94], I2: [c.I2, 3.135], w2: [c.w2, 3.789] }) },
    {
      tag: 'masses on a light rod',
      lab: 'spin',
      scenario: 'masses',
      setup(s) {
        s.r = 0.4;
      },
      read: (c) => ({ w2: [c.w2, 8], ratioT: [c.ratioT, 4] }),
    },
    {
      tag: 'a bullet into a hanging bar',
      lab: 'strike',
      scenario: 'pinned',
      setup(s) {
        Object.assign(s, { M: 5, L: 1.2, m: 0.03, u: 200, dFrac: 1, e: 0 });
      },
      read: (c) => ({ w: [c.w, 2.947] }),
    },
  ],
  s4: [
    { tag: 'a bar struck at its end', lab: 'strike', scenario: 'pinned', read: (c) => ({ w: [c.w, 2.333], v: [c.v, 0.4], J: [c.J, 1.4], T1: [c.T1, 3.96] }) },
    { tag: 'at the centre of percussion', lab: 'strike', scenario: 'percussion', read: (c) => ({ w: [c.w, 1.909], vG: [c.vG, 1.145], Jzero: [c.J + 1, 1] }) },
    {
      tag: 'an elastic blow',
      lab: 'strike',
      scenario: 'pinned',
      setup(s) {
        s.e = 1;
      },
      read: (c) => ({ w: [c.w, 3.333], v: [c.v, -2] }),
    },
    { tag: 'a bar on ice', lab: 'strike', scenario: 'free', read: (c) => ({ vG: [c.vG, 0.75], w: [Math.abs(c.w), 4.5] }) },
  ],
  s5: [
    { tag: 'a 90 mph pitch, squared up', lab: 'bat', scenario: 'wood', read: (c) => ({ I: [c.I, 0.207], w1: [c.w1, 20.74], v: [c.v, 47.12], mph: [c.exitMph, 105.4], bat: [c.batMph, 68.9] }) },
    { tag: 'off the end', lab: 'bat', scenario: 'end', read: (c) => ({ mph: [c.exitMph, 104.1], J: [Math.abs(c.J), 6.288], bat: [c.batMph, 103.3] }) },
    {
      tag: 'the best contact',
      lab: 'bat',
      scenario: 'wood',
      setup(s) {
        s.dFrac = 0.8;
      },
      read: (c) => ({ mph: [c.exitMph, 106.8], J: [Math.abs(c.J), 2.55] }),
    },
    { tag: 'a heavier bat', lab: 'bat', scenario: 'heavy', read: (c) => ({ mph: [c.v / MPH, 108.4] }) },
  ],
};
