import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import {
  parabolaArc,
  parabolaArcSimpson,
  parabolaChord,
  segmentLength,
  segmentSimpson,
} from '../math/calc2.js';
import { GraphView } from '../scene/graph.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'parabola', name: 'Parabola', kind: 'parabola', b: 1 },
  { id: 'line', name: 'Line', kind: 'line', b: 1 },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function clampB(b) {
  const n = Number.isFinite(b) ? b : 1;
  return Math.min(50, Math.max(0.5, n));
}

function kindOf(kind) {
  return kind === 'line' ? 'line' : 'parabola';
}

function frameFor(kind, b) {
  const yTop = kind === 'line' ? b : b * b;
  const span = Math.max(b, yTop, 1);
  return {
    xMin: -0.15 * span,
    xMax: b + 0.2 * span,
    yMin: -0.2 * span,
    yMax: yTop + 0.2 * span,
  };
}

/** Half of the scene camera's 40° vertical field of view. */
const TAN_HALF_FOV = Math.tan(Math.PI / 9);

function boxOf(sel) {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector(sel);
  if (!el) return null;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return r;
}

/**
 * The rectangle of the canvas that panels do not cover.
 * On a phone the header, chips, setup sheet, and readout leave a short band.
 */
export function plotWindow() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 380;
  const height = typeof window !== 'undefined' ? window.innerHeight : 780;
  const gap = 14;
  if (typeof document === 'undefined') {
    return { width, height, top: 260, bottom: 310, left: 12, right: 12 };
  }
  let top;
  let bottom;
  let left;
  let right;
  if (width <= 720) {
    const heads = [boxOf('.brand'), boxOf('.toggles')].filter(Boolean);
    const feet = [boxOf('.controls'), boxOf('.readout')].filter(Boolean);
    top = (heads.length ? Math.max(...heads.map((r) => r.bottom)) : 0) + gap;
    const foot = feet.length ? Math.min(...feet.map((r) => r.top)) : height;
    bottom = height - foot + gap;
    left = gap;
    right = gap;
  } else {
    const eq = boxOf('.eq-panel');
    const controls = boxOf('.controls');
    const readout = boxOf('.readout');
    left = (eq ? eq.right : 0) + gap;
    right = controls ? width - controls.left + gap : gap;
    top = gap;
    bottom = readout ? height - readout.top + gap : 80;
  }
  if (width - left - right < 80) {
    left = gap;
    right = gap;
  }
  if (height - top - bottom < 80) {
    top = height * 0.28;
    bottom = height * 0.34;
  }
  return { width, height, top, bottom, left, right };
}

/**
 * Place the camera so the framed curve, including its endpoint marker, lands in `view`.
 * `state` coordinates are math units. `view.upm` is the scene scale.
 */
export function fitArcCamera(state, view) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const b = clampB(state?.b);
  const pad = 0.04 * Math.max(1, b);
  const x0 = ((Number.isFinite(state?.xMin) ? state.xMin : -0.2) - pad) * u;
  const x1 = ((Number.isFinite(state?.xMax) ? state.xMax : 1.2) + pad) * u;
  const y0 = ((Number.isFinite(state?.yMin) ? state.yMin : -0.2) - pad) * u;
  const y1 = ((Number.isFinite(state?.yMax) ? state.yMax : 1.2) + pad) * u;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const halfW = Math.max(1e-6, (x1 - x0) / 2);
  const halfH = Math.max(1e-6, (y1 - y0) / 2);
  const width = view.width;
  const height = view.height;
  const aspect = width / Math.max(1, height);
  const ndcLeft = (view.left / width) * 2 - 1;
  const ndcRight = ((width - view.right) / width) * 2 - 1;
  const ndcTop = 1 - (view.top / height) * 2;
  const ndcBottom = (2 * view.bottom) / height - 1;
  const ndcCx = (ndcLeft + ndcRight) / 2;
  const ndcCy = (ndcBottom + ndcTop) / 2;
  const roomX = Math.max(0.08, Math.min(ndcCx - ndcLeft, ndcRight - ndcCx));
  const roomY = Math.max(0.08, Math.min(ndcCy - ndcBottom, ndcTop - ndcCy));
  const z = Math.min(36, Math.max(4.5, halfW / (roomX * TAN_HALF_FOV * aspect), halfH / (roomY * TAN_HALF_FOV)));
  const tx = cx - ndcCx * z * TAN_HALF_FOV * aspect;
  const ty = cy - ndcCy * z * TAN_HALF_FOV;
  return { pos: new THREE.Vector3(tx, ty, z), target: new THREE.Vector3(tx, ty, 0), z };
}

/** Screen position of a world point under `fitArcCamera`, matching the 40° camera. */
export function projectArc(cam, x, y, view) {
  const aspect = view.width / Math.max(1, view.height);
  const ndcX = (x - cam.target.x) / cam.pos.z / (TAN_HALF_FOV * aspect);
  const ndcY = (y - cam.target.y) / cam.pos.z / TAN_HALF_FOV;
  return {
    ndcX,
    ndcY,
    px: ((ndcX + 1) / 2) * view.width,
    py: ((1 - ndcY) / 2) * view.height,
  };
}

