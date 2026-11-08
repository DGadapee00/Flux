/**
 * Unit 1 bank: ideal-gas mixtures. Original problems, written for the Mixture lab, with staged hints
 * and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 *
 * Every problem puts nitrogen and one other gas in a rigid 1 m³ vessel.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { GASES, mixture } from '@flux/subjects/thermo/mixtures.js';
import { pg } from '@flux/subjects/thermo/psychro.js';
import { flameClosed } from '@flux/subjects/thermo/flame.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The lab's mixture for a problem's numbers, at T (K) in the 1 m³ vessel. */
export const mix = ($, T = 300) => mixture({ gasB: $.gas, mA: $.mA, mB: $.mB, T, V: 1 });
const gasChoice = () => choice(['CO2', 'carbon dioxide (44.0 g/mol)'], ['H2', 'hydrogen (2.02 g/mol)'], ['AR', 'argon (39.9 g/mol)'], ['CH4', 'methane (16.0 g/mol)']);
const f = ($) => GASES[$.gas].formula;
const p3 = (x) => Number(x.toPrecision(3));

/** Air–fuel ratio by mass for methane at a percent of theoretical air; `how` reproduces the traps. */
export const airFuel = ($, how = 'mass') => {
  const lam = Number($.air) / 100;
  if (how === 'molar') return 2 * lam * 4.76;
  if (how === 'oxygen') return (2 * lam * 32) / 16.04;
  return (2 * lam * (32 + 3.76 * 28.013)) / 16.04;
};

/** Humidity ratio (g/kg) at T °C and φ %; `how` reproduces the traps. */
export const humidity = ($, how = 'right') => {
  const pv = (Number($.rh) / 100) * pg(Number($.T));
  if (how === 'phi') return 622 * (Number($.rh) / 100);
  if (how === 'nofactor') return (1000 * pv) / (101.325 - pv);
  return (622 * pv) / (101.325 - pv);
};

