import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FIELDS, cvClosed, cvNumeric } from '@flux/subjects/mechanics/continuity.js';

/**
 * Continuity: a small square control volume you move about a two-dimensional flow, with the mass
 * crossing each side.
 *
 * Shows the mass balance behind the continuity equation. In an incompressible flow what comes in
 * goes out, wherever the square sits, even where the flow speeds up or turns. Where the gas is being
 * squeezed or heated, more comes in than goes out, or less, and the density inside changes to match.
 * The net outflow by ρ(∇·v)A is checked against Simpson's rule round the square's sides
 * (packages/subjects/src/mechanics/continuity.js).
 */
const SCENARIOS = [
  { id: 'corner', name: 'Water into a corner', field: 'corner', a: 2, x0: 0.6, y0: 0.6, h: 0.3 },
  { id: 'shear', name: 'Water in shear', field: 'shear', a: 2, x0: 0, y0: 0.5, h: 0.3 },
  { id: 'piston', name: 'Air squeezed by a piston', field: 'piston', a: 2, x0: 0.5, y0: 0, h: 0.3 },
  { id: 'heated', name: 'Air expanding as it heats', field: 'heated', a: 0.5, x0: 0.5, y0: 0.5, h: 0.3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, field: sc.field, a: sc.a, x0: sc.x0, y0: sc.y0, h: sc.h });
}

export default defineLab({
  id: 'continuity',
  exam: 'u3',
  title: 'Continuity',
  hint: 'Drag the square anywhere in the corner flow: in always equals out. Switch to air being squeezed: more comes in than leaves, and the density rises.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('corner', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x0', lo: -0.8, hi: 0.8 }),
  controls() {
    return `
      <label class="field"><span>Flow</span><select id="co-field">${Object.entries(FIELDS).map(([id, f]) => `<option value="${id}">${f.name}</option>`).join('')}</select></label>
      ${slider('co-a', 'strength a (1/s)', 2, 0.2, 5, 0.1)}
      ${slider('co-x', 'square centre x (m)', 0.6, -0.8, 0.8, 0.01)}
      ${slider('co-y', 'square centre y (m)', 0.6, -0.8, 0.8, 0.01)}
      ${slider('co-h', 'square side h (m)', 0.3, 0.05, 0.6, 0.01)}
      <p class="tiny">Per metre of depth. Water 1000 kg/m³, air 1.2 kg/m³ at this instant.</p>`;
  },
  bind(api) {
    document.getElementById('co-field')?.addEventListener('change', (e) => {
      api.slice().field = e.target.value;
      api.bump();
    });
    bindSlider('co-a', (s, v) => { s.a = v; }, api);
    bindSlider('co-x', (s, v) => { s.x0 = v; }, api);
    bindSlider('co-y', (s, v) => { s.y0 = v; }, api);
    bindSlider('co-h', (s, v) => { s.h = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('co-field');
    if (sel) sel.value = state.field;
    for (const [id, val] of [['co-a', state.a], ['co-x', state.x0], ['co-y', state.y0], ['co-h', state.h]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const a = cvClosed(state);
    const n = cvNumeric(state);
    const scale = Math.max(n.in + n.out, 1e-12);
    return { ...n, closedNet: a.net, dRhoDt: a.dRhoDt, rho: FIELDS[state.field].rho, gap: Math.abs(n.net - a.net) / scale };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -1.1, x1: 1.1, y0: -1.1, y1: 1.1 }, 16);
    const f = FIELDS[state.field];
    let vmax = 1e-9;
    const pts = [];
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
      const x = i * 0.2;
      const y = j * 0.2;
      const [u, v] = f.v(x, y, state.a);
      vmax = Math.max(vmax, Math.hypot(u, v));
      pts.push([x, y, u, v]);
    }
    for (const [x, y, u, v] of pts) {
      const s = Math.hypot(u, v);
      if (s > 1e-9) arrow(P, [x, y], Math.atan2(v, u), 4 + 18 * (s / vmax), { color: alpha(C.blue, 0.55), width: 1.2, head: 5 });
    }
    const { x0, y0, h } = state;
    poly(P, [[x0 - h / 2, y0 - h / 2], [x0 + h / 2, y0 - h / 2], [x0 + h / 2, y0 + h / 2], [x0 - h / 2, y0 + h / 2]], { fill: alpha(C.gold, 0.15), stroke: C.gold, width: 2 });
    const mids = [[x0 + h / 2, y0, 10, 0, 'left'], [x0 - h / 2, y0, -10, 0, 'right'], [x0, y0 + h / 2, 0, -10, 'center'], [x0, y0 - h / 2, 0, 14, 'center']];
    c.per.forEach((q, k) => {
      const [x, y, dx, dy, align] = mids[k];
      const text = Math.abs(q) < 1e-12 ? '0' : `${q > 0 ? 'out' : 'in'} ${fig(Math.abs(q))}`;
      label(P, text, [x, y], { color: Math.abs(q) < 1e-12 ? C.muted : q > 0 ? C.pink : C.teal, dx, dy, align });
    });
  },
  law: () => [String.raw`\frac{\partial \rho}{\partial t} + \nabla\cdot(\rho\mathbf v) = 0`, String.raw`\oint \rho\,\mathbf v\cdot\mathbf n\,ds = \iint \nabla\cdot(\rho\mathbf v)\,dA = -\frac{\partial \rho}{\partial t}\,A`],
  liveRows(state, c) {
    return [
      kv('mass in, per metre depth', `${fig(c.in)} kg/s`),
      kv('mass out', `${fig(c.out)} kg/s`),
      kv('net out', `${fig(c.net)} kg/s`),
      kv('density change $\\partial\\rho/\\partial t$', `${fig(c.dRhoDt)} kg/m³ per s`),
      kv('ρ(∇·v)A against the boundary sum', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['in', `${fig(c.in)} kg/s`],
      ['out', `${fig(c.out)} kg/s`],
      ['net out', `${fig(c.net)} kg/s`],
      ['∂ρ/∂t', `${fig(c.dRhoDt)} kg/m³/s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Two dimensions and a density the same everywhere at each instant. In a real compressor or heated duct the density varies in space too, and ∇·(ρv) has a term for that.`;
    let title = 'What comes in goes out';
    let body = String.raw`The water speeds up and turns, but its density cannot change, so ${fig(c.in)} kg/s in means ${fig(c.out)} kg/s out, wherever the square sits: ∇·v = 0.`;
    if (state.field === 'piston') {
      title = 'More comes in than leaves';
      body = String.raw`The piston squeezes the gas: ${fig(c.in)} kg/s enters the square and ${fig(c.out)} kg/s leaves. The rest stays, and the density rises at ${fig(c.dRhoDt)} kg/m³ each second.`;
    } else if (state.field === 'heated') {
      title = 'More leaves than enters';
      body = String.raw`The gas expands as it heats: ${fig(c.out)} kg/s leaves and ${fig(c.in)} kg/s enters. The density inside falls at ${fig(-c.dRhoDt)} kg/m³ each second to make up the difference.`;
    } else if (state.field === 'shear') {
      title = 'Sliding layers carry mass straight through';
      body = String.raw`In shear each layer moves along itself, so mass enters one side and leaves the opposite side at the same rate: ${fig(c.in)} kg/s each way.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
