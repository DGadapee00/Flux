import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, line, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { COPPER, groundClosed, groundNodal, traceResistance } from '@flux/subjects/design/instruments.js';

/**
 * Board: a small board with a motor driver and an active analog sensor, and the copper that brings their
 * currents back to the connector.
 *
 * Shows why ground routing matters. When the motor's return current shares a trace with the sensor's
 * ground, that trace's few milliohms shift the sensor's reference, and the ADC reads the motor as a
 * change in the sensor. A star ground gives each return its own path; a ground plane makes the shared
 * path so wide that the shift all but vanishes. The offset is found by hand and by nodal analysis
 * (packages/subjects/src/design/instruments.js).
 */
const LSB = 3.3 / 4096;
const RGS = 0.005; // the sensor's own short ground stub, Ω
const PLANE_W = 40; // mm, the width a plane offers the return current

const LAYOUTS = {
  shared: 'Shared trace: motor and sensor return together',
  star: 'Star ground: separate returns to the connector',
  plane: 'Ground plane under the board',
};

const SCENARIOS = [
  { id: 'shared', name: 'Shared thin return', layout: 'shared', I: 2, w: 0.5, L: 60, oz: 1 },
  { id: 'wide', name: 'Shared, but a wide trace', layout: 'shared', I: 2, w: 3, L: 60, oz: 2 },
  { id: 'star', name: 'Star ground', layout: 'star', I: 2, w: 0.5, L: 60, oz: 1 },
  { id: 'plane', name: 'Ground plane', layout: 'plane', I: 2, w: 0.5, L: 60, oz: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, layout: sc.layout, I: sc.I, w: sc.w, L: sc.L, oz: sc.oz });
}

/** A voltage in mV, or in μV when under 0.1 mV. */
const volts = (v) => (Math.abs(v) < 1e-4 ? `${fig(v * 1e6)} μV` : `${fig(v * 1000)} mV`);

function network(state) {
  const t = COPPER.oz1 * state.oz;
  const Rtrace = traceResistance(state.L, state.layout === 'plane' ? PLANE_W : state.w, t);
  return { I: state.I, Rgs: RGS, Rsh: Rtrace, layout: state.layout === 'star' ? 'star' : 'shared', Rtrace };
}

