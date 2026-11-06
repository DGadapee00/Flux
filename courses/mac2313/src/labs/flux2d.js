import * as THREE from 'three';
import { defineLab } from './define.js';
import { FIELDS, fieldById, area, inside, fluxClosed, fluxAlong, fluxInside, boundaryPoint } from '../math/flux2d.js';
import { kv, cells, eq } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

/**
 * Flux across a closed loop in a plane field, and divergence as flux per area.
 *
 * Map concepts: flux-2d (flux across a curve) and divergence. The loop is a circle or a square you
 * place by clicking or with the sliders. The flux is computed three ways (packages/subjects/src/
 * math/flux2d.js): a closed form, the line integral ∮ F · n ds summed around the loop, and the area
 * integral of div F summed over the inside. `gap` is the largest disagreement, relative, and
 * scripts/labs-check.mjs requires it small on every scenario and across the size slider. The point
 * source is the exception the lab teaches: its divergence is zero away from the origin, so the
 * area integral misses the 2π that the line integral finds.
 */

const LIMIT = 2.4;

const SCENARIOS = [
  { id: 'source', name: 'Source: flux grows with the area inside', field: 'source', shape: 'circle', size: 1, a: 0.4, b: 0.2 },
  { id: 'swirl', name: 'Swirl: long arrows, no flux', field: 'swirl', shape: 'square', size: 1, a: 0.2, b: -0.1 },
  { id: 'shear', name: 'Shear: flow crosses, nothing is left over', field: 'shear', shape: 'circle', size: 0.9, a: 0.3, b: 0.6 },
  { id: 'spread', name: 'Where the loop sits: div F = 3x', field: 'spread', shape: 'circle', size: 0.6, a: 1.2, b: 0 },
  { id: 'shrink', name: 'Shrink the loop: flux per area → div F', field: 'cubic', shape: 'circle', size: 1, a: 0.8, b: 0 },
  { id: 'point-in', name: 'Point source inside: 2π, any loop', field: 'point', shape: 'circle', size: 1, a: 0.3, b: 0.2 },
  { id: 'point-out', name: 'Point source outside: zero', field: 'point', shape: 'square', size: 0.5, a: 1.3, b: 0.9 },
];

function fmt(n, d = 3) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e4 || a < 0.001)) return sciHTML(n, 2);
  return String(Number(n.toFixed(d)));
}

function loopOf(state) {
  return { shape: state.shape === 'square' ? 'square' : 'circle', size: state.size, a: state.probe.x, b: state.probe.y };
}

function clamp(state) {
  const fix = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : d));
  state.size = fix(state.size, 0.05, 1.4, 1);
  state.probe.x = fix(state.probe.x, -LIMIT + 0.2, LIMIT - 0.2, 0);
  state.probe.y = fix(state.probe.y, -LIMIT + 0.2, LIMIT - 0.2, 0);
}

