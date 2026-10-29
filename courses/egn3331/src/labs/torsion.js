import { PLAY, advance, playing } from '@flux/shells/engineering/motion.js';
import { shaftSketch } from './elements.js';
import {
  polarJ, roundShaft, solidDiameterRequired, torsionShear,
} from '@flux/subjects/mechanics/torsion.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, arrow, axes, begin, C, chartIn, circle, dot, hidden, label, line, panes, plotIn, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that shear stress grows linearly with radius, so the core of a solid
 * shaft carries little torque. A hollow shaft keeps most of J and loses more
 * of the area.
 *
 * Second method: trapezoid integration of ρ² dA, and of τρ dA, against the
 * closed polar moment.
 */

const G = 75e9;
const DEG = 180 / Math.PI;

const SCENARIOS = [
  { id: 'solid', name: 'Solid, 40 mm', T: 500, d: 0.04, di: 0, L: 1.2, rho: 0.02 },
  { id: 'hollow', name: '40 mm outside, 30 mm bore', T: 500, d: 0.04, di: 0.03, L: 1.2, rho: 0.02 },
  { id: 'tube', name: '50 mm tube, 5 mm wall', T: 500, d: 0.05, di: 0.04, L: 1.2, rho: 0.025 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, T: sc.T, d: sc.d, di: sc.di, L: sc.L, rho: sc.rho, G,
    tauAllow: 0, phiAllow: 0, vis: 1, anim: { playing: false }, show: { play: false },
  });
}

/** Closed-form section. No quadrature. Draw uses this. */
function geometry(state) {
  const d = Math.max(state.d, 0.005);
  const di = Math.min(Math.max(state.di, 0), d * 0.95);
  const L = Math.max(state.L, 0.05);
  const ro = d / 2;
  const ri = di / 2;
  const J = polarJ(ro, ri);
  const rho = Math.min(Math.max(state.rho ?? ro, ri), ro);
  const T = state.T;
  return {
    T, L, d, di, ro, ri, J, rho,
    tau: torsionShear(T, rho, J),
    tauMax: torsionShear(T, ro, J),
    tauIn: torsionShear(T, ri, J),
    phi: (T * L) / ((state.G || G) * J),
    strength: J / polarJ(ro, 0),
    areaFrac: (ro * ro - ri * ri) / (ro * ro),
  };
}

/**
 * The shaft from the side, fixed at the left wall and turned by T at the right, with a surface line
 * that slants as the sections turn; and its end, where the shear grows from zero on the axis (or
 * from the bore) to its largest value at the outside. Play applies the torque.
 */
function member(B, rect, state, c, veiled) {
  const geo = geometry(state);
  const lam = playing(state) ? Math.min(1, Number(state.vis) || 0) : 1;
  const W = rect.x1 - rect.x0;
  const Hh = rect.y1 - rect.y0;
  const wide = W > 1.6 * Hh;
  const side = wide ? { ...rect, x1: rect.x0 + 0.66 * W } : { ...rect, y1: rect.y0 + 0.5 * Hh };
  const end = wide ? { ...rect, x0: rect.x0 + 0.66 * W } : { ...rect, y0: rect.y0 + 0.5 * Hh };
  const r = 0.12 * geo.L;
  const S = sceneIn(B, side, { x0: -0.06 * geo.L, x1: 1.18 * geo.L, y0: -2.2 * r, y1: 2.2 * r }, 8);
  const k = 1.1 / Math.max(c.phi, 1e-9);
  shaftSketch(S, [{ x0: 0, x1: geo.L, r }], {
    walls: [0],
    torques: [{ x: geo.L, T: Math.sign(state.T || 1) * lam, text: veiled ? '' : `T ${fig(lam * state.T)} N·m` }],
    phi: (x) => (lam * c.phi * x) / geo.L,
    k,
  });
  if (!veiled) label(S, `twist ${fig(lam * c.phi * 180 / Math.PI)}°, drawn ×${fig(k)}`, [geo.L / 2, -r], { color: C.gold, dy: 14 });
  const E = sceneIn(B, end, { x0: -1.4, x1: 1.4, y0: -1.3, y1: 1.3 }, 8);
  circle(E, [0, 0], 1, { stroke: C.text, fill: alpha(C.text, 0.12), width: 1.5 });
  const fi = geo.ri / geo.ro;
  if (fi > 0) circle(E, [0, 0], fi, { stroke: C.text, fill: C.bg, width: 1.5 });
  for (let i = 0; i <= 5; i++) {
    const rr = fi + ((1 - fi) * i) / 5;
    if (rr < 0.05) continue;
    for (const a of [Math.PI / 2, -Math.PI / 6, Math.PI * 7 / 6]) {
      const p = [rr * Math.cos(a), rr * Math.sin(a)];
      arrow(E, p, a + Math.sign(state.T || 1) * Math.PI / 2, lam * 28 * rr, { color: C.teal, width: 1.8, head: 6 });
    }
  }
  if (!veiled) label(E, `τ ${fig((lam * c.tauMax) / 1e6)} MPa at the outside`, [0, -1], { color: C.teal, dy: 14 });
}

