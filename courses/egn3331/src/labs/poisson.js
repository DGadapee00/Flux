import { lateralStrain, uniaxialVolumeStrain, volumeChange } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that a stretched bar contracts sideways, and that the linear volume change ε(1 − 2ν)
 * vanishes at ν = 0.5.
 *
 * Second method: the exact volume change (1+εx)(1+εy)(1+εz) − 1 against its cubic expansion.
 * The linear formula is what the readout calls the small-strain estimate. It is not the check,
 * because the two differ by terms in ε².
 */

const SCENARIOS = [
  { id: 'steel', name: 'Steel, ν = 0.30', nu: 0.3, eps: 0.001 },
  { id: 'alum', name: 'Aluminium, ν = 0.33', nu: 0.33, eps: 0.001 },
  { id: 'rubber', name: 'Nearly incompressible, ν = 0.49', nu: 0.49, eps: 0.002 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, nu: sc.nu, eps: sc.eps });
}

export default defineLab({
  id: 'poisson',
  exam: 'u2',
  title: 'Poisson',
  hint: 'Stretch the bar. It gets thinner, and the volume change shrinks as ν approaches 1/2.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'eps', lo: 0, hi: 0.01 }),
  controls() {
    return `
      ${slider('ps-eps', 'axial strain (millistrain)', 1, 0, 10, 0.05)}
      ${slider('ps-nu', 'Poisson\'s ratio ν', 0.3, 0.2, 0.49, 0.01)}
      <p class="tiny">Small-strain volume change is ε(1 − 2ν). The exact change keeps the products of the edge stretches.</p>`;
  },
  bind(api) {
    bindSlider('ps-eps', (s, v) => { s.eps = v / 1000; }, api);
    bindSlider('ps-nu', (s, v) => { s.nu = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    showField('ps-eps', true);
    showField('ps-nu', true);
    set('ps-eps', state.eps * 1000);
    set('ps-nu', state.nu);
  },
  compute(state) {
    const ex = state.eps;
    const ey = lateralStrain(state.nu, ex);
    const exact = volumeChange(ex, ey, ey);
    const nu = state.nu;
    const series = ex * (1 - 2 * nu) + ex * ex * (nu * nu - 2 * nu) + nu * nu * ex ** 3;
    const linear = uniaxialVolumeStrain(ex, nu);
    const gap = Math.abs(exact - series) / Math.max(Math.abs(exact), 1e-12);
    return { eps: ex, nu, lateral: ey, exact, linear, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const { x0, y0, x1, y1 } = B.free;
    const mid = y0 + (y1 - y0) * 0.36;
    const top = { x0, x1, y0, y1: mid };
    const bottom = { x0, x1, y0: mid, y1 };
    const S = sceneIn(B, top, { x0: -0.15, x1: 4.3, y0: -1.15, y1: 1.35 });
    // A strain of 0.001 is invisible at true scale. The drawing multiplies it by 60 and says so.
    const GAIN = 60;
    const L0 = 2.2;
    const H0 = 1.15;
    const L = L0 * (1 + c.eps * GAIN);
    const H = H0 * (1 + c.lateral * GAIN);
    poly(S, [[0, -H0 / 2], [L0, -H0 / 2], [L0, H0 / 2], [0, H0 / 2]], { fill: null, stroke: alpha(C.text, 0.45), width: 2, dash: [4, 3] });
    poly(S, [[0, -H / 2], [L, -H / 2], [L, H / 2], [0, H / 2]], { fill: alpha(C.gold, 0.22), stroke: C.gold, width: 2.5 });
    label(S, 'shape ×60', [L0, H0 / 2], { dy: -16, align: 'left', color: C.muted });
    const yHi = Math.max(c.eps * 0.72, 2e-4);
    const P = plotIn(B, bottom, { lo: 0.2, hi: 0.49 }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'ν', yLabel: 'volume strain' });
    const lin = [];
    const exa = [];
    for (let i = 0; i <= 40; i++) {
      const nu = 0.2 + (0.29 * i) / 40;
      const ey = lateralStrain(nu, c.eps);
      lin.push([nu, uniaxialVolumeStrain(c.eps, nu)]);
      exa.push([nu, volumeChange(c.eps, ey, ey)]);
    }
    line(P, lin, { color: C.teal, width: 3 });
    line(P, exa, { color: alpha(C.gold, 0.9), width: 2, dash: [5, 4] });
    dot(P, c.nu, c.linear, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\varepsilon_{lat}=-\nu\varepsilon`, String.raw`\Delta V/V \approx \varepsilon(1-2\nu)`],
  liveRows(state, c) {
    return [
      kv('linear ΔV/V', fig(c.linear)),
      kv('exact ΔV/V', fig(c.exact)),
      kv('lateral strain', fig(c.lateral)),
      kv('axial strain', fig(c.eps)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['ε axial', fig(c.eps)],
      ['ε lateral', fig(c.lateral)],
      ['ΔV/V linear', fig(c.linear)],
      ['ΔV/V exact', fig(c.exact)],
    ]);
  },
  coach(state, c) {
    if (c.nu > 0.45) {
      return {
        title: 'Almost no volume change',
        body: String.raw`At $\nu = ${fig(c.nu)}$ the linear volume strain is only ${fig(c.linear)}. A material with $\nu = 1/2$ changes shape and not volume, in this small-strain model.`,
      };
    }
    return {
      title: 'Thinner as it stretches',
      body: String.raw`Axial strain ${fig(c.eps)} produces lateral strain ${fig(c.lateral)}. The linear volume change is ${fig(c.linear)}. The dashed curve is the exact product of the three stretches. The two stay close while the strain is small.`,
    };
  },
});
