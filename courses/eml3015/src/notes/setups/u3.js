/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const nozzle = (xf) => (s) => Object.assign(s, { u0: 1, L: 0.5, CR: 4, ramp: 0, xf });

export default {
  s1: [{ tag: 'a particle leaving the nozzle', lab: 'nozzle', scenario: 'steady', setup: nozzle(1), read: (c) => ({ u: [c.u, 4], accel: [c.accel, 96] }) }],
  s2: [{ tag: 'crossing the nozzle', lab: 'nozzle', scenario: 'steady', setup: nozzle(1), read: (c) => ({ T: [c.T, 0.313] }) }],
  s3: [
    {
      tag: 'a water elbow',
      lab: 'bend',
      scenario: 'elbow',
      setup(s) {
        Object.assign(s, { fluid: 'water', V: 2, R: 0.3, w: 0.2, profile: 'vortex' });
      },
      read: (c) => ({ uIn: [c.uIn, 2.89], dp: [c.dp / 1000, 3.12] }),
    },
  ],
};
