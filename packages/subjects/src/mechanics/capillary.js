/**
 * Capillary rise in a glass tube (EML 3015, surface tension).
 *
 * Where a liquid meets glass at contact angle θ, surface tension σ pulls along the wall with a
 * force 2πrσ cos θ per tube. The column rises until its weight balances that pull (Jurin):
 *   h = 2σ cos θ / (ρ g r).
 * The rise goes as 1/r: a narrower tube draws the liquid higher. Mercury does not wet glass
 * (θ ≈ 140°), so cos θ < 0 and it sinks below the outside level.
 *
 * The second method finds the same height from energy: raising the column by h gains σ cos θ · 2πrh
 * of surface energy and costs ½ρgπr²h² of potential energy. It minimises the total numerically by
 * golden-section search.
 */

export const G = 9.81;
export const LIQUIDS = {
  water: { name: 'Water on clean glass', sigma: 0.0728, theta: 0, rho: 998 },
  ethanol: { name: 'Ethanol', sigma: 0.0223, theta: 0, rho: 789 },
  mercury: { name: 'Mercury', sigma: 0.485, theta: 140, rho: 13534 },
};

export function riseClosed({ liquid, rmm }) {
  const L = LIQUIDS[liquid];
  const r = rmm / 1000;
  const c = Math.cos((L.theta * Math.PI) / 180);
  const h = (2 * L.sigma * c) / (L.rho * G * r);
  return { r, h, hmm: h * 1000, cos: c, dp: (2 * L.sigma * c) / r };
}

export function riseNumeric({ liquid, rmm }) {
  const L = LIQUIDS[liquid];
  const r = rmm / 1000;
  const c = Math.cos((L.theta * Math.PI) / 180);
  const E = (h) => 0.5 * L.rho * G * Math.PI * r * r * h * h - 2 * Math.PI * r * L.sigma * c * h;
  let lo = -1;
  let hi = 1;
  const g = (Math.sqrt(5) - 1) / 2;
  let x1 = hi - g * (hi - lo);
  let x2 = lo + g * (hi - lo);
  let f1 = E(x1);
  let f2 = E(x2);
  for (let i = 0; i < 200; i++) {
    if (f1 < f2) {
      hi = x2; x2 = x1; f2 = f1; x1 = hi - g * (hi - lo); f1 = E(x1);
    } else {
      lo = x1; x1 = x2; f1 = f2; x2 = lo + g * (hi - lo); f2 = E(x2);
    }
  }
  return (lo + hi) / 2;
}

export function riseChecked(state) {
  const cf = riseClosed(state);
  const hn = riseNumeric(state);
  return { ...cf, hNum: hn, gap: Math.abs(hn - cf.h) / Math.abs(cf.h) };
}
