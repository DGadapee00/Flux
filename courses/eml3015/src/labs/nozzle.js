import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { nozzleParticle, nozzleTransit, trackParticle } from '@flux/subjects/mechanics/flowfields.js';

/**
 * Nozzle: particles carried through a duct that narrows, with the inflow steady or ramping up.
 *
 * Shows the material derivative: a particle's acceleration is ∂u/∂t + u ∂u/∂x. In steady flow the
 * first term is zero, yet every particle speeds up as it moves into the narrow end. Dots at equal
 * time steps spread out along the duct. The closed form (packages/subjects/src/mechanics/
 * flowfields.js) solves the particle's path; the second method tracks it with RK4 and differences its
 * speed. `gap` is the larger disagreement, in time and in acceleration.
 */
const SCENARIOS = [
  { id: 'steady', name: 'Steady flow, 4 to 1', u0: 1, L: 0.5, CR: 4, ramp: 0, xf: 0.8 },
  { id: 'ramp', name: 'Inflow ramping up 40% a second', u0: 1, L: 0.5, CR: 4, ramp: 0.4, xf: 0.8 },
  { id: 'gentle', name: 'Long gentle taper, 2 to 1', u0: 1, L: 1, CR: 2, ramp: 0, xf: 0.8 },
  { id: 'jet', name: 'Short sharp jet, 6 to 1', u0: 2, L: 0.3, CR: 6, ramp: 0, xf: 0.8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, u0: sc.u0, L: sc.L, CR: sc.CR, ramp: sc.ramp, xf: sc.xf });
}

const params = (s) => ({ u0: s.u0, L: s.L, CR: s.CR, ramp: s.ramp });

