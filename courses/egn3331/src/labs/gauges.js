import { principal2 } from '@flux/subjects/mechanics/materials.js';
import {
  deltaRosette, planeStressFromStrain, principalStrains, rectangularRosette, rosette, strainTransform,
} from '@flux/subjects/mechanics/strain.js';
import { torqueFromHorsepower } from '@flux/subjects/mechanics/torsion.js';
import { MOTOR_D_IN, MOTOR_E_KSI, MOTOR_HP, MOTOR_NU, MOTOR_RPM } from '../data/motor.js';
import { TANK_OD_IN, TANK_P_PSI, TANK_T_IN } from '../data/tank.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, circle, couple, dot, hidden, label, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a strain gauge reads strain along one line, not stress: on a propane cylinder the
 * gauge along the axis reads 128 µε, and E times that is 3.7 ksi, not the 9.3 ksi axial stress.
 * Three gauges at known angles fix the whole strain state, so the rosette recovers both wall
 * stresses even when it is glued on crooked. On a motor shaft, two gauges at ±45° read the torque;
 * twist them off line and the pair reads low while the full rosette still reads true.
 *
 * Cited: the cylinder is the Manchester 20 lb DOT-4BA240 (src/data/tank.js): 12.2 in outside
 * diameter, 0.078 in minimum wall, 240 psig service pressure. The shaft is the Baldor EM3615T-5
 * (src/data/motor.js): 5 hp at 1750 rpm on a 1.125 in shaft. E = 29,000 ksi is the AISC value for
 * steel; ν = 0.3 is assumed. The rosette angles, its tilt and the shaft speeds off the nameplate are
 * assumed. Recompute: Hooke's law gives the strains, the transformation gives each reading, and a
 * general three-gauge solve inverts them. Second method: the closed-form 0-45-90 or 0-60-120
 * rosette in the gauge's own frame, whose principal strains must match, and the recovered stresses
 * against pr/t, pr/2t and 16T/πd³.
 */

const E = MOTOR_E_KSI * 1000;
const NU = MOTOR_NU;
const G = E / (2 * (1 + NU));
const OUT = 'A gauge reads the average strain under its grid, a few millimetres long, so it misses a gradient sharper than that. The wall is thin and the stress through it uniform; near the foot ring, the collar and the welds it is not. A few degrees of temperature change reads like real strain unless the gauge is matched to the steel or bridged against a dummy. E and ν are book values. On a turning shaft the signal leaves through slip rings or a radio link.';

const SCENARIOS = [
  { id: 'tank', name: 'Rosette on a propane cylinder', mode: 'tank', type: 'rect', p: TANK_P_PSI, phi: 0 },
  { id: 'tilted', name: 'The same rosette, glued 20° off', mode: 'tank', type: 'rect', p: TANK_P_PSI, phi: 20 },
  { id: 'delta', name: 'A 0-60-120 rosette on the cylinder', mode: 'tank', type: 'delta', p: TANK_P_PSI, phi: 0 },
  { id: 'shaft', name: 'Torque gauges on a motor shaft', mode: 'shaft', type: 'rect', hp: MOTOR_HP, rpm: MOTOR_RPM, phi: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, mode: sc.mode, type: sc.type, phi: sc.phi,
    p: sc.p ?? TANK_P_PSI, hp: sc.hp ?? MOTOR_HP, rpm: sc.rpm ?? MOTOR_RPM,
  });
}

/** The gauge directions from the rosette's base line: a, b, c. Torque gauges sit at −45°, 0, +45°. */
function gaugeAngles(state) {
  if (state.mode === 'shaft') return [-45, 0, 45];
  return state.type === 'delta' ? [0, 60, 120] : [0, 45, 90];
}

/** The applied stresses in psi, x along the tank or shaft axis, y around it. */
function loads(state) {
  if (state.mode === 'shaft') {
    const T = torqueFromHorsepower(Number(state.hp) || 0, Math.max(Number(state.rpm) || 1, 1)).T_lbf_in;
    return { sx: 0, sy: 0, txy: (16 * T) / (Math.PI * MOTOR_D_IN ** 3), T };
  }
  const r = TANK_OD_IN / 2 - TANK_T_IN;
  const p = Number(state.p) || 0;
  return { sx: (p * r) / (2 * TANK_T_IN), sy: (p * r) / TANK_T_IN, txy: 0, T: 0 };
}

