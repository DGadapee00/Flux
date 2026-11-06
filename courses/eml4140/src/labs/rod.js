import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ALPHA, rod } from '@flux/subjects/heat/rod.js';

/**
 * Rod: the heat equation on a rod whose ends are held at a fixed temperature. A starting profile
 * spreads out and sinks toward the ends' temperature.
 *
 * Solved two ways side by side (packages/subjects/src/heat/rod.js): a Fourier sine series, where
 * each sine fades at its own rate, e^{−(nπ)²Fo}, and explicit finite differences on 80 cells. Shows
 * that short wiggles die first, n² times faster than the broad hump, and that time scales as L²/α:
 * the same profile in a rod twice as long takes four times as long.
 */
const T_END = 20; // °C at both ends
const DT0 = 80; // °C: the starting profile's peak above the ends

const MATERIALS = {
  copper: { name: 'Copper', alpha: ALPHA.copper },
  aluminum: { name: 'Aluminum', alpha: ALPHA.aluminum },
  steel: { name: 'Carbon steel', alpha: ALPHA.steel },
  glass: { name: 'Pyrex glass', alpha: ALPHA.glass },
};
const PROFILE_NAMES = { hump: 'A half sine', tent: 'A tent', wiggle: 'A hump with a ripple', parabola: 'A parabola' };

const SCENARIOS = [
  { id: 'copper', name: 'A copper rod, hot in the middle', profile: 'hump', material: 'copper', L: 0.1, Fo: 0.05 },
  { id: 'steel', name: 'The same in carbon steel', profile: 'hump', material: 'steel', L: 0.1, Fo: 0.05 },
  { id: 'wiggle', name: 'A ripple on the hump fades first', profile: 'wiggle', material: 'copper', L: 0.1, Fo: 0.005 },
  { id: 'tent', name: 'A sharp corner rounds off', profile: 'tent', material: 'copper', L: 0.1, Fo: 0.002 },
  { id: 'glass', name: 'A glass rod: slow', profile: 'parabola', material: 'glass', L: 0.1, Fo: 0.1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, profile: sc.profile, material: sc.material, L: sc.L, Fo: sc.Fo });
}

const degC = (theta) => `${fig(T_END + DT0 * theta)} °C`;
const secs = (t) => (t < 120 ? `${fig(t)} s` : t < 7200 ? `${fig(t / 60)} min` : `${fig(t / 3600)} h`);

