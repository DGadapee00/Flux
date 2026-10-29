import { PA_PER_PSI } from '@flux/subjects/convert.js';
import { axialStiffness, constrainedThermal } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, poly, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a rail held by its anchors stresses at EαΔT, with no dependence on length,
 * and that a joint gap must close before any of that stress appears.
 *
 * Cited: the AISC specification takes E = 29,000 ksi and a coefficient of thermal
 * expansion of 6.5×10⁻⁶ per °F (11.7×10⁻⁶ per °C) for structural steel. The 20 m
 * length and the 6 mm gap are assumed. Second method: the bar as a spring, F = k · δ,
 * against σ = E times the mechanical strain.
 */

const E = 29000 * 1000 * PA_PER_PSI;
const ALPHA = 6.5e-6 * 1.8;
const A = 0.007;
const OUT = 'The rail is a uniform bar with no buckling and no fastener flexibility. A real continuously welded rail is laid at a neutral temperature, can lift off the ties if the compression is high, and loses some force into the ballast. The cross-section and the gap, where there is one, are assumed.';

const SCENARIOS = [
  { id: 'summer', name: 'Held rail, +30 °C', dT: 30, L: 20, gap: 0 },
  { id: 'winter', name: 'Held rail, −30 °C', dT: -30, L: 20, gap: 0 },
  { id: 'joint', name: '6 mm joint gap', dT: 20, L: 20, gap: 0.006 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, dT: sc.dT, L: sc.L, gap: sc.gap });
}

export { E as railE, ALPHA as railAlpha, A as railArea };

