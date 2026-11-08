/**
 * Unit 6 bank: thermal control. Original problems, written for the Thermal balance lab, with staged
 * hints and named traps (../coaching/u6.js), each checked against the lab (`sim`).
 */
import { FINISHES, SIGMA, SOLAR, balance } from '@flux/subjects/heat/spacecraft.js';
import { choice, kase, num, problem } from '../kit.js';
import { CRAFT, SIGMA as SB } from '@flux/subjects/heat/twonode.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** A sphere in sunlight far from any planet: T = (αS/(4εσ))^(1/4); `area` and `root` name the traps. */
export const deepT = ($, area = 4, root = 0.25) => {
  const f = FINISHES[$.finish];
  return ((f.alpha * SOLAR) / (area * f.eps * SIGMA)) ** root;
};

/** The radiator's temperature (°C) with no link, carrying Q + H; `how` reproduces the traps. */
export const radiatorC = ($, how = 'right') => {
  const eps = how === 'black' ? 1 : CRAFT.eps;
  const T = ((CRAFT.Q + Number($.H)) / (eps * SB * CRAFT.A2)) ** 0.25;
  return how === 'kelvin' ? T : T - 273.15;
};

export default [
  problem({
    id: 'u6.1.deep',
    title: 'A sphere in sunlight',
    exam: 'u6',
    ch: '6',
    lab: 'balance',
    src: 'Flux, written for the Thermal balance lab',
    topics: ['radiation-balance'],
    principles: ['radiation-balance'],
    vars: { finish: choice(['black', 'black paint (α = 0.95, ε = 0.9)'], ['white', 'white paint (α = 0.2, ε = 0.9)'], ['aluminium', 'polished aluminium (α = 0.15, ε = 0.05)']) },
    text: (T) => `A small sphere coated with ${T.finish} drifts in sunlight at Earth's distance from the Sun, far from any planet, with no power inside. At what temperature does it settle, in K? Take S = 1361 W/m² and σ = 5.670 × 10⁻⁸ W/(m²·K⁴).`,
    parts: [num('T', ($) => deepT($), 'K', { label: 'T' })],
    level: 2,
    hints: ['It absorbs on its shadow, πR², and radiates from its whole surface, 4πR².', 'α S πR² = ε σ 4πR² T⁴, so T = (αS/(4εσ))^(1/4).'],
    steps: ($) => {
      const f = FINISHES[$.finish];
      return [String.raw`$T^4 = \dfrac{${f.alpha}(1361)}{4(${f.eps})(5.670\times10^{-8})}$, so $T = ${Number(deepT($).toPrecision(4))}$ K`];
    },
    sim: {
      scenario: 'deep',
      setup(s, $) {
        Object.assign(s, { finish: $.finish, env: 'deep', Q: 0 });
      },
      read: (c) => ({ T: c.Thot }),
    },
    cases: [kase('black paint', { finish: 'black' }, { T: 282.1 })],
  }),

  problem({
    id: 'u6.2.hotter',
    title: 'Which runs hotter?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'balance',
    src: 'Flux, written for the Thermal balance lab',
    topics: ['radiation-balance'],
    principles: ['radiation-balance'],
    vars: { pair: choice(['alu', 'black paint or polished aluminium'], ['white', 'black paint or white paint']) },
    text: (T) => `Two identical satellites in the same orbit differ only in their finish: ${T.pair}. Which runs hotter in sunlight?`,
    parts: [
      pick('d', 'the hotter one', [
        ['first', 'the black one', 'Black paint has α/ε ≈ 1; white paint absorbs a fifth as much and radiates as well, α/ε ≈ 0.2.'],
        ['second', 'the other one', 'Polished aluminium absorbs little but radiates even less: α/ε = 3, three times black paint’s.'],
        ['same', 'neither: they settle at the same temperature', 'The finish changes both what a surface absorbs and what it radiates, and their ratio sets the temperature.'],
      ], ($) => ($.pair === 'alu' ? 'second' : 'first')),
    ],
    level: 1,
    hints: ['Write the balance εσAT⁴ = αSA_p + … and divide by ε.', 'Compare α/ε for the two finishes.'],
    steps: ($) => [$.pair === 'alu' ? 'α/ε: 3 for aluminium against 1.06 for black paint.' : 'α/ε: 1.06 for black paint against 0.22 for white.'],
    sim: {
      scenario: 'black',
      read: (c, s, $) => {
        const other = $.pair === 'alu' ? 'aluminium' : 'white';
        const otherHot = balance({ ...s, finish: other }).Thot;
        return { d: otherHot > c.Thot ? 'second' : otherHot < c.Thot ? 'first' : 'same' };
      },
    },
    cases: [kase('black or aluminium', { pair: 'alu' }, { d: 'second' })],
  }),
  problem({
    id: 'u6.3.radiator',
    title: 'A radiator on its own',
    exam: 'u6',
    ch: '6',
    lab: 'nodes',
    src: 'Flux, written for the Two faces lab',
    topics: ['nodes'],
    principles: ['nodes'],
    vars: { H: choice(['0', 'no heater'], ['5', 'a 5 W heater'], ['10', 'a 10 W heater'], ['20', 'a 20 W heater']) },
    text: (T) => `A radiator of 0.25 m² with ε = 0.85 faces deep space, thermally isolated from the rest of the craft. It carries 15 W of electronics and ${T.H}. At what temperature does it settle, in °C?`,
    parts: [num('T', ($) => radiatorC($), '°C', { label: 'T₂', abs: 0.5 })],
    level: 2,
    hints: ['In steady state it radiates what it carries: εσAT⁴ = Q + H.', 'Solve for T in kelvin, then convert.'],
    steps: ($) => [String.raw`$T = \left(\frac{${15 + Number($.H)}}{0.85\,\sigma\,(0.25)}\right)^{1/4} - 273.15 = ${Number(radiatorC($).toPrecision(3))}$ °C`],
    sim: { scenario: 'nolink', setup(s, $) { Object.assign(s, { G: 0, H: Number($.H) }); }, read: (c) => ({ T: c.T2c }) },
    cases: [kase('no heater', { H: '0' }, { T: -85.31 })],
  }),

  problem({
    id: 'u6.4.which-face',
    title: 'Does the average tell you?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'nodes',
    src: 'Flux, written for the Two faces lab',
    topics: ['nodes'],
    principles: ['nodes'],
    vars: { G: choice(['0', 'no conductive link'], ['0.2', 'a weak 0.2 W/K link']) },
    text: (T) => `A craft in full sun has its electronics on a shaded radiator, with ${T.G} to the sunlit face. The average of the two faces is near 0 °C. Are the electronics safe at −10 °C or above?`,
    parts: [
      pick('a', 'the electronics', [
        ['cold', 'no: the radiator is far colder than the average', 'The sunlit face is hot and the radiator cold; the average hides both.'],
        ['fine', 'yes: the average is above −10 °C', 'Each component sits at its own node’s temperature, not the craft’s average.'],
      ], () => 'cold'),
    ],
    level: 1,
    hints: ['Where are the electronics mounted?', 'What does a weak link do to the two faces?'],
    steps: () => ['With little link the radiator settles far below the average: check each node.'],
    sim: { scenario: 'nolink', setup(s, $) { s.G = Number($.G); }, read: (c) => ({ a: c.T2c < CRAFT.lo ? 'cold' : 'fine' }) },
    cases: [kase('no link', { G: '0' }, { a: 'cold' })],
  }),
];
