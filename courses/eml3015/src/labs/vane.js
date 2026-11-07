import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { vaneForce } from '@flux/subjects/mechanics/vane.js';

/**
 * Vane: a water jet turned by a curved vane, fixed or moving away from the nozzle.
 *
 * Shows the momentum balance on a control volume. The force on the vane is the momentum flux the vane
 * turns, ρAw²(1 − cos θ) along the jet with w the jet's speed relative to the vane: turning the jet
 * back on itself doubles the force a 90° vane feels, and a vane running away at half the jet's speed
 * feels a quarter of it. The second route integrates the push the vane gives the water along its arc
 * (packages/subjects/src/mechanics/vane.js).
 */
const SCENARIOS = [
  { id: 'fixed90', name: 'A fixed vane turning the jet 90°', V: 20, u: 0, theta: 90, dcm: 2 },
  { id: 'fixed180', name: 'A fixed vane turning it back, 180°', V: 20, u: 0, theta: 180, dcm: 2 },
  { id: 'moving', name: 'The 180° vane running away at half the jet’s speed', V: 20, u: 0.5, theta: 180, dcm: 2 },
  { id: 'best', name: 'A 165° vane at a third of the jet’s speed', V: 20, u: 1 / 3, theta: 165, dcm: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V: sc.V, u: sc.u, theta: sc.theta, dcm: sc.dcm });
}

const params = (s) => ({ V: s.V, U: s.u * s.V, theta: s.theta, d: s.dcm / 100 });
const KEYS = [['vn-v', 'V'], ['vn-u', 'u'], ['vn-t', 'theta'], ['vn-d', 'dcm']];

