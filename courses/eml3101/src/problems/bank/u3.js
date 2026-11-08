/**
 * Unit 3 bank: cycles and exergy. Original problems, each written for its lab, with staged hints and
 * named traps (../coaching/u3.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { exergyClosed } from '@flux/subjects/thermo/exergy.js';
import { rankineClosed } from '@flux/subjects/thermo/rankine.js';
import { pumpClosed } from '@flux/subjects/thermo/heatpump.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Work potential (kJ) of Q kJ at T K against 283.15 K; `how` reproduces the traps. */
export const workFrom = ($, how = 'right') => {
  const Q = Number($.Q);
  const T = Number($.T);
  if (how === 'rejected') return (Q * 283.15) / T;
  if (how === 'celsius') return Q * (1 - 10 / (T - 273.15));
  return Q * (1 - 283.15 / T);
};

/** Otto efficiency at r with k = 1.4; `how` reproduces the traps. */
export const ottoEta = ($, how = 'right') => {
  const r = Number($.r);
  if (how === 'k') return 1 - 1 / r ** 1.4;
  if (how === 'r') return 1 - 1 / r;
  return 1 - 1 / r ** 0.4;
};

/** Pump work (kJ/kg) from 10 kPa to pb MPa; `how` reproduces the traps. */
export const pumpWork = ($, how = 'right') => {
  const dp = Number($.pb) * 1000 - 10;
  if (how === 'vapour') return 14.67 * dp;
  if (how === 'mpa') return 0.00101 * (Number($.pb) - 0.01);
  return 0.00101 * dp;
};

/** Carnot COP of a heat pump for a 21 °C room and outdoor TL °C; `how` reproduces the traps. */
export const carnotHP = ($, how = 'right') => {
  const TL = Number($.TL);
  if (how === 'celsius') return 21 / (21 - TL);
  const tl = TL + 273.15;
  const th = 294.15;
  if (how === 'fridge') return tl / (th - tl);
  return th / (th - tl);
};

