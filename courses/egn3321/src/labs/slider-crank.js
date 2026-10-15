import { sliderCrank } from '@flux/subjects/mechanics/rigid2d.js';
import { M, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const DEG = Math.PI / 180;

const SCENARIOS = [
  { id: 'extended', name: 'Extended', r: 0.2, l: 0.8, theta: 0, omega: 10, alpha: 0 },
  { id: 'mid', name: 'Mid stroke', r: 0.2, l: 0.8, theta: 90, omega: 10, alpha: 0 },
  { id: 'folded', name: 'Folded', r: 0.2, l: 0.8, theta: 180, omega: 10, alpha: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.r = sc.r;
  state.l = sc.l;
  state.theta = sc.theta;
  state.omega = sc.omega;
  state.alpha = sc.alpha;
}

function constraint(r, l, theta) {
  if (!(l > 0)) return NaN;
  const s = (r / l) * Math.sin(theta);
  if (Math.abs(s) > 1) return NaN;
  return r * Math.cos(theta) + l * Math.sqrt(1 - s * s);
}

export default defineLab({
  id: 'slider-crank',
  exam: 'u5',
  title: 'Slider-crank',
  hint: 'At a dead centre the slider speed is zero. The acceleration is not, because of the −ω²r term.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    const reach = Math.max((Number(state.r) || 0) + (Number(state.l) || 0), 0.6);
    const cx = reach * 0.42;
    return {
      pos: new THREE.Vector3(cx, reach * 0.08, reach * 1.85),
      target: new THREE.Vector3(cx, reach * 0.06, 0),
    };
  },
  defaultState() {
    const s = {};
    apply('extended', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('sc-r', 'crank r (m)', 0.2, 0.1, 0.6, 0.01)}
      ${slider('sc-l', 'rod l (m)', 0.8, 0.3, 1.2, 0.01)}
      ${slider('sc-theta', 'crank (deg)', 0, 0, 180, 1)}
      ${slider('sc-omega', 'omega (rad/s)', 10, 0, 20, 0.5)}
      ${slider('sc-alpha', 'alpha (rad/s²)', 0, -20, 20, 0.5)}
      <p class="tiny">The crank is teal. The rod is white. White is the slider velocity and pink is its acceleration.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('sc-r', 'r');
    link('sc-l', 'l');
    link('sc-theta', 'theta');
    link('sc-omega', 'omega');
    link('sc-alpha', 'alpha');
  },
  syncControls(state) {
    for (const [id, key] of [
      ['sc-r', 'r'], ['sc-l', 'l'], ['sc-theta', 'theta'], ['sc-omega', 'omega'], ['sc-alpha', 'alpha'],
    ]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    const rail = makeLine(M.grey);
    const crank = makeLine(M.teal);
    const rod = makeLine(M.white);
    const pin = makeDot(M.teal, 0.035);
    const block = makeDot(M.gold, 0.045);
    const vel = makeArrow(M.white);
    const acc = makeArrow(M.pink);
    group.add(rail, crank, rod, pin, block, vel, acc);
    ctx.scene.add(group);
    return { group, rail, crank, rod, pin, block, vel, acc };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const th = (Number(state.theta) || 0) * DEG;
    const r = Number(state.r) || 0;
    const l = Number(state.l) || 0;
    const omega = Number(state.omega) || 0;
    const alpha = Number(state.alpha) || 0;
    const row = sliderCrank({ r, l, theta: th, omega, alpha });
    const pinX = r * Math.cos(th);
    const pinY = r * Math.sin(th);
    if (row.locked) {
      Object.assign(computed, {
        x: 0, v: 0, a: 0, phi: 0, gap: 0, locked: 1, pinX, pinY,
      });
      return;
    }
    const h = 1e-5;
    const xAt = (t) => constraint(r, l, th + omega * t + 0.5 * alpha * t * t);
    const x0 = xAt(0);
    const vNum = (xAt(h) - xAt(-h)) / (2 * h);
    const aNum = (xAt(h) - 2 * x0 + xAt(-h)) / (h * h);
    const gap = Number.isFinite(vNum) && Number.isFinite(aNum)
      ? Math.max(
        Math.abs(row.v - vNum) / Math.max(1, Math.abs(row.v)),
        Math.abs(row.a - aNum) / Math.max(1, Math.abs(row.a)),
      )
      : 0;
    Object.assign(computed, {
      x: row.x,
      v: row.v,
      a: row.a,
      phi: row.phi,
      gap,
      locked: 0,
      pinX,
      pinY,
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const reach = Math.max(state.r + state.l, 0.6);
    const locked = c.locked > 0;
    setLine(h.rail, [{ x: -0.15, y: 0 }, { x: reach * 1.05, y: 0 }]);
    setLine(h.crank, [{ x: 0, y: 0 }, { x: c.pinX, y: c.pinY }]);
    h.pin.position.set(c.pinX, c.pinY, 0);
    h.rod.visible = !locked;
    h.block.visible = !locked;
    if (!locked) {
      setLine(h.rod, [{ x: c.pinX, y: c.pinY }, { x: c.x, y: 0 }]);
      h.block.position.set(c.x, 0, 0);
    }
    const cap = Math.max(0.35, reach * 0.28);
    setArrow(h.vel, { x: locked ? c.pinX : c.x, y: 0.02 }, { x: c.v, y: 0 }, cap);
    setArrow(h.acc, { x: locked ? c.pinX : c.x, y: -0.02 }, { x: c.a, y: 0 }, cap);
  },
  law: () => [String.raw`x=r\cos\theta+\ell\cos\phi`, String.raw`a_B=a_A+\alpha\times r-\omega^2 r`],
  liveRows(state, c) {
    return [
      kv('$x$', `${fig(c.x)} m`),
      kv('$v$', `${fig(c.v)} m/s`),
      kv('$a$', `${fig(c.a)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['x', `${fig(c.x)} m`],
      ['speed', `${fig(c.v)} m/s`],
      ['accel', `${fig(c.a)} m/s²`],
    ]);
  },
  coach(state, c) {
    if (c.locked > 0) {
      return {
        title: 'The rod cannot reach',
        body: 'At this angle the crank is too long for the rod. The linkage is not assembled.',
      };
    }
    if (Math.abs(c.v) < 1e-6) {
      return {
        title: 'Stopped, and still accelerating',
        body: String.raw`The slider speed is 0. The acceleration is ${fig(c.a)} m/s². The $-\omega^2 r$ term remains at a dead centre.`,
      };
    }
    return {
      title: 'Write the position, then differentiate',
      body: String.raw`The slider is at ${fig(c.x)} m. Its velocity is ${fig(c.v)} m/s and its acceleration is ${fig(c.a)} m/s².`,
    };
  },
});
