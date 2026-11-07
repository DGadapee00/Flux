import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { switchChecked } from '@flux/subjects/em/firstorder.js';

/**
 * Switch: a 12 V source switched into a circuit of three resistors and a capacitor or an inductor at
 * t = 0, and out again at 40 ms.
 *
 * Shows that the time constant uses the Thévenin resistance the element sees, not the source's
 * resistor, and that it changes when the switch moves: with the switch closed the capacitor sees
 * R₃ + R₁ ∥ R₂, with it open R₃ + R₂. The capacitor's voltage and the inductor's current carry over
 * the switching instant; the capacitor's current and the inductor's voltage jump. The closed form uses
 * the Thévenin equivalents; the second method integrates the circuit's own node equation by RK4
 * (packages/subjects/src/em/firstorder.js).
 */
const BASE = { Vs: 12, R3: 200, C: 10e-6, L: 10, t1: 0.04, T: 0.1 };
const SCENARIOS = [
  { id: 'rc', name: 'A capacitor, R₁ = 1 kΩ, R₂ = 2 kΩ', kind: 'C', R1: 1000, R2: 2000 },
  { id: 'rcbig', name: 'The same with R₁ = 4 kΩ', kind: 'C', R1: 4000, R2: 2000 },
  { id: 'rl', name: 'An inductor, R₁ = 1 kΩ, R₂ = 2 kΩ', kind: 'L', R1: 1000, R2: 2000 },
  { id: 'rlspike', name: 'An inductor with R₂ = 5 kΩ: a spike', kind: 'L', R1: 1000, R2: 5000 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, kind: sc.kind, R1: sc.R1, R2: sc.R2 });
}

const KEYS = [['sw-r1', 'R1'], ['sw-r2', 'R2']];
const ms = (t) => `${fig(t * 1e3)} ms`;
const ohms = (r) => (r >= 1000 ? `${fig(r / 1000)} kΩ` : `${fig(r)} Ω`);
const params = (s) => ({ ...BASE, kind: s.kind, R1: s.R1, R2: s.R2 });

/** Shade the stretch with the switch closed and mark where it opens. */
function shade(P, hi, lo = 0) {
  poly(P, [[0, lo], [BASE.t1 * 1e3, lo], [BASE.t1 * 1e3, hi], [0, hi]], { fill: alpha(C.green, 0.07), stroke: null });
  seg(P, [BASE.t1 * 1e3, lo], [BASE.t1 * 1e3, hi], { color: alpha(C.muted, 0.6), width: 1, dash: [3, 3] });
}

/** The state that cannot jump: v_C or i_L, with each stretch's τ marked by its tangent. */
function statePlot(B, rect, state, c) {
  const isC = state.kind === 'C';
  const scale = isC ? 1 : 1000; // V, or mA
  const hi = Math.max(...c.closed) * scale * 1.25 || 1;
  const P = plotIn(B, rect, { lo: 0, hi: BASE.T * 1e3 }, { lo: 0, hi });
  axes(P, { xLabel: 'time (ms)', yLabel: isC ? 'capacitor voltage (V)' : 'inductor current (mA)' });
  shade(P, hi);
  label(P, 'switch closed', [BASE.t1 * 500, hi], { color: C.green, dy: 10 });
  label(P, 'open', [(BASE.t1 + BASE.T) * 500, hi], { color: C.muted, dy: 10 });
  line(P, c.ts.map((t, i) => [t * 1e3, c.closed[i] * scale]), { color: C.gold, width: 2.5 });
  // Tangents: from the start of each stretch, reaching the final value one τ later.
  const f = c.final * scale;
  seg(P, [0, 0], [c.tauOn * 1e3, f], { color: alpha(C.teal, 0.9), width: 1.3, dash: [5, 4] });
  seg(P, [0, f], [BASE.t1 * 1e3, f], { color: alpha(C.teal, 0.4), width: 1, dash: [2, 3] });
  label(P, `τ = ${ms(c.tauOn)}`, [BASE.t1 * 500, hi], { color: C.teal, dy: 28 });
  const a = c.atT1 * scale;
  seg(P, [BASE.t1 * 1e3, a], [(BASE.t1 + c.tauOff) * 1e3, 0], { color: alpha(C.pink, 0.9), width: 1.3, dash: [5, 4] });
  // Under the 'open' heading, clear of a fast decay.
  label(P, `τ = ${ms(c.tauOff)}`, [(BASE.t1 + BASE.T) * 500, hi], { color: C.pink, dy: 28 });
}

