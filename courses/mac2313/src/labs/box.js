import * as THREE from 'three';
import { defineLab } from './define.js';
import { FACES, FIELDS3, boxChecked, field3ById } from '@flux/subjects/math/divbox.js';
import { kv, cells, eq } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

/**
 * Flux out of a small box in space, and divergence as flux per volume.
 *
 * Map concept: divergence. A box you move by clicking (x and y) and with sliders (z and its size)
 * sits in a 3D field. The flux through each face is summed by quadrature and the six are added
 * (packages/subjects/src/math/divbox.js); the total is checked against the divergence integrated
 * through the box, the divergence theorem. Shrinking the box sends flux ÷ volume to ∇·F at the
 * centre. A point source at the origin is the exception: zero divergence, yet 4π out of any box
 * around it.
 */

const LIMIT = 2.4;

const SCENARIOS = [
  { id: 'source', name: 'Spreading out: flux grows with the volume', field: 'source', s: 0.5, a: 0.4, b: 0.3, c: 0.2 },
  { id: 'spread', name: 'Faster to the right: flux depends on where the box is', field: 'spread', s: 0.4, a: 1, b: 0, c: 0 },
  { id: 'swirl', name: 'A swirl: big arrows, no flux', field: 'swirl', s: 0.6, a: 0.5, b: 0.5, c: 0 },
  { id: 'shrink', name: 'Shrink the box: flux ÷ volume → ∇·F', field: 'cubic', s: 0.8, a: 0.8, b: 0.4, c: 0.3 },
  { id: 'point-in', name: 'A point source inside: 4π, any box', field: 'point', s: 0.5, a: 0.2, b: 0.1, c: -0.1 },
  { id: 'point-out', name: 'A point source outside: zero', field: 'point', s: 0.4, a: 1.2, b: 0.8, c: 0.3 },
];

function fmt(n, d = 3) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e4 || a < 0.001)) return sciHTML(n, 2);
  return String(Number(n.toFixed(d)));
}

function clamp(state) {
  const fix = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : d));
  state.s = fix(state.s, 0.05, 1, 0.5);
  state.cz = fix(state.cz, -1.5, 1.5, 0);
  state.probe.x = fix(state.probe.x, -1.8, 1.8, 0);
  state.probe.y = fix(state.probe.y, -1.8, 1.8, 0);
}

