/**
 * Momentum balance on a control volume: a water jet on a curved vane (EML 3015, Following the flow).
 *
 * A jet of area A and speed V strikes a vane that moves away from the nozzle at U and turns the jet
 * through θ. In the vane's frame the flow is steady, the water arrives at w = V − U, and with no
 * friction it leaves at w along the vane's tip. The momentum balance on a control volume round the
 * vane gives the force on the vane as the momentum flux in minus out:
 *   F_x = ρ A w² (1 − cos θ)   along the jet,   F_y = ρ A w² sin θ   across it,
 * because a single vane moving away receives only ρAw of water each second. So the force depends on
 * the relative speed: half the jet's speed is a quarter of the force. The power delivered, F_x U, is
 * largest at U = V/3.
 *
 * The second route adds up the push along the vane. Water turning on an arc of radius R at speed w
 * needs ρ A w²/R of force per unit length toward the arc's centre; over a length R dφ that is
 * ρ A w² dφ along n̂ = (−sin φ, cos φ). Simpson's rule integrates it from 0 to θ, and the vane feels
 * the opposite.
 */
export const RHO = 998;

export function vaneForce({ V, U, theta, d }) {
  const A = (Math.PI * d * d) / 4;
  const w = V - U;
  const th = (theta * Math.PI) / 180;
  const mdot = RHO * A * w;
  const Fx = mdot * w * (1 - Math.cos(th));
  const Fy = mdot * w * Math.sin(th);

  const q = RHO * A * w * w; // push on the water per radian of turning
  const n = 200;
  const h = th / n;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i <= n; i++) {
    const phi = i * h;
    const wt = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    sx += wt * -Math.sin(phi);
    sy += wt * Math.cos(phi);
  }
  const onWater = [(q * sx * h) / 3, (q * sy * h) / 3];
  // The vane feels the opposite: along the jet −onWater[0], and across it onWater[1] in size.
  const FxArc = -onWater[0];
  const FyArc = onWater[1];
  const power = Fx * U;
  const gap = Math.hypot(FxArc - Fx, FyArc - Fy) / Math.max(Math.hypot(Fx, Fy), 1e-12);
  return { A, w, mdot, Fx, Fy, FxArc, FyArc, F: Math.hypot(Fx, Fy), power, gap };
}
