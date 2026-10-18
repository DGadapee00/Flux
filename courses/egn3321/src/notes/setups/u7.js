/** Unit 7 worked examples the labs can show. See ../setups.js. */
export default {
  s1: [
    {
      tag: 'the same drop',
      lab: 'race',
      scenario: 'even',
      setup(s) {
        s.mass = 2;
        s.radius = 0.18;
        s.theta = 30;
        s.distance = 2;
      },
      read: (c) => ({
        sphere: [c.sphere, Math.sqrt((2 * 9.81 * 2 * Math.sin(Math.PI / 6)) / (7 / 5))],
        disk: [c.disk, Math.sqrt((2 * 9.81 * 2 * Math.sin(Math.PI / 6)) / (3 / 2))],
        hoop: [c.hoop, Math.sqrt(9.81)],
        energy: [c.energy, 2 * 9.81 * 2 * 0.5],
      }),
    },
  ],
  s2: [
    {
      tag: 'a bar released from horizontal',
      lab: 'linkage',
      scenario: 'bar',
      setup(s) {
        s.mass = 4;
        s.length = 2;
        s.theta1 = 90;
        s.theta2 = 0;
        s.kappa = 0;
        s.restDeg = 0;
      },
      read: (c) => ({
        omega: [c.omega, Math.sqrt((3 * 9.81) / 2)],
        vG: [c.vG, Math.sqrt((3 * 9.81) / 2)],
      }),
    },
    {
      tag: 'a torsional spring',
      lab: 'linkage',
      scenario: 'couple',
      setup(s) {
        s.mass = 4;
        s.length = 2;
        s.theta1 = 90;
        s.theta2 = 0;
        s.kappa = 15;
        s.restDeg = 0;
      },
      read: (c) => ({
        omega: [c.omega, Math.sqrt(2 * (4 * 9.81 + 0.5 * 15 * (Math.PI / 2) ** 2) / (4 * 4 / 3))],
        work: [c.work, 0.5 * 15 * (Math.PI / 2) ** 2],
      }),
    },
  ],
  s3: [
    {
      tag: 'a sphere finishes first',
      lab: 'race',
      scenario: 'even',
      setup(s) {
        s.mass = 2;
        s.radius = 0.18;
        s.theta = 30;
        s.distance = 2;
      },
      read: (c) => {
        const g = 9.81;
        const distance = 2;
        const sin = Math.sin(Math.PI / 6);
        const time = (k) => Math.sqrt((2 * distance) / ((g * sin) / (1 + k)));
        return {
          tSphere: [c.tSphere, time(2 / 5)],
          tDisk: [c.tDisk, time(1 / 2)],
          tHoop: [c.tHoop, time(1)],
        };
      },
    },
  ],
  s4: [
    {
      tag: 'a rod in two slots',
      lab: 'linkage',
      scenario: 'slots',
      setup(s) {
        s.mass = 3;
        s.length = 1.5;
        s.theta1 = 60;
        s.theta2 = 30;
        s.k = 0;
        s.springRest = 'zero';
      },
      read: (c) => {
        const omega = Math.sqrt((3 * 9.81 / 1.5) * (Math.sin((60 * Math.PI) / 180) - Math.sin((30 * Math.PI) / 180)));
        return {
          omega: [c.omega, omega],
          vG: [c.vG, omega * (1.5 / 2)],
        };
      },
    },
    {
      tag: 'a spring at the foot',
      lab: 'linkage',
      scenario: 'spring',
      setup(s) {
        s.mass = 3;
        s.length = 1.5;
        s.theta1 = 60;
        s.theta2 = 30;
        s.k = 40;
        s.springRest = 'length';
      },
      read: (c) => {
        const m = 3;
        const L = 1.5;
        const k = 40;
        const g = 9.81;
        const V = (deg) => {
          const th = (deg * Math.PI) / 180;
          return m * g * (L / 2) * Math.sin(th) + 0.5 * k * (L * Math.cos(th) - L) ** 2;
        };
        const drop = V(60) - V(30);
        const omega = Math.sqrt((2 * drop) / ((m * L * L) / 3));
        return { omega: [c.omega, omega], T: [c.T, drop] };
      },
    },
  ],
  s6: [
    { tag: 'a squat lander', lab: 'tipover', scenario: 'lander', read: (c) => ({ dh: [c.dh, 1.0], IO: [c.IO, 5100], omegaC: [c.omegaC, 1.52], tilt: [c.thetaMaxDeg, 13.8] }) },
    {
      tag: 'a harder gust',
      lab: 'tipover',
      scenario: 'lander',
      setup(s) {
        s.w0 = 1.6;
      },
      read: (c) => ({ T0: [c.T0, 6530], wTop: [c.wTop, 0.502] }),
    },
    { tag: 'a tall vehicle on narrow legs', lab: 'tipover', scenario: 'tall', read: (c) => ({ r: [c.r, 4.27], dh: [c.dh, 0.272], omegaC: [c.omegaC, 0.467], T0: [c.T0, 3680], barrier: [c.barrier, 3200] }) },
    { tag: 'spreading the legs', lab: 'tipover', scenario: 'wide', read: (c) => ({ omegaC: [c.omegaC, 0.792], tilt: [c.thetaMaxDeg, 8.5] }) },
    {
      tag: 'a uniform box',
      lab: 'tipover',
      scenario: 'lander',
      setup(s) {
        s.kG = Math.sqrt(25 / 12);
      },
      read: (c) => ({ IOm: [c.IOm, 8.333], omegaC: [c.omegaC, 1.53] }),
    },
  ],
};
