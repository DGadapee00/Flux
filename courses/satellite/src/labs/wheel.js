import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { WHEEL, wheelChecked, wheelClosed } from '@flux/subjects/mechanics/wheel.js';

/**
* Wheel: a reaction wheel absorbing a disturbance torque orbit after orbit, with sliders for the
 * disturbance, the magnetorquer's dipole and the wheel's capacity, its stored momentum drawn.
 *
 * Shows that holding still costs momentum: a steady 10 µN·m fills a 0.5 N·m·s wheel in 14 hours, and
 * the wheel must be emptied before then. A magnetorquer can push back only at right angles to Earth's
 * field, on average (2/π)mB: 0.3 A·m² stretches the time to 33 hours, 1 A·m² keeps the wheel from ever
 * filling. The closed form at whole orbits is checked by integrating the torques with Runge–Kutta
 * (packages/subjects/src/mechanics/wheel.js).
 */
const SCENARIOS = [
  { id: 'none', name: 'No magnetorquer, 10 µN·m', tau0u: 10, m: 0, Hmax: 0.5 },
  { id: 'small', name: 'A 0.3 A·m² torquer', tau0u: 10, m: 0.3, Hmax: 0.5 },
  { id: 'enough', name: 'A 1 A·m² torquer', tau0u: 10, m: 1, Hmax: 0.5 },
  { id: 'big', name: '30 µN·m, a 1 N·m·s wheel', tau0u: 30, m: 0.5, Hmax: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, tau0u: sc.tau0u, m: sc.m, Hmax: sc.Hmax });
}

const KEYS = [['wh-t', 'tau0u'], ['wh-m', 'm'], ['wh-h', 'Hmax']];

function stored(B, rect, state, c) {
  const top = Math.max(state.Hmax, ...c.path.map((p) => p[1])) * 1.15;
  const P = plotIn(B, rect, { lo: 0, hi: c.path[c.path.length - 1][0] }, { lo: 0, hi: top });
  axes(P, { xLabel: 'time (hours)', yLabel: 'stored momentum (N·m·s)' });
  seg(P, [0, state.Hmax], [c.path[c.path.length - 1][0], state.Hmax], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, 'wheel full', [0, state.Hmax], { color: C.red, align: 'left', dx: 6, dy: -10 });
  line(P, c.path.map(([t, H]) => [t, Math.max(0, H)]), { color: C.gold, width: 2 });
  if (Number.isFinite(c.tSatH) && c.tSatH < c.path[c.path.length - 1][0]) dot(P, c.tSatH, state.Hmax, { color: C.pink, r: 6, ring: C.text });
}

function satPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 2 }, { lo: 1, hi: 1000, log: true });
  axes(P, { xLabel: 'magnetorquer dipole (A·m²)', yLabel: 'hours until the wheel is full' });
  const ms = Array.from({ length: 201 }, (_, i) => i / 100);
  const pts = ms.map((m) => [m, wheelClosed({ ...state, m }).tSatH]).filter((p) => Number.isFinite(p[1]) && p[1] <= 1000);
  line(P, pts, { color: C.gold, width: 2.5 });
  const mStop = (state.tau0u * 1e-6 * Math.PI) / (2 * WHEEL.B);
  if (mStop <= 2) {
    seg(P, [mStop, 1], [mStop, 1000], { color: alpha(C.green, 0.8), width: 1.5, dash: [4, 4] });
    label(P, 'never fills past here', [mStop, 600], { color: C.green, align: 'left', dx: 6 });
  }
  if (Number.isFinite(c.tSatH) && c.tSatH <= 1000) dot(P, state.m, c.tSatH, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'wheel',
  exam: 'u3',
  title: 'Wheel',
  hint: 'With no torquer, read when the wheel fills. Then add dipole until it never does.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('none', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'm', lo: 0, hi: 2 }),
  controls() {
    return `
      ${slider('wh-t', "Steady disturbance (µN·m)", 10, 1, 50, 0.5)}
      ${slider('wh-m', "Magnetorquer dipole m (A·m²)", 0.3, 0, 2, 0.05)}
      ${slider('wh-h', "Wheel capacity (N·m·s)", 0.5, 0.1, 2, 0.05)}
      <p class="tiny">A 93-minute orbit, Earth’s field 30 µT, and a disturbance with a steady part and a 20 µN·m part that cancels over each orbit. The torquer only pushes momentum down toward zero. Left: stored momentum over 40 orbits, with the wheel’s capacity. Right: hours to fill against the torquer’s dipole.</p>`;
  },
  bind(api) {

    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {

    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return wheelChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      stored(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    stored(B, a, state, c);
    satPlot(B, b, state, c);
  },
  law: () => [String.raw`\frac{dH}{dt} = \tau_\text{dist} - \tau_\text{dump}, \qquad \overline{\tau}_\text{dump} = \tfrac{2}{\pi}mB`, String.raw`t_\text{full} = \frac{H_\text{max}}{\tau_0 - \tfrac{2}{\pi}mB}`],
  liveRows(state, c) {
    return [
      kv('Steady disturbance', `${fig(state.tau0u)} µN·m`),
      kv('Average dump torque', `${fig(c.dump * 1e6)} µN·m`),
      kv('Net gain per orbit', `${fig(Math.max(0, c.perOrbit) * 1000)} mN·m·s`),
      kv('Wheel full after', Number.isFinite(c.tSatH) ? `${fig(c.tSatH)} h, ${fig(c.orbitsToSat)} orbits` : 'never'),
      kv('Closed form against the integrated torques', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['full after', Number.isFinite(c.tSatH) ? `${fig(c.tSatH)} h` : 'never'], ['net', `${fig(c.net * 1e6)} µN·m`], ['dump', `${fig(c.dump * 1e6)} µN·m`], ['capacity', `${fig(state.Hmax)} N·m·s`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Earth’s field is not a fixed 30 µT turning once an orbit: it varies with latitude and orientation, and torquing works on two axes at a time. Wheels also lose speed range to friction and must avoid sitting near zero speed.`;
    if (!Number.isFinite(c.tSatH)) return { title: 'The torquer keeps up', body: `On average the magnetorquer removes ${fig(c.dump * 1e6)} µN·m, more than the ${fig(state.tau0u)} µN·m that comes in: the wheel’s momentum stays near zero, rising and falling within each orbit. ${leavesOut}` };
    return { title: 'Holding still fills the wheel', body: `To hold its attitude the craft passes every disturbance into the wheel: ${fig(c.net * 1e6)} µN·m on balance, so the ${fig(state.Hmax)} N·m·s wheel is full after ${fig(c.tSatH)} hours. Then pointing is lost unless something outside, a torquer or thrusters, takes momentum away. ${leavesOut}` };
  },
  app: false,
});
