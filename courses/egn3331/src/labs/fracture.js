import { absMaxShear, coulombMohrFS, maxNormalFS } from '@flux/subjects/mechanics/failure.js';
import { eigen2, principal2 } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, circle, couple, dot, hidden, label, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that brittle and ductile metals fail on different planes and by different rules. Twist a
 * 1 in gray-iron bar and it snaps on a 45° helix, across the largest tension; twist a steel bar
 * and it shears flat across the section. Add a push along the iron bar and it gets stronger in
 * torsion, because the Coulomb–Mohr envelope opens toward compression.
 *
 * Cited: ASTM A48 Class 30 gray iron has a minimum tensile strength of 30 ksi (the class number);
 * a typical compressive strength is 110 ksi and a typical shear strength 40 ksi (MakeItFrom, ASTM
 * grade 30 grey cast iron). ASTM A36 steel has a minimum yield of 36 ksi. The 1 in bar, the
 * torque and the axial load are assumed. Recompute: the principal stresses, then Coulomb–Mohr for
 * the iron and Tresca for the steel. Second method: the load factor at which the scaled circle
 * first touches the envelope, found by bisection on the drawing's own geometry, and the principals
 * from the eigenvalues.
 */

const D_IN = 1;
const AREA = (Math.PI / 4) * D_IN ** 2;
const SUT = 30;
const SUC = 110;
const SY = 36;
const OUT = 'Coulomb–Mohr is a straight line between two test circles. Real gray iron is tougher in shear than that line says: its typical shear strength is about 40 ksi, against the 23.6 ksi the envelope gives. Graphite flakes make each casting different, and thin sections cool faster and come out stronger. The steel number is first yield, not fracture: A36 keeps carrying load well past it. The bar is uniform; a keyway or a shoulder would add a stress concentration on top.';

const SCENARIOS = [
  { id: 'iron', name: 'Gray iron, twisted', mat: 'iron', T: 200, N: 0 },
  { id: 'steel', name: 'A36 steel, twisted', mat: 'steel', T: 200, N: 0 },
  { id: 'pull', name: 'Gray iron, twisted and pulled', mat: 'iron', T: 200, N: 8 },
  { id: 'push', name: 'Gray iron, twisted and pushed', mat: 'iron', T: 200, N: -8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mat: sc.mat, T: sc.T, N: sc.N });
}

/** Stresses in ksi on the bar's surface: x along the axis, y around it. T in lbf·ft, N in kip. */
function stresses(state) {
  const sx = (Number(state.N) || 0) / AREA;
  const txy = (16 * (Number(state.T) || 0) * 12) / (Math.PI * D_IN ** 3) / 1000;
  return { sx, sy: 0, txy };
}

/** The upper Coulomb–Mohr line: tangent to the tension and compression test circles. */
function envelope() {
  const c1 = SUT / 2;
  const r1 = SUT / 2;
  const c2 = -SUC / 2;
  const r2 = SUC / 2;
  const sin = (r2 - r1) / (c1 - c2);
  const cos = Math.sqrt(1 - sin * sin);
  return { sin, cos, P1: [c1 + r1 * sin, r1 * cos], P2: [c2 + r2 * sin, r2 * cos] };
}

/** Room left between a circle (centre c, radius R) and the failure line; negative once it crosses. */
function room(mat, c, R) {
  if (mat === 'steel') return SY / 2 - R;
  const { sin, cos, P1 } = envelope();
  return P1[1] * cos - (c - P1[0]) * sin - R;
}

export function failure(state) {
  const { sx, sy, txy } = stresses(state);
  const p = principal2(sx, sy, txy);
  const e = eigen2(sx, sy, txy);
  const hi = Math.max(p.s1, p.s2, 0);
  const lo = Math.min(p.s1, p.s2, 0);
  const steel = state.mat === 'steel';
  const fs = steel ? (SY / 2) / absMaxShear(sx, sy, txy).abs : coulombMohrFS(sx, sy, txy, SUT, SUC);
  // Second method: grow every load by λ until the biggest circle meets the envelope.
  let a = 0;
  let b = 1e4;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (room(state.mat, (m * (hi + lo)) / 2, (m * (hi - lo)) / 2) > 0) a = m;
    else b = m;
  }
  const lambda = (a + b) / 2;
  const scale = Math.max(Math.abs(p.s1), Math.abs(p.s2), 1e-9);
  const gap = Math.max(
    Math.abs(lambda - fs) / fs,
    Math.abs(p.s1 - e.s1) / scale,
    Math.abs(p.s2 - e.s2) / scale,
  );
  // The fracture plane's trace on the surface, measured from the bar's axis. Iron cracks across
  // σ1, so the trace runs along σ2's direction. Steel slips on the plane of largest shear, 45°
  // from the principals; of the two, the one nearer the cross-section.
  const theta1 = p.theta * (180 / Math.PI);
  let trace = steel ? theta1 + 45 : theta1 + 90;
  if (steel && Math.abs(Math.cos(((theta1 - 45) * Math.PI) / 180)) < Math.abs(Math.cos((trace * Math.PI) / 180))) trace = theta1 - 45;
  trace = ((trace % 180) + 180) % 180;
  return {
    sx, sy, txy, s1: p.s1, s2: p.s2, hi, lo, fs, lambda, gap,
    rankine: maxNormalFS(sx, sy, txy, SUT, SUC),
    trace,
    angle: Math.min(trace, 180 - trace),
    Tfail: fs * (Number(state.T) || 0),
  };
}

