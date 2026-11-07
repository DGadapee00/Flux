/**
 * The laminar thermal boundary layer on a flat plate (EML 4140, Convection).
 *
 * A stream at T∞ flows along a plate held at T_s. With the Blasius similarity variable
 * η = y √(U/νx), u/U = f′(η) and θ = (T − T_s)/(T∞ − T_s), the energy equation becomes
 *   θ″ + (Pr/2) f θ′ = 0,   θ(0) = 0,   θ(∞) = 1,
 * where f solves the Blasius equation f‴ + ½ f f″ = 0. Pr = ν/α compares how fast momentum
 * diffuses with how fast heat does, so it alone sets how thick the thermal layer is beside the
 * velocity layer. The wall gradient θ′(0) gives the local Nusselt number, Nu_x = θ′(0) √Re_x.
 *
 * First method: the equation is first order in θ′, so θ′ = θ′(0) exp(−(Pr/2)∫₀^η f), and
 * θ′(0) = 1/∫₀^∞ exp(−(Pr/2)∫₀^η f) dη, found by Simpson's rule on the Blasius samples.
 * Second method: RK4 on θ″ = −(Pr/2) f θ′ alongside the Blasius equation, from θ′(0) = 1, then
 * scaled so that θ reaches 1 far out. Both give η where θ = 0.99.
 */
const ETA_MAX = 100;
const STEPS = 20000;
const H = ETA_MAX / STEPS;

/** Blasius f″(0), by shooting with RK4 and bisection, cached. */
let wallCache = null;
function blasiusWall() {
  if (wallCache) return wallCache;
  const end = (s) => {
    let y = [0, 0, s];
    const F = ([f, fp, fpp]) => [fp, fpp, -0.5 * f * fpp];
    const h = 12 / 2400;
    for (let i = 0; i < 2400; i++) y = rk4(F, y, h);
    return y[1];
  };
  let lo = 0.1;
  let hi = 1;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (end(mid) > 1) hi = mid;
    else lo = mid;
  }
  wallCache = (lo + hi) / 2;
  return wallCache;
}

/** f, f′ and ∫f on the grid η = iH, i = 0..STEPS. Past η = 10 the layer is outside: f′ = 1. */
let gridCache = null;
function blasiusGrid() {
  if (gridCache) return gridCache;
  const s = blasiusWall();
  const f = new Float64Array(STEPS + 1);
  const fp = new Float64Array(STEPS + 1);
  const F = ([a, b, c]) => [b, c, -0.5 * a * c];
  let y = [0, 0, s];
  for (let i = 0; i <= STEPS; i++) {
    const eta = i * H;
    if (eta > 10) {
      f[i] = f[i - 1] + H;
      fp[i] = 1;
      continue;
    }
    f[i] = y[0];
    fp[i] = y[1];
    y = rk4(F, y, H);
  }
  // ∫₀^η f by the trapezoid rule with an end correction (f″ is known), accurate to O(H⁴).
  const If = new Float64Array(STEPS + 1);
  for (let i = 1; i <= STEPS; i++) If[i] = If[i - 1] + (H / 2) * (f[i - 1] + f[i]) - ((H * H) / 12) * (fp[i] - fp[i - 1]);
  gridCache = { s, f, fp, If };
  return gridCache;
}

/** The first method: θ′(0) and the profile by quadrature. */
export function pohlhausen(Pr) {
  const { f, fp, If } = blasiusGrid();
  const g = (i) => Math.exp(-(Pr / 2) * If[i]);
  // Simpson's rule over the whole grid (STEPS is even).
  let sum = g(0) + g(STEPS);
  for (let i = 1; i < STEPS; i++) sum += (i % 2 ? 4 : 2) * g(i);
  const total = (sum * H) / 3;
  const wall = 1 / total;
  // θ(η) by the cumulative trapezoid with the same end correction, d(g)/dη = −(Pr/2) f g.
  const theta = new Float64Array(STEPS + 1);
  for (let i = 1; i <= STEPS; i++) {
    const d0 = -(Pr / 2) * f[i - 1] * g(i - 1);
    const d1 = -(Pr / 2) * f[i] * g(i);
    theta[i] = theta[i - 1] + wall * ((H / 2) * (g(i - 1) + g(i)) - ((H * H) / 12) * (d1 - d0));
  }
  return { wall, etaT: crossing(theta, 0.99), eta99: crossing(fp, 0.99), theta, fp };
}

/** The second method: RK4 on the coupled equations, θ′(0) = 1, then scaled. */
export function shootTheta(Pr) {
  const s = blasiusWall();
  const F = ([a, b, c, t, tp]) => [b, c, -0.5 * a * c, tp, -(Pr / 2) * a * tp];
  let y = [0, 0, s, 0, 1];
  const theta = new Float64Array(STEPS + 1);
  for (let i = 1; i <= STEPS; i++) {
    // Past η = 10 the stream is uniform: hold f″ = 0 so round-off in f″ cannot grow.
    if (i * H > 10) y[2] = 0;
    // Once θ′ has decayed to nothing, hold it there: far out the θ equation is stiff at large Pr.
    if (Math.abs(y[4]) < 1e-16 * Math.abs(y[3])) y[4] = 0;
    y = rk4(F, y, H);
    theta[i] = y[3];
  }
  const far = theta[STEPS];
  for (let i = 0; i <= STEPS; i++) theta[i] /= far;
  return { wall: 1 / far, etaT: crossing(theta, 0.99) };
}

/** Everything the lab shows for one Prandtl number. */
export function thermalLayer(Pr) {
  const a = pohlhausen(Pr);
  const b = shootTheta(Pr);
  const gap = Math.max(Math.abs(a.wall - b.wall) / a.wall, Math.abs(a.etaT - b.etaT) / a.etaT);
  const ratio = a.etaT / a.eta99;
  const sample = (arr, n = 200, upto = Math.max(a.etaT, a.eta99) * 1.25) => {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const eta = (upto * k) / n;
      out.push([eta, interp(arr, eta)]);
    }
    return out;
  };
  return {
    Pr,
    wall: a.wall,
    wallShoot: b.wall,
    etaT: a.etaT,
    etaTShoot: b.etaT,
    eta99: a.eta99,
    ratio,
    rule: Pr ** (-1 / 3),
    corrLarge: 0.332 * Pr ** (1 / 3),
    corrSmall: 0.564 * Math.sqrt(Pr),
    theta: sample(a.theta),
    velocity: sample(a.fp),
    gap,
  };
}

function interp(arr, eta) {
  const x = eta / H;
  const i = Math.min(Math.floor(x), STEPS - 1);
  const t = x - i;
  return arr[i] + t * (arr[i + 1] - arr[i]);
}

function crossing(arr, level) {
  for (let i = 1; i <= STEPS; i++) {
    if (arr[i] >= level) return (i - 1 + (level - arr[i - 1]) / (arr[i] - arr[i - 1])) * H;
  }
  return ETA_MAX;
}

function rk4(F, y, h) {
  const k1 = F(y);
  const k2 = F(y.map((v, j) => v + (h / 2) * k1[j]));
  const k3 = F(y.map((v, j) => v + (h / 2) * k2[j]));
  const k4 = F(y.map((v, j) => v + h * k3[j]));
  return y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
}
