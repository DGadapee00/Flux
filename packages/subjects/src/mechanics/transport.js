/**
 * The Reynolds transport theorem on a fixed box in a duct (EML 3015, Following the flow).
 *
 * Water flows along a duct whose area falls in a straight line, A(x) = A₁ + (A₂ − A₁)x/L, at a
 * volume flow Q(t) = Q₀(1 + kt). The flow is one-dimensional and incompressible, so u = Q/A. A box
 * from x₁ to x₂ stays put. The system is the water inside the box at time t. For a property B with
 * b per kilogram,
 *   dB_sys/dt = d/dt ∫_box ρb dV + [ρ b u A]_{x₁}^{x₂}.
 * The box term and the net outflow come in closed form for three properties: mass (b = 1),
 * x-momentum (b = u) and a passive dye (ρb = c, carried with the water).
 *
 * The second method follows the system itself. Each particle keeps its volume label
 * V = ∫₀ˣ A dx, which grows by S(t) = ∫Q dt, so the system's ends are found by bisection, its B is
 * integrated by Simpson's rule between them, and the rate is a Richardson-extrapolated central
 * difference in time.
 */
export const RHO_WATER = 1000; // kg/m³

export const DUCT = { L: 2, A1: 0.02, Q0: 0.01, w: 0.5 };
export const DUCTS = {
  straight: { name: 'Straight duct', A2: 0.02 },
  nozzle: { name: 'Nozzle, 4 to 1', A2: 0.005 },
};
export const PROPERTIES = {
  mass: { name: 'Mass', unit: 'kg', rateUnit: 'kg/s' },
  momentum: { name: 'x-momentum', unit: 'kg·m/s', rateUnit: 'N' },
  dye: { name: 'Dye', unit: 'g', rateUnit: 'g/s' },
};
// The dye blob: 1 g/L at its centre, which starts 0.25 m into the duct with a spread of 0.15 m there.
export const DYE = { c0: 1000, V0: 0.005, sigma: 0.003 }; // g/m³, m³, m³

/** The flow: area, volume label, speed and inflow at any x and t. */
export function flow({ duct = 'straight', k = 0 } = {}) {
  const { L, A1, Q0 } = DUCT;
  const A2 = (DUCTS[duct] || DUCTS.straight).A2;
  const slope = (A2 - A1) / L;
  const A = (x) => A1 + slope * x;
  const V = (x) => A1 * x + (slope * x * x) / 2;
  const Q = (t) => Q0 * (1 + k * t);
  const S = (t) => Q0 * (t + (k * t * t) / 2);
  const dye = (x, t) => DYE.c0 * Math.exp(-(((V(x) - DYE.V0 - S(t)) / DYE.sigma) ** 2));
  return { L, A1, A2, Q0, k, slope, A, V, Q, S, dye, u: (x, t) => Q(t) / A(x) };
}

/** ρb at x and t, per cubic metre, for each property. */
function density(F, prop, x, t) {
  if (prop === 'momentum') return RHO_WATER * F.u(x, t);
  if (prop === 'dye') return F.dye(x, t);
  return RHO_WATER;
}

/** The box term, the net outflow and their sum, the system's rate, in closed form. */
export function transport({ duct = 'straight', prop = 'momentum', k = 0, t = 0, xb = 0.75 }) {
  const F = flow({ duct, k });
  const x1 = xb;
  const x2 = xb + DUCT.w;
  const Q = F.Q(t);
  const dQ = F.Q0 * k;
  let boxRate;
  let outflow;
  if (prop === 'mass') {
    boxRate = 0;
    outflow = RHO_WATER * Q - RHO_WATER * Q;
  } else if (prop === 'momentum') {
    // ∫ρuA dx = ρQ(x₂ − x₁), and the flux of momentum through a face is ρQu = ρQ²/A.
    boxRate = RHO_WATER * dQ * DUCT.w;
    outflow = RHO_WATER * Q * Q * (1 / F.A(x2) - 1 / F.A(x1));
  } else {
    // The dye moves with its volume label, so the box gains at the inlet face what crosses it.
    boxRate = -Q * (F.dye(x2, t) - F.dye(x1, t));
    outflow = Q * (F.dye(x2, t) - F.dye(x1, t));
  }
  const inBox = simpson((x) => density(F, prop, x, t) * F.A(x), x1, x2, 400);
  return { F, x1, x2, Q, uIn: F.u(x1, t), uOut: F.u(x2, t), boxRate, outflow, sysRate: boxRate + outflow, inBox };
}

/** Where the particle with volume label v is: the x with V(x) = v, by bisection (x may leave the duct). */
export function placeOf(F, v) {
  let lo = -F.L;
  let hi = 2 * F.L;
  const Vx = (x) => (x <= F.L ? F.V(x) : F.V(F.L) + F.A2 * (x - F.L));
  const Vlo = (x) => (x >= 0 ? Vx(x) : F.A1 * x);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (Vlo(mid) < v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The system at time t + dt: the water that filled the box at t, its ends and its B. */
export function systemAt({ duct = 'straight', prop = 'momentum', k = 0, t = 0, xb = 0.75 }, dt) {
  const F = flow({ duct, k });
  const shift = F.S(t + dt) - F.S(t);
  const xa = placeOf(F, F.V(xb) + shift);
  const xz = placeOf(F, F.V(xb + DUCT.w) + shift);
  const tt = t + dt;
  // Past the duct's exit the area stays at A₂; the scenarios keep the system inside it.
  const area = (x) => F.A(Math.min(Math.max(x, 0), F.L));
  const B = simpson((x) => density(F, prop, Math.min(x, F.L), tt) * area(x), xa, xz, 400);
  return { xa, xz, B };
}

/** A size for the rates, to judge the gap between the two methods by. */
export function rateScale({ prop, Q, uIn, boxRate, outflow }) {
  const floor = prop === 'dye' ? Q * DYE.c0 : prop === 'momentum' ? RHO_WATER * Q * uIn : RHO_WATER * Q;
  return Math.max(Math.abs(boxRate), Math.abs(outflow), floor);
}

/** The system's rate by following it: central differences at h and h/2, extrapolated. */
export function followSystem(state, h = 0.005) {
  const D = (hh) => (systemAt(state, hh).B - systemAt(state, -hh).B) / (2 * hh);
  const d1 = D(h);
  const d2 = D(h / 2);
  return (4 * d2 - d1) / 3;
}

function simpson(f, a, b, n) {
  const m = n % 2 ? n + 1 : n;
  const h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
