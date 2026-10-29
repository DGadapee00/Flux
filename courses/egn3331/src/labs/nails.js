import { fastenerSpacing, shearFlow, stackedBoards } from '@flux/subjects/mechanics/materials.js';
import { beamGap, simpleUniform } from '@flux/subjects/mechanics/sections.js';
import { BOARD_B, BOARD_F, BOARD_LINES, BOARD_N, BOARD_T, BOARD_V } from '../data/shear.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, arrow, axes, begin, C, chartIn, dot, hidden, label, line, panes, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that fastener spacing is the capacity divided into the shear flow.
 *
 * Second method: the change in the top board's axial force over a short length,
 * (ΔM) Q/I, equals q dx. The beam shear comes from internalAt.
 */

const KN = 1000;

const SCENARIOS = [
  { id: 'pair', name: 'Two nails', V: BOARD_V, F: BOARD_F, lines: BOARD_LINES },
  { id: 'heavy', name: 'Twice the shear', V: 2 * BOARD_V, F: BOARD_F, lines: BOARD_LINES },
  { id: 'single', name: 'One nail', V: BOARD_V, F: BOARD_F, lines: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V: sc.V, F: sc.F, lines: sc.lines, b: BOARD_B, t: BOARD_T });
}

/**
 * A metre of the beam from the side: three boards stacked, the top one held on by nails at the
 * spacing the lab computes, and the shear flow q (teal) that the nails must carry along the joint.
 */
function member(B, rect, state, c, veiled) {
  const t = state.t;
  const Lw = 0.6;
  const S = sceneIn(B, rect, { x0: -0.03, x1: Lw + 0.03, y0: -0.6 * t, y1: 3 * t + 0.08 }, 8);
  for (let i = 0; i < BOARD_N; i++) {
    poly(S, [[0, i * t], [Lw, i * t], [Lw, (i + 1) * t], [0, (i + 1) * t]], { fill: alpha(C.gold, 0.12 + 0.06 * i), stroke: C.text, width: 1.2 });
  }
  const s = Math.max(c.spacing, 0.004);
  const n = Math.min(150, Math.floor(Lw / s));
  for (let i = 0; i <= n; i++) {
    const x = i * s + Math.min(s, Lw) * 0.25;
    if (x > Lw) break;
    seg(S, [x, 3 * t + 0.004], [x, 1.35 * t], { color: C.text, width: 1.5 });
    seg(S, [x - 0.004, 3 * t + 0.004], [x + 0.004, 3 * t + 0.004], { color: C.text, width: 2 });
  }
  for (let i = 0; i < 4; i++) arrow(S, [0.05 + i * 0.14, 2 * t], 0, 22, { color: C.teal, width: 2, head: 6 });
  if (!veiled) {
    label(S, `q ${fig(c.q / 1e3)} kN/m along the joint`, [0, 2 * t], { color: C.teal, align: 'left', dy: 12, dx: 4 });
    label(S, `${state.lines} nail${state.lines > 1 ? 's' : ''} every ${fig(c.spacing * 1e3)} mm`, [Lw, 3 * t], { color: C.text, align: 'right', dy: -14 });
  }
}

export default defineLab({
  id: 'nails',
  exam: 'u7',
  title: 'Nail spacing',
  hint: 'The nails hold the top board on. Their spacing is the shear flow divided into what the nails at one station can carry.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pair', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V', lo: 2e3, hi: 20e3 }),
  controls() {
    return `
      ${slider('nl-v', 'shear (kN)', 8, 2, 20, 0.5)}
      ${slider('nl-f', 'one nail (kN)', 1.2, 0.4, 3, 0.1)}
      ${slider('nl-n', 'nails at a station', 2, 1, 4, 1)}
      <p class="tiny">Three boards, each 40 mm by 30 mm, stacked. The sizes and the nail capacity are assumed. The spacing is along the beam.</p>`;
  },
  bind(api) {
    bindSlider('nl-v', (s, v) => { s.V = v * KN; }, api);
    bindSlider('nl-f', (s, v) => { s.F = v * KN; }, api);
    bindSlider('nl-n', (s, v) => { s.lines = Math.max(1, Math.round(v)); }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('nl-v', state.V / KN);
    set('nl-f', state.F / KN);
    set('nl-n', state.lines);
  },
  compute(state) {
    const boards = stackedBoards(state.b, state.t, BOARD_N);
    const q = shearFlow(state.V, boards.Q, boards.I);
    const spacing = fastenerSpacing(q, state.F, state.lines);
    const L = 4;
    const model = simpleUniform((2 * state.V) / L, L);
    const dx = L / 200;
    const M0 = model.at(0).M;
    const M1 = model.at(dx).M;
    const qDiff = ((M1 - M0) / dx) * boards.Q / boards.I;
    const qMid = shearFlow(model.at(dx / 2).V, boards.Q, boards.I);
    const gapQ = Math.abs(qDiff - qMid) / Math.max(Math.abs(q), 1);
    return {
      q, spacing, V: state.V, F: state.F, lines: state.lines, Q: boards.Q, I: boards.I,
      gap: Math.max(beamGap(model), gapQ),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    const boards = stackedBoards(state.b, state.t, BOARD_N);
    const pts = [];
    let yHi = 1;
    for (let i = 0; i <= 40; i++) {
      const V = 2e3 + (18e3 * i) / 40;
      const s = fastenerSpacing(shearFlow(V, boards.Q, boards.I), state.F, state.lines) * 1e3;
      pts.push([V / KN, s]);
      yHi = Math.max(yHi, s);
    }
    const P = chartIn(B, R, { lo: 2, hi: 20 }, { lo: 0, hi: yHi * 1.1 });
    axes(P, { xLabel: 'shear (kN)', yLabel: 'spacing (mm)' });
    line(P, pts, { color: C.gold, width: 3 });
    dot(P, c.V / KN, c.spacing * 1e3, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`s=\frac{nF}{q}`],
  liveRows(state, c) {
    return [
      kv('shear flow', `${fig(c.q / KN)} kN/m`),
      kv('spacing', `${fig(c.spacing * 1e3)} mm`),
      kv('nails at a station', `${c.lines}`),
      kv('one nail', `${fig(c.F / KN)} kN`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['flow', `${fig(c.q / KN)} kN/m`],
      ['spacing', `${fig(c.spacing * 1e3)} mm`],
      ['nails', `${c.lines}`],
      ['each', `${fig(c.F / KN)} kN`],
    ]);
  },
  coach(state, c) {
    return {
      title: 'Closer nails when the flow rises',
      body: `The flow is ${fig(c.q / KN)} kN/m. ${c.lines} nails at ${fig(c.F / KN)} kN each can be ${fig(c.spacing * 1e3)} mm apart. Double the shear and the spacing halves.`,
    };
  },
});
