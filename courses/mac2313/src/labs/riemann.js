import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { riemannRect } from '../math/riemann.js';
import { closedRect } from '../math/double.js';
import { agreeTo } from '../math/agree.js';
import { integral2 } from '../math/quadrature.js';
import { rectCell, rectPartial, range2 } from '../math/terms.js';
import { RIEMANN_MAX_N } from '../scene/riemann.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { ensureAnim, shownCount, tickReveal, onTermAction, playControls, bindPlay, syncPlayButton, plain, showAll } from './reveal.js';
import { clickPicker } from './pick.js';

/*
 * The yardstick is the integral of |f| over the same region — not the value of the integral, which
 * can cancel to near zero while both routes are wrong, and not a floor of 1, which made the
 * tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

const totalOf = (state) => {
  const n = Math.max(2, Math.min(RIEMANN_MAX_N, state.n | 0));
  return n * n;
};

export default defineLab({
  id: 'riemann',
  exam: 'ch3',
  title: 'Riemann',
  hint: 'Click a cell · play adds one term at a time',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.4, 7.2, 9.6), target: new THREE.Vector3(0.6, 0.5, 0.6) },
  keys: { r: 'reset', R: 'reset', ' ': 'sweep', ArrowRight: 'next', ArrowLeft: 'prev' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'boxes', label: 'Boxes' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.riemann,
  defaultState() {
    return {
      scenarioId: 'para-sq',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      n: 4,
      sample: 'mid',
      cell: 0,
      anim: { playing: false, i: 1e9, t: 0 },
      probe: { x: 0.5, y: 0.5, z: 0 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      show: { surface: true, boxes: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n × n</span>
          <div class="slider-row">
            <input type="range" id="rm-n" min="2" max="${RIEMANN_MAX_N}" step="1" value="4" />
            <span class="mono val" id="rm-n-val">4</span>
          </div>
        </label>
        <label class="field">
          <span>Sample point</span>
          <select id="rm-sample">
            <option value="mid">Midpoint</option>
            <option value="ll">Lower left</option>
            <option value="ur">Upper right</option>
          </select>
        </label>
        ${playControls('rm')}
      </div>`;
  },
  bind(api) {
    document.getElementById('rm-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('rm-sample').addEventListener('change', (e) => {
      api.slice().sample = e.target.value;
      api.bump();
    });
    bindPlay('rm', api, totalOf);
  },
  syncControls(state) {
    const nEl = document.getElementById('rm-n');
    if (!nEl) return;
    nEl.value = state.n;
    document.getElementById('rm-n-val').textContent = String(state.n);
    const sel = document.getElementById('rm-sample');
    if (sel) sel.value = state.sample;
    syncPlayButton('rm', state);
  },
  applyScenario(id, state) {
    applyData('riemann', id, state);
    if (!state.n) state.n = 4;
    if (!state.sample) state.sample = 'mid';
    state.cell = 0;
    showAll(state);
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      1,
    );
  },
  onAction(action, state) {
    return onTermAction(action, state, totalOf(state));
  },
  pointer: clickPicker((state, m, bump) => {
    const n = Math.max(2, Math.min(RIEMANN_MAX_N, state.n | 0));
    const dx = (state.xMax - state.xMin) / n;
    const dy = (state.yMax - state.yMin) / n;
    if (dx === 0 || dy === 0) return;
    const i = Math.floor((m.x - state.xMin) / dx);
    const j = Math.floor((m.y - state.yMin) / dy);
    if (i < 0 || j < 0 || i >= n || j >= n) return;
    state.cell = i * n + j;
    showAll(state);
    bump();
  }),
  tick(dt, state) {
    return tickReveal(dt, state, totalOf(state), 0.07);
  },
  recompute(state, computed) {
    ensureAnim(state);
    const n = Math.max(2, Math.min(RIEMANN_MAX_N, state.n | 0));
    state.n = n;
    const sample = state.sample === 'll' || state.sample === 'ur' ? state.sample : 'mid';
    state.sample = sample;
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const xa = state.xMin;
    const xb = state.xMax;
    const ya = state.yMin;
    const yb = state.yMax;
    const mid = riemannRect(fn, xa, xb, ya, yb, { nx: n, ny: n, sample });
    const simp = integral2(fn, xa, xb, ya, yb, { order: 'xy', n: 64 });
    const Iabs = integral2((x, y) => Math.abs(fn(x, y)), xa, xb, ya, yb, { order: 'xy', n: 64 });
    const closed = closedRect(surf.id, xa, xb, ya, yb, p);
    const truth = Number.isFinite(closed) ? closed : simp;
    const total = n * n;
    state.cell = ((state.cell | 0) % total + total) % total;
    const shown = shownCount(state, total);
    const cell = rectCell(xa, xb, ya, yb, n, n, Math.min(state.cell, Math.max(0, shown - 1)), sample);
    const running = rectPartial(fn, xa, xb, ya, yb, n, n, sample, shown);
    const fv = fn(cell.x, cell.y);
    const scale = range2(fn, xa, xb, ya, yb, 8);
    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.sum = mid.sum;
    computed.running = running.sum;
    computed.shown = shown;
    computed.total = total;
    computed.simp = simp;
    computed.closed = closed;
    computed.dx = mid.dx;
    computed.dy = mid.dy;
    computed.dA = mid.dA;
    computed.n = n;
    computed.sample = sample;
    computed.cell = cell;
    computed.term = { ...cell, f: fv, value: fv * cell.dA };
    computed.err = Math.abs(mid.sum - truth);
    computed.Iabs = Iabs;
    computed.agree = agree(mid.sum, truth, Iabs);
    computed.truth = truth;
    computed.flo = scale.lo;
    computed.fhi = scale.hi;
    computed.flat = scale.flat;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    const term = computed.term;
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: { x: term.x, y: term.y },
      fP: term.f,
      show: show.surface !== false,
      stem: false,
    });
    ctx.pool.riemann().setVisible(!!show.boxes);
    ctx.pool.riemann().sync({
      mode: 'rect',
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      nx: state.n,
      ny: state.n,
      sample: state.sample,
      reveal: computed.shown,
      select: term.index,
      lo: computed.flo,
      hi: computed.fhi,
      show: !!show.boxes,
    });
  },
  law(state, computed) {
    const t = computed.term;
    if (!t) return ['\\displaystyle\\iint_D f\\,dA = \\lim \\sum f(x_{ij}^*, y_{ij}^*)\\,\\Delta A_{ij}'];
    return [
      `f(${fmt(t.x)}, ${fmt(t.y)})\\,\\Delta A = ${fmt(t.value)}`,
      '\\displaystyle\\iint_D f\\,dA = \\lim_{n\\to\\infty}\\sum f(x_{ij}^*, y_{ij}^*)\\,\\Delta x\\,\\Delta y',
    ];
  },
  liveRows(state, computed) {
    const t = computed.term;
    const sample =
      computed.sample === 'll' ? 'lower left' : computed.sample === 'ur' ? 'upper right' : 'midpoint';
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    const partial = computed.shown < computed.total;
    return (
      kv('cell', `$(i, j) = (${t.i + 1}, ${t.j + 1})$`) +
      kv('sample $(x^*, y^*)$', `$(${fmt(t.x)}, ${fmt(t.y)})$`) +
      kv('$f(x^*, y^*)$', `$${fmt(t.f)}$`) +
      kv('$\\Delta x\\,\\Delta y$', `$${fmt(t.dx)}\\cdot ${fmt(t.dy)} = ${fmt(t.dA)}$`) +
      kv('this term', `$${fmt(t.value)}$`) +
      kv(partial ? 'sum so far' : 'Riemann sum', `$${fmt(partial ? computed.running : computed.sum)}$`) +
      kv('Simpson $\\iint$', `$${fmt(computed.simp)}$`) +
      kv('closed form', closed) +
      kv('sample rule', sample)
    );
  },
  readout(state, computed) {
    const partial = computed.shown < computed.total;
    return cells([
      ['this term', `$${fmt(computed.term.value)}$`],
      [partial ? 'so far' : 'sum', `$${fmt(partial ? computed.running : computed.sum)}$`],
      ['$\\iint$', `$${fmt(computed.truth)}$`],
      ['cell', `$${computed.term.i + 1}, ${computed.term.j + 1}$`],
    ]);
  },
  legendLabels(state, computed) {
    if (computed.flat) return { low: `f = ${plain(computed.flo)}`, high: `f = ${plain(computed.fhi)}` };
    return { low: plain(computed.flo), high: plain(computed.fhi) };
  },
  coach(state, computed) {
    const t = computed.term;
    const body = [];
    const sign =
      t.f < -1e-8
        ? 'This term is negative, so the box hangs below the plane and subtracts from the sum.'
        : 'The box height is $f$ at the white sample point. The gold rectangle on the floor is the true base $\\Delta x$ by $\\Delta y$, not the gap between boxes.';
    body.push(
      `Cell $(${t.i + 1}, ${t.j + 1})$ contributes $${fmt(t.value)}$. ${sign}`,
    );
    body.push(eq('f(x^*, y^*)\\,\\Delta x\\,\\Delta y'));
    body.push(
      computed.shown < computed.total
        ? `Play has added ${computed.shown} of ${computed.total} terms. The sum so far is $${fmt(computed.running)}$.`
        : `All $${computed.total}$ terms are in. At $n=${computed.n}$ they ${computed.agree ? 'already match the integral' : 'are still a coarse partition — raise $n$'}.`,
    );
    return { title: 'One term of the double sum', body };
  },
  plot: () => null,
});
