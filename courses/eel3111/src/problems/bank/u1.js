/**
 * Unit 1 bank: node and mesh analysis. Original problems, written for the Nodes lab, with staged
 * hints and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { CIRCUITS } from '../../data/circuits.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { amplifier, closedForm } from '@flux/subjects/em/dependent.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The rails' top voltage for a first source of V1 volts (Millman's form of the one nodal equation). */
export const rail = (V1) => (V1 / 2 + 6 / 3) / (1 / 2 + 1 / 4 + 1 / 3 + 1 / 6);
export const LOOP_R = { top: 2, right: 3, bottom: 4 };
export const counts = (id) => ({ n: CIRCUITS[id].nodes, b: CIRCUITS[id].branches.length });
/** The Dependent lab's amplifier with R_f = 10 kΩ and R_L = 1 kΩ, at gain μ: node voltages for 1 V in. */
export const amp = (mu) => closedForm({ mu, Rf: 10000, RL: 1000 });
/** The same amplifier with R_f in kΩ: gain, output resistance, and both with the source zeroed. */
export const ampFull = (mu, RfK = 10) => amplifier({ mu, Rf: 1000 * RfK, RL: 1000 });
const AMP = 'A 1 V source in series with 1 kΩ feeds node 1, which has 10 kΩ to ground; v_x is the voltage across that 10 kΩ, + at node 1. A dependent source μ v_x in series with 100 Ω drives node 2 from ground, node 2 has a 1 kΩ load to ground, and 10 kΩ joins node 2 back to node 1';

