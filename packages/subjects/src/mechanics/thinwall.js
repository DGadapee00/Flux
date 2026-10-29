/**
 * Shear flow around thin-walled open sections, and the shear centre of a channel. The wall is
 * idealised as its centreline: flanges at ±h/2, the web at the origin. Pure, SI.
 * thinwall-selftest.js checks each result by integrating the flow.
 */

/**
 * A symmetric I (or wide flange) in thin-wall form: flanges of width bf and thickness tf whose
 * centrelines are h apart, a web of thickness tw. q in a flange grows from zero at the tip:
 * q(s) = V (tf s)(h/2)/I, reaching V (tf bf/2)(h/2)/I where it meets the web. Two halves feed the
 * web, so the web starts with twice that.
 */
export function iFlow(V, bf, tf, tw, h) {
  const I = (tw * h ** 3) / 12 + 2 * bf * tf * (h / 2) ** 2;
  const qTip = (s) => (V * tf * s * (h / 2)) / I;
  const qJoin = qTip(bf / 2);
  const qWebMid = 2 * qJoin + (V * tw * (h / 2) ** 2) / (2 * I);
  return { I, qTip, qJoin, tauFlange: qJoin / tf, qWebTop: 2 * qJoin, qWebMid, tauWebMid: qWebMid / tw };
}

/**
 * A channel: two flanges of width b (from the web centreline to the tip) and thickness tf, a web of
 * height h between flange centrelines and thickness tw. Each flange carries a horizontal force
 * F = ∫ q ds = V tf b² h/(4I). The two flange forces form a couple F h. The web carries V. For the
 * section to bend without twisting, V must act where V e = F h, a distance e behind the web:
 * e = 3 b² tf/(h tw + 6 b tf).
 */
export function channel(V, b, h, tf, tw) {
  const I = (tw * h ** 3) / 12 + 2 * b * tf * (h / 2) ** 2;
  const F = (V * tf * b * b * h) / (4 * I);
  const e = (3 * b * b * tf) / (h * tw + 6 * b * tf);
  const qJoin = (V * tf * b * (h / 2)) / I;
  const Qmid = b * tf * (h / 2) + (tw * (h / 2) ** 2) / 2;
  return { I, F, e, qJoin, tauFlange: qJoin / tf, tauWebMid: (V * Qmid) / (I * tw), twist: V * e };
}

/**
 * A lipped channel, uniform wall t: web of height h, flanges of width b, and lips of length d
 * turned in toward the axis from the flange tips (strut channel). With Q built up from a lip's
 * free end, the lip's flow force is (Vt/I)(h d²/4 − d³/3) and the flange's
 * (Vt/I)(d(h − d)b/2 + h b²/4). Their moments about the web, 2 F_lip b + F_flange h, set
 * V e, so e = (t b/I)(h² b/4 + h² d/2 − 2d³/3) behind the web. Lips push the shear centre out.
 */
export function lippedChannel(V, b, h, d, t) {
  const I = (t * h ** 3) / 12 + 2 * b * t * (h / 2) ** 2 + 2 * ((t * d ** 3) / 12 + t * d * (h / 2 - d / 2) ** 2);
  const Fl = ((V * t) / I) * ((h * d * d) / 4 - (d ** 3) / 3);
  const Ff = ((V * t) / I) * ((d * (h - d) * b) / 2 + (h * b * b) / 4);
  const e = ((t * b) / I) * ((h * h * b) / 4 + (h * h * d) / 2 - (2 * d ** 3) / 3);
  return { I, Fl, Ff, e, J: ((h + 2 * b + 2 * d) * t ** 3) / 3 };
}

/**
 * Any open thin wall drawn as a polyline `pts` of [x, y] centreline points, free end to free end,
 * uniform thickness t, symmetric about a horizontal axis (so I_xy = 0). A vertical shear V makes
 * the flow q(s) = −(V/I) ∫ t (y − ȳ) ds from the free end. Its resultant is V; its moment about the
 * origin fixes where V must act to cause no twist: x_s = M_o/F_y. Midpoint rule on `n` steps per
 * segment. Also returns St. Venant's J = Σ L t³/3 for the open wall.
 */
export function openShearCentre(pts, t, V = 1, n = 2000) {
  const segs = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    segs.push({ x0, y0, dx: x1 - x0, dy: y1 - y0, L: Math.hypot(x1 - x0, y1 - y0) });
  }
  const Ltot = segs.reduce((s, g) => s + g.L, 0);
  const ybar = segs.reduce((s, g) => s + g.L * (g.y0 + g.dy / 2), 0) / Ltot;
  // ∫ t (y − ȳ)² ds, exact for straight segments.
  const I = segs.reduce((s, g) => {
    const a = g.y0 - ybar;
    return s + t * g.L * (a * a + a * g.dy + (g.dy * g.dy) / 3);
  }, 0);
  let Q = 0;
  let Fx = 0;
  let Fy = 0;
  let Mo = 0;
  const flow = [];
  for (const g of segs) {
    const ds = g.L / n;
    const ux = g.dx / g.L;
    const uy = g.dy / g.L;
    for (let k = 0; k < n; k++) {
      const s0 = k * ds;
      const ya = g.y0 + uy * s0 - ybar;
      // Q at the step's midpoint, then advance Q across the whole step.
      const Qmid = Q + t * (ya * (ds / 2) + (uy * (ds / 2) ** 2) / 2);
      const q = (-V * Qmid) / I;
      const x = g.x0 + ux * (s0 + ds / 2);
      const y = g.y0 + uy * (s0 + ds / 2);
      Fx += q * ux * ds;
      Fy += q * uy * ds;
      Mo += q * (x * uy - y * ux) * ds;
      Q += t * (ya * ds + (uy * ds * ds) / 2);
      if (k % Math.max(1, Math.floor(n / 20)) === 0) flow.push({ x, y, q, ux, uy });
    }
  }
  return { I, ybar, Fx, Fy, Mo, xs: Mo / Fy, J: (Ltot * t ** 3) / 3, flow, Qend: Q };
}
