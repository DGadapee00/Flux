import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FIXED } from '@flux/subjects/em/superposition.js';
import { closedForm, theveninChecked } from '@flux/subjects/em/thevenin.js';

/**
 * Thévenin: the Superpose lab's two-source network seen from its load, swept from a short to an open.
 *
 * Shows that the whole network acts at its terminals like one source and one resistor, a straight
 * line of voltage against current, and that maximum power transfer is not efficient: at R_L = R_th
 * the load takes the most power, but in the equivalent circuit as much again heats R_th, and the real
 * network wastes more. The closed form switches the sources off for R_th and shorts the terminals for
 * I_N; the second method is a bench test, two loads on the full network and the line through them
 * (packages/subjects/src/em/thevenin.js).
 */
const RTH = closedForm({ V1: 12, V2: 6 }).Rth;
const SCENARIOS = [
  { id: 'match', name: 'The load matched: R_L = R_th', V1: 12, V2: 6, RL: RTH },
  { id: 'heavy', name: 'A heavy load, 0.3 Ω', V1: 12, V2: 6, RL: 0.3 },
  { id: 'light', name: 'A light load, 20 Ω', V1: 12, V2: 6, RL: 20 },
  { id: 'one', name: 'V₂ off, the load matched', V1: 12, V2: 0, RL: RTH },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V1: sc.V1, V2: sc.V2, lRL: Math.log10(sc.RL) });
}

const KEYS = [['th-v1', 'V1'], ['th-v2', 'V2'], ['th-rl', 'lRL']];
const params = (s) => ({ V1: s.V1, V2: s.V2, RL: 10 ** s.lRL });
const volts = (x) => `${fig(x)} V`;
const amps = (x) => `${fig(x)} A`;
const watts = (x) => `${fig(x)} W`;
const ohms = (x) => `${fig(x)} Ω`;
const pct = (x) => `${fig(100 * x)}%`;

/** The network's line, V against I, with the load line and where they cross. */
function characteristic(B, rect, c) {
  const Ihi = Math.max(1.3 * c.IN, 0.1);
  const Vhi = Math.max(1.15 * c.Vth, 0.5);
  const P = plotIn(B, rect, { lo: 0, hi: Ihi }, { lo: 0, hi: Vhi });
  axes(P, { xLabel: 'load current I (A)', yLabel: 'terminal voltage V (V)' });
  line(P, [[0, c.Vth], [c.IN, 0]], { color: C.teal, width: 2.5 });
  // The load's own line, V = I R_L, from the origin to the plot's edge.
  const RL = c.RL;
  const end = Vhi / RL < Ihi ? [Vhi / RL, Vhi] : [Ihi, Ihi * RL];
  line(P, [[0, 0], end], { color: alpha(C.pink, 0.8), width: 1.5, dash: [5, 4] });
  dot(P, 0, c.Vth, { color: C.teal, r: 4 });
  dot(P, c.IN, 0, { color: C.teal, r: 4 });
  label(P, `V_th = ${volts(c.Vth)}`, [0, c.Vth], { color: C.teal, align: 'left', dx: 8, dy: -10 });
  label(P, `I_N = ${amps(c.IN)}`, [c.IN, 0], { color: C.teal, align: 'left', dx: 8, dy: -12 });
  dot(P, c.I, c.V, { color: C.gold, r: 6, ring: C.text });
  // The operating point's values in the top-right corner, clear of both lines.
  label(P, `load: ${volts(c.V)}, ${amps(c.I)}`, [Ihi, Vhi], { color: C.gold, align: 'right', dy: 12 });
}

/** The load's power against R_L, beside what heats R_th in the equivalent. */
function power(B, rect, state, c) {
  const pts = [];
  const lost = [];
  for (let k = 0; k <= 200; k++) {
    const lr = -1 + (3 * k) / 200;
    const RL = 10 ** lr;
    const I = c.Vth / (c.Rth + RL);
    pts.push([RL, I * I * RL]);
    lost.push([RL, I * I * c.Rth]);
  }
  const hi = Math.max(1.25 * c.Pmax, 1.05 * Math.min(lost[0][1], 2.2 * c.Pmax), 0.1);
  const P = plotIn(B, rect, { lo: 0.1, hi: 100, log: true }, { lo: 0, hi });
  axes(P, { xLabel: 'load R_L (Ω)', yLabel: 'power (W)', xFmt: (v) => (Math.abs(Math.log10(v) - Math.round(Math.log10(v))) < 1e-9 ? fig(v) : '') });
  seg(P, [c.Rth, 0], [c.Rth, hi], { color: alpha(C.muted, 0.7), width: 1, dash: [3, 3] });
  label(P, 'R_L = R_th', [c.Rth, hi], { color: C.muted, align: 'left', dx: 4, dy: 10 });
  line(P, lost.filter(([, p]) => p <= hi), { color: C.red, width: 2, dash: [6, 4] });
  line(P, pts, { color: C.gold, width: 2.5 });
  label(P, 'load', [30, pts[pts.length - 34][1]], { color: C.gold, dy: -10 });
  label(P, 'heats R_th', [0.18, Math.min(lost[13][1], hi)], { color: C.red, align: 'left', dy: lost[13][1] > 0.9 * hi ? 12 : -10 });
  dot(P, c.RL, c.P, { color: C.gold, r: 6, ring: C.text });
  dot(P, c.RL, c.Pin, { color: C.red, r: 4 });
}

