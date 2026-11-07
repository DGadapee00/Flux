import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { schmid } from '@flux/subjects/matsci/slip.js';

/**
 * Slip: a single crystal pulled along its axis, with one slip plane and a slip direction in it.
 *
 * Shows Schmid's law. A crystal does not yield when the pull reaches some tensile limit: it yields
 * when the shear stress resolved onto the slip plane, along the slip direction, reaches the critical
 * resolved shear stress. The same pull slips a crystal with its plane at 45° and leaves one at 10° or
 * 80° untouched. τ_R = σ cos φ cos λ is checked by rotating the stress tensor into the slip system's
 * frame (packages/subjects/src/matsci/slip.js).
 */
const SCENARIOS = [
  { id: 'fortyfive', name: 'Plane at 45°: slips', phi: 45, psi: 0, sigma: 2.2, tauC: 1 },
  { id: 'steep', name: 'Plane normal at 80° to the pull', phi: 80, psi: 0, sigma: 2.2, tauC: 1 },
  { id: 'flat', name: 'Plane normal at 10° to the pull', phi: 10, psi: 0, sigma: 2.2, tauC: 1 },
  { id: 'twisted', name: 'Slip direction turned 60° in the plane', phi: 45, psi: 60, sigma: 2.2, tauC: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, phi: sc.phi, psi: sc.psi, sigma: sc.sigma, tauC: sc.tauC });
}

// A slightly oblique view so the slip plane shows as an ellipse: y recedes up and to the right.
const view = ([x, y, z]) => [x + 0.32 * y, z + 0.2 * y];

