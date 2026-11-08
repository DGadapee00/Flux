/**
 * A double-pipe heat exchanger, run in counterflow or parallel flow (EML 4140).
 *
 * Hot water enters at T_h,i with capacity rate C_h = ṁc_p, cold at T_c,i with C_c, through a wall
 * of conductance UA. With C_min, C_max, C_r = C_min/C_max and NTU = UA/C_min,
 *   counterflow:   ε = [1 − e^{−NTU(1 − C_r)}] / [1 − C_r e^{−NTU(1 − C_r)}]   (ε = NTU/(1 + NTU) at C_r = 1),
 *   parallel flow: ε = [1 − e^{−NTU(1 + C_r)}] / (1 + C_r),
 * and q = ε C_min (T_h,i − T_c,i). In counterflow the cold stream can leave hotter than the hot
 * stream leaves; in parallel flow it never can. The log-mean temperature difference gives the same
 * duty, q = UA ΔT_lm.
 *
 * The second method marches both streams along the area with Runge–Kutta, dT_h/dA = −U(T_h − T_c)/C_h
 * and dT_c/dA = ±U(T_h − T_c)/C_c; for counterflow it shoots on the cold outlet by the secant method.
 */

export const INLET = { Th: 90, Tc: 20 };

export function exchangerClosed({ flow, Ch, Cc, UA }) {
  const { Th, Tc } = INLET;
  const Cmin = Math.min(Ch, Cc);
  const Cmax = Math.max(Ch, Cc);
  const Cr = Cmin / Cmax;
  const NTU = UA / Cmin;
  let eps;
  if (flow === 'parallel') eps = (1 - Math.exp(-NTU * (1 + Cr))) / (1 + Cr);
  else if (Math.abs(1 - Cr) < 1e-9) eps = NTU / (1 + NTU);
  else {
    const e = Math.exp(-NTU * (1 - Cr));
    eps = (1 - e) / (1 - Cr * e);
  }
  const q = eps * Cmin * (Th - Tc);
  const Tho = Th - q / Ch;
  const Tco = Tc + q / Cc;
  const d1 = flow === 'parallel' ? Th - Tc : Th - Tco;
  const d2 = flow === 'parallel' ? Tho - Tco : Tho - Tc;
  const lmtd = Math.abs(d1 - d2) < 1e-9 ? d1 : (d1 - d2) / Math.log(d1 / d2);
  return { Cmin, Cmax, Cr, NTU, eps, q, Tho, Tco, lmtd, qLm: UA * lmtd, cross: Tco > Tho };
}

function march({ flow, Ch, Cc, UA }, Tc0, n, keep) {
  // A runs 0 → UA (U folded in). Hot enters at A = 0; cold enters at A = 0 in parallel flow and at
  // A = UA in counterflow, so there T_c(0) is the unknown cold outlet.
  const s = flow === 'parallel' ? 1 : -1;
  const F = ([h, c]) => [-(h - c) / Ch, (s * (h - c)) / Cc];
  let y = [INLET.Th, Tc0];
  const dA = UA / n;
  const out = keep ? [[0, ...y]] : null;
  for (let i = 0; i < n; i++) {
    const k1 = F(y);
    const k2 = F([y[0] + (dA / 2) * k1[0], y[1] + (dA / 2) * k1[1]]);
    const k3 = F([y[0] + (dA / 2) * k2[0], y[1] + (dA / 2) * k2[1]]);
    const k4 = F([y[0] + dA * k3[0], y[1] + dA * k3[1]]);
    y = [y[0] + (dA / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y[1] + (dA / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    if (keep) out.push([((i + 1) * dA) / UA, ...y]);
  }
  return keep ? out : y;
}

export function exchangerNumeric(p, n = 400) {
  if (p.flow === 'parallel') {
    const prof = march(p, INLET.Tc, n, true);
    return { prof, Tho: prof[n][1], Tco: prof[n][2] };
  }
  // Secant on the cold outlet so the cold stream arrives at A = UA at its inlet temperature.
  const miss = (t) => march(p, t, n, false)[1] - INLET.Tc;
  let a = INLET.Tc;
  let b = INLET.Th;
  let fa = miss(a);
  let fb = miss(b);
  for (let i = 0; i < 60 && Math.abs(fb) > 1e-12 && fb !== fa; i++) {
    const c = b - (fb * (b - a)) / (fb - fa);
    a = b;
    fa = fb;
    b = c;
    fb = miss(b);
  }
  const prof = march(p, b, n, true);
  return { prof, Tho: prof[n][1], Tco: b };
}

export function exchangerChecked(state) {
  const cf = exchangerClosed(state);
  const nu = exchangerNumeric(state);
  const qNum = state.Ch * (INLET.Th - nu.Tho);
  const gap = Math.max(Math.abs(qNum - cf.q) / cf.q, Math.abs(cf.qLm - cf.q) / cf.q, Math.abs(nu.Tco - cf.Tco) / (INLET.Th - INLET.Tc));
  return { ...cf, prof: nu.prof, qNum, gap };
}
