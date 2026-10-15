import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { collideOblique, impactLoss } from '@flux/subjects/mechanics/momentum.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeArrow, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'central',
    name: 'Direct impact',
    m1: 1,
    m2: 1,
    u1: 4,
    u2: 0,
    e: 0.5,
    theta: 0,
  },
  {
    id: 'oblique',
    name: 'Oblique impact',
    m1: 2,
    m2: 2,
    u1: 4,
    u2: 0,
    e: 1,
    theta: 30,
  },
  {
    id: 'stick',
    name: 'They stick',
    m1: 1,
    m2: 3,
    u1: 8,
    u2: 0,
    e: 0,
    theta: 0,
  },
];

const X1 = -1.2;
const X2 = 1.2;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.m1 = sc.m1;
  state.m2 = sc.m2;
  state.u1 = sc.u1;
  state.u2 = sc.u2;
  state.e = sc.e;
  state.theta = sc.theta;
}

function parts(state) {
  const th = (state.theta * Math.PI) / 180;
  return {
    un1: state.u1 * Math.cos(th),
    ut1: state.u1 * Math.sin(th),
    un2: state.u2,
    ut2: 0,
  };
}

export default defineLab({
  id: 'impact',
  exam: 'u4',
  title: 'Impact',
  hint: 'Momentum holds for every e. The tangent velocity does not change.',
  camera: { pos: new THREE.Vector3(0, 0.35, 6.6), target: new THREE.Vector3(0, 0.35, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('central', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('ip-m1', 'm₁ (kg)', 1, 0.5, 6, 0.1)}
      ${slider('ip-m2', 'm₂ (kg)', 1, 0.5, 6, 0.1)}
      ${slider('ip-u1', 'u₁ (m/s)', 4, 0, 10, 0.1)}
      ${slider('ip-u2', 'u₂ (m/s)', 0, -4, 4, 0.1)}
      ${slider('ip-e', 'e', 0.5, 0, 1, 0.05)}
      ${slider('ip-theta', 'θ (deg)', 0, 0, 60, 1)}
      <p class="tiny">White is the first body, gold is the second. The line of impact is the normal. θ is measured from that line.</p>`;
  },
  bind(api) {
    bindSlider('ip-m1', (s, v) => { s.m1 = v; }, api);
    bindSlider('ip-m2', (s, v) => { s.m2 = v; }, api);
    bindSlider('ip-u1', (s, v) => { s.u1 = v; }, api);
    bindSlider('ip-u2', (s, v) => { s.u2 = v; }, api);
    bindSlider('ip-e', (s, v) => { s.e = v; }, api);
    bindSlider('ip-theta', (s, v) => { s.theta = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('ip-m1', state.m1);
    set('ip-m2', state.m2);
    set('ip-u1', state.u1);
    set('ip-u2', state.u2);
    set('ip-e', state.e);
    set('ip-theta', state.theta);
  },
  init(ctx) {
    const group = new THREE.Group();
    const line = makeLine(M.grey);
    const b1 = makeDot(M.white, 0.14);
    const b2 = makeDot(M.gold, 0.14);
    const mk = (color) => forceArrow(new THREE.Vector3(1, 0, 0), color, 0.025, 0.16, 0.12);
    const in1 = mk(M.grey);
    const in2 = mk(M.grey);
    const out1 = makeArrow(M.white);
    const out2 = makeArrow(M.gold);
    group.add(line, b1, b2, in1, in2, out1, out2);
    ctx.scene.add(group);
    return { group, line, b1, b2, in1, in2, out1, out2 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (!(state.m1 > 0) || !(state.m2 > 0)) {
      Object.assign(computed, { vn1: 0, vn2: 0, vt1: 0, vt2: 0, loss: 0, vcm: 0, gap: 0 });
      return;
    }
    const incoming = parts(state);
    const hit = collideOblique({
      m1: state.m1,
      m2: state.m2,
      un1: incoming.un1,
      ut1: incoming.ut1,
      un2: incoming.un2,
      ut2: incoming.ut2,
      e: state.e,
    });
    const T0 = kineticEnergy(state.m1, incoming.un1) + kineticEnergy(state.m2, incoming.un2)
      + kineticEnergy(state.m1, incoming.ut1) + kineticEnergy(state.m2, incoming.ut2);
    const T = kineticEnergy(state.m1, hit.vn1) + kineticEnergy(state.m2, hit.vn2)
      + kineticEnergy(state.m1, hit.vt1) + kineticEnergy(state.m2, hit.vt2);
    const loss = T0 - T;
    const formula = impactLoss(state.m1, state.m2, incoming.un1, incoming.un2, state.e);
    const total = state.m1 + state.m2;
    const vcmAfter = (state.m1 * hit.vn1 + state.m2 * hit.vn2) / total;
    const gapLoss = Math.abs(formula - loss) / Math.max(1, Math.abs(loss));
    const gapCm = Math.abs(vcmAfter - hit.vcm) / Math.max(1, Math.abs(hit.vcm));
    Object.assign(computed, {
      vn1: hit.vn1,
      vn2: hit.vn2,
      vt1: hit.vt1,
      vt2: hit.vt2,
      loss,
      vcm: hit.vcm,
      gap: Math.max(gapLoss, gapCm),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const incoming = parts(state);
    setLine(h.line, [{ x: -2.5, y: 0 }, { x: 2.5, y: 0 }]);
    h.b1.position.set(X1, 0, 0);
    h.b2.position.set(X2, 0, 0);
    const peak = Math.max(
      Math.abs(incoming.un1), Math.abs(incoming.ut1), Math.abs(incoming.un2),
      Math.abs(computed.vn1), Math.abs(computed.vn2), Math.abs(computed.vt1), 1,
    );
    const scale = 1.15 / peak;
    const at1 = new THREE.Vector3(X1, 0, 0);
    const at2 = new THREE.Vector3(X2, 0, 0);
    placeIncomingArrow(h.in1, at1, incoming.un1, incoming.ut1, { scale, minLength: 0, gap: 0.18 });
    placeIncomingArrow(h.in2, at2, incoming.un2, incoming.ut2, { scale, minLength: 0, gap: 0.18 });
    setArrow(h.out1, { x: X1, y: 0 }, { x: computed.vn1 * scale, y: computed.vt1 * scale }, 1.3);
    setArrow(h.out2, { x: X2, y: 0 }, { x: computed.vn2 * scale, y: computed.vt2 * scale }, 1.3);
  },
  law() {
    return [
      String.raw`m_1 u_{n1}+m_2 u_{n2}=m_1 v_{n1}+m_2 v_{n2}`,
      String.raw`v_{n2}-v_{n1}=e(u_{n1}-u_{n2})`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$v_{n1}$', `${fig(c.vn1)} m/s`),
      kv('$v_{n2}$', `${fig(c.vn2)} m/s`),
      kv('$v_t$', `${fig(c.vt1)} m/s`),
      kv('lost', `${fig(c.loss)} J`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['v₁', `${fig(c.vn1)} m/s`],
      ['v₂', `${fig(c.vn2)} m/s`],
      ['tangent', `${fig(c.vt1)} m/s`],
      ['lost', `${fig(c.loss)} J`],
    ]);
  },
  coach(state, c) {
    if (Math.abs(state.theta) > 0.5) {
      return {
        title: 'The tangent velocity is unchanged',
        body: String.raw`The tangent part stays ${fig(c.vt1)} m/s. The normal parts leave at ${fig(c.vn1)} and ${fig(c.vn2)} m/s.`,
      };
    }
    if (state.e < 0.02) {
      return {
        title: 'They leave together',
        body: String.raw`The shared speed is ${fig(c.vn1)} m/s. The collision loses ${fig(c.loss)} J.`,
      };
    }
    return {
      title: 'Momentum holds for every restitution',
      body: String.raw`The speeds along the line are ${fig(c.vn1)} and ${fig(c.vn2)} m/s. The kinetic energy lost is ${fig(c.loss)} J.`,
    };
  },
});
