/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s3: [
    {
      tag: 'a firework at the top of its climb',
      lab: 'projectile',
      scenario: 'level',
      setup(s) {
        s.v0 = 70;
        s.theta = 75;
        s.frac = 0.5;
      },
      read: (c) => ({ hMax: [c.hMax, 233.0], tTop: [c.tTop, 6.89], xTop: [c.xTop, 124.9] }),
    },
    {
      tag: 'a rock thrown flat off a cliff',
      lab: 'projectile',
      scenario: 'cliff',
      read: (c) => ({ tFlight: [c.tFlight, 4.52], range: [c.range, 67.7], speed: [c.speed, 46.8], landAngle: [c.landAngle, 71.3] }),
    },
  ],
  s4: [
    {
      tag: 'the low golf shot',
      lab: 'projectile',
      scenario: 'level',
      setup(s) {
        s.v0 = 31.9;
        s.theta = 30;
      },
      read: (c) => ({ range: [c.range, 90.0], tFlight: [c.tFlight, 3.25], hMax: [c.hMax, 13.0] }),
    },
    {
      tag: 'the high golf shot',
      lab: 'projectile',
      scenario: 'level',
      setup(s) {
        s.v0 = 37.0;
        s.theta = 70;
      },
      read: (c) => ({ range: [c.range, 90.0], hMax: [c.hMax, 61.8], tFlight: [c.tFlight, 7.10] }),
    },
  ],
  s5: [
    {
      tag: 'a tennis ball caught in the stands',
      lab: 'projectile',
      scenario: 'level',
      setup(s) {
        s.v0 = 30;
        s.theta = 45;
        s.yLand = 10;
        s.frac = 0.9;
      },
      read: (c) => ({ tFlight: [c.tFlight, 3.79], range: [c.range, 80.3], speed: [c.speed, 26.5], landAngle: [c.landAngle, 36.9] }),
    },
    {
      tag: 'a golfer above the green',
      lab: 'projectile',
      scenario: 'height',
      setup(s) {
        s.v0 = 20;
        s.theta = 40;
      },
      read: (c) => ({ tFlight: [c.tFlight, 3.72], range: [c.range, 57.0], speed: [c.speed, 28.1], landAngle: [c.landAngle, 57.0] }),
    },
    {
      tag: 'a shot up a slope',
      lab: 'projectile',
      scenario: 'level',
      setup(s) {
        s.v0 = 20;
        s.theta = 50;
        s.slope = 20;
      },
      read: (c) => ({ tFlight: [c.tFlight, 2.17], along: [c.along, 29.7] }),
    },
  ],
  s6: [
    {
      tag: 'a jet turning at 1 g',
      lab: 'circular-motion',
      scenario: 'jet',
      read: (c) => ({ ac: [c.ac, 9.81], period: [c.period, 85.9] }),
    },
    {
      tag: 'a point on a fan blade',
      lab: 'circular-motion',
      scenario: 'roundabout',
      setup(s) {
        s.r = 0.1;
        s.v = 3.77;
      },
      read: (c) => ({ omega: [c.omega, 37.70], ac: [c.ac, 142.1], rpm: [c.rpm, 360] }),
    },
  ],
  s7: [
    {
      tag: 'total acceleration on a 2 m circle',
      lab: 'circular-motion',
      scenario: 'speeding',
      read: (c) => ({ ac: [c.ac, 3.125], a: [c.a, 3.47], angleFromV: [c.angleFromV, 64.4] }),
    },
    {
      tag: 'braking on a roundabout',
      lab: 'circular-motion',
      scenario: 'roundabout',
      setup(s) {
        s.aT = -3;
      },
      read: (c) => ({ ac: [c.ac, 5.0], a: [c.a, 5.83], angleFromV: [c.angleFromV, 121] }),
    },
  ],
  s8: [
    {
      tag: 'a car seen from a truck',
      lab: 'relative-motion',
      scenario: 'truck',
      read: (c) => ({ speed: [c.speed, 106], dirDeg: [c.dirDeg, 41.2] }),
    },
    {
      tag: 'a boat pointing across a river',
      lab: 'relative-motion',
      scenario: 'river',
      read: (c) => ({ speed: [c.speed, 5.41], crossTime: [c.crossTime, 13.3], drift: [c.drift, 40] }),
    },
  ],
  s9: [
    {
      tag: 'flying north in a northeast wind',
      lab: 'wind-triangle',
      scenario: 'book',
      read: (c) => ({ correction: [c.correction, 12.2], ground: [c.ground, 229.5] }),
    },
    {
      tag: 'aiming upstream to land straight across',
      lab: 'relative-motion',
      scenario: 'river',
      setup(s) {
        s.u = { s: 4.5, dir: 131.8 };
      },
      read: (c) => ({ crossTime: [c.crossTime, 17.9], speed: [c.speed, 3.35] }),
    },
  ],
};
