/**
 * The unit-load (virtual work) method, and a direct-stiffness truss solve to check it. Pure, SI.
 * virtualwork-selftest.js compares the two, and the beam integral with closed forms.
 */
import { memberForce, solveTruss } from './truss.js';

const len = (joints, p, q) => Math.hypot(joints[q].x - joints[p].x, joints[q].y - joints[p].y);
const AEof = (AE, p, q) => (typeof AE === 'function' ? AE(p, q) : AE);

/**
 * Virtual work on a determinate truss. Put a unit load at the joint, along the direction wanted,
 * and find the member forces n it causes. Then let the real loads act: the unit load rides through
 * the joint's real displacement Δ while each member's virtual force n rides through its real
 * stretch NL/AE. Work balances: 1·Δ = Σ n N L/AE.
 */
export function unitLoadTruss(truss, AE, at, dir) {
  // The joint solver works in three components; a plane truss sits at z = 0.
  const joints = Object.fromEntries(Object.entries(truss.joints).map(([k, p]) => [k, { x: p.x, y: p.y, z: 0 }]));
  const real = solveTruss({ ...truss, joints });
  const unit = solveTruss({ ...truss, joints, loads: { [at]: { x: dir[0], y: dir[1] } } });
  let delta = 0;
  const rows = truss.members.map(([p, q]) => {
    const N = memberForce(real, p, q);
    const n = memberForce(unit, p, q);
    const L = len(truss.joints, p, q);
    const term = (n * N * L) / AEof(AE, p, q);
    delta += term;
    return { member: `${p}${q}`, N, n, L, term };
  });
  return { delta, rows };
}

/** Gaussian elimination with partial pivoting, for the small systems a hand truss makes. */
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-30) throw new Error('trussStiffness: the truss is a mechanism');
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * Direct stiffness: each bar adds (AE/L) e eᵀ to its two joints' blocks; supports remove the
 * restrained directions; K u = F gives the joint displacements, and N = (AE/L) e·(u_q − u_p).
 * Works for indeterminate trusses too.
 */
export function trussStiffness(truss, AE) {
  const names = Object.keys(truss.joints);
  const idx = Object.fromEntries(names.map((n, i) => [n, i]));
  const nd = 2 * names.length;
  const K = Array.from({ length: nd }, () => new Array(nd).fill(0));
  const F = new Array(nd).fill(0);
  const bars = truss.members.map(([p, q]) => {
    const L = len(truss.joints, p, q);
    const e = [(truss.joints[q].x - truss.joints[p].x) / L, (truss.joints[q].y - truss.joints[p].y) / L];
    const k = AEof(AE, p, q) / L;
    const dofs = [2 * idx[p], 2 * idx[p] + 1, 2 * idx[q], 2 * idx[q] + 1];
    const g = [-e[0], -e[1], e[0], e[1]];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[dofs[i]][dofs[j]] += k * g[i] * g[j];
    return { p, q, L, e, k, dofs, g };
  });
  for (const [j, l] of Object.entries(truss.loads || {})) {
    F[2 * idx[j]] += l.x || 0;
    F[2 * idx[j] + 1] += l.y || 0;
  }
  const fixed = new Set();
  for (const [j, kind] of Object.entries(truss.supports || {})) {
    if (kind === 'pin' || kind === 'rollerX') fixed.add(2 * idx[j]);
    if (kind === 'pin' || kind === 'rollerY') fixed.add(2 * idx[j] + 1);
  }
  const free = [...Array(nd).keys()].filter((d) => !fixed.has(d));
  const u = new Array(nd).fill(0);
  const sol = solveLinear(free.map((r) => free.map((c) => K[r][c])), free.map((r) => F[r]));
  free.forEach((d, i) => { u[d] = sol[i]; });
  const disp = Object.fromEntries(names.map((n) => [n, { x: u[2 * idx[n]], y: u[2 * idx[n] + 1] }]));
  const forces = Object.fromEntries(bars.map((b) => [`${b.p}${b.q}`, b.k * b.dofs.reduce((s, d, i) => s + b.g[i] * u[d], 0)]));
  return { disp, forces };
}

/** Unit load on a beam: Δ = ∫ m M/EI dx, by Simpson's rule on n panels (n even). */
export function unitLoadBeam(M, m, L, EI, n = 2000) {
  const h = L / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    const x = i * h;
    s += (w * m(x) * M(x)) / EI;
  }
  return (s * h) / 3;
}
