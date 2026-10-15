import { G } from '@flux/subjects/mechanics/constants.js';
import { bankedCurve, verticalLoop } from '@flux/subjects/mechanics/dynamics.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'bank',
    name: 'Bank, no friction',
    mass: 1200,
    radius: 40,
    theta: 20,
    speed: 12,
    mu: 0,
    phi: 180,
    vb: 5,
  },
  {
    id: 'band',
    name: 'Bank with friction',
    mass: 1000,
    radius: 40,
    theta: 20,
    speed: 12,
    mu: 0.2,
    phi: 180,
    vb: 5,
  },
  {
    id: 'loop',
    name: 'Vertical loop',
    mass: 0.5,
    radius: 0.4,
    theta: 20,
    speed: 12,
    mu: 0,
    phi: 180,
    vb: 5,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.radius = sc.radius;
  state.theta = sc.theta;
  state.speed = sc.speed;
  state.mu = sc.mu;
  state.phi = sc.phi;
  state.vb = sc.vb;
  if (sc.id === 'bank') {
    state.speed = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      mu: 0,
      g: G,
    }).vDesign;
  }
}

/** x–y solve. +x points toward the centre of the curve, +y is up. */
function bankXY(mass, radius, thetaDeg, speed) {
  const th = (thetaDeg * Math.PI) / 180;
  const nx = Math.sin(th);
  const ny = Math.cos(th);
  const dx = Math.cos(th);
  const dy = -Math.sin(th);
  const bx = (mass * speed * speed) / radius;
  const by = mass * G;
  const det = nx * dy - dx * ny;
  return {
    N: (bx * dy - dx * by) / det,
    f: (nx * by - bx * ny) / det,
  };
}

/** Speed from integrating a_t = −g sinφ along the loop. */
function loopSpeed(radius, vb, phiDeg) {
  const phi = (phiDeg * Math.PI) / 180;
  if (!(phi > 1e-8)) return vb;
  const steps = 4000;
  const dphi = phi / steps;
  let v = vb;
  for (let i = 0; i < steps; i++) {
    const mid = (i + 0.5) * dphi;
    const at = -G * Math.sin(mid);
    v = Math.sqrt(Math.max(0, v * v + 2 * at * radius * dphi));
  }
  return v;
}

