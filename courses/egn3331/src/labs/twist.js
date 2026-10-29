import { shaftSketch } from './elements.js';
import { FT_LBF_PER_S_PER_HP, M_PER_FT, N_PER_LBF } from '@flux/subjects/convert.js';
import { fixedFixedTorsion, gearPair, polarJ, roundShaft, seriesTwist, torqueFromHorsepower, torqueFromPower } from '@flux/subjects/mechanics/torsion.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, axes, begin, C, circle, dot, hidden, label, line, panes, plotIn, poly, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that torque is power over angular speed, that a series shaft adds
 * the twists of its segments, and that a shaft fixed at both ends puts the
 * larger torque on the shorter side.
 *
 * Second method: horsepower and rpm against watts, the series spring against
 * the sum of TL/GJ, and the two-spring split against T(L−a)/L.
 */

const G = 75e9;
const DEG = 180 / Math.PI;

const SCENARIOS = [
  {
    id: 'power', name: '20 kW at 1800 rpm',
    P: 20e3, rpm: 1800, d: 0.03, L: 0.8,
    T: 400, a: 0.5, d1: 0.04, L1: 0.8, d2: 0.025, L2: 0.4, teeth1: 20, teeth2: 40,
  },
  {
    id: 'step', name: 'Two diameters, one torque',
    P: 20e3, rpm: 1800, d: 0.03, L: 0.8,
    T: 400, a: 0.5, d1: 0.04, L1: 0.8, d2: 0.025, L2: 0.4, teeth1: 20, teeth2: 40,
  },
  {
    id: 'gear', name: '2 to 1 reduction',
    P: 10e3, rpm: 1800, d: 0.03, L: 0.6,
    T: 400, a: 0.5, d1: 0.03, L1: 0.6, d2: 0.03, L2: 0.6, teeth1: 20, teeth2: 40,
  },
  {
    id: 'fixed', name: 'Fixed at both ends',
    P: 20e3, rpm: 1800, d: 0.04, L: 1.5,
    T: 600, a: 0.5, d1: 0.04, L1: 0.8, d2: 0.025, L2: 0.4, teeth1: 20, teeth2: 40,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, G, ...sc });
}

function powerOf(state) {
  const rpm = Math.max(state.rpm, 60);
  const drive = torqueFromPower(state.P, rpm);
  const d = Math.max(state.d, 0.008);
  const L = Math.max(state.L, 0.05);
  const shaft = roundShaft(drive.T, L, state.G || G, d, 0);
  const hp = state.P / (FT_LBF_PER_S_PER_HP * N_PER_LBF * M_PER_FT);
  const back = torqueFromHorsepower(hp, rpm).T;
  const gapT = Math.abs(back - drive.T) / Math.max(Math.abs(drive.T), 1);
  return {
    T: drive.T, tau: shaft.tauMax, phi: shaft.phi, d, L, rpm,
    T2: 0, tau2: 0, phi2: 0, Tleft: 0, Tright: 0,
    gap: Math.max(shaft.gap, gapT),
    kind: 'power',
  };
}

function stepOf(state) {
  const d1 = Math.max(state.d1, 0.008);
  const d2 = Math.max(state.d2, 0.008);
  const L1 = Math.max(state.L1, 0.05);
  const L2 = Math.max(state.L2, 0.05);
  const series = seriesTwist([{ d: d1, L: L1 }, { d: d2, L: L2 }], state.G || G, state.T);
  const g1 = roundShaft(state.T, L1, state.G || G, d1, 0).gap;
  const g2 = roundShaft(state.T, L2, state.G || G, d2, 0).gap;
  const gapK = Math.abs(series.phi - series.phiK) / Math.max(Math.abs(series.phi), 1e-18);
  return {
    T: state.T, tau: series.parts[1].tauMax, phi: series.phi,
    T2: series.parts[0].T, tau2: series.parts[0].tauMax, phi2: series.parts[1].phi,
    Tleft: 0, Tright: 0,
    d1, d2, L1, L2, parts: series.parts,
    gap: Math.max(g1, g2, gapK),
    kind: 'step',
  };
}

