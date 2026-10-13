import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { dfdx, dfdy, d2fdx2, d2fdy2, d2fdxdy } from '../math/ndiff.js';
import { FIT_MAX, sceneScale } from '../engine/frame.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo, quotientNoise } from '../math/agree.js';

function clampDomain(s) {
  const lim = (FIT_MAX - 0.05) / sceneScale();
  const fix = (v, lo, hi) => {
    const x = Number.isFinite(v) ? v : 0;
    return Math.max(lo, Math.min(hi, Math.max(-lim, Math.min(lim, x))));
  };
  s.probe.x = fix(s.probe.x, s.xMin, s.xMax);
  s.probe.y = fix(s.probe.y, s.yMin, s.yMax);
}


function fmtP(n) {
  if (Number.isFinite(n) && Math.abs(n) < 1e-8) return '0';
  return fmt(n);
}

export default defineLab({
  id: 'partials',
  exam: 'ch2',
  title: 'Partials',
  hint: 'Drag $P$ · teal holds $y$, purple holds $x$',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(9.2, 6.4, 10.5), target: new THREE.Vector3(0, 0.6, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'contours', label: 'Level curves' },
    { key: 'xslice', label: '$P_y$ ($y$ fixed)' },
    { key: 'yslice', label: '$Q_x$ ($x$ fixed)' },
    { key: 'tan', label: 'Slice tangents' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.partials,
  defaultState() {
    return {
      scenarioId: 'paraboloid',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      probe: { x: 0.9, y: 0.6, z: 0 },
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2,
      show: { surface: true, contours: false, xslice: true, yslice: true, tan: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x₀</span>
          <div class="slider-row">
            <input type="range" id="pa-x0" min="-2" max="2" step="0.01" value="0.9" />
            <span class="mono val" id="pa-x0-val">0.9</span>
          </div>
        </label>
        <label class="field">
          <span>y₀</span>
          <div class="slider-row">
            <input type="range" id="pa-y0" min="-2" max="2" step="0.01" value="0.6" />
            <span class="mono val" id="pa-y0-val">0.6</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('pa-x0').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    $('pa-y0').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('pa-x0')) return;
    $('pa-x0').min = String(state.xMin);
    $('pa-x0').max = String(state.xMax);
    $('pa-y0').min = String(state.yMin);
    $('pa-y0').max = String(state.yMax);
    $('pa-x0').value = state.probe.x;
    $('pa-y0').value = state.probe.y;
    $('pa-x0-val').textContent = Number(state.probe.x).toFixed(2);
    $('pa-y0-val').textContent = Number(state.probe.y).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('partials', id, state);
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      Math.abs(state.probe?.x || 0),
      Math.abs(state.probe?.y || 0),
    );
  },
  recompute(state, computed) {
    clampDomain(state);
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const x = state.probe.x;
    const y = state.probe.y;
    const f = surf.f(x, y, p);
    const fx = surf.fx(x, y, p);
    const fy = surf.fy(x, y, p);
    const fxx = surf.fxx(x, y, p);
    const fyy = surf.fyy(x, y, p);
    const fxy = surf.fxy(x, y, p);
    const fn = (xx, yy) => surf.f(xx, yy, p);
    const fxFn = (xx, yy) => surf.fx(xx, yy, p);
    const fyFn = (xx, yy) => surf.fy(xx, yy, p);
    const fxN = dfdx(fn, x, y);
    const fyN = dfdy(fn, x, y);
    const fxxN = d2fdx2(fn, x, y);
    const fyyN = d2fdy2(fn, x, y);
    const fxyN = d2fdxdy(fn, x, y);
    const fxyFromFx = dfdy(fxFn, x, y);
    const fyxFromFy = dfdx(fyFn, x, y);
    computed.surf = surf;
    computed.f = f;
    computed.tex = surf.tex(p);
    computed.fx = fx;
    computed.fy = fy;
    computed.fxx = fxx;
    computed.fyy = fyy;
    computed.fxy = fxy;
    computed.fxN = fxN;
    computed.fyN = fyN;
    computed.fxxN = fxxN;
    computed.fyyN = fyyN;
    computed.fxyN = fxyN;
    computed.fxyFromFx = fxyFromFx;
    computed.fyxFromFy = fyxFromFy;
    computed.matchFx = Math.abs(fx - fxN);
    computed.matchFy = Math.abs(fy - fyN);
    computed.matchFxy = Math.abs(fxy - fxyN);
    computed.matchSchwarz = Math.abs(fxyFromFx - fyxFromFy);
    /*
     * Two yardsticks, because first and second partials live at different magnitudes: ‖∇f‖ for the
     * first, the largest second partial for the mixed ones. Each carries the rounding floor of the
     * quotient that produced it — a second difference divides by h², so its noise is that much
     * larger. Scaling by the compared value instead would make every near-zero partial either
     * impossible to match or impossible to fail.
     */
    const g1 = Math.hypot(fx, fy);
    const g2 = Math.max(Math.abs(fxx), Math.abs(fyy), Math.abs(fxy));
    const n1 = quotientNoise(computed.f, 1e-5, 1);
    const n2 = quotientNoise(computed.f, 1e-4, 2);
    computed.agree =
      agreeTo(fx, fxN, g1, { floor: n1 }) &&
      agreeTo(fy, fyN, g1, { floor: n1 }) &&
      agreeTo(fxy, fxyN, g2, { floor: n2 }) &&
      agreeTo(fxyFromFx, fyxFromFy, g2, { floor: n2 });
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: state.probe,
      fP: computed.f,
      show: show.surface !== false,
    });
    ctx.pool.contours().setVisible(!!show.contours);
    ctx.pool.contours().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      show: !!show.contours,
    });
    ctx.pool.slices().setVisible(true);
    ctx.pool.slices().sync({
      f,
      probe: state.probe,
      fP: computed.f,
      fx: computed.fx,
      fy: computed.fy,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      showX: !!show.xslice,
      showY: !!show.yslice,
      showTan: !!show.tan,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, computed.f, 'P');
  },
  law() {
    return [
      "\\partial f/\\partial x = P_y'(x)",
      "\\partial f/\\partial y = Q_x'(y)",
    ];
  },
  liveRows(state, computed) {
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('$\\partial f/\\partial x$ (analytic)', `$${fmt(computed.fx)}$`) +
      kv('$\\partial f/\\partial x$ (numeric)', `$${fmt(computed.fxN)}$`) +
      kv('$\\partial f/\\partial y$ (analytic)', `$${fmt(computed.fy)}$`) +
      kv('$\\partial f/\\partial y$ (numeric)', `$${fmt(computed.fyN)}$`) +
      kv('$f_{xx},\\ f_{yy}$', `$${fmt(computed.fxx)},\\ ${fmt(computed.fyy)}$`) +
      kv('$f_{xy}$ (analytic)', `$${fmtP(computed.fxy)}$`) +
      kv('$f_{xy}$ (from $f$)', `$${fmtP(computed.fxyN)}$`) +
      kv('$\\partial_y f_x$, $\\partial_x f_y$', `$${fmtP(computed.fxyFromFx)},\\ ${fmtP(computed.fyxFromFy)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['$f_x$', `$${fmt(computed.fx)}$`],
      ['$f_y$', `$${fmt(computed.fy)}$`],
      ['$f_{xy}$', `$${fmt(computed.fxy)}$`],
      ['routes agree', computed.agree ? 'yes' : 'check $h$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'Hold $y$ fixed and $f$ becomes a one-variable function $P_y(x)=f(x,y)$. Its derivative is $\\partial f/\\partial x$ — the slope of the teal slice. Hold $x$ fixed and $Q_x(y)=f(x,y)$ has derivative $\\partial f/\\partial y$, the slope of the purple slice.',
    );
    body.push(
      eq(
        '\\frac{\\partial f}{\\partial x}(x,y)=\\lim_{h\\to 0}\\frac{f(x+h,y)-f(x,y)}{h}',
      ),
    );
    body.push(
      `Second partials come from differentiating again. The mixed ones are checked three ways here: the analytic $f_{xy}$, a four-point stencil on $f$, and $\\partial/\\partial y$ of $f_x$ against $\\partial/\\partial x$ of $f_y$. ${computed.agree ? 'They agree at $P$.' : 'They are still settling — the step $h$ is a compromise.'}`,
    );
    body.push(
      'Theorem 12 (Schwarz): if the mixed partials are continuous on a disk about $P$, then $f_{xy}=f_{yx}$.',
    );
    return { title: 'Partial derivatives', body };
  },
  plot: () => null,
});