export default [
  problem({
    id: 'u1.1.rails',
    title: 'Two rails, one equation',
    exam: 'u1',
    ch: '1',
    lab: 'nodes',
    src: 'Flux, written for the Nodes lab',
    topics: ['nodal'],
    principles: ['kcl'],
    vars: { ask: choice(['four', 'the 4 Ω resistor'], ['six', 'the 6 Ω resistor']), V1: range(6, 20, 1, 'V') },
    text: (T) => `Four branches join a ground rail to a top rail: ${T.V1} V in series with 2 Ω, a 4 Ω resistor, 6 V in series with 3 Ω, and a 6 Ω resistor. Both sources push current up into the top rail. Find the top rail's voltage, and the current through ${T.ask}.`,
    parts: [num('v', ($) => rail($.V1), 'V', { label: 'v' }), num('i', ($) => rail($.V1) / ($.ask === 'four' ? 4 : 6), 'A', { label: 'i' })],
    level: 2,
    hints: ['One unknown: the top rail’s voltage v. Write the current leaving the rail through each branch.', '(v − V₁)/2 + v/4 + (v − 6)/3 + v/6 = 0. Then i = v/R for the plain resistor.'],
    steps: ($) => [String.raw`$v = \dfrac{${$.V1}/2 + 6/3}{1/2 + 1/4 + 1/3 + 1/6} = ${Number(rail($.V1).toPrecision(3))}$ V`, String.raw`$i = v/${$.ask === 'four' ? 4 : 6} = ${Number((rail($.V1) / ($.ask === 'four' ? 4 : 6)).toPrecision(3))}$ A`],
    sim: {
      scenario: 'parallel',
      setup(s, $) {
        Object.assign(s, { circuit: 'parallel', V: $.V1, Rx: 4, balance: false });
      },
      read: (c, s, $) => ({ v: c.nodal.v[1], i: Math.abs(c.nodal.i[$.ask === 'four' ? 1 : 3]) }),
    },
    cases: [kase('the notes’ rails', { ask: 'four', V1: 10 }, { v: 5.6, i: 1.4 })],
  }),

  problem({
    id: 'u1.2.loop',
    title: 'One loop, one equation',
    exam: 'u1',
    ch: '1',
    lab: 'nodes',
    src: 'Flux, written for the Nodes lab',
    topics: ['mesh'],
    principles: ['kvl'],
    vars: { which: choice(['top', 'the 2 Ω resistor'], ['right', 'the 3 Ω resistor'], ['bottom', 'the 4 Ω resistor']), V: range(6, 24, 1, 'V') },
    text: (T) => `A ${T.V} V source with an internal resistance of 1 Ω drives a single loop through 2 Ω, 3 Ω and 4 Ω in series. What is the voltage across ${T.which}?`,
    parts: [num('vr', ($) => ($.V * LOOP_R[$.which]) / 10, 'V', { label: 'V_R' })],
    level: 1,
    hints: ['One loop: one mesh current I, with every resistance round it in series.', 'I = V/(1 + 2 + 3 + 4), then V_R = I R.'],
    steps: ($) => [String.raw`$I = \dfrac{${$.V}}{1 + 2 + 3 + 4} = ${Number(($.V / 10).toPrecision(3))}$ A, so $V_R = ${Number(($.V / 10).toPrecision(3))}\times${LOOP_R[$.which]} = ${Number((($.V * LOOP_R[$.which]) / 10).toPrecision(3))}$ V`],
    sim: {
      scenario: 'series',
      setup(s, $) {
        Object.assign(s, { circuit: 'series', V: $.V, Rx: 3, balance: false });
      },
      read: (c, s, $) => ({ vr: Math.abs(c.mesh.I[0]) * LOOP_R[$.which] }),
    },
    cases: [kase('the notes’ loop, across 4 Ω', { which: 'bottom', V: 12 }, { vr: 4.8 })],
  }),

  problem({
    id: 'u1.3.count',
    title: 'How many equations?',
    exam: 'u1',
    ch: '1',
    lab: 'nodes',
    src: 'Flux, written for the Nodes lab',
    topics: ['count'],
    principles: ['count'],
    vars: {
      circuit: choice(['parallel', 'four branches between two rails (2 nodes, 4 branches)'], ['series', 'one loop of four branches (4 nodes, 4 branches)'], ['bridge', 'a bridge fed by a source (4 nodes, 6 branches)']),
      ask: choice(['nodes', 'nodal analysis'], ['meshes', 'mesh analysis']),
    },
    text: (T) => `How many equations does ${T.ask} need for ${T.circuit}?`,
    parts: [num('count', ($) => ($.ask === 'nodes' ? counts($.circuit).n - 1 : counts($.circuit).b - counts($.circuit).n + 1), '', { label: 'equations', abs: 1e-6 })],
    level: 1,
    hints: ['Nodal analysis: one equation per node except ground.', 'Mesh analysis: one per window, b − n + 1.'],
    steps: ($) => {
      const { n, b } = counts($.circuit);
      return [$.ask === 'nodes' ? `${n} nodes, one of them ground: ${n - 1}.` : `${b} − ${n} + 1 = ${b - n + 1} windows.`];
    },
    sim: {
      scenario: 'parallel',
      setup(s, $) {
        Object.assign(s, { circuit: $.circuit, balance: false });
      },
      read: (c, s, $) => ({ count: $.ask === 'nodes' ? c.nodalCount : c.meshCount }),
    },
    cases: [kase('the bridge, by meshes', { circuit: 'bridge', ask: 'meshes' }, { count: 3 })],
  }),

  problem({
    id: 'u1.4.choose',
    title: 'Which method?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'nodes',
    src: 'Flux, written for the Nodes lab',
    topics: ['count'],
    principles: ['count'],
    vars: { circuit: choice(['parallel', 'many branches between the same two nodes'], ['series', 'one long loop through many resistors']) },
    text: (T) => `A circuit has ${T.circuit}. Which method needs fewer equations?`,
    parts: [
      pick('method', 'fewer equations', [
        ['nodal', 'nodal analysis', 'Few nodes: one equation per node above ground.'],
        ['mesh', 'mesh analysis', 'Few windows: one equation per loop.'],
        ['same', 'they always need the same number', 'They give the same currents, but the counts n − 1 and b − n + 1 differ.'],
      ], ($) => ($.circuit === 'parallel' ? 'nodal' : 'mesh')),
    ],
    level: 1,
    hints: ['Count the nodes and the windows.', 'n − 1 against b − n + 1.'],
    steps: ($) => [$.circuit === 'parallel' ? 'Two nodes, so one nodal equation; each branch adds a window, so many mesh equations.' : 'One window, so one mesh equation; every resistor adds a node, so many nodal equations.'],
    sim: {
      scenario: 'parallel',
      setup(s, $) {
        Object.assign(s, { circuit: $.circuit, balance: false });
      },
      read: (c) => ({ method: c.nodalCount < c.meshCount ? 'nodal' : c.nodalCount > c.meshCount ? 'mesh' : 'same' }),
    },
    cases: [kase('the rails', { circuit: 'parallel' }, { method: 'nodal' })],
  }),
  problem({
    id: 'u1.5.amp',
    title: 'An amplifier with a dependent source',
    exam: 'u1',
    ch: '1',
    lab: 'dependent',
    src: 'Flux, written for the Dependent lab',
    topics: ['dependent'],
    principles: ['dependent', 'kcl'],
    vars: { ask: choice(['v2', 'the output voltage v₂'], ['vx', 'the controlling voltage v_x']), mu: range(-200, -20, 10, '') },
    text: (T) => `${AMP}. With μ = ${T.mu}, find ${T.ask}, in V.`,
    parts: [num('v', ($) => ($.ask === 'v2' ? amp($.mu).v2 : amp($.mu).v1), 'V', { label: 'v' })],
    level: 3,
    hints: [
      'Two unknowns, v₁ = v_x and v₂. Write the current law at each node; the dependent source sends (μ v₁ − v₂)/100 into node 2.',
      'Node 1: v₁(1/1000 + 1/10000 + 1/10000) − v₂/10000 = 1/1000. Node 2: −v₁(1/10000 + μ/100) + v₂(1/100 + 1/1000 + 1/10000) = 0.',
      'Solve the pair, by substitution or Cramer’s rule.',
    ],
    steps: ($) => {
      const r = amp($.mu);
      const a21 = -(1e-4 + $.mu / 100);
      return [
        String.raw`$\begin{pmatrix} 0.0012 & -0.0001 \\ ${Number(a21.toPrecision(4))} & 0.0111 \end{pmatrix}\begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \begin{pmatrix} 0.001 \\ 0 \end{pmatrix}$`,
        String.raw`$v_x = v_1 = ${Number(r.v1.toPrecision(3))}$ V, $v_2 = ${Number(r.v2.toPrecision(3))}$ V`,
      ];
    },
    sim: {
      scenario: 'amp',
      setup(s, $) {
        Object.assign(s, { mu: $.mu, Rf: 10, RL: 1 });
      },
      read: (c, s, $) => ({ v: $.ask === 'v2' ? c.v2 : c.v1 }),
    },
    cases: [kase('the notes’ amplifier, its output', { ask: 'v2', mu: -100 }, { v: -8.8245 })],
  }),

  problem({
    id: 'u1.6.keep',
    title: 'Keep it or zero it?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'dependent',
    src: 'Flux, written for the Dependent lab',
    topics: ['dependent'],
    principles: ['dependent'],
    vars: { task: choice(['th', 'find the resistance the load sees at the output (the Thévenin resistance)'], ['sp', 'add a second independent source at the input and use superposition'], ['out', 'find how much the output moves when the input changes']) },
    text: (T) => `An amplifier is drawn with a dependent source μ v_x. You want to ${T.task}. What do you do with the dependent source?`,
    parts: [
      pick('do', 'the dependent source', [
        ['keep', 'keep it in, with its controlling variable', 'Its value is set by the circuit. Remove it and you analyse a different circuit.'],
        ['zero', 'set it to zero, like an independent source', 'Only independent sources are switched off. Zero μ and the amplifier is gone.'],
        ['fix', 'replace it by a fixed source at its present value', 'Its value changes whenever v_x does; a fixed source would not follow.'],
      ], () => 'keep'),
    ],
    level: 1,
    hints: ['Is its value something you choose, or something the circuit sets?', 'Switch off only what you set from outside.'],
    steps: () => ['Keep it: it is part of the circuit, set by v_x.'],
    sim: {
      scenario: 'amp',
      setup() {},
      // Zeroing it changes what the load sees tenfold, so the answer is to keep it.
      read: (c) => ({ do: Math.abs(c.Rout0 / c.Rout) > 2 ? 'keep' : 'zero' }),
    },
    cases: [kase('the Thévenin resistance', { task: 'th' }, { do: 'keep' })],
  }),
  problem({
    id: 'u1.7.rout',
    title: 'What the load sees',
    exam: 'u1',
    ch: '1',
    lab: 'dependent',
    src: 'Flux, written for the Dependent lab',
    topics: ['dependent'],
    principles: ['dependent'],
    vars: { Rf: choice(['10', '10 kΩ'], ['20', '20 kΩ']), mu: range(-200, -20, 10, '') },
    text: (T) => `${AMP.replace('and 10 kΩ joins', `and ${T.Rf} joins`)}. With μ = ${T.mu}, what resistance does the load see at node 2, looking back into the circuit? Give it in Ω.`,
    parts: [num('r', ($) => ampFull($.mu, Number($.Rf)).Rout, 'Ω', { label: 'R_out' })],
    level: 3,
    hints: [
      'Switch off the 1 V source, which leaves its 1 kΩ to ground. Keep the dependent source in.',
      'Take the load out, push a test current I into node 2 and find v₂; R_out = v₂/I. The dependent source still answers v_x.',
      'With I in, node 1: v₁(1.2 mS) − v₂(0.1 mS) = 0, so v₁ = v₂/12. Node 2: v₂(1/100 + 1/10000) − v₁(1/10000 + μ/100) = I.',
    ],
    steps: ($) => {
      const r = ampFull($.mu, Number($.Rf));
      return [String.raw`Test current into node 2 with the source off and the load out: $R_\text{out} = ${Number(r.Rout.toPrecision(3))}$ Ω, against ${Number(r.Rout0.toPrecision(3))} Ω if μ were zeroed.`];
    },
    sim: {
      scenario: 'amp',
      setup(s, $) {
        Object.assign(s, { mu: $.mu, Rf: Number($.Rf), RL: 1 });
      },
      read: (c) => ({ r: c.Rout }),
    },
    cases: [kase('the notes’ amplifier', { Rf: '10', mu: -100 }, { r: 10.7 }, { note: 'notes, section 4' })],
  }),

  problem({
    id: 'u1.8.gain',
    title: 'The circuit’s gain',
    exam: 'u1',
    ch: '1',
    lab: 'dependent',
    src: 'Flux, written for the Dependent lab',
    topics: ['dependent'],
    principles: ['dependent', 'kcl'],
    vars: { Rf: choice(['10', '10 kΩ'], ['20', '20 kΩ'], ['40', '40 kΩ']), mu: range(-200, -50, 10, '') },
    text: (T) => `${AMP.replace('and 10 kΩ joins', `and ${T.Rf} joins`)}. With μ = ${T.mu}, what is the circuit’s gain v₂/v_in?`,
    parts: [num('g', ($) => ampFull($.mu, Number($.Rf)).gain, '', { label: 'gain', abs: 1e-6 })],
    level: 3,
    hints: [
      'Write the current law at nodes 1 and 2 with v_x = v₁, and solve for v₂ with 1 V in.',
      'As μ grows, v₁ is pulled towards 0 and the gain towards −R_f/R_s; at a finite μ it falls a little short.',
    ],
    steps: ($) => {
      const r = ampFull($.mu, Number($.Rf));
      return [String.raw`Solving the two node equations: $v_2/v_\text{in} = ${Number(r.gain.toPrecision(3))}$, short of $-R_f/R_s = ${-Number($.Rf)}$`];
    },
    sim: {
      scenario: 'amp',
      setup(s, $) {
        Object.assign(s, { mu: $.mu, Rf: Number($.Rf), RL: 1 });
      },
      read: (c) => ({ g: c.gain }),
    },
    cases: [kase('the notes’ amplifier', { Rf: '10', mu: -100 }, { g: -8.8245 })],
  }),
];
