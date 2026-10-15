import { plateDiskInertia, rodAboutAxis, shapeMoments } from '@flux/subjects/mechanics/inertia.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'rod', name: 'Slender rod', mode: 'rod', mass: 6, length: 2, offset: 1 },
  { id: 'spread', name: 'Same mass', mode: 'spread', mass: 2, radius: 0.5 },
  {
    id: 'composite',
    name: 'Plate and disk',
    mode: 'composite',
    plateM: 5,
    plateW: 0.6,
    plateH: 0.4,
    diskM: 2,
    diskR: 0.1,
    diskX: 0.2,
    axisX: 0,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.mass = sc.mass ?? state.mass ?? 6;
  state.length = sc.length ?? state.length ?? 2;
  state.offset = sc.offset ?? state.offset ?? 0;
  state.radius = sc.radius ?? state.radius ?? 0.5;
  state.plateM = sc.plateM ?? state.plateM ?? 5;
  state.plateW = sc.plateW ?? state.plateW ?? 0.6;
  state.plateH = sc.plateH ?? state.plateH ?? 0.4;
  state.diskM = sc.diskM ?? state.diskM ?? 2;
  state.diskR = sc.diskR ?? state.diskR ?? 0.1;
  state.diskX = sc.diskX ?? state.diskX ?? 0.2;
  state.axisX = sc.axisX ?? state.axisX ?? 0;
}

