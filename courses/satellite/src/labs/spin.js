import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { quatMatrix } from '@flux/subjects/mechanics/attitude.js';
import { BODIES, inertias, linearSpin, measureSpin, simulate } from '@flux/subjects/mechanics/spin.js';

/**
 * Spin: a box spun about one of its principal axes with a small wobble, and no torque on it.
 *
 * Shows that not every spin axis is as good as another. About the axis of least or greatest inertia
 * the wobble stays small and turns over; about the middle axis it grows exponentially and the box
 * flips over and back again and again. Euler's equations are integrated by RK4 with the attitude
 * quaternion. The second method is linear theory: its wobble frequency or growth rate against a run
 * with a wobble of 10⁻⁶ (packages/subjects/src/mechanics/spin.js).
 */
const SCENARIOS = [
  { id: 'max', name: 'Brick spun about its greatest axis', body: 'brick', axis: 'z', lw: -2, t: 20 },
  { id: 'mid', name: 'Brick spun about its middle axis', body: 'brick', axis: 'y', lw: -2, t: 20 },
  { id: 'min', name: 'Brick spun about its least axis', body: 'brick', axis: 'x', lw: -2, t: 20 },
  { id: 'plate-mid', name: 'Plate about its middle axis', body: 'plate', axis: 'y', lw: -2, t: 20 },
];
const W0 = 1; // rad/s
const T_RUN = 60; // s
const IDX = { x: 0, y: 1, z: 2 };

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, body: sc.body, axis: sc.axis, lw: sc.lw, t: sc.t });
}

const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// The camera for the box: looking at the origin from (2, 1.4, 1.1), z up.
const unit = (v) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dotv = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FWD = unit([-2, -1.4, -1.1]);
const RIGHT = unit(cross(FWD, [0, 0, 1]));
const UP = cross(RIGHT, FWD);
const view = (v) => [dotv(v, RIGHT), dotv(v, UP)];
const mul = (R, v) => R.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);

