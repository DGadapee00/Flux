/**
 * IAPWS-IF97, the industrial formulation for water and steam: regions 1, 2 and 4 only.
 *
 * Source: IAPWS, Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic
 * Properties of Water and Steam (IAPWS R7-97, 2012). Equation and table numbers below are that
 * release's. The coefficients are typed from it.
 *
 *   region 1  compressed liquid   273.15 K ≤ T ≤ 623.15 K, p_sat(T) ≤ p ≤ 100 MPa
 *   region 2  superheated vapour  273.15 K ≤ T ≤ 623.15 K, 0 < p ≤ p_sat(T)
 *                                 623.15 K < T ≤ 863.15 K, 0 < p ≤ p_B23(T)
 *                                 863.15 K < T ≤ 1073.15 K, 0 < p ≤ 100 MPa
 *   region 4  the saturation line, 273.15 K ≤ T ≤ 647.096 K
 *
 * Region 3 (near the critical point, above 623.15 K and above the B23 line) and region 5 (above
 * 1073.15 K) are not implemented. A state there throws a ThermoRangeError that says so, and so does
 * any state outside the validity range. Nothing is extrapolated.
 *
 * Units here are the release's: T in K, p in MPa, v in m³/kg, u, h in kJ/kg, s, cp, cv in
 * kJ/(kg·K), w in m/s. water.js converts to SI base units for the rest of the library.
 */

/** Specific gas constant of water, kJ/(kg·K) (Eq. 1). */
export const R_WATER = 0.461526;
/** Critical temperature, K, and pressure, MPa (Eqs. 2 and 3). */
export const T_CRIT = 647.096;
export const P_CRIT = 22.064;
/** The triple-point temperature, and the edges of the regions covered here. */
export const T_MIN = 273.15;
export const T_13 = 623.15;
export const T_25 = 1073.15;
export const T_B23_MAX = 863.15;
export const P_MAX = 100;

/** A state this library does not cover. `region` is 3, 5, or 'outside'. */
export class ThermoRangeError extends RangeError {
  constructor(message, region) {
    super(message);
    this.name = 'ThermoRangeError';
    this.region = region;
  }
}

const fmt = (x, d = 6) => Number(x.toPrecision(d)).toString();

// ---------- B23, the boundary between regions 2 and 3 (Table 1, Eqs. 5 and 6) ----------

const B23 = [0.34805185628969e3, -0.11671859879975e1, 0.10192970039326e-2, 0.57254459862746e3, 0.13918839778870e2];

/** Pressure on the region 2–3 boundary, MPa, for 623.15 K ≤ T ≤ 863.15 K. */
export function pB23(T) {
  return B23[0] + B23[1] * T + B23[2] * T * T;
}

/** Temperature on the region 2–3 boundary, K, for 16.5292 MPa ≤ p ≤ 100 MPa. */
export function tB23(p) {
  return B23[3] + Math.sqrt((p - B23[4]) / B23[2]);
}

// ---------- Region 4, the saturation line (Table 34, Eqs. 30 and 31) ----------

const N4 = [
  0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7,
  0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3,
];

/** Lowest saturation pressure, MPa: p_sat at 273.15 K. */
export const P_MIN_SAT = 0.000611212677444;

/** Saturation pressure, MPa, from the region 4 equation (Eq. 30). */
export function psat(T) {
  if (!(T >= T_MIN && T <= T_CRIT)) {
    throw new ThermoRangeError(`IF97: saturation needs ${T_MIN} K ≤ T ≤ ${T_CRIT} K; got T = ${fmt(T)} K.`, 'outside');
  }
  const th = T + N4[8] / (T - N4[9]);
  const A = th * th + N4[0] * th + N4[1];
  const B = N4[2] * th * th + N4[3] * th + N4[4];
  const C = N4[5] * th * th + N4[6] * th + N4[7];
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4;
}

/** Saturation temperature, K, from the backward region 4 equation (Eq. 31). */
export function tsat(p) {
  if (!(p >= P_MIN_SAT * (1 - 1e-12) && p <= P_CRIT)) {
    throw new ThermoRangeError(`IF97: saturation needs ${P_MIN_SAT} MPa ≤ p ≤ ${P_CRIT} MPa; got p = ${fmt(p)} MPa.`, 'outside');
  }
  const b = p ** 0.25;
  const E = b * b + N4[2] * b + N4[5];
  const F = N4[0] * b * b + N4[3] * b + N4[6];
  const G = N4[1] * b * b + N4[4] * b + N4[7];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  return (N4[9] + D - Math.sqrt((N4[9] + D) ** 2 - 4 * (N4[8] + N4[9] * D))) / 2;
}

/** p_sat at 623.15 K, where region 4 leaves the part that regions 1 and 2 bound: 16.5292 MPa. */
export const P_13 = psat(T_13);

// ---------- Region 1 (Table 2, Eq. 7) ----------

