/**
 * A Jominy end-quench bar (EMA 3010, the iron–carbon diagram in practice).
 *
 * A steel bar at 850 °C, austenite, has one end sprayed with water at 20 °C. Treating the bar as a
 * semi-infinite solid with its end held at the water's temperature,
 *   T(x, t) = T_q + (T_i − T_q) erf(x / 2√(αt)).
 * At 700 °C, where austenite starts to turn to ferrite and pearlite, erf(u) = (700 − T_q)/(T_i − T_q)
 * fixes u, so the time to get there is t = x²/(4αu²) and the cooling rate is
 *   dT/dt = (T_i − T_q) u e^{−u²} / (√π t),
 * which falls as 1/x². Where the rate beats the steel's critical rate the austenite becomes
 * martensite and the bar is hard; further in it becomes pearlite and stays soft. Alloying lowers the
 * critical rate, so an alloy steel hardens deeper.
 *
 * The second method solves the heat equation in the bar by Crank–Nicolson finite differences and
 * reads the time and the rate at which the point passes 700 °C.
 */

export const BAR = { alpha: 6e-6, Ti: 850, Tq: 20, Tn: 700 };
/** Model values: critical cooling rate at 700 °C (K/s), and hardness of martensite and pearlite (HRC). */
export const STEELS = {
  s1045: { name: '1045 plain carbon', rc: 150, Hm: 58, Hp: 18 },
  s4140: { name: '4140 chromium–molybdenum', rc: 20, Hm: 56, Hp: 26 },
  s4340: { name: '4340 nickel–chromium–molybdenum', rc: 5, Hm: 55, Hp: 30 },
};

export function erf(x) {
  // Abramowitz–Stegun 7.1.26 is too coarse here; use a series and a continued fraction.
  const s = Math.sign(x);
  const z = Math.abs(x);
  if (z < 3) {
    let sum = z;
    let term = z;
    for (let n = 1; n < 200; n++) {
      term *= (-z * z) / n;
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17) break;
    }
    return (s * 2 * sum) / Math.sqrt(Math.PI);
  }
  return s * (1 - Math.exp(-z * z) / (z * Math.sqrt(Math.PI)) * (1 - 1 / (2 * z * z)));
}
function erfinv(y) {
  let lo = 0;
  let hi = 4;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (erf(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
export const U = erfinv((BAR.Tn - BAR.Tq) / (BAR.Ti - BAR.Tq));

export function rateAt(xm) {
  const { alpha, Ti, Tq } = BAR;
  const t = (xm * xm) / (4 * alpha * U * U);
  return { t, rate: ((Ti - Tq) * U * Math.exp(-U * U)) / (Math.sqrt(Math.PI) * t) };
}
export function hardness(steel, rate) {
  const s = STEELS[steel];
  const f = 1 / (1 + (s.rc / rate) ** 4);
  return { f, H: s.Hp + f * (s.Hm - s.Hp) };
}

export function jominyClosed({ steel, xmm }) {
  const x = xmm / 1000;
  const { t, rate } = rateAt(x);
  const { f, H } = hardness(steel, rate);
  const T = (tt) => BAR.Tq + (BAR.Ti - BAR.Tq) * erf(x / (2 * Math.sqrt(BAR.alpha * tt)));
  return { x, t, rate, f, H, T };
}

/** Crank–Nicolson on [0, 8x] with the end at T_q; Rannacher start. Time and rate at 700 °C. */
export function jominyNumeric({ xmm }, n = 800) {
  const x = xmm / 1000;
  const L = 8 * x;
  const dx = L / n;
  const j = n / 8;
  const { alpha, Ti, Tq, Tn } = BAR;
  const tStar = rateAt(x).t;
  const dt = (1.5 * tStar) / 3000;
  let T = new Float64Array(n + 1).fill(Ti);
  T[0] = Tq;
  const step = (h, w) => {
    const r = (alpha * h) / (dx * dx);
    const m = n - 1;
    const a = new Float64Array(m);
    const b = new Float64Array(m);
    const c = new Float64Array(m);
    const d = new Float64Array(m);
    for (let i = 1; i <= m; i++) {
      const k = i - 1;
      a[k] = -w * r;
      b[k] = 1 + 2 * w * r;
      c[k] = -w * r;
      const right = i + 1 <= n - 1 ? T[i + 1] : Ti;
      d[k] = T[i] + (1 - w) * r * (T[i - 1] - 2 * T[i] + right);
      if (i === 1) d[k] += w * r * Tq;
      if (i === m) d[k] += w * r * Ti;
    }
    for (let k = 1; k < m; k++) {
      const q = a[k] / b[k - 1];
      b[k] -= q * c[k - 1];
      d[k] -= q * d[k - 1];
    }
    const nx = new Float64Array(n + 1);
    nx[0] = Tq;
    nx[n] = Ti;
    nx[m] = d[m - 1] / b[m - 1];
    for (let k = m - 2; k >= 0; k--) nx[k + 1] = (d[k] - c[k] * nx[k + 2]) / b[k];
    T = nx;
  };
  let t = 0;
  let prev = Ti;
  for (let s = 0; s < 4; s++) {
    step(dt / 4, 1);
    t += dt / 4;
  }
  prev = T[j];
  while (t < 3 * tStar) {
    const before = T[j];
    step(dt, 0.5);
    t += dt;
    if (before >= Tn && T[j] < Tn) {
      const frac = (before - Tn) / (before - T[j]);
      return { t: t - dt + frac * dt, rate: (before - T[j]) / dt };
    }
    prev = T[j];
  }
  return { t: NaN, rate: NaN, prev };
}

export function jominyChecked(state) {
  const cf = jominyClosed(state);
  const nu = jominyNumeric(state);
  return { ...cf, tNum: nu.t, rateNum: nu.rate, gap: Math.max(Math.abs(nu.t - cf.t) / cf.t, Math.abs(nu.rate - cf.rate) / cf.rate) };
}
