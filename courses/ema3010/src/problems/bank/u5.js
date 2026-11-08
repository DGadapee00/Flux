/**
 * Unit 5 bank: polymers, glasses and corrosion. Original problems, each written for its lab, with staged hints and
 * named traps (../coaching/u5.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { PS, modulus } from '@flux/subjects/matsci/polymer.js';
import { Qover, SODA } from '@flux/subjects/matsci/glass.js';
import { COUPLE, galvanicClosed } from '@flux/subjects/matsci/galvanic.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Number-average molecular weight; `w` reproduces quoting M̄_w and `m0` forgetting the repeat mass. */
export const numberAvg = ($, w = false, m0 = PS.m0) => (m0 / (1 - Number($.p))) * (w ? 1 + Number($.p) : 1);

/** log₁₀ η at T °C from the annealing point; `k` adds to °C and `sign` reproduces flipping the bracket. */
export const logEta = ($, k = 273.15, sign = 1) => Math.log10(SODA.etaA) + (sign * Qover * (1 / (Number($.T) + k) - 1 / (SODA.Ta + k))) / Math.LN10;

/** Corrosion rate (mm/yr) at area ratio r from the equal-area rate; `pow` reproduces the traps. */
export const EQUAL_RATE = 0.0662;
export const ratioRate = ($, pow = COUPLE.bc / (COUPLE.ba + COUPLE.bc)) => EQUAL_RATE * Number($.r) ** pow;

