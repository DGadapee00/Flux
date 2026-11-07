import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { decouplingClosed, decouplingNumeric } from '@flux/subjects/design/instruments.js';

/**
 * Decoupling: a chip that suddenly draws more current, 50 mm of trace from its regulator, and a
 * 100 nF capacitor placed near it or not at all.
 *
 * Shows why a small capacitor right beside the chip matters more than a big one far away. A fast
 * current step through the trace's inductance dips the chip's supply by about L di/dt; a nearby
 * capacitor supplies the step through a much smaller inductance. The supply is found by the exact
 * solution of the circuit and again by RK4 (packages/subjects/src/design/instruments.js).
 */
const V0 = 3.3;
const LT = 50e-9; // 50 mm of trace
const PER_MM = 1e-9; // connection inductance per mm: an example value
const ESL = 1e-9; // the capacitor's own inductance: an example value
const VMIN = 3.0; // the chip's lowest supply: an example value

const SCENARIOS = [
  { id: 'none', name: 'No capacitor near the chip', cap: 'none', d: 50, dI: 0.1, trNs: 10 },
  { id: 'far', name: '100 nF, 30 mm away', cap: 'local', d: 30, dI: 0.1, trNs: 10 },
  { id: 'close', name: '100 nF, 2 mm away', cap: 'local', d: 2, dI: 0.1, trNs: 10 },
  { id: 'slow', name: 'No capacitor, a slow edge', cap: 'none', d: 50, dI: 0.1, trNs: 100 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, cap: sc.cap, d: sc.d, dI: sc.dI, trNs: sc.trNs });
}

/** With no capacitor near it, the chip still has a few nanofarads of its own on its supply pins. */
const OWN = 2e-9; // example value

function params(state) {
  const local = state.cap === 'local';
  return { V0, Rt: 0.05, Lt: LT, C: local ? 100e-9 + OWN : OWN, Rc: 0.01, Lc: local ? ESL + PER_MM * state.d : ESL, dI: state.dI, tr: state.trNs * 1e-9 };
}

