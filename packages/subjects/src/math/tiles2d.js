/**
 * Why the divergence theorem holds: cut a square region into n × n cells and add up each cell's flux.
 *
 * Every inner face is shared by two cells, and its flux leaves one and enters the other, so in the
 * sum of all the cells' fluxes the inner faces cancel and only the outer boundary is left. That sum
 * is exact for any n. The divergence enters through each small cell: its flux is close to div F at
 * its centre times its area, and the sum of those, a midpoint Riemann sum, closes in on the flux as
 * the cells shrink. Our own construction, in the plane; in space the faces cancel the same way.
 *
 * Each side's flux is integrated by Simpson's rule, exact for the polynomial fields used here.
 */
const sideFlux = (f, n) => {
  // Simpson on [0, 1] with n points; f(t) gives F·n at the point t along the side.
  const m = n % 2 ? n + 1 : n;
  let s = 0;
  for (let i = 0; i <= m; i++) s += (i === 0 || i === m ? 1 : i % 2 ? 4 : 2) * f(i / m);
  return s / (3 * m);
};

/** Outward flux of F = (P, Q) through the square cell [x0, x0 + h] × [y0, y0 + h]. */
export function cellFlux(field, x0, y0, h, n = 8) {
  const right = sideFlux((t) => field.P(x0 + h, y0 + t * h), n) * h;
  const left = -sideFlux((t) => field.P(x0, y0 + t * h), n) * h;
  const top = sideFlux((t) => field.Q(x0 + t * h, y0 + h), n) * h;
  const bottom = -sideFlux((t) => field.Q(x0 + t * h, y0), n) * h;
  return right + left + top + bottom;
}

/**
 * The region centred at (a, b) with half-side s, cut into n × n cells. Returns the outer flux, the
 * sum of the cells' fluxes, the flux through every inner face (positive in +x or +y), the total that
 * cancels, and the midpoint sum of the divergence.
 */
export function tiles(field, { a, b, s, n }) {
  const h = (2 * s) / n;
  const x0 = a - s;
  const y0 = b - s;
  const outer = cellFlux(field, x0, y0, 2 * s, 16);
  let cells = 0;
  let midpoint = 0;
  const perCell = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const f = cellFlux(field, x0 + i * h, y0 + j * h, h);
      perCell.push(f);
      cells += f;
      midpoint += field.div(x0 + (i + 0.5) * h, y0 + (j + 0.5) * h) * h * h;
    }
  }
  const faces = [];
  let cancelled = 0;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Vertical inner face at x = x0 + i h, flux in +x; horizontal at y = y0 + i h, flux in +y.
      const v = sideFlux((t) => field.P(x0 + i * h, y0 + (j + t) * h), 8) * h;
      const w = sideFlux((t) => field.Q(x0 + (j + t) * h, y0 + i * h), 8) * h;
      faces.push({ x: x0 + i * h, y: y0 + (j + 0.5) * h, nx: 1, ny: 0, flux: v });
      faces.push({ x: x0 + (j + 0.5) * h, y: y0 + i * h, nx: 0, ny: 1, flux: w });
      cancelled += 2 * (Math.abs(v) + Math.abs(w));
    }
  }
  return { h, outer, cells, midpoint, faces, cancelled, perCell };
}
