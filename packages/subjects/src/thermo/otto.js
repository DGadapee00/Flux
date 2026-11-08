/**
 * Otto and Diesel cycles, air-standard with cold properties (EML 3101).
 *
 * Both compress air isentropically by a ratio r. Otto adds its heat at constant volume, Diesel at
 * constant pressure until the volume has grown by the cutoff ratio r_c. With k = 1.4,
 *   η_Otto = 1 − 1/r^{k−1},   η_Diesel = 1 − (1/r^{k−1}) · (r_c^k − 1)/(k(r_c − 1)).
 * The bracket is above 1, so at the same compression ratio the Diesel cycle is less efficient. It
 * wins in practice because, compressing air alone, it can run at r = 18 or more where a petrol engine
 * would knock near 10.
 *
 * The second method integrates ∮p dv around each cycle by Simpson's rule and divides by the heat in.
 */

export const AIRC = { k: 1.4, cp: 1.005, cv: 1.005 / 1.4, R: 1.005 - 1.005 / 1.4, T1: 300, p1: 100 };

export function ottoState(r, q = null) {
  const { k, cv, T1, p1, R } = AIRC;
  const v1 = (R * T1) / p1;
  const v2 = v1 / r;
  const T2 = T1 * r ** (k - 1);
  const p2 = p1 * r ** k;
  return { v1, v2, T2, p2 };
}

export function cyclesClosed({ r, rc }) {
  const { k, cv, cp, R, T1, p1 } = AIRC;
  const { v1, v2, T2, p2 } = ottoState(r);
  const etaO = 1 - 1 / r ** (k - 1);
  const etaD = 1 - (1 / r ** (k - 1)) * ((rc ** k - 1) / (k * (rc - 1)));
  // Diesel: heat at constant pressure to v3 = rc v2. Otto with the same heat in.
  const T3d = T2 * rc;
  const qin = cp * (T3d - T2);
  const T3o = T2 + qin / cv;
  return { etaO, etaD, qin, v1, v2, p2, T2, T3d, T3o, p3o: (p2 * T3o) / T2, v3d: rc * v2 };
}

function simpson(f, a, b, n = 400) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export function cyclesNumeric({ r, rc }) {
  const { k, p1 } = AIRC;
  const c = cyclesClosed({ r, rc });
  const { v1, v2, p2, qin } = c;
  // Otto: compression 1→2 on pv^k = p1 v1^k; expansion 3→4 on pv^k = p3 v2^k.
  const p3o = c.p3o;
  const wO = simpson((v) => p3o * (v2 / v) ** k, v2, v1) - simpson((v) => p1 * (v1 / v) ** k, v2, v1);
  // Diesel: constant-pressure heat 2→3, then expansion to v1.
  const v3 = c.v3d;
  const wD = p2 * (v3 - v2) + simpson((v) => p2 * (v3 / v) ** k, v3, v1) - simpson((v) => p1 * (v1 / v) ** k, v2, v1);
  return { etaO: wO / qin, etaD: wD / qin };
}

export function cyclesChecked(state) {
  const cf = cyclesClosed(state);
  const nu = cyclesNumeric(state);
  return { ...cf, etaONum: nu.etaO, etaDNum: nu.etaD, gap: Math.max(Math.abs(nu.etaO - cf.etaO), Math.abs(nu.etaD - cf.etaD)) };
}
