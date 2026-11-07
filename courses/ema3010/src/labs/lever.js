import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CU, NI, boundaries, gLiquid, gSolid, phaseState } from '@flux/subjects/matsci/phasediagram.js';

/**
 * Lever: the copper–nickel phase diagram, with a temperature line you drag across it and an alloy
 * whose composition you set, the tie line and lever drawn, beside the Gibbs energy curves at that
 * temperature.
 *
 * Shows the difference between the phases' compositions, read at the tie line's ends, and how much of
 * each phase there is, read from the lever's opposite arms: a 50% nickel alloy at 1550 K is 59%
 * liquid, and that liquid holds 47% nickel. The tie line comes from ideal-solution equilibrium in
 * closed form; the second method checks that a common tangent touches both Gibbs energy curves at its
 * ends (packages/subjects/src/matsci/phasediagram.js).
 */
const SCENARIOS = [
  { id: 'mid', name: '50% Ni at 1550 K: liquid and solid', x0: 0.5, T: 1550 },
  { id: 'cooler', name: '50% Ni at 1540 K', x0: 0.5, T: 1540 },
  { id: 'nickel', name: '80% Ni at 1660 K', x0: 0.8, T: 1660 },
  { id: 'solid', name: '50% Ni at 1450 K: all solid', x0: 0.5, T: 1450 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, x0: sc.x0, T: sc.T });
}

const KEYS = [['lv-x', 'x0'], ['lv-t', 'T']];
const pct = (x) => `${fig(100 * x)}%`;
const BOUND = boundaries();
const REGION = { liquid: 'all liquid', solid: 'all solid α', two: 'liquid + solid α' };

/** The diagram: liquidus, solidus, the alloy's point, and in the two-phase band the tie line and lever. */
function diagram(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: 1300, hi: 1780 });
  axes(P, { xLabel: 'atom fraction nickel', yLabel: 'temperature (K)' });
  // The two-phase lens, shaded.
  poly(P, [...BOUND.liq, ...BOUND.sol.slice().reverse()], { fill: alpha(C.gold, 0.12), stroke: null });
  line(P, BOUND.liq, { color: C.red, width: 2 });
  line(P, BOUND.sol, { color: C.blue, width: 2 });
  label(P, 'L', [0.12, 1640], { color: C.red, bold: true });
  label(P, 'α', [0.8, 1380], { color: C.blue, bold: true });
  label(P, 'liquidus', [0.32, 1500], { color: C.red, align: 'right', dx: -6 });
  label(P, 'solidus', [0.62, 1560], { color: C.blue, align: 'left', dx: 6 });
  label(P, `${CU.name} melts at ${CU.Tm} K`, [0, CU.Tm], { color: C.muted, align: 'left', dx: 6, dy: 12 });
  label(P, `${NI.name}, ${NI.Tm} K`, [1, NI.Tm], { color: C.muted, align: 'right', dx: -6, dy: -10 });
  seg(P, [0, state.T], [1, state.T], { color: alpha(C.text, 0.35), width: 1, dash: [4, 4] });
  if (c.region === 'two') {
    // Lever arms: the liquid's share is the arm on the solid's side.
    seg(P, [c.xL, state.T], [state.x0, state.T], { color: C.blue, width: 4 });
    seg(P, [state.x0, state.T], [c.xS, state.T], { color: C.red, width: 4 });
    dot(P, c.xL, state.T, { color: C.red, r: 5 });
    dot(P, c.xS, state.T, { color: C.blue, r: 5 });
    label(P, `L: ${pct(c.xL)} Ni`, [c.xL, state.T], { color: C.red, align: 'right', dx: -8, dy: -12 });
    label(P, `α: ${pct(c.xS)} Ni`, [c.xS, state.T], { color: C.blue, align: 'left', dx: 8, dy: 14 });
    // The same tie line magnified, in the empty liquid corner, so the arms can be compared.
    const a0 = 0.05;
    const a1 = 0.5;
    const y = 1745;
    const u = (x) => a0 + ((x - c.xL) / (c.xS - c.xL)) * (a1 - a0);
    seg(P, [a0, y], [u(state.x0), y], { color: C.blue, width: 6 });
    seg(P, [u(state.x0), y], [a1, y], { color: C.red, width: 6 });
    dot(P, u(state.x0), y, { color: C.gold, r: 6, ring: C.text });
    label(P, 'tie line, magnified', [a0, y], { color: C.muted, align: 'left', dy: -14 });
    // Each arm measures the phase on the far side: the left (blue) arm is the solid's share.
    label(P, `solid ${pct(c.WS)}`, [a0, y], { color: C.blue, align: 'left', dy: 14 });
    label(P, `liquid ${pct(c.WL)}`, [a1, y], { color: C.red, align: 'right', dy: 14 });
  }
  dot(P, state.x0, state.T, { color: C.gold, r: 6, ring: C.text });
}

