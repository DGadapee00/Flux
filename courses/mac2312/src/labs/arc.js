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

function arcCamera(state) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const xMin = Number.isFinite(state?.xMin) ? state.xMin : -0.2;
  const xMax = Number.isFinite(state?.xMax) ? state.xMax : 1.2;
  const yMin = Number.isFinite(state?.yMin) ? state.yMin : -0.2;
  const yMax = Number.isFinite(state?.yMax) ? state.yMax : 1.2;
  const cx = ((xMin + xMax) / 2) * u;
  const cy = ((yMin + yMax) / 2) * u;
  const halfW = ((xMax - xMin) / 2) * u;
  const z = (halfW * 1.25) / (Math.tan(Math.PI / 9) * (380 / 780));
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
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
      api.slice().b = Number(e.target.value);
      api.bump();
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
