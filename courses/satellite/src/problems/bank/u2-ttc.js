/**
 * Unit 2 bank, part two: telemetry, tracking and command. Original problems, with staged hints and
 * named traps (../coaching/u2-ttc.js). Tracking problems are checked against the Doppler lab
 * (`sim`); the rest against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { C_LIGHT, dopplerClosed } from '@flux/subjects/mechanics/doppler.js';
import { EARTH } from '@flux/subjects/mechanics/passes.js';
import { BANDS } from '../../labs/doppler.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** Largest one-way shift in kHz; `how` names the traps. */
export function shiftKHz($, how = 'right') {
  const c = dopplerClosed({ hkm: Number($.h), eps: 10, fMHz: BANDS[$.band].f });
  if (how === 'twoWay') return (2 * c.shiftEdge) / 1000;
  if (how === 'orbitSpeed') {
    const v = Math.sqrt(EARTH.mu / (EARTH.R + Number($.h)));
    return (BANDS[$.band].f * 1e6 * v) / C_LIGHT / 1000;
  }
  return c.shiftEdge / 1000;
}

/** Two-way light time at the pass's edge, in ms; `how` names the traps. */
export function lightMs($, how = 'right') {
  const c = dopplerClosed({ hkm: Number($.h), eps: Number($.e), fMHz: 437 });
  if (how === 'oneWay') return (c.rhoEdge / C_LIGHT) * 1000;
  if (how === 'altitude') return ((2 * Number($.h)) / C_LIGHT) * 1000;
  return c.lightEdge * 1000;
}

/** Telemetry frame rate in bit/s with 10% framing; `how` names the traps. */
export function frameRate($, how = 'right') {
  const temps = Number($.temps);
  const gyroHz = Number($.gyro);
  const data = (temps * 12) / 10 + 16 * 12 + 6 * 16 * gyroHz + 32;
  if (how === 'noFraming') return data;
  if (how === 'onceEach') return 1.1 * (temps * 12 + 16 * 12 + 6 * 16 + 32);
  return 1.1 * data;
}

const CHECKS = ['address', 'error check', 'valid command', 'timing', 'authentication'];
const CASES = {
  ok: { text: 'right address, error check passes, a valid opcode, inside its time window, and an authentication tag that matches', fails: [] },
  addr: { text: 'another craft’s address, but its error check passes and its opcode is valid', fails: ['address'] },
  auth: { text: 'right address, error check passes and a valid opcode, but an authentication tag that does not match', fails: ['authentication'] },
  crc: { text: 'right address and a valid opcode, but bits flipped on the way so its error check fails', fails: ['error check'] },
};

const LICENCE = {
  encrypt: { text: 'Can it encrypt its downlink telemetry?', answer: 'no', why: 'An amateur downlink may not be obscured.' },
  profit: { text: 'Can a company sell the science it sends down?', answer: 'no', why: 'Amateur use bars pecuniary interest.' },
  operator: { text: 'Does it need a licensed amateur control operator?', answer: 'yes', why: 'An amateur station needs one.' },
};

