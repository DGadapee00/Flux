import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { bendPressure, bendPressureSteps } from '@flux/subjects/mechanics/flowfields.js';

/**
 * Bend: flow round a 90° bend in a channel, with the pressure across it.
 *
 * Shows Euler's equation across curved streamlines, ∂p/∂r = ρu²/r: turning a flow takes a pressure
 * that rises toward the outside of the bend. The closed form (packages/subjects/src/mechanics/
 * flowfields.js) integrates that for a free vortex or a uniform profile; the second method sums it
 * across the channel by Simpson's rule. `gap` is the difference in the pressure rise, as a share.
 */
const FLUIDS = {
  water: { id: 'water', name: 'Water', rho: 998 },
  air: { id: 'air', name: 'Air', rho: 1.2 },
};

const SCENARIOS = [
  { id: 'elbow', name: 'Water elbow', fluid: 'water', V: 2, R: 0.3, w: 0.2, profile: 'vortex' },
  { id: 'tight', name: 'A tight bend', fluid: 'water', V: 2, R: 0.15, w: 0.2, profile: 'vortex' },
  { id: 'wide', name: 'A wide sweep', fluid: 'water', V: 2, R: 1, w: 0.2, profile: 'vortex' },
  { id: 'uniform', name: 'Same elbow, even speed across', fluid: 'water', V: 2, R: 0.3, w: 0.2, profile: 'uniform' },
  { id: 'duct', name: 'Air duct', fluid: 'air', V: 10, R: 0.5, w: 0.25, profile: 'vortex' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, V: sc.V, R: sc.R, w: sc.w, profile: sc.profile });
}

/** Pressure in kPa when it is at least 1 kPa, else in Pa. */
const pu = (dp) => (dp >= 1000 ? { k: 1000, unit: 'kPa' } : { k: 1, unit: 'Pa' });
const pText = (v, dp) => `${fig(v / pu(dp).k)} ${pu(dp).unit}`;

const params = (s) => ({ rho: (FLUIDS[s.fluid] || FLUIDS.water).rho, V: s.V, R: s.R, w: s.w, profile: s.profile });

