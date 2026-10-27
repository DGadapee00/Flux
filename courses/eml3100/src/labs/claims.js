import { classifyByLimit, classifyClaim, fromC } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a claimed engine, refrigerator or heat pump is reversible, irreversible or impossible
 * according to the first law and the Clausius sum, and that comparing its efficiency with the
 * Carnot limit gives the same call once the first law holds.
 */

const KJ = 1e3;

const SCENARIOS = [
  { id: 'fair', name: 'A fair engine', kind: 'engine', TH: 800, TL: 300, QH: 500, QL: 300, W: 200 },
  { id: 'reversible', name: 'A reversible engine', kind: 'engine', TH: 800, TL: 300, QH: 500, QL: 187.5, W: 312.5 },
  { id: 'impossible', name: 'An impossible engine', kind: 'engine', TH: 800, TL: 300, QH: 500, QL: 100, W: 400 },
  { id: 'fridge', name: 'A claimed refrigerator', kind: 'refrigerator', TH: fromC(22), TL: fromC(-18), QH: 8, QL: 6, W: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, kind: sc.kind, TH: sc.TH, TL: sc.TL, QH: sc.QH, QL: sc.QL, W: sc.W });
}

const VERDICT = { reversible: 'reversible', irreversible: 'irreversible', impossible: 'impossible' };

export default defineLab({
  id: 'claims',
  exam: 'u4',
  title: 'Possible or not',
  hint: 'Check the first law, then the Clausius sum. Past the Carnot limit the device cannot exist.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fair', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'W', lo: Math.max(state.QH * 0.05, 0.2), hi: state.QH * 1.15 };
  },
  controls() {
    return `${slider('cl-QH', 'heat from the hot side (kJ)', 500, 100, 800, 10)}
      ${slider('cl-QL', 'heat to the cold side (kJ)', 300, 20, 700, 5)}
      ${slider('cl-W', 'work (kJ)', 200, 20, 700, 5)}
      <p class="tiny">Magnitudes are positive. For a cycle the first law says the hot heat equals the cold heat plus the work. Temperatures stay at the scenario's two reservoirs.</p>`;
  },
  bind(api) {
    bindSlider('cl-QH', (s, v) => { s.QH = v; }, api);
    bindSlider('cl-QL', (s, v) => { s.QL = v; }, api);
    bindSlider('cl-W', (s, v) => { s.W = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['cl-QH', 'QH'], ['cl-QL', 'QL'], ['cl-W', 'W']]) {
      const el = document.getElementById(id);
      if (!el || document.activeElement === el) continue;
      el.value = String(Number(state[key].toPrecision(5)));
    }
  },
  compute(state) {
    const QH = Math.max(state.QH, 1) * KJ;
    const QL = Math.max(state.QL, 0.05) * KJ;
    const W = Math.max(state.W, 0) * KJ;
    const TH = Math.max(state.TH, state.TL + 5);
    const TL = Math.min(state.TL, TH - 5);
    const claim = classifyClaim({ kind: state.kind, TH, TL, QH, QL, W });
    const byLimit = classifyByLimit({ kind: state.kind, TH, TL, QH, QL, W });
    const manual = state.kind === 'engine' ? QH / TH - QL / TL : QL / TL - QH / TH;
    const balance = QH - QL - W;
    return {
      kind: state.kind,
      TH,
      TL,
      QH,
      QL,
      W,
      eta: W / QH,
      copR: W > 0 ? QL / W : 0,
      copHP: W > 0 ? QH / W : 0,
      carnot: claim.carnotEta,
      carnotCopR: claim.carnotCopR,
      clausius: claim.clausius,
      manual,
      balance,
      verdict: claim.verdict,
      byLimit,
      gap: (claim.verdict === byLimit ? 0 : 1) + Math.abs(claim.clausius - manual) / Math.max(Math.abs(manual), 1),
    };
  },
  draw(canvas, state, c) {
    const claimed = state.kind === 'engine' ? c.eta : state.kind === 'heatpump' ? c.copHP : c.copR;
    const limit = state.kind === 'engine' ? c.carnot : state.kind === 'heatpump' ? c.carnot + 1 : c.carnotCopR;
    const hi = Math.max(1.2, claimed * 1.15, limit * 1.15);
    const P = layout(canvas, { lo: 0, hi: 3 }, { lo: 0, hi });
    axes(P, { xLabel: 'device', yLabel: state.kind === 'engine' ? 'efficiency' : 'COP' });
    const bar = (x, h, color) => {
      line(P, [[x, 0], [x, h]], { color, width: 18 });
    };
    bar(1, Math.max(claimed, 0), c.verdict === 'impossible' ? C.red : C.yellow);
    bar(2, Math.max(limit, 0), C.teal);
    note(P, 'claim', 1, Math.max(claimed, 0), { dy: -10, align: 'center', color: C.yellow });
    note(P, 'Carnot', 2, Math.max(limit, 0), { dy: -10, align: 'center', color: C.teal });
    note(P, VERDICT[c.verdict], 1.5, hi * 0.08, { align: 'center', color: c.verdict === 'impossible' ? C.red : C.text });
    if (Math.abs(c.balance) > 1) {
      note(P, 'first law fails', 1.5, hi * 0.2, { align: 'center', color: C.gold });
    }
  },
  law: (state) => (state.kind === 'engine'
    ? [String.raw`\eta = W/Q_H`, String.raw`\oint \delta Q/T = Q_H/T_H - Q_L/T_L`]
    : [String.raw`\mathrm{COP_R} = Q_L/W`, String.raw`Q_H = Q_L + W`]),
  liveRows(state, c) {
    return [
      kv('verdict', c.verdict),
      kv('Clausius sum', fig(c.clausius / KJ)),
      kv('sum again, written out', fig(c.manual / KJ)),
      kv('first-law residual', `${fig(c.balance / KJ)} kJ`),
      kv(state.kind === 'engine' ? 'efficiency' : 'COP', fig(state.kind === 'engine' ? c.eta : c.copR)),
      kv('Carnot limit', fig(state.kind === 'engine' ? c.carnot : c.carnotCopR)),
    ].join('');
  },
  readout(state, c) {
    const perf = state.kind === 'engine' ? ['η', fig(c.eta)] : ['COP_R', fig(c.copR)];
    return cells([
      perf,
      ['Carnot', fig(state.kind === 'engine' ? c.carnot : c.carnotCopR)],
      ['call', c.verdict],
      ['Q_H − Q_L − W', `${fig(c.balance / KJ)} kJ`],
    ]);
  },
  coach(state, c) {
    if (!c.verdict) return { title: 'Check the balance', body: 'A cycle needs the heats and the work to add up before the second law is even asked.' };
    if (Math.abs(c.balance) > 1) {
      return { title: 'The first law already fails', body: 'QH, QL and W do not add up. No cycle, reversible or not, can do that. Fix the energy balance before comparing with Carnot.' };
    }
    if (c.verdict === 'impossible') {
      return { title: 'Above the limit', body: String.raw`The Clausius sum is positive, so the claim produces entropy in reverse. The efficiency test says the same thing: the device beats $1 - T_L/T_H$.` };
    }
    if (c.verdict === 'reversible') {
      return { title: 'On the limit', body: 'The Clausius sum is zero. Every joule is accounted for, and the device sits on the Carnot line. Anything real falls short of this.' };
    }
    return { title: 'Possible, and wasteful', body: String.raw`The sum is negative, so the device is possible and irreversible. It makes less work than $${fig(c.carnot * c.QH / KJ)}$ kJ, which is the Carnot work from this heat.` };
  },
});
