import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { G0, launchLoad, transmissibility } from '@flux/subjects/mechanics/basevib.js';

/**
 * Shake: a 2 kg component on a bracket, shaken at its base by a sine, as a launcher shakes a
 * satellite.
 *
 * Shows that strength is not the whole story at launch. A bracket whose natural frequency sits near
 * the shaking frequency multiplies the input by about 1/(2ζ); one well above it passes the input
 * through; one well below isolates it. The transmissibility comes in closed form; the second method
 * integrates the equation of motion by RK4 and shoots for the periodic steady state
 * (packages/subjects/src/mechanics/basevib.js).
 */
const SCENARIOS = [
  { id: 'stiff', name: 'A stiff bracket, 150 Hz, shaken at 40 Hz', fn: 150, zeta: 0.05, f: 40, Ain: 1 },
  { id: 'resonant', name: 'A 40 Hz bracket shaken at 40 Hz', fn: 40, zeta: 0.05, f: 40, Ain: 1 },
  { id: 'soft', name: 'A soft 15 Hz mount shaken at 40 Hz', fn: 15, zeta: 0.05, f: 40, Ain: 1 },
  { id: 'damped', name: 'The 40 Hz bracket with 20% damping', fn: 40, zeta: 0.2, f: 40, Ain: 1 },
];
const MASS = 2;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lfn: Math.log10(sc.fn), zeta: sc.zeta, lf: Math.log10(sc.f), Ain: sc.Ain });
}

const KEYS = [['sh-fn', 'lfn'], ['sh-z', 'zeta'], ['sh-f', 'lf'], ['sh-a', 'Ain']];

export default defineLab({
  id: 'shake',
  exam: 'u4',
  title: 'Shake',
  hint: 'Bring the bracket’s natural frequency onto the shaking frequency: the component sees ten times the input. Stiffen it well clear, or soften it well below.',
  gapLimit: 1e-7,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('stiff', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lf', lo: 0.7, hi: 2.7 }),
  controls() {
    return `
      ${slider('sh-fn', 'Bracket natural frequency, log₁₀ f_n (Hz)', 2.18, 1, 2.5, 0.01)}
      ${slider('sh-z', 'Damping ratio ζ', 0.05, 0.01, 0.2, 0.005)}
      ${slider('sh-f', 'Shaking frequency, log₁₀ f (Hz)', 1.6, 0.7, 2.7, 0.01)}
      ${slider('sh-a', 'Base acceleration (g)', 1, 0.5, 5, 0.1)}
      <p class="tiny">f_n from 10 to 316 Hz, f from 5 to 500 Hz. A 2 kg component. Bolted metal structures are lightly damped: ζ of a few percent.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const fn = 10 ** state.lfn;
    const f = 10 ** state.lf;
    const r = launchLoad({ fn, zeta: state.zeta, f, Ain: state.Ain, m: MASS });
    const curve = [];
    for (let i = 0; i <= 300; i++) {
      const fi = 10 ** (0.7 + (2 * i) / 300);
      curve.push([fi, transmissibility(fi / fn, state.zeta)]);
    }
    return { ...r, fn, f, curve };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.55 : 0.55) : [B.free, null];
    // Transmissibility against shaking frequency, both axes logarithmic.
    const yhi = Math.max(2, 1.6 * Math.max(...c.curve.map(([, t]) => t)));
    const P = plotIn(B, top, { lo: 5, hi: 500, log: true }, { lo: 0.01, hi: yhi, log: true });
    axes(P, { xLabel: 'shaking frequency (Hz)', yLabel: 'output ÷ input acceleration' });
    seg(P, [5, 1], [500, 1], { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    seg(P, [c.fn, 0.01], [c.fn, yhi], { color: alpha(C.pink, 0.5), width: 1, dash: [3, 3] });
    label(P, 'f_n', [c.fn, 0.01], { color: C.pink, dx: 4, dy: -10, align: 'left' });
    line(P, c.curve, { color: C.gold, width: 2.5 });
    dot(P, c.f, c.T, { color: C.yellow, r: 6, ring: C.text });
    label(P, `×${fig(c.T)}`, [c.f, c.T], { color: C.yellow, align: c.f > 100 ? 'right' : 'left', dx: c.f > 100 ? -10 : 10, dy: -10 });
    if (!bottom) return;
    // One period of the base's and the component's acceleration.
    const span = 1.15 * Math.max(state.Ain, c.out);
    const Q = plotIn(B, bottom, { lo: 0, hi: 1 }, { lo: -span, hi: span });
    axes(Q, { xLabel: 't / period', yLabel: 'acceleration (g)' });
    const T = 1 / c.f;
    line(Q, c.trace.map(([t, ab]) => [t / T, ab / G0]), { color: C.text, width: 1.8 });
    line(Q, c.trace.map(([t, , am]) => [t / T, am / G0]), { color: c.T > 1 ? C.red : C.teal, width: 2.5 });
    label(Q, 'base', [0.25, state.Ain], { color: C.text, dy: -18 });
  },
  law: () => [String.raw`m\ddot z + c\dot z + kz = -m\ddot y, \qquad z = x - y`, String.raw`T = \sqrt{\frac{1 + (2\zeta r)^2}{(1 - r^2)^2 + (2\zeta r)^2}}, \qquad r = \frac{f}{f_n}`],
  liveRows(state, c) {
    return [
      kv('f / f_n', fig(c.r)),
      kv('Transmissibility, closed form', fig(c.T)),
      kv('Transmissibility, RK4 steady state', fig(c.Tnum)),
      kv('Two methods differ by', c.gap.toExponential(1)),
      kv('Component acceleration', `${fig(c.out)} g`),
      kv('Force on the bracket, m × a', `${fig(c.force)} N`),
      kv('Peak transmissibility, about 1/(2ζ)', fig(c.peak)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['f / f_n', fig(c.r)],
      ['T', `×${fig(c.T)}`],
      ['component', `${fig(c.out)} g`],
      ['bracket force', `${fig(c.force)} N`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One mode of a linear bracket under a pure sine. A real launch adds random vibration, shock and acoustic loads, and a real bracket has many modes; launchers set a minimum first natural frequency so the spacecraft stays clear of the vehicle’s own low-frequency shaking.`;
    if (c.r > 0.7 && c.r < 1.4) {
      return { title: 'Resonance', body: `The shaking is within 40% of the bracket’s natural frequency, f/f_n = ${fig(c.r)}. Each cycle adds to the swing, so the component sees ${fig(c.T)} times the input, ${fig(c.out)} g, and the bracket carries ${fig(c.force)} N. Damping alone limits it, to about 1/(2ζ) = ${fig(c.Q)}. ${leavesOut}` };
    }
    if (c.r <= 0.7) {
      return { title: 'Stiff: the input passes through', body: `The bracket is ${fig(1 / c.r)} times faster than the shaking, so the component simply moves with the base: ×${fig(c.T)}. A stiff bracket is safe at this frequency, but only because its natural frequency is clear of it, not because it is strong. ${leavesOut}` };
    }
    return { title: 'Soft: isolation', body: `The shaking is ${fig(c.r)} times the mount’s natural frequency, so the mass cannot follow it: ×${fig(c.T)}. Above f/f_n = √2 more damping makes isolation worse, not better. ${leavesOut}` };
  },
  app: false,
});
