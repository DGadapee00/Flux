import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { toPolar, toCart, rHat, thetaHat, wrapTau, thetaDeg } from '../math/polar.js';
import { FIT_MAX, sceneScale } from '../engine/frame.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function clamp(s) {
  const lim = (FIT_MAX - 0.05) / sceneScale();
  const fix = (v, lo, hi) => {
    const x = Number.isFinite(v) ? v : 0;
    return Math.max(lo, Math.min(hi, Math.max(-lim, Math.min(lim, x))));
  };
  s.probe.x = fix(s.probe.x, s.xMin, s.xMax);
  s.probe.y = fix(s.probe.y, s.yMin, s.yMax);
}

export default defineLab({
  id: 'polar',
  exam: 'ch2',
  title: 'Polar',
  hint: 'Drag $P$ · $r$ and $\\theta\\in[0,2\\pi)$',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(0.4, 11.2, 0.6), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'grid', label: 'Polar grid' },
    { key: 'rhat', label: '$\\hat r$' },
    { key: 'thhat', label: '$\\hat\\theta$' },
  ],
  scenarios: SCENARIOS.polar,
  defaultState() {
    return {
      scenarioId: 'q1',
      probe: { x: 1.2, y: 0.9, z: 0 },
      xMin: -2.5,
      xMax: 2.5,
      yMin: -2.5,
      yMax: 2.5,
      show: { grid: true, rhat: true, thhat: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x</span>
          <div class="slider-row">
            <input type="range" id="p-x" min="-2.5" max="2.5" step="0.01" value="1.2" />
            <span class="mono val" id="p-x-val">1.2</span>
          </div>
        </label>
        <label class="field">
          <span>y</span>
          <div class="slider-row">
            <input type="range" id="p-y" min="-2.5" max="2.5" step="0.01" value="0.9" />
            <span class="mono val" id="p-y-val">0.9</span>
          </div>
        </label>
        <label class="field">
          <span>r</span>
          <div class="slider-row">
            <input type="range" id="p-r" min="0" max="3.5" step="0.01" value="1.5" />
            <span class="mono val" id="p-r-val">1.5</span>
          </div>
        </label>
        <label class="field">
          <span>θ</span>
          <div class="slider-row">
            <input type="range" id="p-th" min="0" max="6.2832" step="0.01" value="0.64" />
            <span class="mono val" id="p-th-val">37°</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('p-x').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    $('p-y').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
    const fromPolar = () => {
      const s = api.slice();
      const r = Number($('p-r').value);
      const th = Number($('p-th').value);
      const c = toCart(r, th);
      s.probe.x = c.x;
      s.probe.y = c.y;
      api.bump();
    };
    $('p-r').addEventListener('input', fromPolar);
    $('p-th').addEventListener('input', fromPolar);
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if (!$('p-x')) return;
    const pol = toPolar(state.probe.x, state.probe.y);
    $('p-x').min = String(state.xMin);
    $('p-x').max = String(state.xMax);
    $('p-y').min = String(state.yMin);
    $('p-y').max = String(state.yMax);
    const rMax = Math.hypot(state.xMax, state.yMax);
    $('p-r').max = String(rMax);
    $('p-x').value = state.probe.x;
    $('p-y').value = state.probe.y;
    $('p-r').value = pol.r;
    if (Number.isFinite(pol.theta)) $('p-th').value = pol.theta;
    $('p-x-val').textContent = Number(state.probe.x).toFixed(2);
    $('p-y-val').textContent = Number(state.probe.y).toFixed(2);
    $('p-r-val').textContent = pol.r.toFixed(2);
    $('p-th-val').textContent = Number.isFinite(pol.theta) ? `${thetaDeg(pol.theta).toFixed(0)}°` : '—';
  },
  applyScenario(id, state) {
    applyData('polar', id, state);
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
    clamp(state);
    const x = state.probe.x;
    const y = state.probe.y;
    const pol = toPolar(x, y);
    const back = Number.isFinite(pol.theta) ? toCart(pol.r, pol.theta) : { x: 0, y: 0 };
    const rh = Number.isFinite(pol.theta) ? rHat(pol.theta) : { x: 0, y: 0 };
    const th = Number.isFinite(pol.theta) ? thetaHat(pol.theta) : { x: 0, y: 0 };
    computed.r = pol.r;
    computed.theta = pol.theta;
    computed.thDeg = thetaDeg(pol.theta);
    computed.back = back;
    computed.err = Math.hypot(back.x - x, back.y - y);
    computed.r2 = x * x + y * y;
    computed.rh = rh;
    computed.thh = th;
    computed.dot = rh.x * th.x + rh.y * th.y;
    computed.origin = pol.r < 1e-12;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.polarGrid().setVisible(!!show.grid);
    ctx.pool.polarGrid().sync({ rMax: 2.5, show: !!show.grid });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'P');
    ctx.pool.arrows().setVisible(true);
    ctx.pool.arrows().sync({
      probe: state.probe,
      fP: 0,
      fx: computed.rh.x,
      fy: computed.rh.y,
      ux: computed.thh.x,
      uy: computed.thh.y,
      showGrad: !!show.rhat && !computed.origin,
      showDir: !!show.thhat && !computed.origin,
    });
  },
  law() {
    return ['x = r\\cos\\theta,\\quad y = r\\sin\\theta', '\\theta\\in[0,2\\pi)'];
  },
  liveRows(state, computed) {
    const th = Number.isFinite(computed.theta)
      ? `$${fmt(computed.theta)}\\ ( ${fmt(computed.thDeg, 1)}^\\circ )$`
      : 'undefined at the origin';
    return (
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('$r = \\sqrt{x^2+y^2}$', `$${fmt(computed.r)}$`) +
      kv('$\\theta$ (wrap of $\\operatorname{atan2}$)', th) +
      kv('back to $(x,y)$', `$(${fmt(computed.back.x)}, ${fmt(computed.back.y)})$`) +
      kv('$\\hat r$', `$(${fmt(computed.rh.x)}, ${fmt(computed.rh.y)})$`) +
      kv('$\\hat\\theta$', `$(${fmt(computed.thh.x)}, ${fmt(computed.thh.y)})$`) +
      kv('$\\hat r \\cdot \\hat\\theta$', `$${fmt(computed.dot, 4)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['$r$', `$${fmt(computed.r)}$`],
      ['$\\theta$', Number.isFinite(computed.thDeg) ? `$${fmt(computed.thDeg, 1)}^\\circ$` : '—'],
      ['round-trip', computed.err < 1e-9 ? 'yes' : 'no'],
      ['$\\hat r\\perp\\hat\\theta$', Math.abs(computed.dot) < 1e-9 ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    if (computed.origin) {
      body.push('At the origin $r = 0$ and $\\theta$ is not defined — Theorem 10 excludes $(0,0)$. Move $P$ off the origin to pick a unique pair $(r,\\theta)$.');
      return { title: 'Polar coordinates', body };
    }
    body.push(
      `Every nonzero $(x,y)$ is $r(\\cos\\theta,\\sin\\theta)$ for a unique $r>0$ and $\\theta\\in[0,2\\pi)$. The two routes here are Cartesian $\\to$ polar (via $\\operatorname{atan2}$, then wrap) and polar $\\to$ Cartesian${computed.err < 1e-12 ? ', and they agree to machine precision' : ` (difference ${fmt(computed.err, 2)})`}.`,
    );
    body.push(eq('\\hat r = (\\cos\\theta,\\sin\\theta),\\quad \\hat\\theta = (-\\sin\\theta,\\cos\\theta)'));
    body.push(
      `$\\hat r$ points out from the origin along $P$; $\\hat\\theta$ is a $90^\\circ$ left turn, so $\\hat r\\cdot\\hat\\theta = 0$. The notes do not introduce a cross product in $\\mathbb{R}^2$.`,
    );
    return { title: 'Polar coordinates', body };
  },
  plot: () => null,
});
