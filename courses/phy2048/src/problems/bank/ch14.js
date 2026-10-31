/** Ch 14 · Fluid mechanics. OpenStax University Physics Vol. 1, §§14.1–14.7. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  absolutePressure, buoyantForce, circleArea, flowSpeed, gaugePressure, hydraulicForce, hydraulicStroke,
  poiseuille, pressureDownstream, reynolds, submergedFraction, torricelli, uTubeHeight, wallForce,
} from '@flux/subjects/mechanics/fluids.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u10', ch: '14' };

export default [
  problem({
    ...U,
    id: 'ch14.dam',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.1',
    title: 'Force on a dam',
    topics: ['pressure', 'density'],
    lab: 'pressure-depth',
    vars: {
      rho: range(900, 1100, 10, 'kg/m³'),
      depth: range(20, 100, 5, 'm'),
      width: range(100, 800, 20, 'm'),
    },
    derive: ($) => wallForce($.rho, $.depth, $.width, G),
    second: ($) => {
      const p = ($.rho * $.depth * $.width * G) / (2 * $.width);
      return { p, F: p * $.depth * $.width };
    },
    text: (T) => `A dam is ${T.width} m wide and holds water ${T.depth} m deep. The water density is ${T.rho} kg/m³. Take g = ${G} m/s². Find the average pressure on the dam from the water, and the force on the dam.`,
    parts: [
      num('p', ($) => $.p, 'Pa', { label: 'average pressure' }),
      num('F', ($) => $.F, 'N', { label: 'force' }),
    ],
    hints: [
      'Pressure grows linearly with depth, so the average is the pressure at half the depth.',
      'The force is that average pressure times the wetted area, depth times width.',
    ],
    steps: ($) => [
      String.raw`$p = \rho g (h/2) = ${texNum($.p)}\ \mathrm{Pa}$`,
      String.raw`$F = pA = ${texNum($.F)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'dam',
      setup: (s, $) => { s.rho = $.rho; s.depth = $.depth; s.width = $.width; },
      read: (c) => ({ p: c.p, F: c.F }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.1, "What Force Must a Dam Withstand?"', {
        rho: 1000, depth: 80, width: 500,
      }, { p: 3.92e5, F: 1.57e10 }, {
        note: 'The book uses g = 9.80 m/s² and prints 3.92×10⁵ Pa and 1.57×10¹⁰ N. This bank uses g = 9.81 m/s². Both prints grade.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.barometer',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.2',
    title: 'A mercury column',
    topics: ['gauge', 'pressure'],
    lab: 'pressure-depth',
    vars: {
      rho: range(1000, 14000, 100, 'kg/m³'),
      h: range(0.2, 2, 0.01, 'm'),
    },
    derive: ($) => ({ p: gaugePressure($.rho, $.h, G) }),
    second: ($) => ({ p: ($.rho * $.h * 1 * G) / 1 }),
    text: (T) => `A barometer column has density ${T.rho} kg/m³ and height ${T.h} m. Find the gauge pressure at the bottom of the column. Take g = ${G} m/s².`,
    parts: [
      num('p', ($) => $.p, 'Pa', { label: 'gauge pressure' }),
    ],
    hints: [
      'Gauge pressure under a still column is ρgh. The atmosphere is what this column is balancing.',
      'The area of the tube cancels. A wider tube does not measure a different pressure.',
    ],
    steps: ($) => [String.raw`$p = \rho g h = ${texNum($.p)}\ \mathrm{Pa}$`],
    sim: {
      scenario: 'dam',
      setup: (s, $) => { s.rho = $.rho; s.depth = $.h; s.width = 1; },
      read: (c) => ({ p: c.pBottom }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.2, a mercury column about 76 cm tall, density 13.6 times water', {
        rho: 13600, h: 0.76,
      }, { p: 1.014e5 }, {
        note: 'The section says approximately 76 cm and does not print the pascal. 1.014×10⁵ Pa is ρgh with g = 9.81 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.utube',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.2',
    title: 'Two liquids in a U-tube',
    topics: ['gauge', 'density'],
    lab: 'pressure-depth',
    vars: {
      rho1: range(1000, 1400, 20, 'kg/m³'),
      rho2: range(400, 900, 20, 'kg/m³'),
      h2: range(0.05, 0.4, 0.01, 'm'),
    },
    derive: ($) => uTubeHeight($.rho1, $.rho2, $.h2),
    second: ($) => {
      const h1 = $.h2 * $.rho2 / $.rho1;
      return { h1, diff: $.h2 - h1 };
    },
    text: (T) => `An open U-tube holds a liquid of density ${T.rho1} kg/m³. A liquid of density ${T.rho2} kg/m³ is poured into one arm and stands ${T.h2} m above the interface. Find the height of the heavier liquid above the interface, and how much higher the lighter side stands.`,
    parts: [
      num('h1', ($) => $.h1, 'm', { label: 'heavier height' }),
      num('diff', ($) => $.diff, 'm', { label: 'difference' }),
    ],
    hints: [
      'At the interface the pressures match, so ρ1 h1 = ρ2 h2. The open ends are both at atmospheric pressure.',
      'The difference in the two free surfaces is h2 − h1.',
    ],
    steps: ($) => [
      String.raw`$h_1 = \rho_2 h_2 / \rho_1 = ${texNum($.h1)}\ \mathrm{m}$`,
      String.raw`$h_2 - h_1 = ${texNum($.diff)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'utube',
      setup: (s, $) => { s.rho1 = $.rho1; s.rho2 = $.rho2; s.h2 = $.h2; },
      read: (c) => ({ h1: c.h1, diff: c.diff }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.2, "Fluid Heights in an Open U-Tube", the balance ρ1 h1 = ρ2 h2', {
        rho1: 1000, rho2: 800, h2: 0.2,
      }, { h1: 0.16, diff: 0.04 }, {
        note: 'The example is symbolic. These two densities and the 0.20 m column are ours. The balance is the example’s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.brakes',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.3',
    title: 'Force at a wheel cylinder',
    topics: ['hydraulics', 'pressure'],
    lab: 'brake-hydraulics',
    vars: {
      F1: range(200, 800, 20, 'N'),
      d1: range(0.4, 1, 0.05, 'cm', 0.01),
      d2: range(1.5, 6, 0.1, 'cm', 0.01),
    },
    derive: ($) => ({ F2: hydraulicForce($.F1, $.d1, $.d2) }),
    second: ($) => ({ F2: $.F1 * (circleArea($.d2) / circleArea($.d1)) }),
    text: (T) => `A master piston of diameter ${T.d1} cm is pushed with ${T.F1} N. Each wheel piston has diameter ${T.d2} cm. Find the force at one wheel piston.`,
    parts: [
      num('F2', ($) => $.F2, 'N', { label: 'wheel force' }),
    ],
    hints: [
      'The pressure is the same in both pistons. Force equals pressure times area.',
      'Area scales with the square of the diameter. The force ratio is (d2/d1)².',
    ],
    steps: ($) => [String.raw`$F_2 = F_1 (d_2/d_1)^2 = ${texNum($.F2)}\ \mathrm{N}$`],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.Fpedal = $.F1; s.lever = 1; s.d1 = $.d1; s.d2 = $.d2; },
      read: (c) => ({ F2: c.F2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.3, "Calculating Force on Wheel Cylinders"', {
        F1: 500, d1: 0.5, d2: 2.5,
      }, { F2: 1.25e4 }, {
        note: 'The book prints 1.25×10⁴ N at each wheel. The 100 N on the pedal is before the lever. This part starts from the 500 N on the master piston.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.stroke',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.3',
    title: 'How far the wheel piston moves',
    topics: ['hydraulics'],
    lab: 'brake-hydraulics',
    vars: {
      F1: range(200, 800, 20, 'N'),
      d1: range(0.4, 1, 0.05, 'cm', 0.01),
      d2: range(1.5, 6, 0.1, 'cm', 0.01),
      x1: range(0.005, 0.04, 0.001, 'm'),
    },
    derive: ($) => {
      const stroke = hydraulicStroke($.F1, $.d1, $.d2, $.x1);
      return { F2: stroke.F2, x2: stroke.x2 };
    },
    second: ($) => {
      const ratio = ($.d2 / $.d1) ** 2;
      return { F2: $.F1 * ratio, x2: $.x1 / ratio };
    },
    text: (T) => `The master piston of diameter ${T.d1} cm moves ${T.x1} m under a force of ${T.F1} N. The wheel piston has diameter ${T.d2} cm. The fluid is incompressible. Find the wheel force and the wheel travel.`,
    parts: [
      num('F2', ($) => $.F2, 'N', { label: 'wheel force' }),
      num('x2', ($) => $.x2, 'm', { label: 'wheel travel' }),
    ],
    hints: [
      'The force ratio is the area ratio, (d2/d1)².',
      'The volume pushed in equals the volume pushed out, so the travel ratio is the inverse of the area ratio. The works match.',
    ],
    steps: ($) => [
      String.raw`$F_2 = ${texNum($.F2)}\ \mathrm{N}$`,
      String.raw`$x_2 = ${texNum($.x2)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.Fpedal = $.F1; s.lever = 1; s.d1 = $.d1; s.d2 = $.d2; s.x1 = $.x1; },
      read: (c) => ({ F2: c.F2, x2: c.x2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.3, the brake pistons, with a 2.00 cm master travel we chose', {
        F1: 500, d1: 0.5, d2: 2.5, x1: 0.02,
      }, { F2: 1.25e4, x2: 8e-4 }, {
        note: 'The force is the printed 1.25×10⁴ N. The section says the wheel moves less and does not print a distance. 0.800 mm is A1 x1 / A2.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.woman',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.4',
    title: 'Density of a floating person',
    topics: ['buoyancy', 'density'],
    lab: 'buoyancy',
    vars: {
      f: range(0.8, 0.99, 0.01, ''),
      rhoF: range(900, 1100, 10, 'kg/m³'),
      mass: range(40, 90, 1, 'kg'),
    },
    derive: ($) => ({
      rho: $.f * $.rhoF,
      V: $.mass / ($.f * $.rhoF),
    }),
    second: ($) => ({
      rho: $.rhoF * submergedFraction($.f * $.rhoF, $.rhoF),
      V: $.mass / ($.f * $.rhoF),
    }),
    text: (T) => `A person of mass ${T.mass} kg floats in a fluid of density ${T.rhoF} kg/m³ with a fraction ${T.f} of her volume under the surface. Find her average density, and her volume.`,
    parts: [
      num('rho', ($) => $.rho, 'kg/m³', { label: 'density' }),
      num('V', ($) => $.V, 'm³', { label: 'volume' }),
    ],
    hints: [
      'While she floats, the submerged fraction equals her density divided by the fluid density.',
      'Volume is mass divided by that density.',
    ],
    steps: ($) => [
      String.raw`$\rho = f\rho_{\mathrm{f}} = ${texNum($.rho)}\ \mathrm{kg/m^3}$`,
      String.raw`$V = m/\rho = ${texNum($.V)}\ \mathrm{m^3}$`,
    ],
    sim: {
      scenario: 'woman',
      setup: (s, $) => { s.rhoF = $.rhoF; s.rhoObj = $.f * $.rhoF; s.mass = $.mass; },
      read: (c, s) => ({ V: c.V, rho: s.rhoObj }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.4, "Calculating Average Density"', {
        f: 0.97, rhoF: 1000, mass: 60,
      }, { rho: 970, V: 0.06186 }, {
        note: 'The book prints 970 kg/m³. The volume is mass over that density. The book does not print it.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.apparent',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.4',
    title: 'Apparent weight under water',
    topics: ['buoyancy'],
    lab: 'buoyancy',
    vars: {
      mass: range(0.5, 8, 0.1, 'kg'),
      rhoObj: range(2000, 8000, 100, 'kg/m³'),
      rhoF: range(900, 1100, 10, 'kg/m³'),
    },
    valid: ($) => $.rhoObj > $.rhoF,
    derive: ($) => {
      const V = $.mass / $.rhoObj;
      const weight = $.mass * G;
      const Fb = buoyantForce($.rhoF, V, G);
      return { weight, Fb, apparent: weight - Fb };
    },
    second: ($) => {
      const V = $.mass / $.rhoObj;
      const Fb = $.rhoF * V * G;
      return { weight: $.mass * G, Fb, apparent: $.mass * G - Fb };
    },
    text: (T) => `A block of mass ${T.mass} kg and density ${T.rhoObj} kg/m³ is held fully under a fluid of density ${T.rhoF} kg/m³. Take g = ${G} m/s². Find its true weight, the buoyant force, and the apparent weight.`,
    parts: [
      num('weight', ($) => $.weight, 'N', { label: 'weight' }),
      num('Fb', ($) => $.Fb, 'N', { label: 'buoyant force' }),
      num('apparent', ($) => $.apparent, 'N', { label: 'apparent weight' }),
    ],
    hints: [
      'The true weight is mg. The volume is mass divided by the object’s density.',
      'Fully under, the displaced volume is the whole block. Apparent weight is the true weight minus the buoyant force.',
    ],
    steps: ($) => [
      String.raw`$mg = ${texNum($.weight)}\ \mathrm{N}$`,
      String.raw`$F_B = ${texNum($.Fb)}\ \mathrm{N}$`,
      String.raw`$F_{\mathrm{app}} = ${texNum($.apparent)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'sink',
      setup: (s, $) => { s.mass = $.mass; s.rhoObj = $.rhoObj; s.rhoF = $.rhoF; },
      read: (c) => ({ weight: c.weight, Fb: c.Fb, apparent: c.apparent }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.4, the submerged-weighing method, for a 2.70 kg block of density 2700 kg/m³', {
        mass: 2.7, rhoObj: 2700, rhoF: 1000,
      }, { weight: 26.487, Fb: 9.81, apparent: 16.677 }, {
        note: 'The section describes weighing a coin under a fluid and does not print this block. The wants are mg, ρf V g, and the difference, with g = 9.81 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.nozzle',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.5',
    title: 'Speed through a nozzle',
    topics: ['continuity'],
    lab: 'bernoulli',
    vars: {
      Q: range(0.2, 2, 0.1, 'L/s', 0.001),
      d1: range(1, 3, 0.1, 'cm', 0.01),
      d2: range(0.2, 0.8, 0.05, 'cm', 0.01),
    },
    valid: ($) => $.d1 > $.d2 * 1.2,
    derive: ($) => ({
      v1: flowSpeed($.Q, circleArea($.d1)),
      v2: flowSpeed($.Q, circleArea($.d2)),
    }),
    second: ($) => ({
      v1: $.Q / (Math.PI * ($.d1 / 2) ** 2),
      v2: $.Q * ($.d1 / $.d2) ** 2 / (Math.PI * ($.d1 / 2) ** 2),
    }),
    text: (T) => `Water flows at ${T.Q} L/s through a hose of diameter ${T.d1} cm and then through a nozzle of diameter ${T.d2} cm. Find the speed in the hose and the speed in the nozzle.`,
    parts: [
      num('v1', ($) => $.v1, 'm/s', { label: 'hose speed' }),
      num('v2', ($) => $.v2, 'm/s', { label: 'nozzle speed' }),
    ],
    hints: [
      'The volume flow is area times speed. Convert litres per second to cubic metres per second before dividing.',
      'The nozzle speed is the hose speed times (d1/d2)².',
    ],
    steps: ($) => [
      String.raw`$v_1 = ${texNum($.v1)}\ \mathrm{m/s}$`,
      String.raw`$v_2 = ${texNum($.v2)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'nozzle',
      setup: (s, $) => { s.Q = $.Q; s.d1 = $.d1; s.d2 = $.d2; s.h1 = 0; s.h2 = 0; },
      read: (c) => ({ v1: c.v1, v2: c.v2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.5, "Calculating Fluid Speed through a Nozzle"', {
        Q: 0.5, d1: 1.8, d2: 0.5,
      }, { v1: 1.96, v2: 25.5 }, {
        note: 'The book uses π = 3.14 and prints 1.96 m/s and 25.5 m/s. The radii are 0.900 cm and 0.250 cm.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.hose-p',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.6',
    title: 'Pressure in the hose',
    topics: ['bernoulli', 'continuity'],
    lab: 'bernoulli',
    vars: {
      v1: range(1, 4, 0.1, 'm/s'),
      v2: range(10, 40, 1, 'm/s'),
      p2: range(1.0e5, 1.05e5, 1e3, 'Pa'),
      rho: range(900, 1100, 10, 'kg/m³'),
    },
    valid: ($) => $.v2 > $.v1 * 2,
    derive: ($) => ({
      p1: pressureDownstream({ p1: $.p2, v1: $.v2, h1: 0, v2: $.v1, h2: 0, rho: $.rho, g: G }),
    }),
    second: ($) => ({
      p1: $.p2 + 0.5 * $.rho * ($.v2 * $.v2 - $.v1 * $.v1),
    }),
    text: (T) => `Water of density ${T.rho} kg/m³ moves at ${T.v1} m/s in a hose and at ${T.v2} m/s in the nozzle. The nozzle is open to a pressure of ${T.p2} Pa, and the hose and the nozzle are at the same height. Find the pressure in the hose.`,
    parts: [
      num('p1', ($) => $.p1, 'Pa', { label: 'hose pressure' }),
    ],
    hints: [
      'Bernoulli’s sum is the same at both ends. There is no change in height.',
      'The faster end has the lower pressure. Solve for the slower end.',
    ],
    steps: ($) => [String.raw`$p_1 = ${texNum($.p1)}\ \mathrm{Pa}$`],
    sim: {
      scenario: 'nozzle',
      setup: (s, $) => { s.p1 = $.p1; s.rho = $.rho; s.h2 = 0; },
      read: (c, s) => ({ p1: s.p1 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.6, "Calculating Pressure"', {
        v1: 1.96, v2: 25.5, p2: 1.01e5, rho: 1000,
      }, { p1: 4.24e5 }, {
        note: 'The book prints 4.24×10⁵ N/m² from these speeds and 1.01×10⁵ N/m² at the nozzle.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.fire',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.6',
    title: 'A nozzle up a ladder',
    topics: ['bernoulli', 'continuity'],
    lab: 'fire-hose',
    vars: {
      Q: range(10, 60, 2, 'L/s', 0.001),
      d1: range(4, 8, 0.2, 'cm', 0.01),
      d2: range(1.5, 3.5, 0.1, 'cm', 0.01),
      p1: range(0.8e6, 2.2e6, 0.02e6, 'Pa'),
      h: range(0, 20, 1, 'm'),
    },
    valid: ($) => $.d1 > $.d2 * 1.3,
    derive: ($) => {
      const v1 = flowSpeed($.Q, circleArea($.d1));
      const v2 = flowSpeed($.Q, circleArea($.d2));
      const p2 = pressureDownstream({ p1: $.p1, v1, h1: 0, v2, h2: $.h, rho: 1000, g: G });
      return { v1, v2, p2 };
    },
    second: ($) => {
      const v1 = $.Q / (Math.PI * ($.d1 / 2) ** 2);
      const v2 = $.Q / (Math.PI * ($.d2 / 2) ** 2);
      return { v1, v2, p2: $.p1 + 500 * (v1 * v1 - v2 * v2) - 1000 * G * $.h };
    },
    text: (T) => `A hose of diameter ${T.d1} cm carries ${T.Q} L/s of water at a gauge pressure of ${T.p1} Pa. The nozzle has diameter ${T.d2} cm and is ${T.h} m higher. Water density is 1000 kg/m³ and g is ${G} m/s². Find both speeds and the gauge pressure at the nozzle.`,
    parts: [
      num('v1', ($) => $.v1, 'm/s', { label: 'hose speed' }),
      num('v2', ($) => $.v2, 'm/s', { label: 'nozzle speed' }),
      num('p2', ($) => $.p2, 'Pa', { label: 'nozzle pressure' }),
    ],
    hints: [
      'Each speed is the volume flow divided by that station’s area.',
      'Bernoulli: the nozzle pays for a higher speed and a higher place, so its pressure is lower.',
    ],
    steps: ($) => [
      String.raw`$v_1 = ${texNum($.v1)}\ \mathrm{m/s}$`,
      String.raw`$v_2 = ${texNum($.v2)}\ \mathrm{m/s}$`,
      String.raw`$p_2 = ${texNum($.p2)}\ \mathrm{Pa}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => { s.Q = $.Q; s.d1 = $.d1; s.d2 = $.d2; s.p1 = $.p1; s.h = $.h; s.rho = 1000; },
      read: (c) => ({ v1: c.v1, v2: c.v2, p2: c.p2 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.6, "Calculating Pressure: A Fire Hose Nozzle"', {
        Q: 40, d1: 6.4, d2: 3, p1: 1.62e6, h: 10,
      }, { v1: 12.4, v2: 56.6, p2: -1923 }, {
        note: 'The book rounds the speeds to 12.4 m/s and 56.6 m/s and prints −2.9 kPa. With g = 9.81 m/s² and an unrounded π the nozzle pressure is −1923 Pa. The printed speeds still grade. The printed pressure does not, so the case want is ours.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.tank',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.6',
    title: 'Speed from a hole in a tank',
    topics: ['bernoulli'],
    lab: 'bernoulli',
    vars: {
      h: range(1, 12, 0.5, 'm'),
    },
    derive: ($) => ({ v: torricelli($.h, G) }),
    second: ($) => ({ v: Math.sqrt(2 * G * $.h) }),
    text: (T) => `A large tank is open to the air. A small hole is ${T.h} m below the surface. Find the speed of the water leaving the hole. Take g = ${G} m/s². The surface is nearly still.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'exit speed' }),
    ],
    hints: [
      'Both ends are at atmospheric pressure. The surface speed is negligible.',
      'Bernoulli then says the exit speed is the free-fall speed from that height, √(2gh).',
    ],
    steps: ($) => [String.raw`$v = \sqrt{2gh} = ${texNum($.v)}\ \mathrm{m/s}$`],
    sim: {
      scenario: 'tank',
      setup: (s, $) => { s.hTank = $.h; },
      read: (c) => ({ v: c.vExit }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.6, Torricelli’s result, for a hole 5.00 m down', {
        h: 5,
      }, { v: 9.9 }, {
        note: 'The section states √(2gh) and does not print this tank. 9.90 m/s uses g = 9.81 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.poiseuille',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.7',
    title: 'Laminar flow in a duct',
    topics: ['viscosity'],
    vars: {
      dp: range(0.02, 0.1, 0.002, 'Pa'),
      r: range(0.04, 0.12, 0.005, 'm'),
      eta: range(1.5e-5, 2.2e-5, 1e-6, 'Pa·s'),
      L: range(10, 40, 2, 'm'),
    },
    derive: ($) => ({ Q: poiseuille({ dp: $.dp, r: $.r, eta: $.eta, L: $.L }) }),
    second: ($) => ({ Q: ($.dp * Math.PI * $.r ** 4) / (8 * $.eta * $.L) }),
    text: (T) => `Air flows through a duct of radius ${T.r} m and length ${T.L} m. The pressure difference is ${T.dp} Pa and the viscosity is ${T.eta} Pa·s. Assume laminar flow. Find the volume flow rate.`,
    parts: [
      num('Q', ($) => $.Q, 'm³/s', { label: 'volume flow' }),
    ],
    hints: [
      'Poiseuille’s law: Q = Δp π r⁴ / (8 η L).',
      'The radius is to the fourth power. Halving it does much more than halving the length.',
    ],
    steps: ($) => [String.raw`$Q = ${texNum($.Q)}\ \mathrm{m^3/s}$`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.7, "Using Flow Rate: Air Conditioning Systems"', {
        dp: 0.054, r: 0.09, eta: 1.81e-5, L: 20,
      }, { Q: 3.84e-3 }, {
        note: 'The book uses π = 3.14 and prints 3.84×10⁻³ m³/s. The viscosity 0.0181 mPa·s is 1.81×10⁻⁵ Pa·s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch14.reynolds',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.7',
    title: 'Is the duct laminar?',
    topics: ['viscosity'],
    vars: {
      Q: range(1e-3, 8e-3, 2e-4, 'm³/s'),
      r: range(0.04, 0.12, 0.005, 'm'),
      rho: range(1.1, 1.4, 0.02, 'kg/m³'),
      eta: range(1.5e-5, 2.2e-5, 1e-6, 'Pa·s'),
    },
    derive: ($) => {
      const v = flowSpeed($.Q, Math.PI * $.r * $.r);
      return { v, NR: reynolds({ rho: $.rho, v, r: $.r, eta: $.eta }) };
    },
    second: ($) => {
      const v = $.Q / (Math.PI * $.r ** 2);
      return { v, NR: (2 * $.rho * v * $.r) / $.eta };
    },
    text: (T) => `Air of density ${T.rho} kg/m³ and viscosity ${T.eta} Pa·s flows at ${T.Q} m³/s through a duct of radius ${T.r} m. Find the mean speed and the Reynolds number. The section writes N_R = 2ρvr/η and calls the flow laminar below 2000.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'mean speed' }),
      num('NR', ($) => $.NR, '', { label: 'Reynolds number' }),
    ],
    hints: [
      'The mean speed is the volume flow divided by the cross-sectional area.',
      'The 2 in the Reynolds number is there because the section uses the diameter, which is 2r.',
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$N_R = ${texNum($.NR)}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.7, "Using Flow Rate: Turbulent Flow or Laminar Flow?"', {
        Q: 3.84e-3, r: 0.09, rho: 1.23, eta: 1.81e-5,
      }, { v: 0.15, NR: 1835 }, {
        note: 'The book prints 0.15 m/s and N_R = 1835, using π = 3.14. Both sit inside the grader. The flow is laminar on the section’s line of 2000.',
      }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch14.concept-shape',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §14.1',
    title: 'Which container pushes harder',
    topics: ['pressure'],
    lab: 'pressure-depth',
    vars: {
      q: choice(
        [1, 'Two dams hold water to the same depth. One is twice as wide. The average pressure on the wider dam:'],
        [2, 'The force on that wider dam, compared with the narrower one:'],
        [3, 'A lake is doubled in area and kept at the same depth at the dam. The force on the dam:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'twice', 3: 'same' }[$.q] }),
    second: ($) => {
      const narrow = wallForce(1000, 80, 500, G);
      const wide = wallForce(1000, 80, 1000, G);
      if ($.q === 1) return { ans: Math.abs(wide.p - narrow.p) < 1 ? 'same' : 'twice' };
      if ($.q === 2) return { ans: Math.abs(wide.F / narrow.F - 2) < 1e-9 ? 'twice' : 'same' };
      return { ans: 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['same', 'stays the same', 'Pressure depends on depth. Width is not in p = ρgh.'],
        ['twice', 'doubles', 'Force is pressure times area. Twice the width is twice the area, at the same pressure.'],
        ['drops', 'drops', 'Nothing in the depth changed, so neither the pressure nor the force on the dam drops.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Write p = ρgh and notice which quantities are in it.',
      'The force on the dam uses the dam’s own area, not the area of the lake behind it.',
    ],
    steps: () => ['Pressure follows the depth. Force follows pressure times the area of the face.'],
    sim: { scenario: 'dam', setup: (s) => { s.depth = 80; s.width = 500; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.1, the question after the dam: doubling the lake’s area at the same depth', { q: 3 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch14.concept-gauge',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §14.2',
    title: 'Gauge and absolute',
    topics: ['gauge'],
    lab: 'pressure-depth',
    vars: {
      q: choice(
        [1, 'A tyre gauge reads the pressure:'],
        [2, 'Absolute pressure equals:'],
        [3, 'In an open U-tube the two free surfaces feel:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'above', 2: 'sum', 3: 'air' }[$.q] }),
    second: ($) => {
      const abs = absolutePressure(1.01e5, 1000, 10, G);
      const gau = gaugePressure(1000, 10, G);
      if ($.q === 1) return { ans: 'above' };
      if ($.q === 2) return { ans: Math.abs(abs - (1.01e5 + gau)) < 1 ? 'sum' : 'above' };
      return { ans: 'air' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['above', 'above atmospheric pressure', 'A gauge reads zero in the open air. It reports the extra pressure.'],
        ['sum', 'gauge pressure plus atmospheric pressure', 'Absolute pressure is the gauge reading added to the pressure of the air.'],
        ['air', 'the same atmospheric pressure', 'Both ends are open, so both surfaces are at the pressure of the room.'],
      ], ($) => $.ans),
    ],
    hints: [
      'A gauge that reads zero in the room is not reading absolute pressure.',
      'The open ends of a U-tube are the reason the atmospheric term cancels.',
    ],
    steps: () => ['Absolute pressure is the gauge pressure plus the pressure on the free surface.'],
    sim: { scenario: 'utube' },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.2, gauge pressure and absolute pressure', { q: 2 }, { ans: 'sum' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch14.concept-float',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §14.4',
    title: 'What decides the waterline',
    topics: ['buoyancy'],
    lab: 'buoyancy',
    vars: {
      q: choice(
        [1, 'A person floats with a fraction of her volume under water. That fraction equals:'],
        [2, 'She doubles her mass and keeps the same density. The submerged fraction:'],
        [3, 'An object denser than the fluid, held fully under, has an apparent weight equal to:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'ratio', 2: 'same', 3: 'less' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: Math.abs(submergedFraction(970, 1000) - 0.97) < 1e-9 ? 'ratio' : 'mass' };
      if ($.q === 2) return { ans: submergedFraction(970, 1000) === submergedFraction(970, 1000) ? 'same' : 'ratio' };
      const weight = 2.7 * G;
      const Fb = buoyantForce(1000, 2.7 / 2700, G);
      return { ans: weight - Fb < weight ? 'less' : 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['ratio', 'her density divided by the fluid density', 'The buoyant force has to match the weight, so the displaced fraction is the density ratio.'],
        ['same', 'stays the same', 'Mass cancelled. The fraction is a ratio of densities.'],
        ['less', 'her true weight minus the buoyant force', 'The fluid still pushes up. The scale, or the hand, supplies only the difference.'],
        ['mass', 'her mass alone', 'Mass is not in the fraction. Two people of the same density float at the same waterline.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Set the buoyant force equal to the weight and cancel the volume that both sides share.',
      'A submerged object still displaces fluid. The apparent weight is what is left after that push.',
    ],
    steps: () => ['The waterline is a density ratio. Apparent weight is the true weight minus the buoyant force.'],
    sim: { scenario: 'woman' },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.4, fraction submerged = ρ_obj / ρ_fluid', { q: 1 }, { ans: 'ratio' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch14.concept-narrow',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §14.6',
    title: 'Where the pressure drops',
    topics: ['bernoulli', 'continuity'],
    lab: 'bernoulli',
    vars: {
      q: choice(
        [1, 'A hose narrows into a nozzle. The speed:'],
        [2, 'At the same height, the pressure in the nozzle, compared with the hose:'],
        [3, 'Raising the nozzle up a ladder, at the same speeds:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'up', 2: 'down', 3: 'down' }[$.q] }),
    second: ($) => {
      const v1 = flowSpeed(5e-4, circleArea(0.018));
      const v2 = flowSpeed(5e-4, circleArea(0.005));
      const p = pressureDownstream({ p1: 4.24e5, v1, h1: 0, v2, h2: 0, rho: 1000, g: G });
      if ($.q === 1) return { ans: v2 > v1 ? 'up' : 'down' };
      if ($.q === 2) return { ans: p < 4.24e5 ? 'down' : 'up' };
      const raised = pressureDownstream({ p1: 4.24e5, v1, h1: 0, v2, h2: 10, rho: 1000, g: G });
      return { ans: raised < p ? 'down' : 'up' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['up', 'rises', 'The same volume flow has to pass a smaller area, so the speed rises.'],
        ['down', 'falls', 'Bernoulli spends the shared sum on speed or on height. Either one leaves less for pressure.'],
        ['same', 'stays the same', 'A change in area or in height moves the pressure. It does not stay put.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Continuity is about area times speed. Bernoulli is about pressure, speed, and height together.',
      'The nozzle is open to the air, which is why its pressure can sit near atmospheric while the hose is higher.',
    ],
    steps: () => ['Narrower means faster. Faster, or higher, means a lower pressure.'],
    sim: { scenario: 'nozzle' },
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.6, the hose pressure is higher than the nozzle pressure', { q: 2 }, { ans: 'down' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch14.concept-flow',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §14.7',
    title: 'What changes a laminar flow',
    topics: ['viscosity'],
    vars: {
      q: choice(
        [1, 'In laminar pipe flow, halving the radius, with the pressure difference fixed:'],
        [2, 'The section calls a flow laminar when the Reynolds number is:'],
        [3, 'Doubling the length of the duct, with everything else fixed:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sixteenth', 2: 'below', 3: 'half' }[$.q] }),
    second: ($) => {
      const Q = poiseuille({ dp: 0.054, r: 0.09, eta: 1.81e-5, L: 20 });
      const halfR = poiseuille({ dp: 0.054, r: 0.045, eta: 1.81e-5, L: 20 });
      const long = poiseuille({ dp: 0.054, r: 0.09, eta: 1.81e-5, L: 40 });
      if ($.q === 1) return { ans: Math.abs(halfR / Q - 1 / 16) < 1e-9 ? 'sixteenth' : 'half' };
      if ($.q === 2) return { ans: 'below' };
      return { ans: Math.abs(long / Q - 0.5) < 1e-9 ? 'half' : 'sixteenth' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['sixteenth', 'cuts the flow to 1/16', 'Poiseuille’s law has r⁴. Half the radius is one sixteenth of the flow.'],
        ['below', 'below 2000', 'The duct example treats 1835 as laminar because it is under 2000.'],
        ['half', 'halves the flow', 'The length is in the denominator once. Twice the length is half the flow.'],
        ['same', 'leaves the flow unchanged', 'Radius and length are both in the law. Changing either one changes the flow.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Count the power of the radius in Q = Δp π r⁴ / (8 η L).',
      'The Reynolds number in this section uses the diameter, and 2000 is the line they draw.',
    ],
    steps: () => ['The radius enters to the fourth power. The length enters once, in the denominator.'],
    cases: [
      kase('OpenStax University Physics Vol. 1 §14.7, halving the radius cuts the flow to 6.25%', { q: 1 }, { ans: 'sixteenth' }),
    ],
  }),
];
