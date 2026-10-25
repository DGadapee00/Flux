/** A block on a straight incline. Static friction holds, or kinetic friction slides. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { incline } from '@flux/subjects/mechanics/dynamics.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'down', name: 'Sliding down', m: 2, theta: 30, mu: 0.1, motion: 'down' },
  { id: 'up', name: 'Sliding up', m: 2, theta: 30, mu: 0.1, motion: 'up' },
  { id: 'rest', name: 'Set down at rest', m: 2, theta: 25, mu: 0.3, motion: 'rest' },
];

export default defineLab({
  id: 'incline',
  exam: 'u3',
  title: 'Incline',
  hint: 'Steepen the slope, or raise the friction, and see whether the block still slides.',
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'incline-steep',
      scenario: 'down',
      ask: String.raw`Raise the angle from $30^\circ$ to $50^\circ$. Leave the friction where it is.`,
      apply(s) { s.theta = 50; },
      watch: [
        { id: 'a', label: 'the acceleration down the plane', get: (c) => c.a },
        { id: 'N', label: 'the normal force', get: (c) => c.N },
      ],
      mode: 'dir',
      expect: { a: 'bigger', N: 'smaller' },
      why: String.raw`A steeper slope puts more of the weight along the plane and less of it into the surface. The block speeds up faster, and the normal force drops.`,
    },
    {
      id: 'incline-mu',
      scenario: 'down',
      ask: 'Raise the coefficient of friction from 0.1 to 0.4.',
      apply(s) { s.mu = 0.4; },
      watch: [
        { id: 'a', label: 'the acceleration down the plane', get: (c) => c.a },
      ],
      mode: 'dir',
      expect: { a: 'smaller' },
      why: String.raw`Kinetic friction points up the plane while the block slides down. More friction cancels more of the downhill part of the weight.`,
    },
    {
      id: 'incline-hold',
      scenario: 'rest',
      ask: 'Raise the coefficient of static friction from 0.3 to 0.8. Does the block stay put?',
      apply(s) { s.mu = 0.8; },
      watch: [
        { id: 'holds', label: 'Does it stay put?', get: (c) => c.holds, mode: 'bool' },
      ],
      expect: { holds: true },
      why: String.raw`It stays put when $\mu_s \ge \tan\theta$. At this angle 0.3 is below the tangent and 0.8 is above it.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('down', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('in-m', 'Mass (kg)', 2, 0.5, 10, 0.5)}${sliderRow('in-theta', 'Angle (°)', 30, 5, 60, 1)}${sliderRow('in-mu', 'Coefficient of friction', 0.1, 0, 1.2, 0.05)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'in-m', (s, v) => { s.m = v; });
    bindSlider(api, 'in-theta', (s, v) => { s.theta = v; });
    bindSlider(api, 'in-mu', (s, v) => { s.mu = v; });
  },
  syncControls(state) {
    putSlider('in-m', state.m, 1);
    putSlider('in-theta', state.theta, 0);
    putSlider('in-mu', state.mu, 2);
  },
  recompute(state, computed) {
    const block = incline({ mass: state.m, thetaDeg: state.theta, mu: state.mu, g: G, motion: state.motion });
    computed.a = block.aDown;
    computed.N = block.N;
    computed.f = block.f;
    computed.holds = block.holds;
  },
  second(state) {
    const th = state.theta * Math.PI / 180;
    const N = state.m * G * Math.cos(th);
    const down = state.m * G * Math.sin(th);
    if (state.motion === 'rest') {
      const holds = state.mu * N + 1e-9 >= down;
      return { a: holds ? 0 : (down - state.mu * N) / state.m, N, f: holds ? down : state.mu * N, holds };
    }
    const f = state.mu * N;
    const a = state.motion === 'up' ? (down + f) / state.m : (down - f) / state.m;
    return { a, N, f, holds: false };
  },
  law(state) {
    if (state.motion === 'rest') return [String.raw`It holds when $\mu_s \ge \tan\theta$.`];
    if (state.motion === 'up') return [String.raw`$a = g(\sin\theta + \mu_k\cos\theta)$, downhill.`];
    return [String.raw`$a = g(\sin\theta - \mu_k\cos\theta)$, downhill.`];
  },
  readout(state, computed) {
    const hold = state.motion === 'rest' ? (computed.holds ? 'It stays put.' : 'Static friction cannot hold it.') : 'It is sliding.';
    return String.raw`${hold} Acceleration down the plane $${fmt(computed.a)}$ m/s². Normal force $${fmt(computed.N)}$ N. Friction $${fmt(computed.f)}$ N.`;
  },
  coach() {
    return {
      title: 'Along the plane, and into it',
      body: String.raw`The weight splits into $mg\sin\theta$ down the plane and $mg\cos\theta$ into the surface. Kinetic friction is $\mu_k N$ and opposes the slide. At rest, friction matches the downhill part of the weight until $\mu_s N$ is not enough.`,
    };
  },
});
