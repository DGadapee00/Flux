/**
 * Unit 4 bank: exchangers and mass transfer. Original problems, each written for its lab, with staged hints and
 * named traps (../coaching/u4.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { INLET } from '@flux/subjects/heat/exchanger.js';
import { AIRW, rhoSat, wetClosed } from '@flux/subjects/heat/wetbulb.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Counterflow duty with C_c = 1000 W/K; `flow` and `useMax` reproduce the traps. */
export const duty = ($, flow = 'counter', useMax = false) => {
  const Ch = Number($.Ch);
  const Cc = 1000;
  const Cmin = Math.min(Ch, Cc);
  const Cmax = Math.max(Ch, Cc);
  const Cr = Cmin / Cmax;
  const N = Number($.UA) / Cmin;
  const eps = flow === 'parallel' ? (1 - Math.exp(-N * (1 + Cr))) / (1 + Cr) : (1 - Math.exp(-N * (1 - Cr))) / (1 - Cr * Math.exp(-N * (1 - Cr)));
  return eps * (useMax ? Cmax : Cmin) * (INLET.Th - INLET.Tc);
};

/** Vapour density in the air (g/m³) from air T and wick Tw; `at` and `sign` reproduce the traps. */
export const vapourIn = ($, at = (T, Tw) => Tw, sign = -1) => {
  const T = Number($.T);
  const Tw = T - Number($.drop);
  const k = (AIRW.rho * AIRW.cp * AIRW.Le ** (2 / 3)) / AIRW.hfg;
  return (rhoSat(at(T, Tw)) + sign * k * (T - Tw)) * 1000;
};
/** The same from the lab's own balance: find the humidity whose wick sits at Tw. */
export const vapourByBalance = ($) => {
  const T = Number($.T);
  const Tw = T - Number($.drop);
  let lo = 0;
  let hi = 100;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (wetClosed({ T, rh: mid }).Tw < Tw) lo = mid;
    else hi = mid;
  }
  return (((lo + hi) / 200) * rhoSat(T)) * 1000;
};

