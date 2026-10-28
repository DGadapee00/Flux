import { plateDiskInertia, rodAboutAxis, shapeMoments } from '@flux/subjects/mechanics/inertia.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
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
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

/** The torque every body gets under Play, so that only I decides how fast each spins up. */
const TORQUE = 2;
const T_END = 3;

/**
 * Mass moment of inertia (Hibbeler §17.1): a rod about axes along it, three shapes of one mass and
 * radius, and a plate carrying a disk. Shows that I grows with the square of each piece's distance
 * from the axis, so the same mass resists spinning up more when it sits far out, and that the
 * parallel-axis term m d² is what moving an axis adds. Play gives every body the same 2 N·m and lets
 * it spin: θ = ½(M/I)t².
 *
 * Recompute: the closed forms and the parallel-axis theorem. Check: each moment by integration.
 */

const rot = ([x, y], [cx, cy], a) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];

export default defineLab({
  id: 'inertia',
  exam: 'u6',
  title: 'Inertia',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: (state) => (state.mode === 'rod' ? { key: 'offset', lo: 0, hi: 2 } : state.mode === 'composite' ? { key: 'diskX', lo: 0, hi: 0.6 } : { key: 'radius', lo: 0.15, hi: 0.8 }),
  hint: 'I grows with the square of the distance from the axis. The mass can stay the same.',
  scenarios: SCENARIOS,
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
      <p class="tiny">Gold marks the axis, seen end on. The hoop is on the left, the disk in the middle, the sphere on the right. Play gives every body the same 2 N·m about its axis: the larger I, the slower it spins up.</p>`;
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
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: T_END, rate: 1 });
  },
  compute(state) {
    const computed = {};
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
      return computed;
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
        series: Array.from({ length: 25 }, (_, i) => {
          const x = (0.6 * i) / 24;
          return [x, plateDiskInertia({ plateM: Number(state.plateM) || 0, plateW: Number(state.plateW) || 0, plateH: Number(state.plateH) || 0, diskM: Number(state.diskM) || 0, diskR: Number(state.diskR) || 0, diskX: x, axisX: Number(state.axisX) || 0 }).I];
        }),
      });
      return computed;
    }
    const length = Number(state.length) || 0;
    const offset = Math.min(Math.max(0, Number(state.offset) || 0), length / 2);
    const row = rodAboutAxis(Number(state.mass) || 0, length, offset);
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
      offset,
      series: Array.from({ length: 25 }, (_, i) => {
        const d = (length / 2) * (i / 24);
        return [d, rodAboutAxis(Number(state.mass) || 0, length, d).I];
      }),
    });
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const t = Math.min(Math.max(Number(state.t) || 0, 0), T_END);
    const turn = (I) => (I > 1e-12 ? (0.5 * TORQUE * t * t) / I : 0);
    const axisMark = (S, p) => {
      circle(S, p, 0.035 * (S.span || 1), { stroke: C.gold, width: 2, fill: alpha(C.gold, 0.5) });
    };
    if (state.mode === 'spread') {
      const R = Math.max(Number(state.radius) || 0.2, 0.1);
      const S = sceneIn(B, left, { x0: -4 * R, x1: 4 * R, y0: -2 * R, y1: 1.4 * R });
      S.span = R * 2;
      const xs = [-2.6 * R, 0, 2.6 * R];
      const Is = [c.hoop, c.disk, c.sphere];
      const names = ['hoop', 'disk', 'sphere'];
      xs.forEach((x, i) => {
        const fill = i === 0 ? null : alpha(C.text, i === 1 ? 0.18 : 0.1);
        circle(S, [x, 0], R, { stroke: i === 0 ? C.teal : C.text, width: i === 0 ? 4 : 2, fill });
        const a = -turn(Is[i]);
        for (let j = 0; j < 2; j++) seg(S, [x, 0], rot([x + R, 0], [x, 0], a + j * Math.PI), { color: C.gold, width: 2 });
        axisMark(S, [x, 0]);
        label(S, names[i], [x, -R], { color: C.muted, dy: 14 });
        if (!veiled) label(S, `${fig(Is[i])} kg·m²`, [x, -R], { color: C.muted, dy: 28 });
      });
      if (veiled) return;
      const P = chartIn(B, right, { lo: 0, hi: 3 }, { lo: 0, hi: Math.max(...Is) * 1.2 });
      axes(P, { xLabel: 'hoop | disk | sphere, one mass and radius', yLabel: 'I (kg·m²)', xFmt: () => '' });
      Is.forEach((I, i) => poly(P, [[i + 0.2, 0], [i + 0.8, 0], [i + 0.8, I], [i + 0.2, I]], { fill: alpha(i === 0 ? C.teal : C.text, 0.6), stroke: null }));
      return;
    }
    if (state.mode === 'composite') {
      const w = Number(state.plateW) || 0.6;
      const ht = Number(state.plateH) || 0.4;
      const dx = Number(state.diskX) || 0;
      const r = Number(state.diskR) || 0.1;
      const ax = Number(state.axisX) || 0;
      const reach = Math.hypot(Math.max(Math.abs(-w / 2 - ax), Math.abs(w / 2 - ax), Math.abs(dx - ax) + r), ht / 2) * 1.15;
      const S = sceneIn(B, left, { x0: ax - reach, x1: ax + reach, y0: -reach, y1: reach });
      S.span = reach;
      const a = -turn(c.I);
      const O = [ax, 0];
      poly(S, [[-w / 2, -ht / 2], [w / 2, -ht / 2], [w / 2, ht / 2], [-w / 2, ht / 2]].map((p) => rot(p, O, a)), { fill: alpha(C.teal, 0.25), stroke: C.teal, width: 2 });
      circle(S, rot([dx, 0], O, a), r, { stroke: C.text, width: 2, fill: alpha(C.text, 0.3) });
      seg(S, O, rot([dx, 0], O, a), { color: alpha(C.gold, 0.6), width: 1, dash: [4, 3] });
      axisMark(S, O);
      if (veiled) return;
      const ys = c.series.map((q) => q[1]);
      const P = chartIn(B, right, { lo: 0, hi: 0.6 }, { lo: 0, hi: Math.max(...ys) * 1.15 });
      axes(P, { xLabel: 'disk position (m)', yLabel: 'I about the axis (kg·m²)' });
      line(P, c.series, { color: C.text, width: 2.5 });
      dot(P, dx, c.I, { color: C.yellow, r: 5 });
      return;
    }
    const L = Math.max(Number(state.length) || 0, 0.2);
    const x = c.offset;
    const reach = (L / 2 + x) * 1.12;
    const S = sceneIn(B, left, { x0: x - reach, x1: x + reach, y0: -reach, y1: reach });
    S.span = L;
    const a = -turn(c.I);
    const O = [x, 0];
    seg(S, rot([-L / 2, 0], O, a), rot([L / 2, 0], O, a), { color: C.teal, width: 7 });
    dot(S, ...rot([0, 0], O, a), { color: C.text, r: 3 });
    axisMark(S, O);
    if (!veiled) label(S, `d = ${fig(x)} m from G`, [x, -reach], { color: C.muted, dy: -12 });
    if (veiled) return;
    // I against the axis's distance from the centre: I_G + m d², a parabola.
    const ys = c.series.map((q) => q[1]);
    const P = chartIn(B, right, { lo: 0, hi: L / 2 }, { lo: 0, hi: Math.max(...ys) * 1.15 });
    axes(P, { xLabel: 'axis distance d from G (m)', yLabel: 'I (kg·m²)' });
    line(P, [[0, c.center], [L / 2, c.center]], { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    label(P, 'I_G', [0, c.center], { color: C.muted, align: 'left', dx: 4, dy: -8 });
    line(P, c.series, { color: C.teal, width: 2.5 });
    dot(P, x, c.I, { color: C.yellow, r: 5 });
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
