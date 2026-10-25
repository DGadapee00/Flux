/**
 * Application lab: a skydiver in free fall, then under a canopy.
 *
 * Shows the terminal speed in each phase, v_t = √(2mg/ρCA), and why the canopy slows the jumper: it
 * multiplies the drag area C·A many times over, and v_t falls as its square root. After the canopy
 * opens, the jumper is faster than the new terminal speed, so drag beats the weight and slows them.
 *
 * Numbers: OpenStax University Physics Vol. 1 §6.4, "Terminal Velocity of a Skydiver": 85 kg,
 * spread-eagle, A = 0.70 m², C = 1.0, ρ = 1.21 kg/m³; the book prints 44 m/s. Head first, from the same
 * section: 75 kg, A = 0.18 m², C = 0.70, 98 m/s. A 50 kg skydiver spread-eagle (its Check Your
 * Understanding) reaches 34 m/s. The canopy's drag area, C·A = 25 m², is an illustrative value, not a
 * manufacturer's: it lands the 85 kg jumper at about 7 m/s.
 * The closed form is `quadraticFall` in two pieces (tanh, then coth from the opening speed). The
 * check integrates m dv/dt = mg − ½ρCAv² with RK4 through both pieces.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { dragConstant, quadraticFall, rk4Line, terminalSpeed } from '@flux/subjects/mechanics/drag.js';
import { M, createGraph, fatLine, graphSegment, label, niceRange, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const RHO = 1.21;

const SCENARIOS = [
  { id: 'spread', name: 'Spread-eagle: 85 kg, 0.70 m², C = 1.0', m: 85, C: 1, A: 0.7, canopy: 25, td: 20, T: 30 },
  { id: 'headfirst', name: 'Head first: 75 kg, 0.18 m², C = 0.70', m: 75, C: 0.7, A: 0.18, canopy: 25, td: 20, T: 30 },
  { id: 'light', name: 'A 50 kg jumper, spread-eagle', m: 50, C: 1, A: 0.7, canopy: 25, td: 20, T: 30 },
];

function phases(s) {
  const k1 = dragConstant({ rho: RHO, C: s.C, A: s.A });
  const k2 = 0.5 * RHO * s.canopy;
  const open = quadraticFall({ m: s.m, k: k1, g: G, v0: 0, t: s.td });
  const at = (t) => (t <= s.td
    ? quadraticFall({ m: s.m, k: k1, g: G, v0: 0, t })
    : (() => {
      const r = quadraticFall({ m: s.m, k: k2, g: G, v0: open.v, t: t - s.td });
      return { v: r.v, y: open.y + r.y };
    })());
  return { k1, k2, open, at, vt1: terminalSpeed({ m: s.m, g: G, k: k1 }), vt2: terminalSpeed({ m: s.m, g: G, k: k2 }) };
}

export default defineLab({
  id: 'skydiver',
  exam: 'u3',
  title: 'Skydiver',
  app: true,
  hint: 'Change the body position, the mass and when the canopy opens.',
  orbit: false,
  fit: { w: 12.4, h: 8.4 },
  camera: { pos: new THREE.Vector3(0, -0.2, 22), target: new THREE.Vector3(0, -0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'sky-headfirst',
      scenario: 'spread',
      ask: String.raw`The jumper tucks into a head-first dive: the area drops from $0.70$ to $0.18\ \mathrm{m^2}$ and $C$ from 1.0 to 0.70. What happens to the free-fall terminal speed?`,
      apply(s) { s.A = 0.18; s.C = 0.7; },
      watch: [{ id: 'vt1', label: 'the terminal speed in free fall', get: (c) => c.vt1 }],
      mode: 'dir',
      expect: { vt1: 'bigger' },
      why: String.raw`$v_t = \sqrt{2mg/\rho CA}$, and $CA$ has fallen from 0.70 to 0.126 m², a factor of 5.6. The terminal speed grows by $\sqrt{5.6} = 2.4$, from 44 to 105 m/s.`,
    },
    {
      id: 'sky-heavy',
      scenario: 'spread',
      ask: String.raw`A jumper with twice the mass, gear included, uses the same canopy. What happens to the landing speed?`,
      apply(s) { s.m *= 2; },
      watch: [{ id: 'vt2', label: 'the speed under the canopy', get: (c) => c.vt2 }],
      mode: 'dir',
      expect: { vt2: 'bigger' },
      why: String.raw`Under the canopy $v_t = \sqrt{2mg/\rho CA}$, so twice the mass lands $\sqrt 2$ times as fast: 10.5 m/s instead of 7.4. That is why canopies are sized to the jumper's weight.`,
    },
    {
      id: 'sky-late',
      scenario: 'spread',
      ask: String.raw`The jumper opens the canopy $5\ \mathrm{s}$ later, at $25\ \mathrm{s}$ instead of $20$. How does the speed $30\ \mathrm{s}$ into the jump compare?`,
      apply(s) { s.td = 25; },
      watch: [{ id: 'vEnd', label: 'the speed at 30 s', get: (c) => c.vEnd }],
      mode: 'dir',
      expect: { vEnd: 'same' },
      why: String.raw`Either way the canopy has had several seconds to work, and the speed has settled at the canopy's terminal speed, 7.4 m/s. The time constant under the canopy is only $v_t/g = 0.76$ s.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('spread', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('sk-m', 'Mass with gear (kg)', 85, 30, 200, 0.5)}${sliderRow('sk-A', 'Area facing the air in free fall (m²)', 0.7, 0.1, 1.2, 0.01)}${sliderRow('sk-C', 'Drag coefficient in free fall, C', 1, 0.3, 1.3, 0.05)}${sliderRow('sk-canopy', 'Canopy drag area, C·A (m²)', 25, 5, 60, 0.5)}${sliderRow('sk-td', 'Canopy opens at (s)', 20, 2, 28, 0.5)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'sk-m', (s, x) => { s.m = x; });
    bindSlider(api, 'sk-A', (s, x) => { s.A = x; });
    bindSlider(api, 'sk-C', (s, x) => { s.C = x; });
    bindSlider(api, 'sk-canopy', (s, x) => { s.canopy = x; });
    bindSlider(api, 'sk-td', (s, x) => { s.td = x; });
  },
  syncControls(state) {
    putSlider('sk-m', state.m, 1);
    putSlider('sk-A', state.A, 2);
    putSlider('sk-C', state.C, 2);
    putSlider('sk-canopy', state.canopy, 1);
    putSlider('sk-td', state.td, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.6, y: -3.4, w: 11.2, h: 6.4, color: QUANTITY_COLORS.v, name: '', xName: 'time <i>t</i> (s)' });
    // The title sits at the right: the top-left corner is under the course panel on a laptop.
    const title = label(String.raw`<i>v</i> (m/s), downward`, 3.6, 3.35, 0, 'graph-title');
    const canopy = fatLine([0, 0, 0, 1, 0, 0], { color: M.yellow, width: 2 });
    const canopyName = label('terminal speed under the canopy', 2.6, 0, 0, 'graph-axis');
    const openName = label('canopy opens', 0, 0, 0, 'graph-axis');
    group.add(title, canopy, canopyName, openName);
    group.visible = false;
    return { group, graph, canopy, canopyName, openName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const p = phases(state);
    computed.vt1 = p.vt1;
    computed.vt2 = p.vt2;
    computed.vOpen = p.open.v;
    computed.yOpen = p.open.y;
    const end = p.at(state.T);
    computed.vEnd = end.v;
    computed.yEnd = end.y;
    computed.ratio = p.vt1 / p.vt2;
  },
  second(state) {
    const p = phases(state);
    const before = rk4Line((v) => G - (p.k1 / state.m) * v * v, { v0: 0, t1: state.td, steps: 8000 });
    const after = rk4Line((v) => G - (p.k2 / state.m) * v * v, { v0: before.v, t1: state.T - state.td, steps: 20000 });
    return { vOpen: before.v, yOpen: before.y, vEnd: after.v, yEnd: before.y + after.y, vt1: Math.sqrt((2 * state.m * G) / (RHO * state.C * state.A)) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const p = phases(state);
    const [lo, hi] = niceRange([0, computed.vt1 * 1.1, computed.vOpen * 1.05]);
    h.graph.set({ t0: 0, t1: state.T, lo, hi, f: (t) => p.at(t).v });
    h.graph.mark(state.td, computed.vOpen);
    graphSegment(h.canopy, h.graph, { t0: 0, v0: computed.vt2, t1: state.T, v1: computed.vt2, lo, hi });
    h.canopyName.position.set(h.graph.sx(state.T * 0.3), h.graph.sy(computed.vt2) + 0.3, 0);
    h.openName.position.set(h.graph.sx(state.td) + 1.05, h.graph.sy(computed.vOpen) + 0.3, 0);
  },
  law: () => [
    String.raw`m\dfrac{dv}{dt} = mg - \tfrac12\rho C A v^2`,
    String.raw`v_t = \sqrt{\dfrac{2mg}{\rho CA}}`,
  ],
  readoutCells(state, computed) {
    return [
      ['Terminal speed in free fall', `${fmt(computed.vt1)} m/s, ${fmt(computed.vt1 * 3.6, 3)} km/h`],
      ['Terminal speed under the canopy', `${fmt(computed.vt2)} m/s`],
      ['Speed when the canopy opens', `${fmt(computed.vOpen)} m/s, after ${fmt(computed.yOpen, 4)} m`],
      [`Speed at ${fmt(state.T, 3)} s`, `${fmt(computed.vEnd)} m/s`],
      ['Distance fallen by then', `${fmt(computed.yEnd)} m`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The canopy multiplies the drag area',
      body: [
        String.raw`In free fall drag grows as $v^2$ until $\tfrac12\rho CAv^2 = mg$: at $v_t = ${fmt(computed.vt1, 4)}$ m/s the jumper stops speeding up. Most of that speed is reached in the first ten seconds.`,
        String.raw`The canopy raises the drag area $CA$ from $${fmt(state.C * state.A, 3)}$ to $${fmt(state.canopy, 3)}\ \mathrm{m^2}$. At the opening speed drag is now far more than the weight, so the net force points up and the jumper slows, until drag falls back to $mg$ at $${fmt(computed.vt2, 3)}$ m/s. The terminal speed fell by $\sqrt{${fmt(state.canopy / (state.C * state.A), 3)}} = ${fmt(computed.ratio, 3)}$. The yellow line marks it.`,
        String.raw`<b>What the course model leaves out.</b> A real canopy opens over two or three seconds, not at once; the model's sudden opening overstates the jolt. The air is denser near the ground than at jump altitude, so terminal speed falls as the jumper descends. A ram-air canopy also glides forward, and the jumper steers it. The canopy's drag area here is an illustrative value, not a maker's figure.`,
      ],
    };
  },
});
