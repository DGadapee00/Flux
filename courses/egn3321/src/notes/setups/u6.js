/** Unit 6 worked examples the labs can show. See ../setups.js. */
export default {
  s1: [
    {
      tag: 'a rod about its end',
      lab: 'inertia',
      scenario: 'rod',
      setup(s) {
        s.mass = 6;
        s.length = 2;
        s.offset = 1;
      },
      read: (c) => ({ center: [c.center, 2], end: [c.end, 8] }),
    },
    {
      tag: 'the same mass and radius',
      lab: 'inertia',
      scenario: 'spread',
      setup(s) {
        s.mass = 2;
        s.radius = 0.5;
      },
      read: (c) => ({ hoop: [c.hoop, 0.5], disk: [c.disk, 0.25], sphere: [c.sphere, 0.2] }),
    },
  ],
  s2: [
    {
      tag: 'a plate and a disk',
      lab: 'inertia',
      scenario: 'composite',
      setup(s) {
        s.plateM = 5;
        s.plateW = 0.6;
        s.plateH = 0.4;
        s.diskM = 2;
        s.diskR = 0.1;
        s.diskX = 0.2;
        s.axisX = 0;
      },
      read: (c) => ({ I: [c.I, 5 * (0.36 + 0.16) / 12 + 0.01 + 0.08] }),
    },
  ],
  s4: [
    {
      tag: 'a horizontal bar',
      lab: 'pendulum',
      scenario: 'bar',
      setup(s) {
        s.mass = 4;
        s.length = 2;
        s.theta = 90;
        s.omega = 0;
      },
      read: (c) => ({ pin: [c.pin, 9.81], alpha: [c.alpha, (3 * 9.81) / 4], ratio: [c.ratio, 0.25] }),
    },
    {
      tag: 'a hanging bar',
      lab: 'pendulum',
      scenario: 'hanging',
      setup(s) {
        s.mass = 4;
        s.length = 2;
        s.theta = 0;
        s.omega = 0;
      },
      read: (c) => ({ pin: [c.pin, 4 * 9.81], alpha: [c.alpha, 0] }),
    },
    {
      tag: 'swinging through the bottom',
      lab: 'pendulum',
      scenario: 'hanging',
      setup(s) {
        s.mass = 4;
        s.length = 2;
        s.theta = 0;
        s.omega = Math.sqrt((3 * 9.81) / 2);
      },
      read: (c) => ({ pin: [c.pin, 98.1], alpha: [c.alpha, 0] }),
    },
    {
      tag: 'a square plate',
      lab: 'pendulum',
      scenario: 'plate',
      setup(s) {
        s.mass = 2;
        s.side = 0.4;
      },
      read: (c) => ({
        Ox: [c.Ox, 2 * 9.81 * 3 / 8],
        Oy: [c.Oy, 2 * 9.81 * 5 / 8],
        alpha: [c.alpha, (3 * 9.81 * 0.4) / (2 * 0.32)],
      }),
    },
  ],
  s5: [
    {
      tag: 'a disk that rolls',
      lab: 'roll-slip',
      scenario: 'disk',
      setup(s) {
        s.mass = 2;
        s.radius = 0.25;
        s.theta = 30;
        s.mu = 0.3;
        s.shape = 'disk';
      },
      read: (c) => ({ a: [c.a, 9.81 / 3], f: [c.f, 9.81 / 3] }),
    },
    {
      tag: 'a hoop that slips',
      lab: 'roll-slip',
      scenario: 'hoop',
      setup(s) {
        s.mass = 2;
        s.radius = 0.25;
        s.theta = 30;
        s.mu = 0.15;
        s.shape = 'hoop';
      },
      read: (c) => ({
        a: [c.a, 9.81 * (0.5 - 0.15 * Math.cos(Math.PI / 6))],
        f: [c.f, 0.15 * 2 * 9.81 * Math.cos(Math.PI / 6)],
      }),
    },
    {
      tag: 'a sphere that rolls',
      lab: 'roll-slip',
      scenario: 'sphere',
      setup(s) {
        s.mass = 2;
        s.radius = 0.25;
        s.theta = 30;
        s.mu = 0.3;
        s.shape = 'sphere';
      },
      read: (c) => ({ a: [c.a, (5 / 7) * 9.81 * 0.5], f: [c.f, (9.81 * 2) / 7] }),
    },
  ],
  s6: [
    {
      tag: 'a small turbopump',
      lab: 'spinup',
      scenario: 'pump',
      read: (c) => ({ I: [c.I, 9.1e-5], alpha0: [c.alpha0, 5270], wInf: [c.wInfRpm, 50600], t: [c.tRated, 1.08] }),
    },
    {
      tag: 'bearing friction only',
      lab: 'spinup',
      scenario: 'pump',
      setup(s) {
        s.Mr = 0;
      },
      read: (c) => ({ alpha0: [c.alpha0, 5270], t: [c.tRated, 0.794] }),
    },
    { tag: 'twice the impeller mass', lab: 'spinup', scenario: 'heavy', read: (c) => ({ I: [c.I, 1.81e-4], alpha0: [c.alpha0, 2650], wInf: [c.wInfRpm, 50600], t: [c.tRated, 2.14] }) },
    { tag: 'a weak starter', lab: 'spinup', scenario: 'weak', read: (c) => ({ wInf: [c.wInfRpm, 42000], t: [c.tRated, 2.26] }) },
  ],
};
