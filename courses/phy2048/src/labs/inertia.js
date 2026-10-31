/**
 * Shows that I depends on how far the mass sits from the axis, and that the parallel-axis
 * theorem shifts a known center moment out to a new axis.
 *
 * The closed form is the table: rod, ring, disk, sphere, and a rod with a sphere on the end.
 * The check integrates r² dm.
 */
import * as THREE from 'three';
import {
  diskInertiaIntegral, hoopInertiaIntegral, rodInertiaIntegral, sphereInertiaIntegral,
} from '@flux/subjects/mechanics/inertia.js';
import {
  inertiaDisk, inertiaHoop, inertiaRodCenter, inertiaRodEnd, inertiaSphere, parallelAxisMass,
} from '@flux/subjects/mechanics/rotation.js';
import { M, QUANTITY_COLORS, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const MARK = QUANTITY_COLORS.mark;
const SHAPES = [['rod', 'Rod'], ['disc', 'Disk'], ['ring', 'Ring'], ['sphere', 'Solid sphere'], ['pair', 'Rod and sphere']];
const AXES = [['center', 'Through the center'], ['end', 'Through one end'], ['far', 'Far end, sphere beyond the rod'], ['near', 'Near end, sphere beside the pivot']];

const base = { shape: 'rod', axis: 'center', m: 3, L: 2, R: 0.4, mRod: 2, mSphere: 1 };
const SCENARIOS = [
  { ...base, id: 'center', name: 'A rod about its center' },
  { ...base, id: 'end', name: 'The same rod about one end', axis: 'end' },
  { ...base, id: 'disc', name: 'A disk about its center', shape: 'disc', m: 2, R: 0.4 },
  { ...base, id: 'ring', name: 'A ring of that mass and radius', shape: 'ring', m: 2, R: 0.4 },
  { ...base, id: 'sphere', name: 'A solid sphere', shape: 'sphere', m: 1, R: 0.2 },
  { ...base, id: 'far', name: 'Rod and sphere, axis at the far end of the rod', shape: 'pair', axis: 'far', L: 0.5, R: 0.2 },
  { ...base, id: 'near', name: 'Rod and sphere, axis at the sphere', shape: 'pair', axis: 'near', L: 0.5, R: 0.2 },
];

function pair(state, which) {
  const d = which === 'far' ? state.L + state.R : state.R;
  return inertiaRodEnd(state.mRod, state.L) + parallelAxisMass(inertiaSphere(state.mSphere, state.R), state.mSphere, d);
}

function closed(state) {
  const Icm = state.shape === 'rod' ? inertiaRodCenter(state.m, state.L) : 0;
  const Iend = state.shape === 'rod' ? inertiaRodEnd(state.m, state.L) : 0;
  const Ifar = state.shape === 'pair' ? pair(state, 'far') : 0;
  const Inear = state.shape === 'pair' ? pair(state, 'near') : 0;
  let I = Icm;
  if (state.shape === 'rod') I = state.axis === 'end' ? Iend : Icm;
  if (state.shape === 'disc') I = inertiaDisk(state.m, state.R);
  if (state.shape === 'ring') I = inertiaHoop(state.m, state.R);
  if (state.shape === 'sphere') I = inertiaSphere(state.m, state.R);
  if (state.shape === 'pair') I = state.axis === 'near' ? Inear : Ifar;
  return { I, Icm, Iend, Ifar, Inear };
}

function stepped(state) {
  const blank = closed(state);
  if (state.shape === 'rod') {
    const Icm = rodInertiaIntegral(state.m, -state.L / 2, state.L / 2, 0);
    const Iend = rodInertiaIntegral(state.m, -state.L / 2, state.L / 2, state.L / 2);
    return { ...blank, Icm, Iend, I: state.axis === 'end' ? Iend : Icm };
  }
  if (state.shape === 'disc') return { ...blank, I: diskInertiaIntegral(state.m, state.R) };
  if (state.shape === 'ring') return { ...blank, I: hoopInertiaIntegral(state.m, state.R) };
  if (state.shape === 'sphere') return { ...blank, I: sphereInertiaIntegral(state.m, state.R) };
  const rod = rodInertiaIntegral(state.mRod, 0, state.L, 0);
  const sphere = sphereInertiaIntegral(state.mSphere, state.R);
  const Ifar = rod + sphere + state.mSphere * (state.L + state.R) ** 2;
  const Inear = rod + sphere + state.mSphere * state.R ** 2;
  return { ...blank, Ifar, Inear, I: state.axis === 'near' ? Inear : Ifar };
}

export default defineLab({
  id: 'inertia',
  exam: 'u6',
  title: 'Moment of inertia',
  hint: 'The same mass, farther from the axis, is harder to spin. The axis you pick is part of the answer.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'inertia-ring',
      scenario: 'disc',
      ask: 'Replace the disk with a ring of the same mass and radius. What happens to the moment of inertia?',
      apply(s) { s.shape = 'ring'; },
      watch: [{ id: 'I', label: 'the moment of inertia', get: (c) => c.I, mode: 'factor' }],
      expect: { I: 2 },
      why: String.raw`A disk is $\frac12 mR^2$. A thin ring is $mR^2$. The mass moved out to the rim, so the moment doubles.`,
    },
    {
      id: 'inertia-end',
      scenario: 'center',
      ask: 'Move the axis from the center of the rod to one end. What happens to the moment of inertia?',
      apply(s) { s.axis = 'end'; },
      watch: [{ id: 'I', label: 'the moment of inertia', get: (c) => c.I, mode: 'factor' }],
      expect: { I: 4 },
      why: String.raw`About the center, $I = \frac{1}{12}mL^2$. About the end, add $m(L/2)^2$, which makes $\frac13 mL^2$. That is four times the center moment.`,
    },
    {
      id: 'inertia-radius',
      scenario: 'disc',
      ask: 'Double the radius of the disk, at the same mass. What happens to the moment of inertia?',
      apply(s) { s.R *= 2; },
      watch: [{ id: 'I', label: 'the moment of inertia', get: (c) => c.I, mode: 'factor' }],
      expect: { I: 4 },
      why: String.raw`$I = \frac12 mR^2$. The mass is fixed, and the square of the radius becomes four times as large.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('center', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('in-shape', 'Body', SHAPES, 'rod')}${selectRow('in-axis', 'Axis', AXES, 'center')}<div id="in-simple">${sliderRow('in-m', 'Mass (kg)', 3, 0.2, 20, 0.1)}</div><div id="in-len">${sliderRow('in-L', 'Length (m)', 2, 0.2, 3, 0.05)}</div><div id="in-rad">${sliderRow('in-R', 'Radius (m)', 0.4, 0.05, 1.2, 0.01)}</div><div id="in-pair">${sliderRow('in-mrod', 'Rod mass (kg)', 2, 0.2, 10, 0.1)}${sliderRow('in-ms', 'Sphere mass (kg)', 1, 0.1, 8, 0.1)}</div></div>`;
  },
  bind(api) {
    bindSelect(api, 'in-shape', (s, v) => { s.shape = v; });
    bindSelect(api, 'in-axis', (s, v) => { s.axis = v; });
    bindSlider(api, 'in-m', (s, v) => { s.m = v; });
    bindSlider(api, 'in-L', (s, v) => { s.L = v; });
    bindSlider(api, 'in-R', (s, v) => { s.R = v; });
    bindSlider(api, 'in-mrod', (s, v) => { s.mRod = v; });
    bindSlider(api, 'in-ms', (s, v) => { s.mSphere = v; });
  },
  syncControls(state) {
    putSelect('in-shape', state.shape);
    putSelect('in-axis', state.axis);
    putSlider('in-m', state.m, 2);
    putSlider('in-L', state.L, 2);
    putSlider('in-R', state.R, 2);
    putSlider('in-mrod', state.mRod, 2);
    putSlider('in-ms', state.mSphere, 2);
    const pairOn = state.shape === 'pair';
    const rod = state.shape === 'rod' || pairOn;
    const round = state.shape !== 'rod';
    const simple = document.getElementById('in-simple');
    const len = document.getElementById('in-len');
    const rad = document.getElementById('in-rad');
    const pairBox = document.getElementById('in-pair');
    if (simple) simple.hidden = pairOn;
    if (len) len.hidden = !rod;
    if (rad) rad.hidden = !round;
    if (pairBox) pairBox.hidden = !pairOn;
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const body = fatLine(new Array(49 * 3).fill(0), { color: M.blue, width: 2.5 });
    const rodLine = fatLine(new Array(6).fill(0), { color: M.blue, width: 3 });
    const axis = fatLine([0, -2.2, 0, 0, 2.2, 0], { color: MARK, width: 1.5 });
    const mass = dot(M.gold, 0.16);
    const name = label('axis', 0, 0, 0, 'graph-axis');
    group.add(body, rodLine, axis, mass, name);
    group.visible = false;
    return { group, body, rodLine, axis, mass, name };
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
    if (!h?.body) return;
    ctx.grid.visible = false;
    const pairOn = state.shape === 'pair';
    const round = state.shape === 'disc' || state.shape === 'ring' || state.shape === 'sphere';
    const x0 = -2.2;
    const x1 = 2.2;
    h.body.visible = round;
    h.rodLine.visible = !round;
    if (round) {
      const r = 1.3;
      const pts = [];
      for (let i = 0; i <= 48; i += 1) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(r * Math.cos(a), r * Math.sin(a), 0.02);
      }
      updateFatLine(h.body, pts);
      h.mass.visible = false;
    } else {
      updateFatLine(h.rodLine, [x0, 0, 0.02, x1, 0, 0.02]);
      h.mass.visible = pairOn;
      h.mass.position.set(x1 + (state.axis === 'near' ? 0.55 : 0), 0.35, 0.05);
    }
    let axisX = 0;
    if ((state.shape === 'rod' && state.axis === 'end') || (state.shape === 'pair' && state.axis !== 'near')) axisX = x0;
    if (state.shape === 'pair' && state.axis === 'near') axisX = x1;
    h.axis.position.set(axisX, 0, 0);
    h.name.position.set(axisX + 0.35, 1.7, 0);
    void computed;
  },
  law(state) {
    if (state.shape === 'rod') return [String.raw`I_{\mathrm{cm}} = \tfrac{1}{12}mL^2`, String.raw`I_{\mathrm{end}} = I_{\mathrm{cm}} + m(L/2)^2`];
    if (state.shape === 'ring') return [String.raw`I = mR^2`];
    if (state.shape === 'sphere') return [String.raw`I = \tfrac25 mR^2`];
    if (state.shape === 'pair') return [String.raw`I = \tfrac13 m_{\mathrm{rod}} L^2 + \tfrac25 mR^2 + md^2`];
    return [String.raw`I = \tfrac12 mR^2`];
  },
  readoutCells(state, computed) {
    const rows = [['Moment of inertia', `${fmt(computed.I)} kg·m²`]];
    if (state.shape === 'rod') {
      rows.push(['About the center', `${fmt(computed.Icm)} kg·m²`], ['About one end', `${fmt(computed.Iend)} kg·m²`]);
    }
    if (state.shape === 'pair') {
      rows.push(['Far axis', `${fmt(computed.Ifar)} kg·m²`], ['Near axis', `${fmt(computed.Inear)} kg·m²`]);
    }
    return rows;
  },
  coach(state, computed) {
    return {
      title: 'Distance from the axis, squared',
      body: [
        String.raw`This axis gives $I = ${fmt(computed.I)}$ kg·m².`,
        'Each bit of mass contributes mr². Moving it farther from the axis costs the square of that distance. A ring beats a disk, and a disk beats a solid sphere, at the same mass and outer radius.',
        state.shape === 'pair'
          ? 'The rod is taken about one end. The sphere is a center moment plus m times the square of the distance from the sphere’s center to the axis. The book prints 0.673 kg·m² and 0.223 kg·m².'
          : 'The parallel-axis theorem adds md² when the axis moves a distance d from the center. It does not subtract.',
      ],
    };
  },
});
