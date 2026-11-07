/**
 * Mass balance on a small square control volume in a two-dimensional flow. Our own construction.
 *
 * The net rate mass leaves the square is ∮ ρ v·n ds. By the divergence theorem it equals
 * ∫∫ ∇·(ρv) dA, and continuity says that is −∂ρ/∂t times the area: whatever leaves, the density
 * inside must fall to supply. Each field here has a uniform density that may change in time and a
 * velocity whose divergence is constant, so the closed form is ρ (∇·v) A. The second method sums
 * ρ v·n round the square's four sides by Simpson's rule, and reports the inflow and outflow apart.
 */
export const FIELDS = Object.freeze({
  corner: { name: 'Flow into a corner (incompressible)', v: (x, y, a) => [a * x, -a * y], div: () => 0, rho: 1000 },
  shear: { name: 'Shear flow (incompressible)', v: (x, y, a) => [a * y, 0], div: () => 0, rho: 1000 },
  piston: { name: 'Gas squeezed by a piston', v: (x, y, a) => [-a * x, 0], div: (a) => -a, rho: 1.2 },
  heated: { name: 'Gas expanding as it is heated', v: (x, y, a) => [a * x, a * y], div: (a) => 2 * a, rho: 1.2 },
});

/** Net mass outflow and the density's rate of change, by the closed form. */
export function cvClosed({ field, a, h }) {
  const f = FIELDS[field];
  const net = f.rho * f.div(a) * h * h;
  return { net, dRhoDt: -f.rho * f.div(a) };
}

/** Inflow, outflow and net by Simpson's rule round the square centred at (x0, y0), side h. */
export function cvNumeric({ field, a, h, x0, y0 }, n = 64) {
  const f = FIELDS[field];
  const m = n % 2 ? n + 1 : n;
  const w = (i) => (i === 0 || i === m ? 1 : i % 2 ? 4 : 2);
  const sides = [
    { p: (s) => [x0 + h / 2, y0 - h / 2 + s], n: [1, 0] },
    { p: (s) => [x0 - h / 2, y0 - h / 2 + s], n: [-1, 0] },
    { p: (s) => [x0 - h / 2 + s, y0 + h / 2], n: [0, 1] },
    { p: (s) => [x0 - h / 2 + s, y0 - h / 2], n: [0, -1] },
  ];
  let out = 0;
  let inn = 0;
  const per = [];
  for (const side of sides) {
    let sum = 0;
    let pos = 0;
    let neg = 0;
    for (let i = 0; i <= m; i++) {
      const [x, y] = side.p((i / m) * h);
      const [u, v] = f.v(x, y, a);
      const q = f.rho * (u * side.n[0] + v * side.n[1]);
      sum += w(i) * q;
      pos += w(i) * Math.max(q, 0);
      neg += w(i) * Math.min(q, 0);
    }
    const k = h / (3 * m);
    per.push(sum * k);
    out += pos * k;
    inn -= neg * k;
  }
  return { out, in: inn, net: out - inn, per };
}
