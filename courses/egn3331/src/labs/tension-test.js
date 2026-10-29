import { bilinear, bilinearEnergy, permanentSet, rambergOsgood, rambergStress } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { PLAY, advance } from '@flux/shells/engineering/motion.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that E is the initial slope of a tension curve, that unloading follows E and leaves a
 * permanent set, and that the 0.2% offset line meets a Ramberg–Osgood curve at its offset yield.
 *
 * The mild-steel card is a teaching model: E = 200 GPa, yield 250 MPa, tangent modulus 10 GPa.
 * The aluminium card is a typical 6061-T6: E = 68.9 GPa, 0.2% offset yield 276 MPa. The
 * Ramberg–Osgood exponent n = 10 is assumed. Second method: Simpson's rule under the curve
 * against the closed-form energy, and a march of the Ramberg–Osgood compliance against bisection.
 */

export const STEEL = { E: 200e9, sigY: 250e6, Et: 10e9 };
export const ALUM = { E: 68.9e9, sigY: 276e6, n: 10 };
const EPS_HI = 0.02;

const SCENARIOS = [
  { id: 'steel', name: 'Mild steel, still elastic', material: 'steel', eps: 0.0008, unload: 0 },
  { id: 'yielded', name: 'Mild steel, past yield', material: 'steel', eps: 0.01, unload: 0 },
  { id: 'alum', name: '6061-T6 aluminium', material: 'alum', eps: 0.006, unload: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, material: sc.material, eps: sc.eps, unload: sc.unload, anim: { playing: false }, show: { play: false } });
}

