import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { TRL_SD, confidenceChecked } from '@flux/subjects/design/cost.js';

/**
 * Cost confidence: the budget a project needs to finish within it at a chosen confidence, when each
 * element's cost is uncertain in proportion to how mature its technology is.
 *
 * Shows that reserves do not add. Holding each element at 70% confidence and adding the results asks
 * for more than the project needs at 70%, because independent overruns rarely all happen together.
 * It also shows where the reserve goes: one immature element can set most of it. The total's mean and
 * spread add in closed form, and a lognormal with those moments gives the budget; the second method
 * convolves the elements' distributions on a grid (packages/subjects/src/design/cost.js).
 *
 * The spread by technology readiness level is MIT 16.851 Lecture 15's. The elements and their costs
 * are our own round figures for the Unit 8 magnetometer craft.
 */
export function elements(state) {
  return [
    { name: 'Bus', cost: 1.2, trl: 7 },
    { name: 'Magnetometer', cost: 0.6, trl: state.payTrl },
    { name: 'Boom and hinge', cost: 0.15, trl: state.boomTrl },
    { name: 'Flight software', cost: 0.4, trl: state.swTrl },
    { name: 'Integration and test', cost: 0.5, trl: 6 },
    { name: 'Ground and operations', cost: 0.4, trl: 7 },
  ].map((e) => ({ ...e, sd: TRL_SD[e.trl] }));
}

const SCENARIOS = [
  { id: 'mature', name: 'Everything at TRL 6 or better, 70% confidence', payTrl: 6, boomTrl: 6, swTrl: 6, conf: 70 },
  { id: 'new', name: 'A new magnetometer at TRL 3, 70% confidence', payTrl: 3, boomTrl: 4, swTrl: 5, conf: 70 },
  { id: 'ninety', name: 'The new design at 90% confidence', payTrl: 3, boomTrl: 4, swTrl: 5, conf: 90 },
  { id: 'half', name: 'The new design at 50%', payTrl: 3, boomTrl: 4, swTrl: 5, conf: 50 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, payTrl: sc.payTrl, boomTrl: sc.boomTrl, swTrl: sc.swTrl, conf: sc.conf });
}

const SELECTS = [['rv-p', 'payTrl'], ['rv-b', 'boomTrl'], ['rv-s', 'swTrl']];
const usd = (m) => (Math.abs(m) >= 1 ? `USD ${fig(m)}M` : `USD ${fig(m * 1000)}k`);
const pair = (a, b) => `${fig(a)}, ${fig(b)} USD M`;

