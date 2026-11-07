/**
 * Unit 3 bank: circuit theorems. Original problems, written for the Superpose lab, with staged
 * hints and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 *
 * The circuit is the lab's: V₁ with 2 Ω into node 1, 4 Ω from node 1 to ground, 2 Ω from node 1 to
 * node 2, the 4 Ω load from node 2 to ground, and V₂ with 4 Ω into node 2.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { closedForm } from '@flux/subjects/em/thevenin.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const RL = 4;
/** The load current's parts per volt: V₁ alone sees 4 Ω in all and sends a quarter of its current through the load, 1/16; V₂ alone gives 5/64. */
export const part1 = (V1) => V1 / 16;
export const part2 = (V2) => (5 * V2) / 64;
/** The same parts with the other source opened, not shorted: the mistake of removing it altogether. */
export const open1 = (V1) => V1 / 11;
export const open2 = (V2) => (3 * V2) / 32;
export const sign = ($) => ($.way === 'oppose' ? -1 : 1);
export const loadI = ($) => part1($.V1) + sign($) * part2($.V2);
const CIRCUIT = 'V₁ in series with 2 Ω feeds node 1; 4 Ω runs from node 1 to ground and 2 Ω from node 1 to node 2; a 4 Ω load runs from node 2 to ground; V₂ in series with 4 Ω feeds node 2';
const p3 = (x) => Number(x.toPrecision(3));
/** The network seen from the load's terminals, with the load taken out. */
export const th = ($) => closedForm({ V1: $.V1, V2: $.V2 });
export const thAsk = ($) => ({ vth: th($).Vth, rth: th($).Rth, in: th($).IN })[$.ask];
/** Load power for a source V_th, R_th and a load k R_th. */
export const LOADS = { match: 1, double: 2, half: 0.5 };
export const loadP = ($) => {
  const RL = LOADS[$.load] * $.R;
  return ($.V / ($.R + RL)) ** 2 * RL;
};

