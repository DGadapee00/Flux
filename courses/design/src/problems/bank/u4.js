/**
 * Unit 4 bank: joints and mounts. Original problems, written for the Bolted joint and Mount labs,
 * with staged hints and named traps (../coaching/u4.js), each checked against its lab (`sim`).
 */
import { boltedJoint } from '@flux/subjects/design/joints.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Member stiffness over bolt stiffness, for each kind of joint in the problems. */
export const RATIO = { steel: 3, aluminium: 1.5, gasket: 0.3 };
const members = () => choice(['steel', 'steel plates, three times as stiff as the bolt'], ['aluminium', 'aluminium plates, one and a half times as stiff as the bolt'], ['gasket', 'a gasket, a third as stiff as the bolt']);
export const joint = ($) => boltedJoint({ Fi: $.Fi, P: $.P ?? 0, ratio: RATIO[$.members] });

export default [
  problem({
    id: 'u4.1.bolt-share',
    title: 'Bolt force under a pull',
    exam: 'u4',
    ch: '4',
    lab: 'bolted',
    src: 'Flux, written for the Bolted joint lab',
    topics: ['bolted'],
    principles: ['preload'],
    vars: { members: members(), Fi: range(10, 30, 5, 'kN'), P: range(4, 12, 2, 'kN') },
    text: (T) => `A bolt clamps ${T.members} with a preload of ${T.Fi}. A pull of ${T.P} tries to separate the joint. Find the bolt force and the clamp left between the parts.`,
    parts: [
      num('Fb', ($) => joint($).Fb, 'kN', { label: 'bolt force' }),
      num('Fm', ($) => joint($).Fm, 'kN', { label: 'clamp left' }),
    ],
    level: 2,
    hints: ['The bolt takes the share $C = k_b/(k_b + k_m)$ of the pull; the rest unclamps the parts.', '$F_b = F_i + CP$ and $F_m = F_i - (1 - C)P$, while the parts still touch.'],
    steps: ($, sig) => {
      const j = joint($);
      return [String.raw`$C = 1/(1 + ${RATIO[$.members]}) = ${sig(j.C)}$, so $F_b = ${$.Fi} + ${sig(j.C)}(${$.P}) = ${sig(j.Fb)}$ kN and $F_m = ${$.Fi} - ${sig(1 - j.C)}(${$.P}) = ${sig(j.Fm)}$ kN.`];
    },
    sim: {
      scenario: 'steel',
      setup(s, $) {
        Object.assign(s, { Fi: $.Fi, P: $.P, ratio: RATIO[$.members] });
      },
      read: (c) => ({ Fb: c.Fb, Fm: c.Fm }),
    },
    cases: [kase('The notes’ example: steel, 20 kN preload, 10 kN pull', { members: 'steel', Fi: 20, P: 10 }, { Fb: 22.5, Fm: 12.5 })],
  }),

  problem({
    id: 'u4.2.separation',
    title: 'When the joint opens',
    exam: 'u4',
    ch: '4',
    lab: 'bolted',
    src: 'Flux, written for the Bolted joint lab',
    topics: ['bolted'],
    principles: ['preload'],
    vars: { members: members(), Fi: range(10, 30, 5, 'kN') },
    text: (T) => `A bolt clamps ${T.members} with a preload of ${T.Fi}. What external pull makes the parts separate?`,
    parts: [num('Psep', ($) => joint($).Psep, 'kN', { label: 'pull that opens the joint' })],
    level: 2,
    hints: ['The clamp falls by $(1 - C)$ for each unit of pull.', 'It reaches zero at $P = F_i/(1 - C)$.'],
    steps: ($, sig) => {
      const j = joint($);
      return [String.raw`$1 - C = ${sig(1 - j.C)}$, so the joint opens at $${$.Fi}/${sig(1 - j.C)} = ${sig(j.Psep)}$ kN.`];
    },
    sim: {
      scenario: 'steel',
      setup(s, $) {
        Object.assign(s, { Fi: $.Fi, P: 0, ratio: RATIO[$.members] });
      },
      read: (c) => ({ Psep: c.Psep }),
    },
    cases: [kase('Steel, 20 kN preload', { members: 'steel', Fi: 20 }, { Psep: 26.67 })],
  }),

  problem({
    id: 'u4.3.which-mount',
    title: 'Exact, redundant or free?',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'mount',
    src: 'Flux, written for the Mount lab',
    topics: ['mount'],
    principles: ['exact-constraint'],
    vars: { layout: choice(['exact', 'two pins below and one at the left side'], ['over', 'two pins below and two at the left side'], ['between', 'two pins below and one at each side'], ['under', 'two pins below and none at the sides']) },
    text: (T) => `A flat plate is pushed down and to the left onto ${T.layout}. In the plane it has three freedoms: slide sideways, slide up and down, and turn. How is it held?`,
    parts: [
      pick('kind', 'the plate is', [
        ['exact', 'exactly constrained', 'Each pin holds one freedom and none fights another.'],
        ['redundant', 'over-constrained: a pin is redundant', 'More pins than freedoms: an off-size pin leaves a misfit.'],
        ['free', 'under-constrained: a freedom is left', 'Too few independent pins: the plate can still move.'],
      ], ($) => ({ exact: 'exact', over: 'redundant', between: 'redundant', under: 'free' }[$.layout])),
    ],
    level: 1,
    hints: ['Two pins below fix the height and the turn.', 'What fixes the sideways slide, and does anything fix it twice?'],
    steps: ($) => [{ exact: 'Two below fix height and turn; one at the side fixes the slide: three pins, three freedoms.', over: 'The second side pin also fixes the turn, which the bottom pins already fix: it is redundant.', between: 'The two side pins both fix the sideways slide: one is redundant, and the plate jams if it is a touch too wide.', under: 'Nothing fixes the sideways slide.' }[$.layout]],
    sim: {
      scenario: 'exact',
      setup(s, $) {
        s.layout = $.layout;
      },
      read: (c) => ({ kind: c.free > 0 ? 'free' : c.redundant > 0 ? 'redundant' : 'exact' }),
    },
    cases: [kase('Held between two side pins', { layout: 'between' }, { kind: 'redundant' })],
  }),
];
