import { G_STANDARD } from '@flux/subjects/convert.js';
import { fromC, waterTP } from '@flux/subjects/thermo';
import { manometerGauge, manometerResidual } from '@flux/subjects/thermo/balances.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, fillUnder, layout, line } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that a manometer reads depth and density, not the tube's width or the distance along an
 * incline. The gauge pressure is the sum of ρ g z, with z the vertical drop taken positive
 * downward. A wider tube holds more fluid and the same pressure.
 *
 * Water's density is IF97 at 20 °C and 101325 Pa. Mercury is Cook's absolute density at 20 °C
 * and 1 atm, 13545.854 kg/m³, as adopted by Holman and ten Seldam, J. Phys. Chem. Ref. Data
 * (1994). The column heights are chosen for the lab, not taken from a worked problem.
 * Second method: Simpson's rule on ∫ ρ g dz against ρ g z, and a walk back to the open end.
 */

const P_ATM = 101325;
const RHO_HG = 13545.854;
const G = G_STANDARD;

const SCENARIOS = [
  { id: 'utube', name: 'Water U-tube', hCm: 20, diameterMm: 8, lengthCm: 30, angleDeg: 30, hmMm: 40, hwCm: 12 },
  { id: 'inclined', name: 'Inclined water tube', hCm: 20, diameterMm: 8, lengthCm: 30, angleDeg: 30, hmMm: 40, hwCm: 12 },
  { id: 'multi', name: 'Water and mercury', hCm: 20, diameterMm: 8, lengthCm: 30, angleDeg: 30, hmMm: 40, hwCm: 12 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, sc, { scenarioId: sc.id });
}

