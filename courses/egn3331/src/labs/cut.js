import { inclined, inclinedByCut, transform } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'square', name: 'Tension, square cut', P: 20e3, A: 200e-6, theta: 0 },
  { id: 'tension', name: 'Tension, cut at 30°', P: 20e3, A: 200e-6, theta: 30 },
  { id: 'shear45', name: 'Tension, cut at 45°', P: 20e3, A: 200e-6, theta: 45 },
  { id: 'compression', name: 'Compression, cut at 30°', P: -36e3, A: 450e-6, theta: 30 },
];

const MAX_THETA = 80;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, A: sc.A, theta: sc.theta });
}

/** θ of the largest shear, found by scanning the plane from 0° to 90°. */
function scanPeak(P, A) {
  let best = { theta: 0, tau: -Infinity };
  for (let th = 0; th <= 90; th += 0.05) {
    const t = Math.abs(inclined(P, A, th).tau);
    if (t > best.tau) best = { theta: th, tau: t };
  }
  return best;
}

export default defineLab({
  id: 'cut',
  exam: 'u1',
  title: 'Inclined cut',
  hint: 'Turn the cut. The same force spreads over a longer plane, and splits into a normal and a shear part.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('square', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 0, hi: MAX_THETA }),
  controls() {
    return `
      ${slider('cut-theta', 'cut angle θ (°)', 0, 0, MAX_THETA, 1)}
      ${slider('cut-P', 'axial load P (kN)', 20, -60, 60, 1)}
      ${slider('cut-A', 'area A (mm²)', 200, 50, 1000, 10)}
      <p class="tiny">θ is the angle between the bar's axis and the normal to the cut. Tension is positive.</p>`;
  },
  bind(api) {
    bindSlider('cut-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('cut-P', (s, v) => { s.P = v * 1e3; }, api);
    bindSlider('cut-A', (s, v) => { s.A = v * 1e-6; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('cut-theta', state.theta);
    set('cut-P', state.P / 1e3);
    set('cut-A', Math.round(state.A * 1e6));
  },
  compute(state) {
    const { P, A, theta } = state;
    const a = inclined(P, A, theta);
    const b = inclinedByCut(P, A, theta);
    const t = transform(P / A, 0, 0, theta);
    const peak = scanPeak(P, A);
    const s0 = Math.abs(P / A);
    const gap = Math.max(Math.abs(a.sigma - b.sigma), Math.abs(a.tau - b.tau), Math.abs(a.sigma - t.sx), Math.abs(a.tau + t.txy)) / Math.max(s0, 1e-9);
    return {
      P,
      A,
      theta,
      sigma0: P / A,
      sigma: a.sigma,
      tau: a.tau,
      areaCut: a.area,
      N: b.N,
      V: b.V,
      sigmaT: t.sx,
      tauT: -t.txy,
      tauMax: Math.abs(P) / (2 * A),
      peakTheta: peak.theta,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.48);

    // The bar, cut on the plane θ from the cross-section. Model units: the bar's height is 1.
    const L = 6;
    const H = 1;
    const S = sceneIn(B, top, { x0: -L / 2 - 1.2, x1: L / 2 + 1.2, y0: -1.4, y1: 1.4 });
    const tn = Math.tan((c.theta * Math.PI) / 180);
    const dx = (H / 2) * tn;
    const tension = c.P >= 0;
    poly(S, [[-L / 2, -H / 2], [-dx, -H / 2], [dx, H / 2], [-L / 2, H / 2]], { fill: alpha(C.text, 0.06), stroke: alpha(C.text, 0.5) });
    poly(S, [[dx + 0.25, H / 2], [L / 2 + 0.25, H / 2], [L / 2 + 0.25, -H / 2], [-dx + 0.25, -H / 2]], { fill: alpha(C.gold, 0.1), stroke: alpha(C.text, 0.8) });
    seg(S, [-dx + 0.25, -H / 2], [dx + 0.25, H / 2], { color: C.yellow, width: 2.5 });
    const ext = 28 * Math.min(2, Math.abs(c.P) / 20e3) + 18;
    arrow(S, [L / 2 + 0.25, 0], tension ? 0 : Math.PI, ext, { tail: !tension });
    arrow(S, [-L / 2, 0], tension ? Math.PI : 0, ext, { tail: !tension });
    label(S, `${fig(Math.abs(c.P) / 1e3)} kN`, [L / 2 + 0.25, 0], { dx: 4, dy: -14, align: 'left', color: C.pink });

    // Stress on the right piece's cut face. The plane runs along (sin θ, cos θ), so the face's outward
    // normal is (−cos θ, sin θ). The left piece pulls on it with −P along x: its part along the plane
    // points down the plane when the bar is in tension.
    const mid = [0.25, 0];
    const th = (c.theta * Math.PI) / 180;
    const nAng = Math.PI - th;
    const tAng = -Math.PI / 2 - th;
    const s0 = Math.max(Math.abs(c.sigma0), 1e-9);
    const lenS = 46 * Math.abs(c.sigma) / s0;
    const lenT = 46 * Math.abs(c.tau) / s0;
    if (lenS > 3) arrow(S, mid, c.sigma >= 0 ? nAng : nAng + Math.PI, lenS, { color: C.gold, width: 2, head: 7 });
    if (lenT > 3) arrow(S, mid, c.tau >= 0 ? tAng : tAng + Math.PI, lenT, { color: C.teal, width: 2, head: 7 });
    label(S, `σ = ${fig(c.sigma / 1e6)} MPa`, [-L / 2, -H / 2], { dy: 22, align: 'left', color: C.gold });
    label(S, `τ = ${fig(c.tau / 1e6)} MPa`, [L / 2, -H / 2], { dy: 22, align: 'right', color: C.teal });
    label(S, `θ = ${fig(c.theta)}°`, [dx + 0.25, H / 2], { dy: -12, color: C.yellow });

    // σ and τ against θ, with today's plane marked.
    const hi = Math.abs(c.sigma0) / 1e6;
    const P = plotIn(B, bottom, { lo: 0, hi: 90 }, { lo: Math.min(0, -hi * 0.05, c.sigma0 / 1e6) * 1.1, hi: Math.max(hi * 0.05, c.sigma0 / 1e6, hi / 2) * 1.12 });
    axes(P, { xLabel: 'θ (°)', yLabel: 'stress (MPa)' });
    const sig = [];
    const tau = [];
    for (let k = 0; k <= 180; k++) {
      const t = k / 2;
      const r = inclined(c.P, c.A, t);
      sig.push([t, r.sigma / 1e6]);
      tau.push([t, r.tau / 1e6]);
    }
    line(P, sig, { color: C.gold, width: 2 });
    line(P, tau, { color: C.teal, width: 2 });
    line(P, [[45, P.Y.lo], [45, P.Y.hi]], { color: alpha(C.text, 0.25), width: 1, dash: [4, 4] });
    dot(P, c.theta, c.sigma / 1e6, { color: C.gold, r: 4 });
    dot(P, c.theta, c.tau / 1e6, { color: C.teal, r: 4 });
    note(P, 'σ', 4, sig[8][1], { color: C.gold });
    note(P, 'τ', 62, tau[124][1], { color: C.teal });
    note(P, '45°', 45, P.Y.hi, { dx: 4, dy: 12, color: C.dim });
  },
  law: () => [String.raw`\sigma=\frac{P}{A}\cos^2\theta`, String.raw`\tau=\frac{P}{2A}\sin 2\theta`],
  liveRows(state, c) {
    return [
      kv('$P/A$', `${fig(c.sigma0 / 1e6)} MPa`),
      kv('$\\sigma$ from the transformation', `${fig(c.sigmaT / 1e6)} MPa`),
      kv('$\\tau$ from the cut, $V/(A/\\cos\\theta)$', `${fig(c.V / c.areaCut / 1e6)} MPa`),
      kv('largest $\\tau$, at $45^\\circ$', `${fig(c.tauMax / 1e6)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σ on the cut', `${fig(c.sigma / 1e6)} MPa`],
      ['τ on the cut', `${fig(c.tau / 1e6)} MPa`],
      ['cut area', `${fig(c.areaCut * 1e6)} mm²`],
      ['τ max', `${fig(c.tauMax / 1e6)} MPa`],
    ]);
  },
  coach(state, c) {
    if (c.theta < 1) {
      return { title: 'The cross-section', body: String.raw`On the square cut all of $P$ is normal: $\sigma = P/A$ and $\tau = 0$. Turn the cut and a shear part appears.` };
    }
    if (Math.abs(c.theta - 45) < 1) {
      return { title: 'The 45° plane', body: String.raw`Here $\tau$ peaks at $P/2A = ${fig(c.tauMax / 1e6)}$ MPa, and $\sigma$ is the same size. A ductile bar in tension yields on these planes.` };
    }
    return {
      title: 'One force, two parts',
      body: String.raw`The plane is $1/\cos\theta$ times the cross-section. $P\cos\theta$ pushes across it and $P\sin\theta$ slides along it, so $\sigma = ${fig(c.sigma / 1e6)}$ MPa and $\tau = ${fig(c.tau / 1e6)}$ MPa.`,
    };
  },
});
