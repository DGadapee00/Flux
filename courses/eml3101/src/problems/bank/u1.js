/**
 * Unit 1 bank: ideal-gas mixtures. Original problems, written for the Mixture lab, with staged hints
 * and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 *
 * Every problem puts nitrogen and one other gas in a rigid 1 m³ vessel.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { GASES, mixture } from '@flux/subjects/thermo/mixtures.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The lab's mixture for a problem's numbers, at T (K) in the 1 m³ vessel. */
export const mix = ($, T = 300) => mixture({ gasB: $.gas, mA: $.mA, mB: $.mB, T, V: 1 });
const gasChoice = () => choice(['CO2', 'carbon dioxide (44.0 g/mol)'], ['H2', 'hydrogen (2.02 g/mol)'], ['AR', 'argon (39.9 g/mol)'], ['CH4', 'methane (16.0 g/mol)']);
const f = ($) => GASES[$.gas].formula;
const p3 = (x) => Number(x.toPrecision(3));

export default [
  problem({
    id: 'u1.1.fractions',
    title: 'Mass fraction, mole fraction',
    exam: 'u1',
    ch: '1',
    lab: 'mixture',
    src: 'Flux, written for the Mixture lab',
    topics: ['fractions'],
    principles: ['moles'],
    vars: { gas: gasChoice(), mA: range(0.5, 3, 0.5, 'kg'), mB: range(0.5, 3, 0.5, 'kg') },
    text: (T) => `A vessel holds ${T.mA} of nitrogen (28.0 g/mol) and ${T.mB} of ${T.gas}. What share of the molecules are the second gas? Give the mole fraction as a number between 0 and 1.`,
    parts: [num('y', ($) => mix($).yB, '', { label: 'y', abs: 1e-6 })],
    level: 1,
    hints: ['Turn each mass into an amount: N = m/M.', 'y = N_B/(N_A + N_B).'],
    steps: ($) => {
      const r = mix($);
      return [String.raw`$N_{N_2} = ${$.mA}/0.0280 = ${p3(r.NA)}$ mol, $N = ${$.mB}/${p3(r.MB)} = ${p3(r.NB)}$ mol`, String.raw`$y = ${p3(r.NB)}/${p3(r.N)} = ${p3(r.yB)}$`];
    },
    sim: {
      scenario: 'co2',
      setup(s, $) {
        Object.assign(s, { gasB: $.gas, mA: $.mA, mB: $.mB, T: 300, V: 1 });
      },
      read: (c) => ({ y: c.yB }),
    },
    cases: [kase('the notes’ CO₂', { gas: 'CO2', mA: 1, mB: 1 }, { y: 0.389 })],
  }),

  problem({
    id: 'u1.2.partial',
    title: 'Whose pressure?',
    exam: 'u1',
    ch: '1',
    lab: 'mixture',
    src: 'Flux, written for the Mixture lab',
    topics: ['dalton'],
    principles: ['dalton', 'moles'],
    vars: { gas: gasChoice(), mA: range(0.5, 3, 0.5, 'kg'), mB: range(0.5, 3, 0.5, 'kg'), T: range(300, 600, 50, 'K') },
    text: (T) => `A rigid 1 m³ vessel holds ${T.mA} of nitrogen (28.0 g/mol) and ${T.mB} of ${T.gas} at ${T.T}. What is the second gas’s partial pressure, in kPa?`,
    parts: [num('p', ($) => mix($, $.T).pB / 1000, 'kPa', { label: 'p_i' })],
    level: 2,
    hints: ['Each gas pushes as if it were alone in the vessel.', 'p_i = N_i R̄T/V with N_i = m_i/M_i and R̄ = 8.314 J/(mol·K).'],
    steps: ($) => {
      const r = mix($, $.T);
      return [String.raw`$N = ${$.mB}/${p3(r.MB)} = ${p3(r.NB)}$ mol`, String.raw`$p = ${p3(r.NB)}\times 8.314\times ${$.T}/1 = ${p3(r.pB / 1000)}$ kPa`];
    },
    sim: {
      scenario: 'co2',
      setup(s, $) {
        Object.assign(s, { gasB: $.gas, mA: $.mA, mB: $.mB, T: $.T, V: 1 });
      },
      read: (c) => ({ p: c.pB / 1000 }),
    },
    cases: [kase('the notes’ hydrogen, with 1 kg of it', { gas: 'H2', mA: 1, mB: 1, T: 300 }, { p: 1237.3 })],
  }),

  problem({
    id: 'u1.3.molar',
    title: 'The mixture as one gas',
    exam: 'u1',
    ch: '1',
    lab: 'mixture',
    src: 'Flux, written for the Mixture lab',
    topics: ['properties'],
    principles: ['weighting'],
    vars: { gas: gasChoice(), ask: choice(['M', 'its molar mass, in g/mol'], ['R', 'its gas constant R, in J/(kg·K)']), mA: range(0.5, 3, 0.5, 'kg'), mB: range(0.5, 3, 0.5, 'kg') },
    valid: ($) => Math.abs($.mA - $.mB) >= 0.5,
    text: (T) => `${T.mA} of nitrogen (28.0 g/mol) and ${T.mB} of ${T.gas} are mixed. Treat the mixture as one ideal gas. What is ${T.ask}?`,
    parts: [num('v', ($) => ($.ask === 'M' ? 1000 * mix($).M : mix($).R), '', { label: 'value' })],
    level: 2,
    hints: ['A per-mole property averages by mole fraction: M = Σ y_i M_i, or simply m/N.', 'R = R̄/M, with M in kg/mol.'],
    steps: ($) => {
      const r = mix($);
      return [String.raw`$N = ${p3(r.NA)} + ${p3(r.NB)} = ${p3(r.N)}$ mol, $M = ${p3(r.m)}/${p3(r.N)} = ${p3(1000 * r.M)}$ g/mol`, ...($.ask === 'R' ? [String.raw`$R = 8.314/${Number(r.M.toPrecision(4))} = ${p3(r.R)}$ J/(kg·K)`] : [])];
    },
    sim: {
      scenario: 'co2',
      setup(s, $) {
        Object.assign(s, { gasB: $.gas, mA: $.mA, mB: $.mB, T: 300, V: 1 });
      },
      read: (c, s, $) => ({ v: $.ask === 'M' ? 1000 * c.M : c.R }),
    },
    cases: [kase('2 kg of N₂ with 1 kg of CO₂', { gas: 'CO2', ask: 'M', mA: 2, mB: 1 }, { v: 31.9 })],
  }),

  problem({
    id: 'u1.4.equal-mass',
    title: 'Equal masses, unequal pressures',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'mixture',
    src: 'Flux, written for the Mixture lab',
    topics: ['dalton'],
    principles: ['dalton'],
    vars: { gas: gasChoice() },
    text: (T) => `A vessel holds equal masses of nitrogen (28.0 g/mol) and ${T.gas}. Which gas has the larger partial pressure?`,
    parts: [
      pick('who', 'the larger partial pressure', [
        ['n2', 'nitrogen', 'Lighter molecules mean more of them in the same mass, and more molecules push harder.'],
        ['other', 'the other gas', 'Partial pressure goes with the number of molecules, and a lighter gas has more of them per kilogram.'],
        ['same', 'they are equal: equal masses', 'Pressure counts molecules, not kilograms. Equal masses are equal pressures only if the molar masses match.'],
      ], ($) => (mix({ ...$, mA: 1, mB: 1 }).MB > mix({ ...$, mA: 1, mB: 1 }).MA ? 'n2' : 'other')),
    ],
    level: 1,
    hints: ['Which gas has more molecules in a kilogram?', 'p_i = y_i p: the mole fraction decides.'],
    steps: ($) => [mix({ ...$, mA: 1, mB: 1 }).MB > 0.028 ? `${f($)} is heavier, so a kilogram of it has fewer molecules: nitrogen pushes harder.` : `${f($)} is lighter, so a kilogram of it has more molecules: it pushes harder.`],
    sim: {
      scenario: 'co2',
      setup(s, $) {
        Object.assign(s, { gasB: $.gas, mA: 1, mB: 1 });
      },
      read: (c) => ({ who: c.pA > c.pB ? 'n2' : c.pB > c.pA ? 'other' : 'same' }),
    },
    cases: [kase('carbon dioxide', { gas: 'CO2' }, { who: 'n2' })],
  }),
];
