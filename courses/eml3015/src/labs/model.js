import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS } from '@flux/subjects/mechanics/couette.js';
import { modelTest } from '@flux/subjects/mechanics/similitude.js';

/**
 * Model: a scale model of a ship, or of a submarine, tested in a tank.
 *
 * A ship makes waves, so its model must match the Froude number V/√(gL): the model runs slower,
 * at V_p√λ. Its Reynolds number then falls short by λ^{3/2} ν_p/ν_m, and matching both would need
 * a test fluid a hundred times thinner than water. Shows that a scale model in water does not
 * behave like the ship in every way. A deep submarine makes no waves, so only Re matters, and
 * matching it needs the model to run faster than the real thing by 1/λ. The model speed and the
 * needed viscosity are checked by bisection on the groups themselves, and the count of groups by
 * the rank of the dimension matrix (packages/subjects/src/mechanics/similitude.js).
 */
const SCENARIOS = [
  { id: 'tank', name: 'A 100 m ship, a 1/25 model in water', mode: 'surface', fluid: 'water', inv: 25, Lp: 100, Vp: 10 },
  { id: 'mercury', name: 'The same model in mercury', mode: 'surface', fluid: 'mercury', inv: 25, Lp: 100, Vp: 10 },
  { id: 'small', name: 'A 1/100 model in water', mode: 'surface', fluid: 'water', inv: 100, Lp: 100, Vp: 10 },
  { id: 'sub', name: 'A submarine deep down: match Re', mode: 'submerged', fluid: 'water', inv: 20, Lp: 80, Vp: 8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mode: sc.mode, fluid: sc.fluid, inv: sc.inv, Lp: sc.Lp, Vp: sc.Vp });
}

const nu = (id) => FLUIDS[id].mu / FLUIDS[id].rho;
const sci = (v) => v.toExponential(2);

