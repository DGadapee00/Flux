import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PS, chainsChecked, modulus } from '@flux/subjects/matsci/polymer.js';

/**
* Chains: a polymer's chain lengths, set by how likely each chain is to add one more unit, and what
 * they do to its glass transition, the stiffness drawn against temperature.
 *
 * Shows that a plastic does not melt at one sharp temperature like a metal: through its glass
 * transition its stiffness falls about a thousandfold over a few tens of degrees. Short chains lower
 * the transition: polystyrene with M̄_n = 10 400 g/mol softens at 90 °C, not 100. The Flory averages
 * are checked by summing the distribution term by term (packages/subjects/src/matsci/polymer.js).
 */
const SCENARIOS = [
  { id: 'long', name: 'Long chains, p = 0.999', lx: 3 },
  { id: 'mid', name: 'Medium chains, p = 0.99', lx: 2 },
  { id: 'short', name: 'Short chains, p = 0.9', lx: 1 },
  { id: 'vlong', name: 'Very long chains, p = 0.9999', lx: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lx: sc.lx });
}

const KEYS = [['ch-p', 'lx']];

const gmol = (m) => `${fig(m)} g/mol`;

function lengths(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 1, hi: 1e6, log: true }, { lo: 0, hi: 0.42 });
  axes(P, { xLabel: 'chain length (repeat units)', yLabel: 'share of the mass, per e-fold of length', yFmt: (v) => fig(v) });
  const q = 1 - c.p;
  const pts = Array.from({ length: 241 }, (_, k) => {
    const i = 10 ** (k / 40);
    // Mass share per ln i: i × (i (1 − p)² p^{i − 1}).
    return [i, i * i * q * q * Math.exp((i - 1) * Math.log(c.p))];
  });
  poly(P, [[1, 0], ...pts, [1e6, 0]], { fill: alpha(C.gold, 0.25), stroke: null });
  line(P, pts, { color: C.gold, width: 2 });
  seg(P, [c.DP, 0], [c.DP, 0.4], { color: alpha(C.blue, 0.8), width: 1.5, dash: [4, 4] });
  label(P, `number average ${fig(c.DP)} units`, [c.DP, 0.4], { color: C.blue, align: c.DP > 3e4 ? 'right' : 'left', dx: c.DP > 3e4 ? -6 : 6 });
}

function stiffness(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 180 }, { lo: 1e2, hi: 1e10, log: true });
  axes(P, { xLabel: 'temperature (°C)', yLabel: 'Young’s modulus (Pa)' });
  const pts = Array.from({ length: 181 }, (_, T) => [T, modulus(T, c)]);
  line(P, pts, { color: C.gold, width: 2.5 });
  seg(P, [c.Tg, 1e2], [c.Tg, 1e10], { color: alpha(C.red, 0.7), width: 1.5, dash: [4, 4] });
  label(P, `T_g = ${fig(c.Tg)} °C`, [c.Tg, 3e9], { color: C.red, align: c.Tg > 120 ? 'right' : 'left', dx: c.Tg > 120 ? -6 : 6, dy: 14 });
  label(P, c.entangled ? 'rubbery: chains tangled' : 'flows: too short to tangle', [178, c.entangled ? PS.Er : PS.Eflow], { color: C.muted, align: 'right', dy: -16 });
}

export default defineLab({
  id: 'chains',
  exam: 'u5',
  title: 'Chains',
  hint: 'Heat the long-chain polymer through 100 °C and watch the stiffness drop a thousandfold. Then shorten the chains and watch the transition move down.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('long', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lx', lo: 1, hi: 4 }),
  controls() {
    return `
      ${slider('ch-p', "Chance a chain grows on, as −log₁₀(1 − p)", 3, 1, 4, 0.01)}
      <p class="tiny">Polystyrene’s constants: repeat unit 104 g/mol, T_g,∞ = 100 °C, K = 1.0 × 10⁵ K·g/mol; chains entangle above about 35 000 g/mol. Left: the share of the mass in chains of each length. Right: Young’s modulus against temperature.</p>`;
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
    return chainsChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      stiffness(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    lengths(B, a, state, c);
    stiffness(B, b, state, c);
  },
  law: () => [String.raw`\bar M_n = \sum x_i M_i = \frac{m_0}{1 - p}, \qquad \bar M_w = \frac{m_0(1 + p)}{1 - p}`, String.raw`\text{DP} = \frac{\bar M_n}{m_0}, \qquad T_g = T_{g,\infty} - \frac{K}{\bar M_n}`],
  liveRows(state, c) {
    return [
      kv('p', fig(c.p)),
      kv('M̄_n and M̄_w', `${gmol(c.Mn)}, ${gmol(c.Mw)}`),
      kv('Dispersity M̄_w/M̄_n', fig(c.PDI)),
      kv('Degree of polymerisation', fig(c.DP)),
      kv('Glass transition', `${fig(c.Tg)} °C`),
      kv('Closed form against the term-by-term sum', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['M̄_n', gmol(c.Mn)], ['T_g', `${fig(c.Tg)} °C`], ['dispersity', fig(c.PDI)], ['DP', fig(c.DP)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The transition’s width and the rubbery plateau depend on how fast you measure; crystalline polymers also have a melting point above T_g; and plasticisers lower T_g as short chains do.`;
    if (!c.entangled) return { title: 'Short chains: brittle, then runny', body: `At M̄_n = ${gmol(c.Mn)} the chains are too short to tangle, so above T_g = ${fig(c.Tg)} °C there is no rubbery plateau: the polymer flows. Their many ends also lower T_g below polystyrene’s 100 °C. ${leavesOut}` };
    return { title: 'A transition, not a melting point', body: `Below ${fig(c.Tg)} °C the chains are frozen and the modulus is about 3 GPa. Through T_g they start to slide past each other and it falls a thousandfold to a rubbery plateau, where the tangles hold it together. There is no sharp melting point. ${leavesOut}` };
  },
  app: false,
});
