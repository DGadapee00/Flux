import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PARTS, amplifier, closedForm } from '@flux/subjects/em/dependent.js';

/**
 * Dependent: an amplifier drawn with a voltage-controlled source, μ times the voltage across the input
 * resistor, with a feedback resistor from the output back to the input.
 *
 * Shows that a dependent source is part of the circuit, not a source to switch off: zero it and the
 * output falls from about −9 V to a few millivolts of the wrong sign, and the output resistance rises
 * tenfold. As the gain μ grows the circuit's gain settles at −R_f/R_s whatever μ is. The node
 * equations are solved by Cramer's rule and again from element stamps by elimination
 * (packages/subjects/src/em/dependent.js).
 */
const SCENARIOS = [
  { id: 'amp', name: 'An inverting amplifier, μ = −100', mu: -100, Rf: 10, RL: 1 },
  { id: 'zeroed', name: 'The same with the dependent source zeroed', mu: 0, Rf: 10, RL: 1 },
  { id: 'stiff', name: 'μ = −200: the gain barely moves', mu: -200, Rf: 10, RL: 1 },
  { id: 'positive', name: 'μ = +5: the output feeds itself', mu: 5, Rf: 10, RL: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mu: sc.mu, Rf: sc.Rf, RL: sc.RL });
}

const KEYS = [['dp-mu', 'mu'], ['dp-rf', 'Rf'], ['dp-rl', 'RL']];
/** State holds R_f and R_L in kΩ; the library takes ohms. */
const params = (s) => ({ mu: s.mu, Rf: 1000 * s.Rf, RL: 1000 * s.RL });
const volts = (x) => `${fig(x)} V`;
const ohms = (x) => (Math.abs(x) >= 1000 ? `${fig(x / 1000)} kΩ` : `${fig(x)} Ω`);

const WIRE = () => alpha(C.text, 0.7);
const N1 = [2, 2];
const N2 = [4, 2];

/** A zigzag resistor on the straight run from p to q, from share t0 to t1 of its length. */
function zigzag(S, p, q, t0, t1, color, n = 8, amp = 0.1) {
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const [ux, uy] = [(q[0] - p[0]) / L, (q[1] - p[1]) / L];
  const at = (t, off = 0) => [p[0] + ux * t - uy * off, p[1] + uy * t + ux * off];
  const z = [at(t0 * L)];
  for (let k = 1; k < n; k++) z.push(at((t0 + ((t1 - t0) * k) / n) * L, k % 2 ? amp : -amp));
  z.push(at(t1 * L));
  line(S, [p, at(t0 * L)], { color: WIRE(), width: 2 });
  line(S, z, { color, width: 2 });
  line(S, [at(t1 * L), q], { color: WIRE(), width: 2 });
}

/** A source on a vertical run from (x, 0) up to (x, 2): a circle or a diamond low down, its resistor above. */
function source(S, x, { diamond, color, rColor }) {
  const r = 0.2;
  const cy = 0.55;
  seg(S, [x, 0], [x, cy - r], { color: WIRE(), width: 2 });
  const pts = [];
  if (diamond) pts.push([x, cy - r], [x + r, cy], [x, cy + r], [x - r, cy], [x, cy - r]);
  else for (let k = 0; k <= 32; k++) pts.push([x + r * Math.cos((2 * Math.PI * k) / 32), cy + r * Math.sin((2 * Math.PI * k) / 32)]);
  line(S, pts, { color, width: 2 });
  label(S, '+', [x, cy + 0.08], { color, bold: true });
  zigzag(S, [x, cy + r], [x, 2], 0.2, 0.85, rColor, 6, 0.09);
}

