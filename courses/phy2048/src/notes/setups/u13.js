/** Unit 13 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const DEG = 180 / Math.PI;

export default {
  s1: [
    {
      tag: 'the audible range',
      lab: 'pipe-modes',
      scenario: 'stopped',
      setup: (s) => { s.temp = 30; s.end = 'closed'; s.m = 1; },
      read: (c) => ({ v: [c.v, 348.7] }),
    },
  ],
  s2: [
    {
      tag: 'the pressure wave',
      lab: 'intensity',
      scenario: 'pressure',
      read: (c) => ({
        I: [c.I, 5.04e-4],
        beta: [c.beta, 87.02],
      }),
    },
    {
      tag: 'two speakers',
      lab: 'intensity',
      scenario: 'pair',
      setup: (s) => {
        s.kind = 'sphere';
        s.radius = 2;
        s.sources = 2;
        s.power = 1e-6 * 4 * Math.PI * 4;
      },
      read: (c) => ({ beta: [c.beta, 63.01] }),
    },
    {
      tag: 'twice as far',
      lab: 'intensity',
      scenario: 'spread',
      setup: (s) => { s.kind = 'sphere'; s.radius = 4; s.sources = 1; },
      read: (c) => ({ beta: [c.beta, 81.00] }),
    },
  ],
  s3: [
    {
      tag: 'the stopped pipe',
      lab: 'pipe-modes',
      scenario: 'stopped',
      setup: (s) => { s.end = 'closed'; s.temp = 22; s.m = 1; },
      read: (c) => ({
        v: [c.v, 344],
        f: [c.f, 128],
        L: [c.L, 0.672],
      }),
    },
    {
      tag: 'the fourth overtone',
      lab: 'pipe-modes',
      scenario: 'stopped',
      setup: (s) => { s.end = 'closed'; s.temp = 22; s.m = 5; },
      read: (c) => ({ f: [c.f, 1152] }),
    },
    {
      tag: 'the open pipe',
      lab: 'pipe-modes',
      scenario: 'open',
      setup: (s) => { s.end = 'open'; s.temp = 22; s.length = 0.672; s.m = 1; },
      read: (c) => ({ f: [c.f, 256] }),
    },
  ],
  s4: [
    {
      tag: 'the forks',
      lab: 'pipe-modes',
      scenario: 'forks',
      setup: (s) => { s.end = 'beats'; s.f1 = 256; s.f2 = 512; },
      read: (c) => ({ f: [c.f, 256] }),
    },
  ],
  s5: [
    {
      tag: 'approaching',
      lab: 'train-horn',
      scenario: 'in',
      read: (c) => ({ fObs: [c.fObs, 167.2] }),
    },
    {
      tag: 'receding',
      lab: 'train-horn',
      scenario: 'out',
      read: (c) => ({ fObs: [c.fObs, 136] }),
    },
    {
      tag: 'the cone',
      lab: 'doppler',
      scenario: 'shock',
      read: (c) => ({
        M: [c.M, 2.85],
        angle: [c.theta * DEG, 20.54],
      }),
    },
    {
      tag: 'the rider',
      lab: 'doppler',
      scenario: 'approach',
      setup: (s) => { s.f = 150; s.v = 340; s.vo = 35; s.vs = -35; s.kind = 'horn'; },
      read: (c) => ({ fObs: [c.fObs, 150] }),
    },
  ],
};
