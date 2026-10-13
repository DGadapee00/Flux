/**
 * A hill f = exp(-(x² + y²)). Level curves are circles. The arrow follows
 * gradient ascent, which climbs toward the peak.
 */

/**
 * @param {number} x
 * @param {number} y
 */
export function height(x, y) {
  return Math.exp(-(x * x + y * y));
}

/**
 * @param {number} x
 * @param {number} y
 */
export function gradient(x, y) {
  const f = height(x, y);
  return { x: -2 * x * f, y: -2 * y * f, f };
}

/** Contour values, outer to inner. */
export const LEVELS = [0.15, 0.35, 0.55, 0.75];

/**
 * @param {number} level
 */
export function levelRadius(level) {
  return Math.sqrt(-Math.log(level));
}

/**
 * Gradient ascent from a point on the slope. f increases at every step.
 * @param {number} [steps]
 */
export function climb(steps = 48) {
  let x = 0.92;
  let y = 0.62;
  /** @type {{x:number,y:number,f:number}[]} */
  const path = [];
  for (let i = 0; i < steps; i += 1) {
    const g = gradient(x, y);
    path.push({ x, y, f: g.f });
    const mag = Math.hypot(g.x, g.y);
    if (mag < 1e-6) break;
    const step = Math.min(0.05, Math.hypot(x, y) * 0.45);
    if (step < 1e-3) break;
    x += (step * g.x) / mag;
    y += (step * g.y) / mag;
  }
  return path;
}