export function readGauges(state) {
  const L = loads(state);
  const ex = (L.sx - NU * L.sy) / E;
  const ey = (L.sy - NU * L.sx) / E;
  const gxy = L.txy / G;
  const phi = Number(state.phi) || 0;
  const local = gaugeAngles(state);
  const abs = local.map((a) => a + phi);
  const read = abs.map((a) => strainTransform(ex, ey, gxy, a).e);
  // Recompute: three readings, three unknowns, solved in the tank's own axes.
  const back = rosette(abs, read);
  const st = planeStressFromStrain(back.ex, back.ey, back.gxy, E, NU);
  const ps = principal2(st.sx, st.sy, st.txy);
  const pe = principalStrains(back.ex, back.ey, back.gxy);
  // The pair of ±45° gauges, read as if they sat on line: γ = εc − εa.
  const pairT = (G * (read[2] - read[0]) * Math.PI * MOTOR_D_IN ** 3) / 16;
  const rosT = (st.txy * Math.PI * MOTOR_D_IN ** 3) / 16;
  // Second method: the closed-form rosette in its own frame. The principal strains do not care
  // which frame found them, and the recovered stresses must be the ones applied.
  const own = state.type === 'delta' && state.mode !== 'shaft'
    ? deltaRosette(read[0], read[1], read[2])
    : rectangularRosette(read[0], read[1], read[2]);
  const po = principalStrains(own.ex, own.ey, own.gxy);
  const scaleE = Math.max(Math.abs(pe.e1), Math.abs(pe.e2), 1e-12);
  const scaleS = Math.max(Math.abs(L.sx), Math.abs(L.sy), Math.abs(L.txy), 1);
  const gap = Math.max(
    Math.abs(po.e1 - pe.e1) / scaleE,
    Math.abs(po.e2 - pe.e2) / scaleE,
    Math.abs(st.sx - L.sx) / scaleS,
    Math.abs(st.sy - L.sy) / scaleS,
    Math.abs(st.txy - L.txy) / scaleS,
  );
  return {
    ...L, ex, ey, gxy, phi, local, abs, read, back, st, ps, pe, pairT, rosT, naive: E * read[0], gap,
  };
}

/** Each gauge as a short grid on its line, labelled at its end with the reading. */
function rosetteGlyph(S, at, r, c, veiled) {
  const names = ['a', 'b', 'c'];
  const colors = [C.gold, C.teal, C.yellow];
  circle(S, at, 1.12 * r, { stroke: alpha(C.text, 0.25), fill: alpha(C.bg, 0.6), width: 1 });
  c.abs.forEach((deg, i) => {
    const t = (deg * Math.PI) / 180;
    const u = [Math.cos(t), Math.sin(t)];
    const p0 = [at[0] - 0.85 * r * u[0], at[1] - 0.85 * r * u[1]];
    const p1 = [at[0] + 0.85 * r * u[0], at[1] + 0.85 * r * u[1]];
    seg(S, p0, p1, { color: colors[i], width: 4 });
    if (!veiled) {
      const tip = [at[0] + 0.9 * r * u[0], at[1] + 0.9 * r * u[1]];
      label(S, names[i], tip, { color: colors[i], dx: 10 * u[0], dy: -10 * u[1], bold: true });
    }
  });
}

function member(B, rect, state, c, veiled) {
  const S = sceneIn(B, rect, { x0: -2, x1: 2, y0: -1.7, y1: 1.7 }, 12);
  if (state.mode === 'shaft') {
    // Motor body at the left, the 1.125 in shaft running right, the load's torque at its end.
    poly(S, [[-2, -0.75], [-1.1, -0.75], [-1.1, 0.75], [-2, 0.75]], { fill: alpha(C.muted, 0.25), stroke: C.muted });
    poly(S, [[-1.1, -0.3], [1.7, -0.3], [1.7, 0.3], [-1.1, 0.3]], { fill: alpha(C.text, 0.12), stroke: C.text });
    rosetteGlyph(S, [0.2, 0], 0.7, c, veiled);
    couple(S, [1.7, 0], { r: 14, ccw: false, color: C.pink });
    if (!veiled) {
      label(S, `${fig(state.hp)} hp, ${fig(state.rpm)} rpm`, [-2, 0.75], { color: C.dim, dy: -12, align: 'left' });
      label(S, `T = ${fig(c.T)} lbf·in`, [0.2, -1.2], { color: C.pink });
    }
    return;
  }
  // The cylinder on its side: hoop runs up the page, the axis runs across it.
  poly(S, [[-1.6, -1.05], [1.6, -1.05], [1.6, 1.05], [-1.6, 1.05]], { fill: alpha(C.text, 0.08), stroke: C.text });
  poly(S, [[1.6, -0.25], [1.9, -0.25], [1.9, 0.25], [1.6, 0.25]], { fill: alpha(C.muted, 0.3), stroke: C.muted });
  rosetteGlyph(S, [-0.2, 0], 0.62, c, veiled);
  arrow(S, [-1.6, -1.35], 0, 34, { color: C.dim, width: 1.5, head: 6 });
  if (!veiled) {
    label(S, 'axis', [-1.6, -1.35], { color: C.dim, dx: 48, align: 'left' });
    label(S, `${fig(state.p)} psi inside`, [0, 1.05], { color: C.pink, dy: -12 });
  }
}

