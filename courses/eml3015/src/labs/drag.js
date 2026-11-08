import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BALLS, cd, dragChecked, force } from '@flux/subjects/mechanics/spheredrag.js';

/**
* Drag: a ball through still air, with a slider for its speed and a choice of ball and surface, the
 * drag coefficient against Reynolds number and the force against speed drawn.
 *
 * Shows that drag does not always rise with speed: a smooth football's force falls from 2.0 N at
 * 15 m/s to 1.5 N at 25 m/s as it passes its drag crisis, when the boundary layer turns turbulent
 * and the wake narrows. Dimples bring the crisis to a golf ball's speeds: at 40 m/s a dimpled ball has
 * 0.33 N of drag, a smooth one 0.59 N. Checked by finding how far the ball coasts before its speed
 * halves, marching in time and integrating over speed (packages/subjects/src/mechanics/spheredrag.js).
 */
const SCENARIOS = [
  { id: 'football', name: 'A smooth football at 15 m/s', ball: 'football', surface: 'smooth', V: 15 },
  { id: 'crisis', name: 'The same at 25 m/s', ball: 'football', surface: 'smooth', V: 25 },
  { id: 'golf', name: 'A dimpled golf ball at 40 m/s', ball: 'golf', surface: 'dimpled', V: 40 },
  { id: 'smoothgolf', name: 'A smooth golf ball at 40 m/s', ball: 'golf', surface: 'smooth', V: 40 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, ball: sc.ball, surface: sc.surface, V: sc.V });
}

const KEYS = [['dg-v', 'V']];

function cdPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 1e3, hi: 1e6, log: true }, { lo: 0.03, hi: 1, log: true });
  axes(P, { xLabel: 'Reynolds number VD/ν', yLabel: 'drag coefficient C_D' });
  const res = Array.from({ length: 151 }, (_, i) => 1e3 * 1e3 ** (i / 150));
  line(P, res.map((r) => [r, cd(r, 'smooth')]), { color: C.blue, width: state.surface === 'smooth' ? 2.5 : 1.5 });
  line(P, res.map((r) => [r, cd(r, 'dimpled')]), { color: C.gold, width: state.surface === 'dimpled' ? 2.5 : 1.5, dash: [6, 4] });
  label(P, 'smooth', [3e3, cd(3e3, 'smooth')], { color: C.blue, align: 'left', dy: 16 });
  label(P, 'rough', [3e3, cd(3e3, 'dimpled')], { color: C.gold, align: 'left', dy: -12 });
  dot(P, c.Re, c.cd, { color: C.pink, r: 6, ring: C.text });
}

function fPlot(B, rect, state, c) {
  const vs = Array.from({ length: 157 }, (_, i) => 2 + i / 2);
  const fs = vs.map((v) => [force(v, 'smooth', state.ball), force(v, 'dimpled', state.ball)]);
  const hi = Math.max(...fs.flat()) * 1.1;
  const P = plotIn(B, rect, { lo: 0, hi: 80 }, { lo: 0, hi });
  axes(P, { xLabel: 'speed (m/s)', yLabel: 'drag force (N)' });
  line(P, vs.map((v, i) => [v, fs[i][0]]), { color: C.blue, width: 2.5 });
  line(P, vs.map((v, i) => [v, fs[i][1]]), { color: C.gold, width: 2.5, dash: [6, 4] });
  dot(P, state.V, c.F, { color: C.pink, r: 6, ring: C.text });
  label(P, `${fig(c.F)} N`, [state.V, c.F], { color: C.text, align: 'right', dx: -10, dy: -8 });
}

export default defineLab({
  id: 'drag',
  exam: 'u3',
  title: 'Drag',
  hint: 'Speed the smooth football from 15 to 25 m/s and read the force. Then compare smooth and dimpled golf balls.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('football', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V', lo: 2, hi: 80 }),
  controls() {
    return `
      <label class="field"><span>Ball</span><select id="dg-b">${Object.entries(BALLS).map(([id, b]) => [id, b.name]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      <label class="field"><span>Surface</span><select id="dg-s">${[['smooth', 'Smooth'], ['dimpled', 'Dimpled or rough']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('dg-v', "Speed (m/s)", 15, 2, 80, 0.5)}
      <p class="tiny">Air at 1.2 kg/m³ and ν = 1.5 × 10⁻⁵ m²/s. Smooth spheres follow a fitted curve through the drag crisis; the rough curve moves the crisis to Re = 6 × 10⁴. Left: C_D against Reynolds number. Right: the drag force against speed for this ball, smooth and rough.</p>`;
  },
  bind(api) {
    document.getElementById('dg-b')?.addEventListener('change', (e) => {
      api.slice().ball = e.target.value;
      api.bump();
    });
    document.getElementById('dg-s')?.addEventListener('change', (e) => {
      api.slice().surface = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('dg-b');
      if (el) el.value = String(state.ball);
    }
    {
      const el = document.getElementById('dg-s');
      if (el) el.value = String(state.surface);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return dragChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      fPlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    cdPlot(B, a, state, c);
    fPlot(B, b, state, c);
  },
  law: () => [String.raw`F_D = \tfrac12\,C_D\,\rho V^2 A, \qquad F_L = \tfrac12\,C_L\,\rho V^2 A`, String.raw`C_D = f(\text{Re}), \qquad \text{Re} = \frac{VD}{\nu}`],
  liveRows(state, c) {
    return [
      kv('Reynolds number', c.Re.toExponential(2)),
      kv('C_D', fig(c.cd)),
      kv('Drag force', `${fig(c.F)} N`),
      kv('Coasts until half speed', `${fig(c.coast)} m`),
      kv('Time march against speed integral', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['drag', `${fig(c.F)} N`], ['C_D', fig(c.cd)], ['Re', c.Re.toExponential(1)], ['coast', `${fig(c.coast)} m`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A spinning ball also feels lift (the Magnus effect), which a golf ball uses to stay up; the crisis depends on the air’s turbulence and the ball’s seams as well as its roughness.`;
    if (c.cd < 0.3) return { title: 'Past the crisis: a narrow wake', body: `At Re = ${c.Re.toExponential(1)} the boundary layer is turbulent, clings to the back of the ball longer and leaves a narrow wake: C_D = ${fig(c.cd)}. The ball coasts ${fig(c.coast)} m before its speed halves. ${leavesOut}` };
    return { title: 'Before the crisis: a wide wake', body: `The boundary layer is still laminar and separates near the ball’s widest point, leaving a wide wake: C_D = ${fig(c.cd)}, force ${fig(c.F)} N. Faster, or rougher, it can cross the crisis and lose drag. ${leavesOut}` };
  },
  app: false,
});
