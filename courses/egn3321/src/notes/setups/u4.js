/** Impulse and momentum (id u4, Unit 3) worked examples the labs can show. See ../setups.js. */
export default {
  s1: [
    {
      tag: 'equal areas',
      lab: 'impulse',
      scenario: 'pair',
      setup(s) {
        s.mass = 2;
        s.v0 = 0;
        s.f1 = 100;
        s.s1 = 0;
        s.t1 = 0.4;
        s.f2 = 40;
        s.t2 = 1;
      },
      read: (c) => ({ j1: [c.j1, 40], j2: [c.j2, 40], dv: [c.dv, 40], v: [c.v, 40] }),
    },
    {
      tag: 'a short pulse',
      lab: 'impulse',
      scenario: 'short',
      setup(s) {
        s.mass = 2;
        s.v0 = 0;
        s.f1 = 400;
        s.s1 = 0;
        s.t1 = 0.1;
        s.f2 = 20;
        s.t2 = 1;
      },
      read: (c) => ({ j1: [c.j1, 40], j2: [c.j2, 20], dv: [c.dv, 30], v: [c.v, 30] }),
    },
  ],
  s3: [
    {
      tag: 'a direct collision',
      lab: 'impact',
      scenario: 'central',
      setup(s) {
        s.m1 = 1;
        s.m2 = 1;
        s.u1 = 4;
        s.u2 = 0;
        s.e = 0.5;
        s.theta = 0;
      },
      read: (c) => ({ vn1: [c.vn1, 1], vn2: [c.vn2, 3], loss: [c.loss, 3] }),
    },
    {
      tag: 'they stick',
      lab: 'impact',
      scenario: 'stick',
      setup(s) {
        s.m1 = 1;
        s.m2 = 3;
        s.u1 = 8;
        s.u2 = 0;
        s.e = 0;
        s.theta = 0;
      },
      read: (c) => ({ vn1: [c.vn1, 2], vn2: [c.vn2, 2], loss: [c.loss, 24] }),
    },
    {
      tag: 'a head-on meeting',
      lab: 'impact',
      scenario: 'central',
      setup(s) {
        s.m1 = 2;
        s.m2 = 1;
        s.u1 = 3;
        s.u2 = -1;
        s.e = 0.8;
        s.theta = 0;
      },
      read: (c) => ({ vn1: [c.vn1, 0.6], vn2: [c.vn2, 3.8], loss: [c.loss, 1.92] }),
    },
  ],
  s4: [
    {
      tag: 'the tangent is unchanged',
      lab: 'impact',
      scenario: 'oblique',
      setup(s) {
        s.m1 = 2;
        s.m2 = 2;
        s.u1 = 4;
        s.u2 = 0;
        s.e = 1;
        s.theta = 30;
      },
      read: (c) => ({
        vt1: [c.vt1, 2],
        vn1: [c.vn1, 0],
        vn2: [c.vn2, 4 * Math.cos(30 * Math.PI / 180)],
        loss: [c.loss, 0],
      }),
    },
  ],
  s6: [
    {
      tag: 'a coasting burn',
      lab: 'rocket',
      scenario: 'coast',
      setup(s) {
        s.m0 = 200;
        s.mf = 80;
        s.ve = 1500;
        s.mdot = 40;
        s.g = 0;
      },
      read: (c) => ({
        dv: [c.dv, 1500 * Math.log(2.5)],
        burned: [c.burned, 120],
        ratio: [c.ratio, 2.5],
      }),
    },
    {
      tag: 'the same mass burned',
      lab: 'rocket',
      scenario: 'heavy',
      setup(s) {
        s.m0 = 400;
        s.mf = 280;
        s.ve = 1500;
        s.mdot = 40;
        s.g = 0;
      },
      read: (c) => ({
        dv: [c.dv, 1500 * Math.log(400 / 280)],
        burned: [c.burned, 120],
        ratio: [c.ratio, 400 / 280],
      }),
    },
    {
      tag: 'gravity during the burn',
      lab: 'rocket',
      scenario: 'gravity',
      setup(s) {
        s.m0 = 200;
        s.mf = 80;
        s.ve = 1500;
        s.mdot = 40;
        s.g = 9.81;
      },
      read: (c) => ({ dv: [c.dv, 1500 * Math.log(2.5) - 9.81 * 3] }),
    },
  ],
  s7: [
    {
      tag: 'the CPSC drop',
      lab: 'helmet',
      scenario: 'cpsc',
      setup(s) {
        Object.assign(s, { m: 5, h: 1.96, tau: 6, e: 0.1, shape: 'half-sine' });
      },
      read: (c) => ({ v0: [c.v0, 6.20], J: [c.J, 34.4], gMean: [c.gMean, 117], gPeak: [c.gPeak, 184] }),
    },
    {
      tag: 'no helmet',
      lab: 'helmet',
      scenario: 'bare',
      setup(s) {
        Object.assign(s, { m: 5, h: 1.96, tau: 1, e: 0.5, shape: 'half-sine' });
      },
      read: (c) => ({ J: [c.J, 46.6], gPeak: [c.gPeak, 1490] }),
    },
    {
      tag: 'an ideal liner',
      lab: 'helmet',
      scenario: 'ideal',
      setup(s) {
        Object.assign(s, { m: 5, h: 1.96, tau: 6, e: 0.1, shape: 'square' });
      },
      read: (c) => ({ J: [c.J, 34.4], gPeak: [c.gPeak, 117], crush: [c.crush * 1000, 16.9] }),
    },
    {
      tag: 'the shortest pulse that passes',
      lab: 'helmet',
      scenario: 'cpsc',
      setup(s) {
        Object.assign(s, { m: 5, h: 1.96, tau: 6, e: 0.1, shape: 'half-sine' });
      },
      read: (c) => ({ tauMin: [c.tauMin, 3.66] }),
    },
  ],
};
