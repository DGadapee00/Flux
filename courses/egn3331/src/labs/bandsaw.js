import { bentStripStress, curvature } from '@flux/subjects/mechanics/bending.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, panes, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that bending a strip to a set radius fixes its stress, whatever moment it took: a 0.025 in
 * band-saw blade on 14 in wheels sees 52 ksi at its surface from curvature alone, over three times the
 * tension it is set to, and under 3 lbf·in is enough to bend it there. Width changes the
 * moment, not the stress. Thickness and wheel size set the stress, and the blade feels it twice
 * every trip around.
 *
 * Cited: carbon-steel blades are tensioned to 15,000–20,000 psi (Fine Woodworking, "Setting
 * Bandsaw Blade Tension", 2012). Blades 0.025 in thick are not advised on wheels under 12 in (Amana
 * Tool). E = 29,000 ksi is the AISC value for steel. The 14 in wheels, the 93.5 in blade, the
 * 3,000 ft/min speed and the 1/2 in width are assumed. Recompute: σ = E (t/2)/ρ with ρ to the
 * blade's mid-thickness. Second method: the moment M = EI/ρ, then σ = Mc/I.
 */

const E = 29e6;
const OUT = 'The blade is a thin elastic strip that wraps the wheel exactly. Its teeth, set and gullets are left out, and the gullet root is where cracks start: it is a notch, and it adds its own concentration on top of this stress. The tyre on the wheel softens the bend a little. Each trip around is one load cycle on each wheel, so a blade fails by fatigue long before it would yield in one bend; that is why thinner blades are matched to small wheels.';

const SCENARIOS = [
  { id: 'saw14', name: '0.025 in blade on 14 in wheels', t: 0.025, D: 14, bw: 0.5, T0: 15 },
  { id: 'thick', name: '0.035 in blade on 14 in wheels', t: 0.035, D: 14, bw: 0.5, T0: 15 },
  { id: 'small', name: '0.025 in blade on 9 in wheels', t: 0.025, D: 9, bw: 0.5, T0: 15 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, t: sc.t, D: sc.D, bw: sc.bw, T0: sc.T0, sfpm: 3000, len: 93.5 });
}

/** Inch-pound: psi, in, lbf. */
export function blade(state) {
  const t = Number(state.t) || 0.025;
  const D = Number(state.D) || 14;
  const bw = Number(state.bw) || 0.5;
  const T0 = (Number(state.T0) || 0) * 1000;
  const rho = D / 2 + t / 2;
  const bend = bentStripStress(E, t, rho);
  const I = (bw * t ** 3) / 12;
  const M = (E * I) / rho;
  // Second method: the moment that holds that curvature, then Mc/I.
  const bend2 = (M * (t / 2)) / I;
  const gap = Math.max(Math.abs(bend2 - bend) / bend, Math.abs(curvature(M, E, I) - 1 / rho) * rho);
  const passes = ((Number(state.sfpm) || 3000) * 12) / (Number(state.len) || 93.5);
  return {
    t, D, bw, rho, bend, M, I, strain: t / (2 * rho), T0, outer: T0 + bend, inner: T0 - bend,
    pull: T0 * bw * t, perHour: 2 * passes * 60, ratio: bend / Math.max(T0, 1), gap,
  };
}

function member(B, rect, state, c, veiled) {
  const r = c.D / 2;
  const gapC = Math.max((93.5 - Math.PI * c.D) / 2, 2 * r + 2);
  const S = sceneIn(B, rect, { x0: -r - 7, x1: r + 7, y0: -gapC / 2 - r - 3, y1: gapC / 2 + r + 3 }, 10);
  const top = [0, gapC / 2];
  const bot = [0, -gapC / 2];
  circle(S, top, r, { stroke: C.muted, fill: alpha(C.muted, 0.15), width: 1.5 });
  circle(S, bot, r, { stroke: C.muted, fill: alpha(C.muted, 0.15), width: 1.5 });
  // The blade: straight runs in tension only, wrapped arcs bent as well.
  seg(S, [-r, bot[1]], [-r, top[1]], { color: C.teal, width: 3 });
  seg(S, [r, bot[1]], [r, top[1]], { color: C.teal, width: 3 });
  const arc = (cen, a0) => {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a = a0 + (Math.PI * i) / n;
      const b = a0 + (Math.PI * (i + 1)) / n;
      seg(S, [cen[0] + r * Math.cos(a), cen[1] + r * Math.sin(a)], [cen[0] + r * Math.cos(b), cen[1] + r * Math.sin(b)], { color: C.gold, width: 4 });
    }
  };
  arc(top, 0);
  arc(bot, Math.PI);
  if (!veiled) {
    label(S, `${fig(c.outer / 1000)} ksi`, [0, top[1] + r], { color: C.gold, dy: -12 });
    label(S, `${fig(c.T0 / 1000)} ksi`, [r, 0], { color: C.teal, dx: 6, align: 'left' });
    label(S, `${fig(c.D)} in`, top, { color: C.dim });
  }
}

