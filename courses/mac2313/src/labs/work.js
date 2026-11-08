import * as THREE from 'three';
import { defineLab } from './define.js';
import { A, FIELDS, fieldById, pathOf, workChecked } from '@flux/subjects/math/workpaths.js';
import { kv, cells, eq } from '../ui/shared.js';

/**
 * Work along two paths in a plane field, and Green's theorem for their difference.
 *
 * Map concept: line-integrals. Two paths run from A to B, which you place by clicking or with the
 * sliders: a straight segment and a bowed one, with a slider for the bow. The work along each is
 * summed piece by piece (packages/subjects/src/math/workpaths.js). For a gradient field the two
 * agree with φ(B) − φ(A); otherwise their difference is checked against the curl summed over the
 * region between them, Green's theorem. The loop is drawn out along the straight path and back
 * along the bowed one, with F · T along it: teal where the field helps, red where it resists.
 */

const LIMIT = 2.4;

const SCENARIOS = [
  { id: 'gradient', name: 'A gradient: both paths, the same work', field: 'gradient', bow: 0.8, bx: 1.4, by: 0.6 },
  { id: 'swirl', name: 'A swirl: the bowed path collects more', field: 'swirl', bow: -1, bx: 1.4, by: 0.6 },
  { id: 'shear', name: 'A shear: bow the other way, the sign flips', field: 'shear', bow: 0.8, bx: 1.4, by: 0.6 },
  { id: 'mixed', name: 'A gradient plus a swirl: only the swirl counts', field: 'mixed', bow: -1, bx: 1.4, by: 0.6 },
];

function fmt(n, d = 4) {
  if (!Number.isFinite(n)) return '—';
  return String(Number(n.toFixed(d)));
}

function clamp(state) {
  const fix = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : d));
  state.bow = fix(state.bow, -1.5, 1.5, 0.8);
  state.probe.x = fix(state.probe.x, -LIMIT + 0.2, LIMIT - 0.2, 1.4);
  state.probe.y = fix(state.probe.y, -LIMIT + 0.2, LIMIT - 0.2, 0.6);
  // Keep B away from A, so the paths have length.
  if (Math.hypot(state.probe.x - A.x, state.probe.y - A.y) < 0.5) state.probe.x = A.x + 0.5;
}

