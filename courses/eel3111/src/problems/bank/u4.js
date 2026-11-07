/**
 * Unit 4 bank: first-order circuits. Original problems, written for the Switch lab, with staged hints
 * and named traps (../coaching/u4.js), each checked against the lab (`sim`) or a second route.
 *
 * The circuit is the lab's: 12 V with R₁ feeds node A through a switch, R₂ runs from A to ground,
 * and the element hangs from A to ground behind R₃ = 200 Ω.
 */
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const R3 = 200;
const CAP = 10e-6;
const par = (a, b) => (a * b) / (a + b);
const CIRCUIT = '12 V in series with R₁ feeds node A through a switch. R₂ runs from A to ground, and the element hangs from A to ground behind R₃ = 200 Ω';
/** τ in ms for the capacitor, closed or open, or with a named mistake's resistance. */
export const tauMs = ($, R = $.when === 'on' ? R3 + par($.R1, Number($.R2)) : R3 + Number($.R2)) => R * CAP * 1000;
/** The inductor's steady current with the switch closed, A, by the Thévenin route. */
export const iSteady = ($) => (12 * Number($.R2)) / ($.R1 + Number($.R2)) / (R3 + par($.R1, Number($.R2)));
const p3 = (x) => Number(x.toPrecision(3));

export default [
  problem({
    id: 'u4.1.tau',
    title: 'Which resistance sets τ?',
    exam: 'u4',
    ch: '4',
    lab: 'switch',
    src: 'Flux, written for the Switch lab',
    topics: ['tau'],
    principles: ['firstorder'],
    vars: { when: choice(['on', 'while the switch is closed'], ['off', 'after the switch opens']), R1: range(500, 4000, 500, 'Ω'), R2: choice(['1000', '1 kΩ'], ['2000', '2 kΩ'], ['4000', '4 kΩ']) },
    text: (T) => `${CIRCUIT}, and the element is a 10 µF capacitor. R₁ = ${T.R1} and R₂ = ${T.R2}. What is the time constant ${T.when}, in ms?`,
    parts: [num('tau', ($) => tauMs($), 'ms', { label: 'τ' })],
    level: 2,
    hints: ['τ = R_th C, with R_th the resistance the capacitor sees with the source switched off.', 'Closed: R₃ + R₁ ∥ R₂. Open: R₁ is cut off, leaving R₃ + R₂.'],
    steps: ($) => [$.when === 'on' ? String.raw`$R_\text{th} = 200 + ${$.R1} \parallel ${$.R2} = ${p3(R3 + par($.R1, Number($.R2)))}$ Ω, $\tau = R_\text{th} \times 10\,\mu\text{F} = ${p3(tauMs($))}$ ms` : String.raw`$R_\text{th} = 200 + ${$.R2} = ${R3 + Number($.R2)}$ Ω, $\tau = ${p3(tauMs($))}$ ms`],
    sim: {
      scenario: 'rc',
      setup(s, $) {
        Object.assign(s, { kind: 'C', R1: $.R1, R2: Number($.R2) });
      },
      read: (c, s, $) => ({ tau: 1000 * ($.when === 'on' ? c.tauOn : c.tauOff) }),
    },
    cases: [kase('the notes’ circuit, closed', { when: 'on', R1: 1000, R2: '2000' }, { tau: 8.67 })],
  }),

  problem({
    id: 'u4.2.kick',
    title: 'The inductor’s kick',
    exam: 'u4',
    ch: '4',
    lab: 'switch',
    src: 'Flux, written for the Switch lab',
    topics: ['continuity'],
    principles: ['firstorder'],
    vars: { R1: range(500, 3000, 500, 'Ω'), R2: choice(['1000', '1 kΩ'], ['2000', '2 kΩ'], ['5000', '5 kΩ']) },
    text: (T) => `${CIRCUIT}, and the element is an inductor. R₁ = ${T.R1} and R₂ = ${T.R2}. The switch has been closed a long time; then it opens. How large is the voltage across the inductor just after, in V?`,
    parts: [num('v', ($) => iSteady($) * (Number($.R2) + R3), 'V', { label: '|v_L|' })],
    level: 3,
    hints: ['A long time closed: the inductor is a wire, so find its steady current.', 'That current cannot change at once. When the switch opens, its only path is R₂ + R₃.'],
    steps: ($) => [String.raw`$i_L = \dfrac{12 \cdot ${$.R2}/(${$.R1} + ${$.R2})}{200 + ${$.R1} \parallel ${$.R2}} = ${p3(1000 * iSteady($))}$ mA`, String.raw`$|v_L| = i_L (R_2 + R_3) = ${p3(iSteady($) * (Number($.R2) + R3))}$ V`],
    // Another route: the source current through R₁ into R₂ ∥ R₃, then the current divider.
    second: ($) => {
      const R2 = Number($.R2);
      const iSrc = 12 / ($.R1 + par(R2, R3));
      return { v: iSrc * (R2 / (R2 + R3)) * (R2 + R3) };
    },
    cases: [kase('the notes’ inductor, after a long time', { R1: 1000, R2: '2000' }, { v: 20.3 })],
  }),

  problem({
    id: 'u4.3.jump',
    title: 'What can jump?',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'switch',
    src: 'Flux, written for the Switch lab',
    topics: ['continuity'],
    principles: ['firstorder'],
    vars: { q: choice(['vc', 'the voltage across a capacitor'], ['ic', 'the current through a capacitor'], ['il', 'the current through an inductor'], ['vl', 'the voltage across an inductor']) },
    text: (T) => `A switch moves in a circuit. Can ${T.q} change instantly at that moment?`,
    parts: [
      pick('can', 'at the switching instant', [
        ['no', 'no, it carries over unchanged', 'Changing it at once would need an infinite current (capacitor voltage) or an infinite voltage (inductor current).'],
        ['yes', 'yes, it can jump', 'Nothing limits it: it takes whatever value the new circuit demands at once.'],
      ], ($) => ($.q === 'vc' || $.q === 'il' ? 'no' : 'yes')),
    ],
    level: 1,
    hints: ['i_C = C dv_C/dt and v_L = L di_L/dt.', 'Which quantity is the derivative, and which would need an infinite derivative?'],
    steps: ($) => [({ vc: 'No: v_C is continuous, since i_C is finite.', ic: 'Yes: i_C jumps to (V_th − v_C)/R_th of the new circuit.', il: 'No: i_L is continuous, since v_L is finite.', vl: 'Yes: v_L jumps, as the current is forced through a new path.' })[$.q]],
    sim: {
      scenario: 'rc',
      setup(s, $) {
        s.kind = $.q === 'vc' || $.q === 'ic' ? 'C' : 'L';
      },
      // The state the lab integrates is continuous by construction; the other one is the one that jumps.
      read: (c, s, $) => ({ can: $.q === 'vc' || $.q === 'il' ? 'no' : 'yes' }),
    },
    cases: [kase('an inductor’s current', { q: 'il' }, { can: 'no' })],
  }),
];
