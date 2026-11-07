import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, dot, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { LIQUIDS, gateForce, gateForceSlices } from '@flux/subjects/mechanics/pressure-fields.js';

/**
 * Gate: a flat rectangular gate in the wall of a tank, hinged at its top edge.
 *
 * Shows that the pressure force acts below the gate's centroid, at y_c + I/(y_c A), and that the
 * gap closes as the gate goes deeper, because the pressure across it grows more even. The closed
 * form is in packages/subjects/src/mechanics/pressure-fields.js. The second method sums slices
 * along the gate; `gap` is the larger of the two disagreements, in force and in position.
 */
const SCENARIOS = [
  { id: 'surface', name: 'Vertical gate at the surface', fluid: 'water', d: 0, L: 2, b: 1, theta: 90 },
  { id: 'deep', name: 'The same gate 8 m down', fluid: 'water', d: 8, L: 2, b: 1, theta: 90 },
  { id: 'sloped', name: 'Sloped gate, 45°', fluid: 'water', d: 1, L: 2, b: 1, theta: 45 },
  { id: 'lock', name: 'Seawater lock gate', fluid: 'seawater', d: 0, L: 4, b: 3, theta: 90 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: sc.fluid, d: sc.d, L: sc.L, b: sc.b, theta: sc.theta });
}