export default defineLab({
  id: 'reserve',
  exam: 'u15',
  title: 'Cost confidence',
  hint: 'Drop the magnetometer to TRL 3 and watch the budget at 70% grow. Then compare it with every element held at 70% on its own and added: that asks for more than the project needs.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mature', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'conf', lo: 50, hi: 95 }),
  controls() {
    const trl = [3, 4, 5, 6, 7, 8].map((t) => `<option value="${t}">TRL ${t}, ±${fig(100 * TRL_SD[t])}%</option>`).join('');
    return `
      ${SELECTS.map(([id], i) => `<label class="field"><span>${['Magnetometer', 'Boom and hinge', 'Flight software'][i]}</span><select id="${id}">${trl}</select></label>`).join('')}
      ${slider('rv-c', 'Confidence the budget holds (%)', 70, 50, 95, 1)}
      <p class="tiny">Six elements, each lognormal about its estimate with the spread Lecture 15 gives its readiness level, independent of each other. Bus, integration and test, and operations are fixed.</p>`;
  },
  bind(api) {
    for (const [id, key] of SELECTS) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump();
      });
    }
    bindSlider('rv-c', (s, v) => { s.conf = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [...SELECTS, ['rv-c', 'conf']]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const items = elements(state);
    const c = confidenceChecked(items, state.conf / 100);
    const largest = items.reduce((a, b) => ((b.cost * b.sd) ** 2 > (a.cost * a.sd) ** 2 ? b : a));
    return { ...c, items, largest: largest.name, largestShare: (largest.cost * largest.sd) ** 2 / (c.sd * c.sd), eachReserve: c.eachAdded - c.mean };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.55) : [B.free, null];
    const lo = c.mean - 4 * c.sd;
    const hi = c.mean + 5 * c.sd;
    const pdf = c.numeric.pdf.filter(([x]) => x >= lo && x <= hi);
    const yMax = Math.max(...pdf.map((p) => p[1])) * 1.15;
    const P = plotIn(B, top, { lo, hi }, { lo: 0, hi: yMax });
    axes(P, { xLabel: 'total cost (USD M)', yLabel: 'likelihood', yFmt: () => '' });
    poly(P, [[lo, 0], ...pdf.filter(([x]) => x <= c.budget), [c.budget, 0]], { fill: alpha(C.teal, 0.25), stroke: null });
    line(P, pdf, { color: C.teal, width: 2 });
    seg(P, [c.mean, 0], [c.mean, yMax], { color: alpha(C.muted, 0.9), width: 1.5, dash: [5, 4] });
    seg(P, [c.budget, 0], [c.budget, yMax], { color: C.gold, width: 2 });
    seg(P, [c.eachAdded, 0], [c.eachAdded, yMax * 0.7], { color: C.pink, width: 1.5, dash: [3, 3] });
    label(P, `estimates ${usd(c.mean)}`, [c.mean, yMax], { color: C.muted, align: 'right', dx: -6, dy: 10 });
    label(P, `${fig(state.conf)}% budget ${usd(c.budget)}`, [c.budget, yMax], { color: C.gold, align: 'left', dx: 6, dy: 10 });
    label(P, 'each at that confidence, added', [c.eachAdded, yMax * 0.7], { color: C.pink, align: 'left', dx: 6 });
    if (!bottom) return;
    // Each element's estimate, and its one-sigma spread.
    const rows = c.items;
    const xMax = Math.max(...rows.map((r) => r.cost * (1 + 2 * r.sd))) * 1.05;
    const Q = plotIn(B, bottom, { lo: 0, hi: xMax }, { lo: 0, hi: rows.length }, { left: 132, right: 16, top: 8, bottom: 40 });
    axes(Q, { xLabel: 'estimate and one sigma (USD M)', yFmt: () => '' });
    rows.forEach((r, i) => {
      const y = rows.length - i - 0.5;
      const big = r.name === c.largest;
      poly(Q, [[0, y - 0.28], [r.cost, y - 0.28], [r.cost, y + 0.28], [0, y + 0.28]], { fill: alpha(big ? C.gold : C.teal, 0.7), stroke: null });
      seg(Q, [r.cost * (1 - r.sd), y], [r.cost * (1 + r.sd), y], { color: C.text, width: 2 });
      label(Q, `${r.name}, TRL ${r.trl}`, [0, y], { color: big ? C.gold : C.text, align: 'right', dx: -6 });
    });
  },
  law: () => [
    String.raw`\mu = \sum c_i, \qquad \sigma^2 = \sum (c_i s_i)^2`,
    String.raw`B_p = e^{\,m + z_p \sigma_L}, \quad \sigma_L^2 = \ln\!\left(1 + \sigma^2/\mu^2\right)`,
  ],
  liveRows(state, c) {
    return [
      kv('Sum of estimates', usd(c.mean)),
      kv('Spread, closed and convolved', pair(c.sd, c.numeric.sd)),
      kv(`Budget at ${fig(state.conf)}%, two ways`, pair(c.budget, c.numeric.budget)),
      kv('Reserve', `${usd(c.reserve)}, ${(100 * c.reserveShare).toFixed(1)}%`),
      kv('Reserve if each is held alone', usd(c.eachReserve)),
      kv('Largest share of the spread', `${c.largest}, ${Math.round(100 * c.largestShare)}%`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['budget', usd(c.budget)],
      ['reserve', `${(100 * c.reserveShare).toFixed(1)}%`],
      ['driver', c.largest.toLowerCase()],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Elements whose overruns move together, which makes reserves add after all; schedule, which costs money while it slips; scope changes, which reserves are not for; and the management reserve by development status Lecture 15 also lists.`;
    if (state.conf <= 50) return { title: 'Half the time over', body: `At 50% the budget is ${usd(c.budget)}, a little under the ${usd(c.mean)} the estimates add to: costs run high more often than low, so the median sits below the mean. A project funded at its estimates overruns about half the time. ${leavesOut}` };
    return {
      title: `${usd(c.budget)} for ${fig(state.conf)}%`,
      body: `To finish within budget ${fig(state.conf)} times in 100, the project needs ${usd(c.reserve)} over its estimates, ${(100 * c.reserveShare).toFixed(1)}%. Holding each element at ${fig(state.conf)}% on its own and adding would ask for ${usd(c.eachReserve)}: independent overruns rarely all happen together. ${c.largest} sets ${Math.round(100 * c.largestShare)}% of the spread. ${leavesOut}`,
    };
  },
  app: false,
});
