/** Unit 7 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  inertiaDisk, inertiaHoop, precessionRate, rollingIncline, rollingSlip, rollingSpeed,
} from '@flux/subjects/mechanics/rotation.js';

const DEG = Math.PI / 180;
const disk = inertiaDisk(2, 0.2);
const roll = rollingIncline({ mass: 2, radius: 0.2, I: disk, thetaDeg: 30, g: G });
const rollH = 1.5 * Math.sin(30 * DEG);
const rollV = rollingSpeed({ mass: 2, radius: 0.2, I: disk, height: rollH, g: G });
const slip = rollingSlip({ mass: 2, radius: 0.2, I: disk, thetaDeg: 30, mu: 0.1, g: G });
const rover = rollingSpeed({ mass: 5, radius: 0.25, I: inertiaHoop(5, 0.25), height: 25, g: 3.71 });
const gyro = precessionRate({
  mass: 0.3, r: 0.05, I: inertiaDisk(0.3, 0.05), omega: 20 * 2 * Math.PI, g: 9.8,
});

export default {
  s1: [
    {
      tag: 'a solid cylinder on a 30 degree hill',
      lab: 'rolling',
      scenario: 'disk',
      setup: (s) => {
        Object.assign(s, { shape: 'disk', mode: 'roll', m: 2, R: 0.2, theta: 30, s: 1.5, mu: 0.1 });
      },
      read: (c) => ({ a: [c.a, roll.a], muMin: [c.muMin, roll.muMin], v: [c.v, rollV.v] }),
    },
  ],
  s2: [
    {
      tag: 'a solid cylinder that slips',
      lab: 'rolling',
      scenario: 'slip',
      setup: (s) => {
        Object.assign(s, { shape: 'disk', mode: 'slip', m: 2, R: 0.2, theta: 30, s: 1.5, mu: 0.1 });
      },
      read: (c) => ({ a: [c.a, slip.a], alpha: [c.alpha, slip.alpha] }),
    },
  ],
  s3: [
    {
      tag: 'a rover wheel on Mars',
      lab: 'rover-wheel',
      scenario: 'mars',
      read: (c) => ({
        v: [c.v, rover.v],
        Ktrans: [c.Ktrans, 0.5 * 5 * rover.v * rover.v],
        Krot: [c.Krot, 0.5 * 5 * rover.v * rover.v],
      }),
    },
  ],
  s4: [
    {
      tag: 'a meteor above an observer',
      lab: 'particle-l',
      scenario: 'meteor',
      setup: (s) => {
        Object.assign(s, { m: 15, x: 25000, y: 25000, vx: 0, vy: -2000, ax: 0, ay: -2 });
      },
      read: (c) => ({ Lz: [c.Lz, -7.5e8], tau: [c.tau, -7.5e5] }),
    },
  ],
  s5: [
    {
      tag: 'a robot arm and its forceps',
      lab: 'spinner',
      scenario: 'arm',
      setup: (s) => {
        Object.assign(s, { kind: 'arm', mArm: 2, mTip: 1, mRock: 0, len: 1, omega: 0.1 * Math.PI });
      },
      read: (c) => ({ L: [c.L, Math.PI / 6], I: [c.I, 5 / 3], omega: [c.omega, 0.1 * Math.PI] }),
    },
  ],
  s6: [
    {
      tag: 'two flywheels brought to one spin',
      lab: 'spinner',
      scenario: 'fly',
      setup: (s) => {
        Object.assign(s, { kind: 'couple', factor: 3, rpm0: 600, I0: 1 });
      },
      read: (c) => ({ omega: [c.omega, 5 * Math.PI], K: [c.K, 0.25 * c.K0] }),
    },
    {
      tag: 'a gymnast who tucks',
      lab: 'spinner',
      scenario: 'tuck',
      setup: (s) => {
        Object.assign(s, { kind: 'tuck', mRod: 80, len0: 1.8, len: 0.9, w0: 2 * Math.PI });
      },
      read: (c) => ({ omega: [c.omega, 8 * Math.PI], I: [c.I, 5.4] }),
    },
  ],
  s7: [
    {
      tag: 'a disk precessing on a pivot',
      lab: 'gyro',
      scenario: 'book',
      read: (c) => ({ omegaP: [c.omegaP, gyro.omegaP], period: [c.period, gyro.period] }),
    },
  ],
};
