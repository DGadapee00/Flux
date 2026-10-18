/** Unit 5 worked examples the labs can show. See ../setups.js. */
export default {
  s2: [
    {
      tag: 'mid stroke',
      lab: 'slider-crank',
      scenario: 'mid',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 90;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ x: [c.x, 0.8 * Math.sqrt(0.9375)], v: [c.v, -2] }),
    },
    {
      tag: 'fully extended',
      lab: 'slider-crank',
      scenario: 'extended',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 0;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ x: [c.x, 1], v: [c.v, 0] }),
    },
    {
      tag: 'at 45°',
      lab: 'slider-crank',
      scenario: 'mid',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 45;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ x: [c.x, 0.929], v: [c.v, -1.67] }),
    },
  ],
  s4: [
    {
      tag: 'a sliding ladder',
      lab: 'ic',
      scenario: 'ladder',
      setup(s) {
        s.length = 4;
        s.theta = 60;
        s.foot = 2;
      },
      read: (c) => ({ omega: [c.omega, 1 / Math.sqrt(3)], speed: [c.speed, 2 / Math.sqrt(3)] }),
    },
    {
      tag: 'a shallower ladder',
      lab: 'ic',
      scenario: 'shallow',
      setup(s) {
        s.length = 4;
        s.theta = 30;
        s.foot = 2;
      },
      read: (c) => ({ omega: [c.omega, 1], speed: [c.speed, 2 * Math.sqrt(3)] }),
    },
    {
      tag: 'the contact point',
      lab: 'ic',
      scenario: 'wheel',
      setup(s) {
        s.radius = 0.4;
        s.speed = 2;
      },
      read: (c) => ({ omega: [c.omega, -5], speed: [c.speed, 4] }),
    },
    {
      tag: 'a four-bar',
      lab: 'ic',
      scenario: 'linkage',
      setup(s) {
        s.linkTheta = 60;
        s.linkOmega = 2;
      },
      read: (c) => ({ omega: [c.omega, -0.516], speed: [c.speed, 1.17], icx: [c.icx, 2.44], icy: [c.icy, 4.22] }),
    },
  ],
  s5: [
    {
      tag: 'the outer dead centre',
      lab: 'slider-crank',
      scenario: 'extended',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 0;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ a: [c.a, -25], v: [c.v, 0] }),
    },
    {
      tag: 'the inner dead centre',
      lab: 'slider-crank',
      scenario: 'folded',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 180;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ a: [c.a, 15], v: [c.v, 0] }),
    },
    {
      tag: 'the slider at 45°',
      lab: 'slider-crank',
      scenario: 'mid',
      setup(s) {
        s.r = 0.2;
        s.l = 0.8;
        s.theta = 45;
        s.omega = 10;
        s.alpha = 0;
      },
      read: (c) => ({ a: [c.a, -14.2] }),
    },
  ],
  s6: [
    {
      tag: 'the contact point',
      lab: 'rolling',
      scenario: 'contact',
      setup(s) {
        s.radius = 0.4;
        s.speed = 2;
        s.phi = 0;
      },
      read: (c) => ({ speed: [c.speed, 0], aMag: [c.aMag, 10] }),
    },
    {
      tag: 'the top point',
      lab: 'rolling',
      scenario: 'top',
      setup(s) {
        s.radius = 0.4;
        s.speed = 2;
        s.phi = 180;
      },
      read: (c) => ({ speed: [c.speed, 4], aMag: [c.aMag, 10] }),
    },
    {
      tag: 'a side point',
      lab: 'rolling',
      scenario: 'side',
      setup(s) {
        s.radius = 0.4;
        s.speed = 2;
        s.phi = 90;
      },
      read: (c) => ({ speed: [c.speed, 2 * Math.SQRT2], aMag: [c.aMag, 10] }),
    },
  ],
};
