import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, fillUnder, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { capability, capabilityNumeric, driftClosed, driftNumeric } from '@flux/subjects/design/tolerancing.js';
import { createRng } from '@flux/subjects/stats/rng.js';

/**
 * Capability: a lathe turning 10 mm pins, its spread against the drawing's limits, and an x̄ chart of
 * subgroups of five as the tool wears.
 *
 * Shows that Cp compares the band with the spread, Cpk also counts how far off centre the process
 * sits, and a control chart catches a drifting mean long before parts leave the band. The share out
 * of limits is found by the normal CDF and again by Simpson's rule; the subgroup where the chart
 * flags the drift, and where parts begin to fall out, by formula and by stepping the mean
 * (packages/subjects/src/design/tolerancing.js).
 */
const NOMINAL = 10;
const N = 5; // parts per subgroup
const SUBGROUPS = 40;

const SCENARIOS = [
  { id: 'centred', name: 'Centred, Cp = 1.33', offset: 0, sigma: 0.0075, tol: 0.03, drift: 0 },
  { id: 'off-centre', name: 'Off centre by 15 μm', offset: 0.015, sigma: 0.0075, tol: 0.03, drift: 0 },
  { id: 'wide', name: 'Spread as wide as the band, Cp = 1', offset: 0, sigma: 0.01, tol: 0.03, drift: 0 },
  { id: 'wear', name: 'Tool wear on a capable process', offset: 0, sigma: 0.006, tol: 0.03, drift: 0.001 },
  { id: 'wear-tight', name: 'The same wear with Cp = 1.33', offset: 0, sigma: 0.0075, tol: 0.03, drift: 0.001 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, offset: sc.offset, sigma: sc.sigma, tol: sc.tol, drift: sc.drift });
}

const um = (mm) => mm * 1000;

