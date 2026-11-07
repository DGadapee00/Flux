import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FINISHES, thermalChecked } from '@flux/subjects/heat/spacecraft.js';

/**
 * Thermal balance: a 0.5 m satellite's temperature through an orbit, set by what it absorbs and what
 * it radiates.
 *
 * Shows that a satellite's temperature follows its finish's α/ε, not how dark it looks: polished
 * aluminium runs far hotter than black paint, and white paint runs cold. Its thermal mass smooths the
 * swing between the sunlit and eclipse temperatures. The balance comes in closed form; the second
 * method integrates the temperature through 40 orbits and checks it radiates what it absorbs
 * (packages/subjects/src/heat/spacecraft.js).
 */
const SCENARIOS = [
  { id: 'black', name: 'Black paint at 500 km', finish: 'black', env: 'leo', h: 500, Q: 10, mass: 10 },
  { id: 'white', name: 'White paint at 500 km', finish: 'white', env: 'leo', h: 500, Q: 10, mass: 10 },
  { id: 'aluminium', name: 'Polished aluminium at 500 km', finish: 'aluminium', env: 'leo', h: 500, Q: 10, mass: 10 },
  { id: 'deep', name: 'Black paint in deep space, no power inside', finish: 'black', env: 'deep', h: 500, Q: 0, mass: 10 },
];
const K0 = 273.15;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, finish: sc.finish, env: sc.env, h: sc.h, Q: sc.Q, mass: sc.mass });
}

const KEYS = [['tb-h', 'h'], ['tb-q', 'Q'], ['tb-m', 'mass']];
const degC = (T) => `${fig(T - K0)} °C`;

export default defineLab({
  id: 'balance',
  exam: 'u6',
  title: 'Thermal balance',
  hint: 'Swap the black paint for polished aluminium: hotter, not cooler. Then for white paint. Add mass and the swing through each orbit narrows.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('black', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'mass', lo: 2, hi: 50 }),
  controls() {
    return `
      <label class="field"><span>Finish</span><select id="tb-f">${Object.entries(FINISHES).map(([id, f]) => `<option value="${id}">${f.name}, α = ${f.alpha}, ε = ${f.eps}</option>`).join('')}</select></label>
      <label class="field"><span>Where</span><select id="tb-e"><option value="leo">Low orbit, Sun in its plane</option><option value="deep">Deep space at Earth's distance from the Sun</option></select></label>
      ${slider('tb-h', 'Orbit altitude (km)', 500, 400, 1500, 10)}
      ${slider('tb-q', 'Power dissipated inside (W)', 10, 0, 50, 1)}
      ${slider('tb-m', 'Mass, aluminium (kg)', 10, 2, 50, 1)}
      <p class="tiny">A sphere 0.5 m across, one temperature throughout. Sunlight 1361 W/m², Earth's albedo 0.3 and its infrared 237 W/m². Dashed: the temperatures it would reach if it stayed in sun or in shadow long enough. Grey: shadow.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['tb-f', 'finish'], ['tb-e', 'env']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['tb-f', 'finish'], ['tb-e', 'env']]) {
      const el = document.getElementById(id);
      if (el) el.value = state[key];
    }
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const r = thermalChecked(state);
    return { ...r, swing: r.Tmax - r.Tmin, ratio: r.alpha / r.eps };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const deep = state.env === 'deep';
    const lo = Math.min(c.Tmin, deep ? c.Thot : c.Tcold) - K0 - 10;
    const hi = Math.max(c.Tmax, c.Thot) - K0 + 10;
    const P = plotIn(B, B.free, { lo: 0, hi: 1 }, { lo, hi });
    axes(P, { xLabel: deep ? 'time (one stretch as long as an orbit)' : 'one orbit', yLabel: 'temperature (°C)' });
    if (!deep) {
      const w = c.Te / c.T;
      poly(P, [[0.5 - w / 2, lo], [0.5 + w / 2, lo], [0.5 + w / 2, hi], [0.5 - w / 2, hi]], { fill: alpha(C.muted, 0.14), stroke: null });
      seg(P, [0, c.Tcold - K0], [1, c.Tcold - K0], { color: alpha(C.blue, 0.7), width: 1.5, dash: [6, 4] });
      label(P, `in shadow for good: ${degC(c.Tcold)}`, [1, c.Tcold - K0], { color: C.blue, align: 'right', dy: 12 });
    }
    seg(P, [0, c.Thot - K0], [1, c.Thot - K0], { color: alpha(C.red, 0.7), width: 1.5, dash: [6, 4] });
    label(P, `in sun for good: ${degC(c.Thot)}`, [1, c.Thot - K0], { color: C.red, align: 'right', dy: -10 });
    line(P, c.trace.map(([t, T]) => [t, T - K0]), { color: C.gold, width: 2.5 });
  },
  law: () => [String.raw`\varepsilon\sigma A T^4 = \alpha S A_p + \alpha a S A F + \varepsilon q_E A F + Q`, String.raw`m c\,\frac{dT}{dt} = \text{absorbed}(t) + Q - \varepsilon\sigma A T^4`],
  liveRows(state, c) {
    return [
      kv('α, ε, α/ε', `${c.alpha}, ${c.eps}, ${fig(c.ratio)}`),
      kv('Absorbed in sun, in shadow (with Q)', `${fig(c.inSun)} W, ${fig(c.inShadow)} W`),
      kv('Steady in sun, in shadow', state.env === 'deep' ? degC(c.Thot) : `${degC(c.Thot)}, ${degC(c.Tcold)}`),
      kv('Over the orbit, highest and lowest', `${degC(c.Tmax)}, ${degC(c.Tmin)}`),
      kv('Average absorbed, closed form', `${fig(c.avgIn)} W`),
      kv('Average radiated, integrated', `${fig(c.emittedAvg)} W`),
      kv('Two methods differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['highest', degC(c.Tmax)],
      ['lowest', degC(c.Tmin)],
      ['α/ε', fig(c.ratio)],
      ['swing', `${fig(c.swing)} K`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One temperature throughout. A real satellite has hot and cold faces, conduction between them, heaters and louvres, and finishes whose α creeps up as sunlight ages them.`;
    if (state.finish === 'aluminium') {
      return { title: 'Shiny runs hot', body: `Polished aluminium absorbs only 15% of sunlight, but it can radiate only 5% of what a black body would: α/ε = ${fig(c.ratio)}, three times black paint's. It holds on to what it takes in and runs at ${degC(c.Tmax)}. ${leavesOut}` };
    }
    if (state.finish === 'white') {
      return { title: 'White runs cold', body: `White paint absorbs 20% of sunlight but radiates its own heat almost like a black body: α/ε = ${fig(c.ratio)}. The satellite stays between ${degC(c.Tmin)} and ${degC(c.Tmax)}. Radiators use white for this. ${leavesOut}` };
    }
    return { title: 'α/ε sets the temperature', body: `Black paint absorbs 95% and radiates 90%: α/ε = ${fig(c.ratio)}. In sun for good it would reach ${degC(c.Thot)}${state.env === 'deep' ? '' : `, in shadow ${degC(c.Tcold)}`}; with ${fig(state.mass)} kg of aluminium it swings only between ${degC(c.Tmin)} and ${degC(c.Tmax)}. ${leavesOut}` };
  },
  app: false,
});