export default defineLab({
  id: 'work',
  exam: 'ch6',
  title: 'Work',
  hint: 'Click to move B · bow the second path · teal helps the motion, red resists it',
  orbit: true,
  probe: true,
  frame: true,
  live: false,
  camera: { pos: new THREE.Vector3(0.5, 10.5, 0.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'field', label: '$\\mathbf F$' },
    { key: 'flow', label: '$\\mathbf F\\cdot\\hat T$' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'gradient',
      field: 'gradient',
      bow: 0.8,
      probe: { x: 1.4, y: 0.6, z: 0 },
      xMin: -LIMIT,
      xMax: LIMIT,
      yMin: -LIMIT,
      yMax: LIMIT,
      show: { field: true, flow: true },
    };
  },
  /** labs-check moves this slider end to end on every scenario. */
  sweep() {
    return { key: 'bow', lo: -1.5, hi: 1.5 };
  },
  gapLimit: 1e-6,
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.field = sc.field;
    state.bow = sc.bow;
    state.probe = { x: sc.bx, y: sc.by, z: 0 };
  },
  controls() {
    const opts = Object.values(FIELDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('');
    const slider = (id, label, min, max, step, val) => `
        <label class="field">
          <span>${label}</span>
          <div class="slider-row">
            <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" />
            <span class="mono val" id="${id}-val">${val}</span>
          </div>
        </label>`;
    return `
      <div class="lab-block">
        <label class="field">
          <span>Field</span>
          <select id="wk-field">${opts}</select>
        </label>
        ${slider('wk-bow', 'Bow of the second path', -1.5, 1.5, 0.01, 0.8)}
        ${slider('wk-bx', 'B, x', -2.2, 2.2, 0.01, 1.4)}
        ${slider('wk-by', 'B, y', -2.2, 2.2, 0.01, 0.6)}
        <p class="tiny">A is fixed at (−1.2, −0.8). The loop runs out along the straight path and back along the bowed one.</p>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('wk-field').addEventListener('change', (e) => {
      api.slice().field = e.target.value;
      api.bump();
    });
    $('wk-bow').addEventListener('input', (e) => {
      api.slice().bow = Number(e.target.value);
      api.bump();
    });
    $('wk-bx').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    $('wk-by').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('wk-bow')) return;
    $('wk-field').value = state.field;
    $('wk-bow').value = state.bow;
    $('wk-bx').value = state.probe.x;
    $('wk-by').value = state.probe.y;
    $('wk-bow-val').textContent = Number(state.bow).toFixed(2);
    $('wk-bx-val').textContent = Number(state.probe.x).toFixed(2);
    $('wk-by-val').textContent = Number(state.probe.y).toFixed(2);
  },
  extent() {
    return LIMIT;
  },
  recompute(state, computed) {
    clamp(state);
    Object.assign(computed, workChecked(state));
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const { field, B } = computed;
    const straight = pathOf(B, state.bow, false);
    const bowed = pathOf(B, state.bow, true);
    // Out along the straight path (u < ½), back along the bowed one (u ≥ ½).
    const edge = (u) => {
      const back = u >= 0.5;
      const t = back ? 2 - 2 * u : 2 * u;
      const path = back ? bowed : straight;
      const p = path.r(t);
      const d = path.dr(t);
      const m = Math.hypot(d.x, d.y) || 1;
      const tx = ((back ? -1 : 1) * d.x) / m;
      const ty = ((back ? -1 : 1) * d.y) / m;
      return { x: p.x, y: p.y, nx: tx, ny: ty, flow: field.P(p.x, p.y) * tx + field.Q(p.x, p.y) * ty };
    };
    let top = 1e-9;
    for (let i = 0; i < 64; i++) top = Math.max(top, Math.abs(edge((i + 0.5) / 64).flow));
    ctx.pool.fluxLoop().setVisible(true);
    ctx.pool.fluxLoop().sync({
      field,
      grid: { xMin: -2, xMax: 2, yMin: -2, yMax: 2, step: 0.4 },
      edge,
      showField: show.field !== false,
      showFlow: show.flow !== false,
      flowScale: 0.32 / top,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'B');
  },
  law() {
    return [
      'W=\\displaystyle\\int_C \\mathbf F\\cdot d\\mathbf r=\\int_0^1 \\mathbf F(\\mathbf r(t))\\cdot\\mathbf r\'(t)\\,dt',
      '\\displaystyle\\oint_C \\mathbf F\\cdot d\\mathbf r=\\iint_R\\left(\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}\\right)dA',
    ];
  },
  liveRows(state, computed) {
    const c = computed;
    return (
      kv('Field', `$${c.field.tex}$`) +
      kv('Work along the straight path', `$${fmt(c.W1)}$`) +
      kv('Work along the bowed path', `$${fmt(c.W2)}$`) +
      kv('Bowed minus straight', `$${fmt(c.diff)}$`) +
      kv('Curl summed between them (Green)', `$${fmt(c.green)}$`) +
      (c.dphi !== null ? kv('$\\varphi(B)-\\varphi(A)$', `$${fmt(c.dphi)}$`) : '') +
      kv('Routes agree to', `$${c.gap.toExponential(0)}$`)
    );
  },
  readout(state, computed) {
    const c = computed;
    return cells([
      ['straight', `$${fmt(c.W1, 3)}$`],
      ['bowed', `$${fmt(c.W2, 3)}$`],
      ['difference', `$${fmt(c.diff, 3)}$`],
      ['same work?', Math.abs(c.diff) < 1e-6 ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const c = computed;
    const body = [];
    body.push('The work adds up $\\mathbf F\\cdot d\\mathbf r$ piece by piece along the path: only the part of $\\mathbf F$ along the motion counts. Teal arrows show where the field helps, red where it pushes back.');
    if (c.field.id === 'gradient') body.push(`This field is a gradient, $\\mathbf F=\\nabla\\varphi$, so the work is $\\varphi(B)-\\varphi(A) = ${fmt(c.dphi)}$ along any path. Bow the path as much as you like: the work does not change, and the loop's total is zero.`);
    else body.push(`The two paths give ${fmt(c.W1, 3)} and ${fmt(c.W2, 3)}: the work depends on the route. By Green's theorem the difference is the curl summed over the region between them, here ${fmt(c.green, 3)}. Bow the other way and the sign flips.`);
    if (c.field.id === 'mixed') body.push('Only the swirling part has curl. The gradient part adds the same work to both paths and drops out of the difference.');
    body.push(eq('\\oint_C \\mathbf F\\cdot d\\mathbf r=\\iint_R \\left(Q_x-P_y\\right)dA'));
    body.push('Each path’s work is summed by Simpson’s rule; the difference is checked against the curl summed over the region between the paths.');
    return { title: 'Work along a path', body };
  },
  plot: () => null,
});
