/**
 * A spring-driven hinge deploying a panel: its torque margin by NASA-STD-5017B, and its motion. Our
 * own model.
 *
 * A torsion spring wound θ₀ past the stowed position drives the panel open through θ_d. At angle θ it
 * gives k(θ₀ − θ), least at the end of travel. Friction in the hinge and the bending of the wire
 * harness resist it; both vary with temperature and life, so the standard treats them as variable
 * torques T_v. Its Equation 4-1 gives the torque margin
 *   TM = T_avail/(FS_v Σ T_v + FS_f Σ T_f + FS_a T_a) − 1,
 * with safety factors by where the torques come from (its Table 1): 3.0 on variable torques from
 * analysis, 2.5 from qualification test, 2.0 from acceptance test at the environmental extremes.
 * TM ≥ 0 meets the requirement. Here there are no fixed torques, and no acceleration is required.
 *
 * Motion: with a constant resisting torque T_r the panel obeys I θ'' = k(θ₀ − θ) − T_r, simple
 * harmonic about θ_c = θ₀ − T_r/k at ω_n = √(k/I). From rest at θ = 0,
 *   θ(t) = θ_c (1 − cos ω_n t),
 * so it reaches θ_d at t = arccos(1 − θ_d/θ_c)/ω_n, with speed ω_n √(θ_d(2θ_c − θ_d)). The kinetic
 * energy at the latch is what the latch and hinge must absorb.
 * Second method: RK4 on the equation of motion, with friction that opposes the motion.
 */

/** NASA-STD-5017B Table 1: safety factors on variable, fixed and acceleration torques. */
export const TM_FACTORS = Object.freeze({
  analysis: { name: 'Theory or analysis', v: 3.0, f: 1.5, a: 1.25 },
  qual: { name: 'Qualification test', v: 2.5, f: 1.35, a: 1.15 },
  accept: { name: 'Acceptance test at the extremes', v: 2.0, f: 1.25, a: 1.1 },
});

/** Torque margin at the end of travel, where the spring is weakest. */
export function torqueMargin({ k, theta0, thetaD, friction, harness, source }) {
  const fs = TM_FACTORS[source];
  const avail = k * (theta0 - thetaD);
  return { avail, resist: friction + harness, tm: avail / (fs.v * (friction + harness)) - 1, fs };
}

/** Closed form for the deployment. Angles in radians, torques N·m, inertia kg·m². */
export function deployClosed({ k, I, theta0, thetaD, friction, harness }) {
  const Tr = friction + harness;
  const wn = Math.sqrt(k / I);
  const thetaC = theta0 - Tr / k;
  if (thetaC <= thetaD / 2) return { wn, thetaC, reaches: false, t: null, omega: null, energy: null };
  const t = Math.acos(1 - thetaD / thetaC) / wn;
  const omega = wn * Math.sqrt(thetaD * (2 * thetaC - thetaD));
  return { wn, thetaC, reaches: true, t, omega, energy: 0.5 * I * omega * omega };
}

/** Second method: RK4 until the panel reaches θ_d or stops. Returns the time, speed and path. */
export function deployStepped({ k, I, theta0, thetaD, friction, harness }, n = 4000) {
  const Tr = friction + harness;
  const wn = Math.sqrt(k / I);
  const h = (Math.PI / wn) / n; // half a natural period covers any deployment that completes
  const acc = (th, w) => (k * (theta0 - th) - Tr * (w >= 0 ? 1 : -1)) / I;
  let th = 0;
  let w = 0;
  let t = 0;
  const path = [[0, 0]];
  if (k * theta0 <= Tr) return { reaches: false, t: null, omega: null, path };
  for (let i = 0; i < 2 * n; i++) {
    const a1 = acc(th, w);
    const a2 = acc(th + (h / 2) * w, w + (h / 2) * a1);
    const a3 = acc(th + (h / 2) * (w + (h / 2) * a1), w + (h / 2) * a2);
    const a4 = acc(th + h * (w + (h / 2) * a2), w + h * a3);
    const thn = th + h * w + (h * h / 6) * (a1 + a2 + a3);
    const wnext = w + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    if (thn >= thetaD) {
      // Finish inside the step, on the angle, by the step's own velocity.
      const s = (thetaD - th) / (thn - th);
      t += s * h;
      const om = w + s * (wnext - w);
      path.push([t, thetaD]);
      return { reaches: true, t, omega: om, path };
    }
    if (wnext <= 0 && i > 0) return { reaches: false, t: null, omega: null, path, stopAt: thn };
    th = thn;
    w = wnext;
    t += h;
    if (i % 20 === 0) path.push([t, th]);
  }
  return { reaches: false, t: null, omega: null, path };
}

/** Both methods and the margin. */
export function hingeChecked(p) {
  const m = torqueMargin(p);
  const c = deployClosed(p);
  const s = deployStepped(p);
  const gap = c.reaches && s.reaches ? Math.max(Math.abs(s.t - c.t) / c.t, Math.abs(s.omega - c.omega) / c.omega) : c.reaches === s.reaches ? 0 : 1;
  return { ...m, ...c, stepT: s.t, stepOmega: s.omega, path: s.path, gap };
}
