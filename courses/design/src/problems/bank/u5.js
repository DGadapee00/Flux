/**
 * Unit 5 bank: sensors and signals. Original problems, written for the Strain bridge and Sampling
 * labs, with staged hints and named traps (../coaching/u5.js), each checked against its lab (`sim`).
 */
import { aliasFrequency, bridgeOutput, orificeFlow, rootStrain } from '@flux/subjects/design/instruments.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const ARM = { L: 100, b: 20, h: 8, E: 68e3 };
export const strainAt = (P) => rootStrain({ P, ...ARM });
export const bridgeMv = ($) => bridgeOutput({ kind: $.kind, Vex: 5, GF: 2, strain: strainAt($.P) }).exact * 1000;
export const ACTIVE = { quarter: 1, half: 2, full: 4 };

export default [
  problem({
    id: 'u5.1.bridge-output',
    title: 'Bridge output',
    exam: 'u5',
    ch: '5',
    lab: 'bridge',
    src: 'Flux, written for the Strain bridge lab',
    topics: ['bridge'],
    principles: ['bridge'],
    vars: { kind: choice(['quarter', 'one gauge on top (a quarter bridge)'], ['half', 'one gauge on top and one below (a half bridge)'], ['full', 'two gauges on top and two below (a full bridge)']), P: range(50, 200, 10, 'N') },
    text: (T, $) => String.raw`The root of an aluminium arm is strained to ${(strainAt($.P) * 1e6).toFixed(0)} με by a ${$.P} N load. It carries ${T.kind}, with gauge factor 2 and 5 V excitation. What does the bridge put out?`,
    parts: [num('V', ($) => bridgeMv($), 'mV', { label: 'bridge output' })],
    level: 2,
    hints: ['Each active gauge in the right arm adds $V\\,GF\\,\\varepsilon/4$.', 'Count the active gauges, $n$, and use $V_o = V\\,n\\,GF\\,\\varepsilon/4$, with $\\varepsilon$ as a plain number (με × 10⁻⁶).'],
    steps: ($, sig) => [String.raw`$V_o = 5 \times ${ACTIVE[$.kind]} \times 2 \times ${sig(strainAt($.P))}/4 = ${sig(bridgeMv($))}$ mV.`],
    sim: {
      scenario: 'quarter',
      setup(s, $) {
        Object.assign(s, { kind: $.kind, P: $.P, dT: 0, Vex: 5 });
      },
      read: (c) => ({ V: c.out * 1000 }),
    },
    cases: [kase('The notes’ example: one gauge, 100 N', { kind: 'quarter', P: 100 }, { V: 1.722 })],
  }),

  problem({
    id: 'u5.2.which-cancels',
    title: 'Heat or load?',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'bridge',
    src: 'Flux, written for the Strain bridge lab',
    topics: ['bridge'],
    principles: ['bridge'],
    vars: { kind: choice(['quarter', 'one gauge on top, three fixed resistors'], ['half', 'one gauge on top and one below, in adjacent arms'], ['full', 'two gauges on top and two below']) },
    text: (T) => `A loaded arm carries ${T.kind} in a bridge. The room warms 10 °C, and every gauge’s resistance creeps up a little. Does the reading change?`,
    parts: [
      pick('shifts', 'the reading', [
        ['yes', 'yes: the warm-up reads as extra load', 'A lone gauge changes against fixed resistors, so the bridge goes out of balance.'],
        ['no', 'no: the warm-up cancels', 'Gauges in adjacent arms change together, so the bridge stays balanced for heat while the strain signals add.'],
      ], ($) => ($.kind === 'quarter' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['A bridge reads the difference between its arms.', 'Which arms change when the temperature rises, and do they sit so their changes cancel?'],
    steps: ($) => [$.kind === 'quarter' ? 'Only one arm changes with heat, so the bridge reads it.' : 'The heated gauges sit in adjacent arms of each divider, so heat leaves the ratios unchanged.'],
    sim: {
      scenario: 'warm',
      setup(s, $) {
        Object.assign(s, { kind: $.kind, dT: 10 });
      },
      read: (c) => ({ shifts: Math.abs(c.heatError) > 0.01 * Math.abs(c.out) ? 'yes' : 'no' }),
    },
    cases: [kase('A quarter bridge', { kind: 'quarter' }, { shifts: 'yes' })],
  }),

  problem({
    id: 'u5.3.alias',
    title: 'The frequency the samples show',
    exam: 'u5',
    ch: '5',
    lab: 'sampling',
    src: 'Flux, written for the Sampling lab',
    topics: ['sampling'],
    principles: ['nyquist'],
    vars: { what: choice(['fan', 'a fan'], ['gearbox', 'a gearbox'], ['pump', 'a pump']), f: range(510, 990, 10, 'Hz') },
    text: (T) => `A vibration sensor on ${T.what} picks up a ${T.f} tone. The logger samples at 1000 Hz with no filter in front. At what frequency does the tone appear in the data?`,
    parts: [num('fa', ($) => aliasFrequency($.f, 1000), 'Hz', { label: 'frequency in the data' })],
    level: 2,
    hints: ['The Nyquist frequency is half the sample rate. Above it, the tone folds back.', 'A tone at f between fₛ/2 and fₛ shows up at fₛ − f.'],
    steps: ($) => [`${$.f} Hz is above 500 Hz, so it folds back to 1000 − ${$.f} = ${1000 - $.f} Hz.`],
    sim: {
      scenario: 'alias',
      setup(s, $) {
        Object.assign(s, { f: $.f, fs: 1000 });
      },
      read: (c) => ({ fa: c.fa }),
    },
    cases: [kase('The notes’ example: 950 Hz', { what: 'fan', f: 950 }, { fa: 50 })],
  }),
  problem({
    id: 'u5.4.thermocouple',
    title: 'An uncompensated thermocouple',
    exam: 'u5',
    ch: '5',
    lab: 'temperature',
    src: 'Flux, written for the Temperature sensors lab',
    topics: ['temperature'],
    principles: ['reference-junction'],
    vars: { what: choice(['oven', 'an oven'], ['exhaust', 'an exhaust pipe'], ['bath', 'an oil bath']), tip: range(100, 400, 10, '°C'), room: range(15, 35, 1, '°C') },
    text: (T) => `A type K thermocouple sits in ${T.what} at ${T.tip}. Its wires end at a logger in a ${T.room} room, and the logger takes its terminals to be at 0 °C. What temperature does it report?`,
    parts: [num('T', ($) => $.tip - $.room, '°C', { label: 'reported temperature' })],
    level: 1,
    hints: ['A thermocouple’s voltage measures the difference between its tip and where its wires meet the logger.', 'The logger converts that difference to a temperature and adds what it thinks the terminals are at: 0 °C.'],
    steps: ($) => [`The voltage stands for ${$.tip} − ${$.room} = ${$.tip - $.room} °C, and the logger adds 0, so it reports ${$.tip - $.room} °C: low by the room’s ${$.room} °C.`],
    sim: {
      scenario: 'no-cjc',
      setup(s, $) {
        Object.assign(s, { tip: $.tip, room: $.room, cjc: false });
      },
      read: (c) => ({ T: c.tc }),
    },
    cases: [kase('The notes’ example: 200 °C in a 25 °C room', { what: 'bath', tip: 200, room: 25 }, { T: 175 })],
  }),

  problem({
    id: 'u5.5.orifice-flow',
    title: 'Flow from an orifice',
    exam: 'u5',
    ch: '5',
    lab: 'orifice',
    src: 'Flux, written for the Orifice meter lab',
    topics: ['orifice'],
    principles: ['square-law'],
    vars: { beta: choice(['0.4', 'a 20 mm hole (β = 0.4)'], ['0.5', 'a 25 mm hole (β = 0.5)'], ['0.6', 'a 30 mm hole (β = 0.6)']), dp: range(10, 100, 5, 'kPa', 1000) },
    text: (T, $) => String.raw`Water ($\rho = 998$ kg/m³) flows through an orifice plate with ${T.beta} in a 50 mm pipe. The drop across it reads ${$.dp / 1000} kPa. With $C_d = 0.61$, what is the flow in m³/h?`,
    parts: [num('Q', ($) => orificeFlow({ dp: $.dp, D: 0.05, beta: Number($.beta) }) * 3600, 'm³/h', { label: 'flow' })],
    level: 2,
    hints: ['$Q = C_d A_2 \\sqrt{2\\Delta p/(\\rho(1 - \\beta^4))}$, with $A_2$ the hole’s area.', 'Work in SI: Δp in Pa and the hole in metres, then multiply m³/s by 3600.'],
    steps: ($, sig) => [String.raw`$A_2 = \pi(${sig(Number($.beta) * 0.05)})^2/4$, so $Q = ${sig(orificeFlow({ dp: $.dp, D: 0.05, beta: Number($.beta) }) * 3600)}$ m³/h.`],
    sim: {
      scenario: 'design',
      setup(s, $) {
        Object.assign(s, { D: 50, beta: Number($.beta), Q: orificeFlow({ dp: $.dp, D: 0.05, beta: Number($.beta) }) * 3600 });
      },
      read: (c, s) => ({ Q: orificeFlow({ dp: c.dp, D: s.D / 1000, beta: s.beta }) * 3600 }),
    },
    cases: [kase('β = 0.5 reading 90.3 kPa', { beta: '0.5', dp: 90.3 }, { Q: 15.0 })],
  }),
  problem({
    id: 'u5.6.reads-wrong',
    title: 'High, low or true?',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'temperature',
    src: 'Flux, written for the Temperature sensors lab',
    topics: ['temperature'],
    principles: ['reference-junction'],
    vars: { setup: choice(['tc', 'a thermocouple on a logger that takes its terminals as 0 °C, in a 25 °C room'], ['rtd2', 'a Pt100 on two long leads of 0.5 Ω each'], ['rtd4', 'a Pt100 on four wires with the same long leads']) },
    text: (T) => `A bath at 200 °C is measured with ${T.setup}. How does the reading compare with the bath?`,
    parts: [
      pick('reads', 'the reading', [
        ['low', 'it reads low', 'The thermocouple loses the room’s 25 °C: it measures tip minus terminals.'],
        ['high', 'it reads high', 'The leads add resistance, which the logger reads as extra heat.'],
        ['true', 'it reads true', 'Four wires carry the current on one pair and sense the voltage on the other, past the leads.'],
      ], ($) => ({ tc: 'low', rtd2: 'high', rtd4: 'true' }[$.setup])),
    ],
    level: 1,
    hints: ['What does each sensor measure: a difference of temperatures, or a resistance?', 'What else gets into that measurement in this hookup?'],
    steps: ($) => [{ tc: 'The voltage stands for 175 °C of difference, and the logger adds 0: it reads 175 °C.', rtd2: 'The 1 Ω of lead adds about 2.7 °C at this temperature: it reads high.', rtd4: 'The sensing pair carries no current, so the leads drop no voltage on it: it reads true.' }[$.setup]],
    sim: {
      scenario: 'cjc',
      setup(s, $) {
        Object.assign(s, { tip: 200, room: 25, cjc: $.setup !== 'tc', lead: 0.5, wires: $.setup === 'rtd2' ? 2 : 4 });
      },
      read: (c, s, $) => {
        const v = $.setup === 'tc' ? c.tc : c.rtd;
        return { reads: v < 199.5 ? 'low' : v > 200.5 ? 'high' : 'true' };
      },
    },
    cases: [kase('Two-wire RTD', { setup: 'rtd2' }, { reads: 'high' })],
  }),
];
