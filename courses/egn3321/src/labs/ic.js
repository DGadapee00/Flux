import {
  cycloid,
  fourBar,
  instantCenter,
  omegaFromCenter,
  relativeVelocity,
  rollingPoint,
} from '@flux/subjects/mechanics/rigid2d.js';
import { M, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const DEG = Math.PI / 180;
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

function frame(cx, cy, span) {
  const z = Math.max(span, 0.4) * 1.7;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

export default defineLab({
  id: 'ic',
  exam: 'u5',
  title: 'Centre',
  hint: 'The instantaneous centre is the point with zero velocity. It moves as the body moves.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    if (state.mode === 'wheel') {
      const R = Math.max(Number(state.radius) || 0.4, 0.15);
      return frame(0, R, R * 3.2);
    }
    if (state.mode === 'link') {
      const row = linkPose(state);
      const y = Math.min(Math.max(row.icy, 1.2), 12);
      return frame(1.5, y * 0.42, Math.max(4.2, y + 1.5));
    }
    const L = Math.max(Number(state.length) || 4, 1);
    return frame(L * 0.42, L * 0.42, L * 1.15);
  },
  defaultState() {
    const s = {};
    apply('ladder', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('ic-length', 'length (m)', 4, 2, 8, 0.1)}
      ${slider('ic-theta', 'angle (deg)', 60, 20, 75, 1)}
      ${slider('ic-foot', 'foot (m/s)', 2, 0.2, 4, 0.1)}
      ${slider('ic-radius', 'radius (m)', 0.4, 0.2, 1, 0.05)}
      ${slider('ic-speed', 'centre (m/s)', 2, 0.4, 6, 0.1)}
      ${slider('ic-link-theta', 'crank (deg)', 60, 0, 100, 1)}
      ${slider('ic-link-omega', 'crank (rad/s)', 2, 0.5, 6, 0.1)}
      <p class="tiny">Gold is the instantaneous centre. White arrows are velocities. The four-bar is a 1 m crank, a 2.5 m coupler, a 2 m rocker, and a 3 m ground.</p>`;
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
      if (el && document.activeElement !== el) el.value = String(val);
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
  init(ctx) {
    const group = new THREE.Group();
    const wall = makeLine(M.grey);
    const floor = makeLine(M.grey);
    const bar = makeLine(M.teal);
    const guideA = makeLine(M.greyDark);
    const guideB = makeLine(M.greyDark);
    const wheel = makeLine(M.teal);
    const ground = makeLine(M.grey);
    const spoke = makeLine(M.greyDark);
    const crank = makeLine(M.teal);
    const coupler = makeLine(M.white);
    const rocker = makeLine(M.blue);
    const base = makeLine(M.grey);
    const icDot = makeDot(M.gold, 0.06);
    const mark = makeDot(M.white, 0.05);
    const v1 = makeArrow(M.white);
    const v2 = makeArrow(M.white);
    group.add(wall, floor, bar, guideA, guideB, wheel, ground, spoke, crank, coupler, rocker, base, icDot, mark, v1, v2);
    ctx.scene.add(group);
    return { group, wall, floor, bar, guideA, guideB, wheel, ground, spoke, crank, coupler, rocker, base, icDot, mark, v1, v2 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    Object.assign(computed, poseOf(state));
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const ladder = state.mode === 'ladder';
    const wheel = state.mode === 'wheel';
    const link = state.mode === 'link';
    h.wall.visible = ladder;
    h.floor.visible = ladder;
    h.bar.visible = ladder;
    h.wheel.visible = wheel;
    h.ground.visible = wheel;
    h.spoke.visible = wheel;
    h.crank.visible = link;
    h.coupler.visible = link;
    h.rocker.visible = link;
    h.base.visible = link;
    h.mark.visible = wheel;
    const near = Math.hypot(c.icx, c.icy) < 14 || ladder;
    h.guideA.visible = (ladder || link) && near;
    h.guideB.visible = (ladder || link) && near;
    h.icDot.visible = near;
    if (ladder) {
      const L = Math.max(state.length, 1);
      setLine(h.wall, [{ x: 0, y: 0 }, { x: 0, y: L * 1.05 }]);
      setLine(h.floor, [{ x: 0, y: 0 }, { x: L * 1.05, y: 0 }]);
      setLine(h.bar, [{ x: c.ax, y: c.ay }, { x: c.bx, y: c.by }]);
      setLine(h.guideA, [{ x: c.ax, y: c.ay }, { x: c.icx, y: c.icy }]);
      setLine(h.guideB, [{ x: c.bx, y: c.by }, { x: c.icx, y: c.icy }]);
      h.icDot.scale.setScalar(Math.max(1.4, L * 0.55));
      setArrow(h.v1, { x: c.ax, y: c.ay }, { x: c.vx, y: c.vy }, L * 0.35);
      setArrow(h.v2, { x: c.bx, y: c.by }, { x: c.ux, y: c.uy }, L * 0.35);
    } else if (wheel) {
      const R = Math.max(state.radius, 0.15);
      setLine(h.wheel, circle(0, R, R));
      setLine(h.ground, [{ x: -R * 1.8, y: 0 }, { x: R * 1.8, y: 0 }]);
      setLine(h.spoke, [{ x: 0, y: R }, { x: c.icx, y: c.icy }]);
      h.mark.position.set(0, 2 * R, 0);
      h.icDot.scale.setScalar(Math.max(0.7, R * 2.2));
      setArrow(h.v1, { x: 0, y: R }, { x: c.vx, y: c.vy }, R * 1.6);
      setArrow(h.v2, { x: 0, y: 2 * R }, { x: c.ux, y: c.uy }, R * 1.6);
    } else {
      setLine(h.base, [{ x: 0, y: 0 }, { x: c.cx, y: c.cy }]);
      setLine(h.crank, [{ x: 0, y: 0 }, { x: c.ax, y: c.ay }]);
      setLine(h.coupler, [{ x: c.ax, y: c.ay }, { x: c.bx, y: c.by }]);
      setLine(h.rocker, [{ x: c.bx, y: c.by }, { x: c.cx, y: c.cy }]);
      setLine(h.guideA, [{ x: 0, y: 0 }, { x: c.icx, y: c.icy }]);
      setLine(h.guideB, [{ x: c.cx, y: c.cy }, { x: c.icx, y: c.icy }]);
      h.icDot.scale.setScalar(1.3);
      setArrow(h.v1, { x: c.ax, y: c.ay }, { x: c.vx, y: c.vy }, 1.3);
      setArrow(h.v2, { x: c.bx, y: c.by }, { x: c.ux, y: c.uy }, 1.3);
    }
    h.icDot.position.set(c.icx, c.icy, 0);
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

function circle(cx, cy, radius, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}
