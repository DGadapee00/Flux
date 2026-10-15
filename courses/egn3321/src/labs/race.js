import { raceDown } from '@flux/subjects/mechanics/rigid-energy.js';
import { M, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'even', name: '30 degrees', theta: 30, distance: 2, mass: 2, radius: 0.18, time: 0.7 },
  { id: 'steep', name: '45 degrees', theta: 45, distance: 2, mass: 2, radius: 0.18, time: 0.55 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.theta = sc.theta;
  state.distance = sc.distance;
  state.mass = sc.mass;
  state.radius = sc.radius;
  state.time = sc.time;
  state.timeMax = 2;
}

function clamp(x, lo, hi, fallback) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function basis(thetaDeg) {
  const th = thetaDeg * Math.PI / 180;
  return {
    ux: Math.cos(th),
    uy: Math.sin(th),
    nx: -Math.sin(th),
    ny: Math.cos(th),
  };
}

function circle(cx, cy, radius, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

function equator(cx, cy, radius, b) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const a = (2 * Math.PI * i) / 48;
    const along = radius * Math.cos(a);
    const up = 0.28 * radius * Math.sin(a);
    pts.push({
      x: cx + along * b.ux + up * b.nx,
      y: cy + along * b.uy + up * b.ny,
    });
  }
  return pts;
}

function spoke(cx, cy, radius, b, s) {
  const phi = radius > 1e-6 ? s / radius : 0;
  const c = Math.cos(phi);
  const sn = Math.sin(phi);
  const dx = b.nx * c - b.ny * sn;
  const dy = b.nx * sn + b.ny * c;
  return [{ x: cx, y: cy }, { x: cx + dx * radius, y: cy + dy * radius }];
}

function frame(cx, cy, span) {
  const z = Math.max(span, 0.35) * 1.9;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function boxFrame(pts) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const half = 0.5 * Math.max(maxX - minX, maxY - minY, 0.4);
  return frame((minX + maxX) / 2, (minY + maxY) / 2, half / 0.52);
}

function travel(row, time, distance) {
  if (!(row.a > 1e-9) || !(time > 0)) return 0;
  if (time >= row.t) return distance;
  return 0.5 * row.a * time * time;
}

