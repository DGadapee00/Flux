/** Ch 13 · Gravitation. OpenStax University Physics Vol. 1, §§13.1–13.5. */
import {
  GRAV, circularOrbitEnergy, circularOrbitPeriod, circularOrbitSpeed, escapeSpeed, gravityEnergy,
  gravityField, gravityForce, massFromPeriod, massFromSurface, semiMajorAxis,
} from '@flux/subjects/mechanics/gravitation.js';
import { choice, kase, mc, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u9', ch: '13' };
const AU = 1.5e11;
const YEAR = 365 * 24 * 3600;
const LY = 9.5e15;

const [mant, exp] = GRAV.toExponential().split('e');
const GTEX = String.raw`$G = ${mant}\times 10^{${Number(exp)}}$ N·m²/kg²`;

const visViva = (M, r, a) => Math.sqrt(GRAV * M * (2 / r - 1 / a));

export default [
  problem({
    ...U,
    id: 'ch13.collision',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.1',
    title: 'Two vehicles drifting together',
    topics: ['gravitation'],
    lab: 'orbit',
    vars: {
      m1: range(2000, 20000, 500, 'kg'),
      m2: range(2000, 20000, 500, 'kg'),
      r: range(6, 30, 1, 'm'),
    },
    derive: ($) => {
      const F = gravityForce($.m1, $.m2, $.r);
      return { F, accel: F / $.m1 };
    },
    second: ($) => {
      const F = (GRAV * $.m1 * $.m2) / ($.r * $.r);
      return { F, accel: F / $.m1 };
    },
    text: (T) => `Two nearly spherical vehicles, of mass ${T.m1} kg and ${T.m2} kg, are at rest relative to each other with their centers ${T.r} m apart. Take ${GTEX}. Find the gravitational force between them, and the initial acceleration of the first vehicle.`,
    parts: [
      num('F', ($) => $.F, 'N', { abs: 1e-8, label: 'force' }),
      num('accel', ($) => $.accel, 'm/s²', { abs: 1e-12, label: 'acceleration of the first' }),
    ],
    hints: [
      'The force has magnitude G m1 m2 / r². The distance is from center to center.',
      'Each vehicle feels that force. The acceleration of the first is the force divided by its own mass, not by the sum.',
    ],
    steps: ($) => [
      String.raw`$F = ${texNum($.F)}\ \mathrm{N}$`,
      String.raw`$a = F/m_1 = ${texNum($.accel)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'pair',
      setup: (s, $) => { s.M = $.m2; s.m = $.m1; s.r = $.r; s.R = $.r; s.f = 1; },
      read: (c) => ({ F: c.force, accel: c.accel }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.1, "A Collision in Orbit": two 9000 kg vehicles, 10.0 m apart', {
        m1: 9000, m2: 9000, r: 10,
      }, { F: 5.4e-5, accel: 6.0e-9 }, {
        note: 'The book prints 5.4×10⁻⁵ N and 6.0×10⁻⁹ m/s² with G = 6.67×10⁻¹¹. This bank uses G = 6.6743×10⁻¹¹, and both prints sit inside the grader.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.galaxies',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.1',
    title: 'The pull of a neighboring galaxy',
    topics: ['gravitation'],
    lab: 'orbit',
    vars: {
      n: range(400, 1200, 50, ''),
      mSun: range(1.9e30, 2.1e30, 5e28, 'kg'),
      ly: range(1.5, 3.5, 0.1, ''),
    },
    derive: ($) => {
      const m = $.n * 1e9 * $.mSun;
      const sep = $.ly * 1e6 * LY;
      const F = gravityForce(m, m, sep);
      return { m, sep, F, accel: F / m };
    },
    second: ($) => {
      const m = $.n * 1e9 * $.mSun;
      const sep = $.ly * 1e6 * LY;
      const F = (GRAV * m * m) / (sep * sep);
      return { F, accel: F / m };
    },
    text: (T) => `Two galaxies have equal mass. Each is ${T.n} billion solar masses, and a solar mass is ${T.mSun} kg. Their centers are ${T.ly} million light-years apart. Take a light-year as ${LY.toExponential(2)} m and ${GTEX}. Find the force on one galaxy and its acceleration.`,
    parts: [
      num('F', ($) => $.F, 'N', { label: 'force' }),
      num('accel', ($) => $.accel, 'm/s²', { abs: 1e-16, label: 'acceleration' }),
    ],
    hints: [
      'Treat each galaxy as a point at its center. The separation is large compared with the diameter, which is the reason that works.',
      'The acceleration is the force divided by one galaxy’s mass. The other mass stays in the force.',
    ],
    steps: ($) => [
      String.raw`$F = ${texNum($.F)}\ \mathrm{N}$`,
      String.raw`$a = ${texNum($.accel)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'pair',
      setup: (s, $) => { s.M = $.m; s.m = $.m; s.r = $.sep; s.R = $.sep; s.f = 1; },
      read: (c) => ({ F: c.force, accel: c.accel }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.1, "Attraction between Galaxies": 800 billion solar masses, 2.5 million light-years', {
        n: 800, mSun: 2.0e30, ly: 2.5,
      }, { F: 3.0e29, accel: 1.9e-13 }, {
        note: 'The book prints 3.0×10²⁹ N and 1.9×10⁻¹³ m/s². A solar mass is 2.0×10³⁰ kg and a light-year is 9.5×10¹⁵ m, as that example states.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.earth-mass',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'The mass of a planet from g',
    topics: ['gravity'],
    lab: 'iss-orbit',
    vars: {
      g: range(1.5, 25, 0.1, 'm/s²'),
      R: range(1e6, 8e6, 1e5, 'm'),
    },
    derive: ($) => ({ M: massFromSurface($.g, $.R) }),
    second: ($) => ({ M: ($.g * $.R * $.R) / GRAV }),
    text: (T) => `A spherical planet has surface gravity ${T.g} m/s² and radius ${T.R} m. Take ${GTEX}. Find the planet’s mass. Ignore its rotation.`,
    parts: [
      num('M', ($) => $.M, 'kg', { label: 'mass' }),
    ],
    hints: [
      'At the surface, g = GM/R². The mass of a test body cancels.',
      'Solve for M. The radius is measured from the center, and here the body is on the surface, so that radius is R.',
    ],
    steps: ($) => [
      String.raw`$M = gR^2/G = ${texNum($.M)}\ \mathrm{kg}$`,
    ],
    sim: {
      scenario: 'surface',
      setup: (s, $) => { s.M = $.M; s.R = $.R; s.alt = 0; },
      read: (c, s) => ({ M: s.M }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.2, "Masses of Earth and Moon": g = 9.80 m/s², radius 6.37×10⁶ m', {
        g: 9.8, R: 6.37e6,
      }, { M: 5.95e24 }, {
        note: 'The book prints 5.95×10²⁴ kg with G = 6.67×10⁻¹¹. The same inputs with this bank’s G land inside that print.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.height',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'g above the surface',
    topics: ['field', 'gravity'],
    lab: 'iss-orbit',
    vars: {
      alt: range(100, 2000, 50, 'km', 1000),
      R: range(6e6, 7e6, 1e5, 'm'),
      M: range(5e24, 7e24, 1e23, 'kg'),
    },
    derive: ($) => ({ g: gravityField($.M, $.R + $.alt) }),
    second: ($) => ({ g: (GRAV * $.M) / ($.R + $.alt) ** 2 }),
    text: (T) => `A planet of mass ${T.M} kg and radius ${T.R} m. Find g at a height ${T.alt} km above the surface. Take ${GTEX}.`,
    parts: [
      num('g', ($) => $.g, 'm/s²', { label: 'g at that height' }),
    ],
    hints: [
      'g = GM/r². The r in that formula is the distance from the center, not the height above the surface.',
      'Add the height to the radius before you square. Holding g at its surface value is the near-surface model, and this height is too large for it.',
    ],
    steps: ($) => [
      String.raw`$r = R + h$, so $g = ${texNum($.g)}\ \mathrm{m/s^2}$`,
    ],
    sim: {
      scenario: 'iss',
      setup: (s, $) => { s.M = $.M; s.R = $.R; s.alt = $.alt; },
      read: (c) => ({ g: c.g }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.2, "Gravity above Earth’s Surface": 400 km, Earth 5.96×10²⁴ kg, radius 6.37×10⁶ m', {
        alt: 400, R: 6.37e6, M: 5.96e24,
      }, { g: 8.67 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.weightless',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'A day with no apparent weight',
    topics: ['orbit', 'gravity'],
    lab: 'iss-orbit',
    vars: {
      g: range(8, 12, 0.1, 'm/s²'),
      R: range(5e6, 8e6, 1e5, 'm'),
    },
    derive: ($) => {
      const v = Math.sqrt($.g * $.R);
      return { v, T: (2 * Math.PI * $.R) / v };
    },
    second: ($) => {
      const M = massFromSurface($.g, $.R);
      const v = circularOrbitSpeed(M, $.R);
      return { v, T: circularOrbitPeriod(M, $.R) };
    },
    text: (T) => `A spherical planet of radius ${T.R} m has surface gravity ${T.g} m/s² and is not rotating in this model. How fast must a point on its equator move for the apparent weight there to be zero, and how long is that day? The same two numbers are the speed and the period of a circular orbit at the surface.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
    ],
    hints: [
      'Apparent weight is zero when the gravitational acceleration is used up as centripetal acceleration: g = v²/R.',
      'The period is the circumference divided by that speed. One revolution is 2πR, not πR.',
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{gR} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$T = 2\pi R/v = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'surface',
      setup: (s, $) => { s.R = $.R; s.alt = 0; s.M = massFromSurface($.g, $.R); },
      read: (c) => ({ v: c.v, T: c.T }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.2, "Zero Apparent Weight": g = 9.80 m/s², radius 6.37×10⁶ m', {
        g: 9.8, R: 6.37e6,
      }, { v: 7.91e3, T: 5.06e3 }, {
        note: 'The book prints 7.91×10³ m/s and 5.06×10³ s, and notes that the same pair is a surface orbit.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.escape',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.3',
    title: 'Escape speed',
    topics: ['escape'],
    lab: 'orbit',
    vars: {
      M: range(1e23, 3e30, 1e23, 'kg'),
      R: range(1e6, 2e11, 1e8, 'm'),
    },
    derive: ($) => ({ vesc: escapeSpeed($.M, $.R) }),
    second: ($) => ({ vesc: Math.sqrt((2 * GRAV * $.M) / $.R) }),
    text: (T) => `Find the escape speed from a distance ${T.R} m from the center of a body of mass ${T.M} kg. Take ${GTEX}. Ignore the atmosphere and any rotation.`,
    parts: [
      num('vesc', ($) => $.vesc, 'm/s', { label: 'escape speed' }),
    ],
    hints: [
      'Escape is the launch that arrives at infinity with nothing left. The total energy is zero.',
      'That speed is √(2GM/r). The circular-orbit speed at the same place is smaller by √2.',
    ],
    steps: ($) => [
      String.raw`$v_{\mathrm{esc}} = \sqrt{2GM/r} = ${texNum($.vesc)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'escape',
      setup: (s, $) => { s.M = $.M; s.r = $.R; s.R = $.R; s.f = Math.SQRT2; s.m = 1; },
      read: (c) => ({ vesc: c.vesc }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.3, "Escape from Earth": Earth 5.96×10²⁴ kg, radius 6.37×10⁶ m', {
        M: 5.96e24, R: 6.37e6,
      }, { vesc: 1.12e4 }),
      kase('OpenStax University Physics Vol. 1 §13.3, "Escape from Earth": the Sun, 1.99×10³⁰ kg, from Earth’s orbit at 1.50×10¹¹ m', {
        M: 1.99e30, R: 1.5e11,
      }, { vesc: 4.21e4 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.iss',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'Speed and period of a circular orbit',
    topics: ['orbit'],
    lab: 'iss-orbit',
    vars: {
      alt: range(200, 2000, 50, 'km', 1000),
      R: range(6e6, 7e6, 1e5, 'm'),
      M: range(5e24, 7e24, 1e23, 'kg'),
      m: range(1000, 20000, 500, 'kg'),
    },
    derive: ($) => {
      const r = $.R + $.alt;
      return {
        r,
        G: GRAV,
        v: circularOrbitSpeed($.M, r),
        T: circularOrbitPeriod($.M, r),
      };
    },
    second: ($) => {
      const r = $.R + $.alt;
      const v = Math.sqrt((GRAV * $.M) / r);
      return { v, T: (2 * Math.PI * r) / v };
    },
    text: (T) => `A satellite of mass ${T.m} kg orbits a planet of mass ${T.M} kg and radius ${T.R} m, at a height ${T.alt} km. Take ${GTEX}. Find the orbital speed, the period, and a formula for the speed.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'orbital speed' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
      sym('vsym', 'sqrt(G*M/r)', { G: 'm^3/kg/s^2', M: 'kg', r: 'm' }, ($) => $.v, { unit: 'm/s', label: 'speed as a formula' }),
    ],
    hints: [
      'The gravitational force is the centripetal force. The satellite’s mass cancels, so the speed is √(GM/r).',
      'r is the radius plus the height. The period is the circumference 2πr divided by that speed.',
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$T = ${texNum($.T)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'iss',
      setup: (s, $) => { s.M = $.M; s.R = $.R; s.alt = $.alt; s.m = $.m; },
      read: (c) => ({ v: c.v, T: c.T }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.4, "The International Space Station": 400 km, Earth 5.96×10²⁴ kg, radius 6.37×10⁶ m', {
        alt: 400, R: 6.37e6, M: 5.96e24, m: 9000,
      }, { v: 7.67e3, T: 5.55e3 }, {
        note: 'The book prints 7.67×10³ m/s and 5.55×10³ s. The 9000 kg is the Soyuz of the following example. The speed does not use it.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.soyuz',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'The energy to reach orbit',
    topics: ['orbit', 'escape'],
    lab: 'orbit',
    vars: {
      m: range(2000, 20000, 500, 'kg'),
      M: range(5e24, 7e24, 1e23, 'kg'),
      R: range(6e6, 7e6, 1e5, 'm'),
      alt: range(200, 800, 50, 'km', 1000),
    },
    derive: ($) => {
      const r = $.R + $.alt;
      const E = circularOrbitEnergy($.m, $.M, r);
      const Us = gravityEnergy($.m, $.M, $.R);
      const U = gravityEnergy($.m, $.M, r);
      const K = -E;
      return { r, E, K, dU: U - Us, dE: E - Us };
    },
    second: ($) => {
      const r = $.R + $.alt;
      const E = -(GRAV * $.M * $.m) / (2 * r);
      const Us = -(GRAV * $.M * $.m) / $.R;
      const U = -(GRAV * $.M * $.m) / r;
      return { E, K: -E, dU: U - Us, dE: E - Us };
    },
    text: (T) => `A craft of mass ${T.m} kg starts at rest on the surface of a planet (mass ${T.M} kg, radius ${T.R} m) and ends in a circular orbit at height ${T.alt} km. Take ${GTEX}, and take potential energy as zero at infinity. Find the change in potential energy, the orbital kinetic energy, the total energy in orbit, and the energy that must be supplied.`,
    parts: [
      num('dU', ($) => $.dU, 'J', { label: 'change in potential energy' }),
      num('K', ($) => $.K, 'J', { label: 'kinetic energy in orbit' }),
      num('E', ($) => $.E, 'J', { label: 'total energy in orbit' }),
      num('dE', ($) => $.dE, 'J', { label: 'energy supplied' }),
    ],
    hints: [
      'Potential energy is −GMm/r. The change from the surface to the orbit is positive: the craft has climbed.',
      'In a circular orbit the total energy is −GMm/(2r), and the kinetic energy is the positive of that. The energy supplied is the orbital total minus the surface potential, because the craft started at rest.',
    ],
    steps: ($) => [
      String.raw`$\Delta U = ${texNum($.dU)}\ \mathrm{J}$`,
      String.raw`$K = ${texNum($.K)}\ \mathrm{J}$, $E = ${texNum($.E)}\ \mathrm{J}$`,
      String.raw`Energy supplied $\Delta E = ${texNum($.dE)}\ \mathrm{J}$`,
    ],
    sim: {
      scenario: 'iss',
      setup: (s, $) => { s.M = $.M; s.m = $.m; s.R = $.R; s.r = $.r; s.f = 1; },
      read: (c) => ({ dU: c.dU, K: c.K, E: c.E, dE: c.dE }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.3 and §13.4, the 9000 kg Soyuz lifted to the 400 km orbit', {
        m: 9000, M: 5.96e24, R: 6.37e6, alt: 400,
      }, { dU: 3.32e10, K: 2.65e11, E: -2.65e11, dE: 2.98e11 }, {
        note: 'The book prints ΔU = 3.32×10¹⁰ J, K = 2.65×10¹¹ J, E = −2.65×10¹¹ J, and ΔE = 2.98×10¹¹ J.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.moon',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'A planet’s mass from its moon',
    topics: ['kepler', 'orbit'],
    lab: 'kepler',
    vars: {
      T: range(1e5, 5e6, 1e5, 's'),
      a: range(1e8, 5e8, 1e7, 'm'),
    },
    derive: ($) => ({ M: massFromPeriod($.T, $.a) }),
    second: ($) => ({ M: (4 * Math.PI * Math.PI * $.a ** 3) / (GRAV * $.T * $.T) }),
    text: (T) => `A moon’s orbit has period ${T.T} s and semi-major axis ${T.a} m. Take ${GTEX}. Find the mass of the planet it orbits. Treat the planet as fixed.`,
    parts: [
      num('M', ($) => $.M, 'kg', { label: 'planet mass' }),
    ],
    hints: [
      'Kepler’s third law for a small moon is T² = 4π² a³ / (GM).',
      'Solve for M. The moon’s mass does not appear. The axis a is from center to center, not the altitude.',
    ],
    steps: ($) => [
      String.raw`$M = 4\pi^2 a^3 /(GT^2) = ${texNum($.M)}\ \mathrm{kg}$`,
    ],
    sim: {
      scenario: 'wedge',
      setup: (s, $) => { s.M = $.M; s.a = $.a; s.e = 0; },
      read: (c, s) => ({ M: s.M }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.4, "Determining the Mass of Earth": the Moon, 27.3 days = 2.36×10⁶ s, 3.84×10⁸ m', {
        T: 2.36e6, a: 3.84e8,
      }, { M: 6.01e24 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.halley',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.5',
    title: 'A comet’s semi-major axis',
    topics: ['kepler'],
    lab: 'kepler',
    vars: {
      years: range(20, 120, 1, 'yr', YEAR),
      peri: range(0.3, 2, 0.02, 'AU', AU),
      M: range(1.8e30, 2.2e30, 1e28, 'kg'),
    },
    derive: ($) => {
      const a = semiMajorAxis($.M, $.years);
      return { a, aph: 2 * a - $.peri };
    },
    second: ($) => {
      const a = Math.cbrt((GRAV * $.M * $.years * $.years) / (4 * Math.PI * Math.PI));
      return { a, aph: 2 * a - $.peri };
    },
    valid: ($) => $.peri < $.a,
    text: (T) => `A comet returns to perihelion every ${T.years} years. Its perihelion is ${T.peri} AU, and the star it orbits has mass ${T.M} kg. Take 1 AU = 1.50×10¹¹ m, a year as 365 days, and ${GTEX}. Find the semi-major axis in meters and the aphelion in meters.`,
    parts: [
      num('a', ($) => $.a, 'm', { label: 'semi-major axis' }),
      num('aph', ($) => $.aph, 'm', { label: 'aphelion' }),
    ],
    hints: [
      'Kepler’s third law gives the semi-major axis from the period and the star’s mass. The perihelion is not in that formula.',
      'The semi-major axis is half the sum of perihelion and aphelion. Double it and subtract the perihelion.',
    ],
    steps: ($) => [
      String.raw`$a = ${texNum($.a)}\ \mathrm{m}$`,
      String.raw`Aphelion $= 2a - r_{\mathrm{peri}} = ${texNum($.aph)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'halley',
      setup: (s, $) => {
        s.M = $.M;
        s.a = $.a;
        s.e = 1 - $.peri / $.a;
        s.nu0 = 0;
      },
      read: (c) => ({ a: c.a, aph: c.aph }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.5, "Orbit of Halley’s Comet": 75.3 yr, perihelion 0.586 AU, Sun 2.00×10³⁰ kg', {
        years: 75.3, peri: 0.586, M: 2.0e30,
      }, { a: 2.67e12, aph: 35.0 * AU }, {
        note: 'The book prints 2.67×10¹² m, which is 17.8 AU, and an aphelion of 35.0 AU. One AU is 1.50×10¹¹ m, so 35.0 AU is 5.25×10¹² m.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.speeds',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §13.5',
    title: 'Speed at the near and far ends',
    topics: ['kepler', 'orbit'],
    lab: 'kepler',
    vars: {
      years: range(20, 120, 5, 'yr', YEAR),
      peri: range(0.4, 1.5, 0.05, 'AU', AU),
      M: range(1.9e30, 2.1e30, 5e28, 'kg'),
    },
    derive: ($) => {
      const a = semiMajorAxis($.M, $.years);
      const aph = 2 * a - $.peri;
      return { a, aph, vp: visViva($.M, $.peri, a), va: visViva($.M, aph, a) };
    },
    second: ($) => {
      const a = Math.cbrt((GRAV * $.M * $.years * $.years) / (4 * Math.PI * Math.PI));
      const aph = 2 * a - $.peri;
      const speed = (r) => Math.sqrt(GRAV * $.M * (2 / r - 1 / a));
      return { vp: speed($.peri), va: speed(aph) };
    },
    valid: ($) => $.peri < $.a && $.aph > $.a,
    text: (T) => `A comet orbiting a star of mass ${T.M} kg has a period of ${T.years} years and a perihelion of ${T.peri} AU. Take 1 AU = 1.50×10¹¹ m, a year as 365 days, and ${GTEX}. Find the speed at perihelion and the speed at aphelion.`,
    parts: [
      num('vp', ($) => $.vp, 'm/s', { label: 'speed at perihelion' }),
      num('va', ($) => $.va, 'm/s', { label: 'speed at aphelion' }),
    ],
    hints: [
      'The period fixes the semi-major axis. Aphelion is 2a minus perihelion.',
      'The speed on the ellipse is √[GM(2/r − 1/a)]. The near end is faster. The product of the two speeds is not the circular speed at a, but each one follows that formula on its own.',
    ],
    steps: ($) => [
      String.raw`Perihelion $${texNum($.vp)}\ \mathrm{m/s}$`,
      String.raw`Aphelion $${texNum($.va)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'halley',
      setup: (s, $) => { s.M = $.M; s.a = $.a; s.e = 1 - $.peri / $.a; s.nu0 = 0; },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.5, "Orbit of Halley’s Comet": 75.3 yr, 0.586 AU, Sun 2.00×10³⁰ kg. The example stops at the aphelion; the speeds are the same orbit.', {
        years: 75.3, peri: 0.586, M: 2.0e30,
      }, { vp: 5.47e4, va: 914 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.transfer',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.5',
    title: 'A transfer between two circular orbits',
    topics: ['kepler', 'orbit'],
    lab: 'kepler',
    vars: {
      r1: range(1e11, 1.6e11, 1e10, 'm'),
      r2: range(1.8e11, 3e11, 1e10, 'm'),
      M: range(1.8e30, 2.2e30, 1e28, 'kg'),
    },
    derive: ($) => {
      const a = 0.5 * ($.r1 + $.r2);
      const vc = circularOrbitSpeed($.M, $.r1);
      const vp = visViva($.M, $.r1, a);
      return { a, halfT: circularOrbitPeriod($.M, a) / 2, boost: vp - vc };
    },
    second: ($) => {
      const a = 0.5 * ($.r1 + $.r2);
      const mu = GRAV * $.M;
      const vc = Math.sqrt(mu / $.r1);
      const vp = Math.sqrt(mu * (2 / $.r1 - 1 / a));
      return { a, halfT: Math.PI * Math.sqrt((a * a * a) / mu), boost: vp - vc };
    },
    valid: ($) => $.r2 > $.r1 * 1.05,
    text: (T) => `A craft leaves a circular orbit of radius ${T.r1} m about a star of mass ${T.M} kg and joins a circular orbit of radius ${T.r2} m. The transfer is an ellipse with those two radii as perihelion and aphelion. Take ${GTEX}. Find the semi-major axis of the transfer, the time to go from one end to the other, and the speed that must be added at the inner orbit.`,
    parts: [
      num('a', ($) => $.a, 'm', { label: 'semi-major axis' }),
      num('halfT', ($) => $.halfT, 's', { label: 'time, inner orbit to outer' }),
      num('boost', ($) => $.boost, 'm/s', { label: 'speed added at the inner orbit' }),
    ],
    hints: [
      'The semi-major axis of the transfer is the average of the two circular radii. The trip from one end to the other is half the ellipse’s period.',
      'At the inner end the ellipse is faster than the circle. The boost is the difference of those two speeds, both computed at the same radius.',
    ],
    steps: ($) => [
      String.raw`$a = ${texNum($.a)}\ \mathrm{m}$`,
      String.raw`Half period $${texNum($.halfT)}\ \mathrm{s}$`,
      String.raw`Boost $${texNum($.boost)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'wedge',
      setup: (s, $) => {
        s.M = $.M;
        s.a = $.a;
        s.e = ($.r2 - $.r1) / ($.r2 + $.r1);
        s.nu0 = 0;
      },
      read: (c) => ({ a: c.a, halfT: c.T / 2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.5, the Earth-to-Mars transfer ellipse. The section describes it and does not print this boost. Radii 1.50×10¹¹ m and 2.28×10¹¹ m, Sun 1.99×10³⁰ kg.', {
        r1: 1.5e11, r2: 2.28e11, M: 1.99e30,
      }, { a: 1.89e11, halfT: 2.24e7, boost: 2930 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.concept-weight',
    kind: 'conceptual',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'Weight in orbit',
    topics: ['gravity', 'orbit'],
    lab: 'iss-orbit',
    vars: {
      q: choice(
        [1, 'An astronaut on the station is often called weightless. The gravitational force on the astronaut:'],
        [2, 'A scale under the astronaut’s feet, in the orbiting station, reads:'],
        [3, 'The station stays at one altitude because:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'there', 2: 'zero', 3: 'falls' }[$.q] }),
    second: ($) => {
      const g = gravityField(5.96e24, 6.37e6 + 4e5);
      if ($.q === 1) return { ans: g > 1 ? 'there' : 'gone' };
      if ($.q === 2) return { ans: 'zero' };
      const v = circularOrbitSpeed(5.96e24, 6.37e6 + 4e5);
      return { ans: v > 0 ? 'falls' : 'hovers' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['there', 'Is still most of the surface weight', 'At 400 km, g is about 8.7 m/s². The force is there. The astronaut is falling with the station.'],
          ['gone', 'Is zero, because orbit has no gravity', 'The field does not switch off at the top of the atmosphere. The reading on a scale is what goes to zero.'],
          ['outward', 'Points outward, away from Earth', 'The force is attractive. It points at Earth’s center.'],
        ],
        2: [
          ['zero', 'Zero', 'Station and astronaut fall together. Nothing has to push up, so a scale reads zero. That is apparent weight, not the gravitational force.'],
          ['mg', 'The full surface weight mg', 'That is what the scale reads when the astronaut is standing on the ground and not accelerating.'],
          ['more', 'More than the surface weight', 'The field is weaker at altitude, and the scale is not reading the field anyway. Both are falling.'],
        ],
        3: [
          ['falls', 'It is falling, and the ground curves away at the same rate', 'A circular orbit is free fall with a sideways speed. There is no upward force holding the station up.'],
          ['hovers', 'The pull of Earth is balanced by a second force', 'Nothing pushes out. The acceleration is toward Earth the whole way around.'],
          ['gone', 'It has left Earth’s gravity', 'Escape speed is larger than orbital speed by √2. The station is bound. Its total energy is negative.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Weight is the gravitational force. Apparent weight is what a scale reads. They are equal only when you are not accelerating.',
      'g at 400 km is smaller than 9.8 m/s² and it is not zero. Compare the orbital speed with the escape speed before you say the craft has left.',
    ],
    steps: ($) => [['The force is still there.', 'The scale reads zero because both are falling.', 'The station falls around Earth.'][$.q - 1]],
    sim: { scenario: 'iss', setup: (s) => { s.alt = 4e5; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.2, "Gravity above Earth’s Surface": g at 400 km is 8.67 m/s², not zero', { q: 1 }, { ans: 'there' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.concept-radius',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.2',
    title: 'Which distance goes in the formula',
    topics: ['field', 'gravity'],
    lab: 'iss-orbit',
    vars: {
      q: choice(
        [1, 'You want g at a height h above a planet of radius R. The r in g = GM/r² is:'],
        [2, 'You double the height h and leave R alone. The distance from the center:'],
        [3, 'A uniform sphere, and you are at a radius r inside it, with r < R. Then g:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sum', 2: 'not', 3: 'linear' }[$.q] }),
    second: ($) => {
      const low = gravityField(5.96e24, 6.37e6 + 4e5);
      const high = gravityField(5.96e24, 6.37e6 + 8e5);
      if ($.q === 1) return { ans: 'sum' };
      if ($.q === 2) return { ans: high < low && (6.37e6 + 8e5) / (6.37e6 + 4e5) < 1.2 ? 'not' : 'doubles' };
      return { ans: 'linear' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['sum', 'R + h, the distance from the center', 'The law is written from the center of a spherical body. The height is only the part of that distance that sits above the surface.'],
          ['height', 'h, the height the problem states', 'Using h alone puts the planet’s center h above the surface. The craft would be inside the formula’s planet.'],
          ['surface', 'R, because g hardly changes', 'That is the near-surface habit. At 400 km it is already wrong by more than a meter per second squared.'],
        ],
        2: [
          ['not', 'Grows, but not by a factor of two', 'The center was already R away. Adding another h on top of R + h is a small fractional change when h is much less than R.'],
          ['doubles', 'Doubles, so g falls by a factor of four', 'Doubling h does not double r. The factor-of-four rule needs a doubled distance from the center.'],
          ['same', 'Does not change, because g is constant', 'g is constant only while h is tiny next to R. Doubling a large height moves r.'],
        ],
        3: [
          ['linear', 'Grows in proportion to r', 'Only the mass inside r pulls, and for uniform density that mass grows as r³ while the denominator grows as r². g is proportional to r. It is zero at the center.'],
          ['inverse', 'Still follows 1/r², using the whole mass', 'The shell outside r pulls in every direction and adds nothing. Leaving it in the formula counts mass that is not inside.'],
          ['zero', 'Is zero everywhere inside a sphere', 'It is zero at the center, and only at the center. A mine shaft is not weightless.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Every outside formula in this chapter measures r from the center. Add the height to the radius first.',
      'Inside a uniform sphere, the mass that counts is the mass closer to the center than you are. The field then grows with r, from zero at the center to the surface value.',
    ],
    steps: ($) => [['r = R + h.', 'Doubling h does not double r.', 'Inside, g is proportional to r.'][$.q - 1]],
    sim: { scenario: 'higher', setup: (s) => { s.alt = 2e6; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.2, "Gravity above Earth’s Surface": r = 6.37×10⁶ m + 400 km', { q: 1 }, { ans: 'sum' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.concept-escape',
    kind: 'conceptual',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §13.3',
    title: 'Bound or not',
    topics: ['escape', 'orbit'],
    lab: 'orbit',
    vars: {
      q: choice(
        [1, 'Escape speed and circular-orbit speed, at the same distance, are related by:'],
        [2, 'The total mechanical energy of a circular orbit is:'],
        [3, 'A craft launched at exactly escape speed, with no further push, arrives at infinity:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sqrt2', 2: 'negative', 3: 'rest' }[$.q] }),
    second: ($) => {
      const M = 5.96e24;
      const R = 6.37e6;
      const ratio = escapeSpeed(M, R) / circularOrbitSpeed(M, R);
      if ($.q === 1) return { ans: Math.abs(ratio - Math.SQRT2) < 1e-9 ? 'sqrt2' : 'same' };
      if ($.q === 2) return { ans: circularOrbitEnergy(1, M, R) < 0 ? 'negative' : 'zero' };
      return { ans: 'rest' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['sqrt2', 'Escape is √2 times the circular speed', 'The circular orbit has E = −GMm/(2r). Escape has E = 0, so the kinetic energy is twice as large and the speed is √2 times larger.'],
          ['same', 'They are the same speed', 'A circular orbit is bound. Escape is the edge of being bound. The speeds differ.'],
          ['double', 'Escape is twice the circular speed', 'Twice the speed would be four times the kinetic energy. Escape only needs twice the kinetic energy of the circle.'],
        ],
        2: [
          ['negative', 'Negative', 'The kinetic energy is half the size of the potential energy, and the potential energy is negative. The sum is −GMm/(2r). The orbit is bound.'],
          ['zero', 'Zero', 'Zero is escape, not a closed orbit. A circular orbit has energy left to climb, with a minus sign.'],
          ['positive', 'Positive', 'Positive energy is a hyperbola. The craft passes once and does not return.'],
        ],
        3: [
          ['rest', 'At rest', 'Escape spends the last of the kinetic energy as the potential energy reaches zero. Anything faster still has speed left at infinity.'],
          ['circular', 'At the circular-orbit speed for that huge radius', 'There is no circle at infinity. The circular speed falls as 1/√r and is gone when r is gone.'],
          ['same', 'Still moving at the launch speed', 'The launch speed was spent climbing. Only a launch faster than escape keeps speed at infinity.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Write the total energy. Zero separates bound from unbound. A circular orbit sits below zero, at minus its kinetic energy.',
      'Compare ½mv² for the circle, which equals GMm/(2r), with the kinetic energy that cancels −GMm/r. The ratio of those kinetic energies is 2, so the ratio of the speeds is √2.',
    ],
    steps: ($) => [['Escape is √2 times the circular speed.', 'The orbit’s total energy is negative.', 'Exact escape arrives at rest.'][$.q - 1]],
    sim: { scenario: 'escape', setup: (s) => { s.f = Math.SQRT2; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.3, "Escape from Earth": escape is √2 times the orbital speed at the same place', { q: 1 }, { ans: 'sqrt2' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.concept-area',
    kind: 'conceptual',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §13.5',
    title: 'What an ellipse keeps constant',
    topics: ['kepler'],
    lab: 'kepler',
    vars: {
      q: choice(
        [1, 'Two stretches of an orbit that take the same time:'],
        [2, 'A comet is fastest:'],
        [3, 'The period of the orbit is fixed by:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'areas', 2: 'peri', 3: 'axis' }[$.q] }),
    second: ($) => {
      if ($.q === 3) {
        const e0 = circularOrbitPeriod(2e30, AU);
        const e1 = circularOrbitPeriod(2e30, AU);
        return { ans: e0 === e1 ? 'axis' : 'shape' };
      }
      return { ans: $.q === 1 ? 'areas' : 'peri' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['areas', 'Sweep equal areas', 'The force is radial, so angular momentum is constant, and the area per time is L/(2m). Equal times mean equal areas. The arcs are not equal.'],
          ['arcs', 'Travel equal distances along the orbit', 'The speed changes. An equal arc near the star takes less time than the same arc far away.'],
          ['angles', 'Sweep equal angles at the star', 'Equal angles would be equal areas only on a circle. On an ellipse the near wedge is a longer, thinner slice.'],
        ],
        2: [
          ['peri', 'At perihelion, closest to the star', 'The same area in the same time has to be a longer arc when the radius is small. The comet is fastest there.'],
          ['apo', 'At aphelion, farthest from the star', 'That is the slow end. The wedge there is short and wide.'],
          ['same', 'At the same speed everywhere', 'Constant speed is the circle, which is the ellipse with eccentricity zero. A stretched orbit does not do that.'],
        ],
        3: [
          ['axis', 'The semi-major axis and the star’s mass', 'T² = (4π²/GM) a³. The eccentricity moves the perihelion and the aphelion and leaves the period alone, as long as a is fixed.'],
          ['peri', 'The perihelion alone', 'Two comets can share a perihelion and have different periods, if one is a long ellipse and the other is nearly round.'],
          ['shape', 'The eccentricity alone', 'Eccentricity has no period of its own. A circle and a long ellipse with the same a share a period.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Angular momentum about the star is constant because the force is along the radius. The area swept per time is that angular momentum divided by 2m.',
      'Kepler’s third law uses the semi-major axis. Stretching the ellipse at constant a does not change T.',
    ],
    steps: ($) => [['Equal times sweep equal areas.', 'The comet is fastest at perihelion.', 'The period follows the semi-major axis.'][$.q - 1]],
    sim: { scenario: 'wedge', setup: (s) => { s.nu0 = 180; s.e = 0.6; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.5, Kepler’s second law: equal areas in equal times', { q: 1 }, { ans: 'areas' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch13.concept-mass',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §13.4',
    title: 'What the orbital speed depends on',
    topics: ['orbit'],
    lab: 'orbit',
    vars: {
      q: choice(
        [1, 'You double the satellite’s mass and leave the orbit alone. The orbital speed:'],
        [2, 'You double the planet’s mass and leave the radius alone. The orbital speed:'],
        [3, 'You double the radius, measured from the center. The orbital speed:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'sqrt2', 3: 'down' }[$.q] }),
    second: ($) => {
      const v = circularOrbitSpeed(5.96e24, 6.77e6);
      if ($.q === 1) return { ans: circularOrbitSpeed(5.96e24, 6.77e6) === v ? 'same' : 'half' };
      if ($.q === 2) return { ans: Math.abs(circularOrbitSpeed(2 * 5.96e24, 6.77e6) / v - Math.SQRT2) < 1e-9 ? 'sqrt2' : 'double' };
      return { ans: circularOrbitSpeed(5.96e24, 2 * 6.77e6) < v ? 'down' : 'up' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['same', 'Stays the same', 'The mass appears in the force and in ma, and it cancels. A heavier satellite in the same orbit has the same speed.'],
          ['half', 'Is cut in half', 'That would be right if the force stayed fixed while the mass grew. The force grows too.'],
          ['double', 'Doubles', 'Nothing in √(GM/r) belongs to the satellite. Doubling its mass does not double the speed.'],
        ],
        2: [
          ['sqrt2', 'Grows by a factor of √2', 'The speed is √(GM/r). Doubling M multiplies the speed by √2, and the period falls by the same factor.'],
          ['same', 'Stays the same', 'The planet’s mass does not cancel. It is the source of the field.'],
          ['double', 'Doubles', 'The speed follows the square root of the mass, not the mass. Doubling M is not doubling v.'],
        ],
        3: [
          ['down', 'Falls by a factor of √2', 'v = √(GM/r). Doubling r divides the speed by √2. The period does not follow that factor. It grows by 2^(3/2).'],
          ['half', 'Falls by a factor of 2', 'Dividing the speed by 2 treats v as proportional to 1/r. The speed is proportional to 1/√r, so the factor is √2.'],
          ['up', 'Rises, because the path is longer', 'A longer path with a weaker pull is a slower orbit, not a faster one. The period grows, and it grows by more than the path length.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Write v = √(GM/r) and see which symbol you doubled. The satellite’s mass is not in it.',
      'A square root softens the change. Doubling what is inside the root multiplies the speed by √2, whether that thing is M or 1/r.',
    ],
    steps: ($) => [['The satellite’s mass cancels.', 'The speed grows by √2.', 'The speed falls by √2.'][$.q - 1]],
    sim: { scenario: 'iss', setup: (s) => { s.f = 1; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §13.4: the orbital speed does not contain the satellite’s mass', { q: 1 }, { ans: 'same' }),
    ],
  }),
];
