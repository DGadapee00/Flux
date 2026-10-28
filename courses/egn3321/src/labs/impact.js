import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { collideOblique, impactLoss } from '@flux/subjects/mechanics/momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
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


function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.m1 = sc.m1;
  state.m2 = sc.m2;
  state.u1 = sc.u1;
  state.u2 = sc.u2;
  state.e = sc.e;
  state.theta = sc.theta;
  state.t = -1;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Impact (Hibbeler §15.4): two balls collide, head on or at an angle. Shows that momentum along the
 * line of impact holds for every coefficient of restitution, that e alone sets how much kinetic energy
 * is lost, and that in an oblique impact the tangent velocity passes through unchanged. Play runs the
 * collision: the bars show the momentum before and after, and the energy that went missing.
 *
 * Recompute: momentum and restitution along the line. Check: the energy lost against its closed form,
 * and the mass centre's velocity, which the impact cannot change.
 */

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
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'e', lo: 0, hi: 1 }),
  hint: 'Momentum holds for every e. The tangent velocity does not change.',
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
      <p class="tiny">White is the first body, gold is the second. The dashed line is the line of impact; θ is measured from it. Play runs the collision; the bars compare momentum along the line, and kinetic energy, before and after.</p>`;
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
  tick(dt, state) {
    return advance(state, dt, { lo: -1, hi: 1.2, rate: 0.5 });
  },
  compute(state) {
    const computed = {};
    if (!(state.m1 > 0) || !(state.m2 > 0)) return { vn1: 0, vn2: 0, vt1: 0, vt2: 0, loss: 0, vcm: 0, gap: 0, T0: 0 };
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
      T0,
      in: incoming,
    });
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const r1 = 0.25 * Math.cbrt(state.m1);
    const r2 = 0.25 * Math.cbrt(state.m2);
    const t = Number(state.t) || 0;
    const inc = c.in || { un1: 0, ut1: 0, un2: 0, ut2: 0 };
    // At t = 0 the balls touch on the line of impact; before, they approach; after, they leave.
    const c1 = t < 0 ? [-r1 + inc.un1 * t * 0.5, inc.ut1 * t * 0.5] : [-r1 + c.vn1 * t * 0.5, c.vt1 * t * 0.5];
    const c2 = t < 0 ? [r2 + inc.un2 * t * 0.5, inc.ut2 * t * 0.5] : [r2 + c.vn2 * t * 0.5, c.vt2 * t * 0.5];
    const reach = Math.max(2.5, 0.6 * Math.max(Math.abs(inc.un1), Math.abs(c.vn1), Math.abs(c.vn2), Math.abs(inc.ut1)) + 0.8);
    const S = sceneIn(B, left, { x0: -reach, x1: reach, y0: -0.7 * reach, y1: 0.7 * reach });
    seg(S, [-reach, 0], [reach, 0], { color: alpha(C.text, 0.3), width: 1, dash: [6, 4] });
    label(S, 'line of impact', [reach, 0], { color: C.muted, align: 'right', dy: -8 });
    circle(S, c1, r1, { stroke: C.text, width: 2.5, fill: alpha(C.text, 0.15) });
    circle(S, c2, r2, { stroke: C.gold, width: 2.5, fill: alpha(C.gold, 0.15) });
    const peak = Math.max(1, Math.abs(inc.un1), Math.abs(inc.ut1), Math.abs(inc.un2), Math.abs(c.vn1), Math.abs(c.vn2));
    const k = (0.35 * reach * S.k) / peak;
    const v1 = t < 0 ? [inc.un1, inc.ut1] : [c.vn1, c.vt1];
    const v2 = t < 0 ? [inc.un2, inc.ut2] : [c.vn2, c.vt2];
    if (Math.hypot(...v1) > 1e-6) vec(S, c1, v1, k, { color: C.text, label: veiled ? 'v₁' : `${fig(Math.hypot(...v1))} m/s` });
    if (Math.hypot(...v2) > 1e-6) vec(S, c2, v2, k, { color: C.gold, label: veiled ? 'v₂' : `${fig(Math.hypot(...v2))} m/s` });
    label(S, t < 0 ? 'before' : 'after', [-reach, 0.7 * reach], { color: C.muted, align: 'left', dy: 12 });
    if (veiled) return;

    // Momentum along the line, and kinetic energy, before and after.
    const p1b = state.m1 * inc.un1;
    const p2b = state.m2 * inc.un2;
    const p1a = state.m1 * c.vn1;
    const p2a = state.m2 * c.vn2;
    const Ta = c.T0 - c.loss;
    const pTop = Math.max(1, Math.abs(p1b) + Math.abs(p2b), Math.abs(p1a) + Math.abs(p2a)) * 1.2;
    const P = chartIn(B, right, { lo: 0, hi: 4 }, { lo: -pTop * 0.15, hi: pTop });
    axes(P, { xLabel: 'momentum along the line: before | after', yLabel: 'kg·m/s', xFmt: () => '' });
    const stack = (x, a, b2) => {
      poly(P, [[x, 0], [x + 0.7, 0], [x + 0.7, a], [x, a]], { fill: alpha(C.text, 0.7), stroke: null });
      poly(P, [[x, a], [x + 0.7, a], [x + 0.7, a + b2], [x, a + b2]], { fill: alpha(C.gold, 0.7), stroke: null });
      label(P, fig(a + b2), [x + 0.35, a + b2], { color: C.text, dy: -8 });
    };
    stack(0.35, p1b, p2b);
    stack(1.35, p1a, p2a);
    // Kinetic energy, on its own scale at the right: the gap is what the impact took.
    const eScale = (pTop * 0.85) / Math.max(c.T0, 1e-9);
    poly(P, [[2.6, 0], [3.0, 0], [3.0, c.T0 * eScale], [2.6, c.T0 * eScale]], { fill: alpha(C.teal, 0.55), stroke: null });
    poly(P, [[3.25, 0], [3.65, 0], [3.65, Ta * eScale], [3.25, Ta * eScale]], { fill: alpha(C.teal, 0.55), stroke: null });
    if (c.loss > 1e-6) poly(P, [[3.25, Ta * eScale], [3.65, Ta * eScale], [3.65, c.T0 * eScale], [3.25, c.T0 * eScale]], { fill: null, stroke: C.pink, width: 1.5 });
    label(P, `T: ${fig(c.T0)} → ${fig(Ta)} J`, [3.1, c.T0 * eScale], { color: C.teal, dy: -8 });
    line(P, [[2.3, -pTop * 0.15], [2.3, pTop]], { color: alpha(C.text, 0.25), width: 1 });
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
