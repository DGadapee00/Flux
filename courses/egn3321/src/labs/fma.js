import { G } from '@flux/subjects/mechanics/constants.js';
import { atwood, hangingIncline, incline } from '@flux/subjects/mechanics/dynamics.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'atwood',
    name: 'Two masses, one pulley',
    m1: 2,
    m2: 4,
    block: 3,
    hang: 6,
    theta: 30,
    mus: 0.3,
    muk: 0.2,
    v0: 0,
    t: 1,
  },
  {
    id: 'incline',
    name: 'Block on a rough incline',
    m1: 2,
    m2: 4,
    block: 3,
    hang: 0,
    theta: 30,
    mus: 0.2,
    muk: 0.15,
    v0: 0,
    t: 1,
  },
  {
    id: 'tow',
    name: 'Incline tied to a hanging mass',
    m1: 2,
    m2: 4,
    block: 4,
    hang: 6,
    theta: 30,
    mus: 0.3,
    muk: 0.2,
    v0: 0,
    t: 1,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.m1 = sc.m1;
  state.m2 = sc.m2;
  state.block = sc.block;
  state.hang = sc.hang;
  state.theta = sc.theta;
  state.mus = sc.mus;
  state.muk = sc.muk;
  state.v0 = sc.v0;
  state.t = sc.t;
}

function trap(a, v0, t, steps = 800) {
  if (!(t > 0) || !Number.isFinite(a)) return { s: 0, v: v0 };
  const dt = t / steps;
  let s = 0;
  let v = v0;
  for (let i = 0; i < steps; i++) {
    const next = v + a * dt;
    s += 0.5 * (v + next) * dt;
    v = next;
  }
  return { s, v };
}

function workGap(W, dK) {
  return Math.abs(W - dK) / Math.max(1, Math.abs(dK));
}

function circle(cx, cy, r, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function rect(cx, cy, w, h, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const corners = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
    [-w / 2, -h / 2],
  ];
  return corners.map(([x, y]) => ({ x: cx + x * c - y * s, y: cy + x * s + y * c }));
}

function solveIncline(state) {
  const rest = incline({ mass: state.block, thetaDeg: state.theta, mu: state.mus, g: G, motion: 'rest' });
  if (Math.abs(state.v0) <= 1e-9 && rest.holds) {
    return { aDown: 0, N: rest.N, f: rest.f, regime: 'static' };
  }
  const motion = state.v0 < -1e-9 ? 'up' : 'down';
  const go = incline({ mass: state.block, thetaDeg: state.theta, mu: state.muk, g: G, motion });
  return { aDown: go.aDown, N: go.N, f: go.f, regime: 'kinetic' };
}

