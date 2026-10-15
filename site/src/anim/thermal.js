/**
 * A Carnot cycle on a P–v diagram, for an ideal gas with R = 1.
 * 1 → 2 isothermal expansion at T_H, 2 → 3 adiabatic expansion,
 * 3 → 4 isothermal compression at T_L, 4 → 1 adiabatic compression.
 * The enclosed area is the net work. The test checks it against
 * R (T_H − T_L) ln(v2/v1), a second calculation.
 */

export const K = 5 / 3;
export const T_HOT = 1;
export const T_COLD = 0.75;
const V1 = 1;
const V2 = 1.8;
const STEPS = 40;

/**
 * Specific volumes of the four corners. Along an adiabat T v^(k−1) is constant.
 */
export function corners() {
  const stretch = (T_HOT / T_COLD) ** (1 / (K - 1));
  return { v1: V1, v2: V2, v3: V2 * stretch, v4: V1 * stretch };
}

/**
 * @param {number} T
 * @param {number} v
 */
function isotherm(T, v) {
  return T / v;
}

/**
 * Pressure on the adiabat through (v0, p0).
 * @param {number} v0
 * @param {number} p0
 * @param {number} v
 */
function adiabat(v0, p0, v) {
  return p0 * (v0 / v) ** K;
}

/**
 * @param {number} from
 * @param {number} to
 * @param {(v: number) => number} pressure
 */
function leg(from, to, pressure) {
  const points = [];
  for (let i = 0; i <= STEPS; i += 1) {
    const v = from + ((to - from) * i) / STEPS;
    points.push({ x: v, y: pressure(v) });
  }
  return points;
}

/**
 * The closed path, leg by leg, in the order the state travels it.
 */
export function carnotCycle() {
  const { v1, v2, v3, v4 } = corners();
  const p2 = isotherm(T_HOT, v2);
  const p4 = isotherm(T_COLD, v4);
  const legs = [
    leg(v1, v2, (v) => isotherm(T_HOT, v)),
    leg(v2, v3, (v) => adiabat(v2, p2, v)),
    leg(v3, v4, (v) => isotherm(T_COLD, v)),
    leg(v4, v1, (v) => adiabat(v4, p4, v)),
  ];
  const path = legs.flatMap((points, i) => (i === 0 ? points : points.slice(1)));
  return { legs, path };
}

/**
 * Area of a closed polygon by the shoelace formula. Clockwise on P–v is positive work.
 * @param {{x:number,y:number}[]} points
 */
export function enclosedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return -sum / 2;
}

/** Net work per unit mass from the two isotherms: the adiabats' works cancel. */
export function netWork() {
  const { v1, v2 } = corners();
  return (T_HOT - T_COLD) * Math.log(v2 / v1);
}

/** Heat taken in along the hot isotherm. */
export function heatIn() {
  const { v1, v2 } = corners();
  return T_HOT * Math.log(v2 / v1);
}