export default defineLab({
  id: 'slip',
  exam: 'u2',
  title: 'Slip',
  hint: 'Hold the pull and turn the slip plane: the crystal slips near 45° and not near 10° or 80°. The tensile stress alone does not decide yield.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fortyfive', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'phi', lo: 0, hi: 90 }),
  controls() {
    return `
      ${slider('sl-phi', 'φ: pull axis to slip-plane normal (°)', 45, 0, 90, 1)}
      ${slider('sl-psi', 'ψ: slip direction turned within the plane (°)', 0, 0, 90, 1)}
      ${slider('sl-s', 'Pull σ (MPa)', 2.2, 0.2, 10, 0.1)}
      ${slider('sl-t', 'Critical resolved shear stress τ_crss (MPa)', 1, 0.2, 5, 0.1)}
      <p class="tiny">ψ = 0 puts the slip direction on the steepest line down the plane, so λ = 90° − φ. Pure metal single crystals slip at τ_crss of order 1 MPa.</p>`;
  },
  bind(api) {
    bindSlider('sl-phi', (s, v) => { s.phi = v; }, api);
    bindSlider('sl-psi', (s, v) => { s.psi = v; }, api);
    bindSlider('sl-s', (s, v) => { s.sigma = v; }, api);
    bindSlider('sl-t', (s, v) => { s.tauC = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['sl-phi', state.phi], ['sl-psi', state.psi], ['sl-s', state.sigma], ['sl-t', state.tauC]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const r = schmid(state);
    const curve = [];
    for (let i = 0; i <= 90; i++) curve.push([i, Math.cos((i * Math.PI) / 180) * Math.sin((i * Math.PI) / 180) * Math.cos((state.psi * Math.PI) / 180)]);
    return { ...r, curve, mNeeded: state.tauC / state.sigma };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + W * 0.4;
    const left = { ...B.free, x1: xm };
    const right = { ...B.free, x0: xm };

    // The specimen: a cylinder of radius 0.5 along z, pulled at both ends.
    const S = sceneIn(B, left, { x0: -0.85, x1: 0.85, y0: -2.05, y1: 2.05 }, 10);
    const ring = (z) => Array.from({ length: 49 }, (_, i) => view([0.5 * Math.cos((i / 48) * 2 * Math.PI), 0.5 * Math.sin((i / 48) * 2 * Math.PI), z]));
    poly(S, [...ring(-1.25).slice(0, 25), ...ring(1.25).slice(0, 25).reverse()], { fill: alpha(C.blue, 0.12), stroke: null });
    line(S, ring(1.25), { color: C.muted, width: 1.5 });
    line(S, ring(-1.25).slice(0, 25), { color: C.muted, width: 1.5 });
    seg(S, view([0.5, 0, -1.25]), view([0.5, 0, 1.25]), { color: C.muted, width: 1.5 });
    seg(S, view([-0.5, 0, -1.25]), view([-0.5, 0, 1.25]), { color: C.muted, width: 1.5 });
    // The slip plane through the centre: a circle of radius 0.5 in the plane, seen obliquely.
    const steep = [-Math.cos((state.phi * Math.PI) / 180), 0, Math.sin((state.phi * Math.PI) / 180)];
    const across = [0, 1, 0];
    const disc = Array.from({ length: 49 }, (_, i) => {
      const t = (i / 48) * 2 * Math.PI;
      return view(steep.map((v, k) => 0.5 * (Math.cos(t) * v + Math.sin(t) * across[k])));
    });
    poly(S, disc, { fill: alpha(c.slips ? C.red : C.gold, 0.35), stroke: c.slips ? C.red : C.gold, width: 1.5 });
    // Slip direction and plane normal.
    seg(S, [0, 0], view(c.d.map((v) => 0.48 * v)), { color: C.pink, width: 3 });
    dot(S, ...view(c.d.map((v) => 0.48 * v)), { color: C.pink, r: 4 });
    seg(S, [0, 0], view(c.n.map((v) => 0.7 * v)), { color: C.teal, width: 2, dash: [4, 3] });
    label(S, 'n', view(c.n.map((v) => 0.78 * v)), { color: C.teal });
    label(S, 'd', view(c.d.map((v) => 0.62 * v)), { color: C.pink });
    // The pull.
    arrow(S, [0, 1.32], Math.PI / 2, 18, { color: C.text });
    arrow(S, [0, -1.32], -Math.PI / 2, 18, { color: C.text });
    label(S, `σ = ${fig(state.sigma)} MPa`, [0, 2.05], { color: C.text, base: 'top' });
    label(S, c.slips ? 'slips' : 'holds', [0, -2.05], { color: c.slips ? C.red : C.green, base: 'bottom', bold: true });

    // The Schmid factor against φ, and the factor this pull needs.
    const P = plotIn(B, right, { lo: 0, hi: 90 }, { lo: 0, hi: 0.6 }, { left: 44, right: 12, top: 26, bottom: 40 });
    axes(P, { xLabel: 'φ (°)', yLabel: 'Schmid factor m' });
    if (c.mNeeded < 0.6) {
      poly(P, [[0, c.mNeeded], [90, c.mNeeded], [90, 0.6], [0, 0.6]], { fill: alpha(C.red, 0.1), stroke: null });
      seg(P, [0, c.mNeeded], [90, c.mNeeded], { color: C.red, width: 1.5, dash: [5, 4] });
      label(P, 'slips above', [88, c.mNeeded], { color: C.red, align: 'right', dy: -10 });
    }
    line(P, c.curve, { color: C.gold, width: 2.5 });
    dot(P, state.phi, c.m, { color: C.yellow, r: 6, ring: C.text });
    label(P, `m = ${fig(c.m)}`, [state.phi, c.m], { color: C.yellow, align: state.phi > 60 ? 'right' : 'left', dx: state.phi > 60 ? -10 : 10, dy: 12 });
  },
  law: () => [String.raw`\tau_R = \sigma\cos\phi\cos\lambda, \qquad \cos\lambda = \sin\phi\cos\psi`, String.raw`\text{slip when } \tau_R \ge \tau_\text{crss}, \qquad \sigma_y = \frac{\tau_\text{crss}}{\cos\phi\cos\lambda}`],
  liveRows(state, c) {
    return [
      kv('φ, λ', `${fig(state.phi)}°, ${fig(c.lambda)}°`),
      kv('Schmid factor cos φ cos λ', fig(c.m)),
      kv('τ_R = σ cos φ cos λ', `${fig(c.tau)} MPa`),
      kv('τ_R from the rotated stress tensor', `${fig(c.tauTensor)} MPa`),
      kv('Normal stress on the plane', `${fig(c.sigmaN)} MPa`),
      kv('Pull to start slip, τ_crss/m', c.sigmaY == null ? 'never slips' : `${fig(c.sigmaY)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['m', fig(c.m)],
      ['τ_R', `${fig(c.tau)} MPa`],
      ['yield pull', c.sigmaY == null ? '∞' : `${fig(c.sigmaY)} MPa`],
      ['state', c.slips ? 'slips' : 'holds'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One slip system. A real FCC crystal has twelve, {111} planes in ⟨110⟩ directions, and the one with the largest Schmid factor slips first. As it slips the crystal turns, and other systems join in.`;
    if (c.m < 1e-9) {
      return { title: 'No shear at all', body: `At φ = ${fig(state.phi)}° the pull is ${state.phi < 45 ? 'square to the plane' : 'along the plane, square to its normal'}, so it resolves no shear onto it. However hard the pull, this system never slips: the crystal would fracture or slip on another system first. ${leavesOut}` };
    }
    return {
      title: c.slips ? 'The resolved shear reaches τ_crss' : 'Too little shear on the plane',
      body: `A pull of ${fig(state.sigma)} MPa puts ${fig(c.tau)} MPa of shear along the slip direction, ${c.slips ? 'at or above' : 'below'} τ_crss = ${fig(state.tauC)} MPa. With m = ${fig(c.m)} the crystal yields at ${fig(c.sigmaY)} MPa. The most any orientation gives is m = 0.5, at φ = λ = 45°, so the lowest possible yield pull is ${fig(2 * state.tauC)} MPa. ${leavesOut}`,
    };
  },
  app: false,
});
