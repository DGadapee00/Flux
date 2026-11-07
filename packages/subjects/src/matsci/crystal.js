/**
 * Crystal structures and packing (EMA 3010 unit 1).
 *
 * Metal atoms are modelled as hard spheres of radius R that touch along a close-packed direction.
 * Where they touch fixes the cell size a:
 *   simple cubic (SC)   along an edge:            a = 2R,       N = 1 atom per cell
 *   body-centred (BCC)  along the body diagonal:  a = 4R/√3,    N = 2
 *   face-centred (FCC)  along a face diagonal:    a = 2√2 R,    N = 4
 *   hexagonal (HCP)     in the basal plane:       a = 2R, c = √(8/3) a, 6 atoms per hexagonal prism
 * The atomic packing factor is APF = N (4/3)πR³ / V_cell, and the density ρ = N A / (V_cell N_A).
 * FCC and ideal HCP fill 74% of space, BCC 68% and SC 52%.
 *
 * The second method (packingByGrid) counts the points of a fine grid in the cell that lie inside
 * any atom, wrapping round the cell's faces, with none of the closed forms.
 */

export const NA = 6.022e23;

/** Fractional positions of the atoms in a rectangular cell (a × b × c), and that cell's shape. */
const BASIS = {
  sc: { cell: (a) => [a, a, a], atoms: [[0, 0, 0]] },
  bcc: { cell: (a) => [a, a, a], atoms: [[0, 0, 0], [0.5, 0.5, 0.5]] },
  fcc: { cell: (a) => [a, a, a], atoms: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]] },
  // HCP in its orthorhombic cell, a × √3 a × c, which holds four atoms.
  hcp: { cell: (a) => [a, Math.sqrt(3) * a, Math.sqrt(8 / 3) * a], atoms: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 5 / 6, 0.5], [0, 1 / 3, 0.5]] },
};

export const STRUCTURES = {
  sc: { name: 'Simple cubic', N: 1, coordination: 6, aOfR: (R) => 2 * R, touch: 'along a cube edge' },
  bcc: { name: 'Body-centred cubic', N: 2, coordination: 8, aOfR: (R) => (4 * R) / Math.sqrt(3), touch: 'along the body diagonal' },
  fcc: { name: 'Face-centred cubic', N: 4, coordination: 12, aOfR: (R) => 2 * Math.SQRT2 * R, touch: 'along a face diagonal' },
  hcp: { name: 'Hexagonal close-packed', N: 6, coordination: 12, aOfR: (R) => 2 * R, touch: 'in the basal plane' },
};

/** The cell's volume for lattice parameter a: a³ for the cubics, the hexagonal prism (3√3/2)a²c for HCP. */
export function cellVolume(structure, a) {
  if (structure === 'hcp') return ((3 * Math.sqrt(3)) / 2) * a * a * Math.sqrt(8 / 3) * a;
  return a ** 3;
}

/**
 * Closed forms. R in nm, A in g/mol; `grow` is the atoms' radius as a share of the touching radius
 * (1 = touching). Returns a (nm), the cell volume (nm³), APF and density (g/cm³).
 */
export function crystal({ structure, R, A, grow = 1 }) {
  const st = STRUCTURES[structure];
  const a = st.aOfR(R);
  const V = cellVolume(structure, a);
  const r = grow * R;
  const apf = (st.N * (4 / 3) * Math.PI * r ** 3) / V;
  const density = (st.N * A) / (V * 1e-21 * NA);
  return { ...st, structure, a, c: structure === 'hcp' ? Math.sqrt(8 / 3) * a : a, V, r, apf, density };
}

/** The packing fraction by counting n³ grid points in the rectangular cell that lie inside an atom. */
export function packingByGrid(structure, R, grow = 1, n = 90) {
  const a = STRUCTURES[structure].aOfR(R);
  const [Lx, Ly, Lz] = BASIS[structure].cell(a);
  const atoms = BASIS[structure].atoms.map(([x, y, z]) => [x * Lx, y * Ly, z * Lz]);
  const r2 = (grow * R) ** 2;
  const wrap = (d, L) => d - L * Math.round(d / L);
  let inside = 0;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * Lx;
    for (let j = 0; j < n; j++) {
      const y = ((j + 0.5) / n) * Ly;
      for (let k = 0; k < n; k++) {
        const z = ((k + 0.5) / n) * Lz;
        for (const [ax, ay, az] of atoms) {
          const dx = wrap(x - ax, Lx);
          const dy = wrap(y - ay, Ly);
          const dz = wrap(z - az, Lz);
          if (dx * dx + dy * dy + dz * dz <= r2) {
            inside++;
            break;
          }
        }
      }
    }
  }
  return inside / n ** 3;
}
