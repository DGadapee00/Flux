import { sectionSketch } from './elements.js';
import {
  bandQ, iBands, iSection, rectBands, rectSection, shearBalance, shearShare, shearStress,
} from '@flux/subjects/mechanics/materials.js';
import { EYE_BF, EYE_HW, EYE_TF, EYE_TW, EYE_V, RECT_B, RECT_H, RECT_V } from '../data/shear.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { axes, begin, C, chartIn, dot, hidden, label, line, panes, plotIn, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that shear stress peaks at the neutral axis, and that an I beam's web
 * carries most of the shear.
 *
 * Second method: ∫ τ dA over the section returns V. On the rectangle, 3V/(2A)
 * matches VQ/(It) at the axis.
 */

const KN = 1000;
const MPA = 1e6;

const SCENARIOS = [
  { id: 'rect', name: '40 mm by 80 mm', V: RECT_V, b: RECT_B, h: RECT_H, y: 0 },
  { id: 'high', name: 'Cut partway up', V: RECT_V, b: RECT_B, h: RECT_H, y: RECT_H / 4 },
  { id: 'eye', name: 'I section', V: EYE_V, b: RECT_B, h: RECT_H, y: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V: sc.V, b: sc.b, h: sc.h, y: sc.y });
}

function sectionOf(state) {
  if (state.scenarioId === 'eye') {
    const sec = iSection(EYE_BF, EYE_TF, EYE_TW, EYE_HW);
    return {
      bands: iBands(sec),
      I: sec.I,
      half: sec.H / 2,
      web0: -sec.hw / 2,
      web1: sec.hw / 2,
      tAt(y) { return Math.abs(y) <= sec.hw / 2 ? sec.tw : sec.bf; },
    };
  }
  return {
    bands: rectBands(state.b, state.h),
    I: rectSection(state.b, state.h).I,
    half: state.h / 2,
    web0: -state.h / 2,
    web1: state.h / 2,
    tAt() { return state.b; },
  };
}

function clampY(y, half) {
  const limit = Math.max(half - 1e-6, 0);
  return Math.min(Math.max(y, -limit), limit);
}

/**
 * The section with its neutral axis, the cut at height y, and the area above the cut shaded: that
 * area's first moment about the axis is Q. The width t is the section's width along the cut.
 */
function member(B, rect, state, c, veiled) {
  const eye = state.scenarioId === 'eye';
  const half = eye ? (EYE_HW / 2 + EYE_TF) : state.h / 2;
  const rects = eye
    ? [[-EYE_BF / 2, EYE_BF / 2, EYE_HW / 2, EYE_HW / 2 + EYE_TF], [-EYE_TW / 2, EYE_TW / 2, -EYE_HW / 2, EYE_HW / 2], [-EYE_BF / 2, EYE_BF / 2, -EYE_HW / 2 - EYE_TF, -EYE_HW / 2]]
    : [[-state.b / 2, state.b / 2, -half, half]];
  const W = eye ? EYE_BF : state.b;
  const S = sceneIn(B, rect, { x0: -W * 1.6, x1: W * 1.6, y0: -half * 1.25, y1: half * 1.25 }, 8);
  sectionSketch(S, rects, { na: 0, above: c.y });
  const t = eye ? (Math.abs(c.y) <= EYE_HW / 2 ? EYE_TW : EYE_BF) : state.b;
  seg(S, [-t / 2 - W * 0.15, c.y], [t / 2 + W * 0.15, c.y], { color: C.teal, width: 2.5 });
  if (!veiled) {
    label(S, `τ ${fig(c.tau / MPA)} MPa`, [-W / 2, c.y], { color: C.teal, dx: -8, dy: -7, align: 'right' });
    label(S, `t = ${fig(t * 1e3)} mm`, [-W / 2, c.y], { color: C.teal, dx: -8, dy: 8, align: 'right' });
  }
}