export default defineLab({
  id: 'gauges',
  exam: 'u4',
  title: 'Strain gauges',
  app: true,
  hint: 'A gauge reads strain along its own line. Three gauges at known angles fix εx, εy and γ; Hooke then gives the stresses.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('tank', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => (state.mode === 'shaft'
    ? { key: 'rpm', lo: 600, hi: 3600 }
    : { key: 'phi', lo: -45, hi: 45 }),
  controls() {
    return `
      ${slider('gg-p', 'cylinder pressure (psi)', TANK_P_PSI, 0, 300, 5)}
      ${slider('gg-h', 'motor load (hp)', MOTOR_HP, 0.5, 7.5, 0.25)}
      ${slider('gg-r', 'shaft speed (rpm)', MOTOR_RPM, 600, 3600, 25)}
      ${slider('gg-f', 'rosette tilt from the axis (°)', 0, -45, 45, 1)}
      <p class="tiny">Cited: Manchester 20 lb DOT-4BA240 cylinder, 12.2 in OD, 0.078 in minimum wall (49 CFR 178.51), 240 psig service pressure. Baldor EM3615T-5, 5 hp at 1750 rpm, 1.125 in shaft. E = 29,000 ksi (AISC, steel). ν = 0.3, the rosette angles and the tilt are assumed.</p>`;
  },
  bind(api) {
    bindSlider('gg-p', (s, v) => { s.p = v; }, api);
    bindSlider('gg-h', (s, v) => { s.hp = v; }, api);
    bindSlider('gg-r', (s, v) => { s.rpm = v; }, api);
    bindSlider('gg-f', (s, v) => { s.phi = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('gg-p', state.p);
    set('gg-h', state.hp);
    set('gg-r', state.rpm);
    set('gg-f', state.phi);
    showField('gg-p', state.mode !== 'shaft');
    showField('gg-h', state.mode === 'shaft');
    showField('gg-r', state.mode === 'shaft');
  },
  compute(state) {
    const r = readGauges(state);
    return {
      ...r,
      ra: r.read[0],
      rb: r.read[1],
      rc: r.read[2],
      hoop: r.st.sy,
      axial: r.st.sx,
      e1: r.pe.e1,
      e2: r.pe.e2,
      s1: r.ps.s1,
      s2: r.ps.s2,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.5);
    member(B, D, state, c, veiled);
    if (veiled) return;
    // Mohr's circle for strain, in µε: ε to the right, γ/2 plotted downward. Each gauge is a
    // point on it, twice its angle around from the axis point.
    const u = 1e6;
    const cen = (c.pe.e1 + c.pe.e2) / 2 * u;
    const rad = ((c.pe.e1 - c.pe.e2) / 2) * u;
    const lo = Math.min(c.pe.e2 * u, 0);
    const hi = Math.max(c.pe.e1 * u, 0);
    const half = Math.max((hi - lo) / 2, rad, 1);
    const pad = half * 0.25;
    const M = sceneIn(B, R, { x0: lo - pad, x1: hi + pad, y0: -half - pad, y1: half + pad }, 16);
    seg(M, [lo - pad, 0], [hi + pad, 0], { color: alpha(C.text, 0.45), width: 1 });
    seg(M, [0, -half - pad * 0.7], [0, half + pad * 0.7], { color: alpha(C.text, 0.45), width: 1 });
    label(M, 'ε (µε) →', [hi + pad, -half - pad], { color: C.muted, align: 'right' });
    label(M, 'γ/2 ↓', [0, half + pad * 0.7], { color: C.muted, dx: 8, align: 'left' });
    circle(M, [cen, 0], Math.max(rad, 1e-9), { stroke: C.text, width: 2 });
    // The tank's own axes, x and y, joined through the centre.
    const X = [c.back.ex * u, -(c.back.gxy / 2) * u];
    const Y = [c.back.ey * u, (c.back.gxy / 2) * u];
    seg(M, X, Y, { color: alpha(C.text, 0.3), width: 1, dash: [3, 3] });
    dot(M, X[0], X[1], { color: alpha(C.text, 0.6), r: 3 });
    const colors = [C.gold, C.teal, C.yellow];
    const pts = c.abs.map((deg) => {
      const t = strainTransform(c.ex, c.ey, c.gxy, deg);
      return [t.e * u, -(t.g / 2) * u];
    });
    // Name the axis point only where no gauge sits on it.
    if (pts.every((P) => Math.hypot(P[0] - X[0], P[1] - X[1]) > 0.15 * Math.max(rad, 1))) {
      label(M, 'axis', X, { color: C.dim, dy: -12 });
    }
    pts.forEach((P, i) => {
      dot(M, P[0], P[1], { color: colors[i], r: 5 });
      // Each letter sits outside the circle, along the line from the centre.
      const a = Math.atan2(P[1], P[0] - cen);
      label(M, 'abc'[i], P, { color: colors[i], dx: 14 * Math.cos(a), dy: -14 * Math.sin(a) });
    });
    label(M, `ε₁ ${fig(c.pe.e1 * u)}`, [c.pe.e1 * u, 0], { color: C.text, dx: -6, dy: 12, align: 'right' });
    label(M, `ε₂ ${fig(c.pe.e2 * u)}`, [c.pe.e2 * u, 0], { color: C.text, dx: 6, dy: 12, align: 'left' });
  },
  law: () => [
    String.raw`\varepsilon(\theta)=\varepsilon_x\cos^2\theta+\varepsilon_y\sin^2\theta+\gamma_{xy}\sin\theta\cos\theta`,
    String.raw`\sigma_x=\frac{E}{1-\nu^2}\left(\varepsilon_x+\nu\varepsilon_y\right)`,
  ],
  liveRows(state, c) {
    const rows = [
      kv('gauge a', `${fig(c.ra * 1e6)} µε`),
      kv('gauge b', `${fig(c.rb * 1e6)} µε`),
      kv('gauge c', `${fig(c.rc * 1e6)} µε`),
      kv('principal strains', `${fig(c.e1 * 1e6)}, ${fig(c.e2 * 1e6)} µε`),
    ];
    if (state.mode === 'shaft') {
      rows.push(
        kv('torque on the nameplate', `${fig(c.T)} lbf·in`),
        kv('torque from the full rosette', `${fig(c.rosT)} lbf·in`),
        kv('torque from the ±45° pair', `${fig(c.pairT)} lbf·in`),
      );
    } else {
      rows.push(
        kv('hoop from the rosette', `${fig(c.hoop / 1000)} ksi (pr/t ${fig(c.sy / 1000)})`),
        kv('axial from the rosette', `${fig(c.axial / 1000)} ksi (pr/2t ${fig(c.sx / 1000)})`),
        kv('E × gauge a', `${fig(c.naive / 1000)} ksi`),
      );
    }
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['a', `${fig(c.ra * 1e6)} µε`],
      ['b', `${fig(c.rb * 1e6)} µε`],
      ['c', `${fig(c.rc * 1e6)} µε`],
      state.mode === 'shaft' ? ['torque', `${fig(c.rosT)} lbf·in`] : ['hoop', `${fig(c.hoop / 1000)} ksi`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (state.mode === 'shaft') {
      const off = Math.abs(c.phi) > 0.5;
      return {
        title: off ? 'A crooked pair reads low' : 'Twist shows up at 45°',
        body: off
          ? String.raw`Turned ${fig(c.phi)}° off line, the ±45° pair reads ${fig(c.pairT)} lbf·in, cos ${fig(2 * c.phi)}° of the true ${fig(c.T)}. The third gauge fixes it: the full rosette gives ${fig(c.rosT)} lbf·in.`
          : String.raw`Pure shear stretches one 45° line and shortens the other by γ/2 = ${fig(c.rc * 1e6)} µε. Their difference is γ, so T = Gγπd³/16 = ${fig(c.rosT)} lbf·in, the nameplate's ${fig(c.T)}. The gauge along the axis reads zero.`,
      };
    }
    return {
      title: Math.abs(c.phi) > 0.5 ? 'A crooked rosette still reads true' : 'A gauge reads strain, not stress',
      body: Math.abs(c.phi) > 0.5
        ? String.raw`Glued ${fig(c.phi)}° off, every reading changes: gauge a now reads ${fig(c.ra * 1e6)} µε. Solved at their true angles, the three still give ${fig(c.hoop / 1000)} ksi hoop and ${fig(c.axial / 1000)} ksi axial.`
        : String.raw`Gauge a, along the axis, reads ${fig(c.ra * 1e6)} µε. E times that is ${fig(c.naive / 1000)} ksi, but the axial stress is ${fig(c.sx / 1000)} ksi: the hoop stress squeezes the axis by ν. Hooke in two directions gives ${fig(c.hoop / 1000)} ksi hoop, pr/t.`,
    };
  }),
});
