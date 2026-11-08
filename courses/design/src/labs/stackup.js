import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, fillUnder, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { stackClosed, stackNumeric } from '@flux/subjects/design/tolerancing.js';

/**
 * Stack-up: n parts stacked end to end, each ±T about its nominal, and the spread of their total.
 *
 * Shows that the worst case, ±nT, grows with n, while the spread of real assemblies grows with √n,
 * because independent parts almost never all land at the same extreme. The closed form is root-sum-
 * square; the second method convolves the n parts' size distributions exactly (packages/subjects/src/
 * design/tolerancing.js). `gap` compares the spreads, the reach of a flat-spread stack with the worst
 * case, and for normal parts the share outside the assembly limit.
 */
const SCENARIOS = [
  { id: 'five-normal', name: 'Five parts, normal spread', n: 5, T: 0.1, S: 0.3, kind: 'normal' },
  { id: 'five-flat', name: 'Five parts, flat spread', n: 5, T: 0.1, S: 0.3, kind: 'uniform' },
  { id: 'two-flat', name: 'Two parts, flat spread', n: 2, T: 0.1, S: 0.15, kind: 'uniform' },
  { id: 'eight', name: 'Eight parts against a tight limit', n: 8, T: 0.05, S: 0.2, kind: 'normal' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, n: sc.n, T: sc.T, S: sc.S, kind: sc.kind });
}

/** A share as a percentage, per million when it is under 0.1%, and in words when it is tinier still. */
const share = (x) => (x < 1e-8 ? 'under 1 in 100 million' : x < 0.001 ? `${fig(x * 1e6)} per million` : `${fig(x * 100)}%`);

const spec = (s) => ({ n: Math.round(s.n), T: s.T, S: s.S, kind: s.kind });

