import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CARBON_IN_GAMMA, carburize, carburizeNumeric } from '@flux/subjects/matsci/diffusion.js';

/**
 * Diffusion: carbon soaking into a low-carbon steel surface in a hot furnace (carburizing).
 *
 * Shows that the case deepens as the square root of time: twice the time gives √2 the depth, and
 * four times the time twice. Temperature matters far more, because the diffusivity is Arrhenius.
 * The profile is the error-function solution of Fick's second law; the second method solves the
 * equation by Crank–Nicolson on a grid (packages/subjects/src/matsci/diffusion.js).
 */
const SCENARIOS = [
  { id: 'base', name: '900 °C for 4 hours', TC: 900, hours: 4 },
  { id: 'long', name: '900 °C for 16 hours', TC: 900, hours: 16 },
  { id: 'hot', name: '1000 °C for 4 hours', TC: 1000, hours: 4 },
  { id: 'short', name: '850 °C for half an hour', TC: 850, hours: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, TC: sc.TC, hours: sc.hours });
}

export default defineLab({
  id: 'diffusion',
  exam: 'u2',
  title: 'Diffusion',
  hint: 'Double the time and read the case depth: it grows by √2, not 2. Then raise the furnace 100 °C at the same time.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('base', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hours', lo: 0.5, hi: 24 }),
  controls() {
    return `
      ${slider('df-T', 'Furnace temperature (°C)', 900, 850, 1100, 5)}
      ${slider('df-t', 'Time in the furnace (h)', 4, 0.5, 24, 0.5)}
      <p class="tiny">Steel at 0.2 wt% carbon, its surface held at 1.0 wt%. Case depth: where the carbon falls to 0.6 wt%. Carbon in austenite: D₀ = ${CARBON_IN_GAMMA.D0.toExponential(1)} m²/s, Q = ${CARBON_IN_GAMMA.Qd / 1000} kJ/mol. Faint curves: a quarter of the time and four times it. Dots: the grid solution.</p>`;
  },
  bind(api) {
    bindSlider('df-T', (s, v) => { s.TC = v; }, api);
    bindSlider('df-t', (s, v) => { s.hours = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['df-T', state.TC], ['df-t', state.hours]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const a = carburize({ TC: state.TC, hours: state.hours });
    const n = carburizeNumeric({ TC: state.TC, hours: state.hours });
    const quarter = carburize({ TC: state.TC, hours: state.hours / 4 });
    const four = carburize({ TC: state.TC, hours: state.hours * 4 });
    const gap = Math.abs(n.depth - a.depth) / a.depth;
    return { ...a, depthMM: a.depth * 1e3, depthNum: n.depth * 1e3, prof: n.prof, quarter, four, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const xMax = Math.max(2.2 * c.four.depth, 0.05e-3) * 1e3; // mm
    const P = plotIn(B, B.free, { lo: 0, hi: xMax }, { lo: 0, hi: 1.1 });
    axes(P, { xLabel: 'depth below the surface (mm)', yLabel: 'carbon (wt%)' });
    const curve = (r) => Array.from({ length: 201 }, (_, i) => {
      const x = (i / 200) * xMax;
      return [x, r.C(x / 1e3)];
    });
    line(P, curve(c.quarter), { color: alpha(C.gold, 0.4), width: 1.5, dash: [4, 4] });
    line(P, curve(c.four), { color: alpha(C.gold, 0.4), width: 1.5, dash: [4, 4] });
    line(P, curve(c), { color: C.gold, width: 3 });
    for (let i = 1; i <= 24; i++) {
      const x = (i / 25) * xMax;
      if (x / 1e3 < 9.5 * c.ell) dot(P, x, c.prof(x / 1e3), { color: C.teal, r: 2.5 });
    }
    seg(P, [0, c.Cx], [xMax, c.Cx], { color: alpha(C.text, 0.35), width: 1, dash: [3, 3] });
    seg(P, [c.depthMM, 0], [c.depthMM, c.Cx], { color: C.pink, width: 1.5 });
    dot(P, c.depthMM, c.Cx, { color: C.pink, r: 5 });
    label(P, `case ${fig(c.depthMM)} mm`, [c.depthMM, c.Cx], { color: C.pink, align: 'left', dx: 8, dy: -12 });
    label(P, '¼ t', [c.quarter.depth * 1e3, c.Cx], { color: alpha(C.gold, 0.8), dy: 14 });
    label(P, '4t', [c.four.depth * 1e3, c.Cx], { color: alpha(C.gold, 0.8), dy: 14 });
    label(P, `${fig(state.hours)} h at ${fig(state.TC)} °C`, [xMax, 1.1], { color: C.gold, align: 'right', dy: 12 });
  },
  law: () => [String.raw`J = -D\,\frac{\partial C}{\partial x}, \qquad \frac{\partial C}{\partial t} = D\,\frac{\partial^2 C}{\partial x^2}`, String.raw`\frac{C - C_0}{C_s - C_0} = 1 - \operatorname{erf}\frac{x}{2\sqrt{Dt}}, \qquad D = D_0\,e^{-Q_d/RT}`],
  liveRows(state, c) {
    return [
      kv('D at this temperature', `${c.D.toExponential(2)} m²/s`),
      kv('√(Dt)', `${fig(c.ell * 1e3)} mm`),
      kv('Case depth, error function', `${fig(c.depthMM)} mm`),
      kv('Case depth, Crank–Nicolson', `${fig(c.depthNum)} mm`),
      kv('At a quarter of the time', `${fig(c.quarter.depth * 1e3)} mm`),
      kv('At four times the time', `${fig(c.four.depth * 1e3)} mm`),
      kv('Two methods differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['case depth', `${fig(c.depthMM)} mm`],
      ['√(Dt)', `${fig(c.ell * 1e3)} mm`],
      ['D', `${c.D.toExponential(1)} m²/s`],
      ['time', `${fig(state.hours)} h`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A deep part with a flat surface, a surface held at a fixed carbon content, and one D that does not change with carbon content. Real furnaces control the surface carbon through the gas, and D in steel rises somewhat with carbon.`;
    return {
      title: 'Depth grows as √t',
      body: `Every carbon level moves in as √(Dt), here ${fig(c.ell * 1e3)} mm, so the case is ${fig(c.depthMM)} mm after ${fig(state.hours)} h. A quarter of the time gives ${fig(c.quarter.depth * 1e3)} mm and four times the time ${fig(c.four.depth * 1e3)} mm: half and double, not a quarter and four times. D at ${fig(state.TC)} °C is ${c.D.toExponential(1)} m²/s, and each 100 °C roughly triples it. ${leavesOut}`,
    };
  },
  app: false,
});
