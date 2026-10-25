/** Ch 5 · Newton's laws. OpenStax University Physics Vol. 1, §§5.3–5.5. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { acceleration, weight } from '@flux/subjects/mechanics/dynamics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, mc, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u3', ch: '5' };

function who($) {
  if (Math.abs($.m1 - $.m2) < 1e-9) return 'same';
  return $.m1 < $.m2 ? 'm1' : 'm2';
}

export default [
  problem({
    ...U,
    id: 'ch5.ma',
    src: 'OpenStax University Physics Vol. 1 §5.3',
    title: 'Acceleration from a net force',
    topics: ['newton', 'second-law'],
    vars: {
      m: range(1, 20, 0.5, 'kg'),
      F: range(4, 80, 1, 'N'),
    },
    derive: ($) => ({ a: acceleration(v($.F, 0, 0), $.m).x }),
    second: ($) => ({ a: $.F / $.m }),
    text: (T) => `A net force of ${T.F} N acts on a ${T.m} kg object along a straight line. Find the acceleration.`,
    parts: [
      sym('asym', 'F/m', { F: 'N', m: 'kg' }, ($) => $.a, { unit: 'm/s²', label: 'acceleration as a formula' }),
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
    ],
    hints: [
      String.raw`Newton's second law is $\vec F_{\mathrm{net}} = m\vec a$. Here the force is the net force.`,
    ],
    steps: ($) => [
      String.raw`$a = F/m = ${texNum($.a)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m: 4, F: 20 }, { a: 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.weight',
    src: 'OpenStax University Physics Vol. 1 §5.4',
    title: 'Weight',
    topics: ['newton', 'weight'],
    vars: { m: range(0.5, 25, 0.5, 'kg') },
    derive: ($) => {
      const W = weight($.m, G);
      return { W: Math.hypot(W.x, W.y, W.z), Wy: W.y };
    },
    second: ($) => ({ W: $.m * G, Wy: -$.m * G }),
    text: (T) => `Find the weight of a ${T.m} kg object, and the y component of that force. Take g = ${G} m/s², with +y upward.`,
    parts: [
      num('W', ($) => $.W, 'N', { label: 'weight' }),
      num('Wy', ($) => $.Wy, 'N', { label: String.raw`$W_y$` }),
    ],
    hints: [
      String.raw`Weight has magnitude $mg$ and points straight down.`,
    ],
    steps: ($) => [
      String.raw`$W = mg = ${texNum($.W)}\ \mathrm{N}$`,
      String.raw`$W_y = -mg = ${texNum($.Wy)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 2 }, { W: 19.62, Wy: -19.62 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.net',
    src: 'OpenStax University Physics Vol. 1 §5.3',
    title: 'Net force in a plane',
    topics: ['newton', 'components'],
    vars: {
      m: range(1, 12, 0.5, 'kg'),
      Fx: range(-40, 40, 2, 'N'),
      Fy: range(-40, 40, 2, 'N'),
    },
    derive: ($) => {
      const a = acceleration(v($.Fx, $.Fy, 0), $.m);
      return { ax: a.x, ay: a.y, a: Math.hypot(a.x, a.y) };
    },
    second: ($) => ({
      ax: $.Fx / $.m,
      ay: $.Fy / $.m,
      a: Math.hypot($.Fx, $.Fy) / $.m,
    }),
    valid: ($) => $.a > 0.4,
    text: (T) => `The net force on a ${T.m} kg object is (${T.Fx}, ${T.Fy}) N. Find the acceleration components and the magnitude of the acceleration.`,
    parts: [
      num('ax', ($) => $.ax, 'm/s²', { label: String.raw`$a_x$` }),
      num('ay', ($) => $.ay, 'm/s²', { label: String.raw`$a_y$` }),
      num('a', ($) => $.a, 'm/s²', { label: String.raw`$|a|$` }),
    ],
    hints: [
      'Divide each component of the net force by the mass. The magnitude comes from those two components.',
    ],
    steps: ($) => [
      String.raw`$a_x = F_x/m = ${texNum($.ax)}\ \mathrm{m/s}^2$, $a_y = ${texNum($.ay)}\ \mathrm{m/s}^2$`,
      String.raw`$|a| = ${texNum($.a)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m: 2, Fx: 6, Fy: 8 }, { ax: 3, ay: 4, a: 5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.pair',
    src: 'OpenStax University Physics Vol. 1 §5.5',
    title: 'Action and reaction',
    topics: ['newton', 'third-law'],
    vars: {
      m1: range(1, 8, 0.5, 'kg'),
      m2: range(1, 8, 0.5, 'kg'),
      F: range(4, 40, 1, 'N'),
    },
    derive: ($) => ({
      a1: acceleration(v($.F, 0, 0), $.m1).x,
      a2: acceleration(v($.F, 0, 0), $.m2).x,
      who: who($),
    }),
    second: ($) => ({ a1: $.F / $.m1, a2: $.F / $.m2, who: who($) }),
    text: (T) => `Mass 1 (${T.m1} kg) and mass 2 (${T.m2} kg) push on each other. The force on each has magnitude ${T.F} N. Find each acceleration, and say which mass accelerates more.`,
    parts: [
      num('a1', ($) => $.a1, 'm/s²', { label: 'acceleration of mass 1' }),
      num('a2', ($) => $.a2, 'm/s²', { label: 'acceleration of mass 2' }),
      mc('who', [
        ['m1', 'Mass 1'],
        ['m2', 'Mass 2'],
        ['same', 'They match'],
      ], ($) => $.who, { label: 'greater acceleration' }),
    ],
    hints: [
      'The two forces are equal and opposite. Each acceleration is that force divided by that mass, so the lighter mass accelerates more.',
    ],
    steps: ($) => [
      String.raw`$a_1 = F/m_1 = ${texNum($.a1)}\ \mathrm{m/s}^2$, $a_2 = F/m_2 = ${texNum($.a2)}\ \mathrm{m/s}^2$`,
    ],
    cases: [
      kase('hand', { m1: 2, m2: 4, F: 8 }, { a1: 4, a2: 2, who: 'm1' }),
    ],
  }),
];
