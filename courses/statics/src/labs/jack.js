/** Shows that a scissor jack needs its greatest screw force near the collapsed position. */
import { scissorJack } from '@flux/subjects/mechanics/static-devices.js';
import { toSI } from '@flux/subjects/convert.js';
import { device, seg, arrow, note, C, prediction } from './device-kit.js';
const rated = toSI(3000, 'lbf');
export default device({
  id: 'jack',
  exam: 'u3',
  title: 'Scissor jack',
  hint: 'The screw works hardest when the jack is low',
  fields: [
    ['W', 'Supported weight (N)', 500, 14000, 0.000001],
    ['H', 'Pivot-to-pivot height (m)', 0.08, 0.45, 0.01],
  ],
  scenarios: [
    { id: 'low', name: 'Nominal 1.5 US ton load, low geometry', W: rated, H: 0.1, a: 0.25 },
    { id: 'raised', name: 'Same nominal load, raised geometry', W: rated, H: 0.3, a: 0.25 },
    { id: 'light', name: 'Assumed 4000 N wheel load', W: 4000, H: 0.2, a: 0.25 },
  ],
  compute: scissorJack,
  law: [String.raw`x^2+H^2=4a^2`, String.raw`C=\frac{Wa}{H},\quad Q=\frac{Wx}{H}`],
  rows: (s, c) => [
    ['screw tension Q', c.Q, 'N'],
    ['arm compression C', c.C, 'N'],
    ['screw span x', c.x, 'm'],
  ],
  explanation:
    'Isolate the upper joint: two arm components support W. Isolate a side joint: two horizontal arm components pull against the screw. The screw shortens while the jack rises. Virtual work gives the same force ratio from the slope of the height-versus-span curve.',
  leavesOut:
    'Screw pitch, thread friction, hand torque, pin bending, buckling and vehicle stability are excluded. The nominal capacity does not certify this assumed geometry.',
  bounds: () => ({ x0: -0.35, x1: 0.35, y0: -0.1, y1: 0.6 }),
  draw(P, s, c) {
    const top = [0, s.H],
      bottom = [0, 0],
      left = [-c.x / 2, s.H / 2],
      right = [c.x / 2, s.H / 2];
    for (const [a, b] of [
      [top, left],
      [top, right],
      [bottom, left],
      [bottom, right],
    ])
      seg(P, a, b, { width: 6 });
    seg(P, left, right, { color: C.teal, width: 3 });
    arrow(P, [0, s.H + 0.1], -Math.PI / 2, 0.09);
    note(P, 'car load (N)', 0, s.H + 0.12);
    note(P, 'screw', 0, s.H / 2);
    note(P, `H = ${s.H} m`, 0, 0);
  },
  predictions: [
    prediction(
      'raise',
      'low',
      'Raise the jack from 0.10 m to 0.20 m at fixed load. Does screw tension grow, shrink or stay the same?',
      (s) => (s.H = 0.2),
      (c) => c.Q,
      'smaller',
      'The arms become steeper, so the horizontal force needed to hold the load falls.',
    ),
    prediction(
      'arm',
      'raised',
      'Lower the jack from 0.30 m to 0.15 m. What happens to compression in each arm?',
      (s) => (s.H = 0.15),
      (c) => c.C,
      'bigger',
      'Each arm needs twice the compression when its vertical direction cosine halves.',
    ),
  ],
});
