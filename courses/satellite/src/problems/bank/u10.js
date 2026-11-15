/**
 * Unit 10 bank: avionics, flight software and data. Original problems, with staged hints and named
 * traps (../coaching/u10.js). Load and data problems are checked against the Flight software and
 * Data budget labs (`sim`); the rest against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { scheduleClosed, scheduleSimulated } from '@flux/subjects/design/scheduling.js';
import { dataClosed } from '@flux/subjects/design/databudget.js';
import { passesClosed, EARTH } from '@flux/subjects/mechanics/passes.js';
import { taskSet } from '../../labs/tasks.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** The lab's five tasks: load at a processor speed and payload run time; `how` names the traps. */
export function loadFor($, how = 'right') {
  const speed = Number($.speed);
  const tasks = taskSet({ speed: how === 'noSpeed' ? 1 : speed, payMs: Number($.pay), adcsHz: 10 });
  const U = tasks.reduce((s, t) => s + t.C / t.T, 0);
  return how === 'times' ? U * speed * speed : U;
}

/** Three tasks, in milliseconds. */
const three = ($) => [
  { id: 'a', T: 50, C: Number($.a) },
  { id: 'b', T: 120, C: Number($.b) },
  { id: 'c', T: 400, C: Number($.c) },
];
/** Worst response of the lowest task; `how` names the traps. */
export function responseC($, how = 'right') {
  const [a, b, c] = three($);
  if (how === 'once') return c.C + a.C + b.C;
  if (how === 'alone') return c.C;
  return scheduleClosed(three($)).response.c;
}

/** Overhead pass length in minutes; `how` names the traps. */
export function passMin($, how = 'right') {
  const hkm = Number($.h);
  const eps = how === 'noEps' ? 0 : Number($.e);
  const p = passesClosed({ hkm, eps });
  return how === 'halfArc' ? p.tpmin / 2 : p.tpmin;
}

/** Gbit sent a day at 500 km above 10°; `how` names the traps. */
export function sentGbit($, how = 'right') {
  const tp = passesClosed({ hkm: 500, eps: 10 }).tp;
  const k = Number($.k);
  const D = Number($.D);
  if (how === 'oneGroup') return (k * tp * D) / 1e6;
  if (how === 'minutes') return (2 * k * (tp / 60) * D) / 1e6;
  return (2 * k * tp * D) / 1e6;
}

const DEVICES = {
  mag: { text: 'a magnetometer sending 0.3 kbit/s', need: 0.3 },
  thumb: { text: 'a camera sending 1.2 Mbit/s of thumbnails', need: 1200 },
  camera: { text: 'a camera sending 5.0 Mbit/s of full frames', need: 5030 },
  temp: { text: 'eight temperature sensors sending 150 kbit/s in all', need: 150 },
};
const BUSES = [['i2c100', 100], ['i2c400', 400], ['i2c3400', 3400], ['spi', 20000]];
const slowestBus = (need) => BUSES.find(([, r]) => r >= need)[0];

const TIMEOUTS = [1, 2, 4, 8];

