/**
 * Shows that with no outside torque, L = Iω stays fixed, so a smaller moment
 * spins faster, and the kinetic energy rises. The extra energy is the work
 * done pulling the mass inward.
 *
 * The closed form is ω2 = I1 ω1 / I2. The check builds I from the pieces
 * (a rod, two point masses, or two flywheels) instead of from the stored L.
 */
import * as THREE from 'three';
import {
  angularMomentum, inertiaPoint, inertiaRodCenter, rotationalKE, spinAfter,
} from '@flux/subjects/mechanics/rotation.js';
import { M, QUANTITY_COLORS, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const KINDS = [['arms', 'Two masses on a stool'], ['tuck', 'A rod that shortens'], ['couple', 'A second flywheel drops on'], ['arm', 'A rod with a mass at the end']];
const base = { kind: 'arms', m: 4, r: 0.6, r0: 0.6, Iseat: 0, w0: 2, len: 1.8, len0: 1.8, mRod: 80, factor: 3, I0: 1, rpm0: 600, mArm: 2, mTip: 1, mRock: 0, omega: Math.PI / 10 };
const SCENARIOS = [
  { ...base, id: 'out', name: 'Masses held out' },
  { ...base, id: 'in', name: 'The same masses, pulled in', r: 0.3 },
  { ...base, id: 'tuck', name: 'A gymnast tucks: 1.8 m down to 0.9 m, from 1 rev/s', kind: 'tuck', mRod: 80, len: 0.9, len0: 1.8, w0: 2 * Math.PI },
  { ...base, id: 'fly', name: 'A second flywheel, three times the moment, drops on at 600 rev/min', kind: 'couple', factor: 3, rpm0: 600 },
  { ...base, id: 'arm', name: 'A robot arm and its forceps, spinning at 0.1π rad/s', kind: 'arm', mArm: 2, mTip: 1, mRock: 0, len: 1, omega: 0.1 * Math.PI },
];

function pieces(state) {
  if (state.kind === 'tuck') {
    const I0 = inertiaRodCenter(state.mRod, state.len0);
    const I = inertiaRodCenter(state.mRod, state.len);
    return { I0, I, omega0: state.w0 };
  }
  if (state.kind === 'couple') {
    const I0 = state.I0;
    const I = state.I0 * (1 + state.factor);
    return { I0, I, omega0: state.rpm0 * 2 * Math.PI / 60 };
  }
  if (state.kind === 'arm') {
    const I = (state.mArm * state.len * state.len) / 3 + inertiaPoint(state.mTip, state.len) + inertiaPoint(state.mRock, state.len);
    return { I0: I, I, omega0: state.omega };
  }
  const I0 = state.Iseat + 2 * inertiaPoint(state.m, state.r0);
  const I = state.Iseat + 2 * inertiaPoint(state.m, state.r);
  return { I0, I, omega0: state.w0 };
}

function closed(state) {
  const part = pieces(state);
  const hold = state.kind === 'arm';
  const omega = hold ? state.omega : spinAfter(part.I0, part.omega0, part.I);
  const L = angularMomentum(part.I, omega);
  const K = rotationalKE(part.I, omega);
  const K0 = rotationalKE(part.I0, part.omega0);
  return { I: part.I, I0: part.I0, omega, L, K, K0, gained: K - K0 };
}

function stepped(state) {
  const part = pieces(state);
  let I0;
  let I;
  if (state.kind === 'tuck') {
    I0 = state.mRod * state.len0 * state.len0 / 12;
    I = state.mRod * state.len * state.len / 12;
  } else if (state.kind === 'couple') {
    I0 = state.I0;
    I = state.I0 + state.factor * state.I0;
  } else if (state.kind === 'arm') {
    I = state.mArm * state.len * state.len / 3 + state.mTip * state.len * state.len + state.mRock * state.len * state.len;
    I0 = I;
  } else {
    I0 = state.Iseat + 2 * state.m * state.r0 * state.r0;
    I = state.Iseat + 2 * state.m * state.r * state.r;
  }
  const omega0 = state.kind === 'couple' ? state.rpm0 * Math.PI / 30 : state.kind === 'arm' ? state.omega : state.w0;
  const omega = state.kind === 'arm' ? state.omega : (I0 * omega0) / I;
  const L = I * omega;
  const K = 0.5 * I * omega * omega;
  const K0 = 0.5 * I0 * omega0 * omega0;
  return { I, I0, omega, L, K, K0, gained: K - K0 };
}

export default defineLab({
  id: 'spinner',
  exam: 'u7',
  title: 'Spinning stool',
  hint: 'No outside torque: L stays fixed. Pull the mass in and the spin rises. So does the kinetic energy.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'spin-in',
      scenario: 'out',
      ask: 'Pull the masses in to half the radius. The seat itself has no moment. What happens to the angular velocity?',
      apply(s) { s.r = s.r0 / 2; },
      watch: [{ id: 'omega', label: 'the angular velocity', get: (c) => c.omega, mode: 'factor' }],
      expect: { omega: 4 },
      why: String.raw`Two point masses have $I = 2mr^2$. Halving $r$ divides $I$ by four. $L = I\omega$ is fixed, so $\omega$ becomes four times as large.`,
    },
    {
      id: 'spin-k',
      scenario: 'out',
      ask: 'Same pull, in to half the radius. What happens to the kinetic energy?',
      apply(s) { s.r = s.r0 / 2; },
      watch: [{ id: 'K', label: 'the kinetic energy', get: (c) => c.K, mode: 'factor' }],
      expect: { K: 4 },
      why: String.raw`$K = L^2/(2I)$. $L$ is fixed and $I$ falls by four, so $K$ rises by four. The person does that work pulling inward.`,
    },
    {
      id: 'spin-rate',
      scenario: 'out',
      ask: 'Double the starting spin, and leave the masses where they are. What happens to the kinetic energy?',
      apply(s) { s.w0 *= 2; },
      watch: [{ id: 'K', label: 'the kinetic energy', get: (c) => c.K, mode: 'factor' }],
      expect: { K: 4 },
      why: String.raw`$K = \frac12 I\omega^2$. The moment did not change, and the energy follows the square of the spin.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('out', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('sp-kind', 'System', KINDS, 'arms')}<div id="sp-arms">${sliderRow('sp-m', 'Mass of one hand weight (kg)', 4, 0.5, 20, 0.1)}${sliderRow('sp-r0', 'Starting radius (m)', 0.6, 0.2, 1.2, 0.05)}${sliderRow('sp-r', 'Radius now (m)', 0.6, 0.1, 1.2, 0.05)}${sliderRow('sp-w', 'Starting spin (rad/s)', 2, 0.2, 12, 0.1)}</div><div id="sp-tuck">${sliderRow('sp-mrod', 'Mass (kg)', 80, 20, 120, 1)}${sliderRow('sp-len0', 'Length at the start (m)', 1.8, 0.6, 2.4, 0.1)}${sliderRow('sp-len', 'Length now (m)', 0.9, 0.3, 2.4, 0.1)}</div><div id="sp-fly">${sliderRow('sp-rpm', 'Starting spin (rev/min)', 600, 60, 900, 10)}${sliderRow('sp-fac', 'Added moment, in units of the first', 3, 0.5, 6, 0.5)}</div><div id="sp-arm">${sliderRow('sp-marm', 'Arm mass (kg)', 2, 0.5, 8, 0.1)}${sliderRow('sp-mtip', 'Mass at the end (kg)', 1, 0, 6, 0.1)}${sliderRow('sp-rock', 'Extra mass at the end (kg)', 0, 0, 6, 0.1)}${sliderRow('sp-alen', 'Length (m)', 1, 0.4, 2, 0.05)}</div></div>`;
  },
  bind(api) {
    bindSelect(api, 'sp-kind', (s, v) => { s.kind = v; });
    bindSlider(api, 'sp-m', (s, v) => { s.m = v; });
    bindSlider(api, 'sp-r0', (s, v) => { s.r0 = v; });
    bindSlider(api, 'sp-r', (s, v) => { s.r = v; });
    bindSlider(api, 'sp-w', (s, v) => { s.w0 = v; });
    bindSlider(api, 'sp-mrod', (s, v) => { s.mRod = v; });
    bindSlider(api, 'sp-len0', (s, v) => { s.len0 = v; });
    bindSlider(api, 'sp-len', (s, v) => { s.len = v; });
    bindSlider(api, 'sp-rpm', (s, v) => { s.rpm0 = v; });
    bindSlider(api, 'sp-fac', (s, v) => { s.factor = v; });
    bindSlider(api, 'sp-marm', (s, v) => { s.mArm = v; });
    bindSlider(api, 'sp-mtip', (s, v) => { s.mTip = v; });
    bindSlider(api, 'sp-rock', (s, v) => { s.mRock = v; });
    bindSlider(api, 'sp-alen', (s, v) => { s.len = v; });
  },
  syncControls(state) {
    putSelect('sp-kind', state.kind);
    putSlider('sp-m', state.m, 1);
    putSlider('sp-r0', state.r0, 2);
    putSlider('sp-r', state.r, 2);
    putSlider('sp-w', state.w0, 2);
    putSlider('sp-mrod', state.mRod, 0);
    putSlider('sp-len0', state.len0, 1);
    putSlider('sp-len', state.len, 1);
    putSlider('sp-rpm', state.rpm0, 0);
    putSlider('sp-fac', state.factor, 1);
    putSlider('sp-marm', state.mArm, 1);
    putSlider('sp-mtip', state.mTip, 1);
    putSlider('sp-rock', state.mRock, 1);
    putSlider('sp-alen', state.len, 2);
    for (const [id, on] of [['sp-arms', state.kind === 'arms'], ['sp-tuck', state.kind === 'tuck'], ['sp-fly', state.kind === 'couple'], ['sp-arm', state.kind === 'arm']]) {
      const el = document.getElementById(id);
      if (el) el.hidden = !on;
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const bar = fatLine(new Array(6).fill(0), { color: M.blue, width: 3 });
    const left = dot(M.gold, 0.18);
    const right = dot(M.gold, 0.18);
    const hub = dot(QUANTITY_COLORS.mark, 0.12);
    const disk2 = fatLine(new Array(49 * 3).fill(0), { color: M.gold, width: 2 });
    const name = label('L', 0, 0, 0, 'graph-axis');
    group.add(bar, disk2, left, right, hub, name);
    group.visible = false;
    return { group, bar, disk2, left, right, hub, name };
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
    if (!h?.bar) return;
    ctx.grid.visible = false;
    const couple = state.kind === 'couple';
    h.disk2.visible = couple;
    h.left.visible = !couple;
    h.right.visible = !couple;
    const reach = state.kind === 'arms' ? 1.1 + 1.4 * (state.r / Math.max(state.r0, 0.2)) : state.kind === 'tuck' ? 1.2 + 1.3 * (state.len / Math.max(state.len0, 0.2)) : 1.8;
    updateFatLine(h.bar, [-reach, 0, 0.02, reach, 0, 0.02]);
    h.left.position.set(-reach, 0, 0.05);
    h.right.position.set(reach, 0.15, 0.05);
    h.hub.position.set(0, 0, 0.06);
    if (couple) {
      const pts = [];
      for (let i = 0; i <= 48; i += 1) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(1.15 * Math.cos(a), 1.15 * Math.sin(a), 0.03);
      }
      updateFatLine(h.disk2, pts);
    }
    h.name.position.set(0.4, 1.6, 0);
    void computed;
  },
  law(state) {
    if (state.kind === 'couple') return [String.raw`I_1\omega_1 = I_2\omega_2`, String.raw`K = \tfrac12 I\omega^2`];
    if (state.kind === 'arm') return [String.raw`I = \tfrac13 mL^2 + m_{\mathrm{end}} L^2`, String.raw`L = I\omega`];
    return [String.raw`I_1\omega_1 = I_2\omega_2`, String.raw`K_2 / K_1 = I_1 / I_2`];
  },
  readoutCells(state, computed) {
    const rows = [
      ['Angular velocity', `${fmt(computed.omega)} rad/s`],
      ['Angular momentum', `${fmt(computed.L)} kg·m²/s`],
      ['Moment now', `${fmt(computed.I)} kg·m²`],
      ['Kinetic energy', `${fmt(computed.K)} J`],
    ];
    if (state.kind !== 'arm') rows.push(['Energy gained', `${fmt(computed.gained)} J`]);
    return rows;
  },
  coach(state, computed) {
    const book = state.scenarioId === 'fly'
      ? 'The book prints 150 rev/min, which is 15.7 rad/s, and says three quarters of the kinetic energy is lost in the friction that brings the two wheels to one spin.'
      : state.scenarioId === 'tuck'
        ? 'The book prints 4.0 rev/s in the tuck. The moment is that of a rod about its center, mL²/12, not about the bar.'
        : state.scenarioId === 'arm'
          ? 'The book prints 0.17π kg·m²/s for the arm and forceps. Ours is (5/3)(0.1π) = π/6.'
          : 'Pulling the masses in does work. That work is the rise in kinetic energy. Angular momentum did not supply it.';
    return {
      title: 'Spin up, and the energy rises',
      body: [
        String.raw`$\omega = ${fmt(computed.omega)}$ rad/s and $K = ${fmt(computed.K)}$ J.`,
        book,
      ],
    };
  },
});