function gearOf(state) {
  const rpm = Math.max(state.rpm, 60);
  const drive = torqueFromPower(state.P, rpm);
  const teeth2 = Math.max(state.teeth2, state.teeth1);
  const gear = gearPair(drive.T, rpm, state.teeth1, teeth2);
  const d1 = Math.max(state.d1, 0.008);
  const d2 = Math.max(state.d2, 0.008);
  const L1 = Math.max(state.L1, 0.05);
  const L2 = Math.max(state.L2, 0.05);
  const a = roundShaft(drive.T, L1, state.G || G, d1, 0);
  const b = roundShaft(gear.T2, L2, state.G || G, d2, 0);
  const powerGap = Math.abs(drive.T * rpm - gear.T2 * gear.rpm2) / Math.max(Math.abs(drive.T * rpm), 1);
  return {
    T: drive.T, tau: a.tauMax, phi: a.phi,
    T2: gear.T2, tau2: b.tauMax, phi2: b.phi,
    Tleft: 0, Tright: 0,
    d1, d2, ro1: d1 / 2, ro2: d2 / 2, J1: a.J, J2: b.J,
    gap: Math.max(a.gap, b.gap, powerGap),
    kind: 'gear',
  };
}

function fixedOf(state) {
  const d = Math.max(state.d, 0.008);
  const L = Math.max(state.L, 0.3);
  const a = Math.min(Math.max(state.a, 0.05 * L), 0.95 * L);
  const J = polarJ(d / 2, 0);
  const ends = fixedFixedTorsion(state.T, L, a, state.G || G, J);
  const recovered = roundShaft(ends.Tleft, a, state.G || G, d, 0);
  return {
    T: state.T, tau: recovered.tauMax, phi: ends.phi,
    T2: 0, tau2: 0, phi2: 0,
    Tleft: ends.Tleft, Tright: ends.Tright,
    d, L, a, J,
    gap: Math.max(ends.gap, recovered.gap),
    kind: 'fixed',
  };
}

function model(state) {
  if (state.scenarioId === 'step') return stepOf(state);
  if (state.scenarioId === 'gear') return gearOf(state);
  if (state.scenarioId === 'fixed') return fixedOf(state);
  return powerOf(state);
}

