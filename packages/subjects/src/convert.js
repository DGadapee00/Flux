/**
 * Exact unit conversions shared by the mechanics and thermal courses.
 * Pure numbers. No DOM.
 *
 * Definitions, exact:
 *   1 ft = 0.3048 m
 *   1 lbm = 0.45359237 kg
 *   1 lbf = 1 lbm × 9.80665 m/s²
 *   1 Btu = 1055.05585262 J
 *   1 R = 5/9 K
 *
 * Derived from those: the inch (ft/12), psi, the slug, ft·lbf, and the
 * mechanical horsepower (550 ft·lbf/s). Rankine and kelvin share a zero, so
 * the same factor converts a temperature and a temperature difference.
 *
 * Standard gravity here defines the pound-force. A problem that states
 * g = 9.81 m/s² or 32.2 ft/s² is using a rounded working value, not this constant.
 *
 * Checked by test/convert.test.js.
 */

/** Metres in one international foot. */
export const M_PER_FT = 0.3048;

/** Kilograms in one pound-mass. */
export const KG_PER_LBM = 0.45359237;

/** Standard gravity, m/s². Defines the pound-force. */
export const G_STANDARD = 9.80665;

/** Joules in one international-table Btu. */
export const J_PER_BTU = 1055.05585262;

/** Kelvins in one rankine. Both scales start at absolute zero. */
export const K_PER_R = 5 / 9;

/** Foot-pounds-force per second in one mechanical horsepower. */
export const FT_LBF_PER_S_PER_HP = 550;

/** Newtons in one pound-force: 1 lbm × standard gravity. */
export const N_PER_LBF = KG_PER_LBM * G_STANDARD;

/** Metres in one inch. One foot is twelve inches. */
export const M_PER_IN = M_PER_FT / 12;

/** Metres in one international mile: 5280 feet, so 1609.344 m exactly. */
export const M_PER_MI = 5280 * M_PER_FT;

/** Metres in one kilometre. */
export const M_PER_KM = 1000;

/** Seconds in one minute and in one hour. */
export const S_PER_MIN = 60;
export const S_PER_H = 3600;

/** Metres in one international nautical mile, exactly. A knot is one nautical mile per hour. */
export const M_PER_NMI = 1852;

/** Metres per second in one kilometre per hour: 1000 m in 3600 s, so 1/3.6. */
export const MPS_PER_KMH = M_PER_KM / S_PER_H;

/** Metres per second in one knot. */
export const MPS_PER_KNOT = M_PER_NMI / S_PER_H;

/** Radians per second in one revolution per minute: 2π radians in 60 s. */
export const RAD_S_PER_RPM = (2 * Math.PI) / S_PER_MIN;

/** Cubic metres in one US gallon: 231 cubic inches, exactly. */
export const M3_PER_GAL_US = 231 * M_PER_IN ** 3;

/** Pascals in one pound-force per square inch. */
export const PA_PER_PSI = N_PER_LBF / M_PER_IN ** 2;

/**
 * Kilograms in one slug. A slug is the mass that one pound-force accelerates
 * at one foot per second squared.
 */
export const KG_PER_SLUG = N_PER_LBF / M_PER_FT;

/** Joules in one foot-pound-force. */
export const J_PER_FT_LBF = N_PER_LBF * M_PER_FT;

/** Watts in one mechanical horsepower. */
export const W_PER_HP = FT_LBF_PER_S_PER_HP * J_PER_FT_LBF;

/**
 * Multiply a quantity in `unit` by this factor to get the SI quantity
 * (m, kg, N, Pa, J, W, or K).
 */
export const SI_FACTORS = Object.freeze({
  m: 1,
  ft: M_PER_FT,
  in: M_PER_IN,
  mi: M_PER_MI,
  km: M_PER_KM,
  kg: 1,
  lbm: KG_PER_LBM,
  slug: KG_PER_SLUG,
  N: 1,
  lbf: N_PER_LBF,
  Pa: 1,
  psi: PA_PER_PSI,
  J: 1,
  'ft·lbf': J_PER_FT_LBF,
  Btu: J_PER_BTU,
  W: 1,
  hp: W_PER_HP,
  K: 1,
  R: K_PER_R,
});

/** Which quantity a unit measures, so a length is not silently divided by a mass. */
const KIND = Object.freeze({
  m: 'length',
  ft: 'length',
  in: 'length',
  mi: 'length',
  km: 'length',
  kg: 'mass',
  lbm: 'mass',
  slug: 'mass',
  N: 'force',
  lbf: 'force',
  Pa: 'pressure',
  psi: 'pressure',
  J: 'energy',
  'ft·lbf': 'energy',
  Btu: 'energy',
  W: 'power',
  hp: 'power',
  K: 'temperature',
  R: 'temperature',
});

function factor(unit) {
  const k = SI_FACTORS[unit];
  if (typeof k !== 'number') throw new TypeError(`unknown unit: ${unit}`);
  return k;
}

/** `value` in `unit`, expressed in the matching SI unit. */
export function toSI(value, unit) {
  return value * factor(unit);
}

/** An SI quantity, expressed in `unit`. */
export function fromSI(value, unit) {
  return value / factor(unit);
}

/**
 * Convert `value` from one of these units to another of the same kind.
 * A length to a mass throws.
 */
export function convert(value, from, to) {
  const left = factor(from);
  const right = factor(to);
  if (KIND[from] !== KIND[to]) throw new TypeError(`cannot convert ${from} to ${to}`);
  return (value * left) / right;
}
