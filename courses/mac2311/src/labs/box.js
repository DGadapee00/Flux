import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { boxBestCut, boxVolume, boxVolumeRate, boxVolumeStep } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab } from './define.js';

const SIDE = 12;

const SCENARIOS = [
  { id: 'short', name: 'Small cut', x: 1 },
  { id: 'peak', name: 'At the peak', x: 2 },
  { id: 'deep', name: 'Large cut', x: 4 },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function frameOf(side) {
  return {
    xMin: -1,
    xMax: 1.5 * side,
    yMin: -2,
    yMax: 0.62 * side,
  };
}

function boxCamera(state) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const xMin = Number.isFinite(state?.xMin) ? state.xMin : -1;
  const xMax = Number.isFinite(state?.xMax) ? state.xMax : 18;
  const yMin = Number.isFinite(state?.yMin) ? state.yMin : -2;
  const yMax = Number.isFinite(state?.yMax) ? state.yMax : 8;
  const cx = ((xMin + xMax) / 2) * u;
  const cy = ((yMin + yMax) / 2) * u;
  const halfW = ((xMax - xMin) / 2) * u;
  // 40° fov. Width is the tight axis on a 380×780 phone, so the distance comes from that.
  const z = (halfW * 1.2) / (Math.tan(Math.PI / 9) * (380 / 780));
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function boxEdges(w, h) {
  const d = 0.42 * w;
  const pairs = [
    [0, 0, w, 0],
    [0, 0, 0, h],
    [w, 0, w, h],
    [0, h, w, h],
    [0, 0, d, d],
    [w, 0, w + d, d],
    [0, h, d, h + d],
    [w, h, w + d, h + d],
    [d, d, w + d, d],
    [d, h + d, w + d, h + d],
    [d, d, d, h + d],
    [w + d, d, w + d, h + d],
  ];
  return pairs.map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1 }));
}

export default defineLab({
  id: 'box',
  exam: 'u3',
  title: 'Open box',
  hint: 'Slide the cut. The biggest box is not the biggest cut.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: boxCamera,
  toggles: [
    { key: 'box', label: 'Box' },
    { key: 'best', label: 'Best' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'short',
      side: SIDE,
      x: 1,
      ...frameOf(SIDE),
      view: { upm: 1, plane: 'xy' },
      show: { box: true, best: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>cut</span>
          <div class="slider-row">
            <input type="range" id="box-x" min="0.4" max="5.6" step="0.1" value="1" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('box-x').addEventListener('input', (e) => {
      api.slice().x = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const x = document.getElementById('box-x');
    if (!x) return;
    const max = state.side / 2 - 0.4;
    x.max = String(max);
    x.min = '0.4';
    x.value = state.x;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.side = SIDE;
    state.x = s.x;
    Object.assign(state, frameOf(SIDE));
    keepXy(state);
  },
  extent(state) {
    const frame = frameOf(state?.side || SIDE);
    return Math.max(Math.abs(frame.xMin), frame.xMax, Math.abs(frame.yMin), frame.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const side = Number.isFinite(state.side) && state.side > 2 ? state.side : SIDE;
    let x = Number.isFinite(state.x) ? state.x : 1;
    const lo = 0.4;
    const hi = side / 2 - 0.4;
    x = Math.min(hi, Math.max(lo, x));
    state.side = side;
    state.x = x;
    Object.assign(state, frameOf(side));
    const best = boxBestCut(side);
    computed.w = side - 2 * x;
    computed.h = x;
    computed.v = boxVolume(side, x);
    computed.dv = boxVolumeRate(side, x);
    computed.step = boxVolumeStep(side, x);
    computed.best = best;
    computed.vmax = boxVolume(side, best);
    computed.agree = Math.abs(computed.dv - computed.step) <= 1e-3;
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
    const best = computed.best;
    view.syncCurve(() => 0, 0, 1, false);
    view.syncLine('secant', 0, 0, 0, 0, false);
    view.syncLine('tangent', 0, 0, 0, 0, false);
    view.syncBars([], false);
    view.syncGuides([], false);
    view.syncMarks([], false);
    view.syncRod(0, 0, 0, 0, false);
    view.syncMotion([], false);
    view.syncBox('peak', boxEdges(state.side - 2 * best, best), show.best !== false);
    view.syncBox('wire', boxEdges(computed.w, computed.h), show.box !== false);
  },
  law() {
    return [String.raw`V=x(s-2x)^2`, String.raw`V'=(s-2x)(s-6x)`];
  },
  liveRows(state, computed) {
    return (
      kv('sheet', `$${fmt(state.side)}$ in`) +
      kv('cut', `$${fmt(state.x)}$ in`) +
      kv('base', `$${fmt(computed.w)}$ in`) +
      kv('height', `$${fmt(computed.h)}$ in`) +
      kv('volume', `$${fmt(computed.v)}$ in³`) +
      kv('slope', `$${fmt(computed.dv)}$`) +
      kv('peak cut', `$${fmt(computed.best)}$ in`)
    );
  },
  readout(state, computed) {
    return cells([
      ['volume', `$${fmt(computed.v)}$`],
      ['slope', `$${fmt(computed.dv)}$`],
      ['peak', `$${fmt(computed.vmax)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'Equal squares are cut from a square sheet, then the sides fold up.',
      'The volume rises, then falls. The peak is not at the biggest cut.',
      eq(String.raw`V'=(${fmt(state.side)}-2\cdot${fmt(state.x)})(${fmt(state.side)}-6\cdot${fmt(state.x)})=${fmt(computed.dv)}`),
    ];
    if (Math.abs(computed.dv) < 1e-6) body.push('This cut gives the greatest volume.');
    else if (computed.dv > 0) body.push('Volume is still rising. The cut is short of the peak.');
    else body.push('Volume is falling. The cut is past the peak.');
    body.push(`The peak cut is $${fmt(computed.best)}$ inches, and the volume there is $${fmt(computed.vmax)}$.`);
    return { title: 'The biggest cut is a small box', body };
  },
  plot(state, computed) {
    const n = 48;
    const lo = 0.2;
    const hi = state.side / 2 - 0.2;
    const xs = [];
    const Vs = [];
    for (let i = 0; i < n; i++) {
      const x = lo + ((hi - lo) * i) / (n - 1);
      xs.push(x);
      Vs.push(boxVolume(state.side, x));
    }
    return { type: 'Vx', xs, Vs, xProbe: state.x, xA: computed.best };
  },
});
