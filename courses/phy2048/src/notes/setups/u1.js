/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s5: [
    {
      tag: 'a 3–4–5 pair',
      lab: 'vectors',
      scenario: 'right',
      read: (c) => ({ magSum: [c.magSum, 5] }),
    },
  ],
  s6: [
    {
      tag: 'at an obtuse angle',
      lab: 'vectors',
      scenario: 'obtuse',
      read: (c) => ({ dot: [c.dot, -10], cross: [c.cross, 11] }),
    },
    {
      tag: 'the area of a parallelogram',
      lab: 'vectors',
      scenario: 'acute',
      read: (c) => ({ area: [c.area, 10], dot: [c.dot, 11] }),
    },
  ],
  s7: [
    {
      tag: 'a ball tossed up from a bridge',
      lab: 'kinematics-graphs',
      scenario: 'toss',
      read: (c) => ({ vInst: [c.vInst, 4.89], vAvg: [c.vAvg, -0.015], displacement: [c.displacement, -88.38] }),
    },
    {
      tag: 'the chord shrinks to the tangent',
      lab: 'kinematics-graphs',
      scenario: 'toss',
      setup(s) {
        s.dt = 0.1;
      },
      read: (c) => ({ vAvg: [c.vAvg, 4.3995], vInst: [c.vInst, 4.89] }),
    },
  ],
  s8: [
    {
      tag: 'a train that speeds up and brakes',
      lab: 'kinematics-graphs',
      scenario: 'train',
      read: (c) => ({ v1: [c.v1, 3], displacement: [c.displacement, 13.5] }),
    },
  ],
  s9: [
    {
      tag: 'braking on dry concrete',
      lab: 'stopping-distance',
      scenario: 'dry',
      read: (c) => ({ total: [c.total, 79.2857], braking: [c.braking, 64.2857], reaction: [c.reaction, 15] }),
    },
    {
      tag: 'braking on wet concrete',
      lab: 'stopping-distance',
      scenario: 'wet',
      read: (c) => ({ total: [c.total, 105], braking: [c.braking, 90] }),
    },
  ],
  s10: [
    {
      tag: 'the ball at the top of its flight',
      lab: 'kinematics-graphs',
      scenario: 'toss',
      setup(s) {
        s.t0 = 1.5;
      },
      read: (c) => ({ aNow: [c.aNow, -9.81], turn: [c.turns[0], 1.5] }),
    },
  ],
  s11: [
    {
      tag: 'out, back, and out again',
      lab: 'kinematics-graphs',
      scenario: 'outback',
      read: (c) => ({ displacement: [c.displacement, 9], distance: [c.distance, 15] }),
    },
  ],
};
