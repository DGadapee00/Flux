/** Launch angle against range. Drag is left out: the acceleration is constant. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { projectile } from '@flux/subjects/mechanics/kinematics.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'level', name: 'Level ground, 30°', v0: 12, theta: 30, y0: 0 },
  { id: 'steep', name: 'Level ground, 60°', v0: 12, theta: 60, y0: 0 },
  { id: 'cliff', name: 'Horizontal throw off a cliff', v0: 8, theta: 0, y0: 20 },
];

function timeToLand(vy, y0) {
  const A = -0.5 * G;
  const disc = vy * vy - 4 * A * y0;
  const s = Math.sqrt(Math.max(0, disc));
  return Math.max((-vy + s) / (2 * A), (-vy - s) / (2 * A));
}

export default defineLab({
  id: 'projectile',
  exam: 'u2',
  title: 'Projectile',
  hint: 'Drag is left out. Change the angle and the launch speed, and watch the range.',
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'projectile-complement',
      scenario: 'level',
      ask: String.raw`Change the launch angle from $30^\circ$ to $60^\circ$, at the same speed.`,
      apply(s) { s.theta = 60; },
      watch: [
        { id: 'range', label: 'the range', get: (c) => c.range },
        { id: 'hMax', label: 'the highest point', get: (c) => c.hMax },
      ],
      mode: 'dir',
      expect: { range: 'same', hMax: 'bigger' },
      why: String.raw`On level ground the range depends on $\sin 2\theta$. That sine is the same at $30^\circ$ and at $60^\circ$. The steeper launch climbs higher.`,
    },
    {
      id: 'projectile-speed',
      scenario: 'level',
      ask: 'Double the launch speed. Leave the angle at $30^\\circ$.',
      apply(s) { s.v0 *= 2; },
      watch: [
        { id: 'range', label: 'the range', get: (c) => c.range, mode: 'factor' },
        { id: 'tFlight', label: 'the time in the air', get: (c) => c.tFlight, mode: 'factor' },
      ],
      expect: { range: 4, tFlight: 2 },
      why: String.raw`Range and the square of the speed go together, so twice the speed means four times the range. The time in the air grows with the speed itself, so it doubles.`,
    },
    {
      id: 'projectile-cliff',
      scenario: 'cliff',
      ask: 'Double the height of the cliff. Keep the throw horizontal.',
      apply(s) { s.y0 *= 2; },
      watch: [
        { id: 'tFlight', label: 'the time in the air', get: (c) => c.tFlight },
        { id: 'range', label: 'how far it lands', get: (c) => c.range },
      ],
      mode: 'dir',
      expect: { tFlight: 'bigger', range: 'bigger' },
      why: String.raw`It has farther to fall, so it is in the air longer. The horizontal speed never changes, and a longer time carries it farther.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('level', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('pj-v0', 'Launch speed (m/s)', 12, 1, 40, 0.5)}${sliderRow('pj-theta', 'Angle above the horizontal (°)', 30, 0, 80, 1)}${sliderRow('pj-y0', 'Height of the launch (m)', 0, 0, 40, 0.5)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'pj-v0', (s, v) => { s.v0 = v; });
    bindSlider(api, 'pj-theta', (s, v) => { s.theta = v; });
    bindSlider(api, 'pj-y0', (s, v) => { s.y0 = v; });
  },
  syncControls(state) {
    putSlider('pj-v0', state.v0, 1);
    putSlider('pj-theta', state.theta, 0);
    putSlider('pj-y0', state.y0, 1);
  },
  recompute(state, computed) {
    const shot = projectile({ v0: state.v0, thetaDeg: state.theta, g: G, y0: state.y0, yLand: 0 });
    computed.range = shot.range;
    computed.hMax = shot.hMax;
    computed.tFlight = shot.tFlight;
    computed.speed = shot.land ? shot.land.speed : NaN;
  },
  second(state) {
    const th = state.theta * Math.PI / 180;
    const vx = state.v0 * Math.cos(th);
    const vy = state.v0 * Math.sin(th);
    const t = timeToLand(vy, state.y0);
    const vyLand = vy - G * t;
    return {
      range: vx * t,
      hMax: state.y0 + (vy > 0 ? (vy * vy) / (2 * G) : 0),
      tFlight: t,
      speed: Math.hypot(vx, vyLand),
    };
  },
  law() {
    return [String.raw`R = \dfrac{v_0^2 \sin 2\theta}{g}\quad\text{(level ground)}`];
  },
  readoutCells(_state, computed) {
    return [
      ['Range', `${fmt(computed.range)} m`],
      ['Highest point', `${fmt(computed.hMax)} m`],
      ['Time in the air', `${fmt(computed.tFlight)} s`],
      ['Landing speed', `${fmt(computed.speed)} m/s`],
    ];
  },
  coach() {
    return {
      title: 'Where it lands',
      body: String.raw`The range on level ground is largest at $45^\circ$. A $30^\circ$ launch and a $60^\circ$ launch land in the same place, and the steeper one goes higher. Drag is left out, so the acceleration is $g$, straight down, the whole way.`,
    };
  },
});
