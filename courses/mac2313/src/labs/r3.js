import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { add, dot, cross, len } from '../math/vec.js';
import { polarizeDot, paraArea } from '../math/r3.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo } from '../math/agree.js';


function vec(state, prefix) {
  return {
    x: Number.isFinite(state[prefix].x) ? state[prefix].x : 0,
    y: Number.isFinite(state[prefix].y) ? state[prefix].y : 0,
    z: Number.isFinite(state[prefix].z) ? state[prefix].z : 0,
  };
}

export default defineLab({
  id: 'r3',
  exam: 'ch4',
  title: 'R³',
  hint: 'Two vectors · $u\\times v$ is defined only in $\\mathbb{R}^3$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(7.8, 5.8, 8.6), target: new THREE.Vector3(0, 0.4, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'u', label: '$u$' },
    { key: 'v', label: '$v$' },
    { key: 'sum', label: '$u+v$' },
    { key: 'cross', label: '$u\\times v$' },
    { key: 'para', label: 'Parallelogram' },
  ],
  scenarios: SCENARIOS.r3,
  defaultState() {
    return {
      scenarioId: 'ij',
      u: { x: 1.5, y: 0, z: 0 },
      v: { x: 0, y: 1.5, z: 0 },
      probe: { x: 0, y: 0, z: 0 },
      xMin: -3,
      xMax: 3,
      yMin: -3,
      yMax: 3,
      show: { u: true, v: true, sum: true, cross: true, para: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field"><span>uₓ</span><div class="slider-row"><input type="range" id="r3-ux" min="-2" max="2" step="0.05" value="1.5" /><span class="mono val" id="r3-ux-val">1.5</span></div></label>
        <label class="field"><span>uᵧ</span><div class="slider-row"><input type="range" id="r3-uy" min="-2" max="2" step="0.05" value="0" /><span class="mono val" id="r3-uy-val">0</span></div></label>
        <label class="field"><span>uz</span><div class="slider-row"><input type="range" id="r3-uz" min="-2" max="2" step="0.05" value="0" /><span class="mono val" id="r3-uz-val">0</span></div></label>
        <label class="field"><span>vₓ</span><div class="slider-row"><input type="range" id="r3-vx" min="-2" max="2" step="0.05" value="0" /><span class="mono val" id="r3-vx-val">0</span></div></label>
        <label class="field"><span>vᵧ</span><div class="slider-row"><input type="range" id="r3-vy" min="-2" max="2" step="0.05" value="1.5" /><span class="mono val" id="r3-vy-val">1.5</span></div></label>
        <label class="field"><span>vz</span><div class="slider-row"><input type="range" id="r3-vz" min="-2" max="2" step="0.05" value="0" /><span class="mono val" id="r3-vz-val">0</span></div></label>
      </div>`;
  },
  bind(api) {
    const bind = (id, which, axis) => {
      document.getElementById(id).addEventListener('input', (e) => {
        api.slice()[which][axis] = Number(e.target.value);
        api.bump();
      });
    };
    bind('r3-ux', 'u', 'x');
    bind('r3-uy', 'u', 'y');
    bind('r3-uz', 'u', 'z');
    bind('r3-vx', 'v', 'x');
    bind('r3-vy', 'v', 'y');
    bind('r3-vz', 'v', 'z');
  },
  syncControls(state) {
    if (!document.getElementById('r3-ux')) return;
    const set = (id, v) => {
      document.getElementById(id).value = v;
      document.getElementById(`${id}-val`).textContent = Number(v).toFixed(2);
    };
    set('r3-ux', state.u.x);
    set('r3-uy', state.u.y);
    set('r3-uz', state.u.z);
    set('r3-vx', state.v.x);
    set('r3-vy', state.v.y);
    set('r3-vz', state.v.z);
  },
  applyScenario(id, state) {
    applyData('r3', id, state);
  },
  extent(state) {
    const u = vec(state, 'u');
    const v = vec(state, 'v');
    const s = add(u, v);
    const c = cross(u, v);
    return Math.max(2, len(u), len(v), len(s), len(c));
  },
  recompute(state, computed) {
    const u = vec(state, 'u');
    const v = vec(state, 'v');
    state.u = u;
    state.v = v;
    const s = add(u, v);
    const cr = cross(u, v);
    const du = dot(u, v);
    const duP = polarizeDot(u, v);
    const area = len(cr);
    const areaB = paraArea(u, v);
    computed.u = u;
    computed.v = v;
    computed.sum = s;
    computed.cr = cr;
    computed.du = du;
    computed.duP = duP;
    computed.lu = len(u);
    computed.lv = len(v);
    computed.area = area;
    computed.areaB = areaB;
    computed.cu = dot(cr, u);
    computed.cv = dot(cr, v);
    /*
     * ‖u‖‖v‖ is the yardstick for both: it bounds u·v and ‖u×v‖ alike, and unlike either of them it
     * does not vanish when the vectors happen to be perpendicular or parallel — the two
     * configurations a student is most likely to be sitting on.
     */
    const sUV = len(u) * len(v);
    computed.agree = agreeTo(du, duP, sUV) && agreeTo(area, areaB, sUV);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.spaceArrows().setVisible(true);
    ctx.pool.spaceArrows().sync({
      origin: { x: 0, y: 0, z: 0 },
      u: computed.u,
      v: computed.v,
      sum: computed.sum,
      cr: computed.cr,
      showU: show.u !== false,
      showV: show.v !== false,
      showSum: !!show.sum,
      showCross: !!show.cross,
      showPara: !!show.para,
    });
  },
  law() {
    return [
      'u\\cdot v = u_1 v_1 + u_2 v_2 + u_3 v_3',
      '\\|u\\times v\\| = \\text{area of the parallelogram}',
    ];
  },
  liveRows(state, computed) {
    const vtex = (w) => `$(${fmt(w.x)}, ${fmt(w.y)}, ${fmt(w.z)})$`;
    return (
      kv('$u$', vtex(computed.u)) +
      kv('$v$', vtex(computed.v)) +
      kv('$u+v$', vtex(computed.sum)) +
      kv('$u\\cdot v$ (components)', `$${fmt(computed.du)}$`) +
      kv('$u\\cdot v$ (polarization)', `$${fmt(computed.duP)}$`) +
      kv('$u\\times v$', vtex(computed.cr)) +
      kv('$\\|u\\times v\\|$', `$${fmt(computed.area)}$`) +
      kv('parallelogram area', `$${fmt(computed.areaB)}$`) +
      kv('$(u\\times v)\\cdot u,\\ (u\\times v)\\cdot v$', `$${fmt(computed.cu)},\\ ${fmt(computed.cv)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['$u\\cdot v$', `$${fmt(computed.du)}$`],
      ['$\\|u\\times v\\|$', `$${fmt(computed.area)}$`],
      ['$\\|u\\|,\\|v\\|$', `$${fmt(computed.lu)},\\ ${fmt(computed.lv)}$`],
      ['routes agree', computed.agree ? 'yes' : 'check'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'Points of $\\mathbb{R}^3$ are written $(x,y,z)$. The yellow arrow is $u$, the teal is $v$, white is $u+v$, and red is the cross product $u\\times v$, which exists only in $\\mathbb{R}^3$: it is orthogonal to both $u$ and $v$, and its length is the area of the parallelogram they span.',
    );
    body.push(eq('\\|u\\times v\\| = \\|u\\|\\,\\|v-\\mathrm{proj}_u v\\|'));
    body.push(
      `A second route for the dot product is the polarization identity $\\tfrac12\\bigl(\\|u+v\\|^2-\\|u\\|^2-\\|v\\|^2\\bigr)$. ${computed.agree ? 'Both pairs of routes agree.' : 'The two area computations are still settling.'}`,
    );
    return { title: 'Vectors in $\\mathbb{R}^3$', body };
  },
  plot: () => null,
});