function circle(cx, cy, r, n = 48) {
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

export default defineLab({
  id: 'curve',
  exam: 'u2',
  title: 'Curve',
  hint: 'Change the speed. Friction opens a band. In the loop the normal force is least at the top.',
  camera: { pos: new THREE.Vector3(0, 0, 10), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = { anim: { playing: false } };
    apply('bank', s);
    return s;
  },
  applyScenario: apply,
  cameraFor(state) {
    if (state.scenarioId === 'loop') {
      return { pos: new THREE.Vector3(0, 0, 6), target: new THREE.Vector3(0, 0, 0) };
    }
    return { pos: new THREE.Vector3(0.2, 0.2, 10), target: new THREE.Vector3(0.2, 0.2, 0) };
  },
  controls() {
    return `
      ${slider('cv-mass', 'mass (kg)', 1200, 0.2, 2000, 0.1)}
      ${slider('cv-radius', 'ρ (m)', 40, 0.2, 80, 0.1)}
      ${slider('cv-theta', 'θ (deg)', 20, 5, 40, 1)}
      ${slider('cv-speed', 'v (m/s)', 12, 0, 40, 0.1)}
      ${slider('cv-mu', 'μₛ', 0, 0, 0.6, 0.01)}
      ${slider('cv-phi', 'φ from the bottom (deg)', 180, 0, 180, 1)}
      ${slider('cv-vb', 'speed at the bottom (m/s)', 5, 1, 20, 0.1)}
      <p class="tiny">Teal is the normal, pink is friction, grey is weight. The white dot is the car.</p>`;
  },
  bind(api) {
    bindSlider('cv-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('cv-radius', (s, v) => { s.radius = v; }, api);
    bindSlider('cv-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('cv-speed', (s, v) => { s.speed = v; }, api);
    bindSlider('cv-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('cv-phi', (s, v) => { s.phi = v; }, api);
    bindSlider('cv-vb', (s, v) => { s.vb = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const loop = state.scenarioId === 'loop';
    set('cv-mass', state.mass);
    set('cv-radius', state.radius);
    set('cv-theta', state.theta);
    set('cv-speed', state.speed);
    set('cv-mu', state.mu);
    set('cv-phi', state.phi);
    set('cv-vb', state.vb);
    showField('cv-theta', !loop);
    showField('cv-speed', !loop);
    showField('cv-mu', !loop);
    showField('cv-phi', loop);
    showField('cv-vb', loop);
  },
  init(ctx) {
    const group = new THREE.Group();
    const road = makeLine(M.grey);
    const guide = makeLine(M.greyDark);
    const car = makeDot(M.white, 0.12);
    const mk = (color) => forceArrow(new THREE.Vector3(0, -1, 0), color, 0.03, 0.22, 0.14);
    const weight = mk(M.grey);
    const normal = mk(M.teal);
    const friction = mk(M.pink);
    group.add(road, guide, car, weight, normal, friction);
    ctx.scene.add(group);
    return { group, road, guide, car, weight, normal, friction };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.scenarioId === 'loop') {
      const row = verticalLoop({
        mass: state.mass,
        radius: state.radius,
        speedBottom: state.vb,
        phiDeg: state.phi,
        g: G,
      });
      const integrated = loopSpeed(state.radius, state.vb, state.phi);
      const speedGap = Math.abs(integrated - row.speed) / Math.max(1, Math.abs(row.speed));
      const phi = (state.phi * Math.PI) / 180;
      const n = { x: -Math.sin(phi), y: Math.cos(phi) };
      const t = { x: Math.cos(phi), y: Math.sin(phi) };
      const an = row.lost ? 0 : row.an;
      const ax = an * n.x + row.at * t.x;
      const ay = an * n.y + row.at * t.y;
      const rx = row.N * n.x - state.mass * ax;
      const ry = row.N * n.y - state.mass * G - state.mass * ay;
      const residual = Math.hypot(rx, ry) / Math.max(1, state.mass * G);
      const top = verticalLoop({
        mass: state.mass,
        radius: state.radius,
        speedBottom: state.vb,
        phiDeg: 180,
        g: G,
      });
      Object.assign(computed, {
        N: row.N,
        f: 0,
        speed: row.speed,
        vMin: 0,
        vMax: 0,
        vDesign: 0,
        holds: !row.leaves,
        lost: row.lost,
        leaves: row.leaves,
        nTop: top.lost ? null : top.N,
        regime: row.lost ? 'short' : row.leaves ? 'leaves' : 'on track',
        gap: row.lost ? 0 : Math.max(speedGap, residual),
      });
      return;
    }
    const row = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      speed: state.speed,
      mu: state.mu,
      g: G,
    });
    const xy = bankXY(state.mass, state.radius, state.theta, state.speed);
    const gap = Math.hypot(row.N - xy.N, row.f - xy.f) / Math.max(1, state.mass * G);
    const atMax = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      speed: Number.isFinite(row.vMax) ? row.vMax : row.vDesign,
      mu: state.mu,
      g: G,
    });
    Object.assign(computed, {
      N: row.N,
      f: row.f,
      speed: state.speed,
      vMin: row.vMin,
      vMax: row.vMax,
      vDesign: row.vDesign,
      holds: row.holds,
      lost: false,
      leaves: false,
      nTop: atMax.N,
      regime: row.regime,
      gap,
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const push = (arrow, x, y, fx, fy, scale) => {
      placeIncomingArrow(arrow, new THREE.Vector3(x, y, 0), fx, fy, { scale, minLength: 0.08, gap: 0.02 });
    };
    if (state.scenarioId === 'loop') {
      const R = 1.6;
      const phi = (state.phi * Math.PI) / 180;
      const x = R * Math.sin(phi);
      const y = -R * Math.cos(phi);
      setLine(h.road, circle(0, 0, R));
      setLine(h.guide, [{ x: 0, y: -R - 0.15 }, { x: 0, y: -R - 0.15 }]);
      h.guide.visible = false;
      h.car.position.set(x, y, 0);
      const scale = 1.3 / Math.max(state.mass * G, computed.N, 1e-6);
      const n = { x: -Math.sin(phi), y: Math.cos(phi) };
      push(h.weight, x, y, 0, -state.mass * G, scale);
      push(h.normal, x, y, computed.N * n.x, computed.N * n.y, scale);
      h.friction.visible = false;
      return;
    }
    const th = (state.theta * Math.PI) / 180;
    const toe = { x: -2.2, y: -1.1 };
    const L = 4.2;
    const top = { x: toe.x + L * Math.cos(th), y: toe.y + L * Math.sin(th) };
    const mid = { x: (toe.x + top.x) / 2, y: (toe.y + top.y) / 2 };
    setLine(h.road, [toe, top]);
    setLine(h.guide, [
      { x: toe.x, y: toe.y - 0.35 },
      { x: top.x, y: toe.y - 0.35 },
    ]);
    h.guide.visible = true;
    h.car.position.set(mid.x, mid.y, 0);
    const scale = 1.4 / Math.max(state.mass * G, 1);
    push(h.weight, mid.x, mid.y, 0, -state.mass * G, scale);
    push(h.normal, mid.x, mid.y, -computed.N * Math.sin(th), computed.N * Math.cos(th), scale);
    push(h.friction, mid.x, mid.y, -computed.f * Math.cos(th), -computed.f * Math.sin(th), scale);
  },
  law(state) {
    if (state.scenarioId === 'loop') {
      return [String.raw`\sum F_n = m\dfrac{v^2}{\rho}`, String.raw`N=m\left(\dfrac{v^2}{\rho}+g\cos\phi\right)`];
    }
    return [String.raw`\sum F_n = m\dfrac{v^2}{\rho}`, String.raw`v=\sqrt{\rho g\tan\theta}`];
  },
  liveRows(state, c) {
    if (state.scenarioId === 'loop') {
      return [
        kv('$N$', `${fig(c.N)} N`),
        kv('$v$', `${fig(c.speed)} m/s`),
        kv('$N_{top}$', `${fig(c.nTop)} N`),
      ].join('');
    }
    return [
      kv('$v$', `${fig(c.speed)} m/s`),
      kv('$v_{min}$', `${fig(c.vMin)} m/s`),
      kv('$v_{max}$', `${fig(c.vMax)} m/s`),
      kv('$N$', `${fig(c.N)} N`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'loop') {
      return cells([
        ['normal', c.lost ? 'does not reach' : `${fig(c.N)} N`],
        ['speed', c.lost ? '—' : `${fig(c.speed)} m/s`],
        ['normal at top', c.nTop && !c.lost ? `${fig(c.nTop)} N` : '—'],
        ['radius', `${fig(state.radius)} m`],
      ]);
    }
    return cells([
      ['speed', `${fig(c.speed)} m/s`],
      ['design', `${fig(c.vDesign)} m/s`],
      ['band', `<span class="lo">${fig(c.vMin)}–</span><span class="hi">${fig(c.vMax)} m/s</span>`, 'stack'],
      ['normal', `${fig(c.N)} N`],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'loop') {
      if (c.lost) {
        return { title: 'It does not reach this angle', body: 'The speed at the bottom is short of the height. Lower the angle or add speed.' };
      }
      if (c.leaves) {
        return {
          title: 'The normal force has dropped through zero',
          body: String.raw`At this angle $N = ${fig(c.N)}\ \mathrm{N}$. A car on the inside of the track needs $N \ge 0$.`,
        };
      }
      return {
        title: 'The normal force is least at the top',
        body: c.nTop == null
          ? 'This start does not reach the top. The normal force still falls as the car climbs.'
          : String.raw`Here $N = ${fig(c.N)}\ \mathrm{N}$. At the top, with this same start, $N = ${fig(c.nTop)}\ \mathrm{N}$.`,
      };
    }
    if (state.mu < 1e-9) {
      const on = Math.abs(c.speed - c.vDesign) < 0.05;
      return {
        title: on ? 'One speed needs no friction' : 'Off the design speed, the car slides',
        body: on
          ? String.raw`With $\mu = 0$, $v = \sqrt{\rho g\tan\theta} = ${fig(c.vDesign)}\ \mathrm{m/s}$.`
          : String.raw`The design speed is $${fig(c.vDesign)}\ \mathrm{m/s}$. This speed is $${fig(c.speed)}\ \mathrm{m/s}$.`,
      };
    }
    return {
      title: c.holds ? 'Inside the friction band' : 'Outside the friction band',
      body: c.holds
        ? String.raw`Static friction holds from $${fig(c.vMin)}\ \mathrm{m/s}$ to $${fig(c.vMax)}\ \mathrm{m/s}$.`
        : String.raw`The band is $${fig(c.vMin)}$ to $${fig(c.vMax)}\ \mathrm{m/s}$. This car is at $${fig(c.speed)}\ \mathrm{m/s}$.`,
    };
  },
});