export default defineLab({
  id: 'fma',
  exam: 'u2',
  title: 'F = ma',
  hint: 'Move a mass. The tension is the hanging weight only while a is zero.',
  camera: { pos: new THREE.Vector3(0, 0.2, 12), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = { anim: { playing: false } };
    apply('atwood', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('fm-m1', 'm₁ (kg)', 2, 0.5, 8, 0.1)}
      ${slider('fm-m2', 'm₂ (kg)', 4, 0.5, 8, 0.1)}
      ${slider('fm-block', 'block (kg)', 4, 0.5, 8, 0.1)}
      ${slider('fm-hang', 'hanging (kg)', 6, 0.5, 8, 0.1)}
      ${slider('fm-theta', 'θ (deg)', 30, 10, 50, 1)}
      ${slider('fm-mus', 'μₛ', 0.3, 0, 0.8, 0.01)}
      ${slider('fm-muk', 'μₖ', 0.2, 0, 0.8, 0.01)}
      ${slider('fm-v0', 'v₀ (m/s)', 0, -4, 4, 0.1)}
      ${slider('fm-t', 'time (s)', 1, 0, 2, 0.05)}
      <p class="tiny">Grey is weight, gold is tension, teal is the normal, pink is friction. Space plays the motion.</p>`;
  },
  bind(api) {
    bindSlider('fm-m1', (s, v) => { s.m1 = v; }, api);
    bindSlider('fm-m2', (s, v) => { s.m2 = v; }, api);
    bindSlider('fm-block', (s, v) => { s.block = v; }, api);
    bindSlider('fm-hang', (s, v) => { s.hang = v; }, api);
    bindSlider('fm-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('fm-mus', (s, v) => {
      s.mus = v;
      if (s.muk > v) s.muk = v;
    }, api);
    bindSlider('fm-muk', (s, v) => { s.muk = Math.min(v, s.mus); }, api);
    bindSlider('fm-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('fm-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const atwoodOn = state.scenarioId === 'atwood';
    set('fm-m1', state.m1);
    set('fm-m2', state.m2);
    set('fm-block', state.block);
    set('fm-hang', state.hang);
    set('fm-theta', state.theta);
    set('fm-mus', state.mus);
    set('fm-muk', state.muk);
    set('fm-v0', state.v0);
    set('fm-t', state.t);
    showField('fm-m1', atwoodOn);
    showField('fm-m2', atwoodOn);
    showField('fm-block', !atwoodOn);
    showField('fm-hang', state.scenarioId === 'tow');
    showField('fm-theta', !atwoodOn);
    showField('fm-mus', !atwoodOn);
    showField('fm-muk', !atwoodOn);
    showField('fm-v0', true);
  },
  init(ctx) {
    const group = new THREE.Group();
    const slope = makeLine(M.grey);
    const cord = makeLine(M.gold);
    const wheel = makeLine(M.grey);
    const boxA = makeLine(M.blue);
    const boxB = makeLine(M.red);
    const mk = (color) => forceArrow(new THREE.Vector3(0, -1, 0), color, 0.03, 0.22, 0.14);
    const wA = mk(M.grey);
    const wB = mk(M.grey);
    const tA = mk(M.gold);
    const tB = mk(M.gold);
    const normal = mk(M.teal);
    const friction = mk(M.pink);
    group.add(slope, cord, wheel, boxA, boxB, wA, wB, tA, tB, normal, friction);
    ctx.scene.add(group);
    return { group, slope, cord, wheel, boxA, boxB, wA, wB, tA, tB, normal, friction };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    state.muk = Math.min(state.muk, state.mus);
    if (state.scenarioId === 'atwood') {
      const row = atwood(state.m1, state.m2, G);
      const trip = trap(row.a, state.v0, state.t);
      const W = (state.m2 - state.m1) * G * trip.s;
      const dK = 0.5 * (state.m1 + state.m2) * (trip.v ** 2 - state.v0 ** 2);
      Object.assign(computed, {
        a: row.a,
        T: row.T,
        N: 0,
        f: 0,
        regime: Math.abs(row.a) < 1e-9 ? 'static' : 'kinetic',
        weight: state.m2 * G,
        s: trip.s,
        v: trip.v,
        gap: workGap(W, dK),
      });
      return;
    }
    if (state.scenarioId === 'incline') {
      const row = solveIncline(state);
      const trip = trap(row.aDown, state.v0, state.t);
      const th = state.theta * Math.PI / 180;
      const driveDown = state.block * G * Math.sin(th);
      const fDown = row.regime === 'static' ? -row.f : state.v0 < 0 ? row.f : -row.f;
      const W = (driveDown + fDown) * trip.s;
      const dK = 0.5 * state.block * (trip.v ** 2 - state.v0 ** 2);
      Object.assign(computed, {
        a: row.aDown,
        T: 0,
        N: row.N,
        f: row.f,
        regime: row.regime,
        weight: state.block * G,
        s: trip.s,
        v: trip.v,
        gap: workGap(W, dK),
      });
      return;
    }
    const row = hangingIncline({
      block: state.block,
      hang: state.hang,
      thetaDeg: state.theta,
      muk: state.muk,
      mus: state.mus,
      g: G,
      v0: state.v0,
    });
    const trip = trap(row.a, state.v0, state.t);
    const th = state.theta * Math.PI / 180;
    const W = (state.hang * G - state.block * G * Math.sin(th) + row.f) * trip.s;
    const dK = 0.5 * (state.block + state.hang) * (trip.v ** 2 - state.v0 ** 2);
    Object.assign(computed, {
      a: row.a,
      T: row.T,
      N: row.N,
      f: row.f,
      regime: row.regime,
      weight: state.hang * G,
      s: trip.s,
      v: trip.v,
      gap: workGap(W, dK),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    for (const line of [h.slope, h.cord, h.wheel, h.boxA, h.boxB]) line.visible = true;
    const hide = (arrow) => { arrow.visible = false; };
    const push = (arrow, x, y, fx, fy, scale) => {
      placeIncomingArrow(arrow, new THREE.Vector3(x, y, 0), fx, fy, { scale, minLength: 0.08, gap: 0.02 });
    };
    if (state.scenarioId === 'atwood') {
      const s = Math.max(-1.1, Math.min(1.1, computed.s * 0.35));
      const y1 = 0.15 + s;
      const y2 = 0.15 - s;
      setLine(h.slope, [{ x: -1.8, y: 1.7 }, { x: 1.8, y: 1.7 }]);
      setLine(h.wheel, circle(0, 1.35, 0.28));
      setLine(h.cord, [
        { x: -0.28, y: y1 },
        { x: -0.28, y: 1.35 },
        { x: 0.28, y: 1.35 },
        { x: 0.28, y: y2 },
      ]);
      setLine(h.boxA, rect(-0.28, y1, 0.55, 0.45, 0));
      setLine(h.boxB, rect(0.28, y2, 0.55, 0.45, 0));
      const scale = 1.4 / (Math.max(state.m1, state.m2, 0.5) * G);
      push(h.wA, -0.28, y1, 0, -state.m1 * G, scale);
      push(h.wB, 0.28, y2, 0, -state.m2 * G, scale);
      push(h.tA, -0.28, y1, 0, computed.T, scale);
      push(h.tB, 0.28, y2, 0, computed.T, scale);
      hide(h.normal);
      hide(h.friction);
      return;
    }
    const th = state.theta * Math.PI / 180;
    const toe = { x: -3.1, y: -1.5 };
    const L = 4.4;
    const top = { x: toe.x + L * Math.cos(th), y: toe.y + L * Math.sin(th) };
    const along = 2.1 + (state.scenarioId === 'incline' ? -computed.s * 0.25 : computed.s * 0.25);
    const clamped = Math.max(0.7, Math.min(L - 0.7, along));
    const bx = toe.x + clamped * Math.cos(th);
    const by = toe.y + clamped * Math.sin(th);
    const pulley = { x: top.x + 0.22, y: top.y + 0.05 };
    const hangY = pulley.y - 1.15 - (state.scenarioId === 'tow' ? computed.s * 0.25 : 0);
    setLine(h.slope, [toe, top, { x: top.x, y: toe.y }, toe]);
    setLine(h.wheel, circle(pulley.x, pulley.y, 0.16));
    setLine(h.boxA, rect(bx, by, 0.55, 0.38, th));
    const scale = 1.5 / Math.max(state.block * G, 1);
    const c = Math.cos(th);
    const s = Math.sin(th);
    push(h.wA, bx, by, 0, -state.block * G, scale);
    push(h.normal, bx, by, -computed.N * s, computed.N * c, scale);
    const fUp = state.scenarioId === 'incline' && computed.regime === 'kinetic' && state.v0 < 0
      ? -computed.f
      : computed.f;
    push(h.friction, bx, by, fUp * c, fUp * s, scale);
    if (state.scenarioId === 'tow') {
      setLine(h.cord, [
        { x: bx + 0.3 * c, y: by + 0.3 * s },
        { x: pulley.x, y: pulley.y },
        { x: pulley.x, y: hangY },
      ]);
      setLine(h.boxB, rect(pulley.x, hangY, 0.42, 0.42, 0));
      push(h.wB, pulley.x, hangY, 0, -state.hang * G, scale);
      push(h.tA, bx, by, computed.T * c, computed.T * s, scale);
      push(h.tB, pulley.x, hangY, 0, computed.T, scale);
    } else {
      setLine(h.cord, [{ x: 0, y: 0 }, { x: 0, y: 0 }]);
      h.cord.visible = false;
      h.wheel.visible = false;
      h.boxB.visible = false;
      hide(h.wB);
      hide(h.tA);
      hide(h.tB);
      return;
    }
    h.cord.visible = true;
    h.wheel.visible = true;
    h.boxB.visible = true;
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.t += dt;
    if (state.t > 2) state.t = 0;
    return true;
  },
  law(state) {
    if (state.scenarioId === 'atwood') {
      return [String.raw`\sum F = ma`, String.raw`T=\dfrac{2 m_1 m_2}{m_1+m_2}\,g`];
    }
    if (state.scenarioId === 'incline') {
      return [String.raw`\sum F = ma`, String.raw`f_s \le \mu_s N`];
    }
    return [String.raw`\sum F = ma`, String.raw`Mg - T = Ma`];
  },
  liveRows(state, c) {
    const rows = [kv('$a$', `${fig(c.a)} m/s²`)];
    if (state.scenarioId !== 'incline') rows.push(kv('$T$', `${fig(c.T)} N`));
    if (state.scenarioId !== 'atwood') rows.push(kv('$N$', `${fig(c.N)} N`));
    rows.push(kv(state.scenarioId === 'atwood' ? '$m_2 g$' : '$W$', `${fig(c.weight)} N`));
    return rows.join('');
  },
  readout(state, c) {
    const cellsIn = [
      ['acceleration', `${fig(c.a)} m/s²`],
      ['speed', `${fig(c.v)} m/s`],
    ];
    if (state.scenarioId === 'incline') cellsIn.push(['normal', `${fig(c.N)} N`], ['friction', `${fig(c.f)} N`]);
    else cellsIn.push(['tension', `${fig(c.T)} N`], ['hanging weight', `${fig(c.weight)} N`]);
    return cells(cellsIn);
  },
  coach(state, c) {
    if (state.scenarioId === 'atwood') {
      const off = Math.abs(c.T - c.weight) > 0.05;
      return {
        title: off ? 'Tension is not the hanging weight' : 'Equal masses hang at their weight',
        body: off
          ? String.raw`The heavier side weighs $${fig(c.weight)}\ \mathrm{N}$. The rope carries $${fig(c.T)}\ \mathrm{N}$, because that side accelerates.`
          : 'With a = 0 the rope holds the weight. Acceleration is what pulls those two numbers apart.',
      };
    }
    if (c.regime === 'static') {
      return {
        title: 'Static friction is holding it',
        body: String.raw`The friction force is $${fig(c.f)}\ \mathrm{N}$, whatever equilibrium needs, and not more than $\mu_s N$.`,
      };
    }
    return {
      title: 'Kinetic friction is μₖN',
      body: String.raw`It is sliding, so friction is $${fig(Math.abs(c.f))}\ \mathrm{N}$ and it opposes the motion. The acceleration is $${fig(c.a)}\ \mathrm{m/s^2}$.`,
    };
  },
});