export default defineLab({
  id: 'decoupling',
  exam: 'u6',
  title: 'Decoupling',
  hint: 'Switch the chip with no capacitor beside it: its supply dips by L di/dt. Add 100 nF far away, then move it close.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('none', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => (state.cap === 'local' ? { key: 'd', lo: 1, hi: 50 } : { key: 'trNs', lo: 2, hi: 100 }),
  controls() {
    return `
      <label class="field"><span>Capacitor</span><select id="de-cap"><option value="none">None near the chip</option><option value="local">100 nF ceramic near the chip</option></select></label>
      ${slider('de-d', 'capacitor distance from the chip (mm)', 30, 1, 50, 1)}
      ${slider('de-I', 'current step (A)', 0.1, 0.02, 0.3, 0.01)}
      ${slider('de-t', 'step rise time (ns)', 10, 2, 100, 1)}
      <p class="tiny">3.3 V regulator 50 mm away. The chip has 2 nF of its own on its pins. About 1 nH per mm of connection and 1 nH of capacitor: example values. Wikipedia’s Decoupling capacitor article advises about 100 nF ceramic per chip, as close as possible.</p>`;
  },
  bind(api) {
    document.getElementById('de-cap')?.addEventListener('change', (e) => {
      api.slice().cap = e.target.value;
      api.bump();
    });
    bindSlider('de-d', (s, v) => { s.d = v; }, api);
    bindSlider('de-I', (s, v) => { s.dI = v; }, api);
    bindSlider('de-t', (s, v) => { s.trNs = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('de-cap');
    if (sel) sel.value = state.cap;
    for (const [id, val] of [['de-d', state.d], ['de-I', state.dI], ['de-t', state.trNs]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = params(state);
    const tEnd = Math.max(400e-9, 6 * p.tr);
    const a = decouplingClosed(p, tEnd, 300);
    const b = decouplingNumeric(p, tEnd, 300);
    const minA = Math.min(...a.map(([, v]) => v));
    const minB = Math.min(...b.map(([, v]) => v));
    const dip = V0 - minA;
    const Lpath = state.cap === 'local' ? p.Lc : LT;
    return { curve: a, dip, estimate: (Lpath * p.dI) / p.tr, Lc: Lpath, low: minA < VMIN, gap: Math.abs(minA - minB) / V0, tEnd };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const lo = Math.min(VMIN - 0.1, V0 - c.dip * 1.15);
    const P = plotIn(B, B.free, { lo: 0, hi: c.tEnd * 1e9 }, { lo, hi: V0 + 0.05 });
    axes(P, { xLabel: 't (ns)', yLabel: 'chip supply (V)' });
    seg(P, [0, VMIN], [c.tEnd * 1e9, VMIN], { color: C.red, width: 1.5, dash: [6, 4] });
    note(P, 'chip’s lowest supply', c.tEnd * 1e9 * 0.6, VMIN, { color: C.red, dy: 14 });
    seg(P, [0, state.trNs], [0, state.trNs], { color: C.muted });
    line(P, c.curve.map(([t, v]) => [t * 1e9, v]), { color: C.teal, width: 2.5 });
    const k = c.curve.reduce((m, p, i) => (p[1] < c.curve[m][1] ? i : m), 0);
    dot(P, c.curve[k][0] * 1e9, c.curve[k][1], { color: C.yellow, r: 5 });
    note(P, `dip ${fig(c.dip * 1000)} mV`, c.curve[k][0] * 1e9, c.curve[k][1], { color: C.yellow, dx: 10, dy: 14 });
    seg(P, [0, V0], [state.trNs, V0], { color: alpha(C.pink, 0.8), width: 3 });
    note(P, 'current rising', 0, V0, { color: C.pink, dy: -6 });
  },
  law: () => [String.raw`\Delta V \approx L\,\frac{di}{dt} = L\,\frac{\Delta I}{t_r}`, String.raw`L_t\,\dot i_L = V_0 - R_t i_L - v,\quad C\,\dot v_c = i_L - i_\text{load}`],
  liveRows(state, c) {
    return [
      kv('inductance to the nearest charge', `${fig(c.Lc * 1e9)} nH`),
      kv('estimate $L\\,\\Delta I/t_r$', `${fig(c.estimate * 1000)} mV`),
      kv('rate of change of current', `${fig(state.dI / (state.trNs * 1e-9) / 1e6)} A/μs`),
      kv('exact solution against RK4', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['supply dip', `${fig(c.dip * 1000)} mV`],
      ['lowest supply', `${fig(V0 - c.dip)} V`],
      ['chip resets', c.low ? 'likely' : 'no'],
      ['L to the charge', `${fig(c.Lc * 1e9)} nH`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One current step and lumped parts. Real chips switch over and over, at many frequencies, so boards pair small capacitors at each pin with larger ones nearby, and a ground plane keeps the return path's inductance low too.`;
    let title = 'Charge from far away arrives late';
    let body = String.raw`Every bit of current must come through ${fig(c.Lc * 1e9)} nH of trace, and ${fig(state.dI)} A in ${fig(state.trNs)} ns makes it drop about ${fig(c.estimate * 1000)} mV. The supply dips to ${fig(V0 - c.dip)} V.`;
    if (state.cap === 'local' && state.d <= 5) {
      title = 'A small capacitor, close, does the job';
      body = String.raw`The 100 nF sits ${fig(state.d)} mm away, behind only ${fig(c.Lc * 1e9)} nH, so it supplies the step at once and the dip is ${fig(c.dip * 1000)} mV. The trace then recharges it slowly.`;
    } else if (state.cap === 'local') {
      title = 'The capacitor is too far away';
      body = String.raw`At ${fig(state.d)} mm its connection has ${fig(c.Lc * 1e9)} nH, nearly as much as the trace. The capacitance is there, but the inductance between keeps it from helping: the dip is ${fig(c.dip * 1000)} mV.`;
    } else if (state.trNs >= 50) {
      title = 'Slow edges are gentle';
      body = String.raw`Spread over ${fig(state.trNs)} ns, the same step dips the supply ${fig(c.dip * 1000)} mV, a fraction of what a 10 ns edge does. It is the speed of the change, not its size alone, that dips the supply.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
