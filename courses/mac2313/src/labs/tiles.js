import * as THREE from 'three';
import { defineLab } from './define.js';
import { fieldById, fluxClosed, boundaryPoint } from '../math/flux2d.js';
import { tiles } from '@flux/subjects/math/tiles2d.js';
import { kv, cells, eq } from '../ui/shared.js';

/**
 * Tiles: why the divergence theorem holds. A square region is cut into n × n cells, and each cell's
 * flux is added up.
 *
 * Map concept: divergence-theorem. Every inner face is shared by two cells, so its flux leaves one
 * and enters the other: the cells' fluxes add to the outer flux exactly, for any n. Each small cell's
 * flux is close to div F at its centre times its area, so the sum of those closes in on the flux as
 * the grid refines. Shown in the plane; in space the faces cancel the same way. The cells' total is
 * checked against the outer line integral and the closed form (packages/subjects/src/math/
 * tiles2d.js); `gap` is the larger disagreement, relative.
 */
const LIMIT = 2.4;

const SCENARIOS = [
  { id: 'spread', name: 'F = (x², xy): one cell, then many', field: 'spread', n: 1, a: 0.6, b: 0.2, size: 1 },
  { id: 'fine', name: 'The same region, 8 × 8', field: 'spread', n: 8, a: 0.6, b: 0.2, size: 1 },
  { id: 'cubic', name: 'F = (x³, 0): the sum converges', field: 'cubic', n: 4, a: 0.3, b: 0, size: 1.2 },
  { id: 'swirl', name: 'Swirl: big face fluxes, zero total', field: 'swirl', n: 4, a: 0, b: 0, size: 1.2 },
];

/** A number for use inside $…$: rounding noise below 10⁻⁹ is shown as 0. */
function fmt(n, d = 4) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a < 1e-9) return '0';
  if (a >= 1e4 || a < 0.0001) {
    const e = Math.floor(Math.log10(a));
    return `${(n / 10 ** e).toFixed(2)}\\times10^{${e}}`;
  }
  return String(Number(n.toFixed(d)));
}

function clamp(state) {
  const fix = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : d));
  state.n = Math.round(fix(state.n, 1, 12, 4));
  state.size = fix(state.size, 0.2, 1.4, 1);
  state.probe.x = fix(state.probe.x, -LIMIT + 0.2, LIMIT - 0.2, 0);
  state.probe.y = fix(state.probe.y, -LIMIT + 0.2, LIMIT - 0.2, 0);
}