export default defineLab({
  id: 'rail',
  exam: 'u3',
  title: 'Welded rail',
  app: true,
  hint: 'Heat a held rail. The stress does not care how long the rail is. A gap must close first.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('summer', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'dT', lo: -40, hi: 60 }),
  controls() {
    return `
      ${slider('rl-T', 'temperature change (°C)', 30, -40, 60, 1)}
      ${slider('rl-L', 'length (m)', 20, 5, 40, 1)}
      ${slider('rl-g', 'joint gap (mm)', 0, 0, 12, 0.5)}
      <p class="tiny">Cited: AISC takes E = 29,000 ksi and 6.5×10⁻⁶ per °F (11.7×10⁻⁶ per °C) for structural steel. The 20 m length and any joint gap are assumed.</p>`;
  },
  bind(api) {
    bindSlider('rl-T', (s, v) => { s.dT = v; }, api);
    bindSlider('rl-L', (s, v) => { s.L = v; }, api);
    bindSlider('rl-g', (s, v) => { s.gap = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('rl-T', state.dT);
    set('rl-L', state.L);
    set('rl-g', state.gap * 1e3);
  },
  compute(state) {
    const model = constrainedThermal(E, ALPHA, state.dT, { L: state.L, gap: state.gap });
    const fastened = state.gap <= 0;
    const extra = fastened ? model.free : Math.max(0, model.free - state.gap);
    const spring = fastened || model.free > state.gap
      ? (axialStiffness(A, E, state.L) * -(fastened ? model.free : extra)) / A
      : 0;
    const gap = Math.abs(model.stress - spring) / Math.max(Math.abs(model.stress), E * ALPHA);
    return {
      stress: model.stress,
      free: model.free,
      closed: model.closed,
      spring,
      dT: state.dT,
      L: state.L,
      gapMm: state.gap * 1e3,
      closeAt: state.gap > 0 ? state.gap / (ALPHA * state.L) : 0,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [top, rest] = panes(B, 0.38, { long: true });
    // A length of rail between two anchors. The dashed rail is where it would sit if nothing held
    // it; the joint gap, drawn to the same exaggeration, is what it may grow into for free.
    const S = sceneIn(B, top, { x0: -1.2, x1: 12.4, y0: -1.3, y1: 1.3 }, 8);
    // Drawn so the chart's hottest rail, +60 °C, would grow 1.5 units on its 10.
    const k = 1.5 / (10 * ALPHA * 60);
    const gapD = (c.gapMm / 1e3 / c.L) * 10 * k;
    const freeD = (c.free / c.L) * 10 * k;
    const xr = 10 + gapD;
    poly(S, [[-0.7, -0.9], [0, -0.9], [0, 0.9], [-0.7, 0.9]], { fill: alpha(C.muted, 0.35), stroke: C.muted });
    poly(S, [[xr, -0.9], [xr + 0.7, -0.9], [xr + 0.7, 0.9], [xr, 0.9]], { fill: alpha(C.muted, 0.35), stroke: C.muted });
    const lenNow = c.gapMm > 0 ? 10 + Math.max(-10, Math.min(freeD, gapD)) : 10;
    if (Math.abs(freeD) > 0.02) poly(S, [[0, -0.22], [10 + freeD, -0.22], [10 + freeD, 0.22], [0, 0.22]], { fill: null, stroke: alpha(C.text, 0.4), dash: [4, 4] });
    const tone = c.stress < -1 ? C.blue : c.stress > 1 ? C.red : C.text;
    poly(S, [[0, -0.22], [lenNow, -0.22], [lenNow, 0.22], [0, 0.22]], { fill: alpha(tone, 0.3), stroke: tone, width: 1.5 });
    if (Math.abs(c.stress) > 1e5) {
      const comp = c.stress < 0;
      const len = 14 + 26 * Math.min(1, Math.abs(c.stress) / 150e6);
      arrow(S, [0, 0.55], comp ? 0 : Math.PI, len, { color: tone, tail: comp });
      arrow(S, [lenNow, 0.55], comp ? Math.PI : 0, len, { color: tone, tail: comp });
    }
    if (!veiled) {
      label(S, `ΔT = ${fig(c.dT)} °C`, [5, 0.22], { color: C.yellow, dy: -26 });
      label(S, c.gapMm > 0 ? `gap ${fig(c.gapMm)} mm` : 'held at both ends', [10, -0.9], { color: C.dim, dy: 12, align: 'right' });
      label(S, `free growth ${fig(c.free * 1e3)} mm, dashed`, [0, -0.9], { color: C.dim, dy: 12, align: 'left' });
    }
    if (veiled) return;
    const hi = E * ALPHA * 60 / 1e6;
    const P = chartIn(B, rest, { lo: -40, hi: 60 }, { lo: -hi, hi });
    axes(P, { xLabel: 'ΔT (°C)', yLabel: 'stress (MPa)' });
    const pts = [];
    for (let i = 0; i <= 50; i++) {
      const t = -40 + (100 * i) / 50;
      const s = constrainedThermal(E, ALPHA, t, { L: c.L, gap: c.gapMm / 1e3 }).stress / 1e6;
      pts.push([t, s]);
    }
    line(P, pts, { color: C.teal, width: 3 });
    if (c.closeAt > 0) line(P, [[c.closeAt, -hi], [c.closeAt, hi]], { color: alpha(C.gold, 0.85), width: 2, dash: [5, 4] });
    dot(P, c.dT, c.stress / 1e6, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\sigma=-E\alpha\Delta T`],
  liveRows(state, c) {
    return [
      kv('free expansion', `${fig(c.free * 1e3)} mm`),
      kv('gap closes at', c.closeAt ? `${fig(c.closeAt)} °C` : 'no gap'),
      kv('Eα', `${fig(E * ALPHA / 1e6)} MPa/°C`),
      kv('length used', `${fig(c.L)} m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['stress', `${fig(c.stress / 1e6)} MPa`],
      ['free δ', `${fig(c.free * 1e3)} mm`],
      ['gap', `${fig(c.gapMm)} mm`],
      ['closes at', c.closeAt ? `${fig(c.closeAt)} °C` : 'held'],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (!c.closed && c.dT > 0) {
      return {
        title: 'The gap is still open',
        body: String.raw`The rail wants to grow ${fig(c.free * 1e3)} mm and the gap is ${fig(c.gapMm)} mm, so nothing is pressed yet. Stress starts at ${fig(c.closeAt)} °C.`,
      };
    }
    if (Math.abs(c.L - 20) > 0.1 && c.gapMm === 0) {
      return {
        title: 'Length cancelled',
        body: String.raw`The stress is ${fig(c.stress / 1e6)} MPa. Free expansion grows with length, and so does the stretch the anchors have to cancel. The two cancel, and $\sigma = -E\alpha\Delta T$.`,
      };
    }
    return {
      title: 'Held, so it cannot grow',
      body: String.raw`At ${fig(c.dT)} °C the stress is ${fig(c.stress / 1e6)} MPa. Heating compresses a held rail. Cooling tensions it. The length is not in the answer.`,
    };
  }),
});
