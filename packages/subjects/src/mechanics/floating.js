/**
 * The stability of a floating box (EML 3015, buoyancy and stability).
 *
 * A box barge of width b and length 6 m with mass 12 t floats at draft d = m/(ρbL). Tilted a little,
 * its centre of buoyancy B swings toward the low side; the line of buoyancy crosses the centre line at
 * the metacentre M, a height
 *   BM = I_wp/V_sub = b²/(12d)
 * above B. It rights itself if M is above the centre of gravity G:
 *   GM = KB + BM − KG > 0,   KB = d/2.
 * G may sit above B, as in every ship, so long as M is higher still.
 *
 * The second method tilts the cross-section through a small angle, finds the submerged polygon that
 * keeps the same area by bisection on the waterline, and reads GM from the righting arm, GZ/sin φ,
 * extrapolated to φ → 0. The same polygon gives the righting arm at large angles.
 */

export const BARGE = { L: 6, m: 12000, rho: 1000, H: 2.5 };

export function floatClosed({ b, KG }) {
  const { L, m, rho } = BARGE;
  const d = m / (rho * b * L);
  const BM = (b * b) / (12 * d);
  const KB = d / 2;
  const GM = KB + BM - KG;
  return { d, BM, KB, KM: KB + BM, GM, stable: GM > 0 };
}

/** Area and centroid of a polygon [[x, y], …]. */
function centroid(poly) {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cr = x0 * y1 - x1 * y0;
    A += cr;
    cx += (x0 + x1) * cr;
    cy += (y0 + y1) * cr;
  }
  A /= 2;
  return { A, x: cx / (6 * A), y: cy / (6 * A) };
}

/** Part of a polygon below the line y = c (Sutherland–Hodgman against one edge). */
function below(poly, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i];
    const Q = poly[(i + 1) % poly.length];
    const pin = P[1] <= c;
    const qin = Q[1] <= c;
    if (pin) out.push(P);
    if (pin !== qin) {
      const t = (c - P[1]) / (Q[1] - P[1]);
      out.push([P[0] + t * (Q[0] - P[0]), c]);
    }
  }
  return out;
}

/** The box's section rotated by φ about the keel's centre, keel centre at the origin before rotation. */
export function section({ b }, phi) {
  const H = BARGE.H;
  const pts = [[-b / 2, 0], [b / 2, 0], [b / 2, H], [-b / 2, H]];
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

/** Righting arm GZ (m) at heel φ: the horizontal distance from G to the new centre of buoyancy. */
export function rightingArm(state, phi) {
  const { d } = floatClosed(state);
  const A0 = state.b * d;
  const sec = section(state, phi);
  let lo = Math.min(...sec.map((p) => p[1]));
  let hi = Math.max(...sec.map((p) => p[1]));
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    const a = below(sec, m);
    if (a.length < 3 || centroid(a).A < A0) lo = m;
    else hi = m;
  }
  const wl = (lo + hi) / 2;
  const sub = below(sec, wl);
  const Bc = centroid(sub);
  const Gx = -state.KG * Math.sin(phi);
  // Heeled by φ > 0 the low side is −x; B moving further that way than G rights the box.
  return { GZ: Gx - Bc.x, B: [Bc.x, Bc.y], G: [Gx, state.KG * Math.cos(phi)], wl, sub, sec };
}

export function floatChecked(state) {
  const cf = floatClosed(state);
  // Richardson on GZ/sin φ at φ and φ/2: the error goes as φ².
  const f = (phi) => rightingArm(state, phi).GZ / Math.sin(phi);
  const phi = 0.004;
  const GMnum = (4 * f(phi / 2) - f(phi)) / 3;
  return { ...cf, GMnum, gap: Math.abs(GMnum - cf.GM) / Math.max(0.05, Math.abs(cf.KM)) };
}
