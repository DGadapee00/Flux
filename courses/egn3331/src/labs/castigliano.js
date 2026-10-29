import { beamSketch, shaftSketch } from './elements.js';
import { cantileverTipDeflection } from '@flux/subjects/mechanics/elastic.js';
import { polarJ } from '@flux/subjects/mechanics/torsion.js';
import {
  axialBar, cantileverStation, cantileverTipEnergy, torsionStrain, twoBarTruss,
} from '@flux/subjects/mechanics/strain-energy.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, arrow, axes, begin, C, dot, hidden, label, line, panes, pinSupport, plotIn, poly, sceneIn, seg, wall } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that a deflection is the derivative of the strain energy with respect
 * to the load at that point. A dummy load finds a station where no real load
 * acts. Doubling the load doubles the deflection and quadruples the energy.
 *
 * Second method: the moment integral and the elastic curve, bar shortening
 * against the joint solution, and ½Tφ against TL/(GJ).
 */

const E = 200e9;
const G = 75e9;
const DEG = 180 / Math.PI;

const SCENARIOS = [
  { id: 'bar', name: '40 kN bar', P: 40000, L: 1.5, b: 0.04, h: 0.08, a: 1.5, span: 4, rise: 0.5, A: 4e-4, T: 500, d: 0.04, shaftL: 1.2 },
  { id: 'tip', name: 'Tip of the cantilever', P: 800, L: 2, b: 0.04, h: 0.08, a: 2, span: 4, rise: 0.5, A: 1e-4, T: 500, d: 0.04, shaftL: 1.2 },
  { id: 'station', name: 'Midspan of the cantilever', P: 800, L: 2, b: 0.04, h: 0.08, a: 1, span: 4, rise: 0.5, A: 1e-4, T: 500, d: 0.04, shaftL: 1.2 },
  { id: 'truss', name: 'Two bars, 4 kN', P: 4000, L: 2, b: 0.04, h: 0.08, a: 1, span: 4, rise: 0.5, A: 1e-4, T: 500, d: 0.04, shaftL: 1.2 },
  { id: 'shaft', name: 'The 40 mm shaft', P: 800, L: 2, b: 0.04, h: 0.08, a: 2, span: 4, rise: 0.5, A: 1e-4, T: 500, d: 0.04, shaftL: 1.2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { ...sc, scenarioId: sc.id });
}

function ei(state) {
  return E * state.b * state.h ** 3 / 12;
}

/** Closed beam numbers. Draw uses this. Compute adds the quadrature gap. */
function beamClosed(state) {
  const EI = ei(state);
  const L = Math.max(state.L, 0.2);
  const P = state.P;
  const a = state.scenarioId === 'tip' ? L : Math.min(Math.max(state.a, 0.05 * L), L);
  const U = (P * P * L ** 3) / (6 * EI);
  const tip = (P * L ** 3) / (3 * EI);
  const delta = state.scenarioId === 'tip'
    ? tip
    : (Math.abs(P) / EI) * (L * a * a / 2 - a ** 3 / 6);
  return { EI, L, P, a, U, tip, delta };
}

function shaftClosed(state) {
  const d = Math.max(state.d, 0.01);
  const J = polarJ(d / 2, 0);
  const T = state.T;
  const L = Math.max(state.shaftL, 0.1);
  const U = (T * T * L) / (2 * G * J);
  const phi = (T * L) / (G * J);
  return { T, L, d, J, U, phi };
}

function trussClosed(state) {
  const span = Math.max(state.span, 0.4);
  const rise = Math.min(Math.max(state.rise, 0.1), span);
  const len = Math.hypot(span / 2, rise);
  const sin = rise / len;
  const F = state.P / (2 * sin);
  const U = (F * F * len) / (state.A * E);
  const delta = (F * len) / (state.A * E * sin);
  return { span, rise, len, sin, F, U, delta, P: state.P, A: state.A };
}