function simpson(f, a, b, n = 80) {
  if (a === b) return 0;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Vertical drops, metres, positive downward, for the scenario the student is on. */
function legsOf(state) {
  const rhoW = 1 / waterTP(fromC(20), P_ATM).v;
  if (state.scenarioId === 'inclined') {
    const drop = (state.lengthCm / 100) * Math.sin((state.angleDeg * Math.PI) / 180);
    return [{ rho: rhoW, drop, name: 'water' }];
  }
  if (state.scenarioId === 'multi') {
    return [
      { rho: RHO_HG, drop: state.hmMm / 1000, name: 'mercury' },
      { rho: rhoW, drop: -(state.hwCm / 100), name: 'water' },
    ];
  }
  return [{ rho: rhoW, drop: state.hCm / 100, name: 'water' }];
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1);

const CONTROLS = [
  { id: 'mn-h', key: 'hCm', label: 'water column (cm)', lo: 5, hi: 80, step: 1, when: 'utube' },
  { id: 'mn-L', key: 'lengthCm', label: 'length along the tube (cm)', lo: 10, hi: 80, step: 1, when: 'inclined' },
  { id: 'mn-ang', key: 'angleDeg', label: 'angle above horizontal (deg)', lo: 5, hi: 90, step: 1, when: 'inclined' },
  { id: 'mn-hm', key: 'hmMm', label: 'mercury column, descending (mm)', lo: 10, hi: 120, step: 1, when: 'multi' },
  { id: 'mn-hw', key: 'hwCm', label: 'water column, rising (cm)', lo: 2, hi: 40, step: 1, when: 'multi' },
  { id: 'mn-d', key: 'diameterMm', label: 'tube diameter (mm)', lo: 4, hi: 30, step: 1, when: 'all' },
];

export default defineLab({
  id: 'manometer',
  exam: 'u1',
  title: 'Manometer',
  hint: 'Pressure depends on the vertical drop and the density. The tube diameter does not enter.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('utube', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'inclined') return { key: 'angleDeg', lo: 5, hi: 90 };
    if (state.scenarioId === 'multi') return { key: 'hmMm', lo: 10, hi: 120 };
    return { key: 'hCm', lo: 5, hi: 80 };
  },
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Water density is IAPWS-IF97 at 20 °C and 101.325 kPa. Mercury is 13545.854 kg/m³ at 20 °C and 1 atm (Cook, as given by Holman and ten Seldam, 1994). Column heights are lab choices. g = 9.80665 m/s².</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, c.when === 'all' || c.when === state.scenarioId);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      el.value = String(state[c.key]);
    }
  },
  compute(state) {
    const legs = legsOf(state);
    const gauge = manometerGauge(legs, G);
    const residual = manometerResidual(gauge, legs, G);
    let integrated = 0;
    for (const leg of legs) {
      const sign = Math.sign(leg.drop) || 1;
      const span = Math.abs(leg.drop);
      integrated += sign * leg.rho * G * simpson(() => 1, 0, span);
    }
    const scale = Math.max(Math.abs(gauge), 1);
    return {
      rhoW: legs.find((leg) => leg.name === 'water')?.rho ?? legs[0].rho,
      gauge,
      pAbs: P_ATM + gauge,
      residual,
      gap: Math.max(Math.abs(residual) / scale, rel(integrated, gauge)),
      diameterMm: state.diameterMm,
    };
  },
  draw(canvas, state, c) {
    const legs = legsOf(state);
    const samples = [[0, 0]];
    let z = 0;
    let p = 0;
    for (const leg of legs) {
      const steps = 24;
      for (let i = 1; i <= steps; i++) {
        const dz = (leg.drop * i) / steps;
        samples.push([(z + dz) * 100, (p + leg.rho * G * dz) / 1000]);
      }
      z += leg.drop;
      p += leg.rho * G * leg.drop;
    }
    const xs = samples.map((pt) => pt[0]);
    const ys = samples.map((pt) => pt[1]);
    const lo = Math.min(0, ...ys);
    const hi = Math.max(0.2, ...ys);
    const xLo = Math.min(0, ...xs);
    const xHi = Math.max(1, ...xs);
    const P = layout(canvas, { lo: xLo - 0.05 * (xHi - xLo || 1), hi: xHi + 0.08 * (xHi - xLo || 1) }, { lo: lo - 0.15 * (hi - lo || 1), hi: hi + 0.2 * (hi - lo || 1) });
    axes(P, { xLabel: 'vertical drop (cm)', yLabel: 'gauge (kPa)' });
    fillUnder(P, samples, alpha(C.teal, 0.2));
    line(P, samples, { color: C.teal, width: 3 });
    dot(P, samples.at(-1)[0], samples.at(-1)[1], { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`P = P_\mathrm{atm} + \sum \rho g z`, String.raw`z > 0\ \mathrm{downward}`],
  liveRows(state, c) {
    return [
      kv('gauge pressure', `${fig(c.gauge / 1000)} kPa`),
      kv('absolute pressure', `${fig(c.pAbs / 1000)} kPa`),
      kv('tube diameter', `${fig(c.diameterMm)} mm`),
      kv('water density', `${fig(c.rhoW)} kg/m³`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['gauge', `${fig(c.gauge / 1000)} kPa`],
      ['absolute', `${fig(c.pAbs / 1000)} kPa`],
      ['diameter', `${fig(state.diameterMm)} mm`],
      ['water', `${fig(c.rhoW)} kg/m³`],
    ]);
  },
  coach(state, c) {
    const width = `The tube is ${fig(state.diameterMm)} mm across. That width is not in P = Σ ρ g z, so the reading does not change when the tube is widened.`;
    if (state.scenarioId === 'inclined') {
      const drop = (state.lengthCm / 100) * Math.sin((state.angleDeg * Math.PI) / 180);
      return {
        title: 'Only the vertical drop counts',
        body: `The fluid runs ${fig(state.lengthCm)} cm along the tube at ${fig(state.angleDeg)}° above horizontal. The vertical drop is ${fig(drop * 100)} cm, and the gauge pressure is ${fig(c.gauge / 1000)} kPa. ${width}`,
      };
    }
    if (state.scenarioId === 'multi') {
      return {
        title: 'Down adds, up subtracts',
        body: `From the open end the path descends ${fig(state.hmMm)} mm of mercury, then rises ${fig(state.hwCm)} cm of water. The gauge pressure is ${fig(c.gauge / 1000)} kPa. ${width}`,
      };
    }
    return {
      title: 'A U-tube is a depth gauge',
      body: `The open side stands ${fig(state.hCm)} cm above the tank side. With water at 20 °C the gauge pressure is ${fig(c.gauge / 1000)} kPa, and the absolute pressure is ${fig(c.pAbs / 1000)} kPa. ${width}`,
    };
  },
});
