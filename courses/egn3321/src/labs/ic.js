import {
  cycloid,
  fourBar,
  instantCenter,
  omegaFromCenter,
  relativeVelocity,
  rollingPoint,
} from '@flux/subjects/mechanics/rigid2d.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const DEG = Math.PI / 180;

/**
 * The instantaneous centre of zero velocity (Hibbeler §16.6): a ladder sliding down a wall, a wheel
 * rolling, and a four-bar linkage's coupler. Shows that the centre is where the perpendiculars to two
 * known velocities meet, that every point of the body then moves as if it turned about it, and that
 * the centre itself moves: play any of the three and watch it travel. For the ladder it rides a
 * circle about the corner.
 *
 * Recompute: the centre from two velocity directions, then ω = v/r. Check: the motion differentiated
 * numerically.
 */
const LINK = { crank: 1, coupler: 2.5, rocker: 2, ground: 3 };

const SCENARIOS = [
  { id: 'ladder', name: 'Sliding ladder', mode: 'ladder', length: 4, theta: 60, foot: 2 },
  { id: 'shallow', name: 'Shallower ladder', mode: 'ladder', length: 4, theta: 30, foot: 2 },
  { id: 'wheel', name: 'Rolling wheel', mode: 'wheel', radius: 0.4, speed: 2 },
  { id: 'linkage', name: 'Four-bar', mode: 'link', linkTheta: 60, linkOmega: 2, ...LINK },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.length = sc.length ?? state.length ?? 4;
  state.theta = sc.theta ?? state.theta ?? 60;
  state.foot = sc.foot ?? state.foot ?? 2;
  state.radius = sc.radius ?? state.radius ?? 0.4;
  state.speed = sc.speed ?? state.speed ?? 2;
  state.linkTheta = sc.linkTheta ?? state.linkTheta ?? 60;
  state.linkOmega = sc.linkOmega ?? state.linkOmega ?? 2;
  state.crank = sc.crank ?? LINK.crank;
  state.coupler = sc.coupler ?? LINK.coupler;
  state.rocker = sc.rocker ?? LINK.rocker;
  state.ground = sc.ground ?? LINK.ground;
}

function rel(got, want) {
  return Math.abs(got - want) / Math.max(1, Math.abs(want));
}

function blank(extra) {
  return {
    omega: 0,
    speed: 0,
    icx: 0,
    icy: 0,
    gap: 0,
    ax: 0,
    ay: 0,
    bx: 0,
    by: 0,
    cx: 0,
    cy: 0,
    vx: 0,
    vy: 0,
    ux: 0,
    uy: 0,
    ...extra,
  };
}

function ladderPose(state) {
  const L = Number(state.length) || 0;
  const th = (Number(state.theta) || 0) * DEG;
  const footSpeed = Number(state.foot) || 0;
  const foot = { x: L * Math.cos(th), y: 0 };
  const top = { x: 0, y: L * Math.sin(th) };
  const sin = Math.sin(th);
  if (!(L > 0) || !(Math.abs(sin) > 1e-6)) {
    return blank({ ax: foot.x, ay: 0, bx: top.x, by: top.y, vx: footSpeed });
  }
  const ic = instantCenter(foot, { x: 1, y: 0 }, top, { x: 0, y: -1 }) || { x: foot.x, y: top.y };
  let omega = omegaFromCenter(foot, { x: footSpeed, y: 0, z: 0 }, ic);
  if (!Number.isFinite(omega)) omega = 0;
  const vTop = relativeVelocity({ x: 0, y: 0, z: 0 }, omega, { x: top.x - ic.x, y: top.y - ic.y, z: 0 });
  const thetaDot = -footSpeed / (L * sin);
  const h = 1e-5;
  const y = (t) => L * Math.sin(th + thetaDot * t);
  const downNum = -((y(h) - y(-h)) / (2 * h));
  const speed = -vTop.y;
  return blank({
    omega,
    speed,
    icx: ic.x,
    icy: ic.y,
    gap: Math.max(rel(omega, -thetaDot), rel(speed, downNum)),
    ax: foot.x,
    ay: foot.y,
    bx: top.x,
    by: top.y,
    vx: footSpeed,
    vy: 0,
    ux: vTop.x,
    uy: vTop.y,
  });
}