function arcCamera(state) {
  const cam = fitArcCamera(state, plotWindow());
  return { pos: cam.pos, target: cam.target };
}

function curvePoints(kind, b) {
  const n = 80;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (b * i) / n;
    pts.push({ x, y: kind === 'line' ? x : x * x });
  }
  return pts;
}

function measure(kind, b) {
  if (kind === 'line') {
    const length = segmentLength(b);
    const chord = Math.hypot(b, b);
    return {
      length,
      chord,
      simpson: segmentSimpson(b),
      agree: Math.abs(length - segmentSimpson(b)) <= 1e-6 && Math.abs(length - chord) <= 1e-9,
    };
  }
  const length = parabolaArc(b);
  const chord = parabolaChord(b);
  const alt = parabolaArcSimpson(b);
  return {
    length,
    chord,
    simpson: alt,
    agree: Math.abs(length - alt) <= 1e-6 && length > chord + 1e-4,
  };
}

export default defineLab({
  id: 'arc',
  exam: 'u1',
  title: 'Arc length',
  hint: 'Move the right end. The curve is longer than the chord, unless the curve is already a line.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: arcCamera,
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'chord', label: 'Chord' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'parabola',
      kind: 'parabola',
      b: 1,
      ...frameFor('parabola', 1),
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, chord: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>right end</span>
          <div class="slider-row">
            <input type="range" id="arc-b" min="0.5" max="2" step="0.1" value="1" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('arc-b').addEventListener('input', (e) => {
      const s = api.slice();
      const kind = kindOf(s.kind);
      const b = clampB(Number(e.target.value));
      s.kind = kind;
      s.b = b;
      Object.assign(s, frameFor(kind, b));
      if (api.fitView) api.fitView();
      else api.bump();
    });
  },
  syncControls(state) {
    const slider = document.getElementById('arc-b');
    if (!slider) return;
    const shown = Math.min(2, Math.max(0.5, state.b));
    slider.value = shown;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = s.kind;
    state.b = s.b;
    Object.assign(state, frameFor(s.kind, s.b));
    keepXy(state);
  },
  extent(state) {
    const b = clampB(state?.b);
    const frame = frameFor(kindOf(state?.kind), b);
    return Math.max(Math.abs(frame.xMin), frame.xMax, Math.abs(frame.yMin), frame.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const kind = kindOf(state.kind);
    const b = clampB(state.b);
    state.kind = kind;
    state.b = b;
    Object.assign(state, frameFor(kind, b));
    const here = measure(kind, b);
    computed.kind = kind;
    computed.b = b;
    computed.length = here.length;
    computed.chord = here.chord;
    computed.simpson = here.simpson;
    computed.agree = here.agree;
    computed.shorter = here.chord < here.length - 1e-9;
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
    const b = computed.b;
    view.syncPath('curve', curvePoints(state.kind, b), show.curve !== false);
    view.syncPath(
      'poly',
      [
        { x: 0, y: 0 },
        { x: b, y: state.kind === 'line' ? b : b * b },
      ],
      show.chord !== false,
    );
    view.syncNodes(
      [
        { x: 0, y: 0 },
        { x: b, y: state.kind === 'line' ? b : b * b },
      ],
      true,
      0.04 * Math.max(1, b),
    );
    view.syncMark(0, 0, false);
    view.syncHatch(() => 0, 0, 1, false);
    view.syncBound(0, 0, false);
  },
  law(state) {
    if (state?.kind === 'line') return [String.raw`y=x`, String.raw`L=\int_0^b\sqrt{2}\,dx`];
    return [String.raw`y=x^2`, String.raw`L=\int_0^b\sqrt{1+4x^2}\,dx`];
  },
  liveRows(state, computed) {
    return (
      kv('length', `$${fmt(computed.length)}$`) +
      kv('chord', `$${fmt(computed.chord)}$`) +
      kv('longer', computed.shorter ? 'curve' : 'same')
    );
  },
  readout(state, computed) {
    return cells([
      ['length', `$${fmt(computed.length)}$`],
      ['chord', `$${fmt(computed.chord)}$`],
      ['b', `$${fmt(computed.b)}$`],
      ['match', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = ['Teal is the curve. Yellow is the straight chord between the same endpoints.'];
    if (state.kind === 'line') {
      body.push('A line is already straight, so the arc length equals the chord.');
    } else {
      body.push('The parabola bends, so the arc is longer than the chord.');
    }
    body.push(eq(String.raw`L=${fmt(computed.length)},\quad \text{chord}=${fmt(computed.chord)}`));
    if (computed.agree) body.push('A second calculation agrees.');
    return { title: 'Length against the chord', body };
  },
  plot() {
    return null;
  },
});
