import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, label, plotIn, poly } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { scoreConcepts, weightRange, weightRangeNumeric } from '@flux/subjects/design/decision.js';

/**
 * Decision: three ways to make one sensor bracket, judged against requirements and weighted wants.
 *
 * Shows the order a design decision should run in: requirements first, as pass or fail, then a
 * weighted comparison of what is left, then a check of how far each weight can move before the
 * answer changes. The ranges come from a closed form, linear in each weight, and again from a scan
 * with bisection (packages/subjects/src/design/decision.js). `gap` is the largest difference in a
 * range end, as a share of the weight scale.
 *
 * The concepts' numbers are illustrative, written for this lab, not measured parts.
 */
const CONCEPTS = [
  { id: 'machined', name: 'Machined aluminium', values: { mass: 42, cost: 38, defl: 0.05, lead: 10, temp: 150 } },
  { id: 'sheet', name: 'Bent steel sheet', values: { mass: 60, cost: 9, defl: 0.12, lead: 15, temp: 400 } },
  { id: 'printed', name: 'Printed nylon', values: { mass: 18, cost: 6, defl: 0.6, lead: 2, temp: 70 } },
];

const CRITERIA = [
  { id: 'mass', name: 'mass', unit: 'g', better: 'lower', color: C.blue },
  { id: 'cost', name: 'cost', unit: '$', better: 'lower', color: C.gold },
  { id: 'defl', name: 'deflection', unit: 'mm', better: 'lower', color: C.teal },
  { id: 'lead', name: 'lead time', unit: 'days', better: 'lower', color: C.purple },
  { id: 'temp', name: 'heat limit', unit: '°C', better: 'higher', color: C.pink },
];

const SCENARIOS = [
  { id: 'prototype', name: 'One test rig, needed this week', weights: { mass: 1, cost: 2, defl: 1, lead: 5, temp: 0 }, req: [{ criterion: 'defl', max: 1 }] },
  { id: 'production', name: 'A run of 1,000', weights: { mass: 1, cost: 5, defl: 2, lead: 1, temp: 1 }, req: [{ criterion: 'defl', max: 0.3 }] },
  { id: 'flight', name: 'On a small satellite', weights: { mass: 5, cost: 1, defl: 3, lead: 1, temp: 1 }, req: [{ criterion: 'defl', max: 0.2 }, { criterion: 'temp', min: 100 }] },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, ...Object.fromEntries(CRITERIA.map((k) => [`w_${k.id}`, sc.weights[k.id]])) });
}

const weightsOf = (state) => Object.fromEntries(CRITERIA.map((k) => [k.id, state[`w_${k.id}`]]));
const reqOf = (state) => (SCENARIOS.find((s) => s.id === state.scenarioId) || SCENARIOS[0]).req;
const nameOf = (id) => CONCEPTS.find((c) => c.id === id)?.name ?? '';
const reqText = (r) => {
  const k = CRITERIA.find((c) => c.id === r.criterion);
  return r.max != null ? `${k.name} at most ${r.max} ${k.unit}` : `${k.name} at least ${r.min} ${k.unit}`;
};

