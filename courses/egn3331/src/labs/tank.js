import { PA_PER_PSI } from '@flux/subjects/convert.js';
import { hoopFromSplit, thinCylinder } from '@flux/subjects/mechanics/materials.js';
import { TANK_OD_IN, TANK_P, TANK_P_PSI, TANK_R, TANK_T, TANK_T_IN } from '../data/tank.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a 20 lb propane cylinder at its service pressure is a thin closed cylinder:
 * the hoop stress is pr/t on the inside radius, and the longitudinal stress is half.
 *
 * Cited: Manchester Tank model 10504 is 12.2 in in outside diameter and DOT-4BA240.
 * 49 CFR 178.51 sets a minimum wall of 0.078 in when the outside diameter exceeds 6 in.
 * The 240 in the specification is the service pressure in psig. The wall used here is
 * that minimum, not a measured thickness. Second method: the half-cylinder force balance.
 */

const KSI = 1000 * PA_PER_PSI;
const D = TANK_OD_IN;
const d = TANK_OD_IN - 2 * TANK_T_IN;
const OUT = 'The shell is treated as a long closed cylinder at the service pressure. A real cylinder has domed heads, a weld, and a wall that may be thicker than the 0.078 in minimum in 49 CFR 178.51. The regulation computes a wall stress with S = P(1.3D² + 0.4d²)/(D² − d²) and applies it at the test pressure, not with pr/t at the service pressure.';

const SCENARIOS = [
  { id: 'service', name: 'Service pressure, 240 psi', p: TANK_P },
  { id: 'half', name: 'Half of service, 120 psi', p: TANK_P / 2 },
  { id: 'low', name: 'A warm tank, 40 psi', p: 40 * PA_PER_PSI },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, p: sc.p });
}

/** The DOT 4BA cylindrical wall-stress formula, evaluated at the pressure in hand. */
function dotShell(pPsi) {
  return (pPsi * (1.3 * D * D + 0.4 * d * d)) / (D * D - d * d);
}

export default defineLab({
  id: 'tank',
  exam: 'u4',
  title: 'Propane cylinder',
  app: true,
  hint: 'A grill tank is a thin closed cylinder. At the service pressure the hoop stress is pr/t, using the specification minimum wall.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('service', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'p', lo: 20 * PA_PER_PSI, hi: TANK_P }),
  controls() {
    return `
      ${slider('tk-p', 'pressure (psi)', 240, 20, 240, 5)}
      <p class="tiny">Cited: Manchester Tank 10504, 12.2 in outside diameter, DOT-4BA240. 49 CFR 178.51 minimum wall 0.078 in for an outside diameter over 6 in. Inside radius ${(TANK_OD_IN / 2 - TANK_T_IN).toFixed(3)} in.</p>`;
  },
  bind(api) {
    bindSlider('tk-p', (s, v) => { s.p = v * PA_PER_PSI; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('tk-p');
    if (el && document.activeElement !== el) el.value = String(state.p / PA_PER_PSI);
  },
  compute(state) {
    const s = thinCylinder(state.p, TANK_R, TANK_T);
    const pPsi = state.p / PA_PER_PSI;
    const dot = dotShell(pPsi) * PA_PER_PSI;
    const gap = Math.abs(s.hoop - hoopFromSplit(state.p, TANK_R, TANK_T)) / Math.max(s.hoop, 1);
    return { ...s, dot, pPsi, gap, rt: TANK_R / TANK_T };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const yHi = ((TANK_P * TANK_R) / TANK_T) / KSI * 1.1;
    const P = plotIn(B, B.free, { lo: 0, hi: TANK_P_PSI }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'pressure (psi)', yLabel: 'stress (ksi)' });
    const hoop = [];
    const axial = [];
    for (let i = 0; i <= 40; i++) {
      const p = (TANK_P * i) / 40;
      const s = thinCylinder(p, TANK_R, TANK_T);
      hoop.push([(p / PA_PER_PSI), s.hoop / KSI]);
      axial.push([(p / PA_PER_PSI), s.axial / KSI]);
    }
    line(P, hoop, { color: C.gold, width: 3 });
    line(P, axial, { color: C.teal, width: 3 });
    dot(P, c.pPsi, c.hoop / KSI, { color: C.gold, r: 5 });
    dot(P, c.pPsi, c.axial / KSI, { color: C.teal, r: 5 });
  },
  law: () => [String.raw`\sigma_h=\frac{pr}{t}`],
  liveRows(state, c) {
    return [
      kv('hoop', `${fig(c.hoop / KSI)} ksi`),
      kv('longitudinal', `${fig(c.axial / KSI)} ksi`),
      kv('DOT shell formula', `${fig(c.dot / KSI)} ksi`),
      kv('r/t', fig(c.rt)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['hoop', `${fig(c.hoop / KSI)} ksi`],
      ['long', `${fig(c.axial / KSI)} ksi`],
      ['pressure', `${fig(c.pPsi)} psi`],
      ['r/t', fig(c.rt)],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: 'Service pressure on the minimum wall',
    body: String.raw`At ${fig(c.pPsi)} psi the hoop stress is ${fig(c.hoop / KSI)} ksi and the longitudinal stress is ${fig(c.axial / KSI)} ksi. The DOT shell formula, at this same pressure, gives ${fig(c.dot / KSI)} ksi. It is a different expression, and the regulation uses it at the test pressure.`,
  })),
});
