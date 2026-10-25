/** Torque on a disk, and a disk or a hoop rolling down an incline. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  angularAcceleration, inertiaDisk, inertiaHoop, rollingIncline, torqueMag,
} from '@flux/subjects/mechanics/rotation.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'spin', name: 'Force at the rim of a disk', mode: 'spin', m: 2, R: 0.4, F: 8, theta: 30, shape: 'disk' },
  { id: 'roll', name: 'Disk rolling down', mode: 'roll', m: 2, R: 0.4, F: 8, theta: 30, shape: 'disk' },
  { id: 'hoop', name: 'Hoop rolling down', mode: 'roll', m: 2, R: 0.4, F: 8, theta: 30, shape: 'hoop' },
];

export default defineLab({
  id: 'rotor',
  exam: 'u6',
  title: 'Rotation and torque',
  hint: 'A tangential force spins the disk. On the incline, compare a disk with a hoop.',
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'rotor-force',
      scenario: 'spin',
      ask: 'Double the tangential force.',
      apply(s) { s.F *= 2; },
      watch: [
        { id: 'tau', label: 'the torque', get: (c) => c.tau, mode: 'factor' },
        { id: 'alpha', label: 'the angular acceleration', get: (c) => c.alpha, mode: 'factor' },
      ],
      expect: { tau: 2, alpha: 2 },
      why: String.raw`The force is perpendicular to the radius, so the torque is $RF$ and it doubles. The moment of inertia does not change, so the angular acceleration doubles with the torque.`,
    },
    {
      id: 'rotor-radius',
      scenario: 'spin',
      ask: 'Double the radius. Keep the same force.',
      apply(s) { s.R *= 2; },
      watch: [
        { id: 'tau', label: 'the torque', get: (c) => c.tau, mode: 'factor' },
        { id: 'alpha', label: 'the angular acceleration', get: (c) => c.alpha, mode: 'factor' },
      ],
      expect: { tau: 2, alpha: 0.5 },
      why: String.raw`The torque is $RF$, so it doubles. The disk's moment is $\frac{1}{2}mR^2$, so it becomes four times as large. The angular acceleration is the torque divided by that moment, and it is cut in half.`,
    },
    {
      id: 'rotor-hoop',
      scenario: 'roll',
      ask: 'Replace the disk with a hoop of the same mass and radius.',
      apply(s) { s.shape = 'hoop'; },
      watch: [
        { id: 'a', label: 'the acceleration down the plane', get: (c) => c.a },
      ],
      mode: 'dir',
      expect: { a: 'smaller' },
      why: String.raw`A hoop has $I = mR^2$ about its center, and a disk has half of that. More of the energy goes into spinning, so less is left for moving down the plane.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('spin', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('ro-m', 'Mass (kg)', 2, 0.4, 8, 0.2)}${sliderRow('ro-R', 'Radius (m)', 0.4, 0.1, 1, 0.05)}<div id="ro-force">${sliderRow('ro-F', 'Tangential force (N)', 8, 1, 40, 0.5)}</div><div id="ro-slope">${sliderRow('ro-theta', 'Incline angle (°)', 30, 10, 50, 1)}</div></div>`;
  },
  bind(api) {
    bindSlider(api, 'ro-m', (s, v) => { s.m = v; });
    bindSlider(api, 'ro-R', (s, v) => { s.R = v; });
    bindSlider(api, 'ro-F', (s, v) => { s.F = v; });
    bindSlider(api, 'ro-theta', (s, v) => { s.theta = v; });
  },
  syncControls(state) {
    const force = document.getElementById('ro-force');
    if (!force) return;
    putSlider('ro-m', state.m, 1);
    putSlider('ro-R', state.R, 2);
    putSlider('ro-F', state.F, 1);
    putSlider('ro-theta', state.theta, 0);
    force.hidden = state.mode !== 'spin';
    document.getElementById('ro-slope').hidden = state.mode !== 'roll';
  },
  recompute(state, computed) {
    if (state.mode === 'roll') {
      const I = state.shape === 'hoop' ? inertiaHoop(state.m, state.R) : inertiaDisk(state.m, state.R);
      const roll = rollingIncline({ mass: state.m, radius: state.R, I, thetaDeg: state.theta, g: G });
      computed.tau = null;
      computed.I = I;
      computed.alpha = roll.alpha;
      computed.a = roll.a;
      return;
    }
    const tau = torqueMag(state.R, state.F, 90);
    const I = inertiaDisk(state.m, state.R);
    computed.tau = tau;
    computed.I = I;
    computed.alpha = angularAcceleration(tau, I);
    computed.a = null;
  },
  second(state) {
    if (state.mode === 'roll') {
      const k = state.shape === 'hoop' ? 1 : 0.5;
      const a = (G * Math.sin(state.theta * Math.PI / 180)) / (1 + k);
      const I = k * state.m * state.R * state.R;
      return { tau: null, I, alpha: a / state.R, a };
    }
    const tau = state.R * state.F;
    const I = 0.5 * state.m * state.R * state.R;
    return { tau, I, alpha: tau / I, a: null };
  },
  law(state) {
    if (state.mode === 'roll') return [String.raw`$a = g\sin\theta / (1 + I/(mR^2))$. No slip: $\alpha = a/R$.`];
    return [String.raw`$\tau = RF$ and $\alpha = \tau/I$, with $I = \frac{1}{2}mR^2$ for the disk.`];
  },
  readout(state, computed) {
    if (state.mode === 'roll') {
      const who = state.shape === 'hoop' ? 'Hoop' : 'Disk';
      return String.raw`${who}. Acceleration $${fmt(computed.a)}$ m/s². Angular acceleration $${fmt(computed.alpha)}$ rad/s².`;
    }
    return String.raw`Torque $${fmt(computed.tau)}$ N·m. Moment $${fmt(computed.I)}$ kg·m². Angular acceleration $${fmt(computed.alpha)}$ rad/s².`;
  },
  coach() {
    return {
      title: 'Torque, then rolling',
      body: String.raw`A force at the rim, straight across the radius, has lever arm $R$. On the incline the same moment decides how the gravitational energy is split between moving forward and spinning. A hoop spins more of it away than a disk does.`,
    };
  },
});
