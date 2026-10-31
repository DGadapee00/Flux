/** Shows that spreading a lifting bridle increases each sling tension, even at fixed weight. */
import { bridle } from '@flux/subjects/mechanics/static-devices.js';
import { device, seg, arrow, note, C, prediction } from './device-kit.js';
export default device({
  id: 'bridle',
  exam: 'u1',
  title: 'Lifting bridle',
  hint: 'Shallow slings carry more than half the load',
  fields: [
    ['W', 'Pallet + payload weight (N)', 50, 3000, 0.01],
    ['theta', 'Sling angle above horizontal (°)', 10, 80, 1],
  ],
  scenarios: [
    { id: 'empty', name: 'EPAL pallet, approximately 25 kg', W: 245.25, theta: 30 },
    { id: 'loaded', name: 'Pallet + assumed payload, 1000 N', W: 1000, theta: 60 },
    { id: 'shallow', name: 'Same payload, shallow legs', W: 1000, theta: 15 },
  ],
  compute: bridle,
  law: [String.raw`2T\sin\theta=W`, String.raw`H=T\cos\theta`],
  rows: (s, c) => [
    ['each sling T', c.T, 'N'],
    ['horizontal component H', c.H, 'N'],
    ['force residual', c.gap, 'N'],
  ],
  explanation:
    'Resolve each sling into horizontal and vertical components. Horizontal components cancel. Each vertical component must carry half the weight. Thus T = W/(2 sin θ). The horizontal pull remains inside the bridle.',
  leavesOut:
    'Sling mass, load eccentricity, dynamic lifting, rope bending, attachment strength and angle-dependent working-load limits require separate checks.',
  bounds: () => ({ x0: -2, x1: 2, y0: -1, y1: 2.5 }),
  draw(P, s) {
    const h = 1.6 * Math.tan((s.theta * Math.PI) / 180);
    const k = Math.min(1, 2 / h);
    const y = h * k,
      x = 1.6 * k;
    seg(P, [-x, 0], [0, y], { color: C.teal, width: 4 });
    seg(P, [x, 0], [0, y], { color: C.teal, width: 4 });
    seg(P, [-x, 0], [x, 0], { width: 7 });
    arrow(P, [0, 0], -Math.PI / 2, 0.7);
    note(P, 'W (N)', 0, -0.65);
    note(P, 'pallet', -x, 0);
    note(P, `θ = ${s.theta}°`, x * 0.5, y * 0.5);
    note(P, 'hook', 0, y);
  },
  predictions: [
    prediction(
      'shallow',
      'loaded',
      'Lower the sling angle from 60° to 30°. Does tension in each leg grow, shrink or stay the same?',
      (s) => (s.theta = 30),
      (c) => c.T,
      'bigger',
      'Only the vertical component supports weight. A shallower sling needs more tension.',
    ),
    prediction(
      'spread',
      'empty',
      'Raise the sling angle from 30° to 60° at fixed load. What happens to horizontal force on each lifting point?',
      (s) => (s.theta = 60),
      (c) => c.H,
      'smaller',
      'The vertical component stays W/2. The horizontal component falls as cot θ.',
    ),
  ],
});