function circle(cx, cy, radius, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

function frame(cx, cy, span) {
  const z = Math.max(span, 0.4) * 1.7;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function fitDot(dot, span) {
  dot.scale.setScalar((Math.max(span, 0.4) * 0.035) / 0.02);
}

export default defineLab({
  id: 'inertia',
  exam: 'u6',
  title: 'Inertia',
  hint: 'I grows with the square of the distance from the axis. The mass can stay the same.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    if (state.mode === 'spread') {
      const R = Math.max(Number(state.radius) || 0.5, 0.15);
      return frame(0, -0.85 * R, R * 6.4);
    }
    if (state.mode === 'composite') {
      const w = Math.max(Number(state.plateW) || 0.6, 0.2);
      const h = Math.max(Number(state.plateH) || 0.4, 0.2);
      return frame(0, 0, Math.max(w, h) * 1.35);
    }
    const L = Math.max(Number(state.length) || 2, 0.4);
    return frame(0, 0, L * 0.72);
  },
  defaultState() {
    const s = {};
    apply('rod', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('in-mass', 'mass (kg)', 6, 1, 12, 0.5)}
      ${slider('in-length', 'length (m)', 2, 0.6, 4, 0.1)}
      ${slider('in-offset', 'axis from centre (m)', 1, 0, 2, 0.05)}
      ${slider('in-radius', 'radius (m)', 0.5, 0.15, 0.8, 0.05)}
      ${slider('in-disk-m', 'disk mass (kg)', 2, 0.5, 6, 0.5)}
      ${slider('in-disk-x', 'disk position (m)', 0.2, 0, 0.6, 0.05)}
      ${slider('in-axis', 'axis (m)', 0, -0.3, 0.3, 0.05)}
      <p class="tiny">Gold marks the axis, and the equator on the sphere. The hoop is on the left and the disk is in the middle.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('in-mass', 'mass');
    link('in-length', 'length');
    link('in-offset', 'offset');
    link('in-radius', 'radius');
    link('in-disk-m', 'diskM');
    link('in-disk-x', 'diskX');
    link('in-axis', 'axisX');
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const off = document.getElementById('in-offset');
    if (off) off.max = String(Math.max(0.05, Number(state.length) / 2 || 0.05));
    set('in-mass', state.mass);
    set('in-length', state.length);
    set('in-offset', state.offset);
    set('in-radius', state.radius);
    set('in-disk-m', state.diskM);
    set('in-disk-x', state.diskX);
    set('in-axis', state.axisX);
    const rod = state.mode === 'rod';
    const spread = state.mode === 'spread';
    const composite = state.mode === 'composite';
    showField('in-mass', rod || spread);
    showField('in-length', rod);
    showField('in-offset', rod);
    showField('in-radius', spread);
    showField('in-disk-m', composite);
    showField('in-disk-x', composite);
    showField('in-axis', composite);
  },
  init(ctx) {
    const group = new THREE.Group();
    const rod = makeLine(M.teal);
    const axis = makeLine(M.gold);
    const hoop = makeLine(M.teal);
    const disk = makeLine(M.white);
    const sphere = makeLine(M.white);
    const equator = makeLine(M.gold);
    const plate = makeLine(M.teal);
    const puck = makeLine(M.white);
    const mark = makeDot(M.gold, 0.02);
    group.add(rod, axis, hoop, disk, sphere, equator, plate, puck, mark);
    ctx.scene.add(group);
    return { group, rod, axis, hoop, disk, sphere, equator, plate, puck, mark };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.mode === 'spread') {
      const row = shapeMoments(Number(state.mass) || 0, Number(state.radius) || 0);
      Object.assign(computed, {
        I: row.hoop,
        hoop: row.hoop,
        disk: row.disk,
        sphere: row.sphere,
        which: row.which,
        gap: row.gap,
        mass: Number(state.mass) || 0,
        parallel: 0,
        center: row.disk,
        end: row.hoop,
      });
      return;
    }
    if (state.mode === 'composite') {
      const row = plateDiskInertia({
        plateM: Number(state.plateM) || 0,
        plateW: Number(state.plateW) || 0,
        plateH: Number(state.plateH) || 0,
        diskM: Number(state.diskM) || 0,
        diskR: Number(state.diskR) || 0,
        diskX: Number(state.diskX) || 0,
        axisX: Number(state.axisX) || 0,
      });
      Object.assign(computed, {
        I: row.I,
        hoop: 0,
        disk: 0,
        sphere: 0,
        which: '',
        gap: row.gap,
        mass: row.mass,
        parallel: row.parallel,
        center: 0,
        end: 0,
      });
      return;
    }
    const length = Number(state.length) || 0;
    state.offset = Math.min(Math.max(0, Number(state.offset) || 0), length / 2);
    const row = rodAboutAxis(Number(state.mass) || 0, length, state.offset);
    Object.assign(computed, {
      I: row.I,
      hoop: 0,
      disk: 0,
      sphere: 0,
      which: '',
      gap: row.gap,
      mass: Number(state.mass) || 0,
      parallel: row.parallel,
      center: row.center,
      end: row.end,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const rod = state.mode === 'rod';
    const spread = state.mode === 'spread';
    const composite = state.mode === 'composite';
    h.rod.visible = rod;
    h.axis.visible = rod || composite;
    h.hoop.visible = spread;
    h.disk.visible = spread;
    h.sphere.visible = spread;
    h.equator.visible = spread;
    h.plate.visible = composite;
    h.puck.visible = spread || composite;
    h.mark.visible = rod || composite;
    if (rod) {
      const L = Math.max(Number(state.length) || 0, 0.2);
      const x = Number(state.offset) || 0;
      setLine(h.rod, [{ x: -L / 2, y: 0 }, { x: L / 2, y: 0 }]);
      setLine(h.axis, [{ x, y: -L * 0.18 }, { x, y: L * 0.18 }]);
      h.mark.position.set(x, 0, 0);
      fitDot(h.mark, L);
    } else if (spread) {
      const R = Math.max(Number(state.radius) || 0.2, 0.1);
      const xs = [-2.6 * R, 0, 2.6 * R];
      setLine(h.hoop, circle(xs[0], 0, R));
      setLine(h.disk, circle(xs[1], 0, R));
      setLine(h.puck, circle(xs[1], 0, R * 0.18));
      setLine(h.sphere, circle(xs[2], 0, R));
      const equator = [];
      for (let i = 0; i <= 48; i++) {
        const t = (2 * Math.PI * i) / 48;
        equator.push({ x: xs[2] + R * Math.cos(t), y: 0.34 * R * Math.sin(t) });
      }
      setLine(h.equator, equator);
    } else {
      const w = Number(state.plateW) || 0.6;
      const ht = Number(state.plateH) || 0.4;
      const dx = Number(state.diskX) || 0;
      const r = Number(state.diskR) || 0.1;
      const ax = Number(state.axisX) || 0;
      setLine(h.plate, [
        { x: -w / 2, y: -ht / 2 },
        { x: w / 2, y: -ht / 2 },
        { x: w / 2, y: ht / 2 },
        { x: -w / 2, y: ht / 2 },
        { x: -w / 2, y: -ht / 2 },
      ]);
      setLine(h.puck, circle(dx, 0, r));
      setLine(h.axis, [{ x: ax, y: -ht * 0.72 }, { x: ax, y: ht * 0.72 }]);
      h.mark.position.set(ax, 0, 0);
      fitDot(h.mark, Math.max(w, ht));
    }
  },
  law: () => [String.raw`I=I_G+md^2`],
  liveRows(state, c) {
    if (state.mode === 'spread') {
      return [
        kv('hoop', `${fig(c.hoop)} kg·m²`),
        kv('disk', `${fig(c.disk)} kg·m²`),
        kv('sphere', `${fig(c.sphere)} kg·m²`),
      ].join('');
    }
    if (state.mode === 'composite') {
      return [
        kv('I', `${fig(c.I)} kg·m²`),
        kv('disk md²', `${fig(c.parallel)} kg·m²`),
        kv('mass', `${fig(c.mass)} kg`),
      ].join('');
    }
    return [
      kv('I', `${fig(c.I)} kg·m²`),
      kv('centre', `${fig(c.center)} kg·m²`),
      kv('end', `${fig(c.end)} kg·m²`),
    ].join('');
  },
  readout(state, c) {
    if (state.mode === 'spread') {
      return cells([
        ['hoop', fig(c.hoop)],
        ['disk', fig(c.disk)],
        ['sphere', fig(c.sphere)],
      ]);
    }
    if (state.mode === 'composite') {
      return cells([
        ['I', fig(c.I)],
        ['md²', fig(c.parallel)],
        ['mass kg', fig(c.mass)],
      ]);
    }
    return cells([
      ['I', fig(c.I)],
      ['centre', fig(c.center)],
      ['end', fig(c.end)],
    ]);
  },
  coach(state, c) {
    if (state.mode === 'spread') {
      return {
        title: 'Same mass, different distance',
        body: `Each body is ${fig(c.mass)} kg. The hoop is ${fig(c.hoop)} kg·m², the disk is ${fig(c.disk)}, and the sphere is ${fig(c.sphere)}. The hoop keeps every bit of mass at the rim.`,
      };
    }
    if (state.mode === 'composite') {
      return {
        title: 'Sliding the disk changes I',
        body: `The mass stays ${fig(c.mass)} kg. The disk's parallel-axis term is ${fig(c.parallel)} kg·m², and the total about the gold axis is ${fig(c.I)} kg·m².`,
      };
    }
    return {
      title: 'The axis, not the mass',
      body: `The mass stays ${fig(c.mass)} kg. About the centre, I is ${fig(c.center)} kg·m². About the end it is ${fig(c.end)}. This axis gives ${fig(c.I)}.`,
    };
  },
});
