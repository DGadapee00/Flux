import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS } from '@flux/subjects/mechanics/couette.js';
import { profileAt, plate } from '@flux/subjects/mechanics/blasius.js';

/**
 * Boundary layer: a steady stream along a flat plate, with the thin layer where the fluid slows to
 * rest at the wall.
 *
 * Shows that the layer does not grow in step with distance: a laminar layer grows as √x, and faster
 * flow makes it thinner, δ = 4.91 x/√Re_x. The profile u/U = f′(η) has the same shape at every
 * station, stretched with δ. The constants 4.91 and 0.332 are checked by solving the Blasius equation
 * by shooting (packages/subjects/src/mechanics/blasius.js). Past Re_x ≈ 5 × 10⁵ the layer turns
 * turbulent and these laminar results stop.
 */
const SCENARIOS = [
  { id: 'air', name: 'Air at 5 m/s along a 1 m plate', fluid: 'air', U: 5, L: 1 },
  { id: 'faster', name: 'The same at 10 m/s: transition on the plate', fluid: 'air', U: 10, L: 1 },
  { id: 'water', name: 'Water at 0.5 m/s', fluid: 'water', U: 0.5, L: 0.5 },
  { id: 'oil', name: 'Olive oil at 1 m/s: a thick layer', fluid: 'oil', U: 1, L: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, U: sc.U, L: sc.L });
}

