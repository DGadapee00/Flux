/**
 * A cracked plate under tension: fracture toughness (EMA 3010).
 *
 * A through crack of length 2a in a wide plate under remote stress σ concentrates stress at its tips.
 * Close to a tip the opening stress goes as K/√(2πr), with the stress intensity K = σ√(πa). The
 * plate breaks when K reaches the material's toughness K_Ic, at
 *   σ_c = K_Ic/√(πa),   or for a given stress, a_c = (1/π)(K_Ic/σ)².
 * A crack can break a part at a stress well below yield: a safety factor on strength alone does not
 * protect it. Irwin's estimate of the plastic zone at the tip is r_p = (1/2π)(K/σ_y)².
 *
 * The second method takes the exact elastic stress on the crack line (Westergaard),
 * σ_yy = σx/√(x² − a²), and extrapolates √(2πr) σ_yy to the tip, r → 0, by Richardson's method.
 */

/** Typical room-temperature values: K_Ic (MPa·m^½) and σ_y (MPa). */
export const ALLOYS = {
  steel: { name: '4340 steel, high strength', KIc: 50, sy: 1470 },
  aluminium: { name: '7075-T651 aluminium', KIc: 24, sy: 495 },
  titanium: { name: 'Ti-6Al-4V titanium', KIc: 55, sy: 910 },
};

export const westergaard = (sigma, a, r) => (sigma * (a + r)) / Math.sqrt((a + r) ** 2 - a * a);

export function crackClosed({ alloy, amm, sigma }) {
  const m = ALLOYS[alloy];
  const a = amm / 1000;
  const K = sigma * Math.sqrt(Math.PI * a);
  const ac = (m.KIc / sigma) ** 2 / Math.PI;
  const sc = m.KIc / Math.sqrt(Math.PI * a);
  return { a, K, ac, sc, rp: (K / m.sy) ** 2 / (2 * Math.PI), breaks: K >= m.KIc, yields: sigma >= m.sy, KIc: m.KIc, sy: m.sy, safety: m.sy / sigma };
}

export function kNumeric({ amm, sigma }) {
  const a = amm / 1000;
  const f = (r) => Math.sqrt(2 * Math.PI * r) * westergaard(sigma, a, r);
  // Richardson table in r = r₀/2^k: the error is a series in r.
  const r0 = a * 1e-2;
  const R = [];
  for (let k = 0; k < 7; k++) {
    R.push([f(r0 / 2 ** k)]);
    for (let j = 1; j <= k; j++) R[k].push((2 ** j * R[k][j - 1] - R[k - 1][j - 1]) / (2 ** j - 1));
  }
  return R[6][6];
}

export function crackChecked(state) {
  const cf = crackClosed(state);
  const Kn = kNumeric(state);
  return { ...cf, Knum: Kn, gap: Math.abs(Kn - cf.K) / cf.K };
}