/** The structure the energy is stored in, with its real load, and the dummy load where one is used. */
function member(B, rect, state, c, veiled) {
  const id = state.scenarioId;
  if (id === 'bar') {
    const L = Math.max(state.L, 0.2);
    const S = sceneIn(B, rect, { x0: -0.08 * L, x1: 1.3 * L, y0: -0.2 * L, y1: 0.2 * L }, 8);
    wall(S, 0, -0.12 * L, 0.12 * L, { side: -1 });
    poly(S, [[0, -0.04 * L], [L, -0.04 * L], [L, 0.04 * L], [0, 0.04 * L]], { fill: alpha(C.gold, 0.2), stroke: C.text });
    arrow(S, [L, 0], 0, 34, { color: C.pink });
    if (!veiled) label(S, `${fig(state.P / 1e3)} kN, U = ${fig(c.U)} J`, [L, 0], { color: C.pink, dx: 40, dy: -14 });
    return;
  }
  if (id === 'truss') {
    const t = trussClosed(state);
    const S = sceneIn(B, rect, { x0: -0.1 * t.span, x1: 1.1 * t.span, y0: -0.2 * t.span, y1: t.rise + 0.25 * t.span }, 8);
    const J = [t.span / 2, t.rise];
    for (const p of [[0, 0], [t.span, 0]]) {
      seg(S, p, J, { color: C.blue, width: 3 });
      pinSupport(S, p, { size: 10 });
    }
    arrow(S, J, -Math.PI / 2, 34, { color: C.pink, tail: false });
    if (!veiled) label(S, `${fig(t.P / 1e3)} kN; each bar ${fig(t.F / 1e3)} kN`, J, { color: C.pink, dy: -14 });
    return;
  }
  if (id === 'shaft') {
    const s = shaftClosed(state);
    const S = sceneIn(B, rect, { x0: -0.1 * s.L, x1: 1.2 * s.L, y0: -0.3 * s.L, y1: 0.3 * s.L }, 8);
    shaftSketch(S, [{ x0: 0, x1: s.L, r: 0.07 * s.L }], { walls: [0], torques: [{ x: s.L, T: 1, text: veiled ? '' : `T ${fig(s.T)} N·m` }], phi: (x) => (s.phi * x) / s.L, k: 1.1 / Math.max(s.phi, 1e-9) });
    return;
  }
  const b = beamClosed(state);
  const L = b.L;
  const at = (x) => -(b.P / b.EI) * (L * x * x / 2 - x ** 3 / 6);
  const k = (0.12 * L) / Math.max(Math.abs(at(L)), 1e-12);
  const S = sceneIn(B, rect, { x0: -0.08 * L, x1: 1.1 * L, y0: -0.3 * L, y1: 0.18 * L }, 8);
  beamSketch(S, L, { yAt: (x) => k * at(x), supports: [['fixed', 0]], points: [L] });
  if (id === 'station') {
    arrow(S, [b.a, k * at(b.a)], -Math.PI / 2, 30, { color: C.teal, width: 2, tail: true });
    if (!veiled) label(S, 'dummy Q, then Q → 0', [b.a, k * at(b.a)], { color: C.teal, dy: -38 });
  }
  if (!veiled) label(S, `${fig(b.P)} N`, [L, k * at(L)], { color: C.pink, dy: -38 });
}