export default defineLab({
  id: 'bandsaw',
  exam: 'u6',
  title: 'Band-saw blade',
  app: true,
  hint: 'Wrapped on a wheel the blade\'s curvature is fixed, so its surface stress is E(t/2)/ρ whatever the moment. Width changes the moment, not the stress.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('saw14', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'D', lo: 6, hi: 24 }),
  controls() {
    return `
      ${slider('bs-t', 'blade thickness (in)', 0.025, 0.014, 0.042, 0.001)}
      ${slider('bs-d', 'wheel diameter (in)', 14, 6, 24, 0.5)}
      ${slider('bs-w', 'blade width (in)', 0.5, 0.125, 1, 0.125)}
      ${slider('bs-f', 'set tension (ksi)', 15, 5, 30, 0.5)}
      <p class="tiny">Cited: carbon blades are tensioned to 15–20 ksi (Fine Woodworking, 2012); 0.025 in blades want wheels of 12 in or more (Amana Tool). E = 29,000 ksi (AISC). The wheel size, 93.5 in blade length and 3,000 ft/min speed are assumed.</p>`;
  },
  bind(api) {
    bindSlider('bs-t', (s, v) => { s.t = v; }, api);
    bindSlider('bs-d', (s, v) => { s.D = v; }, api);
    bindSlider('bs-w', (s, v) => { s.bw = v; }, api);
    bindSlider('bs-f', (s, v) => { s.T0 = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('bs-t', state.t);
    set('bs-d', state.D);
    set('bs-w', state.bw);
    set('bs-f', state.T0);
  },
  compute(state) {
    return blade(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const P = chartIn(B, R, { lo: 6, hi: 24 }, { lo: 0, hi: Math.max(150, (c.outer / 1000) * 1.1) });
    axes(P, { xLabel: 'wheel diameter (in)', yLabel: 'surface stress on the wheel (ksi)' });
    const bend = [];
    const outer = [];
    for (let i = 0; i <= 72; i++) {
      const d = 6 + (18 * i) / 72;
      const b = blade({ ...state, D: d });
      bend.push([d, b.bend / 1000]);
      outer.push([d, b.outer / 1000]);
    }
    line(P, outer, { color: C.yellow, width: 1.5, dash: [6, 4] });
    line(P, bend, { color: C.gold, width: 3 });
    line(P, [[6, c.T0 / 1000], [24, c.T0 / 1000]], { color: C.teal, width: 1.5, dash: [6, 4] });
    dot(P, c.D, c.bend / 1000, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\sigma = E\,\frac{t/2}{\rho}`, String.raw`M = \frac{EI}{\rho}`],
  liveRows(state, c) {
    return [
      kv('bending stress', `${fig(c.bend / 1000)} ksi`),
      kv('set tension', `${fig(c.T0 / 1000)} ksi`),
      kv('outer fibre on the wheel', `${fig(c.outer / 1000)} ksi`),
      kv('inner fibre on the wheel', `${fig(c.inner / 1000)} ksi`),
      kv('moment to bend it', `${fig(c.M)} lbf·in`),
      kv('surface strain', `${fig(c.strain * 1e6)} µε`),
      kv('bends per hour', fig(c.perHour)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['bending', `${fig(c.bend / 1000)} ksi`],
      ['outer', `${fig(c.outer / 1000)} ksi`],
      ['moment', `${fig(c.M)} lbf·in`],
      ['bends/h', fig(c.perHour)],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.bend > c.T0 ? 'The wheel, not the tension, sets the stress' : 'Tension dominates',
    body: String.raw`Wrapped on ${fig(c.D)} in wheels, the ${fig(c.t)} in blade bends to ${fig(c.rho)} in radius. Its surface strains ${fig(c.strain * 1e6)} µε, so E times that is ${fig(c.bend / 1000)} ksi, ${fig(c.ratio)} times the ${fig(c.T0 / 1000)} ksi set tension. Only ${fig(c.M)} lbf·in does it: a thin strip is easy to bend but highly stressed. The outer fibre cycles from ${fig(c.T0 / 1000)} to ${fig(c.outer / 1000)} ksi ${fig(c.perHour)} times an hour.`,
  })),
});
