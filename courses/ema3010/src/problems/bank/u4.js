/**
 * Unit 4 bank: failure. Original problems, each written for its lab, with staged hints and
 * named traps (../coaching/u4.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { ALLOYS } from '@flux/subjects/matsci/fracture.js';
import { PART, parisClosed } from '@flux/subjects/matsci/fatigue.js';
import { ALLOY, creepClosed } from '@flux/subjects/matsci/creep.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Critical half-length in mm; `pi` and `with` reproduce the traps. */
export const critA = ($, pi = Math.PI, stress = ($$) => Number($$.sigma)) => ((ALLOYS[$.alloy].KIc / stress($)) ** 2 / pi) * 1000;

/** Paris-law life; `Y` and `unit` (crack depth to metres) reproduce the traps. */
export const parisLife = ($, Y = PART.Y, unit = 1e-3) => {
  const ds = Number($.ds);
  const a0 = Number($.a0) * unit;
  const ac = (PART.KIc / (Y * ds)) ** 2 / Math.PI;
  const e = 1 - PART.m / 2;
  return (ac ** e - a0 ** e) / (PART.C * (Y * ds * Math.sqrt(Math.PI)) ** PART.m * e);
};

/** Steady creep rate in units of 10⁻⁸ per second; `kelvin` and `n` reproduce the traps. */
export const creepRate = ($, kelvin = 273.15, n = ALLOY.n) => ALLOY.A * Number($.sigma) ** n * Math.exp(-ALLOY.Q / (ALLOY.R * (Number($.T) + kelvin))) * 1e8;

