import { G } from '@flux/subjects/mechanics/constants.js';
import { rocketDeltaV } from '@flux/subjects/mechanics/momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, slider, leavesOut } from './widgets.js';

const SCENARIOS = [
  {
    id: 'coast',
    name: 'Coast, no gravity',
    m0: 200,
    mf: 80,
    ve: 1500,
    mdot: 40,
    g: 0,
  },
  {
    id: 'heavy',
    name: 'Same mass burned',
    m0: 400,
    mf: 280,
    ve: 1500,
    mdot: 40,
    g: 0,
  },
  {
    id: 'gravity',
    name: 'Burn in gravity',
    m0: 200,
    mf: 80,
    ve: 1500,
    mdot: 40,
    g: G,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.m0 = sc.m0;
  state.mf = sc.mf;
  state.ve = sc.ve;
  state.mdot = sc.mdot;
  state.g = sc.g;
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * A rocket burning its propellant (Hibbeler §15.9). Shows that the speed it gains follows the mass
 * ratio m₀/m_f, not the mass burned, so the same 120 kg burned from a heavier rocket gives less, and
 * that in gravity a slow burn loses g t_b. Play runs the burn: the propellant drains, the speed climbs
 * along v_e ln(m₀/m) − g t.
 *
 * Recompute: the rocket equation. Check: m dv/dt = ṁ v_e − m g integrated by the midpoint rule.
 */

function clamped(state) {
  const m0 = Math.max(Number(state.m0) || 0, 1);
  let mf = Number(state.mf);
  if (!(mf > 0)) mf = 0.5;
  if (mf > m0 - 0.5) mf = m0 - 0.5;
  const mdot = Math.max(Number(state.mdot) || 0, 0.5);
  const ve = Number(state.ve) || 0;
  const g = Number.isFinite(state.g) ? state.g : 0;
  return { m0, mf, ve, mdot, g };
}

/** Midpoint integration of m dv/dt = ṁ ve − m g. */
function integrated(spec) {
  const steps = 4000;
  const tb = (spec.m0 - spec.mf) / spec.mdot;
  const dt = tb / steps;
  let m = spec.m0;
  let speed = 0;
  for (let i = 0; i < steps; i++) {
    const mid = m - 0.5 * spec.mdot * dt;
    speed += (spec.mdot * spec.ve / mid - spec.g) * dt;
    m -= spec.mdot * dt;
  }
  return speed;
}

/** What the real device has that the model ignores (D30). */
const OUT = String.raw`The exhaust speed and the burn rate are constant. A real engine's thrust grows as the outside pressure falls, so its exhaust speed differs between the ground and a vacuum. Drag, which is largest low and slow, is left out, and so is the turn from vertical toward horizontal flight, which changes the gravity loss from $g t_b$ to the sum of $g\sin\gamma$ over the burn, with $\gamma$ the climb angle above horizontal. Gravity is taken as constant over the burn.`;

export default defineLab({
  id: 'rocket',
  exam: 'u4',
  title: 'Rocket',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'mdot', lo: 5, hi: 80 }),
  hint: 'Δv follows the mass ratio, not the mass burned.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('coast', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rk-m0', 'm₀ (kg)', 200, 40, 800, 10)}
      ${slider('rk-mf', 'm_f (kg)', 80, 10, 700, 10)}
      ${slider('rk-ve', 'v_e (m/s)', 1500, 200, 3000, 10)}
      ${slider('rk-mdot', 'ṁ (kg/s)', 40, 5, 80, 1)}
      <p class="tiny">Gold is the thrust, ṁ v_e, and the flame. Grey is the weight, shown only when the scenario includes gravity. The teal fill is the propellant left. Play runs the burn.</p>`;
  },
  bind(api) {
    bindSlider('rk-m0', (s, v) => { s.m0 = v; }, api);
    bindSlider('rk-mf', (s, v) => { s.mf = v; }, api);
    bindSlider('rk-ve', (s, v) => { s.ve = v; }, api);
    bindSlider('rk-mdot', (s, v) => { s.mdot = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('rk-m0', state.m0);
    set('rk-mf', state.mf);
    set('rk-ve', state.ve);
    set('rk-mdot', state.mdot);
  },
  tick(dt, state) {
    const spec = clamped(state);
    const tb = (spec.m0 - spec.mf) / spec.mdot;
    // The whole burn in about four seconds, whatever its length, with a pause at burnout.
    return advance(state, dt, { lo: 0, hi: tb * 1.2, rate: tb / 4 });
  },
  compute(state) {
    const spec = clamped(state);
    const row = rocketDeltaV({ ...spec, v0: 0 });
    const speed = integrated(spec);
    return {
      spec,
      dv: row.dv,
      tb: row.tb,
      burned: row.burned,
      ratio: row.ratio,
      speed: row.speed,
      gap: Math.abs(row.dv - speed) / Math.max(1, Math.abs(row.dv)),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.42);
    const { m0, mf, ve, mdot, g } = c.spec;
    const tb = c.tb;
    const t = Math.min(Math.max(Number(state.t) || 0, 0), tb);
    const m = m0 - mdot * t;
    const vAt = (u) => ve * Math.log(m0 / (m0 - mdot * u)) - g * u;
    // The rocket: its body, the propellant left as a fill, the flame while it burns.
    const S = sceneIn(B, left, { x0: -1.4, x1: 1.4, y0: -1.9, y1: 1.9 });
    const body = [[0, 1.55], [-0.28, 1.05], [-0.28, -0.48], [0.28, -0.48], [0.28, 1.05]];
    const share = (m - mf) / Math.max(m0 - mf, 1e-9);
    const top = -0.48 + 1.45 * share;
    poly(S, [[-0.26, -0.46], [0.26, -0.46], [0.26, top], [-0.26, top]], { fill: alpha(C.teal, 0.45), stroke: null });
    poly(S, body, { fill: null, stroke: C.text, width: 2 });
    poly(S, [[-0.28, -0.28], [-0.55, -0.6], [-0.28, -0.48]], { fill: alpha(C.text, 0.3), stroke: C.text, width: 1.5 });
    poly(S, [[0.28, -0.28], [0.55, -0.6], [0.28, -0.48]], { fill: alpha(C.text, 0.3), stroke: C.text, width: 1.5 });
    if (t < tb) {
      const fl = Math.min(1.1, 0.3 + mdot / 70);
      poly(S, [[-0.13, -0.48], [0, -0.48 - fl], [0.13, -0.48]], { fill: alpha(C.gold, 0.6), stroke: C.gold, width: 1.5 });
    }
    const thrust = t < tb ? mdot * ve : 0;
    const W = m * g;
    const k = (1.1 * S.k) / Math.max(mdot * ve, W, 1);
    if (thrust > 0) vec(S, [0.55, 0.2], [0, thrust], k, { color: C.gold, label: veiled ? 'thrust' : `${fig(thrust / 1000)} kN` });
    if (g > 0) vec(S, [-0.55, 0.2], [0, -W], k, { color: C.dim, label: veiled ? 'mg' : `${fig(W / 1000)} kN` });
    if (!veiled) label(S, `m = ${fig(m)} kg`, [0, -1.75], { color: C.muted });
    if (veiled) return;

    // Speed through the burn, and the line it would follow with no gravity.
    const n = 60;
    const pts = Array.from({ length: n + 1 }, (_, i) => [(tb * i) / n, vAt((tb * i) / n)]);
    const ideal = Array.from({ length: n + 1 }, (_, i) => [(tb * i) / n, ve * Math.log(m0 / (m0 - (mdot * tb * i) / n))]);
    const hi = Math.max(1, ...ideal.map((q) => q[1])) * 1.12;
    const lo = Math.min(0, ...pts.map((q) => q[1]));
    const P = chartIn(B, right, { lo: 0, hi: tb }, { lo, hi });
    axes(P, { xLabel: 'time in the burn (s)', yLabel: 'speed (m/s)' });
    if (g > 0) {
      line(P, ideal, { color: alpha(C.text, 0.4), width: 1.5, dash: [5, 4] });
      label(P, 'no gravity', ideal[n], { color: C.muted, align: 'right', dy: -8 });
      seg(P, [tb, vAt(tb)], [tb, ideal[n][1]], { color: C.pink, width: 1.5 });
      label(P, `g t_b = ${fig(g * tb)} m/s`, [tb, (vAt(tb) + ideal[n][1]) / 2], { color: C.pink, align: 'right', dx: -6 });
    }
    line(P, pts, { color: C.gold, width: 2.5 });
    dot(P, t, vAt(t), { color: C.yellow, r: 5 });
  },
  law() {
    return [
      String.raw`\Delta v=v_e\ln(m_0/m_f)-gt_b`,
      String.raw`t_b=(m_0-m_f)/\dot{m}`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$\\Delta v$', `${fig(c.dv)} m/s`),
      kv('burned', `${fig(c.burned)} kg`),
      kv('$m_0/m_f$', fig(c.ratio)),
      kv('$t_b$', `${fig(c.tb)} s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Δv', `${fig(c.dv)} m/s`],
      ['burned', `${fig(c.burned)} kg`],
      ['ratio', fig(c.ratio)],
      ['time', `${fig(c.tb)} s`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (state.g > 0) {
      return {
        title: 'Gravity takes g times the burn time',
        body: String.raw`The mass ratio is ${fig(c.ratio)}. $\Delta v = ${fig(c.dv)}\ \mathrm{m/s}$ after subtracting $g t_b$.`,
      };
    }
    const preset = state.scenarioId === 'heavy' && Math.abs(c.burned - 120) < 1 && state.m0 > 300;
    if (preset) {
      return {
        title: 'The same mass burned is a smaller ratio',
        body: String.raw`${fig(c.burned)} kg leaves. The ratio is ${fig(c.ratio)}, so $\Delta v$ is ${fig(c.dv)}\ \mathrm{m/s}.`,
      };
    }
    return {
      title: 'The speed grows with the mass ratio',
      body: String.raw`$\Delta v = v_e\ln(m_0/m_f) = ${fig(c.dv)}\ \mathrm{m/s}$. The ratio is ${fig(c.ratio)}.`,
    };
  }),
});