/** Gibbs energy of each phase across composition, with the common tangent. */
function gibbs(B, rect, state, c) {
  const T = state.T;
  const xs = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  const gs = xs.map((x) => [x, gSolid(x, T) / 1000]);
  const gl = xs.map((x) => [x, gLiquid(x, T) / 1000]);
  const all = [...gs, ...gl].map((p) => p[1]);
  const lo = Math.min(...all);
  const hi = Math.max(...all, 0);
  const pad = 0.08 * (hi - lo || 1);
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: lo - pad, hi: hi + pad });
  axes(P, { xLabel: 'atom fraction nickel', yLabel: 'Gibbs energy (kJ/mol)' });
  line(P, gl, { color: C.red, width: 2 });
  line(P, gs, { color: C.blue, width: 2 });
  label(P, 'liquid', [0.04, gl[7][1]], { color: C.red, align: 'left', dy: -10 });
  label(P, 'solid', [0.96, gs[191][1]], { color: C.blue, align: 'right', dy: -10 });
  if (c.tangentLine) {
    const t = c.tangentLine;
    line(P, [[0, t.intercept / 1000], [1, (t.intercept + t.slope) / 1000]], { color: alpha(C.gold, 0.9), width: 1.5, dash: [6, 4] });
    if (c.region === 'two' || (c.xL > 0.02 && c.xS < 0.98)) {
      dot(P, c.xL, gLiquid(c.xL, T) / 1000, { color: C.red, r: 4 });
      dot(P, c.xS, gSolid(c.xS, T) / 1000, { color: C.blue, r: 4 });
    }
  }
  label(P, `T = ${fig(T)} K`, [1, hi + pad], { color: C.muted, align: 'right', dy: 12 });
}

export default defineLab({
  id: 'lever',
  exam: 'u3',
  title: 'Lever',
  hint: 'Put the alloy inside the lens and read two different things: where the tie line ends (each phase’s nickel content) and how long each arm is (how much of each phase). Then cool it.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mid', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 1300, hi: 1780 }),
  controls() {
    return `
      ${slider('lv-x', 'Alloy composition, atom fraction Ni', 0.5, 0.01, 0.99, 0.005)}
      ${slider('lv-t', 'Temperature (K)', 1550, 1300, 1780, 1)}
      <p class="tiny">Copper and nickel as ideal solutions, solid and liquid. Red: liquidus, and the liquid. Blue: solidus, and solid α. Gold dot: the alloy. In the lens the tie line runs to each phase’s composition; the thick arm on each side measures the amount of the phase on the other side. Right: Gibbs energy of each phase, and the tangent that touches both.</p>`;
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
    return phaseState(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      diagram(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    diagram(B, a, state, c);
    gibbs(B, b, state, c);
  },
  law: () => [String.raw`\frac{x^\alpha_i}{x^L_i} = \exp\!\left[\frac{\Delta H_i}{R}\left(\frac1T - \frac1{T_i}\right)\right]`, String.raw`W_L = \frac{x_\alpha - x_0}{x_\alpha - x_L}, \qquad W_\alpha = \frac{x_0 - x_L}{x_\alpha - x_L}`],
  liveRows(state, c) {
    return [
      kv('Region', REGION[c.region]),
      kv('Tie line at this T: liquid, solid', c.xL == null ? 'none: outside the lens’s temperatures' : `${pct(c.xL)}, ${pct(c.xS)} Ni`),
      kv('Amounts: liquid, solid', `${pct(c.WL)}, ${pct(c.WS)}`),
      kv('Alloy', `${pct(state.x0)} Ni at ${fig(state.T)} K`),
      kv('Common tangent, largest mismatch', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['liquid', pct(c.WL)],
      ['solid α', pct(c.WS)],
      ['Ni in liquid', c.region === 'two' ? pct(c.xL) : '–'],
      ['Ni in α', c.region === 'two' ? pct(c.xS) : '–'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real copper and nickel are not quite ideal, and diagrams are usually drawn in weight percent; cast alloys cool too fast for the solid to stay uniform, so their grains are cored, richer in nickel at the middle.`;
    if (c.region !== 'two') {
      return { title: c.region === 'liquid' ? 'All liquid' : 'All solid', body: `At ${fig(state.T)} K an alloy of ${pct(state.x0)} nickel is ${REGION[c.region]}: one phase, with the alloy’s own composition. Move the temperature line into the lens to split it in two. ${leavesOut}` };
    }
    return { title: 'Compositions from the ends, amounts from the arms', body: `At ${fig(state.T)} K the tie line runs from ${pct(c.xL)} nickel in the liquid to ${pct(c.xS)} in the solid: those are the phases’ compositions, the same for any alloy on this line. How much of each depends on where the alloy sits: ${pct(c.WL)} liquid and ${pct(c.WS)} solid, each read from the arm on the opposite side. ${leavesOut}` };
  },
  app: false,
});
