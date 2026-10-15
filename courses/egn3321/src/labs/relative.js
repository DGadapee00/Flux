import { relativeNumeric, relativeOf } from '@flux/subjects/mechanics/path.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { M, makeArrow, makeDot, setArrow } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'cross',
    name: 'Crossing paths',
    ax: -2, ay: 0, bx: 2, by: 1,
    vax: 3, vay: 1, vbx: 1, vby: 4,
    aax: 0, aay: 0, abx: 0, aby: 0,
  },
  {
    id: 'chase',
    name: 'B pulling ahead',
    ax: 0, ay: 0, bx: 3, by: 0.5,
    vax: 2, vay: 0, vbx: 4, vby: 0.5,
    aax: 0.5, aay: 0, abx: -0.5, aby: 0,
  },
  {
    id: 'fall',
    name: 'Both in gravity',
    ax: -1, ay: 2, bx: 2, by: 3,
    vax: 2, vay: 3, vbx: -1, vby: 1,
    aax: 0, aay: -9.81, abx: 0, aby: -9.81,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  for (const key of ['ax', 'ay', 'bx', 'by', 'vax', 'vay', 'vbx', 'vby', 'aax', 'aay', 'abx', 'aby']) {
    state[key] = sc[key];
  }
}

function body(state, prefix) {
  return {
    r: v(state[`${prefix}x`], state[`${prefix}y`], 0),
    v: v(state[`v${prefix}x`], state[`v${prefix}y`], 0),
    a: v(state[`a${prefix}x`], state[`a${prefix}y`], 0),
  };
}

export default defineLab({
  id: 'relative',
  exam: 'u1',
  title: 'Relative',
  hint: 'The relative velocity is a difference. It can point where neither velocity does.',
  camera: { pos: new THREE.Vector3(0, 1, 16), target: new THREE.Vector3(0, 1, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cross', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    const row = (id, label, val) => slider(id, label, val, -8, 8, 0.5);
    return `
      ${row('rel-vax', 'v_Ax (m/s)', 3)}
      ${row('rel-vay', 'v_Ay (m/s)', 1)}
      ${row('rel-vbx', 'v_Bx (m/s)', 1)}
      ${row('rel-vby', 'v_By (m/s)', 4)}
      ${row('rel-ax', 'A x (m)', -2)}
      ${row('rel-ay', 'A y (m)', 0)}
      ${row('rel-bx', 'B x (m)', 2)}
      ${row('rel-by', 'B y (m)', 1)}
      <p class="tiny">Red is A, blue is B. White arrows are their velocities. Gold, drawn at A, is v_B/A.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('rel-vax', 'vax');
    link('rel-vay', 'vay');
    link('rel-vbx', 'vbx');
    link('rel-vby', 'vby');
    link('rel-ax', 'ax');
    link('rel-ay', 'ay');
    link('rel-bx', 'bx');
    link('rel-by', 'by');
  },
  syncControls(state) {
    for (const [id, key] of [
      ['rel-vax', 'vax'], ['rel-vay', 'vay'], ['rel-vbx', 'vbx'], ['rel-vby', 'vby'],
      ['rel-ax', 'ax'], ['rel-ay', 'ay'], ['rel-bx', 'bx'], ['rel-by', 'by'],
    ]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    const dotA = makeDot(M.red, 0.16);
    const dotB = makeDot(M.blue, 0.16);
    const velA = makeArrow(M.white);
    const velB = makeArrow(M.white);
    const rel = makeArrow(M.gold);
    group.add(dotA, dotB, velA, velB, rel);
    ctx.scene.add(group);
    return { group, dotA, dotB, velA, velB, rel };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const A = body(state, 'a');
    const B = body(state, 'b');
    const rel = relativeOf(A, B);
    const t = 0.4;
    const path = (P) => (tt) => ({
      x: P.r.x + P.v.x * tt + 0.5 * P.a.x * tt * tt,
      y: P.r.y + P.v.y * tt + 0.5 * P.a.y * tt * tt,
      z: 0,
    });
    const num = relativeNumeric(path(A), path(B), t);
    const laterA = {
      r: path(A)(t),
      v: v(A.v.x + A.a.x * t, A.v.y + A.a.y * t, 0),
      a: A.a,
    };
    const laterB = {
      r: path(B)(t),
      v: v(B.v.x + B.a.x * t, B.v.y + B.a.y * t, 0),
      a: B.a,
    };
    const later = relativeOf(laterA, laterB);
    Object.assign(computed, {
      vx: rel.v.x,
      vy: rel.v.y,
      ax: rel.a.x,
      ay: rel.a.y,
      speed: Math.hypot(rel.v.x, rel.v.y),
      accel: Math.hypot(rel.a.x, rel.a.y),
      Ax: A.r.x,
      Ay: A.r.y,
      Bx: B.r.x,
      By: B.r.y,
      vA: A.v,
      vB: B.v,
      gap: Math.max(
        Math.abs(num.v.x - later.v.x),
        Math.abs(num.v.y - later.v.y),
        Math.abs(num.a.x - later.a.x),
        Math.abs(num.a.y - later.a.y),
      ),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    h.dotA.position.set(computed.Ax, computed.Ay, 0);
    h.dotB.position.set(computed.Bx, computed.By, 0);
    setArrow(h.velA, { x: computed.Ax, y: computed.Ay }, computed.vA);
    setArrow(h.velB, { x: computed.Bx, y: computed.By }, computed.vB);
    setArrow(h.rel, { x: computed.Ax, y: computed.Ay }, { x: computed.vx, y: computed.vy });
  },
  law: () => [String.raw`\vec v_{B/A}=\vec v_B-\vec v_A`, String.raw`\vec a_{B/A}=\vec a_B-\vec a_A`],
  liveRows(state, c) {
    return [
      kv('$v_{B/A,x}$', `${fig(c.vx)} m/s`),
      kv('$v_{B/A,y}$', `${fig(c.vy)} m/s`),
      kv('$|v_{B/A}|$', `${fig(c.speed)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['v_x rel', `${fig(c.vx)} m/s`],
      ['v_y rel', `${fig(c.vy)} m/s`],
      ['speed rel', `${fig(c.speed)} m/s`],
      ['|a| rel', `${fig(c.accel)} m/s²`],
    ]);
  },
  coach(state, c) {
    return {
      title: 'Subtract the vectors',
      body: String.raw`Seen from A, B moves at $${fig(c.vx)}\,\hat{\imath} + ${fig(c.vy)}\,\hat{\jmath}$ m/s. That direction is neither v_A nor v_B.`,
    };
  },
});