export default [
  problem({
    id: 'u2.5.shift',
    title: 'The largest Doppler shift',
    exam: 'u2',
    ch: '2',
    lab: 'doppler',
    src: 'Flux, written for the Doppler lab',
    topics: ['doppler'],
    principles: ['doppler'],
    vars: { band: choice(['uhf', 'a 437 MHz UHF carrier'], ['s', 'a 2200 MHz S-band carrier'], ['x', 'an 8400 MHz X-band carrier']), h: choice(['400', '400 km'], ['500', '500 km'], ['700', '700 km']) },
    variety: ['band and altitude'],
    text: (T) => `A craft at ${T.h} sends ${T.band} from its own oscillator and passes straight over a station that tracks it above 10°. What is the largest Doppler shift the station sees, in kHz? Earth's radius ${EARTH.R} km, μ = 398,600 km³/s², c = 299,792 km/s.`,
    parts: [num('d', ($) => shiftKHz($), 'kHz', { label: 'Δf' })],
    level: 3,
    hints: ['The shift is largest at the edge of the pass, where the craft closes fastest.', 'Find θ at the edge, λ = arccos((R/r)cos 10°) − 10°, then ρ̇ = R a n sin λ/ρ and Δf = f ρ̇/c.'],
    steps: ($) => {
      const c = dopplerClosed({ hkm: Number($.h), eps: 10, fMHz: BANDS[$.band].f });
      return [String.raw`$\lambda = ${fmt(c.lam)}$ rad, $\rho = ${fmt(c.rhoEdge, 4)}$ km, $\dot\rho = ${fmt(c.rateEdge)}$ km/s`, String.raw`$\Delta f = f\dot\rho/c = ${fmt(c.shiftEdge / 1000)}$ kHz`];
    },
    sim: { scenario: 'uhf', setup(s, $) { Object.assign(s, { band: $.band, hkm: Number($.h), eps: 10, twoWay: false }); }, read: (c) => ({ d: c.shift / 1000 }) },
    cases: [kase('UHF at 500 km', { band: 'uhf', h: '500' }, { d: 10.14 })],
  }),

  problem({
    id: 'u2.6.light',
    title: 'Ranging by light time',
    exam: 'u2',
    ch: '2',
    lab: 'doppler',
    src: 'Flux, written for the Doppler lab',
    topics: ['doppler'],
    principles: ['doppler'],
    vars: { h: choice(['400', '400 km'], ['600', '600 km'], ['800', '800 km']), e: choice(['5', '5°'], ['15', '15°']) },
    variety: ['altitude and elevation'],
    text: (T) => `A station sends a ranging code to a craft at ${T.h} just as it rises above ${T.e} of elevation on an overhead pass, and the craft sends it straight back. How long after sending does the station hear it, in ms? Earth's radius ${EARTH.R} km, c = 299,792 km/s.`,
    parts: [num('t', ($) => lightMs($), 'ms', { label: 't' })],
    level: 2,
    hints: ['Find the range at that elevation from the triangle of Earth’s centre, the station and the craft.', 'The code travels up and down: t = 2ρ/c.'],
    steps: ($) => {
      const c = dopplerClosed({ hkm: Number($.h), eps: Number($.e), fMHz: 437 });
      return [String.raw`$\rho = ${fmt(c.rhoEdge, 4)}$ km`, String.raw`$t = 2\rho/c = ${fmt(c.lightEdge * 1000)}$ ms`];
    },
    sim: { scenario: 'uhf', setup(s, $) { Object.assign(s, { hkm: Number($.h), eps: Number($.e) }); }, read: (c) => ({ t: c.lightEdge * 1000 }) },
    cases: [kase('600 km above 15°', { h: '600', e: '15' }, { t: 10.85 })],
  }),

  problem({
    id: 'u2.7.telemetry',
    title: 'A telemetry rate',
    exam: 'u2',
    ch: '2',
    src: 'Flux, after MIT 16.851 Lecture 20',
    topics: ['ttc'],
    principles: ['ttc'],
    vars: { temps: choice(['20', '20'], ['40', '40'], ['80', '80']), gyro: choice(['5', '5'], ['10', '10'], ['20', '20']) },
    variety: ['channel counts and rates'],
    text: (T) => `A craft's telemetry carries ${T.temps} temperatures at 12 bits every 10 s, 16 voltages and currents at 12 bits every second, 6 gyro and magnetometer axes at 16 bits ${T.gyro} times a second, and 32 status flags once a second. Framing adds 10%. What rate do the frames need, in bit/s?`,
    parts: [num('r', ($) => frameRate($), 'bit/s', { label: 'rate' })],
    level: 1,
    hints: ['Each group sends channels × bits × samples per second.', 'Add the groups, then add 10% for sync words, headers and error checks.'],
    steps: ($) => [String.raw`Data $= ${fmt(frameRate($, 'noFraming'), 4)}$ bit/s`, String.raw`Frames $= 1.1 \times ${fmt(frameRate($, 'noFraming'), 4)} = ${fmt(frameRate($), 4)}$ bit/s`],
    second: ($) => {
      // Count the bits over 10 s, the longest sampling period, then divide.
      const tenSeconds = Number($.temps) * 12 + 10 * 16 * 12 + 10 * Number($.gyro) * 6 * 16 + 10 * 32;
      return { r: (1.1 * tenSeconds) / 10 };
    },
    cases: [kase('40 temperatures, gyros at 10 Hz', { temps: '40', gyro: '10' }, { r: 1355 })],
  }),

  problem({
    id: 'u2.8.validate',
    title: 'Execute or reject?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    src: 'Flux, after MIT 16.851 Lecture 20',
    topics: ['security'],
    principles: ['security'],
    vars: { c: choice(['ok', 'ok'], ['addr', 'addr'], ['auth', 'auth'], ['crc', 'crc']) },
    variety: ['which command'],
    text: (T, $) => `A command arrives with ${CASES[$.c].text}. What does the craft's command logic do?`,
    parts: [
      pick('a', 'the craft', [
        ['execute', 'executes it', 'Every check passes: address, error check, valid command, timing and authentication.'],
        ['reject', 'rejects it', 'Any check that fails, or any doubt, means the command is rejected.'],
      ], ($) => (CASES[$.c].fails.length ? 'reject' : 'execute')),
    ],
    level: 1,
    hints: ['List the checks: address, error check, valid command, timing, authentication.', 'The default is to reject if there is any doubt.'],
    steps: ($) => [CASES[$.c].fails.length ? `The ${CASES[$.c].fails[0]} check fails: reject.` : 'Every check passes: execute.'],
    second: ($) => ({ a: CHECKS.every((k) => !CASES[$.c].fails.includes(k)) ? 'execute' : 'reject' }),
    cases: [kase('a bad tag', { c: 'auth' }, { a: 'reject' })],
  }),

  problem({
    id: 'u2.9.coherent',
    title: 'One-way or two-way?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'doppler',
    src: 'Flux, written for the Doppler lab',
    topics: ['doppler'],
    principles: ['doppler'],
    vars: { to: choice(['two', 'from one-way to two-way coherent'], ['one', 'from two-way coherent to one-way']) },
    text: (T) => `A station tracking an S-band craft switches its link ${T.to}. What happens to the largest Doppler shift it measures?`,
    parts: [
      pick('s', 'the shift', [
        ['doubles', 'it doubles', 'Two-way, the carrier is shifted on the way up and again on the way down.'],
        ['halves', 'it halves', 'One-way, the carrier is shifted only once, on the way down.'],
        ['same', 'it stays the same', 'The number of trips the carrier makes through the moving geometry changes.'],
      ], ($) => ($.to === 'two' ? 'doubles' : 'halves')),
    ],
    level: 1,
    hints: ['How many times does the carrier cross the closing distance?', 'Two-way: up and back.'],
    steps: ($) => [$.to === 'two' ? 'Shifted up and down: twice.' : 'Shifted once: half.'],
    second: ($) => {
      const one = dopplerClosed({ hkm: 500, eps: 10, fMHz: 2200 }).shiftEdge;
      const [a, b] = $.to === 'two' ? [one, 2 * one] : [2 * one, one];
      return { s: b > a ? 'doubles' : b < a ? 'halves' : 'same' };
    },
    cases: [kase('to two-way', { to: 'two' }, { s: 'doubles' })],
  }),

  problem({
    id: 'u2.10.licence',
    title: 'An amateur licence',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 9.2.5',
    topics: ['security'],
    principles: ['security'],
    vars: { q: choice(['encrypt', 'encrypt'], ['profit', 'profit'], ['operator', 'operator']) },
    variety: ['which rule'],
    text: (T, $) => `A university CubeSat flies under an FCC amateur licence, Part 97. ${LICENCE[$.q].text}`,
    parts: [
      pick('a', 'answer', [
        ['yes', 'yes', 'Amateur rules require it.'],
        ['no', 'no', 'Amateur rules forbid it.'],
      ], ($) => LICENCE[$.q].answer),
    ],
    level: 1,
    hints: ['Amateur radio is for hobby and non-profit use, in the open.', 'Think of what each rule protects: openness, no profit, a responsible operator.'],
    steps: ($) => [LICENCE[$.q].why],
    second: ($) => ({ a: { encrypt: 'no', profit: 'no', operator: 'yes' }[$.q] }),
    cases: [kase('encryption', { q: 'encrypt' }, { a: 'no' })],
  }),
];

