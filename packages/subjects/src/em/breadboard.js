/**
 * A solderless breadboard as a circuit. Holes are joined underneath in strips, and every strip is
 * one node (a net). A part is placed by naming the two holes its legs go into, and the circuit is the
 * parts drawn between nets. Pure, SI units, no DOM.
 *
 * The board is a half-size one: rows 1 to `rows`, holes a–e on the left of the centre channel and
 * f–j on the right. Each row's five holes on one side are one strip, so a10–e10 are one net and
 * f10–j10 another. Two power rails run along the top (T+ and T−) and two along the bottom (B+, B−);
 * each is one net along its length, or two halves when the board's rails are split in the middle.
 *
 * Hole names: 'c12' (column c, row 12); 'T+5', 'T-5', 'B+5', 'B-5' (a rail hole beside row 5).
 */
import { WIRE_R, solveCircuit } from './mna.js';

export const BOARD = Object.freeze({ rows: 30, left: 'abcde', right: 'fghij' });

/** The net a hole belongs to: 'L12' or 'R12' for a row strip, 'T+' or 'T+:L' for a rail. */
export function netOf(hole, { split = false, rows = BOARD.rows } = {}) {
  const rail = /^([TB])([+-])(\d+)$/.exec(hole);
  if (rail) {
    const row = Number(rail[3]);
    if (row < 1 || row > rows) throw new Error(`no rail hole ${hole}`);
    const name = `${rail[1]}${rail[2]}`;
    if (!split) return name;
    return `${name}:${row <= rows / 2 ? 'L' : 'R'}`;
  }
  const m = /^([a-j])(\d+)$/.exec(hole);
  if (!m) throw new Error(`no hole ${hole}`);
  const row = Number(m[2]);
  if (row < 1 || row > rows) throw new Error(`no hole ${hole}`);
  return `${BOARD.left.includes(m[1]) ? 'L' : 'R'}${row}`;
}

/**
 * The circuit the parts make. A part is { id, type: 'R' | 'V' | 'W', a, b, value, r? }: a resistor of
 * `value` ohms, a source of `value` volts (+ at b) with an optional internal resistance `r`, or a
 * jumper wire. Returns the nets used and the edges between them, with a source's internal
 * resistance as its own edge through a hidden node.
 */
export function netlist(parts, opts = {}) {
  const edges = [];
  const nodes = new Set();
  for (const p of parts) {
    const a = netOf(p.a, opts);
    const b = netOf(p.b, opts);
    nodes.add(a);
    nodes.add(b);
    if (p.type === 'V' && p.r > 0) {
      const mid = `${p.id}:int`;
      nodes.add(mid);
      edges.push({ id: p.id, type: 'V', a, b: mid, value: p.value });
      edges.push({ id: `${p.id}:r`, type: 'R', a: mid, b, value: p.r });
    } else {
      edges.push({ id: p.id, type: p.type, a, b, value: p.value });
    }
  }
  return { nodes: [...nodes], edges };
}

/** Groups of nets joined by parts: each is a separate circuit with its own 0 V. */
function islands(nodes, edges) {
  const parent = new Map(nodes.map((n) => [n, n]));
  const find = (n) => (parent.get(n) === n ? n : find(parent.get(n)));
  for (const e of edges) parent.set(find(e.a), find(e.b));
  const groups = new Map();
  for (const n of nodes) {
    const r = find(n);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(n);
  }
  return [...groups.values()];
}

/**
 * Solve the board by modified nodal analysis. `ground` is the net taken as 0 V (the supply's −
 * rail). A group of nets with no part joining it to ground floats: it is solved on its own, with
 * its first net at 0 V, and listed in `floating`, since no current can reach it.
 */
export function solveBoard(parts, { ground, ...opts } = {}) {
  const { nodes, edges } = netlist(parts, opts);
  const groups = islands(nodes, edges);
  const grounds = groups.map((g) => (g.includes(ground) ? ground : g[0]));
  const sol = solveCircuit(nodes, edges, grounds);
  const floating = groups.filter((g) => !g.includes(ground)).flat();
  return { nodes, edges, V: sol.V, I: sol.I, floating };
}

/**
 * The same circuit by a different route: merge the nets that jumpers join, then relax every net to
 * the conductance-weighted average of its neighbours plus what is injected into it (Gauss–Seidel
 * with over-relaxation) until nothing moves. A source with internal resistance r is its Norton
 * equivalent: E/r pushed into its + net, drawn from its − net, with 1/r between them, so it may sit
 * anywhere. A source with no internal resistance fixes its + net, so its − end must be on ground.
 */
export function relaxBoard(parts, { ground, tol = 1e-13, maxIter = 400000, ...opts } = {}) {
  const parent = new Map();
  const find = (n) => {
    if (!parent.has(n)) parent.set(n, n);
    return parent.get(n) === n ? n : find(parent.get(n));
  };
  const nets = parts.map((p) => ({ ...p, na: netOf(p.a, opts), nb: netOf(p.b, opts) }));
  for (const p of nets) if (p.type === 'W') parent.set(find(p.na), find(p.nb));
  const g0 = find(ground);
  const fixed = new Map([[g0, 0]]);
  const links = [];
  const inject = new Map();
  const add = (n, j) => inject.set(n, (inject.get(n) || 0) + j);
  for (const p of nets) {
    const a = find(p.na);
    const b = find(p.nb);
    if (p.type === 'R') links.push({ a, b, g: 1 / p.value });
    if (p.type === 'V' && p.r > 0) {
      links.push({ a, b, g: 1 / p.r });
      add(b, p.value / p.r);
      add(a, -p.value / p.r);
    } else if (p.type === 'V') {
      if (a !== g0) throw new Error(`relaxBoard: source ${p.id} has no internal resistance and is not referred to ground`);
      fixed.set(b, p.value);
    }
  }
  const reps = [...new Set([...nets.flatMap((p) => [find(p.na), find(p.nb)]), g0])];
  const V = new Map(reps.map((n) => [n, fixed.get(n) ?? 0]));
  const free = reps.filter((n) => !fixed.has(n));
  const nbrs = new Map(free.map((n) => [n, []]));
  for (const e of links) {
    if (e.a === e.b) continue;
    if (nbrs.has(e.a)) nbrs.get(e.a).push([e.b, e.g]);
    if (nbrs.has(e.b)) nbrs.get(e.b).push([e.a, e.g]);
  }
  const w = 1.7;
  for (let it = 0; it < maxIter; it += 1) {
    let change = 0;
    let scale = 1e-30;
    for (const n of free) {
      const list = nbrs.get(n);
      if (!list.length) continue;
      let sg = 0;
      let sv = inject.get(n) || 0;
      for (const [m, g] of list) {
        sg += g;
        sv += g * V.get(m);
      }
      const old = V.get(n);
      const next = old + w * (sv / sg - old);
      V.set(n, next);
      change = Math.max(change, Math.abs(next - old));
      scale = Math.max(scale, Math.abs(next));
    }
    if (change <= tol * Math.max(1, scale)) break;
  }
  const out = {};
  for (const p of nets) {
    out[p.na] = V.get(find(p.na));
    out[p.nb] = V.get(find(p.nb));
  }
  const I = {};
  for (const p of nets) {
    if (p.type === 'R') I[p.id] = (out[p.na] - out[p.nb]) / p.value;
    // Through a source, − to +: what its internal resistance lets out.
    if (p.type === 'V' && p.r > 0) I[p.id] = (p.value - (out[p.nb] - out[p.na])) / p.r;
  }
  return { V: out, I };
}

export { WIRE_R };
