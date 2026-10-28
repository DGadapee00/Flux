import { cycloid, rollingPoint } from '@flux/subjects/mechanics/rigid2d.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, slider } from './widgets.js';

const DEG = Math.PI / 180;

/**
 * A wheel rolling without slip (Hibbeler §16.5–16.7). Shows that the contact point is at rest for an
 * instant yet still accelerates, at v²/R toward the centre, and that the top moves at 2v. Play it:
 * the wheel rolls across the ground and the mark traces a cycloid, stopping dead each time it touches.
 *
 * Recompute: v = v_G + ω × r and a = a_G + α × r − ω² r. Check: differentiating the cycloid twice.
 */
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
  state.anim = { playing: false };
  state.show = { play: false };
}

export default defineLab({
  id: 'rolling',
  exam: 'u5',
  title: 'Rolling',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The contact point is at rest. It still accelerates toward the centre at v²/R.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('contact', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'phi', lo: 0, hi: 360 }),
  controls() {
    return `
      ${slider('wh-radius', 'radius (m)', 0.4, 0.2, 1, 0.05)}
      ${slider('wh-speed', 'centre (m/s)', 2, 0.4, 6, 0.1)}
      ${slider('wh-phi', 'mark (deg)', 0, 0, 360, 1)}
      <p class="tiny">The mark is measured clockwise from the ground. Gold is its path. White is its velocity and pink is its acceleration. The faint arrows are the rim's velocities: each is perpendicular to the line from the contact point, and grows with the distance from it.</p>`;
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
      if (el && document.activeElement !== el) el.value = String(Math.round(Number(state[key]) * 100) / 100);
    }
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // Real time, slowed four times: the mark turns ω = v/R.
    const R = Math.max(Number(state.radius) || 0.4, 0.05);
    const w = (Number(state.speed) || 0) / R;
    state.phi = ((Number(state.phi) || 0) + (w * dt * 0.25) / DEG) % 360;
    return true;
  },
  compute(state) {
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
    const series = Array.from({ length: 121 }, (_, i) => {
      const p = (2 * Math.PI * i) / 120;
      return [(p / DEG), rollingPoint({ radius: R, speed, phi: p }).speed];
    });
    return {
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
      phiRad: phi,
      series,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const R = Math.max(Number(state.radius) || 0, 0.05);
    const v = Number(state.speed) || 0;
    // One full turn of ground: the centre moves R φ to the right.
    const run = 2 * Math.PI * R;
    const S = sceneIn(B, left, { x0: -1.2 * R, x1: run + 1.2 * R, y0: -0.35 * R, y1: 2.6 * R });
    seg(S, [-1.2 * R, 0], [run + 1.2 * R, 0], { color: C.dim, width: 2 });
    const cx = R * c.phiRad;
    const centre = [cx, R];
    // The mark's path so far, a cycloid that touches down at every turn.
    if (c.phiRad > 0.02) {
      const n = Math.max(8, Math.ceil(c.phiRad / (Math.PI / 60)));
      const pts = Array.from({ length: n + 1 }, (_, i) => {
        const q = cycloid(R, (c.phiRad * i) / n);
        return [q.x, q.y];
      });
      line(S, pts, { color: C.gold, width: 2 });
    }
    circle(S, centre, R, { stroke: C.teal, width: 3 });
    for (let i = 0; i < 4; i++) {
      const a = -c.phiRad - Math.PI / 2 + (i * Math.PI) / 2;
      seg(S, centre, [cx + R * Math.cos(a), R + R * Math.sin(a)], { color: alpha(C.text, 0.35), width: 1 });
    }
    // The rim's velocity field: each point moves as if it turned about the contact point.
    const kv0 = (0.55 * R * S.k) / Math.max(v, 1e-9);
    if (v > 0) {
      for (let i = 0; i < 12; i++) {
        const p = (i * Math.PI) / 6;
        if (Math.abs(p - (c.phiRad % (2 * Math.PI))) < 0.05) continue;
        const q = rollingPoint({ radius: R, speed: v, phi: p });
        vec(S, [cx + q.rx, R + q.ry], [q.vx, q.vy], kv0, { color: alpha(C.text, 0.28), width: 1.5 });
      }
      vec(S, centre, [v, 0], kv0, { color: alpha(C.text, 0.5), width: 1.5, label: 'v' });
    }
    dot(S, cx, 0, { color: C.gold, r: 3 });
    label(S, 'contact', [cx, 0], { color: C.muted, dy: 12 });
    // The mark: its velocity and acceleration.
    const mark = [cx + c.rx, R + c.ry];
    dot(S, mark[0], mark[1], { color: C.yellow, r: 5 });
    if (c.speed > 1e-6) vec(S, mark, [c.vx, c.vy], kv0, { color: C.text, label: veiled ? 'v' : `${fig(c.speed)} m/s` });
    const ka = (0.45 * R * S.k) / Math.max(c.aMag, 1e-9);
    if (c.aMag > 1e-6) vec(S, mark, [c.ax, c.ay], ka, { color: C.pink, label: veiled ? 'a' : `${fig(c.aMag)} m/s²` });
    if (veiled) return;

    // The mark's speed through one turn: zero at the ground, 2v at the top.
    const P = chartIn(B, right, { lo: 0, hi: 360 }, { lo: 0, hi: 2.2 * Math.max(v, 1e-6) });
    axes(P, { xLabel: 'mark angle from the ground (deg)', yLabel: 'mark speed (m/s)' });
    line(P, [[0, v], [360, v]], { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    line(P, c.series, { color: C.text, width: 2.5 });
    dot(P, (c.phiRad / DEG) % 360, c.speed, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`v_{top}=2v`, String.raw`a=v^2/R`],
  liveRows(state, c) {
    return [
      kv('point', `${fig(c.speed)} m/s`),
      kv('top', `${fig(c.vTop)} m/s`),
      kv('$a$', `${fig(c.aMag)} m/s²`),
      kv('$\\omega = v/R$', `${fig(Math.abs(c.omega))} rad/s, clockwise`),
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
    if (phi < 1 || phi > 359) {
      return {
        title: 'At rest, and still accelerating',
        body: String.raw`The contact speed is ${fig(c.speed)} m/s. The acceleration is ${fig(c.aMag)} m/s² toward the centre. The top moves at ${fig(c.vTop)} m/s. Play it: the gold path touches down to a point each turn, the mark stopping and leaving straight up.`,
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
      body: String.raw`This point moves at ${fig(c.speed)} m/s, perpendicular to the line from the contact point. The acceleration is ${fig(c.aMag)} m/s² toward the centre. The top moves at ${fig(c.vTop)} m/s.`,
    };
  },
});
