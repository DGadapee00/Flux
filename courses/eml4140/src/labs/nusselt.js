import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS, RE_C, localH, plateConvection } from '@flux/subjects/heat/convection.js';

/**
 * Nusselt: the local heat transfer coefficient along a heated flat plate, with its average.
 *
 * Shows that h is not a property of the fluid. It is largest at the leading edge, where the thermal
 * layer is thinnest, falls as x^(−1/2) along the laminar plate, jumps where the layer turns turbulent
 * at Re_x = 5 × 10⁵, and depends on the speed as much as on the fluid. The average comes in closed
 * form; the second method averages the local h by Simpson's rule
 * (packages/subjects/src/heat/convection.js).
 */
const SCENARIOS = [
  { id: 'air', name: 'Air at 5 m/s along a 1 m plate', fluid: 'air', U: 5, L: 1, xs: 0.2 },
  { id: 'air-fast', name: 'Air at 20 m/s: turbulent from 0.39 m', fluid: 'air', U: 20, L: 1, xs: 0.35 },
  { id: 'water', name: 'Water at 0.5 m/s', fluid: 'water', U: 0.5, L: 1, xs: 0.5 },
  { id: 'oil', name: 'Engine oil at 2 m/s', fluid: 'oil', U: 2, L: 1, xs: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, lU: Math.log10(sc.U), L: sc.L, xs: sc.xs });
}

