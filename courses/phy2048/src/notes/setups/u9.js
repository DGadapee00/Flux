/** Unit 9 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import {
  circularOrbitEnergy, circularOrbitPeriod, circularOrbitSpeed, escapeSpeed, gravityEnergy,
  gravityField, gravityForce, massFromSurface, semiMajorAxis, wedgeArc, wedgeArea,
} from '@flux/subjects/mechanics/gravitation.js';

const AU = 1.5e11;
const YEAR = 365 * 24 * 3600;
const EARTH_M = 5.96e24;
const EARTH_R = 6.37e6;
const ISS_R = EARTH_R + 4e5;
const G_SURFACE = 9.8;
const SUN = 2.0e30;
const surfaceM = massFromSurface(G_SURFACE, EARTH_R);
const surfaceV = Math.sqrt(G_SURFACE * EARTH_R);
const halleyA = semiMajorAxis(SUN, 75.3 * YEAR);
const halleyPeri = 0.586 * AU;
const soyuzE = circularOrbitEnergy(9000, EARTH_M, ISS_R);
const soyuzUs = gravityEnergy(9000, EARTH_M, EARTH_R);
const soyuzU = gravityEnergy(9000, EARTH_M, ISS_R);

export default {
  s1: [
    {
      tag: 'two vehicles',
      lab: 'orbit',
      scenario: 'pair',
      read: (c) => ({
        force: [c.force, gravityForce(9000, 9000, 10)],
        accel: [c.accel, gravityForce(9000, 9000, 10) / 9000],
      }),
    },
  ],
  s2: [
    {
      tag: 'surface gravity',
      lab: 'iss-orbit',
      scenario: 'surface',
      read: (c) => ({
        g: [c.g, gravityField(EARTH_M, EARTH_R)],
      }),
    },
    {
      tag: '400 km up',
      lab: 'iss-orbit',
      scenario: 'iss',
      read: (c) => ({
        g: [c.g, gravityField(EARTH_M, ISS_R)],
      }),
    },
    {
      tag: 'a weightless day',
      lab: 'iss-orbit',
      scenario: 'surface',
      setup: (s) => { s.M = surfaceM; s.R = EARTH_R; s.alt = 0; },
      read: (c) => ({
        v: [c.v, surfaceV],
        T: [c.T, (2 * Math.PI * EARTH_R) / surfaceV],
      }),
    },
  ],
  s3: [
    {
      tag: 'escape from Earth',
      lab: 'orbit',
      scenario: 'escape',
      setup: (s) => { s.M = EARTH_M; s.r = EARTH_R; s.R = EARTH_R; s.f = Math.SQRT2; s.m = 1; },
      read: (c) => ({
        vesc: [c.vesc, escapeSpeed(EARTH_M, EARTH_R)],
      }),
    },
    {
      tag: 'the Soyuz',
      lab: 'orbit',
      scenario: 'iss',
      read: (c) => ({
        dU: [c.dU, soyuzU - soyuzUs],
        K: [c.K, -soyuzE],
        E: [c.E, soyuzE],
        dE: [c.dE, soyuzE - soyuzUs],
      }),
    },
  ],
  s4: [
    {
      tag: 'the station',
      lab: 'iss-orbit',
      scenario: 'iss',
      read: (c) => ({
        v: [c.v, circularOrbitSpeed(EARTH_M, ISS_R)],
        T: [c.T, circularOrbitPeriod(EARTH_M, ISS_R)],
      }),
    },
  ],
  s5: [
    {
      tag: 'equal areas',
      lab: 'kepler',
      scenario: 'wedge',
      read: (c) => ({
        area: [c.area, wedgeArea(AU, 0.6, 0.08)],
        arc: [c.arc, wedgeArc(AU, 0.6, Math.PI, 0.08)],
      }),
    },
    {
      tag: "Halley's comet",
      lab: 'kepler',
      scenario: 'halley',
      read: (c) => ({
        a: [c.a, halleyA],
        aph: [c.aph, 2 * halleyA - halleyPeri],
      }),
    },
  ],
};
