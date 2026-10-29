import { sectionSketch } from './elements.js';
import {
  flexureBalance, flexureFibers, rectBands, rectFibersReduced, rectSection, teeBands, teeSection,
} from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { axes, begin, C, chartIn, couple, dot, hidden, label, line, panes, plotIn, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the neutral axis is the centroid, so a T section's top and bottom
 * stresses differ, and that bending stress on a rectangle goes with 1/h².
 *
 * Second method: ∫σ dA = 0 and −∫y σ dA = M over the section.
 */

const MPA = 1e6;
export const TEE_BF = 0.12;
export const TEE_TF = 0.012;
export const TEE_TW = 0.012;
export const TEE_HW = 0.1;

const SCENARIOS = [
  { id: 'rect', name: '40 mm by 80 mm', M: 2000, b: 0.04, h: 0.08 },
  { id: 'deep', name: 'Twice the depth', M: 2000, b: 0.04, h: 0.16 },
  { id: 'tee', name: 'T, flange on top', M: 2000, b: 0.04, h: 0.08 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, M: sc.M, b: sc.b, h: sc.h });
}

function sectionOf(state) {
  if (state.scenarioId === 'tee') {
    const sec = teeSection(TEE_BF, TEE_TF, TEE_TW, TEE_HW);
    return { sec, bands: teeBands(sec, TEE_BF, TEE_TF, TEE_TW, TEE_HW), yBar: sec.ybar, height: sec.height };
  }
  const sec = rectSection(state.b, state.h);
  return { sec, bands: rectBands(state.b, state.h), yBar: state.h / 2, height: state.h };
}

/**
 * The section, drawn to scale with its neutral axis through the centroid, and a short side view of
 * the beam bending under M: the top fiber shortens (blue) and the bottom stretches (red) when it sags.
 */
function member(B, rect, state, c, veiled) {
  const tee = state.scenarioId === 'tee';
  const rects = tee
    ? [[-TEE_TW / 2, TEE_TW / 2, 0, TEE_HW], [-TEE_BF / 2, TEE_BF / 2, TEE_HW, TEE_HW + TEE_TF]]
    : [[-state.b / 2, state.b / 2, 0, state.h]];
  const H = c.height;
  const W = tee ? TEE_BF : state.b;
  const span = Math.max(H, W) * 1.5;
  const S = sceneIn(B, rect, { x0: -span * 1.25, x1: span * 1.1, y0: -0.2 * H, y1: 1.25 * H }, 8);
  sectionSketch(S, rects.map(([x0, x1, y0, y1]) => [x0 + 0.55 * span, x1 + 0.55 * span, y0, y1]), { na: c.yBar });
  // The side view: a beam segment curved by the moment, sagging when M > 0.
  const sag = state.M >= 0 ? 1 : -1;
  const x0 = -1.15 * span;
  const x1 = -0.05 * span;
  // Sagging bends the segment concave up: its middle sits lowest.
  const bow = (x) => -sag * 0.12 * H * (1 - ((2 * (x - (x0 + x1) / 2)) / (x1 - x0)) ** 2);
  for (let i = 1; i <= 24; i++) {
    const xa = x0 + ((x1 - x0) * (i - 1)) / 24;
    const xb = x0 + ((x1 - x0) * i) / 24;
    seg(S, [xa, H + bow(xa) - 0.12 * H], [xb, H + bow(xb) - 0.12 * H], { color: c.top < 0 ? C.blue : C.red, width: 2.5 });
    seg(S, [xa, bow(xa) + 0.12 * H], [xb, bow(xb) + 0.12 * H], { color: c.bot < 0 ? C.blue : C.red, width: 2.5 });
  }
  // A sagging moment turns the left end clockwise and the right end counterclockwise.
  couple(S, [x0, 0.55 * H], { ccw: state.M < 0, r: 13, color: C.pink });
  couple(S, [x1, 0.55 * H], { ccw: state.M >= 0, r: 13, color: C.pink });
  if (!veiled) {
    label(S, `${fig(c.top / MPA)} MPa`, [0.55 * span + W / 2, H], { color: c.top < 0 ? C.blue : C.red, dx: 8, align: 'left' });
    label(S, `${fig(c.bot / MPA)} MPa`, [0.55 * span + W / 2, 0], { color: c.bot < 0 ? C.blue : C.red, dx: 8, align: 'left' });
    label(S, `M ${fig(state.M / 1e3)} kN·m`, [(x0 + x1) / 2, 0.55 * H], { color: C.pink });
  }
}