/** The shafts, their supports and torques, with a surface line slanting as each section turns. */
function member(B, rect, state, c, veiled) {
  const Gm = state.G || G;
  const id = state.scenarioId;
  if (id === 'gear') {
    const L = Math.max(state.L1, 0.05);
    const r1 = 0.05 * L * Math.sqrt(state.teeth1 / 20);
    const r2 = r1 * (Math.max(state.teeth2, state.teeth1) / state.teeth1);
    const S = sceneIn(B, rect, { x0: -0.1 * L, x1: 1.3 * L, y0: -r2 - 0.2 * L, y1: r1 + 0.25 * L }, 8);
    const rs = 0.025 * L;
    shaftSketch(S, [{ x0: 0, x1: L, r: rs }], { torques: [{ x: 0, T: 1, text: veiled ? '' : `T₁ ${fig(c.T)} N·m` }] });
    const S2y = -(r1 + r2);
    poly(S, [[0.2 * L, S2y - rs], [L, S2y - rs], [L, S2y + rs], [0.2 * L, S2y + rs]], { fill: alpha(C.text, 0.1), stroke: C.text });
    circle(S, [L, 0], r1, { stroke: C.gold, fill: alpha(C.gold, 0.15), width: 2 });
    circle(S, [L, S2y], r2, { stroke: C.teal, fill: alpha(C.teal, 0.12), width: 2 });
    if (!veiled) {
      label(S, `${state.teeth1} teeth`, [L, r1], { color: C.gold, dy: -10 });
      label(S, `${Math.max(state.teeth2, state.teeth1)} teeth, T₂ ${fig(c.T2)} N·m`, [L, S2y - r2], { color: C.teal, dy: 12 });
    }
    return;
  }
  let segs;
  let walls = [0];
  let torques;
  let phi;
  if (id === 'step') {
    const L1 = Math.max(state.L1, 0.05);
    const L2 = Math.max(state.L2, 0.05);
    const J1 = polarJ(Math.max(state.d1, 0.008) / 2, 0);
    const J2 = polarJ(Math.max(state.d2, 0.008) / 2, 0);
    const big = Math.max(state.d1, state.d2);
    const sc = (0.1 * (L1 + L2)) / big;
    segs = [{ x0: 0, x1: L1, r: sc * state.d1 }, { x0: L1, x1: L1 + L2, r: sc * state.d2 }];
    torques = [{ x: L1 + L2, T: 1, text: veiled ? '' : `T ${fig(state.T)} N·m` }];
    phi = (x) => (x <= L1 ? (state.T * x) / (Gm * J1) : (state.T * L1) / (Gm * J1) + (state.T * (x - L1)) / (Gm * J2));
  } else if (id === 'fixed') {
    const L = Math.max(state.L, 0.3);
    const a = Math.min(Math.max(state.a, 0.05 * L), 0.95 * L);
    const J = polarJ(Math.max(state.d, 0.008) / 2, 0);
    segs = [{ x0: 0, x1: L, r: 0.07 * L }];
    walls = [0, L];
    torques = [{ x: a, T: 1, text: veiled ? '' : `T ${fig(state.T)} N·m` }];
    phi = (x) => (x <= a ? (c.Tleft * x) / (Gm * J) : (c.Tright * (L - x)) / (Gm * J));
    if (!veiled) {
      const S0 = sceneIn(B, rect, { x0: -0.1 * L, x1: 1.1 * L, y0: -0.3 * L, y1: 0.3 * L }, 8);
      label(S0, `${fig(c.Tleft)} N·m`, [0, -0.07 * L], { color: C.purple, dy: 26, align: 'left', dx: 6 });
      label(S0, `${fig(c.Tright)} N·m`, [L, -0.07 * L], { color: C.purple, dy: 26, align: 'right', dx: -6 });
    }
  } else {
    const L = Math.max(state.L, 0.05);
    const J = polarJ(Math.max(state.d, 0.008) / 2, 0);
    segs = [{ x0: 0, x1: L, r: 0.07 * L }];
    walls = [];
    torques = [
      { x: 0, T: 1, text: veiled ? '' : `motor, ${fig(state.P / 1e3)} kW at ${fig(state.rpm)} rpm` },
      { x: L, T: -1, text: veiled ? '' : `load, T ${fig(c.T)} N·m` },
    ];
    phi = (x) => (c.T * x) / (Gm * J);
  }
  const L = Math.max(...segs.map((s) => s.x1));
  const rmax = Math.max(...segs.map((s) => s.r));
  const S = sceneIn(B, rect, { x0: -0.1 * L, x1: 1.1 * L, y0: -Math.max(0.3 * L, 2.5 * rmax), y1: Math.max(0.3 * L, 2.5 * rmax) }, 8);
  let top = 1e-12;
  for (let i = 0; i <= 20; i++) top = Math.max(top, Math.abs(phi((L * i) / 20)));
  shaftSketch(S, segs, { walls, torques, phi, k: 1.1 / top });
}