export default defineLab({
  id: 'castigliano',
  exam: 'u10',
  title: 'Castigliano',
  hint: 'Deflection is the slope of the energy. Doubling the load doubles the deflection and quadruples the energy.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bar', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'bar') return { key: 'P', lo: 5000, hi: 80000 };
    if (state.scenarioId === 'truss') return { key: 'P', lo: 1000, hi: 8000 };
    if (state.scenarioId === 'shaft') return { key: 'T', lo: 100, hi: 1000 };
    return { key: 'P', lo: 200, hi: 2000 };
  },
  controls() {
    return `
      ${slider('en-p', 'load (N)', 800, 200, 8000, 20)}
      ${slider('en-k', 'axial force (kN)', 40, 5, 80, 1)}
      ${slider('en-aa', 'area (mm²)', 400, 100, 800, 10)}
      ${slider('en-l', 'length (m)', 2, 0.8, 3, 0.05)}
      ${slider('en-a', 'station from the wall (m)', 1, 0.2, 3, 0.05)}
      ${slider('en-rise', 'truss rise (m)', 0.5, 0.3, 1.5, 0.05)}
      ${slider('en-t', 'torque (N·m)', 500, 100, 1200, 10)}
      <p class="tiny">The beam is 40 mm by 80 mm, E = 200 GPa. The bars are 100 mm². The shaft uses G = 75 GPa.</p>`;
  },
  bind(api) {
    bindSlider('en-p', (s, v) => { s.P = v; }, api);
    bindSlider('en-k', (s, v) => { s.P = v * 1000; }, api);
    bindSlider('en-aa', (s, v) => { s.A = v * 1e-6; }, api);
    bindSlider('en-l', (s, v) => { s.L = v; }, api);
    bindSlider('en-a', (s, v) => { s.a = v; }, api);
    bindSlider('en-rise', (s, v) => { s.rise = v; }, api);
    bindSlider('en-t', (s, v) => { s.T = v; }, api);
  },
  syncControls(state) {
    const id = state.scenarioId;
    const beam = id === 'tip' || id === 'station';
    showField('en-p', id === 'tip' || id === 'station' || id === 'truss');
    showField('en-k', id === 'bar');
    showField('en-aa', id === 'bar');
    showField('en-l', beam || id === 'bar');
    showField('en-a', id === 'station');
    showField('en-rise', id === 'truss');
    showField('en-t', id === 'shaft');
    const set = (el, val) => {
      const node = document.getElementById(el);
      if (node && document.activeElement !== node) node.value = String(val);
    };
    set('en-p', state.P);
    set('en-k', state.P / 1000);
    set('en-aa', state.A * 1e6);
    set('en-l', state.L);
    set('en-a', state.a);
    set('en-rise', state.rise);
    set('en-t', state.T);
  },
  compute(state) {
    if (state.scenarioId === 'bar') {
      const L = Math.max(state.L, 0.2);
      const A = Math.max(state.A, 1e-6);
      const checked = axialBar(state.P, L, A, E);
      return { U: checked.U, delta: checked.delta, phi: 0, F: state.P, gap: checked.gap };
    }
    if (state.scenarioId === 'truss') {
      const c = trussClosed(state);
      const checked = twoBarTruss(c.P, c.span, c.rise, c.A, E);
      return { U: checked.U, delta: checked.delta, phi: 0, F: checked.F, gap: checked.gap };
    }
    if (state.scenarioId === 'shaft') {
      const c = shaftClosed(state);
      const checked = torsionStrain(c.T, c.L, G, c.J);
      return { U: checked.U, delta: 0, phi: checked.phi, F: 0, gap: checked.gap };
    }
    const c = beamClosed(state);
    const tip = cantileverTipEnergy(c.P, c.L, c.EI);
    const station = cantileverStation(c.P, c.L, c.a, c.EI);
    const delta = state.scenarioId === 'tip' ? tip.delta : station.delta;
    return { U: tip.U, delta, phi: 0, F: c.P, gap: Math.max(tip.gap, station.gap) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    // The chart keeps the space below (or beside) the drawing.
    const Bc = { ...B, free: R };
    if (state.scenarioId === 'bar') return drawBar(Bc, state);
    if (state.scenarioId === 'truss') return drawTruss(Bc, state);
    if (state.scenarioId === 'shaft') return drawShaft(Bc, state);
    return drawBeam(Bc, state);
  },
  law(state) {
    if (state.scenarioId === 'bar') return [String.raw`U=\frac{N^2 L}{2AE}`];
    if (state.scenarioId === 'shaft') return [String.raw`U=\frac{T^2 L}{2GJ}`];
    if (state.scenarioId === 'truss') return [String.raw`\delta=\frac{\partial U}{\partial P}`];
    return [String.raw`U=\frac{P^2 L^3}{6EI}`];
  },
  liveRows(state, c) {
    if (state.scenarioId === 'bar') {
      return [
        kv('strain energy', `${fig(c.U)} J`),
        kv('elongation', `${fig(c.delta * 1e3)} mm`),
      ].join('');
    }
    if (state.scenarioId === 'shaft') {
      return [
        kv('strain energy', `${fig(c.U)} J`),
        kv('angle of twist', `${fig(c.phi * DEG)}°`),
      ].join('');
    }
    if (state.scenarioId === 'truss') {
      return [
        kv('strain energy', `${fig(c.U)} J`),
        kv('joint drop', `${fig(c.delta * 1e3)} mm`),
        kv('bar force', `${fig(c.F / 1e3)} kN`),
      ].join('');
    }
    return [
      kv('strain energy', `${fig(c.U)} J`),
      kv('deflection', `${fig(c.delta * 1e3)} mm`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'bar') {
      return cells([
        ['energy', `${fig(c.U)} J`],
        ['elongation', `${fig(c.delta * 1e3)} mm`],
      ]);
    }
    if (state.scenarioId === 'shaft') {
      return cells([
        ['energy', `${fig(c.U)} J`],
        ['angle', `${fig(c.phi * DEG)}°`],
      ]);
    }
    if (state.scenarioId === 'truss') {
      return cells([
        ['energy', `${fig(c.U)} J`],
        ['drop', `${fig(c.delta * 1e3)} mm`],
        ['force', `${fig(c.F / 1e3)} kN`],
      ]);
    }
    return cells([
      ['energy', `${fig(c.U)} J`],
      ['deflection', `${fig(c.delta * 1e3)} mm`],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'bar') {
      return {
        title: 'Half the load times the stretch',
        body: `The bar stores ${fig(c.U)} J and stretches ${fig(c.delta * 1e3)} mm. Doubling the force quadruples the energy. Writing the energy as the force times the stretch, with no one half, doubles it.`,
      };
    }
    if (state.scenarioId === 'shaft') {
      return {
        title: 'The angle is the slope of the energy',
        body: `The shaft stores ${fig(c.U)} J and twists ${fig(c.phi * DEG)}°. Half the torque times that angle is the same energy. Doubling the torque quadruples the energy and doubles the angle.`,
      };
    }
    if (state.scenarioId === 'truss') {
      return {
        title: 'Both bars store the energy',
        body: `The joint drops ${fig(c.delta * 1e3)} mm. Each bar carries ${fig(c.F / 1e3)} kN. Raising the joint makes the bars steeper, so the same load produces a smaller drop.`,
      };
    }
    if (state.scenarioId === 'station') {
      return {
        title: 'The dummy sits at the station',
        body: `The real load is at the tip. The deflection here is ${fig(c.delta * 1e3)} mm. The energy, ${fig(c.U)} J, belongs to the tip load. Moving the station does not change that energy.`,
      };
    }
    return {
      title: 'Energy grows with the square of the load',
      body: `The tip drops ${fig(c.delta * 1e3)} mm and the beam stores ${fig(c.U)} J. Doubling the load doubles the drop and quadruples the energy. The elastic curve gives the same tip drop.`,
    };
  },
});

function drawBar(B, state) {
  const L = Math.max(state.L, 0.2);
  const A = Math.max(state.A, 1e-6);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const N = (2 * state.P * i) / 40;
    pts.push([N / 1e3, (N * N * L) / (2 * A * E)]);
  }
  const yHi = Math.max(pts[pts.length - 1][1], 0.1);
  const plot = plotIn(B, B.free, { lo: 0, hi: (2 * state.P) / 1e3 }, { lo: 0, hi: yHi * 1.1 });
  axes(plot, { xLabel: 'force (kN)', yLabel: 'strain energy (J)' });
  line(plot, pts, { color: C.gold, width: 3 });
  dot(plot, state.P / 1e3, (state.P * state.P * L) / (2 * A * E), { color: C.pink, r: 5 });
}

