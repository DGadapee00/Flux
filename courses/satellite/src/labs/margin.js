import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, fillUnder, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ALPHA, GROWTH, marginChecked } from '@flux/subjects/design/massmargin.js';

/**
 * Mass margin: a 6U CubeSat's mass budget against its 12 kg allocation.
 *
 * Shows that a budget can show margin the craft does not have. A flat growth allowance is
 * bookkeeping: raising it shrinks the margin on paper, but the craft weighs what its designs grow
 * to. A new design grows more than a catalog part, so the same 20% that over-covers a catalog bus
 * leaves a new one likely to come in over the allocation. The closed form gives the finished mass's
 * mean and spread; the second method convolves each item's Beta-distributed growth on a grid and
 * must agree on both (packages/subjects/src/design/massmargin.js). The chance of exceeding the
 * allocation is read off the convolution.
 *
 * The allocation is 2 kg per unit (Wikipedia, CubeSat). The basic masses are this course's own
 * round figures for a 6U craft.
 */
export const BUS = Object.freeze([
  ['Structure', 1.6],
  ['Power', 2.0],
  ['Attitude control', 1.2],
  ['Radio', 0.5],
  ['Flight computer', 0.3],
  ['Harness', 0.6],
  ['Thermal', 0.3],
]);

export const MATURITY = Object.freeze([
  ['measured', 'Built and weighed'],
  ['catalog', 'Bought from a catalog'],
  ['modified', 'Modified from a flown design'],
  ['new', 'A new design'],
]);

/** The craft's items for a lab state: the bus at one maturity, the payload at another. */
export function craftItems({ busM, payM, pay }) {
  return [...BUS.map(([name, basic]) => ({ name, basic, maturity: busM })), { name: 'Payload', basic: pay, maturity: payM }];
}

const SCENARIOS = [
  { id: 'catalog', name: 'A catalog bus and a new 3 kg payload', busM: 'catalog', payM: 'new', pay: 3, allow: 20, limit: 12 },
  { id: 'new', name: 'Every part a new design, the same 20%', busM: 'new', payM: 'new', pay: 3, allow: 20, limit: 12 },
  { id: 'heavy', name: 'A 4 kg payload on the catalog bus', busM: 'catalog', payM: 'new', pay: 4, allow: 20, limit: 12 },
  { id: 'measured', name: 'Everything built and weighed', busM: 'measured', payM: 'measured', pay: 3, allow: 20, limit: 12 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, busM: sc.busM, payM: sc.payM, pay: sc.pay, allow: sc.allow, limit: sc.limit });
}

