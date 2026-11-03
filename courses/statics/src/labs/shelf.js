/** Shows that wall-anchor force depends on load distance and attachment spacing, not weight alone. */
import { shelf } from '@flux/subjects/mechanics/static-devices.js';
import { device, seg, arrow, note, prediction } from './device-kit.js';
export default device({
  id: 'shelf',
  exam: 'u2',
  title: 'Wall shelf',
  hint: 'A short anchor spacing magnifies the wall force',
  fields: [
    ['W', 'Shelf payload weight (N)', 10, 200, 0.1],
    ['x', 'Load distance from wall (m)', 0.05, 0.2, 0.01],
    ['h', 'Anchor spacing (m)', 0.03, 0.3, 0.01],
  ],
  scenarios: [
    { id: 'edge', name: 'BERGSHULT, 10 kg at front edge', W: 98.1, x: 0.2, h: 0.1 },
    { id: 'centre', name: 'Same payload at mid-depth', W: 98.1, x: 0.1, h: 0.1 },
    { id: 'short', name: 'Short attachment spacing', W: 98.1, x: 0.2, h: 0.05 },
  ],
  compute: shelf,
  law: [String.raw`Hh=Wx`, String.raw`R=\sqrt{H^2+W^2}`],
  rows: (s, c) => [
    ['upper anchor pull', c.H, 'N'],
    ['lower pin resultant', c.R, 'N'],
    ['load moment', c.M, 'N·m'],
  ],
  explanation:
    'The upper wall tie pulls horizontally. The lower pin carries the opposite horizontal force and the whole vertical load. Taking moments about the lower pin gives Hh = Wx. The wall sees a force couple as well as the vertical weight.',
  leavesOut:
    'The ideal bracket is rigid. Fastener pull-out, wall material, bracket bending, shelf self-weight and load sharing along the 80 cm shelf are excluded.',
  bounds: () => ({ x0: -0.12, x1: 0.32, y0: -0.15, y1: 0.35 }),
  draw(P, s) {
    seg(P, [0, -0.08], [0, 0.31], { width: 6 });
    seg(P, [0, s.h], [0, 0], { width: 4 });
    seg(P, [0, 0], [0.2, 0], { width: 6 });
    seg(P, [0, s.h], [0.2, 0], { width: 3 });
    arrow(P, [s.x, 0], -Math.PI / 2, 0.08);
    arrow(P, [0, s.h], Math.PI, 0.07);
    note(P, 'load (N)', s.x, -0.08);
    note(P, `h = ${s.h} m`, 0, s.h);
    note(P, 'wall', 0, 0.31);
  },
  predictions: [
    prediction(
      'spacing',
      'edge',
      'Double the vertical anchor spacing. Does the upper anchor pull double, halve or stay the same?',
      (s) => (s.h *= 2),
      (c) => c.H,
      'smaller',
      'The same moment needs less force when its lever arm is longer.',
    ),
    prediction(
      'move',
      'edge',
      'Move the payload halfway back toward the wall. What happens to the vertical force at the lower pin?',
      (s) => (s.x /= 2),
      (c, s) => s.W,
      'same',
      'Vertical equilibrium still requires the entire weight. Only the horizontal force couple changes.',
    ),
  ],
});
