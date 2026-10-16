import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import {
  altGroups,
  altSum,
  geomLoop,
  geomPartial,
  geomTerm,
  harmonicSplit,
  harmonicSum,
  ln2,
  onesLoop,
  onesSum,
} from '../math/calc2.js';
import { GraphView } from '../scene/graph.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'geom', name: 'Geometric 1/2', kind: 'geom', n: 8 },
  { id: 'harm', name: 'Harmonic', kind: 'harm', n: 8 },
  { id: 'alt', name: 'Alternating', kind: 'alt', n: 8 },
  { id: 'ones', name: 'All ones', kind: 'ones', n: 8 },
];

const FRAME = { xMin: -0.8, xMax: 13.2, yMin: -1.2, yMax: 13.2 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function seriesCamera(state) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const xMin = Number.isFinite(state?.xMin) ? state.xMin : FRAME.xMin;
  const xMax = Number.isFinite(state?.xMax) ? state.xMax : FRAME.xMax;
  const yMin = Number.isFinite(state?.yMin) ? state.yMin : FRAME.yMin;
  const yMax = Number.isFinite(state?.yMax) ? state.yMax : FRAME.yMax;
  const cx = ((xMin + xMax) / 2) * u;
  const cy = ((yMin + yMax) / 2) * u;
  const halfW = ((xMax - xMin) / 2) * u;
  const z = (halfW * 1.25) / (Math.tan(Math.PI / 9) * (380 / 780));
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function clampN(n) {
  const k = Math.round(Number.isFinite(n) ? n : 8);
  return Math.min(120, Math.max(4, k));
}

function kindOf(kind) {
  if (kind === 'harm' || kind === 'alt' || kind === 'ones') return kind;
  return 'geom';
}

function partial(kind, n) {
  if (kind === 'harm') return harmonicSum(n);
  if (kind === 'alt') return altSum(n);
  if (kind === 'ones') return onesSum(n);
  return geomPartial(0.5, n);
}

function partialAlt(kind, n) {
  if (kind === 'harm') return harmonicSplit(n);
  if (kind === 'alt') return altGroups(n);
  if (kind === 'ones') return onesLoop(n);
  return geomLoop(0.5, n);
}

function termAt(kind, n) {
  if (kind === 'harm') return 1 / n;
  if (kind === 'alt') return (n % 2 ? 1 : -1) / n;
  if (kind === 'ones') return 1;
  return geomTerm(0.5, n);
}

function limitOf(kind) {
  if (kind === 'geom') return 2;
  if (kind === 'alt') return ln2();
  return null;
}

export default defineLab({
  id: 'series',
  exam: 'u3',
  title: 'Series',
  hint: 'Watch the partial sums. A term going to 0 is not enough.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: seriesCamera,
  toggles: [
    { key: 'sums', label: 'Sums' },
    { key: 'terms', label: 'Terms' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'geom',
      kind: 'geom',
      n: 8,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { sums: true, terms: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>terms</span>
          <div class="slider-row">
            <input type="range" id="ser-n" min="4" max="120" step="1" value="8" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('ser-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const n = document.getElementById('ser-n');
    if (n) n.value = state.n;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = s.kind;
    state.n = s.n;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const kind = kindOf(state.kind);
    const n = clampN(state.n);
    state.kind = kind;
    state.n = n;
    Object.assign(state, FRAME);
    const sn = partial(kind, n);
    const alt = partialAlt(kind, n);
    const limit = limitOf(kind);
    computed.sn = sn;
    computed.an = termAt(kind, n);
    computed.limit = limit;
    computed.converges = limit != null;
    computed.kind = kind;
    computed.n = n;
    computed.agree = Math.abs(sn - alt) <= 1e-9;
  },
  init(ctx) {
    return { view: new GraphView(ctx.scene) };
  },
  enter(ctx, handle) {
    handle.view.setVisible(true);
  },
  exit(ctx, handle) {
    handle.view.setVisible(false);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const view = ctx.handle.view;
    const kind = state.kind;
    const n = state.n;
    const points = [];
    for (let k = 1; k <= n; k++) points.push({ x: k, y: partial(kind, k) });
    view.syncCurve('curve', (x) => partial(kind, Math.max(1, Math.min(n, Math.round(x)))), 1, n, show.sums !== false);
    view.syncCurve('poly', (x) => termAt(kind, Math.max(1, Math.min(n, Math.round(x)))), 1, n, show.terms !== false);
    view.syncNodes(points, show.sums !== false, 0.16);
    view.syncMark(0, 0, false);
    view.syncHatch(() => 0, 0, 1, false);
    view.syncLevel(computed.limit, FRAME.xMin + 0.2, FRAME.xMax - 0.2, computed.converges === true);
  },
  law(state) {
    const kind = state?.kind || 'geom';
    if (kind === 'harm') return [String.raw`H_n=\sum_{k=1}^{n}\frac{1}{k}`, String.raw`\int_1^{\infty}\frac{1}{x}\,dx`];
    if (kind === 'alt') return [String.raw`\sum_{k=1}^{n}\frac{(-1)^{k+1}}{k}`, String.raw`\sum_{k=1}^{\infty}\frac{(-1)^{k+1}}{k}=\ln 2`];
    if (kind === 'ones') return [String.raw`\sum_{k=1}^{n} 1=n`];
    return [String.raw`\sum_{k=0}^{n-1}\left(\frac{1}{2}\right)^{k}=2\left(1-\left(\frac{1}{2}\right)^{n}\right)`, String.raw`\sum_{k=0}^{\infty}\left(\frac{1}{2}\right)^{k}=2`];
  },
  liveRows(state, computed) {
    const limit = computed.converges ? `$${fmt(computed.limit)}$` : 'none';
    return (
      kv('terms', `$${fmt(state.n)}$`) +
      kv('partial sum', `$${fmt(computed.sn)}$`) +
      kv('last term', `$${fmt(computed.an)}$`) +
      kv('limit', limit)
    );
  },
  readout(state, computed) {
    return cells([
      ['sum', `$${fmt(computed.sn)}$`],
      ['term', `$${fmt(computed.an)}$`],
      ['limit', computed.converges ? `$${fmt(computed.limit)}$` : 'none'],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'Teal is the partial sum. Yellow is the term you just added. White marks are the sums.',
    ];
    if (state.kind === 'geom') {
      body.push('Each term is half the one before it. The geometric formula gives the sum, and the ceiling is 2.');
    } else if (state.kind === 'harm') {
      body.push('The terms go to 0. The sums still climb. The integral of 1/x says there is no ceiling.');
    } else if (state.kind === 'alt') {
      body.push('The signs alternate and the terms shrink. The alternating-series test gives a ceiling at ln 2.');
    } else {
      body.push('The terms stay at 1. They do not go to 0, so the partial sums are just the number of terms.');
    }
    body.push(eq(String.raw`s_{${state.n}}=${fmt(computed.sn)}`));
    if (computed.agree) body.push('A second way of adding the same terms agrees.');
    return { title: 'Which test the terms earn', body };
  },
  plot() {
    return null;
  },
});
