/**
 * Application lab: a car hits a parked truck, and the truck’s skid gives the speeds.
 * Shows that a skid length is a speed, and momentum then gives the car’s speed before the hit.
 *
 * The truck stops under friction, so v = √(2μgd). The book’s reading is that the car stops and the
 * truck takes all the momentum. A second reading is that they stick and skid together. The check
 * steps the skid and searches for the speed whose distance is the measured one, and checks the
 * work of friction against the truck’s kinetic energy.
 * Numbers from OpenStax University Physics Vol. 1 §9.4, "Analyzing a Car Crash": 1200 kg, 3000 kg,
 * 10 m, μ = 0.62. The book rounds √(2μgd) to 11.0 m/s and prints 27.5 m/s for the car.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const VEL = QUANTITY_COLORS.v;
const MODELS = [['stop', 'The car stops, the truck skids'], ['stick', 'They stick and skid as one']];

const SCENARIOS = [
  { id: 'book', name: 'The book’s crash: 1200 kg into a parked 3000 kg truck, 10 m, μ = 0.62', model: 'stop', mc: 1200, mt: 3000, d: 10, mu: 0.62 },
  { id: 'stick', name: 'The same crash, if they had stuck', model: 'stick', mc: 1200, mt: 3000, d: 10, mu: 0.62 },
  { id: 'long', name: 'A longer skid, 20 m', model: 'stop', mc: 1200, mt: 3000, d: 20, mu: 0.62 },
];

function skidDistance(speed, mu) {
  if (!(speed > 0)) return 0;
  const a = -mu * G;
  const n = 2000;
  const dt = (-speed / a) / n;
  let x = 0;
  let vel = speed;
  for (let i = 0; i < n; i += 1) {
    x += (vel + 0.5 * a * dt) * dt;
    vel += a * dt;
  }
  return x;
}

/** The speed whose stepped skid equals the measured length. */
function speedFromSkid(mu, d) {
  let lo = 0;
  let hi = 1;
  while (skidDistance(hi, mu) < d) hi *= 2;
  for (let i = 0; i < 50; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (skidDistance(mid, mu) < d) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function fromSpeed(state, vT) {
  const vC = state.model === 'stick' ? ((state.mc + state.mt) / state.mc) * vT : (state.mt / state.mc) * vT;
  const work = state.mu * state.mt * G * state.d;
  const K = 0.5 * state.mt * vT * vT;
  return { vT, vC, work, K };
}

function closed(state) {
  return fromSpeed(state, Math.sqrt(2 * state.mu * G * state.d));
}

function searched(state) {
  return fromSpeed(state, speedFromSkid(state.mu, state.d));
}

function block() {
  return fatLine(new Array(15).fill(0), { color: M.blue, width: 3 });
}

export default defineLab({
  id: 'crash-reconstruction',
  exam: 'u5',
  title: 'Crash reconstruction',
  hint: 'The skid length gives the truck’s speed after the hit. Momentum gives the car’s speed before it.',
  orbit: false,
  fit: { w: 12.2, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, -0.3, 24), target: new THREE.Vector3(0, -0.3, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'crash-length',
      scenario: 'book',
      ask: 'Double the skid length, at the same friction. What happens to the truck’s speed, and to the car’s speed?',
      apply(s) { s.d *= 2; },
      factors: [1.414, 2, 4],
      watch: [
        { id: 'vT', label: 'the truck’s speed', get: (c) => c.vT, mode: 'factor' },
        { id: 'vC', label: 'the car’s speed', get: (c) => c.vC, mode: 'factor' },
      ],
      expect: { vT: 1.414, vC: 1.414 },
      why: String.raw`The skid speed is $\sqrt{2\mu g d}$. Twice the distance multiplies the speed by $\sqrt{2}$, about 1.414, not by 2. The car’s speed is a fixed multiple of the truck’s, so it scales the same way.`,
    },
    {
      id: 'crash-mass',
      scenario: 'book',
      ask: 'Double the truck’s mass. The car still stops dead. What happens to the two speeds?',
      apply(s) { s.mt *= 2; },
      watch: [
        { id: 'vT', label: 'the truck’s speed', get: (c) => c.vT },
        { id: 'vC', label: 'the car’s speed', get: (c) => c.vC, mode: 'factor' },
      ],
      mode: 'dir',
      expect: { vT: 'same', vC: 2 },
      why: String.raw`The skid speed depends on $\mu$, $g$ and the distance. The mass cancels. In this reading the car’s momentum equals the truck’s, so twice the truck’s mass means twice the car’s speed.`,
    },
    {
      id: 'crash-stick',
      scenario: 'book',
      ask: 'Suppose instead that the car stuck to the truck, and the pair skidded 10 m. What happens to the car’s speed before the hit?',
      apply(s) { s.model = 'stick'; },
      watch: [{ id: 'vC', label: 'the car’s speed before the hit', get: (c) => c.vC }],
      mode: 'dir',
      expect: { vC: 'bigger' },
      why: 'The skid is now the shared speed, not the truck’s alone. The car had to be carrying the momentum of both masses, so its speed before the hit comes out higher.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('book', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('cr-model', 'Reading', MODELS, 'stop')}${sliderRow('cr-mc', 'Car mass (kg)', 1200, 400, 3000, 50)}${sliderRow('cr-mt', 'Truck mass (kg)', 3000, 500, 6000, 50)}${sliderRow('cr-d', 'Skid length (m)', 10, 1, 40, 0.5)}${sliderRow('cr-mu', 'Friction μ', 0.62, 0.1, 1, 0.01)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'cr-model', (s, v) => { s.model = v; });
    bindSlider(api, 'cr-mc', (s, v) => { s.mc = v; });
    bindSlider(api, 'cr-mt', (s, v) => { s.mt = v; });
    bindSlider(api, 'cr-d', (s, v) => { s.d = v; });
    bindSlider(api, 'cr-mu', (s, v) => { s.mu = v; });
  },
  syncControls(state) {
    putSelect('cr-model', state.model);
    putSlider('cr-mc', state.mc, 0);
    putSlider('cr-mt', state.mt, 0);
    putSlider('cr-d', state.d, 1);
    putSlider('cr-mu', state.mu, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const road = fatLine([-5.2, 0.2, 0, 5.2, 0.2, 0], { color: M.greyDark, width: 2.5 });
    const skid = fatLine([-1, 0.2, 0, 2, 0.2, 0], { color: M.gold, width: 4 });
    const bodies = [block(), block()];
    bodies[1].material = bodies[1].material.clone();
    const arrows = [0, 1].map(() => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, VEL, undefined, undefined, 0.018));
    const names = ['car', 'truck'].map((t) => label(t, 0, 0, 0, 'graph-axis'));
    group.add(road, skid, ...bodies, ...arrows, ...names);
    group.visible = false;
    return { group, skid, bodies, arrows, names };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    Object.assign(computed, closed(state));
  },
  second(state) {
    return searched(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.bodies) return;
    ctx.grid.visible = false;
    const y = 0.2;
    const setBlock = (line, x, w, color) => {
      line.material.color.set(color);
      updateFatLine(line, [x - w, y, 0.02, x + w, y, 0.02, x + w, y + 0.7, 0.02, x - w, y + 0.7, 0.02, x - w, y, 0.02]);
    };
    setBlock(h.bodies[0], -2.3, 0.42, M.blue);
    setBlock(h.bodies[1], 1.6, 0.62, M.gold);
    h.names[0].position.set(-2.3, 1.2, 0);
    h.names[1].position.set(1.6, 1.25, 0);
    const len = Math.min(3.2, 0.22 * state.d);
    updateFatLine(h.skid, [1.6, y + 0.02, 0.03, 1.6 + len, y + 0.02, 0.03]);
    const scale = 1.6 / Math.max(computed.vT, computed.vC, 5);
    placeArrow(h.arrows[0], -3.6, 1.55, -3.6 + computed.vC * scale, 1.55, 0.08);
    placeArrow(h.arrows[1], 1.6, 1.7, 1.6 + computed.vT * scale, 1.7, 0.08);
  },
  law(state) {
    const share = state.model === 'stick' ? String.raw`m_c v_c = (m_c+m_t)v_t` : String.raw`m_c v_c = m_t v_t`;
    return [String.raw`v_t = \sqrt{2\mu g d}`, share];
  },
  readoutCells(_state, computed) {
    return [
      ['Truck speed after', `${fmt(computed.vT)} m/s`],
      ['Car speed before', `${fmt(computed.vC)} m/s`],
      ['Work by friction', `${fmt(computed.work)} J`],
      ['Truck kinetic energy', `${fmt(computed.K)} J`],
    ];
  },
  coach(state, computed) {
    const reading = state.model === 'stick'
      ? 'This reading locks the car to the truck. The skid speed is the shared speed, so the car was faster before the hit than in the book’s reading.'
      : 'This is the book’s reading: the car stops, and the truck carries the whole momentum away into the skid.';
    return {
      title: 'A skid is a speed',
      body: [
        String.raw`Friction $\mu = ${fmt(state.mu, 2)}$ over $${fmt(state.d)}$ m means the truck was moving at $${fmt(computed.vT)}$ m/s just after the hit. The car’s speed before it was $${fmt(computed.vC)}$ m/s.`,
        reading,
        String.raw`<b>What the course model leaves out.</b> A real skid is not one constant $\mu$, the vehicles can spin, and energy also goes into bending metal. The book rounds $\sqrt{2\mu g d}$ to 11.0 m/s and prints 27.5 m/s for the car. The unrounded truck speed is 11.03 m/s.`,
      ],
    };
  },
});