export default defineLab({
  id: 'twist',
  exam: 'u9',
  title: 'Twist',
  hint: 'Torque is power over angular speed. A faster shaft carries less torque. Between two walls, the shorter side carries more.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('power', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'step') return { key: 'd2', lo: 0.015, hi: 0.05 };
    if (state.scenarioId === 'gear') return { key: 'rpm', lo: 600, hi: 3600 };
    if (state.scenarioId === 'fixed') return { key: 'a', lo: 0.2, hi: 1.3 };
    return { key: 'P', lo: 5e3, hi: 40e3 };
  },
  controls() {
    return `
      ${slider('tw-p', 'power (kW)', 20, 5, 40, 0.5)}
      ${slider('tw-n', 'speed (rpm)', 1800, 600, 3600, 50)}
      ${slider('tw-d', 'diameter (mm)', 30, 15, 60, 1)}
      ${slider('tw-l', 'length (m)', 0.8, 0.2, 2, 0.05)}
      ${slider('tw-t', 'torque (N·m)', 400, 100, 1000, 10)}
      ${slider('tw-d1', 'left diameter (mm)', 40, 20, 60, 1)}
      ${slider('tw-l1', 'left length (m)', 0.8, 0.2, 1.5, 0.05)}
      ${slider('tw-d2', 'right diameter (mm)', 25, 15, 50, 1)}
      ${slider('tw-l2', 'right length (m)', 0.4, 0.2, 1.5, 0.05)}
      ${slider('tw-a', 'load from the left wall (m)', 0.5, 0.2, 1.3, 0.05)}
      <p class="tiny">G is 75 GPa. The gear pair is 20 teeth driving 40, and it loses no power. On the fixed shaft the torque is applied between the walls.</p>`;
  },
  bind(api) {
    bindSlider('tw-p', (s, v) => { s.P = v * 1000; }, api);
    bindSlider('tw-n', (s, v) => { s.rpm = v; }, api);
    bindSlider('tw-d', (s, v) => { s.d = v * 1e-3; }, api);
    bindSlider('tw-l', (s, v) => { s.L = v; }, api);
    bindSlider('tw-t', (s, v) => { s.T = v; }, api);
    bindSlider('tw-d1', (s, v) => { s.d1 = v * 1e-3; }, api);
    bindSlider('tw-l1', (s, v) => { s.L1 = v; }, api);
    bindSlider('tw-d2', (s, v) => { s.d2 = v * 1e-3; }, api);
    bindSlider('tw-l2', (s, v) => { s.L2 = v; }, api);
    bindSlider('tw-a', (s, v) => { s.a = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('tw-p', state.P / 1000);
    set('tw-n', state.rpm);
    set('tw-d', state.d * 1e3);
    set('tw-l', state.L);
    set('tw-t', state.T);
    set('tw-d1', state.d1 * 1e3);
    set('tw-l1', state.L1);
    set('tw-d2', state.d2 * 1e3);
    set('tw-l2', state.L2);
    set('tw-a', state.a);
    const id = state.scenarioId;
    showField('tw-p', id === 'power' || id === 'gear');
    showField('tw-n', id === 'power' || id === 'gear');
    showField('tw-d', id === 'power' || id === 'fixed');
    showField('tw-l', id === 'power' || id === 'fixed');
    showField('tw-t', id === 'step' || id === 'fixed');
    showField('tw-d1', id === 'step' || id === 'gear');
    showField('tw-l1', id === 'step' || id === 'gear');
    showField('tw-d2', id === 'step' || id === 'gear');
    showField('tw-l2', id === 'step' || id === 'gear');
    showField('tw-a', id === 'fixed');
  },
  compute(state) {
    const m = model(state);
    return {
      T: m.T, tau: m.tau, phi: m.phi,
      T2: m.T2, tau2: m.tau2, phi2: m.phi2,
      Tleft: m.Tleft, Tright: m.Tright,
      gap: m.gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    // The chart keeps the space below (or beside) the drawing.
    const Bc = { ...B, free: R };
    if (state.scenarioId === 'gear') return drawGear(Bc, state);
    if (state.scenarioId === 'fixed') return drawFixed(Bc, state);
    if (state.scenarioId === 'step') return drawStep(Bc, state);
    return drawPower(Bc, state);
  },
  law(state) {
    if (state.scenarioId === 'step') return [String.raw`\phi=\sum\frac{TL}{GJ}`];
    if (state.scenarioId === 'gear') return [String.raw`\frac{T_2}{T_1}=\frac{N_2}{N_1}`];
    if (state.scenarioId === 'fixed') return [String.raw`T_L=\frac{T(L-a)}{L}`];
    return [String.raw`T=\frac{P}{\omega}`];
  },
  liveRows(state, c) {
    if (state.scenarioId === 'gear') {
      return [
        kv('fast-shaft torque', `${fig(c.T)} N·m`),
        kv('slow-shaft torque', `${fig(c.T2)} N·m`),
        kv('fast-shaft shear', `${fig(c.tau / 1e6)} MPa`),
        kv('slow-shaft shear', `${fig(c.tau2 / 1e6)} MPa`),
      ].join('');
    }
    if (state.scenarioId === 'fixed') {
      return [
        kv('left reaction', `${fig(c.Tleft)} N·m`),
        kv('right reaction', `${fig(c.Tright)} N·m`),
        kv('rotation at the load', `${fig(c.phi * DEG)}°`),
        kv('outer shear on the left', `${fig(c.tau / 1e6)} MPa`),
      ].join('');
    }
    if (state.scenarioId === 'step') {
      return [
        kv('total angle', `${fig(c.phi * DEG)}°`),
        kv('right-segment angle', `${fig(c.phi2 * DEG)}°`),
        kv('right-segment shear', `${fig(c.tau / 1e6)} MPa`),
        kv('left-segment shear', `${fig(c.tau2 / 1e6)} MPa`),
      ].join('');
    }
    return [
      kv('torque', `${fig(c.T)} N·m`),
      kv('outer shear', `${fig(c.tau / 1e6)} MPa`),
      kv('angle of twist', `${fig(c.phi * DEG)}°`),
      kv('speed', `${fig(state.rpm)} rpm`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'gear') {
      return cells([
        ['T fast', `${fig(c.T)} N·m`],
        ['T slow', `${fig(c.T2)} N·m`],
        ['τ slow', `${fig(c.tau2 / 1e6)} MPa`],
        ['angle', `${fig(c.phi2 * DEG)}°`],
      ]);
    }
    if (state.scenarioId === 'fixed') {
      return cells([
        ['left', `${fig(c.Tleft)} N·m`],
        ['right', `${fig(c.Tright)} N·m`],
        ['angle', `${fig(c.phi * DEG)}°`],
        ['shear', `${fig(c.tau / 1e6)} MPa`],
      ]);
    }
    if (state.scenarioId === 'step') {
      return cells([
        ['angle', `${fig(c.phi * DEG)}°`],
        ['right', `${fig(c.phi2 * DEG)}°`],
        ['τ right', `${fig(c.tau / 1e6)} MPa`],
        ['τ left', `${fig(c.tau2 / 1e6)} MPa`],
      ]);
    }
    return cells([
      ['torque', `${fig(c.T)} N·m`],
      ['shear', `${fig(c.tau / 1e6)} MPa`],
      ['angle', `${fig(c.phi * DEG)}°`],
      ['speed', `${fig(state.rpm)} rpm`],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'gear') {
      return {
        title: 'The slower shaft carries more torque',
        body: `The 20-tooth gear drives the 40-tooth gear, so the output turns at half speed and carries ${fig(c.T2)} N·m. The input carries ${fig(c.T)} N·m. The same diameter then sees twice the shear on the slow shaft, ${fig(c.tau2 / 1e6)} MPa against ${fig(c.tau / 1e6)} MPa.`,
      };
    }
    if (state.scenarioId === 'fixed') {
      return {
        title: 'The shorter side carries more torque',
        body: `The left wall takes ${fig(c.Tleft)} N·m and the right wall takes ${fig(c.Tright)} N·m. The load sits ${fig(state.a)} m from the left on a ${fig(state.L)} m shaft. The rotation there is ${fig(c.phi * DEG)}°.`,
      };
    }
    if (state.scenarioId === 'step') {
      return {
        title: 'The angles add',
        body: `The right segment twists ${fig(c.phi2 * DEG)}° and sees ${fig(c.tau / 1e6)} MPa. The whole shaft twists ${fig(c.phi * DEG)}°. The left segment sees ${fig(c.tau2 / 1e6)} MPa. Same torque, and J follows the fourth power of the diameter.`,
      };
    }
    return {
      title: 'Torque is power over speed',
        body: `${fig(state.P / 1000)} kW at ${fig(state.rpm)} rpm is a torque of ${fig(c.T)} N·m. The outside sees ${fig(c.tau / 1e6)} MPa, and the shaft twists ${fig(c.phi * DEG)}°. Double the speed at the same power and the torque halves.`,
    };
  },
});

function rotation(parts, Gmod) {
  const pts = [];
  let x0 = 0;
  let phi = 0;
  for (const p of parts) {
    for (let i = 0; i <= 16; i++) {
      const x = x0 + (p.L * i) / 16;
      const y = phi + (p.T * (x - x0)) / (Gmod * p.J);
      pts.push([x, y * DEG]);
    }
    phi += (p.T * p.L) / (Gmod * p.J);
    x0 += p.L;
  }
  return { pts, x1: x0, y1: phi * DEG };
}

function plotAngle(B, pts, x1, y1, mark) {
  const yHi = Math.max(y1, 0.1);
  const P = plotIn(B, B.free, { lo: 0, hi: x1 }, { lo: 0, hi: yHi * 1.12 });
  axes(P, { xLabel: 'x (m)', yLabel: 'rotation (deg)' });
  line(P, pts, { color: C.gold, width: 3 });
  if (mark != null) line(P, [[mark, 0], [mark, yHi * 1.12]], { color: C.pink, width: 2, dash: [5, 4] });
  dot(P, x1, y1, { color: C.gold, r: 5 });
}

function drawPower(B, state) {
  const rpm = Math.max(state.rpm, 60);
  const T = torqueFromPower(state.P, rpm).T;
  const d = Math.max(state.d, 0.008);
  const L = Math.max(state.L, 0.05);
  const J = polarJ(d / 2, 0);
  const { pts, x1, y1 } = rotation([{ T, L, J }], state.G || G);
  plotAngle(B, pts, x1, y1, null);
}

function drawStep(B, state) {
  const Gmod = state.G || G;
  const parts = [state.d1, state.d2].map((d, i) => ({
    T: state.T,
    L: Math.max(i === 0 ? state.L1 : state.L2, 0.05),
    J: polarJ(Math.max(d, 0.008) / 2, 0),
  }));
  const { pts, x1, y1 } = rotation(parts, Gmod);
  plotAngle(B, pts, x1, y1, parts[0].L);
}

function drawFixed(B, state) {
  const d = Math.max(state.d, 0.008);
  const L = Math.max(state.L, 0.3);
  const a = Math.min(Math.max(state.a, 0.05 * L), 0.95 * L);
  const J = polarJ(d / 2, 0);
  const ends = fixedFixedTorsion(state.T, L, a, state.G || G, J);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = (L * i) / 40;
    const phi = x <= a ? (ends.Tleft * x) / ((state.G || G) * J) : (ends.Tright * (L - x)) / ((state.G || G) * J);
    pts.push([x, phi * DEG]);
  }
  const yHi = Math.max(...pts.map((p) => p[1]), 0.1);
  const P = plotIn(B, B.free, { lo: 0, hi: L }, { lo: 0, hi: yHi * 1.12 });
  axes(P, { xLabel: 'x (m)', yLabel: 'rotation (deg)' });
  line(P, pts, { color: C.gold, width: 3 });
  line(P, [[a, 0], [a, yHi * 1.12]], { color: C.pink, width: 2, dash: [5, 4] });
  dot(P, a, ends.phi * DEG, { color: C.gold, r: 5 });
}

function drawGear(B, state) {
  const rpm = Math.max(state.rpm, 60);
  const drive = torqueFromPower(state.P, rpm);
  const gear = gearPair(drive.T, rpm, state.teeth1, Math.max(state.teeth2, state.teeth1));
  const d1 = Math.max(state.d1, 0.008);
  const d2 = Math.max(state.d2, 0.008);
  const J1 = polarJ(d1 / 2, 0);
  const J2 = polarJ(d2 / 2, 0);
  const ro = Math.max(d1, d2) / 2;
  const pts1 = [];
  const pts2 = [];
  for (let i = 0; i <= 20; i++) {
    const rho = (ro * i) / 20;
    pts1.push([rho * 1000, torsionAt(drive.T, rho, J1)]);
    pts2.push([rho * 1000, torsionAt(gear.T2, rho, J2)]);
  }
  const yHi = Math.max(pts1[pts1.length - 1][1], pts2[pts2.length - 1][1], 1);
  const P = plotIn(B, B.free, { lo: 0, hi: ro * 1000 * 1.05 }, { lo: 0, hi: yHi * 1.12 });
  axes(P, { xLabel: 'radius (mm)', yLabel: 'shear stress (MPa)' });
  line(P, pts1, { color: C.gold, width: 3 });
  line(P, pts2, { color: C.teal, width: 3 });
}

function torsionAt(T, rho, J) {
  return (T * rho) / J / 1e6;
}
