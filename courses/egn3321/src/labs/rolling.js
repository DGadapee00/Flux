import { cycloid, rollingPoint } from '@flux/subjects/mechanics/rigid2d.js';
import { M, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const DEG = Math.PI / 180;

const SCENARIOS = [
  { id: 'contact', name: 'Contact point', radius: 0.4, speed: 2, phi: 0 },
  { id: 'top', name: 'Top point', radius: 0.4, speed: 2, phi: 180 },
  { id: 'side', name: 'Side point', radius: 0.4, speed: 2, phi: 90 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.radius = sc.radius;
  state.speed = sc.speed;
  state.phi = sc.phi;
}

function circle(cx, cy, radius, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

function trail(radius, phi) {
  const shift = radius * phi;
  const n = Math.max(12, Math.ceil(phi / (Math.PI / 36)));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = (phi * i) / n;
    const c = cycloid(radius, p);
    pts.push({ x: c.x - shift, y: c.y });
  }
  return pts;
}

export default defineLab({
  id: 'rolling',
  exam: 'u5',
  title: 'Rolling',
  hint: 'The contact point is at rest. It still accelerates toward the centre at v²/R.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    const R = Math.max(Number(state.radius) || 0.4, 0.15);
    const phi = (Number(state.phi) || 0) * DEG;
    const trailLen = R * phi;
    const cx = -trailLen * 0.42;
    const span = Math.max(3.2 * R, trailLen * 0.62 + 2 * R);
    return {
      pos: new THREE.Vector3(cx, R * 0.9, span * 1.85),
      target: new THREE.Vector3(cx, R * 0.85, 0),
    };
  },
  defaultState() {
    const s = {};
    apply('contact', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('wh-radius', 'radius (m)', 0.4, 0.2, 1, 0.05)}
      ${slider('wh-speed', 'centre (m/s)', 2, 0.4, 6, 0.1)}
      ${slider('wh-phi', 'mark (deg)', 0, 0, 360, 1)}
      <p class="tiny">The mark is measured clockwise from the ground. Gold is its path. White is its velocity and pink is its acceleration.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('wh-radius', 'radius');
    link('wh-speed', 'speed');
    link('wh-phi', 'phi');
  },
  syncControls(state) {
    for (const [id, key] of [['wh-radius', 'radius'], ['wh-speed', 'speed'], ['wh-phi', 'phi']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    const ground = makeLine(M.grey);
    const rim = makeLine(M.teal);
    const path = makeLine(M.gold);
    const spoke = makeLine(M.greyDark);
    const mark = makeDot(M.gold, 0.045);
    const vel = makeArrow(M.white);
    const acc = makeArrow(M.pink);
    group.add(ground, rim, path, spoke, mark, vel, acc);
    ctx.scene.add(group);
    return { group, ground, rim, path, spoke, mark, vel, acc };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const R = Number(state.radius) || 0;
    const speed = Number(state.speed) || 0;
    const phi = (Number(state.phi) || 0) * DEG;
    const row = rollingPoint({ radius: R, speed, phi });
    let gap = 0;
    if (R > 0) {
      const w = speed / R;
      const h = 1e-5;
      const at = (p) => cycloid(R, p);
      const vx = (at(phi + w * h).x - at(phi - w * h).x) / (2 * h);
      const vy = (at(phi + w * h).y - at(phi - w * h).y) / (2 * h);
      const ax = (at(phi + w * h).x - 2 * at(phi).x + at(phi - w * h).x) / (h * h);
      const ay = (at(phi + w * h).y - 2 * at(phi).y + at(phi - w * h).y) / (h * h);
      gap = Math.max(
        Math.abs(row.vx - vx) / Math.max(1, Math.abs(row.vx)),
        Math.abs(row.vy - vy) / Math.max(1, Math.abs(row.vy)),
        Math.abs(row.ax - ax) / Math.max(1, Math.abs(row.ax)),
        Math.abs(row.ay - ay) / Math.max(1, Math.abs(row.ay)),
      );
      if (!Number.isFinite(gap)) gap = 0;
    }
    Object.assign(computed, {
      speed: row.speed,
      vx: row.vx,
      vy: row.vy,
      ax: row.ax,
      ay: row.ay,
      aMag: row.aMag,
      vTop: row.vTop,
      omega: row.omega,
      gap,
      rx: row.rx,
      ry: row.ry,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const R = Math.max(Number(state.radius) || 0, 0.05);
    const phi = (Number(state.phi) || 0) * DEG;
    const shift = R * phi;
    setLine(h.rim, circle(0, R, R));
    setLine(h.ground, [{ x: -shift - R, y: 0 }, { x: R * 1.4, y: 0 }]);
    setLine(h.spoke, [{ x: 0, y: R }, { x: c.rx, y: R + c.ry }]);
    h.path.visible = phi > 0.05;
    if (h.path.visible) setLine(h.path, trail(R, phi));
    h.mark.position.set(c.rx, R + c.ry, 0);
    const cap = Math.max(0.35, R * 1.5);
    setArrow(h.vel, { x: c.rx, y: R + c.ry }, { x: c.vx, y: c.vy }, cap);
    setArrow(h.acc, { x: c.rx, y: R + c.ry }, { x: c.ax, y: c.ay }, cap);
  },
  law: () => [String.raw`v_{top}=2v`, String.raw`a=v^2/R`],
  liveRows(state, c) {
    return [
      kv('point', `${fig(c.speed)} m/s`),
      kv('top', `${fig(c.vTop)} m/s`),
      kv('$a$', `${fig(c.aMag)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['point', `${fig(c.speed)} m/s`],
      ['top', `${fig(c.vTop)} m/s`],
      ['accel', `${fig(c.aMag)} m/s²`],
    ]);
  },
  coach(state, c) {
    const phi = Number(state.phi) || 0;
    if (phi < 1) {
      return {
        title: 'At rest, and still accelerating',
        body: String.raw`The contact speed is ${fig(c.speed)} m/s. The acceleration is ${fig(c.aMag)} m/s² toward the centre. The top moves at ${fig(c.vTop)} m/s.`,
      };
    }
    if (phi > 170 && phi < 190) {
      return {
        title: 'The top moves at twice the centre',
        body: String.raw`This point moves at ${fig(c.speed)} m/s. That is $2v$. Its acceleration is ${fig(c.aMag)} m/s² toward the centre.`,
      };
    }
    return {
      title: 'Every rim point shares v²/R',
      body: String.raw`This point moves at ${fig(c.speed)} m/s. The acceleration is ${fig(c.aMag)} m/s² toward the centre. The top moves at ${fig(c.vTop)} m/s.`,
    };
  },
});