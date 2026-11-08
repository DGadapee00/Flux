/**
 * Unit 4 bank: first-order circuits. Original problems, written for the Switch lab, with staged hints
 * and named traps (../coaching/u4.js), each checked against the lab (`sim`) or a second route.
 *
 * The circuit is the lab's: 12 V with R₁ feeds node A through a switch, R₂ runs from A to ground,
 * and the element hangs from A to ground behind R₃ = 200 Ω.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { rlcClosed } from '@flux/subjects/em/rlc.js';

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

/** Series-RLC damping ratio with L = 10 mH, C = 1 µF; `how` reproduces the traps. */
export const zetaSeries = ($, how = 'right') => {
  const R = Number($.R);
  const L = 0.01;
  const C = 1e-6;
  if (how === 'parallel') return (1 / (2 * R)) * Math.sqrt(L / C);
  if (how === 'two') return R * Math.sqrt(C / L);
  return (R / 2) * Math.sqrt(C / L);
};

/** Peak current (mA) of an ideal LC with C = 1 µF at 10 V; `how` reproduces the traps. */
export const lcPeak = ($, how = 'right') => {
  const L = Number($.L) / 1000;
  const C = 1e-6;
  if (how === 'inverted') return 10 * Math.sqrt(L / C) * 1000;
  if (how === 'omega') return (10 / Math.sqrt(L * C)) * 1000;
  return 10 * Math.sqrt(C / L) * 1000;
};

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
  problem({
    id: 'u4.4.zeta',
    title: 'A series RLC’s damping ratio',
    exam: 'u4',
    ch: '4',
    lab: 'rlc',
    src: 'Flux, written for the RLC step lab',
    topics: ['rlc'],
    principles: ['rlc'],
    vars: { R: choice(['40', '40 Ω'], ['300', '300 Ω'], ['600', '600 Ω'], ['1000', '1 kΩ']) },
    text: (T) => `A series RLC circuit has R = ${T.R}, L = 10 mH and C = 1 µF. What is its damping ratio ζ?`,
    parts: [num('z', ($) => zetaSeries($), '', { label: 'ζ' })],
    level: 1,
    hints: ['α = R/2L and ω₀ = 1/√(LC).', 'ζ = α/ω₀ = (R/2)√(C/L).'],
    steps: ($) => [String.raw`$\zeta = \frac{${$.R}}{2}\sqrt{\frac{10^{-6}}{10^{-2}}} = ${Number(zetaSeries($).toPrecision(3))}$`],
    sim: { scenario: 'ring', setup(s, $) { Object.assign(s, { topo: 'series', lR: Math.log10(Number($.R)) }); }, read: (c) => ({ z: c.zeta }) },
    cases: [kase('300 Ω', { R: '300' }, { z: 1.5 })],
  }),

  problem({
    id: 'u4.5.parallel-r',
    title: 'More resistance in parallel',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'rlc',
    src: 'Flux, written for the RLC step lab',
    topics: ['rlc'],
    principles: ['rlc'],
    vars: { R: choice(['500', 'from 50 Ω to 500 Ω'], ['5000', 'from 50 Ω to 5 kΩ']) },
    text: (T) => `A parallel RLC (L = 10 mH, C = 1 µF) is critically damped with R = 50 Ω. R is raised ${T.R}. What happens to the step response?`,
    parts: [
      pick('a', 'the response', [
        ['rings', 'it rings: less damping', 'ζ = (1/2R)√(L/C) falls as R rises: a larger parallel resistor drains the tank less.'],
        ['creeps', 'it creeps: more damping', 'That is the series circuit. In parallel, damping goes as 1/R.'],
      ], () => 'rings'),
    ],
    level: 2,
    hints: ['Write α for the parallel circuit.', 'How much current does a large parallel resistor draw?'],
    steps: () => ['α = 1/2RC: larger R, smaller α, ζ < 1, underdamped.'],
    sim: { scenario: 'parallel', setup(s, $) { s.lR = Math.log10(Number($.R)); }, read: (c) => ({ a: c.zeta < 1 ? 'rings' : 'creeps' }) },
    cases: [kase('to 500 Ω', { R: '500' }, { a: 'rings' })],
  }),
  problem({
    id: 'u4.6.lc-peak',
    title: 'The peak current in an LC loop',
    exam: 'u4',
    ch: '4',
    lab: 'lc',
    src: 'Flux, written for the LC energy lab',
    topics: ['lc-energy'],
    principles: ['lc-energy'],
    vars: { L: choice(['5', '5 mH'], ['20', '20 mH'], ['50', '50 mH']) },
    text: (T) => `A 1 µF capacitor charged to 10 V is switched across an ideal ${T.L} coil. What is the largest current, in mA?`,
    parts: [num('I', ($) => lcPeak($), 'mA', { label: 'I_pk' })],
    level: 1,
    hints: ['The energy ½CV₀² moves entirely into the coil.', 'Set ½LI² = ½CV₀².'],
    steps: ($) => [String.raw`$I = V_0\sqrt{C/L} = 10\sqrt{10^{-6}/${Number($.L) / 1000}} = ${Number(lcPeak($).toPrecision(3))}$ mA`],
    sim: { scenario: 'ideal', setup(s, $) { Object.assign(s, { Lmh: Number($.L), R: 0 }); }, read: (c) => ({ I: 1000 * c.Ipk0 }) },
    cases: [kase('20 mH', { L: '20' }, { I: 70.71 })],
  }),

  problem({
    id: 'u4.7.empty',
    title: 'When the capacitor is empty',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'lc',
    src: 'Flux, written for the LC energy lab',
    topics: ['lc-energy'],
    principles: ['lc-energy'],
    vars: { L: choice(['10', 'a 10 mH coil'], ['100', 'a 100 mH coil']) },
    text: (T) => `A charged capacitor rings with ${T.L} and no resistance. At the moment its voltage passes through zero, what is the current?`,
    parts: [
      pick('a', 'the current', [
        ['max', 'at its largest', 'With the capacitor empty, all the energy is in the coil’s field, ½Li².'],
        ['zero', 'zero', 'The current is zero when the capacitor is fully charged, a quarter period later.'],
        ['half', 'half its peak', 'Energy is conserved: an empty capacitor means a full coil.'],
      ], () => 'max'),
    ],
    level: 1,
    hints: ['Where is the energy when the capacitor holds none?', 'Energy is conserved: ½Cv² + ½Li² stays at ½CV₀².'],
    steps: () => ['½Li² = ½CV₀² at that moment: the current is at its peak.'],
    sim: { scenario: 'ideal', setup(s, $) { Object.assign(s, { Lmh: Number($.L), R: 0 }); }, read: (c) => ({ a: Math.abs(c.i(c.T / 4)) > 0.99 * c.Ipk0 ? 'max' : 'zero' }) },
    cases: [kase('10 mH', { L: '10' }, { a: 'max' })],
  }),
];
