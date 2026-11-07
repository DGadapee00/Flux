import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { NET, curves, networkChecked } from '@flux/subjects/mechanics/pipenet.js';

/**
 * Network: a pump feeding an upstairs shower through two pipes in parallel, while a downstairs tap on
 * the same junction opens.
 *
 * Shows that parallel pipes split the flow so their head losses match, not evenly and not by area:
 * a short 10 mm bypass beside a 15 mm pipe takes 45% of the flow, not the 31% its area suggests. And
 * opening the tap draws more through the shared trunk, which drops the junction's head and starves
 * the shower, from 0.78 L/s to 0.16 L/s. The pump runs where its curve crosses the system's. Solved
 * by a root solve on the junction head and again by Newton on all the flows
 * (packages/subjects/src/mechanics/pipenet.js).
 */
const SCENARIOS = [
  { id: 'shower', name: 'The shower alone', DB: 10, open: 0, H0: 45 },
  { id: 'tap', name: 'The tap half open', DB: 10, open: 0.5, H0: 45 },
  { id: 'wide', name: 'A wide bypass, 25 mm', DB: 25, open: 0, H0: 45 },
  { id: 'weak', name: 'A weak pump and the tap full open', DB: 10, open: 1, H0: 25 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, DB: sc.DB, open: sc.open, H0: sc.H0 });
}

const KEYS = [['nw-db', 'DB'], ['nw-open', 'open'], ['nw-h0', 'H0']];
const params = (s) => ({ DB: s.DB / 1000, open: s.open, H0: s.H0 });
const lps = (Q) => `${fig(Q * 1000)} L/s`;
const pct = (x) => `${fig(100 * x)}%`;

/** The network drawn as pipes whose width follows their flow. */
function schematic(B, rect, state, c) {
  const S = sceneIn(B, rect, { x0: -0.9, x1: 8.6, y0: -2.1, y1: 3.6 }, 12);
  const big = Math.max(c.Q, 1e-6);
  const w = (Q) => 1.5 + 9 * Math.sqrt(Math.max(Q, 0) / big);
  const pipeLine = (pts, Q, color) => line(S, pts, { color: Q > 1e-7 ? color : alpha(C.muted, 0.4), width: w(Q) });
  // Floors.
  line(S, [[-0.9, -1.6], [8.6, -1.6]], { color: alpha(C.muted, 0.5), width: 1 });
  line(S, [[5.4, 2.4], [7.3, 2.4]], { color: alpha(C.muted, 0.5), width: 1 });
  label(S, 'upstairs', [5.4, 2.4], { color: C.muted, align: 'left', dy: -10 });
  // Sump and pump.
  pipeLine([[0, -1.5], [0, 0]], c.Q, C.teal);
  dot(S, 0, 0, { color: C.gold, r: 11, ring: C.text });
  label(S, 'pump', [0, 0], { color: C.gold, dy: -20 });
  // Trunk to the junction J, on to the parallel pair.
  pipeLine([[0, 0], [2.5, 0]], c.Q, C.teal);
  pipeLine([[2.5, 0], [3.5, 0]], c.Qs, C.teal);
  label(S, `trunk ${lps(c.Q)}`, [1.25, 0], { color: C.teal, dy: 18 });
  dot(S, 2.5, 0, { color: C.text, r: 4 });
  label(S, 'J', [2.5, 0], { color: C.text, dx: -8, dy: 12 });
  // The tap, down from J.
  pipeLine([[2.5, 0], [2.5, -1.2]], c.Qt, C.blue);
  label(S, state.open > 0 ? `tap ${lps(c.Qt)}` : 'tap shut', [2.5, -1.2], { color: C.blue, align: 'right', dx: -10 });
  if (c.Qt > 1e-7) arrow(S, [2.5, -1.25], -Math.PI / 2, 14, { color: C.blue, width: 2, head: 7 });
  // A on top, B below, rejoining at K.
  pipeLine([[3.5, 0], [3.5, 0.75], [6.5, 0.75], [6.5, 0]], c.QA, C.green);
  pipeLine([[3.5, 0], [3.5, -0.75], [6.5, -0.75], [6.5, 0]], c.QB, C.pink);
  label(S, `A, 15 mm × 10 m: ${lps(c.QA)}`, [5, 0.75], { color: C.green, dy: -16 });
  label(S, `B, ${fig(state.DB)} mm × 2 m: ${lps(c.QB)}`, [5, -0.75], { color: C.pink, dy: 18 });
  // Riser to the shower.
  pipeLine([[6.5, 0], [7.5, 0], [7.5, 3.1]], c.Qs, C.teal);
  label(S, c.Qs > 1e-7 ? `shower ${lps(c.Qs)}` : 'shower dry', [7.5, 3.1], { color: c.Qs > 1e-7 ? C.teal : C.red, dy: -16, align: 'right', dx: 8 });
  for (const dx of [-0.25, 0, 0.25]) if (c.Qs > 1e-7) line(S, [[7.5, 3.1], [7.5 + dx, 2.75]], { color: alpha(C.blue, 0.7), width: 1.5 });
}

