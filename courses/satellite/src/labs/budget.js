import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { SENSORS, budgetChecked } from '@flux/subjects/mechanics/pointingbudget.js';

/**
 * Pointing budget: where the boresight lands, from the sensor, the control jitter and two biases.
 *
 * Shows that random errors and biases add differently. Random terms add in quadrature, so the
 * largest one rules and halving a small one gains almost nothing; biases add straight and a
 * calibration removes them. The sensor sets the floor: a star tracker reaches hundredths of a
 * degree, a Sun sensor tenths. The chance of landing inside the requirement cone comes from a
 * Poisson–gamma series; the second method integrates the offset normal over the disc
 * (packages/subjects/src/mechanics/pointingbudget.js).
 *
 * Sensor accuracies are NASA's small spacecraft report's (Tables 5-5, 5-7, 5-8). The jitter,
 * misalignment and thermal figures are this course's round numbers.
 */
const SCENARIOS = [
  { id: 'star', name: 'A star tracker against a 0.1° cone', sensor: 'star', jitter: 0.02, misalign: 0.03, thermal: 0.01, R: 0.1 },
  { id: 'sun', name: 'A Sun sensor against the same cone', sensor: 'sun', jitter: 0.02, misalign: 0.03, thermal: 0.01, R: 0.1 },
  { id: 'horizon', name: 'A horizon sensor against a 1° cone', sensor: 'horizon', jitter: 0.02, misalign: 0.03, thermal: 0.01, R: 1 },
  { id: 'misaligned', name: 'A star tracker mounted 0.08° off', sensor: 'star', jitter: 0.02, misalign: 0.08, thermal: 0.01, R: 0.1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, sensor: sc.sensor, jitter: sc.jitter, misalign: sc.misalign, thermal: sc.thermal, R: sc.R });
}

const KEYS = [['bg-j', 'jitter'], ['bg-m', 'misalign'], ['bg-t', 'thermal'], ['bg-r', 'R']];
const deg = (x) => `${fig(x)}°`;
/** A sensor's 1σ: seconds of arc below a hundredth of a degree. */
const accuracy = (d) => (d < 0.01 ? `${fig(d * 3600)}″` : deg(d));
const pct = (p) => (p > 0.99999 ? 'over 99.999%' : `${fig(100 * p)}%`);
const circle = (cx, cy, r, n = 96) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);

