/**
 * Thermodynamic properties: water and steam (IAPWS-IF97 regions 1, 2 and 4), ideal gases (NASA
 * polynomials from GRI-Mech 3.0 and NASA Glenn), isentropic flow, and generated property tables.
 *
 * Pure functions, no DOM. The only import outside this folder is ../convert.js, for the exact unit
 * definitions. SI base units throughout: K, Pa, m³/kg, J/kg, J/(kg·K). units.js converts to kPa,
 * kJ and the English units.
 *
 * Anything outside what is implemented throws a ThermoRangeError that names the region or limit:
 * IF97 region 3 (near the critical point), region 5, a species outside its fitted range.
 * Problem generators keep to states where `covered(T, p)` holds.
 *
 * Checked by selftest.js and test/thermo.test.js.
 */
export {
  ThermoRangeError, R_WATER, T_CRIT, P_CRIT, pB23, tB23, psat, tsat, region,
} from './if97.js';
export { waterTP, satT, satP, mixT, mixP, waterP, waterTv, WATER_LIMITS } from './water.js';
export {
  R_UNIVERSAL, P_STANDARD, T_REF, AIR, SPECIES, cpR, hRT, sR, cpMolar, hMolar, s0Molar, molarMass, gas, isentropicT, speciesInfo,
} from './idealgas.js';
export { temperatureRatio, pressureRatio, densityRatio, areaRatio, machFromArea, chokedMassFlux } from './isentropic.js';
export {
  SAT_T_GRID, SAT_P_GRID, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, COMPRESSED_P_GRID, COMPRESSED_T_GRID,
  satTableT, satTableP, superheatTable, compressedTable, bracket, lerp, tableInterp, tableInterp2, printed,
} from './tables.js';
export { FACTORS, SYSTEMS, toBase, fromBase, fromC, toC, fromF, toF, inUnits } from './units.js';

import { covered as coveredIF97 } from './if97.js';

/** True when water at T (K) and p (Pa) is in IF97 region 1 or 2, the states this library covers. */
export const covered = (T, p) => coveredIF97(T, p / 1e6);