function wheelPose(state) {
  const R = Number(state.radius) || 0;
  const v = Number(state.speed) || 0;
  if (!(R > 0)) return blank();
  const center = { x: 0, y: R };
  const top = { x: 0, y: 2 * R };
  if (!(Math.abs(v) > 1e-9)) {
    return blank({ ay: R, by: 2 * R, icy: 0, icx: 0 });
  }
  const side = rollingPoint({ radius: R, speed: v, phi: Math.PI / 2 });
  const sidePt = { x: side.rx, y: R + side.ry };
  const ic = instantCenter(center, { x: v, y: 0 }, sidePt, { x: side.vx, y: side.vy });
  if (!ic) return blank({ ay: R, by: 2 * R });
  let omega = omegaFromCenter(center, { x: v, y: 0, z: 0 }, ic);
  if (!Number.isFinite(omega)) omega = 0;
  const vTop = relativeVelocity({ x: 0, y: 0, z: 0 }, omega, { x: top.x - ic.x, y: top.y - ic.y, z: 0 });
  const speed = Math.hypot(vTop.x, vTop.y);
  const w = v / R;
  const h = 1e-5;
  const at = (p) => cycloid(R, p);
  const phi = Math.PI;
  const vx = (at(phi + w * h).x - at(phi - w * h).x) / (2 * h);
  const vy = (at(phi + w * h).y - at(phi - w * h).y) / (2 * h);
  return blank({
    omega,
    speed,
    icx: ic.x,
    icy: ic.y,
    gap: Math.max(rel(omega, -v / R), rel(speed, Math.hypot(vx, vy))),
    ax: center.x,
    ay: center.y,
    bx: top.x,
    by: top.y,
    vx: v,
    vy: 0,
    ux: vTop.x,
    uy: vTop.y,
  });
}

function linkPose(state) {
  const theta = (Number(state.linkTheta) || 0) * DEG;
  const omega = Number(state.linkOmega) || 0;
  const spec = {
    crank: state.crank,
    coupler: state.coupler,
    rocker: state.rocker,
    ground: state.ground,
    theta,
    omega,
    assembly: 'up',
  };
  const pose = fourBar(spec);
  if (pose.miss || !pose.ic) {
    return blank({ cx: spec.ground });
  }
  const h = 1e-5;
  const ahead = fourBar({ ...spec, theta: theta + omega * h });
  const back = fourBar({ ...spec, theta: theta - omega * h });
  let gap = 0;
  if (!ahead.miss && !back.miss) {
    const vx = (ahead.B.x - back.B.x) / (2 * h);
    const vy = (ahead.B.y - back.B.y) / (2 * h);
    gap = Math.max(rel(pose.vB.x, vx), rel(pose.vB.y, vy));
  }
  return blank({
    omega: pose.omegaCoupler,
    speed: pose.speedB,
    icx: pose.ic.x,
    icy: pose.ic.y,
    gap,
    ax: pose.A.x,
    ay: pose.A.y,
    bx: pose.B.x,
    by: pose.B.y,
    cx: pose.C.x,
    cy: pose.C.y,
    vx: pose.vA.x,
    vy: pose.vA.y,
    ux: pose.vB.x,
    uy: pose.vB.y,
  });
}

function poseOf(state) {
  if (state.mode === 'wheel') return wheelPose(state);
  if (state.mode === 'link') return linkPose(state);
  return ladderPose(state);
}

/** Velocities along a body, each ω × r from the centre: the field the student should picture. */
function field(S, pts, c, k, color) {
  for (const p of pts) {
    const rx = p[0] - c.icx;
    const ry = p[1] - c.icy;
    vec(S, p, [-c.omega * ry, c.omega * rx], k, { color, width: 1.5 });
  }
}

/** The dashed line from a point to the centre: the perpendicular to that point's velocity. */
function guide(S, a, c) {
  seg(S, a, [c.icx, c.icy], { color: alpha(C.gold, 0.55), width: 1, dash: [5, 4] });
}

