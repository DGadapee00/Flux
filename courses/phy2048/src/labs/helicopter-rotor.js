/**
 * Application lab: the blades of a rescue helicopter.
 * Shows that the stored rotational energy is ½Iω², with each blade a thin rod about one end,
 * and how that energy compares with the helicopter's translational kinetic energy.
 *
 * Numbers from OpenStax University Physics Vol. 1 §10.4, "Calculating Helicopter Energies":
 * four blades of 4.00 m and 50.0 kg, 300 rpm, a 1000 kg helicopter at 20.0 m/s.
 * The book prints I = 1067 kg·m², K_rot = 5.26×10⁵ J, K_trans = 2.00×10⁵ J, ratio 0.380.
 */
import * as THREE from 'three';
import { rodInertiaIntegral } from '@flux/subjects/mechanics/inertia.js';
import { inertiaRodEnd, rotationalKE } from '@flux/subjects/mechanics/rotation.js';
import { M, QUANTITY_COLORS, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { n: 4, mBlade: 50, L: 4, rpm: 300, mHeli: 1000, v: 20 };
const SCENARIOS = [
  { ...base, id: 'book', name: 'The book’s rescue helicopter: 300 rpm, flying at 20 m/s' },
  { ...base, id: 'fast', name: 'The same helicopter, blades at 600 rpm', rpm: 600 },
  { ...base, id: 'hover', name: 'Hovering: the same spin, no flight speed', v: 0 },
];

function closed(state) {
  const I = state.n * inertiaRodEnd(state.mBlade, state.L);
  const omega = state.rpm * 2 * Math.PI / 60;
  const Krot = rotationalKE(I, omega);
  const Ktrans = 0.5 * state.mHeli * state.v * state.v;
  return { I, omega, Krot, Ktrans, ratio: Krot > 0 ? Ktrans / Krot : 0 };
}

function stepped(state) {
  const one = rodInertiaIntegral(state.mBlade, 0, state.L, 0);
  const I = state.n * one;
  const omega = state.rpm * 2 * Math.PI / 60;
  const Krot = 0.5 * I * omega * omega;
  const Ktrans = 0.5 * state.mHeli * state.v * state.v;
  return { I, omega, Krot, Ktrans, ratio: Krot > 0 ? Ktrans / Krot : 0 };
}

export default defineLab({
  id: 'helicopter-rotor',
  exam: 'u6',
  title: 'Helicopter rotor',
  hint: 'The blades store ½Iω². Compare that with the kinetic energy of the flight.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'heli-rpm',
      scenario: 'book',
      ask: 'Double the rotation rate, and keep the flight speed. What happens to the rotational kinetic energy?',
      apply(s) { s.rpm *= 2; },
      watch: [{ id: 'Krot', label: 'the rotational kinetic energy', get: (c) => c.Krot, mode: 'factor' }],
      expect: { Krot: 4 },
      why: String.raw`$K = \frac12 I\omega^2$. Doubling the rotation rate doubles $\omega$, and the energy follows the square.`,
    },
    {
      id: 'heli-speed',
      scenario: 'book',
      ask: 'Double the flight speed, and keep the blades spinning as they were. What happens to the translational kinetic energy?',
      apply(s) { s.v *= 2; },
      watch: [{ id: 'Ktrans', label: 'the translational kinetic energy', get: (c) => c.Ktrans, mode: 'factor' }],
      expect: { Ktrans: 4 },
      why: String.raw`Translational kinetic energy is $\frac12 mv^2$. It does not know about the blades. Twice the speed means four times the energy.`,
    },
    {
      id: 'heli-length',
      scenario: 'book',
      ask: 'Double the length of each blade, at the same mass and spin. What happens to the rotational kinetic energy?',
      apply(s) { s.L *= 2; },
      watch: [{ id: 'Krot', label: 'the rotational kinetic energy', get: (c) => c.Krot, mode: 'factor' }],
      expect: { Krot: 4 },
      why: String.raw`A blade about one end has $I = \frac13 mL^2$. Doubling $L$ multiplies $I$ by four, and $K$ follows $I$ at the same $\omega$.`,
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
    return `<div class="lab-block">${sliderRow('hr-n', 'Blades', 4, 2, 6, 1)}${sliderRow('hr-m', 'Mass of one blade (kg)', 50, 10, 80, 1)}${sliderRow('hr-L', 'Blade length (m)', 4, 1, 8, 0.1)}${sliderRow('hr-rpm', 'Rotation (rpm)', 300, 20, 800, 10)}${sliderRow('hr-mh', 'Helicopter mass (kg)', 1000, 400, 2000, 50)}${sliderRow('hr-v', 'Flight speed (m/s)', 20, 0, 60, 1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'hr-n', (s, v) => { s.n = v; });
    bindSlider(api, 'hr-m', (s, v) => { s.mBlade = v; });
    bindSlider(api, 'hr-L', (s, v) => { s.L = v; });
    bindSlider(api, 'hr-rpm', (s, v) => { s.rpm = v; });
    bindSlider(api, 'hr-mh', (s, v) => { s.mHeli = v; });
    bindSlider(api, 'hr-v', (s, v) => { s.v = v; });
  },
  syncControls(state) {
    putSlider('hr-n', state.n, 0);
    putSlider('hr-m', state.mBlade, 1);
    putSlider('hr-L', state.L, 2);
    putSlider('hr-rpm', state.rpm, 0);
    putSlider('hr-mh', state.mHeli, 0);
    putSlider('hr-v', state.v, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const blades = fatLine(new Array(36).fill(0), { color: M.blue, width: 3 });
    const hub = fatLine(new Array(33).fill(0), { color: M.gold, width: 2 });
    const kRot = fatLine(new Array(6).fill(0), { color: QUANTITY_COLORS.v, width: 8 });
    const kFly = fatLine(new Array(6).fill(0), { color: M.gold, width: 8 });
    const n1 = label('spin', 0, 0, 0, 'graph-axis');
    const n2 = label('flight', 0, 0, 0, 'graph-axis');
    group.add(blades, hub, kRot, kFly, n1, n2);
    group.visible = false;
    return { group, blades, hub, kRot, kFly, n1, n2 };
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
    return stepped(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.blades) return;
    ctx.grid.visible = false;
    const n = Math.max(2, Math.round(state.n));
    const pts = [];
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      pts.push(0, 0.6, 0.02, 1.7 * Math.cos(a), 0.6 + 1.7 * Math.sin(a), 0.02);
    }
    while (pts.length < 36) pts.push(0, 0.6, 0.02);
    updateFatLine(h.blades, pts.slice(0, 36));
    const hub = [];
    for (let i = 0; i <= 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      hub.push(0.18 * Math.cos(a), 0.6 + 0.18 * Math.sin(a), 0.03);
    }
    updateFatLine(h.hub, hub);
    const scale = 2.4 / Math.max(computed.Krot, computed.Ktrans, 1);
    const y0 = -2.3;
    updateFatLine(h.kRot, [-1.6, y0, 0.02, -1.6, y0 + computed.Krot * scale, 0.02]);
    updateFatLine(h.kFly, [1.2, y0, 0.02, 1.2, y0 + computed.Ktrans * scale, 0.02]);
    h.n1.position.set(-1.6, y0 - 0.35, 0);
    h.n2.position.set(1.2, y0 - 0.35, 0);
  },
  law: () => [
    String.raw`I = n\cdot\tfrac13 m L^2`,
    String.raw`K = \tfrac12 I\omega^2`,
  ],
  readoutCells(_state, computed) {
    return [
      ['Rotational energy', `${fmt(computed.Krot)} J`],
      ['Translational energy', `${fmt(computed.Ktrans)} J`],
      ['Moment of the blades', `${fmt(computed.I)} kg·m²`],
      ['Angular speed', `${fmt(computed.omega)} rad/s`],
      ['Flight energy / blade energy', fmt(computed.ratio)],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Most of the kinetic energy is in the blades',
      body: [
        String.raw`Four blades at this spin hold $${fmt(computed.Krot)}$ J. The flight holds $${fmt(computed.Ktrans)}$ J. The ratio of flight to spin is $${fmt(computed.ratio)}$.`,
        state.scenarioId === 'book'
          ? 'The book prints 5.26×10⁵ J in the blades, 2.00×10⁵ J in the flight, and a ratio of 0.380. Here g is not involved. The angular speed is 300 rpm, which is 10π rad/s.'
          : 'The translational energy uses the whole helicopter mass. The rotational energy uses only the blades, each as a thin rod about one end.',
        String.raw`<b>What the course model leaves out.</b> A blade is not a rigid rod, and the hub and the hinges have mass of their own. The 1000 kg already includes the blades, so their translational share is inside the flight energy and is not added again. Air loads the rotor, and the engine replaces the energy the air takes. The 4.00 m, 50.0 kg, 300 rpm, and 20.0 m/s are the book's figures.`,
      ],
    };
  },
});
