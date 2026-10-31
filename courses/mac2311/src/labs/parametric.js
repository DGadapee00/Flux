import { fitArcCamera, plotWindow } from './arc.js';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import {
  circleAt,
  circleLength,
  circleLengthSimpson,
  circleSlopeImplicit,
  lineAt,
  lineDistance,
  lineLength,
  paraAt,
  paraLength,
  paraLengthSimpson,
  paraSlopeCart,
  paraSpeedDiff,
} from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'circle', name: 'Unit circle', kind: 'circle', k: 2 },
  { id: 'para', name: 'Parabola', kind: 'para', k: 4 },
  { id: 'line', name: 'Line', kind: 'line', k: 4 },
];

const FRAME = { xMin: -1.5, xMax: 1.7, yMin: -1.6, yMax: 2.7 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function paramCamera(state) {
  const c = fitArcCamera(state, plotWindow());
  return { pos: c.pos, target: c.target };
}

function kindOf(kind) {
  if (kind === 'para' || kind === 'line') return kind;
  return 'circle';
}

function clampK(kind, k) {
  const n = Number.isFinite(k) ? k : 0;
  if (kind === 'circle') return Math.min(72, Math.max(0, Math.round(n)));
  return Math.min(4, Math.max(0, n));
}

function paramT(kind, k) {
  if (kind === 'circle') return (k * Math.PI) / 4;
  return k / 4;
}

function slopesAgree(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= 1e-9;
}

function sample(kind) {
  const n = 120;
  const pts = [];
  if (kind === 'para') {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: t, y: t * t });
    }
    return pts;
  }
  if (kind === 'line') {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
    ];
  }
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n;
    pts.push({ x: Math.cos(t), y: Math.sin(t) });
  }
  return pts;
}

function tangentSegment(x, y, dx, dy) {
  const speed = Math.hypot(dx, dy);
  if (speed < 1e-12)
    return [
      { x, y },
      { x, y },
    ];
  const h = 0.4;
  const ux = (h * dx) / speed;
  const uy = (h * dy) / speed;
  return [
    { x: x - ux, y: y - uy },
    { x: x + ux, y: y + uy },
  ];
}

function picture(kind, t) {
  if (kind === 'para') {
    const here = paraAt(t);
    const length = paraLength(t);
    return {
      ...here,
      length,
      agree:
        Math.abs(here.slope - paraSlopeCart(t)) <= 1e-12 &&
        Math.abs(length - paraLengthSimpson(t)) <= 1e-6 &&
        Math.abs(here.speed - paraSpeedDiff(t)) <= 1e-6,
    };
  }
  if (kind === 'line') {
    const here = lineAt(t);
    const length = lineLength(t);
    return {
      ...here,
      length,
      agree: Math.abs(here.slope - 2) <= 1e-12 && Math.abs(length - lineDistance(t)) <= 1e-12,
    };
  }
  const here = circleAt(t);
  const length = circleLength(t);
  return {
    ...here,
    length,
    agree:
      slopesAgree(here.slope, circleSlopeImplicit(t)) &&
      Math.abs(length - circleLengthSimpson(t)) <= 1e-6 &&
      Math.abs(here.speed - 1) <= 1e-9,
  };
}

export default defineLab({
  id: 'parametric',
  exam: 'u4',
  title: 'Parametric',
  hint: 'Move the point. The slope changes. The speed is a different number.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: paramCamera,
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'tangent', label: 'Tangent' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'circle',
      kind: 'circle',
      k: 2,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, tangent: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span id="par-name">Angle in steps of π/4</span>
          <div class="slider-row">
            <input type="range" id="par-k" min="0" max="72" step="1" value="2" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('par-k').addEventListener('input', (e) => {
      api.slice().k = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const slider = document.getElementById('par-k');
    const name = document.getElementById('par-name');
    if (!slider) return;
    const circle = state.kind === 'circle';
    slider.min = '0';
    slider.max = circle ? '72' : '4';
    slider.step = circle ? '1' : '0.08';
    slider.value = state.k;
    if (name) name.textContent = circle ? 'Angle in steps of π/4' : 'fourths of the segment';
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = s.kind;
    state.k = s.k;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const kind = kindOf(state.kind);
    const k = clampK(kind, state.k);
    state.kind = kind;
    state.k = k;
    Object.assign(state, FRAME);
    const t = paramT(kind, k);
    const here = picture(kind, t);
    computed.t = t;
    computed.k = k;
    computed.kind = kind;
    computed.x = here.x;
    computed.y = here.y;
    computed.dx = here.dx;
    computed.dy = here.dy;
    computed.slope = here.slope;
    computed.speed = here.speed;
    computed.length = here.length;
    computed.vertical = here.slope == null;
    computed.agree = here.agree;
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
    view.syncPath('curve', sample(state.kind), show.curve !== false);
    view.syncPath(
      'poly',
      tangentSegment(computed.x, computed.y, computed.dx, computed.dy),
      show.tangent !== false,
    );
    view.syncNodes([{ x: computed.x, y: computed.y }], true, 0.07);
    view.syncMark(0, 0, false);
    view.syncHatch(() => 0, 0, 1, false);
    view.syncBound(0, 0, false);
  },
  law(state) {
    const kind = state?.kind || 'circle';
    if (kind === 'para')
      return [String.raw`x=t,\ y=t^2`, String.raw`\frac{dy}{dx}=2t`, String.raw`L=\int_0^t\sqrt{1+4u^2}\,du`];
    if (kind === 'line')
      return [String.raw`x=t,\ y=2t`, String.raw`\frac{dy}{dx}=2`, String.raw`L=\sqrt{5}\,t`];
    return [
      String.raw`x=\cos t,\ y=\sin t`,
      String.raw`\frac{dy}{dx}=\frac{\cos t}{-\sin t}`,
      String.raw`L=t`,
    ];
  },
  liveRows(state, computed) {
    const slope = computed.vertical ? 'vertical' : `$${fmt(computed.slope)}$`;
    return (
      kv('t', `$${fmt(computed.t)}$`) +
      kv('point', `$(${fmt(computed.x)}, ${fmt(computed.y)})$`) +
      kv('slope', slope) +
      kv('speed', `$${fmt(computed.speed)}$`) +
      kv('length', `$${fmt(computed.length)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['x', `$${fmt(computed.x)}$`],
      ['y', `$${fmt(computed.y)}$`],
      ['slope', computed.vertical ? 'vertical' : `$${fmt(computed.slope)}$`],
      ['speed', `$${fmt(computed.speed)}$`],
    ]);
  },
  coach(state, computed) {
    const body = ['Teal is the curve. Yellow is the tangent. The white mark is the point at t.'];
    if (state.kind === 'para') {
      body.push('The slope is 2t. The speed is √(1+4t²). Eliminating t gives the same slope.');
    } else if (state.kind === 'line') {
      body.push('Rise over run is 2. The length is the distance from the origin to the point.');
    } else if (computed.vertical) {
      body.push('The tangent is vertical, so dy/dx is not a number. The speed is still 1.');
    } else {
      body.push('The speed stays at 1. The slope changes as the point moves around the circle.');
    }
    body.push(
      eq(
        computed.vertical
          ? String.raw`\text{vertical tangent},\quad \text{speed}=${fmt(computed.speed)}`
          : String.raw`\frac{dy}{dx}=${fmt(computed.slope)},\quad \text{speed}=${fmt(computed.speed)}`,
      ),
    );
    if (computed.agree) body.push('A second calculation agrees.');
    return { title: 'Slope is not speed', body };
  },
  plot() {
    return null;
  },
});