export default [
  problem({
    id: 'u10.1.load',
    title: 'The processor’s load',
    exam: 'u10',
    ch: '10',
    lab: 'tasks',
    src: 'Flux, written for the Flight software lab',
    topics: ['scheduling'],
    principles: ['scheduling'],
    vars: { speed: choice(['0.8', '0.8 times'], ['1.25', '1.25 times'], ['2', 'twice']), pay: choice(['60', '60 ms'], ['90', '90 ms'], ['120', '120 ms']) },
    variety: ['processor speed and payload run time'],
    text: (T) => `On the baseline processor, attitude control takes 18 ms every 100 ms, commands 20 ms every 250 ms, payload processing ${T.pay} every 500 ms, telemetry 120 ms every 1000 ms and housekeeping 150 ms every 2000 ms. The flight processor runs ${T.speed} as fast as the baseline. What is its load U, as a fraction?`,
    parts: [num('U', ($) => loadFor($), '', { label: 'U', tol: 0.01 })],
    level: 2,
    hints: ['A faster processor divides each run time by its speed.', 'U = Σ C/T over the five tasks.'],
    steps: ($) => [String.raw`$U_\text{baseline} = ${fmt(loadFor($, 'noSpeed'))}$`, String.raw`$U = ${fmt(loadFor($, 'noSpeed'))}/${$.speed} = ${fmt(loadFor($))}$`],
    sim: { scenario: 'nominal', setup(s, $) { Object.assign(s, { speed: Number($.speed), payMs: Number($.pay), adcsHz: 10 }); }, read: (c) => ({ U: c.U }) },
    cases: [kase('twice as fast, 90 ms', { speed: '2', pay: '90' }, { U: 0.3175 })],
  }),

  problem({
    id: 'u10.2.response',
    title: 'The lowest task’s worst response',
    exam: 'u10',
    ch: '10',
    src: 'Flux, after rate-monotonic analysis',
    topics: ['scheduling'],
    principles: ['scheduling'],
    vars: { a: choice(['10', '10'], ['15', '15']), b: choice(['20', '20'], ['30', '30']), c: choice(['60', '60'], ['90', '90']) },
    variety: ['run times'],
    text: (T) => `Three tasks share a processor under rate-monotonic priorities: A runs ${T.a} ms every 50 ms, B ${T.b} ms every 120 ms, and C ${T.c} ms every 400 ms. All three are released together. How long after its release does C finish, in ms?`,
    parts: [num('R', ($) => responseC($), 'ms', { label: 'R_C' })],
    level: 3,
    hints: ['Start from R = C_C and add every run of A and B that starts before C finishes.', 'Iterate R = C_C + ⌈R/50⌉C_A + ⌈R/120⌉C_B until it stops changing.'],
    steps: ($) => [String.raw`$R = ${$.c} + \lceil R/50\rceil ${$.a} + \lceil R/120\rceil ${$.b}$`, String.raw`It settles at $R = ${responseC($)}$ ms`],
    second: ($) => ({ R: scheduleSimulated(three($)).first.c }),
    cases: [kase('10, 20, 60', { a: '10', b: '20', c: '60' }, { R: 100 })],
  }),

  problem({
    id: 'u10.3.bound',
    title: 'Above the bound',
    exam: 'u10',
    ch: '10',
    kind: 'conceptual',
    lab: 'tasks',
    src: 'Flux, written for the Flight software lab',
    topics: ['scheduling'],
    principles: ['scheduling'],
    vars: { U: choice(['0.6', '60%'], ['0.9', '90%'], ['1.1', '110%']) },
    variety: ['which load'],
    text: (T) => `Five periodic tasks, scheduled rate-monotonic, load a processor to ${T.U}. The Liu–Layland bound for five tasks is 74.3%. What can you say about their deadlines?`,
    parts: [
      pick('d', 'the deadlines', [
        ['all', 'every deadline is met', 'Below the bound, Liu and Layland proved every deadline is met.'],
        ['test', 'they may all be met: run the exact response-time test', 'Between the bound and 100% the bound says nothing; the exact test decides.'],
        ['miss', 'some deadline is missed', 'Above 100% the tasks need more time than the processor has.'],
      ], ($) => ($.U === '0.6' ? 'all' : $.U === '0.9' ? 'test' : 'miss')),
    ],
    level: 1,
    hints: ['Is the load under the bound, between the bound and 1, or over 1?', 'The bound is sufficient, not necessary.'],
    steps: ($) => [$.U === '0.6' ? 'Under the bound: all met.' : $.U === '0.9' ? 'Between the bound and 1: run the exact test.' : 'Over 1: impossible.'],
    second: ($) => {
      const U = Number($.U);
      const bound = 5 * (2 ** (1 / 5) - 1);
      return { d: U <= bound ? 'all' : U <= 1 ? 'test' : 'miss' };
    },
    cases: [kase('90%', { U: '0.9' }, { d: 'test' })],
  }),

  problem({
    id: 'u10.4.pass',
    title: 'How long is a pass?',
    exam: 'u10',
    ch: '10',
    lab: 'data',
    src: 'Flux, written for the Data budget lab',
    topics: ['databudget'],
    principles: ['databudget'],
    vars: { h: choice(['400', '400 km'], ['500', '500 km'], ['600', '600 km']), e: choice(['5', '5°'], ['10', '10°'], ['20', '20°']) },
    variety: ['altitude and elevation mask'],
    text: (T) => `A craft on a circular orbit at ${T.h} passes straight over a ground station that uses it only above ${T.e} of elevation. How long is the pass, in minutes? Earth's radius ${EARTH.R} km, μ = 398,600 km³/s².`,
    parts: [num('t', ($) => passMin($), 'min', { label: 't_p' })],
    level: 2,
    hints: ['Find the period T = 2π√(r³/μ) with r = R + h.', 'λ = arccos((R/r) cos ε) − ε, and t_p = Tλ/π.'],
    steps: ($) => {
      const p = passesClosed({ hkm: Number($.h), eps: Number($.e) });
      return [String.raw`$T = ${fmt(p.Tmin, 4)}$ min, $\lambda = ${fmt(p.lam)}$ rad`, String.raw`$t_p = T\lambda/\pi = ${fmt(p.tpmin)}$ min`];
    },
    sim: { scenario: 'sband', setup(s, $) { Object.assign(s, { hkm: Number($.h), eps: Number($.e) }); }, read: (c) => ({ t: c.tp / 60 }) },
    cases: [kase('500 km above 10°', { h: '500', e: '10' }, { t: 7.377 })],
  }),

  problem({
    id: 'u10.5.sent',
    title: 'Data sent a day',
    exam: 'u10',
    ch: '10',
    lab: 'data',
    src: 'Flux, written for the Data budget lab',
    topics: ['databudget'],
    principles: ['databudget'],
    vars: { k: choice(['1', 'one pass'], ['2', 'two passes'], ['3', 'three passes']), D: choice(['1000', '1 Mbit/s'], ['4000', '4 Mbit/s']) },
    variety: ['passes and radio'],
    text: (T) => `A craft at 500 km has overhead passes of 7.38 minutes above 10° over its station. The station sees it in two groups a day, each of ${T.k}. Its radio sends ${T.D}. How much can it send down a day, in Gbit?`,
    parts: [num('G', ($) => sentGbit($), 'Gbit', { label: 'sent' })],
    level: 1,
    hints: ['Count the passes a day: two groups.', 'Sent = passes × pass length in seconds × rate.'],
    steps: ($) => [String.raw`$2 \times ${$.k} \times 442.6\ \text{s} \times ${Number($.D) / 1000}\ \text{Mbit/s} = ${fmt(sentGbit($))}$ Gbit`],
    sim: { scenario: 'sband', setup(s, $) { Object.assign(s, { hkm: 500, eps: 10, k: Number($.k), radio: $.D === '1000' ? 's1' : 's4' }); }, read: (c) => ({ G: c.sent / 1000 }) },
    cases: [kase('three passes at 1 Mbit/s', { k: '3', D: '1000' }, { G: 2.656 })],
  }),

  problem({
    id: 'u10.6.store',
    title: 'A bigger store',
    exam: 'u10',
    ch: '10',
    kind: 'conceptual',
    lab: 'data',
    src: 'Flux, written for the Data budget lab',
    topics: ['databudget'],
    principles: ['databudget'],
    vars: { f: choice(['2', 'twice'], ['4', 'four times']) },
    text: (T) => `A craft records 2.33 Gbit a day and its passes can send 0.89 Gbit a day. Its store fills in 11 days. The team fits a store ${T.f} as large. What happens?`,
    parts: [
      pick('s', 'the store', [
        ['fixed', 'it never fills', 'The craft still records more than it sends, so the excess piles up every day.'],
        ['later', 'it still fills, only later', 'The store grows by the same 1.44 Gbit a day, so a larger one takes longer to fill but fills.'],
        ['same', 'it fills in the same 11 days', 'A larger store holds more of the same daily excess, so it takes longer.'],
      ], () => 'later'),
    ],
    level: 1,
    hints: ['Does the store change what is made or what is sent?', 'What grows every day?'],
    steps: () => ['Made − sent is unchanged; the store only sets how many days until it is full.'],
    second: ($) => {
      const c = dataClosed({ hkm: 500, eps: 10, k: 1, payload: 25, house: 2, down: 1000 });
      const days = (store) => store / c.perDay;
      const before = days(16000);
      const after = days(16000 * Number($.f));
      return { s: !c.growing ? 'fixed' : after > before ? 'later' : 'same' };
    },
    cases: [kase('twice', { f: '2' }, { s: 'later' })],
  }),

  problem({
    id: 'u10.7.bus',
    title: 'Which bus?',
    exam: 'u10',
    ch: '10',
    kind: 'conceptual',
    src: 'Flux, after Wikipedia’s I²C and SPI articles',
    topics: ['buses'],
    principles: ['buses'],
    vars: { dev: choice(['mag', 'mag'], ['temp', 'temp'], ['thumb', 'thumb'], ['camera', 'camera']) },
    variety: ['which device'],
    text: (T, $) => `The computer must read ${DEVICES[$.dev].text}. Which is the slowest of these buses that can carry it?`,
    parts: [
      pick('b', 'bus', [
        ['i2c100', 'I²C at 100 kbit/s', 'Enough for slow sensors, sharing two wires among many devices.'],
        ['i2c400', 'I²C at 400 kbit/s', 'Fast mode: four times standard I²C, still two shared wires.'],
        ['i2c3400', 'I²C at 3.4 Mbit/s', 'High-speed mode, on newer parts only.'],
        ['spi', 'SPI at 20 MHz', 'One bit per clock on its own lines: about 20 Mbit/s.'],
      ], ($) => slowestBus(DEVICES[$.dev].need)),
    ],
    level: 1,
    hints: ['Put the device’s rate and each bus’s rate in the same units.', 'Choose the first bus, slowest first, whose rate is at least the device’s.'],
    steps: ($) => [`The device needs ${DEVICES[$.dev].need} kbit/s; the slowest bus at or above that carries it.`],
    second: ($) => ({ b: [...BUSES].sort((x, y) => x[1] - y[1]).filter(([, r]) => r >= DEVICES[$.dev].need)[0][0] }),
    cases: [kase('the full-frame camera', { dev: 'camera' }, { b: 'spi' })],
  }),

  problem({
    id: 'u10.8.watchdog',
    title: 'Set the watchdog',
    exam: 'u10',
    ch: '10',
    kind: 'conceptual',
    src: 'Flux, after MIT 16.851 Lectures 16 and 19',
    topics: ['faults'],
    principles: ['faults'],
    vars: { gap: choice(['0.8', '0.8 s'], ['1.5', '1.5 s'], ['3', '3 s']) },
    variety: ['longest normal gap'],
    text: (T) => `A healthy computer can go ${T.gap} without resetting its watchdog, while it writes to flash. Which is the shortest of these timeouts that never resets a healthy computer?`,
    parts: [
      pick('t', 'timeout', [
        ['1', '1 s', 'Short timeouts catch a hang fast but must still outlast every normal gap.'],
        ['2', '2 s', 'It must outlast the longest normal gap.'],
        ['4', '4 s', 'It must outlast the longest normal gap.'],
        ['8', '8 s', 'Longer than needed: a hang goes unnoticed for longer.'],
      ], ($) => String(TIMEOUTS.find((t) => t > Number($.gap)))),
    ],
    level: 1,
    hints: ['A timeout shorter than a normal gap resets a healthy computer.', 'Choose the first timeout longer than the gap.'],
    steps: ($) => [`The first timeout longer than ${$.gap} s is ${TIMEOUTS.find((t) => t > Number($.gap))} s.`],
    second: ($) => ({ t: String(Math.min(...TIMEOUTS.filter((t) => t > Number($.gap)))) }),
    cases: [kase('1.5 s', { gap: '1.5' }, { t: '2' })],
  }),
];