export default [
  problem({
    id: 'u3.1.parts',
    title: 'One source at a time',
    exam: 'u3',
    ch: '3',
    lab: 'superpose',
    src: 'Flux, written for the Superpose lab',
    topics: ['superpose'],
    principles: ['superpose'],
    vars: {
      ask: choice(['one', 'the part of the load current that V₁ gives alone'], ['both', 'the load current with both sources on']),
      V1: range(6, 24, 1, 'V'),
      V2: range(2, 12, 1, 'V'),
    },
    text: (T) => `${CIRCUIT}. V₁ = ${T.V1} V and V₂ = ${T.V2} V, each pushing current up into its node. Find ${T.ask}, in A.`,
    parts: [num('i', ($) => ($.ask === 'one' ? part1($.V1) : part1($.V1) + part2($.V2)), 'A', { label: 'I_L' })],
    level: 2,
    hints: [
      'Set V₂ to zero: it becomes a wire, so its 4 Ω now runs from node 2 to ground beside the load.',
      'With V₂ a wire, node 2 sees 4 Ω ∥ 4 Ω = 2 Ω, plus 2 Ω makes 4 Ω, in parallel with the 4 Ω shunt: 2 Ω. V₁ then sees 4 Ω in all.',
      'V₁ alone gives V₁/16 through the load; V₂ alone, by the same steps, gives 5V₂/64. With both on, add them.',
    ],
    steps: ($) => [
      String.raw`V₁ alone: $I = ${$.V1}/4 = ${p3($.V1 / 4)}$ A from the source, half through the 2 Ω to node 2, half of that through the load: $I_{L1} = ${p3(part1($.V1))}$ A`,
      ...($.ask === 'both' ? [String.raw`V₂ alone: $I_{L2} = 5 \times ${$.V2}/64 = ${p3(part2($.V2))}$ A, so $I_L = ${p3(part1($.V1) + part2($.V2))}$ A`] : []),
    ],
    sim: {
      scenario: 'aid',
      setup(s, $) {
        Object.assign(s, { V1: $.V1, V2: $.V2, RL, show: 'both' });
      },
      read: (c, s, $) => ({ i: $.ask === 'one' ? c.one.I : c.both.I }),
    },
    cases: [kase('the notes’ two sources', { ask: 'both', V1: 12, V2: 6 }, { i: 1.21875 })],
  }),

  problem({
    id: 'u3.2.power',
    title: 'The load’s power',
    exam: 'u3',
    ch: '3',
    lab: 'superpose',
    src: 'Flux, written for the Superpose lab',
    topics: ['power'],
    principles: ['superpose'],
    vars: {
      way: choice(['aid', 'pushing the same way as V₁'], ['oppose', 'reversed, pushing against V₁']),
      V1: range(6, 24, 2, 'V'),
      V2: range(2, 12, 1, 'V'),
    },
    valid: ($) => Math.abs(loadI($)) > 0.05,
    text: (T) => `${CIRCUIT}. V₁ = ${T.V1} V pushes current up into node 1, and V₂ = ${T.V2} V is ${T.way}. V₁ alone gives the load V₁/16 amperes and V₂ alone 5V₂/64. What power does the load take with both on, in W?`,
    parts: [num('p', ($) => RL * loadI($) ** 2, 'W', { label: 'P_L' })],
    level: 2,
    hints: ['Find the load current with both on first: add the two parts, with their signs.', 'Then P = I²R with the total current, not the sum of the two powers.'],
    steps: ($) => [
      String.raw`$I_L = ${p3(part1($.V1))} ${sign($) > 0 ? '+' : '-'} ${p3(part2($.V2))} = ${p3(loadI($))}$ A`,
      String.raw`$P_L = ${p3(loadI($))}^2 \times 4 = ${p3(RL * loadI($) ** 2)}$ W`,
    ],
    sim: {
      scenario: 'aid',
      setup(s, $) {
        Object.assign(s, { V1: $.V1, V2: sign($) * $.V2, RL, show: 'both' });
      },
      read: (c) => ({ p: c.both.P }),
    },
    cases: [kase('the notes’ two sources', { way: 'aid', V1: 12, V2: 6 }, { p: 5.941 })],
  }),

  problem({
    id: 'u3.3.equal',
    title: 'Equal powers, together',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'superpose',
    src: 'Flux, written for the Superpose lab',
    topics: ['power'],
    principles: ['superpose'],
    vars: { way: choice(['aid', 'push current through the load the same way'], ['oppose', 'push current through the load opposite ways']) },
    text: (T) => `In a linear circuit, each of two sources alone puts the same power P into a load resistor. The two parts of the load current ${T.way}. With both on, what power does the load take?`,
    parts: [
      pick('p', 'the load power', [
        ['two', '2P, the sum', 'Powers add only when one of the parts is zero. Add the currents, then square.'],
        ['four', '4P', 'Each part is I, so the total is 2I, and (2I)²R = 4I²R.'],
        ['zero', 'nothing', 'Equal currents opposite ways cancel: no current, no power.'],
      ], ($) => ($.way === 'aid' ? 'four' : 'zero')),
    ],
    level: 1,
    hints: ['Each source alone drives the same current I through the load.', 'The load current with both on is I + I or I − I.'],
    steps: ($) => [$.way === 'aid' ? 'I_L = 2I, so P_L = 4I²R = 4P.' : 'I_L = I − I = 0, so P_L = 0.'],
    sim: {
      scenario: 'equal',
      setup(s, $) {
        if ($.way === 'oppose') s.V2 = -s.V2;
      },
      read: (c) => {
        const r = c.both.P / c.one.P;
        return { p: r > 3 ? 'four' : r < 0.5 ? 'zero' : 'two' };
      },
    },
    cases: [kase('pushing the same way', { way: 'aid' }, { p: 'four' })],
  }),

  problem({
    id: 'u3.4.off',
    title: 'Switching a source off',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'superpose',
    src: 'Flux, written for the Superpose lab',
    topics: ['superpose'],
    principles: ['superpose'],
    vars: { what: choice(['v', 'an independent voltage source'], ['i', 'an independent current source'], ['dep', 'a dependent source, set by a current elsewhere']) },
    text: (T) => `You use superposition to find one source’s part of a current. What do you put in place of ${T.what} while you do?`,
    parts: [
      pick('put', 'in its place', [
        ['wire', 'a wire', 'A voltage source at zero holds no voltage across it: a short.'],
        ['break', 'a break', 'A current source at zero lets no current through: an open circuit.'],
        ['keep', 'leave it as it is', 'A dependent source is part of the circuit, set by the circuit itself. Remove it and you analyse a different circuit.'],
      ], ($) => ({ v: 'wire', i: 'break', dep: 'keep' })[$.what]),
    ],
    level: 1,
    hints: ['A source at zero: zero volts across it, or zero amperes through it?', 'A dependent source is set by the circuit, not by you.'],
    steps: ($) => [({ v: 'Zero volts across it: a wire.', i: 'Zero amperes through it: a break.', dep: 'It is not a source you switch: it stays.' })[$.what]],
    // The voltage-source case on the lab: V₂ set to zero is a wire, so V₁'s part comes out the same.
    sim: {
      scenario: 'aid',
      setup() {},
      read: (c, s, $) => (Math.abs(c.one.I - s.V1 / 16) < 1e-9 ? { put: ({ v: 'wire', i: 'break', dep: 'keep' })[$.what] } : { put: 'none' }),
    },
    cases: [kase('a voltage source', { what: 'v' }, { put: 'wire' })],
  }),
  problem({
    id: 'u3.5.thevenin',
    title: 'The network as one source',
    exam: 'u3',
    ch: '3',
    lab: 'thevenin',
    src: 'Flux, written for the Thévenin lab',
    topics: ['thevenin'],
    principles: ['thevenin'],
    vars: { ask: choice(['vth', 'its Thévenin voltage V_th, in V'], ['rth', 'its Thévenin resistance R_th, in Ω'], ['in', 'its Norton current I_N, in A']), V1: range(6, 24, 1, 'V'), V2: range(1, 12, 1, 'V') },
    text: (T) => `${CIRCUIT.replace('; a 4 Ω load runs from node 2 to ground', '')}. V₁ = ${T.V1} V and V₂ = ${T.V2} V, each pushing current up into its node. Seen from node 2 and ground, find ${T.ask}.`,
    parts: [num('v', ($) => thAsk($), '', { label: 'value' })],
    level: 2,
    hints: [
      'R_th: switch both sources off, each a wire, and combine what node 2 sees: 4 Ω in parallel with 2 Ω plus 2 Ω ∥ 4 Ω.',
      'I_N: short node 2 to ground. V₂ sends V₂/4 through its own 4 Ω; V₁ sees 2 Ω plus 4 Ω ∥ 2 Ω, and two thirds of its current takes the 2 Ω to the short.',
      'V_th = I_N R_th.',
    ],
    steps: ($) => {
      const r = th($);
      return [
        String.raw`$R_\text{th} = 4 \parallel (2 + 2 \parallel 4) = ${p3(r.Rth)}$ Ω`,
        String.raw`$I_N = ${$.V2}/4 + \tfrac{2}{3}\cdot ${$.V1}/(2 + 4/3) = ${p3(r.IN)}$ A, $V_\text{th} = I_N R_\text{th} = ${p3(r.Vth)}$ V`,
      ];
    },
    sim: {
      scenario: 'match',
      setup(s, $) {
        Object.assign(s, { V1: $.V1, V2: $.V2 });
      },
      read: (c, s, $) => ({ v: ({ vth: c.Vbench, rth: c.Rbench, in: c.Vbench / c.Rbench })[$.ask] }),
    },
    cases: [kase('the notes’ network, its voltage', { ask: 'vth', V1: 12, V2: 6 }, { v: 7.09 })],
  }),

  problem({
    id: 'u3.6.load-power',
    title: 'Power into a load',
    exam: 'u3',
    ch: '3',
    lab: 'thevenin',
    src: 'Flux, written for the Thévenin lab',
    topics: ['maxpower'],
    principles: ['maxpower'],
    vars: { load: choice(['match', 'equal to R_th'], ['double', 'twice R_th'], ['half', 'half of R_th']), V: range(4, 20, 1, 'V'), R: range(1, 10, 1, 'Ω') },
    text: (T) => `A network has V_th = ${T.V} and R_th = ${T.R}. A load ${T.load} is connected. What power does the load take, in W?`,
    parts: [num('p', ($) => loadP($), 'W', { label: 'P_L' })],
    level: 1,
    hints: ['The load and R_th are in series across V_th: I = V_th/(R_th + R_L).', 'P_L = I² R_L.'],
    steps: ($) => {
      const RL = LOADS[$.load] * $.R;
      return [String.raw`$I = ${$.V}/(${$.R} + ${p3(RL)}) = ${p3($.V / ($.R + RL))}$ A, $P_L = I^2 \times ${p3(RL)} = ${p3(loadP($))}$ W`];
    },
    // The second route: the load's share of the total power, η P_total.
    second: ($) => {
      const RL = LOADS[$.load] * $.R;
      return { p: (RL / (RL + $.R)) * ($.V ** 2 / (RL + $.R)) };
    },
    cases: [kase('the notes’ matched load', { load: 'match', V: 7.09, R: 1.82 }, { p: 6.905 })],
  }),

  problem({
    id: 'u3.7.match-or-not',
    title: 'Match the load?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'thevenin',
    src: 'Flux, written for the Thévenin lab',
    topics: ['maxpower'],
    principles: ['maxpower'],
    vars: { use: choice(['antenna', 'a radio receiver taking a faint signal from its antenna'], ['supply', 'a bench power supply running a heater'], ['battery', 'a battery running a laptop, where its charge should last']) },
    text: (T) => `For ${T.use}, should the load’s resistance match the source’s Thévenin resistance?`,
    parts: [
      pick('choice', 'the load', [
        ['match', 'match it: R_L = R_th', 'Matching gets the most power out, at 50% efficiency. Worth it when the source is weak and its power is all there is.'],
        ['large', 'make it much larger than R_th', 'Little current, little heat in the source: efficiency R_L/(R_L + R_th) near 100%. Where energy matters, run here.'],
        ['small', 'make it much smaller than R_th', 'Then most of the power heats the source and little reaches the load.'],
      ], ($) => ($.use === 'antenna' ? 'match' : 'large')),
    ],
    level: 1,
    hints: ['Is the goal the most power from a weak source, or wasting little energy?', 'At the match, the source heats itself as much as the load.'],
    steps: ($) => [$.use === 'antenna' ? 'The signal is faint: take all the power it can give. Match.' : 'Energy and heat matter: keep R_L well above R_th.'],
    second: ($) => ({ choice: $.use === 'antenna' ? 'match' : 'large' }),
    cases: [kase('the antenna', { use: 'antenna' }, { choice: 'match' })],
  }),
];