const KEYS = [['mg-p', 'pay'], ['mg-a', 'allow'], ['mg-l', 'limit']];
const kg = (x) => `${fig(x)} kg`;
const pct = (p) => (p < 0.001 ? 'under 0.1%' : p > 0.999 ? 'over 99.9%' : `${fig(100 * p)}%`);
const options = (sel) => MATURITY.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`).join('');

export default defineLab({
  id: 'margin',
  exam: 'u8',
  title: 'Mass margin',
  hint: 'Make the bus a new design and watch the chance of coming in over 12 kg jump while the budget still shows margin. Then raise the allowance: the margin shrinks, the chance does not move.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('catalog', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pay', lo: 1, hi: 5 }),
  controls() {
    return `
      <label class="field"><span>Bus parts</span><select id="mg-bus">${options('catalog')}</select></label>
      <label class="field"><span>Payload</span><select id="mg-pay">${options('new')}</select></label>
      ${slider('mg-p', 'Payload basic mass (kg)', 3, 1, 5, 0.1)}
      ${slider('mg-a', 'Growth allowance carried (%)', 20, 0, 50, 1)}
      ${slider('mg-l', 'Launch allocation (kg)', 12, 8, 16, 0.1)}
      <p class="tiny">Bus: ${BUS.map(([n, m]) => `${n.toLowerCase()} ${m} kg`).join(', ')}. Mean growth by maturity: ${MATURITY.map(([v, t]) => `${t.toLowerCase()} ${Math.round(GROWTH[v] * 100)}%`).join(', ')}. Each item's growth is a Beta distribution with α = ${ALPHA}.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['mg-bus', 'busM'], ['mg-pay', 'payM']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['mg-bus', 'busM'], ['mg-pay', 'payM'], ...KEYS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return marginChecked(craftItems(state), state.allow / 100, state.limit);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.62) : [B.free, null];
    const lo = Math.min(c.basic, c.mean - 4 * c.sd) - 0.3;
    const hi = Math.max(state.limit, c.predicted, c.mean + 4 * c.sd) + 0.3;
    // The convolved distribution as a density, thinned to about 400 points.
    const { dist, h } = c;
    const step = Math.max(1, Math.floor(dist.w.length / 400));
    const pts = [];
    for (let i = 0; i < dist.w.length; i += step) {
      let p = 0;
      for (let j = i; j < Math.min(i + step, dist.w.length); j++) p += dist.w[j];
      pts.push([(dist.k0 + i + (step - 1) / 2) * h, p / (step * h)]);
    }
    const peak = Math.max(...pts.map((p) => p[1]));
    const P = plotIn(B, top, { lo, hi }, { lo: 0, hi: 1.25 * peak });
    axes(P, { xLabel: 'finished mass (kg)', yLabel: 'likelihood' });
    fillUnder(P, pts.filter(([x]) => x >= state.limit), alpha(C.red, 0.35));
    line(P, pts, { color: C.teal, width: 2.5 });
    const mark = (x, color, text, row, dash = null) => {
      seg(P, [x, 0], [x, 1.25 * peak], { color, width: 2, dash });
      label(P, text, [x, 1.25 * peak], { color, align: x > (lo + hi) / 2 ? 'right' : 'left', dx: x > (lo + hi) / 2 ? -4 : 4, dy: 12 + 14 * row });
    };
    mark(c.basic, C.muted, 'basic', 0, [4, 4]);
    mark(c.predicted, C.gold, 'budget', 1, [6, 3]);
    mark(state.limit, C.red, 'allocation', 2);
    if (!bottom) return;
    // The budget against the allocation, and what the craft is expected to weigh.
    const Q = plotIn(B, bottom, { lo: 0, hi }, { lo: 0, hi: 2 }, { left: 74, right: 14, top: 14, bottom: 40 });
    axes(Q, { xLabel: 'mass (kg)', yFmt: () => '' });
    const bar = (y, a, b, fill) => poly(Q, [[a, y - 0.32], [b, y - 0.32], [b, y + 0.32], [a, y + 0.32]], { fill, stroke: null });
    bar(1.4, 0, c.basic, alpha(C.blue, 0.75));
    bar(1.4, c.basic, c.predicted, alpha(C.gold, 0.8));
    if (c.margin >= 0) bar(1.4, c.predicted, state.limit, alpha(C.green, 0.6));
    else bar(1.4, state.limit, c.predicted, alpha(C.red, 0.7));
    bar(0.5, 0, c.mean, alpha(C.teal, 0.7));
    seg(Q, [Math.max(0, c.mean - 2 * c.sd), 0.5], [c.mean + 2 * c.sd, 0.5], { color: C.text, width: 2 });
    seg(Q, [state.limit, 0], [state.limit, 2], { color: C.red, width: 2 });
    label(Q, 'budget', [0, 1.4], { color: C.text, align: 'right', dx: -6 });
    label(Q, 'expected', [0, 0.5], { color: C.text, align: 'right', dx: -6 });
  },
  law: () => [
    String.raw`P = B\,(1 + a), \qquad \text{margin} = L - P`,
    String.raw`\bar M = \sum b_i (1 + \mu_i), \qquad \sigma_M^2 = \sum b_i^2 \sigma_i^2`,
  ],
  liveRows(state, c) {
    return [
      kv('Basic mass, with the allowance', `${kg(c.basic)}, ${kg(c.predicted)}`),
      kv('Margin under the allocation', `${kg(c.margin)}, ${fig(100 * c.marginShare)}%`),
      kv('Expected finished mass, closed form', `${c.mean.toFixed(3)} kg`),
      kv('Expected finished mass, convolved', `${c.numMean.toFixed(3)} kg`),
      kv('Spread, closed form and convolved', `${fig(1000 * c.sd)} g, ${fig(1000 * c.numSd)} g`),
      kv('Two methods differ by', c.gap.toExponential(0)),
      kv('Chance it comes in over, convolved', pct(c.pExceed)),
      kv('The normal curve’s estimate', pct(c.pNormal)),
      kv('Allowance the expected growth needs', `${fig(100 * c.needed)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['margin', kg(c.margin)],
      ['expected', kg(c.mean)],
      ['chance over', pct(c.pExceed)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Growth that is not independent from item to item, as when a heavier payload needs a stiffer structure and a bigger battery; requirements that change; and the margin a project holds back above the allowance for what no one has thought of yet.`;
    const over = pct(c.pExceed);
    if (c.margin < 0) {
      return { title: 'The budget is already over', body: `${kg(c.basic)} with a ${fig(state.allow)}% allowance predicts ${kg(c.predicted)}, ${kg(-c.margin)} over the ${kg(state.limit)} allocation. Take mass out, or find a lighter part, before the next review. The chance the finished craft comes in over is ${over}. ${leavesOut}` };
    }
    if (c.pExceed > 0.1) {
      return { title: 'Margin on paper, not in the craft', body: `The budget shows ${kg(c.margin)} of margin, yet the craft is expected to weigh ${kg(c.mean)} and comes in over ${kg(state.limit)} ${over} of the time. Its parts are expected to grow ${fig(100 * c.needed)}%, more than the ${fig(state.allow)}% carried. An allowance must follow each item's maturity. ${leavesOut}` };
    }
    if (c.needed < state.allow / 100 - 0.05) {
      return { title: 'The allowance over-covers', body: `The parts are expected to grow ${fig(100 * c.needed)}%, well under the ${fig(state.allow)}% carried, so the budget hides ${kg(c.predicted - c.mean)} that could go to the payload. The chance of coming in over is ${over}. ${leavesOut}` };
    }
    return { title: 'The allowance covers the growth', body: `Expected growth is ${fig(100 * c.needed)}% against ${fig(state.allow)}% carried. The craft should weigh ${kg(c.mean)}, give or take ${fig(1000 * c.sd)} g, under the ${kg(state.limit)} allocation; the chance of coming in over is ${over}. ${leavesOut}` };
  },
  app: false,
});
