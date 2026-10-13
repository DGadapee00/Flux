import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { classify, kindLabel } from '../math/extrema.js';
import { d2fdx2, d2fdy2, d2fdxdy } from '../math/ndiff.js';
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

export default defineLab({
  id: 'extrema',
  exam: 'ch2',
  title: 'Extrema',
  hint: 'Drag $P$ · critical points are marked',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(9.2, 6.4, 10.5), target: new THREE.Vector3(0, 0.6, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'contours', label: 'Level curves' },
    { key: 'grad', label: '$\\nabla f$' },
    { key: 'crits', label: 'Critical points' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.extrema,
  defaultState() {
    return {
      scenarioId: 'paraboloid',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      probe: { x: 0.8, y: 0.5, z: 0 },
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2,
      show: { surface: true, contours: true, grad: true, crits: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x₀</span>
          <div class="slider-row">
            <input type="range" id="e-x0" min="-2" max="2" step="0.01" value="0.8" />
            <span class="mono val" id="e-x0-val">0.8</span>
          </div>
        </label>
        <label class="field">
          <span>y₀</span>
          <div class="slider-row">
            <input type="range" id="e-y0" min="-2" max="2" step="0.01" value="0.5" />
            <span class="mono val" id="e-y0-val">0.5</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('e-x0').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    $('e-y0').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('e-x0')) return;
    $('e-x0').min = String(state.xMin);
    $('e-x0').max = String(state.xMax);
    $('e-y0').min = String(state.yMin);
    $('e-y0').max = String(state.yMax);
    $('e-x0').value = state.probe.x;
    $('e-y0').value = state.probe.y;
    $('e-x0-val').textContent = Number(state.probe.x).toFixed(2);
    $('e-y0-val').textContent = Number(state.probe.y).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('extrema', id, state);
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
    const an = classify(surf, x, y, p);
    const fn = (xx, yy) => surf.f(xx, yy, p);
    const fxxN = d2fdx2(fn, x, y);
    const fyyN = d2fdy2(fn, x, y);
    const fxyN = d2fdxdy(fn, x, y);
    const DN = fxxN * fyyN - fxyN * fxyN;
    const pts = (surf.critical?.(p) || []).map((q) => {
      const c = classify(surf, q.x, q.y, p);
      return { x: q.x, y: q.y, f: surf.f(q.x, q.y, p), kind: c.kind, label: kindLabel(c.kind), D: c.D };
    });
    computed.surf = surf;
    computed.f = surf.f(x, y, p);
    computed.tex = surf.tex(p);
    computed.fx = an.fx;
    computed.fy = an.fy;
    computed.fxx = an.fxx;
    computed.fyy = an.fyy;
    computed.fxy = an.fxy;
    computed.D = an.D;
    computed.DN = DN;
    computed.kind = an.kind;
    computed.critical = an.critical;
    computed.gmag = an.gmag;
    computed.pts = pts;
    computed.matchD = Math.abs(an.D - DN);
    /*
     * D = f_xx f_yy − f_xy² is a difference of products, and the whole point of the second
     * derivative test is the case D = 0, where it is inconclusive. Scaling by |D| there would make
     * the light unsatisfiable; the floor of 1 it used to carry made it unfailable. The size of the
     * terms is what says how big a disagreement matters.
     */
    computed.agree = agreeTo(an.D, DN, Math.abs(an.fxx * an.fyy) + an.fxy * an.fxy, {
      tol: 0.05,
      floor: quotientNoise(computed.f, 1e-4, 2),
    });
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
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, computed.f, 'P');
    ctx.pool.arrows().setVisible(!!show.grad);
    ctx.pool.arrows().sync({
      probe: state.probe,
      fP: computed.f,
      fx: computed.fx,
      fy: computed.fy,
      ux: 0,
      uy: 0,
      showGrad: !!show.grad,
      showDir: false,
    });
    ctx.pool.crits().setVisible(!!show.crits);
    ctx.pool.crits().sync({ points: computed.pts, show: !!show.crits });
  },
  law() {
    return [
      '\\nabla f=(0,0)\\ \\text{at a local min or max}',
      'D=f_{xx}f_{yy}-(f_{xy})^2',
    ];
  },
  liveRows(state, computed) {
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('$\\nabla f$', `$(${fmt(computed.fx)}, ${fmt(computed.fy)})$`) +
      kv('$f_{xx},\\ f_{yy},\\ f_{xy}$', `$${fmt(computed.fxx)},\\ ${fmt(computed.fyy)},\\ ${fmt(computed.fxy)}$`) +
      kv('$D$ (analytic)', `$${fmt(computed.D)}$`) +
      kv('$D$ (numeric mixed partials)', `$${fmt(computed.DN)}$`) +
      kv('at $P$', computed.critical ? kindLabel(computed.kind) : '$\\nabla f \\neq 0$')
    );
  },
  readout(state, computed) {
    return cells([
      ['$\\|\\nabla f\\|$', `$${fmt(computed.gmag)}$`],
      ['$D$', `$${fmt(computed.D)}$`],
      ['test', computed.critical ? kindLabel(computed.kind) : 'not critical'],
      ['routes agree', computed.agree ? 'yes' : 'check $h$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'A local min or max can only occur where $\\nabla f=(0,0)$ (a critical point). The converse is false: a saddle is critical and is neither a min nor a max.',
    );
    body.push(eq('D=f_{xx}f_{yy}-(f_{xy})^2'));
    body.push(
      'Theorem 14: $D>0$ and $f_{xx}>0$ is a local min; $D>0$ and $f_{xx}<0$ is a local max; $D<0$ is a saddle; $D=0$ says nothing.',
    );
    if (computed.pts.length) {
      const list = computed.pts.map((q) => `$(${fmt(q.x)},${fmt(q.y)})$ ${kindLabel(q.kind)}`).join('; ');
      body.push(`On this surface the critical points are ${list}.`);
    } else {
      body.push('This $f$ has no critical point — $\\nabla f$ never vanishes.');
    }
    if (computed.critical) {
      body.push(`$P$ is on a critical point: the test says ${kindLabel(computed.kind)}.`);
    }
    return { title: 'Local extrema', body };
  },
  plot: () => null,
});