export default defineLab({
  id: 'race',
  exam: 'u7',
  title: 'Race',
  hint: 'Only k decides the race. A hoop is slowest. Mass and radius cancel.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    const R = Math.max(Number(state.radius) || 0.18, 0.08);
    const distance = Math.max(Number(state.distance) || 2, 0.3);
    const gap = Math.max(2.5 * R, 0.28);
    const b = basis(Number(state.theta) || 30);
    const pts = [];
    for (const along of [0, distance]) {
      for (const lane of [-gap, gap]) {
        const x = along * b.ux + (R + lane) * b.nx;
        const y = along * b.uy + (R + lane) * b.ny;
        pts.push({ x: x - R, y: y - R }, { x: x + R, y: y + R });
      }
    }
    return boxFrame(pts);
  },
  defaultState() {
    const s = {};
    apply('even', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rc-mass', 'mass (kg)', 2, 0.5, 8, 0.5)}
      ${slider('rc-radius', 'radius (m)', 0.18, 0.1, 0.5, 0.02)}
      ${slider('rc-theta', 'incline (deg)', 30, 10, 50, 1)}
      ${slider('rc-distance', 'distance (m)', 2, 0.5, 4, 0.1)}
      ${slider('rc-time', 'time (s)', 0.7, 0, 2, 0.01)}
      <p class="tiny">The sphere is the upper lane, the disk the middle, the hoop the lower. Gold is a spoke, so the roll is visible. Mass and radius do not change the speeds.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('rc-mass', 'mass');
    link('rc-radius', 'radius');
    link('rc-theta', 'theta');
    link('rc-distance', 'distance');
    link('rc-time', 'time');
  },
  syncControls(state) {
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(max);
      if (document.activeElement !== el) el.value = String(val);
    };
    set('rc-mass', state.mass);
    set('rc-radius', state.radius);
    set('rc-theta', state.theta);
    set('rc-distance', state.distance);
    set('rc-time', state.time, state.timeMax);
  },
  init(ctx) {
    const group = new THREE.Group();
    const track = [0, 1, 2].map(() => makeLine(M.greyDark));
    const start = makeLine(M.grey);
    const finish = makeLine(M.gold);
    const sphere = makeLine(M.white);
    const sphereEq = makeLine(M.gold);
    const sphereSpoke = makeLine(M.gold);
    const disk = makeLine(M.white);
    const diskHub = makeLine(M.gold);
    const diskSpoke = makeLine(M.gold);
    const hoop = makeLine(M.teal);
    const hoopInner = makeLine(M.teal);
    const hoopSpoke = makeLine(M.gold);
    group.add(start, finish, ...track, sphere, sphereEq, sphereSpoke, disk, diskHub, diskSpoke, hoop, hoopInner, hoopSpoke);
    ctx.scene.add(group);
    return {
      group, track, start, finish,
      sphere, sphereEq, sphereSpoke,
      disk, diskHub, diskSpoke,
      hoop, hoopInner, hoopSpoke,
    };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    state.mass = clamp(state.mass, 0.5, 8, 2);
    state.radius = clamp(state.radius, 0.1, 0.5, 0.18);
    state.theta = clamp(state.theta, 10, 50, 30);
    state.distance = clamp(state.distance, 0.5, 4, 2);
    const race = raceDown({
      thetaDeg: state.theta,
      distance: state.distance,
      mass: state.mass,
    });
    const timeMax = race.hoop.t > 1e-9 ? race.hoop.t * 1.15 : 1;
    state.timeMax = timeMax;
    state.time = clamp(state.time, 0, timeMax, 0);
    const time = state.time;
    const distance = state.distance;
    Object.assign(computed, {
      sphere: race.sphere.v,
      disk: race.disk.v,
      hoop: race.hoop.v,
      tSphere: race.sphere.t,
      tDisk: race.disk.t,
      tHoop: race.hoop.t,
      kSphere: race.sphere.k,
      kDisk: race.disk.k,
      kHoop: race.hoop.k,
      aSphere: race.sphere.a,
      aDisk: race.disk.a,
      aHoop: race.hoop.a,
      sSphere: travel(race.sphere, time, distance),
      sDisk: travel(race.disk, time, distance),
      sHoop: travel(race.hoop, time, distance),
      winner: race.winner,
      energy: race.energy,
      gap: race.gap,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const R = Math.max(Number(state.radius) || 0.18, 0.08);
    const distance = Number(state.distance) || 0;
    const gap = Math.max(2.5 * R, 0.28);
    const b = basis(Number(state.theta) || 0);
    const ground = (along, lane) => ({
      x: along * b.ux + lane * b.nx,
      y: along * b.uy + lane * b.ny,
    });
    const centre = (along, lane) => ground(along, lane + R);
    const lanes = [
      { lane: gap, s: c.sSphere, body: h.sphere, mark: h.sphereEq, spoke: h.sphereSpoke, kind: 'sphere' },
      { lane: 0, s: c.sDisk, body: h.disk, mark: h.diskHub, spoke: h.diskSpoke, kind: 'disk' },
      { lane: -gap, s: c.sHoop, body: h.hoop, mark: h.hoopInner, spoke: h.hoopSpoke, kind: 'hoop' },
    ];
    lanes.forEach((row, i) => {
      const along = distance - row.s;
      setLine(h.track[i], [ground(0, row.lane), ground(distance, row.lane)]);
      const p = centre(along, row.lane);
      setLine(row.body, circle(p.x, p.y, R));
      if (row.kind === 'sphere') setLine(row.mark, equator(p.x, p.y, R, b));
      else if (row.kind === 'disk') setLine(row.mark, circle(p.x, p.y, R * 0.18));
      else setLine(row.mark, circle(p.x, p.y, R * 0.92));
      setLine(row.spoke, spoke(p.x, p.y, R * 0.92, b, row.s));
    });
    setLine(h.start, [ground(distance, -gap), ground(distance, gap)]);
    setLine(h.finish, [ground(0, -gap), ground(0, gap)]);
  },
  law: () => [String.raw`v=\sqrt{2gs\sin\theta/(1+k)}`],
  liveRows(state, c) {
    return [
      kv('T', `${fig(c.energy)} J`),
      kv('first', c.winner),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['sphere', fig(c.sphere)],
      ['disk', fig(c.disk)],
      ['hoop', fig(c.hoop)],
      ['first', c.winner],
    ]);
  },
  coach(state, c) {
    return {
      title: 'Only k decides',
      body: `Mass and radius cancel. The sphere finishes at ${fig(c.sphere)} m/s, the disk at ${fig(c.disk)} m/s, and the hoop at ${fig(c.hoop)} m/s. Each gains ${fig(c.energy)} J. The sphere is first because k is 2/5.`,
    };
  },
});
