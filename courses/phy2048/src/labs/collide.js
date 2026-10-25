/** One-dimensional collision. The slider is the coefficient of restitution, from elastic to stuck. */
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { collide1D } from '@flux/subjects/mechanics/momentum.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'exchange', name: 'Equal masses, elastic', m1: 2, m2: 2, u1: 4, u2: 0, e: 1 },
  { id: 'stick', name: 'Equal masses, they stick', m1: 2, m2: 2, u1: 4, u2: 0, e: 0 },
  { id: 'heavy', name: 'Heavy target, elastic', m1: 2, m2: 6, u1: 4, u2: 0, e: 1 },
];

export default defineLab({
  id: 'collide',
  exam: 'u5',
  title: 'Collisions',
  hint: 'Slide the restitution from 1 (elastic) to 0 (they stick). Momentum is kept either way.',
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'collide-stick',
      scenario: 'exchange',
      ask: 'Drop the restitution from 1 to 0, so the masses stick.',
      apply(s) { s.e = 0; },
      watch: [
        { id: 'lost', label: 'the kinetic energy lost', get: (c) => c.lost },
      ],
      mode: 'dir',
      expect: { lost: 'bigger' },
      why: String.raw`An elastic collision keeps the kinetic energy. Sticking does not. Momentum is conserved in both.`,
    },
    {
      id: 'collide-speed',
      scenario: 'exchange',
      ask: 'Double the incoming speed. Leave the collision elastic.',
      apply(s) { s.u1 *= 2; },
      watch: [
        { id: 'v2', label: 'the target\'s final speed', get: (c) => c.v2, mode: 'factor' },
        { id: 'K', label: 'the kinetic energy afterward', get: (c) => c.K, mode: 'factor' },
      ],
      expect: { v2: 2, K: 4 },
      why: String.raw`Every velocity in this collision scales with the incoming speed, so the target leaves twice as fast. Kinetic energy scales with the square of the speed, so it becomes four times as large.`,
    },
    {
      id: 'collide-heavy',
      scenario: 'exchange',
      ask: 'Make the target three times as heavy. Keep the collision elastic.',
      apply(s) { s.m2 = 6; },
      watch: [
        { id: 'v1', label: 'the incoming mass\'s final velocity', get: (c) => c.v1, mode: 'dir', signed: true },
      ],
      expect: { v1: 'smaller' },
      why: String.raw`Equal masses exchange velocities, so the incoming mass stops. A heavier target sends it back, and the velocity changes sign.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('exchange', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('co-m1', 'Incoming mass (kg)', 2, 0.5, 8, 0.5)}${sliderRow('co-m2', 'Target mass (kg)', 2, 0.5, 8, 0.5)}${sliderRow('co-u1', 'Incoming speed (m/s)', 4, 0, 12, 0.5)}${sliderRow('co-u2', 'Target speed (m/s)', 0, -6, 6, 0.5)}${sliderRow('co-e', 'Restitution e', 1, 0, 1, 0.05)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'co-m1', (s, v) => { s.m1 = v; });
    bindSlider(api, 'co-m2', (s, v) => { s.m2 = v; });
    bindSlider(api, 'co-u1', (s, v) => { s.u1 = v; });
    bindSlider(api, 'co-u2', (s, v) => { s.u2 = v; });
    bindSlider(api, 'co-e', (s, v) => { s.e = v; });
  },
  syncControls(state) {
    putSlider('co-m1', state.m1, 1);
    putSlider('co-m2', state.m2, 1);
    putSlider('co-u1', state.u1, 1);
    putSlider('co-u2', state.u2, 1);
    putSlider('co-e', state.e, 2);
  },
  recompute(state, computed) {
    const hit = collide1D(state.m1, state.m2, state.u1, state.u2, state.e);
    const K0 = kineticEnergy(state.m1, state.u1) + kineticEnergy(state.m2, state.u2);
    const K = kineticEnergy(state.m1, hit.v1) + kineticEnergy(state.m2, hit.v2);
    computed.v1 = hit.v1;
    computed.v2 = hit.v2;
    computed.K0 = K0;
    computed.K = K;
    computed.lost = K0 - K;
  },
  second(state) {
    const { m1, m2, u1, u2, e } = state;
    const p = m1 * u1 + m2 * u2;
    const rel = e * (u1 - u2);
    const det = m1 + m2;
    const v1 = (p - m2 * rel) / det;
    const v2 = (p + m1 * rel) / det;
    const K0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const K = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    return { v1, v2, K0, K, lost: K0 - K };
  },
  law() {
    return [String.raw`$m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$, and $v_2 - v_1 = e(u_1 - u_2)$.`];
  },
  readout(_state, computed) {
    return String.raw`After: $${fmt(computed.v1)}$ m/s and $${fmt(computed.v2)}$ m/s. Kinetic energy $${fmt(computed.K0)}$ J before, $${fmt(computed.K)}$ J after. Lost $${fmt(computed.lost)}$ J.`;
  },
  coach() {
    return {
      title: 'Restitution',
      body: String.raw`$e = 1$ keeps the kinetic energy. $e = 0$ means the two masses leave together. Values between are a collision that keeps the momentum and loses some kinetic energy.`,
    };
  },
});
