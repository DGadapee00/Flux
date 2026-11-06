import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, line, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { LIQUIDS, rigidSurface, rigidSurfaceByVolume } from '@flux/subjects/mechanics/pressure-fields.js';

/**
 * Accelerating tank: an open tank of liquid that accelerates in a straight line or spins, with the
 * liquid moving as one body.
 *
 * Shows that the free surface is an isobar, square to g − a: it tilts back by a_x/(g + a_z) when the
 * tank speeds up, and hollows into a paraboloid when it spins. The closed form places the surface by
 * symmetry (packages/subjects/src/mechanics/pressure-fields.js). The second method finds it by
 * bisection on a numerically integrated volume. `gap` is the larger difference at the two walls, as a
 * share of the rest depth.
 */
const LEN = 1; // tank length for straight motion (m)
const RADIUS = 0.3; // tank radius for a spin (m)
const H0 = 0.45; // rest depth (m)
const HEIGHT = 0.9; // wall height (m)

const SCENARIOS = [
  { id: 'rest', name: 'At rest', mode: 'linear', ax: 0, az: 0, omega: 0 },
  { id: 'truck', name: 'Truck pulling away, 3 m/s²', mode: 'linear', ax: 3, az: 0, omega: 0 },
  { id: 'brake', name: 'Braking hard, 5 m/s²', mode: 'linear', ax: -5, az: 0, omega: 0 },
  { id: 'lift', name: 'Pulling away in a rising lift', mode: 'linear', ax: 3, az: 3, omega: 0 },
  { id: 'spin', name: 'Spinning at 4 rad/s', mode: 'spin', ax: 0, az: 0, omega: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fluid: 'water', mode: sc.mode, ax: sc.ax, az: sc.az, omega: sc.omega });
}

function spec(state) {
  const f = LIQUIDS[state.fluid] || LIQUIDS.water;
  return { mode: state.mode, len: state.mode === 'spin' ? RADIUS : LEN, h0: H0, ax: state.ax, az: state.az, omega: state.omega, rho: f.rho };
}