function simpson(f, a, b, n = 400) {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Strain from marching dε = (dε/dσ) dσ, the derivative of the Ramberg–Osgood formula. */
function strainByMarch(stress, E, sigY, n) {
  const steps = 2000;
  const ds = stress / steps;
  let eps = 0;
  for (let i = 0; i < steps; i++) {
    const s = (i + 0.5) * ds;
    const slope = 1 / E + 0.002 * n * (s / sigY) ** (n - 1) / sigY;
    eps += slope * ds;
  }
  return eps;
}

function point(material, eps) {
  if (material === 'alum') {
    const stress = rambergStress(eps, ALUM.E, ALUM.sigY, ALUM.n);
    const closed = rambergOsgood(stress, ALUM.E, ALUM.sigY, ALUM.n);
    const marched = strainByMarch(stress, ALUM.E, ALUM.sigY, ALUM.n);
    const energy = simpson((e) => rambergStress(e, ALUM.E, ALUM.sigY, ALUM.n), 0, eps);
    const elastic = stress < ALUM.sigY * 0.98;
    return {
      stress,
      energy,
      ey: ALUM.sigY / ALUM.E,
      E: ALUM.E,
      sigY: ALUM.sigY,
      slope: elastic ? ALUM.E : (rambergStress(eps * 1.001, ALUM.E, ALUM.sigY, ALUM.n) - stress) / (eps * 0.001),
      gap: Math.abs(closed - marched) / Math.max(closed, 1e-12),
    };
  }
  const b = bilinear(eps, STEEL.E, STEEL.sigY, STEEL.Et);
  const energy = bilinearEnergy(eps, STEEL.E, STEEL.sigY, STEEL.Et);
  const stressAt = (e) => bilinear(e, STEEL.E, STEEL.sigY, STEEL.Et).stress;
  const quad = eps <= b.ey
    ? simpson(stressAt, 0, eps, 200)
    : simpson(stressAt, 0, b.ey, 200) + simpson(stressAt, b.ey, eps, 200);
  return {
    stress: b.stress,
    energy,
    ey: b.ey,
    E: STEEL.E,
    sigY: STEEL.sigY,
    plastic: b.plastic,
    slope: b.plastic ? STEEL.Et : STEEL.E,
    gap: Math.abs(energy - quad) / Math.max(Math.abs(energy), 1),
  };
}

export default defineLab({
  id: 'tension-test',
  exam: 'u2',
  title: 'Tension test',
  hint: 'E is the first slope. Past yield, unloading follows that same slope and stops short of the origin. Play pulls the coupon.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  // Play pulls the coupon from zero to the end of the chart, slowly enough to watch yield arrive.
  tick(dt, state) {
    if (state.unload) state.unload = 0;
    return advance(state, dt, { lo: 0, hi: EPS_HI, rate: EPS_HI / 8, key: 'eps' });
  },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'eps', lo: 0, hi: EPS_HI }),
  controls() {
    return `
      ${slider('tt-eps', 'strain (millistrain)', 0.8, 0, EPS_HI * 1000, 0.05)}
      ${slider('tt-unload', 'unload (0 held, 1 released)', 0, 0, 1, 1)}
      <p class="tiny">Mild steel model: E = 200 GPa, yield 250 MPa, then 10 GPa. 6061-T6: E = 68.9 GPa, offset yield 276 MPa. The exponent n = 10 is assumed.</p>`;
  },
  bind(api) {
    bindSlider('tt-eps', (s, v) => { s.eps = v / 1000; }, api);
    bindSlider('tt-unload', (s, v) => { s.unload = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    showField('tt-eps', true);
    showField('tt-unload', true);
    set('tt-eps', state.eps * 1000);
    set('tt-unload', state.unload);
  },
  compute(state) {
    const p = point(state.material, state.eps);
    const set = permanentSet(state.eps, p.stress, p.E);
    const shownStress = state.unload ? 0 : p.stress;
    const shownEps = state.unload ? set : state.eps;
    return {
      ...p,
      eps: state.eps,
      set,
      shownStress,
      shownEps,
      material: state.material,
      unload: state.unload,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [side, rest] = panes(B, 0.34, { long: true });
    // The coupon, held in a fixed grip on the left and pulled to the right. The gauge length (3
    // units) stretches by the strain, drawn so the largest strain on the chart adds half of it.
    const gx = 0.5 / EPS_HI;
    const ext = 3 * gx * c.shownEps;
    const w = 0.35 * (1 - 0.3 * gx * Math.min(c.shownEps, 0.002));
    const S = sceneIn(B, side, { x0: -3.6, x1: 6.6, y0: -1.1, y1: 1.1 }, 8);
    const x0 = -1.5;
    const x1 = 1.5 + ext;
    const yielded = c.shownStress > c.sigY * 0.999 || (c.unload && c.set > 1e-6);
    poly(S, [[-3.1, -0.65], [-2, -0.65], [-1.7, -0.35], [x0, -w], [x1, -w], [x1 + 0.2, -0.35], [x1 + 0.5, -0.65], [x1 + 1.6, -0.65], [x1 + 1.6, 0.65], [x1 + 0.5, 0.65], [x1 + 0.2, 0.35], [x1, w], [x0, w], [-1.7, 0.35], [-2, 0.65], [-3.1, 0.65]],
      { fill: alpha(yielded ? C.red : C.text, 0.14), stroke: C.text, width: 1.5 });
    poly(S, [[-3.35, -0.95], [-3.1, -0.95], [-3.1, 0.95], [-3.35, 0.95]], { fill: alpha(C.muted, 0.4), stroke: C.muted });
    for (const x of [x0, x1]) seg(S, [x, -w - 0.25], [x, w + 0.25], { color: C.gold, width: 2 });
    const pull = 10 + 34 * Math.min(1, c.shownStress / 450e6);
    if (c.shownStress > 1e3) arrow(S, [x1 + 1.6, 0], 0, pull, { color: C.pink });
    if (!veiled) label(S, `gauge marks, stretch ×${fig(gx)}`, [0, -w - 0.25], { color: C.dim, dy: 10 });
    if (veiled) return;

    const yHi = (c.material === 'alum' ? 400 : 480);
    const P = chartIn(B, rest, { lo: 0, hi: EPS_HI * 1000 }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'strain (millistrain)', yLabel: 'stress (MPa)' });
    const stressOf = (e) => (state.material === 'alum'
      ? rambergStress(e, ALUM.E, ALUM.sigY, ALUM.n)
      : bilinear(e, STEEL.E, STEEL.sigY, STEEL.Et).stress);
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const e = (EPS_HI * i) / 80;
      pts.push([e * 1000, stressOf(e) / 1e6]);
    }
    line(P, pts, { color: C.teal, width: 3 });
    const off = [];
    for (let i = 0; i <= 40; i++) {
      const e = 2 + (EPS_HI * 1000 - 2) * (i / 40);
      const s = (c.E * (e / 1000 - 0.002)) / 1e6;
      if (s >= 0 && s <= yHi) off.push([e, s]);
    }
    if (off.length > 1) line(P, off, { color: alpha(C.gold, 0.95), width: 2, dash: [6, 4] });
    if (c.unload) line(P, [[c.eps * 1000, c.stress / 1e6], [c.set * 1000, 0]], { color: C.gold, width: 2 });
    dot(P, c.shownEps * 1000, c.shownStress / 1e6, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\sigma = E\varepsilon`, String.raw`\varepsilon_p = \varepsilon - \sigma/E`],
  liveRows(state, c) {
    return [
      kv('modulus', `${fig(c.E / 1e9)} GPa`),
      kv('offset yield', `${fig(c.sigY / 1e6)} MPa`),
      kv('strain energy', `${fig(c.energy / 1e3)} kJ/m³`),
      kv('0.2% offset line', 'dashed'),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['stress', `${fig(c.shownStress / 1e6)} MPa`],
      ['strain', `${fig(c.shownEps * 1e6)} µε`],
      ['permanent set', `${fig(c.set * 1e6)} µε`],
      ['energy', `${fig(c.energy / 1e3)} kJ/m³`],
    ]);
  },
  coach(state, c) {
    if (c.unload) {
      return {
        title: 'Unloading follows E',
        body: String.raw`The load comes off along a line of slope $E$. The curve does not return to the origin. The strain left at zero stress is the permanent set, ${fig(c.set * 1e6)} µε.`,
      };
    }
    if (c.material === 'alum') {
      return {
        title: 'The offset yield',
        body: String.raw`There is no sharp corner. The dashed line is $E$ shifted by 0.2% strain. It meets this curve at ${fig(c.sigY / 1e6)} MPa, which is the 0.2% offset yield built into the fit.`,
      };
    }
    if (c.plastic) {
      return {
        title: 'Past the corner',
        body: String.raw`Yield is ${fig(c.sigY / 1e6)} MPa, at strain ${fig(c.ey * 1e6)} µε. After that the slope is the tangent modulus, not $E$. The stress now is ${fig(c.stress / 1e6)} MPa.`,
      };
    }
    return {
      title: 'The elastic slope',
      body: String.raw`On the first straight part, stress is $E$ times strain. Here that is ${fig(c.stress / 1e6)} MPa. Unload from here and the point walks back to the origin.`,
    };
  },
});
