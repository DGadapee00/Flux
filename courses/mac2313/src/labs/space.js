import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { spaceById, evalSpace, polylineLength3 } from '../math/space.js';
import { simpson } from '../math/quadrature.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo } from '../math/agree.js';


export default defineLab({
  id: 'space',
  exam: 'ch4',
  title: 'Space',
  hint: 'Slide $t$ · $\\gamma(t)=(x(t),y(t),z(t))$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.4, 6.2, 9.2), target: new THREE.Vector3(0, 1.2, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'tangent', label: 'Tangent line' },
    { key: 'vel', label: "$\\gamma'(t)$" },
  ],
  scenarios: SCENARIOS.space,
  defaultState() {
    return {
      scenarioId: 'helix',
      curveId: 'helix',
      t: Math.PI / 3,
      t0: 0,
      t1: 2 * Math.PI,
      probe: { x: 0.5, y: 0.866, z: 1.047 },
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
            <input type="range" id="sp-t" min="0" max="6.2832" step="0.01" value="1.047" />
            <span class="mono val" id="sp-t-val">1.05</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('sp-t').addEventListener('input', (e) => {
      api.slice().t = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('sp-t');
    if (!el) return;
    el.min = String(state.t0);
    el.max = String(state.t1);
    el.value = state.t;
    document.getElementById('sp-t-val').textContent = Number(state.t).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('space', id, state);
    const c = spaceById(state.curveId);
    state.t0 = c.t0;
    state.t1 = c.t1;
    state.t = c.tStart ?? 0.5 * (c.t0 + c.t1);
  },
  extent(state) {
    const c = spaceById(state.curveId);
    let m = 2;
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = c.t0 + ((c.t1 - c.t0) * i) / n;
      m = Math.max(m, Math.abs(c.x(t)), Math.abs(c.y(t)), Math.abs(c.z(t)));
    }
    return m;
  },
  recompute(state, computed) {
    const c = spaceById(state.curveId);
    let t = Number.isFinite(state.t) ? state.t : c.t0;
    t = Math.max(c.t0, Math.min(c.t1, t));
    state.t = t;
    const e = evalSpace(c, t);
    state.probe = { x: e.x, y: e.y, z: e.z };
    const Lsimp = simpson((s) => c.speed(s), c.t0, t, 1e-6);
    const Lpoly = polylineLength3(c, c.t0, t, 400);
    const Lclosed = c.length ? c.length(c.t0, t) : NaN;
    computed.curve = c;
    computed.x = e.x;
    computed.y = e.y;
    computed.z = e.z;
    computed.xp = e.xp;
    computed.yp = e.yp;
    computed.zp = e.zp;
    computed.speed = e.speed;
    computed.Lsimp = Lsimp;
    computed.Lpoly = Lpoly;
    computed.Lclosed = Lclosed;
    /*
     * Arc length is non-negative and cannot cancel, so it is its own yardstick — but it is zero at
     * t = t0, where a floor of 1 used to wave through any disagreement at all.
     */
    const sL = Math.max(Math.abs(Lsimp), Math.abs(Lpoly));
    computed.agree =
      agreeTo(Lsimp, Lpoly, sL) && (!Number.isFinite(Lclosed) || agreeTo(Lsimp, Lclosed, sL));
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const c = computed.curve;
    ctx.pool.curve().setVisible(true);
    ctx.pool.curve().sync({
      x: c.x,
      y: c.y,
      z: c.z,
      t0: c.t0,
      t1: c.t1,
      t: state.t,
      xp: computed.xp,
      yp: computed.yp,
      zp: computed.zp,
      showCurve: show.curve !== false,
      showTan: !!show.tangent,
      tanLen: 1.1,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, state.probe.z, 'γ(t)');
    ctx.pool.spaceArrows().setVisible(!!show.vel);
    ctx.pool.spaceArrows().sync({
      origin: { x: computed.x, y: computed.y, z: computed.z },
      u: { x: computed.xp, y: computed.yp, z: computed.zp },
      showU: !!show.vel,
      showV: false,
      showSum: false,
      showCross: false,
      showPara: false,
    });
  },
  law() {
    return [
      '\\gamma(t)=(x(t),\\,y(t),\\,z(t))',
      "L(\\gamma)=\\displaystyle\\int_a^b\\sqrt{x'(t)^2+y'(t)^2+z'(t)^2}\\,dt",
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.Lclosed) ? `$${fmt(computed.Lclosed)}$` : 'no closed form';
    return (
      kv('$\\gamma$', `$${computed.curve.tex}$`) +
      kv('$t$', `$${fmt(state.t)}$`) +
      kv('$\\gamma(t)$', `$(${fmt(computed.x)}, ${fmt(computed.y)}, ${fmt(computed.z)})$`) +
      kv("$\\gamma'(t)$", `$(${fmt(computed.xp)}, ${fmt(computed.yp)}, ${fmt(computed.zp)})$`) +
      kv("$\\|\\gamma'(t)\\|$", `$${fmt(computed.speed)}$`) +
      kv('length $t_0\\to t$ (Simpson)', `$${fmt(computed.Lsimp)}$`) +
      kv('length (polyline)', `$${fmt(computed.Lpoly)}$`) +
      kv('length (closed form)', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['$\\gamma(t)$', `$(${fmt(computed.x)}, ${fmt(computed.y)}, ${fmt(computed.z)})$`],
      ["$\\|\\gamma'\\|$", `$${fmt(computed.speed)}$`],
      ['$L$', `$${fmt(computed.Lsimp)}$`],
      ['routes agree', computed.agree ? 'yes' : 'check $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'A space curve is $\\gamma(t)=(x(t),y(t),z(t))$ as $t$ runs through an interval. Theorem 23 says the length is the integral of the speed $\\sqrt{x\'^2+y\'^2+z\'^2}$. The yellow line is the tangent: the parametric line $\\{\\gamma(t)+s\\gamma\'(t): s\\in\\mathbb{R}\\}$.',
    );
    body.push(eq("L(\\gamma)=\\int_a^b \\sqrt{x'(t)^2+y'(t)^2+z'(t)^2}\\,dt"));
    body.push(
      `The length from the start of the interval to this $t$ is a Simpson integral of the speed, checked against a 400-segment polyline${Number.isFinite(computed.Lclosed) ? ' and a closed form' : ''}. ${computed.agree ? 'The routes agree.' : 'The polyline is still catching up.'}`,
    );
    return { title: 'Parametric curves in $\\mathbb{R}^3$', body };
  },
  plot: () => null,
});
