/**
 * Unit 2 bank: communications. Original problems, written for the Noise lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { K_B, dB, fromDBm, link } from '@flux/subjects/em/noise.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The receivers by name: system noise temperature, K. */
export const RX = { uhf: 500, cold: 100 };
export const PR_DBM = -120;
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
];