export default defineLab({
  id: 'nusselt',
  exam: 'u3',
  title: 'Nusselt',
  hint: 'Read h near the leading edge and far along: it falls. Speed the air up until the layer turns turbulent and watch h jump back up partway along.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('air', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lU', lo: -1.3, hi: 1.7 }),
  controls() {
    return `
      <label class="field"><span>Fluid, near 300 K</span><select id="nu-fluid">${Object.entries(FLUIDS).map(([id, f]) => `<option value="${id}">${f.name}, Pr = ${f.Pr}</option>`).join('')}</select></label>
      ${slider('nu-u', 'Stream speed, log₁₀ U (m/s)', Math.log10(5), -1.3, 1.7, 0.01)}
      ${slider('nu-l', 'Plate length L (m)', 1, 0.2, 3, 0.05)}
      ${slider('nu-x', 'Read h at x (m)', 0.2, 0.02, 3, 0.01)}
      <p class="tiny">U from 0.05 to 50 m/s. Laminar Nu_x = 0.332 Re_x^(1/2) Pr^(1/3) up to Re_x = 5 × 10⁵, then turbulent Nu_x = 0.0296 Re_x^(4/5) Pr^(1/3).</p>`;
  },
  bind(api) {
    document.getElementById('nu-fluid')?.addEventListener('change', (e) => {
      api.slice().fluid = e.target.value;
      api.bump();
    });
    bindSlider('nu-u', (s, v) => { s.lU = v; }, api);
    bindSlider('nu-l', (s, v) => { s.L = v; }, api);
    bindSlider('nu-x', (s, v) => { s.xs = v; }, api);
  },
  syncControls(state) {
    const f = document.getElementById('nu-fluid');
    if (f) f.value = state.fluid;
    for (const [id, val] of [['nu-u', state.lU], ['nu-l', state.L], ['nu-x', state.xs]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const U = 10 ** state.lU;
    const p = plateConvection({ fluid: state.fluid, U, L: state.L });
    const x = Math.min(state.xs, state.L);
    const hx = localH({ fluid: state.fluid, U }, x);
    const Rex = (U * x) / p.nu;
    return { ...p, U, x, hx, Rex, turbulentAt: Rex >= RE_C };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const L = state.L;
    const shown = c.curve.filter(([x]) => x >= 0.06 * L);
    const top = 1.15 * Math.max(...shown.map(([, h]) => h), c.hBar);
    const P = plotIn(B, B.free, { lo: 0, hi: L }, { lo: 0, hi: top });
    axes(P, { xLabel: 'x along the plate (m)', yLabel: 'h (W/m²·K)' });
    // The local h, from where it enters the plot: it grows without bound at the leading edge.
    const lam = c.curve.filter(([x, h]) => x < c.xc && h <= top);
    const turb = c.curve.filter(([x]) => x >= c.xc);
    line(P, lam, { color: C.gold, width: 2.5 });
    if (turb.length) line(P, turb, { color: C.red, width: 2.5 });
    seg(P, [0, c.hBar], [L, c.hBar], { color: C.teal, width: 1.5, dash: [6, 4] });
    label(P, `average h̄ = ${fig(c.hBar)}`, [L, c.hBar], { color: C.teal, align: 'right', dy: -10 });
    if (!c.laminarAll) {
      seg(P, [c.xc, 0], [c.xc, top], { color: alpha(C.red, 0.5), width: 1, dash: [3, 3] });
      label(P, 'turbulent', [c.xc, top], { color: C.red, align: 'left', dx: 6, dy: 12 });
    }
    label(P, 'laminar', [Math.min(c.xc, L) / 2, top], { color: C.gold, dy: 12 });
    dot(P, c.x, Math.min(c.hx, top), { color: C.yellow, r: 6, ring: C.text });
    label(P, `h = ${fig(c.hx)} at ${fig(c.x)} m`, [c.x, Math.min(c.hx, top)], { color: C.yellow, align: c.x > 0.6 * L ? 'right' : 'left', dx: c.x > 0.6 * L ? -10 : 10, dy: -12 });
  },
  law: () => [String.raw`h = \frac{q''}{T_s - T_\infty}, \qquad \text{Nu}_x = \frac{hx}{k}`, String.raw`\text{laminar: } \text{Nu}_x = 0.332\,\text{Re}_x^{1/2}\text{Pr}^{1/3}`, String.raw`\text{turbulent: } \text{Nu}_x = 0.0296\,\text{Re}_x^{4/5}\text{Pr}^{1/3}`],
  liveRows(state, c) {
    return [
      kv('U, Re_L', `${fig(c.U)} m/s, ${c.ReL.toExponential(2)}`),
      kv('Turns turbulent at', c.laminarAll ? `beyond the plate (${fig(c.xc)} m)` : `${fig(c.xc)} m`),
      kv(`Local h at ${fig(c.x)} m`, `${fig(c.hx)} W/m²·K (${c.turbulentAt ? 'turbulent' : 'laminar'})`),
      kv('Average h̄, closed form', `${fig(c.hBar)} W/m²·K`),
      kv('Average h̄, Simpson on the local h', `${fig(c.hBarNum)} W/m²·K`),
      kv('Average Nu', fig(c.NuBar)),
      kv('Flux at ΔT = 40 K', `${fig(c.q)} W/m²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['h at x', `${fig(c.hx)}`],
      ['average h̄', `${fig(c.hBar)}`],
      ['Re_L', c.ReL.toExponential(1)],
      ['turbulent from', c.laminarAll ? 'off plate' : `${fig(c.xc)} m`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A smooth plate heated from its leading edge, constant properties and a sharp switch at Re_x = 5 × 10⁵. Real transition is spread out, and roughness or a disturbed stream brings it earlier.`;
    if (!c.laminarAll) {
      return {
        title: 'A jump at transition',
        body: `The layer turns turbulent ${fig(c.xc)} m along. Turbulent eddies carry heat across the layer far faster than conduction alone, so h jumps up there and then falls only as x^(−1/5). Over this plate the average is ${fig(c.hBar)} W/m²·K. ${leavesOut}`,
      };
    }
    return {
      title: 'Largest at the leading edge',
      body: `The thermal layer starts at zero thickness at the leading edge and grows as √x, so the wall gradient, and h with it, falls as 1/√x: ${fig(c.hx)} W/m²·K at ${fig(c.x)} m. The average over the plate is twice the value at its end, ${fig(c.hBar)} W/m²·K. Change the speed or the plate and h changes, with the same ${FLUIDS[state.fluid].name.toLowerCase()}. ${leavesOut}`,
    };
  },
  app: false,
});