export default defineLab({
  id: 'rigid-tank',
  exam: 'u2',
  title: 'Accelerating tank',
  hint: 'Speed the tank up: the water climbs the back wall. Spin it: the middle drops as much as the rim rises.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('truck', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => (state.mode === 'spin' ? { key: 'omega', lo: 0, hi: 10 } : { key: 'ax', lo: -5, hi: 5 }),
  controls() {
    return `
      <label class="field"><span>Motion</span><select id="rt-mode"><option value="linear">Straight line</option><option value="spin">Spin about the axis</option></select></label>
      <label class="field"><span>Liquid</span><select id="rt-fluid">${Object.values(LIQUIDS).map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      ${slider('rt-ax', 'forward acceleration aₓ (m/s²)', 3, -5, 5, 0.1)}
      ${slider('rt-az', 'upward acceleration a_z (m/s²)', 0, -3, 3, 0.1)}
      ${slider('rt-w', 'spin ω (rad/s)', 0, 0, 10, 0.1)}
      <p class="tiny">Tank 1 m long, or 0.3 m in radius when it spins. Liquid 0.45 m deep at rest. Forward acceleration applies to straight motion, spin to the round tank.</p>`;
  },
  bind(api) {
    for (const [id, key] of [['rt-mode', 'mode'], ['rt-fluid', 'fluid']]) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    bindSlider('rt-ax', (s, v) => { s.ax = v; }, api);
    bindSlider('rt-az', (s, v) => { s.az = v; }, api);
    bindSlider('rt-w', (s, v) => { s.omega = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['rt-mode', state.mode], ['rt-fluid', state.fluid]]) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    }
    for (const [id, val] of [['rt-ax', state.ax], ['rt-az', state.az], ['rt-w', state.omega]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = spec(state);
    const s = rigidSurface(p);
    const v = rigidSurfaceByVolume(p);
    const gap = Math.max(Math.abs(v.inner - s.inner), Math.abs(v.outer - s.outer)) / H0;
    const spills = Math.max(s.inner, s.outer) > HEIGHT;
    const dry = Math.min(s.inner, s.outer) < 0;
    return { ...s, rho: p.rho, len: p.len, mode: state.mode, back: s.inner, front: s.outer, gap, spills, dry, h0: H0 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const spin = c.mode === 'spin';
    const x0 = spin ? -RADIUS : 0;
    const x1 = spin ? RADIUS : LEN;
    const P = sceneIn(B, B.free, { x0: x0 - 0.22, x1: x1 + 0.22, y0: -0.08, y1: HEIGHT + 0.16 }, 22);
    const zAt = (x) => c.z(spin ? Math.abs(x) : x);
    const surf = [];
    for (let i = 0; i <= 60; i++) {
      const x = x0 + (i / 60) * (x1 - x0);
      surf.push([x, Math.min(HEIGHT, Math.max(0, zAt(x)))]);
    }
    poly(P, [[x0, 0], ...surf, [x1, 0]], { fill: alpha(C.blue, 0.2), stroke: null });
    // Isobars: the surface shifted down by equal steps of pressure.
    for (let k = 1; k <= 4; k++) {
      const dz = k * 0.1;
      const iso = surf.map(([x, z]) => [x, z - dz]).filter(([, z]) => z > 0.005);
      if (iso.length > 1) line(P, iso, { color: alpha(C.blue, 0.45), width: 1, dash: [4, 4] });
    }
    line(P, surf, { color: C.blue, width: 2.5 });
    seg(P, [x0, H0], [x1, H0], { color: alpha(C.muted, 0.6), width: 1, dash: [3, 5] });
    label(P, 'rest level', [x1, H0], { color: C.muted, align: 'left', dx: 6 });
    poly(P, [[x0, HEIGHT], [x0, 0], [x1, 0], [x1, HEIGHT]], { stroke: C.muted, width: 3 });
    if (spin) {
      seg(P, [0, -0.04], [0, HEIGHT + 0.06], { color: alpha(C.gold, 0.7), width: 1, dash: [6, 4] });
      label(P, `ω = ${fig(state.omega)} rad/s`, [0, HEIGHT + 0.1], { color: C.gold });
    } else {
      if (Math.abs(state.ax) > 0.05) {
        arrow(P, [LEN / 2, HEIGHT + 0.09], state.ax > 0 ? 0 : Math.PI, 24 + 8 * Math.abs(state.ax), { color: C.pink });
        label(P, 'a', [LEN / 2, HEIGHT + 0.09], { color: C.pink, dy: -12 });
      }
      label(P, 'back', [0, -0.05], { color: C.muted });
      label(P, 'front', [LEN, -0.05], { color: C.muted });
      // Effective gravity g − a, square to the surface.
      const gx = -state.ax;
      const gz = -(9.81 + state.az);
      arrow(P, [LEN / 2, c.z(LEN / 2) - 0.03], Math.atan2(gz, gx), 50, { color: C.gold, width: 2 });
      label(P, 'g − a', [LEN / 2, c.z(LEN / 2) - 0.2], { color: C.gold, dx: 14 });
    }
  },
  law: () => [String.raw`\nabla p = \rho\,(\mathbf g - \mathbf a)`, String.raw`\tan\theta = \frac{a_x}{g + a_z},\qquad z = \frac{\omega^2 r^2}{2(g + a_z)} + C`],
  liveRows(state, c) {
    const rows = c.mode === 'spin'
      ? [kv('centre level', `${fig(c.inner)} m`), kv('rim level', `${fig(c.outer)} m`), kv('rim rise $\\omega^2R^2/4g_e$', `${fig(c.rise * 100)} cm`)]
      : [kv('tilt $\\theta$', `${fig(c.angle)}°`), kv('level at the back', `${fig(c.back)} m`), kv('level at the front', `${fig(c.front)} m`)];
    return [
      kv('effective gravity $g + a_z$', `${fig(c.ge)} m/s²`),
      ...rows,
      kv(c.mode === 'spin' ? 'floor pressure, centre' : 'floor pressure, back', `${fig(c.pInner / 1000)} kPa`),
      kv(c.mode === 'spin' ? 'floor pressure, rim' : 'floor pressure, front', `${fig(c.pOuter / 1000)} kPa`),
      kv('symmetry against volume balance', `${fig(c.gap * 100)}% of depth`),
    ].join('');
  },
  readout(state, c) {
    if (c.mode === 'spin') {
      return cells([
        ['centre drops', `${fig(c.rise * 100)} cm`],
        ['rim rises', `${fig(c.rise * 100)} cm`],
        ['floor, centre', `${fig(c.pInner / 1000)} kPa`],
        ['floor, rim', `${fig(c.pOuter / 1000)} kPa`],
      ]);
    }
    return cells([
      ['surface tilt', `${fig(c.angle)}°`],
      ['back wall level', `${fig(c.back)} m`],
      ['front wall level', `${fig(c.front)} m`],
      ['floor, back', `${fig(c.pInner / 1000)} kPa`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The liquid has settled and moves with the tank, so nothing shears. Sloshing while it settles, waves, and surface tension at the walls are not modelled.`;
    let title = 'The surface is square to g − a';
    let body = String.raw`Every isobar, the free surface included, lies square to the effective gravity $\mathbf g - \mathbf a$. Here that tilts the surface by ${fig(c.angle)}°.`;
    if (c.mode === 'spin') {
      title = 'A spinning liquid hollows out';
      body = String.raw`Pressure must rise outward to pull each parcel round the circle, so the surface climbs as $r^2$. The rim rises ${fig(c.rise * 100)} cm and the centre drops the same, because no liquid is added.`;
    } else if (state.ax > 0.05) {
      title = 'It piles at the back';
      body = String.raw`The tank speeds up forward, so the liquid needs a push forward. That push is higher pressure at the back: the surface climbs the back wall to ${fig(c.back)} m and drops at the front to ${fig(c.front)} m.`;
    } else if (state.ax < -0.05) {
      title = 'Braking piles it at the front';
      body = String.raw`Slowing down is acceleration backward, so the liquid needs a push backward: the surface climbs the front wall to ${fig(c.front)} m.`;
    } else if (Math.abs(state.ax) <= 0.05) {
      title = 'Level at rest, and in steady motion';
      body = String.raw`With no forward acceleration the surface is level, at rest or at any steady speed. Vertical acceleration changes the floor pressure, ${fig(c.pInner / 1000)} kPa, but not the level.`;
    }
    if (c.spills) body += ' At this rate the liquid would spill over the wall.';
    if (c.dry) body += ' At this rate the floor would show through.';
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
