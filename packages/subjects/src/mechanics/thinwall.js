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
