/**
 * Unit 2 bank: sinusoidal steady state. Original problems, written for the Phasors lab, with staged
 * hints and named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The RC problem: 10 V across 1 kΩ and 0.1 µF in series; `w` lets a trap drop the 2π. */
export const RC = { V: 10, R: 1000, C: 1e-7 };
export const rcVolt = ($, how = 'phasor', w = 2 * Math.PI * $.f) => {
  const X = 1 / (w * RC.C);
  const Zm = how === 'phasor' ? Math.hypot(RC.R, X) : RC.R + X;
  return (RC.V * ($.part === 'vr' ? RC.R : X)) / Zm;
};

export default [
  problem({
    id: 'u2.1.rc-divider',
    title: 'An AC voltage divider',
    exam: 'u2',
    ch: '2',
    lab: 'phasors',
    src: 'Flux, written for the Phasors lab',
    topics: ['phasor'],
    principles: ['phasor'],
    vars: { part: choice(['vr', 'the resistor'], ['vc', 'the capacitor']), f: range(200, 2000, 200, 'Hz') },
    text: (T) => `A 10 V amplitude sine source at ${T.f} Hz drives a 1 kΩ resistor and a 0.1 µF capacitor in series. What is the voltage amplitude across ${T.part}, in V?`,
    parts: [num('v', ($) => rcVolt($), 'V', { label: '|V|' })],
    level: 2,
    hints: ['Z_C = 1/(jωC), with ω = 2πf. The total impedance is R + Z_C, a complex number.', 'I = V/|Z| with |Z| = √(R² + X_C²); then |V_R| = I R and |V_C| = I X_C.'],
    steps: ($) => {
      const X = 1 / (2 * Math.PI * $.f * RC.C);
      return [
        String.raw`$X_C = 1/(2\pi f C) = ${Number(X.toPrecision(4))}$ Ω, $|Z| = \sqrt{1000^2 + ${Number(X.toPrecision(4))}^2} = ${Number(Math.hypot(1000, X).toPrecision(4))}$ Ω`,
        String.raw`$|V| = 10 \times ${$.part === 'vr' ? '1000' : Number(X.toPrecision(4))}/${Number(Math.hypot(1000, X).toPrecision(4))} = ${Number(rcVolt($).toPrecision(3))}$ V`,
      ];
    },
    sim: {
      scenario: 'rc345',
      setup(s, $) {
        Object.assign(s, { circuit: 'rc', lf: Math.log10($.f), lR: 3, lC: -1 });
      },
      // The lab's source is 5 V; the circuit is linear, so 10 V doubles every voltage.
      read: (c, s, $) => ({ v: 2 * ($.part === 'vr' ? c.VRm : c.VCm) }),
    },
    cases: [kase('the capacitor at 1 kHz', { part: 'vc', f: 1000 }, { v: 8.467 })],
  }),

  problem({
    id: 'u2.2.three-four',
    title: '3 V and 4 V make what?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'phasors',
    src: 'Flux, written for the Phasors lab',
    topics: ['phasor', 'resonance'],
    principles: ['phasor'],
    vars: { pair: choice(['rc', 'a resistor and a capacitor: 3 V across the resistor and 4 V across the capacitor'], ['lc', 'an inductor and a capacitor, with little resistance: 3 V across the inductor and 4 V across the capacitor']) },
    text: (T) => `A sine source drives ${T.pair}, in series. Those are voltage amplitudes. About what is the source’s amplitude?`,
    parts: [
      pick('v', 'the source', [
        ['sum', '7 V, the sum', 'Amplitudes add only for voltages that peak together. These do not.'],
        ['pyth', '5 V, as on a right triangle', 'V_R and V_C are 90° apart, so they add like perpendicular sides: √(3² + 4²).'],
        ['diff', 'about 1 V, the difference', 'V_L leads the current by 90° and V_C lags it by 90°: they point opposite ways and largely cancel.'],
      ], ($) => ($.pair === 'rc' ? 'pyth' : 'diff')),
    ],
    level: 1,
    hints: ['Draw the phasors. V_R is in phase with the current.', 'V_L leads the current by 90°, V_C lags it by 90°.'],
    steps: ($) => [$.pair === 'rc' ? '|V| = √(3² + 4²) = 5 V.' : '|V| ≈ |4 − 3| = 1 V, a little more for the small resistance.'],
    sim: {
      scenario: 'rc345',
      setup(s, $) {
        if ($.pair === 'lc') Object.assign(s, { circuit: 'rlc', lf: 3, lR: 1, lL: 1, lC: Math.log10(1e6 / (2 * Math.PI * 1000 * 83.776)) });
      },
      read: (c, s, $) => {
        const [a, b] = $.pair === 'rc' ? [c.VRm, c.VCm] : [c.VLm, c.VCm];
        const cand = { sum: a + b, pyth: Math.hypot(a, b), diff: Math.abs(a - b) };
        const best = Object.keys(cand).reduce((x, y) => (Math.abs(cand[y] - 5) < Math.abs(cand[x] - 5) ? y : x));
        return { v: best };
      },
    },
    cases: [kase('R and C', { pair: 'rc' }, { v: 'pyth' })],
  }),
];
