import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { curveById, evalCurve, polylineLength } from '../math/curves.js';
import { simpson } from '../math/quadrature.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

export default defineLab({
  id: 'parametric',
  exam: 'ch2',
  title: 'Parametric',
  hint: 'Slide $t$ · $\\gamma(t)=(x(t),y(t))$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(0.5, 10.5, 0.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'tangent', label: 'Tangent' },
    { key: 'vel', label: "$\\gamma'(t)$" },
  ],
  scenarios: SCENARIOS.parametric,
  defaultState() {
    return {
      scenarioId: 'circle',
      curveId: 'circle',
      t: Math.PI / 3,
      t0: 0,
      t1: 2 * Math.PI,
      probe: { x: 0.5, y: 0.866, z: 0 },
      xMin: -3,
      xMax: 3,
      yMin: -3,
      yMax: 3,
      show: { curve: true, tangent: true, vel: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>t</span>
          <div class="slider-row">
            <input type="range" id="c-t" min="0" max="6.2832" step="0.01" value="1.047" />
            <span class="mono val" id="c-t-val">1.05</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('c-t').addEventListener('input', (e) => {
      api.slice().t = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('c-t');
    if (!el) return;
    el.min = String(state.t0);
    el.max = String(state.t1);
    el.value = state.t;
    document.getElementById('c-t-val').textContent = Number(state.t).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('parametric', id, state);
    const c = curveById(state.curveId);
    state.t0 = c.t0;
    state.t1 = c.t1;
    state.t = c.tStart ?? 0.5 * (c.t0 + c.t1);
  },
  extent() {
    return 3;
  },
  recompute(state, computed) {
    const c = curveById(state.curveId);
    let t = Number.isFinite(state.t) ? state.t : c.t0;
    t = Math.max(c.t0, Math.min(c.t1, t));
    state.t = t;
    const e = evalCurve(c, t);
    state.probe = { x: e.x, y: e.y, z: 0 };
    const speedN = c.speed(t);
    const Lsimp = simpson((s) => c.speed(s), c.t0, t, 1e-6);
    const Lpoly = polylineLength(c, c.t0, t, 400);
    const Lclosed = c.length ? c.length(c.t0, t) : NaN;
    computed.curve = c;
    computed.x = e.x;
    computed.y = e.y;
    computed.xp = e.xp;
    computed.yp = e.yp;
    computed.speed = e.speed;
    computed.speedN = speedN;
    computed.slope = e.slope;
    computed.tangent = e.tangent;
    computed.Lsimp = Lsimp;
    computed.Lpoly = Lpoly;
    computed.Lclosed = Lclosed;
    computed.matchL = Math.abs(Lsimp - Lpoly);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const c = computed.curve;
    ctx.pool.curve().setVisible(true);
    ctx.pool.curve().sync({
      x: c.x,
      y: c.y,
      t0: c.t0,
      t1: c.t1,
      t: state.t,
      xp: computed.xp,
      yp: computed.yp,
      showCurve: show.curve !== false,
      showTan: !!show.tangent,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'γ(t)');
    ctx.pool.arrows().setVisible(!!show.vel);
    ctx.pool.arrows().sync({
      probe: state.probe,
      fP: 0,
      fx: computed.xp,
      fy: computed.yp,
      ux: 0,
      uy: 0,
      showGrad: !!show.vel,
      showDir: false,
    });
  },
  law() {
    return [
      '\\gamma(t)=(x(t),\\,y(t))',
      "L(\\gamma)=\\displaystyle\\int_a^b\\sqrt{x'(t)^2+y'(t)^2}\\,dt",
    ];
  },
  liveRows(state, computed) {
    const slope =
      computed.tangent === 'vertical'
        ? 'vertical'
        : computed.tangent === 'cusp'
          ? 'undefined (speed 0)'
          : Number.isFinite(computed.slope)
            ? `$${fmt(computed.slope)}$`
            : '—';
    const closed = Number.isFinite(computed.Lclosed) ? `$${fmt(computed.Lclosed)}$` : 'no closed form';
    return (
      kv('$\\gamma$', `$${computed.curve.tex}$`) +
      kv('$t$', `$${fmt(state.t)}$`) +
      kv('$\\gamma(t)$', `$(${fmt(computed.x)}, ${fmt(computed.y)})$`) +
      kv("$\\gamma'(t)$", `$(${fmt(computed.xp)}, ${fmt(computed.yp)})$`) +
      kv("$\\|\\gamma'(t)\\|$", `$${fmt(computed.speed)}$`) +
      kv('slope $y\'/x\'$', slope) +
      kv('length $t_0\\to t$ (Simpson)', `$${fmt(computed.Lsimp)}$`) +
      kv('length (polyline)', `$${fmt(computed.Lpoly)}$`) +
      kv('length (closed form)', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['$\\gamma(t)$', `$(${fmt(computed.x)}, ${fmt(computed.y)})$`],
      ["$\\|\\gamma' \\|$", `$${fmt(computed.speed)}$`],
      ['$L$', `$${fmt(computed.Lsimp)}$`],
      ['routes agree', computed.matchL < 0.02 * Math.max(1, computed.Lsimp) ? 'yes' : 'check $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      `The curve is the set of points $\\gamma(t)$ as $t$ runs through the interval — not the graph of $(t,x(t),y(t))$ in $\\mathbb{R}^3$. The yellow line is the tangent; its slope is $y'(t)/x'(t)$ when $x'(t)\\neq 0$.`,
    );
    if (computed.tangent === 'vertical') {
      body.push('Here $x\'(t)=0$ and $y\'(t)\\neq 0$: the tangent is vertical.');
    } else if (computed.tangent === 'horizontal') {
      body.push('Here $y\'(t)=0$ and $x\'(t)\\neq 0$: the tangent is horizontal.');
    } else if (computed.tangent === 'cusp') {
      body.push("Speed is zero, so the tangent direction is not defined from $\\gamma'(t)$.");
    }
    body.push(eq("L(\\gamma)=\\int_a^b \\sqrt{x'(t)^2+y'(t)^2}\\,dt"));
    body.push(
      `The length from the start of the interval to this $t$ is a Simpson integral of the speed, checked against the polyline through 400 samples${Number.isFinite(computed.Lclosed) ? ' and against a closed form' : ''}.`,
    );
    return { title: 'Parametric curves', body };
  },
  plot: () => null,
});