export default defineLab({
  id: 'dependent',
  exam: 'u1',
  title: 'Dependent',
  hint: 'Set μ to zero, as you would switch off an ordinary source, and watch the output collapse. Then push μ from −50 to −200: the gain hardly moves.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('amp', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'mu', lo: -200, hi: 5 }),
  controls() {
    return `
      ${slider('dp-mu', 'Gain μ of the dependent source', -100, -200, 5, 1)}
      ${slider('dp-rf', 'Feedback R_f (kΩ)', 10, 5, 50, 0.5)}
      ${slider('dp-rl', 'Load R_L (kΩ)', 1, 0.2, 10, 0.1)}
      <p class="tiny">Input ${PARTS.Vs} V through R_s = ${PARTS.Rs / 1000} kΩ. R_in = ${PARTS.Rin / 1000} kΩ, and v_x is the voltage across it. The diamond is the dependent source, μ v_x, with R_o = ${PARTS.Ro} Ω in series. μ stops at +5: a little beyond, the feedback runs away and the linear model has no steady answer.</p>`;
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
    const r = amplifier(params(state));
    return { ...r, inverts: r.gain < 0, error: Math.abs(r.gain - r.ideal) / Math.abs(r.ideal) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    let top = B.free;
    let bottom = null;
    if (wide) {
      top = { ...B.free, x1: B.free.x0 + 0.55 * W };
      bottom = { ...B.free, x0: top.x1 };
    } else if (both) {
      top = { ...B.free, y1: B.free.y0 + 0.52 * H };
      bottom = { ...B.free, y0: top.y1 };
    }
    const S = sceneIn(B, top, { x0: -1.3, x1: 7.4, y0: -0.6, y1: 3.9 }, 14);
    // Wires: ground, the input's top, the feedback loop's ends, the load's top.
    seg(S, [0, 0], [6, 0], { color: WIRE(), width: 2 });
    seg(S, [0, 2], N1, { color: WIRE(), width: 2 });
    seg(S, N2, [6, 2], { color: WIRE(), width: 2 });
    seg(S, N1, [2, 3.2], { color: WIRE(), width: 2 });
    seg(S, [4, 3.2], N2, { color: WIRE(), width: 2 });
    source(S, 0, { diamond: false, color: C.gold, rColor: C.teal });
    zigzag(S, N1, [2, 0], 0.15, 0.85, C.blue);
    zigzag(S, [2, 3.2], [4, 3.2], 0.25, 0.75, C.teal);
    source(S, 4, { diamond: true, color: state.mu === 0 ? alpha(C.muted, 0.8) : C.pink, rColor: C.teal });
    zigzag(S, [6, 2], [6, 0], 0.15, 0.85, C.teal);
    // Labels: the outer elements outside, the inner ones to their right.
    const small = { color: C.muted, align: 'right' };
    label(S, `R_s ${PARTS.Rs / 1000} kΩ`, [-0.3, 1.4], small);
    label(S, `${PARTS.Vs} V`, [-0.3, 0.55], { color: C.gold, align: 'right' });
    label(S, 'R_in', [2.28, 1.15], { color: C.blue, align: 'left' });
    label(S, `${PARTS.Rin / 1000} kΩ`, [2.28, 0.85], { color: C.blue, align: 'left' });
    label(S, '+', [1.72, 1.6], { color: C.blue, bold: true });
    label(S, '−', [1.72, 0.4], { color: C.blue, bold: true });
    label(S, 'v_x', [1.72, 1.0], { color: C.blue, align: 'right' });
    label(S, `R_f ${fig(state.Rf)} kΩ`, [3, 3.2], { color: C.muted, dy: -16 });
    label(S, `R_o ${PARTS.Ro} Ω`, [4.28, 1.4], { color: C.muted, align: 'left' });
    label(S, `${fig(state.mu)} v_x`, [4.3, 0.55], { color: state.mu === 0 ? C.muted : C.pink, align: 'left' });
    label(S, 'R_L', [6.28, 1.15], { color: C.muted, align: 'left' });
    label(S, ohms(1000 * state.RL), [6.28, 0.85], { color: C.muted, align: 'left' });
    // Node voltages, and the feedback current along R_f.
    for (const [P, v, dx, align] of [[N1, c.v1, -6, 'right'], [N2, c.v2, 6, 'left']]) {
      dot(S, P[0], P[1], { color: C.text, r: 4 });
      label(S, volts(v), P, { color: C.text, dx, dy: -12, align });
    }
    const iF = (c.v2 - c.v1) / (1000 * state.Rf);
    if (Math.abs(iF) > 1e-12) arrow(S, [3, 2.92], iF > 0 ? Math.PI : 0, 22, { color: C.gold, width: 2, head: 7 });
    dot(S, 0, 0, { color: C.blue, r: 4 });
    label(S, '0 V', [3, 0], { color: C.blue, dy: 14 });
    if (!bottom) return;
    // The circuit's gain against μ, with R_f and R_L as set.
    const p = params(state);
    const curve = [];
    for (let k = 0; k <= 205; k++) {
      const mu = -200 + k;
      curve.push([mu, closedForm({ ...p, mu }).v2 / PARTS.Vs]);
    }
    const ys = curve.map((q) => q[1]).concat(c.ideal);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys, 1);
    const span = hi - lo;
    const P = plotIn(B, bottom, { lo: -200, hi: 5 }, { lo: lo - 0.08 * span, hi: hi + 0.12 * span });
    axes(P, { xLabel: 'μ', yLabel: 'gain v_out / v_in' });
    seg(P, [-200, 0], [5, 0], { color: alpha(C.text, 0.35), width: 1 });
    seg(P, [-200, c.ideal], [5, c.ideal], { color: alpha(C.green, 0.8), width: 1.5, dash: [6, 4] });
    label(P, `−R_f/R_s = ${fig(c.ideal)}`, [-200, c.ideal], { color: C.green, align: 'left', dy: 12, dx: 4 });
    line(P, curve, { color: C.gold, width: 2.5 });
    dot(P, 0, c.gain0, { color: C.muted, r: 5 });
    label(P, 'zeroed', [0, c.gain0], { color: C.muted, align: 'right', dx: -8, dy: -10 });
    dot(P, state.mu, c.gain, { color: C.pink, r: 6, ring: C.text });
    label(P, fig(c.gain), [state.mu, c.gain], { color: C.pink, align: state.mu > -40 ? 'right' : 'left', dx: state.mu > -40 ? -10 : 10, dy: 12 });
  },
  law: () => [String.raw`v_1\!\left(\tfrac{1}{R_s} + \tfrac{1}{R_{in}} + \tfrac{1}{R_f}\right) - \tfrac{v_2}{R_f} = \tfrac{V_s}{R_s}`, String.raw`-v_1\!\left(\tfrac{1}{R_f} + \tfrac{\mu}{R_o}\right) + v_2\!\left(\tfrac{1}{R_o} + \tfrac{1}{R_L} + \tfrac{1}{R_f}\right) = 0`],
  liveRows(state, c) {
    return [
      kv('v_x, and the dependent source μ v_x', `${volts(c.vx)}, ${volts(c.dep)}`),
      kv('Output v₂, and the gain', `${volts(c.v2)}, ${fig(c.gain)}`),
      kv('Gain with the dependent source zeroed', fig(c.gain0)),
      kv('−R_f/R_s, the limit as μ grows', fig(c.ideal)),
      kv('Output resistance, source kept', ohms(c.Rout)),
      kv('Output resistance, source zeroed', ohms(c.Rout0)),
      kv('Matrix G (siemens)', `[${c.G.map((r) => r.map((v) => v.toExponential(2)).join(', ')).join('; ')}]`),
      kv('Cramer’s rule against stamps', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['output', volts(c.v2)],
      ['gain', fig(c.gain)],
      ['zeroed', fig(c.gain0)],
      ['R out', ohms(c.Rout)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real amplifier's gain falls with frequency, and its output stops at the supply rails. The dependent source stands in for a transistor or an op amp only while the signal is small.`;
    if (state.mu === 0) {
      return { title: 'Zeroed, it is a different circuit', body: `With μ = 0 the diamond is a plain ${PARTS.Ro} Ω to ground, and the output is what leaks through R_f: a gain of ${fig(c.gain0)}, against ${fig(amplifier({ ...params(state), mu: -100 }).gain)} at μ = −100. In superposition and when finding a Thévenin resistance, a dependent source stays in. ${leavesOut}` };
    }
    if (state.mu > 0) {
      return { title: 'Feedback that adds', body: `With μ positive the output pushes current back through R_f that raises v_x, which raises the output again: a gain of ${fig(c.gain)}. Past μ ≈ ${fig(c.critical)} the two equations have no steady answer. Read v_x the wrong way round and a negative μ becomes this. ${leavesOut}` };
    }
    return { title: 'Feedback sets the gain', body: `The dependent source amplifies v_x by ${fig(-state.mu)}, yet the circuit's gain is ${fig(c.gain)}, near −R_f/R_s = ${fig(c.ideal)}. The output pulls v_x down to ${volts(c.vx)} through R_f, so a bigger μ changes little. Zero it and the gain falls to ${fig(c.gain0)}; the output resistance rises from ${ohms(c.Rout)} to ${ohms(c.Rout0)}. ${leavesOut}` };
  },
  app: false,
});
