/**
 * A plane-stress element for the member drawings: a small square at a model point, with σx on its
 * x faces and σy on its y faces (gold, out of the face for tension) and τxy along every face (teal),
 * each arrow's length in proportion to `scale`, the stress that draws a full-length arrow.
 */
import { C, alpha, arrow, label, pinSupport, poly, rollerSupport, seg, wall } from './diagram.js';

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

/**
 * A cross-section built of rectangles [x0, x1, y0, y1] in model units, y up. `na` draws the
 * neutral axis dashed; `above` shades every part of the section above that height, the area
 * whose first moment is Q.
 */
export function sectionSketch(S, rects, { na = null, above = null, fill = alpha(C.text, 0.12) } = {}) {
  for (const [x0, x1, y0, y1] of rects) poly(S, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { fill, stroke: C.text, width: 1.5 });
  if (above != null) {
    for (const [x0, x1, y0, y1] of rects) {
      const lo = Math.max(y0, above);
      if (y1 > lo) poly(S, [[x0, lo], [x1, lo], [x1, y1], [x0, y1]], { fill: alpha(C.teal, 0.35), stroke: null });
    }
  }
  if (na != null) {
    const xs = rects.flatMap(([x0, x1]) => [x0, x1]);
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    const pad = 0.15 * (hi - lo);
    seg(S, [lo - pad, na], [hi + pad, na], { color: C.gold, width: 1.5, dash: [5, 4] });
    label(S, 'N.A.', [hi + pad, na], { color: C.gold, dx: 4, align: 'left' });
  }
}

/**
 * A beam from 0 to L drawn along y = yAt(x) (model units, already exaggerated), on its supports:
 * each support is ['pin' | 'roller' | 'fixed', x]. Point loads are drawn down at their x, and a
 * uniform load [a, b] as a row of arrows. `ghost` draws the unloaded beam dashed.
 */
export function beamSketch(S, L, { yAt = () => 0, supports = [], points = [], udl = null, ghost = true, width = 5 } = {}) {
  const xs = Array.from({ length: 61 }, (_, i) => (L * i) / 60);
  if (ghost) seg(S, [0, 0], [L, 0], { color: alpha(C.text, 0.3), width: 1.5, dash: [4, 4] });
  for (let i = 1; i < xs.length; i++) seg(S, [xs[i - 1], yAt(xs[i - 1])], [xs[i], yAt(xs[i])], { color: C.text, width });
  for (const [kind, x] of supports) {
    if (kind === 'fixed') wall(S, x, yAt(x) - 0.06 * L, yAt(x) + 0.06 * L, { side: x < L / 2 ? -1 : 1 });
    else if (kind === 'pin') pinSupport(S, [x, yAt(x)], { size: 10 });
    else rollerSupport(S, [x, yAt(x)], { size: 10 });
  }
  for (const x of points) arrow(S, [x, yAt(x)], -Math.PI / 2, 30, { color: C.pink, tail: true });
  if (udl) {
    const [a, b] = udl;
    const n = Math.max(4, Math.round(((b - a) / L) * 14));
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      arrow(S, [x, yAt(x)], -Math.PI / 2, 18, { color: C.pink, width: 1.5, head: 6, tail: true });
    }
  }
}
