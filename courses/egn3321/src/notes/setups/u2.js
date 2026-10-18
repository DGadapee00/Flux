/** Unit 2 worked examples the labs can show. See ../setups.js. */
export default {
  s1: [
    {
      tag: 'a heavier side',
      lab: 'fma',
      scenario: 'atwood',
      setup(s) {
        s.m1 = 2;
        s.m2 = 4;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: [c.a, 3.27], T: [c.T, 26.16] }),
    },
  ],
  s2: [
    {
      tag: 'a block that slides',
      lab: 'fma',
      scenario: 'incline',
      setup(s) {
        s.block = 3;
        s.theta = 30;
        s.mus = 0.2;
        s.muk = 0.15;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: [c.a, 3.6306436183311974], N: [c.N, 25.48712763337603] }),
    },
    {
      tag: 'a block that holds',
      lab: 'fma',
      scenario: 'incline',
      setup(s) {
        s.block = 3;
        s.theta = 10;
        s.mus = 0.2;
        s.muk = 0.15;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: [c.a, 0], f: [c.f, 5.11] }),
    },
  ],
  s3: [
    {
      tag: 'a hanging tow',
      lab: 'fma',
      scenario: 'tow',
      setup(s) {
        s.block = 4;
        s.hang = 6;
        s.theta = 30;
        s.mus = 0.3;
        s.muk = 0.2;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: [c.a, 3.2443432631099727], T: [c.T, 39.39394042134017] }),
    },
    {
      tag: 'a tow that holds',
      lab: 'fma',
      scenario: 'tow',
      setup(s) {
        s.block = 4;
        s.hang = 3;
        s.theta = 30;
        s.mus = 0.3;
        s.muk = 0.2;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: [c.a, 0], T: [c.T, 29.43] }),
    },
  ],
  s4: [
    {
      tag: 'no friction',
      lab: 'curve',
      scenario: 'bank',
      setup(s) {
        s.mass = 1200;
        s.radius = 40;
        s.theta = 20;
        s.mu = 0;
      },
      read: (c) => ({ v: [c.vDesign, 11.950812521584371] }),
    },
    {
      tag: 'a band of speeds',
      lab: 'curve',
      scenario: 'band',
      setup(s) {
        s.mass = 1000;
        s.radius = 40;
        s.theta = 20;
        s.speed = 12;
        s.mu = 0.2;
      },
      read: (c) => ({ vMax: [c.vMax, 15.4], vMin: [c.vMin, 7.74], f: [c.f, 27.7] }),
    },
  ],
  s5: [
    {
      tag: 'the top of the loop',
      lab: 'curve',
      scenario: 'loop',
      setup(s) {
        s.mass = 0.5;
        s.radius = 0.4;
        s.vb = 5;
        s.phi = 180;
      },
      read: (c) => ({ N: [c.N, 6.724999999999997], speed: [c.speed, 3.0502458917274193] }),
    },
    {
      tag: 'just enough speed',
      lab: 'curve',
      scenario: 'loop',
      setup(s) {
        s.mass = 0.5;
        s.radius = 0.4;
        s.vb = 4.43;
        s.phi = 180;
      },
      read: (c) => ({ speed: [c.speed, 1.98] }),
    },
  ],
  s7: [
    { tag: 'a student rocket', lab: 'liftoff', scenario: 'student', read: (c) => ({ T: [c.T, 392.4], a0: [c.a0, 9.81], aBo: [c.aBo, 14.7], vBo: [c.vBo, 60.4], hBo: [c.hBo, 141] }) },
    {
      tag: 'the clamps',
      lab: 'liftoff',
      scenario: 'student',
      setup(s) {
        s.m0 = 20;
        s.tw = (10 + 9.81) / 9.81;
      },
      read: (c) => ({ T: [c.T, 396.2], a0: [c.a0, 10.0] }),
    },
    { tag: 'an under-powered rocket', lab: 'liftoff', scenario: 'sits', read: (c) => ({ tLift: [c.tLift, 5], aBo: [c.aBo, 4.91], vBo: [c.vBo, 31.8], hBo: [c.hBo, 148] }) },
    { tag: 'a heavy lifter', lab: 'liftoff', scenario: 'heavy', read: (c) => ({ a0: [c.a0, 1.96], aBo: [c.aBo, 5.68], vBo: [c.vBo, 219], hBo: [c.hBo, 5465] }) },
  ],
};