function drawBeam(B, state) {
  const c = beamClosed(state);
  const curve = cantileverTipDeflection(Math.abs(c.P), c.L, c.EI);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = (c.L * i) / 40;
    pts.push([x, -curve.at(x).y * 1e3]);
  }
  const yHi = Math.max(c.tip * 1e3, 0.1);
  const P = plotIn(B, B.free, { lo: 0, hi: c.L * 1.05 }, { lo: 0, hi: yHi * 1.15 });
  axes(P, { xLabel: 'x (m)', yLabel: 'downward deflection (mm)' });
  line(P, pts, { color: C.gold, width: 3 });
  dot(P, c.L, c.tip * 1e3, { color: C.pink, r: 5 });
  if (state.scenarioId === 'station') dot(P, c.a, c.delta * 1e3, { color: C.teal, r: 5 });
}

function drawTruss(B, state) {
  const c = trussClosed(state);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const P = (2 * c.P * i) / 40;
    const F = P / (2 * c.sin);
    pts.push([P / 1e3, (F * F * c.len) / (c.A * E)]);
  }
  const yHi = Math.max(pts[pts.length - 1][1], 0.1);
  const plot = plotIn(B, B.free, { lo: 0, hi: (2 * c.P) / 1e3 }, { lo: 0, hi: yHi * 1.1 });
  axes(plot, { xLabel: 'load (kN)', yLabel: 'strain energy (J)' });
  line(plot, pts, { color: C.gold, width: 3 });
  dot(plot, c.P / 1e3, c.U, { color: C.pink, r: 5 });
}

function drawShaft(B, state) {
  const c = shaftClosed(state);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const T = (2 * c.T * i) / 40;
    pts.push([T, (T * T * c.L) / (2 * G * c.J)]);
  }
  const yHi = Math.max(pts[pts.length - 1][1], 0.1);
  const plot = plotIn(B, B.free, { lo: 0, hi: 2 * c.T }, { lo: 0, hi: yHi * 1.1 });
  axes(plot, { xLabel: 'torque (N·m)', yLabel: 'strain energy (J)' });
  line(plot, pts, { color: C.gold, width: 3 });
  dot(plot, c.T, c.U, { color: C.pink, r: 5 });
}