export default defineLab({
  id: 'board',
  exam: 'u6',
  title: 'Ground return',
  hint: 'Run the motor: on a shared return the sensor reading jumps with it. Widen the trace, then try a star ground or a plane.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('shared', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'I', lo: 0, hi: 3 }),
  controls() {
    return `
      <label class="field"><span>Ground routing</span><select id="bd-layout">${Object.entries(LAYOUTS).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label>
      ${slider('bd-I', 'motor current (A)', 2, 0, 3, 0.05)}
      ${slider('bd-w', 'return trace width (mm)', 0.5, 0.2, 3, 0.05)}
      ${slider('bd-L', 'shared length (mm)', 60, 10, 150, 1)}
      ${slider('bd-oz', 'copper weight (oz)', 1, 1, 2, 1)}
      <p class="tiny">1 oz copper is 35 μm thick, 1.68 × 10⁻⁸ Ω·m (Wikipedia). The sensor puts out its signal above its own ground pin and draws 1 mA; a 12-bit ADC over 3.3 V reads it.</p>`;
  },
  bind(api) {
    document.getElementById('bd-layout')?.addEventListener('change', (e) => {
      api.slice().layout = e.target.value;
      api.bump();
    });
    bindSlider('bd-I', (s, v) => { s.I = v; }, api);
    bindSlider('bd-w', (s, v) => { s.w = v; }, api);
    bindSlider('bd-L', (s, v) => { s.L = v; }, api);
    bindSlider('bd-oz', (s, v) => { s.oz = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('bd-layout');
    if (sel) sel.value = state.layout;
    for (const [id, val] of [['bd-I', state.I], ['bd-w', state.w], ['bd-L', state.L], ['bd-oz', state.oz]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const net = network(state);
    const a = groundClosed(net);
    const n = groundNodal(net);
    const gap = Math.abs(n.error - a.error) / 3.3;
    return { Rtrace: net.Rtrace, error: a.error, counts: a.error / LSB, heat: state.I * state.I * net.Rtrace, drop: state.I * net.Rtrace, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -12, x1: 112, y0: -8, y1: 62 }, 14);
    poly(P, [[0, 0], [100, 0], [100, 55], [0, 55]], { fill: alpha(C.green, 0.1), stroke: alpha(C.green, 0.6), width: 1.5 });
    if (state.layout === 'plane') poly(P, [[2, 2], [98, 2], [98, 20], [2, 20]], { fill: alpha(C.gold, 0.18), stroke: null });
    const box = (x, y, w, h, color, text) => {
      poly(P, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { fill: alpha(color, 0.3), stroke: color });
      label(P, text, [x + w / 2, y + h / 2], { color });
    };
    box(-10, 18, 10, 20, C.muted, 'conn');
    box(70, 35, 24, 14, C.pink, 'motor');
    box(70, 8, 24, 12, C.teal, 'sensor');
    box(30, 38, 18, 12, C.blue, 'ADC');
    const width = Math.max(1.5, Math.min(8, state.w * 2.5));
    const gold = { color: C.gold, width };
    if (state.layout === 'star') {
      line(P, [[70, 38], [55, 30], [0, 30]], gold);
      line(P, [[70, 12], [30, 12], [0, 24]], { color: C.gold, width: 1.5 });
      label(P, 'motor return', [35, 30], { color: C.gold, dy: -9 });
      label(P, 'sensor return', [35, 12], { color: C.gold, dy: 10 });
    } else {
      line(P, [[70, 38], [60, 24], [0, 24]], gold);
      line(P, [[70, 12], [60, 24]], { color: C.gold, width: 1.5 });
      label(P, state.layout === 'plane' ? 'shared return: the plane' : 'shared return', [30, 24], { color: C.gold, dy: -10 });
    }
    line(P, [[70, 14], [48, 44]], { color: alpha(C.teal, 0.6), width: 1, dash: [3, 3] });
    arrow(P, [55, 27], Math.PI, 18 + 8 * state.I, { color: C.pink, width: 2 });
    label(P, `${fig(state.I)} A`, [50, 27], { color: C.pink, dy: 10 });
    label(P, `sensor reads ${c.error >= 0 ? '+' : ''}${volts(c.error)} off`, [50, 58], { color: Math.abs(c.counts) >= 1 ? C.red : C.green, bold: true });
  },
  law: () => [String.raw`R = \frac{\rho L}{w\,t},\qquad \Delta V = I\,R_\text{shared}`, String.raw`\text{error} \approx \frac{I R_\text{shared}}{\text{LSB}}\ \text{counts}`],
  liveRows(state, c) {
    return [
      kv('return path resistance', `${fig(c.Rtrace * 1000)} mΩ`),
      kv('drop along it', `${fig(c.drop * 1000)} mV`),
      kv('heat in it', `${fig(c.heat * 1000)} mW`),
      kv('one ADC count', `${fig(LSB * 1000)} mV`),
      kv('by hand against nodal analysis', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['sensor error', volts(c.error)],
      ['ADC counts off', Math.abs(c.counts) < 0.01 ? 'under 0.01' : fig(c.counts)],
      ['return resistance', `${fig(c.Rtrace * 1000)} mΩ`],
      ['trace heat', `${fig(c.heat * 1000)} mW`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Steady currents only. A motor's current switches fast, and then the trace's inductance, L di/dt, adds spikes on top of this resistive shift; decoupling capacitors next to each chip handle those.`;
    let title = 'The motor shows up in the sensor';
    let body = String.raw`${fig(state.I)} A through ${fig(c.Rtrace * 1000)} mΩ of shared return lifts the sensor's ground ${fig(c.drop * 1000)} mV. The ADC reads that as ${fig(c.counts)} counts of a sensor change that never happened.`;
    if (state.layout === 'star') {
      title = 'Separate returns, a quiet sensor';
      body = String.raw`The motor's current has its own path to the connector, so the sensor's ground carries only its own milliamp: ${fig(c.error * 1e6)} μV of error.`;
    } else if (state.layout === 'plane') {
      title = 'A plane makes the shared path wide';
      body = String.raw`Spread over ${PLANE_W} mm of copper, the return measures ${fig(c.Rtrace * 1000)} mΩ, and the sensor moves ${fig(c.counts)} counts. A plane also keeps the return loop small, which matters more for fast signals.`;
    } else if (Math.abs(c.counts) < 1) {
      title = 'Small enough, for now';
      body = String.raw`The shared return measures ${fig(c.Rtrace * 1000)} mΩ: less than one count of error. A bigger motor, or a 16-bit ADC, would show it.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
