/**
 * Unit 5 bank: sensors and signals. Original problems, written for the Strain bridge and Sampling
 * labs, with staged hints and named traps (../coaching/u5.js), each checked against its lab (`sim`).
 */
import { aliasFrequency, bridgeOutput, rootStrain } from '@flux/subjects/design/instruments.js';
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
];
