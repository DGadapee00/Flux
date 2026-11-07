/**
 * Unit 2 bank: point defects. Original problems, written for the Vacancy lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { KB } from '@flux/subjects/matsci/vacancies.js';
import { carburize } from '@flux/subjects/matsci/diffusion.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** Temperatures by name, in °C. */
export const CELSIUS = { six: 600, eight: 800, thousand: 1000 };
export const frac = (Q, T) => Math.exp(-Q / (KB * T));
/** The carburizing problem: furnace temperatures (°C), D, and the hours to reach 0.6 wt% at a depth. */
export const FURNACE = { nine: 900, thousand: 1000 };
export const Z_HALF = 0.4769;
export const DIFF = ($, kelvin = true) => 2.3e-5 * Math.exp(-148e3 / (8.314 * (FURNACE[$.temp] + (kelvin ? 273 : 0))));
export const caseHours = ($, D = DIFF($), two = 2) => ($.depth ** 2 / (two * two * Z_HALF ** 2 * D)) / 3600;

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

  problem({
    id: 'u2.3.case-time',
    title: 'How long in the furnace?',
    exam: 'u2',
    ch: '2',
    lab: 'diffusion',
    src: 'Flux, written for the Diffusion lab',
    topics: ['diffusion'],
    principles: ['diffusion'],
    vars: { temp: choice(['nine', '900 °C'], ['thousand', '1000 °C']), depth: range(0.2, 1.0, 0.2, 'mm', 1e-3) },
    text: (T) => `A steel part at 0.2 wt% carbon is carburized at ${T.temp} with its surface held at 1.0 wt%. How many hours until the carbon is 0.6 wt% at ${T.depth} mm below the surface? For carbon in austenite D₀ = 2.3 × 10⁻⁵ m²/s and Q = 148 kJ/mol; R = 8.314 J/mol·K, and erf(0.4769) = 0.5.`,
    parts: [num('t', ($) => caseHours($), 'h', { label: 't' })],
    level: 3,
    hints: [
      '(C_s − C)/(C_s − C₀) = erf(x/2√(Dt)). Here that is 0.4/0.8 = 0.5, so x/2√(Dt) = 0.4769.',
      'Find D = D₀ exp(−Q/RT) with T in kelvin, then t = x²/(4 × 0.4769² D).',
    ],
    steps: ($) => {
      const D = DIFF($);
      return [
        String.raw`$D = 2.3\times10^{-5}\exp\!\left(-\dfrac{148000}{8.314(${FURNACE[$.temp] + 273})}\right) = ${D.toExponential(3)}$ m²/s`,
        String.raw`$t = \dfrac{x^2}{4(0.4769)^2 D} = ${Number(caseHours($).toPrecision(3))}$ h`,
      ];
    },
    sim: {
      scenario: 'base',
      setup(s, $) {
        Object.assign(s, { TC: FURNACE[$.temp], hours: 1 });
      },
      read: (c, s, $) => ({ t: ($.depth / c.depth) ** 2 }),
    },
    cases: [kase('0.4 mm at 900 °C', { temp: 'nine', depth: 0.4 }, { t: 8.26 })],
  }),

  problem({
    id: 'u2.4.root-t',
    title: 'Time or temperature?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'diffusion',
    src: 'Flux, written for the Diffusion lab',
    topics: ['diffusion'],
    principles: ['diffusion'],
    vars: { change: choice(['twice', 'the part stays in twice as long'], ['four', 'the part stays in four times as long'], ['hotter', 'the furnace runs at 1000 °C instead of 900 °C, for the same time']) },
    text: (T) => `A steel part is carburized at 900 °C. By about what factor does the case depth change if ${T.change}?`,
    parts: [
      pick('f', 'the depth', [
        ['1.4', 'about 1.4 times', 'Depth goes as √t, so twice the time gives √2.'],
        ['1.8', 'about 1.8 times', 'A hotter furnace multiplies D by exp(Q/R · (1/T₁ − 1/T₂)), here 3.3, and the depth by √3.3.'],
        ['2', 'twice', 'Depth goes as √t: four times the time doubles it.'],
        ['4', 'four times', 'Depth does not grow in step with time: it goes as √t.'],
      ], ($) => ({ twice: '1.4', four: '2', hotter: '1.8' })[$.change]),
    ],
    level: 1,
    hints: ['The depth is a fixed multiple of √(Dt).', 'Time enters under the root; temperature enters through D = D₀ exp(−Q/RT).'],
    steps: ($) => [{ twice: '√2 ≈ 1.4.', four: '√4 = 2.', hotter: 'D(1000 °C)/D(900 °C) = 3.3, and √3.3 ≈ 1.8.' }[$.change]],
    sim: {
      scenario: 'base',
      read: (c, s, $) => {
        const other = carburize({ TC: $.change === 'hotter' ? s.TC + 100 : s.TC, hours: s.hours * ({ twice: 2, four: 4, hotter: 1 }[$.change]) });
        const r = other.depth / c.depth;
        const opts = [1.4, 1.8, 2, 4];
        const best = opts.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
        return { f: String(best) };
      },
    },
    cases: [kase('twice as long', { change: 'twice' }, { f: '1.4' })],
  }),
];
