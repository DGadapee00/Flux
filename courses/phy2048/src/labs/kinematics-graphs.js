/**
 * Shows that velocity is the slope of the x–t graph, that acceleration is the slope of the v–t graph,
 * that the chord over a shrinking interval becomes the tangent, and that distance and displacement
 * part company when the velocity changes sign.
 *
 * The acceleration is constant in each of four 1.5 s pieces, so the exact answer is closed form
 * (`piecewiseMotion`). The check steps the same a(t) with the trapezoid rule and gets the same
 * positions, the same velocities and, from ∫|v| dt, the same distance.
 */
import * as THREE from 'three';
import { piecewiseMotion } from '@flux/subjects/mechanics/kinematics.js';
import { createGraph, niceRange, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

/** Each piece of the acceleration graph lasts this long, in seconds. */
export const PIECE = 1.5;
const PIECES = 4;
const T = PIECE * PIECES;

const SCENARIOS = [
  { id: 'toss', name: 'A ball tossed up from a bridge', x0: 0, v0: 14.7, a: [-9.81, -9.81, -9.81, -9.81], t0: 1, dt: 1 },
  { id: 'train', name: 'A train: speed up, cruise, brake', x0: 0, v0: 0, a: [2, 0, 0, -2], t0: 2, dt: 1 },
  { id: 'outback', name: 'Out, back, and out again', x0: 0, v0: 6, a: [-3, -3, 3, 3], t0: 1, dt: 1 },
];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** The state with its times kept inside the 6 s the graphs cover. */
function placed(state) {
  const dt = clamp(state.dt, 0.05, 3);
  const t0 = clamp(state.t0, 0, T - dt);
  return { ...state, dt, t0 };
}

const motionOf = (s) => piecewiseMotion({ x0: s.x0, v0: s.v0, pieces: s.a.map((a) => ({ dt: PIECE, a })) });

export default defineLab({
  id: 'kinematics-graphs',
  exam: 'u1',
  title: 'Motion graphs',
  hint: 'Set the acceleration piece by piece. The chord shrinks to the tangent as the interval does.',
  orbit: false,
  fit: { w: 11.6, h: 10.8 },
  camera: { pos: new THREE.Vector3(0, 0.8, 22), target: new THREE.Vector3(0, 0.8, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'kg-top',
      scenario: 'toss',
      ask: 'The ball is at the top of its flight, where its velocity is zero for an instant. Is its acceleration zero too?',
      apply(s) { s.t0 = 1.5; },
      watch: [{ id: 'zero', label: 'the acceleration is zero', get: (c) => Math.abs(c.aNow) < 1e-9, mode: 'bool' }],
      expect: { zero: false },
      why: String.raw`Gravity pulls on the ball the whole time. At the top the velocity is changing from up to down, at $-9.81\ \mathrm{m/s^2}$, so it is zero only for an instant. A velocity of zero says nothing about the acceleration.`,
    },
    {
      id: 'kg-double',
      scenario: 'train',
      ask: 'Double the first acceleration, from $2$ to $4\\ \\mathrm{m/s^2}$. The train starts from rest. What happens at the end of the first 1.5 s?',
      apply(s) { s.a[0] = 4; },
      watch: [
        { id: 'v1', label: 'the speed at 1.5 s', get: (c) => c.v1, mode: 'factor' },
        { id: 'x1', label: 'the distance covered by 1.5 s', get: (c) => c.x1, mode: 'factor' },
      ],
      expect: { v1: 2, x1: 2 },
      why: String.raw`From rest, $v = at$ and $x = \tfrac12 a t^2$. Both are proportional to $a$, so doubling the acceleration doubles the speed and doubles the distance in the same time.`,
    },
    {
      id: 'kg-chord',
      scenario: 'toss',
      ask: 'Shrink the interval from 1 s to 0.1 s, starting at 1 s. How far is the chord\'s slope from the velocity at 1 s?',
      apply(s) { s.dt = 0.1; },
      watch: [{ id: 'gap', label: 'the gap between the two', get: (c) => Math.abs(c.vAvg - c.vInst) }],
      mode: 'dir',
      expect: { gap: 'smaller' },
      why: String.raw`The slope of the chord is the average velocity over the interval. As the interval shrinks it settles on the velocity at its start, which is the slope of the tangent.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('toss', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { a: [...sc.a], scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    const rows = [];
    rows.push(sliderRow('kg-v0', 'Starting velocity (m/s)', 14.7, -10, 20, 0.5));
    for (let i = 0; i < PIECES; i += 1) {
      rows.push(sliderRow(`kg-a${i}`, `Acceleration, ${(i * PIECE).toFixed(1)} to ${((i + 1) * PIECE).toFixed(1)} s (m/s²)`, 0, -10, 10, 0.5));
    }
    rows.push(sliderRow('kg-t0', 'Time of interest (s)', 1, 0, T, 0.05));
    rows.push(sliderRow('kg-dt', 'Interval Δt (s)', 1, 0.05, 3, 0.05));
    return `<div class="lab-block">${rows.join('')}</div>`;
  },
  bind(api) {
    bindSlider(api, 'kg-v0', (s, v) => { s.v0 = v; });
    for (let i = 0; i < PIECES; i += 1) bindSlider(api, `kg-a${i}`, (s, v) => { s.a[i] = v; });
    bindSlider(api, 'kg-t0', (s, v) => { s.t0 = v; });
    bindSlider(api, 'kg-dt', (s, v) => { s.dt = v; });
  },
  syncControls(state) {
    const p = placed(state);
    putSlider('kg-v0', state.v0, 1);
    for (let i = 0; i < PIECES; i += 1) putSlider(`kg-a${i}`, state.a[i], 1);
    const t0 = document.getElementById('kg-t0');
    if (t0) t0.max = String(Number((T - p.dt).toFixed(2)));
    putSlider('kg-t0', p.t0, 2);
    putSlider('kg-dt', p.dt, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const W = 10;
    const H = 2.3;
    const left = -W / 2;
    const graphs = {
      x: createGraph(group, { x: left, y: 3.3, w: W, h: H, color: QUANTITY_COLORS.x, name: String.raw`<i>x</i> (m)` }),
      v: createGraph(group, { x: left, y: -0.4, w: W, h: H, color: QUANTITY_COLORS.v, name: String.raw`<i>v</i> (m/s)` }),
      a: createGraph(group, { x: left, y: -4.1, w: W, h: H, color: QUANTITY_COLORS.a, name: String.raw`<i>a</i> (m/s²)`, xName: 'time <i>t</i> (s)' }),
    };
    group.visible = false;
    return { group, graphs };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const s = placed(state);
    const m = motionOf(s);
    const tb = s.t0 + s.dt;
    const p = m.at(s.t0);
    const q = m.at(tb);
    computed.motion = m;
    computed.view = s;
    computed.x = p.x;
    computed.vInst = p.v;
    computed.aNow = p.a;
    computed.vAvg = (q.x - p.x) / s.dt;
    computed.aAvg = (q.v - p.v) / s.dt;
    computed.displacement = m.displacement;
    computed.distance = m.distance;
    computed.xEnd = m.knots[m.knots.length - 1].x;
    computed.vEnd = m.knots[m.knots.length - 1].v;
    computed.x1 = m.knots[1].x - s.x0;
    computed.v1 = m.knots[1].v - s.v0;
    computed.turns = m.turns;
  },
  second(state) {
    // The same a(t), stepped with the trapezoid rule instead of the closed forms.
    const s = placed(state);
    const N = 20000;
    const at = (target) => {
      let x = s.x0;
      let v = s.v0;
      let path = 0;
      let t = 0;
      for (let i = 0; i < PIECES && t < target - 1e-12; i += 1) {
        const span = Math.min(PIECE, target - t);
        const h = span / N;
        for (let k = 0; k < N; k += 1) {
          const vNext = v + s.a[i] * h;
          x += 0.5 * (v + vNext) * h;
          path += Math.abs(0.5 * (v + vNext)) * h;
          v = vNext;
        }
        t += span;
      }
      return { x, v, path };
    };
    const whole = at(T);
    const p = at(s.t0);
    const q = at(s.t0 + s.dt);
    return {
      x: p.x,
      vInst: p.v,
      vAvg: (q.x - p.x) / s.dt,
      aAvg: (q.v - p.v) / s.dt,
      displacement: whole.x - s.x0,
      distance: whole.path,
      xEnd: whole.x,
      vEnd: whole.v,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const s = computed.view || placed(state);
    const m = computed.motion;
    const g = h.graphs;
    const ts = Array.from({ length: 49 }, (_, i) => (T * i) / 48);
    const xr = niceRange(ts.map((t) => m.at(t).x));
    const vr = niceRange(ts.map((t) => m.at(t).v));
    const ar = niceRange(s.a, { pad: 0.2 });
    const tb = s.t0 + s.dt;
    g.x.set({ t0: 0, t1: T, lo: xr[0], hi: xr[1], f: (t) => m.at(t).x });
    g.v.set({ t0: 0, t1: T, lo: vr[0], hi: vr[1], f: (t) => m.at(t).v });
    g.a.set({ t0: 0, t1: T, lo: ar[0], hi: ar[1], f: (t) => m.at(t).a });
    const p = m.at(s.t0);
    const q = m.at(tb);
    g.x.mark(s.t0, p.x);
    g.x.line(s.t0, p.x, tb, q.x);
    g.v.mark(s.t0, p.v);
    g.v.line(s.t0, p.v, tb, q.v);
    g.a.mark(s.t0, p.a);
    g.a.clearLine();
  },
  law: () => [
    String.raw`v = \dfrac{dx}{dt}, \qquad a = \dfrac{dv}{dt}`,
    String.raw`\Delta x = \int v\,dt, \qquad \text{distance} = \int |v|\,dt`,
  ],
  readoutCells(state, computed) {
    const turns = computed.turns.length ? `turns at ${computed.turns.map((t) => `${fmt(t, 3)} s`).join(', ')}` : 'never turns back';
    return [
      ['Slope of the chord (average velocity)', `${fmt(computed.vAvg)} m/s`],
      ['Velocity at the start of the interval', `${fmt(computed.vInst)} m/s`],
      ['Acceleration there', `${fmt(computed.aNow)} m/s²`],
      ['Displacement over the 6 s', `${fmt(computed.displacement)} m`],
      ['Distance travelled over the 6 s', `${fmt(computed.distance)} m`, computed.distance - Math.abs(computed.displacement) > 1e-9 ? 'warn' : ''],
      ['Direction', turns],
    ];
  },
  coach(state, computed) {
    if (computed.turns.length) {
      return {
        title: 'The velocity changes sign, so the two totals part',
        body: String.raw`Displacement is the net area under $v(t)$, with the part below zero counted negative. Distance counts every part as positive. The velocity crosses zero at ${computed.turns.map((t) => `$${fmt(t, 3)}$ s`).join(' and ')}, and the object turns around there.`,
      };
    }
    return {
      title: 'Slope up a level, area down a level',
      body: String.raw`The velocity is the slope of the position graph. The acceleration is the slope of the velocity graph. Going the other way, the area under $a(t)$ is the change in velocity, and the area under $v(t)$ is the change in position. The yellow chord is the average over the interval you set. Shrink the interval and it becomes the tangent.`,
    };
  },
});
