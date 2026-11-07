/**
 * Unit 2 bank: communications. Original problems, written for the Noise lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { K_B, dB, fromDBm, link } from '@flux/subjects/em/noise.js';
import { linkBudget } from '@flux/subjects/em/link.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The receivers by name: system noise temperature, K. */
export const RX = { uhf: 500, cold: 100 };
export const PR_DBM = -120;
/** The path-loss problem: band frequencies and the loss in dB; `k` and `scale` name the traps. */
export const BAND_F = { uhf: 437e6, s: 2.2e9, x: 8.4e9 };
export const pathLossDB = ($, k = 20, scale = 1) => k * Math.log10((4 * Math.PI * $.d * scale) / (3e8 / BAND_F[$.band]));
export const snrDB = ($, T = RX[$.rx]) => dB(fromDBm(PR_DBM) / (K_B * T * $.B));

export default [
  problem({
    id: 'u2.1.snr',
    title: 'Signal over noise',
    exam: 'u2',
    ch: '2',
    lab: 'noise',
    src: 'Flux, written for the Noise lab',
    topics: ['noise'],
    principles: ['noise'],
    vars: {
      rx: choice(['uhf', 'a ground station with a system noise temperature of 500 K'], ['cold', 'a cooled receiver with a system noise temperature of 100 K']),
      B: range(2, 20, 2, 'kHz', 1000),
    },
    text: (T) => `A satellite’s signal reaches ${T.rx} at −120 dBm. The receiver’s bandwidth is ${T.B} kHz. What is the signal-to-noise ratio, in dB? Take k_B = 1.381 × 10⁻²³ J/K.`,
    parts: [num('snr', ($) => snrDB($), 'dB', { label: 'S/N' })],
    level: 2,
    hints: ['−120 dBm is 10⁻¹² mW, or 10⁻¹⁵ W.', 'The noise is N = k_B T B. Then S/N in dB is 10 log₁₀(S/N).'],
    steps: ($) => {
      const N = K_B * RX[$.rx] * $.B;
      return [
        String.raw`$N = k_B T B = (1.381\times10^{-23})(${RX[$.rx]})(${$.B}) = ${N.toExponential(3)}$ W`,
        String.raw`$S/N = 10^{-15}/${N.toExponential(3)}$, which is ${Number(snrDB($).toPrecision(3))} dB`,
      ];
    },
    sim: {
      scenario: 'cubesat',
      setup(s, $) {
        Object.assign(s, { Pr: PR_DBM, lT: Math.log10(RX[$.rx]), lB: Math.log10($.B) });
      },
      read: (c) => ({ snr: c.snrDB }),
    },
    cases: [kase('500 K, 10 kHz', { rx: 'uhf', B: 10 }, { snr: 11.61 })],
  }),

  problem({
    id: 'u2.2.what-helps',
    title: 'What changes the noise?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'noise',
    src: 'Flux, written for the Noise lab',
    topics: ['noise'],
    principles: ['noise'],
    vars: {
      change: choice(
        ['band', 'the receiver’s bandwidth is doubled'],
        ['temp', 'the receiver’s system noise temperature is halved'],
        ['resistor', 'the resistor at the receiver’s input is swapped for one of twice the resistance, at the same temperature'],
      ),
    },
    text: (T) => `A receiver hears a satellite with the signal power unchanged. What happens to the signal-to-noise ratio if ${T.change}?`,
    parts: [
      pick('d', 'S/N', [
        ['up', 'it rises by 3 dB', 'Halving the noise power doubles S/N, 3 dB. A colder receiver does that: N = k_B T B.'],
        ['down', 'it falls by 3 dB', 'Doubling the noise power halves S/N. A wider band lets in twice the noise: N = k_B T B.'],
        ['same', 'it does not change', 'The available noise power k_B T B has no resistance in it: a larger resistor makes a larger noise voltage but delivers the same power to a matched load.'],
      ], ($) => ({ band: 'down', temp: 'up', resistor: 'same' })[$.change]),
    ],
    level: 1,
    hints: ['Write the noise power and see what it depends on.', 'N = k_B T B.'],
    steps: ($) => [
      {
        band: 'N doubles with B, so S/N halves: −3 dB.',
        temp: 'N halves with T, so S/N doubles: +3 dB.',
        resistor: 'N = k_B T B has no R in it, so S/N stays the same.',
      }[$.change],
    ],
    sim: {
      scenario: 'cubesat',
      read: (c, s, $) => {
        const T = $.change === 'temp' ? c.T / 2 : c.T;
        const B = $.change === 'band' ? 2 * c.B : c.B;
        const r = link({ Pr: s.Pr, T, B }).snrDB - c.snrDB;
        return { d: r > 1 ? 'up' : r < -1 ? 'down' : 'same' };
      },
    },
    cases: [kase('a wider band', { change: 'band' }, { d: 'down' })],
  }),

  problem({
    id: 'u2.3.path-loss',
    title: 'Free-space path loss',
    exam: 'u2',
    ch: '2',
    lab: 'link',
    src: 'Flux, written for the Link budget lab',
    topics: ['link'],
    principles: ['link'],
    vars: { band: choice(['uhf', 'UHF at 437 MHz'], ['s', 'S band at 2.2 GHz'], ['x', 'X band at 8.4 GHz']), d: range(500, 2000, 500, 'km', 1000) },
    text: (T) => `A satellite ${T.d} km from a ground station transmits in ${T.band}. What is the free-space path loss, (4πd/λ)², in dB? Take c = 3.00 × 10⁸ m/s.`,
    parts: [num('L', ($) => pathLossDB($), 'dB', { label: 'L', tol: 0.005 })],
    level: 2,
    hints: ['λ = c/f.', 'In decibels the loss is 10 log₁₀ of a squared ratio: 20 log₁₀(4πd/λ), with d in metres.'],
    steps: ($) => {
      const lam = 3e8 / BAND_F[$.band];
      return [String.raw`$\lambda = ${Number(lam.toPrecision(4))}$ m, so $20\log_{10}\dfrac{4\pi(${$.d.toExponential(1)})}{${Number(lam.toPrecision(4))}} = ${Number(pathLossDB($).toPrecision(4))}$ dB`];
    },
    sim: {
      scenario: 'leo',
      setup(s, $) {
        Object.assign(s, { band: $.band, ld: Math.log10($.d / 1000) });
      },
      read: (c) => ({ L: c.terms.loss }),
    },
    cases: [kase('S band at 1000 km', { band: 's', d: 1000 }, { L: 159.3 })],
  }),

  problem({
    id: 'u2.4.what-doubles',
    title: 'Double something',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'link',
    src: 'Flux, written for the Link budget lab',
    topics: ['link'],
    principles: ['link'],
    vars: { change: choice(['range', 'the satellite moves twice as far away'], ['dish', 'the ground dish’s diameter doubles'], ['power', 'the transmitter power doubles']) },
    text: (T) => `In a satellite downlink, ${T.change}. Everything else stays. What happens to the received power?`,
    parts: [
      pick('d', 'the received power', [
        ['m6', 'it falls 6 dB, to a quarter', 'Power spreads over a sphere of area 4πd²: twice the range, a quarter of the power.'],
        ['m3', 'it falls 3 dB, to a half', 'Halving would need the loss to grow as d, but it grows as d².'],
        ['p3', 'it rises 3 dB, doubling', 'Received power is proportional to transmitted power: twice the watts, +3 dB.'],
        ['p6', 'it rises 6 dB, four times', 'A dish’s gain grows with its area, as D²: twice the diameter, four times the power.'],
      ], ($) => ({ range: 'm6', dish: 'p6', power: 'p3' })[$.change]),
    ],
    level: 1,
    hints: ['Write P_r = P_t G_t G_r (λ/4πd)² with G_r = η(πD/λ)².', 'Find how P_r scales with the quantity that changes.'],
    steps: ($) => [{ range: 'P_r ∝ 1/d²: ×¼, −6 dB.', dish: 'P_r ∝ D²: ×4, +6 dB.', power: 'P_r ∝ P_t: ×2, +3 dB.' }[$.change]],
    sim: {
      scenario: 'leo',
      read: (c, s, $) => {
        const p = { band: s.band, Pt: 10 ** s.lPt, GtdBi: s.GtdBi, Dr: s.Dr, d: 1000 * 10 ** s.ld, T: s.T, Rb: 10 ** s.lRb };
        const q = { ...p, ...({ range: { d: 2 * p.d }, dish: { Dr: 2 * p.Dr }, power: { Pt: 2 * p.Pt } }[$.change]) };
        const ddB = linkBudget(q).PrdBW - c.PrdBW;
        const opts = { m6: -6, m3: -3, p3: 3, p6: 6 };
        return { d: Object.keys(opts).reduce((a, b) => (Math.abs(opts[b] - ddB) < Math.abs(opts[a] - ddB) ? b : a)) };
      },
    },
    cases: [kase('twice the range', { change: 'range' }, { d: 'm6' })],
  }),
];