export default defineLab({
  id: 'torsion',
  exam: 'u9',
  title: 'Torsion',
  hint: 'Shear stress is zero on the axis and largest at the outside. Boring the core removes area that was carrying little torque.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  // Play applies the torque in the drawing, from nothing to its full value; the numbers stay at full torque.
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: 1.25, rate: 0.5, key: 'vis' });
  },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('solid', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 100, hi: 2000 }),
  controls() {
    return `
      ${slider('to-t', 'torque (N·m)', 500, 100, 2000, 10)}
      ${slider('to-l', 'length (m)', 1.2, 0.3, 3, 0.05)}
      ${slider('to-d', 'outside diameter (mm)', 40, 20, 80, 1)}
      ${slider('to-di', 'bore (mm)', 0, 0, 70, 1)}
      ${slider('to-r', 'station from the center (mm)', 20, 0, 40, 1)}
      <p class="tiny">G is 75 GPa. The bore is zero on a solid shaft. Stress does not depend on the length.</p>`;
  },
  bind(api) {
    bindSlider('to-t', (s, v) => { s.T = v; }, api);
    bindSlider('to-l', (s, v) => { s.L = v; }, api);
    bindSlider('to-d', (s, v) => { s.d = v * 1e-3; }, api);
    bindSlider('to-di', (s, v) => { s.di = v * 1e-3; }, api);
    bindSlider('to-r', (s, v) => { s.rho = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('to-t', state.T);
    set('to-l', state.L);
    set('to-d', state.d * 1e3);
    set('to-di', state.di * 1e3);
    set('to-r', state.rho * 1e3);
  },
  compute(state) {
    const geo = geometry(state);
    const shaft = roundShaft(geo.T, geo.L, state.G || G, geo.d, geo.di, geo.rho);
    const dNeed = state.tauAllow > 0 && state.phiAllow > 0
      ? solidDiameterRequired(geo.T, geo.L, state.G || G, state.tauAllow, state.phiAllow).d
      : 0;
    return {
      tau: shaft.tau,
      tauMax: shaft.tauMax,
      tauIn: shaft.tauIn,
      phi: shaft.phi,
      strength: shaft.strength,
      areaFrac: shaft.areaFrac,
      ro: shaft.ro,
      ri: shaft.ri,
      rho: shaft.rho,
      T: geo.T,
      L: geo.L,
      dNeed,
      gap: shaft.gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.45, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    const geo = geometry(state);
    const pts = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const rho = geo.ri + ((geo.ro - geo.ri) * i) / n;
      pts.push([rho * 1000, torsionShear(geo.T, rho, geo.J) / 1e6]);
    }
    const yHi = Math.max(pts[pts.length - 1][1], 1);
    const P = chartIn(B, R, { lo: 0, hi: geo.ro * 1000 * 1.05 }, { lo: 0, hi: yHi * 1.12 });
    axes(P, { xLabel: 'radius (mm)', yLabel: 'shear stress (MPa)' });
    line(P, pts, { color: C.teal, width: 3 });
    line(P, [[geo.ro * 1000, 0], [geo.ro * 1000, yHi * 1.12]], { color: C.pink, width: 2, dash: [5, 4] });
    dot(P, geo.rho * 1000, geo.tau / 1e6, { color: C.gold, r: 5 });
  },
  law() {
    return [String.raw`\tau=\frac{T\rho}{J}`];
  },
  liveRows(state, c) {
    return [
      kv('outer shear', `${fig(c.tauMax / 1e6)} MPa`),
      kv('shear at the station', `${fig(c.tau / 1e6)} MPa`),
      kv('angle of twist', `${fig(c.phi * DEG)}°`),
      kv('J, as a fraction of the solid', fig(c.strength)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['outer', `${fig(c.tauMax / 1e6)} MPa`],
      ['angle', `${fig(c.phi * DEG)}°`],
      ['J ratio', fig(c.strength)],
      ['area ratio', fig(c.areaFrac)],
    ]);
  },
  coach(state, c) {
    const angle = fig(c.phi * DEG);
    if (state.scenarioId === 'solid') {
      return {
        title: 'The stress is zero on the axis',
        body: `The outside sees ${fig(c.tauMax / 1e6)} MPa. The center sees none. The shaft twists ${angle}°. Doubling the length doubles that angle and leaves the stress where it is.`,
      };
    }
    return {
      title: 'The bore was the low-stress material',
      body: `The outside sees ${fig(c.tauMax / 1e6)} MPa and the bore sees ${fig(c.tauIn / 1e6)} MPa. This section keeps ${fig(c.strength)} of the solid polar moment and ${fig(c.areaFrac)} of the solid area, at the same outside diameter. The angle is ${angle}°.`,
    };
  },
});
