/**
 * A small pipe network fed by a pump (EML 3015, pipe systems and pumps).
 *
 * A pump lifts water from a sump through a trunk pipe to junction J. From J two pipes in parallel,
 * A and B, rejoin and climb a riser to a shower z_s above the sump; a downstairs tap also draws from J.
 * Each pipe's loss is Darcy–Weisbach with Churchill's friction factor, which joins laminar to
 * Colebrook's turbulent values smoothly; the shower head
 * and the tap add minor losses K V²/2g.
 *
 *   pump:      H_p(Q) = H₀ [1 − (Q/Q_max)²],
 *   trunk:     H_p(Q) − h_trunk(Q) = H_J,           Q = Q_s + Q_t,
 *   parallel:  h_A(Q_A) = h_B(Q_B) = h_par,        Q_A + Q_B = Q_s,
 *   shower:    H_J − z_s = h_par + h_riser(Q_s) + K_s V_s²/2g,
 *   tap:       H_J = h_tap(Q_t) + K_t V_t²/2g.
 * Parallel pipes share one head loss and add their flows, so the split is set by equal losses, not by
 * area. Opening the tap draws more through the trunk, which lowers H_J, which starves the shower.
 *
 * First method: a bracketed root solve on the junction head H_J, with the shower path solved through
 * the parallel pair's shared loss and each pipe's flow by inverting its own loss. Second method: Newton's method on all the flows at once, from a different start, with a
 * finite-difference Jacobian. They must agree.
 */
import { G } from './headloss.js';

export const NET = {
  trunk: { D: 0.02, L: 20 },
  A: { D: 0.015, L: 10 },
  riser: { D: 0.015, L: 4 },
  tap: { D: 0.015, L: 2 },
  zs: 6,
  Ks: 10,
  Kopen: 2,
  eps: 1.5e-6,
  Qmax: 0.0015,
};

const area = (D) => (Math.PI * D * D) / 4;
const minor = (K, Q, D) => (K * (Q / area(D)) ** 2) / (2 * G);
const NU = 1.0e-6; // water, 20 °C

/**
 * Churchill's friction factor (1977): one smooth formula through laminar, transitional and turbulent
 * flow. A network solver needs the loss to be continuous in Q; Colebrook beside 64/Re jumps at
 * Re = 2300, and a branch running near it would have no flow that matches its loss.
 */
export function churchill(Re, rel) {
  const A = (2.457 * Math.log(1 / ((7 / Re) ** 0.9 + 0.27 * rel))) ** 16;
  const B = (37530 / Re) ** 16;
  return 8 * ((8 / Re) ** 12 + (A + B) ** -1.5) ** (1 / 12);
}

/** Friction loss in a pipe, m, for Q ≥ 0. */
const pipe = (Q, { D, L }) => {
  if (Q <= 0) return 0;
  const V = Q / area(D);
  return (churchill((V * D) / NU, NET.eps / D) * (L / D) * V * V) / (2 * G);
};

/** The network for a state: branch B's diameter (m), the tap opening (0 shut to 1 open), the pump's shut-off head. */
export function network({ DB, open, H0 }) {
  const B = { D: DB, L: 2 };
  const pump = (Q) => H0 * (1 - (Q / NET.Qmax) ** 2);
  const Kt = open > 0 ? NET.Kopen / (open * open) : Infinity;
  const hA = (Q) => pipe(Q, NET.A);
  const hB = (Q) => pipe(Q, B);
  const showerTail = (Q) => pipe(Q, NET.riser) + minor(NET.Ks, Q, NET.riser.D);
  const tapLoss = (Q) => (open > 0 ? pipe(Q, NET.tap) + minor(Kt, Q, NET.tap.D) : 0);
  return { B, pump, hA, hB, showerTail, tapLoss, Kt, H0, open };
}

/**
 * A root of an increasing function g on [lo, hi] by regula falsi with the Illinois fix: bracketed like
 * bisection, but converging in a handful of steps on these smooth curves.
 */
function root(g, lo, hi, tol = 1e-13) {
  let glo = g(lo);
  let ghi = g(hi);
  if (glo >= 0) return lo;
  if (ghi <= 0) return hi;
  let side = 0;
  let x = lo;
  for (let k = 0; k < 100; k++) {
    x = (lo * ghi - hi * glo) / (ghi - glo);
    const gx = g(x);
    if (gx > 0) {
      hi = x;
      ghi = gx;
      if (side === -1) glo /= 2;
      side = -1;
    } else {
      lo = x;
      glo = gx;
      if (side === 1) ghi /= 2;
      side = 1;
    }
    if (hi - lo < tol * Math.max(1, Math.abs(x)) || gx === 0) break;
  }
  return x;
}

/** The flow through a loss function h(Q) that gives a head drop of target. */
function invert(h, target) {
  if (target <= 0) return 0;
  let hi = 0.002;
  while (h(hi) < target) hi *= 2;
  return root((Q) => h(Q) - target, 0, hi);
}

/** The shower path as a function of the parallel pair's shared loss h_p: its flow and its total drop. */
function showerAt(n, hp) {
  const QA = invert(n.hA, hp);
  const QB = invert(n.hB, hp);
  return { QA, QB, Qs: QA + QB, drop: hp + n.showerTail(QA + QB) };
}

