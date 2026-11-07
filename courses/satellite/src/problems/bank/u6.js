/**
 * Unit 6 bank: thermal control. Original problems, written for the Thermal balance lab, with staged
 * hints and named traps (../coaching/u6.js), each checked against the lab (`sim`).
 */
import { FINISHES, SIGMA, SOLAR, balance } from '@flux/subjects/heat/spacecraft.js';
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** A sphere in sunlight far from any planet: T = (αS/(4εσ))^(1/4); `area` and `root` name the traps. */
export const deepT = ($, area = 4, root = 0.25) => {
  const f = FINISHES[$.finish];
  return ((f.alpha * SOLAR) / (area * f.eps * SIGMA)) ** root;
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
];