export default defineLab({
  id: 'flexure',
  exam: 'u6',
  title: 'Bending stress',
  hint: 'The neutral axis passes through the centroid. On a T the top and bottom fibers are not the same distance from it.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rect', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'M', lo: -8e3, hi: 8e3 }),
  controls() {
    return `
      ${slider('fx-m', 'moment (kN·m)', 2, -8, 8, 0.1)}
      ${slider('fx-b', 'width (mm)', 40, 20, 80, 1)}
      ${slider('fx-h', 'height (mm)', 80, 40, 200, 1)}
      <p class="tiny">Sagging moment is positive, so the top fiber is in compression. y is positive upward from the neutral axis. The T is a 120 mm by 12 mm flange on a 12 mm by 100 mm web.</p>`;
  },
  bind(api) {
    bindSlider('fx-m', (s, v) => { s.M = v * 1e3; }, api);
    bindSlider('fx-b', (s, v) => { s.b = v * 1e-3; }, api);
    bindSlider('fx-h', (s, v) => { s.h = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('fx-m', state.M / 1e3);
    set('fx-b', state.b * 1e3);
    set('fx-h', state.h * 1e3);
    const rect = state.scenarioId !== 'tee';
    showField('fx-b', rect);
    showField('fx-h', rect);
  },
  compute(state) {
    const { sec, bands, yBar, height } = sectionOf(state);
    const fibers = flexureFibers(state.M, sec);
    const bal = flexureBalance(state.M, sec.I, bands);
    const scale = Math.max(Math.abs(state.M), 1);
    const axialScale = Math.max(Math.abs(fibers.top) * sec.A, 1);
    const gap = Math.max(Math.abs(bal.moment - state.M) / scale, Math.abs(bal.axial) / axialScale);
    const reduced = state.scenarioId === 'tee' ? null : rectFibersReduced(state.M, state.b, state.h);
    const gapR = reduced ? Math.abs(fibers.top - reduced.top) / Math.max(Math.abs(fibers.top), 1) : 0;
    return {
      top: fibers.top,
      bot: fibers.bot,
      yBar,
      height,
      I: sec.I,
      M: state.M,
      gap: Math.max(gap, gapR),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const { sec } = sectionOf(state);
    const y0 = sec.botY * 1e3;
    const y1 = sec.topY * 1e3;
    const s0 = c.bot / MPA;
    const s1 = c.top / MPA;
    const yLo = Math.min(y0, y1);
    const yHi = Math.max(y0, y1);
    const sLo = Math.min(s0, s1, 0);
    const sHi = Math.max(s0, s1, 0);
    const P = chartIn(B, R, { lo: sLo - Math.abs(sHi - sLo) * 0.08 - 1, hi: sHi + Math.abs(sHi - sLo) * 0.08 + 1 }, { lo: yLo, hi: yHi });
    axes(P, { xLabel: 'stress (MPa)', yLabel: 'y from the neutral axis (mm)' });
    line(P, [[s0, y0], [0, 0], [s1, y1]], { color: C.gold, width: 3 });
    dot(P, s1, y1, { color: s1 <= 0 ? C.blue : C.red, r: 5 });
    dot(P, s0, y0, { color: s0 <= 0 ? C.blue : C.red, r: 5 });
  },
  law: () => [String.raw`\sigma=-\frac{My}{I}`],
  liveRows(state, c) {
    return [
      kv('top fiber', `${fig(c.top / MPA)} MPa`),
      kv('bottom fiber', `${fig(c.bot / MPA)} MPa`),
      kv('axis from the bottom', `${fig(c.yBar * 1e3)} mm`),
      kv('section height', `${fig(c.height * 1e3)} mm`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['top', `${fig(c.top / MPA)} MPa`],
      ['bottom', `${fig(c.bot / MPA)} MPa`],
      ['axis', `${fig(c.yBar * 1e3)} mm`],
      ['height', `${fig(c.height * 1e3)} mm`],
    ]);
  },
  coach(state, c) {
    const tee = state.scenarioId === 'tee';
    return {
      title: tee ? 'The two fibers are not a matched pair' : 'The rectangle is symmetric',
      body: tee
        ? `The axis is ${fig(c.yBar * 1e3)} mm up from the bottom of a ${fig(c.height * 1e3)} mm section. The top stress is ${fig(c.top / MPA)} MPa and the bottom is ${fig(c.bot / MPA)} MPa.`
        : `Top ${fig(c.top / MPA)} MPa, bottom ${fig(c.bot / MPA)} MPa. The axis is at mid-height, ${fig(c.yBar * 1e3)} mm up a ${fig(c.height * 1e3)} mm section.`,
    };
  },
});