/** The quantity that can jump: i_C or v_L. */
function jumpPlot(B, rect, state, c) {
  const isC = state.kind === 'C';
  const p = params(state);
  // From the Thévenin form in each stretch: i_C = (V_th − v_C)/R_th, v_L = V_th − R_th i_L.
  const val = (t, x) => {
    const th = t <= p.t1 ? c.on : c.off;
    return isC ? ((th.Vth - x) / th.Rth) * 1000 : th.Vth - th.Rth * x;
  };
  const pts = c.ts.map((t, i) => [t * 1e3, val(t, c.closed[i])]);
  // Draw the jump at t₁ upright.
  const k = c.ts.findIndex((t) => t > p.t1);
  const before = [p.t1 * 1e3, val(p.t1, c.atT1)];
  const after = [p.t1 * 1e3, (isC ? -c.atT1 / c.off.Rth * 1000 : -c.off.Rth * c.atT1)];
  const ys = pts.map((q) => q[1]).concat(before[1], after[1]);
  const lo = Math.min(0, ...ys) * 1.15;
  const hi = Math.max(0, ...ys) * 1.2 || 1;
  const P = plotIn(B, rect, { lo: 0, hi: BASE.T * 1e3 }, { lo, hi });
  axes(P, { xLabel: 'time (ms)', yLabel: isC ? 'capacitor current (mA)' : 'inductor voltage (V)' });
  shade(P, hi, lo);
  seg(P, [0, 0], [BASE.T * 1e3, 0], { color: alpha(C.text, 0.3), width: 1 });
  line(P, [...pts.slice(0, k), before, after, ...pts.slice(k)], { color: isC ? C.blue : C.red, width: 2.5 });
  label(P, isC ? `jumps to ${fig(after[1])} mA` : `jumps to ${fig(after[1])} V`, after, { color: isC ? C.blue : C.red, align: 'left', dx: 8, dy: after[1] < 0 ? 4 : -10 });
}

export default defineLab({
  id: 'switch',
  exam: 'u4',
  title: 'Switch',
  hint: 'Read the two time constants: one while the switch is closed, another once it opens. Raise R₁ and only the first changes. Then swap in the inductor and watch its voltage jump.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rc', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'R2', lo: 100, hi: 5000 }),
  controls() {
    return `
      <label class="field"><span>Element</span><select id="sw-k"><option value="C">Capacitor, 10 µF</option><option value="L">Inductor, 10 H</option></select></label>
      ${slider('sw-r1', 'Source resistor R₁ (Ω)', 1000, 100, 5000, 50)}
      ${slider('sw-r2', 'Shunt R₂ (Ω)', 2000, 100, 5000, 50)}
      <p class="tiny">12 V in series with R₁ feeds node A through a switch. R₂ runs from A to ground, and the element hangs from A to ground behind its own R₃ = 200 Ω. The switch closes at t = 0 with the element empty and opens at 40 ms. Green: switch closed. Dashed lines: tangents that reach the final value one τ later.</p>`;
  },
  bind(api) {
    document.getElementById('sw-k')?.addEventListener('change', (e) => {
      api.slice().kind = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('sw-k');
    if (el) el.value = state.kind;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return switchChecked(params(state));
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      statePlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.5 * W } : { ...B.free, y1: B.free.y0 + 0.5 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    statePlot(B, a, state, c);
    jumpPlot(B, b, state, c);
  },
  law: () => [String.raw`x(t) = x(\infty) + \big[x(0^+) - x(\infty)\big]e^{-t/\tau}`, String.raw`\tau = R_\text{th}C \ \text{ or } \ L/R_\text{th}`, String.raw`\text{closed: } R_\text{th} = R_3 + R_1 \parallel R_2`, String.raw`\text{open: } R_\text{th} = R_3 + R_2`],
  liveRows(state, c) {
    const isC = state.kind === 'C';
    return [
      kv('R_th closed, open', `${ohms(c.on.Rth)}, ${ohms(c.off.Rth)}`),
      kv('τ closed, open', `${ms(c.tauOn)}, ${ms(c.tauOff)}`),
      kv('τ with R₁ alone, the mistake', ms(c.tauR1)),
      kv(isC ? 'Final voltage while closed' : 'Final current while closed', isC ? `${fig(c.final)} V` : `${fig(c.final * 1000)} mA`),
      kv(isC ? 'Voltage when it opens' : 'Current when it opens', isC ? `${fig(c.atT1)} V` : `${fig(c.atT1 * 1000)} mA`),
      kv(isC ? 'Capacitor voltage just after' : 'Inductor voltage just after', `${fig(c.vOpen)} V`),
      kv('Thévenin form against RK4', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['τ closed', ms(c.tauOn)],
      ['τ open', ms(c.tauOff)],
      ['τ from R₁', ms(c.tauR1)],
      [state.kind === 'C' ? 'v_C at 40 ms' : 'v_L at opening', state.kind === 'C' ? `${fig(c.atT1)} V` : `${fig(c.vOpen)} V`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real switch arcs when it breaks an inductor’s current, and a real coil has its own resistance and capacitance. That is why relay coils carry a diode across them: it gives the current a path when the switch opens.`;
    if (state.kind === 'L') {
      return { title: 'The current carries over; the voltage jumps', body: `While closed the inductor sees ${ohms(c.on.Rth)}, so τ = L/R_th = ${ms(c.tauOn)}. When the switch opens it still carries ${fig(c.atT1 * 1000)} mA, which must now flow through R₂ + R₃ = ${ohms(c.off.Rth)}: its voltage jumps to ${fig(c.vOpen)} V, and τ becomes ${ms(c.tauOff)}. ${leavesOut}` };
    }
    return { title: 'τ uses what the capacitor sees', body: `With the switch closed, the capacitor sees R₃ + R₁ ∥ R₂ = ${ohms(c.on.Rth)}, so τ = ${ms(c.tauOn)}, not the ${ms(c.tauR1)} that R₁ alone would give. Once the switch opens, R₁ is gone from its view: it discharges through R₃ + R₂ = ${ohms(c.off.Rth)}, with τ = ${ms(c.tauOff)}. Its voltage carries over the switching; its current jumps. ${leavesOut}` };
  },
  app: false,
});