export default defineLab({
  id: 'budget',
  exam: 'u3',
  title: 'Pointing budget',
  hint: 'Swap the star tracker for a Sun sensor and watch the spread swamp the 0.1° cone. Then, with the misaligned tracker, calibrate the mounting error away.',
  gapLimit: 1e-7,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('star', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'R', lo: 0.02, hi: 2 }),
  controls() {
    return `
      <label class="field"><span>Attitude sensor</span><select id="bg-s">${Object.entries(SENSORS).map(([k, s]) => `<option value="${k}">${s.name}, ${accuracy(s.sigma)} 1σ</option>`).join('')}</select></label>
      ${slider('bg-j', 'Control jitter, 1σ (°)', 0.02, 0, 0.2, 0.001)}
      ${slider('bg-m', 'Sensor misalignment (°)', 0.03, 0, 0.2, 0.001)}
      ${slider('bg-t', 'Thermal bending (°)', 0.01, 0, 0.1, 0.001)}
      ${slider('bg-r', 'Requirement cone, half-angle (°)', 0.1, 0.02, 2, 0.01)}
      <p class="tiny">Random terms are independent and normal on each cross-axis. Biases are fixed and taken to lean the same way. Sensor figures are 3σ catalogue accuracies divided by 3.</p>`;
  },
  bind(api) {
    document.getElementById('bg-s')?.addEventListener('change', (e) => {
      api.slice().sensor = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['bg-s', 'sensor'], ...KEYS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return budgetChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.62) : [B.free, null];
    // The target plane: the requirement cone and the boresight's spread about its bias.
    const reach = 1.15 * Math.max(state.R, c.bias + 3 * c.sigma);
    const P = sceneIn(B, top, { x0: -reach, x1: reach, y0: -reach, y1: reach }, 24);
    poly(P, circle(0, 0, state.R), { fill: alpha(C.green, 0.12), stroke: C.green, width: 2 });
    for (const [k, a] of [[3, 0.08], [2, 0.12], [1, 0.18]]) {
      poly(P, circle(c.bias, 0, k * c.sigma), { fill: alpha(C.teal, a), stroke: alpha(C.teal, 0.7), width: 1, dash: [4, 3] });
    }
    seg(P, [-reach, 0], [reach, 0], { color: alpha(C.muted, 0.4), width: 1 });
    seg(P, [0, -reach], [0, reach], { color: alpha(C.muted, 0.4), width: 1 });
    if (c.bias > 0) seg(P, [0, 0], [c.bias, 0], { color: C.pink, width: 2.5 });
    dot(P, 0, 0, { color: C.green, r: 4 });
    dot(P, c.bias, 0, { color: C.pink, r: 4 });
    label(P, `cone ${deg(state.R)}`, [0, state.R], { color: C.green, dy: -10 });
    label(P, '1σ, 2σ, 3σ', [c.bias, -3 * c.sigma], { color: C.teal, dy: 12 });
    if (!bottom) return;
    // The budget, term by term, against the requirement.
    const rows = [
      ['sensor, 3σ', c.sensorSigma * 3, C.blue],
      ['jitter, 3σ', state.jitter * 3, C.blue],
      ['3σ, in quadrature', 3 * c.sigma, C.teal],
      ['misalignment', state.misalign, C.pink],
      ['thermal', state.thermal, C.pink],
      ['bias + 3σ', c.threeSigma, c.threeSigma <= state.R ? C.green : C.red],
    ];
    const hi = 1.15 * Math.max(state.R, ...rows.map((r) => r[1]));
    const Q = plotIn(B, bottom, { lo: 0, hi }, { lo: 0, hi: rows.length }, { left: 118, right: 14, top: 10, bottom: 40 });
    axes(Q, { xLabel: 'degrees', yFmt: () => '' });
    rows.forEach(([name, v, color], i) => {
      const y = rows.length - i - 0.5;
      poly(Q, [[0, y - 0.32], [v, y - 0.32], [v, y + 0.32], [0, y + 0.32]], { fill: alpha(color, 0.75), stroke: null });
      label(Q, name, [0, y], { color: C.text, align: 'right', dx: -6 });
    });
    seg(Q, [state.R, 0], [state.R, rows.length], { color: C.green, width: 2, dash: [5, 4] });
  },
  law: () => [
    String.raw`\sigma = \sqrt{\sigma_\text{sensor}^2 + \sigma_\text{jitter}^2}`,
    String.raw`b = b_\text{mount} + b_\text{thermal}`,
    String.raw`P(r < R) = \sum_n e^{-\lambda}\frac{\lambda^n}{n!}\,P\!\left(n+1, \tfrac{R^2}{2\sigma^2}\right)`,
    String.raw`\lambda = \frac{b^2}{2\sigma^2}`,
  ],
  liveRows(state, c) {
    return [
      kv('Spread per axis, 1σ', deg(c.sigma)),
      kv('Bias', deg(c.bias)),
      kv('Bias + 3σ, the linear budget', `${deg(c.threeSigma)} against ${deg(state.R)}`),
      kv('Inside the cone, series', pct(c.p)),
      kv('Inside the cone, integrated', pct(c.pNum)),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['inside', pct(c.p)],
      ['spread', deg(c.sigma)],
      ['bias', deg(c.bias)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Errors that are not normal or not independent, a sensor whose error differs along its boresight and across it, jitter faster than the payload's exposure, and biases that partly cancel instead of lining up.`;
    const sensor = SENSORS[state.sensor].name.toLowerCase();
    if (c.sensorSigma > 0.5 * state.R) {
      return { title: 'The sensor sets the floor', body: `The ${sensor} alone spreads ${deg(c.sensorSigma)} per axis against a ${deg(state.R)} cone, so the boresight lands inside only ${pct(c.p)} of the time. No controller can point better than it can measure: choose a better sensor or a wider cone. ${leavesOut}` };
    }
    if (c.bias > 0.5 * state.R) {
      return { title: 'The bias eats the cone', body: `${deg(c.bias)} of fixed error moves the whole spread off centre, leaving ${pct(c.p)} inside the ${deg(state.R)} cone. Biases add straight and do not average away, but a calibration against stars or a ground target can measure and remove them. ${leavesOut}` };
    }
    return { title: 'Random terms add in quadrature', body: `The random terms combine to ${deg(c.sigma)} per axis, dominated by the largest. The linear budget, bias + 3σ = ${deg(c.threeSigma)}, is conservative: the boresight lands inside the ${deg(state.R)} cone ${pct(c.p)} of the time. ${leavesOut}` };
  },
  app: false,
});
