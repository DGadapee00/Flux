/**
 * Unit 1 bank: node and mesh analysis. Original problems, written for the Nodes lab, with staged
 * hints and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { CIRCUITS } from '../../data/circuits.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The rails' top voltage for a first source of V1 volts (Millman's form of the one nodal equation). */
export const rail = (V1) => (V1 / 2 + 6 / 3) / (1 / 2 + 1 / 4 + 1 / 3 + 1 / 6);
export const LOOP_R = { top: 2, right: 3, bottom: 4 };
export const counts = (id) => ({ n: CIRCUITS[id].nodes, b: CIRCUITS[id].branches.length });

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
];