/** Water removed (g/kg dry air) cooling air at 30 °C, 60% to T2 °C, saturated out; `how` reproduces the traps. */
export const dripped = ($, how = 'right') => {
  const w = (pv) => (622 * pv) / (101.325 - pv);
  const w1 = w(0.6 * pg(30));
  const T2 = Number($.T2);
  if (how === 'phi') return w1 - w(0.6 * pg(T2));
  if (how === 'out') return w(pg(T2));
  return w1 - w(pg(T2));
};

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
  problem({
    id: 'u1.5.air-fuel',
    title: 'How much air',
    exam: 'u1',
    ch: '1',
    lab: 'flame',
    src: 'Flux, written for the Flame lab',
    topics: ['combustion'],
    principles: ['combustion'],
    vars: { air: choice(['100', '100%'], ['120', '120%'], ['150', '150%'], ['200', '200%']) },
    text: (T) => `Methane (16.04 g/mol) burns with ${T.air} of the theoretical air, taking air as O₂ + 3.76 N₂ (32.00 and 28.01 g/mol). What is the air–fuel ratio by mass?`,
    parts: [num('af', ($) => airFuel($), 'kg air/kg fuel', { label: 'A/F' })],
    level: 1,
    hints: ['Stoichiometric methane takes 2 mol of O₂, each with 3.76 mol of N₂.', 'Multiply by the fraction of theoretical air, then by molar masses.'],
    steps: ($) => [String.raw`$\text{A/F} = \frac{2(${Number($.air) / 100})(32.00 + 3.76 \times 28.01)}{16.04} = ${Number(airFuel($).toPrecision(3))}$`],
    sim: { scenario: 'stoich', setup(s, $) { s.air = Number($.air); }, read: (c) => ({ af: c.AF }) },
    cases: [kase('100%', { air: '100' }, { af: 17.12 })],
  }),

  problem({
    id: 'u1.6.hotter',
    title: 'More air, hotter flame?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'flame',
    src: 'Flux, written for the Flame lab',
    topics: ['combustion'],
    principles: ['combustion'],
    vars: { air: choice(['130', '130%'], ['200', '200%']) },
    text: (T) => `A methane burner running at stoichiometric is given ${T.air} of the theoretical air instead. What happens to its adiabatic flame temperature?`,
    parts: [
      pick('a', 'the flame temperature', [
        ['falls', 'it falls', 'The fuel was already burning completely; the extra air only adds gas to heat.'],
        ['rises', 'it rises', 'More oxygen cannot release more than the fuel holds.'],
        ['same', 'no change', 'The same heat now warms more moles of product.'],
      ], () => 'falls'),
    ],
    level: 1,
    hints: ['Is any fuel left unburned at stoichiometric?', 'What does the extra air add to the products?'],
    steps: () => ['Same heat released, more products to heat: a cooler flame.'],
    sim: { scenario: 'stoich', setup(s, $) { s.air = Number($.air); }, read: (c) => ({ a: c.T < flameClosed({ air: 100 }).T - 1 ? 'falls' : 'rises' }) },
    cases: [kase('130%', { air: '130' }, { a: 'falls' })],
  }),
  problem({
    id: 'u1.7.humidity',
    title: 'The humidity ratio',
    exam: 'u1',
    ch: '1',
    lab: 'coil',
    src: 'Flux, written for the Cooling coil lab',
    topics: ['psychrometrics'],
    principles: ['psychrometrics'],
    vars: { T: choice(['25', '25 °C'], ['30', '30 °C'], ['35', '35 °C']), rh: choice(['40', '40%'], ['60', '60%'], ['80', '80%']) },
    text: (T, $) => `Air at ${T.T} and ${T.rh} relative humidity is at 101.325 kPa. Water’s saturation pressure at ${T.T} is ${pg(Number($.T)).toFixed(3)} kPa. What is the humidity ratio, in grams of water per kilogram of dry air?`,
    parts: [num('w', ($) => humidity($), 'g/kg', { label: 'ω' })],
    level: 1,
    hints: ['p_v = φ p_g.', 'ω = 0.622 p_v/(p − p_v).'],
    steps: ($) => [String.raw`$p_v = ${(Number($.rh) / 100 * pg(Number($.T))).toFixed(3)}$ kPa`, String.raw`$\omega = 0.622 \times p_v/(101.325 - p_v) = ${Number(humidity($).toPrecision(3))}$ g/kg`],
    sim: { scenario: 'summer', setup(s, $) { Object.assign(s, { T1: Number($.T), rh: Number($.rh) }); }, read: (c) => ({ w: 1000 * c.w1 }) },
    cases: [kase('30 °C, 60%', { T: '30', rh: '60' }, { w: 16.05 })],
  }),

  problem({
    id: 'u1.8.drip',
    title: 'Does it drip?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'coil',
    src: 'Flux, written for the Cooling coil lab',
    topics: ['psychrometrics'],
    principles: ['psychrometrics'],
    vars: { T2: choice(['12', '12 °C'], ['25', '25 °C']) },
    text: (T) => `Air at 30 °C and 60% relative humidity, whose dew point is 21.4 °C, leaves a cooling coil at ${T.T2}. Does water condense on the coil?`,
    parts: [
      pick('a', 'water', [
        ['yes', 'yes', 'The air is cooled below its dew point, so it cannot hold all its vapour.'],
        ['no', 'no', 'Above the dew point the air still holds all its vapour; only φ rises.'],
      ], ($) => (Number($.T2) < 21.4 ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Find the dew point: where p_g(T) equals the vapour’s partial pressure.', 'Compare the leaving temperature with it.'],
    steps: ($) => [Number($.T2) < 21.4 ? 'Below the dew point: water condenses.' : 'Above the dew point: none condenses.'],
    sim: { scenario: 'summer', setup(s, $) { s.T2 = Number($.T2); }, read: (c) => ({ a: c.water > 1e-6 ? 'yes' : 'no' }) },
    cases: [kase('25 °C', { T2: '25' }, { a: 'no' })],
  }),
  problem({
    id: 'u1.9.dripped',
    title: 'How much water drips',
    exam: 'u1',
    ch: '1',
    lab: 'coil',
    src: 'Flux, written for the Cooling coil lab',
    topics: ['psychrometrics'],
    principles: ['psychrometrics'],
    vars: { T2: choice(['8', '8 °C'], ['10', '10 °C'], ['12', '12 °C'], ['15', '15 °C']) },
    text: (T, $) => `Air at 30 °C and 60% (p_g = ${pg(30).toFixed(3)} kPa) at 101.325 kPa leaves a cooling coil saturated at ${T.T2}, where p_g = ${pg(Number($.T2)).toFixed(3)} kPa. How much water condenses, in grams per kilogram of dry air?`,
    parts: [num('m', ($) => dripped($), 'g/kg', { label: 'Δω' })],
    level: 2,
    hints: ['Find ω in from p_v = 0.6 p_g(30 °C).', 'The air leaves saturated: ω out uses p_v = p_g(T₂).'],
    steps: ($) => [String.raw`$\Delta\omega = \omega_1 - \omega_2 = ${Number(dripped($).toPrecision(3))}$ g/kg`],
    sim: { scenario: 'summer', setup(s, $) { s.T2 = Number($.T2); }, read: (c) => ({ m: 1000 * c.water }) },
    cases: [kase('12 °C', { T2: '12' }, { m: 7.31 })],
  }),
];