export default defineLab({
  id: 'nozzle',
  exam: 'u3',
  title: 'Nozzle',
  hint: 'Hold the flow steady and watch the dots spread: each particle speeds up though nothing at a fixed point changes.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steady', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'xf', lo: 0.05, hi: 1 }),
  controls() {
    return `
      ${slider('nz-u', 'inlet speed u₀ (m/s)', 1, 0.2, 2, 0.05)}
      ${slider('nz-L', 'nozzle length L (m)', 0.5, 0.2, 1, 0.05)}
      ${slider('nz-cr', 'area ratio, inlet to exit', 4, 1.5, 6, 0.1)}
      ${slider('nz-r', 'inflow ramp r (per second)', 0, 0, 0.5, 0.01)}
      ${slider('nz-x', 'read the particle at x/L', 0.8, 0.05, 1, 0.01)}
      <p class="tiny">The area falls in a straight line along the nozzle. The inflow is u₀(1 + rt), so r = 0 is steady.</p>`;
  },
  bind(api) {
    bindSlider('nz-u', (s, v) => { s.u0 = v; }, api);
    bindSlider('nz-L', (s, v) => { s.L = v; }, api);
    bindSlider('nz-cr', (s, v) => { s.CR = v; }, api);
    bindSlider('nz-r', (s, v) => { s.ramp = v; }, api);
    bindSlider('nz-x', (s, v) => { s.xf = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['nz-u', state.u0], ['nz-L', state.L], ['nz-cr', state.CR], ['nz-r', state.ramp], ['nz-x', state.xf]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = params(state);
    const xp = state.xf * state.L;
    const a = nozzleParticle(p, xp);
    const n = trackParticle(p, xp, { marks: 12 });
    const T = nozzleTransit(p);
    const exit = nozzleParticle(p, state.L);
    const gap = Math.max(Math.abs(n.t - a.t) / T, Math.abs(n.accel - a.accel) / Math.max(Math.abs(a.accel), 1e-9));
    const path = [];
    for (let i = 0; i <= 60; i++) {
      const q = nozzleParticle(p, (i / 60) * state.L);
      path.push([q.t, q.u]);
    }
    return { ...a, xp, T, exitSpeed: exit.u, exitAccel: exit.accel, marks: n.marks, path, gap, numAccel: n.accel };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.42);
    const L = state.L;
    const h0 = 0.12;
    const cc = 1 - 1 / state.CR;
    const half = (x) => (h0 / 2) * (1 - (cc * x) / L);
    const S = sceneIn(B, top, { x0: -0.05 * L, x1: 1.05 * L, y0: -h0 * 0.7, y1: h0 * 0.7 }, 20);
    const upper = [];
    const lower = [];
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * L;
      upper.push([x, half(x)]);
      lower.push([x, -half(x)]);
    }
    poly(S, [...upper, ...lower.reverse()], { fill: alpha(C.blue, 0.14), stroke: null });
    line(S, upper, { color: C.muted, width: 2.5 });
    line(S, lower, { color: C.muted, width: 2.5 });
    for (const x of c.marks || []) dot(S, x, 0, { color: alpha(C.teal, 0.9), r: 3.5 });
    dot(S, c.xp, 0, { color: C.yellow, r: 6 });
    label(S, 'equal time steps', [0, 0], { color: C.teal, align: 'left', dy: -16 });
    const P = plotIn(B, bottom, { lo: 0, hi: c.T * 1.05 }, { lo: 0, hi: c.exitSpeed * 1.1 });
    axes(P, { xLabel: 't (s)', yLabel: 'particle speed (m/s)' });
    line(P, c.path, { color: C.teal, width: 2.5 });
    // The tangent at the read point: its slope is the particle's acceleration.
    const dt = c.T * 0.12;
    line(P, [[c.t - dt, c.u - c.accel * dt], [c.t + dt, c.u + c.accel * dt]], { color: C.pink, width: 2 });
    dot(P, c.t, c.u, { color: C.yellow, r: 5 });
    note(P, `Du/Dt = ${fig(c.accel)} m/s²`, c.t, c.u, { color: C.pink, dx: -10, dy: -14, align: 'right' });
  },
  law: () => [String.raw`\frac{Du}{Dt} = \frac{\partial u}{\partial t} + u\,\frac{\partial u}{\partial x}`, String.raw`u(x,t) = \frac{u_0(1 + rt)}{1 - c\,x/L},\quad c = 1 - \frac{A_\text{exit}}{A_\text{in}}`],
  liveRows(state, c) {
    return [
      kv('time to reach the read point', `${fig(c.t)} s`),
      kv('speed there', `${fig(c.u)} m/s`),
      kv('local part $\\partial u/\\partial t$', `${fig(c.local)} m/s²`),
      kv('convective part $u\\,\\partial u/\\partial x$', `${fig(c.convective)} m/s²`),
      kv('exit speed', `${fig(c.exitSpeed)} m/s`),
      kv('time to cross', `${fig(c.T)} s`),
      kv('closed form against RK4 tracking', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['acceleration $Du/Dt$', `${fig(c.accel)} m/s²`],
      ['local part', `${fig(c.local)} m/s²`],
      ['convective part', `${fig(c.convective)} m/s²`],
      ['speed', `${fig(c.u)} m/s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The flow is one-dimensional: the speed is the same across each section. Real nozzles have boundary layers at the walls, and the flow near the walls turns as well as speeds up.`;
    let title = 'Steady, and still accelerating';
    let body = String.raw`Nothing at a fixed point changes, so $\partial u/\partial t = 0$. But the particle moves to where the flow is faster, so it speeds up at $u\,\partial u/\partial x = ${fig(c.convective)}$ m/s². The dots spread out because each step covers more ground.`;
    if (state.ramp > 0) {
      title = 'Two reasons to speed up';
      body = String.raw`The inflow is growing, so the flow at every point speeds up: $\partial u/\partial t = ${fig(c.local)}$ m/s². The particle also moves into the narrow end: $u\,\partial u/\partial x = ${fig(c.convective)}$ m/s². Its acceleration is the sum, ${fig(c.accel)} m/s².`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
