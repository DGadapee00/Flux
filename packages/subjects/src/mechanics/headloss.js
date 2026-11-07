/**
 * Head loss in a straight pipe (EML 3015, Following the flow).
 *
 * Darcy–Weisbach writes the loss over a length L of pipe as
 *   h_L = f (L/D) V²/2g,   Re = VD/ν.
 * Laminar flow (Re < 2300 here) has f = 64/Re, so h_L grows in step with V and roughness does not
 * matter. Turbulent flow has Colebrook's friction factor,
 *   1/√f = −2 log₁₀(ε/3.7D + 2.51/(Re√f)),
 * which levels off at high Re to a value set by the roughness: then h_L grows as V².
 *
 * Second methods: in laminar flow, Hagen–Poiseuille, Δp = 128μLQ/(πD⁴), derived from the velocity
 * profile rather than from f; in turbulent flow, Colebrook's exact solution through the Lambert W
 * function, against Newton's method on the equation itself.
 */
export const G = 9.81;
export const RE_LAMINAR = 2300;
export const FLUIDS = {
  water: { name: 'Water, 20 °C', nu: 1.0e-6 },
  oil: { name: 'An oil, ν = 1.0 × 10⁻⁴ m²/s', nu: 1.0e-4 },
};
const LN10 = Math.log(10);

/** Colebrook by Newton's method on x = 1/√f. */
export function colebrookNewton(Re, rel) {
  const a = rel / 3.7;
  const b = 2.51 / Re;
  let x = 7;
  for (let i = 0; i < 60; i++) {
    const g = x + (2 / LN10) * Math.log(a + b * x);
    const dg = 1 + ((2 / LN10) * b) / (a + b * x);
    const dx = g / dg;
    x -= dx;
    if (Math.abs(dx) < 1e-15 * x) break;
  }
  return 1 / (x * x);
}

/**
 * Colebrook exactly: with k = 2/ln 10 and u = a + bx, u e^{u/(kb)} = e^{a/(kb)}, so
 * u = kb·W(e^{a/(kb)}/(kb)). W is found in logarithms, w + ln w = a/(kb) − ln(kb), to stay finite.
 */
export function colebrookLambert(Re, rel) {
  const a = rel / 3.7;
  const b = 2.51 / Re;
  const k = 2 / LN10;
  const c = k * b;
  const L = a / c - Math.log(c);
  let w = L > 1 ? L - Math.log(L) : Math.exp(L) / (1 + Math.exp(L)) + 0.5;
  for (let i = 0; i < 80; i++) {
    const dw = (w + Math.log(w) - L) / (1 + 1 / w);
    w -= dw;
    if (Math.abs(dw) < 1e-15 * w) break;
  }
  const u = c * w;
  const x = (u - a) / b;
  return 1 / (x * x);
}

/** Everything for a flow Q (m³/s) in a pipe of diameter D and roughness eps (m), length L. */
export function headLoss({ fluid, Q, D, eps, L = 10 }) {
  const { nu } = FLUIDS[fluid];
  const A = (Math.PI * D * D) / 4;
  const V = Q / A;
  const Re = (V * D) / nu;
  const laminar = Re < RE_LAMINAR;
  const rel = eps / D;
  const f = laminar ? 64 / Re : colebrookNewton(Re, rel);
  const hL = (f * (L / D) * V * V) / (2 * G);
  let check;
  if (laminar) {
    // Hagen–Poiseuille: Δp = 128 μ L Q / (π D⁴), so h_L = Δp/(ρg) = 128 ν L Q/(π g D⁴).
    check = (128 * nu * L * Q) / (Math.PI * G * D ** 4);
  } else {
    check = (colebrookLambert(Re, rel) * (L / D) * V * V) / (2 * G);
  }
  return { V, Re, laminar, rel, f, hL, hLcheck: check, gap: Math.abs(check - hL) / hL };
}