export default [
  problem({
    id: 'u5.1.mn',
    title: 'The number average',
    exam: 'u5',
    ch: '5',
    lab: 'chains',
    src: 'Flux, written for the Chains lab',
    topics: ['polymers'],
    principles: ['polymers'],
    vars: { p: choice(['0.99', '0.99'], ['0.995', '0.995'], ['0.999', '0.999']) },
    text: (T) => `Polystyrene chains (repeat unit 104 g/mol) each add one more unit with probability ${T.p}, so they follow the Flory distribution. What is the number-average molecular weight, in g/mol?`,
    parts: [num('Mn', ($) => numberAvg($), 'g/mol', { label: 'M̄_n' })],
    level: 1,
    hints: ['The average chain has 1/(1 − p) units.', 'Multiply by the repeat unit’s mass.'],
    steps: ($) => [String.raw`$\bar M_n = 104/(1 - ${$.p}) = ${Number(numberAvg($).toPrecision(4))}$ g/mol`],
    sim: { scenario: 'long', setup(s, $) { s.lx = -Math.log10(1 - Number($.p)); }, read: (c) => ({ Mn: c.Mn }) },
    cases: [kase('p = 0.99', { p: '0.99' }, { Mn: 10400 })],
  }),

  problem({
    id: 'u5.2.melt',
    title: 'Does it melt?',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'chains',
    src: 'Flux, written for the Chains lab',
    topics: ['polymers'],
    principles: ['polymers'],
    vars: { T: choice(['120', 'from 80 °C to 120 °C'], ['130', 'from 70 °C to 130 °C']) },
    text: (T) => `An amorphous polystyrene with long chains is heated ${T.T}. What happens to its stiffness?`,
    parts: [
      pick('a', 'the stiffness', [
        ['thousand', 'it falls by a thousandfold or more, gradually', 'Through T_g the chains start to slide; tangles keep it a rubber.'],
        ['melt', 'it melts at one sharp temperature', 'An amorphous polymer has no lattice to melt; it softens through a range.'],
        ['little', 'it falls a little, as a metal’s does', 'Through T_g the change is orders of magnitude.'],
      ], () => 'thousand'),
    ],
    level: 1,
    hints: ['Where is T_g for long-chain polystyrene?', 'What frees up at T_g?'],
    steps: () => ['T_g ≈ 100 °C: the modulus falls from GPa to MPa across it.'],
    sim: { scenario: 'long', setup() {}, read: (c, s, $) => ({ a: modulus(160 - Number($.T), c) / modulus(Number($.T), c) > 300 ? 'thousand' : 'little' }) },
    cases: [kase('80 to 120', { T: '120' }, { a: 'thousand' })],
  }),
  problem({
    id: 'u5.3.viscosity',
    title: 'Viscosity below the softening point',
    exam: 'u5',
    ch: '5',
    lab: 'pane',
    src: 'Flux, written for the Glass lab',
    topics: ['glass'],
    principles: ['glass'],
    vars: { T: choice(['400', '400 °C'], ['450', '450 °C'], ['500', '500 °C'], ['600', '600 °C']) },
    text: (T) => `Soda-lime glass has η = 10¹² Pa·s at 546 °C, and its viscosity follows η = η₀exp(Q/RT) with Q/R = 56 540 K. What is log₁₀ of its viscosity in Pa·s at ${T.T}?`,
    parts: [num('le', ($) => logEta($), '', { label: 'log₁₀ η' })],
    level: 2,
    hints: ['ln(η/η₁) = (Q/R)(1/T − 1/T₁), with T in kelvin.', 'Divide by ln 10 to get log₁₀.'],
    steps: ($) => [String.raw`$\log_{10}\eta = 12 + \frac{56540}{\ln 10}\left(\frac{1}{${(Number($.T) + 273.15).toFixed(2)}} - \frac{1}{819.15}\right) = ${Number(logEta($).toPrecision(4))}$`],
    sim: { scenario: 'warm', setup(s, $) { s.TC = Number($.T); }, read: (c) => ({ le: c.le }) },
    cases: [kase('500 °C', { T: '500' }, { le: 13.78 })],
  }),

  problem({
    id: 'u5.4.window',
    title: 'Thick at the bottom',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'pane',
    src: 'Flux, written for the Glass lab',
    topics: ['glass'],
    principles: ['glass'],
    vars: { age: choice(['300', 'a 300-year-old'], ['800', 'an 800-year-old']) },
    text: (T) => `Some panes in ${T.age} window are thicker at the bottom. Why?`,
    parts: [
      pick('a', 'the reason', [
        ['made', 'they were made uneven and fitted thick edge down', 'At room temperature glass would need about 10⁵⁰ years to sink even 0.1 mm.'],
        ['flow', 'the glass has flowed down over the centuries', 'Its viscosity is so high that no flow could show in the age of the universe.'],
        ['heat', 'summer sun softens it each year', 'Even 60 °C is hundreds of kelvin below the glass transition.'],
      ], () => 'made'),
    ],
    level: 1,
    hints: ['How long does the pane take to sink at room temperature?', 'Compare it with the window’s age.'],
    steps: () => ['Flow at room temperature is far too slow; the panes came out uneven.'],
    sim: { scenario: 'room', setup() {}, read: (c) => ({ a: c.ly > 10 ? 'made' : 'flow' }) },
    cases: [kase('300 years', { age: '300' }, { a: 'made' })],
  }),
  problem({
    id: 'u5.5.ratio',
    title: 'A small anode',
    exam: 'u5',
    ch: '5',
    lab: 'couple',
    src: 'Flux, written for the Galvanic lab',
    topics: ['corrosion'],
    principles: ['corrosion'],
    vars: { r: choice(['10', '10 times'], ['30', '30 times'], ['100', '100 times']) },
    text: (T) => `Steel joined to an equal area of copper in aerated water corrodes at 0.0662 mm/yr. Both reactions follow Tafel lines: 60 mV per decade for the steel, 120 mV per decade for oxygen on the copper. How fast does the steel corrode when the copper has ${T.r} its area, in mm/yr?`,
    parts: [num('v', ($) => ratioRate($), 'mm/yr', { label: 'rate' })],
    level: 3,
    hints: ['At the balance, (E − E_a)/b_a + (E − E_c)/b_c = log₁₀(A_c/A_a) + const.', 'So log i_a grows by b_c/(b_a + b_c) for each decade of area ratio.'],
    steps: ($) => [String.raw`$\text{rate} = 0.0662 \times ${$.r}^{0.12/0.18} = ${Number(ratioRate($).toPrecision(3))}$ mm/yr`],
    second: ($) => ({ v: galvanicClosed({ lr: Math.log10(Number($.r)) }).rate * (EQUAL_RATE / galvanicClosed({ lr: 0 }).rate) }),
    cases: [kase('100 times', { r: '100' }, { v: 1.426 })],
  }),

  problem({
    id: 'u5.6.paint',
    title: 'Which to paint',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'couple',
    src: 'Flux, written for the Galvanic lab',
    topics: ['corrosion'],
    principles: ['corrosion'],
    vars: { pair: choice(['cu', 'steel bolted to copper'], ['ss', 'carbon steel bolted to stainless steel']) },
    text: (T) => `A joint of ${T.pair} will sit in seawater, and the carbon steel is the anode. If you can paint only one metal, which should it be?`,
    parts: [
      pick('a', 'paint', [
        ['cathode', 'the cathode', 'Painting it shrinks the cathode area, and so the current the anode must supply.'],
        ['anode', 'the anode', 'A scratch leaves a tiny anode beside the whole cathode: it corrodes far faster than bare steel.'],
      ], () => 'cathode'),
    ],
    level: 2,
    hints: ['The anode’s current density grows with A_c/A_a.', 'What does a scratch in paint on the anode leave?'],
    steps: () => ['Paint the cathode: it lowers A_c/A_a. Painting the anode raises it at every scratch.'],
    sim: { scenario: 'equal', setup() {}, read: (c, s) => ({ a: galvanicClosed({ lr: s.lr + 2 }).rate > c.rate ? 'cathode' : 'anode' }) },
    cases: [kase('steel and copper', { pair: 'cu' }, { a: 'cathode' })],
  }),
];
