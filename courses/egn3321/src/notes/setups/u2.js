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
    { tag: 'a table-top Atwood', lab: 'pulleys', scenario: 'single', read: (c) => ({ aB: [c.aB, 3.27], T: [c.T, 13.08] }) },
    {
      tag: 'a movable pulley',
      lab: 'pulleys',
      scenario: 'single',
      setup(s) {
        s.n = 2;
      },
      read: (c) => ({ aB: [c.aB, 1.09], aA: [c.aA, 2.18], T: [c.T, 8.72], up: [c.n * c.T, 17.44] }),
    },
    { tag: 'with friction', lab: 'pulleys', scenario: 'movable', read: (c) => ({ f: [c.f, 7.848], aB: [c.aB, 1.962], T: [c.T, 23.54] }) },
    {
      tag: 'the same drop by energy',
      lab: 'pulleys',
      scenario: 'movable',
      setup(s) {
        s.t = Math.sqrt(1 / 1.962);
      },
      read: (c) => ({ sB: [c.sB, 0.5], vB: [c.vB, 1.401], check: [c.vCheck, 1.401] }),
    },
    {
      tag: 'a load the block can hold',
      lab: 'pulleys',
      scenario: 'heavy',
      read: (c) => ({ aB: [c.aB, 2.146] }),
    },
  ],
  s5: [
    { tag: 'one coffee filter', lab: 'drag', scenario: 'filters', read: (c) => ({ k: [c.k, 0.008085], vt: [c.vt, 1.102], t95: [c.t95, 0.2057] }) },
    {
      tag: 'four filters nested',
      lab: 'drag',
      scenario: 'filters',
      setup(s) {
        s.m = 0.004;
      },
      read: (c) => ({ vt: [c.vt, 2.203] }),
    },
    { tag: 'a skydiver', lab: 'drag', scenario: 'skydiver', read: (c) => ({ vt: [c.vt, 50.62], v: [c.v, 37.88], a: [c.a, 4.318], t90: [c.t90, 7.597] }) },
    { tag: 'a baseball', lab: 'drag', scenario: 'ball', read: (c) => ({ vt: [c.vt, 39.35], v: [c.v, 9.612] }) },
  ],
  s6: [
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
  s7: [
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
  s8: [
    {
      tag: 'a cord drawing a collar in',
      lab: 'polar',
      scenario: 'arm',
      setup(s) {
        Object.assign(s, { r0: 0.5, u: -1, ad: 0, w: 4, al: 0, t: 0, tEnd: 0.4 });
      },
      read: (c) => ({ ar: [c.ar, -8], ath: [c.ath, -8] }),
    },
    {
      tag: 'letting out on a speeding arm',
      lab: 'polar',
      scenario: 'arm',
      setup(s) {
        Object.assign(s, { r0: 0.8, u: 0.5, ad: 0, w: 3, al: 2, t: 0, tEnd: 1 });
      },
      read: (c) => ({ T: [-2 * c.ar, 14.4], N: [2 * c.ath, 9.2] }),
    },
    {
      tag: 'a free bead',
      lab: 'polar',
      scenario: 'arm',
      setup(s) {
        Object.assign(s, { r0: 0.3, u: 0, ad: 7.5, w: 5, al: 0, t: 0, tEnd: 0.5 });
      },
      read: (c) => ({ rdd: [c.rdd, 7.5], ar: [c.ar + 1, 1] }),
    },
  ],
  s10: [
    { tag: 'a 60 mph rural highway', lab: 'highway', scenario: 'r60', read: (c) => ({ R: [c.Rdesign, 1200], Rm: [c.Rm, 365.76], vLim: [c.vLimMph, 60.21] }) },
    { tag: 'an interstate at 70 mph', lab: 'highway', scenario: 'r70', read: (c) => ({ R: [c.Rdesign, 1815] }) },
    { tag: 'a gentler bank at 50 mph', lab: 'highway', scenario: 'r50', read: (c) => ({ R: [c.Rdesign, 925.9] }) },
    {
      tag: 'the same curve, half the bank',
      lab: 'highway',
      scenario: 'r60',
      setup(s) {
        s.Rfix = 1200;
        s.e = 0.04;
      },
      read: (c) => ({ need: [c.need, 0.1592] }),
    },
    {
      tag: 'a driver over the limit',
      lab: 'highway',
      scenario: 'r60',
      setup(s) {
        s.drive = 75;
      },
      read: (c) => ({ need: [c.need, 0.2276] }),
    },
  ],
};
