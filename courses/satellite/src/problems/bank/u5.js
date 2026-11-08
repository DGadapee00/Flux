/**
 * Unit 5 bank: power. Original problems, written for the Power lab, with staged hints and named traps
 * (../coaching/u5.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { BUS } from '@flux/subjects/em/ageing.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const MU = 398600;
const R = 6378;
export const ALT = { low: 400, mid: 800, high: 1500 };
export const geometry = ($) => {
  const r = R + ALT[$.orbit];
  const T = 2 * Math.PI * Math.sqrt(r ** 3 / MU);
  return { r, T, Te: (T * Math.asin(R / r)) / Math.PI };
};
/** The eclipse in minutes; `share` names a trap. */
export const eclipseMin = ($, share = 'right') => {
  const g = geometry($);
  return share === 'half' ? g.T / 2 / 60 : share === 'oneSide' ? (g.T * Math.asin(R / g.r)) / (2 * Math.PI) / 60 : g.Te / 60;
};
/** The tracking array needed in sunlight, η = 0.9 each way; `how` names the traps. */
export const arrayNeeded = ($, how = 'right') => {
  const g = geometry($);
  const Ts = g.T - g.Te;
  if (how === 'average') return ($.load * g.T) / Ts;
  if (how === 'load') return $.load;
  return ($.load * (Ts + g.Te / 0.81)) / Ts;
};

/** Capacity (Wh) after y years from C0, by the cubic law; `how` reproduces the traps. */
export const capacityAfter = ($, how = 'right') => {
  const C0 = Number($.C0);
  const k = C0 / 6000;
  const n = Number($.y) * BUS.cyclesPerYear;
  if (how === 'fixed') return C0 - k * (BUS.E / C0) ** 2 * n;
  if (how === 'depthless') return C0 - k * n;
  return Math.cbrt(C0 ** 3 - 3 * k * BUS.E ** 2 * n);
};