export default defineLab({
  id: 'vane',
  exam: 'u3',
  title: 'Vane',
  hint: 'Turn the jet from 90° to 180° and the force doubles. Then let the vane run away at half the jet’s speed: a quarter of the force, because only the relative speed counts.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fixed90', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'u', lo: 0, hi: 0.9 }),
  controls() {
    return `
      ${slider('vn-v', 'Jet speed V (m/s)', 20, 5, 30, 0.5)}
      ${slider('vn-u', 'Vane speed, as a share of V', 0, 0, 0.9, 0.01)}
      ${slider('vn-t', 'Turning angle θ (°)', 90, 10, 180, 1)}
      ${slider('vn-d', 'Jet diameter (cm)', 2, 1, 5, 0.1)}
      <p class="tiny">Water, 998 kg/m³, at atmospheric pressure all round; no friction on the vane, so the water leaves at the speed it arrived, relative to the vane. One vane: it receives ρA(V − U) of water each second.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const p = params(state);
    const r = vaneForce(p);
    const curve = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 100;
      const q = vaneForce({ ...p, U: u * p.V });
      curve.push([u, q.Fx, q.power]);
    }
    return { ...r, p, curve, Fmax: curve[0][1], Pmax: Math.max(...curve.map((c) => c[2])) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.5 : 0.5) : [null, B.free];
    if (top) {
      // The vane: an arc of radius 1 turning the jet counterclockwise through θ, centre at (0, 1).
      const th = (state.theta * Math.PI) / 180;
      const S = sceneIn(B, top, { x0: -2, x1: 2.3, y0: -0.7, y1: 2.3 }, 12);
      const arc = (R) => Array.from({ length: 61 }, (_, i) => {
        const phi = (i / 60) * th;
        return [R * Math.sin(phi), 1 - R * Math.cos(phi)];
      });
      // Nozzle and incoming jet.
      poly(S, [[-2, -0.18], [-1.6, -0.18], [-1.6, 0.18], [-2, 0.18]], { fill: alpha(C.muted, 0.5), stroke: C.muted, width: 1 });
      seg(S, [-1.6, 0], [0, 0], { color: alpha(C.blue, 0.8), width: 6 });
      line(S, arc(1), { color: alpha(C.blue, 0.8), width: 6 });
      const tip = [Math.sin(th), 1 - Math.cos(th)];
      const out = [tip[0] + 0.7 * Math.cos(th), tip[1] + 0.7 * Math.sin(th)];
      seg(S, tip, out, { color: alpha(C.blue, 0.8), width: 6 });
      // The vane itself, just outside the water.
      line(S, arc(1.12).map(([x, y]) => [x, y]), { color: C.text, width: 4 });
      label(S, `V = ${fig(state.V)} m/s`, [-1.5, 0.18], { color: C.blue, dy: -10, align: 'left' });
      if (state.u > 0) {
        arrow(S, [0.15, -0.45], 0, 46, { color: C.green, width: 2.5 });
        label(S, `U = ${fig(c.p.U)} m/s`, [0.15, -0.45], { color: C.green, dy: 14, align: 'left' });
      }
      // The force on the vane: along the jet F_x, and F_y down when the jet is turned up.
      const mid = [Math.sin(th / 2) * 1.12, 1 - Math.cos(th / 2) * 1.12];
      const ang = Math.atan2(-c.Fy, c.Fx);
      arrow(S, mid, ang, 20 + 50 * (c.F / Math.max(c.Fmax * 2, 1e-9)), { color: C.red, width: 3 });
      label(S, `force on the vane ${fig(c.F)} N`, [2.3, -0.7], { color: C.red, align: 'right', base: 'bottom' });
    }
    // Force along the jet and power against the vane's speed.
    const P = plotIn(B, bottom, { lo: 0, hi: 0.9 }, { lo: 0, hi: 1.1 * c.Fmax });
    axes(P, { xLabel: 'vane speed U / V', yLabel: 'force along the jet (N)' });
    line(P, c.curve.map(([u, F]) => [u, F]), { color: C.red, width: 2.5 });
    const pscale = (1.0 * c.Fmax) / Math.max(c.Pmax, 1e-9);
    line(P, c.curve.map(([u, , Pw]) => [u, Pw * pscale]), { color: C.gold, width: 2, dash: [6, 4] });
    label(P, `power, peak ${fig(c.Pmax)} W`, [0.9, c.Pmax * pscale], { color: C.gold, align: 'right', dy: -10 });
    dot(P, state.u, c.Fx, { color: C.yellow, r: 6, ring: C.text });
  },
  law: () => [String.raw`\sum \mathbf F = \sum_\text{out}\dot m\,\mathbf w - \sum_\text{in}\dot m\,\mathbf w`, String.raw`\dot m = \rho A (V - U)`, String.raw`F_x = \rho A (V - U)^2 (1 - \cos\theta)`],
  liveRows(state, c) {
    return [
      kv('Relative speed w = V − U', `${fig(c.w)} m/s`),
      kv('Water reaching the vane', `${fig(c.mdot)} kg/s`),
      kv('F_x, momentum balance', `${fig(c.Fx)} N`),
      kv('F_x, push integrated along the vane', `${fig(c.FxArc)} N`),
      kv('F_y across the jet', `${fig(c.Fy)} N`),
      kv('Power delivered, F_x U', `${fig(c.power)} W`),
      kv('Two routes differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['F_x', `${fig(c.Fx)} N`],
      ['F_y', `${fig(c.Fy)} N`],
      ['w', `${fig(c.w)} m/s`],
      ['power', `${fig(c.power)} W`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Friction on the vane, which slows the water, and the jet spreading. A turbine wheel puts one bucket after another in the jet, so it catches the whole flow ρAV, not ρA(V − U), and then the best speed is half the jet's.`;
    if (state.u === 0) {
      return { title: 'The force is the momentum turned', body: `Each second ${fig(c.mdot)} kg of water arrives at ${fig(c.w)} m/s and leaves at the same speed, turned ${fig(state.theta)}°. The vane must supply that change of momentum: ${fig(c.Fx)} N along the jet. Turning it back on itself, 180°, gives twice what a 90° vane feels. ${leavesOut}` };
    }
    return { title: 'Only the relative speed counts', body: `The vane runs away at ${fig(c.p.U)} m/s, so the water meets it at ${fig(c.w)} m/s and less of it arrives each second. Both shrink with w, so the force goes as w²: ${fig(c.Fx)} N against ${fig(c.Fmax)} N on a fixed vane. The power F_x U peaks at U = V/3 for one vane. ${leavesOut}` };
  },
  app: false,
});
