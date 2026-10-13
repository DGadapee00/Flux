import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { gradNumeric, dirQuotient } from '../math/ndiff.js';
import { directional, steepestAngle, steepestSweep, wrapPi, dirFromAngle, unitize } from '../math/gradient.js';
import { agreeTo, quotientNoise } from '../math/agree.js';
import { FIT_MAX, sceneScale } from '../engine/frame.js';
import { kv, cells, eq } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

function clampDomain(s) {
  const lim = (FIT_MAX - 0.05) / sceneScale();
  const fix = (v, lo, hi) => {
    const x = Number.isFinite(v) ? v : 0;
    return Math.max(lo, Math.min(hi, Math.max(-lim, Math.min(lim, x))));
  };
  s.probe.x = fix(s.probe.x, s.xMin, s.xMax);
  s.probe.y = fix(s.probe.y, s.yMin, s.yMax);
}

function fmt(n, d = 3) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e4 || a < 0.001)) return sciHTML(n, 2);
  return String(Number(n.toFixed(d)));
}

function vecTex(x, y) {
  return `$(${fmt(x)}, ${fmt(y)})$`;
}

export default defineLab({
  id: 'gradient',
  exam: 'ch2',
  title: 'Gradient',
  hint: 'Drag $P$ on the domain · rotate $\\hat u$',
  orbit: true,
  probe: true,
  frame: true,
  live: false,
  camera: { pos: new THREE.Vector3(9.2, 6.4, 10.5), target: new THREE.Vector3(0, 0.6, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'contours', label: 'Level curves' },
    { key: 'grad', label: '$\\nabla f$' },
    { key: 'dir', label: '$\\hat u$' },
    { key: 'tangent', label: 'Tangent plane' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.gradient,
  defaultState() {
    return {
      scenarioId: 'paraboloid',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      probe: { x: 1, y: 0.6, z: 0 },
      theta: 0.4,
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2,
      show: { surface: true, contours: true, grad: true, dir: true, tangent: false },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x₀</span>
          <div class="slider-row">
            <input type="range" id="g-x0" min="-2" max="2" step="0.01" value="1" />
            <span class="mono val" id="g-x0-val">1</span>
          </div>
        </label>
        <label class="field">
          <span>y₀</span>
          <div class="slider-row">
            <input type="range" id="g-y0" min="-2" max="2" step="0.01" value="0.6" />
            <span class="mono val" id="g-y0-val">0.6</span>
          </div>
        </label>
        <label class="field">
          <span>Direction θ of û</span>
          <div class="slider-row">
            <input type="range" id="g-th" min="0" max="6.2832" step="0.01" value="0.4" />
            <span class="mono val" id="g-th-val">23°</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('g-x0').addEventListener('input', (e) => {
      const s = api.slice();
      s.probe.x = Number(e.target.value);
      api.bump();
    });
    $('g-y0').addEventListener('input', (e) => {
      const s = api.slice();
      s.probe.y = Number(e.target.value);
      api.bump();
    });
    $('g-th').addEventListener('input', (e) => {
      api.slice().theta = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('g-x0')) return;
    $('g-x0').min = String(state.xMin);
    $('g-x0').max = String(state.xMax);
    $('g-y0').min = String(state.yMin);
    $('g-y0').max = String(state.yMax);
    $('g-x0').value = state.probe.x;
    $('g-y0').value = state.probe.y;
    $('g-th').value = state.theta;
    $('g-x0-val').textContent = Number(state.probe.x).toFixed(2);
    $('g-y0-val').textContent = Number(state.probe.y).toFixed(2);
    $('g-th-val').textContent = `${((state.theta * 180) / Math.PI).toFixed(0)}°`;
  },
  applyScenario(id, state) {
    applyData('gradient', id, state);
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
    const an = { f: surf.f(x, y, p), fx: surf.fx(x, y, p), fy: surf.fy(x, y, p) };
    const fn = (xx, yy) => surf.f(xx, yy, p);
    const gN = gradNumeric(fn, x, y);
    let th = Number.isFinite(state.theta) ? state.theta : 0;
    const u = dirFromAngle(th);
    const uIn = unitize(Math.cos(th), Math.sin(th));
    const Du = directional(an.fx, an.fy, u.x, u.y);
    const Dq = dirQuotient(fn, x, y, u.x, u.y);
    const thA = steepestAngle(an.fx, an.fy);
    const sweep = steepestSweep(fn, x, y, { steps: 720, h: 1e-5 });
    const gmag = Math.hypot(an.fx, an.fy);
    computed.surf = surf;
    computed.f = an.f;
    computed.fx = an.fx;
    computed.fy = an.fy;
    computed.fxN = gN.x;
    computed.fyN = gN.y;
    computed.u = u;
    computed.uLen = uIn.len;
    computed.Du = Du;
    computed.Dq = Dq;
    computed.thA = thA;
    computed.thB = sweep.theta;
    computed.DuMax = sweep.Du;
    computed.gmag = gmag;
    computed.tex = surf.tex(p);
    computed.matchG = Math.hypot(an.fx - gN.x, an.fy - gN.y);
    computed.matchD = Math.abs(Du - Dq);
    computed.matchTh = Number.isFinite(thA) ? Math.abs(wrapPi(sweep.theta - thA)) : 0;
    /*
     * ‖∇f‖ is the yardstick, not |D_u f|. D_u f is legitimately zero whenever û ⊥ ∇f, and on the
     * Gaussian it is tiny everywhere away from the origin — scaling by it would make the light
     * either impossible to satisfy or impossible to fail. ‖∇f‖ is what sets how big a disagreement
     * between the partials and the difference quotient is allowed to be.
     */
    const noise = quotientNoise(an.f, 1e-5);
    computed.agreeD = agreeTo(Du, Dq, gmag, { floor: noise });
    computed.agreeG = agreeTo(0, computed.matchG, gmag, { floor: noise });
    computed.agree = computed.agreeD && computed.agreeG;
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
    ctx.pool.arrows().setVisible(true);
    ctx.pool.arrows().sync({
      probe: state.probe,
      fP: computed.f,
      fx: computed.fx,
      fy: computed.fy,
      ux: computed.u.x,
      uy: computed.u.y,
      showGrad: !!show.grad,
      showDir: !!show.dir,
    });
    ctx.pool.tangent().setVisible(!!show.tangent);
    ctx.pool.tangent().sync({
      probe: state.probe,
      fP: computed.f,
      fx: computed.fx,
      fy: computed.fy,
      show: !!show.tangent,
    });
  },
  law() {
    return [
      'D_{\\hat u} f = \\nabla f \\cdot \\hat u',
      '\\nabla f = \\bigl(\\partial f/\\partial x,\\, \\partial f/\\partial y\\bigr)',
    ];
  },
  liveRows(state, computed) {
    const thA = Number.isFinite(computed.thA) ? `${((computed.thA * 180) / Math.PI).toFixed(1)}°` : '—';
    const thB = `${((computed.thB * 180) / Math.PI).toFixed(1)}°`;
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('$\\nabla f$ (analytic)', vecTex(computed.fx, computed.fy)) +
      kv('$\\nabla f$ (numeric)', vecTex(computed.fxN, computed.fyN)) +
      kv('$\\hat u$', vecTex(computed.u.x, computed.u.y)) +
      kv('$D_{\\hat u} f = \\nabla f \\cdot \\hat u$', `$${fmt(computed.Du)}$`) +
      kv('$D_{\\hat u} f$ (difference quotient)', `$${fmt(computed.Dq)}$`) +
      kv('steepest (from $\\nabla f$)', thA) +
      kv('steepest (sweep)', thB)
    );
  },
  readout(state, computed) {
    return cells([
      ['$f(P)$', `$${fmt(computed.f)}$`],
      ['$\\|\\nabla f\\|$', `$${fmt(computed.gmag)}$`],
      ['$D_{\\hat u} f$', `$${fmt(computed.Du)}$`],
      ['routes agree', computed.agree ? 'yes' : 'check $h$'],
    ]);
  },
  coach(state, computed) {
    const gmag = computed.gmag;
    const body = [];
    body.push(
      `At $P$, $\\nabla f$ points uphill. $D_{\\hat u} f$ is how fast $f$ changes if you step in the direction $\\hat u$ — and Theorem 17 says that is exactly $\\nabla f \\cdot \\hat u$, provided $\\hat u$ is a unit vector.`,
    );
    if (gmag < 1e-8) {
      body.push('Here $\\nabla f = (0,0)$, so every directional derivative is zero: $P$ is a critical point.');
    } else {
      body.push(
        `The largest $D_{\\hat u} f$ can be is $\\|\\nabla f\\| = ${fmt(gmag)}$, when $\\hat u$ lines up with $\\nabla f$. The two routes (the partials, and a 720-step sweep of the difference quotient) ${computed.matchTh < 0.02 ? 'agree on that direction' : 'are still settling'}.`,
      );
    }
    body.push(eq('D_{\\hat u} f = 0 \\text{ when } \\hat u \\perp \\nabla f \\text{ — along a level curve.}'));
    if (computed.uLen > 0 && Math.abs(computed.uLen - 1) > 1e-6) {
      body.push('The notes require a unit vector: a non-unit $u$ is normalized to $\\hat u = u/\\|u\\|$ before the formula is applied.');
    }
    return { title: 'Gradient and $D_{\\hat u} f$', body };
  },
  plot: () => null,
});
