/**
 * Launch loads: a component on a bracket, shaken at its base (the satellite's Structure subsystem).
 *
 * The bracket is a spring k with damping c under a mass m. The base moves as y = Y sin ωt, so with
 * z = x − y the mass's motion relative to the base,
 *   m z̈ + c ż + k z = −m ÿ,
 * and in steady state the mass's acceleration is the base's times the transmissibility
 *   T = √[(1 + (2ζr)²) / ((1 − r²)² + (2ζr)²)],   r = f/f_n,   ζ = c/(2√(km)).
 * Near r = 1 it peaks at about 1/(2ζ); well above it falls below 1 (isolation). So a bracket whose
 * natural frequency sits inside the launcher's shaking band multiplies the load, however strong.
 *
 * The second method integrates the equation by RK4 over one forcing period and shoots for the
 * periodic steady state, then measures the mass's acceleration amplitude by Fourier projection.
 */
export const G0 = 9.80665;

export function transmissibility(r, zeta) {
  const a = (2 * zeta * r) ** 2;
  return Math.sqrt((1 + a) / ((1 - r * r) ** 2 + a));
}

/** Steady base excitation by RK4 and shooting. Returns the amplitude ratio and one period of traces. */
export function shakeNumeric({ fn, zeta, f, Ain }) {
  const wn = 2 * Math.PI * fn;
  const w = 2 * Math.PI * f;
  const T = 1 / f;
  const N = 2 * Math.ceil((400 * Math.max(1, fn / f)) / 2);
  const h = T / N;
  // Base acceleration a_b = Ain sin ωt; state [z, ż] with z̈ = −2ζω_n ż − ω_n² z − a_b.
  const ab = (t) => Ain * Math.sin(w * t);
  const F = (t, [z, v], forced) => [v, -2 * zeta * wn * v - wn * wn * z - (forced ? ab(t) : 0)];
  const step = (t, y, forced) => {
    const k1 = F(t, y, forced);
    const k2 = F(t + h / 2, y.map((v, i) => v + (h / 2) * k1[i]), forced);
    const k3 = F(t + h / 2, y.map((v, i) => v + (h / 2) * k2[i]), forced);
    const k4 = F(t + h, y.map((v, i) => v + h * k3[i]), forced);
    return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const run = (y0, forced, record) => {
    let y = y0.slice();
    const rec = [];
    for (let n = 0; n < N; n++) {
      if (record) rec.push([n * h, ab(n * h), -2 * zeta * wn * y[1] - wn * wn * y[0]]); // mass accel = ÿ + z̈
      y = step(n * h, y, forced);
    }
    return { y, rec };
  };
  const c = run([0, 0], true, false).y;
  const p1 = run([1, 0], false, false).y;
  const p2 = run([0, 1], false, false).y;
  // (I − Φ) y0 = c, with Φ's columns p1 and p2.
  const a11 = 1 - p1[0];
  const a12 = -p2[0];
  const a21 = -p1[1];
  const a22 = 1 - p2[1];
  const det = a11 * a22 - a12 * a21;
  const y0 = [(c[0] * a22 - a12 * c[1]) / det, (a11 * c[1] - a21 * c[0]) / det];
  const { rec } = run(y0, true, true);
  let s = 0;
  let co = 0;
  rec.forEach(([t, , am]) => {
    s += am * Math.sin(w * t);
    co += am * Math.cos(w * t);
  });
  const amp = (2 / N) * Math.hypot(s, co);
  return { ratio: amp / Ain, trace: rec.filter((_, i) => i % Math.max(1, Math.floor(N / 200)) === 0) };
}

/** Everything the lab shows. fn and f in Hz, Ain in g, m in kg. */
export function launchLoad({ fn, zeta, f, Ain, m }) {
  const r = f / fn;
  const T = transmissibility(r, zeta);
  const num = shakeNumeric({ fn, zeta, f, Ain: Ain * G0 });
  const out = T * Ain;
  return { r, T, Tnum: num.ratio, gap: Math.abs(num.ratio - T) / T, out, force: m * out * G0, trace: num.trace, peak: transmissibility(Math.sqrt(Math.max(1e-9, (Math.sqrt(1 + 8 * zeta * zeta) - 1) / (4 * zeta * zeta))), zeta), Q: 1 / (2 * zeta) };
}
