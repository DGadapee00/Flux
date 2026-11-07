import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { bridgeNodal, bridgeOutput, rootStrain } from '@flux/subjects/design/instruments.js';

/**
 * Bridge: strain gauges on the root of the aluminium bracket arm from the Verification lab, read as a
 * quarter, half or full Wheatstone bridge.
 *
 * Shows that a gauge's resistance change is tiny, a fraction of an ohm in 350, so it is read as the
 * imbalance of a bridge, and amplified before an ADC can see it. Gauges on opposite faces double or
 * quadruple the signal and cancel a temperature change that every gauge feels. The exact bridge
 * output is checked by nodal analysis (packages/subjects/src/design/instruments.js).
 */
const ARM = { L: 100, b: 20, h: 8, E: 68e3 }; // mm, MPa: the Verification lab's bracket
const GF = 2; // foil gauges: "a little over 2" (Wikipedia, Strain gauge)
const R = 350;
const DRIFT = 10e-6; // apparent strain per °C of an uncompensated gauge: illustrative
const LSB = 3.3 / 4096; // a 12-bit ADC over 3.3 V

const KINDS = { quarter: 'Quarter: one gauge on top', half: 'Half: one on top, one below', full: 'Full: two on top, two below' };

const SCENARIOS = [
  { id: 'quarter', name: 'One gauge, straight to the ADC', kind: 'quarter', P: 100, dT: 0, Vex: 5, gain: 1 },
  { id: 'amplified', name: 'One gauge, amplified 100 times', kind: 'quarter', P: 100, dT: 0, Vex: 5, gain: 100 },
  { id: 'warm', name: 'One gauge, the room warms 10 °C', kind: 'quarter', P: 100, dT: 10, Vex: 5, gain: 100 },
  { id: 'full', name: 'Full bridge, the room warms 10 °C', kind: 'full', P: 100, dT: 10, Vex: 5, gain: 100 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, kind: sc.kind, P: sc.P, dT: sc.dT, Vex: sc.Vex, gain: sc.gain });
}

const outFor = (state, P) => bridgeOutput({ kind: state.kind, Vex: state.Vex, GF, strain: rootStrain({ P, ...ARM }), thermal: DRIFT * state.dT });

