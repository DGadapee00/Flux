/**
 * Node and mesh analysis of resistive circuits (EEL 3111 unit 2).
 *
 * A circuit is a list of branches. Branch k runs from node a to node b and holds a resistor R_k in
 * series with an EMF V_k that pushes current from a to b, so its current is
 *   i_k = (v_a − v_b + V_k)/R_k.
 * Node 0 is ground.
 *
 * Nodal analysis: Kirchhoff's current law at every other node. With A the node–branch incidence
 * (+1 where a branch leaves a node, −1 where it enters), this is
 *   (A R⁻¹ Aᵀ) v = −A R⁻¹ V,   G = A R⁻¹ Aᵀ,
 * one equation per non-ground node.
 *
 * Mesh analysis: Kirchhoff's voltage law round every window of a planar drawing. With B the
 * mesh–branch incidence (+1 where the mesh runs with the branch, −1 against it) and loop currents I,
 * the branch currents are Bᵀ I and
 *   (B R Bᵀ) I = B V,
 * one equation per mesh: branches − nodes + 1 of them.
 *
 * The two routes share nothing but the circuit, and must give the same branch currents.
 */
import { gaussJordan } from '../math/linalg.js';

const solve = (M, rhs) => {
  const inv = gaussJordan(M).inverse;
  return inv.map((row) => row.reduce((s, v, j) => s + v * rhs[j], 0));
};

/** Nodal analysis: node voltages (index 0 is ground, 0 V), branch currents, and the G matrix. */
export function nodal(nodes, branches) {
  const n = nodes - 1;
  const A = Array.from({ length: n }, () => branches.map(() => 0));
  branches.forEach((br, k) => {
    if (br.a > 0) A[br.a - 1][k] += 1;
    if (br.b > 0) A[br.b - 1][k] -= 1;
  });
  const G = A.map((ri) => A.map((rj) => branches.reduce((s, br, k) => s + (ri[k] * rj[k]) / br.R, 0)));
  const rhs = A.map((ri) => -branches.reduce((s, br, k) => s + (ri[k] * br.V) / br.R, 0));
  const v = [0, ...solve(G, rhs)];
  const i = branches.map((br) => (v[br.a] - v[br.b] + br.V) / br.R);
  return { G, rhs, v, i, equations: n };
}

/** Mesh analysis: loop currents, branch currents, and the R matrix. meshes: lists of [branch, ±1]. */
export function mesh(branches, meshes) {
  const B = meshes.map((m) => {
    const row = branches.map(() => 0);
    for (const [k, s] of m) row[k] = s;
    return row;
  });
  const Z = B.map((bi) => B.map((bj) => branches.reduce((s, br, k) => s + bi[k] * bj[k] * br.R, 0)));
  const rhs = B.map((bi) => branches.reduce((s, br, k) => s + bi[k] * br.V, 0));
  const I = solve(Z, rhs);
  const i = branches.map((_, k) => B.reduce((s, bi, m) => s + bi[k] * I[m], 0));
  return { Z, rhs, I, i, equations: meshes.length };
}

/** Both routes, and the largest difference in any branch current as a share of the largest current. */
export function analyse({ nodes, branches, meshes }) {
  const nd = nodal(nodes, branches);
  const ms = mesh(branches, meshes);
  const big = Math.max(...nd.i.map(Math.abs), 1e-300);
  const gap = Math.max(...nd.i.map((x, k) => Math.abs(x - ms.i[k]))) / big;
  return { nodal: nd, mesh: ms, gap, independentLoops: branches.length - nodes + 1 };
}
