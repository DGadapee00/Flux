/**
 * Unit 5 bank: operational amplifiers. Original problems, written for the Op amp lab, with staged
 * hints and named traps (../coaching/u5.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { closedGain } from '@flux/subjects/em/opamp.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The circuit's gain for R₁, R_f in kΩ and A = 10^lA. */
export const gain = ($) => closedGain({ A: 10 ** Number($.lA), R1: 1000 * $.R1, Rf: 1000 * Number($.Rf) });
const p4 = (x) => Number(x.toPrecision(4));

export default [
  problem({
    id: 'u5.1.gain',
    title: 'The gain with a real op amp',
    exam: 'u5',
    ch: '5',
    lab: 'opamp',
    src: 'Flux, written for the Op amp lab',
    topics: ['feedback'],
    principles: ['opamp'],
    vars: { lA: choice(['2', '100'], ['3', '1000']), R1: range(2, 20, 2, 'kΩ'), Rf: choice(['100', '100 kΩ'], ['200', '200 kΩ']) },
    text: (T) => `An inverting amplifier has R₁ = ${T.R1} and R_f = ${T.Rf}, built on an op amp whose open-loop gain is only A = ${T.lA}. What is the circuit’s gain v_out/v_in?`,
    parts: [num('g', ($) => gain($), '', { label: 'G', abs: 1e-6 })],
    level: 2,
    hints: ['With v_out = −A v₋, write the current law at v₋ and eliminate v₋.', 'G = −(R_f/R₁)/(1 + (1 + R_f/R₁)/A).'],
    steps: ($) => {
      const r = Number($.Rf) / $.R1;
      return [String.raw`$R_f/R_1 = ${p4(r)}$, $G = \dfrac{-${p4(r)}}{1 + ${p4(1 + r)}/${10 ** Number($.lA)}} = ${p4(gain($))}$`];
    },
    sim: {
      scenario: 'weak',
      setup(s, $) {
        Object.assign(s, { lA: Number($.lA), R1: $.R1, Rf: Number($.Rf) });
      },
      read: (c) => ({ g: c.G }),
    },
    cases: [kase('a gain of ten on a weak op amp', { lA: '3', R1: 10, Rf: '100' }, { g: -9.891 })],
  }),

  problem({
    id: 'u5.2.headroom',
    title: 'How much input before it clips?',
    exam: 'u5',
    ch: '5',
    lab: 'opamp',
    src: 'Flux, written for the Op amp lab',
    topics: ['rails'],
    principles: ['opamp'],
    vars: { Vs: choice(['15', '±15 V'], ['12', '±12 V'], ['5', '±5 V']), R1: range(1, 10, 1, 'kΩ'), Rf: choice(['20', '20 kΩ'], ['50', '50 kΩ'], ['100', '100 kΩ']) },
    text: (T) => `An inverting amplifier with R₁ = ${T.R1} and R_f = ${T.Rf} runs on ${T.Vs} supplies, and its output reaches within 1.5 V of each. Take the op amp as ideal. What is the largest input amplitude it can take without clipping, in V?`,
    parts: [num('v', ($) => (Number($.Vs) - 1.5) / (Number($.Rf) / $.R1), 'V', { label: 'v_in' })],
    level: 1,
    hints: ['The output can swing to the supply minus 1.5 V.', 'Divide that by the gain, R_f/R₁.'],
    steps: ($) => [String.raw`$V_\text{sat} = ${Number($.Vs) - 1.5}$ V, $|G| = ${p4(Number($.Rf) / $.R1)}$, so $v_\text{in} \le ${p4((Number($.Vs) - 1.5) / (Number($.Rf) / $.R1))}$ V`],
    sim: {
      scenario: 'ideal',
      setup(s, $) {
        Object.assign(s, { lA: 7, R1: $.R1, Rf: Number($.Rf), Vs: Number($.Vs) });
      },
      read: (c) => ({ v: c.maxIn }),
    },
    cases: [kase('the notes’ amplifier', { Vs: '15', R1: 10, Rf: '100' }, { v: 1.35 })],
  }),

  problem({
    id: 'u5.3.which',
    title: 'What sets the gain?',
    exam: 'u5',
    ch: '5',
    kind: 'conceptual',
    lab: 'opamp',
    src: 'Flux, written for the Op amp lab',
    topics: ['feedback'],
    principles: ['opamp'],
    vars: { change: choice(['A', 'replace the op amp with one whose open-loop gain is ten times smaller (still over 10⁴)'], ['Rf', 'double the feedback resistor R_f']) },
    text: (T) => `An inverting amplifier has a gain of −10. You ${T.change}. What happens to the circuit’s gain?`,
    parts: [
      pick('g', 'the circuit’s gain', [
        ['same', 'it barely changes', 'With A far larger than 1 + R_f/R₁, the gain is −R_f/R₁ to within a fraction of a percent.'],
        ['double', 'it doubles', 'The gain is −R_f/R₁: double R_f, double the gain.'],
        ['tenth', 'it falls tenfold', 'Feedback makes the gain almost independent of A: a tenfold drop in A barely shows.'],
      ], ($) => ($.change === 'A' ? 'same' : 'double')),
    ],
    level: 1,
    hints: ['G ≈ −R_f/R₁ when A is large.', 'Which of A and R_f appears in that?'],
    steps: ($) => [$.change === 'A' ? 'G ≈ −R_f/R₁ does not depend on A: it barely changes.' : 'G ≈ −R_f/R₁: doubling R_f doubles it.'],
    sim: {
      scenario: 'ideal',
      setup(s, $) {
        if ($.change === 'A') s.lA = 4;
        else s.Rf = 200;
      },
      read: (c) => ({ g: Math.abs(c.G) > 15 ? 'double' : Math.abs(c.G) < 2 ? 'tenth' : 'same' }),
    },
    cases: [kase('a weaker op amp', { change: 'A' }, { g: 'same' })],
  }),
];
