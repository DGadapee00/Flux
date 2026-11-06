import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { authority, inherent, valveFlow, valveFlowNumeric } from '@flux/subjects/design/instruments.js';

/**
 * Valve: a control valve throttling water that a pump drives through a run of pipe.
 *
 * Shows the installed characteristic. Where the pipe takes most of the pressure, the valve has little
 * authority: half open passes most of the flow, and all the control happens in the last few percent
 * of travel. An equal-percentage trim spreads it back out. Flow by the closed form and by bisection
 * where the pump curve meets the system curve (packages/subjects/src/design/instruments.js).
 */
const H0 = 4; // bar, pump head at no flow
const A = 0.004; // bar/(m³/h)², pump droop
const KV = 10; // m³/h, valve fully open

const TRIMS = { linear: 'Linear', equal: 'Equal percentage', quick: 'Quick opening' };

const SCENARIOS = [
  { id: 'short', name: 'Short pipe, linear valve', kind: 'linear', dp10: 0.4, x: 0.5 },
  { id: 'long', name: 'Long pipe, linear valve', kind: 'linear', dp10: 3, x: 0.5 },
  { id: 'equal', name: 'Long pipe, equal-percentage valve', kind: 'equal', dp10: 3, x: 0.5 },
  { id: 'quick', name: 'Short pipe, quick-opening valve', kind: 'quick', dp10: 0.4, x: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, kind: sc.kind, dp10: sc.dp10, x: sc.x });
}

const params = (state, x = state.x) => ({ H0, a: A, k: state.dp10 / 100, KvMax: KV, kind: state.kind, x });

export default defineLab({
  id: 'valve',
  exam: 'u6',
  title: 'Valve',
  hint: 'Lengthen the pipe and watch the linear valve stop controlling until it is nearly shut. Then try an equal-percentage trim.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('long', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x', lo: 0, hi: 1 }),
  controls() {
    return `
      <label class="field"><span>Valve trim</span><select id="va-kind">${Object.entries(TRIMS).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label>
      ${slider('va-x', 'valve opening', 0.5, 0, 1, 0.01)}
      ${slider('va-p', 'pipe loss at 10 m³/h (bar)', 3, 0.1, 4, 0.05)}
      <p class="tiny">Water. A pump giving 4 bar at no flow, a valve with Kv = 10 m³/h fully open. Q = Kv√Δp with Δp in bar (Wikipedia, Flow coefficient).</p>`;
  },
  bind(api) {
    document.getElementById('va-kind')?.addEventListener('change', (e) => {
      api.slice().kind = e.target.value;
      api.bump();
    });
    bindSlider('va-x', (s, v) => { s.x = v; }, api);
    bindSlider('va-p', (s, v) => { s.dp10 = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('va-kind');
    if (sel) sel.value = state.kind;
    for (const [id, val] of [['va-x', state.x], ['va-p', state.dp10]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = params(state);
    const a = valveFlow(p);
    const n = valveFlowNumeric(p);
    const full = valveFlow(params(state, 1)).Q;
    const gap = Math.abs(n.Q - a.Q) / Math.max(full, 1e-9);
    const curve = Array.from({ length: 101 }, (_, i) => [i / 100, valveFlow(params(state, i / 100)).Q / full]);
    const inh = Array.from({ length: 101 }, (_, i) => [i / 100, inherent(state.kind, i / 100)]);
    return { Q: a.Q, share: a.Q / full, full, dpValve: a.dpValve, dpPipe: p.k * a.Q * a.Q, auth: authority(p), curve, inh, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: 0, hi: 1 }, { lo: 0, hi: 1.08 });
    axes(P, { xLabel: 'valve opening', yLabel: 'flow, share of full open', xFmt: (v) => `${Math.round(v * 100)}%`, yFmt: (v) => `${Math.round(v * 100)}%` });
    line(P, [[0, 0], [1, 1]], { color: alpha(C.text, 0.25), width: 1, dash: [3, 4] });
    line(P, c.inh, { color: alpha(C.gold, 0.7), width: 1.5, dash: [6, 4] });
    note(P, 'the valve alone', 0.62, c.inh[62][1], { color: C.gold, dy: 14 });
    line(P, c.curve, { color: C.teal, width: 3 });
    note(P, 'in this system', 0.2, c.curve[20][1], { color: C.teal, dy: -10 });
    dot(P, state.x, c.share, { color: C.yellow, r: 6 });
    note(P, `${fig(c.Q)} m³/h`, state.x, c.share, { color: C.yellow, dx: 10, dy: 16 });
  },
  law: () => [String.raw`Q = K_v\sqrt{\Delta p_v},\qquad H_0 - aQ^2 = kQ^2 + \left(\frac{Q}{K_v f(x)}\right)^2`, String.raw`N = \frac{\Delta p_{v,\text{open}}}{\Delta p_{v,\text{open}} + \Delta p_\text{pipe}}`],
  liveRows(state, c) {
    return [
      kv('flow fully open', `${fig(c.full)} m³/h`),
      kv('pressure across the valve', `${fig(c.dpValve)} bar`),
      kv('pressure lost in the pipe', `${fig(c.dpPipe)} bar`),
      kv('valve authority $N$', fig(c.auth)),
      kv('closed form against bisection', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['flow', `${fig(c.Q)} m³/h`],
      ['share of full', `${fig(c.share * 100)}%`],
      ['valve Δp', `${fig(c.dpValve)} bar`],
      ['authority', fig(c.auth)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Water with no cavitation or choking, and a pump that holds its curve. A valve that drops too much pressure can cavitate, which erodes the trim and caps the flow.`;
    let title = 'The valve has authority';
    let body = String.raw`Fully open, the valve takes ${fig(c.auth * 100)}% of the drop, so it controls the flow over most of its travel. Half open passes ${fig(c.curve[50][1] * 100)}% of full flow.`;
    if (c.auth < 0.3 && state.kind !== 'equal') {
      title = 'Half open is nearly full flow';
      body = String.raw`The pipe takes most of the pressure; the valve, fully open, only ${fig(c.auth * 100)}%. Closing it halfway barely matters: ${fig(c.curve[50][1] * 100)}% of full flow still passes, and the control is all in the last few percent of travel.`;
    } else if (state.kind === 'equal') {
      title = 'Equal percentage spreads it out';
      body = String.raw`Each step of travel changes the valve's Kv by the same percentage, which is small near closed. In a system where the pipe dominates, that bends the installed curve back toward a straight line: half open passes ${fig(c.curve[50][1] * 100)}%.`;
    } else if (state.kind === 'quick') {
      title = 'Quick opening: on or off';
      body = String.raw`Most of the flow comes in the first part of the travel: at 25% open ${fig(c.curve[25][1] * 100)}% passes. Good for on-off service, poor for control.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
