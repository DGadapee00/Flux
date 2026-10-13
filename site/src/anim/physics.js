/**
 * Dipole field: +q at (-sep, 0), −q at (sep, 0). k = 1.
 * Field lines are traced along E. The probe rides the line that leaves the
 * positive charge toward the negative one.
 */

const SEP = 0.9;

/**
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} q
 */
function coulomb(x, y, cx, cy, q) {
  const dx = x - cx;
  const dy = y - cy;
  const r2 = dx * dx + dy * dy;
  const r = Math.sqrt(r2);
  const r3 = r2 * r;
  if (r3 < 1e-9) return { x: 0, y: 0 };
  return { x: (q * dx) / r3, y: (q * dy) / r3 };
}

/**
 * @param {number} x
 * @param {number} y
 */
export function fieldAt(x, y) {
  const pos = coulomb(x, y, -SEP, 0, 1);
  const neg = coulomb(x, y, SEP, 0, -1);
  return { x: pos.x + neg.x, y: pos.y + neg.y };
}

/**
 * @param {number} angle Direction leaving the positive charge, radians.
 * @param {number} [steps]
 */
export function traceLine(angle, steps = 140) {
  const startR = 0.18;
  let x = -SEP + startR * Math.cos(angle);
  let y = startR * Math.sin(angle);
  /** @type {{x:number,y:number}[]} */
  const pts = [{ x, y }];
  const ds = 0.045;
  for (let i = 0; i < steps; i += 1) {
    const e = fieldAt(x, y);
    const mag = Math.hypot(e.x, e.y);
    if (mag < 1e-8) break;
    x += (ds * e.x) / mag;
    y += (ds * e.y) / mag;
    pts.push({ x, y });
    if (Math.hypot(x - SEP, y) < 0.2) break;
    if (Math.abs(x) > 3.2 || Math.abs(y) > 2.4) break;
  }
  return pts;
}

/**
 * Lines that run from the positive charge to the negative one.
 */
export function connectingLines() {
  /** @type {{x:number,y:number}[][]} */
  const lines = [];
  for (let i = 0; i < 13; i += 1) {
    const angle = -2.15 + (4.3 * i) / 12;
    const line = traceLine(angle);
    const end = line[line.length - 1];
    if (Math.hypot(end.x - SEP, end.y) < 0.22) lines.push(line);
  }
  return lines;
}

export const POSITIVE = { x: -SEP, y: 0 };
export const NEGATIVE = { x: SEP, y: 0 };

/** The probe's path, from + toward −. */
export function probePath() {
  return traceLine(0);
}