export default defineLab({
  id: 'layer',
  exam: 'u3',
  title: 'Boundary layer',
  hint: 'Read the layer’s thickness at the end of the plate, then double the speed: it thins by √2, not by half. Move along the plate and it grows as √x.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('air', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'U', lo: 0.2, hi: 20 }),
  controls() {
    return `
      <label class="field"><span>Fluid</span><select id="bl-fluid">${['air', 'water', 'oil', 'glycerol'].map((id) => `<option value="${id}">${FLUIDS[id].name}</option>`).join('')}</select></label>
      ${slider('bl-U', 'Free-stream speed U (m/s)', 5, 0.2, 20, 0.1)}
      ${slider('bl-L', 'Plate length L (m)', 1, 0.1, 3, 0.05)}
      <p class="tiny">The height is stretched to make the layer visible: read δ off the axis in mm. Arrows: u/U at three stations.</p>`;
  },
  bind(api) {
    document.getElementById('bl-fluid')?.addEventListener('change', (e) => {
      api.slice().fluid = e.target.value;
      api.bump();
    });
    bindSlider('bl-U', (s, v) => { s.U = v; }, api);
    bindSlider('bl-L', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const f = document.getElementById('bl-fluid');
    if (f) f.value = state.fluid;
    for (const [id, v] of [['bl-U', state.U], ['bl-L', state.L]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const f = FLUIDS[state.fluid] || FLUIDS.air;
    const nu = f.mu / f.rho;
    const p = plate({ U: state.U, L: state.L, nu, rho: f.rho });
    const xEnd = p.laminarAll ? state.L : p.xTr;
    return { ...p, nu, rho: f.rho, fluidName: f.name, xEnd, deltaEnd: p.delta(xEnd), deltaHalf: p.delta(xEnd / 2) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const L = state.L;
    const hMax = 1.6 * c.delta(L) * 1000; // mm
    const P = plotIn(B, B.free, { lo: 0, hi: L }, { lo: 0, hi: hMax });
    axes(P, { xLabel: 'x along the plate (m)', yLabel: 'y (mm)' });
    // The plate, and the layer's edge, laminar part solid and the rest dashed.
    poly(P, [[0, 0], [L, 0], [L, -hMax * 0.03], [0, -hMax * 0.03]], { fill: alpha(C.text, 0.5), stroke: null });
    const edge = [];
    const after = [];
    for (let i = 0; i <= 200; i++) {
      const x = (L * i) / 200;
      const pt = [x, c.delta(x) * 1000];
      if (x <= c.xEnd) edge.push(pt);
      else after.push(pt);
    }
    if (after.length) after.unshift(edge.at(-1));
    poly(P, [[0, 0], ...edge, [edge.at(-1)[0], 0]], { fill: alpha(C.blue, 0.15), stroke: null });
    line(P, edge, { color: C.blue, width: 2.5 });
    if (after.length > 1) line(P, after, { color: alpha(C.blue, 0.5), width: 1.5, dash: [5, 4] });
    if (!c.laminarAll) {
      seg(P, [c.xTr, 0], [c.xTr, hMax * 0.95], { color: C.pink, width: 1.5, dash: [3, 3] });
      label(P, `Re_x = 5 × 10⁵: turbulent from here`, [c.xTr, hMax * 0.97], { color: C.pink, align: c.xTr > 0.6 * L ? 'right' : 'left', dx: c.xTr > 0.6 * L ? -6 : 6 });
    }
    // Velocity profiles u/U = f′(η) at three stations, η = y √(U/νx).
    for (const frac of [0.2, 0.45, 0.75]) {
      const x = frac * c.xEnd;
      const d = c.delta(x) * 1000;
      const w = 0.14 * L;
      const prof = [];
      for (let k = 0; k <= 40; k++) {
        const y = (1.2 * d * k) / 40;
        const eta = (y / 1000) * Math.sqrt(state.U / (c.nu * x));
        prof.push([x + w * profileAt(eta), y]);
      }
      seg(P, [x, 0], [x, 1.2 * d], { color: alpha(C.text, 0.3), width: 1 });
      line(P, prof, { color: C.teal, width: 2 });
      for (let k = 1; k <= 5; k++) {
        const y = (1.2 * d * k) / 6;
        const eta = (y / 1000) * Math.sqrt(state.U / (c.nu * x));
        const len = w * profileAt(eta) * (P.box.x1 - P.box.x0) / L;
        if (len > 4) arrow(P, [x, y], 0, len, { color: alpha(C.teal, 0.6), width: 1.2, head: 5 });
      }
    }
    label(P, `δ = ${fig(c.deltaEnd * 1000)} mm at x = ${fig(c.xEnd)} m`, [0.04 * L, hMax * 0.85], { color: C.blue, align: 'left' });
  },
  law: () => [String.raw`\delta = \frac{4.91\,x}{\sqrt{\mathrm{Re}_x}}, \qquad \mathrm{Re}_x = \frac{Ux}{\nu}`, String.raw`f''' + \tfrac12 f f'' = 0, \qquad \frac{u}{U} = f'(\eta), \quad \eta = y\sqrt{\frac{U}{\nu x}}`],
  liveRows(state, c) {
    return [
      kv('Re at the end of the plate', fig(c.ReL)),
      kv('δ at the end of the laminar part', `${fig(c.deltaEnd * 1000)} mm at x = ${fig(c.xEnd)} m`),
      kv('Laminar to', c.laminarAll ? `the whole plate (transition would be at ${fig(c.xTr)} m)` : `${fig(c.xTr)} m, where Re_x = 5 × 10⁵`),
      kv('Skin friction, one side, laminar C_f', fig(c.Cf)),
      kv('Drag per metre of width, if all laminar', `${fig(c.drag)} N`),
      kv('Blasius by shooting: η₉₉, f″(0)', `${fig(c.eta99)}, ${fig(c.wall)}`),
      kv('Against 4.91 and 0.332', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['δ at the end', `${fig(c.deltaEnd * 1000)} mm`],
      ['Re_L', fig(c.ReL)],
      ['laminar to', c.laminarAll ? 'the end' : `${fig(c.xTr)} m`],
      ['C_f', fig(c.Cf)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Pressure gradients and turbulence. On a curved body the pressure rises toward the back and can lift the layer off the surface: separation. A turbulent layer grows faster, about as x⁴ᐟ⁵, and drags harder, but resists separating.`;
    let title = 'The layer grows as √x';
    let body = `Momentum diffuses out from the wall while the flow carries it downstream, so the layer's thickness goes as √(νx/U): ${fig(c.deltaHalf * 1000)} mm halfway, ${fig(c.deltaEnd * 1000)} mm at the end. Twice as far, √2 as thick.`;
    if (!c.laminarAll) {
      title = 'Faster flow: thinner, and turbulent sooner';
      body = `At ${fig(state.U)} m/s the layer is thinner, δ ∝ 1/√U, but Re_x reaches 5 × 10⁵ at x = ${fig(c.xTr)} m. Past that point small disturbances grow and the layer turns turbulent; the laminar formula no longer applies there.`;
    } else if (state.fluid === 'oil' || state.fluid === 'glycerol') {
      title = 'A viscous fluid: a thick layer';
      body = `With ν = ${fig(c.nu * 1e6)} mm²/s the layer reaches ${fig(c.deltaEnd * 1000)} mm, much thicker than in air or water, and stays laminar at Re_L = ${fig(c.ReL)}.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
