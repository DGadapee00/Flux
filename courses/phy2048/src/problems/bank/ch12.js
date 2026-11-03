/** Ch 12 · Static equilibrium and elasticity. OpenStax University Physics Vol. 1, §§12.1–12.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  avgShear, axialStress, bilinear, normalStrain, permanentSet, segmentElongation,
} from '@flux/subjects/mechanics/materials.js';
import {
  axleSplit, boardReactions, boardReactionsAboutRight, cableStrut, smoothLadder, steepShallow,
  stickBalance, verticalForearm,
} from '@flux/subjects/mechanics/statics.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u8', ch: '12' };

const rodOf = ($) => {
  const force = $.m * $.g;
  const area = $.area * 1e-4;
  const modulus = $.E * 1e9;
  const stress = axialStress(force, area);
  const delta = segmentElongation(force, $.L, area, modulus);
  return { stress, delta, force };
};

const pillarOf = ($) => {
  const area = $.area;
  const modulus = $.E * 1e9;
  const force = $.rho * area * $.h * $.g + $.sculpt;
  return { stress: force / area, strain: force / (area * modulus), force };
};

export default [
  problem({
    ...U,
    id: 'ch12.car',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Where the car’s center sits',
    topics: ['equilibrium'],
    lab: 'car-balance',
    vars: {
      d: range(2, 3.5, 0.1, 'm'),
      share: range(0.4, 0.7, 0.01, ''),
      weight: range(8000, 20000, 500, 'N'),
      h: range(0.4, 0.9, 0.05, 'm'),
      a: range(0, 4, 0.5, 'm/s²'),
    },
    derive: ($) => axleSplit({
      wheelbase: $.d, weight: $.weight, frontShare: $.share, height: $.h, decel: $.a, g: G,
    }),
    second: ($) => {
      const xRear = $.share * $.d;
      const transfer = ($.weight * $.a * $.h) / (G * $.d);
      const rear = $.weight * (1 - $.share) - transfer;
      return { xRear, front: $.weight - rear, rear, transfer };
    },
    text: (T) => `A car has a wheelbase of ${T.d} m. At rest, a fraction ${T.share} of its weight sits on the front axle. The weight is ${T.weight} N, the center is ${T.h} m off the ground, and the car then brakes at ${T.a} m/s². Take g = ${G} m/s². Find the center’s distance ahead of the rear axle, and the two axle forces while braking.`,
    parts: [
      num('xRear', ($) => $.xRear, 'm', { label: 'center, ahead of the rear axle' }),
      num('front', ($) => $.front, 'N', { label: 'front axle' }),
      num('rear', ($) => $.rear, 'N', { label: 'rear axle' }),
    ],
    hints: [
      'At rest, the front share of the weight times the wheelbase is the distance from the rear axle to the center. The weight cancels.',
      'Braking adds W a h / (g d) to the front axle and takes the same amount off the rear. The center does not move.',
    ],
    steps: ($) => [
      String.raw`$x = ${texNum($.share)}\times ${texNum($.d)} = ${texNum($.xRear)}\ \mathrm{m}$`,
      String.raw`Front $${texNum($.front)}\ \mathrm{N}$, rear $${texNum($.rear)}\ \mathrm{N}$. The shift is $${texNum($.transfer)}\ \mathrm{N}$.`,
    ],
    sim: {
      scenario: 'level',
      setup: (s, $) => {
        Object.assign(s, { d: $.d, share: $.share, weight: $.weight, h: $.h, a: $.a, g: G });
      },
      read: (c) => ({ xRear: c.xRear, front: c.front, rear: c.rear }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.1, "Center of Gravity of a Car": 2.5 m wheelbase, 52% on the front wheels', {
        d: 2.5, share: 0.52, weight: 10000, h: 0.55, a: 0,
      }, { xRear: 1.3, front: 5200, rear: 4800 }, {
        note: 'The book cancels the weight and prints 1.3 m. The 10,000 N and the 0.55 m height are ours, so the axle forces have a scale. With no braking the shift is zero.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.beam',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'A person on a scaffold',
    topics: ['beam', 'equilibrium'],
    lab: 'beam',
    vars: {
      L: range(4, 8, 0.5, 'm'),
      inset: range(0, 1, 0.25, 'm'),
      mBoard: range(20, 100, 5, 'kg'),
      mPerson: range(40, 100, 5, 'kg'),
      x: range(0.5, 3.5, 0.5, 'm'),
    },
    derive: ($) => {
      const ends = boardReactions({
        length: $.L, inset: $.inset, weight: $.mBoard * G, load: $.mPerson * G, at: $.x,
      });
      return { left: ends.left, right: ends.right };
    },
    second: ($) => {
      const ends = boardReactionsAboutRight({
        length: $.L, inset: $.inset, weight: $.mBoard * G, load: $.mPerson * G, at: $.x,
      });
      return { left: ends.left, right: ends.right };
    },
    valid: ($) => $.x < $.L - $.inset && $.x > $.inset,
    text: (T) => `A uniform board of mass ${T.mBoard} kg and length ${T.L} m is held by two supports, each ${T.inset} m in from an end. A person of mass ${T.mPerson} kg stands ${T.x} m from the left end. Take g = ${G} m/s². Find the two upward support forces.`,
    parts: [
      num('left', ($) => $.left, 'N', { label: 'left support' }),
      num('right', ($) => $.right, 'N', { label: 'right support' }),
    ],
    hints: [
      'The board’s weight acts at its center. Moments about one support give the other support. The two forces then add up to both weights.',
      'A support set in from the end still uses the distance between the supports as the span, not the whole length.',
    ],
    steps: ($) => [
      String.raw`Left $${texNum($.left)}\ \mathrm{N}$, right $${texNum($.right)}\ \mathrm{N}$.`,
    ],
    sim: {
      scenario: 'scaffold',
      setup: (s, $) => {
        Object.assign(s, { L: $.L, inset: $.inset, mBoard: $.mBoard, mPerson: $.mPerson, x: $.x, g: G });
      },
      read: (c) => ({ left: c.left, right: c.right }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, a 50 kg person 1.5 m from one end of a 6.0 m scaffold of mass 70.0 kg', {
        L: 6, inset: 0, mBoard: 70, mPerson: 50, x: 1.5,
      }, { left: 711.225, right: 465.975 }, {
        note: 'The section poses this scaffold and does not print the tensions. The ropes are at the ends. These forces are our balance, with g = 9.81.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.ladder',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'Ladder against a smooth wall',
    topics: ['ladder', 'equilibrium'],
    lab: 'ladder',
    vars: {
      ladderW: range(200, 800, 50, 'N'),
      personW: range(0, 900, 100, 'N'),
      frac: range(0, 1, 0.25, ''),
      theta: range(40, 70, 5, '°'),
    },
    derive: ($) => smoothLadder({
      ladderW: $.ladderW, personW: $.personW, frac: $.frac, thetaDeg: $.theta,
    }),
    second: ($) => {
      const th = $.theta * Math.PI / 180;
      const wall = ($.ladderW * 0.5 + $.personW * $.frac) * Math.cos(th) / Math.sin(th);
      const normal = $.ladderW + $.personW;
      return { normal, friction: wall, mu: wall / normal };
    },
    text: (T) => `A uniform ladder weighs ${T.ladderW} N and leans against a smooth wall at ${T.theta}° to the rough floor. A person who weighs ${T.personW} N stands a fraction ${T.frac} of the way up from the floor. Find the floor’s normal force, the friction, and the smallest μ that can hold the ladder.`,
    parts: [
      num('normal', ($) => $.normal, 'N', { label: 'floor normal' }),
      num('friction', ($) => $.friction, 'N', { label: 'friction toward the wall' }),
      num('mu', ($) => $.mu, '', { label: 'minimum μ' }),
    ],
    hints: [
      'The wall has no friction, so its force is horizontal. The floor’s normal force is the whole weight. Friction matches the wall.',
      'Moments about the floor contact: the wall’s lever arm is the height, and the weights’ lever arms are their horizontal distances from the floor contact. The length cancels.',
    ],
    steps: ($) => [
      String.raw`$N = ${texNum($.normal)}\ \mathrm{N}$, $f = ${texNum($.friction)}\ \mathrm{N}$, $\mu = ${texNum($.mu)}$.`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        Object.assign(s, { ladderW: $.ladderW, personW: $.personW, frac: $.frac, theta: $.theta });
      },
      read: (c) => ({ normal: c.normal, friction: c.friction, mu: c.mu }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "A Ladder Resting Against a Wall": 400.0 N at 53°', {
        ladderW: 400, personW: 0, frac: 0.5, theta: 53,
      }, { normal: 400, friction: 150.7, mu: 0.377 }, {
        note: 'The book prints 150.7 N, 400.0 N, and μ = 0.377. Nobody else is on the ladder, so the fraction does not enter.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.strings',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Which string breaks',
    topics: ['equilibrium'],
    vars: {
      pan: range(0.02, 0.08, 0.01, 'kg'),
      Tmax: range(1.5, 6, 0.5, 'N'),
    },
    derive: ($) => {
      const added = ($.Tmax * Math.sqrt(5)) / (2 * G) - $.pan;
      return { added, shallow: $.Tmax / 2 };
    },
    second: ($) => {
      const pair = steepShallow(G);
      const total = $.Tmax / pair.steep;
      return { added: total - $.pan, shallow: $.Tmax * pair.shallow / pair.steep };
    },
    text: (T) => `A pan of mass ${T.pan} kg hangs from a knot. One string rises 2 units for each 1 unit it runs sideways. The other rises 1 unit for each 2 units it runs sideways. Each string holds at most ${T.Tmax} N. Take g = ${G} m/s². Find the mass you can still add before the steeper string breaks, and the tension in the shallower string at that moment.`,
    parts: [
      num('added', ($) => $.added, 'kg', { label: 'mass added' }),
      num('shallow', ($) => $.shallow, 'N', { label: 'shallower string' }),
    ],
    hints: [
      'Resolve both strings. The steeper one, with the larger vertical share, carries twice the tension of the shallower one. It breaks first.',
      'The weight is the steeper tension times √5 / 2. Subtract the pan.',
    ],
    steps: ($) => [
      String.raw`Added mass $${texNum($.added)}\ \mathrm{kg}$. The shallower string holds $${texNum($.shallow)}\ \mathrm{N}$.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.1, "A Breaking Tension": a 42.0 g pan, strings that hold 2.80 N', {
        pan: 0.042, Tmax: 2.8,
      }, { added: 0.277, shallow: 1.4 }, {
        note: 'The book prints 277.0 g. The components on the page are written as if divided by 5, but the 277 g answer is the 1-2-√5 triangle, where the steeper tension is twice the other. The shallower tension at the break is 1.40 N.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.stick',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'Masses on a meter stick',
    topics: ['equilibrium', 'beam'],
    vars: {
      m1: range(0.02, 0.1, 0.01, 'kg'),
      m2: range(0.02, 0.12, 0.01, 'kg'),
      stick: range(0.08, 0.2, 0.01, 'kg'),
    },
    derive: ($) => {
      const bal = stickBalance({
        masses: [{ m: $.m1, arm: 0.7 }, { m: $.m2, arm: 0.4 }],
        stickMass: $.stick, stickArm: 0.2, unknownArm: 0.3,
      });
      return { m3: bal.m3, support: bal.supported * G };
    },
    second: ($) => {
      const m3 = (0.7 * $.m1 + 0.4 * $.m2 + 0.2 * $.stick) / 0.3;
      return { m3, support: ($.m1 + $.m2 + $.stick + m3) * G };
    },
    text: (T) => `A uniform meter stick of mass ${T.stick} kg is supported at the 70 cm mark. Masses of ${T.m1} kg and ${T.m2} kg hang at the 0 cm and 30 cm marks, on the other side of the support from a mass at the 100 cm mark. Take g = ${G} m/s². Find that third mass, and the upward force at the support.`,
    parts: [
      num('m3', ($) => $.m3, 'kg', { label: 'third mass' }),
      num('support', ($) => $.support, 'N', { label: 'support' }),
    ],
    hints: [
      'The stick’s own weight acts at the 50 cm mark, 20 cm from this support. Moments about the support do not include the support force.',
      'g cancels when you solve for the mass. It comes back when you add every mass to find the support force.',
    ],
    steps: ($) => [
      String.raw`$m_3 = ${texNum($.m3)}\ \mathrm{kg}$, support $${texNum($.support)}\ \mathrm{N}$.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "The Torque Balance": 50.0 g, 75.0 g, and a 150.0 g stick', {
        m1: 0.05, m2: 0.075, stick: 0.15,
      }, { m3: 0.317, support: 5.8 }, {
        note: 'The book prints about 317 g and 5.8 N, using g = 9.8 and a rounded 316.7 g inside the force. The arms are 70 cm, 40 cm, 20 cm, and 30 cm. Our mass is 0.3167 kg. Both printed numbers pass.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.forearm',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'The biceps and the elbow',
    topics: ['equilibrium'],
    vars: {
      weight: range(50, 400, 10, 'N'),
      near: range(1, 3, 0.5, 'in'),
      far: range(10, 16, 1, 'in'),
    },
    derive: ($) => verticalForearm({ weight: $.weight, near: $.near, far: $.far }),
    second: ($) => {
      const tension = $.weight * ($.far / $.near);
      return { tension, elbow: tension - $.weight };
    },
    text: (T) => `A forearm is held at 60° to the upper arm. The biceps pulls straight up, parallel to the weight, ${T.near} in from the elbow. The load of ${T.weight} N is ${T.far} in from the elbow. The forearm’s own weight is left out. Find the biceps tension and the force the elbow pushes back with.`,
    parts: [
      num('tension', ($) => $.tension, 'N', { label: 'biceps tension' }),
      num('elbow', ($) => $.elbow, 'N', { label: 'elbow, toward the load' }),
    ],
    hints: [
      'With both forces vertical, the 60° angle is in every component and it cancels. Only the two lever arms remain.',
      'Moments about the elbow: tension times the near arm equals the load times the far arm. The elbow force then makes the vertical forces add to zero, and it points the same way as the load.',
    ],
    steps: ($) => [
      String.raw`$T = ${texNum($.tension)}\ \mathrm{N}$, elbow $${texNum($.elbow)}\ \mathrm{N}$.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "Forces in the Forearm": a 50.0 lb load, 1.5 in and 13.0 in', {
        weight: 222.4, near: 1.5, far: 13,
      }, { tension: 1927, elbow: 1705 }, {
        note: 'The book takes 50.0 lb as 222.4 N and prints 1927 N up in the muscle and 1705 N down at the elbow. The inch arms cancel as a ratio, so they stay in inches.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.cable',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'A sign on a strut',
    topics: ['equilibrium', 'beam'],
    vars: {
      strutW: range(200, 800, 50, 'N'),
      signW: range(100, 600, 50, 'N'),
      length: range(2, 5, 0.5, 'm'),
      rise: range(1, 4, 0.5, 'm'),
    },
    derive: ($) => cableStrut({ strutW: $.strutW, signW: $.signW, length: $.length, rise: $.rise }),
    second: ($) => {
      const hyp = Math.hypot($.length, $.rise);
      const share = $.strutW / 2 + $.signW;
      return { tension: (share * hyp) / $.rise, hingeX: (share * $.length) / $.rise, hingeY: $.strutW / 2 };
    },
    text: (T) => `A uniform strut of weight ${T.strutW} N and length ${T.length} m sticks straight out from a hinge. A sign of weight ${T.signW} N hangs at the outer end. A cable runs from that end to a point ${T.rise} m above the hinge. Find the cable tension and the hinge force, horizontal and vertical.`,
    parts: [
      num('tension', ($) => $.tension, 'N', { label: 'cable tension' }),
      num('hingeX', ($) => $.hingeX, 'N', { label: 'hinge, horizontal' }),
      num('hingeY', ($) => $.hingeY, 'N', { label: 'hinge, vertical' }),
    ],
    hints: [
      'The strut is horizontal, so the cable’s vertical part is what holds the weights up in the moment equation. Take moments about the hinge.',
      'The hinge’s vertical force is only half the strut. The sign hangs entirely from the cable, and so does the other half of the strut.',
    ],
    steps: ($) => [
      String.raw`$T = ${texNum($.tension)}\ \mathrm{N}$, hinge $${texNum($.hingeX)}\ \mathrm{N}$ horizontal and $${texNum($.hingeY)}\ \mathrm{N}$ vertical.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, a 400.0 N sign on a 4.0 m strut of weight 600.0 N, cable tied 3.0 m above the hinge', {
        strutW: 600, signW: 400, length: 4, rise: 3,
      }, { tension: 1166.67, hingeX: 933.33, hingeY: 300 }, {
        note: 'The section poses this sign and does not print the forces. The cable is the hypotenuse of a 3-4-5 triangle. The tension is 3500/3 N.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.rod',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §12.3',
    title: 'Stretch of a steel rod',
    topics: ['stress', 'strain'],
    lab: 'stress-strain',
    vars: {
      m: range(200, 900, 50, 'kg'),
      L: range(0.5, 4, 0.5, 'm'),
      area: range(0.1, 1, 0.1, 'cm²'),
      E: range(100, 400, 20, 'GPa'),
      g: range(9.8, 9.81, 0.01, 'm/s²'),
    },
    derive: ($) => rodOf($),
    second: ($) => {
      const force = $.m * $.g;
      const area = $.area * 1e-4;
      const stress = force / area;
      return { stress, delta: (stress * $.L) / ($.E * 1e9) };
    },
    text: (T) => `A steel rod ${T.L} m long has a cross section of ${T.area} cm². A platform of mass ${T.m} kg hangs from it. Young’s modulus is ${T.E} GPa. Take g = ${T.g} m/s² and ignore the rod’s own weight. Find the tensile stress and the elongation.`,
    parts: [
      num('stress', ($) => $.stress, 'Pa', { label: 'tensile stress' }),
      num('delta', ($) => $.delta, 'm', { label: 'elongation' }),
    ],
    hints: [
      'Stress is the weight divided by the area. The area has to be in square meters. 1 cm² is 10⁻⁴ m².',
      'Elongation is stress times length, divided by Young’s modulus. The modulus in GPa is 10⁹ Pa.',
    ],
    steps: ($) => [
      String.raw`$\sigma = ${texNum($.stress)}\ \mathrm{Pa}$, $\Delta L = ${texNum($.delta)}\ \mathrm{m}$.`,
    ],
    sim: {
      scenario: 'rod',
      setup: (s, $) => {
        Object.assign(s, {
          mode: 'rod', rodM: $.m, rodL: $.L, rodA: $.area * 1e-4, rodE: $.E * 1e9, g: $.g,
        });
      },
      read: (c) => ({ stress: c.rodStress, delta: c.rodDelta }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.3, "Stretching a Rod": 2.0 m, 0.30 cm², 550 kg, steel', {
        m: 550, L: 2, area: 0.3, E: 200, g: 9.8,
      }, { stress: 1.8e8, delta: 0.0018 }, {
        note: 'The book uses g = 9.8 m/s² and Y = 2.0×10¹¹ Pa, and prints 1.8×10⁸ Pa and 1.8 mm.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.pillar',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.3',
    title: 'A cut through a pillar',
    topics: ['stress', 'strain'],
    lab: 'stress-strain',
    vars: {
      sculpt: range(2000, 20000, 1000, 'N'),
      h: range(1, 6, 0.5, 'm'),
      area: range(0.1, 0.5, 0.05, 'm²'),
      rho: range(2000, 4000, 100, 'kg/m³'),
      E: range(20, 80, 5, 'GPa'),
      g: range(9.8, 9.81, 0.01, 'm/s²'),
    },
    derive: ($) => pillarOf($),
    second: ($) => {
      let weight = 0;
      const n = 2000;
      const dh = $.h / n;
      for (let i = 0; i < n; i += 1) weight += $.rho * $.area * dh * $.g;
      const force = weight + $.sculpt;
      const stress = force / $.area;
      return { stress, strain: stress / ($.E * 1e9) };
    },
    text: (T) => `A sculpture weighing ${T.sculpt} N stands on a pillar. The cut you care about is ${T.h} m below the top. The pillar’s area is ${T.area} m² and its density is ${T.rho} kg/m³. Young’s modulus is ${T.E} GPa. Take g = ${T.g} m/s². Find the compressive stress on that cut, and the strain in the stone above it.`,
    parts: [
      num('stress', ($) => $.stress, 'Pa', { label: 'compressive stress' }),
      num('strain', ($) => $.strain, '', { label: 'compressive strain' }),
    ],
    hints: [
      'The cut carries the sculpture and the weight of the pillar above the cut. That weight is density times area times height times g.',
      'Strain is stress divided by Young’s modulus. The area cancels in the pillar’s own contribution and stays in the sculpture’s.',
    ],
    steps: ($) => [
      String.raw`$\sigma = ${texNum($.stress)}\ \mathrm{Pa}$, strain $${texNum($.strain)}$.`,
    ],
    sim: {
      scenario: 'pillar',
      setup: (s, $) => {
        Object.assign(s, {
          mode: 'pillar', pilSculpt: $.sculpt, pilH: $.h, pilA: $.area, pilRho: $.rho, pilE: $.E * 1e9, g: $.g,
        });
      },
      read: (c) => ({ stress: c.pilStress, strain: c.pilStrain }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.3, "Compressive Stress in a Pillar": 10,000 N, 3.0 m down, 0.20 m², granite', {
        sculpt: 10000, h: 3, area: 0.2, rho: 2700, E: 45, g: 9.8,
      }, { stress: 1.284e5, strain: 2.85e-6 }, {
        note: 'The book rounds the granite above the cut to 1.60×10³ kg, uses g = 9.80, and prints 128.4 kPa and 2.85×10⁻⁶. Y for granite is 4.5×10¹⁰ Pa.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.shear',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §12.3',
    title: 'Shear in a bookcase',
    topics: ['stress', 'strain'],
    lab: 'stress-strain',
    vars: {
      force: range(20, 120, 10, 'N'),
      area: range(0.1, 0.8, 0.05, 'm²'),
      height: range(0.8, 2.5, 0.1, 'm'),
      shift: range(2, 20, 1, 'cm'),
    },
    derive: ($) => {
      const stress = avgShear($.force, $.area);
      const strain = normalStrain($.shift / 100, $.height);
      return { stress, strain, modulus: stress / strain };
    },
    second: ($) => {
      const stress = $.force / $.area;
      const strain = ($.shift / 100) / $.height;
      return { stress, strain, modulus: stress / strain };
    },
    text: (T) => `A sideways push of ${T.force} N acts across the top of a bookcase. The face it loads has area ${T.area} m². The case is ${T.height} m tall and the top shifts ${T.shift} cm. The bottom does not move. Find the shear stress, the shear strain, and the shear modulus.`,
    parts: [
      num('stress', ($) => $.stress, 'Pa', { label: 'shear stress' }),
      num('strain', ($) => $.strain, '', { label: 'shear strain' }),
      num('modulus', ($) => $.modulus, 'Pa', { label: 'shear modulus' }),
    ],
    hints: [
      'Shear stress is the sideways force over the area it acts on. The weight of the books is not that force.',
      'Shear strain is the sideways shift divided by the height. The modulus is stress over strain.',
    ],
    steps: ($) => [
      String.raw`Stress $${texNum($.stress)}\ \mathrm{Pa}$, strain $${texNum($.strain)}$, modulus $${texNum($.modulus)}\ \mathrm{Pa}$.`,
    ],
    sim: {
      scenario: 'shelf',
      setup: (s, $) => {
        Object.assign(s, {
          mode: 'shear', shF: $.force, shA: $.area, shL: $.height, shX: $.shift / 100,
        });
      },
      read: (c) => ({ stress: c.shStress, strain: c.shStrain, modulus: c.shMod }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.3, "An Old Bookshelf": 50.0 N, 15.0 cm of shift, 180.0 cm tall, 2700 cm²', {
        force: 50, area: 0.27, height: 1.8, shift: 15,
      }, { stress: 185.2, strain: 0.083, modulus: 2222 }, {
        note: 'The book prints 185.2 Pa, a strain of 1/12, and 2.222 kPa. The area is 30.0 cm by 90.0 cm.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.yield',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.4',
    title: 'Unload past the yield',
    topics: ['elasticity', 'stress'],
    lab: 'stress-strain',
    vars: {
      eps: range(0.002, 0.02, 0.002, ''),
      E: range(100, 220, 20, 'GPa'),
      sigY: range(150, 400, 25, 'MPa'),
      Et: range(0, 20, 5, 'GPa'),
    },
    derive: ($) => {
      const curve = bilinear($.eps, $.E * 1e9, $.sigY * 1e6, $.Et * 1e9);
      return { stress: curve.stress, permanent: permanentSet($.eps, curve.stress, $.E * 1e9) };
    },
    second: ($) => {
      const E = $.E * 1e9;
      const sigY = $.sigY * 1e6;
      const ey = sigY / E;
      const stress = $.eps <= ey ? E * $.eps : sigY + $.Et * 1e9 * ($.eps - ey);
      return { stress, permanent: Math.max(0, $.eps - stress / E) };
    },
    text: (T) => `A wire is pulled to a strain of ${T.eps} and then unloaded to zero force. Young’s modulus is ${T.E} GPa, the yield stress is ${T.sigY} MPa, and past yield the slope is ${T.Et} GPa. Find the stress at that strain, and the strain that remains after unloading.`,
    parts: [
      num('stress', ($) => $.stress, 'Pa', { label: 'stress at that strain' }),
      num('permanent', ($) => $.permanent, '', { label: 'permanent strain' }),
    ],
    hints: [
      'Up to the yield, stress is Young’s modulus times strain. Past it, add the tangent modulus times the extra strain.',
      'Unloading follows Young’s modulus back toward zero stress. The strain left over is the permanent set. It is zero if you never passed the yield.',
    ],
    steps: ($) => [
      String.raw`Stress $${texNum($.stress)}\ \mathrm{Pa}$. Permanent strain $${texNum($.permanent)}$.`,
    ],
    sim: {
      scenario: 'yield',
      setup: (s, $) => {
        Object.assign(s, {
          mode: 'yield', yEps: $.eps, yE: $.E * 1e9, yY: $.sigY * 1e6, yEt: $.Et * 1e9, unloaded: true,
        });
      },
      read: (c) => ({ stress: c.yStress, permanent: c.permanent }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.4, a wire unloaded from past its yield', {
        eps: 0.01, E: 200, sigY: 250, Et: 10,
      }, { stress: 3.375e8, permanent: 0.0083125 }, {
        note: 'Section 12.4 describes the elastic line, the yield, and the permanent set. It does not print this wire. The 250 MPa yield, 200 GPa modulus, and 10 GPa tangent slope are the givens.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.door',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'Hinges on a door',
    topics: ['equilibrium'],
    vars: {
      weight: range(100, 800, 50, 'N'),
      width: range(0.6, 1.4, 0.1, 'm'),
      separation: range(1.2, 2.4, 0.2, 'm'),
    },
    derive: ($) => ({
      horizontal: ($.weight * $.width) / (2 * $.separation),
      vertical: $.weight / 2,
    }),
    second: ($) => {
      const horizontal = ($.weight * ($.width / 2)) / $.separation;
      return { horizontal, vertical: $.weight - $.weight / 2 };
    },
    text: (T) => `A uniform door weighs ${T.weight} N. It is ${T.width} m wide, and two hinges on one edge are ${T.separation} m apart. The hinges share the weight equally. The door is at rest, half open. Find the horizontal force at each hinge, and the vertical force at each hinge.`,
    parts: [
      num('horizontal', ($) => $.horizontal, 'N', { label: 'horizontal, each hinge' }),
      num('vertical', ($) => $.vertical, 'N', { label: 'vertical, each hinge' }),
    ],
    hints: [
      'Four components and three equilibrium equations do not close. The extra fact is that the hinges share the weight, so each vertical force is half.',
      'Moments about one hinge: the weight, acting at the center of the door, is balanced by the other hinge’s horizontal force times the separation.',
    ],
    steps: ($) => [
      String.raw`Horizontal $${texNum($.horizontal)}\ \mathrm{N}$, vertical $${texNum($.vertical)}\ \mathrm{N}$, at each hinge.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "Forces on Door Hinges": a 400.0 N door, 1.00 m wide, hinges 2.00 m apart', {
        weight: 400, width: 1, separation: 2,
      }, { horizontal: 100, vertical: 200 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.concept-pivot',
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Which pivot',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'car-balance',
    topics: ['equilibrium'],
    vars: {
      q: choice(
        [1, 'You move the pivot from the center of mass to the front axle and solve the car problem again. The distance from the rear axle to the center:'],
        [2, 'A board on two supports. You take moments about the left support, then again about the right. The two support forces:'],
        [3, 'The ladder’s length is missing from the data. The friction coefficient at the floor:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'same', 3: 'known' }[$.q] }),
    second: ($) => {
      const car = axleSplit({ wheelbase: 2.5, weight: 10000, frontShare: 0.52, height: 0.5, decel: 0, g: G });
      if ($.q === 1) return { ans: Math.abs(car.xRear - 0.52 * 2.5) < 1e-9 ? 'same' : 'moves' };
      const left = boardReactions({ length: 6, weight: 700, load: 500, at: 1.5 });
      const right = boardReactionsAboutRight({ length: 6, weight: 700, load: 500, at: 1.5 });
      if ($.q === 2) return { ans: Math.abs(left.left - right.left) < 1e-6 ? 'same' : 'differ' };
      const short = smoothLadder({ ladderW: 400, thetaDeg: 53 });
      const long = smoothLadder({ ladderW: 400, thetaDeg: 53 });
      return { ans: Math.abs(short.mu - long.mu) < 1e-12 ? 'known' : 'lost' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['same', 'Stays the same', 'Every legal pivot gives the same center. The book solves the car about the center and again about the front axle, and both give 1.3 m.'],
          ['moves', 'Changes, because the lever arms changed', 'The lever arms change. The unknown you are solving for does not. It is a place on the car.'],
          ['zero', 'Becomes zero, because the front axle is now the pivot', 'A pivot at the front axle makes the front force drop out of the moment equation. The center is still between the axles.'],
        ],
        2: [
          ['same', 'Come out the same', 'The support forces are properties of the board. Changing which point you call the pivot rearranges the algebra and leaves the forces alone.'],
          ['differ', 'Come out different, so you average them', 'Two careful solutions that disagree mean one of them dropped a force. They are not two answers to average.'],
          ['half', 'Are each half the weight, whatever the pivot', 'Half and half is only true when the load is symmetric. The pivot does not create that symmetry.'],
        ],
        3: [
          ['known', 'Can still be found. The length cancels', 'Every lever arm contains the length, once. It divides out. The book’s ladder result does not depend on the 5.0 m.'],
          ['lost', 'Cannot be found until the length is measured', 'The length would matter if one force had a lever arm that did not scale with it. Here both do.'],
          ['zero', 'Is zero, because a longer ladder is heavier', 'The weight is given separately. Making the ladder longer at the same weight does not change μ.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'The equilibrium conditions are true about every point. A convenient pivot drops an unknown out of one equation. It does not change the physical forces.',
      'If a length shows up in every term of a moment equation, it cancels. Check that before you go looking for the missing measurement.',
    ],
    steps: ($) => [['The center does not move when the pivot does.', 'Both moment points give the same supports.', 'The length cancels, so μ is determined.'][$.q - 1]],
    sim: { scenario: 'level', setup: (s) => { s.a = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.1, "Center of Gravity of a Car": the front-axle pivot gives 1.3 m again', { q: 1 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.concept-ladder',
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'Which way friction points',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'ladder',
    topics: ['ladder', 'equilibrium'],
    vars: {
      q: choice(
        [1, 'A ladder leans on a smooth wall, rough floor. Friction at the floor points:'],
        [2, 'The wall is rough enough to hold the ladder, and the floor is ice. The wall’s friction points:'],
        [3, 'You stand higher on the same ladder. The μ the floor must supply:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'wall', 2: 'up', 3: 'up' }[$.q] }),
    second: ($) => {
      const low = smoothLadder({ ladderW: 400, personW: 700, frac: 0.3, thetaDeg: 53 });
      const high = smoothLadder({ ladderW: 400, personW: 700, frac: 0.8, thetaDeg: 53 });
      if ($.q === 3) return { ans: high.mu > low.mu ? 'up' : 'down' };
      if ($.q === 1) return { ans: low.friction > 0 ? 'wall' : 'away' };
      return { ans: 'up' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['wall', 'Toward the wall', 'The wall pushes the ladder away. Friction is the only other horizontal force, so it points toward the wall.'],
          ['away', 'Away from the wall', 'That would add to the wall’s push. Nothing would cancel it, and the ladder would accelerate.'],
          ['up', 'Straight up, with the normal force', 'The upward force is the normal force. Friction is horizontal here. The wall took the other job.'],
        ],
        2: [
          ['up', 'Up the wall', 'On ice the floor cannot push sideways. The wall’s friction has to hold the ladder up, so it points up the wall.'],
          ['down', 'Down the wall', 'Down the wall would pull the ladder into the floor. The weight already does that. The friction would have the wrong job.'],
          ['zero', 'Zero, because the wall is vertical', 'A vertical wall can still exert an upward force if the contact is rough. Ice at the floor is what forces that job onto the wall.'],
        ],
        3: [
          ['up', 'Rises', 'Your weight moves farther from the wall in lever-arm terms about the floor, so the wall push grows and friction must match it. The normal force grows by your weight only, not by that extra moment.'],
          ['down', 'Falls', 'Higher is not safer on a smooth wall. The moment of your weight about the floor gets larger.'],
          ['same', 'Stays the same, because μ does not depend on weight', 'μ is independent of the ladder’s weight when you are not on it. Your position is a new lever arm, and it does change μ.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Draw the horizontal forces first. On a smooth wall there is only one horizontal force besides friction, and they are a pair.',
      'μ is friction over the normal force. Climbing changes the moment, so it changes the friction, even when the normal force only grows with your weight.',
    ],
    steps: ($) => [['Friction points toward the wall.', 'On ice, the wall’s friction points up.', 'A higher person raises the μ the floor must supply.'][$.q - 1]],
    sim: { scenario: 'person', setup: (s) => { s.frac = 0.85; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "A Ladder Resting Against a Wall": friction matches the wall and points toward it', { q: 1 }, { ans: 'wall' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.concept-count',
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'When the equations run out',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'beam',
    topics: ['equilibrium', 'beam'],
    vars: {
      q: choice(
        [1, 'A door on two hinges, with no extra fact about how they share the weight. In the plane of the door:'],
        [2, 'A board on a hinge at one end and a roller at the other. In the plane:'],
        [3, 'You replace the roller with a second hinge, and you add no new fact. The support forces:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'short', 2: 'closes', 3: 'short' }[$.q] }),
    second: ($) => ({ ans: { 1: 'short', 2: 'closes', 3: 'short' }[$.q] }),
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['short', 'There are more unknowns than equations', 'Each hinge can push horizontally and vertically. That is four unknowns. A planar body gives three equations. The book states that the hinges share the weight, and that fourth fact closes it.'],
          ['closes', 'The three equilibrium equations are enough', 'Three equations close a hinge plus a roller. Two hinges are one unknown too many, until you say how the weight is shared.'],
          ['zero', 'Both hinges carry zero horizontal force', 'The weight is vertical, but the door’s center is not on the hinge line. The hinges push sideways as a couple. Those forces are not zero.'],
        ],
        2: [
          ['closes', 'Three unknowns, and the equations close', 'The hinge has two components and the roller has one, perpendicular to the board. That is the standard determinate beam.'],
          ['short', 'The roller’s direction is a fourth unknown', 'A roller’s direction is known. It pushes normal to the surface. You solve for the size, not the direction.'],
          ['half', 'Each support carries half the weight', 'Half and half is a special case, when the load is centered. The count of equations does not force the forces to be equal.'],
        ],
        3: [
          ['short', 'Cannot be found from equilibrium alone', 'Two hinges are four unknowns. Equilibrium supplies three equations. The body is indeterminate, and the stretch of the supports would have to enter.'],
          ['closes', 'Can be found, because a hinge is just a roller plus an extra force you can set to zero', 'You do not get to set a hinge force to zero. Both hinges can push along the board. Those two forces are not determined separately.'],
          ['same', 'Match the hinge-and-roller answer', 'The hinge-and-roller answer used the fact that one support cannot pull along the board. A second hinge can. The forces need not match.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Count unknowns, then count equations. A planar body in equilibrium gives ΣFx = 0, ΣFy = 0, and one moment equation.',
      'A hinge is two unknowns. A roller is one. Two hinges are one too many, unless a symmetry or a deformation supplies the missing fact.',
    ],
    steps: ($) => [['Two hinges are indeterminate until you say how the weight is shared.', 'A hinge and a roller are three unknowns.', 'A second hinge makes the beam indeterminate.'][$.q - 1]],
    sim: { scenario: 'scaffold', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.2, "Forces on Door Hinges": the weight is shared, which supplies the missing equation', { q: 1 }, { ans: 'short' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.concept-stress',
    src: 'OpenStax University Physics Vol. 1 §12.3',
    title: 'Stress is not the force',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'stress-strain',
    topics: ['stress', 'strain', 'elasticity'],
    vars: {
      q: choice(
        [1, 'You double the length of a rod and keep the force and the area, still below the yield. The stress:'],
        [2, 'You double the area and keep the force. The elongation:'],
        [3, 'A pillar is uniform. The compressive stress is largest:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'half', 3: 'base' }[$.q] }),
    second: ($) => {
      const short = rodOf({ m: 550, g: 9.8, area: 0.3, E: 200, L: 2 });
      const long = rodOf({ m: 550, g: 9.8, area: 0.3, E: 200, L: 4 });
      const wide = rodOf({ m: 550, g: 9.8, area: 0.6, E: 200, L: 2 });
      if ($.q === 1) return { ans: Math.abs(short.stress - long.stress) < 1 ? 'same' : 'double' };
      if ($.q === 2) return { ans: Math.abs(wide.delta - short.delta / 2) < 1e-9 ? 'half' : 'same' };
      return { ans: 'base' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['same', 'Stays the same, and the elongation doubles', 'Stress is F/A. The length is not in it. Elongation is FL/(AE), so the length does double the stretch.'],
          ['double', 'Doubles', 'That confuses stress with elongation. A longer rod stretches more under the same stress. The stress itself is the force per area.'],
          ['half', 'Is cut in half', 'Nothing about a longer rod spreads the force over more area. The cut has the same area.'],
        ],
        2: [
          ['half', 'Is cut in half', 'Both the stress and the elongation have the area in the denominator. Twice the steel, half the stretch.'],
          ['same', 'Stays the same', 'The force is the same, but it is spread over twice the area, so the strain falls.'],
          ['double', 'Doubles', 'More area is more steel in the way, not a longer path for the stretch.'],
        ],
        3: [
          ['base', 'At the base', 'Every slice carries the sculpture plus the stone above that slice. The base carries the whole pillar. The book’s column makes this point.'],
          ['top', 'Just under the sculpture', 'The top carries only the sculpture. Every lower cut adds the stone in between.'],
          ['mid', 'Halfway up, where the moment is largest', 'This pillar is in compression, not bending. There is no midspan moment. The stress grows toward the base.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Write σ = F/A and ΔL = FL/(AE) and see which symbol you changed.',
      'On a uniform pillar the force on a cut is the weight above that cut. The lowest cut holds the most.',
    ],
    steps: ($) => [['Length changes the elongation, not the stress.', 'Twice the area cuts the elongation in half.', 'The base carries the whole pillar.'][$.q - 1]],
    sim: { scenario: 'rod', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §12.3, "Compressive Stress in a Pillar": the stress grows toward the base', { q: 3 }, { ans: 'base' }),
    ],
  }),
];
