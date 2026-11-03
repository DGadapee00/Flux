/** Unit 11 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  gravityFromPendulum, pendulumPeriod, pendulumPeriodExact, shm, speedAtDisplacement, springPeriod,
  tunedDamperLength, underdampedMotion,
} from '@flux/subjects/mechanics/oscillation.js';

const DEG = Math.PI / 180;
const motion = shm({ A: 0.02, omega: 4, t: 0.2 });
const ring = underdampedMotion({ A0: 0.05, mass: 1, k: 100, b: 2, t: 0.4 });

export default {
  s1: [
    {
      tag: 'the block',
      lab: 'spring-mass',
      scenario: 'book',
      read: (c) => ({
        omega: [c.omega, 4],
        T: [c.T, springPeriod(2, 32)],
        vmax: [c.vmax, 0.08],
        amax: [c.amax, 0.32],
      }),
    },
    {
      tag: 'a later instant',
      lab: 'spring-mass',
      scenario: 'book',
      setup: (s) => { s.m = 2; s.k = 32; s.A = 0.02; s.t = 0.2; s.hang = 'flat'; },
      read: (c) => ({
        x: [c.x, motion.x],
        v: [c.v, motion.v],
        a: [c.a, motion.a],
      }),
    },
    {
      tag: 'a hanging spring',
      lab: 'spring-mass',
      scenario: 'hang',
      read: (c) => ({
        shift: [c.shift, (2 * G) / 32],
        T: [c.T, springPeriod(2, 32)],
      }),
    },
  ],
  s2: [
    {
      tag: 'the energy',
      lab: 'spring-mass',
      scenario: 'book',
      setup: (s) => {
        s.m = 2;
        s.k = 32;
        s.A = 0.02;
        s.hang = 'flat';
        s.t = Math.acos(0.5) / 4;
      },
      read: (c) => ({
        E: [c.E, 0.0064],
        v: [Math.abs(c.v), speedAtDisplacement(2, 32, 0.02, 0.01)],
      }),
    },
  ],
  s3: [
    {
      tag: 'measuring g',
      lab: 'pendulum',
      scenario: 'gravity',
      read: (c) => ({
        gMeas: [c.gMeas, gravityFromPendulum(0.75, 1.7357)],
      }),
    },
    {
      tag: 'a large angle',
      lab: 'pendulum',
      scenario: 'large',
      read: (c) => ({
        T0: [c.T0, pendulumPeriod(0.75)],
        Texact: [c.Texact, pendulumPeriodExact(0.75, 60 * DEG)],
      }),
    },
  ],
  s4: [
    {
      tag: 'a ring-down',
      lab: 'resonance',
      scenario: 'light',
      setup: (s) => { s.m = 1; s.k = 100; s.b = 2; s.A0 = 0.05; s.t = 0.4; s.F0 = 2; s.omega = 10; },
      read: (c) => ({
        envelope: [c.envelope, ring.envelope],
        omegaD: [c.omegaD, ring.omega],
      }),
    },
    {
      tag: 'driven on resonance',
      lab: 'resonance',
      scenario: 'light',
      read: (c) => ({
        A: [c.A, 0.4],
        lag: [c.lag, Math.PI / 2],
        Amax: [c.Amax, 0.4],
      }),
    },
  ],
  s5: [
    {
      tag: 'the tower',
      lab: 'skyscraper-damper',
      scenario: 'book',
      read: (c) => ({
        L: [c.L, tunedDamperLength(0.5)],
        T: [c.T, 2],
      }),
    },
  ],
};