export default defineLab({
  id: 'tiles',
  exam: 'ch6',
  title: 'Tiles',
  hint: 'Raise the number of cells · the inner arrows cancel in pairs · the outer flux never changes',
  orbit: true,
  probe: true,
  frame: true,
  live: false,
  camera: { pos: new THREE.Vector3(0.5, 10.5, 0.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'field', label: '$\\mathbf F$' },
    { key: 'faces', label: 'inner faces' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'spread',
      field: 'spread',
      n: 1,
      size: 1,
      probe: { x: 0.6, y: 0.2, z: 0 },
      xMin: -LIMIT,
      xMax: LIMIT,
      yMin: -LIMIT,
      yMax: LIMIT,
      show: { field: true, faces: true },
    };
  },
  sweep() {
    return { key: 'size', lo: 0.2, hi: 1.4 };
  },
  gapLimit: 1e-9,
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, field: sc.field, n: sc.n, size: sc.size, probe: { x: sc.a, y: sc.b, z: 0 } });
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>Field</span>
          <select id="ti-field">
            <option value="spread">F = (x², xy)</option>
            <option value="cubic">F = (x³, 0)</option>
            <option value="source">F = (x, y)</option>
            <option value="swirl">F = (−y, x)</option>
          </select>
        </label>
        <label class="field">
          <span>Cells per side n</span>
          <div class="slider-row">
            <input type="range" id="ti-n" min="1" max="12" step="1" value="1" />
            <span class="mono val" id="ti-n-val">1</span>
          </div>
        </label>
        <label class="field">
          <span>Half-side of the region</span>
          <div class="slider-row">
            <input type="range" id="ti-s" min="0.2" max="1.4" step="0.01" value="1" />
            <span class="mono val" id="ti-s-val">1</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('ti-field').addEventListener('change', (e) => {
      api.slice().field = e.target.value;
      api.bump();
    });
    $('ti-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    $('ti-s').addEventListener('input', (e) => {
      api.slice().size = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('ti-n')) return;
    $('ti-field').value = state.field;
    $('ti-n').value = state.n;
    $('ti-s').value = state.size;
    $('ti-n-val').textContent = String(state.n);
    $('ti-s-val').textContent = Number(state.size).toFixed(2);
  },
  extent() {
    return LIMIT;
  },
  recompute(state, computed) {
    clamp(state);
    const field = fieldById(state.field);
    const region = { a: state.probe.x, b: state.probe.y, s: state.size, n: state.n };
    const t = tiles(field, region);
    const exact = fluxClosed(field, { shape: 'square', size: state.size, a: region.a, b: region.b });
    const scale = Math.max(1, Math.abs(exact));
    computed.field = field;
    computed.region = region;
    computed.t = t;
    computed.exact = exact;
    computed.midErr = t.midpoint - exact;
    computed.gap = Math.max(Math.abs(t.cells - t.outer), Math.abs(t.outer - exact)) / scale;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const { field, region, t } = computed;
    const loop = { shape: 'square', size: region.s, a: region.a, b: region.b };
    let top = 1e-9;
    for (let i = 0; i < 64; i++) top = Math.max(top, Math.abs(boundaryPoint(field, loop, (i + 0.5) / 64).flow));
    ctx.pool.fluxLoop().setVisible(true);
    ctx.pool.fluxLoop().sync({
      field,
      grid: { xMin: -2, xMax: 2, yMin: -2, yMax: 2, step: 0.4 },
      edge: (u) => boundaryPoint(field, loop, u),
      showField: show.field !== false,
      showFlow: true,
      flowScale: 0.55 / top,
    });
    const faceTop = Math.max(1e-9, ...t.faces.map((f) => Math.abs(f.flux)));
    ctx.pool.tiles().setVisible(true);
    ctx.pool.tiles().sync({ x0: region.a - region.s, y0: region.b - region.s, h: t.h, n: region.n, faces: t.faces, scale: (0.4 * t.h) / faceTop, showFaces: show.faces !== false });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'centre');
  },
  law() {
    return [
      '\\sum_{\\text{cells}} \\oint \\mathbf F\\cdot\\hat n\\,ds=\\oint_{\\partial R} \\mathbf F\\cdot\\hat n\\,ds',
      '\\sum_{\\text{cells}} (\\nabla\\cdot\\mathbf F)\\,\\Delta A \\to \\iint_R \\nabla\\cdot\\mathbf F\\,dA',
    ];
  },
  liveRows(state, computed) {
    const c = computed;
    return (
      kv('Field', `$${c.field.tex}$`) +
      kv('Cells', `$${c.region.n}\\times${c.region.n} = ${c.region.n * c.region.n}$`) +
      kv('Flux out of the region', `$${fmt(c.t.outer)}$`) +
      kv('Sum of the cells’ fluxes', `$${fmt(c.t.cells)}$`) +
      kv('Flux that cancels on inner faces', `$${fmt(c.t.cancelled)}$`) +
      kv('$\\sum (\\nabla\\cdot\\mathbf F)\\,\\Delta A$', `$${fmt(c.t.midpoint)}$`) +
      kv('Its error', `$${fmt(c.midErr)}$`)
    );
  },
  readout(state, computed) {
    const c = computed;
    return cells([
      ['outer flux', `$${fmt(c.t.outer, 3)}$`],
      ['cells’ sum', `$${fmt(c.t.cells, 3)}$`],
      ['$\\sum \\nabla\\cdot\\mathbf F\\,\\Delta A$', `$${fmt(c.t.midpoint, 3)}$`],
      ['cancelled', `$${fmt(c.t.cancelled, 3)}$`],
    ]);
  },
  coach(state, computed) {
    const c = computed;
    const body = [];
    body.push('Each blue arrow crosses an inner face. It counts as flux out of the cell it leaves and flux into the cell it enters, so in the total it cancels. Only the outer boundary is left: the cells’ fluxes add to the region’s flux for any number of cells.');
    if (c.region.n === 1) body.push('With one cell the midpoint sum uses $\\nabla\\cdot\\mathbf F$ at the centre only. Raise the number of cells and watch it close in on the flux.');
    else if (Math.abs(c.midErr) < 1e-9) body.push(`Here $\\nabla\\cdot\\mathbf F$ is linear, so its value at each cell's centre is its average over the cell, and the midpoint sum is exact for any number of cells. Try $\\mathbf F = (x^3, 0)$ to watch a sum converge.`);
    else body.push(`With ${c.region.n * c.region.n} cells, the midpoint sum of $\\nabla\\cdot\\mathbf F\\,\\Delta A$ is off by $${fmt(c.midErr)}$. Each small cell's flux is nearly its divergence times its area, and the error falls as the square of the cell size.`);
    if (c.field.id === 'swirl') body.push('The swirl crosses every inner face strongly, yet each crossing cancels and the region’s flux is zero: $\\nabla\\cdot\\mathbf F = 0$ everywhere.');
    body.push(eq('\\oint_{\\partial R} \\mathbf F\\cdot\\hat n\\,ds=\\iint_R \\nabla\\cdot\\mathbf F\\,dA'));
    body.push('In space the same holds face by face for boxes: that is the divergence theorem, and it is how a conservation law moves between its integral and differential forms.');
    return { title: 'Inner faces cancel', body };
  },
  plot: () => null,
});