export default defineLab({
  id: 'shear',
  exam: 'u7',
  title: 'Shear stress',
  hint: 'Shear stress peaks at the neutral axis, where bending stress is zero. On an I the web carries most of the shear.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rect', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V', lo: 2e3, hi: 40e3 }),
  controls() {
    return `
      ${slider('sh-v', 'shear (kN)', 10, 2, 40, 0.5)}
      ${slider('sh-b', 'width (mm)', 40, 20, 80, 1)}
      ${slider('sh-h', 'height (mm)', 80, 40, 200, 1)}
      ${slider('sh-y', 'station from the axis (mm)', 0, -90, 90, 1)}
      <p class="tiny">The I is assumed: a 6 mm by 160 mm web and two 120 mm by 10 mm flanges. y is positive upward from the neutral axis.</p>`;
  },
  bind(api) {
    bindSlider('sh-v', (s, v) => { s.V = v * KN; }, api);
    bindSlider('sh-b', (s, v) => { s.b = v * 1e-3; }, api);
    bindSlider('sh-h', (s, v) => { s.h = v * 1e-3; }, api);
    bindSlider('sh-y', (s, v) => { s.y = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('sh-v', state.V / KN);
    set('sh-b', state.b * 1e3);
    set('sh-h', state.h * 1e3);
    set('sh-y', state.y * 1e3);
    const rect = state.scenarioId !== 'eye';
    showField('sh-b', rect);
    showField('sh-h', rect);
  },
  compute(state) {
    const sec = sectionOf(state);
    const y = clampY(state.y, sec.half);
    const Q = bandQ(sec.bands, y);
    const t = sec.tAt(y);
    const tau = shearStress(state.V, Q, sec.I, t);
    const Q0 = bandQ(sec.bands, 0);
    const tmax = shearStress(state.V, Q0, sec.I, sec.tAt(0));
    const carried = shearBalance(state.V, sec.I, sec.bands);
    const share = shearShare(state.V, sec.I, sec.bands, sec.web0, sec.web1);
    const rect = state.scenarioId === 'eye' ? null : (3 * state.V) / (2 * state.b * state.h);
    const gapR = rect == null ? 0 : Math.abs(tmax - rect) / Math.max(Math.abs(rect), 1);
    const gapB = Math.abs(carried - state.V) / Math.max(Math.abs(state.V), 1);
    return {
      tau, tmax, Q, I: sec.I, y, webShare: share, V: state.V, gap: Math.max(gapB, gapR),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const sec = sectionOf(state);
    const pts = [];
    let xHi = 1;
    for (let i = 0; i <= 40; i++) {
      const y = -sec.half + (2 * sec.half * i) / 40;
      const yc = clampY(y, sec.half);
      const tau = shearStress(state.V, bandQ(sec.bands, yc), sec.I, sec.tAt(yc)) / MPA;
      pts.push([tau, yc * 1e3]);
      xHi = Math.max(xHi, tau);
    }
    const P = chartIn(B, R, { lo: 0, hi: xHi * 1.08 }, { lo: -sec.half * 1e3, hi: sec.half * 1e3 });
    axes(P, { xLabel: 'shear stress (MPa)', yLabel: 'y from the axis (mm)' });
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[0, 0], [xHi * 1.08, 0]], { color: C.teal, width: 2, dash: [5, 4] });
    dot(P, c.tau / MPA, c.y * 1e3, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\tau=\frac{VQ}{It}`],
  liveRows(state, c) {
    const eye = state.scenarioId === 'eye';
    return [
      kv('shear at the cut', `${fig(c.tau / MPA)} MPa`),
      kv('peak shear', `${fig(c.tmax / MPA)} MPa`),
      kv(eye ? 'web share of V' : 'height', eye ? `${fig(c.webShare * 100)}%` : `${fig(state.h * 1e3)} mm`),
      kv('station', `${fig(c.y * 1e3)} mm`),
    ].join('');
  },
  readout(state, c) {
    const eye = state.scenarioId === 'eye';
    return cells([
      ['at cut', `${fig(c.tau / MPA)} MPa`],
      ['peak', `${fig(c.tmax / MPA)} MPa`],
      [eye ? 'web' : 'height', eye ? `${fig(c.webShare * 100)}%` : `${fig(state.h * 1e3)} mm`],
      ['y', `${fig(c.y * 1e3)} mm`],
    ]);
  },
  coach(state, c) {
    const eye = state.scenarioId === 'eye';
    return {
      title: eye ? 'The web carries the shear' : 'The peak is at the axis',
      body: eye
        ? `At the axis the web stress is ${fig(c.tau / MPA)} MPa. The web carries ${fig(c.webShare * 100)}% of the shear. The teal line is the neutral axis.`
        : `The peak is ${fig(c.tmax / MPA)} MPa at the axis. At ${fig(c.y * 1e3)} mm the stress is ${fig(c.tau / MPA)} MPa. Bending stress is zero on that same axis.`,
    };
  },
});