export default [
  problem({
    id: 'u4.1.duty',
    title: 'A counterflow exchanger’s duty',
    exam: 'u4',
    ch: '4',
    lab: 'exchanger',
    src: 'Flux, written for the Exchanger lab',
    topics: ['exchangers'],
    principles: ['exchangers'],
    vars: { Ch: choice(['1500', '1500 W/K'], ['2000', '2000 W/K'], ['3000', '3000 W/K']), UA: choice(['1000', '1000 W/K'], ['2000', '2000 W/K'], ['4000', '4000 W/K']) },
    text: (T) => `A counterflow exchanger has UA = ${T.UA}. Hot water enters at 90 °C with capacity rate ${T.Ch}; cold water enters at 20 °C with 1000 W/K. What is the duty, in kW?`,
    parts: [num('q', ($) => duty($) / 1000, 'kW', { label: 'q' })],
    level: 2,
    hints: ['C_min is the cold stream’s; C_r = C_min/C_max.', 'Find ε from NTU = UA/C_min, then q = εC_min(T_h,i − T_c,i).'],
    steps: ($) => [String.raw`$\text{NTU} = ${Number($.UA) / 1000}$, $C_r = ${Number((1000 / Number($.Ch)).toPrecision(3))}$`, String.raw`$q = ${Number((duty($) / 1000).toPrecision(3))}$ kW`],
    sim: { scenario: 'counter', setup(s, $) { Object.assign(s, { flow: 'counter', Ch: Number($.Ch), UA: Number($.UA) }); }, read: (c) => ({ q: c.q / 1000 }) },
    cases: [kase('C_h = 2000, UA = 2000', { Ch: '2000', UA: '2000' }, { q: 54.22 })],
  }),

  problem({
    id: 'u4.2.cross',
    title: 'Which outlet is hotter?',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'exchanger',
    src: 'Flux, written for the Exchanger lab',
    topics: ['exchangers'],
    principles: ['exchangers'],
    vars: { flow: choice(['counter', 'counterflow'], ['parallel', 'parallel flow']) },
    text: (T) => `Two equal streams pass through a long exchanger in ${T.flow}. Can the cold stream leave hotter than the hot stream leaves?`,
    parts: [
      pick('a', 'the cold outlet', [
        ['can', 'yes, it can', 'In counterflow the cold outlet faces the hot inlet, so it can pass the hot outlet.'],
        ['cannot', 'no, never', 'In parallel flow the streams close on a common temperature from either side and cannot cross.'],
      ], ($) => ($.flow === 'counter' ? 'can' : 'cannot')),
    ],
    level: 1,
    hints: ['Where does the cold stream leave?', 'What does it face there?'],
    steps: ($) => [$.flow === 'counter' ? 'The cold stream leaves at the hot inlet end, and can rise above the hot outlet.' : 'Both streams leave at the same end; the cold one stays below the hot one all the way.'],
    sim: { scenario: 'counter', setup(s, $) { s.flow = $.flow; }, read: (c) => ({ a: c.cross ? 'can' : 'cannot' }) },
    cases: [kase('parallel', { flow: 'parallel' }, { a: 'cannot' })],
  }),
  problem({
    id: 'u4.3.humidity',
    title: 'Humidity from a wet bulb',
    exam: 'u4',
    ch: '4',
    lab: 'wetbulb',
    src: 'Flux, written for the Wet bulb lab',
    topics: ['evaporation'],
    principles: ['evaporation'],
    vars: { T: choice(['25', '25 °C'], ['30', '30 °C'], ['35', '35 °C']), drop: choice(['6', '6'], ['8', '8'], ['10', '10']) },
    text: (T, $) => `A wet wick in air at ${T.T} reads ${Number($.T) - Number($.drop)} °C, where saturated vapour has a density of ${(rhoSat(Number($.T) - Number($.drop)) * 1000).toFixed(2)} g/m³. Take ρc_p Le^{2/3} = 1048 J/(m³·K) and h_fg = 2430 kJ/kg. What is the vapour density in the air, in g/m³?`,
    parts: [num('rv', ($) => vapourIn($), 'g/m³', { label: 'ρ_v,∞' })],
    level: 2,
    hints: ['In steady state h(T_∞ − T_w) = h_m h_fg(ρ_v,sat(T_w) − ρ_v,∞).', 'Divide by h_m: h/h_m = ρc_p Le^{2/3}.'],
    steps: ($) => [String.raw`$\rho_{v,\infty} = \rho_{v,\text{sat}}(T_w) - \frac{1048 \times ${$.drop}}{2.43 \times 10^6} = ${Number(vapourIn($).toPrecision(3))}$ g/m³`],
    second: ($) => ({ rv: vapourByBalance($) }),
    cases: [kase('30 °C, wick at 22 °C', { T: '30', drop: '8' }, { rv: 15.94 })],
  }),

  problem({
    id: 'u4.4.wick',
    title: 'Where a wet wick settles',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'wetbulb',
    src: 'Flux, written for the Wet bulb lab',
    topics: ['evaporation'],
    principles: ['evaporation'],
    vars: { rh: choice(['30', '30%'], ['60', '60%']) },
    text: (T) => `A wet wick hangs in moving air at 30 °C and ${T.rh} relative humidity. Where does its temperature settle?`,
    parts: [
      pick('a', 'the wick', [
        ['below', 'below the air, above the dew point', 'Evaporation carries latent heat off, and convection from the air pays for it at a lower temperature.'],
        ['at', 'at the air temperature', 'Only if the air is saturated; otherwise vapour leaves and cools the wick.'],
        ['dew', 'at the dew point', 'At the dew point vapour would condense on the wick, not evaporate from it.'],
      ], () => 'below'),
    ],
    level: 1,
    hints: ['Is vapour leaving the wick?', 'What does each kilogram of it carry away?'],
    steps: () => ['The wick settles where h(T_∞ − T_w) equals h_m h_fg(ρ_v,s − ρ_v,∞): below the air, above the dew point.'],
    sim: { scenario: 'mild', setup(s, $) { s.rh = Number($.rh); }, read: (c) => ({ a: c.depression < 0.05 ? 'at' : c.Tw - c.dew < 0.05 ? 'dew' : 'below' }) },
    cases: [kase('60%', { rh: '60' }, { a: 'below' })],
  }),
];