export default [
  problem({
    id: 'u4.1.critical',
    title: 'How long a crack it takes',
    exam: 'u4',
    ch: '4',
    lab: 'griffith',
    src: 'Flux, written for the Crack lab',
    topics: ['toughness'],
    principles: ['toughness'],
    vars: { alloy: choice(['aluminium', '7075 aluminium (K_Ic = 24 MPa·m^½, σ_y = 495 MPa)'], ['titanium', 'Ti-6Al-4V (K_Ic = 55 MPa·m^½, σ_y = 910 MPa)'], ['steel', '4340 steel (K_Ic = 50 MPa·m^½, σ_y = 1470 MPa)']), sigma: choice(['150', '150 MPa'], ['250', '250 MPa'], ['400', '400 MPa']) },
    text: (T) => `A wide plate of ${T.alloy} carries ${T.sigma} across a through crack. How long can the crack’s half-length a grow before the plate breaks, in mm?`,
    parts: [num('a', ($) => critA($), 'mm', { label: 'a_c' })],
    level: 2,
    hints: ['It breaks when σ√(πa) reaches K_Ic.', 'a_c = (1/π)(K_Ic/σ)².'],
    steps: ($) => [String.raw`$a_c = \frac{1}{\pi}\left(\frac{${ALLOYS[$.alloy].KIc}}{${$.sigma}}\right)^2 = ${Number(critA($).toPrecision(3))}$ mm`],
    sim: { scenario: 'holds', setup(s, $) { Object.assign(s, { alloy: $.alloy, sigma: Number($.sigma) }); }, read: (c) => ({ a: c.ac * 1000 }) },
    cases: [kase('aluminium at 150 MPa', { alloy: 'aluminium', sigma: '150' }, { a: 8.149 })],
  }),

  problem({
    id: 'u4.2.safety',
    title: 'Half of yield',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'griffith',
    src: 'Flux, written for the Crack lab',
    topics: ['toughness'],
    principles: ['toughness'],
    vars: { amm: choice(['0.5', '0.5 mm'], ['3', '3 mm']) },
    text: (T) => `A 4340 steel plate (K_Ic = 50 MPa·m^½, σ_y = 1470 MPa) runs at 735 MPa, a safety factor of 2 on yield. It has a through crack of half-length ${T.amm}. Does it hold?`,
    parts: [
      pick('a', 'the plate', [
        ['holds', 'it holds', 'K = σ√(πa) is below K_Ic.'],
        ['breaks', 'it breaks', 'K = σ√(πa) has reached K_Ic, whatever the margin on yield.'],
      ], ($) => (735 * Math.sqrt(Math.PI * Number($.amm) / 1000) >= 50 ? 'breaks' : 'holds')),
    ],
    level: 2,
    hints: ['Find K = σ√(πa) with a in metres.', 'Compare it with K_Ic, not the stress with σ_y.'],
    steps: ($) => [String.raw`$K = 735\sqrt{\pi \times ${Number($.amm) / 1000}} = ${(735 * Math.sqrt(Math.PI * Number($.amm) / 1000)).toFixed(1)}$ MPa·m^½ against 50`],
    sim: { scenario: 'safety', setup(s, $) { s.amm = Number($.amm); }, read: (c) => ({ a: c.breaks ? 'breaks' : 'holds' }) },
    cases: [kase('3 mm', { amm: '3' }, { a: 'breaks' })],
  }),
  problem({
    id: 'u4.3.paris',
    title: 'Cycles to failure',
    exam: 'u4',
    ch: '4',
    lab: 'paris',
    src: 'Flux, written for the Fatigue lab',
    topics: ['fatigue'],
    principles: ['fatigue'],
    vars: { ds: choice(['100', '100 MPa'], ['150', '150 MPa'], ['200', '200 MPa']), a0: choice(['1', '1 mm'], ['2', '2 mm']) },
    text: (T) => `A steel part with an edge crack ${T.a0} deep is cycled from 0 to ${T.ds}. Take Y = 1.12, C = 10⁻¹¹ m/cycle and m = 3 with ΔK in MPa·m^½, and K_Ic = 60 MPa·m^½. How many cycles until it breaks?`,
    parts: [num('N', ($) => parisLife($), 'cycles', { label: 'N_f' })],
    level: 3,
    hints: ['First find a_c, where Yσ_max√(πa) = K_Ic.', 'Integrate da/C(ΔK)^m from a₀ to a_c.'],
    steps: ($) => [String.raw`$a_c = \frac1\pi\left(\frac{60}{1.12 \times ${$.ds}}\right)^2$`, String.raw`$N_f = ${Number(parisLife($).toPrecision(3))}$ cycles`],
    sim: { scenario: 'fifth', setup(s, $) { Object.assign(s, { ds: Number($.ds), a0mm: Number($.a0) }); }, read: (c) => ({ N: c.N }) },
    cases: [kase('100 MPa, 1 mm', { ds: '100', a0: '1' }, { N: 723861 })],
  }),

  problem({
    id: 'u4.4.half',
    title: 'Half the stress',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'paris',
    src: 'Flux, written for the Fatigue lab',
    topics: ['fatigue'],
    principles: ['fatigue'],
    vars: { ds: choice(['200', 'from 200 MPa to 100 MPa'], ['100', 'from 100 MPa to 50 MPa']) },
    text: (T) => `A cracked steel part (Paris exponent m = 3) has its stress range halved, ${T.ds}. What happens to its fatigue life?`,
    parts: [
      pick('a', 'the life', [
        ['eight', 'it grows about eightfold or more', 'Growth per cycle falls as Δσ³, and the crack can grow deeper before it runs.'],
        ['two', 'it doubles', 'The growth law is a power law in ΔK, with m = 3.'],
        ['forever', 'it lasts forever', 'Below yield the crack still grows every cycle; only below a threshold ΔK does it stop.'],
      ], () => 'eight'),
    ],
    level: 2,
    hints: ['da/dN ∝ ΔK³ ∝ Δσ³.', 'Where does the crack run now?'],
    steps: () => ['Life ∝ Δσ^{−3} at the start, and a_c grows fourfold: about 8.5 times longer.'],
    sim: { scenario: 'fifth', setup(s, $) { s.ds = Number($.ds) / 2; }, read: (c, s) => ({ a: c.N / parisClosed({ ds: 2 * s.ds, a0mm: s.a0mm }).N > 6 ? 'eight' : 'two' }) },
    cases: [kase('200 to 100', { ds: '200' }, { a: 'eight' })],
  }),
  problem({
    id: 'u4.5.creep',
    title: 'A steady creep rate',
    exam: 'u4',
    ch: '4',
    lab: 'creep',
    src: 'Flux, written for the Creep lab',
    topics: ['creep'],
    principles: ['creep'],
    vars: { T: choice(['800', '800 °C'], ['850', '850 °C'], ['900', '900 °C']), sigma: choice(['150', '150 MPa'], ['200', '200 MPa'], ['250', '250 MPa']) },
    text: (T) => `A nickel superalloy creeps as ε̇ = Aσ⁵exp(−Q/RT) with A = 2.82 × 10⁻⁶ per second (σ in MPa), Q = 300 kJ/mol and R = 8.314 J/(mol·K). What is its steady creep rate at ${T.T} and ${T.sigma}, in units of 10⁻⁸ per second?`,
    parts: [num('r', ($) => creepRate($), '× 10⁻⁸ /s', { label: 'ε̇' })],
    level: 2,
    hints: ['Put T in kelvin.', 'The stress is raised to the fifth power.'],
    steps: ($) => [String.raw`$\dot\varepsilon = 2.82 \times 10^{-6}\,(${$.sigma})^5 e^{-300000/(8.314 \times ${Number($.T) + 273.15})} = ${Number(creepRate($).toPrecision(3))} \times 10^{-8}$ /s`],
    sim: { scenario: 'base', setup(s, $) { Object.assign(s, { TC: Number($.T), sigma: Number($.sigma) }); }, read: (c) => ({ r: c.rate * 1e8 }) },
    cases: [kase('850 °C, 200 MPa', { T: '850', sigma: '200' }, { r: 1.0063 })],
  }),

  problem({
    id: 'u4.6.hotter',
    title: 'A hundred kelvin',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'creep',
    src: 'Flux, written for the Creep lab',
    topics: ['creep'],
    principles: ['creep'],
    vars: { TC: choice(['850', 'from 750 °C to 850 °C'], ['950', 'from 850 °C to 950 °C']) },
    text: (T) => `A superalloy turbine part runs at a quarter of its yield strength. Its temperature rises ${T.TC}, at the same stress. What happens to its creep life?`,
    parts: [
      pick('a', 'the life', [
        ['ten', 'it falls about tenfold or more', 'The rate carries exp(−Q/RT); with Q = 300 kJ/mol, 100 K near 1100 K multiplies it by more than ten.'],
        ['little', 'it falls by about 10%', 'The temperature enters through an exponential, not in proportion.'],
        ['none', 'no change: the stress is below yield', 'Hot metals creep below yield.'],
      ], () => 'ten'),
    ],
    level: 1,
    hints: ['ε̇ ∝ exp(−Q/RT).', 'Compare exp(−Q/RT) at the two temperatures.'],
    steps: () => ['The rate rises, and the life falls, by more than tenfold over 100 K.'],
    sim: { scenario: 'base', setup(s, $) { s.TC = Number($.TC); }, read: (c, s) => ({ a: c.lifeH / creepClosed({ TC: s.TC - 100, sigma: s.sigma }).lifeH < 0.15 ? 'ten' : 'little' }) },
    cases: [kase('to 950', { TC: '950' }, { a: 'ten' })],
  }),
];
