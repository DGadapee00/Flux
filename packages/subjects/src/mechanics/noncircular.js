/**
 * Torsion beyond the solid round shaft: thin-walled closed tubes (Bredt), thin open sections, and
 * solid rectangles. Pure, SI. noncircular-selftest.js checks each result a second way.
 */

/**
 * Bredt. In a thin closed wall the shear flow q = τt is the same all the way round: a small block of
 * wall balances lengthwise only if q in equals q out. The flow's moment about any point is q times
 * twice the area the wall's centreline encloses, so T = 2 A_m q. The twist rate follows from the
 * energy: T dφ/dx = ∮ q²/(G t) ds, so dφ/dx = T ∮ ds/t /(4 A_m² G).
 * `walls` is a list of { len, t } around the centreline.
 */
export function bredt(T, Am, walls, G) {
  const q = T / (2 * Am);
  const tMin = Math.min(...walls.map((w) => w.t));
  const loop = walls.reduce((s, w) => s + w.len / w.t, 0);
  const rate = (T * loop) / (4 * Am * Am * G);
  return { q, tauMax: q / tMin, rate, J: (4 * Am * Am) / loop };
}

/**
 * A thin open section, a strip or a slit tube: J = Σ b t³/3. The largest stress is at the thickest
 * wall's face, τ = T t_max/J.
 */
export function openThin(T, walls, G) {
  const J = walls.reduce((s, w) => s + (w.len * w.t ** 3) / 3, 0);
  const tMax = Math.max(...walls.map((w) => w.t));
  return { J, tauMax: (T * tMax) / J, rate: T / (G * J) };
}

/**
 * A solid b × t rectangle, b ≥ t, from the series solution of the Prandtl stress function:
 *   β = (1/3)[1 − (192/π⁵)(t/b) Σ tanh(nπb/2t)/n⁵],  T = β b t³ G θ
 *   k = 1 − (8/π²) Σ 1/(n² cosh(nπb/2t)),           τ_max = k G θ t  (mid long side)
 * over odd n. Then τ_max = T/(α b t²) with α = β/k. Both tend to 1/3 for a thin strip.
 */
export function rectTorsionCoeffs(b, t) {
  const [lo, hi] = b >= t ? [t, b] : [b, t];
  let sb = 0;
  let sk = 0;
  for (let n = 1; n < 400; n += 2) {
    const x = (n * Math.PI * hi) / (2 * lo);
    sb += Math.tanh(x) / n ** 5;
    sk += x > 700 ? 0 : 1 / (n * n * Math.cosh(x));
  }
  const beta = (1 / 3) * (1 - (192 / Math.PI ** 5) * (lo / hi) * sb);
  const k = 1 - (8 / Math.PI ** 2) * sk;
  return { alpha: beta / k, beta, long: hi, short: lo };
}

export function rectTorsion(T, b, t, G) {
  const c = rectTorsionCoeffs(b, t);
  return { ...c, tauMax: T / (c.alpha * c.long * c.short ** 2), rate: T / (c.beta * c.long * c.short ** 3 * G) };
}

/**
 * The same two coefficients from the double sine series of the stress function on 0 < x < b,
 * 0 < y < t: ∇²φ = −2 gives φ = Σ 32 sin(mπx/b) sin(nπy/t) / (π⁴ m n (m²/b² + n²/t²)) over odd m, n.
 * T/(Gθ) = 2∫φ dA and τ_max/(Gθ) = ∂φ/∂y at the middle of the long side. A second route to α and β.
 */
export function rectTorsionDouble(b, t, terms = 401) {
  const [lo, hi] = b >= t ? [t, b] : [b, t];
  let sumT = 0;
  for (let m = 1; m <= terms; m += 2) {
    for (let n = 1; n <= terms; n += 2) sumT += 1 / (m * m * n * n * ((m * m) / (hi * hi) + (n * n) / (lo * lo)));
  }
  // The stress sum over n converges only as 1/n, so it is summed exactly: over odd n,
  // Σ 1/(n² + c²) = (π/4c) tanh(πc/2), with c = m·lo/hi.
  let sumTau = 0;
  for (let m = 1; m <= 20001; m += 2) {
    const sm = (m - 1) % 4 === 0 ? 1 : -1;
    const c = (m * lo) / hi;
    sumTau += (sm / m) * lo * ((Math.PI / (4 * c)) * Math.tanh((Math.PI * c) / 2));
  }
  const torque = (256 * hi * lo * sumT) / Math.PI ** 6;
  const tau = (32 * sumTau) / Math.PI ** 3;
  const beta = torque / (hi * lo ** 3);
  return { beta, alpha: beta * (lo / tau), long: hi, short: lo };
}