function member(B, rect, state, c, veiled) {
  const S = sceneIn(B, rect, { x0: -2.1, x1: 2.1, y0: -1.5, y1: 1.5 }, 12);
  const r = 0.5;
  const iron = state.mat !== 'steel';
  poly(S, [[-1.7, -r], [1.7, -r], [1.7, r], [-1.7, r]], { fill: alpha(iron ? C.muted : C.text, iron ? 0.3 : 0.14), stroke: C.text });
  if (Math.abs(Number(state.T) || 0) > 0) {
    couple(S, [-1.7, 0], { r: 14, ccw: true, color: C.pink });
    couple(S, [1.7, 0], { r: 14, ccw: false, color: C.pink });
  }
  const N = Number(state.N) || 0;
  if (Math.abs(N) > 0.05) {
    const out = N > 0;
    arrow(S, out ? [1.75, 0] : [2.1, 0], 0 + (out ? 0 : Math.PI), 22, { color: C.gold });
    arrow(S, out ? [-1.75, 0] : [-2.1, 0], Math.PI + (out ? 0 : Math.PI), 22, { color: C.gold });
  }
  if (veiled) return;
  // The crack (or slip) trace across the visible face, through the middle.
  const t = (c.trace * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const k = Math.abs(u[1]) > 1e-6 ? Math.min(r / Math.abs(u[1]), 1.6) : 1.6;
  seg(S, [-k * u[0], -k * u[1]], [k * u[0], k * u[1]], { color: iron ? C.yellow : C.teal, width: 3, dash: iron ? null : [6, 4] });
  label(S, iron ? `cracks at ${fig(c.angle)}° to the axis` : `slips at ${fig(c.angle)}° to the axis`, [0, -r], { color: iron ? C.yellow : C.teal, dy: 18 });
  label(S, iron ? '1 in gray iron, Class 30' : '1 in A36 steel', [0, r], { color: C.dim, dy: -14 });
  label(S, `T ${fig(state.T)} lbf·ft${Math.abs(N) > 0.05 ? `, ${N > 0 ? 'pull' : 'push'} ${fig(Math.abs(N))} kip` : ''}`, [0, -r], { color: C.pink, dy: 40 });
}

export default defineLab({
  id: 'fracture',
  exam: 'u5',
  title: 'Cast iron or steel',
  app: true,
  hint: 'Brittle iron breaks when the stress circle touches the Coulomb–Mohr line; ductile steel yields when the circle\'s radius reaches σY/2.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('iron', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'N', lo: -30, hi: 30 }),
  controls() {
    return `
      ${slider('fr-t', 'torque (lbf·ft)', 200, 0, 500, 10)}
      ${slider('fr-n', 'axial load (kip, + pull)', 0, -30, 30, 0.5)}
      ${slider('fr-m', 'material (0 gray iron, 1 A36 steel)', 0, 0, 1, 1)}
      <p class="tiny">Cited: ASTM A48 Class 30 gray iron, 30 ksi minimum tensile; typical compressive 110 ksi (MakeItFrom). ASTM A36 steel, 36 ksi minimum yield. The 1 in bar and the loads are assumed.</p>`;
  },
  bind(api) {
    bindSlider('fr-t', (s, v) => { s.T = v; }, api);
    bindSlider('fr-n', (s, v) => { s.N = v; }, api);
    bindSlider('fr-m', (s, v) => { s.mat = v >= 0.5 ? 'steel' : 'iron'; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('fr-t', state.T);
    set('fr-n', state.N);
    set('fr-m', state.mat === 'steel' ? 1 : 0);
  },
  compute(state) {
    return failure(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const iron = state.mat !== 'steel';
    const x0 = iron ? -SUC - 8 : -SY - 8;
    const x1 = iron ? SUT + 25 : SY + 8;
    const yh = iron ? SUC / 2 + 8 : SY / 2 + 14;
    const M = sceneIn(B, R, { x0, x1, y0: -yh, y1: yh }, 16);
    seg(M, [x0, 0], [x1, 0], { color: alpha(C.text, 0.45), width: 1 });
    seg(M, [0, -yh], [0, yh], { color: alpha(C.text, 0.45), width: 1 });
    label(M, 'σ (ksi) →', [x1, -yh], { color: C.muted, align: 'right' });
    label(M, 'τ', [0, yh], { color: C.muted, dx: 8, align: 'left' });
    if (iron) {
      // The two test circles and the straight envelope tangent to both.
      circle(M, [SUT / 2, 0], SUT / 2, { stroke: alpha(C.text, 0.35), dash: [4, 4], width: 1 });
      circle(M, [-SUC / 2, 0], SUC / 2, { stroke: alpha(C.text, 0.35), dash: [4, 4], width: 1 });
      const { P1, P2 } = envelope();
      const ext = (a, b, f) => [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
      for (const s of [1, -1]) {
        const p1 = [P1[0], s * P1[1]];
        const p2 = [P2[0], s * P2[1]];
        seg(M, ext(p2, p1, -0.15), p1, { color: C.pink, width: 2 });
      }
      label(M, `${SUT}`, [SUT, 0], { color: C.dim, dy: 12 });
      label(M, `−${SUC}`, [-SUC, 0], { color: C.dim, dy: 12 });
    } else {
      circle(M, [SY / 2, 0], SY / 2, { stroke: alpha(C.text, 0.35), dash: [4, 4], width: 1 });
      seg(M, [x0, SY / 2], [x1, SY / 2], { color: C.pink, width: 2 });
      seg(M, [x0, -SY / 2], [x1, -SY / 2], { color: C.pink, width: 2 });
      label(M, `τ = ${SY / 2}`, [x0, SY / 2], { color: C.pink, dy: -10, align: 'left' });
    }
    // The load's biggest circle, and the same circle grown until it fails.
    const cen = (c.hi + c.lo) / 2;
    const rad = (c.hi - c.lo) / 2;
    circle(M, [cen * c.lambda, 0], rad * c.lambda, { stroke: alpha(C.gold, 0.45), dash: [5, 4], width: 1.5 });
    circle(M, [cen, 0], Math.max(rad, 1e-9), { stroke: C.gold, width: 2.5 });
    dot(M, c.hi, 0, { color: C.gold, r: 4 });
    dot(M, c.lo, 0, { color: C.gold, r: 4 });
  },
  law: () => [
    String.raw`\text{iron: }\ \frac{\sigma_{\max}}{\sigma_{ut}}-\frac{\sigma_{\min}}{\sigma_{uc}}=\frac{1}{n}`,
    String.raw`\text{steel: }\ \sigma_{\max}-\sigma_{\min}=\frac{\sigma_Y}{n}`,
  ],
  liveRows(state, c) {
    return [
      kv('shear stress', `${fig(c.txy)} ksi`),
      kv('axial stress', `${fig(c.sx)} ksi`),
      kv('principals', `${fig(c.s1)}, ${fig(c.s2)} ksi`),
      kv(state.mat === 'steel' ? 'factor of safety (Tresca, yield)' : 'factor of safety (Coulomb–Mohr)', fig(c.fs)),
      state.mat === 'steel' ? '' : kv('largest tension alone', fig(c.rankine)),
      kv('torque at failure', `${fig(c.Tfail)} lbf·ft`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σ₁', `${fig(c.s1)} ksi`],
      ['σ₂', `${fig(c.s2)} ksi`],
      ['safety factor', fig(c.fs)],
      ['plane', `${fig(c.angle)}°`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (state.mat === 'steel') {
      return {
        title: 'Steel slips across the section',
        body: String.raw`The circle's radius is the largest shear, ${fig((c.hi - c.lo) / 2)} ksi. Steel yields when it reaches 18 ksi, half of 36, so n = ${fig(c.fs)}. Slip runs on the plane of largest shear: ${fig(c.angle)}° to the axis, flat across the bar in pure twist.`,
      };
    }
    const N = Number(state.N) || 0;
    return {
      title: N < -0.05 ? 'A push makes the iron stronger' : N > 0.05 ? 'A pull makes the iron weaker' : 'Iron cracks across the tension',
      body: N < -0.05
        ? String.raw`The push slides the circle left, where the envelope is wider. The largest tension falls to ${fig(c.hi)} ksi and n rises to ${fig(c.fs)}. The crack still runs across σ₁, now ${fig(c.angle)}° to the axis.`
        : N > 0.05
          ? String.raw`The pull slides the circle right, toward the narrow tension end. σ₁ rises to ${fig(c.hi)} ksi and n falls to ${fig(c.fs)}. The crack turns to ${fig(c.angle)}° to the axis.`
          : String.raw`Pure twist puts ${fig(c.hi)} ksi of tension on 45° lines. Iron has no slip to spend, so it cracks across that tension: a helix at 45°. Coulomb–Mohr gives n = ${fig(c.fs)}; tension alone would give ${fig(c.rankine)}, because the compression on the other diagonal also counts.`,
    };
  }),
});
