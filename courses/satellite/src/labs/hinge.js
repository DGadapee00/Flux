import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { TM_FACTORS, hingeChecked } from '@flux/subjects/mechanics/hinge.js';

/**
 * Spring hinge: a torsion spring deploying a solar panel, its torque margin by NASA-STD-5017B and the
 * blow it lands on the latch.
 *
 * Shows that torque margin is about what you do not know. The spring is weakest at the end of travel,
 * so the margin is set there, with the resisting torques multiplied by a factor that falls as the
 * evidence improves: three times on analysis, twice after acceptance testing. A spring that deploys
 * the panel easily can still fail the margin. More spring buys margin and costs a harder latch: the
 * kinetic energy grows with it. The closed-form deployment is checked by RK4
 * (packages/subjects/src/mechanics/hinge.js).
 *
 * The torque margin equation and its factors are NASA-STD-5017B's (Equation 4-1, Table 1). The
 * spring, friction, harness and panel figures are our own round figures for a CubeSat panel.
 */
const D = Math.PI / 180;
const SCENARIOS = [
  { id: 'panel', name: 'A CubeSat panel, margin by analysis', k: 10, preload: 90, thetaD: 90, friction: 2, harness: 1, I: 4, source: 'analysis' },
  { id: 'weak', name: 'The same with 30° of preload', k: 10, preload: 30, thetaD: 90, friction: 2, harness: 1, I: 4, source: 'analysis' },
  { id: 'tested', name: 'The panel after acceptance testing', k: 10, preload: 90, thetaD: 90, friction: 2, harness: 1, I: 4, source: 'accept' },
  { id: 'stiff', name: 'A spring twice as stiff', k: 20, preload: 90, thetaD: 90, friction: 2, harness: 1, I: 4, source: 'analysis' },
];
const FIELDS = ['k', 'preload', 'thetaD', 'friction', 'harness', 'I', 'source'];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  for (const f of FIELDS) state[f] = sc[f];
}

const SLIDERS = [['hg-k', 'k'], ['hg-p', 'preload'], ['hg-d', 'thetaD'], ['hg-f', 'friction'], ['hg-h', 'harness'], ['hg-i', 'I']];

/** Lab units to SI: mN·m to N·m, g·m² to kg·m², degrees to radians. */
function params(s) {
  return { k: s.k / 1000, I: s.I / 1000, theta0: (s.thetaD + s.preload) * D, thetaD: s.thetaD * D, friction: s.friction / 1000, harness: s.harness / 1000, source: s.source };
}

