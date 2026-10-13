import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { d2fdxdy3, d2fdydx3, d2fdxdz3, d2fdydz3, gradNumeric3 } from '../math/ndiff.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo, quotientNoise } from '../math/agree.js';


function fmtP(n) {
  if (Number.isFinite(n) && Math.abs(n) < 1e-8) return '0';
  return fmt(n);
}

export default defineLab({
  id: 'partials3',
  exam: 'ch4',
  title: 'Partials',
  hint: 'Drag $P=(x,y,z)$ · three first partials',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(8.2, 6.0, 9.0), target: new THREE.Vector3(0, 0.5, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'grad', label: '$\\nabla f$' },
  ],
  scenarios: SCENARIOS.partials3,
  defaultState() {
    return {
      scenarioId: 'bowl',
      fieldId: 'bowl',
      params: { a: 1, b: 1, c: 0 },
      probe: { x: 0.8, y: 0.5, z: 0.6 },
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2,
      show: { grad: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x</span>
          <div class="slider-row">
            <input type="range" id="p3-x" min="-2" max="2" step="0.01" value="0.8" />
            <span class="mono val" id="p3-x-val">0.80</span>
          </div>
        </label>
        <label class="field">
          <span>y</span>
          <div class="slider-row">
            <input type="range" id="p3-y" min="-2" max="2" step="0.01" value="0.5" />
            <span class="mono val" id="p3-y-val">0.50</span>
          </div>
        </label>
        <label class="field">
          <span>z</span>
          <div class="slider-row">
            <input type="range" id="p3-z" min="-2" max="2" step="0.01" value="0.6" />
            <span class="mono val" id="p3-z-val">0.60</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('p3-x').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    document.getElementById('p3-y').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
    document.getElementById('p3-z').addEventListener('input', (e) => {
      api.slice().probe.z = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    if (!document.getElementById('p3-x')) return;
    const set = (id, v) => {
      document.getElementById(id).value = v;
      document.getElementById(`${id}-val`).textContent = Number(v).toFixed(2);
    };
    document.getElementById('p3-x').min = String(state.xMin);
    document.getElementById('p3-x').max = String(state.xMax);
    document.getElementById('p3-y').min = String(state.yMin);
    document.getElementById('p3-y').max = String(state.yMax);
    set('p3-x', state.probe.x);
    set('p3-y', state.probe.y);
    set('p3-z', state.probe.z);
  },
  applyScenario(id, state) {
    applyData('partials3', id, state);
  },
  extent(state) {
    return Math.max(
      2,
      Math.abs(state.probe?.x || 0),
      Math.abs(state.probe?.y || 0),
      Math.abs(state.probe?.z || 0),
    );
  },
  recompute(state, computed) {
    const fld = fieldById(state.fieldId);
    const p = state.params;
    let x = Number.isFinite(state.probe.x) ? state.probe.x : 0;
    let y = Number.isFinite(state.probe.y) ? state.probe.y : 0;
    let z = Number.isFinite(state.probe.z) ? state.probe.z : 0;
    x = Math.max(state.xMin, Math.min(state.xMax, x));
    y = Math.max(state.yMin, Math.min(state.yMax, y));
    z = Math.max(-2, Math.min(2, z));
    state.probe = { x, y, z };
    const f = fld.f(x, y, z, p);
    const fx = fld.fx(x, y, z, p);
    const fy = fld.fy(x, y, z, p);
    const fz = fld.fz(x, y, z, p);
    const fxy = fld.fxy(x, y, z, p);
    const fxz = fld.fxz(x, y, z, p);
    const fyz = fld.fyz(x, y, z, p);
    const fn = (xx, yy, zz) => fld.f(xx, yy, zz, p);
    const gN = gradNumeric3(fn, x, y, z);
    const fxyN = d2fdxdy3(fn, x, y, z);
    const fyxN = d2fdydx3(fn, x, y, z);
    const fxzN = d2fdxdz3(fn, x, y, z);
    const fyzN = d2fdydz3(fn, x, y, z);
    const gmag = Math.hypot(fx, fy, fz);
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.f = f;
    computed.fx = fx;
    computed.fy = fy;
    computed.fz = fz;
    computed.fxN = gN.x;
    computed.fyN = gN.y;
    computed.fzN = gN.z;
    computed.fxy = fxy;
    computed.fxz = fxz;
    computed.fyz = fyz;
    computed.fxyN = fxyN;
    computed.fyxN = fyxN;
    computed.fxzN = fxzN;
    computed.fyzN = fyzN;
    computed.gmag = gmag;
    computed.critical = gmag < 1e-8;
    // ‖∇f‖ for the first partials, the largest mixed partial for the second ones; see partials.js.
    const g2 = Math.max(Math.abs(fxy), Math.abs(fxz), Math.abs(fyz), Math.abs(fxyN));
    const n1 = quotientNoise(computed.f, 1e-5, 1);
    const n2 = quotientNoise(computed.f, 1e-4, 2);
    computed.agree =
      agreeTo(fx, gN.x, gmag, { floor: n1 }) &&
      agreeTo(fy, gN.y, gmag, { floor: n1 }) &&
      agreeTo(fz, gN.z, gmag, { floor: n1 }) &&
      agreeTo(fxy, fxyN, g2, { floor: n2 }) &&
      agreeTo(fxyN, fyxN, g2, { floor: n2 }) &&
      agreeTo(fxz, fxzN, g2, { floor: n2 }) &&
      agreeTo(fyz, fyzN, g2, { floor: n2 });
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, state.probe.z, 'P');
    ctx.pool.spaceArrows().setVisible(!!show.grad);
    ctx.pool.spaceArrows().sync({
      origin: { x: state.probe.x, y: state.probe.y, z: state.probe.z },
      u: { x: computed.fx, y: computed.fy, z: computed.fz },
      showU: !!show.grad && computed.gmag > 1e-8,
      showV: false,
      showSum: false,
      showCross: false,
      showPara: false,
    });
  },
  law() {
    return [
      '\\nabla f = \\bigl(\\partial f/\\partial x,\\, \\partial f/\\partial y,\\, \\partial f/\\partial z\\bigr)',
    ];
  },
  liveRows(state, computed) {
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)}, ${fmt(state.probe.z)})$`) +
      kv('$f(P)$', `$${fmt(computed.f)}$`) +
      kv('$f_x$ analytic / numeric', `$${fmtP(computed.fx)},\\ ${fmtP(computed.fxN)}$`) +
      kv('$f_y$ analytic / numeric', `$${fmtP(computed.fy)},\\ ${fmtP(computed.fyN)}$`) +
      kv('$f_z$ analytic / numeric', `$${fmtP(computed.fz)},\\ ${fmtP(computed.fzN)}$`) +
      kv('$\\nabla f$', `$(${fmtP(computed.fx)}, ${fmtP(computed.fy)}, ${fmtP(computed.fz)})$`) +
      kv('$f_{xy}$ analytic / $\\partial_x\\partial_y$ / $\\partial_y\\partial_x$', `$${fmtP(computed.fxy)},\\ ${fmtP(computed.fxyN)},\\ ${fmtP(computed.fyxN)}$`) +
      kv('$f_{xz},\\ f_{yz}$', `$${fmtP(computed.fxz)},\\ ${fmtP(computed.fyz)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['$f(P)$', `$${fmt(computed.f)}$`],
      ['$\\|\\nabla f\\|$', `$${fmt(computed.gmag)}$`],
      ['critical', computed.critical ? 'yes' : 'no'],
      ['routes agree', computed.agree ? 'yes' : 'check $h$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'Hold $y$ and $z$ fixed and differentiate in $x$ to get $\\partial f/\\partial x$; likewise for $y$ and $z$. The gradient is the triple $\\nabla f=(f_x,f_y,f_z)$. Theorem 25 is Schwarz in $\\mathbb{R}^3$: if the mixed partials are continuous near $P$, then $f_{xy}=f_{yx}$, $f_{xz}=f_{zx}$, and $f_{yz}=f_{zy}$.',
    );
    body.push(eq('\\nabla f(a,b,c)=(0,0,0)\\ \\text{at a local min or max}'));
    body.push(
      `The yellow arrow is $\\nabla f$ at $P$. A second route for the first partials is a central difference in each slot; mixed partials are a four-point stencil in two slots. ${computed.agree ? 'The routes agree at $P$.' : 'The difference quotients are still settling.'}${computed.critical ? ' Here $\\nabla f=(0,0,0)$, so $P$ is a critical point — necessary for a local min or max, not sufficient (a saddle in $\\mathbb{R}^3$ is critical too).' : ''}`,
    );
    return { title: 'Partials in $\\mathbb{R}^3$', body };
  },
  plot: () => null,
});