export default defineLab({
  id: 'ic',
  exam: 'u5',
  title: 'Centre',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The instantaneous centre is the point with zero velocity. It moves as the body moves.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ladder', s);
    return s;
  },
  applyScenario: (id, state) => {
    apply(id, state);
    state.anim = { playing: false };
    state.show = { play: false };
    state.spin = 0;
  },
  sweep: (state) => (state.mode === 'wheel' ? { key: 'speed', lo: 0.4, hi: 6 } : state.mode === 'link' ? { key: 'linkTheta', lo: 0, hi: 100 } : { key: 'theta', lo: 20, hi: 75 }),
  controls() {
    return `
      ${slider('ic-length', 'length (m)', 4, 2, 8, 0.1)}
      ${slider('ic-theta', 'angle (deg)', 60, 20, 75, 1)}
      ${slider('ic-foot', 'foot (m/s)', 2, 0.2, 4, 0.1)}
      ${slider('ic-radius', 'radius (m)', 0.4, 0.2, 1, 0.05)}
      ${slider('ic-speed', 'centre (m/s)', 2, 0.4, 6, 0.1)}
      ${slider('ic-link-theta', 'crank (deg)', 60, 0, 100, 1)}
      ${slider('ic-link-omega', 'crank (rad/s)', 2, 0.5, 6, 0.1)}
      <p class="tiny">Gold is the instantaneous centre; the dashed gold lines are the perpendiculars that find it. White arrows are the two known velocities, faint ones the rest of the body's. The four-bar is a 1 m crank, a 2.5 m coupler, a 2 m rocker, and a 3 m ground. Play moves each at a quarter of real speed.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('ic-length', 'length');
    link('ic-theta', 'theta');
    link('ic-foot', 'foot');
    link('ic-radius', 'radius');
    link('ic-speed', 'speed');
    link('ic-link-theta', 'linkTheta');
    link('ic-link-omega', 'linkOmega');
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(Math.round(Number(val) * 100) / 100);
    };
    set('ic-length', state.length);
    set('ic-theta', state.theta);
    set('ic-foot', state.foot);
    set('ic-radius', state.radius);
    set('ic-speed', state.speed);
    set('ic-link-theta', state.linkTheta);
    set('ic-link-omega', state.linkOmega);
    const ladder = state.mode === 'ladder';
    const wheel = state.mode === 'wheel';
    showField('ic-length', ladder);
    showField('ic-theta', ladder);
    showField('ic-foot', ladder);
    showField('ic-radius', wheel);
    showField('ic-speed', wheel);
    showField('ic-link-theta', state.mode === 'link');
    showField('ic-link-omega', state.mode === 'link');
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    const slow = 0.25 * dt;
    if (state.mode === 'ladder') {
      // The foot slides out at its set speed: θ̇ = −v/(L sin θ). Back to the top at the floor.
      const L = Math.max(Number(state.length) || 4, 0.5);
      const th = (Number(state.theta) || 60) * DEG;
      let next = (th - (slow * (Number(state.foot) || 0)) / (L * Math.sin(th))) / DEG;
      if (next < 20) next = 75;
      state.theta = next;
    } else if (state.mode === 'wheel') {
      state.spin = ((Number(state.spin) || 0) + (slow * (Number(state.speed) || 0)) / Math.max(Number(state.radius) || 0.4, 0.05)) % (2 * Math.PI);
    } else {
      let next = (Number(state.linkTheta) || 0) + (slow * (Number(state.linkOmega) || 0)) / DEG;
      if (next > 100) next = 0;
      state.linkTheta = next;
    }
    return true;
  },
  compute(state) {
    const c = poseOf(state);
    const extra = {};
    if (state.mode === 'ladder') {
      // The centre's path: a circle of radius L about the corner. And the top's speed with angle.
      extra.series = Array.from({ length: 56 }, (_, i) => {
        const th = 20 + i;
        return [th, ladderPose({ ...state, theta: th }).speed];
      });
    } else if (state.mode === 'link') {
      const trail = [];
      const series = [];
      for (let th = 0; th <= 100; th += 2) {
        const q = linkPose({ ...state, linkTheta: th });
        if (Number.isFinite(q.icx) && Math.hypot(q.icx, q.icy) < 40 && (q.omega !== 0 || q.speed !== 0)) trail.push([q.icx, q.icy]);
        series.push([th, q.omega]);
      }
      extra.trail = trail;
      extra.series = series;
    } else {
      const R = Number(state.radius) || 0;
      extra.series = [[0, 0], [2 * R, 2 * Math.abs(Number(state.speed) || 0)]];
    }
    return { ...c, ...extra };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.58);
    const white = C.text;
    const faint = alpha(C.text, 0.3);
    if (state.mode === 'ladder') {
      const L = Math.max(Number(state.length) || 4, 1);
      const S = sceneIn(B, left, { x0: -0.35 * L, x1: 1.12 * L, y0: -0.12 * L, y1: 1.1 * L });
      poly(S, [[-0.08 * L, -0.06 * L], [1.1 * L, -0.06 * L], [1.1 * L, 0], [0, 0], [0, 1.08 * L], [-0.08 * L, 1.08 * L]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.6), width: 1.5 });
      // The centre's path: every centre is L from the corner.
      const arc = Array.from({ length: 31 }, (_, i) => {
        const a = (i / 30) * (Math.PI / 2);
        return [L * Math.cos(a), L * Math.sin(a)];
      });
      line(S, arc, { color: alpha(C.gold, 0.3), width: 1, dash: [3, 5] });
      seg(S, [c.ax, c.ay], [c.bx, c.by], { color: C.teal, width: 6 });
      guide(S, [c.ax, c.ay], c);
      guide(S, [c.bx, c.by], c);
      const vmax = Math.max(Math.abs(c.vx), Math.hypot(c.ux, c.uy), 1e-9);
      const k = (0.3 * L * S.k) / vmax;
      field(S, [0.2, 0.4, 0.6, 0.8].map((f) => [c.ax + (c.bx - c.ax) * f, c.ay + (c.by - c.ay) * f]), c, k, faint);
      vec(S, [c.ax, c.ay], [c.vx, c.vy], k, { color: white, label: veiled ? 'v_A' : `${fig(c.vx)} m/s` });
      vec(S, [c.bx, c.by], [c.ux, c.uy], k, { color: white, label: veiled ? 'v_B' : `${fig(c.speed)} m/s` });
      dot(S, c.icx, c.icy, { color: C.gold, r: 6 });
      label(S, 'IC', [c.icx, c.icy], { color: C.gold, dx: 14, dy: -10 });
    } else if (state.mode === 'wheel') {
      const R = Math.max(Number(state.radius) || 0.4, 0.15);
      const S = sceneIn(B, left, { x0: -2.2 * R, x1: 2.2 * R, y0: -0.3 * R, y1: 2.6 * R });
      seg(S, [-2.2 * R, 0], [2.2 * R, 0], { color: C.dim, width: 2 });
      circle(S, [0, R], R, { stroke: C.teal, width: 3 });
      const spin = -(Number(state.spin) || 0);
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI) / 2;
        seg(S, [0, R], [R * Math.cos(a), R + R * Math.sin(a)], { color: alpha(C.text, 0.3), width: 1 });
      }
      const v = Number(state.speed) || 0;
      const k = (0.5 * R * S.k) / Math.max(Math.abs(v), 1e-9);
      if (Math.abs(c.omega) > 1e-9) {
        const rim = Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return [R * Math.cos(a), R + R * Math.sin(a)];
        }).filter((p) => p[1] > 0.05 * R && Math.abs(p[0]) + Math.abs(p[1] - 2 * R) > 0.05 * R);
        field(S, rim, c, k, faint);
      }
      guide(S, [0, 2 * R], c);
      vec(S, [0, R], [c.vx, c.vy], k, { color: white, label: veiled ? 'v_G' : `${fig(v)} m/s` });
      vec(S, [0, 2 * R], [c.ux, c.uy], k, { color: white, label: veiled ? 'v_top' : `${fig(c.speed)} m/s` });
      dot(S, c.icx, c.icy, { color: C.gold, r: 6 });
      label(S, 'IC', [c.icx, c.icy], { color: C.gold, dy: 14 });
    } else {
      const far = Math.hypot(c.icx, c.icy) > 14;
      const ys = [0, c.ay, c.by, c.cy, ...(far ? [] : [c.icy])];
      const xs = [0, c.ax, c.bx, c.cx, ...(far ? [] : [c.icx])];
      const pad = 0.6;
      const S = sceneIn(B, left, { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad });
      if (c.trail && !far) line(S, c.trail, { color: alpha(C.gold, 0.3), width: 1, dash: [3, 5] });
      seg(S, [0, 0], [c.cx, c.cy], { color: C.dim, width: 2, dash: [6, 4] });
      seg(S, [0, 0], [c.ax, c.ay], { color: C.teal, width: 5 });
      seg(S, [c.ax, c.ay], [c.bx, c.by], { color: white, width: 4 });
      seg(S, [c.bx, c.by], [c.cx, c.cy], { color: C.blue, width: 5 });
      for (const p of [[0, 0], [c.cx, c.cy]]) dot(S, p[0], p[1], { color: C.gold, r: 4 });
      if (!far) {
        guide(S, [0, 0], c);
        guide(S, [c.cx, c.cy], c);
      }
      const vmax = Math.max(Math.hypot(c.vx, c.vy), Math.hypot(c.ux, c.uy), 1e-9);
      const k = (0.9 * S.k) / vmax;
      if (!far) field(S, [0.25, 0.5, 0.75].map((f) => [c.ax + (c.bx - c.ax) * f, c.ay + (c.by - c.ay) * f]), c, k, faint);
      vec(S, [c.ax, c.ay], [c.vx, c.vy], k, { color: white, label: 'A' });
      vec(S, [c.bx, c.by], [c.ux, c.uy], k, { color: white, label: veiled ? 'B' : `B ${fig(c.speed)} m/s` });
      if (!far) {
        dot(S, c.icx, c.icy, { color: C.gold, r: 6 });
        label(S, 'IC', [c.icx, c.icy], { color: C.gold, dx: 14, dy: -10 });
      } else {
        label(S, 'the centre is far off: crank and rocker nearly parallel', [(Math.min(...xs) + Math.max(...xs)) / 2, Math.max(...ys) + pad / 2], { color: C.gold });
      }
    }
    if (veiled) return;

    // One chart per case: how a speed or ω changes as the body moves.
    if (state.mode === 'ladder') {
      const top = Math.max(...c.series.map((q) => q[1])) * 1.1;
      const P = chartIn(B, right, { lo: 20, hi: 75 }, { lo: 0, hi: top });
      axes(P, { xLabel: 'ladder angle θ (deg)', yLabel: 'top falls at (m/s)' });
      line(P, c.series, { color: white, width: 2.5 });
      dot(P, Number(state.theta), c.speed, { color: C.yellow, r: 5 });
    } else if (state.mode === 'link') {
      const ws = c.series.map((q) => q[1]);
      // Round limits keep the zero tick clean.
      const m = Math.ceil((Math.max(...ws.map(Math.abs)) * 1.1) / 0.2) * 0.2 || 0.2;
      const lo = Math.min(...ws) < 0 ? -m : 0;
      const hi = Math.max(...ws) > 0 ? m : 0.2;
      const P = chartIn(B, right, { lo: 0, hi: 100 }, { lo, hi });
      axes(P, { xLabel: 'crank angle (deg)', yLabel: 'coupler ω (rad/s)' });
      line(P, [[0, 0], [100, 0]], { color: alpha(C.text, 0.4), width: 1 });
      line(P, c.series, { color: white, width: 2.5 });
      dot(P, Number(state.linkTheta), c.omega, { color: C.yellow, r: 5 });
    } else {
      const R = Number(state.radius) || 0;
      const P = chartIn(B, right, { lo: 0, hi: 2 * R }, { lo: 0, hi: 2.2 * Math.abs(Number(state.speed) || 1) });
      axes(P, { xLabel: 'height above the ground, on the vertical diameter (m)', yLabel: 'speed (m/s)' });
      line(P, c.series, { color: white, width: 2.5 });
      dot(P, R, Math.abs(Number(state.speed) || 0), { color: C.yellow, r: 5 });
      dot(P, 2 * R, c.speed, { color: C.yellow, r: 5 });
    }
  },
  law: () => [String.raw`\vec v_B=\vec v_A+\omega\times\vec r`, String.raw`\omega=v/r_{IC}`],
  liveRows(state, c) {
    const speed = state.mode === 'ladder' ? 'top down' : state.mode === 'wheel' ? 'top speed' : 'point B';
    return [
      kv('$\\omega$', `${fig(c.omega)} rad/s`),
      kv(speed, `${fig(c.speed)} m/s`),
      kv('IC', `(${fig(c.icx)}, ${fig(c.icy)}) m`),
    ].join('');
  },
  readout(state, c) {
    const speed = state.mode === 'ladder' ? 'top m/s' : state.mode === 'wheel' ? 'top m/s' : 'B m/s';
    return cells([
      ['ω rad/s', fig(c.omega)],
      [speed, fig(c.speed)],
      ['IC x m', fig(c.icx)],
      ['IC y m', fig(c.icy)],
    ]);
  },
  coach(state, c) {
    if (state.mode === 'wheel') {
      return {
        title: 'The contact point is the centre',
        body: String.raw`The wheel centre moves at ${fig(state.speed)} m/s. The top moves at ${fig(c.speed)} m/s. $\omega = ${fig(c.omega)}\ \mathrm{rad/s}$.`,
      };
    }
    if (state.mode === 'link') {
      return {
        title: 'The coupler centre moves',
        body: String.raw`The crank line and the rocker line meet at the centre. Point B moves at ${fig(c.speed)} m/s. $\omega = ${fig(c.omega)}\ \mathrm{rad/s}$.`,
      };
    }
    return {
      title: 'The corner is instantaneously at rest',
      body: String.raw`The foot moves out at ${fig(state.foot)} m/s. The top falls at ${fig(c.speed)} m/s. A shallower ladder drops the top faster. $\omega = ${fig(c.omega)}\ \mathrm{rad/s}$.`,
    };
  },
});

