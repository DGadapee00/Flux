/**
 * A plane-stress element for the member drawings: a small square at a model point, with σx on its
 * x faces and σy on its y faces (gold, out of the face for tension) and τxy along every face (teal),
 * each arrow's length in proportion to `scale`, the stress that draws a full-length arrow.
 */
import { C, alpha, arrow, label, poly } from './diagram.js';

export function stressElement(S, at, { half = 0.3, sx = 0, sy = 0, txy = 0, scale = 1, full = 30, names = true } = {}) {
  const [x, y] = at;
  poly(S, [[x - half, y - half], [x + half, y - half], [x + half, y + half], [x - half, y + half]],
    { fill: alpha(C.text, 0.12), stroke: C.text, width: 1.5 });
  const len = (v) => (Math.abs(v) / Math.max(scale, 1e-12)) * full;
  const g = half * 0.25;
  const normal = (v, face, ang) => {
    if (len(v) < 3) return;
    const out = [face[0] + g * Math.cos(ang), face[1] + g * Math.sin(ang)];
    if (v > 0) arrow(S, out, ang, len(v), { color: C.gold, width: 2.2, head: 7 });
    else arrow(S, out, ang + Math.PI, len(v), { color: C.gold, width: 2.2, head: 7, tail: true });
  };
  normal(sx, [x + half, y], 0);
  normal(sx, [x - half, y], Math.PI);
  normal(sy, [x, y + half], Math.PI / 2);
  normal(sy, [x, y - half], -Math.PI / 2);
  if (len(txy) >= 3) {
    // Positive τxy: up on the +x face, down on the −x face, right on the +y face, left on the −y face.
    const s = Math.sign(txy);
    const l = Math.min(len(txy), 2 * half * S.k * 0.9);
    const off = l / 2 / S.k;
    arrow(S, [x + half + g, y - s * off], s * Math.PI / 2, l, { color: C.teal, width: 2, head: 6 });
    arrow(S, [x - half - g, y + s * off], -s * Math.PI / 2, l, { color: C.teal, width: 2, head: 6 });
    arrow(S, [x - s * off, y + half + g], s > 0 ? 0 : Math.PI, l, { color: C.teal, width: 2, head: 6 });
    arrow(S, [x + s * off, y - half - g], s > 0 ? Math.PI : 0, l, { color: C.teal, width: 2, head: 6 });
  }
  if (names) {
    if (len(sx) >= 3) label(S, 'σx', [x + half, y], { color: C.gold, dx: len(sx) + 14, dy: -8 });
    if (len(sy) >= 3) label(S, 'σy', [x, y + half], { color: C.gold, dx: 12, dy: -len(sy) - 6 });
    if (len(txy) >= 3) label(S, 'τ', [x + half, y + half], { color: C.teal, dx: 10, dy: -6 });
  }
}
