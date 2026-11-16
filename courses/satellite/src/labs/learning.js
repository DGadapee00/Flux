import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { learningChecked, slopeFor } from '@flux/subjects/design/cost.js';

/**
 * Learning curve: what a production run of identical craft costs, and what each one costs on
 * average once the development is shared among them.
 *
 * Shows why constellations are cheaper per craft. The development is paid once, and every doubling
 * of the quantity built multiplies the unit cost by the slope S. One craft carries all of its
 * development; a hundred at 85% cost less than half of the first craft each. The run's cost is
 * integrated in closed form and checked against summing the units one by one
 * (packages/subjects/src/design/cost.js).
 *
 * The slopes by quantity are MIT 16.851 Lecture 15's for the aerospace industry. The development and
 * first-unit costs are our own round figures for a 6U craft.
 */
const SCENARIOS = [
  { id: 'one', name: 'One 6U craft', dev: 3, tfu: 1, S: 95, N: 1 },
  { id: 'ten', name: 'Ten of them at 95%', dev: 3, tfu: 1, S: 95, N: 10 },
  { id: 'fifty', name: 'Fifty at 90%', dev: 3, tfu: 1, S: 90, N: 50 },
  { id: 'hundred', name: 'A hundred at 85%', dev: 3, tfu: 1, S: 85, N: 100 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, dev: sc.dev, tfu: sc.tfu, S: sc.S, N: sc.N });
}

const SLIDERS = [['lc-d', 'dev'], ['lc-t', 'tfu'], ['lc-s', 'S'], ['lc-n', 'N']];
const usd = (m) => (m >= 1 ? `USD ${fig(m)}M` : `USD ${fig(m * 1000)}k`);

export default defineLab({
  id: 'learning',
  exam: 'u15',
  title: 'Learning curve',
  hint: 'Go from one craft to a hundred and watch the cost per craft fall below half of the first unit’s. Then set the slope to 100%, no learning, and see how much of the fall was only the development being shared.',
  gapLimit: 0.01,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('one', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'N', lo: 1, hi: 200 }),
  controls() {
    return `
      ${slider('lc-d', 'Development, paid once (USD M)', 3, 0, 10, 0.1)}
      ${slider('lc-t', 'First unit (USD M)', 1, 0.2, 3, 0.05)}
      ${slider('lc-s', 'Learning slope (%)', 95, 80, 100, 1)}
      ${slider('lc-n', 'Craft built', 1, 1, 200, 1)}
      <p class="tiny">Each doubling of the quantity multiplies the unit cost by the slope. Lecture 15's guide: 95% for fewer than 10, 90% for 10 to 50, 85% beyond.</p>`;
  },
  bind(api) {
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of SLIDERS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const N = Math.max(1, Math.round(state.N));
    const c = learningChecked({ dev: state.dev, tfu: state.tfu, S: state.S / 100, N });
    return { ...c, N, guide: slopeFor(N) * 100, avgNoLearning: c.noLearning / N };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const Ns = Array.from({ length: 121 }, (_, i) => Math.round(200 ** (i / 120))).filter((n, i, a) => a.indexOf(n) === i);
    const avg = Ns.map((n) => [n, learningChecked({ dev: state.dev, tfu: state.tfu, S: state.S / 100, N: n }).average]);
    const flat = Ns.map((n) => [n, state.dev / n + state.tfu]);
    const unit = Ns.map((n) => [n, state.tfu * n ** c.b]);
    const hi = Math.max(state.dev + state.tfu, state.tfu) * 1.1;
    const P = plotIn(B, B.free, { lo: 1, hi: 200, log: true }, { lo: 0, hi });
    axes(P, { xLabel: 'craft built', yLabel: 'cost per craft (USD M)' });
    line(P, flat, { color: alpha(C.muted, 0.9), width: 1.5, dash: [5, 4] });
    line(P, unit, { color: C.teal, width: 2 });
    line(P, avg, { color: C.gold, width: 2.5 });
    dot(P, c.N, c.average, { color: C.gold, r: 5 });
    label(P, 'average, with development', [200, avg[avg.length - 1][1]], { color: C.gold, align: 'right', dy: -10 });
    label(P, 'no learning', [200, flat[flat.length - 1][1]], { color: C.muted, align: 'right', dy: -10 });
    label(P, 'this unit', [200, unit[unit.length - 1][1]], { color: C.teal, align: 'right', dy: 14 });
  },
  law: () => [
    String.raw`T_n = T_1\, n^{\,b}, \qquad b = \log_2 S`,
    String.raw`\sum_{n=1}^{N} T_n \approx T_1\,\frac{(N + \tfrac12)^{b+1} - (\tfrac12)^{b+1}}{b + 1}`,
  ],
  liveRows(state, c) {
    return [
      kv('Exponent b', fig(c.b)),
      kv('Production, closed and summed', `${usd(c.closed)}, ${usd(c.sum)}`),
      kv('Programme, with development', usd(c.total)),
      kv('Average per craft', usd(c.average)),
      kv('Average with no learning', usd(c.avgNoLearning)),
      kv('The last craft', usd(c.last)),
      kv('Cumulative-average form', usd(c.cumAverage)),
      kv('Lecture 15’s slope for this many', `${fig(c.guide)}%`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['programme', usd(c.total)],
      ['per craft', usd(c.average)],
      ['last craft', usd(c.last)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Launch and operations, which grow with the number of craft; inflation, and money spent in different years; a learning rate that changes as the line matures; spares; and the cumulative-average form some models use, which gives a different total for the same slope.`;
    if (c.N === 1) return { title: 'One craft carries everything', body: `The single craft costs ${usd(c.total)}: ${usd(state.dev)} of development and ${usd(state.tfu)} to build. Build more, and the development is shared while each unit gets cheaper. ${leavesOut}` };
    return {
      title: `${usd(c.average)} a craft`,
      body: `${c.N} craft at ${fig(state.S)}% cost ${usd(c.sum)} to build and ${usd(c.total)} with development. The last costs ${usd(c.last)}, ${fig(100 * c.last / state.tfu)}% of the first. With no learning each would average ${usd(c.avgNoLearning)}: the rest of the fall is learning. ${leavesOut}`,
    };
  },
  app: false,
});
