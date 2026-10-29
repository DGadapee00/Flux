import { G } from '@flux/subjects/mechanics/constants.js';
import { atwood, hangingIncline, incline } from '@flux/subjects/mechanics/dynamics.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha as fade, axes, begin, chartIn, circle as ring, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
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

/** A box's outline: centre (cx, cy), w by h, turned by ang. */
function rect(cx, cy, w, h, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
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

/**
 * Newton's second law on connected bodies (Hibbeler §13.4): an Atwood machine, a block on a rough
 * incline, and an incline tied over a pulley to a hanging mass. Shows that a rope pulls with the
 * hanging weight only while nothing accelerates, and that friction is μN only once the block slides.
 * Each body carries its free-body diagram and, beside it, its kinetic diagram, m a.
 *
 * Recompute: ΣF = m a on each body. Check: work and energy over the run, stepped in time.
 */
export default defineLab({
  id: 'fma',
  exam: 'u2',
  title: 'F = ma',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Move a mass. The tension is the hanging weight only while a is zero.',
  scenarios: SCENARIOS,
  sweep: (state) => (state.scenarioId === 'atwood' ? { key: 'm2', lo: 0.5, hi: 8 } : { key: 'theta', lo: 10, hi: 50 }),
  defaultState() {
    const s = { anim: { playing: false }, show: { play: false } };
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
      <p class="tiny">Grey is weight, gold is tension, teal is the normal, pink is friction: the free-body diagram. Purple dashed is m a, the kinetic diagram, drawn twice the forces' scale. Play runs two seconds of motion.</p>`;
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
  recompute(state, computed) {
    state.muk = Math.min(state.muk, state.mus);
    Object.assign(computed, this.compute(state));
  },
  compute(state) {
    const computed = {};
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
      return computed;
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
      return computed;
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
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.58);
    const kin = (S, at, dir, ma, k) => {
      if (Math.abs(ma) > 1e-6) vec(S, at, [dir[0] * ma, dir[1] * ma], 2 * k, { color: C.purple, dash: [5, 4], width: 2, label: veiled ? 'ma' : `ma ${fig(Math.abs(ma))} N` });
    };
    if (state.scenarioId === 'atwood') {
      // A pulley hung from a beam; the boxes move with the run, m₂ down when it is heavier.
      const S = sceneIn(B, left, { x0: -2.2, x1: 2.2, y0: -2.3, y1: 2.0 });
      poly(S, [[-1.4, 1.75], [1.4, 1.75], [1.4, 1.9], [-1.4, 1.9]], { fill: fade(C.text, 0.25), stroke: null });
      seg(S, [0, 1.75], [0, 1.35], { color: C.dim, width: 2 });
      ring(S, [0, 1.35], 0.28, { stroke: C.dim, width: 2 });
      const shift = Math.max(-0.65, Math.min(0.65, c.s * 0.25));
      const y1 = 0.1 + shift;
      const y2 = 0.1 - shift;
      seg(S, [-0.28, 1.35], [-0.28, y1 + 0.22], { color: C.gold, width: 1.5 });
      seg(S, [0.28, 1.35], [0.28, y2 + 0.22], { color: C.gold, width: 1.5 });
      poly(S, rect(-0.28, y1, 0.5, 0.44, 0), { fill: fade(C.blue, 0.35), stroke: C.blue, width: 1.5 });
      poly(S, rect(0.28, y2, 0.5, 0.44, 0), { fill: fade(C.red, 0.3), stroke: C.red, width: 1.5 });
      label(S, 'm₁', [-0.28, y1], { color: C.text });
      label(S, 'm₂', [0.28, y2], { color: C.text });
      const k = (1.1 * S.k) / (Math.max(state.m1, state.m2, 0.5) * G);
      // m₁ on the left: its forces outside the pulley, its m a beside them.
      vec(S, [-0.62, y1], [0, -state.m1 * G], k, { color: C.dim, label: 'm₁g' });
      vec(S, [-0.62, y1], [0, c.T], k, { color: C.gold, label: 'T' });
      vec(S, [0.62, y2], [0, -state.m2 * G], k, { color: C.dim, label: 'm₂g' });
      vec(S, [0.62, y2], [0, c.T], k, { color: C.gold, label: 'T' });
      kin(S, [-1.05, y1], [0, 1], state.m1 * c.a, k);
      kin(S, [1.05, y2], [0, -1], state.m2 * c.a, k);
    } else {
      const th = (state.theta * Math.PI) / 180;
      const tow = state.scenarioId === 'tow';
      const L = 4.4;
      const toe = [-2.6, -1.6];
      const top = [toe[0] + L * Math.cos(th), toe[1] + L * Math.sin(th)];
      const S = sceneIn(B, left, { x0: -2.9, x1: top[0] + 1.3, y0: -2.9, y1: top[1] + 0.9 });
      poly(S, [toe, top, [top[0], toe[1]]], { fill: fade(C.text, 0.12), stroke: fade(C.text, 0.6), width: 1.5 });
      const u = [Math.cos(th), Math.sin(th)];
      const n = [-Math.sin(th), Math.cos(th)];
      // Up the slope is +s for the tow; the lone block slides down.
      const along = 2.1 + (tow ? c.s * 0.25 : -c.s * 0.25);
      const at = Math.max(0.6, Math.min(L - 0.6, along));
      const centre = [toe[0] + at * u[0] + 0.2 * n[0], toe[1] + at * u[1] + 0.2 * n[1]];
      poly(S, rect(centre[0], centre[1], 0.55, 0.38, th), { fill: fade(C.blue, 0.35), stroke: C.blue, width: 1.5 });
      const scale = Math.max(state.block * G, tow ? state.hang * G : 0, 1);
      const k = (1.2 * S.k) / scale;
      vec(S, centre, [0, -state.block * G], k, { color: C.dim, label: 'W' });
      vec(S, centre, [c.N * n[0], c.N * n[1]], k, { color: C.teal, label: 'N' });
      // Friction acts along the slope: up it when the block slides down or is held, down it when the tow wins.
      const fUp = state.scenarioId === 'incline' && c.regime === 'kinetic' && state.v0 < 0 ? -c.f : c.f;
      if (Math.abs(fUp) > 1e-6) vec(S, [centre[0] - 0.1 * n[0], centre[1] - 0.1 * n[1]], [fUp * u[0], fUp * u[1]], k, { color: C.pink, label: 'f' });
      const aUp = tow ? c.a : -c.a;
      kin(S, [centre[0] + 0.55 * n[0], centre[1] + 0.55 * n[1]], u, state.block * aUp, k);
      if (tow) {
        const pulley = [top[0] + 0.2, top[1] + 0.05];
        ring(S, pulley, 0.16, { stroke: C.dim, width: 2 });
        const hy = pulley[1] - 1.2 - c.s * 0.25;
        seg(S, [centre[0] + 0.28 * u[0], centre[1] + 0.28 * u[1]], pulley, { color: C.gold, width: 1.5 });
        seg(S, [pulley[0] + 0.16, pulley[1]], [pulley[0] + 0.16, hy + 0.21], { color: C.gold, width: 1.5 });
        const hx = pulley[0] + 0.16;
        poly(S, rect(hx, hy, 0.42, 0.42, 0), { fill: fade(C.red, 0.3), stroke: C.red, width: 1.5 });
        vec(S, [centre[0] + 0.28 * u[0], centre[1] + 0.28 * u[1]], [c.T * u[0], c.T * u[1]], k, { color: C.gold, label: 'T' });
        vec(S, [hx + 0.4, hy], [0, -state.hang * G], k, { color: C.dim, label: 'Mg' });
        vec(S, [hx + 0.4, hy], [0, c.T], k, { color: C.gold, label: 'T' });
        kin(S, [hx + 0.85, hy], [0, -1], state.hang * c.a, k);
      }
    }
    if (veiled) return;

    // Speed through the two-second run; a straight line, because a is constant.
    const ts = Array.from({ length: 41 }, (_, i) => (2 * i) / 40);
    const vs = ts.map((t) => [t, state.v0 + c.a * t]);
    const vmax = Math.max(1, ...vs.map((q) => Math.abs(q[1]))) * 1.15;
    const P = chartIn(B, right, { lo: 0, hi: 2 }, { lo: -vmax, hi: vmax });
    axes(P, { xLabel: 'time (s)', yLabel: state.scenarioId === 'atwood' ? 'speed of m₂ downward (m/s)' : 'speed along the slope (m/s)' });
    line(P, [[0, 0], [2, 0]], { color: fade(C.text, 0.4), width: 1 });
    line(P, vs, { color: C.text, width: 2.5 });
    dot(P, state.t, c.v, { color: C.yellow, r: 5 });
  },
  tick(dt, state) {
    if (!playing(state)) return false;
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
