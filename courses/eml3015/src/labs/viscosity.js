import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS, couetteStress, marchStartup, settlingTime, startupProfile, startupStress } from '@flux/subjects/mechanics/couette.js';

/**
 * Viscosity: a plate dragged over a thin layer of fluid, from rest to steady shear.
 *
 * Shows that the stress on the plate is μU/h, set by viscosity and the velocity gradient and not
 * by density, and that the layer reaches its straight-line profile on a time h²/ν: momentum
 * diffuses in from the plate, faster in thick fluids than in thin ones.
 *
 * The closed form is the series solution of u_t = ν u_yy (packages/subjects/src/mechanics/
 * couette.js). The second method marches the same equation with finite differences; `gap` is the
 * largest difference between the two profiles, as a share of the plate speed.
 */
const AREA = 0.1; // plate area, m²: a 10 cm by 1 m strip

const SCENARIOS = [
  { id: 'water', name: 'Water, 2 mm gap', fluid: 'water', U: 0.5, h: 2, tFrac: 0.3 },
  { id: 'mercury', name: 'Mercury: dense but runny', fluid: 'mercury', U: 0.5, h: 2, tFrac: 0.3 },
  { id: 'glycerol', name: 'Glycerol: thick and quick to settle', fluid: 'glycerol', U: 0.5, h: 2, tFrac: 0.3 },
  { id: 'oil', name: 'Olive oil, 1 mm gap', fluid: 'oil', U: 1, h: 1, tFrac: 0.5 },
  { id: 'air', name: 'Air, 2 mm gap', fluid: 'air', U: 2, h: 2, tFrac: 0.3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, U: sc.U, h: sc.h, tFrac: sc.tFrac });
}

export default defineLab({
  id: 'viscosity',
  exam: 'u1',
  title: 'Viscosity',
  hint: 'Drag the plate faster or narrow the gap: the stress follows U/h. Change the fluid: viscosity sets the stress, not density.',
  gapLimit: 2e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('water', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tFrac', lo: 0.03, hi: 1.5 }),
  controls() {
    return `
      <label class="field"><span>Fluid</span><select id="vi-fluid">${Object.values(FLUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      ${slider('vi-U', 'plate speed U (m/s)', 0.5, 0.05, 2, 0.05)}
      ${slider('vi-h', 'gap h (mm)', 2, 0.5, 10, 0.5)}
      ${slider('vi-t', 'time since start (settling times)', 0.3, 0.03, 1.5, 0.01)}
      <p class="tiny">Plate area 0.1 m². The lower wall is still.</p>`;
  },
  bind(api) {
    document.getElementById('vi-fluid')?.addEventListener('change', (e) => {
      api.slice().fluid = e.target.value;
      api.bump();
    });
    bindSlider('vi-U', (s, v) => { s.U = v; }, api);
    bindSlider('vi-h', (s, v) => { s.h = v; }, api);
    bindSlider('vi-t', (s, v) => { s.tFrac = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('vi-fluid');
    if (sel) sel.value = state.fluid;
    for (const [id, val] of [['vi-U', state.U], ['vi-h', state.h], ['vi-t', state.tFrac]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const f = FLUIDS[state.fluid] || FLUIDS.water;
    const h = state.h / 1000;
    const U = state.U;
    const nu = f.mu / f.rho;
    const t1 = settlingTime(nu, h);
    const t = state.tFrac * t1;
    const tau = couetteStress(f.mu, U, h);
    const tauNow = startupStress(f.mu, f.rho, U, h, t);
    const N = 80;
    const fd = marchStartup(t, nu, h, N);
    const profile = [];
    let gap = 0;
    for (let i = 0; i <= N; i++) {
      const series = startupProfile(i / N, t, nu, h);
      profile.push([series * U, (i / N) * state.h]);
      gap = Math.max(gap, Math.abs(series - fd[i]));
    }
    return { fluid: f, mu: f.mu, rho: f.rho, nu, U, h, t, t1, tau, tauNow, force: tau * AREA, forceNow: tauNow * AREA, profile, fdTop: fd[Math.round(N / 2)] * U, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: 0, hi: c.U * 1.15 }, { lo: 0, hi: state.h * 1.12 });
    axes(P, { xLabel: 'u (m/s)', yLabel: 'y (mm)' });
    line(P, [[0, state.h], [c.U * 1.15, state.h]], { color: alpha(C.gold, 0.8), width: 3 });
    note(P, 'moving plate', c.U * 0.02, state.h, { color: C.gold });
    line(P, [[0, 0], [c.U, state.h]], { color: alpha(C.teal, 0.6), width: 1, dash: [4, 4] });
    note(P, 'steady', c.U * 0.55, state.h * 0.5, { color: alpha(C.teal, 0.8) });
    line(P, c.profile, { color: C.teal, width: 2.5 });
    for (let i = 4; i <= 76; i += 8) {
      const [u, y] = c.profile[i];
      if (u > c.U * 0.02) line(P, [[0, y], [u, y]], { color: alpha(C.teal, 0.35), width: 1 });
    }
    dot(P, c.U, state.h, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\tau = \mu\,\frac{U}{h}`, String.raw`\frac{\partial u}{\partial t} = \nu\,\frac{\partial^2 u}{\partial y^2},\quad \nu = \frac{\mu}{\rho}`],
  liveRows(state, c) {
    return [
      kv('viscosity $\\mu$', `${fig(c.mu)} Pa·s`),
      kv('density $\\rho$', `${fig(c.rho)} kg/m³`),
      kv('$\\nu = \\mu/\\rho$', `${fig(c.nu)} m²/s`),
      kv('steady stress $\\mu U/h$', `${fig(c.tau)} Pa`),
      kv('stress now', `${fig(c.tauNow)} Pa`),
      kv('time to settle', `${fig(c.t1)} s`),
      kv('series against finite differences', `${fig(c.gap * 100)}% of U`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['stress $\\tau$', `${fig(c.tau)} Pa`],
      ['force on plate', `${fig(c.force)} N`],
      ['settles in', `${fig(c.t1)} s`],
      ['time now', `${fig(c.t)} s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The fluid is Newtonian, its viscosity fixed by temperature alone, and the flow stays laminar: no edges, no end walls, no heating from the shear itself. Honey, paint and blood change viscosity as you shear them.`;
    const f = c.fluid;
    let title = 'Stress from a velocity gradient';
    let body = String.raw`The fluid sticks to both walls, so its speed runs from 0 at the still wall to $U$ at the plate. The stress is $\mu$ times that gradient: $\tau = \mu U/h = ${fig(c.tau)}$ Pa, a force of ${fig(c.force)} N on the plate.`;
    if (f.id === 'mercury') {
      title = 'Dense is not thick';
      body = String.raw`Mercury is 13.5 times denser than water but only 1.5 times more viscous, so the stress is only 1.5 times bigger. Its density slows the start-up instead: $\nu = \mu/\rho$ is small, and the layer takes ${fig(c.t1)} s to settle.`;
    } else if (f.id === 'glycerol') {
      title = 'Thick fluids settle fast';
      body = String.raw`Glycerol is 1,400 times more viscous than water, so the stress is 1,400 times bigger. Momentum also spreads through it fast: the layer settles in ${fig(c.t1)} s, where water takes seconds.`;
    } else if (f.id === 'air') {
      title = 'Air settles faster than water';
      body = String.raw`Air is 54 times less viscous than water but 830 times less dense, so its $\nu$ is 15 times bigger. The stress is tiny, ${fig(c.tau)} Pa, yet the profile settles in ${fig(c.t1)} s.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
