import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FLUIDS } from '@flux/subjects/mechanics/couette.js';
import { poiseuille, poiseuilleNumeric, reynolds } from '@flux/subjects/mechanics/poiseuille.js';

/**
 * Pipe: Navier–Stokes driven by a pressure drop, in a long pipe or a slot between two plates.
 *
 * Fully developed, the flow has no acceleration, so the pressure gradient balances viscous shear
 * alone, and the velocity profile is a parabola. Shows that the flow rate grows as R⁴: twice the
 * radius carries sixteen times the oil. The closed forms are checked by a finite-volume solve of the
 * same equation across 400 cells (packages/subjects/src/mechanics/poiseuille.js). The Reynolds
 * number says when the laminar answer stops being true.
 */
const SCENARIOS = [
  { id: 'oil', name: 'Olive oil in a 4 mm tube', geom: 'pipe', fluid: 'oil', size: 2, dp: 10, L: 1 },
  { id: 'oil-wide', name: 'The same, twice the radius', geom: 'pipe', fluid: 'oil', size: 4, dp: 10, L: 1 },
  { id: 'capillary', name: 'Water in a 1 mm capillary', geom: 'pipe', fluid: 'water', size: 0.5, dp: 1, L: 0.1 },
  { id: 'slot', name: 'Glycerol through a 1 mm slot', geom: 'slot', fluid: 'glycerol', size: 1, dp: 10, L: 0.1 },
  { id: 'too-fast', name: 'Water in a 1 cm pipe: no longer laminar', geom: 'pipe', fluid: 'water', size: 5, dp: 1, L: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, geom: sc.geom, fluid: sc.fluid, size: sc.size, dp: sc.dp, L: sc.L });
}

/** Flow rate in mL/s; for a slot, per metre of width. */
const mLs = (Q) => `${fig(Q * 1e6)} mL/s`;
const RE_LAMINAR = 2300;