export default defineLab({
  id: 'flux2d',
  exam: 'ch6',
  title: 'Flux',
  hint: 'Click to move the loop · resize it · teal leaves, red enters',
  orbit: true,
  probe: true,
  frame: true,
  live: false,
  camera: { pos: new THREE.Vector3(0.5, 10.5, 0.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'field', label: '$\\mathbf F$' },
    { key: 'flow', label: '$\\mathbf F\\cdot\\hat n$' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'source',
      field: 'source',
      shape: 'circle',
      size: 1,
      probe: { x: 0.4, y: 0.2, z: 0 },
      xMin: -LIMIT,
      xMax: LIMIT,
      yMin: -LIMIT,
      yMax: LIMIT,
      show: { field: true, flow: true },
    };
  },
  /** labs-check moves this slider end to end on every scenario. */
  sweep() {
    return { key: 'size', lo: 0.1, hi: 1.4 };
  },
  gapLimit: 1e-3,
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.field = sc.field;
    state.shape = sc.shape;
    state.size = sc.size;
    state.probe = { x: sc.a, y: sc.b, z: 0 };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>Loop</span>
          <select id="fx-shape">
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </label>
        <label class="field">
          <span>Size (radius or half-side)</span>
          <div class="slider-row">
            <input type="range" id="fx-size" min="0.05" max="1.4" step="0.01" value="1" />
            <span class="mono val" id="fx-size-val">1</span>
          </div>
        </label>
        <label class="field">
          <span>Centre x</span>
          <div class="slider-row">
            <input type="range" id="fx-a" min="-2.2" max="2.2" step="0.01" value="0.4" />
            <span class="mono val" id="fx-a-val">0.4</span>
          </div>
        </label>
        <label class="field">
          <span>Centre y</span>
          <div class="slider-row">
            <input type="range" id="fx-b" min="-2.2" max="2.2" step="0.01" value="0.2" />
            <span class="mono val" id="fx-b-val">0.2</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('fx-shape').addEventListener('change', (e) => {
      api.slice().shape = e.target.value;
      api.bump();
    });
    $('fx-size').addEventListener('input', (e) => {
      api.slice().size = Number(e.target.value);
      api.bump();
    });
    $('fx-a').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    $('fx-b').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('fx-size')) return;
    $('fx-shape').value = state.shape;
    $('fx-size').value = state.size;
    $('fx-a').value = state.probe.x;
    $('fx-b').value = state.probe.y;
    $('fx-size-val').textContent = Number(state.size).toFixed(2);
    $('fx-a-val').textContent = Number(state.probe.x).toFixed(2);
    $('fx-b-val').textContent = Number(state.probe.y).toFixed(2);
  },
  extent() {
    return LIMIT;
  },
  recompute(state, computed) {
    clamp(state);
    const field = fieldById(state.field);
    const loop = loopOf(state);
    const A = area(loop);
    const closed = fluxClosed(field, loop);
    const along = fluxAlong(field, loop);
    const inner = fluxInside(field, loop);
    const singular = field.singular ? inside(loop, field.singular.x, field.singular.y) : null;
    // Too close to the point source, the numerical line integral loses accuracy; the lab says so.
    const near = Boolean(singular && singular.edge < 0.08);
    const scale = Math.max(1, Math.abs(closed));
    const lineGap = near ? 0 : Math.abs(along - closed) / scale;
    const areaGap = field.singular ? 0 : Math.abs(inner - closed) / scale;
    computed.field = field;
    computed.loop = loop;
    computed.area = A;
    computed.closed = closed;
    computed.along = along;
    computed.inner = inner;
    computed.perArea = along / A;
    computed.divCentre = field.div(loop.a, loop.b);
    computed.encloses = Boolean(singular?.inside);
    computed.near = near;
    computed.gap = Math.max(lineGap, areaGap);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const { field, loop } = computed;
    // Scale the flow arrows to the largest |F · n| on this loop, so a weak field still shows.
    let top = 1e-9;
    for (let i = 0; i < 64; i++) top = Math.max(top, Math.abs(boundaryPoint(field, loop, (i + 0.5) / 64).flow));
    ctx.pool.fluxLoop().setVisible(true);
    ctx.pool.fluxLoop().sync({
      field,
      grid: { xMin: -2, xMax: 2, yMin: -2, yMax: 2, step: 0.4 },
      edge: (u) => boundaryPoint(field, loop, u),
      showField: show.field !== false,
      showFlow: show.flow !== false,
      flowScale: 0.55 / top,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'centre');
  },
  law() {
    return [
      '\\Phi=\\displaystyle\\oint_C \\mathbf F\\cdot\\hat n\\,ds',
      '\\Phi=\\displaystyle\\iint_R \\nabla\\cdot\\mathbf F\\,dA',
    ];
  },
  liveRows(state, computed) {
    const c = computed;
    return (
      kv('Field', `$${c.field.tex}$`) +
      kv('$\\nabla\\cdot\\mathbf F$ at the centre', `$${fmt(c.divCentre)}$`) +
      kv('Area inside', `$${fmt(c.area)}$`) +
      kv('Flux, closed form', `$${fmt(c.closed, 4)}$`) +
      kv('Flux, $\\oint \\mathbf F\\cdot\\hat n\\,ds$ summed', c.near ? 'too close to the source' : `$${fmt(c.along, 4)}$`) +
      kv('Flux, $\\iint \\nabla\\cdot\\mathbf F\\,dA$ summed', `$${fmt(c.inner, 4)}$`) +
      kv('Flux ÷ area', `$${fmt(c.perArea)}$`)
    );
  },
  readout(state, computed) {
    const c = computed;
    return cells([
      ['$\\Phi$', `$${fmt(c.closed)}$`],
      ['$\\Phi/A$', `$${fmt(c.perArea)}$`],
      ['$\\nabla\\cdot\\mathbf F$ at centre', `$${fmt(c.divCentre)}$`],
      ['routes agree', c.field.singular ? (c.encloses ? 'line only' : 'yes') : c.gap < 1e-3 ? 'yes' : 'check'],
    ]);
  },
  coach(state, computed) {
    const c = computed;
    const body = [];
    body.push('Flux counts how much of the field crosses the loop: $\\mathbf F\\cdot\\hat n$ along the outward normal, added around it. Teal arrows leave, red arrows enter.');
    const id = c.field.id;
    if (id === 'source') body.push('Every arrow points away from the origin, so the field leaves everywhere. Here $\\nabla\\cdot\\mathbf F = 2$ at every point, and the flux is twice the area inside. Grow the loop and the flux grows with it.');
    if (id === 'swirl') body.push('The arrows are long, but they run along the loop, not across it. What enters on one side leaves on the other, and the flux is zero. Big arrows do not mean big flux.');
    if (id === 'shear') body.push('The flow crosses the loop, in on one side and out on the other, in equal amounts. Nothing is created inside, so $\\nabla\\cdot\\mathbf F=0$ and the flux is zero.');
    if (id === 'spread') body.push('Here $\\nabla\\cdot\\mathbf F = 3x$. Move the loop: on the right more leaves than enters, on the left more enters, and on the $y$-axis the two balance. The flux depends on where the loop sits.');
    if (id === 'cubic') body.push('Divergence is flux per unit area out of a small loop. Shrink the loop and watch $\\Phi/A$ close in on $\\nabla\\cdot\\mathbf F$ at the centre.');
    if (id === 'point') {
      body.push(c.encloses
        ? 'The loop holds the source, and the flux is $2\\pi$ whatever the loop’s size or shape. Away from the origin $\\nabla\\cdot\\mathbf F = 0$, so the area sum gives 0 and misses it: the theorem needs a field that is smooth inside the loop. This is Gauss’s law in the plane.'
        : 'The source is outside the loop. What enters leaves again, and the flux is zero.');
    }
    body.push(eq('\\oint_C \\mathbf F\\cdot\\hat n\\,ds=\\iint_R \\nabla\\cdot\\mathbf F\\,dA'));
    body.push('The flux is computed three ways: a closed form, the line integral summed around the loop, and the divergence summed over the inside.');
    return { title: 'Flux and divergence', body };
  },
  plot: () => null,
});

export { FIELDS };
