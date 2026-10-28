/** Unit 1 worked examples the labs can show. See ../setups.js. */
export default {
  s2: [
    {
      tag: 'a reversal',
      lab: 'rectilinear',
      scenario: 'brake',
      setup(s) {
        s.s0 = 0;
        s.v0 = 4;
        s.pieces = [{ t0: 0, t1: 5, coeff: [-2] }];
        s.t = 5;
        s.tEnd = 5;
      },
      read: (c) => ({ s: [c.s, -5], v: [c.v, -6], distance: [c.distance, 13] }),
    },
  ],
  s3: [
    {
      tag: 'three steps',
      lab: 'rectilinear',
      scenario: 'two',
      setup(s) {
        s.s0 = 0;
        s.v0 = 0;
        s.pieces = [
          { t0: 0, t1: 3, coeff: [2] },
          { t0: 3, t1: 5, coeff: [-1] },
          { t0: 5, t1: 6, coeff: [0] },
        ];
        s.t = 6;
        s.tEnd = 6;
      },
      read: (c) => ({ s: [c.s, 23], v: [c.v, 4] }),
    },
    {
      tag: 'a ramp in acceleration',
      lab: 'rectilinear',
      scenario: 'ramp',
      setup(s) {
        s.t = 2;
      },
      read: (c) => ({ s: [c.s, 6.67], v: [c.v, 5], a: [c.a, 2] }),
    },
  ],
  s5: [
    {
      tag: 'a parabola',
      lab: 'path-nt',
      scenario: 'parabola',
      setup(s) {
        s.shape = 'parabola';
        s.c = 1;
        s.x = 2;
        s.speed = 3;
        s.at = 0;
      },
      read: (c) => ({ rho: [c.rho, 11.18], an: [c.an, 0.805] }),
    },
    {
      tag: 'speeding up through a bend',
      lab: 'path-nt',
      scenario: 'turn',
      setup(s) {
        s.shape = 'parabola';
        s.c = 0.8;
        s.x = 1.2;
        s.speed = 4;
        s.at = 1.5;
      },
      read: (c) => ({ rho: [c.rho, 3.33], an: [c.an, 4.81], magA: [c.magA, 5.03] }),
    },
  ],
  s6: [
    { tag: 'a collar on a turning arm', lab: 'polar', scenario: 'arm', read: (c) => ({ v: [c.v, Math.hypot(0.3, 1.1)], ar: [c.ar, -2.2], ath: [c.ath, 1.2] }) },
    {
      tag: 'laws in time',
      lab: 'polar',
      scenario: 'arm',
      setup(s) {
        Object.assign(s, { r0: 0, u: 0, ad: 1, w: 0, al: 1, t: 2, tEnd: 2.5 });
      },
      read: (c) => ({ v: [c.v, Math.hypot(2, 4)], ar: [c.ar, -7], ath: [c.ath, 10], a: [c.a, Math.hypot(7, 10)] }),
    },
    { tag: 'a cam follower', lab: 'polar', scenario: 'cam', read: (c) => ({ r: [c.r, 0.35], rd: [c.rd, -0.188], rdd: [c.rdd, -0.448], ar: [c.ar, -3.6], ath: [c.ath, -1.128] }) },
    {
      tag: 'a radar gun',
      lab: 'polar',
      scenario: 'radar',
      setup(s) {
        Object.assign(s, { d: 10, u: 20, x0: -10 / Math.tan(Math.PI / 6), t: 0, tEnd: 2 });
      },
      read: (c) => ({ r: [c.r, 20], rd: [c.rd, -17.32], thd: [Math.abs(c.thd), 0.5], rdd: [c.rdd, 5] }),
    },
    {
      tag: 'the closest point',
      lab: 'polar',
      scenario: 'radar',
      setup(s) {
        s.t = 4;
      },
      read: (c) => ({ thd: [Math.abs(c.thd), 0.625], rdd: [c.rdd, 15.625] }),
    },
    {
      tag: 'a circle in polar',
      lab: 'polar',
      scenario: 'arm',
      setup(s) {
        Object.assign(s, { r0: 0.8, u: 0, ad: 0, w: 3, al: 0, t: 0 });
      },
      read: (c) => ({ v: [c.v, 2.4], ar: [c.ar, -7.2] }),
    },
  ],
  s7: [
    {
      tag: 'two velocities',
      lab: 'relative',
      scenario: 'cross',
      setup(s) {
        s.vax = 3;
        s.vay = 1;
        s.vbx = 1;
        s.vby = 4;
        s.aax = 0;
        s.aay = 0;
        s.abx = 0;
        s.aby = 0;
      },
      read: (c) => ({ vx: [c.vx, -2], vy: [c.vy, 3], speed: [c.speed, 3.61] }),
    },
  ],
  s8: [
    { tag: 'a metro train', lab: 'train', scenario: 'metro', read: (c) => ({ vTop: [c.vTop, 22], s1: [c.s1, 220], brake: [c.sBrake, 302.5], total: [c.total, 522.5] }) },
    {
      tag: 'tractive force on a grade',
      lab: 'train',
      scenario: 'metro',
      setup(s) {
        s.a1 = 0.16 - 9.81 * 0.01;
        s.t1 = 18 / (0.16 - 9.81 * 0.01);
        s.t = s.t1;
      },
      read: (c) => ({ vTop: [c.vTop, 18], s1: [c.s1, 2617] }),
    },
    { tag: 'the same speed, a gentler start', lab: 'train', scenario: 'gentle', read: (c) => ({ vTop: [c.vTop, 22], total: [c.total, 742.5] }) },
    { tag: 'a short yard hop', lab: 'train', scenario: 'yard', read: (c) => ({ vTop: [c.vTop, 5], total: [c.total, 50] }) },
  ],
};