const R1 = [
  [0, -2, 0.14632971213167], [0, -1, -0.84548187169114], [0, 0, -0.3756360367204e1], [0, 1, 0.33855169168385e1],
  [0, 2, -0.95791963387872], [0, 3, 0.15772038513228], [0, 4, -0.16616417199501e-1], [0, 5, 0.81214629983568e-3],
  [1, -9, 0.28319080123804e-3], [1, -7, -0.60706301565874e-3], [1, -1, -0.18990068218419e-1], [1, 0, -0.32529748770505e-1],
  [1, 1, -0.21841717175414e-1], [1, 3, -0.5283835796993e-4], [2, -3, -0.47184321073267e-3], [2, 0, -0.30001780793026e-3],
  [2, 1, 0.47661393906987e-4], [2, 3, -0.44141845330846e-5], [2, 17, -0.72694996297594e-15], [3, -4, -0.31679644845054e-4],
  [3, 0, -0.28270797985312e-5], [3, 6, -0.85205128120103e-9], [4, -5, -0.22425281908e-5], [4, -2, -0.65171222895601e-6],
  [4, 10, -0.14341729937924e-12], [5, -8, -0.40516996860117e-6], [8, -11, -0.12734301741641e-8], [8, -6, -0.17424871230634e-9],
  [21, -29, -0.68762131295531e-18], [23, -31, 0.14478307828521e-19], [29, -38, 0.26335781662795e-22],
  [30, -39, -0.11947622640071e-22], [31, -40, 0.18228094581404e-23], [32, -41, -0.93537087292458e-25],
];

/** Region 1 properties at (T K, p MPa), with no range check. */
export function region1Raw(T, p) {
  const pi = p / 16.53;
  const tau = 1386 / T;
  const a = 7.1 - pi;
  const b = tau - 1.222;
  let g = 0;
  let gp = 0;
  let gpp = 0;
  let gt = 0;
  let gtt = 0;
  let gpt = 0;
  for (const [I, J, n] of R1) {
    const aI = a ** I;
    const bJ = b ** J;
    g += n * aI * bJ;
    gp += -n * I * a ** (I - 1) * bJ;
    gpp += n * I * (I - 1) * a ** (I - 2) * bJ;
    gt += n * aI * J * b ** (J - 1);
    gtt += n * aI * J * (J - 1) * b ** (J - 2);
    gpt += -n * I * a ** (I - 1) * J * b ** (J - 1);
  }
  const RT = R_WATER * T;
  const cp = -R_WATER * tau * tau * gtt;
  return {
    T,
    p,
    v: (pi * gp * RT) / (p * 1000),
    u: RT * (tau * gt - pi * gp),
    h: RT * tau * gt,
    s: R_WATER * (tau * gt - g),
    g: RT * g,
    cp,
    cv: R_WATER * (-tau * tau * gtt + (gp - tau * gpt) ** 2 / gpp),
    w: Math.sqrt(1000 * RT * (gp * gp) / ((gp - tau * gpt) ** 2 / (tau * tau * gtt) - gpp)),
  };
}

// ---------- Region 2 (Tables 10 and 11, Eqs. 15–17) ----------

const R2_IDEAL = [
  [0, -0.96927686500217e1], [1, 0.10086655968018e2], [-5, -0.5608791128302e-2], [-4, 0.71452738081455e-1],
  [-3, -0.40710498223928], [-2, 0.14240819171444e1], [-1, -0.4383951131945e1], [2, -0.28408632460772],
  [3, 0.21268463753307e-1],
];

const R2_RES = [
  [1, 0, -0.17731742473213e-2], [1, 1, -0.17834862292358e-1], [1, 2, -0.45996013696365e-1], [1, 3, -0.57581259083432e-1],
  [1, 6, -0.5032527872793e-1], [2, 1, -0.33032641670203e-4], [2, 2, -0.18948987516315e-3], [2, 4, -0.39392777243355e-2],
  [2, 7, -0.43797295650573e-1], [2, 36, -0.26674547914087e-4], [3, 0, 0.20481737692309e-7], [3, 1, 0.43870667284435e-6],
  [3, 3, -0.3227767723857e-4], [3, 6, -0.15033924542148e-2], [3, 35, -0.40668253562649e-1], [4, 1, -0.78847309559367e-9],
  [4, 2, 0.12790717852285e-7], [4, 3, 0.48225372718507e-6], [5, 7, 0.22922076337661e-5], [6, 3, -0.16714766451061e-10],
  [6, 16, -0.21171472321355e-2], [6, 35, -0.23895741934104e2], [7, 0, -0.5905956432427e-17], [7, 11, -0.12621808899101e-5],
  [7, 25, -0.38946842435739e-1], [8, 8, 0.11256211360459e-10], [8, 36, -0.82311340897998e1], [9, 13, 0.19809712802088e-7],
  [10, 4, 0.10406965210174e-18], [10, 10, -0.10234747095929e-12], [10, 14, -0.10018179379511e-8], [16, 29, -0.80882908646985e-10],
  [16, 50, 0.10693031879409], [18, 57, -0.33662250574171], [20, 20, 0.89185845355421e-24], [20, 35, 0.30629316876232e-12],
  [20, 48, -0.42002467698208e-5], [21, 21, -0.59056029685639e-25], [22, 53, 0.37826947613457e-5], [23, 39, -0.12768608934681e-14],
  [24, 26, 0.73087610595061e-28], [24, 40, 0.55414715350778e-16], [24, 58, -0.9436970724121e-6],
];

