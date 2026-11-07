import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { thermalLayer } from '@flux/subjects/heat/thermallayer.js';

/**
 * Thermal layer: a heated plate in a laminar stream, with the velocity layer and the thermal layer
 * drawn together, and their profiles at the trailing edge.
 *
 * Shows that heat and momentum do not spread together. The Prandtl number Pr = ν/α sets the ratio:
 * in a liquid metal the thermal layer is several times thicker than the velocity layer, at Pr = 1 they
 * match, and in an oil the thermal layer is a thin skin deep inside it, close to Pr^(−1/3) of it. The
 * profile comes from Pohlhausen's equation θ″ + (Pr/2) f θ′ = 0 by quadrature; the second method
 * integrates the equations by RK4 (packages/subjects/src/heat/thermallayer.js).
 */
const SCENARIOS = [
  { id: 'air', name: 'Air, Pr = 0.71', Pr: 0.71 },
  { id: 'water', name: 'Water at 27 °C, Pr = 5.83', Pr: 5.83 },
  { id: 'metal', name: 'Liquid mercury, Pr = 0.025', Pr: 0.025 },
  { id: 'oil', name: 'An oil, Pr = 500', Pr: 500 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lp: Math.log10(sc.Pr) });
}

export default defineLab({
  id: 'thermal',
  exam: 'u3',
  title: 'Thermal layer',
  hint: 'Slide Pr from a liquid metal to an oil. At Pr = 1 the two layers match; above it the thermal layer shrinks inside the velocity layer, below it it spreads far beyond.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('air', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lp', lo: -2, hi: 3 }),
  controls() {
    return `
      ${slider('tl-lp', 'Prandtl number, log₁₀ Pr', Math.log10(0.71), -2, 3, 0.01)}
      <p class="tiny">From −2 (Pr = 0.01, a liquid metal) to 3 (Pr = 1000, an oil). Laminar flow, constant properties, the whole plate held at one temperature.</p>`;
  },
  bind(api) {
    bindSlider('tl-lp', (s, v) => { s.lp = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('tl-lp');
    if (el && document.activeElement !== el) el.value = String(state.lp);
  },
  compute(state) {
    const r = thermalLayer(10 ** state.lp);
    return { ...r, thicker: r.ratio > 1 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    // A short canvas (a phone) gets the plate alone; the profile numbers are in the panel.
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [left, right] = both ? split(B.free, wide ? 0.58 : 0.5) : [B.free, null];
    // The plate: y in units of the velocity layer's thickness at the trailing edge.
    const top = Math.max(1, c.ratio) * 1.25;
    const P = plotIn(B, left, { lo: 0, hi: 1 }, { lo: 0, hi: top });
    axes(P, { xLabel: 'x / L along the heated plate (red)', yLabel: 'y / δ(L)' });
    const xs = Array.from({ length: 81 }, (_, i) => i / 80);
    const thermal = xs.map((x) => [x, c.ratio * Math.sqrt(x)]);
    const velocity = xs.map((x) => [x, Math.sqrt(x)]);
    poly(P, [...thermal, [1, 0], [0, 0]], { fill: alpha(C.gold, 0.28), stroke: null });
    line(P, thermal, { color: C.gold, width: 2.5 });
    line(P, velocity, { color: C.teal, width: 2.5, dash: [6, 4] });
    seg(P, [0, 0], [1, 0], { color: C.red, width: 4 });
    label(P, 'δ, velocity', [0.98, 1], { color: C.teal, align: 'right', dy: c.ratio > 1 ? 12 : -10 });
    label(P, 'δt, thermal', [0.98, c.ratio], { color: C.gold, align: 'right', dy: c.ratio > 1 || c.ratio < 0.6 ? -10 : 12 });
    if (!right) return;

    // The profiles at any station: u/U and θ against η.
    const etaTop = Math.max(c.etaT, c.eta99) * 1.25;
    const Q = plotIn(B, right, { lo: 0, hi: 1.05 }, { lo: 0, hi: etaTop });
    axes(Q, { xLabel: 'u/U and θ = (T − Ts)/(T∞ − Ts)', yLabel: 'η = y√(U/νx)' });
    line(Q, c.velocity.map(([eta, u]) => [u, eta]), { color: C.teal, width: 2.5, dash: [6, 4] });
    line(Q, c.theta.map(([eta, t]) => [t, eta]), { color: C.gold, width: 2.5 });
    seg(Q, [0, c.etaT], [0.99, c.etaT], { color: alpha(C.gold, 0.6), width: 1, dash: [3, 3] });
    seg(Q, [0, c.eta99], [0.99, c.eta99], { color: alpha(C.teal, 0.6), width: 1, dash: [3, 3] });
    label(Q, `η = ${fig(c.etaT)}`, [0.05, c.etaT], { color: C.gold, align: 'left', dy: -8 });
    label(Q, `η = ${fig(c.eta99)}`, [0.05, c.eta99], { color: C.teal, align: 'left', dy: c.etaT > c.eta99 ? 12 : -8 });
  },
  law: () => [String.raw`\theta'' + \frac{\text{Pr}}{2}\,f\,\theta' = 0, \qquad \text{Pr} = \frac{\nu}{\alpha}`, String.raw`\text{Nu}_x = \theta'(0)\sqrt{\text{Re}_x}, \qquad \frac{\delta_t}{\delta} \approx \text{Pr}^{-1/3}`],
  liveRows(state, c) {
    return [
      kv('Pr', fig(c.Pr)),
      kv('wall gradient θ′(0), quadrature', fig(c.wall)),
      kv('wall gradient, RK4', fig(c.wallShoot)),
      kv('0.332 Pr^(1/3), 0.564 Pr^(1/2)', `${fig(c.corrLarge)}, ${fig(c.corrSmall)}`),
      kv('η at θ = 0.99, both ways', `${fig(c.etaT)}, ${fig(c.etaTShoot)}`),
      kv('δt / δ', fig(c.ratio)),
      kv('Pr^(−1/3)', fig(c.rule)),
      kv('two methods differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Pr', fig(c.Pr)],
      ['δt / δ', fig(c.ratio)],
      ['wall gradient', fig(c.wall)],
      ['Pr^(−1/3)', fig(c.rule)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Constant properties, though viscosity changes with temperature, oils most of all. A laminar layer, a plate heated from its leading edge, and no heating by friction.`;
    if (c.Pr < 0.3) {
      return {
        title: 'Heat outruns momentum',
        body: String.raw`At Pr = ${fig(c.Pr)} heat diffuses ${fig(1 / c.Pr)} times faster than momentum, so the thermal layer is ${fig(c.ratio)} times thicker than the velocity layer. Most of it sits in fluid moving at nearly the full stream speed, which is why θ′(0) ≈ 0.564 √Pr here: ${fig(c.corrSmall)} against ${fig(c.wall)}. ${leavesOut}`,
      };
    }
    if (c.Pr < 2) {
      return {
        title: 'Two layers of about one size',
        body: String.raw`Near Pr = 1 heat and momentum diffuse at about the same rate, so the layers nearly match: δt/δ = ${fig(c.ratio)}. At exactly Pr = 1 the two equations are the same, and θ′(0) = f″(0) = 0.332. ${leavesOut}`,
      };
    }
    return {
      title: 'A thin thermal skin',
      body: String.raw`At Pr = ${fig(c.Pr)} momentum diffuses ${fig(c.Pr)} times faster than heat. The heat stays in a skin ${fig(c.ratio)} as thick as the velocity layer, close to Pr^(−1/3) = ${fig(c.rule)}. A thinner layer means a steeper wall gradient: θ′(0) = ${fig(c.wall)}, near 0.332 Pr^(1/3) = ${fig(c.corrLarge)}. ${leavesOut}`,
    };
  },
  app: false,
});
