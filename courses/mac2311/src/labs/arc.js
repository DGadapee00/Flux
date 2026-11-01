import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import {
  parabolaArc,
  parabolaArcSimpson,
  parabolaChord,
  segmentLength,
  segmentSimpson,
} from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';
import { fitPlaneCamera, plotWindow, projectArc } from './camera.js';

export { plotWindow, projectArc };

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

/**
 * Place the camera so the framed curve, including its endpoint marker, lands in `view`.
 * `state` coordinates are math units. `view.upm` is the scene scale.
 */
export function fitArcCamera(state, view) {
  return fitPlaneCamera(state, view, 0.04 * Math.max(1, clampB(state?.b)));
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
  orbit: false,
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
    Object.assign(state, frame);
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
