/** Ch 12 · Static equilibrium. OpenStax University Physics Vol. 1, §§12.1–12.2. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { moment2D, particleEq2D, rigidBody2D } from '@flux/subjects/mechanics/statics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { kase, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u8', ch: '12' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch12.beam',
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Beam on a pin and a roller',
    topics: ['equilibrium', 'beam'],
    vars: {
      m: range(2, 20, 1, 'kg'),
      M: range(20, 80, 5, 'kg'),
      L: range(2, 8, 0.5, 'm'),
      d: range(0.5, 6, 0.5, 'm'),
    },
    derive: ($) => {
      const body = rigidBody2D({
        about: v(0, 0, 0),
        loads: [
          { at: v($.L / 2, 0, 0), F: v(0, -$.m * G, 0) },
          { at: v($.d, 0, 0), F: v(0, -$.M * G, 0) },
        ],
        unknowns: [
          { at: v(0, 0, 0), dir: v(1, 0, 0) },
          { at: v(0, 0, 0), dir: v(0, 1, 0) },
          { at: v($.L, 0, 0), dir: v(0, 1, 0) },
        ],
      });
      const [Ax, Ay, By] = body.reactions;
      return { Ax, Ay, By };
    },
    second: ($) => {
      const By = ($.m * G * ($.L / 2) + $.M * G * $.d) / $.L;
      return { Ax: 0, Ay: ($.m + $.M) * G - By, By };
    },
    valid: ($) => $.d > 0.3 && $.d < $.L - 0.3,
    text: (T) => `A uniform beam of mass ${T.m} kg and length ${T.L} m is horizontal. A pin holds the left end and a roller holds the right end. A person of mass ${T.M} kg stands ${T.d} m from the left end. Take g = ${G} m/s² and +y upward. Find the pin's horizontal and vertical forces, and the roller's vertical force.`,
    parts: [
      num('Ax', ($) => $.Ax, 'N', { label: 'pin, horizontal' }),
      num('Ay', ($) => $.Ay, 'N', { label: 'pin, vertical' }),
      num('By', ($) => $.By, 'N', { label: 'roller' }),
    ],
    hints: [
      'Nothing pushes horizontally, so the pin force along the beam is zero. Moments about the left end give the roller. The two vertical forces then add up to the total weight.',
    ],
    steps: ($) => [
      String.raw`$A_x = 0$, $B_y = ${texNum($.By)}\ \mathrm{N}$, $A_y = ${texNum($.Ay)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 10, M: 40, L: 4, d: 3 }, { Ax: 0, Ay: 147.15, By: 343.35 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.cable',
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Strut held by a cable',
    topics: ['equilibrium', 'torque'],
    vars: {
      m: range(2, 20, 1, 'kg'),
      L: range(1, 4, 0.5, 'm'),
      theta: range(20, 60, 5, '°'),
    },
    derive: ($) => {
      const th = $.theta * DEG;
      const body = rigidBody2D({
        about: v(0, 0, 0),
        loads: [{ at: v($.L / 2, 0, 0), F: v(0, -$.m * G, 0) }],
        unknowns: [
          { at: v(0, 0, 0), dir: v(1, 0, 0) },
          { at: v(0, 0, 0), dir: v(0, 1, 0) },
          { at: v($.L, 0, 0), dir: v(-Math.cos(th), Math.sin(th), 0) },
        ],
      });
      const [Ax, Ay, T] = body.reactions;
      return { Ax, Ay, T };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const T = ($.m * G) / (2 * Math.sin(th));
      return { T, Ax: T * Math.cos(th), Ay: ($.m * G) / 2 };
    },
    text: (T) => `A uniform strut of mass ${T.m} kg and length ${T.L} m is hinged to a wall and sticks out horizontally. A cable runs from the outer end up to the wall, at ${T.theta}° above the strut. Take g = ${G} m/s², +x along the strut away from the wall, and +y up. Find the tension, and the hinge forces.`,
    parts: [
      num('T', ($) => $.T, 'N', { label: 'tension' }),
      num('Ax', ($) => $.Ax, 'N', { label: 'hinge, horizontal' }),
      num('Ay', ($) => $.Ay, 'N', { label: 'hinge, vertical' }),
    ],
    hints: [
      String.raw`The weight acts at the center. Moments about the hinge give $T\sin\theta \cdot L = mg\cdot L/2$. The hinge's vertical force is the other half of the weight. The length cancels.`,
    ],
    steps: ($) => [
      String.raw`$T = mg/(2\sin\theta) = ${texNum($.T)}\ \mathrm{N}$`,
      String.raw`$A_x = ${texNum($.Ax)}\ \mathrm{N}$, $A_y = ${texNum($.Ay)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 8, L: 2, theta: 30 }, { T: 78.48, Ax: 67.9657, Ay: 39.24 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.hang',
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'A mass on two cables',
    topics: ['equilibrium', 'tension'],
    vars: {
      m: range(1, 20, 0.5, 'kg'),
      left: range(25, 70, 5, '°'),
      right: range(25, 70, 5, '°'),
    },
    derive: ($) => {
      const a = $.left * DEG;
      const b = $.right * DEG;
      const held = particleEq2D(
        [v(0, -$.m * G, 0)],
        [v(-Math.cos(a), Math.sin(a), 0), v(Math.cos(b), Math.sin(b), 0)],
      );
      return { TL: held.magnitudes[0], TR: held.magnitudes[1] };
    },
    second: ($) => {
      const a = $.left * DEG;
      const b = $.right * DEG;
      const det = -Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b);
      const mg = $.m * G;
      return { TL: (-mg * Math.cos(b)) / det, TR: (-mg * Math.cos(a)) / det };
    },
    text: (T) => `A ${T.m} kg mass hangs at rest from two cables. The left cable makes ${T.left}° with the horizontal, and the right cable makes ${T.right}° with the horizontal. Take g = ${G} m/s². Find both tensions.`,
    parts: [
      num('TL', ($) => $.TL, 'N', { label: 'left tension' }),
      num('TR', ($) => $.TR, 'N', { label: 'right tension' }),
    ],
    hints: [
      String.raw`The horizontal parts cancel: $T_L\cos\theta_L = T_R\cos\theta_R$. The vertical parts add up to the weight.`,
    ],
    steps: ($) => [
      String.raw`$T_L = ${texNum($.TL)}\ \mathrm{N}$, $T_R = ${texNum($.TR)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 5, left: 40, right: 50 }, { TL: 31.5287, TR: 37.5745 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.balance',
    src: 'OpenStax University Physics Vol. 1 §12.1',
    title: 'Where to put the fulcrum',
    topics: ['equilibrium', 'moment'],
    vars: {
      m1: range(5, 40, 1, 'kg'),
      m2: range(5, 60, 1, 'kg'),
      L: range(1, 4, 0.25, 'm'),
    },
    derive: ($) => {
      const N = ($.m1 + $.m2) * G;
      const M = moment2D(v(0, 0, 0), v($.L, 0, 0), v(0, -$.m2 * G, 0));
      return { x: -M / N, N };
    },
    second: ($) => ({
      x: ($.m2 * $.L) / ($.m1 + $.m2),
      N: ($.m1 + $.m2) * G,
    }),
    text: (T) => `A massless plank is ${T.L} m long. A mass of ${T.m1} kg sits on the left end and a mass of ${T.m2} kg sits on the right end. Take g = ${G} m/s². Find where to put the fulcrum, measured from the left end, and the upward force it exerts.`,
    parts: [
      num('x', ($) => $.x, 'm', { label: 'fulcrum from the left end' }),
      num('N', ($) => $.N, 'N', { label: 'fulcrum force' }),
    ],
    hints: [
      'The fulcrum carries both weights. Its moment about the left end cancels the moment of the right-hand mass. The left-hand mass sits on that end, so it has no moment there.',
    ],
    steps: ($) => [
      String.raw`$x = m_2 L/(m_1+m_2) = ${texNum($.x)}\ \mathrm{m}$`,
      String.raw`$N = (m_1+m_2)g = ${texNum($.N)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m1: 30, m2: 50, L: 2 }, { x: 1.25, N: 784.8 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch12.ladder',
    src: 'OpenStax University Physics Vol. 1 §12.2',
    title: 'Ladder against a smooth wall',
    topics: ['equilibrium', 'friction'],
    vars: {
      m: range(4, 25, 1, 'kg'),
      L: range(2, 6, 0.5, 'm'),
      theta: range(40, 70, 5, '°'),
    },
    derive: ($) => {
      const th = $.theta * DEG;
      const base = v($.L * Math.cos(th), 0, 0);
      const top = v(0, $.L * Math.sin(th), 0);
      const mid = v(base.x / 2, top.y / 2, 0);
      const body = rigidBody2D({
        about: base,
        loads: [{ at: mid, F: v(0, -$.m * G, 0) }],
        unknowns: [
          { at: base, dir: v(0, 1, 0) },
          { at: base, dir: v(-1, 0, 0) },
          { at: top, dir: v(1, 0, 0) },
        ],
      });
      const [N, f, wall] = body.reactions;
      return { N, f, wall };
    },
    second: ($) => {
      const th = $.theta * DEG;
      const wall = ($.m * G * Math.cos(th)) / (2 * Math.sin(th));
      return { N: $.m * G, f: wall, wall };
    },
    text: (T) => `A uniform ladder of mass ${T.m} kg and length ${T.L} m leans against a smooth wall at ${T.theta}° to the ground. The wall is on the left and the base is to the right. The floor is rough enough that the ladder stays put. Take g = ${G} m/s². Find the floor's normal force, the friction toward the wall, and the normal force from the wall.`,
    parts: [
      num('N', ($) => $.N, 'N', { label: 'floor normal' }),
      num('f', ($) => $.f, 'N', { label: 'friction toward the wall' }),
      num('wall', ($) => $.wall, 'N', { label: 'wall normal' }),
    ],
    hints: [
      'The floor carries the whole weight. Moments about the base set the wall force: its push times the height equals the weight times half the horizontal span. The length is in both arms, so it cancels. Friction matches the wall push.',
    ],
    steps: ($) => [
      String.raw`$N = mg = ${texNum($.N)}\ \mathrm{N}$`,
      String.raw`$f = N_{\mathrm{wall}} = mg\cot\theta / 2 = ${texNum($.wall)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('hand', { m: 10, L: 4, theta: 60 }, { N: 98.1, f: 28.319, wall: 28.319 }),
    ],
  }),
];
