/**
 * Orbital decay by drag in an exponential upper atmosphere. Our own model.
 *
 * Above 300 km the air is mostly atomic oxygen near the exospheric temperature T∞. Hydrostatic
 * balance for an isothermal gas gives ρ = ρ_r exp(−(z − z_r)/H) with H = kT/(mg) (MIT 16.851,
 * Lecture 5). The density at z_r = 300 km is the U.S. Standard Atmosphere 1976 value,
 * 1.916 × 10⁻¹¹ kg/m³; g is taken at 300 km. Solar activity sets T∞ ≈ 500 + 3.4 F10.7 K
 * (Wikipedia, Thermosphere). At F10.7 = 147, T∞ = 1000 K, and the model lies within 23% of the
 * standard atmosphere's 400, 500 and 600 km densities. Holding the 300 km density fixed
 * understates the swing between solar minimum and maximum.
 *
 * A circular orbit of radius a loses energy to drag D = ½ρv²C_D A at v = √(μ/a), so
 *   da/dt = −B ρ(a) √(μ a),   B = C_D A/m.
 * Closed form: separating and substituting u = √a, x = u/√H turns the time from a₀ to a₁ into
 *   t = (2√H/(B ρ_r √μ)) [e^{(a₀−a_r)/H} D(x₀) − e^{(a₁−a_r)/H} D(x₁)],
 * where D is Dawson's integral, D(x) = e^{−x²}∫₀ˣ e^{s²} ds.
 * Second method: step da/dt forward in time by fourth-order Runge–Kutta until the orbit reaches a₁.
 */
import { MU_EARTH, R_EARTH } from './kepler.js';

export const K_B = 1.380649e-23; // J/K
export const M_O = 15.999 * 1.66053907e-27; // kg, atomic oxygen
export const Z_REF = 300; // km
export const RHO_REF = 1.916e-11; // kg/m³ at 300 km, U.S. Standard Atmosphere 1976
export const CD = 2.2; // MIT 16.851 Lecture 5: typically 2.2 to 4 for spacecraft
export const Z_END = 200; // km: below this the craft re-enters within days

const MU = MU_EARTH * 1e9; // m³/s²
const YEAR = 365.25 * 86400;

/** Exospheric temperature (K) for a solar flux F10.7. */
export const exoTemp = (f107) => 500 + 3.4 * f107;

/** Scale height (km) of atomic oxygen at T∞, with g at 300 km. */
export function scaleHeight(T) {
  const r = (R_EARTH + Z_REF) * 1e3;
  const g = MU / (r * r);
  return (K_B * T) / (M_O * g) / 1e3;
}

/** Density (kg/m³) at altitude z (km) for a solar flux F10.7. */
export function density(z, f107) {
  return RHO_REF * Math.exp(-(z - Z_REF) / scaleHeight(exoTemp(f107)));
}

/**
 * Dawson's integral. Small x by its Maclaurin series; large x by its asymptotic series, which at the
 * x ≈ 10 an orbit gives is good to machine precision.
 */
export function dawson(x) {
  if (x < 0) return -dawson(-x);
  if (x < 4) {
    // D(x) = Σ (−1)ⁿ 2ⁿ x^{2n+1} / (2n+1)!!
    let term = x;
    let sum = x;
    for (let n = 1; n < 200; n++) {
      term *= (-2 * x * x) / (2 * n + 1);
      sum += term;
      if (Math.abs(term) < 1e-17 * Math.abs(sum)) break;
    }
    return sum;
  }
  // D(x) ~ (1/2x) Σ (2n−1)!!/(2x²)ⁿ
  let term = 1;
  let sum = 1;
  for (let n = 1; n < 60; n++) {
    const next = (term * (2 * n - 1)) / (2 * x * x);
    if (next > term) break;
    term = next;
    sum += term;
    if (term < 1e-17 * sum) break;
  }
  return sum / (2 * x);
}

/** Closed form: years to fall from altitude z0 to z1 (km), for B in m²/kg and a solar flux F10.7. */
export function lifetimeClosed({ z0, B, f107, z1 = Z_END }) {
  const H = scaleHeight(exoTemp(f107)) * 1e3; // m
  const ar = (R_EARTH + Z_REF) * 1e3;
  const a0 = (R_EARTH + z0) * 1e3;
  const a1 = (R_EARTH + z1) * 1e3;
  const x0 = Math.sqrt(a0 / H);
  const x1 = Math.sqrt(a1 / H);
  const t = ((2 * Math.sqrt(H)) / (B * RHO_REF * Math.sqrt(MU))) * (Math.exp((a0 - ar) / H) * dawson(x0) - Math.exp((a1 - ar) / H) * dawson(x1));
  return t / YEAR;
}

/** Decay rate (km per year) at altitude z. */
export function decayRate(z, B, f107) {
  const a = (R_EARTH + z) * 1e3;
  return (B * density(z, f107) * Math.sqrt(MU * a) * YEAR) / 1e3;
}

/**
 * Second method: Runge–Kutta in time, each step a hundredth of a scale height of fall. Returns the
 * years to reach z1 and the altitude trace [years, km].
 */
export function lifetimeStepped({ z0, B, f107, z1 = Z_END }, share = 0.01) {
  const H = scaleHeight(exoTemp(f107));
  const f = (z) => -decayRate(z, B, f107); // km/yr
  let z = z0;
  let t = 0;
  const trace = [[0, z0]];
  for (let i = 0; i < 1e6 && z > z1; i++) {
    let dt = (share * H) / -f(z);
    const k1 = f(z);
    const k2 = f(z + (dt / 2) * k1);
    const k3 = f(z + (dt / 2) * k2);
    const k4 = f(z + dt * k3);
    let zn = z + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (zn < z1) {
      // The last step: shorten it to land on z1, by one Newton correction of the step length.
      const rate = (zn - z) / dt;
      dt = (z1 - z) / rate;
      const m1 = f(z);
      const m2 = f(z + (dt / 2) * m1);
      const m3 = f(z + (dt / 2) * m2);
      const m4 = f(z + dt * m3);
      zn = z + (dt / 6) * (m1 + 2 * m2 + 2 * m3 + m4);
      dt += (z1 - zn) / f(zn);
      zn = z1;
    }
    t += dt;
    z = zn;
    trace.push([t, z]);
  }
  return { years: t, trace };
}

/** Both methods and their relative gap. */
export function decayChecked(state) {
  const years = lifetimeClosed(state);
  const s = lifetimeStepped(state);
  const H = scaleHeight(exoTemp(state.f107));
  return {
    years,
    stepped: s.years,
    trace: s.trace,
    gap: Math.abs(s.years - years) / years,
    T: exoTemp(state.f107),
    H,
    rho0: density(state.z0, state.f107),
    rate0: decayRate(state.z0, state.B, state.f107),
  };
}
