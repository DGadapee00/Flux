/**
 * Two semi-infinite bodies brought into contact (EML 4140, transient conduction).
 *
 * A hand at T₁ touches a block at T₂. Each is deep enough to count as semi-infinite for the first
 * seconds, and the interface jumps at once to a fixed contact temperature,
 *   T_c = (e₁T₁ + e₂T₂)/(e₁ + e₂),   e = √(kρc), the effusivity,
 * with each side following an error function, T = T_c + (T_far − T_c) erf(|x|/(2√(αt))). The flux
 * through the interface is e₁e₂(T₁ − T₂)/((e₁ + e₂)√(πt)). A metal at room temperature feels colder than
 * wood at the same temperature because its effusivity is larger, not because it is colder.
 *
 * The second method marches both bodies by explicit finite differences, with the interface flux
 * matched, and reads the interface temperature after a second.
 */

export const BODIES = {
  steel: { name: 'Steel', k: 45, rho: 7850, c: 460 },
  aluminium: { name: 'Aluminium', k: 200, rho: 2700, c: 900 },
  glass: { name: 'Glass', k: 1.4, rho: 2500, c: 800 },
  wood: { name: 'Pine wood', k: 0.12, rho: 500, c: 1500 },
  foam: { name: 'Polystyrene foam', k: 0.033, rho: 30, c: 1300 },
};
export const SKIN = { k: 0.37, rho: 1000, c: 3500, T: 34 };

export const eff = (b) => Math.sqrt(b.k * b.rho * b.c);
const erf = (x) => {
  // Abramowitz and Stegun 7.1.26 is too coarse here; use the series and continued fraction.
  const s = Math.sign(x);
  const a = Math.abs(x);
  if (a < 3) {
    let sum = a;
    let term = a;
    for (let n = 1; n < 200; n++) {
      term *= (-a * a) / n;
      sum += term / (2 * n + 1);
      if (Math.abs(term) < 1e-17) break;
    }
    return (s * 2 * sum) / Math.sqrt(Math.PI);
  }
  return s * (1 - Math.exp(-a * a) / (a * Math.sqrt(Math.PI)) * (1 - 1 / (2 * a * a)));
};
export { erf };

export function contact({ body, Tb }) {
  const b = BODIES[body];
  const e1 = eff(SKIN);
  const e2 = eff(b);
  const Tc = (e1 * SKIN.T + e2 * Tb) / (e1 + e2);
  const flux = (t) => (e1 * e2 * (SKIN.T - Tb)) / ((e1 + e2) * Math.sqrt(Math.PI * t));
  const a1 = SKIN.k / (SKIN.rho * SKIN.c);
  const a2 = b.k / (b.rho * b.c);
  const profile = (x, t) => (x < 0 ? Tc + (SKIN.T - Tc) * erf(-x / (2 * Math.sqrt(a1 * t))) : Tc + (Tb - Tc) * erf(x / (2 * Math.sqrt(a2 * t))));
  return { e1, e2, Tc, flux, profile, a1, a2 };
}

/** Explicit finite differences across the joint, each side on its own grid, run to time t. */
export function contactNumeric({ body, Tb }, t = 1) {
  const b = BODIES[body];
  const a1 = SKIN.k / (SKIN.rho * SKIN.c);
  const a2 = b.k / (b.rho * b.c);
  const n = 400;
  const d1 = (8 * Math.sqrt(a1 * t)) / n;
  const d2 = (8 * Math.sqrt(a2 * t)) / n;
  const dt = 0.2 * Math.min(d1 * d1 / a1, d2 * d2 / a2);
  const steps = Math.ceil(t / dt);
  const h = t / steps;
  let u = new Float64Array(n + 1).fill(SKIN.T); // skin, index 0 at the interface
  let v = new Float64Array(n + 1).fill(Tb); // body
  for (let s = 0; s < steps; s++) {
    // Interface node shared: half cells on each side.
    const Ti = u[0];
    const C = (SKIN.rho * SKIN.c * d1) / 2 + (b.rho * b.c * d2) / 2;
    const qin = (SKIN.k * (u[1] - Ti)) / d1 + (b.k * (v[1] - Ti)) / d2;
    const nu = Float64Array.from(u);
    const nv = Float64Array.from(v);
    nu[0] = Ti + (h * qin) / C;
    nv[0] = nu[0];
    for (let i = 1; i < n; i++) {
      nu[i] = u[i] + ((a1 * h) / (d1 * d1)) * (u[i - 1] - 2 * u[i] + u[i + 1]);
      nv[i] = v[i] + ((a2 * h) / (d2 * d2)) * (v[i - 1] - 2 * v[i] + v[i + 1]);
    }
    u = nu;
    v = nv;
  }
  return u[0];
}

export function contactChecked(state) {
  const r = contact(state);
  const Tnum = contactNumeric(state);
  return { ...r, Tnum, gap: Math.abs(Tnum - r.Tc) / Math.max(Math.abs(SKIN.T - state.Tb), 1), q1: r.flux(1) };
}
