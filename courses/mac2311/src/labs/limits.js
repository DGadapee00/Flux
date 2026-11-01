import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { limitPicture } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab, planeCamera } from './define.js';

const SCENARIOS = [
  { id: 'hole', name: 'Hole', kind: 'hole' },
  { id: 'jump', name: 'Jump', kind: 'jump' },
  { id: 'sign', name: 'One-sided', kind: 'sign' },
  { id: 'line', name: 'ε–δ line', kind: 'line' },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function picture(state) {
  return limitPicture(state.kind, {
    a: state.a,
    h: state.h,
    eps: state.eps,
    m: state.m,
    leftValue: state.leftValue,
    rightValue: state.rightValue,
  });
}

export default defineLab({
  id: 'limits',
  exam: 'u1',
  title: 'Limits',
  hint: 'Slide $a$ and $h$. Watch the two sides.',
  orbit: false,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'samples', label: 'Samples' },
    { key: 'band', label: 'ε band' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'hole',
      kind: 'hole',
      a: 1,
      h: 0.4,
      eps: 0.5,
      m: 2,
      leftValue: 0,
      rightValue: 1,
      xMin: -2,
      xMax: 4,
      yMin: -1,
      yMax: 4,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, samples: true, band: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>a</span>
          <div class="slider-row">
            <input type="range" id="lim-a" min="-2" max="4" step="0.1" value="1" />
          </div>
        </label>
        <label class="field">
          <span>h</span>
          <div class="slider-row">
            <input type="range" id="lim-h" min="0.05" max="1.5" step="0.01" value="0.4" />
          </div>
        </label>
        <label class="field" id="lim-eps-field">
          <span>ε</span>
          <div class="slider-row">
            <input type="range" id="lim-eps" min="0.05" max="2" step="0.05" value="0.5" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('lim-a').addEventListener('input', (e) => {
      api.slice().a = Number(e.target.value);
      api.bump();
    });
    document.getElementById('lim-h').addEventListener('input', (e) => {
      api.slice().h = Number(e.target.value);
      api.bump();
    });
    document.getElementById('lim-eps').addEventListener('input', (e) => {
      api.slice().eps = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const a = document.getElementById('lim-a');
    if (!a) return;
    a.value = state.a;
    document.getElementById('lim-h').value = state.h;
    document.getElementById('lim-eps').value = state.eps;
    document.getElementById('lim-eps-field').hidden = state.kind !== 'line';
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = s.kind;
    if (s.kind === 'hole') state.a = 1;
    if (s.kind === 'jump') {
      state.a = 0;
      state.leftValue = 0;
      state.rightValue = 1;
    }
    if (s.kind === 'sign') state.a = 0;
    if (s.kind === 'line') {
      state.a = 1;
      state.m = 2;
      state.eps = 0.5;
    }
    state.h = 0.4;
    keepXy(state);
  },
  extent(state) {
    const pic = picture(state);
    let m = Math.max(Math.abs(state.a) + state.h, 1);
    for (const y of [pic.left, pic.right, pic.sampleLeft, pic.sampleRight, pic.value, pic.limit]) {
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  recompute(state, computed) {
    keepXy(state);
    const h = Math.min(1.5, Math.max(0.05, Number.isFinite(state.h) ? state.h : 0.4));
    const eps = Math.min(2, Math.max(0.05, Number.isFinite(state.eps) ? state.eps : 0.5));
    const a = Number.isFinite(state.a) ? state.a : 0;
    state.h = h;
    state.eps = eps;
    state.a = a;
    const pic = picture(state);
    const ys = [pic.left, pic.right, pic.sampleLeft, pic.sampleRight, pic.value].filter(Number.isFinite);
    if (pic.kind === 'line') ys.push(pic.limit + eps, pic.limit - eps);
    const lo = Math.min(-0.5, ...ys);
    const hi = Math.max(0.5, ...ys);
    state.xMin = a - 2.4;
    state.xMax = a + 2.4;
    state.yMin = lo - 0.8;
    state.yMax = hi + 0.8;
    const agree =
      Number.isFinite(pic.probeLeft) &&
      Number.isFinite(pic.probeRight) &&
      Math.abs(pic.probeLeft - pic.left) <= 1e-3 &&
      Math.abs(pic.probeRight - pic.right) <= 1e-3 &&
      (!Number.isFinite(pic.delta) || Math.abs(pic.delta - pic.deltaAlt) <= 1e-3);
    computed.pic = pic;
    computed.left = pic.left;
    computed.right = pic.right;
    computed.limit = pic.limit;
    computed.value = pic.value;
    computed.exists = pic.exists;
    computed.delta = pic.delta;
    computed.inside = pic.inside;
    computed.agree = agree;
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
    const pic = computed.pic || picture(state);
    const view = ctx.handle.view;
    const span = 2.2;
    const gap = pic.kind === 'line' ? null : 0.12;
    view.syncCurve(
      pic.f,
      state.a - span,
      state.a + span,
      show.curve !== false,
      gap == null
        ? null
        : (x0, x1) => (x0 < state.a && x1 >= state.a) || Math.abs(x0 - state.a) < gap || Math.abs(x1 - state.a) < gap,
    );
    view.syncLine('secant', 0, 0, 0, 0, false);
    view.syncLine('tangent', 0, 0, 0, 0, false);
    view.syncBars([], false);
    const guides = [];
    if (show.band !== false && pic.kind === 'line' && Number.isFinite(pic.delta)) {
      const x0 = state.a - pic.delta;
      const x1 = state.a + pic.delta;
      guides.push({ x0, y0: pic.limit + state.eps, x1, y1: pic.limit + state.eps });
      guides.push({ x0, y0: pic.limit - state.eps, x1, y1: pic.limit - state.eps });
    }
    view.syncGuides(guides, show.band !== false);
    const marks = [];
    if (show.samples !== false) {
      if (Number.isFinite(pic.sampleLeft)) marks.push({ x: state.a - state.h, y: pic.sampleLeft, open: false });
      if (Number.isFinite(pic.sampleRight)) marks.push({ x: state.a + state.h, y: pic.sampleRight, open: false });
    }
    if (Number.isFinite(pic.value)) marks.push({ x: state.a, y: pic.value, open: false });
    if (!Number.isFinite(pic.value) && Number.isFinite(pic.limit)) marks.push({ x: state.a, y: pic.limit, open: true });
    if (pic.kind === 'jump' && pic.left !== pic.right) marks.push({ x: state.a, y: pic.left, open: true });
    if (pic.kind === 'sign') {
      marks.push({ x: state.a, y: pic.left, open: true });
      marks.push({ x: state.a, y: pic.right, open: true });
    }
    view.syncMarks(marks, true);
  },
  law() {
    return [String.raw`\lim_{x\to a} f(x)=L`];
  },
  liveRows(state, computed) {
    const pic = computed.pic || picture(state);
    const limit = pic.exists ? `$${fmt(pic.limit)}$` : 'does not exist';
    const rows =
      kv('$f$', pic.kind === 'jump' ? 'step' : `$${pic.tex}$`) +
      kv('$a$', `$${fmt(state.a)}$`) +
      kv('$h$', `$${fmt(state.h)}$`) +
      kv('left sample', Number.isFinite(pic.sampleLeft) ? `$${fmt(pic.sampleLeft)}$` : '—') +
      kv('right sample', Number.isFinite(pic.sampleRight) ? `$${fmt(pic.sampleRight)}$` : '—') +
      kv('left limit', `$${fmt(pic.left)}$`) +
      kv('right limit', `$${fmt(pic.right)}$`) +
      kv('two-sided', limit);
    if (pic.kind !== 'line') return rows;
    return (
      rows +
      kv('$\\varepsilon$', `$${fmt(state.eps)}$`) +
      kv('$\\delta$', `$${fmt(pic.delta)}$`) +
      kv('sample inside', pic.inside ? 'yes' : 'no')
    );
  },
  readout(state, computed) {
    const pic = computed.pic || picture(state);
    return cells([
      ['left', `$${fmt(pic.left)}$`],
      ['right', `$${fmt(pic.right)}$`],
      ['limit', pic.exists ? `$${fmt(pic.limit)}$` : '—'],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const pic = computed.pic || picture(state);
    const body = [
      'Each sample is the function a step $h$ away from $a$.',
      'Shrink $h$. The samples move onto the one-sided limits.',
    ];
    if (pic.kind === 'hole') {
      body.push('The two sides agree. The missing point is not part of the limit.');
      body.push(eq(`L=${fmt(pic.limit)}`));
    } else if (pic.kind === 'jump' || pic.kind === 'sign') {
      body.push(`Left limit $${fmt(pic.left)}$, right limit $${fmt(pic.right)}$.`);
      body.push('The sides disagree, so the two-sided limit does not exist.');
    } else {
      body.push(eq(`\\delta=\\varepsilon/|m|=${fmt(pic.delta)}`));
      body.push(
        pic.inside
          ? 'This $h$ is inside $\\delta$. Both samples stay in the $\\varepsilon$ band.'
          : 'This $h$ is past $\\delta$. A sample can leave the $\\varepsilon$ band.',
      );
    }
    return { title: 'What a limit uses', body };
  },
  plot() {
    return null;
  },
});
