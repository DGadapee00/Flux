/**
 * Unit 2 bank: sinusoidal steady state. Original problems, written for the Phasors lab, with staged
 * hints and named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The RC problem: 10 V across 1 kΩ and 0.1 µF in series; `w` lets a trap drop the 2π. */
export const RC = { V: 10, R: 1000, C: 1e-7 };
/** The n-th harmonic of a ±1 V, 1 kHz square wave out of an RC low-pass with corner fc (Hz). */
export const harmonicOut = ($, gain = (x) => 1 / Math.sqrt(1 + x * x), lead = 4 / Math.PI) => (lead / Number($.n)) * gain((Number($.n) * 1000) / $.fc);
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
  problem({
    id: 'u2.3.harmonic',
    title: 'One harmonic through a filter',
    exam: 'u2',
    ch: '2',
    lab: 'filter',
    src: 'Flux, written for the Filter lab',
    topics: ['filter'],
    principles: ['filter'],
    vars: { n: choice(['1', 'fundamental (1 kHz)'], ['3', '3rd harmonic (3 kHz)'], ['5', '5th harmonic (5 kHz)']), fc: range(500, 3000, 250, 'Hz') },
    text: (T) => `A ±1 V square wave at 1 kHz drives an RC low-pass filter whose corner is at ${T.fc}. The square wave is (4/π)(sin ωt + sin 3ωt/3 + sin 5ωt/5 + …). What is the amplitude of its ${T.n} at the output, in V?`,
    parts: [num('a', ($) => harmonicOut($), 'V', { label: 'amplitude' })],
    level: 2,
    hints: ['The n-th harmonic goes in with amplitude 4/(πn).', 'The filter passes |H| = 1/√(1 + (f/f_c)²) of it, at that harmonic’s own frequency f.'],
    steps: ($) => {
      const x = (Number($.n) * 1000) / $.fc;
      return [String.raw`In: $4/(\pi \cdot ${$.n}) = ${Number((4 / (Math.PI * Number($.n))).toPrecision(3))}$ V. $|H| = 1/\sqrt{1 + ${Number(x.toPrecision(3))}^2} = ${Number((1 / Math.sqrt(1 + x * x)).toPrecision(3))}$, so out: ${Number(harmonicOut($).toPrecision(3))} V`];
    },
    sim: {
      scenario: 'equal',
      setup(s, $) {
        s.lfc = Math.log10($.fc);
      },
      read: (c, s, $) => ({ a: c.list[(Number($.n) - 1) / 2].ampOut }),
    },
    cases: [kase('the notes’ 3rd harmonic', { n: '3', fc: 1000 }, { a: 0.1342 })],
  }),

  problem({
    id: 'u2.4.shape',
    title: 'What comes out',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'filter',
    src: 'Flux, written for the Filter lab',
    topics: ['filter'],
    principles: ['filter'],
    vars: { where: choice(['above', 'ten times the square wave’s frequency'], ['below', 'a fifth of the square wave’s frequency']) },
    text: (T) => `A square wave passes through an RC low-pass filter whose corner is at ${T.where}. What does the output look like?`,
    parts: [
      pick('shape', 'the output', [
        ['rounded', 'a square wave with rounded corners', 'Only the high harmonics that make the sharp edges are cut; the rest pass almost whole.'],
        ['triangle', 'nearly a small triangle wave', 'Every harmonic is cut, the higher ones harder: the capacitor ramps up and down and never settles.'],
        ['smaller', 'the same square wave, only smaller', 'A filter cuts each frequency by a different amount, so the shape changes. Only a sine keeps its shape.'],
      ], ($) => ($.where === 'above' ? 'rounded' : 'triangle')),
    ],
    level: 1,
    hints: ['Which harmonics are above the corner?', 'Above the corner, |H| falls as 1/f.'],
    steps: ($) => [$.where === 'above' ? 'Corner well above: only the high harmonics are cut. Rounded corners.' : 'Corner well below: all harmonics cut, the high ones most. A triangle.'],
    sim: {
      scenario: 'high',
      setup(s, $) {
        s.lfc = Math.log10($.where === 'above' ? 10000 : 200);
      },
      read: (c) => ({ shape: c.ratio31 > 0.3 ? 'rounded' : c.ratio31 < 0.15 ? 'triangle' : 'smaller' }),
    },
    cases: [kase('a corner well below', { where: 'below' }, { shape: 'triangle' })],
  }),
];