export default defineLab({
  id: 'thevenin',
  exam: 'u3',
  title: 'Thévenin',
  hint: 'Slide the load from a short to an open: the terminal point runs down one straight line. At R_L = R_th the load’s power peaks, but as much again heats R_th.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('match', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lRL', lo: -1, hi: 2 }),
  controls() {
    return `
      ${slider('th-v1', 'Source V₁ (volts)', 12, 1, 24, 0.5)}
      ${slider('th-v2', 'Source V₂ (volts)', 6, 0, 24, 0.5)}
      ${slider('th-rl', 'Load, log₁₀ R_L (Ω)', Math.log10(RTH), -1, 2, 0.01)}
      <p class="tiny">The Superpose lab’s network: R₁ = ${FIXED.R1} Ω, R₄ = ${FIXED.R4} Ω, R₃ = ${FIXED.R3} Ω, R₂ = ${FIXED.R2} Ω, with the load where R_L was. R_L runs from 0.1 Ω to 100 Ω. Teal: the network’s line. Pink dashes: the load’s line, V = I R_L. Red dashes: the power that heats R_th in the equivalent.</p>`;
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
    const p = params(state);
    const r = theveninChecked(p);
    return { ...r, RL: p.RL, share: r.P / r.Pmax };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      power(B, B.free, state, c);
      return;
    }
    const top = wide ? { ...B.free, x1: B.free.x0 + 0.5 * W } : { ...B.free, y1: B.free.y0 + 0.5 * H };
    const bottom = wide ? { ...B.free, x0: top.x1 } : { ...B.free, y0: top.y1 };
    characteristic(B, top, c);
    power(B, bottom, state, c);
  },
  law: () => [String.raw`V = V_\text{th} - I R_\text{th}, \qquad R_\text{th} = \frac{V_\text{th}}{I_N}`, String.raw`P_L = \frac{V_\text{th}^2 R_L}{(R_\text{th} + R_L)^2}`, String.raw`P_\text{max} = \frac{V_\text{th}^2}{4R_\text{th}} \text{ at } R_L = R_\text{th}`],
  liveRows(state, c) {
    return [
      kv('V_th, I_N, R_th (closed form)', `${volts(c.Vth)}, ${amps(c.IN)}, ${ohms(c.Rth)}`),
      kv('From loads of 1 Ω and 10 Ω', `${volts(c.Vbench)}, ${ohms(c.Rbench)}`),
      kv('Load: R_L, I, V', `${ohms(c.RL)}, ${amps(c.I)}, ${volts(c.V)}`),
      kv('Load power, most possible', `${watts(c.P)}, ${watts(c.Pmax)}`),
      kv('Heating R_th in the equivalent', watts(c.Pin)),
      kv('Efficiency of the equivalent', pct(c.eta)),
      kv('Real sources: power, efficiency', c.etaReal == null ? watts(c.Psrc) : `${watts(c.Psrc)}, ${pct(c.etaReal)}`),
      kv('Closed form against the bench test', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['V_th', volts(c.Vth)],
      ['R_th', ohms(c.Rth)],
      ['load power', watts(c.P)],
      ['efficiency', pct(c.eta)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The equivalent copies the network only at its terminals. It says nothing about the power wasted inside: here the real sources put out ${watts(c.Psrc)} to deliver ${watts(c.P)}, because R₄ draws current even with no load.`;
    const ratio = c.RL / c.Rth;
    if (Math.abs(ratio - 1) < 0.03) {
      return { title: 'Most power, half of it wasted', body: `At R_L = R_th = ${ohms(c.Rth)} the load takes the most it can, ${watts(c.Pmax)}. In the equivalent circuit the same current heats R_th just as much, so only ${pct(c.eta)} of the source’s power arrives. Matching suits a weak signal, an antenna or a sensor, not a power supply. ${leavesOut}` };
    }
    if (ratio > 1) {
      return { title: 'A light load: less power, less waste', body: `R_L = ${ohms(c.RL)} is ${fig(ratio)} times R_th. The load takes ${watts(c.P)}, ${pct(c.share)} of the most it could, but ${pct(c.eta)} of the equivalent source’s power now reaches it. Power supplies run here, with R_L far above R_th. ${leavesOut}` };
    }
    return { title: 'A heavy load: the source heats itself', body: `R_L = ${ohms(c.RL)} is below R_th = ${ohms(c.Rth)}. The current is large, ${amps(c.I)}, and most of the power heats R_th: ${watts(c.Pin)} there against ${watts(c.P)} in the load. ${leavesOut}` };
  },
  app: false,
});