export default defineLab({
  id: 'stackup',
  exam: 'u1',
  title: 'Stack-up',
  hint: 'Add parts: the worst case grows as n, but real stacks spread only as √n. Switch to a flat spread: few parts stack into a triangle, many into a bell.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('five-normal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 0.02, hi: 0.2 }),
  controls() {
    return `
      <label class="field"><span>Each part’s sizes</span><select id="st-kind"><option value="normal">Normal, band = ±3σ</option><option value="uniform">Flat across the band</option></select></label>
      ${slider('st-n', 'number of parts n', 5, 2, 8, 1)}
      ${slider('st-T', 'each part’s tolerance ±T (mm)', 0.1, 0.02, 0.2, 0.005)}
      ${slider('st-S', 'assembly limit ±S (mm)', 0.3, 0.05, 1, 0.01)}
      <p class="tiny">Parts are made independently. The stack’s total is the sum of their errors.</p>`;
  },
  bind(api) {
    document.getElementById('st-kind')?.addEventListener('change', (e) => {
      api.slice().kind = e.target.value;
      api.bump();
    });
    bindSlider('st-n', (s, v) => { s.n = v; }, api);
    bindSlider('st-T', (s, v) => { s.T = v; }, api);
    bindSlider('st-S', (s, v) => { s.S = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('st-kind');
    if (sel) sel.value = state.kind;
    for (const [id, val] of [['st-n', state.n], ['st-T', state.T], ['st-S', state.S]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = spec(state);
    const a = stackClosed(p);
    const b = stackNumeric(p);
    const h = b.h;
    let gap = Math.abs(b.sd - a.sd) / a.sd;
    if (p.kind === 'uniform') gap = Math.max(gap, Math.abs(b.reach - a.worst) / a.worst);
    else gap = Math.max(gap, Math.abs(b.outside - a.outside));
    const pdf = b.dist.w.map((w, i) => [(b.dist.k0 + i) * h, w / h]).filter(([, f]) => f > 1e-6 / h);
    return { ...a, n: p.n, exactOutside: b.outside, pdf, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.32);
    // The stack: n blocks with their tolerance shown as a hatch at each joint.
    const S = sceneIn(B, top, { x0: -0.5, x1: c.n + 0.5, y0: -0.2, y1: 1.1 }, 12);
    for (let i = 0; i < c.n; i++) {
      poly(S, [[i + 0.04, 0], [i + 0.96, 0], [i + 0.96, 0.8], [i + 0.04, 0.8]], { fill: alpha(C.gold, 0.25), stroke: C.gold, width: 1.5 });
      label(S, `±${fig(state.T)}`, [i + 0.5, 0.4], { color: C.gold });
    }
    seg(S, [0, -0.1], [c.n, -0.1], { color: C.muted, width: 1.5 });
    label(S, 'total', [c.n / 2, -0.1], { color: C.muted, dy: 10 });
    const reach = Math.max(c.worst, c.rss, state.S) * 1.12;
    const fmax = Math.max(...c.pdf.map(([, f]) => f));
    const P = plotIn(B, bottom, { lo: -reach, hi: reach }, { lo: 0, hi: fmax * 1.2 });
    axes(P, { xLabel: 'error in the total (mm)', yLabel: 'share of stacks' , yFmt: () => '' });
    const inside = c.pdf.filter(([x]) => Math.abs(x) <= state.S);
    fillUnder(P, c.pdf, alpha(C.red, 0.35));
    if (inside.length > 1) fillUnder(P, inside, alpha(C.teal, 0.35));
    line(P, c.pdf, { color: C.teal, width: 2 });
    // The normal approximation, for comparison.
    const approx = [];
    for (let i = 0; i <= 120; i++) {
      const x = -reach + (i / 120) * 2 * reach;
      approx.push([x, Math.exp(-0.5 * (x / c.sd) ** 2) / (c.sd * Math.sqrt(2 * Math.PI))]);
    }
    line(P, approx, { color: alpha(C.text, 0.5), width: 1, dash: [4, 4] });
    for (const [x, color, name] of [[c.worst, C.pink, 'worst case'], [c.rss, C.yellow, 'RSS ±3σ'], [state.S, C.text, 'limit']]) {
      seg(P, [x, 0], [x, fmax * 1.15], { color, width: 1.5, dash: name === 'limit' ? null : [6, 4] });
      seg(P, [-x, 0], [-x, fmax * 1.15], { color, width: 1.5, dash: name === 'limit' ? null : [6, 4] });
    }
    label(P, 'worst', [c.worst, fmax * 1.15], { color: C.pink, dy: -8 });
    label(P, 'RSS', [c.rss, fmax * 1.15], { color: C.yellow, dy: -8 });
    label(P, 'limit', [-state.S, fmax * 1.15], { color: C.text, dy: -8 });
  },
  law: () => [String.raw`T_\text{worst} = \sum_i T_i = nT`, String.raw`T_\text{RSS} = \sqrt{\textstyle\sum_i T_i^2} = \sqrt n\,T`],
  liveRows(state, c) {
    return [
      kv('spread of one part $\\sigma$', `${fig(c.sd / Math.sqrt(c.n))} mm`),
      kv('spread of the stack $\\sigma\\sqrt n$', `${fig(c.sd)} mm`),
      kv('outside the limit, exact', share(c.exactOutside)),
      kv('outside the limit, normal estimate', share(c.outside)),
      kv('RSS against convolution', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['worst case', `±${fig(c.worst)} mm`],
      ['RSS (±3σ)', `±${fig(c.rss)} mm`],
      ['limit', `±${fig(state.S)} mm`],
      ['stacks outside', share(c.exactOutside)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The parts are independent and centred in their bands. Parts cut from one bar or on one worn tool err together, and then the worst case comes back.`;
    let title = 'The worst case almost never happens';
    let body = String.raw`All ${c.n} parts at the same extreme gives ±${fig(c.worst)} mm, but independent errors mostly cancel: 99.7% of stacks fall within ±${fig(c.rss)} mm.`;
    if (state.kind === 'uniform' && c.n <= 3) {
      title = 'A few flat parts make a triangle';
      body = String.raw`Each part is equally likely anywhere in its band, but two of them add to a triangle, peaked at zero. With more parts the total turns into a bell, which is why RSS works.`;
    } else if (c.worst > state.S && c.exactOutside < 0.003) {
      title = 'Worst case says no, statistics say yes';
      body = String.raw`The worst case, ±${fig(c.worst)} mm, breaks the ±${fig(state.S)} mm limit, yet only ${share(c.exactOutside)} of stacks do. Designing to RSS saves tolerance on every part, at the price of a few rejects.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