export default defineLab({
  id: 'decision',
  exam: 'u3',
  title: 'Decision',
  hint: 'Change the need, not the weights first: requirements knock concepts out before any score counts. Then push one weight and see how far it can go before the answer flips.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('production', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'w_cost', lo: 0, hi: 5 }),
  controls() {
    return `${CRITERIA.map((k) => slider(`de-${k.id}`, `weight on ${k.name}`, 1, 0, 5, 0.5)).join('')}
      <p class="tiny">Requirements come with the scenario. The concepts’ numbers are illustrative, written for this lab.</p>`;
  },
  bind(api) {
    for (const k of CRITERIA) bindSlider(`de-${k.id}`, (s, v) => { s[`w_${k.id}`] = v; }, api);
  },
  syncControls(state) {
    for (const k of CRITERIA) {
      const el = document.getElementById(`de-${k.id}`);
      if (el && document.activeElement !== el) el.value = String(state[`w_${k.id}`]);
    }
  },
  compute(state) {
    const weights = weightsOf(state);
    const req = reqOf(state);
    const rescore = (w) => scoreConcepts(CONCEPTS, CRITERIA, req, w);
    const r = rescore(weights);
    const ranges = {};
    let gap = 0;
    const W = Object.values(weights).reduce((a, b) => a + b, 0);
    if (r.leader && r.ranked.length > 1 && W > 0) {
      for (const k of CRITERIA) {
        const a = weightRange(r, CRITERIA, weights, k.id);
        const b = weightRangeNumeric(rescore, weights, k.id, r.leader);
        ranges[k.id] = a;
        if (Number.isFinite(a.lo)) gap = Math.max(gap, Math.abs(a.lo - b.lo) / 10, Math.abs(a.hi - b.hi) / 10);
      }
    }
    const runner = r.ranked[1] ?? null;
    return {
      ...r,
      weights,
      W,
      req,
      ranges,
      runner,
      leaderScore: r.leader ? r.totals[r.leader] : 0,
      margin: r.leader && runner ? r.totals[r.leader] - r.totals[runner] : 0,
      machinedLeads: r.leader === 'machined',
      sheetLeads: r.leader === 'sheet',
      out: CONCEPTS.filter((c) => r.fails[c.id].length).length,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: -2.4, hi: 5.2 }, { lo: -0.4, hi: CONCEPTS.length + 0.6 }, { left: 12, right: 14, top: 26, bottom: 46 });
    CONCEPTS.forEach((con, i) => {
      const y = CONCEPTS.length - 1 - i + 0.2;
      const failed = c.fails[con.id].length > 0;
      label(P, con.name, [-0.1, y + 0.32], { color: failed ? C.dim : C.text, align: 'right', bold: con.id === c.leader });
      let x = 0;
      if (failed) {
        poly(P, [[0, y], [5, y], [5, y + 0.64], [0, y + 0.64]], { fill: alpha(C.dim, 0.12), stroke: alpha(C.dim, 0.6), dash: [4, 4] });
        label(P, `fails: ${c.fails[con.id].map((id) => CRITERIA.find((k) => k.id === id).name).join(', ')}`, [2.5, y + 0.32], { color: C.red });
        return;
      }
      for (const k of CRITERIA) {
        const wv = c.W > 0 ? (c.weights[k.id] * c.scores[con.id][k.id]) / c.W : 0;
        if (wv > 0) poly(P, [[x, y], [x + wv, y], [x + wv, y + 0.64], [x, y + 0.64]], { fill: alpha(k.color, 0.55), stroke: alpha(k.color, 0.9), width: 1 });
        x += wv;
      }
      label(P, `${fig(c.totals[con.id])}${con.id === c.leader ? '  ★' : ''}`, [x, y + 0.32], { color: con.id === c.leader ? C.yellow : C.muted, align: 'left', dx: 6, bold: con.id === c.leader });
    });
    // Legend along the bottom.
    CRITERIA.forEach((k, i) => {
      const x0 = -2.3 + i * 1.5;
      poly(P, [[x0, -0.3], [x0 + 0.18, -0.3], [x0 + 0.18, -0.1], [x0, -0.1]], { fill: alpha(k.color, 0.7), stroke: null });
      label(P, k.name, [x0 + 0.25, -0.2], { color: C.muted, align: 'left' });
    });
  },
  law: () => [String.raw`S_j = \frac{\sum_k w_k\,s_{jk}}{\sum_k w_k},\quad s_{jk} \in [1, 5]`, String.raw`w_k^{*} = -\frac{\sum_{i \ne k} w_i\,(s_{Li} - s_{ji})}{s_{Lk} - s_{jk}}`],
  liveRows(state, c) {
    const rows = [kv('requirements', c.req.map(reqText).join('; '))];
    if (!c.leader || !c.runner) rows.push(kv('ranking', c.leader ? `${nameOf(c.leader)} is the only concept left` : 'no concept meets the requirements'));
    for (const k of CRITERIA) {
      const r = c.ranges[k.id];
      if (r && Number.isFinite(r.lo)) rows.push(kv(`${k.name} weight keeps the leader from`, `${fig(r.lo)} to ${fig(r.hi)}`));
    }
    rows.push(kv('formula against bisection', `${fig(c.gap * 100)}%`));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['leader', c.leader ? nameOf(c.leader) : 'none'],
      ['its score', `${fig(c.leaderScore)} of 5`],
      ['runner-up', c.runner ? nameOf(c.runner) : 'none'],
      ['ruled out', String(c.out)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Scores run straight from the worst concept to the best, so they say nothing about how good the best one is. A matrix ranks the concepts you thought of; it cannot find one you did not.`;
    let title = 'Requirements first, then weights';
    let body = String.raw`${c.out ? `${c.out} concept${c.out > 1 ? 's' : ''} fail${c.out > 1 ? '' : 's'} a requirement and drop out before any score counts. ` : ''}${c.leader ? `${nameOf(c.leader)} leads by ${fig(c.margin)} points.` : ''}`;
    if (c.leader && c.runner && c.margin < 0.25) {
      title = 'Too close to call';
      body = String.raw`${nameOf(c.leader)} leads ${nameOf(c.runner)} by only ${fig(c.margin)} points. A small change in any weight could flip it: look at the ranges below, then at the numbers behind the scores.`;
    } else if (state.scenarioId === 'production' && c.leader === 'sheet') {
      title = 'The first idea is not the best one';
      body = String.raw`A machined part is often the first sketch, but for a run of 1,000 bent sheet leads: it costs a quarter as much and meets the stiffness requirement. ${c.out ? 'The printed part fails the deflection requirement.' : ''}`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