export default defineLab({
  id: 'rod',
  exam: 'u1',
  title: 'Rod',
  hint: 'Move time forward and watch the profile sink. The ripple dies long before the hump; steel takes six times as long as copper.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('copper', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Fo', lo: 0, hi: 0.5 }),
  controls() {
    return `
      <label class="field"><span>Starting profile</span><select id="rd-prof">${Object.entries(PROFILE_NAMES).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label>
      <label class="field"><span>Material</span><select id="rd-mat">${Object.entries(MATERIALS).map(([id, m]) => `<option value="${id}">${m.name}</option>`).join('')}</select></label>
      ${slider('rd-L', 'Rod length L (m)', 0.1, 0.02, 0.5, 0.01)}
      ${slider('rd-Fo', 'Time, as the Fourier number αt/L²', 0.05, 0, 0.5, 0.001)}
      <p class="tiny">Ends held at ${T_END} °C. The half sine starts ${DT0} °C above them at its peak; the other profiles are scaled the same way. The side of the rod is insulated.</p>`;
  },
  bind(api) {
    document.getElementById('rd-prof')?.addEventListener('change', (e) => {
      api.slice().profile = e.target.value;
      api.bump();
    });
    document.getElementById('rd-mat')?.addEventListener('change', (e) => {
      api.slice().material = e.target.value;
      api.bump();
    });
    bindSlider('rd-L', (s, v) => { s.L = v; }, api);
    bindSlider('rd-Fo', (s, v) => { s.Fo = v; }, api);
  },
  syncControls(state) {
    const p = document.getElementById('rd-prof');
    if (p) p.value = state.profile;
    const m = document.getElementById('rd-mat');
    if (m) m.value = state.material;
    for (const [id, v] of [['rd-L', state.L], ['rd-Fo', state.Fo]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const mat = MATERIALS[state.material] || MATERIALS.copper;
    const r = rod(state.profile, state.Fo);
    const t = (state.Fo * state.L ** 2) / mat.alpha;
    return {
      ...r,
      t,
      alpha: mat.alpha,
      materialName: mat.name,
      midC: T_END + DT0 * r.mid,
      peakC: T_END + DT0 * r.peak,
      humpShare: Math.exp(-(Math.PI ** 2) * state.Fo),
      rippleShare: Math.exp(-((5 * Math.PI) ** 2) * state.Fo),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.72);
    const L = state.L;
    const P = plotIn(B, top, { lo: 0, hi: L * 100 }, { lo: T_END - 5, hi: T_END + DT0 * 1.4 });
    axes(P, { xLabel: 'x (cm)', yLabel: 'T (°C)' });
    const xs = c.s.map((s) => s * L * 100);
    line(P, xs.map((x, i) => [x, T_END + DT0 * c.start[i]]), { color: alpha(C.text, 0.35), width: 1.5, dash: [4, 4] });
    line(P, xs.map((x, i) => [x, T_END + DT0 * c.series[i]]), { color: C.red, width: 2.5 });
    xs.forEach((x, i) => {
      if (i % 4 === 0) dot(P, x, T_END + DT0 * c.fd[i], { color: C.yellow, r: 2.5 });
    });
    label(P, 'dashed: start · line: series · dots: grid', [L * 50, T_END + DT0 * 1.3], { color: C.muted });
    // The rod itself, coloured by temperature from the ends' 20 °C (blue) to 100 °C (red).
    const S = sceneIn(B, bottom, { x0: -0.06 * L, x1: 1.06 * L, y0: -0.1 * L, y1: 0.12 * L }, 10);
    const n = c.s.length - 1;
    for (let i = 0; i < n; i++) {
      const th = Math.max(0, Math.min(1, (c.series[i] + c.series[i + 1]) / 2));
      const col = `rgb(${Math.round(88 + (252 - 88) * th)}, ${Math.round(196 - (196 - 98) * th)}, ${Math.round(221 - (221 - 85) * th)})`;
      const x0 = (i / n) * L;
      const x1 = ((i + 1.4) / n) * L; // overlap the next cell a little, so no seam shows
      poly(S, [[x0, -0.03 * L], [x1, -0.03 * L], [x1, 0.03 * L], [x0, 0.03 * L]], { fill: col, stroke: null });
    }
    for (const x of [0, L]) poly(S, [[x - 0.015 * L, -0.06 * L], [x + 0.015 * L, -0.06 * L], [x + 0.015 * L, 0.06 * L], [x - 0.015 * L, 0.06 * L]], { fill: alpha(C.blue, 0.8), stroke: null });
    label(S, `${c.materialName}, L = ${fig(L * 100)} cm, t = ${secs(c.t)} · ends at ${T_END} °C`, [L / 2, 0.095 * L], { color: C.muted });
  },
  law: () => [String.raw`\frac{\partial T}{\partial t} = \alpha\,\frac{\partial^2 T}{\partial x^2}, \qquad \mathrm{Fo} = \frac{\alpha t}{L^2}`, String.raw`\theta = \sum_n b_n \sin\frac{n\pi x}{L}\,e^{-(n\pi)^2\mathrm{Fo}}`],
  liveRows(state, c) {
    return [
      kv('Time t = Fo L²/α', secs(c.t)),
      kv('α of this material', `${fig(c.alpha * 1e6)} mm²/s`),
      kv('Middle of the rod', degC(c.mid)),
      kv('Heat left above the ends', `${fig(100 * c.heatLeft)}%`),
      kv('First mode left, exp(−π²Fo)', `${fig(100 * c.humpShare)}%`),
      kv('Fifth mode left, exp(−25π²Fo)', `${fig(100 * c.rippleShare)}%`),
      kv('Series against finite differences', `${c.gap.toExponential(1)} of the starting peak`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['time', secs(c.t)],
      ['middle', degC(c.mid)],
      ['heat left', `${fig(100 * c.heatLeft)}%`],
      ['Fo', fig(state.Fo)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The side of the rod is taken as insulated and the properties as constant. A real rod loses heat from its side by convection, which adds a term to the equation, and k and c change with temperature.`;
    let title = 'Each sine fades at its own rate';
    let body = `The profile is a sum of sines that fit between the fixed ends. Mode n fades as exp(−(nπ)²Fo), so the first one, the broad hump, lasts longest. Here ${fig(100 * c.humpShare)}% of it is left after ${secs(c.t)}.`;
    if (state.profile === 'wiggle') {
      title = 'Short wiggles die first';
      body = `The ripple is the fifth mode. It fades 25 times faster than the hump: ${fig(100 * c.rippleShare)}% of it is left against ${fig(100 * c.humpShare)}% of the hump. Sharp features carry steep gradients, so heat flows fast across them.`;
    } else if (state.profile === 'tent') {
      title = 'A sharp corner rounds off at once';
      body = `The tent's corner needs many short sines to draw. Those fade almost at once, so the corner is round long before the tent sinks. The series and the grid agree to ${c.gap.toExponential(1)} of the peak even here.`;
    } else if (state.material !== 'copper') {
      title = 'Time scales as L²/α';
      body = `The profile depends only on Fo = αt/L². ${c.materialName} has α = ${fig(c.alpha * 1e6)} mm²/s against copper's ${fig(ALPHA.copper * 1e6)}, so the same profile takes ${fig(ALPHA.copper / c.alpha)} times as long: ${secs(c.t)}.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
