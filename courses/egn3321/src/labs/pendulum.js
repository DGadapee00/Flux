import { barPin, platePin } from '@flux/subjects/mechanics/inertia.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'bar', name: 'Slender bar', mode: 'bar', mass: 4, length: 2, theta: 90, omega: 0 },
  { id: 'hanging', name: 'Hanging bar', mode: 'bar', mass: 4, length: 2, theta: 0, omega: 0 },
  { id: 'plate', name: 'Square plate', mode: 'plate', mass: 2, side: 0.4, omega: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.mass = sc.mass ?? state.mass ?? 4;
  state.length = sc.length ?? state.length ?? 2;
  state.theta = sc.theta ?? state.theta ?? 90;
  state.omega = sc.omega ?? state.omega ?? 0;
  state.side = sc.side ?? state.side ?? 0.4;
}

function frame(cx, cy, span) {
  const z = Math.max(span, 0.35) * 1.85;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

export default defineLab({
  id: 'pendulum',
  exam: 'u6',
  title: 'Pendulum',
  hint: 'A horizontal bar, released from rest, loads the pin with a quarter of its weight.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    if (state.mode === 'plate') {
      const s = Math.max(Number(state.side) || 0.4, 0.2);
      return frame(s * 0.5, s * 0.5, s * 1.35);
    }
    const L = Math.max(Number(state.length) || 2, 0.4);
    const th = (Number(state.theta) || 0) * Math.PI / 180;
    return frame((L * Math.sin(th)) / 2, (-L * Math.cos(th)) / 2, L * 1.15);
  },
  defaultState() {
    const s = {};
    apply('bar', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('pd-mass', 'mass (kg)', 4, 1, 10, 0.5)}
      ${slider('pd-length', 'length (m)', 2, 0.4, 3, 0.1)}
      ${slider('pd-theta', 'from vertical (deg)', 90, 0, 180, 1)}
      ${slider('pd-omega', 'spin (rad/s)', 0, 0, 4, 0.1)}
      ${slider('pd-side', 'side (m)', 0.4, 0.2, 1.2, 0.05)}
      <p class="tiny">Pink is the weight. Teal is the pin force, on the same scale. Gold is the pin.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('pd-mass', 'mass');
    link('pd-length', 'length');
    link('pd-theta', 'theta');
    link('pd-omega', 'omega');
    link('pd-side', 'side');
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pd-mass', state.mass);
    set('pd-length', state.length);
    set('pd-theta', state.theta);
    set('pd-omega', state.omega);
    set('pd-side', state.side);
    const bar = state.mode === 'bar';
    showField('pd-length', bar);
    showField('pd-theta', bar);
    showField('pd-omega', bar);
    showField('pd-side', !bar);
  },
  init(ctx) {
    const group = new THREE.Group();
    const body = makeLine(M.teal);
    const pin = makeDot(M.gold, 0.02);
    const centre = makeDot(M.white, 0.02);
    const weight = forceArrow(new THREE.Vector3(0, -1, 0), M.grey, 0.03, 0.2, 0.14);
    const reaction = forceArrow(new THREE.Vector3(0, 1, 0), M.teal, 0.03, 0.2, 0.14);
    group.add(body, pin, centre, weight, reaction);
    ctx.scene.add(group);
    return { group, body, pin, centre, weight, reaction };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.mode === 'plate') {
      const side = Number(state.side) || 0;
      const row = platePin({
        mass: Number(state.mass) || 0,
        width: side,
        height: side,
        omega: 0,
        g: G,
      });
      Object.assign(computed, {
        alpha: Math.abs(row.alpha),
        Ox: row.Ox,
        Oy: row.Oy,
        pin: row.pin,
        weight: row.weight,
        ratio: row.ratio,
        gap: row.gap,
        gx: side / 2,
        gy: side / 2,
        ex: side,
        ey: side,
      });
      return;
    }
    const row = barPin({
      mass: Number(state.mass) || 0,
      length: Number(state.length) || 0,
      thetaDeg: Number(state.theta) || 0,
      omega: Number(state.omega) || 0,
      g: G,
    });
    Object.assign(computed, {
      alpha: Math.abs(row.alpha),
      Ox: row.Ox,
      Oy: row.Oy,
      pin: row.pin,
      weight: row.weight,
      ratio: row.ratio,
      gap: row.gap,
      gx: row.rx,
      gy: row.ry,
      ex: 2 * row.rx,
      ey: 2 * row.ry,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const plate = state.mode === 'plate';
    const span = plate ? Math.max(Number(state.side) || 0.4, 0.2) : Math.max(Number(state.length) || 2, 0.4);
    const dot = (span * 0.028) / 0.02;
    h.pin.scale.setScalar(dot);
    h.centre.scale.setScalar(dot * 0.8);
    h.pin.position.set(0, 0, 0);
    h.centre.position.set(c.gx, c.gy, 0);
    if (plate) {
      const s = Number(state.side) || 0.4;
      setLine(h.body, [
        { x: 0, y: 0 },
        { x: s, y: 0 },
        { x: s, y: s },
        { x: 0, y: s },
        { x: 0, y: 0 },
      ]);
    } else {
      setLine(h.body, [{ x: 0, y: 0 }, { x: c.ex, y: c.ey }]);
    }
    const scale = (0.42 * span) / Math.max(c.weight, 1e-6);
    const atG = new THREE.Vector3(c.gx, c.gy, 0);
    const atO = new THREE.Vector3(0, 0, 0);
    placeIncomingArrow(h.weight, atG, 0, -c.weight, { scale, minLength: 0, gap: span * 0.02 });
    placeIncomingArrow(h.reaction, atO, c.Ox, c.Oy, { scale, minLength: 0, gap: span * 0.02 });
  },
  law: () => [String.raw`\Sigma M_O=I_O\alpha`],
  liveRows(state, c) {
    if (state.mode === 'plate') {
      return [
        kv('Ox', `${fig(c.Ox)} N`),
        kv('Oy', `${fig(c.Oy)} N`),
        kv('α', `${fig(c.alpha)} rad/s²`),
      ].join('');
    }
    return [
      kv('pin', `${fig(c.pin)} N`),
      kv('weight', `${fig(c.weight)} N`),
      kv('α', `${fig(c.alpha)} rad/s²`),
    ].join('');
  },
  readout(state, c) {
    if (state.mode === 'plate') {
      return cells([
        ['Ox N', fig(c.Ox)],
        ['Oy N', fig(c.Oy)],
        ['α', fig(c.alpha)],
      ]);
    }
    return cells([
      ['pin N', fig(c.pin)],
      ['ratio', fig(c.ratio)],
      ['α', fig(c.alpha)],
    ]);
  },
  coach(state, c) {
    if (state.mode === 'plate') {
      return {
        title: 'A corner pin',
        body: `The plate's weight is ${fig(c.weight)} N. The pin holds ${fig(c.Ox)} N horizontally and ${fig(c.Oy)} N vertically. α is ${fig(c.alpha)} rad/s².`,
      };
    }
    const level = Math.abs((Number(state.theta) || 0) - 90) < 0.5 && Math.abs(Number(state.omega) || 0) < 1e-9;
    if (level) {
      return {
        title: 'A quarter of the weight',
        body: `The pin holds ${fig(c.pin)} N. The weight is ${fig(c.weight)} N. At this release the ratio is ${fig(c.ratio)}. α is ${fig(c.alpha)} rad/s².`,
      };
    }
    if ((Number(state.theta) || 0) < 0.5 && Math.abs(Number(state.omega) || 0) < 1e-9) {
      return {
        title: 'Hanging, the pin holds the weight',
        body: `The bar is at rest below the pin. The pin force is ${fig(c.pin)} N, the same as the weight. α is 0.`,
      };
    }
    return {
      title: 'The pin force follows the pose',
      body: `The pin holds ${fig(c.pin)} N, and the weight is ${fig(c.weight)} N. The ratio is ${fig(c.ratio)}. α is ${fig(c.alpha)} rad/s².`,
    };
  },
});
