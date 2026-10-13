import * as THREE from 'three';
import { defineLab, planeCamera } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { graphById, graphPolyline, graphSpeed } from '../math/graphs1.js';
import { agreeTo } from '../math/agree.js';
import { riemann1d } from '../math/riemann.js';
import { simpson } from '../math/quadrature.js';
import { barCell, barPartial, range1 } from '../math/terms.js';
import { GRAPH_BARS_MAX_N } from '../scene/graphBars.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { ensureAnim, shownCount, tickReveal, onTermAction, playControls, bindPlay, syncPlayButton, plain, showAll } from './reveal.js';
import { clickPicker } from './pick.js';

/*
 * The yardstick is the integral of |f| over the same interval — not the value of the integral,
 * which can cancel to near zero while both routes are wrong, and not a floor of 1, which made the
 * tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

export default defineLab({
  id: 'riemann1',
  exam: 'ch1',
  title: 'Riemann',
  hint: 'Click a rectangle · play adds one term at a time',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  camera: { pos: new THREE.Vector3(0, 0, 14), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset', ' ': 'sweep', ArrowRight: 'next', ArrowLeft: 'prev' },
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'bars', label: 'Rectangles' },
  ],
  legend: { id: 'f', title: '$f(x)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.riemann1,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      a: 0,
      b: 1,
      n: 6,
      sample: 'mid',
      cell: 0,
      anim: { playing: false, i: 1e9, t: 0 },
      probe: { x: 0.5, y: 0.25, z: 0 },
      xMin: -0.2,
      xMax: 1.2,
      yMin: -0.2,
      yMax: 1.4,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, bars: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n</span>
          <div class="slider-row">
            <input type="range" id="r1-n" min="2" max="${GRAPH_BARS_MAX_N}" step="1" value="6" />
            <span class="mono val" id="r1-n-val">6</span>
          </div>
        </label>
        <label class="field">
          <span>Sample point</span>
          <select id="r1-sample">
            <option value="left">Left</option>
            <option value="mid">Midpoint</option>
            <option value="right">Right</option>
          </select>
        </label>
        ${playControls('r1')}
      </div>`;
  },
  bind(api) {
    document.getElementById('r1-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('r1-sample').addEventListener('change', (e) => {
      api.slice().sample = e.target.value;
      api.bump();
    });
    bindPlay('r1', api, (s) => Math.max(2, Math.min(GRAPH_BARS_MAX_N, s.n | 0)));
  },
  syncControls(state) {
    const nEl = document.getElementById('r1-n');
    if (!nEl) return;
    nEl.value = state.n;
    document.getElementById('r1-n-val').textContent = String(state.n);
    const sel = document.getElementById('r1-sample');
    if (sel) sel.value = state.sample;
    syncPlayButton('r1', state);
  },
  applyScenario(id, state) {
    applyData('riemann1', id, state);
    keepXy(state);
    if (!state.n) state.n = 6;
    if (!state.sample) state.sample = 'mid';
    state.cell = 0;
    showAll(state);
  },
  extent(state) {
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) ? state.b : 1;
    let m = Math.max(Math.abs(a), Math.abs(b), 1.2);
    for (let i = 0; i <= 20; i++) {
      const y = g.f(a + ((b - a) * i) / 20);
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  onAction(action, state) {
    const n = Math.max(2, Math.min(GRAPH_BARS_MAX_N, state.n | 0));
    return onTermAction(action, state, n);
  },
  pointer: clickPicker((state, m, bump) => {
    const n = Math.max(2, Math.min(GRAPH_BARS_MAX_N, state.n | 0));
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) ? state.b : 1;
    const dx = (b - a) / n;
    if (dx === 0) return;
    const i = Math.floor((m.x - a) / dx);
    if (i < 0 || i >= n) return;
    state.cell = i;
    showAll(state);
    bump();
  }),
  tick(dt, state) {
    const n = Math.max(2, Math.min(GRAPH_BARS_MAX_N, state.n | 0));
    return tickReveal(dt, state, n, 0.08);
  },
  recompute(state, computed) {
    keepXy(state);
    ensureAnim(state);
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) ? state.b : 1;
    state.a = a;
    state.b = b;
    const n = Math.max(2, Math.min(GRAPH_BARS_MAX_N, state.n | 0));
    state.n = n;
    const sample = state.sample === 'left' || state.sample === 'right' ? state.sample : 'mid';
    state.sample = sample;
    const left = riemann1d(g.f, a, b, { n, sample: 'left' });
    const mid = riemann1d(g.f, a, b, { n, sample: 'mid' });
    const right = riemann1d(g.f, a, b, { n, sample: 'right' });
    const chosen = sample === 'left' ? left : sample === 'right' ? right : mid;
    const Isimp = simpson(g.f, a, b);
    const Iabs = simpson((x) => Math.abs(g.f(x)), a, b);
    const Iclosed = g.F ? g.F(b) - g.F(a) : NaN;
    const truth = Number.isFinite(Iclosed) ? Iclosed : Isimp;
    const Lsimp = simpson((x) => graphSpeed(g, x, a, b), a, b);
    const Lpoly = graphPolyline(g, a, b, 500);
    computed.g = g;
    computed.tex = g.tex;
    computed.sum = chosen.sum;
    computed.left = left.sum;
    computed.mid = mid.sum;
    computed.right = right.sum;
    computed.Isimp = Isimp;
    computed.Iclosed = Iclosed;
    computed.dx = chosen.dx;
    computed.n = n;
    computed.sample = sample;
    computed.Lsimp = Lsimp;
    computed.Lpoly = Lpoly;
    computed.err = Math.abs(chosen.sum - truth);
    computed.Iabs = Iabs;
    /*
     * A Riemann sum against the exact integral is a convergence check, not two equal-accuracy
     * routes: at coarse n the sum is honestly different, and the readout already says "raise n".
     * This used to read `|| n >= 16`, which forced the light green past that n whatever the sum
     * did — the one state where a student is most likely to be looking at a wrong number.
     */
    computed.agree = agree(chosen.sum, truth, Iabs);
    computed.agreeL = agree(Lsimp, Lpoly, Math.abs(Lsimp));
    computed.truth = truth;
    state.cell = ((state.cell | 0) % n + n) % n;
    const shown = shownCount(state, n);
    const cell = barCell(a, b, n, shown <= 0 ? 0 : Math.min(state.cell, shown - 1), sample);
    const running = barPartial(g.f, a, b, n, sample, shown);
    const fv = g.f(cell.x);
    const scale = range1(g.f, a, b, 24);
    computed.shown = shown;
    computed.total = n;
    computed.running = running.sum;
    computed.cell = cell;
    computed.term = { ...cell, f: fv, value: fv * cell.dx };
    computed.flo = scale.lo;
    computed.fhi = scale.hi;
    computed.flat = scale.flat;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const g = computed.g;
    ctx.pool.curve().setVisible(!!show.curve);
    ctx.pool.curve().sync({
      x: (t) => t,
      y: (t) => g.f(t),
      t0: state.a,
      t1: state.b,
      t: 0.5 * (state.a + state.b),
      xp: 1,
      yp: g.fp(0.5 * (state.a + state.b)),
      showCurve: !!show.curve,
      showTan: false,
    });
    ctx.pool.graphBars().setVisible(!!show.bars);
    ctx.pool.graphBars().sync({
      f: g.f,
      a: state.a,
      b: state.b,
      n: state.n,
      sample: state.sample,
      reveal: computed.shown,
      select: computed.term.index,
      lo: computed.flo,
      hi: computed.fhi,
      show: !!show.bars,
    });
    ctx.pool.probe().setVisible(false);
  },
  law(state, computed) {
    const t = computed.term;
    if (!t) {
      return [
        '\\displaystyle\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum f(x_i^*)\\,\\Delta x',
        '= F(b)-F(a)',
      ];
    }
    return [
      `f(${fmt(t.x)})\\,\\Delta x = ${fmt(t.f)}\\cdot ${fmt(t.dx)} = ${fmt(t.value)}`,
      '\\displaystyle\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum f(x_i^*)\\,\\Delta x = F(b)-F(a)',
    ];
  },
  liveRows(state, computed) {
    const t = computed.term;
    const sample = computed.sample === 'left' ? 'left' : computed.sample === 'right' ? 'right' : 'midpoint';
    const closed = Number.isFinite(computed.Iclosed) ? `$${fmt(computed.Iclosed)}$` : 'no closed form';
    const partial = computed.shown < computed.total;
    return (
      kv('interval', `$${t.index + 1}$ of $${computed.total}$`) +
      kv('sample $x^*$', `$${fmt(t.x)}$`) +
      kv('$f(x^*)\\,\\Delta x$', `$${fmt(t.f)}\\cdot ${fmt(t.dx)} = ${fmt(t.value)}$`) +
      kv(partial ? 'sum so far' : 'chosen sum', `$${fmt(partial ? computed.running : computed.sum)}$`) +
      kv('left / mid / right', `$${fmt(computed.left)}$ / $${fmt(computed.mid)}$ / $${fmt(computed.right)}$`) +
      kv('Simpson', `$${fmt(computed.Isimp)}$`) +
      kv('$F(b)-F(a)$', closed) +
      kv('sample', sample) +
      kv('graph length', `$${fmt(computed.Lsimp)}$ vs polyline $${fmt(computed.Lpoly)}$`)
    );
  },
  readout(state, computed) {
    const t = computed.term;
    const partial = computed.shown < computed.total;
    return cells([
      ['this term', `$${fmt(t.value)}$`],
      [partial ? 'so far' : 'sum', `$${fmt(partial ? computed.running : computed.sum)}$`],
      ['$\\int$', `$${fmt(computed.truth)}$`],
      ['$x^*$', `$${fmt(t.x)}$`],
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
        ? 'This sample is negative, so the rectangle hangs below the axis and subtracts.'
        : 'The white dot is the sample point. The gold outline is the whole subinterval, and the rectangle’s height is $f$ there.';
    body.push(`Term $${t.index + 1}$ is $${fmt(t.value)}$. ${sign}`);
    body.push(eq('\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum f(x_i^*)\\,\\Delta x = F(b)-F(a)'));
    body.push(
      computed.shown < computed.total
        ? `Play has added ${computed.shown} of ${computed.total} rectangles. The sum so far is $${fmt(computed.running)}$.`
        : `Graph length, $\\int_a^b\\sqrt{1+(f')^2}\\,dx$, is a different integral (${fmt(computed.Lsimp)} by Simpson). ${computed.agree ? 'At this $n$ the chosen sum matches the integral.' : 'Raise $n$ and the rectangles close in.'}`,
    );
    return { title: 'One rectangle', body };
  },
  plot: () => null,
});
