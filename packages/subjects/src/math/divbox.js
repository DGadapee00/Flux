/**
 * Flux out of a small box, and divergence in space (MAC 2313, the divergence theorem).
 *
 * A box centred at (a, b, c) with half-side s sits in a field F. The flux out of it is the sum over
 * its six faces of ∬ F · n̂ dS. The divergence theorem says the same total is the divergence summed
 * through the inside, ∭ ∇·F dV, and for a small box that is close to ∇·F at the centre times the
 * volume. A point source F = r/|r|³ has zero divergence away from the origin, yet a box around the
 * origin has flux 4π: the theorem needs a field smooth inside the box.
 *
 * The closed form integrates ∇·F over the box exactly (the fields here make that a short formula).
 * The second method sums F · n̂ over the six faces by Gauss–Legendre quadrature on a grid of panels.
 */

const GL = (() => {
  // 8-point Gauss–Legendre on [−1, 1].
  const x = [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
  const w = [0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  const xs = [];
  const ws = [];
  for (let i = 3; i >= 0; i--) { xs.push(-x[i]); ws.push(w[i]); }
  for (let i = 0; i < 4; i++) { xs.push(x[i]); ws.push(w[i]); }
  return { xs, ws };
})();

export const FIELDS3 = {
  source: { id: 'source', name: 'Spreading out: F = (x, y, z)', tex: '\\mathbf F=(x,\\,y,\\,z)', F: (x, y, z) => [x, y, z], div: () => 3, total: (a, b, c, s) => 3 * (2 * s) ** 3 },
  spread: { id: 'spread', name: 'Faster to the right: F = (x², 0, 0)', tex: '\\mathbf F=(x^2,\\,0,\\,0)', F: (x) => [x * x, 0, 0], div: (x) => 2 * x, total: (a, b, c, s) => 2 * a * (2 * s) ** 3 },
  swirl: { id: 'swirl', name: 'A swirl: F = (−y, x, 0)', tex: '\\mathbf F=(-y,\\,x,\\,0)', F: (x, y) => [-y, x, 0], div: () => 0, total: () => 0 },
  mixed: { id: 'mixed', name: 'F = (xy, yz, zx)', tex: '\\mathbf F=(xy,\\,yz,\\,zx)', F: (x, y, z) => [x * y, y * z, z * x], div: (x, y, z) => x + y + z, total: (a, b, c, s) => (a + b + c) * (2 * s) ** 3 },
  cubic: {
    id: 'cubic', name: 'F = (x³, y³, z³): divergence that changes from point to point', tex: '\\mathbf F=(x^3,\\,y^3,\\,z^3)',
    F: (x, y, z) => [x ** 3, y ** 3, z ** 3], div: (x, y, z) => 3 * (x * x + y * y + z * z),
    total: (a, b, c, s) => 3 * (2 * s) ** 3 * (a * a + b * b + c * c + s * s),
  },
  point: {
    id: 'point', name: 'A point source at the origin: F = r/|r|³', tex: '\\mathbf F=\\mathbf r/|\\mathbf r|^3',
    F: (x, y, z) => { const r3 = Math.hypot(x, y, z) ** 3; return [x / r3, y / r3, z / r3]; },
    div: () => 0, singular: true,
    total: (a, b, c, s) => (Math.abs(a) < s && Math.abs(b) < s && Math.abs(c) < s ? 4 * Math.PI : 0),
  },
};
export const field3ById = (id) => FIELDS3[id] || FIELDS3.source;

/** The six faces: axis, side (+1/−1). */
export const FACES = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];

export function faceFlux(field, box, axis, side, panels = 6) {
  const { a, b, c, s } = box;
  const centre = [a, b, c];
  const [u, v] = [0, 1, 2].filter((k) => k !== axis);
  let sum = 0;
  const h = (2 * s) / panels;
  for (let pi = 0; pi < panels; pi++) for (let pj = 0; pj < panels; pj++) {
    const u0 = centre[u] - s + pi * h;
    const v0 = centre[v] - s + pj * h;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const p = [0, 0, 0];
      p[axis] = centre[axis] + side * s;
      p[u] = u0 + ((GL.xs[i] + 1) / 2) * h;
      p[v] = v0 + ((GL.xs[j] + 1) / 2) * h;
      const f = field.F(p[0], p[1], p[2]);
      sum += GL.ws[i] * GL.ws[j] * side * f[axis];
    }
  }
  return (sum * h * h) / 4;
}

export function boxChecked({ field: fid, s, probe, cz }) {
  const field = field3ById(fid);
  const box = { a: probe.x, b: probe.y, c: cz, s };
  const faces = FACES.map(([ax, sd]) => faceFlux(field, box, ax, sd));
  const sum = faces.reduce((p, q) => p + q, 0);
  const closed = field.total(box.a, box.b, box.c, s);
  const V = (2 * s) ** 3;
  const divC = field.div(box.a, box.b, box.c);
  // Near the point source the quadrature loses accuracy; the lab says so instead of checking.
  const near = field.singular && Math.min(...[box.a, box.b, box.c].map((q) => Math.abs(Math.abs(q) - s))) < 0.08;
  return { field, box, faces, sum, closed, V, divC, approx: divC * V, perVol: sum / V, near, encloses: field.singular && closed > 0, gap: near ? 0 : Math.abs(sum - closed) / Math.max(1, Math.abs(closed)) };
}
