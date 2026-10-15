import { G } from '@flux/subjects/mechanics/constants.js';
import { pinnedRelease, slotRelease } from '@flux/subjects/mechanics/rigid-energy.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeArrow, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'bar', name: 'Pinned bar', mode: 'bar', mass: 4, length: 2, theta1: 90, theta2: 0, kappa: 0, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'couple', name: 'Torsional spring', mode: 'bar', mass: 4, length: 2, theta1: 90, theta2: 0, kappa: 15, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'slots', name: 'Two slots', mode: 'slots', mass: 3, length: 1.5, theta1: 60, theta2: 30, kappa: 0, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'spring', name: 'Spring at the foot', mode: 'slots', mass: 3, length: 1.5, theta1: 60, theta2: 30, kappa: 0, restDeg: 0, k: 40, springRest: 'length' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.mass = sc.mass;
  state.length = sc.length;
  state.theta1 = sc.theta1;
  state.theta2 = sc.theta2;
  state.kappa = sc.kappa;
  state.restDeg = sc.restDeg;
  state.k = sc.k;
  state.springRest = sc.springRest;
}

function clamp(x, lo, hi, fallback) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function frame(cx, cy, span) {
  const z = Math.max(span, 0.35) * 1.9;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function boxFrame(pts, pad) {
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
  const half = 0.5 * Math.max(maxX - minX, maxY - minY, 0.4) + pad;
  return frame((minX + maxX) / 2, (minY + maxY) / 2, half / 0.52);
}

function barEnd(length, deg) {
  const th = deg * Math.PI / 180;
  return { x: length * Math.sin(th), y: -length * Math.cos(th) };
}

function sweep(fromDeg, toDeg, radius) {
  const a0 = -Math.PI / 2 + (fromDeg * Math.PI) / 180;
  const a1 = -Math.PI / 2 + (toDeg * Math.PI) / 180;
  const steps = 32;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    pts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
  }
  return pts;
}

/** A narrow outline, so a bar that lies on a grid axis is still a bar. */
function rod(x0, y0, x1, y1, half) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * half;
  const py = (dx / len) * half;
  return [
    { x: x0 + px, y: y0 + py },
    { x: x1 + px, y: y1 + py },
    { x: x1 - px, y: y1 - py },
    { x: x0 - px, y: y0 - py },
    { x: x0 + px, y: y0 + py },
  ];
}

function zigzag(x0, y0, x1, y1, amp) {
  const pts = [];
  const n = 8;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const side = i === 0 || i === n ? 0 : (i % 2 === 0 ? -amp : amp);
    pts.push({ x: x0 + dx * u + px * side, y: y0 + dy * u + py * side });
  }
  return pts;
}

function fitDot(dot, length) {
  dot.scale.setScalar((Math.max(length, 0.4) * 0.035) / 0.02);
}

const QUIET = {
  omega: 0, vG: 0, T: 0, work: 0, gap: 0, reaches: false,
  gx: 0, gy: 0, ex: 0, ey: 0, vx: 0, vy: 0,
  ax: 0, ay: 0, bx: 0, by: 0, icx: 0, icy: 0,
};

