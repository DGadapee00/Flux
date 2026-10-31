/** Shows that a shallow sign-support truss has large chord forces despite modest reactions. */
import { toSI } from '@flux/subjects/convert.js';
import { gantry } from '@flux/subjects/mechanics/static-devices.js';
import { device, seg, arrow, note, C, prediction } from './device-kit.js';
export default device({
  id: 'gantry',
  exam: 'u3',
  title: 'Sign gantry',
  hint: 'Depth reduces chord forces without changing support reactions',
  fields: [
    ['pressure', 'Assumed transverse pressure (Pa)', 100, 1200, 25],
    ['L', 'Support span (m)', 2, 8, 0.1],
    ['h', 'Truss depth (m)', 0.25, 2, 0.05],
  ],
  scenarios: [
    { id: 'standard', name: '30 in sign, 600 Pa teaching pressure', pressure: 600, L: 4, h: 1 },
    { id: 'shallow', name: 'Same sign, shallow support', pressure: 600, L: 4, h: 0.5 },
    { id: 'gust', name: 'Assumed higher pressure', pressure: 900, L: 4, h: 1 },
  ],
  compute: (s) => {
    const area = toSI(30, 'in') ** 2,
      W = s.pressure * area;
    return { ...gantry({ ...s, W }), W, area };
  },
  law: [String.raw`W=pA,\quad C=\frac{W\sqrt{(L/2)^2+h^2}}{2h}`, String.raw`F_{chord}=\frac{WL}{4h}`],
  rows: (s, c) => [
    ['diagonal compression', c.C, 'N'],
    ['chord tension', c.chord, 'N'],
    ['each support', c.R, 'N'],
  ],
  explanation:
    'This is a plan view of one triangular sign-support panel. Wind load from one standard-size sign enters at the apex through a rigid spreader. Each diagonal is in compression and the straight chord is in tension. Whole-panel reactions depend on total wind force, while internal forces also depend on depth.',
  leavesOut:
    'Real gantries have many panels, connections, torsion, fatigue, foundation moments and code-specific wind loading. The drawing models one ideal pin-connected panel, not an approved gantry.',
  bounds: (s) => ({ x0: -0.5, x1: s.L + 0.5, y0: -0.8, y1: s.h + 1 }),
  draw(P, s) {
    seg(P, [0, 0], [s.L, 0], { color: C.teal, width: 4 });
    seg(P, [0, 0], [s.L / 2, s.h], { width: 5 });
    seg(P, [s.L, 0], [s.L / 2, s.h], { width: 5 });
    seg(P, [s.L / 2 - 0.3, s.h + 0.15], [s.L / 2 + 0.3, s.h + 0.15], { width: 8 });
    arrow(P, [s.L / 2, s.h + 0.7], -Math.PI / 2, 0.6);
    note(P, 'sign wind (N)', s.L / 2, s.h + 0.7);
    note(P, 'A pin', 0, 0);
    note(P, 'B roller', s.L, 0, { align: 'right' });
    note(P, `span ${s.L} m`, s.L / 2, -0.4);
  },
  predictions: [
    prediction(
      'depth',
      'standard',
      'Halve the panel depth at fixed wind force. What happens to the chord force?',
      (s) => (s.h /= 2),
      (c) => c.chord,
      'bigger',
      'A section moment requires chord force times depth to stay constant.',
    ),
    prediction(
      'reaction',
      'standard',
      'Double the depth. What happens to each support reaction?',
      (s) => (s.h *= 2),
      (c) => c.R,
      'same',
      'The total force and symmetry stay the same. The force paths inside the panel change.',
    ),
  ],
});
