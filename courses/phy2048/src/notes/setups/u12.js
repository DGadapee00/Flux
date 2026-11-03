/** Unit 12 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  lengthFromPitch, modeFrequency, travelingWave, waveFromConstants, wavePower, waveSpeed,
} from '@flux/subjects/mechanics/waves.js';

const HIGH_MU = 3.09e-4;
const HIGH_T = 56.4;
const wave = waveFromConstants(6.28, 1.57);
const crest = travelingWave({ A: 0.2, k: 6.28, omega: 1.57, x: Math.PI / (2 * 6.28), t: 0 });
const vHigh = waveSpeed(HIGH_T, HIGH_MU);
const scale = lengthFromPitch(vHigh, 329.63);
const vLow = 2 * scale * 82.41;
const muP = 0.07 / 2;
const vP = waveSpeed(90, muP);
const power = wavePower({ mu: muP, A: 0.04, omega: 2 * Math.PI * 60, v: vP });
const vHang = waveSpeed(2 * G, 0.006);

export default {
  s1: [
    {
      tag: 'the rope',
      lab: 'traveling-wave',
      scenario: 'rope',
      read: (c) => ({
        v: [c.v, 5],
        T: [c.T, 0.5],
        lambda: [c.lambda, 2.5],
      }),
    },
    {
      tag: 'the snapshot',
      lab: 'traveling-wave',
      scenario: 'formula',
      setup: (s) => {
        s.mu = 1;
        s.tension = 0.02 * 0.02;
        s.f = 0.25;
        s.A = 0.06;
        s.probe = 0;
        s.cycles = 0;
      },
      read: (c) => ({
        v: [c.v, 0.02],
        T: [c.T, 4],
        f: [1 / c.T, 0.25],
      }),
    },
  ],
  s2: [
    {
      tag: 'the wave function',
      lab: 'traveling-wave',
      scenario: 'formula',
      setup: (s) => {
        s.mu = 0.2;
        s.tension = 0.2 * wave.v * wave.v;
        s.f = 1.57 / (2 * Math.PI);
        s.A = 0.2;
        s.probe = Math.PI / (2 * 6.28);
        s.cycles = 0;
      },
      read: (c) => ({
        lambda: [c.lambda, wave.lambda],
        T: [c.T, wave.T],
        v: [c.v, wave.v],
      }),
    },
    {
      tag: 'a crest',
      lab: 'traveling-wave',
      scenario: 'formula',
      setup: (s) => {
        s.mu = 0.2;
        s.tension = 0.2 * wave.v * wave.v;
        s.f = 1.57 / (2 * Math.PI);
        s.A = 0.2;
        s.probe = Math.PI / (2 * 6.28);
        s.cycles = 0;
      },
      read: (c) => ({
        y: [c.y, crest.y],
        vy: [c.vy, 0],
        vmax: [c.vmax, 0.2 * 1.57],
      }),
    },
    {
      tag: 'two waves',
      lab: 'standing-wave',
      scenario: 'book',
      setup: (s) => { s.A = 0.4; s.n = 1; s.cycles = 0; },
      read: (c) => ({
        y: [c.y, 0.4],
      }),
    },
  ],
  s3: [
    {
      tag: 'the high E',
      lab: 'guitar-string',
      scenario: 'high',
      read: (c) => ({
        v: [c.v, vHigh],
        f: [c.f, 329.63],
      }),
    },
    {
      tag: 'the low E',
      lab: 'guitar-string',
      scenario: 'tuned',
      read: (c) => ({
        v: [c.v, vLow],
        f: [c.f, 82.41],
        length: [c.length, scale],
      }),
    },
  ],
  s4: [
    {
      tag: 'the vibrator',
      lab: 'traveling-wave',
      scenario: 'rope',
      setup: (s) => {
        s.mu = muP;
        s.tension = 90;
        s.f = 60;
        s.A = 0.04;
        s.probe = 0;
        s.cycles = 0;
      },
      read: (c) => ({
        v: [c.v, vP],
        P: [c.P, power],
      }),
    },
  ],
  s5: [
    {
      tag: 'the hanger',
      lab: 'standing-wave',
      scenario: 'book',
      read: (c) => ({
        v: [c.v, vHang],
        f1: [c.f1, modeFrequency(1, vHang, 2)],
        lambda: [c.lambda, 4],
      }),
    },
  ],
};