/** First method: an outer solve on the junction head, the shower path solved through h_p. */
export function solveByJunction(state) {
  const n = network(state);
  const shower = (HJ) => {
    const drop = HJ - NET.zs;
    if (drop <= 0) return { QA: 0, QB: 0, Qs: 0, hp: 0 };
    let hi = drop;
    const hp = root((h) => showerAt(n, h).drop - drop, 0, hi);
    return { ...showerAt(n, hp), hp };
  };
  const at = (HJ) => {
    const sh = shower(HJ);
    const Qt = state.open > 0 ? invert(n.tapLoss, HJ) : 0;
    const Q = sh.Qs + Qt;
    return { sh, Qt, Q, r: HJ - (n.pump(Q) - pipe(Q, NET.trunk)) };
  };
  const HJ = root((h) => at(h).r, 0, state.H0, 1e-12);
  const { sh, Qt, Q } = at(HJ);
  return { HJ, Q, Qs: sh.Qs, Qt, QA: sh.QA, QB: sh.QB, hp: sh.hp, n };
}

/** Second method: Newton on (Q_A, Q_B, Q_t), starting from a guess. */
export function solveByNewton(state, guess) {
  const n = network(state);
  const tapOpen = state.open > 0;
  const showerOn = guess.showerOn !== false;
  // The unknowns: (Q_A, Q_B) while the shower flows, then Q_t while the tap is open.
  const pack = (QA, QB, Qt) => [...(showerOn ? [QA, QB] : []), ...(tapOpen ? [Qt] : [])];
  const unpack = (v) => (showerOn ? { QA: v[0], QB: v[1], Qt: tapOpen ? v[2] : 0 } : { QA: 0, QB: 0, Qt: v[0] });
  let x = pack(guess[0], guess[1], guess[2]);
  const F = (v) => {
    const { QA, QB, Qt } = unpack(v);
    const Qs = QA + QB;
    const Q = Qs + Qt;
    const HJ = n.pump(Q) - pipe(Q, NET.trunk);
    const r = showerOn ? [n.hA(QA) - n.hB(QB), HJ - NET.zs - n.hA(QA) - n.showerTail(Qs)] : [];
    if (tapOpen) r.push(HJ - n.tapLoss(Qt));
    return r;
  };
  for (let it = 0; it < 60; it++) {
    const f = F(x);
    const m = x.length;
    const J = [];
    for (let j = 0; j < m; j++) {
      const h = 1e-9 + 1e-6 * Math.abs(x[j]);
      const xp = x.slice();
      xp[j] += h;
      const fp = F(xp);
      for (let i = 0; i < m; i++) {
        J[i] = J[i] || [];
        J[i][j] = (fp[i] - f[i]) / h;
      }
    }
    const dx = gaussSolve(J, f.map((v) => -v));
    let step = 1;
    // Keep every flow positive.
    for (let j = 0; j < m; j++) if (x[j] + step * dx[j] <= 0) step = Math.min(step, (0.5 * x[j]) / -dx[j]);
    x = x.map((v, j) => v + step * dx[j]);
    if (Math.max(...dx.map(Math.abs)) < 1e-13) break;
  }
  return unpack(x);
}

function gaussSolve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j];
    }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Both methods, the split against the naive guesses, and the pump and system curves. */
export function networkChecked(state) {
  const a = solveByJunction(state);
  // Newton starts well away from the first answer; a starved shower drops out of its unknowns.
  const guess = [0.6 * a.QA + 1e-5, 1.3 * a.QB + 1e-5, 0.7 * a.Qt + 1e-5];
  guess.showerOn = a.Qs > 0;
  const b = state.open > 0 || a.Qs > 0 ? solveByNewton(state, guess) : { QA: 0, QB: 0, Qt: 0 };
  const scale = Math.max(a.Q, 1e-9);
  const gap = Math.max(Math.abs(a.QA - b.QA), Math.abs(a.QB - b.QB), Math.abs(a.Qt - b.Qt)) / scale;
  const areaShare = area(NET.A.D) / (area(NET.A.D) + area(state.DB));
  return {
    ...a,
    gap,
    shareA: a.Qs > 0 ? a.QA / a.Qs : 0,
    areaShare,
    Hpump: a.n.pump(a.Q),
    trunkLoss: pipe(a.Q, NET.trunk),
  };
}

/**
 * The system curve: the head the pump must deliver to push a total flow Q through the network, with
 * the tap as it is set, and the pump's own curve beside it. They cross at the operating point.
 */
export function curves(state, n = 40) {
  const net = network(state);
  const flowAt = (HJ) => {
    const drop = HJ - NET.zs;
    let Qs = 0;
    if (drop > 0) {
      const hp = root((h) => showerAt(net, h).drop - drop, 0, drop);
      Qs = showerAt(net, hp).Qs;
    }
    return Qs + (state.open > 0 ? invert(net.tapLoss, HJ) : 0);
  };
  const out = [];
  for (let i = 0; i <= n; i++) {
    const Q = (NET.Qmax * i) / n;
    let hi = 10;
    while (flowAt(hi) < Q) hi *= 2;
    const HJ = Q === 0 ? (state.open > 0 ? 0 : NET.zs) : root((h) => flowAt(h) - Q, 0, hi);
    out.push({ Q, system: HJ + pipe(Q, NET.trunk), pump: net.pump(Q) });
  }
  return out;
}