export default defineLab({
  id: 'hinge',
  exam: 'u16',
  title: 'Spring hinge',
  hint: 'Cut the preload to 30° and watch the panel still deploy while its torque margin goes negative. Then double the spring: the margin returns, and the latch takes twice the blow.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('panel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'preload', lo: 10, hi: 270 }),
  controls() {
    const opt = Object.entries(TM_FACTORS).map(([k, f]) => `<option value="${k}">${f.name}, ×${fig(f.v)}</option>`).join('');
    return `
      <label class="field"><span>Where the resisting torques come from</span><select id="hg-s">${opt}</select></label>
      ${slider('hg-k', 'Spring stiffness (mN·m per radian)', 10, 2, 40, 1)}
      ${slider('hg-p', 'Preload past deployed (°)', 90, 0, 270, 5)}
      ${slider('hg-d', 'Deployment angle (°)', 90, 30, 180, 5)}
      ${slider('hg-f', 'Hinge friction (mN·m)', 2, 0, 8, 0.1)}
      ${slider('hg-h', 'Harness torque (mN·m)', 1, 0, 8, 0.1)}
      ${slider('hg-i', 'Panel inertia about the hinge (g·m²)', 4, 1, 20, 0.5)}
      <p class="tiny">Friction and harness are variable torques; the factor on them follows NASA-STD-5017B's Table 1. No fixed torques and no required acceleration.</p>`;
  },
  bind(api) {
    document.getElementById('hg-s')?.addEventListener('change', (e) => {
      api.slice().source = e.target.value;
      api.bump();
    });
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['hg-s', 'source'], ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = hingeChecked(params(state));
    return {
      ...c,
      margin: c.tm,
      meets: c.tm >= 0,
      seconds: c.t,
      latchDegS: c.omega === null ? null : c.omega / D,
      energyMJ: c.energy === null ? null : c.energy * 1000,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.5) : [B.free, null];
    // Torque against angle: the spring, and the resisting torque with and without its factor.
    const th0 = state.thetaD + state.preload;
    const tHi = Math.max((state.k * th0 * D) * 1.1, c.fs.v * (state.friction + state.harness) * 1.2, 1);
    const P = plotIn(B, top, { lo: 0, hi: state.thetaD }, { lo: 0, hi: tHi });
    axes(P, { xLabel: 'angle (°)', yLabel: 'torque (mN·m)' });
    line(P, [[0, state.k * th0 * D], [state.thetaD, state.k * state.preload * D]], { color: C.gold, width: 2.5 });
    const req = c.fs.v * (state.friction + state.harness);
    seg(P, [0, req], [state.thetaD, req], { color: c.meets ? C.green : C.red, width: 2, dash: [6, 4] });
    seg(P, [0, state.friction + state.harness], [state.thetaD, state.friction + state.harness], { color: alpha(C.muted, 0.9), width: 1.5 });
    dot(P, state.thetaD, state.k * state.preload * D, { color: C.gold, r: 5 });
    label(P, 'spring', [0, state.k * th0 * D], { color: C.gold, align: 'left', dx: 6, dy: -10 });
    label(P, `resisting ×${fig(c.fs.v)}`, [state.thetaD, req], { color: c.meets ? C.green : C.red, align: 'right', dy: -10 });
    label(P, 'resisting', [state.thetaD, state.friction + state.harness], { color: C.muted, align: 'right', dy: 12 });
    if (!bottom) return;
    // The deployment: angle against time.
    const tEnd = (c.seconds ?? (c.path.length ? c.path[c.path.length - 1][0] : 1)) * 1.1;
    const Q = plotIn(B, bottom, { lo: 0, hi: Math.max(tEnd, 0.01) }, { lo: 0, hi: state.thetaD * 1.1 }, { left: 52, right: 16, top: 14, bottom: 40 });
    axes(Q, { xLabel: 'seconds', yLabel: 'angle (°)' });
    seg(Q, [0, state.thetaD], [tEnd, state.thetaD], { color: alpha(C.muted, 0.8), width: 1, dash: [5, 4] });
    line(Q, c.path.map(([t, th]) => [t, th / D]), { color: C.teal, width: 2.5 });
    if (c.reaches) label(Q, `latched in ${fig(c.seconds)} s at ${fig(c.latchDegS)}°/s`, [c.seconds, state.thetaD], { color: C.teal, align: 'right', dx: -6, dy: 14 });
  },
  law: () => [
    String.raw`\text{TM} = \frac{T_\text{avail}}{FS_v \sum T_v} - 1, \quad T_\text{avail} = k(\theta_0 - \theta_d)`,
    String.raw`\theta(t) = \theta_c (1 - \cos\omega_n t), \quad \theta_c = \theta_0 - \frac{T_r}{k}`,
  ],
  liveRows(state, c) {
    const fs = TM_FACTORS[state.source];
    return [
      kv('Spring at the end of travel', `${fig(c.avail * 1000)} mN·m`),
      kv('Resisting torque', `${fig(c.resist * 1000)} mN·m`),
      kv('Factor on variable torques', `${fig(fs.v)}`),
      kv('Torque margin', fig(c.tm)),
      kv('Time to latch, closed and RK4', c.reaches ? `${fig(c.t)}, ${fig(c.stepT)} s` : 'does not reach'),
      kv('Speed at the latch, closed and RK4', c.reaches ? `${fig(c.latchDegS)}, ${fig(c.stepOmega / D)} °/s` : '—'),
      kv('Energy into the latch', c.reaches ? `${fig(c.energyMJ)} mJ` : '—'),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['torque margin', fig(c.tm)],
      ['latches in', c.reaches ? `${fig(c.seconds)} s` : 'never'],
      ['latch energy', c.reaches ? `${fig(c.energyMJ)} mJ` : '—'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Friction that rises in the cold and after long storage in vacuum; a harness that stiffens; the latch's own rebound; gravity in ground tests, which offload rigs must cancel; and a craft that turns as the panel swings.`;
    if (!c.reaches) return { title: 'It stops short', body: `Friction and harness take ${fig(c.resist * 1000)} mN·m, and the spring runs out before ${fig(state.thetaD)}°. Add preload or stiffness. ${leavesOut}` };
    if (!c.meets) return { title: 'It deploys, but the margin fails', body: `The panel latches in ${fig(c.seconds)} s, yet at the end of travel the spring gives only ${fig(c.avail * 1000)} mN·m against ${fig(c.fs.v)} × ${fig(c.resist * 1000)} mN·m: a margin of ${fig(c.tm)}. The factor covers what has not been measured: friction in the cold, a stiffened harness. Add preload, or test to earn a smaller factor. ${leavesOut}` };
    return { title: `Margin ${fig(c.tm)}`, body: `The spring gives ${fig(c.avail * 1000)} mN·m at the end of travel against ${fig(c.resist * 1000)} mN·m of resistance, more than the factor of ${fig(c.fs.v)} needs. The panel latches in ${fig(c.seconds)} s at ${fig(c.latchDegS)}°/s, and the latch takes ${fig(c.energyMJ)} mJ. More spring would add margin and a harder blow. ${leavesOut}` };
  },
  app: false,
});