export default defineLab({
  id: 'bridge',
  exam: 'u5',
  title: 'Strain bridge',
  hint: 'Read one gauge straight into the ADC: the signal is about two counts. Amplify it, then warm the room, then switch to a full bridge.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('quarter', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'P', lo: 0, hi: 200 }),
  controls() {
    return `
      <label class="field"><span>Gauges</span><select id="br-kind">${Object.entries(KINDS).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label>
      ${slider('br-P', 'load on the arm P (N)', 100, 0, 200, 1)}
      ${slider('br-T', 'room warms by (°C)', 0, -20, 40, 1)}
      ${slider('br-V', 'bridge excitation (V)', 5, 1, 10, 0.5)}
      ${slider('br-g', 'amplifier gain', 1, 1, 200, 1)}
      <p class="tiny">350 Ω foil gauges, gauge factor 2, on the Verification lab’s arm. A 12-bit ADC over 3.3 V: 0.81 mV a count. An uncompensated gauge is taken to read 10 με per °C: an illustrative figure.</p>`;
  },
  bind(api) {
    document.getElementById('br-kind')?.addEventListener('change', (e) => {
      api.slice().kind = e.target.value;
      api.bump();
    });
    bindSlider('br-P', (s, v) => { s.P = v; }, api);
    bindSlider('br-T', (s, v) => { s.dT = v; }, api);
    bindSlider('br-V', (s, v) => { s.Vex = v; }, api);
    bindSlider('br-g', (s, v) => { s.gain = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('br-kind');
    if (sel) sel.value = state.kind;
    for (const [id, val] of [['br-P', state.P], ['br-T', state.dT], ['br-V', state.Vex], ['br-g', state.gain]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const strain = rootStrain({ P: state.P, ...ARM });
    const spec = { kind: state.kind, Vex: state.Vex, GF, strain, thermal: DRIFT * state.dT };
    const a = bridgeOutput(spec);
    const n = bridgeNodal({ ...spec, R });
    const noHeat = bridgeOutput({ ...spec, thermal: 0 }).exact;
    const gap = Math.abs(n.out - a.exact) / state.Vex;
    const counts = Math.round((a.exact * state.gain) / LSB);
    const curve = Array.from({ length: 41 }, (_, i) => [(i / 40) * 200, outFor(state, (i / 40) * 200).exact * 1000]);
    return {
      strain,
      dR: R * GF * strain,
      out: a.exact,
      linear: a.linear,
      nonlinearity: a.exact - a.linear,
      heatError: a.exact - noHeat,
      counts,
      saturated: Math.abs(a.exact * state.gain) > 3.3,
      curve,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.34);
    // The arm with its gauges.
    const S = sceneIn(B, top, { x0: -14, x1: 112, y0: -14, y1: 14 }, 10);
    poly(S, [[-12, -12], [0, -12], [0, 12], [-12, 12]], { fill: alpha(C.muted, 0.3), stroke: C.muted });
    poly(S, [[0, -4], [100, -4], [100, 4], [0, 4]], { fill: alpha(C.blue, 0.2), stroke: C.blue });
    const pad = (x, y, on) => poly(S, [[x, y], [x + 10, y], [x + 10, y + (y > 0 ? 2 : -2)], [x, y + (y > 0 ? 2 : -2)]], { fill: on ? C.gold : alpha(C.dim, 0.4), stroke: null });
    const topCount = state.kind === 'full' ? 2 : 1;
    const botCount = state.kind === 'quarter' ? 0 : state.kind === 'half' ? 1 : 2;
    for (let i = 0; i < 2; i++) pad(4 + i * 12, 4, i < topCount);
    for (let i = 0; i < 2; i++) pad(4 + i * 12, -4, i < botCount);
    label(S, 'tension', [10, 4], { color: C.gold, dy: -12 });
    label(S, 'compression', [10, -4], { color: C.gold, dy: 14 });
    seg(S, [100, 4], [100, 12], { color: C.pink, width: 2 });
    label(S, `P = ${fig(state.P)} N`, [100, 12], { color: C.pink, dy: -8 });
    // Output against load, with one ADC count referred to the bridge.
    const lsbIn = (LSB / state.gain) * 1000;
    const yHi = Math.max(...c.curve.map(([, v]) => v), lsbIn * 1.5) * 1.15;
    const yLo = Math.min(0, ...c.curve.map(([, v]) => v)) * 1.15;
    const P = plotIn(B, bottom, { lo: 0, hi: 200 }, { lo: yLo, hi: yHi });
    axes(P, { xLabel: 'load P (N)', yLabel: 'bridge output (mV)' });
    poly(P, [[0, 0], [200, 0], [200, lsbIn], [0, lsbIn]], { fill: alpha(C.red, 0.15), stroke: null });
    label(P, 'one ADC count', [200, lsbIn], { color: C.red, align: 'right', dy: -8 });
    line(P, c.curve, { color: C.teal, width: 2.5 });
    dot(P, state.P, c.out * 1000, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`V_o \approx V\,\frac{n\,GF\,\varepsilon}{4},\quad n = 1, 2, 4`, String.raw`\varepsilon = \frac{6PL}{Ebh^2},\quad \Delta R = R\,GF\,\varepsilon`],
  liveRows(state, c) {
    return [
      kv('strain at the root', `${fig(c.strain * 1e6)} με`),
      kv('gauge resistance change', `${fig(c.dR * 1000)} mΩ in 350 Ω`),
      kv('linear estimate', `${fig(c.linear * 1000)} mV`),
      kv('error from the warm room', `${fig(c.heatError * 1000)} mV`),
      kv('closed form against nodal analysis', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['bridge output', `${fig(c.out * 1000)} mV`],
      ['after the amplifier', `${fig(c.out * state.gain * 1000)} mV`],
      ['ADC counts', c.saturated ? 'saturated' : String(c.counts)],
      ['ΔR', `${fig(c.dR * 1000)} mΩ`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Lead wires add resistance in series with each gauge, and a long cable picks up noise. Real installations use three-wire leads, shielded twisted pair, and a gauge whose alloy is matched to the part to cut thermal drift.`;
    let title = 'Too small to read directly';
    let body = String.raw`At ${fig(c.strain * 1e6)} με the gauge changes by ${fig(c.dR * 1000)} mΩ, and the bridge gives ${fig(c.out * 1000)} mV: about ${c.counts} counts of a 12-bit ADC. Amplify it before it reaches the ADC.`;
    if (state.gain >= 20 && state.kind === 'quarter' && Math.abs(c.heatError) > 0.2 * Math.abs(c.out)) {
      title = 'The room reads as load';
      body = String.raw`Warming ${fig(state.dT)} °C shifts the output ${fig(c.heatError * 1000)} mV, as if the load had changed. One gauge cannot tell heat from strain. Put a second gauge where it feels the heat but the opposite strain.`;
    } else if (state.kind !== 'quarter') {
      title = state.kind === 'full' ? 'Four times the signal, no drift' : 'Twice the signal, no drift';
      body = String.raw`Gauges in tension and compression add their signals, ${fig(c.out * 1000)} mV here, while a temperature change that every gauge feels cancels across the bridge.`;
    } else if (state.gain >= 20) {
      title = 'Amplified, now it reads';
      body = String.raw`With a gain of ${fig(state.gain)}, ${fig(c.out * 1000)} mV becomes ${c.counts} counts: about one count per ${fig(c.strain * 1e6 / Math.max(1, Math.abs(c.counts)))} με.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
