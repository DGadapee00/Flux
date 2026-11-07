import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS, RE_LAMINAR, headLoss } from '@flux/subjects/mechanics/headloss.js';

/**
 * Head loss: the loss along 10 m of straight pipe against the flow rate, laminar through turbulent,
 * with the pipe's roughness as a slider.
 *
 * Shows that loss does not grow in step with speed. While laminar it does, h_L ∝ Q, and roughness
 * does not matter; once turbulent it grows nearly as Q², and roughness raises it. Laminar loss is
 * checked against Hagen–Poiseuille; turbulent friction from Colebrook by Newton's method against
 * Colebrook's exact solution through the Lambert W function (packages/subjects/src/mechanics/
 * headloss.js).
 */
const SCENARIOS = [
  { id: 'laminar', name: 'Oil at 1 L/s in a 5 cm pipe: laminar', fluid: 'oil', Q: 1, Dcm: 5, emm: 0.045 },
  { id: 'smooth', name: 'Water at 2 L/s in 5 cm steel', fluid: 'water', Q: 2, Dcm: 5, emm: 0.045 },
  { id: 'rough', name: 'The same pipe, rough: ε = 1 mm', fluid: 'water', Q: 2, Dcm: 5, emm: 1 },
  { id: 'small', name: 'Water at 0.5 L/s in 2 cm tubing', fluid: 'water', Q: 0.5, Dcm: 2, emm: 0.0015 },
];
const L = 10;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, lQ: Math.log10(sc.Q), Dcm: sc.Dcm, emm: sc.emm });
}

const KEYS = [['hl-q', 'lQ'], ['hl-d', 'Dcm'], ['hl-e', 'emm']];
const params = (s, Qls) => ({ fluid: s.fluid, Q: Qls / 1000, D: s.Dcm / 100, eps: s.emm / 1000, L });

export default defineLab({
  id: 'headloss',
  exam: 'u3',
  title: 'Head loss',
  hint: 'Double the flow in the laminar oil and the loss doubles. Do it in the rough water pipe and it nearly quadruples. Then add roughness to each.',
  gapLimit: 1e-10,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('smooth', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lQ', lo: -2, hi: 1.7 }),
  controls() {
    return `
      <label class="field"><span>Fluid</span><select id="hl-f">${Object.entries(FLUIDS).map(([id, f]) => `<option value="${id}">${f.name}</option>`).join('')}</select></label>
      ${slider('hl-q', 'Flow rate, log₁₀ Q (L/s)', 0.3, -2, 1.7, 0.01)}
      ${slider('hl-d', 'Pipe diameter (cm)', 5, 1, 10, 0.1)}
      ${slider('hl-e', 'Wall roughness ε (mm)', 0.045, 0, 1, 0.005)}
      <p class="tiny">10 m of straight pipe. Laminar below Re = 2300 here; the real switch is spread over 2300 to about 4000. Drawn tubing is near 0.0015 mm, commercial steel near 0.045 mm. Dashed: the same pipe perfectly smooth.</p>`;
  },
  bind(api) {
    document.getElementById('hl-f')?.addEventListener('change', (e) => {
      api.slice().fluid = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const f = document.getElementById('hl-f');
    if (f) f.value = state.fluid;
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const Qls = 10 ** state.lQ;
    const r = headLoss(params(state, Qls));
    const curve = [];
    const smooth = [];
    for (let i = 0; i <= 160; i++) {
      const q = 10 ** (-2 + (3.7 * i) / 160);
      curve.push([q, headLoss(params(state, q)).hL]);
      smooth.push([q, headLoss({ ...params(state, q), eps: 0 }).hL]);
    }
    const Qlam = (RE_LAMINAR * Math.PI * (state.Dcm / 100) * FLUIDS[state.fluid].nu) / 4 * 1000; // L/s at Re = 2300
    return { ...r, Qls, curve, smooth, Qlam };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const ys = c.curve.map(([, h]) => h).filter((h) => h > 0);
    const lo = Math.max(1e-7, Math.min(...ys) / 2);
    const hi = Math.max(...ys) * 2;
    const P = plotIn(B, B.free, { lo: 0.01, hi: 50, log: true }, { lo, hi, log: true });
    axes(P, { xLabel: 'flow rate Q (L/s)', yLabel: 'head loss over 10 m (m)' });
    if (c.Qlam > 0.01) poly(P, [[0.01, lo], [Math.min(c.Qlam, 50), lo], [Math.min(c.Qlam, 50), hi], [0.01, hi]], { fill: alpha(C.teal, 0.08), stroke: null });
    if (c.Qlam > 0.01 && c.Qlam < 50) {
      seg(P, [c.Qlam, lo], [c.Qlam, hi], { color: alpha(C.teal, 0.6), width: 1, dash: [3, 3] });
      label(P, 'laminar', [Math.max(0.012, c.Qlam / 2.2), hi], { color: C.teal, dy: 12 });
      label(P, 'turbulent', [Math.min(45, c.Qlam * 2.2), hi], { color: C.gold, dy: 12 });
    }
    line(P, c.smooth, { color: alpha(C.text, 0.5), width: 1.5, dash: [5, 4] });
    line(P, c.curve, { color: C.gold, width: 2.5 });
    dot(P, c.Qls, c.hL, { color: C.yellow, r: 6, ring: C.text });
    label(P, `${fig(c.hL)} m`, [c.Qls, c.hL], { color: C.yellow, align: c.Qls > 5 ? 'right' : 'left', dx: c.Qls > 5 ? -10 : 10, dy: -10 });
  },
  law: () => [String.raw`h_L = f\,\frac{L}{D}\,\frac{V^2}{2g}, \qquad f_\text{lam} = \frac{64}{\text{Re}}`, String.raw`\frac{1}{\sqrt f} = -2\log_{10}\left(\frac{\varepsilon/D}{3.7} + \frac{2.51}{\text{Re}\sqrt f}\right)`],
  liveRows(state, c) {
    return [
      kv('Speed, Reynolds number', `${fig(c.V)} m/s, ${fig(c.Re)}`),
      kv('Regime', c.laminar ? 'laminar' : 'turbulent'),
      kv('Relative roughness ε/D', c.rel.toExponential(1)),
      kv('Friction factor f', fig(c.f)),
      kv('Head loss', `${fig(c.hL)} m`),
      kv(c.laminar ? 'By Hagen–Poiseuille' : 'By Colebrook through Lambert W', `${fig(c.hLcheck)} m`),
      kv('Two methods differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['h_L', `${fig(c.hL)} m`],
      ['Re', fig(c.Re)],
      ['f', fig(c.f)],
      ['regime', c.laminar ? 'laminar' : 'turbulent'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Fittings, bends and valves, which add minor losses K·V²/2g of their own, and the transition between Re = 2300 and about 4000, where the friction factor is uncertain.`;
    if (c.laminar) {
      return { title: 'Laminar: loss in step with flow', body: `At Re = ${fig(c.Re)} the flow is laminar, f = 64/Re, so h_L = 32νLV/(gD²) grows in step with the flow and ignores the wall's roughness: ${fig(c.hL)} m over 10 m. ${leavesOut}` };
    }
    return { title: 'Turbulent: loss nearly as Q²', body: `At Re = ${fig(c.Re)} eddies reach the wall and its roughness, ε/D = ${c.rel.toExponential(1)}, counts. f = ${fig(c.f)} changes slowly with Re, so h_L grows nearly as V²: ${fig(c.hL)} m over 10 m. ${leavesOut}` };
  },
  app: false,
});
