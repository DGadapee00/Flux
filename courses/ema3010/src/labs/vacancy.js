import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { KB, fraction, freeEnergy, vacancies } from '@flux/subjects/matsci/vacancies.js';

/**
 * Vacancy: the fraction of lattice sites left empty, as an equilibrium between the energy each
 * vacancy costs and the disorder it adds.
 *
 * Shows that vacancies are not flaws a perfect process would remove: the free energy per site is
 * lowest at a fraction c* = 1/(1 + e^{Q/kT}), not at zero. On Arrhenius axes, ln c* against 1/T, the
 * fraction is a straight line of slope −Q/k. The minimum is checked by a numerical search, and Q by
 * a least-squares line through the Arrhenius plot (packages/subjects/src/matsci/vacancies.js).
 */
const SCENARIOS = [
  { id: 'hot', name: 'Q = 1.0 eV at 1000 K', Q: 1, T: 1000 },
  { id: 'room', name: 'The same at room temperature', Q: 1, T: 300 },
  { id: 'easy', name: 'A low formation energy, Q = 0.7 eV, at 900 K', Q: 0.7, T: 900 },
  { id: 'hard', name: 'A high formation energy, Q = 1.5 eV, at 1300 K', Q: 1.5, T: 1300 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Q: sc.Q, T: sc.T });
}

const e = (v) => v.toExponential(2);

export default defineLab({
  id: 'vacancy',
  exam: 'u2',
  title: 'Vacancy',
  hint: 'Find the bottom of the free-energy curve: it is not at zero vacancies. Then cool the crystal and watch the fraction fall along a straight Arrhenius line.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('hot', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 200, hi: 1500 }),
  controls() {
    return `
      ${slider('vc-Q', 'Formation energy Q_v (eV)', 1, 0.4, 2, 0.01)}
      ${slider('vc-T', 'Temperature T (K)', 1000, 200, 1500, 5)}
      <p class="tiny">Typical metals have Q_v between about 0.5 and 2 eV. Counts per cm³ use copper's 8.49 × 10²² sites per cm³.</p>`;
  },
  bind(api) {
    bindSlider('vc-Q', (s, v) => { s.Q = v; }, api);
    bindSlider('vc-T', (s, v) => { s.T = v; }, api);
  },
  syncControls(state) {
    for (const [id, v] of [['vc-Q', state.Q], ['vc-T', state.T]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    return vacancies({ Q: state.Q, T: state.T });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [left, right] = split(B.free, 0.5);
    // Free energy per site, in units of kT·c*, against c/c*: the same curve at every Q and T.
    const P = plotIn(B, left, { lo: -2, hi: 2 }, { lo: -1.2, hi: 2 });
    axes(P, { xLabel: 'log₁₀ (c / c*)', yLabel: 'g / (kT c*)' });
    const unit = KB * state.T * c.c;
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const lx = -2 + (4 * i) / 200;
      const cc = c.c * 10 ** lx;
      const g = freeEnergy(cc, state.Q, state.T) / unit;
      if (g <= 2) pts.push([lx, g]);
    }
    seg(P, [-2, 0], [2, 0], { color: alpha(C.text, 0.3), width: 1, dash: [4, 4] });
    line(P, pts, { color: C.teal, width: 2.5 });
    dot(P, Math.log10(c.cMin / c.c), freeEnergy(c.cMin, state.Q, state.T) / unit, { color: C.yellow, r: 6, ring: C.text });
    label(P, 'lowest here: c = c*', [0, -1.0], { color: C.yellow, align: 'left', dx: 12 });
    label(P, 'no vacancies: g = 0', [-1.9, 0], { color: C.muted, align: 'left', dy: -10 });
    // The Arrhenius plot: ln c* against 1000/T is a line of slope −Q/(1000 k).
    const R = plotIn(B, right, { lo: 0.6, hi: 5 }, { lo: -60, hi: 0 });
    axes(R, { xLabel: '1000 / T (1/K)', yLabel: 'ln c*' });
    const arr = [];
    for (let i = 0; i <= 100; i++) {
      const x = 0.6 + (4.4 * i) / 100;
      arr.push([x, Math.max(-60, Math.log(fraction(state.Q, 1000 / x)))]);
    }
    line(R, arr, { color: C.gold, width: 2.5 });
    dot(R, 1000 / state.T, Math.max(-60, Math.log(c.c)), { color: C.yellow, r: 6, ring: C.text });
    label(R, `slope −Q/k: ${fig(c.Qfit)} eV`, [2.8, -8], { color: C.gold });
  },
  law: () => [String.raw`g(c) = cQ_v + kT\,[c\ln c + (1 - c)\ln(1 - c)]`, String.raw`c^* = \frac{1}{1 + e^{Q_v/kT}} \approx e^{-Q_v/kT}`],
  liveRows(state, c) {
    return [
      kv('Equilibrium fraction c*', e(c.c)),
      kv('Approximation e^(−Q/kT)', e(c.approx)),
      kv('Second route: minimum of g', e(c.cMin)),
      kv('Vacancies per cm³ (copper’s sites)', e(c.perCm3)),
      kv('Q from the Arrhenius line', `${fig(c.Qfit)} eV`),
      kv('Largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['T', `${fig(state.T)} K`],
      ['fraction', e(c.c)],
      ['per cm³', e(c.perCm3)],
      ['Q_v', `${fig(state.Q)} eV`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Vibrational entropy, which multiplies c* by a factor of a few, and the time vacancies take to reach equilibrium: quench a hot crystal fast and it keeps more than its share.`;
    let title = 'Some vacancies lower the free energy';
    let body = `Each vacancy costs ${fig(state.Q)} eV but adds disorder. The first few add disorder far faster than they add energy, so the free energy falls below zero before it rises: its minimum is at c* = ${e(c.c)}, ${e(c.perCm3)} vacancies per cm³ at ${fig(state.T)} K.`;
    if (state.T < 400) {
      title = 'Cold: very few, but never none';
      body = `At ${fig(state.T)} K the fraction is only ${e(c.c)}, but it is not zero at any temperature above absolute zero. Those vacancies are what let atoms move: diffusion slows enormously as a metal cools.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