export default defineLab({
  id: 'box',
  exam: 'ch6',
  title: 'Box',
  hint: 'Click to move the box · set its height and size · teal leaves, red enters',
  orbit: true,
  probe: true,
  frame: true,
  live: false,
  camera: { pos: new THREE.Vector3(6.5, 5.2, 7.5), target: new THREE.Vector3(0, 0, 0) },
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
      s: 0.5,
      cz: 0.2,
      probe: { x: 0.4, y: 0.3, z: 0 },
      xMin: -LIMIT,
      xMax: LIMIT,
      yMin: -LIMIT,
      yMax: LIMIT,
      show: { field: true, flow: true },
    };
  },
  /** labs-check moves this slider end to end on every scenario. */
  sweep() {
    return { key: 's', lo: 0.05, hi: 1 };
  },
  gapLimit: 1e-6,
  applyScenario(id, state) {
    const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.field = sc.field;
    state.s = sc.s;
    state.cz = sc.c;
    state.probe = { x: sc.a, y: sc.b, z: 0 };
  },
  controls() {
    const opts = Object.values(FIELDS3).map((f) => `<option value="${f.id}">${f.name}</option>`).join('');
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
          <select id="bx-field">${opts}</select>
        </label>
        ${slider('bx-s', 'Half-side of the box', 0.05, 1, 0.01, 0.5)}
        ${slider('bx-x', 'Centre x', -1.8, 1.8, 0.01, 0.4)}
        ${slider('bx-y', 'Centre y', -1.8, 1.8, 0.01, 0.3)}
        ${slider('bx-z', 'Centre z', -1.5, 1.5, 0.01, 0.2)}
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('bx-field').addEventListener('change', (e) => {
      api.slice().field = e.target.value;
      api.bump();
    });
    for (const [id, set] of [['bx-s', (s, v) => { s.s = v; }], ['bx-x', (s, v) => { s.probe.x = v; }], ['bx-y', (s, v) => { s.probe.y = v; }], ['bx-z', (s, v) => { s.cz = v; }]]) {
      $(id).addEventListener('input', (e) => {
        set(api.slice(), Number(e.target.value));
        api.bump();
      });
    }
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('bx-s')) return;
    $('bx-field').value = state.field;
    for (const [id, v] of [['bx-s', state.s], ['bx-x', state.probe.x], ['bx-y', state.probe.y], ['bx-z', state.cz]]) {
      $(id).value = v;
      $(`${id}-val`).textContent = Number(v).toFixed(2);
    }
  },
  extent() {
    return LIMIT;
  },
  recompute(state, computed) {
    clamp(state);
    Object.assign(computed, boxChecked(state));
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.boxFlux().setVisible(true);
    ctx.pool.boxFlux().sync({ field: computed.field, box: computed.box, showField: show.field !== false, showFlow: show.flow !== false });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'centre');
  },
  law() {
    return [
      '\\displaystyle\\oiint_S \\mathbf F\\cdot\\hat n\\,dS=\\iiint_V \\nabla\\cdot\\mathbf F\\,dV',
      '\\nabla\\cdot\\mathbf F=\\lim_{V\\to0}\\frac{1}{V}\\oiint_S \\mathbf F\\cdot\\hat n\\,dS',
    ];
  },
  liveRows(state, computed) {
    const c = computed;
    const names = ['+x', '−x', '+y', '−y', '+z', '−z'];
    return (
      kv('Field', `$${c.field.tex}$`) +
      kv('Flux through each face', c.faces.map((f, i) => `${names[i]} ${fmt(f)}`).join(', ')) +
      kv('Six faces summed', `$${fmt(c.sum, 5)}$`) +
      kv('$\\iiint \\nabla\\cdot\\mathbf F\\,dV$', `$${fmt(c.closed, 5)}$`) +
      kv('Flux ÷ volume, and $\\nabla\\cdot\\mathbf F$ at the centre', `$${fmt(c.perVol)}$, $${fmt(c.divC)}$`) +
      kv('Routes agree to', c.near ? 'too close to the source' : `$${c.gap.toExponential(0)}$`)
    );
  },
  readout(state, computed) {
    const c = computed;
    return cells([
      ['flux out', `$${fmt(c.sum)}$`],
      ['flux ÷ volume', `$${fmt(c.perVol)}$`],
      ['$\\nabla\\cdot\\mathbf F$ at centre', `$${fmt(c.divC)}$`],
      ['volume', `$${fmt(c.V)}$`],
    ]);
  },
  coach(state, computed) {
    const c = computed;
    const id = c.field.id;
    const body = ['Flux out of the box adds up $\\mathbf F\\cdot\\hat n$ over its six faces: teal where the field leaves, red where it enters.'];
    if (id === 'source') body.push('Everywhere the field spreads out, $\\nabla\\cdot\\mathbf F = 3$, so the flux is three times the volume wherever the box sits.');
    if (id === 'spread') body.push('Here $\\nabla\\cdot\\mathbf F = 2x$: on the right more leaves through $+x$ than enters through $-x$, on the left the reverse. Move the box across $x = 0$.');
    if (id === 'swirl') body.push('The arrows go round the $z$-axis: what enters one face leaves another, and the flux is zero, however big the arrows.');
    if (id === 'mixed') body.push('Here $\\nabla\\cdot\\mathbf F = x + y + z$, and the flux is that at the centre times the volume.');
    if (id === 'cubic') body.push(`Here $\\nabla\\cdot\\mathbf F = 3(x^2+y^2+z^2)$ changes across the box. Shrink it: flux ÷ volume, ${fmt(c.perVol)}, closes in on ${fmt(c.divC)} at the centre. That limit is what divergence means.`);
    if (id === 'point') body.push(c.encloses ? 'The box holds the source and the flux is $4\\pi$, whatever its size. Away from the origin $\\nabla\\cdot\\mathbf F = 0$: the theorem needs a field smooth inside the box. This is Gauss’s law.' : 'The source is outside: what enters leaves again, and the flux is zero.');
    body.push(eq('\\oiint_S \\mathbf F\\cdot\\hat n\\,dS=\\iiint_V \\nabla\\cdot\\mathbf F\\,dV'));
    body.push('Each face’s flux is summed by Gauss–Legendre quadrature; the total is checked against the divergence integrated through the box.');
    return { title: 'Divergence in space', body };
  },
  plot: () => null,
});

export { FACES, field3ById };
