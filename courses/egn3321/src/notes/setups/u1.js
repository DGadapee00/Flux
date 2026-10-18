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
};