export default defineLab({
  id: 'model',
  exam: 'u3',
  title: 'Model',
  hint: 'Match the Froude number and read how far short the Reynolds number falls. Then look for a fluid thin enough to match both: there is none.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('tank', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'inv', lo: 5, hi: 100 }),
  controls() {
    return `
      <label class="field"><span>The real thing</span><select id="md-mode"><option value="surface">A ship on the surface: match Fr</option><option value="submerged">A submarine deep down: match Re</option></select></label>
      <label class="field"><span>Test fluid</span><select id="md-fluid">${Object.values(FLUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      ${slider('md-inv', 'Scale 1 : N', 25, 5, 100, 1)}
      ${slider('md-vp', 'Full-size speed (m/s)', 10, 2, 15, 0.5)}
      <p class="tiny">The full-size vessel is in water at 20 °C. λ = 1/N is the model's length over the vessel's.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['md-mode', 'mode'], ['md-fluid', 'fluid']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    bindSlider('md-inv', (s, v) => { s.inv = v; }, api);
    bindSlider('md-vp', (s, v) => { s.Vp = v; }, api);
  },
  syncControls(state) {
    for (const [id, v] of [['md-mode', state.mode], ['md-fluid', state.fluid]]) {
      const el = document.getElementById(id);
      if (el) el.value = v;
    }
    for (const [id, v] of [['md-inv', state.inv], ['md-vp', state.Vp]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const r = modelTest({ mode: state.mode, Lp: state.Lp, Vp: state.Vp, lambda: 1 / state.inv, nuP: nu('water'), nuM: nu(state.fluid) });
    const thinnest = Math.min(...Object.keys(FLUIDS).map(nu));
    return { ...r, nuM: nu(state.fluid), nuP: nu('water'), fluidName: FLUIDS[state.fluid].name, thinnest };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.5);
    // Side view: the vessel and its model to the same scale.
    const S = sceneIn(B, top, { x0: -0.05, x1: 1.05, y0: -0.32, y1: 0.3 }, 12);
    const hull = (x0, len, y, color) => {
      const d = Math.max(0.012, 0.09 * len);
      poly(S, [[x0, y], [x0 + len, y], [x0 + 0.9 * len, y - d], [x0 + 0.08 * len, y - d]], { fill: alpha(color, 0.5), stroke: color, width: 1.5 });
    };
    if (state.mode === 'surface') {
      seg(S, [0, 0.12], [1, 0.12], { color: alpha(C.blue, 0.6), width: 1.5 });
      seg(S, [0, -0.2], [1, -0.2], { color: alpha(C.blue, 0.6), width: 1.5 });
    }
    hull(0, 1, 0.12, C.muted);
    hull(0, 1 / state.inv, -0.2, C.gold);
    label(S, `full size: ${fig(state.Lp)} m at ${fig(state.Vp)} m/s`, [0.5, 0.25], { color: C.muted });
    label(S, `model: ${fig(c.Lm)} m at ${fig(c.Vm)} m/s in ${c.fluidName.toLowerCase()}`, [0.5, -0.29], { color: C.gold });
    // The kinematic viscosity each test fluid has, and the one that would match both groups.
    const P = plotIn(B, bottom, { lo: -9, hi: 0 }, { lo: 0, hi: 1 }, { left: 20, right: 20, top: 26, bottom: 40 });
    axes(P, { xLabel: 'log₁₀ ν (m²/s)', yLabel: '', yFmt: () => '' });
    for (const [id, f] of Object.entries(FLUIDS)) {
      const x = Math.log10(nu(id));
      dot(P, x, 0.45, { color: id === state.fluid ? C.gold : C.teal, r: id === state.fluid ? 6 : 4 });
      label(P, f.name.split(',')[0], [x, 0.45], { color: C.muted, dy: id === 'mercury' || id === 'oil' ? 16 : -14 });
    }
    const xn = Math.log10(c.nuNeeded);
    seg(P, [xn, 0.1], [xn, 0.85], { color: C.pink, width: 2, dash: [4, 3] });
    label(P, 'needed to match both', [xn, 0.92], { color: C.pink, align: 'left', dx: -4 });
  },
  law: () => [String.raw`\mathrm{Re} = \frac{VL}{\nu}, \qquad \mathrm{Fr} = \frac{V}{\sqrt{gL}}`, String.raw`\text{match Fr: } V_m = V_p\sqrt\lambda, \qquad \frac{\mathrm{Re}_m}{\mathrm{Re}_p} = \lambda^{3/2}\frac{\nu_p}{\nu_m}`],
  liveRows(state, c) {
    return [
      kv('Groups: 5 variables, rank 3', String(c.groups)),
      kv('Model speed', `${fig(c.Vm)} m/s`),
      kv('Fr, model / full size', `${fig(c.FrM)} / ${fig(c.FrP)}`),
      kv('Re, model / full size', `${sci(c.ReM)} / ${sci(c.ReP)}`),
      kv('Re_m / Re_p', fig(c.reRatio)),
      kv('ν to match both', `${sci(c.nuNeeded)} m²/s`),
      kv('Thinnest fluid offered', `${sci(c.thinnest)} m²/s`),
      kv('Bisection against closed forms', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['model speed', `${fig(c.Vm)} m/s`],
      ['Fr ratio', fig(c.frRatio)],
      ['Re ratio', fig(c.reRatio)],
      ['ν needed', `${sci(c.nuNeeded)} m²/s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> How tanks cope. Model basins match Fr, measure the total drag, and subtract a friction drag estimated from Re with a flat-plate formula, then add back the full-size friction. Roughness strips on the model's bow trip its boundary layer to turbulent, as on the real ship.`;
    if (state.mode === 'submerged') {
      return {
        title: 'No waves: match Re, and the model must run fast',
        body: `Deep down there is no free surface, so Fr does not matter and Re does. In ${c.fluidName.toLowerCase()} the 1/${state.inv} model needs ${fig(c.Vm)} m/s to match Re, ${fig(c.Vm / state.Vp)} times the real speed. That is why such models are tested in wind tunnels or pressurized water, or at a lower Re and corrected. ${leavesOut}`,
      };
    }
    return {
      title: 'Match Fr, and Re falls short',
      body: `The waves a ship makes depend on Fr, so the 1/${state.inv} model runs at ${fig(c.Vm)} m/s, √λ times the real speed. Its Reynolds number is then ${fig(c.reRatio)} of the ship's. Matching both needs ν = ${sci(c.nuNeeded)} m²/s; the thinnest fluid here is ${sci(c.thinnest)} m²/s. No practical liquid gets there. ${leavesOut}`,
    };
  },
  app: false,
});
