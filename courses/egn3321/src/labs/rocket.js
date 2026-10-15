import { G } from '@flux/subjects/mechanics/constants.js';
import { rocketDeltaV } from '@flux/subjects/mechanics/momentum.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

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
}

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

const BODY = [
  { x: 0, y: 1.55 },
  { x: -0.28, y: 1.05 },
  { x: -0.28, y: -0.15 },
  { x: -0.55, y: -0.55 },
  { x: -0.28, y: -0.28 },
  { x: -0.28, y: -0.48 },
  { x: 0.28, y: -0.48 },
  { x: 0.28, y: -0.28 },
  { x: 0.55, y: -0.55 },
  { x: 0.28, y: -0.15 },
  { x: 0.28, y: 1.05 },
  { x: 0, y: 1.55 },
];

export default defineLab({
  id: 'rocket',
  exam: 'u4',
  title: 'Rocket',
  hint: 'Δv follows the mass ratio, not the mass burned.',
  camera: { pos: new THREE.Vector3(0, 0.35, 6.2), target: new THREE.Vector3(0, 0.35, 0) },
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
      <p class="tiny">Gold is the thrust and the flame. Grey is the weight, and it appears only when the scenario includes gravity.</p>`;
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
  init(ctx) {
    const group = new THREE.Group();
    const body = makeLine(M.white);
    const flame = makeLine(M.gold);
    const ground = makeLine(M.greyDark);
    const mk = (dir, color) => forceArrow(dir, color, 0.03, 0.18, 0.14);
    const thrust = mk(new THREE.Vector3(0, 1, 0), M.gold);
    const weight = mk(new THREE.Vector3(0, -1, 0), M.grey);
    group.add(body, flame, ground, thrust, weight);
    ctx.scene.add(group);
    setLine(body, BODY);
    return { group, body, flame, ground, thrust, weight };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const spec = clamped(state);
    const row = rocketDeltaV({ ...spec, v0: 0 });
    const speed = integrated(spec);
    Object.assign(computed, {
      dv: row.dv,
      tb: row.tb,
      burned: row.burned,
      ratio: row.ratio,
      speed: row.speed,
      gap: Math.abs(row.dv - speed) / Math.max(1, Math.abs(row.dv)),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const flame = Math.min(1.15, 0.35 + state.mdot / 70);
    setLine(h.flame, [
      { x: -0.1, y: -0.48 },
      { x: 0, y: -0.48 - flame },
      { x: 0.1, y: -0.48 },
    ]);
    setLine(h.ground, [{ x: -1.6, y: -1.85 }, { x: 1.6, y: -1.85 }]);
    const at = new THREE.Vector3(0, 0.2, 0);
    placeIncomingArrow(h.thrust, at, 0, 1, { scale: 1.15, minLength: 1.15, gap: 0.05 });
    if (state.g > 0) placeIncomingArrow(h.weight, at, 0, -1, { scale: 0.72, minLength: 0.72, gap: 0.05 });
    else h.weight.visible = false;
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
  coach(state, c) {
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
  },
});
