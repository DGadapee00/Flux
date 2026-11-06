import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, plotIn, poly, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { allocateClosed, allocateNumeric, partsCost } from '@flux/subjects/design/tolerancing.js';

/**
 * Tolerance allocation: three parts in a stack that must hold ±T, and what their tolerances cost.
 *
 * Shows design for manufacture: a tolerance is not free. With each part's cost rising as a + b/T, the
 * cheapest split gives loose tolerances to parts that are dear to make precise and tight ones to parts
 * that are cheap to hold. Lagrange's closed form is checked by projected gradient descent
 * (packages/subjects/src/design/tolerancing.js). The cost constants are illustrative.
 */
const PARTS = [
  { name: 'turned spacer', a: 2, b: 0.02 },
  { name: 'milled block', a: 8, b: 0.08 },
  { name: 'ground pin', a: 5, b: 0.3 },
];

const SCENARIOS = [
  { id: 'rss', name: 'RSS stack, ±0.10 mm', mode: 'rss', T: 0.1 },
  { id: 'worst', name: 'Worst-case stack, ±0.10 mm', mode: 'worst', T: 0.1 },
  { id: 'tight', name: 'RSS stack, ±0.05 mm', mode: 'rss', T: 0.05 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mode: sc.mode, T: sc.T });
}

export default defineLab({
  id: 'allocate',
  exam: 'u2',
  title: 'Tolerance cost',
  hint: 'Compare the equal split with the cheapest: the ground pin, dear to hold tight, gets the loosest tolerance. Then halve the stack’s tolerance.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rss', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 0.03, hi: 0.3 }),
  controls() {
    return `
      <label class="field"><span>Stack must hold</span><select id="al-mode"><option value="rss">±T by RSS</option><option value="worst">±T in the worst case</option></select></label>
      ${slider('al-T', 'stack tolerance ±T (mm)', 0.1, 0.03, 0.3, 0.005)}
      <p class="tiny">Each part costs a + b/T dollars, with illustrative constants: spacer 2 + 0.02/T, block 8 + 0.08/T, pin 5 + 0.3/T (T in mm).</p>`;
  },
  bind(api) {
    document.getElementById('al-mode')?.addEventListener('change', (e) => {
      api.slice().mode = e.target.value;
      api.bump();
    });
    bindSlider('al-T', (s, v) => { s.T = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('al-mode');
    if (sel) sel.value = state.mode;
    const el = document.getElementById('al-T');
    if (el && document.activeElement !== el) el.value = String(state.T);
  },
  compute(state) {
    const best = allocateClosed(PARTS, state.T, state.mode);
    const num = allocateNumeric(PARTS, state.T, state.mode);
    const n = PARTS.length;
    const equal = new Array(n).fill(state.mode === 'worst' ? state.T / n : state.T / Math.sqrt(n));
    const costBest = partsCost(PARTS, best);
    const costEqual = partsCost(PARTS, equal);
    const fixed = PARTS.reduce((s, p) => s + p.a, 0);
    const gap = Math.abs(partsCost(PARTS, num) - costBest) / costBest;
    return { best, equal, costBest, costEqual, varCost: costBest - fixed, saving: 1 - costBest / costEqual, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.5);
    const tMax = Math.max(...c.best, ...c.equal) * 1000 * 1.2;
    const P = plotIn(B, top, { lo: 0, hi: 3 }, { lo: 0, hi: tMax }, { left: 56, right: 14, top: 22, bottom: 30 });
    axes(P, { yLabel: 'tolerance ± (μm)', xFmt: () => '' });
    const cMax = Math.max(...PARTS.map((p, i) => Math.max(p.a + p.b / c.best[i], p.a + p.b / c.equal[i]))) * 1.2;
    const Q = plotIn(B, bottom, { lo: 0, hi: 3 }, { lo: 0, hi: cMax }, { left: 56, right: 14, top: 22, bottom: 30 });
    axes(Q, { yLabel: 'cost per part ($)', xFmt: () => '' });
    PARTS.forEach((p, i) => {
      const bars = [[c.equal[i], C.muted], [c.best[i], C.teal]];
      bars.forEach(([t, col], j) => {
        const x0 = i + 0.15 + j * 0.36;
        poly(P, [[x0, 0], [x0 + 0.32, 0], [x0 + 0.32, t * 1000], [x0, t * 1000]], { fill: alpha(col, 0.55), stroke: col });
        const cost = p.a + p.b / t;
        poly(Q, [[x0, 0], [x0 + 0.32, 0], [x0 + 0.32, cost], [x0, cost]], { fill: alpha(col, 0.55), stroke: col });
      });
      label(P, p.name, [i + 0.5, 0], { color: C.muted, dy: 14 });
      label(Q, p.name, [i + 0.5, 0], { color: C.muted, dy: 14 });
    });
    label(P, 'grey: equal split   teal: cheapest', [1.5, tMax], { color: C.muted, dy: -8 });
  },
  law: () => [String.raw`\text{cost} = \sum_i \left(a_i + \frac{b_i}{T_i}\right)`, String.raw`\text{RSS: } T_i = T\,\frac{b_i^{1/3}}{\sqrt{\sum_j b_j^{2/3}}},\quad \text{worst: } T_i = T\,\frac{\sqrt{b_i}}{\sum_j \sqrt{b_j}}`],
  liveRows(state, c) {
    return [
      ...PARTS.map((p, i) => kv(p.name, `±${fig(c.best[i] * 1000)} μm (equal: ±${fig(c.equal[i] * 1000)})`)),
      kv('cost, equal split', `$${fig(c.costEqual)}`),
      kv('Lagrange against gradient descent', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['cheapest set', `$${fig(c.costBest)}`],
      ['equal split', `$${fig(c.costEqual)}`],
      ['saving', `${fig(c.saving * 100)}%`],
      ['stack', `±${fig(state.T * 1000)} μm`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real cost curves come in steps, one process giving way to a slower one as the tolerance tightens, and the constants come from the shop that will make the part. Ask before you tighten.`;
    let title = 'Spend tolerance where it is cheap';
    let body = String.raw`The ground pin costs most to hold tight, so the cheapest set gives it ±${fig(c.best[2] * 1000)} μm and squeezes the spacer to ±${fig(c.best[0] * 1000)} μm. The stack holds the same ±${fig(state.T * 1000)} μm, ${fig(c.saving * 100)}% cheaper than an equal split.`;
    if (state.mode === 'worst') {
      title = 'Worst case costs more';
      body = String.raw`Holding the stack in the worst case leaves each part less room than RSS does, so the same ±${fig(state.T * 1000)} μm costs $${fig(c.costBest)} even split well.`;
    } else if (state.T < 0.07) {
      title = 'Tight stacks get dear fast';
      body = String.raw`Each part's variable cost goes as 1/T, so halving the stack's tolerance doubles it. Here the parts cost $${fig(c.costBest)} at best. A design that needs less precision is often the cheaper fix.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
