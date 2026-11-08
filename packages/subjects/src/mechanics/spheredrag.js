/**
 * Drag on a sphere, smooth or rough, and the drag crisis (EML 3015, drag and lift).
 *
 * The drag force is F_D = ½C_DρV²A, A = πD²/4, with C_D a function of Re = VD/ν. For a smooth sphere
 * a fitted curve (Morrison's) follows C_D from creeping flow through the drag crisis near
 * Re = 3 × 10⁵, where the boundary layer turns turbulent, clings to the back of the sphere longer, and
 * the wake narrows: C_D drops from about 0.5 to under 0.1. Roughness, like a golf ball's dimples,
 * trips the layer earlier; here the crisis term is moved to Re = 6 × 10⁴ and C_D settles near 0.25
 * after it, a rough-sphere model. Past the
 * crisis a faster ball can have less drag.
 *
 * Checked by computing how far a ball coasts before its speed halves, two ways: marching dV/dt =
 * −F/m in time with Runge–Kutta, and integrating dx = −mV dV/F over speed with Simpson's rule.
 */

export const AIRD = { rho: 1.2, nu: 1.5e-5 };
export const BALLS = {
  golf: { name: 'A golf ball, 42.7 mm', D: 0.0427, m: 0.0459 },
  football: { name: 'A football, 220 mm', D: 0.22, m: 0.43 },
};

export function cd(Re, surface = 'smooth') {
  const Rc = surface === 'dimpled' ? 6e4 : 2.63e5;
  const a = 24 / Re;
  const b = (2.6 * (Re / 5)) / (1 + (Re / 5) ** 1.52);
  const c = (0.411 * (Re / Rc) ** -7.94) / (1 + (Re / Rc) ** -8);
  const d = (0.25 * (Re / 1e6)) / (1 + Re / 1e6);
  // Dimples keep a rougher, draggier attached layer: past their crisis C_D settles near 0.25.
  const e = surface === 'dimpled' ? 0.2 * (1 - Math.exp(-((Re / Rc) ** 4))) : 0;
  return a + b + c + d + e;
}

export function force(V, surface, ball = 'golf') {
  const { D } = BALLS[ball];
  const A = (Math.PI * D ** 2) / 4;
  const Re = (V * D) / AIRD.nu;
  return 0.5 * cd(Re, surface) * AIRD.rho * V * V * A;
}

export function dragClosed({ V, surface, ball = 'golf' }) {
  const { D } = BALLS[ball];
  const Re = (V * D) / AIRD.nu;
  const C = cd(Re, surface);
  return { Re, cd: C, F: force(V, surface, ball), A: (Math.PI * D ** 2) / 4 };
}

/** Distance to coast from V to V/2, integrating over speed: x = ∫ mV/F dV. */
export function coastBySpeed({ V, surface, ball = 'golf' }, n = 2000) {
  const { m } = BALLS[ball];
  const f = (u) => (m * u) / force(u, surface, ball);
  const a = V / 2;
  const h = (V - a) / n;
  let s = f(a) + f(V);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** The same by marching in time. */
export function coastByTime({ V, surface, ball = 'golf' }) {
  const { m } = BALLS[ball];
  let v = V;
  let x = 0;
  const T = (m * V) / force(V, surface, ball);
  const dt = T / 4000;
  const acc = (u) => -force(u, surface, ball) / m;
  for (let i = 0; i < 1e6 && v > V / 2; i++) {
    const k1v = acc(v);
    const k1x = v;
    const k2v = acc(v + (dt / 2) * k1v);
    const k2x = v + (dt / 2) * k1v;
    const k3v = acc(v + (dt / 2) * k2v);
    const k3x = v + (dt / 2) * k2v;
    const k4v = acc(v + dt * k3v);
    const k4x = v + dt * k3v;
    const nv = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    if (nv <= V / 2) {
      // Interpolate the crossing linearly in v.
      return x + ((v - V / 2) / (v - nv)) * (nx - x);
    }
    v = nv;
    x = nx;
  }
  return x;
}

export function dragChecked(state) {
  const cf = dragClosed(state);
  const xs = coastBySpeed(state);
  const xt = coastByTime(state);
  return { ...cf, coast: xs, coastTime: xt, gap: Math.abs(xt - xs) / xs };
}