export default defineLab({
  id: 'pipe',
  exam: 'u3',
  title: 'Pipe',
  hint: 'Double the radius and watch the flow rate: not twice, not four times, but sixteen. Then try water in a wide pipe and read the Reynolds number.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('oil', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'size', lo: 0.2, hi: 10 }),
  controls() {
    return `
      <label class="field"><span>Duct</span><select id="pp-geom"><option value="pipe">A round pipe</option><option value="slot">A slot between two plates</option></select></label>
      <label class="field"><span>Fluid</span><select id="pp-fluid">${Object.values(FLUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      ${slider('pp-size', 'Radius R, or the slot’s gap h (mm)', 2, 0.2, 10, 0.1)}
      ${slider('pp-dp', 'Pressure drop Δp (kPa)', 10, 0.1, 100, 0.1)}
      ${slider('pp-L', 'Length L (m)', 1, 0.1, 5, 0.1)}
      <p class="tiny">Fully developed laminar flow, far from the inlet. A slot's flow rate is per metre of its width.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['pp-geom', 'geom'], ['pp-fluid', 'fluid']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    bindSlider('pp-size', (s, v) => { s.size = v; }, api);
    bindSlider('pp-dp', (s, v) => { s.dp = v; }, api);
    bindSlider('pp-L', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    for (const [id, v] of [['pp-geom', state.geom], ['pp-fluid', state.fluid]]) {
      const el = document.getElementById(id);
      if (el) el.value = v;
    }
    for (const [id, v] of [['pp-size', state.size], ['pp-dp', state.dp], ['pp-L', state.L]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const f = FLUIDS[state.fluid] || FLUIDS.water;
    const flow = { geom: state.geom, size: state.size * 1e-3, G: (state.dp * 1e3) / state.L, mu: f.mu };
    const a = poiseuille(flow);
    const n = poiseuilleNumeric(flow);
    const gap = Math.max(Math.abs(n.Q - a.Q) / a.Q, Math.abs(n.umax - a.umax) / a.umax);
    const Re = reynolds(f.rho, a.V, a.Dh, f.mu);
    return { geom: a.geom, fluidName: f.name, mu: f.mu, Q: a.Q, V: a.V, umax: a.umax, tauWall: a.tauWall, Re, laminar: Re < RE_LAMINAR, numeric: n, gap, profile: a.profile };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // Side by side at every width: the chart needs its height more than its width.
    const xm = B.free.x0 + 0.42 * (B.free.x1 - B.free.x0);
    const left = { ...B.free, x1: xm };
    const right = { ...B.free, x0: xm };
    // The duct in section along its length, with the velocity profile drawn as arrows.
    const S = sceneIn(B, left, { x0: -0.2, x1: 1.6, y0: -1.25, y1: 1.25 }, 14);
    poly(S, [[-0.1, 1], [1.5, 1], [1.5, 1.08], [-0.1, 1.08]], { fill: alpha(C.text, 0.35), stroke: null });
    poly(S, [[-0.1, -1], [1.5, -1], [1.5, -1.08], [-0.1, -1.08]], { fill: alpha(C.text, 0.35), stroke: null });
    // y runs from wall (−1) to wall (1): r/R from the axis in a pipe, y/h from one wall in a slot.
    const across = (y) => (c.geom === 'pipe' ? Math.abs(y) : (y + 1) / 2);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const y = -1 + i / 20;
      pts.push([0.2 + 1.1 * c.profile(across(y)), y]);
    }
    line(S, pts, { color: C.blue, width: 2.5 });
    for (let i = 1; i < 10; i++) {
      const y = -1 + i / 5;
      const len = 1.1 * c.profile(across(y)) * S.k;
      if (len > 4) arrow(S, [0.2, y], 0, len, { color: alpha(C.blue, 0.75), width: 1.5, head: 6 });
    }
    label(S, c.geom === 'pipe' ? `pipe, R = ${fig(state.size)} mm` : `slot, h = ${fig(state.size)} mm`, [0.7, 1.2], { color: C.muted });
    label(S, `${c.fluidName}, Δp = ${fig(state.dp)} kPa over ${fig(state.L)} m`, [0.7, -1.2], { color: C.muted });
    // The profile across the duct: closed form against the finite volumes.
    // Below 0.1 m/s the axis reads in mm/s, so its ticks stay short.
    const k = c.umax < 0.1 ? 1000 : 1;
    const P = plotIn(B, right, { lo: 0, hi: 1.1 * c.umax * k }, { lo: 0, hi: 1.08 });
    axes(P, { xLabel: k === 1 ? 'u (m/s)' : 'u (mm/s)', yLabel: c.geom === 'pipe' ? 'r/R' : 'y/h' });
    const exact = [];
    for (let i = 0; i <= 60; i++) {
      const eta = i / 60;
      exact.push([k * c.umax * c.profile(eta), eta]);
    }
    line(P, exact, { color: C.blue, width: 2.5 });
    c.numeric.eta.forEach((eta, i) => {
      if (i % 25 === 12) dot(P, k * c.numeric.u[i], eta, { color: C.yellow, r: 3 });
    });
    label(P, 'line: exact · dots: grid', [0.5 * c.umax * k, 1.04], { color: C.muted });
  },
  law: (state) =>
    state.geom === 'slot'
      ? [String.raw`\mu\frac{d^2u}{dy^2} = -\frac{\Delta p}{L}`, String.raw`u = \frac{\Delta p}{2\mu L}\,y(h-y), \qquad q = \frac{\Delta p\,h^3}{12\mu L}`]
      : [String.raw`\frac{\mu}{r}\frac{d}{dr}\Big(r\frac{du}{dr}\Big) = -\frac{\Delta p}{L}`, String.raw`u = \frac{\Delta p}{4\mu L}(R^2 - r^2), \qquad Q = \frac{\pi R^4\,\Delta p}{8\mu L}`],
  liveRows(state, c) {
    return [
      kv(c.geom === 'pipe' ? 'Flow rate Q' : 'Flow rate per metre of width', mLs(c.Q)),
      kv('Second route: finite volumes', mLs(c.numeric.Q)),
      kv('Peak speed', `${fig(c.umax)} m/s`),
      kv('Mean speed', `${fig(c.V)} m/s`),
      kv('Wall shear stress', `${fig(c.tauWall)} Pa`),
      kv('Reynolds number, on the hydraulic diameter', `${fig(c.Re)}: ${c.laminar ? 'laminar' : 'turbulent'}`),
      kv('Largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      [c.geom === 'pipe' ? 'flow rate' : 'flow per m', mLs(c.Q)],
      ['peak speed', `${fig(c.umax)} m/s`],
      ['wall stress', `${fig(c.tauWall)} Pa`],
      ['Reynolds', fig(c.Re)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The entrance. Near the inlet the profile is still flat and growing into the parabola, and that length can be tens of diameters. And a pipe that is not perfectly straight and smooth.`;
    if (!c.laminar) {
      return {
        title: 'Too fast to stay laminar',
        body: `The Reynolds number is ${fig(c.Re)}, far above about 2300. The parabola is unstable at this speed: the flow turns turbulent, mixes across the pipe, and carries much less than the ${mLs(c.Q)} the laminar formula claims. That needs the friction factor, in the pipe-flow unit. ${leavesOut}`,
      };
    }
    if (c.geom === 'slot') {
      return {
        title: 'In a slot the flow grows as h³',
        body: `Between two plates the profile is also a parabola, and the flow per unit width is Δp h³/(12μL). Twice the gap carries eight times as much. Here: ${mLs(c.Q)} per metre of width, at Re = ${fig(c.Re)}. ${leavesOut}`,
      };
    }
    return {
      title: 'Twice the radius, sixteen times the flow',
      body: `With no acceleration, the pressure gradient balances viscous shear alone, and the profile is a parabola. The peak speed grows as R², and the area it flows through as R², so Q = πR⁴Δp/(8μL) grows as R⁴. Here ${mLs(c.Q)} at Re = ${fig(c.Re)}, well inside laminar flow. ${leavesOut}`,
    };
  },
  app: false,
});
