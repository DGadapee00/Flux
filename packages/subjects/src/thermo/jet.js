/**
 * Bypass ratio and propulsive efficiency (EML 3101, jet propulsion).
 *
 * One engine core, flying at V₀ = 250 m/s, adds the same jet power P = 40 MW to the air it handles.
 * With bypass ratio B the fan moves B kilograms of air past the core for every kilogram through it,
 * so the total flow is ṁ(1 + B), all accelerated to one exit speed. From P = ½ṁ(1 + B)(V_e² − V₀²),
 *   V_e = √(V₀² + 2P/ṁ(1 + B)),   F = ṁ(1 + B)(V_e − V₀),   η_p = 2/(1 + V_e/V₀).
 * More air at a lower speed gives more thrust from the same power: the energy left in the wake,
 * ½ṁ(1 + B)(V_e − V₀)², shrinks.
 *
 * The second route goes through energy: the thrust power FV₀ is the jet power times η_p, so
 * F = η_p P/V₀.
 */

export const CORE = { mdot: 100, V0: 250, P: 40e6, tsfcK: 1 };

export function jetClosed({ B }) {
  const { mdot, V0, P } = CORE;
  const m = mdot * (1 + B);
  const Ve = Math.sqrt(V0 * V0 + (2 * P) / m);
  const F = m * (Ve - V0);
  const eta = 2 / (1 + Ve / V0);
  return { m, Ve, F, eta, wake: 0.5 * m * (Ve - V0) ** 2, thrustPower: F * V0 };
}

export function jetChecked(state) {
  const cf = jetClosed(state);
  const Fe = (cf.eta * CORE.P) / CORE.V0;
  return { ...cf, Fenergy: Fe, gap: Math.abs(Fe - cf.F) / cf.F };
}
