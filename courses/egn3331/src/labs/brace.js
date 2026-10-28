import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { circleArea, permanentSet } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a building brace rod stretched past yield does not spring all the way back.
 * The elongation is PL/AE while the stress stays under yield, and the permanent set appears
 * only after the corner.
 *
 * Cited: the AISC specification takes E = 29,000 ksi for structural steel, and ASTM A36
 * requires a minimum yield of 36 ksi. The 3/4 in diameter and the 10 ft length are assumed.
 * Second method: walk the load in small steps, adding L dσ / E_tan, and compare with the
 * closed-form elongation.
 */

export const BRACE = {
  E: 29000 * 1000 * PA_PER_PSI,
  Fy: 36 * 1000 * PA_PER_PSI,
  d: 0.75 * M_PER_IN,
  L: 10 * M_PER_FT,
  Et: 0.05 * 29000 * 1000 * PA_PER_PSI,
};

const A = circleArea(BRACE.d);
const Py = BRACE.Fy * A;
const OUT = 'The rod is modelled as a uniform bar with a sharp yield point and a constant tangent modulus. A real A36 bar yields gradually, the threads are weaker than the shank, and a brace also bends if the load is not centred. Creep and residual stress from fabrication are left out. The diameter and the length are assumed.';

const SCENARIOS = [
  { id: 'service', name: 'Service load, 8 kip', P: 8 * 1000 * N_PER_LBF },
  { id: 'yield', name: 'At the yield load', P: Py },
  { id: 'overload', name: 'Past yield, 20 kip', P: 20 * 1000 * N_PER_LBF },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, L: BRACE.L });
}

function walk(p0, p1, L, Etan) {
  const steps = 2000;
  const dp = (p1 - p0) / steps;
  let delta = 0;
  for (let i = 0; i < steps; i++) delta += (L / (A * Etan)) * dp;
  return delta;
}

/** Closed form, and the same elongation summed in load steps split at yield. */
function elongation(P, L) {
  const stress = P / A;
  const ey = BRACE.Fy / BRACE.E;
  const eps = stress <= BRACE.Fy ? stress / BRACE.E : ey + (stress - BRACE.Fy) / BRACE.Et;
  const delta = eps * L;
  const marched = P <= Py ? walk(0, Math.max(P, 0), L, BRACE.E) : walk(0, Py, L, BRACE.E) + walk(Py, P, L, BRACE.Et);
  const set = permanentSet(eps, stress, BRACE.E);
  return { stress, eps, delta, marched, set, ey, gap: Math.abs(delta - marched) / Math.max(Math.abs(delta), 1e-12) };
}

export { A as braceArea, Py as braceYieldLoad };

export default defineLab({
  id: 'brace',
  exam: 'u2',
  title: 'Brace rod',
  app: true,
  hint: 'A brace that yields keeps a stretch after the load comes off. Below yield it does not.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('service', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'P', lo: 0, hi: 1.4 * Py }),
  controls() {
    return `
      ${slider('br-P', 'axial load (kip)', 8, 0, 24, 0.2)}
      ${slider('br-L', 'length (ft)', 10, 4, 20, 0.5)}
      <p class="tiny">Cited: AISC takes E = 29,000 ksi for structural steel. ASTM A36 minimum yield is 36 ksi. The 3/4 in diameter and the 10 ft length are assumed. Tangent modulus after yield is taken as 5% of E.</p>`;
  },
  bind(api) {
    bindSlider('br-P', (s, v) => { s.P = v * 1000 * N_PER_LBF; }, api);
    bindSlider('br-L', (s, v) => { s.L = v * M_PER_FT; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    showField('br-P', true);
    showField('br-L', true);
    set('br-P', state.P / (1000 * N_PER_LBF));
    set('br-L', state.L / M_PER_FT);
  },
  compute(state) {
    const r = elongation(state.P, state.L);
    return { ...r, P: state.P, L: state.L, A, Py, Fy: BRACE.Fy, E: BRACE.E };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const pHi = 24 * 1000 * N_PER_LBF;
    const dHi = elongation(pHi, c.L).delta / M_PER_IN;
    const P = plotIn(B, B.free, { lo: 0, hi: 24 }, { lo: 0, hi: Math.max(dHi, 0.2) });
    axes(P, { xLabel: 'load (kip)', yLabel: 'elongation (in)' });
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const load = (pHi * i) / 48;
      pts.push([load / (1000 * N_PER_LBF), elongation(load, c.L).delta / M_PER_IN]);
    }
    line(P, pts, { color: C.teal, width: 3 });
    const pyKip = c.Py / (1000 * N_PER_LBF);
    const yEl = elongation(c.Py, c.L).delta / M_PER_IN;
    line(P, [[pyKip, 0], [pyKip, yEl]], { color: alpha(C.gold, 0.9), width: 2, dash: [5, 4] });
    dot(P, c.P / (1000 * N_PER_LBF), c.delta / M_PER_IN, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\delta = PL/AE`, String.raw`\sigma = P/A`],
  liveRows(state, c) {
    return [
      kv('area', `${fig(c.A / M_PER_IN ** 2)} in²`),
      kv('yield load', `${fig(c.Py / (1000 * N_PER_LBF))} kip`),
      kv('stress', `${fig(c.stress / (1000 * PA_PER_PSI))} ksi`),
      kv('permanent set', `${fig(c.set * 1e6)} µε`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['elongation', `${fig(c.delta / M_PER_IN)} in`],
      ['stress', `${fig(c.stress / (1000 * PA_PER_PSI))} ksi`],
      ['strain', `${fig(c.eps * 1e6)} µε`],
      ['set if released', `${fig(c.set * 1e6)} µε`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const kip = c.P / (1000 * N_PER_LBF);
    const ksi = c.stress / (1000 * PA_PER_PSI);
    if (c.stress > c.Fy) {
      return {
        title: 'It will not spring all the way back',
        body: String.raw`At ${fig(kip)} kip the stress is ${fig(ksi)} ksi, above the 36 ksi minimum yield. Releasing the load leaves a permanent set of ${fig(c.set * 1e6)} µε. The gold line marks the yield load, ${fig(c.Py / (1000 * N_PER_LBF))} kip.`,
      };
    }
    return {
      title: 'Still on the elastic line',
      body: String.raw`At ${fig(kip)} kip the stress is ${fig(ksi)} ksi, under 36 ksi. The elongation is $PL/AE$ = ${fig(c.delta / M_PER_IN)} in. Release the load and the rod returns to its old length.`,
    };
  }),
});
