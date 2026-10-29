import { raceDown } from '@flux/subjects/mechanics/rigid-energy.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, slider } from './widgets.js';

/**
 * A rolling race down an incline (Hibbeler §18.5): a solid sphere, a disk and a hoop, released
 * together. Shows that only k = I_G/(m R²) decides the race; mass and radius cancel. Each body turns
 * the same drop into kinetic energy, but the hoop keeps half of it in spin, so it rolls slowest. Play
 * it, and the chart of distance against time shows three parabolas, one per k.
 *
 * Recompute: T₁ + V₁ = T₂ + V₂ with T = ½ m v² (1 + k). Check: raceDown's own force and moment
 * equations for each body.
 */
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
  state.anim = { playing: false };
  state.show = { play: false };
}

function clamp(x, lo, hi, fallback) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function travel(row, time, distance) {
  if (!(row.a > 1e-9) || !(time > 0)) return 0;
  if (time >= row.t) return distance;
  return 0.5 * row.a * time * time;
}

const BODIES = [
  { key: 'Sphere', name: 'sphere', color: C.text },
  { key: 'Disk', name: 'disk', color: C.gold },
  { key: 'Hoop', name: 'hoop', color: C.teal },
];

const raceOf = (state) => raceDown({
  thetaDeg: clamp(state.theta, 10, 50, 30),
  distance: clamp(state.distance, 0.5, 4, 2),
  mass: clamp(state.mass, 0.5, 8, 2),
});

export default defineLab({
  id: 'race',
  exam: 'u7',
  title: 'Race',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Only k decides the race. A hoop is slowest. Mass and radius cancel.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('even', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 10, hi: 50 }),
  controls() {
    return `
      ${slider('rc-mass', 'mass (kg)', 2, 0.5, 8, 0.5)}
      ${slider('rc-radius', 'radius (m)', 0.18, 0.1, 0.5, 0.02)}
      ${slider('rc-theta', 'incline (deg)', 30, 10, 50, 1)}
      ${slider('rc-distance', 'distance (m)', 2, 0.5, 4, 0.1)}
      ${slider('rc-time', 'time (s)', 0.7, 0, 2, 0.01)}
      <p class="tiny">Three lanes, one incline: white the sphere, gold the disk, teal the hoop. The spoke shows each one's roll. Mass and radius do not change the speeds.</p>`;
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
    set('rc-time', Number(clamp(state.time, 0, 10, 0).toFixed(2)), Number((raceOf(state).hoop.t * 1.15).toFixed(2)));
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    const end = raceOf(state).hoop.t * 1.15;
    // Half speed, so the order at the finish can be seen; it wraps back to the start.
    let t = (Number(state.time) || 0) + 0.5 * dt;
    if (t > end) t = 0;
    state.time = t;
    return true;
  },
  compute(state) {
    const distance = clamp(state.distance, 0.5, 4, 2);
    const race = raceOf(state);
    const timeMax = race.hoop.t > 1e-9 ? race.hoop.t * 1.15 : 1;
    const time = clamp(state.time, 0, timeMax, 0);
    const series = BODIES.map(({ key }) => {
      const row = race[key.toLowerCase()];
      return Array.from({ length: 61 }, (_, i) => {
        const t = (timeMax * i) / 60;
        return [t, travel(row, t, distance)];
      });
    });
    return {
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
      time,
      timeMax,
      distance,
      series,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const th = (clamp(state.theta, 10, 50, 30) * Math.PI) / 180;
    const R = clamp(state.radius, 0.1, 0.5, 0.18);
    const d = c.distance;
    // The incline falls to the right from the start line; three lanes are three parallel tracks,
    // each one a little higher than the next, all at the same slope.
    const along = [Math.cos(th), -Math.sin(th)];
    const normal = [Math.sin(th), Math.cos(th)];
    const lift = 2.2 * R + 0.04;
    const top = d * Math.sin(th);
    const S = sceneIn(B, left, { x0: -R - 0.2, x1: d * Math.cos(th) + R + 0.3, y0: -0.15, y1: top + 2 * lift + 2.4 * R + 0.25 });
    BODIES.forEach(({ key, color, name }, i) => {
      const y0 = top + (2 - i) * lift;
      const at = (s, up) => [along[0] * s + normal[0] * up, y0 + along[1] * s + normal[1] * up];
      poly(S, [at(0, 0), at(d, 0), [at(d, 0)[0], at(d, 0)[1] - 0.06], [at(0, 0)[0], at(0, 0)[1] - 0.06]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.5), width: 1 });
      seg(S, at(d, -0.05), at(d, 2.4 * R), { color: C.gold, width: 2 });
      const s = c[`s${key}`];
      const centre = at(s, R);
      circle(S, centre, R, { stroke: color, width: 2.5, fill: key === 'Disk' ? alpha(color, 0.2) : key === 'Sphere' ? alpha(color, 0.12) : null });
      if (key === 'Hoop') circle(S, centre, R * 0.88, { stroke: color, width: 1.5 });
      // The spoke turns s/R: clockwise as the body rolls down to the right.
      const phi = -s / R + Math.PI / 2;
      seg(S, centre, [centre[0] + R * Math.cos(phi), centre[1] + R * Math.sin(phi)], { color: C.gold, width: 2 });
      if (!veiled) label(S, `${name}, k = ${fig(c[`k${key}`])}`, at(0, 0), { color, align: 'left', dy: 14 });
    });
    if (veiled) return;

    // Distance against time for each body, and each body's energy split at the finish.
    const P = chartIn(B, right, { lo: 0, hi: c.timeMax }, { lo: 0, hi: d * 1.25 });
    axes(P, { xLabel: 'time (s)', yLabel: 'distance down (m)' });
    line(P, [[0, d], [c.timeMax, d]], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
    note(P, 'finish', c.timeMax * 0.02, d, { color: C.gold, dy: -6 });
    BODIES.forEach(({ key, color }, i) => {
      line(P, c.series[i], { color, width: 2.2 });
      dot(P, c.time, c[`s${key}`], { color, r: 4 });
    });
  },
  law: () => [String.raw`v=\sqrt{2gs\sin\theta/(1+k)}`, String.raw`T = \tfrac12 m v^2 + \tfrac12 I_G\omega^2 = \tfrac12 m v^2 (1 + k)`],
  liveRows(state, c) {
    return [
      kv('T at the finish', `${fig(c.energy)} J, every body`),
      kv('finish times', `${fig(c.tSphere)} s, ${fig(c.tDisk)} s, ${fig(c.tHoop)} s`),
      kv('first', c.winner),
      kv('spin share $k/(1+k)$', `${fig(c.kSphere / (1 + c.kSphere))}, ${fig(c.kDisk / (1 + c.kDisk))}, ${fig(c.kHoop / (1 + c.kHoop))}`),
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
      body: `Mass and radius cancel. The sphere finishes at ${fig(c.sphere)} m/s, the disk at ${fig(c.disk)} m/s, and the hoop at ${fig(c.hoop)} m/s. Each gains ${fig(c.energy)} J. The sphere is first because k is 2/5: it keeps only 2/7 of its energy in spin, the hoop half.`,
    };
  },
});