/** Pump curve against system curve, and where they cross. */
function curvePlot(B, rect, state, c) {
  const cv = curves(params(state));
  const P = plotIn(B, rect, { lo: 0, hi: NET.Qmax * 1000 }, { lo: 0, hi: 1.12 * state.H0 });
  axes(P, { xLabel: 'pump flow (L/s)', yLabel: 'head (m)' });
  line(P, cv.map((p) => [p.Q * 1000, p.pump]), { color: C.gold, width: 2.5 });
  line(P, cv.filter((p) => p.system <= 1.12 * state.H0).map((p) => [p.Q * 1000, p.system]), { color: C.teal, width: 2.5 });
  label(P, 'pump', [0.15, state.H0], { color: C.gold, align: 'left', dy: -10 });
  label(P, 'system', [NET.Qmax * 1000, Math.min(cv[cv.length - 1].system, 1.1 * state.H0)], { color: C.teal, align: 'right', dy: 14 });
  dot(P, c.Q * 1000, c.Hpump, { color: C.pink, r: 6, ring: C.text });
  label(P, `${lps(c.Q)} at ${fig(c.Hpump)} m`, [c.Q * 1000, c.Hpump], { color: C.pink, align: 'left', dx: 10, dy: -10 });
}

export default defineLab({
  id: 'network',
  exam: 'u3',
  title: 'Network',
  hint: 'Read how the shower’s flow splits between A and B: not by area. Then open the tap and watch the shower fade, and the pump slide down its curve.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('shower', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'open', lo: 0, hi: 1 }),
  controls() {
    return `
      ${slider('nw-db', 'Diameter of bypass B (mm)', 10, 6, 25, 0.5)}
      ${slider('nw-open', 'Tap opening (0 shut, 1 open)', 0, 0, 1, 0.01)}
      ${slider('nw-h0', 'Pump’s shut-off head (m)', 45, 20, 60, 1)}
      <p class="tiny">Water in smooth copper (ε = 1.5 µm); friction from Churchill’s formula, which runs smoothly from laminar to Colebrook’s turbulent values. Trunk 20 mm × 20 m; A 15 mm × 10 m; B 2 m long; riser 15 mm × 4 m to a shower ${NET.zs} m above the pump, with K = ${NET.Ks}; the tap’s K = ${NET.Kopen}/opening². The pump gives H₀[1 − (Q/1.5 L/s)²]. Pipe width follows its flow.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const r = networkChecked(params(state));
    return { ...r, n: undefined };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      schematic(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.58 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    schematic(B, a, state, c);
    curvePlot(B, b, state, c);
  },
  law: () => [String.raw`h_\text{pump}(Q) = \Delta z + \sum h_L(Q)`, String.raw`\text{parallel: } h_{L,A} = h_{L,B}, \quad Q = Q_A + Q_B`, String.raw`h_L = f\,\frac{L}{D}\,\frac{V^2}{2g}`],
  liveRows(state, c) {
    return [
      kv('Pump: flow and head', `${lps(c.Q)}, ${fig(c.Hpump)} m`),
      kv('Head at J, and the trunk’s loss', `${fig(c.HJ)} m, ${fig(c.trunkLoss)} m`),
      kv('Shower, tap', `${lps(c.Qs)}, ${lps(c.Qt)}`),
      kv('A’s share of the shower flow', c.Qs > 0 ? pct(c.shareA) : '–'),
      kv('…if split by area, if split evenly', `${pct(c.areaShare)}, 50%`),
      kv('Shared loss across A and B', `${fig(c.hp)} m`),
      kv('Two solvers against each other', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['shower', lps(c.Qs)],
      ['tap', lps(c.Qt)],
      ['A’s share', c.Qs > 0 ? pct(c.shareA) : '–'],
      ['pump head', `${fig(c.Hpump)} m`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Fittings, elbows and valves along the pipes, which add minor losses of their own, and a pump curve that also sets an efficiency: real pumps are chosen to run near their best-efficiency point.`;
    if (c.Qs <= 0) {
      return { title: 'The shower runs dry', body: `With the tap open, the trunk carries ${lps(c.Q)} and loses so much head that J sits at ${fig(c.HJ)} m, below the shower’s ${NET.zs} m. Nothing reaches it. ${leavesOut}` };
    }
    if (state.open > 0) {
      return { title: 'The tap starves the shower', body: `Opening the tap pulls ${lps(c.Qt)} through J. The pump slides down its curve to ${lps(c.Q)} and the trunk’s loss rises to ${fig(c.trunkLoss)} m, so J drops to ${fig(c.HJ)} m and the shower gets only ${lps(c.Qs)}. ${leavesOut}` };
    }
    return { title: 'Parallel pipes match their losses', body: `A and B both run between the same two points, so they lose the same head, ${fig(c.hp)} m. That decides the split: A carries ${pct(c.shareA)} of the ${lps(c.Qs)}, not the ${pct(c.areaShare)} its area would suggest, because B is shorter. ${leavesOut}` };
  },
  app: false,
});