export default defineLab({
  id: 'capability',
  exam: 'u2',
  title: 'Capability',
  hint: 'Move the process off centre: Cp stays put while Cpk and the rejects tell the truth. Add tool wear: a capable process gives the chart time to flag it before pins fall out.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('centred', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'offset', lo: -0.03, hi: 0.03 }),
  controls() {
    return `
      ${slider('ca-o', 'process mean off nominal (mm)', 0, -0.03, 0.03, 0.0005)}
      ${slider('ca-s', 'process spread σ (mm)', 0.0075, 0.003, 0.02, 0.0005)}
      ${slider('ca-t', 'drawing tolerance ±(mm)', 0.03, 0.01, 0.06, 0.001)}
      ${slider('ca-d', 'tool wear per subgroup (mm)', 0, 0, 0.003, 0.0001)}
      <p class="tiny">10 mm pins, measured five at a time. The chart’s limits are set from the starting mean and σ.</p>`;
  },
  bind(api) {
    bindSlider('ca-o', (s, v) => { s.offset = v; }, api);
    bindSlider('ca-s', (s, v) => { s.sigma = v; }, api);
    bindSlider('ca-t', (s, v) => { s.tol = v; }, api);
    bindSlider('ca-d', (s, v) => { s.drift = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['ca-o', state.offset], ['ca-s', state.sigma], ['ca-t', state.tol], ['ca-d', state.drift]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const mu = NOMINAL + state.offset;
    const lsl = NOMINAL - state.tol;
    const usl = NOMINAL + state.tol;
    const spec = { mu, sigma: state.sigma, lsl, usl };
    const a = capability(spec);
    const n = capabilityNumeric(spec);
    let gap = Math.abs(n.out - a.out);
    let flag = null;
    let firstOut = null;
    if (state.drift > 0) {
      const d = { mu0: mu, sigma: state.sigma, usl, delta: state.drift, n: N };
      const dc = driftClosed(d);
      const dn = driftNumeric(d);
      if (dc.flag !== dn.flag || dc.out !== dn.out) gap = Math.max(gap, 1);
      flag = dc.flag;
      firstOut = dc.out;
    }
    // One seeded run of subgroup means, for the chart.
    const rng = createRng(1);
    const means = Array.from({ length: SUBGROUPS }, (_, k) => [k + 1, mu + (k + 1) * state.drift + rng.normal(0, state.sigma / Math.sqrt(N))]);
    const ucl = mu + (3 * state.sigma) / Math.sqrt(N);
    const lcl = mu - (3 * state.sigma) / Math.sqrt(N);
    return { ...a, mu, lsl, usl, ppm: a.out * 1e6, flag, firstOut, means, ucl, lcl, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.45);
    const lo = NOMINAL - state.tol * 1.6;
    const hi = NOMINAL + state.tol * 1.6;
    const P = plotIn(B, top, { lo: um(lo - NOMINAL), hi: um(hi - NOMINAL) }, { lo: 0, hi: 1.25 });
    axes(P, { xLabel: 'pin diameter, μm from 10 mm', yFmt: () => '' });
    const curve = [];
    const bad = [[], []];
    for (let i = 0; i <= 200; i++) {
      const x = lo + (i / 200) * (hi - lo);
      const f = Math.exp(-0.5 * ((x - c.mu) / state.sigma) ** 2);
      curve.push([um(x - NOMINAL), f]);
      if (x <= c.lsl) bad[0].push([um(x - NOMINAL), f]);
      if (x >= c.usl) bad[1].push([um(x - NOMINAL), f]);
    }
    fillUnder(P, curve, alpha(C.teal, 0.25));
    for (const b of bad) if (b.length > 1) fillUnder(P, b, alpha(C.red, 0.6));
    line(P, curve, { color: C.teal, width: 2 });
    for (const [x, name] of [[c.lsl, 'LSL'], [c.usl, 'USL']]) {
      seg(P, [um(x - NOMINAL), 0], [um(x - NOMINAL), 1.15], { color: C.pink, width: 2 });
      label(P, name, [um(x - NOMINAL), 1.15], { color: C.pink, dy: -8 });
    }
    // x̄ chart.
    const ys = c.means.map(([, m]) => m);
    const yLo = Math.min(c.lcl, ...ys) - state.sigma * 0.3;
    const yHi = Math.max(c.ucl, ...ys, state.drift > 0 ? c.usl : -Infinity) + state.sigma * 0.3;
    const Q = plotIn(B, bottom, { lo: 0, hi: SUBGROUPS + 1 }, { lo: um(yLo - NOMINAL), hi: um(yHi - NOMINAL) });
    axes(Q, { xLabel: 'subgroup', yLabel: 'mean of five (μm)' });
    for (const [y, color, name] of [[c.ucl, C.gold, 'UCL'], [c.lcl, C.gold, 'LCL'], [c.mu, alpha(C.text, 0.5), 'start']]) {
      seg(Q, [0, um(y - NOMINAL)], [SUBGROUPS + 1, um(y - NOMINAL)], { color, width: 1.2, dash: [6, 4] });
      label(Q, name, [SUBGROUPS + 1, um(y - NOMINAL)], { color, align: 'right', dy: -7 });
    }
    if (state.drift > 0 && c.usl <= yHi) seg(Q, [0, um(c.usl - NOMINAL)], [SUBGROUPS + 1, um(c.usl - NOMINAL)], { color: C.pink, width: 1.5 });
    line(Q, c.means.map(([k, m]) => [k, um(m - NOMINAL)]), { color: alpha(C.teal, 0.6), width: 1 });
    for (const [k, m] of c.means) dot(Q, k, um(m - NOMINAL), { color: m > c.ucl || m < c.lcl ? C.red : C.teal, r: 3 });
    if (c.flag && c.flag <= SUBGROUPS) {
      seg(Q, [c.flag, um(yLo - NOMINAL)], [c.flag, um(yHi - NOMINAL)], { color: C.yellow, width: 1.2, dash: [3, 3] });
      label(Q, 'chart flags', [c.flag, um(yHi - NOMINAL)], { color: C.yellow, align: 'left', dx: 4, dy: 8 });
    }
  },
  law: () => [String.raw`C_p = \frac{\text{USL} - \text{LSL}}{6\sigma},\qquad C_{pk} = \frac{\min(\text{USL} - \mu,\ \mu - \text{LSL})}{3\sigma}`, String.raw`\text{UCL} = \mu_0 + \frac{3\sigma}{\sqrt n}`],
  liveRows(state, c) {
    return [
      kv('limits', `${fig(c.lsl)} to ${fig(c.usl)} mm`),
      kv('process mean', `${fig(c.mu)} mm`),
      kv('pins out of limits', `${fig(c.ppm)} per million`),
      kv('chart flags the drift at subgroup', c.flag ? String(c.flag) : 'no drift'),
      kv('pins start to fall out at subgroup', c.firstOut ? String(c.firstOut) : 'no drift'),
      kv('closed form against Simpson', `${fig(c.gap * 1e6)} ppm`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['$C_p$', fig(c.cp)],
      ['$C_{pk}$', fig(c.cpk)],
      ['out of limits', `${fig(c.ppm)} ppm`],
      ['chart flags at', c.flag ? `subgroup ${c.flag}` : 'no drift'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The spread is normal and steady, and the gauge reads true. Real gauges have their own spread, and a gauge study comes before any capability number.`;
    let title = 'Capable and centred';
    let body = String.raw`The band is ${fig(c.cp)} times as wide as six standard deviations of the process, and the mean sits in the middle, so Cpk equals Cp and ${fig(c.ppm)} pins in a million fall out.`;
    if (state.drift > 0 && c.flag < c.firstOut) {
      title = 'The chart sees wear coming';
      body = String.raw`The mean creeps up ${fig(um(state.drift))} μm a subgroup. A mean of five varies only σ/√5, so the chart flags the shift at subgroup ${c.flag}, before pins start to fall out of limits at subgroup ${c.firstOut}. Room between the process and the limits buys that time.`;
    } else if (state.drift > 0) {
      title = 'Too little room for the chart';
      body = String.raw`The chart needs the mean to move $3\sigma/\sqrt5$ before it flags, at subgroup ${c.flag}. With Cp = ${fig(c.cp)} there is less room than that, so pins start to fall out at subgroup ${c.firstOut}, first. A more capable process, or run rules that react to smaller shifts, would catch it in time.`;
    } else if (Math.abs(state.offset) > 0.1 * state.tol) {
      title = 'Off centre: Cp hides it, Cpk shows it';
      body = String.raw`Cp is still ${fig(c.cp)}: it compares widths and ignores where the process sits. Cpk is ${fig(c.cpk)}, and ${fig(c.ppm)} pins in a million fall out on the near side.`;
    } else if (c.cp < 1.1) {
      title = 'No room to spare';
      body = String.raw`With Cp = ${fig(c.cp)}, the process fills the band. Even centred, ${fig(c.ppm)} pins in a million fall out, and any drift adds to it fast.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
