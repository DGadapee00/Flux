import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { cross3, gaussJordan, rankByMinors, rankByPivots } from '@flux/subjects/math/linalg.js';

/**
 * Rank: three equations in three unknowns, drawn as three planes in a box.
 *
 *   x + y + z = 3,   x − y + 0.5z = 0.5,   2x + εy + (1.5 − ε)z = 3.5 + δ.
 *
 * The third row is the sum of the first two plus ε(0, 1, −1), and its right side the sum plus δ.
 * With ε ≠ 0 the planes meet in one point. With ε = 0 the rows are dependent, rank 2: the planes
 * share a whole line when δ = 0, and have no common point when δ ≠ 0. A tiny ε with δ ≠ 0 gives
 * one solution, far away. Shows that three equations need not fix one answer. The rank by
 * elimination is checked against the largest non-zero minor, and every solution by its residual
 * (packages/subjects/src/math/linalg.js).
 */
const R1 = [1, 1, 1];
const R2 = [1, -1, 0.5];
const E = [0, 1, -1];
const BOX = 3;

const SCENARIOS = [
  { id: 'unique', name: 'Three planes, one point', eps: 0.5, delta: 0 },
  { id: 'line', name: 'Dependent rows: a line of solutions', eps: 0, delta: 0 },
  { id: 'none', name: 'Dependent rows, shifted: no solution', eps: 0, delta: 1 },
  { id: 'nearly', name: 'Nearly dependent: one solution, far away', eps: 0.02, delta: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, eps: sc.eps, delta: sc.delta });
}

export function system(eps, delta) {
  const A = [R1, R2, [R1[0] + R2[0] + eps * E[0], R1[1] + R2[1] + eps * E[1], R1[2] + R2[2] + eps * E[2]]];
  return { A, b: [3, 0.5, 3.5 + delta] };
}

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const iso = ([x, y, z]) => [(x - y) * 0.866, z + (x + y) * 0.5 * 0.55];

/** The polygon a plane n·x = d cuts from the box [−BOX, BOX]³, in order round its centre. */
function slice(n, d) {
  const pts = [];
  const corners = [-BOX, BOX];
  for (const a of corners) {
    for (const b of corners) {
      for (const axis of [0, 1, 2]) {
        const p = [0, 0, 0];
        const q = [0, 0, 0];
        const [i, j] = [0, 1, 2].filter((k) => k !== axis);
        p[i] = q[i] = a;
        p[j] = q[j] = b;
        p[axis] = -BOX;
        q[axis] = BOX;
        const fp = dot3(n, p) - d;
        const fq = dot3(n, q) - d;
        if ((fp <= 0 && fq >= 0) || (fp >= 0 && fq <= 0)) {
          const t = fp === fq ? 0 : fp / (fp - fq);
          pts.push(p.map((v, k) => v + t * (q[k] - v)));
        }
      }
    }
  }
  if (pts.length < 3) return [];
  const c = pts.reduce((s, p) => s.map((v, k) => v + p[k] / pts.length), [0, 0, 0]);
  const u = Math.abs(n[0]) < 0.9 ? cross3(n, [1, 0, 0]) : cross3(n, [0, 1, 0]);
  const w = cross3(n, u);
  return pts.sort((p, q) => Math.atan2(dot3(p.map((v, k) => v - c[k]), w), dot3(p.map((v, k) => v - c[k]), u)) - Math.atan2(dot3(q.map((v, k) => v - c[k]), w), dot3(q.map((v, k) => v - c[k]), u)));
}