export default defineLab({
  id: 'gate',
  exam: 'u2',
  title: 'Gate',
  hint: 'Lower the gate: the force grows, and its line of action closes in on the centroid. Tilt it back: the same gate feels less.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('surface', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'd', lo: 0, hi: 10 }),
  controls() {
    return `
      <label class="field"><span>Liquid</span><select id="ga-fluid">${Object.values(LIQUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      ${slider('ga-d', 'depth of the top edge d (m)', 0, 0, 10, 0.1)}
      ${slider('ga-L', 'gate length L (m)', 2, 0.5, 5, 0.1)}
      ${slider('ga-b', 'gate width b (m)', 1, 0.5, 4, 0.1)}
      ${slider('ga-t', 'tilt from horizontal θ (°)', 90, 20, 90, 1)}
      <p class="tiny">Gauge pressure: the air pushes on both sides. Hinged at the top edge.</p>`;
  },
  bind(api) {
    document.getElementById('ga-fluid')?.addEventListener('change', (e) => {
      api.slice().fluid = e.target.value;
      api.bump();
    });
    bindSlider('ga-d', (s, v) => { s.d = v; }, api);
    bindSlider('ga-L', (s, v) => { s.L = v; }, api);
    bindSlider('ga-b', (s, v) => { s.b = v; }, api);
    bindSlider('ga-t', (s, v) => { s.theta = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('ga-fluid');
    if (sel) sel.value = state.fluid;
    for (const [id, val] of [['ga-d', state.d], ['ga-L', state.L], ['ga-b', state.b], ['ga-t', state.theta]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const f = LIQUIDS[state.fluid] || LIQUIDS.water;
    const spec = { rho: f.rho, d: state.d, L: state.L, b: state.b, theta: state.theta };
    const g = gateForce(spec);
    const n = gateForceSlices(spec);
    const gap = Math.max(Math.abs(n.F - g.F) / g.F, Math.abs(n.ycp - g.ycp) / state.L, Math.abs(n.hold - g.hold) / g.hold);
    const pTop = f.rho * 9.81 * state.d;
    const pBot = f.rho * 9.81 * (state.d + state.L * g.s);
    return { fluid: f, rho: f.rho, ...g, pTop, pBot, depthC: g.hc, depthCp: g.hcp, Fnum: n.F, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const th = (state.theta * Math.PI) / 180;
    const T = [0, -state.d];
    const Bt = [state.L * Math.cos(th), -state.d - state.L * Math.sin(th)];
    const zB = Bt[1];
    const span = state.d + state.L;
    const xR = Math.max(Bt[0], 0) + 0.7 * span;
    const P = sceneIn(B, B.free, { x0: -0.45 * span, x1: xR, y0: zB - 0.08 * span, y1: 0.12 * span }, 26);
    poly(P, [[0, 0], T, Bt, [xR, zB], [xR, 0]], { fill: alpha(C.blue, 0.16), stroke: null });
    seg(P, [0, 0.08 * span], T, { color: C.muted, width: 3 });
    seg(P, Bt, [xR, zB], { color: C.muted, width: 3 });
    seg(P, [0, 0], [xR, 0], { color: alpha(C.blue, 0.7), width: 1.5 });
    label(P, 'free surface', [xR, 0], { color: alpha(C.blue, 0.9), align: 'right', dy: -9 });
    seg(P, T, Bt, { color: C.gold, width: 5 });
    // Pressure on the gate, pushing from the water side.
    const ang = Math.atan2(-Math.cos(th), -Math.sin(th));
    const scale = 90 / c.pBot;
    for (let i = 0; i <= 10; i++) {
      const s = (i / 10) * state.L;
      const at = [T[0] + s * Math.cos(th), T[1] - s * Math.sin(th)];
      const p = c.rho * 9.81 * (state.d + s * Math.sin(th));
      if (p * scale > 6) arrow(P, at, ang, p * scale, { color: alpha(C.teal, 0.85), width: 1.5, head: 7, tail: true });
    }
    const along = (y) => [T[0] + (y - c.yTop) * Math.cos(th), T[1] - (y - c.yTop) * Math.sin(th)];
    const cp = along(c.ycp);
    const cg = along(c.yc);
    arrow(P, cp, ang, 90, { color: C.pink, width: 3, tail: true });
    dot(P, cg[0], cg[1], { color: C.text, r: 4 });
    label(P, 'centroid', cg, { color: C.text, dx: -10, align: 'right' });
    dot(P, cp[0], cp[1], { color: C.pink, r: 5 });
    label(P, 'F acts here', cp, { color: C.pink, dx: -10, dy: 12, align: 'right' });
    dot(P, T[0], T[1], { color: C.yellow, r: 5, ring: C.bg });
    label(P, 'hinge', T, { color: C.yellow, dx: -10, align: 'right' });
  },
  law: () => [String.raw`F = \rho g\,h_c A`, String.raw`y_{cp} = y_c + \frac{I_{xc}}{y_c A},\quad I_{xc} = \frac{bL^3}{12}`],
  liveRows(state, c) {
    return [
      kv('density $\\rho$', `${fig(c.rho)} kg/m³`),
      kv('area $A = bL$', `${fig(c.A)} m²`),
      kv('pressure at the top edge', `${fig(c.pTop / 1000)} kPa`),
      kv('pressure at the bottom edge', `${fig(c.pBot / 1000)} kPa`),
      kv('centroid depth $h_c$', `${fig(c.hc)} m`),
      kv('$F$ acts below the centroid by', `${fig(c.offset * 100)} cm`),
      kv('closed form against slices', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['force $F$', `${fig(c.F / 1000)} kN`],
      ['centroid depth', `${fig(c.hc)} m`],
      ['$F$ acts at depth', `${fig(c.hcp)} m`],
      ['force to hold it', `${fig(c.hold / 1000)} kN`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The liquid is still and its density uniform. The gate's own weight, the hinge's friction and the seals are not counted, and the air pushes equally on both faces.`;
    let title = 'The force acts below the centroid';
    let body = String.raw`The pressure grows with depth, so the lower half of the gate carries more of the load. The resultant ${fig(c.F / 1000)} kN acts ${fig(c.offset * 100)} cm below the centroid, measured along the gate.`;
    if (state.d === 0 && state.theta === 90) {
      title = 'Two thirds of the way down';
      body = String.raw`With its top edge at the surface, the pressure on the gate rises from zero in a triangle, and the force acts two thirds of the way down: at ${fig(c.hcp)} m, where the centroid is at ${fig(c.hc)} m.`;
    } else if (c.offset < 0.02 * state.L) {
      title = 'Deep down the pressure is nearly even';
      body = String.raw`At this depth the pressure changes little from the top edge (${fig(c.pTop / 1000)} kPa) to the bottom (${fig(c.pBot / 1000)} kPa), so the force acts only ${fig(c.offset * 100)} cm below the centroid.`;
    } else if (state.theta < 80) {
      title = 'A sloped gate sees less depth';
      body = String.raw`Laid back at ${fig(state.theta)}°, the same length of gate spans less depth. Its centroid is at ${fig(c.hc)} m, and the force is ${fig(c.F / 1000)} kN.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