export default defineLab({
  id: 'bend',
  exam: 'u3',
  title: 'Bend',
  hint: 'Speed the flow up or tighten the bend: the pressure on the outer wall climbs above the inner.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('elbow', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V', lo: 0.5, hi: 10 }),
  controls() {
    return `
      <label class="field"><span>Fluid</span><select id="be-fluid">${Object.values(FLUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      <label class="field"><span>Speed across the channel</span><select id="be-profile"><option value="vortex">Free vortex: faster inside</option><option value="uniform">Uniform</option></select></label>
      ${slider('be-V', 'mean speed V (m/s)', 2, 0.5, 10, 0.1)}
      ${slider('be-R', 'centre-line radius R (m)', 0.3, 0.15, 1, 0.01)}
      ${slider('be-w', 'channel width w (m)', 0.2, 0.05, 0.25, 0.01)}
      <p class="tiny">A free vortex, speed K/r, is how a flow with no friction goes round a bend.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['be-fluid', 'fluid'], ['be-profile', 'profile']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    bindSlider('be-V', (s, v) => { s.V = v; }, api);
    bindSlider('be-R', (s, v) => { s.R = v; }, api);
    bindSlider('be-w', (s, v) => { s.w = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['be-fluid', state.fluid], ['be-profile', state.profile]]) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    }
    for (const [id, val] of [['be-V', state.V], ['be-R', state.R], ['be-w', state.w]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = params(state);
    const { speed, ...a } = bendPressure(p);
    const n = bendPressureSteps(p, 60);
    const gap = Math.abs(n.dp - a.dp) / a.dp;
    const estimate = (p.rho * p.V * p.V * p.w) / p.R;
    return { rho: p.rho, ...a, uMid: speed(p.R), profileR: n.r, profileP: n.p, estimate, gap, dynamic: 0.5 * p.rho * p.V * p.V };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [left, right] = split(B.free, 0.55);
    const { r1, r2 } = c;
    const S = sceneIn(B, left, { x0: -0.08 * r2, x1: r2 * 1.08, y0: -0.08 * r2, y1: r2 * 1.08 }, 22);
    const arc = (r, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
      const th = (i / n) * (Math.PI / 2);
      return [r * Math.cos(th), r * Math.sin(th)];
    });
    // Pressure as colour: thin rings from the inner wall (blue, low) to the outer (gold, high).
    const rings = 24;
    for (let i = 0; i < rings; i++) {
      const ra = r1 + (i / rings) * (r2 - r1);
      const rb = r1 + ((i + 1) / rings) * (r2 - r1);
      const k = (i + 0.5) / rings;
      const idx = Math.round(k * (c.profileP.length - 1));
      const share = c.profileP[idx] / c.dp;
      const col = share < 0.5 ? alpha(C.blue, 0.35 - 0.5 * share) : alpha(C.gold, (share - 0.5) * 0.7);
      poly(S, [...arc(ra), ...arc(rb).reverse()], { fill: col, stroke: null });
    }
    line(S, arc(r1), { color: C.muted, width: 3 });
    line(S, arc(r2), { color: C.muted, width: 3 });
    // Streamlines with arrows sized by the local speed.
    const uMax = Math.max(c.uIn, c.uOut);
    for (let j = 1; j <= 4; j++) {
      const r = r1 + (j / 5) * (r2 - r1);
      line(S, arc(r), { color: alpha(C.teal, 0.6), width: 1 });
      const u = state.profile === 'uniform' ? state.V : c.K / r;
      const th = Math.PI / 4;
      arrow(S, [r * Math.cos(th), r * Math.sin(th)], th + Math.PI / 2, 14 + 26 * (u / uMax), { color: C.teal, width: 2, head: 7 });
    }
    label(S, 'inner wall', [r1 * 0.72, r1 * 0.72], { color: C.blue, align: 'right' });
    label(S, 'outer wall', [r2 * 0.75, r2 * 0.75], { color: C.gold, align: 'left', dx: 12 });
    const { k, unit } = pu(c.dp);
    const P = plotIn(B, right, { lo: c.r1, hi: c.r2 }, { lo: 0, hi: (c.dp * 1.15) / k });
    axes(P, { xLabel: 'r (m)', yLabel: `p − p_inner (${unit})` });
    line(P, c.profileR.map((r, i) => [r, c.profileP[i] / k]), { color: C.gold, width: 2.5 });
    dot(P, c.r2, c.dp / k, { color: C.yellow, r: 5 });
    note(P, `Δp = ${pText(c.dp, c.dp)}`, c.r2, c.dp / k, { color: C.yellow, dx: -10, dy: 14, align: 'right' });
  },
  law: () => [String.raw`\frac{\partial p}{\partial r} = \rho\,\frac{u^2}{r}`, String.raw`u = \frac{K}{r}:\ \ \Delta p = \frac{\rho K^2}{2}\left(\frac{1}{r_1^2} - \frac{1}{r_2^2}\right)`],
  liveRows(state, c) {
    return [
      kv('density $\\rho$', `${fig(c.rho)} kg/m³`),
      kv('inner and outer radius', `${fig(c.r1)} m, ${fig(c.r2)} m`),
      kv('speed at the inner wall', `${fig(c.uIn)} m/s`),
      kv('speed at the outer wall', `${fig(c.uOut)} m/s`),
      kv('rough estimate $\\rho V^2 w/R$', pText(c.estimate, c.dp)),
      kv('closed form against Simpson', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['outer minus inner', pText(c.dp, c.dp)],
      ['inner wall speed', `${fig(c.uIn)} m/s`],
      ['outer wall speed', `${fig(c.uOut)} m/s`],
      ['dynamic pressure', pText(c.dynamic, c.dp)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The flow is two-dimensional and has no friction. In a real pipe bend the slow fluid near the walls is pushed inward by the same pressure difference, which sets up a pair of swirls that carry on downstream.`;
    let title = 'Turning a flow takes pressure';
    let body = String.raw`To move in a circle each parcel needs a push toward the centre of the bend, $\rho u^2/r$ per unit volume. Only pressure can give it, so the pressure rises ${pText(c.dp, c.dp)} from the inner wall to the outer.`;
    if (state.profile === 'vortex' && c.uIn > 1.3 * c.uOut) {
      title = 'Fast inside, slow outside';
      body = String.raw`With no friction, the flow round a bend is a free vortex: faster on the inside (${fig(c.uIn)} m/s) than the outside (${fig(c.uOut)} m/s). Bernoulli then says the pressure is lower inside, and Euler across the streamlines gives the same ${pText(c.dp, c.dp)}.`;
    } else if (state.profile === 'uniform') {
      title = 'Even speed, still a pressure rise';
      body = String.raw`Even with the same speed everywhere, the streamlines curve, so the pressure must rise outward: $\rho V^2 \ln(r_2/r_1)$ = ${pText(c.dp, c.dp)}.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