export default defineLab({
  id: 'rank',
  exam: 'u1',
  title: 'Rank',
  hint: 'Tilt the third plane to zero: three equations, but only two pivots. Then shift it and the common line disappears.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('unique', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'eps', lo: 0, hi: 1 }),
  controls() {
    return `
      ${slider('rk-eps', 'Tilt ε of the third plane', 0.5, 0, 1, 0.01)}
      ${slider('rk-delta', 'Shift δ of the third plane', 0, -2, 2, 0.05)}
      <p class="tiny">Blue: x + y + z = 3. Pink: x − y + 0.5z = 0.5. Gold: 2x + εy + (1.5 − ε)z = 3.5 + δ, the sum of the first two when ε = δ = 0. The box runs from −3 to 3.</p>`;
  },
  bind(api) {
    bindSlider('rk-eps', (s, v) => { s.eps = v; }, api);
    bindSlider('rk-delta', (s, v) => { s.delta = v; }, api);
  },
  syncControls(state) {
    for (const [id, v] of [['rk-eps', state.eps], ['rk-delta', state.delta]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const { A, b } = system(state.eps, state.delta);
    const Ab = A.map((r, i) => [...r, b[i]]);
    const rankA = rankByPivots(A);
    const rankAb = rankByPivots(Ab);
    const minorsA = rankByMinors(A);
    const minorsAb = rankByMinors(Ab);
    let gap = Math.abs(rankA - minorsA) + Math.abs(rankAb - minorsAb);
    const resid = (x, rhs = b) => Math.max(...A.map((r, i) => Math.abs(dot3(r, x) - rhs[i])));
    let kind = 'none';
    let x = null;
    let xn = null;
    if (rankA === 3) {
      kind = 'unique';
      const inv = gaussJordan(A).inverse;
      x = inv.map((r) => dot3(r, b));
      gap += resid(x) / Math.max(1, Math.hypot(...x));
    } else if (rankA === rankAb) {
      kind = 'line';
      xn = cross3(R1, R2);
      const inv = gaussJordan([R1, R2, xn]).inverse;
      x = inv.map((r) => dot3(r, [b[0], b[1], 0]));
      gap += resid(x) + resid(xn, [0, 0, 0]) / Math.hypot(...xn);
    }
    const inBox = !!x && x.every((v) => Math.abs(v) <= BOX);
    return { A, b, rankA, rankAb, minorsA, minorsAb, kind, x, xn, nullity: 3 - rankA, inBox, far: x ? Math.hypot(x[0] - 1, x[1] - 1, x[2] - 1) : null, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -5.6, x1: 5.6, y0: -4.8, y1: 6.2 }, 14);
    // The box's edges, then the three planes, back to front by their centres.
    for (const a of [-BOX, BOX]) {
      for (const b of [-BOX, BOX]) {
        for (const axis of [0, 1, 2]) {
          const p = [0, 0, 0];
          const q = [0, 0, 0];
          const [i, j] = [0, 1, 2].filter((k) => k !== axis);
          p[i] = q[i] = a;
          p[j] = q[j] = b;
          p[axis] = -BOX;
          q[axis] = BOX;
          line(P, [iso(p), iso(q)], { color: alpha(C.text, 0.18), width: 1 });
        }
      }
    }
    const colors = [C.blue, C.pink, C.gold];
    c.A.forEach((row, i) => {
      const poly3 = slice(row, c.b[i]);
      if (poly3.length) poly(P, poly3.map(iso), { fill: alpha(colors[i], 0.16), stroke: alpha(colors[i], 0.85), width: 1.5 });
    });
    if (c.kind === 'line') {
      const pts = [];
      for (let t = -6; t <= 6; t += 0.05) {
        const q = c.x.map((v, k) => v + t * c.xn[k]);
        if (q.every((v) => Math.abs(v) <= BOX + 1e-9)) pts.push(iso(q));
      }
      if (pts.length > 1) line(P, pts, { color: C.yellow, width: 3.5 });
    } else if (c.kind === 'unique' && c.inBox) {
      const [X, Y] = iso(c.x);
      dot(P, X, Y, { color: C.yellow, r: 6, ring: C.text });
    }
    const verdict = c.kind === 'unique' ? (c.inBox ? 'one point' : `one point, off the box at (${c.x.map((v) => fig(v)).join(', ')})`) : c.kind === 'line' ? 'a whole line' : 'no common point';
    label(P, `rank A = ${c.rankA}, rank [A | b] = ${c.rankAb}: ${verdict}`, [0, 5.7], { color: C.yellow });
  },
  law: () => [String.raw`\operatorname{rank}A + \dim N(A) = n`, String.raw`A\mathbf x = \mathbf b \text{ solvable} \iff \operatorname{rank}A = \operatorname{rank}[A\,|\,\mathbf b]`],
  liveRows(state, c) {
    return [
      kv('rank A by pivots, by minors', `${c.rankA}, ${c.minorsA}`),
      kv('rank [A | b] by pivots, by minors', `${c.rankAb}, ${c.minorsAb}`),
      kv('dimension of the null space', String(c.nullity)),
      kv('solutions', c.kind === 'unique' ? 'one' : c.kind === 'line' ? 'a line: x = xₚ + t xₙ' : 'none'),
      kv('solution', c.x ? `(${c.x.map((v) => fig(v)).join(', ')})` : '—'),
      kv('null direction xₙ', c.xn ? `(${c.xn.map((v) => fig(v)).join(', ')})` : '—'),
      kv('Checks: ranks agree, residuals', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['rank A', String(c.rankA)],
      ['rank [A | b]', String(c.rankAb)],
      ['solutions', c.kind === 'unique' ? 'one' : c.kind === 'line' ? 'a line' : 'none'],
      ['x', c.x ? fig(c.x[0]) : '—'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Rounding. On a computer a tilt of 10⁻¹⁶ is no tilt at all, so solvers decide rank with a tolerance, and a nearly dependent system is treated by least squares or flagged by its condition number.`;
    let title = 'Three independent rows: one point';
    let body = `Elimination finds three pivots, rank A = 3, so the planes meet in a single point, (${c.x ? c.x.map((v) => fig(v)).join(', ') : ''}). The null space holds only 0.`;
    if (c.kind === 'line') {
      title = 'Dependent rows: a whole line of answers';
      body = `The third equation is the sum of the first two, so elimination finds only two pivots: rank A = 2. Every point x = xₚ + t xₙ solves it, where A xₙ = 0. Rank 2 plus a null space of dimension 1 makes 3, the number of unknowns.`;
    } else if (c.kind === 'none') {
      title = 'Dependent rows, inconsistent right side: no answer';
      body = `The left side of row 3 is still the sum of rows 1 and 2, but its right side is off by δ = ${fig(state.delta)}. Elimination reduces it to 0 = ${fig(state.delta)}. b is not in the column space: rank [A | b] = 3 > rank A = 2.`;
    } else if (!c.inBox) {
      title = 'Nearly dependent: one answer, far away';
      body = `A tilt of ε = ${fig(state.eps)} keeps rank 3, so there is one solution, but it sits ${fig(c.far)} from (1, 1, 1): the distance grows as δ/ε. Small changes in the data move it a long way.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