export default defineLab({
  id: 'spin',
  exam: 'u3',
  title: 'Spin',
  hint: 'Spin the brick about its middle axis and watch ω swap sign again and again: it flips. About the least or greatest axis the wobble stays small.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('max', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 't', lo: 0, hi: T_RUN }),
  controls() {
    return `
      <label class="field"><span>Body, 12 kg</span><select id="sp-body">${Object.entries(BODIES).map(([id, b]) => `<option value="${id}">${b.name}</option>`).join('')}</select></label>
      <label class="field"><span>Spin axis</span><select id="sp-axis"><option value="x">x: least inertia (red)</option><option value="y">y: middle inertia (green)</option><option value="z">z: greatest inertia (blue)</option></select></label>
      ${slider('sp-w', 'Starting wobble, log₁₀ of its share of the spin', -2, -4, -1, 0.1)}
      ${slider('sp-t', 'Time (s)', 20, 0, 60, 0.1)}
      <p class="tiny">Spin 1 rad/s with the wobble added to the other two axes; no torque. The gold arrow is the angular momentum, fixed in space.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['sp-body', 'body'], ['sp-axis', 'axis']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    bindSlider('sp-w', (s, v) => { s.lw = v; }, api);
    bindSlider('sp-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['sp-body', state.body], ['sp-axis', state.axis]]) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    }
    for (const [id, val] of [['sp-w', state.lw], ['sp-t', state.t]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const I = inertias(state.body);
    const eps = 10 ** state.lw;
    const lin = linearSpin(I, state.axis, W0);
    const check = memo(`${state.body}|${state.axis}`, () => measureSpin(I, state.axis, W0));
    const run = memo(`${state.body}|${state.axis}|${state.lw}`, () => simulate(I, state.axis, W0, eps, T_RUN));
    const s = IDX[state.axis];
    let firstFlip = null;
    let flips = 0;
    let maxWobble = 0;
    for (let i = 1; i < run.samples.length; i++) {
      const [p, c] = [run.samples[i - 1], run.samples[i]];
      if (Math.sign(p.w[s]) !== Math.sign(c.w[s])) {
        flips++;
        if (firstFlip == null) firstFlip = c.t;
      }
      maxWobble = Math.max(maxWobble, Math.hypot(...c.w.filter((_, k) => k !== s)) / W0);
    }
    const k = Math.min(run.samples.length - 1, Math.round((state.t / T_RUN) * (run.samples.length - 1)));
    const now = run.samples[k];
    const gap = Math.abs(check.measured - check.predicted) / check.predicted;
    const H = [I[0] * W0 * (s === 0 ? 1 : eps), I[1] * W0 * (s === 1 ? 1 : eps), I[2] * W0 * (s === 2 ? 1 : eps)];
    return { I, eps, lin, check, gap, drift: run.drift, samples: run.samples, now, firstFlip, flips, maxWobble, H };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.45 : 0.5) : [null, B.free];
    const cols = [C.red, C.green, C.blue];
    if (top) {
      const S = sceneIn(B, top, { x0: -0.75, x1: 0.75, y0: -0.7, y1: 0.75 }, 12);
      const R = quatMatrix(c.now.q);
      const [a, b, h] = BODIES[state.body].dims.map((d) => d / 2);
      const P = (i, j, k) => mul(R, [i * a, j * b, k * h]);
      const faces = [
        [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
        [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
        [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]],
      ].map((f) => f.map((p) => P(...p)));
      faces.sort((f, g) => f.reduce((s, p) => s + dotv(p, FWD), 0) - g.reduce((s, p) => s + dotv(p, FWD), 0)).reverse();
      for (const f of faces) poly(S, f.map(view), { fill: alpha(C.gold, 0.8), stroke: alpha(C.bg, 0.9), width: 1 });
      ['x', 'y', 'z'].forEach((n, i) => {
        const e = mul(R, [0, 1, 2].map((k) => (k === i ? 0.55 : 0)));
        seg(S, [0, 0], view(e), { color: cols[i], width: state.axis === n ? 3.5 : 2 });
        label(S, n, view(e), { color: cols[i], dx: 7, dy: -7 });
      });
      const Hn = Math.hypot(...c.H);
      const Hv = c.H.map((v) => (0.68 * v) / Hn);
      seg(S, [0, 0], view(Hv), { color: C.yellow, width: 2, dash: [5, 4] });
      dot(S, ...view(Hv), { color: C.yellow, r: 4 });
      label(S, 'H', view(Hv), { color: C.yellow, dx: 8 });
      label(S, `t = ${fig(state.t)} s`, [-0.75, 0.75], { color: C.muted, align: 'left', base: 'top' });
    }
    // The body rates against time.
    const P = plotIn(B, bottom, { lo: 0, hi: T_RUN }, { lo: -1.1, hi: 1.1 });
    axes(P, { xLabel: 't (s)', yLabel: 'body rates ω (rad/s)' });
    [0, 1, 2].forEach((i) => line(P, c.samples.map((p) => [p.t, p.w[i]]), { color: cols[i], width: IDX[state.axis] === i ? 2.5 : 1.5 }));
    seg(P, [state.t, -1.1], [state.t, 1.1], { color: alpha(C.text, 0.5), width: 1, dash: [3, 3] });
    const msg = c.flips ? `flips ${c.flips} times; first at ${fig(c.firstFlip)} s` : `steady: wobble stays under ${fig(100 * c.maxWobble)}%`;
    label(P, msg, [T_RUN, 1.1], { color: c.flips ? C.red : C.green, align: 'right', dy: -12 });
  },
  law: () => [String.raw`I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3 \quad \text{and cyclic}`, String.raw`\ddot w = -\omega_0^2\,\frac{(I_s - I_a)(I_s - I_b)}{I_a I_b}\,w`],
  liveRows(state, c) {
    return [
      kv('Inertias I_x, I_y, I_z', `${c.I.map((v) => fig(v)).join(', ')} kg·m²`),
      kv('Linear theory', c.lin.stable ? `wobbles at ${fig(c.lin.omega)} rad/s` : `grows at ${fig(c.lin.lambda)} /s`),
      kv('Measured from a 10⁻⁶ wobble', `${fig(c.check.measured)} ${c.lin.stable ? 'rad/s' : '/s'}`),
      kv('Two methods differ by', c.gap.toExponential(1)),
      kv('Sign changes of the spin rate in 60 s', `${c.flips}`),
      kv('Largest wobble, as a share of the spin', `${fig(100 * c.maxWobble)}%`),
      kv('Energy and |H| drift', c.drift.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['axis', `${state.axis}`],
      ['flips', `${c.flips}`],
      [c.lin.stable ? 'wobble period' : 'e-fold time', c.lin.stable ? `${fig((2 * Math.PI) / c.lin.omega)} s` : `${fig(1 / c.lin.lambda)} s`],
      ['first flip', c.firstFlip == null ? 'none' : `${fig(c.firstFlip)} s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A perfectly rigid body. Real satellites flex and slosh, which drains energy while keeping the angular momentum, so even spin about the least axis slowly goes unstable: Explorer 1 tumbled that way in 1958. Only the greatest axis is stable for good.`;
    if (!c.lin.stable) {
      return {
        title: 'The middle axis tumbles',
        body: `About the middle axis the wobble grows as e^(${fig(c.lin.lambda)}t), doubling every ${fig(Math.LN2 / c.lin.lambda)} s. A wobble of ${fig(100 * c.eps)}% becomes a full flip by ${fig(c.firstFlip)} s, and the box flips back and forth ${c.flips} times in a minute, while its angular momentum, the gold arrow, never moves. ${leavesOut}`,
      };
    }
    return {
      title: `The ${state.axis === 'z' ? 'greatest' : 'least'} axis is steady`,
      body: `The wobble turns at ${fig(c.lin.omega)} rad/s, once every ${fig((2 * Math.PI) / c.lin.omega)} s, and stays under ${fig(100 * c.maxWobble)}% of the spin. Nothing feeds it: Euler's equations trade it back and forth between the other two axes. ${leavesOut}`,
    };
  },
  app: false,
});
