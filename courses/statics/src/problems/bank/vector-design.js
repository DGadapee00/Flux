import { problem, range, choice, num, sym, kase } from '../kit.js';
/** Answer first: select a cable tension, then back-solve the known horizontal force. */
export default problem({
  id: 'r4.cable-design',
  exam: 'u1',
  ch: '2',
  lab: 'vectors',
  title: 'Design a cable force for a specified resultant',
  kind: 'numeric',
  level: 3,
  topics: ['resultant', 'unit-vector'],
  variety: ['configuration'],
  vars: {
    design: range(100, 500, 50, 'N'),
    Q: range(-200, 200, 50, 'N'),
    Fy: range(-200, 200, 50, 'N'),
    side: choice(['right', 'right-hand anchor'], ['left', 'left-hand anchor']),
  },
  derive: (s) => {
    const dx = s.side === 'right' ? 3 : -3,
      dy = 4,
      L = 5,
      Fx = s.Q - (s.design * dx) / L;
    return { dx, dy, L, Fx, T: s.design, Ry: s.Fy + (s.design * dy) / L };
  },
  text: (T, s) =>
    `A cable from O to (${s.dx},4) m pulls at O. Another force K = (${s.Fx},${s.Fy}) N acts at O. Choose the cable tension so the resultant x component is ${s.Q} N. Give a formula for the cable tension using Q, Fx, L and dx, then find the tension and resultant y component.`,
  parts: [
    sym('Tsym', '(Q-Fx)*L/dx', { Q: 'N', Fx: 'N', L: 'm', dx: 'm' }, (s) => s.T, {
      unit: 'N',
      label: 'T as an expression',
    }),
    num('T', (s) => s.T, 'N', { label: 'cable tension' }),
    num('Ry', (s) => s.Ry, 'N', { label: 'resultant y component' }),
  ],
  hints: [
    'Only the cable’s x component can combine with the known Fx to reach the specified Q.',
    'Normalise the cable direction. Write Q = Fx + T dx/L, isolate T, then check the vertical component separately.',
  ],
  steps: (s) => [
    `The cable unit direction is (${s.dx / 5},0.8).`,
    `Horizontal balance: T = (${s.Q} − ${s.Fx})/(${s.dx / 5}) = ${s.T} N.`,
    `The y component of the resultant is ${s.Fy} + 0.8(${s.T}) = ${s.Ry} N.`,
  ],
  sim: {
    scenario: 'two',
    setup: (s, $) =>
      Object.assign(s, { unit: 'N', F1: [($.T * $.dx) / 5, $.T * 0.8, 0], F2: [$.Fx, $.Fy, 0], F3: null }),
    read: (c, s, $) => ({
      T: Math.hypot(c.vec.F1.x, c.vec.F1.y),
      Ry: c.vec.R.y,
      '@specified resultant Rx': [c.vec.R.x, $.Q],
    }),
  },
  cases: [
    kase(
      'Flux original designed example; Hibbeler Ch 2, Cartesian force vectors',
      { design: 250, Q: 100, Fy: -100, side: 'right' },
      { T: 250, Ry: 100 },
    ),
  ],
});