/** Region 2 properties at (T K, p MPa), with no range check. */
export function region2Raw(T, p) {
  const pi = p;
  const tau = 540 / T;
  let g0 = Math.log(pi);
  let g0t = 0;
  let g0tt = 0;
  for (const [J, n] of R2_IDEAL) {
    g0 += n * tau ** J;
    g0t += n * J * tau ** (J - 1);
    g0tt += n * J * (J - 1) * tau ** (J - 2);
  }
  const g0p = 1 / pi;
  const b = tau - 0.5;
  let gr = 0;
  let grp = 0;
  let grpp = 0;
  let grt = 0;
  let grtt = 0;
  let grpt = 0;
  for (const [I, J, n] of R2_RES) {
    const pI = pi ** I;
    const bJ = b ** J;
    gr += n * pI * bJ;
    grp += n * I * pi ** (I - 1) * bJ;
    grpp += n * I * (I - 1) * pi ** (I - 2) * bJ;
    grt += n * pI * J * b ** (J - 1);
    grtt += n * pI * J * (J - 1) * b ** (J - 2);
    grpt += n * I * pi ** (I - 1) * J * b ** (J - 1);
  }
  const RT = R_WATER * T;
  const cp = -R_WATER * tau * tau * (g0tt + grtt);
  const x = 1 + pi * grp - tau * pi * grpt;
  return {
    T,
    p,
    v: (pi * (g0p + grp) * RT) / (p * 1000),
    u: RT * (tau * (g0t + grt) - pi * (g0p + grp)),
    h: RT * tau * (g0t + grt),
    s: R_WATER * (tau * (g0t + grt) - (g0 + gr)),
    g: RT * (g0 + gr),
    cp,
    cv: cp - (R_WATER * x * x) / (1 - pi * pi * grpp),
    w: Math.sqrt(
      (1000 * RT * (1 + 2 * pi * grp + pi * pi * grp * grp)) /
        (1 - pi * pi * grpp + (x * x) / (tau * tau * (g0tt + grtt))),
    ),
  };
}

// ---------- Which region a (T, p) state is in ----------

/**
 * The IF97 region of (T K, p MPa): 1 or 2. Throws a ThermoRangeError for region 3, region 5,
 * a state on the saturation line (give a quality instead), and anything outside the validity range.
 */
export function region(T, p) {
  if (!Number.isFinite(T) || !Number.isFinite(p)) throw new ThermoRangeError('IF97: T and p must be finite numbers.', 'outside');
  if (T < T_MIN) throw new ThermoRangeError(`IF97: T = ${fmt(T)} K is below 273.15 K, outside the formulation.`, 'outside');
  if (p <= 0) throw new ThermoRangeError(`IF97: p = ${fmt(p)} MPa must be above zero.`, 'outside');
  if (p > P_MAX) throw new ThermoRangeError(`IF97: p = ${fmt(p)} MPa is above 100 MPa, outside the formulation.`, 'outside');
  if (T > T_25) {
    throw new ThermoRangeError(
      `IF97: T = ${fmt(T)} K is above 1073.15 K. That is region 5 or beyond, which this library does not cover.`,
      T <= 2273.15 && p <= 50 ? 5 : 'outside',
    );
  }
  if (T <= T_13) {
    const ps = psat(T);
    if (p === ps) {
      throw new ThermoRangeError(`IF97: T = ${fmt(T)} K, p = ${fmt(p)} MPa is on the saturation line. Give a quality.`, 4);
    }
    return p > ps ? 1 : 2;
  }
  if (T <= T_B23_MAX && p >= pB23(T)) {
    throw new ThermoRangeError(
      `IF97: T = ${fmt(T)} K, p = ${fmt(p)} MPa is in region 3, near the critical point, which this library does not cover.`,
      3,
    );
  }
  return 2;
}

/** True when (T K, p MPa) is in region 1 or 2. Problem generators keep to states where this holds. */
export function covered(T, p) {
  try {
    region(T, p);
    return true;
  } catch (e) {
    if (e instanceof ThermoRangeError) return false;
    throw e;
  }
}

/** Properties at (T K, p MPa) in region 1 or 2, with the region. Throws outside them. */
export function propsTP(T, p) {
  const r = region(T, p);
  return { region: r, ...(r === 1 ? region1Raw(T, p) : region2Raw(T, p)) };
}
