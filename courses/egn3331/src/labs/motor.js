import { M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';
import { polarJ, torqueFromHorsepower, torsionShear } from '@flux/subjects/mechanics/torsion.js';
import { motorShaft, MOTOR_D_IN, MOTOR_HP, MOTOR_L_IN, MOTOR_RPM } from '../data/motor.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

const KSI = 1000 * PA_PER_PSI;

/**
 * Shows that a motor stub is sized by stress, not by twist. The nameplate
 * torque puts a few megapascals on a 1.125 in shaft, and 2.75 in of that
 * shaft barely rotates. Length changes the angle and not the stress.
 *
 * Second method: the inch-pound stress and angle against the SI shaft, and
 * horsepower against watts.
 */

const OUT = 'The shaft is the Baldor EM3615T-5 nameplate: 5 hp, 1750 rpm, and a 1.125 in diameter. The 2.75 in length is the NEMA 184T usable extension, not a measured twist length inside the bearing. E is 29000 ksi, the AISC value for steel, because the catalog does not name the shaft steel. Poisson\'s ratio is taken as 0.30, so G is E over 2(1+ν). The keyway, the fillet, the service factor, and any belt load are left out. A 36 in length and a 0.75 in diameter are comparisons, not this motor.';

const SCENARIOS = [
  { id: 'stub', name: 'Nameplate stub', hp: MOTOR_HP, rpm: MOTOR_RPM, dIn: MOTOR_D_IN, lIn: MOTOR_L_IN },
  { id: 'long', name: '36 in of the same shaft', hp: MOTOR_HP, rpm: MOTOR_RPM, dIn: MOTOR_D_IN, lIn: 36 },
  { id: 'slender', name: '0.75 in diameter', hp: MOTOR_HP, rpm: MOTOR_RPM, dIn: 0.75, lIn: MOTOR_L_IN },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, hp: sc.hp, rpm: sc.rpm, dIn: sc.dIn, lIn: sc.lIn });
}

export default defineLab({
  id: 'motor',
  exam: 'u9',
  title: 'Motor shaft',
  hint: 'Nameplate torque on this stub is a small stress. The angle grows with length. The stress does not.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('stub', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hp', lo: 1, hi: 20 }),
  controls() {
    return `
      ${slider('mo-hp', 'power (hp)', 5, 1, 20, 0.5)}
      ${slider('mo-n', 'speed (rpm)', 1750, 600, 3600, 50)}
      ${slider('mo-d', 'diameter (in)', 1.125, 0.5, 2, 0.025)}
      ${slider('mo-l', 'length (in)', 2.75, 1, 48, 0.25)}
      <p class="tiny">Baldor EM3615T-5 is 5 hp at 1750 rpm with a 1.125 in shaft. The NEMA 184T extension is 2.75 in. E is 29000 ksi and ν is 0.30.</p>`;
  },
  bind(api) {
    bindSlider('mo-hp', (s, v) => { s.hp = v; }, api);
    bindSlider('mo-n', (s, v) => { s.rpm = v; }, api);
    bindSlider('mo-d', (s, v) => { s.dIn = v; }, api);
    bindSlider('mo-l', (s, v) => { s.lIn = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('mo-hp', state.hp);
    set('mo-n', state.rpm);
    set('mo-d', state.dIn);
    set('mo-l', state.lIn);
  },
  compute(state) {
    const hp = Math.max(state.hp, 0.25);
    const rpm = Math.max(state.rpm, 60);
    const dIn = Math.max(state.dIn, 0.25);
    const lIn = Math.max(state.lIn, 0.5);
    const shaft = motorShaft(hp, rpm, dIn, lIn);
    return {
      tau: shaft.tauMax, phi: shaft.phi, T: shaft.T, gap: shaft.gap,
      dIn, lIn,
    };
  },
  draw(canvas, state) {
    const B = begin(canvas);
    const dIn = Math.max(state.dIn, 0.25);
    const ro = (dIn * M_PER_IN) / 2;
    const J = polarJ(ro, 0);
    const T = torqueFromHorsepower(Math.max(state.hp, 0.25), Math.max(state.rpm, 60)).T;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const rho = (ro * i) / 24;
      pts.push([(rho / M_PER_IN), torsionShear(T, rho, J) / KSI]);
    }
    const yHi = Math.max(pts[pts.length - 1][1], 0.1);
    const P = plotIn(B, B.free, { lo: 0, hi: (dIn / 2) * 1.08 }, { lo: 0, hi: yHi * 1.15 });
    axes(P, { xLabel: 'radius (in)', yLabel: 'shear stress (ksi)' });
    line(P, pts, { color: C.teal, width: 3 });
    dot(P, dIn / 2, pts[pts.length - 1][1], { color: C.gold, r: 5 });
  },
  law() {
    return [String.raw`\tau=\frac{Tc}{J}`];
  },
  liveRows(state, c) {
    return [
      kv('shear stress', `${fig(c.tau / KSI)} ksi`),
      kv('angle of twist', `${fig((c.phi * 180) / Math.PI)}°`),
      kv('torque', `${fig(c.T)} N·m`),
      kv('length', `${fig(state.lIn)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['shear', `${fig(c.tau / KSI)} ksi`],
      ['angle', `${fig((c.phi * 180) / Math.PI)}°`],
      ['torque', `${fig(c.T)} N·m`],
      ['diameter', `${fig(state.dIn)} in`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.scenarioId === 'stub' ? 'The stub barely twists' : 'Length changes the angle only',
    body: `The shear stress is ${fig(c.tau / KSI)} ksi and the angle is ${fig((c.phi * 180) / Math.PI)}°. Stress follows the torque and the diameter. The ${fig(state.lIn)} in length is in the angle and not in the stress.`,
  })),
});
