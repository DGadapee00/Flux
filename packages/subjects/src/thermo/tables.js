/**
 * Property tables generated from the library, and the linear interpolation a student does on them.
 *
 * Flux prints its own tables from IF97. It copies none from a textbook. The grids are round numbers
 * in °C, kPa and MPa, held here in K and Pa. A cell in region 3 or outside regions 1 and 2 is left
 * out of a table, with the reason, never extrapolated.
 *
 * Grading: a student reading a table interpolates linearly between the two rows around their value.
 * That answer differs from the exact one, most where the property curves (p_sat, or v near the
 * dome). tableInterp computes it, so a problem can pass it as `alt` and accept both answers.
 */
import { ThermoRangeError } from './if97.js';
import { fromC } from './units.js';
import { satP, satT, waterTP } from './water.js';

const range = (a, b, step) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => a + i * step);

/** Saturation by temperature, °C: the triple point, every 5 °C to 100, then every 10 °C to 350. */
export const SAT_T_GRID = Object.freeze([0.01, ...range(5, 100, 5), ...range(110, 350, 10)].map(fromC));

/** Saturation by pressure, kPa, from 1 kPa to 16 MPa. */
export const SAT_P_GRID = Object.freeze(
  [
    1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400,
    450, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000,
    9000, 10000, 12000, 14000, 16000,
  ].map((kPa) => kPa * 1e3),
);

/** Superheated vapour: pressures in MPa, temperatures every 50 °C from 50 to 800 °C. */
export const SUPERHEAT_P_GRID = Object.freeze(
  [0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12.5, 15, 17.5, 20, 25, 30, 40, 50, 60].map(
    (MPa) => MPa * 1e6,
  ),
);
export const SUPERHEAT_T_GRID = Object.freeze(range(50, 800, 50).map(fromC));

/** Compressed liquid: pressures in MPa, temperatures every 20 °C from 0 to 340 °C. */
export const COMPRESSED_P_GRID = Object.freeze([5, 10, 15, 20, 30, 50].map((MPa) => MPa * 1e6));
export const COMPRESSED_T_GRID = Object.freeze([0.01, ...range(20, 340, 20)].map(fromC));

/** The saturation table by temperature: one row per grid temperature. */
export const satTableT = (grid = SAT_T_GRID) => grid.map((T) => satT(T));

/** The saturation table by pressure: one row per grid pressure. */
export const satTableP = (grid = SAT_P_GRID) => grid.map((p) => satP(p));

function cell(T, p) {
  try {
    const s = waterTP(T, p);
    return { T, p, v: s.v, u: s.u, h: s.h, s: s.s, phase: s.phase };
  } catch (e) {
    if (e instanceof ThermoRangeError) return { T, p, skip: e.region === 3 ? 'region 3' : 'outside', reason: e.message };
    throw e;
  }
}

/**
 * The superheated-vapour table: for each pressure, the saturated vapour row (when the pressure has
 * one) and then each grid temperature above saturation.
 */
export function superheatTable(pressures = SUPERHEAT_P_GRID, temps = SUPERHEAT_T_GRID) {
  return pressures.map((p) => {
    let sat = null;
    try {
      sat = satP(p);
    } catch (e) {
      if (!(e instanceof ThermoRangeError)) throw e;
    }
    const rows = temps.filter((T) => !sat || T > sat.T).map((T) => cell(T, p));
    return { p, Tsat: sat ? sat.T : null, sat: sat && { T: sat.T, v: sat.vg, u: sat.ug, h: sat.hg, s: sat.sg }, rows };
  });
}

/** The compressed-liquid table: for each pressure, the grid temperatures below saturation. */
export function compressedTable(pressures = COMPRESSED_P_GRID, temps = COMPRESSED_T_GRID) {
  return pressures.map((p) => {
    let sat = null;
    try {
      sat = satP(p);
    } catch (e) {
      if (!(e instanceof ThermoRangeError)) throw e;
    }
    const rows = temps.filter((T) => !sat || T < sat.T).map((T) => cell(T, p));
    return { p, Tsat: sat ? sat.T : null, sat: sat && { T: sat.T, v: sat.vf, u: sat.uf, h: sat.hf, s: sat.sf }, rows };
  });
}

/** The two grid nodes around x, in increasing order. Throws when x is off the grid. */
export function bracket(grid, x) {
  const g = [...grid].sort((a, b) => a - b);
  if (!(x >= g[0] && x <= g[g.length - 1])) throw new RangeError(`${x} is outside the table, ${g[0]} to ${g[g.length - 1]}`);
  for (let i = 0; i < g.length - 1; i++) if (x <= g[i + 1]) return [g[i], g[i + 1]];
  return [g[g.length - 2], g[g.length - 1]];
}

/** Linear interpolation through (x0, y0) and (x1, y1). */
export const lerp = (x0, y0, x1, y1, x) => (x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));

/**
 * What a student gets by reading f from the table and interpolating linearly in x: f at the two
 * grid nodes around x, joined by a straight line. At a grid node it is f there exactly.
 * `print` rounds each table entry first, the way the printed table shows it.
 */
export function tableInterp(f, grid, x, print = (y) => y) {
  const [x0, x1] = bracket(grid, x);
  if (x === x0) return print(f(x0));
  if (x === x1) return print(f(x1));
  return lerp(x0, print(f(x0)), x1, print(f(x1)), x);
}

/**
 * Double interpolation, as on a superheated table between two pressures and two temperatures:
 * interpolate in y at each bracketing x, then in x.
 */
export function tableInterp2(f, gridX, gridY, x, y, print = (v) => v) {
  const [x0, x1] = bracket(gridX, x);
  const at = (xi) => tableInterp((yy) => f(xi, yy), gridY, y, print);
  return x === x0 ? at(x0) : lerp(x0, at(x0), x1, at(x1), x);
}

/** A value rounded to `sig` significant figures, as a table prints it. */
export function printed(value, sig = 4) {
  if (value === 0 || !Number.isFinite(value)) return value;
  return Number(value.toPrecision(sig));
}
