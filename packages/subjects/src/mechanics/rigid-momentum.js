/**
 * Impulse and momentum of a rigid body in the plane (Hibbeler Ch 19).
 *
 * A body's angular momentum about its mass centre is H_G = I_G ω. About any point P it is
 * H_P = r_{G/P} × m v_G + I_G ω; for a body turning about a fixed pin O, H_O = I_O ω.
 * The angular impulse of the external forces changes it: ∫ΣM_O dt = ΔH_O. When the forces have no
 * moment about O during the interval (a pin's reaction, a central pull), H_O is conserved.
 *
 * Pure functions, SI, counterclockwise positive.
 */

/** Solve a small linear system A x = b by Gaussian elimination with partial pivoting. */
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * A body of inertia I0 about a free, frictionless axis carries two equal masses m at radius r on
 * opposite sides. Nothing torques the system about the axis, so H = (I0 + 2 m r²) ω is the same at
 * r1 and r2. The kinetic energy is not: T = H²/(2I), which grows as I falls. The pull that moves the
 * masses in does the difference as work.
 */
export function spinChange({ I0, m, r1, r2, w1 }) {
  const I1 = I0 + 2 * m * r1 * r1;
  const I2 = I0 + 2 * m * r2 * r2;
  const H = I1 * w1;
  const w2 = H / I2;
  const T1 = 0.5 * I1 * w1 * w1;
  const T2 = 0.5 * I2 * w2 * w2;
  return { I1, I2, H, w2, T1, T2, work: T2 - T1 };
}

/**
 * The second method: forces only, no conservation law. The masses move from r1 to r2 at a steady
 * rate. Each needs a transverse force F_θ = m(rω̇ + 2ṙω) from the arm (polar coordinates), and by
 * Newton's third law each pushes back on the body with a torque −rF_θ. So I0 ω̇ = −2r·m(rω̇ + 2ṙω).
 * Integrated by RK4 in time.
 */
export function spinChangeByForces({ I0, m, r1, r2, w1, T = 1, steps = 4000 }) {
  const rd = (r2 - r1) / T;
  const f = (t, w) => {
    const r = r1 + rd * t;
    return (-4 * m * r * rd * w) / (I0 + 2 * m * r * r);
  };
  let w = w1;
  const h = T / steps;
  for (let i = 0; i < steps; i++) {
    const t = i * h;
    const k1 = f(t, w);
    const k2 = f(t + h / 2, w + (h / 2) * k1);
    const k3 = f(t + h / 2, w + (h / 2) * k2);
    const k4 = f(t + h, w + h * k3);
    w += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  }
  return { w2: w };
}

/**
 * A ball of mass m, moving horizontally at u, strikes a uniform slender bar of mass M and length L
 * at rest. Pinned: the bar hangs from a pin at its top and is struck d below the pin. Free: the bar
 * lies at rest with nothing holding it and is struck d from its top end. Restitution e acts along the
 * line of impact.
 *
 * Pinned, closed form: angular momentum about the pin is conserved (the pin's impulse has no
 * moment about it): m u d = m v d + I_O ω, and ωd − v = e u. Then
 *   ω = m u d (1 + e) / (I_O + m d²),  v = ωd − e u,  and the pin's impulse is the change in the
 *   system's linear momentum: J = M ω L/2 + m v − m u.
 * Free: linear momentum, angular momentum about G, and restitution.
 */
export function strikeBar({ M, L, m, u, d, e = 0, pinned = true }) {
  if (pinned) {
    const IO = (M * L * L) / 3;
    const w = (m * u * d * (1 + e)) / (IO + m * d * d);
    const v = w * d - e * u;
    const J = (M * w * L) / 2 + m * v - m * u;
    const T0 = 0.5 * m * u * u;
    const T1 = 0.5 * m * v * v + 0.5 * IO * w * w;
    return { w, v, vG: (w * L) / 2, J, T0, T1, loss: T0 - T1, IO, percussion: (2 * L) / 3 };
  }
  // The strike is `arm` from G along the bar; ω is taken so the struck point moves at v_G + ω·arm.
  // The contact impulse P gives the ball −P, the bar's centre P/M and its spin P·arm/I_G. Restitution,
  // (v_G + ω·arm) − v = e u, then fixes P: the bar acts at the contact like a mass 1/(1/M + arm²/I_G).
  const IG = (M * L * L) / 12;
  const arm = d - L / 2;
  const P = ((1 + e) * u) / (1 / m + 1 / M + (arm * arm) / IG);
  const v = u - P / m;
  const vG = P / M;
  const w = (P * arm) / IG;
  const T0 = 0.5 * m * u * u;
  const T1 = 0.5 * m * v * v + 0.5 * M * vG * vG + 0.5 * IG * w * w;
  return { w, v, vG, J: 0, T0, T1, loss: T0 - T1, IG };
}

/**
 * The pinned case again, with the pin's impulse as an unknown and no conservation law used: the
 * ball's impulse equation, the bar's linear and angular impulse equations about G, and restitution,
 * solved as one linear system for v, ω, P (the contact impulse) and J (the pin's).
 * Horizontal, positive in the direction the ball travels; the bar's top is the pin, y down.
 */
export function strikeBarByImpulses({ M, L, m, u, d, e = 0, pinned = true }) {
  const IG = (M * L * L) / 12;
  if (!pinned) {
    // Unknowns [v, v_G, ω]: linear momentum, angular momentum about G, and restitution.
    const arm = d - L / 2;
    const [v, vG, w] = solveLinear(
      [
        [m, M, 0],
        [m * arm, 0, IG],
        [-1, 1, arm],
      ],
      [m * u, m * u * arm, e * u],
    );
    return { v, vG, w, J: 0, P: m * (u - v) };
  }
  // Unknowns x = [v, w, P, J].
  //   ball:        m v − m u = −P
  //   bar, linear: M (w L/2) = P + J        (the centre moves at ω L/2 just after)
  //   bar, about G: IG w = P (d − L/2) − J (L/2)   (P below G and J at the top, both horizontal)
  //   restitution: w d − v = e u
  const A = [
    [m, 0, 1, 0],
    [0, (M * L) / 2, -1, -1],
    [0, IG, -(d - L / 2), L / 2],
    [-1, d, 0, 0],
  ];
  const [v, w, P, J] = solveLinear(A, [m * u, 0, 0, e * u]);
  return { v, w, P, J };
}

/**
 * A bat swung about the hands, treated as a fixed pivot over the millisecond of contact, meets a
 * pitch. I is the bat's moment of inertia about the hands, ω0 its angular velocity (positive toward
 * the pitch), u the pitch speed toward the bat, d the impact's distance from the hands.
 * About the hands: I ω0 − m u d = I ω1 + m v d, and restitution v − ω1 d = e (ω0 d + u).
 * The hands' impulse is the change in linear momentum: J = M x̄ (ω1 − ω0) + m (v + u), with x̄ the
 * mass centre's distance from the hands. It vanishes at the centre of percussion, d = I/(M x̄).
 */
export function batHit({ I, M, xbar, m, u, w0, d, e }) {
  const w1 = (I * w0 - m * d * u * (1 + e) - m * e * w0 * d * d) / (I + m * d * d);
  const v = w1 * d + e * (w0 * d + u);
  const J = M * xbar * (w1 - w0) + m * (v + u);
  return { w1, v, J, batSpeed: w0 * d, percussion: I / (M * xbar) };
}