export default [
  problem({
    id: 'u5.1.eclipse',
    title: 'How long is the eclipse?',
    exam: 'u5',
    ch: '5',
    lab: 'power',
    src: 'Flux, written for the Power lab',
    topics: ['power'],
    principles: ['power'],
    vars: { orbit: choice(['low', '400 km'], ['mid', '800 km'], ['high', '1500 km']) },
    text: (T) => `A satellite is on a circular orbit at ${T.orbit}, with the Sun in the orbit's plane. Treat Earth's shadow as a cylinder. How long is each eclipse, in minutes? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('t', ($) => eclipseMin($), 'min', { label: 'T_e' })],
    level: 2,
    hints: ['The shadow covers an arc of the orbit of half-angle asin(R/r), with r = R + h.', 'T_e = T × 2asin(R/r)/(2π) = T asin(R/r)/π, with T = 2π√(r³/μ).'],
    steps: ($) => {
      const g = geometry($);
      return [String.raw`$r = ${g.r}$ km, $T = ${Number((g.T / 60).toPrecision(4))}$ min, $\arcsin(R/r) = ${Number(Math.asin(R / g.r).toPrecision(4))}$ rad`, String.raw`$T_e = ${Number((g.Te / 60).toPrecision(3))}$ min`];
    },
    sim: {
      scenario: 'sized',
      setup(s, $) {
        s.h = ALT[$.orbit];
      },
      read: (c) => ({ t: c.Te / 60 }),
    },
    cases: [kase('at 800 km', { orbit: 'mid' }, { t: 35.13 })],
  }),

  problem({
    id: 'u5.2.array',
    title: 'Sizing the array',
    exam: 'u5',
    ch: '5',
    lab: 'power',
    src: 'Flux, written for the Power lab',
    topics: ['power'],
    principles: ['power'],
    vars: { orbit: choice(['low', '400 km'], ['mid', '800 km'], ['high', '1500 km']), load: range(10, 50, 10, 'W') },
    text: (T) => `A satellite at ${T.orbit} draws ${T.load} W all the time. Its sun-tracking array works only in daylight, and its battery charges and discharges at 90% efficiency each way. What array power is needed in sunlight, in W? μ = 398,600 km³/s², Earth's radius 6378 km, Sun in the orbit's plane.`,
    parts: [num('P', ($) => arrayNeeded($), 'W', { label: 'P_sun' })],
    level: 3,
    hints: ['Find the period and the eclipse, T_e = T asin(R/r)/π, and the daylight T_s = T − T_e.', 'In daylight the array runs the load and also puts back P_L T_e/(0.9 × 0.9).'],
    steps: ($) => {
      const g = geometry($);
      return [String.raw`$T_s = ${Number(((g.T - g.Te) / 60).toPrecision(4))}$ min, $T_e = ${Number((g.Te / 60).toPrecision(4))}$ min`, String.raw`$P = P_L(T_s + T_e/0.81)/T_s = ${Number(arrayNeeded($).toPrecision(3))}$ W`];
    },
    sim: {
      scenario: 'sized',
      setup(s, $) {
        Object.assign(s, { h: ALT[$.orbit], Pload: $.load, panel: 'tracking' });
      },
      read: (c) => ({ P: c.needSun }),
    },
    cases: [kase('30 W at 800 km', { orbit: 'mid', load: 30 }, { P: 49.79 })],
  }),

  problem({
    id: 'u5.3.average',
    title: 'Is the average enough?',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'power',
    src: 'Flux, written for the Power lab',
    topics: ['power'],
    principles: ['power'],
    vars: { sizing: choice(['average', 'so that its output averaged over a whole orbit equals the load'], ['refill', 'to carry the load in daylight and also refill, through its losses, what the eclipse draws']) },
    text: (T) => `A satellite's sun-tracking array is sized ${T.sizing}. Over many orbits, what does the battery do?`,
    parts: [
      pick('d', 'the battery', [
        ['keeps', 'it is full again before every eclipse', 'The daylight surplus covers the eclipse draw and the charge and discharge losses.'],
        ['sinks', 'it sinks a little every orbit until it runs flat', 'Energy for the eclipse passes through the battery, and the losses on the way in and out are never made up.'],
      ], ($) => ($.sizing === 'average' ? 'sinks' : 'keeps')),
    ],
    level: 1,
    hints: ['Follow a watt-hour from the array, through the battery, to the eclipse load.', 'At 90% each way, only 81% of it arrives.'],
    steps: ($) => [$.sizing === 'average' ? 'Matching the average ignores the 19% lost through the battery: it sinks.' : 'Sized with the losses, daylight refills the battery: it keeps up.'],
    sim: {
      scenario: 'sized',
      setup(s, $) {
        // The lab's 20 W load at 500 km: the average match is 32.1 W, the refill sizing 35.0 W.
        Object.assign(s, { h: 500, Pload: 20, panel: 'tracking', Ebatt: 40, Ppeak: $.sizing === 'average' ? 32.1 : 35.1 });
      },
      read: (c) => ({ d: c.sustains ? 'keeps' : 'sinks' }),
    },
    cases: [kase('the average', { sizing: 'average' }, { d: 'sinks' })],
  }),
  problem({
    id: 'u5.4.fade',
    title: 'A fading battery',
    exam: 'u5',
    ch: '5',
    lab: 'ageing',
    src: 'Flux, written for the Ageing lab',
    topics: ['ageing'],
    principles: ['ageing'],
    vars: { C0: choice(['150', '150 Wh'], ['175', '175 Wh']), y: choice(['4', '4 years'], ['5', '5 years'], ['6', '6 years']) },
    text: (T) => `A battery of ${T.C0} covers a 35 Wh eclipse 5700 times a year. Its capacity fades as dC/dn = −k(E/C)² per cycle with k = C₀/6000. What is its capacity after ${T.y}, in Wh?`,
    parts: [num('C', ($) => capacityAfter($), 'Wh', { label: 'C' })],
    level: 3,
    hints: ['Separate: C² dC = −kE² dn.', 'C = (C₀³ − 3kE²n)^{1/3}, with n the number of cycles.'],
    steps: ($) => [String.raw`$n = ${Number($.y) * 5700}$, $C = (${$.C0}^3 - 3(${(Number($.C0) / 6000).toFixed(4)})(35^2)n)^{1/3} = ${Number(capacityAfter($).toPrecision(3))}$ Wh`],
    sim: { scenario: 'sized', setup(s, $) { Object.assign(s, { C0: Number($.C0), years: Number($.y) }); }, read: (c) => ({ C: c.C }) },
    cases: [kase('175 Wh, 5 years', { C0: '175', y: '5' }, { C: 132.1 })],
  }),

  problem({
    id: 'u5.5.deeper',
    title: 'Fading faster',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'ageing',
    src: 'Flux, written for the Ageing lab',
    topics: ['ageing'],
    principles: ['ageing'],
    vars: { C0: choice(['175', 'a 175 Wh battery'], ['250', 'a 250 Wh battery']) },
    text: (T) => `${T.C0} covers the same 35 Wh eclipse every orbit for years. As it fades, does each cycle cost it more or less capacity than the one before?`,
    parts: [
      pick('a', 'each cycle', [
        ['more', 'more', 'The same 35 Wh is a deeper discharge of a smaller battery, and deeper cycles fade it faster.'],
        ['less', 'less', 'The fade depends on depth, and depth grows as capacity falls.'],
        ['same', 'the same', 'Only if the fade per cycle did not depend on depth.'],
      ], () => 'more'),
    ],
    level: 1,
    hints: ['What is the depth of discharge as capacity falls?', 'How does fade depend on depth?'],
    steps: () => ['d = E/C rises as C falls, and fade ∝ d²: each cycle costs more.'],
    sim: { scenario: 'sized', setup(s, $) { Object.assign(s, { C0: Number($.C0), years: 5 }); }, read: (c) => ({ a: c.dod > c.dod0 ? 'more' : 'same' }) },
    cases: [kase('175 Wh', { C0: '175' }, { a: 'more' })],
  }),
];
