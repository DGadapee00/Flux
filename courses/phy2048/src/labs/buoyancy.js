/**
 * Shows that the buoyant force is the weight of the fluid displaced, and that a floating
 * body sinks until the submerged fraction equals the density ratio.
 *
 * The closed form is Archimedes. The check integrates the pressure over the top and bottom
 * of a vertical cylinder. The side forces cancel.
 *
 * Numbers: OpenStax University Physics Vol. 1 §14.4, "Calculating Average Density"
 * (60.0 kg, 97.0% submerged in fresh water, density 970 kg/m³).
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { buoyantForce, cylinderBuoyancy, submergedFraction } from '@flux/subjects/mechanics/fluids.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;

const base = { rhoObj: 970, rhoF: 1000, mass: 60, height: 0.5 };
const SCENARIOS = [
  { ...base, id: 'woman', name: 'The book’s floating woman' },
  { ...base, id: 'wood', name: 'A light block', rhoObj: 400, mass: 8, height: 0.3 },
  { ...base, id: 'sink', name: 'A block that sinks', rhoObj: 2700, mass: 2.7, height: 0.2 },
];

function closed(state) {
  const fraction = submergedFraction(state.rhoObj, state.rhoF);
  const V = state.mass / state.rhoObj;
  const displaced = fraction * V;
  const weight = state.mass * G;
  const Fb = buoyantForce(state.rhoF, displaced, G);
  return { fraction, V, displaced, weight, Fb, apparent: weight - Fb };
}

function frame(x0, y0, x1, y1) {
  return [x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0, x0, y0, 0];
}

export default defineLab({
  id: 'buoyancy',
  exam: 'u10',
  title: 'Buoyancy',
  hint: 'The buoyant force is the weight of the displaced fluid. A floating body sinks until that force equals its weight, so the submerged fraction is the density ratio.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'buoy-fluid',
      scenario: 'woman',
      ask: 'Double the density of the fluid and leave her density alone. What happens to the submerged fraction?',
      apply(s) { s.rhoF *= 2; },
      watch: [{ id: 'fraction', label: 'the submerged fraction', get: (c) => c.fraction }],
      mode: 'factor',
      factors: [2, 1, 0.5, 0.25],
      expect: { fraction: 0.5 },
      why: 'She still has to displace her own weight. A fluid twice as dense supplies that weight in half the volume.',
    },
    {
      id: 'buoy-mass',
      scenario: 'woman',
      ask: 'Double her mass and leave both densities alone. What happens to the submerged fraction, and to the buoyant force?',
      apply(s) { s.mass *= 2; },
      watch: [
        { id: 'fraction', label: 'the submerged fraction', get: (c) => c.fraction },
        { id: 'Fb', label: 'the buoyant force', get: (c) => c.Fb },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { fraction: 1, Fb: 2 },
      why: 'The fraction is a ratio of densities. Mass is not in it. She still floats, so the buoyant force equals the new weight and it doubles.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('woman', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('by-obj', 'Object density (kg/m³)', 970, 200, 8000, 10)}${sliderRow('by-fl', 'Fluid density (kg/m³)', 1000, 500, 14000, 10)}${sliderRow('by-m', 'Mass (kg)', 60, 0.2, 120, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'by-obj', (s, v) => { s.rhoObj = v; });
    bindSlider(api, 'by-fl', (s, v) => { s.rhoF = v; });
    bindSlider(api, 'by-m', (s, v) => { s.mass = v; });
  },
  syncControls(state) {
    putSlider('by-obj', state.rhoObj, 0);
    putSlider('by-fl', state.rhoF, 0);
    putSlider('by-m', state.mass, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const tank = fatLine(frame(-2.4, -2.4, 2.4, 2.6), { color: M.grey, width: 2 });
    const water = fatLine(frame(-2.2, -2.2, 2.2, 1.2), { color: M.blue, width: 2 });
    const block = fatLine(frame(-0.7, -1.2, 0.7, 1.4), { color: M.gold, width: 3 });
    const up = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const down = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, M.white, undefined, undefined, 0.014);
    const name = label('float', 0, -3.3, 0, 'graph-axis');
    group.add(tank, water, block, up, down, name);
    group.visible = false;
    return { group, tank, water, block, up, down, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.rhoObj = Math.max(state.rhoObj, 1);
    state.rhoF = Math.max(state.rhoF, 1);
    state.mass = Math.max(state.mass, 0.01);
    state.height = Math.max(state.height, 0.05);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const fraction = Math.min(1, state.rhoObj / state.rhoF);
    const area = (state.mass / state.rhoObj) / state.height;
    const Fb = cylinderBuoyancy(state.rhoF, area, state.height, fraction, G);
    const weight = state.mass * G;
    return {
      fraction,
      V: state.mass / state.rhoObj,
      displaced: fraction * state.mass / state.rhoObj,
      weight,
      Fb,
      apparent: weight - Fb,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.block) return;
    ctx.grid.visible = false;
    // The blue line is the water. A floating block breaks that surface. A sunk one rests on the floor.
    const surface = 0.85;
    const floating = computed.fraction < 1;
    const H = floating ? 2.3 : 1.5;
    const top = floating ? surface + (1 - computed.fraction) * H : -0.55;
    const bot = top - H;
    updateFatLine(h.water, frame(-2.2, -2.2, 2.2, surface));
    updateFatLine(h.block, frame(-0.8, bot, 0.8, top));
    const y0 = bot + 0.25;
    placeArrow(h.up, 1.15, y0, 1.15, y0 + 0.7 + 0.6 * computed.fraction, 0.05);
    placeArrow(h.down, -1.15, top - 0.12, -1.15, top - 1.15, 0.05);
    h.name.element.textContent = floating ? 'floating' : 'sunk';
  },
  law() {
    return [
      String.raw`F_B = \rho_{\mathrm{f}} V_{\mathrm{sub}} g`,
      String.raw`\dfrac{V_{\mathrm{sub}}}{V} = \dfrac{\rho}{\rho_{\mathrm{f}}}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Submerged fraction', fmt(computed.fraction, 3)],
      ['Buoyant force', `${fmt(computed.Fb)} N`],
      ['Weight', `${fmt(computed.weight)} N`],
      ['Apparent weight', `${fmt(computed.apparent)} N`],
      ['Volume', `${fmt(computed.V)} m³`],
      ['Displaced volume', `${fmt(computed.displaced)} m³`],
    ];
  },
  coach(state, computed) {
    const floating = computed.fraction < 1;
    return {
      title: floating ? 'It sinks until the forces match' : 'The fluid cannot hold it',
      body: [
        floating
          ? String.raw`The density ratio is $${fmt(computed.fraction, 3)}$. The buoyant force is $${fmt(computed.Fb)}$ N, the same as the weight. Apparent weight is zero while it floats.`
          : String.raw`The object is denser than the fluid, so the displaced volume is the whole of it and it rests on the bottom. The buoyant force is $${fmt(computed.Fb)}$ N and the apparent weight is $${fmt(computed.apparent)}$ N.`,
      ],
    };
  },
});
