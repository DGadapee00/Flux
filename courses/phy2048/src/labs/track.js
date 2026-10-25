/**
 * Energy on a frictionless track. The bars are gravitational energy, kinetic
 * energy, and the total. Friction is left out, so the total does not change.
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { gravitationalEnergy, speedFromEnergy } from '@flux/subjects/mechanics/energy.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'top', name: 'Released at the top', m: 2, h: 4, y: 4 },
  { id: 'mid', name: 'Halfway down', m: 2, h: 4, y: 2 },
  { id: 'bottom', name: 'At the bottom', m: 2, h: 4, y: 0 },
];

function placed(state) {
  const h = Math.max(0, state.h);
  const y = Math.min(h, Math.max(0, state.y));
  return { m: state.m, h, y };
}

export default defineLab({
  id: 'track',
  exam: 'u4',
  title: 'Energy track',
  hint: 'Move the mass down the track. Friction is left out, so the total energy stays put.',
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'track-down',
      scenario: 'top',
      ask: 'Move the mass from the release height down to halfway.',
      apply(s) { s.y = s.h / 2; },
      watch: [
        { id: 'K', label: 'the kinetic energy', get: (c) => c.K },
        { id: 'U', label: 'the potential energy', get: (c) => c.U },
        { id: 'E', label: 'the total energy', get: (c) => c.E },
      ],
      mode: 'dir',
      expect: { K: 'bigger', U: 'smaller', E: 'same' },
      why: String.raw`The lost potential energy becomes kinetic energy. Nothing else does work, so the total stays at $mgh$.`,
    },
    {
      id: 'track-mass',
      scenario: 'bottom',
      ask: 'Double the mass. Leave it at the bottom.',
      apply(s) { s.m *= 2; },
      watch: [
        { id: 'E', label: 'the total energy', get: (c) => c.E, mode: 'factor' },
        { id: 'v', label: 'the speed', get: (c) => c.v, mode: 'dir' },
      ],
      expect: { E: 2, v: 'same' },
      why: String.raw`Both kinds of energy are proportional to the mass, so they double. The speed comes from $v^2 = 2gh$, and the mass cancels.`,
    },
    {
      id: 'track-height',
      scenario: 'bottom',
      ask: 'Halve the height it was released from. Keep it at the bottom.',
      apply(s) { s.h /= 2; },
      watch: [
        { id: 'E', label: 'the total energy', get: (c) => c.E, mode: 'factor' },
        { id: 'v', label: 'the speed', get: (c) => c.v, mode: 'dir' },
      ],
      expect: { E: 0.5, v: 'smaller' },
      why: String.raw`The total energy is $mgh$, so half the height means half the energy. The speed is $\sqrt{2gh}$, which falls, but not by half.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('mid', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('tr-m', 'Mass (kg)', 2, 0.2, 8, 0.2)}${sliderRow('tr-h', 'Release height (m)', 4, 0.5, 12, 0.5)}${sliderRow('tr-y', 'Height now (m)', 2, 0, 12, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'tr-m', (s, v) => { s.m = v; });
    bindSlider(api, 'tr-h', (s, v) => { s.h = v; });
    bindSlider(api, 'tr-y', (s, v) => { s.y = v; });
  },
  syncControls(state) {
    const y = document.getElementById('tr-y');
    if (!y) return;
    putSlider('tr-m', state.m, 1);
    putSlider('tr-h', state.h, 1);
    y.max = String(state.h);
    putSlider('tr-y', state.y, 1);
  },
  recompute(state, computed) {
    const p = placed(state);
    state.h = p.h;
    state.y = p.y;
    const U = gravitationalEnergy(p.m, G, p.y);
    const E = gravitationalEnergy(p.m, G, p.h);
    computed.U = U;
    computed.K = E - U;
    computed.E = E;
    computed.v = speedFromEnergy({ mass: p.m, u0: E, u: U });
  },
  second(state) {
    const p = placed(state);
    const drop = p.h - p.y;
    return {
      U: p.m * G * p.y,
      K: p.m * G * drop,
      E: p.m * G * p.h,
      v: Math.sqrt(2 * G * drop),
    };
  },
  law() {
    return [String.raw`$mgh = \frac{1}{2}mv^2 + mgy$. Friction is left out.`];
  },
  readout(_state, computed) {
    return String.raw`Potential $${fmt(computed.U)}$ J. Kinetic $${fmt(computed.K)}$ J. Total $${fmt(computed.E)}$ J. Speed $${fmt(computed.v)}$ m/s.`;
  },
  coach() {
    return {
      title: 'The bars trade, and the total holds',
      body: String.raw`Set the potential energy to zero at the bottom. At height $y$ the potential energy is $mgy$ and the kinetic energy is $mg(h-y)$. The speed does not depend on the mass.`,
    };
  },
});
