/**
 * Unit 3 bank: phase diagrams. Original problems, written for the Lever lab, with staged hints and
 * named traps (../coaching/u3.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { phaseState } from '@flux/subjects/matsci/phasediagram.js';
import { BAR, U, hardness } from '@flux/subjects/matsci/jominy.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** Tie lines read off the lab's diagram, rounded as a student would read them, atom fraction Ni. */
export const TIE = { 1550: { xL: 0.471, xS: 0.541 }, 1600: { xL: 0.6, xS: 0.66 } };
export const share = ($) => {
  const t = TIE[$.T];
  return $.ask === 'L' ? (t.xS - $.x0) / (t.xS - t.xL) : ($.x0 - t.xL) / (t.xS - t.xL);
};
const p3 = (x) => Number(x.toPrecision(3));

/** Cooling rate at 700 °C, x in mm; `unit` converts x and `four` is the 4 in t = x²/4αu². */
export const quenchRate = ($, unit = 1e-3, four = 4) => {
  const x = Number($.x) * unit;
  const t = (x * x) / (four * BAR.alpha * U * U);
  return ((BAR.Ti - BAR.Tq) * U * Math.exp(-U * U)) / (Math.sqrt(Math.PI) * t);
};

export default [
  problem({
    id: 'u3.1.lever',
    title: 'How much of each phase',
    exam: 'u3',
    ch: '3',
    lab: 'lever',
    src: 'Flux, written for the Lever lab',
    topics: ['lever'],
    principles: ['lever'],
    vars: { ask: choice(['L', 'liquid'], ['S', 'solid α']), T: choice(['1550', '1550 K, where the tie line runs from 0.471 Ni (liquid) to 0.541 Ni (solid)'], ['1600', '1600 K, where the tie line runs from 0.600 Ni (liquid) to 0.660 Ni (solid)']), x0: range(0.48, 0.53, 0.01, '') },
    valid: ($) => $.x0 > TIE[$.T].xL + 0.005 && $.x0 < TIE[$.T].xS - 0.005,
    text: (T) => `A copper–nickel alloy of ${T.x0} atom fraction nickel is held at ${T.T}. What fraction of the alloy is ${T.ask}?`,
    parts: [num('w', ($) => share($), '', { label: 'W', abs: 1e-6 })],
    level: 2,
    hints: ['Mark the alloy on the tie line between the two ends.', 'A phase’s share is the arm on the far side from it, over the whole tie line.'],
    steps: ($) => {
      const t = TIE[$.T];
      return [$.ask === 'L' ? String.raw`$W_L = (${t.xS} - ${$.x0})/(${t.xS} - ${t.xL}) = ${p3(share($))}$` : String.raw`$W_\alpha = (${$.x0} - ${t.xL})/(${t.xS} - ${t.xL}) = ${p3(share($))}$`];
    },
    // Another route: the mass balance on copper instead of nickel.
    second: ($) => {
      const t = TIE[$.T];
      const cu = { x0: 1 - $.x0, L: 1 - t.xL, S: 1 - t.xS };
      const WL = (cu.x0 - cu.S) / (cu.L - cu.S);
      return { w: $.ask === 'L' ? WL : 1 - WL };
    },
    cases: [kase('the notes’ alloy', { ask: 'L', T: '1550', x0: 0.5 }, { w: 0.586 })],
  }),

  problem({
    id: 'u3.2.which',
    title: 'Composition or amount?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'lever',
    src: 'Flux, written for the Lever lab',
    topics: ['tie-line'],
    principles: ['lever'],
    vars: { q: choice(['comp', 'the nickel content of the liquid'], ['amount', 'how much of the alloy is liquid']) },
    text: (T) => `A copper–nickel alloy sits inside the two-phase lens. Where on the diagram do you read ${T.q}?`,
    parts: [
      pick('where', 'read it from', [
        ['end', 'the tie line’s end on the liquidus', 'The liquid’s composition is where the tie line meets the boundary of the liquid region.'],
        ['arm', 'the length of the tie line’s arm on the solid side, over the whole', 'That is the lever rule: each phase’s amount is the arm opposite it.'],
        ['point', 'the alloy’s own point', 'The alloy’s point is the overall composition, shared out between the two phases.'],
      ], ($) => ($.q === 'comp' ? 'end' : 'arm')),
    ],
    level: 1,
    hints: ['Composition: where does the liquid region begin along the tie line?', 'Amount: the lever rule.'],
    steps: ($) => [$.q === 'comp' ? 'At the tie line’s end on the liquidus.' : 'From the arm on the solid side: W_L = (x_α − x₀)/(x_α − x_L).'],
    sim: {
      scenario: 'mid',
      setup() {},
      read: (c, s, $) => ({ where: $.q === 'comp' ? (Math.abs(c.xL - 0.471) < 0.005 ? 'end' : 'point') : (Math.abs(c.WL - (c.xS - s.x0) / (c.xS - c.xL)) < 1e-9 ? 'arm' : 'point') }),
    },
    cases: [kase('the liquid’s nickel', { q: 'comp' }, { where: 'end' })],
  }),

  problem({
    id: 'u3.3.ends',
    title: 'Reading the tie line',
    exam: 'u3',
    ch: '3',
    lab: 'lever',
    src: 'Flux, written for the Lever lab',
    topics: ['tie-line'],
    principles: ['lever'],
    vars: { ask: choice(['L', 'the liquid'], ['S', 'the solid α']), T: range(1450, 1650, 50, 'K') },
    text: (T) => `In the lab’s copper–nickel diagram, set the temperature to ${T.T}. What atom fraction of nickel does ${T.ask} hold, for any alloy inside the lens there?`,
    parts: [num('x', ($) => (phaseState({ x0: 0.5, T: $.T })[$.ask === 'L' ? 'xL' : 'xS']), '', { label: 'x_Ni', abs: 1e-6 })],
    level: 1,
    hints: ['Draw the tie line at that temperature.', 'Its left end, on the liquidus, is the liquid; its right end, on the solidus, is the solid.'],
    steps: ($) => {
      const r = phaseState({ x0: 0.5, T: $.T });
      return [`Liquid ${p3(r.xL)}, solid ${p3(r.xS)} atom fraction nickel.`];
    },
    sim: {
      scenario: 'mid',
      setup(s, $) {
        s.T = $.T;
      },
      read: (c, s, $) => ({ x: $.ask === 'L' ? c.xL : c.xS }),
    },
    cases: [kase('the notes’ tie line, its solid end', { ask: 'S', T: 1550 }, { x: 0.541 })],
  }),
  problem({
    id: 'u3.4.jominy',
    title: 'How fast it cools',
    exam: 'u3',
    ch: '3',
    lab: 'jominy',
    src: 'Flux, written for the End quench lab',
    topics: ['hardenability'],
    principles: ['hardenability'],
    vars: { x: choice(['3', '3 mm'], ['6', '6 mm'], ['12', '12 mm'], ['24', '24 mm']) },
    text: (T) => `A steel bar at 850 °C has its end held at 20 °C; α = 6 × 10⁻⁶ m²/s. At 700 °C, erf u = 680/830 gives u = 0.9465. How fast, in K/s, is the point ${T.x} from the end cooling as it passes 700 °C?`,
    parts: [num('r', ($) => quenchRate($), 'K/s', { label: 'dT/dt' })],
    level: 3,
    hints: ['It reaches 700 °C at t = x²/(4αu²).', 'dT/dt = (T_i − T_q) u e^{−u²}/(√π t).'],
    steps: ($) => [String.raw`$t = x^2/4\alpha u^2 = ${Number(((Number($.x) / 1000) ** 2 / (4 * BAR.alpha * U * U)).toPrecision(3))}$ s`, String.raw`$\dot T = ${Number(quenchRate($).toPrecision(3))}$ K/s`],
    sim: { scenario: 'end', setup(s, $) { s.xmm = Number($.x); }, read: (c) => ({ r: c.rate }) },
    cases: [kase('6 mm', { x: '6' }, { r: 108.06 })],
  }),

  problem({
    id: 'u3.5.deeper',
    title: 'Which hardens deeper?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'jominy',
    src: 'Flux, written for the End quench lab',
    topics: ['hardenability'],
    principles: ['hardenability'],
    vars: { x: choice(['15', '15 mm'], ['25', '25 mm']) },
    text: (T) => `Bars of plain 1045 steel and alloy 4340 are end-quenched the same way. ${T.x} from the end, which is harder?`,
    parts: [
      pick('a', 'the harder one', [
        ['alloy', '4340', 'Its alloying slows the change to pearlite, so a slower cooling rate still makes martensite.'],
        ['plain', '1045', 'It has a little more carbon, but there it has turned to pearlite: too slow for its critical rate.'],
        ['same', 'the same', 'Both cool at the same rate, but they need different rates to harden.'],
      ], () => 'alloy'),
    ],
    level: 1,
    hints: ['Both bars cool alike.', 'Which needs the faster rate to make martensite?'],
    steps: () => ['At the same rate, 4340 is above its low critical rate and 1045 below its high one.'],
    sim: { scenario: 'deep', setup(s, $) { s.xmm = Number($.x); }, read: (c) => ({ a: hardness('s4340', c.rate).H > hardness('s1045', c.rate).H + 1 ? 'alloy' : hardness('s1045', c.rate).H > hardness('s4340', c.rate).H + 1 ? 'plain' : 'same' }) },
    cases: [kase('15 mm', { x: '15' }, { a: 'alloy' })],
  }),
];
