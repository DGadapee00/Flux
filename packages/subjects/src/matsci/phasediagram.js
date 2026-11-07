/**
 * A binary isomorphous phase diagram, copper–nickel, from ideal solutions (EMA 3010).
 *
 * Copper and nickel mix in any proportion as liquid and as solid (α, FCC), and nearly ideally. Take
 * both phases as ideal solutions. At equilibrium each element has the same chemical potential in the
 * solid as in the liquid, which for element i gives
 *   x_i^α / x_i^L = k_i = exp[(ΔH_i/R)(1/T − 1/T_i)],
 * with T_i its melting point and ΔH_i its heat of fusion. With x_Cu = 1 − x_Ni this solves in closed
 * form for the tie line's ends at temperature T:
 *   x_L = (1 − k_Cu)/(k_Ni − k_Cu),   x_α = k_Ni x_L   (atom fraction nickel).
 * An alloy of overall composition x₀ between them splits by the lever rule:
 *   W_L = (x_α − x₀)/(x_α − x_L),   W_α = (x₀ − x_L)/(x_α − x_L)   (atom fractions).
 *
 * The second method is the common-tangent construction: with the Gibbs energy of each phase
 *   G_α(x) = RT[x ln x + (1 − x) ln(1 − x)],
 *   G_L(x) = (1 − x)ΔG_Cu + x ΔG_Ni + RT[x ln x + (1 − x) ln(1 − x)],   ΔG_i = ΔH_i(1 − T/T_i),
 * one straight line must touch both curves, at x_α and at x_L. The lab measures the slopes and the
 * intercepts there by finite differences and requires them to agree.
 */

export const R = 8.314;
export const CU = { name: 'Cu', Tm: 1358, dH: 13050 };
export const NI = { name: 'Ni', Tm: 1728, dH: 17480 };

const k = (el, T) => Math.exp((el.dH / R) * (1 / T - 1 / el.Tm));

/** The tie line's ends at T, or null outside the two-phase band. */
export function tieLine(T) {
  if (T <= CU.Tm || T >= NI.Tm) return null;
  const kCu = k(CU, T);
  const kNi = k(NI, T);
  const xL = (1 - kCu) / (kNi - kCu);
  return { xL, xS: kNi * xL };
}

/** Liquidus and solidus as (x, T) lists, from Cu's melting point to Ni's. */
export function boundaries(n = 120) {
  const liq = [[0, CU.Tm]];
  const sol = [[0, CU.Tm]];
  for (let i = 1; i < n; i++) {
    const T = CU.Tm + ((NI.Tm - CU.Tm) * i) / n;
    const t = tieLine(T);
    liq.push([t.xL, T]);
    sol.push([t.xS, T]);
  }
  liq.push([1, NI.Tm]);
  sol.push([1, NI.Tm]);
  return { liq, sol };
}

const mix = (x, T) => (x <= 0 || x >= 1 ? 0 : R * T * (x * Math.log(x) + (1 - x) * Math.log(1 - x)));
export const dG = (el, T) => el.dH * (1 - T / el.Tm);
export const gSolid = (x, T) => mix(x, T);
export const gLiquid = (x, T) => (1 - x) * dG(CU, T) + x * dG(NI, T) + mix(x, T);

/** Slope and intercept at x = 0 of the tangent to g at x, by central differences. */
function tangent(g, x, T, h = Math.min(1e-6, x / 10, (1 - x) / 10)) {
  const slope = (g(x + h, T) - g(x - h, T)) / (2 * h);
  return { slope, intercept: g(x, T) - slope * x };
}

/** Where the alloy sits at (x₀, T): the phases, their compositions and amounts, and the check. */
export function phaseState({ x0, T }) {
  const t = tieLine(T);
  let region;
  if (!t) region = T >= NI.Tm ? 'liquid' : 'solid';
  else if (x0 <= t.xL) region = 'liquid';
  else if (x0 >= t.xS) region = 'solid';
  else region = 'two';
  let WL = region === 'liquid' ? 1 : region === 'solid' ? 0 : (t.xS - x0) / (t.xS - t.xL);
  let gap = 0;
  let tangentLine = null;
  if (t) {
    const a = tangent(gSolid, t.xS, T);
    const b = tangent(gLiquid, t.xL, T);
    gap = Math.max(Math.abs(a.slope - b.slope), Math.abs(a.intercept - b.intercept)) / (R * T);
    tangentLine = { slope: (a.slope + b.slope) / 2, intercept: (a.intercept + b.intercept) / 2 };
  }
  // The mass balance closes by construction; check it too.
  if (region === 'two') gap = Math.max(gap, Math.abs(WL * t.xL + (1 - WL) * t.xS - x0));
  WL = Math.min(1, Math.max(0, WL));
  return {
    region,
    tie: t,
    xL: t ? t.xL : null,
    xS: t ? t.xS : null,
    WL,
    WS: 1 - WL,
    tangentLine,
    gap,
  };
}