export default defineLab({
  id: 'linkage',
  exam: 'u7',
  title: 'Linkage',
  hint: 'Write T about the instantaneous centre when that point carries the kinematics.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    const L = Math.max(Number(state.length) || 1.5, 0.4);
    if (state.mode === 'slots') {
      return boxFrame([
        { x: -0.06 * L, y: -0.16 * L },
        { x: L * 1.08, y: L * 1.06 },
      ], 0.04 * L);
    }
    const a = barEnd(L, Number(state.theta1) || 0);
    const b = barEnd(L, Number(state.theta2) || 0);
    return boxFrame([
      { x: 0, y: 0 },
      a,
      b,
      { x: a.x / 2, y: a.y / 2 },
      { x: b.x / 2, y: b.y / 2 },
    ], 0.22 * L);
  },
  defaultState() {
    const s = {};
    apply('bar', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('lk-mass', 'mass (kg)', 4, 1, 10, 0.5)}
      ${slider('lk-length', 'length (m)', 2, 0.6, 3, 0.1)}
      ${slider('lk-theta1', 'release (deg)', 90, 0, 180, 1)}
      ${slider('lk-theta2', 'position (deg)', 0, 0, 180, 1)}
      ${slider('lk-kappa', 'κ (N·m/rad)', 0, 0, 30, 0.5)}
      ${slider('lk-k', 'k (N/m)', 0, 0, 80, 1)}
      <p class="tiny">For the pinned bar, 0 hangs straight down. For the rod in the slots, 0 lies on the floor. Gold is the instantaneous centre.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('lk-mass', 'mass');
    link('lk-length', 'length');
    link('lk-theta1', 'theta1');
    link('lk-theta2', 'theta2');
    link('lk-kappa', 'kappa');
    link('lk-k', 'k');
  },
  syncControls(state) {
    const slots = state.mode === 'slots';
    const set = (id, val, max, min) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(max);
      if (min != null) el.min = String(min);
      if (document.activeElement !== el) el.value = String(val);
    };
    set('lk-mass', state.mass);
    set('lk-length', state.length);
    set('lk-theta1', state.theta1, slots ? 80 : 180, slots ? 5 : 0);
    set('lk-theta2', state.theta2, slots ? 80 : 180, slots ? 5 : 0);
    set('lk-kappa', state.kappa);
    set('lk-k', state.k);
    const release = document.querySelector('#lk-theta1-field > span');
    const position = document.querySelector('#lk-theta2-field > span');
    if (release) release.textContent = slots ? 'release, from the floor (deg)' : 'release, from hanging (deg)';
    if (position) position.textContent = slots ? 'position, from the floor (deg)' : 'position, from hanging (deg)';
    showField('lk-kappa', !slots);
    showField('lk-k', slots);
  },
  init(ctx) {
    const group = new THREE.Group();
    const bar = new THREE.Group();
    const slots = new THREE.Group();
    const barGhost = makeLine(M.grey);
    const barBody = makeLine(M.teal);
    const barArc = makeLine(M.gold);
    const barPin = makeDot(M.gold, 0.02);
    const barG = makeDot(M.white, 0.02);
    const barWeight = forceArrow(new THREE.Vector3(0, -1, 0), M.grey, 0.028, 0.18, 0.12);
    const barVel = makeArrow(M.white);
    bar.add(barGhost, barBody, barArc, barPin, barG, barWeight, barVel);

    const floor = makeLine(M.grey);
    const wall = makeLine(M.grey);
    const slotGhost = makeLine(M.grey);
    const slotBody = makeLine(M.teal);
    const icVert = makeLine(M.gold);
    const icHoriz = makeLine(M.gold);
    const spring = makeLine(M.pink);
    const ic = makeDot(M.gold, 0.02);
    const slotG = makeDot(M.white, 0.02);
    const slotWeight = forceArrow(new THREE.Vector3(0, -1, 0), M.grey, 0.028, 0.18, 0.12);
    const slotVel = makeArrow(M.white);
    slots.add(floor, wall, slotGhost, spring, icVert, icHoriz, slotBody, ic, slotG, slotWeight, slotVel);

    group.add(bar, slots);
    ctx.scene.add(group);
    return {
      group, bar, slots,
      barGhost, barBody, barArc, barPin, barG, barWeight, barVel,
      floor, wall, slotGhost, slotBody, icVert, icHoriz, spring, ic, slotG, slotWeight, slotVel,
    };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const slots = state.mode === 'slots';
    state.mass = clamp(state.mass, 1, 10, 4);
    state.length = clamp(state.length, 0.6, 3, 2);
    state.kappa = clamp(state.kappa, 0, 30, 0);
    state.k = clamp(state.k, 0, 80, 0);
    state.restDeg = clamp(state.restDeg, 0, 180, 0);
    if (slots) {
      state.theta1 = clamp(state.theta1, 5, 80, 60);
      state.theta2 = clamp(state.theta2, 5, 80, 30);
      const rest = state.springRest === 'length' ? state.length : 0;
      const row = slotRelease({
        mass: state.mass,
        length: state.length,
        theta1Deg: state.theta1,
        theta2Deg: state.theta2,
        k: state.k,
        rest,
      });
      Object.assign(computed, QUIET, {
        omega: row.omega,
        vG: row.vG,
        T: row.T,
        work: 0,
        gap: row.gap,
        reaches: row.reaches,
        gx: row.gx,
        gy: row.gy,
        vx: row.vx,
        vy: row.vy,
        ax: row.ax,
        ay: row.ay,
        bx: row.bx,
        by: row.by,
        icx: row.icx,
        icy: row.icy,
      });
      return;
    }
    state.theta1 = clamp(state.theta1, 0, 180, 90);
    state.theta2 = clamp(state.theta2, 0, 180, 0);
    const row = pinnedRelease({
      mass: state.mass,
      length: state.length,
      theta1Deg: state.theta1,
      theta2Deg: state.theta2,
      kappa: state.kappa,
      restDeg: state.restDeg,
    });
    Object.assign(computed, QUIET, {
      omega: row.omega,
      vG: row.vG,
      T: row.T,
      work: row.work,
      gap: row.gap,
      reaches: row.reaches,
      gx: row.gx,
      gy: row.gy,
      ex: row.ex,
      ey: row.ey,
      vx: row.vx,
      vy: row.vy,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const L = Math.max(Number(state.length) || 1, 0.4);
    const slots = state.mode === 'slots';
    h.bar.visible = !slots;
    h.slots.visible = slots;
    fitDot(h.barPin, L);
    fitDot(h.barG, L);
    fitDot(h.ic, L);
    fitDot(h.slotG, L);
    const weight = (Number(state.mass) || 0) * G;
    const scale = (0.28 * L) / Math.max(weight, 1e-6);
    const speed = Math.hypot(c.vx, c.vy);
    const show = speed > 1e-6 ? Math.min(0.38 * L, 0.1 * L * speed) : 0;
    if (!slots) {
      const half = Math.max(0.04, 0.028 * L);
      const ghost = barEnd(L, Number(state.theta1) || 0);
      setLine(h.barGhost, rod(0, 0, ghost.x, ghost.y, half * 0.7));
      setLine(h.barBody, rod(0, 0, c.ex, c.ey, half));
      const wound = Number(state.kappa) > 0 && Math.abs((Number(state.theta1) || 0) - (Number(state.theta2) || 0)) > 1;
      h.barArc.visible = wound;
      if (wound) setLine(h.barArc, sweep(Number(state.theta2) || 0, Number(state.theta1) || 0, 0.22 * L));
      h.barPin.position.set(0, 0, 0);
      h.barG.position.set(c.gx, c.gy, 0);
      placeIncomingArrow(h.barWeight, new THREE.Vector3(c.gx, c.gy, 0), 0, -weight, { scale, minLength: 0, gap: L * 0.03 });
      if (show > 0) setArrow(h.barVel, { x: c.gx, y: c.gy }, { x: (c.vx / speed) * show, y: (c.vy / speed) * show }, show);
      else h.barVel.visible = false;
      return;
    }
    const th1 = (Number(state.theta1) || 0) * Math.PI / 180;
    setLine(h.floor, [{ x: -0.04 * L, y: 0 }, { x: L * 1.08, y: 0 }]);
    setLine(h.wall, [{ x: 0, y: -0.04 * L }, { x: 0, y: L * 1.06 }]);
    setLine(h.slotGhost, [
      { x: L * Math.cos(th1), y: 0 },
      { x: 0, y: L * Math.sin(th1) },
    ]);
    setLine(h.slotBody, [{ x: c.ax, y: c.ay }, { x: c.bx, y: c.by }]);
    setLine(h.icVert, [{ x: c.ax, y: c.ay }, { x: c.icx, y: c.icy }]);
    setLine(h.icHoriz, [{ x: c.bx, y: c.by }, { x: c.icx, y: c.icy }]);
    const sprung = Number(state.k) > 0;
    h.spring.visible = sprung;
    if (sprung) setLine(h.spring, zigzag(0, 0, c.ax, 0, 0.055 * L));
    h.ic.position.set(c.icx, c.icy, 0);
    h.slotG.position.set(c.gx, c.gy, 0);
    placeIncomingArrow(h.slotWeight, new THREE.Vector3(c.gx, c.gy, 0), 0, -weight, { scale, minLength: 0, gap: L * 0.03 });
    if (show > 0) setArrow(h.slotVel, { x: c.gx, y: c.gy }, { x: (c.vx / speed) * show, y: (c.vy / speed) * show }, show);
    else h.slotVel.visible = false;
  },
  law(state) {
    if (state.mode === 'slots') return [String.raw`T=\tfrac{1}{2}I_{IC}\omega^2`];
    return [String.raw`T=\tfrac{1}{2}I_O\omega^2`];
  },
  liveRows(state, c) {
    const rows = [
      kv('$\\omega$', `${fig(c.omega)} rad/s`),
      kv('T', `${fig(c.T)} J`),
    ];
    if (state.mode !== 'slots' && Number(state.kappa) > 0) rows.push(kv('couple', `${fig(c.work)} J`));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['$\\omega$', fig(c.omega)],
      ['$v_G$', fig(c.vG)],
      ['T', `${fig(c.T)} J`],
    ]);
  },
  coach(state, c) {
    if (!c.reaches) {
      return { title: 'Short of that angle', body: 'The bar stops short of that angle.' };
    }
    if (state.mode !== 'slots' && Number(state.kappa) > 0) {
      return {
        title: 'The spring adds its work',
        body: `The torsional spring is unstretched when the bar hangs down. Its work is ${fig(c.work)} J, and ω is ${fig(c.omega)} rad/s.`,
      };
    }
    if (state.mode !== 'slots') {
      return {
        title: 'The centre drops half the length',
        body: `ω is ${fig(c.omega)} rad/s. The centre moves at ${fig(c.vG)} m/s, because it sits halfway along the bar.`,
      };
    }
    if (Number(state.k) > 0) {
      return {
        title: 'The spring pushes the foot out',
        body: `The natural length equals the rod. The spring starts compressed and pushes the foot outward. ω is ${fig(c.omega)} rad/s.`,
      };
    }
    return {
      title: 'Use the instantaneous centre',
      body: `Gold marks the instantaneous centre. About that corner, I is mL²/3. ω is ${fig(c.omega)} rad/s and the centre moves at ${fig(c.vG)} m/s.`,
    };
  },
});
