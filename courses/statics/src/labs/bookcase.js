/** Shows that raising friction can make a tall bookcase tip instead of making it safe. */
import { bookcase } from '@flux/subjects/mechanics/static-devices.js';
import { device, seg, arrow, note, poly, C, prediction } from './device-kit.js';
export default device({
  id: 'bookcase',
  exam: 'u4',
  title: 'Bookcase',
  hint: 'Check tipping before assuming friction will hold it',
  fields: [
    ['W', 'Assumed total weight (N)', 100, 1000, 10],
    ['hp', 'Push height (m)', 0.2, 2, 0.05],
    ['mu', 'Assumed static coefficient', 0.03, 0.7, 0.01],
  ],
  scenarios: [
    { id: 'high', name: 'BILLY side view, high push', W: 400, b: 0.28, hp: 1.5, mu: 0.3 },
    { id: 'low', name: 'Low push, same bookcase', W: 400, b: 0.28, hp: 0.3, mu: 0.3 },
    { id: 'smooth', name: 'Low assumed floor friction', W: 400, b: 0.28, hp: 1.5, mu: 0.05 },
  ],
  compute: bookcase,
  law: [String.raw`P_{tip}=\frac{Wb}{2h_p}`, String.raw`P_{slip}=\mu_s W`],
  rows: (s, c) => [
    ['tipping threshold', c.tip, 'N'],
    ['sliding threshold', c.slip, 'N'],
    ['first failure force', c.P, 'N'],
  ],
  explanation:
    'The drawing is a side view, using the 28 cm depth as the tipping base. As the push rises, the ground reaction moves toward the front edge. Tipping starts when its moment arm reaches b/2. Sliding starts when horizontal force reaches μW. The smaller threshold occurs first. Always follow the manufacturer’s wall-anchoring instructions.',
  leavesOut:
    'Wall restraint, uneven contents, flexible panels, children climbing, impacts and uncertain floor friction are excluded. This unanchored model explains a hazard; it does not assess an installed bookcase.',
  bounds: () => ({ x0: -0.6, x1: 0.65, y0: -0.15, y1: 2.25 }),
  draw(P, s, c) {
    poly(
      P,
      [
        [0, 0],
        [s.b, 0],
        [s.b, 2.02],
        [0, 2.02],
      ],
      { stroke: C.teal, width: 3 },
    );
    for (const y of [0.4, 0.8, 1.2, 1.6]) seg(P, [0, y], [s.b, y]);
    seg(P, [-0.5, 0], [0.6, 0], { width: 4 });
    arrow(P, [-0.35, s.hp], 0, 0.34);
    arrow(P, [s.b / 2, 1.01], -Math.PI / 2, 0.4);
    note(P, 'push', -0.35, s.hp);
    note(P, 'W', s.b / 2, 0.65);
    note(P, c.tips ? 'tips first' : 'slides first', 0, 2.1, { color: C.text });
  },
  predictions: [
    prediction(
      'friction',
      'smooth',
      'Increase friction from 0.05 to 0.30. What happens to the tipping threshold?',
      (s) => (s.mu = 0.3),
      (c) => c.tip,
      'same',
      'Friction changes the sliding limit. The moment balance for tipping is unchanged.',
    ),
    prediction(
      'height',
      'high',
      'Apply the push halfway as high. What happens to the force needed to tip?',
      (s) => (s.hp /= 2),
      (c) => c.tip,
      'bigger',
      'The applied moment per newton halves. The weight’s restoring moment is unchanged.',
    ),
  ],
});
