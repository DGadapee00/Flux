/**
 * Unit 2 bank: point defects. Original problems, written for the Vacancy lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { KB } from '@flux/subjects/matsci/vacancies.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** Temperatures by name, in °C. */
export const CELSIUS = { six: 600, eight: 800, thousand: 1000 };
export const frac = (Q, T) => Math.exp(-Q / (KB * T));

export default [
  problem({
    id: 'u2.1.fraction',
    title: 'How many sites are empty?',
    exam: 'u2',
    ch: '2',
    lab: 'vacancy',
    src: 'Flux, written for the Vacancy lab',
    topics: ['vacancy'],
    principles: ['equilibrium-defects'],
    vars: { temp: choice(['six', '600 °C'], ['eight', '800 °C'], ['thousand', '1000 °C']), Q: range(0.6, 1.4, 0.1, 'eV') },
    text: (T) => `A metal’s vacancy formation energy is ${T.Q} eV. What fraction of its lattice sites are empty in equilibrium at ${T.temp}? Use k = 8.617 × 10⁻⁵ eV/K.`,
    parts: [num('c', ($) => frac($.Q, CELSIUS[$.temp] + 273), '', { label: 'c*', abs: 0, tol: 0.02 })],
    level: 1,
    hints: ['Convert the temperature to kelvin first.', 'c* ≈ exp(−Q_v/kT).'],
    steps: ($) => [String.raw`$T = ${CELSIUS[$.temp] + 273}$ K, $Q_v/kT = ${Number(($.Q / (KB * (CELSIUS[$.temp] + 273))).toPrecision(3))}$, so $c^* = ${frac($.Q, CELSIUS[$.temp] + 273).toExponential(2)}$`],
    sim: {
      scenario: 'hot',
      setup(s, $) {
        Object.assign(s, { Q: $.Q, T: CELSIUS[$.temp] + 273 });
      },
      read: (c) => ({ c: c.c }),
    },
    cases: [kase('1.0 eV at 800 °C', { temp: 'eight', Q: 1 }, { c: 2.009e-5 })],
  }),

  problem({
    id: 'u2.2.never-zero',
    title: 'Can a crystal be free of vacancies?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'vacancy',
    src: 'Flux, written for the Vacancy lab',
    topics: ['vacancy'],
    principles: ['equilibrium-defects'],
    vars: { how: choice(['anneal', 'is annealed slowly for a very long time'], ['pure', 'is made perfectly pure']) },
    text: (T) => `A metal held at 700 °C ${T.how}. Does its vacancy fraction reach zero?`,
    parts: [
      pick('zero', 'its vacancy fraction', [
        ['yes', 'yes: given time, the defects anneal out', 'Annealing removes the excess vacancies a quench leaves, down to the equilibrium fraction, not below it.'],
        ['no', 'no: it settles at c* = e^(−Q/kT), not zero', 'The free energy is lowest with some vacancies present, at any temperature above absolute zero.'],
      ], () => 'no'),
    ],
    level: 1,
    hints: ['Where is the free energy g(c) lowest?', 'g dips below zero for small c before it rises.'],
    steps: () => ['The entropy of mixing lowers g at small c faster than Q_v raises it, so equilibrium holds c* > 0.'],
    sim: {
      scenario: 'hot',
      setup(s) {
        Object.assign(s, { Q: 1, T: 973 });
      },
      read: (c) => ({ zero: c.c > 0 ? 'no' : 'yes' }),
    },
    cases: [kase('annealed', { how: 'anneal' }, { zero: 'no' })],
  }),
];
