/**
 * Unit 5 bank: power. Original problems, written for the Power lab, with staged hints and named traps
 * (../coaching/u5.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

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
];