export default [
  problem({
    id: 'u3.1.exergy',
    title: 'Work from heat',
    exam: 'u3',
    ch: '3',
    lab: 'exergy',
    src: 'Flux, written for the Exergy lab',
    topics: ['exergy'],
    principles: ['exergy'],
    vars: { Q: choice(['100', '100 kJ'], ['500', '500 kJ']), T: choice(['400', '400 K'], ['800', '800 K'], ['1200', '1200 K']) },
    text: (T) => `${T.Q} of heat is available from a reservoir at ${T.T}. The surroundings are at 10 °C. What is the most work it could give, in kJ?`,
    parts: [num('X', ($) => workFrom($), 'kJ', { label: 'X' })],
    level: 1,
    hints: ['Run a Carnot engine between T and the surroundings.', 'X = Q(1 − T₀/T), with T₀ = 283.15 K.'],
    steps: ($) => [String.raw`$X = ${$.Q}(1 - 283.15/${$.T}) = ${Number(workFrom($).toPrecision(3))}$ kJ`],
    sim: { scenario: 'furnace', setup(s, $) { s.TK = Number($.T); }, read: (c, s, $) => ({ X: c.fr * Number($.Q) }) },
    cases: [kase('500 kJ at 800 K', { Q: '500', T: '800' }, { X: 323.0 })],
  }),

  problem({
    id: 'u3.2.which-kj',
    title: 'Which kilojoule?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'exergy',
    src: 'Flux, written for the Exergy lab',
    topics: ['exergy'],
    principles: ['exergy'],
    vars: { T: choice(['1500', 'a furnace at 1500 K'], ['700', 'steam at 700 K']) },
    text: (T) => `Which is worth more work, with surroundings at 10 °C: a kilojoule of heat from ${T.T}, or a kilojoule from warm water at 350 K?`,
    parts: [
      pick('a', 'the more valuable kilojoule', [
        ['hot', 'the hotter one', 'X = Q(1 − T₀/T) grows with T.'],
        ['same', 'they are the same: a kilojoule is a kilojoule', 'Equal energy, but not equal work potential.'],
        ['warm', 'the warm water', 'Heat near the surroundings’ temperature can give little work.'],
      ], () => 'hot'),
    ],
    level: 1,
    hints: ['Run a Carnot engine on each against the 283 K surroundings.', 'Compare 1 − T₀/T for the two.'],
    steps: () => ['The hotter heat has the larger Carnot factor, so more work potential.'],
    sim: { scenario: 'furnace', setup(s, $) { s.TK = Number($.T); }, read: (c) => ({ a: c.fr > exergyClosed({ TK: 350 }).fr ? 'hot' : 'warm' }) },
    cases: [kase('furnace', { T: '1500' }, { a: 'hot' })],
  }),
  problem({
    id: 'u3.3.otto',
    title: 'An Otto cycle’s efficiency',
    exam: 'u3',
    ch: '3',
    lab: 'cycles',
    src: 'Flux, written for the Otto and Diesel lab',
    topics: ['engines'],
    principles: ['engines'],
    vars: { r: choice(['8', '8'], ['9.5', '9.5'], ['11', '11'], ['12', '12']) },
    text: (T) => `An ideal Otto cycle with cold air (k = 1.4) has a compression ratio of ${T.r}. What is its thermal efficiency?`,
    parts: [num('eta', ($) => ottoEta($), '', { label: 'η' })],
    level: 1,
    hints: ['T₂/T₁ = r^{k−1} along the isentrope.', 'η = 1 − 1/r^{k−1}.'],
    steps: ($) => [String.raw`$\eta = 1 - ${$.r}^{-0.4} = ${Number(ottoEta($).toPrecision(3))}$`],
    sim: { scenario: 'same', setup(s, $) { s.r = Number($.r); }, read: (c) => ({ eta: c.etaO }) },
    cases: [kase('r = 8', { r: '8' }, { eta: 0.5647 })],
  }),

  problem({
    id: 'u3.4.which-cycle',
    title: 'Same compression ratio',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'cycles',
    src: 'Flux, written for the Otto and Diesel lab',
    topics: ['engines'],
    principles: ['engines'],
    vars: { r: choice(['10', '10'], ['16', '16']) },
    text: (T) => `An ideal Otto and an ideal Diesel cycle (cutoff 2) both have a compression ratio of ${T.r}. Which is more efficient?`,
    parts: [
      pick('a', 'the more efficient', [
        ['otto', 'the Otto', 'At the same r, adding heat at constant volume gets the full expansion; the Diesel’s bracket is above 1.'],
        ['diesel', 'the Diesel', 'Diesels are more efficient in practice because they run at higher r, not at the same r.'],
      ], () => 'otto'),
    ],
    level: 1,
    hints: ['Write both efficiencies at the same r.', 'What multiplies 1/r^{k−1} for the Diesel, and is it above or below 1?'],
    steps: () => ['(r_c^k − 1)/(k(r_c − 1)) > 1, so the Diesel is less efficient at the same r.'],
    sim: { scenario: 'same', setup(s, $) { Object.assign(s, { r: Number($.r), rc: 2 }); }, read: (c) => ({ a: c.etaO > c.etaD ? 'otto' : 'diesel' }) },
    cases: [kase('r = 16', { r: '16' }, { a: 'otto' })],
  }),
  problem({
    id: 'u3.5.pump',
    title: 'Pump work',
    exam: 'u3',
    ch: '3',
    lab: 'rankine',
    src: 'Flux, written for the Rankine lab',
    topics: ['rankine'],
    principles: ['rankine'],
    vars: { pb: choice(['6', '6 MPa'], ['10', '10 MPa'], ['15', '15 MPa']) },
    text: (T) => `An ideal pump takes saturated water at 10 kPa (v = 0.00101 m³/kg) to ${T.pb}. How much work does it need, in kJ/kg?`,
    parts: [num('w', ($) => pumpWork($), 'kJ/kg', { label: 'w_pump' })],
    level: 1,
    hints: ['Water is nearly incompressible: w = v Δp.', 'In kPa, v Δp comes out in kJ/kg.'],
    steps: ($) => [String.raw`$w = 0.00101 \times (${Number($.pb) * 1000} - 10) = ${Number(pumpWork($).toPrecision(3))}$ kJ/kg`],
    sim: { scenario: 'base', setup(s, $) { s.pb = Number($.pb); }, read: (c) => ({ w: c.wpApprox / 1000 }) },
    cases: [kase('6 MPa', { pb: '6' }, { w: 6.05 })],
  }),

  problem({
    id: 'u3.6.wetter',
    title: 'Higher pressure',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'rankine',
    src: 'Flux, written for the Rankine lab',
    topics: ['rankine'],
    principles: ['rankine'],
    vars: { pb: choice(['12', '12 MPa'], ['16', '16 MPa']) },
    text: (T) => `A Rankine plant without reheat raises its boiler pressure from 6 MPa to ${T.pb}, keeping 500 °C at the turbine inlet. What happens to the steam leaving the turbine?`,
    parts: [
      pick('a', 'the exhaust', [
        ['wetter', 'it is wetter', 'The turbine inlet’s entropy falls, so the isentropic expansion ends deeper in the dome.'],
        ['drier', 'it is drier', 'Higher pressure at the same temperature lowers the entropy, not raises it.'],
        ['same', 'unchanged: the condenser is the same', 'The exhaust state depends on where the expansion starts as well.'],
      ], () => 'wetter'),
    ],
    level: 2,
    hints: ['s₄ = s₃.', 'How does s₃ change with pressure at a fixed temperature?'],
    steps: () => ['Lower s₃ means lower s₄ at 10 kPa: lower quality.'],
    sim: { scenario: 'base', setup(s, $) { s.pb = Number($.pb); }, read: (c) => ({ a: c.x4 < rankineClosed({ pb: 6, TC: 500, reheat: 'no' }).x4 ? 'wetter' : 'drier' }) },
    cases: [kase('16 MPa', { pb: '16' }, { a: 'wetter' })],
  }),
  problem({
    id: 'u3.7.carnot-hp',
    title: 'The best a heat pump can do',
    exam: 'u3',
    ch: '3',
    lab: 'heatpump',
    src: 'Flux, written for the Heat pump lab',
    topics: ['heat-pump'],
    principles: ['heat-pump'],
    vars: { TL: choice(['-15', '−15 °C'], ['-5', '−5 °C'], ['5', '5 °C']) },
    text: (T) => `A heat pump keeps a room at 21 °C with the outdoor air at ${T.TL}. What is the highest COP any heat pump could have between them?`,
    parts: [num('cop', ($) => carnotHP($), '', { label: 'COP_max' })],
    level: 1,
    hints: ['A reversible heat pump: COP = T_H/(T_H − T_L).', 'Use kelvin.'],
    steps: ($) => [String.raw`$\text{COP} = \frac{294.15}{294.15 - ${(Number($.TL) + 273.15).toFixed(2)}} = ${Number(carnotHP($).toPrecision(3))}$`],
    sim: { scenario: 'mild', setup(s, $) { s.Tout = Number($.TL); }, read: (c) => ({ cop: c.carnot }) },
    cases: [kase('−5 °C', { TL: '-5' }, { cop: 11.32 })],
  }),

  problem({
    id: 'u3.8.colder',
    title: 'A colder day',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'heatpump',
    src: 'Flux, written for the Heat pump lab',
    topics: ['heat-pump'],
    principles: ['heat-pump'],
    vars: { TL: choice(['-10', 'from 7 °C to −10 °C'], ['-20', 'from 7 °C to −20 °C']) },
    text: (T) => `The outdoor air falls ${T.TL}. What happens to a heat pump’s COP?`,
    parts: [
      pick('a', 'the COP', [
        ['falls', 'it falls, but stays above 1', 'The lift from outdoor to indoor grows, so each kilojoule needs more work; it still beats a resistance heater.'],
        ['same', 'it stays the same: COP is a rating', 'COP depends on the temperatures it works between.'],
        ['below', 'it falls below 1', 'Even the real cycle stays well above 1 here.'],
      ], () => 'falls'),
    ],
    level: 1,
    hints: ['How does T_H/(T_H − T_L) change as T_L falls?', 'What does that do to the pressure ratio?'],
    steps: () => ['A bigger temperature lift: a larger pressure ratio, more work, lower COP.'],
    sim: { scenario: 'mild', setup(s, $) { s.Tout = Number($.TL); }, read: (c) => ({ a: c.cop < pumpClosed({ Tout: 7 }).cop ? (c.cop > 1 ? 'falls' : 'below') : 'same' }) },
    cases: [kase('to −20 °C', { TL: '-20' }, { a: 'falls' })],
  }),
];
