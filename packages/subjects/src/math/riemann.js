/**
 * Double Riemann sums on a rectangle, and polar Riemann sums on a disk.
 * Sample points are a choice in each cell — midpoint, lower-left, or upper-right —
 * independent of the Simpson / closed-form integral used as route B.
 */

export function sampleCell(x0, y0, dx, dy, sample) {
  if (sample === 'll') return { x: x0, y: y0 };
  if (sample === 'ur') return { x: x0 + dx, y: y0 + dy };
  if (sample === 'lr') return { x: x0 + dx, y: y0 };
  return { x: x0 + 0.5 * dx, y: y0 + 0.5 * dy };
}

export function riemann1d(f, a, b, { n = 8, sample = 'mid' } = {}) {
  const nX = Math.max(1, n | 0);
  const dx = (b - a) / nX;
  let sum = 0;
  for (let i = 0; i < nX; i++) {
    const x0 = a + i * dx;
    const x =
      sample === 'left' || sample === 'll' ? x0 : sample === 'right' || sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
    sum += f(x) * dx;
  }
  return { sum, dx, n: nX };
}

export function riemannRect(f, xa, xb, ya, yb, { nx = 4, ny = 4, sample = 'mid' } = {}) {
  const nX = Math.max(1, nx | 0);
  const nY = Math.max(1, ny | 0);
  const dx = (xb - xa) / nX;
  const dy = (yb - ya) / nY;
  let sum = 0;
  for (let i = 0; i < nX; i++) {
    const x0 = xa + i * dx;
    for (let j = 0; j < nY; j++) {
      const y0 = ya + j * dy;
      const p = sampleCell(x0, y0, dx, dy, sample);
      sum += f(p.x, p.y) * dx * dy;
    }
  }
  return { sum, dx, dy, dA: dx * dy, nx: nX, ny: nY };
}

/**
 * Polar Riemann sum on the disk of radius R about the origin.
 * Each cell is Δr × Δθ; the area element is r* Δr Δθ at the sample radius.
 */
export function riemannPolar(f, R, { nr = 6, nth = 12, sample = 'mid' } = {}) {
  const nR = Math.max(1, nr | 0);
  const nTh = Math.max(1, nth | 0);
  const dr = R / nR;
  const dth = (2 * Math.PI) / nTh;
  let sum = 0;
  for (let i = 0; i < nR; i++) {
    for (let j = 0; j < nTh; j++) {
      const r0 = i * dr;
      const th0 = j * dth;
      let r;
      let th;
      if (sample === 'll') {
        r = r0;
        th = th0;
      } else if (sample === 'ur') {
        r = r0 + dr;
        th = th0 + dth;
      } else {
        r = r0 + 0.5 * dr;
        th = th0 + 0.5 * dth;
      }
      const rr = Math.max(r, 0);
      sum += f(rr * Math.cos(th), rr * Math.sin(th)) * rr * dr * dth;
    }
  }
  return { sum, dr, dth, nr: nR, nth: nTh };
}

/** Midpoint Riemann sum on a box in R³. */
export function riemann3(f, xa, xb, ya, yb, za, zb, { n = 4 } = {}) {
  const nX = Math.max(1, n | 0);
  const dx = (xb - xa) / nX;
  const dy = (yb - ya) / nX;
  const dz = (zb - za) / nX;
  let sum = 0;
  for (let i = 0; i < nX; i++) {
    const x = xa + (i + 0.5) * dx;
    for (let j = 0; j < nX; j++) {
      const y = ya + (j + 0.5) * dy;
      for (let k = 0; k < nX; k++) {
        const z = za + (k + 0.5) * dz;
        sum += f(x, y, z) * dx * dy * dz;
      }
    }
  }
  return { sum, dx, dy, dz, n: nX };
}
