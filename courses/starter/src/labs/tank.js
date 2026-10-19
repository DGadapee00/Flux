import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';

/**
 * EXAMPLE LAB. Replace it with the course's first real lab; keep the shape.
 *
 * Shows that a tank's fill time depends on the net rate, inflow minus outflow, not on the inflow
 * alone, so a small drain stretches the fill time far more than its size suggests.
 *
 * Every lab has: scenarios with real numbers, sliders, a pure `compute` that returns every number
 * the panels show, a second method that checks the first (`gap`, held to a limit by labs-check),
 * predictions, and an explainer. An application lab's explainer ends with "What the course model
 * leaves out." (DECISIONS.md, D30). PHY 2049's labs are the benchmark (D32).
 */
const SCENARIOS = [
  { id: 'fill', name: 'Filling with a small drain', V0: 0, Vcap: 0.3, qin: 0.0005, qout: 0.0001 },
  { id: 'slow', name: 'Nearly balanced', V0: 0.1, Vcap: 0.3, qin: 0.0003, qout: 0.0002 },
  { id: 'drain', name: 'Draining', V0: 0.2, Vcap: 0.3, qin: 0.0001, qout: 0.0006 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V0: sc.V0, Vcap: sc.Vcap, qin: sc.qin, qout: sc.qout });
}

/** Closed form. V(t) = V0 + (qin − qout) t until the tank is full or empty. */
export function tankTime(V0, Vcap, qin, qout) {
  const net = qin - qout;
  if (net > 0) return { net, event: 'full', T: (Vcap - V0) / net };
  if (net < 0) return { net, event: 'empty', T: V0 / -net };
  return { net, event: 'steady', T: 0 };
}

/** Second method: march the volume forward in small steps until it crosses the limit. */
function marched(V0, Vcap, qin, qout) {
  const { net, event, T } = tankTime(V0, Vcap, qin, qout);
  if (event === 'steady' || T === 0) return T;
  const n = 20000;
  const dt = (2 * T) / n;
  let V = V0;
  for (let i = 0; i < n; i++) {
    const next = V + net * dt;
    const crossed = event === 'full' ? next >= Vcap : next <= 0;
    if (crossed) return i * dt + ((event === 'full' ? Vcap : 0) - V) / net;
    V = next;
  }
  return Infinity;
}

export default defineLab({
  id: 'tank',
  exam: 'u1',
  title: 'Tank',
  hint: 'Change the inflow and the drain. The fill time follows the difference between them.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fill', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'qin', lo: 0, hi: 0.002 }),
  controls() {
    return `
      ${slider('tk-in', 'inflow (L/s)', 0.5, 0, 2, 0.05)}
      ${slider('tk-out', 'drain (L/s)', 0.1, 0, 2, 0.05)}
      <p class="tiny">Constant rates. Capacity 300 L.</p>`;
  },
  bind(api) {
    bindSlider('tk-in', (s, v) => { s.qin = v / 1000; }, api);
    bindSlider('tk-out', (s, v) => { s.qout = v / 1000; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['tk-in', state.qin * 1000], ['tk-out', state.qout * 1000]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const { V0, Vcap, qin, qout } = state;
    const r = tankTime(V0, Vcap, qin, qout);
    const Tnum = marched(V0, Vcap, qin, qout);
    const gap = r.T === 0 ? 0 : Math.abs(Tnum - r.T) / r.T;
    return { V0, Vcap, qin, qout, net: r.net, event: r.event, T: r.T, Tnum, gap, Vend: r.event === 'full' ? Vcap : r.event === 'empty' ? 0 : V0 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const span = c.T > 0 ? c.T : 600;
    const P = plotIn(B, B.free, { lo: 0, hi: span * 1.1 }, { lo: 0, hi: c.Vcap * 1.15 });
    axes(P, { xLabel: 't (s)', yLabel: 'V (m³)' });
    line(P, [[0, c.Vcap], [span * 1.1, c.Vcap]], { color: alpha(C.gold, 0.7), width: 1, dash: [4, 4] });
    note(P, 'capacity', 0, c.Vcap, { color: C.gold });
    line(P, [[0, c.V0], [span, c.Vend]], { color: C.teal, width: 2 });
    dot(P, span, c.Vend, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`V(t) = V_0 + (q_{in} - q_{out})\,t`],
  liveRows(state, c) {
    return [
      kv('net rate $q_{in} - q_{out}$', `${fig(c.net * 1000)} L/s`),
      kv('closed form', `${fig(c.T)} s`),
      kv('stepped forward', `${fig(c.Tnum)} s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['net rate', `${fig(c.net * 1000)} L/s`],
      [c.event === 'empty' ? 'time to empty' : 'time to fill', c.event === 'steady' ? 'never' : `${fig(c.T)} s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real drains slow down as the level falls, because the outflow through an opening grows with the square root of the water's depth. Here both rates are constant, so the volume is a straight line in time.`;
    if (c.event === 'steady') return { title: 'Balanced', body: `Inflow equals the drain, so the volume never changes. ${leavesOut}` };
    return {
      title: c.event === 'full' ? 'The net rate sets the fill time' : 'The tank is emptying',
      body: String.raw`The volume changes at $${fig(c.net * 1000)}$ L/s, the difference of the two rates. ${leavesOut}`,
    };
  },
  app: true,
});
