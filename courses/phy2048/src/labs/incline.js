/**
 * Shows that whether a block slides depends on tan θ against μs and not on its mass, and that once it
 * slides its acceleration a = g(sin θ ∓ μk cos θ) is the same for a light block and a heavy one.
 *
 * The closed form resolves the weight along and across the plane (`incline`). The check works in
 * horizontal and vertical axes instead: it adds the weight, the normal force and friction as x–y
 * vectors and projects the sum on the plane. It also checks that the work of the net force over 1 m
 * equals the kinetic energy gained.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { incline } from '@flux/subjects/mechanics/dynamics.js';
import { Arrow, M, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const FORCE = QUANTITY_COLORS.a;

const SCENARIOS = [
  { id: 'snowboard', name: 'A snowboarder on a 13° slope, μk = 0.20', m: 60, theta: 13, mu: 0.2, motion: 'down' },
  { id: 'shove', name: 'A crate shoved up a 30° ramp, μk = 0.10', m: 20, theta: 30, mu: 0.1, motion: 'up' },
  { id: 'rest', name: 'A box set down on a 25° ramp, μs = 0.30', m: 2, theta: 25, mu: 0.3, motion: 'rest' },
];

/** Length in scene units of a force of size F, when the weight is drawn 2.6 long. */
const per = (state) => 2.6 / (state.m * G);

export default defineLab({
  id: 'incline',
  exam: 'u3',
  title: 'Incline',
  hint: 'Steepen the slope, change the mass or the friction, and see whether the block slides.',
  orbit: false,
  fit: { w: 13, h: 10 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  toggles: [{ key: 'parts', label: 'Parts of the weight' }],
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'incline-mass',
      scenario: 'snowboard',
      ask: String.raw`A snowboarder twice as heavy, $120\ \mathrm{kg}$, rides the same slope on the same snow. What happens to the acceleration and to the friction?`,
      apply(s) { s.m *= 2; },
      watch: [
        { id: 'a', label: 'the acceleration down the slope', get: (c) => c.a, mode: 'factor' },
        { id: 'f', label: 'the friction force', get: (c) => c.f, mode: 'factor' },
      ],
      expect: { a: 1, f: 2 },
      why: String.raw`Twice the mass doubles the downhill pull $mg\sin\theta$ and doubles the normal force, so it doubles the friction $\mu_k mg\cos\theta$ too. Every force doubles, the mass doubles, and $a = g(\sin\theta - \mu_k\cos\theta)$ is unchanged.`,
    },
    {
      id: 'incline-steep',
      scenario: 'snowboard',
      ask: String.raw`The slope steepens from $13^\circ$ to $30^\circ$. What happens to the acceleration and to the normal force?`,
      apply(s) { s.theta = 30; },
      watch: [
        { id: 'a', label: 'the acceleration down the slope', get: (c) => c.a },
        { id: 'N', label: 'the normal force', get: (c) => c.N },
      ],
      mode: 'dir',
      expect: { a: 'bigger', N: 'smaller' },
      why: String.raw`A steeper slope puts more of the weight along the plane, $mg\sin\theta$, and less into it, $mg\cos\theta$. Less normal force means less friction too. Both changes speed the rider up.`,
    },
    {
      id: 'incline-hold',
      scenario: 'rest',
      ask: String.raw`The box slides off a $25^\circ$ ramp with $\mu_s = 0.30$. Put a box five times as heavy there. Does it stay put?`,
      apply(s) { s.m *= 5; },
      watch: [{ id: 'holds', label: 'it stays put', get: (c) => c.holds, mode: 'bool' }],
      expect: { holds: false },
      why: String.raw`The friction it can call on, $\mu_s mg\cos\theta$, grows with the mass, and so does the pull down the slope, $mg\sin\theta$. The mass cancels: the box holds only when $\mu_s \ge \tan\theta$, and $\tan25^\circ = 0.47$ is more than 0.30.`,
    },
  ],
  defaultState() {
    const state = { show: { parts: true } };
    this.applyScenario('snowboard', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('in-m', 'Mass (kg)', 60, 0.5, 150, 0.5)}${sliderRow('in-theta', 'Angle of the slope (°)', 13, 0, 60, 1)}${sliderRow('in-mu', 'Coefficient of friction (μs at rest, μk sliding)', 0.2, 0, 1.2, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'in-m', (s, x) => { s.m = x; });
    bindSlider(api, 'in-theta', (s, x) => { s.theta = x; });
    bindSlider(api, 'in-mu', (s, x) => { s.mu = x; });
  },
  syncControls(state) {
    putSlider('in-m', state.m, 1);
    putSlider('in-theta', state.theta, 0);
    putSlider('in-mu', state.mu, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ground = fatLine([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0], { color: M.grey, width: 2.5 });
    const block = fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
    const arrows = {};
    for (const key of ['w', 'N', 'f', 'wx', 'wy']) {
      const thin = key === 'wx' || key === 'wy';
      arrows[key] = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, thin ? 0.014 : 0.028);
    }
    const acc = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.yellow, undefined, undefined, 0.02);
    const names = {};
    for (const [key, html] of [['w', '<i>mg</i>'], ['N', '<i>N</i>'], ['f', '<i>f</i>'], ['wx', '<i>mg</i> sin θ'], ['wy', '<i>mg</i> cos θ'], ['a', '<i>a</i>']]) {
      names[key] = label(html, 0, 0, 0, key === 'wx' || key === 'wy' ? 'graph-axis' : 'graph-title');
    }
    const thetaName = label('θ', 0, 0, 0, 'graph-title');
    group.add(ground, block, acc, ...Object.values(arrows), ...Object.values(names), thetaName);
    group.visible = false;
    return { group, ground, block, arrows, acc, names, thetaName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const b = incline({ mass: state.m, thetaDeg: state.theta, mu: state.mu, g: G, motion: state.motion });
    computed.a = b.aDown;
    computed.N = b.N;
    computed.f = b.f;
    computed.holds = b.holds;
    computed.W = state.m * G;
    computed.tan = Math.tan(state.theta * DEG);
    computed.v1 = Math.sqrt(2 * Math.abs(b.aDown) * 1);
  },
  second(state) {
    // In x (horizontal, downhill positive) and y (up). Downhill unit vector d, outward normal n.
    const th = state.theta * DEG;
    const d = { x: Math.cos(th), y: -Math.sin(th) };
    const n = { x: Math.sin(th), y: Math.cos(th) };
    const W = { x: 0, y: -state.m * G };
    const Nmag = -(W.x * n.x + W.y * n.y);
    const pull = W.x * d.x + W.y * d.y;
    let fSigned;
    let holds = false;
    if (state.motion === 'rest') {
      holds = state.mu * Nmag + 1e-9 >= pull;
      fSigned = holds ? -pull : -state.mu * Nmag;
    } else {
      fSigned = (state.motion === 'up' ? 1 : -1) * state.mu * Nmag;
    }
    const net = {
      x: W.x + Nmag * n.x + fSigned * d.x,
      y: W.y + Nmag * n.y + fSigned * d.y,
    };
    const a = (net.x * d.x + net.y * d.y) / state.m;
    // Work–energy over 1 m: the net force along the plane times 1 m is ½ m v².
    const v1 = Math.sqrt((2 * Math.abs(net.x * d.x + net.y * d.y) * 1) / state.m);
    return { a, N: Nmag, f: Math.abs(fSigned), holds, v1 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const th = state.theta * DEG;
    const L = 9;
    const x0 = -4.5;
    const y0 = -3.6;
    const top = { x: x0, y: y0 + L * Math.sin(th) };
    const foot = { x: x0 + L * Math.cos(th), y: y0 };
    updateFatLine(h.ground, [x0, y0, 0, foot.x, foot.y, 0, top.x, top.y, 0, x0, y0, 0]);
    // The block sits halfway down the slope.
    const d = { x: Math.cos(th), y: -Math.sin(th) };
    const n = { x: Math.sin(th), y: Math.cos(th) };
    const s = 0.9;
    const base = { x: top.x + 0.5 * L * d.x, y: top.y + 0.5 * L * d.y };
    const c = { x: base.x + n.x * s * 0.5, y: base.y + n.y * s * 0.5 };
    const corner = (u, v) => [c.x + d.x * u * s + n.x * v * s, c.y + d.y * u * s + n.y * v * s, 0.02];
    updateFatLine(h.block, [...corner(-0.5, -0.5), ...corner(0.5, -0.5), ...corner(0.5, 0.5), ...corner(-0.5, 0.5), ...corner(-0.5, -0.5)]);
    const k = per(state);
    const W = computed.W * k;
    const put = (key, x1, y1, from = c) => {
      placeArrow(h.arrows[key], from.x, from.y, from.x + x1, from.y + y1, 0.05);
    };
    put('w', 0, -W);
    put('N', n.x * computed.N * k, n.y * computed.N * k);
    // Friction opposes the motion, or the tendency to slide down when at rest.
    const fDir = state.motion === 'up' ? 1 : -1;
    const contact = { x: base.x, y: base.y };
    put('f', d.x * fDir * computed.f * k, d.y * fDir * computed.f * k, contact);
    h.arrows.f.visible = computed.f > 1e-9;
    const parts = !!state.show?.parts;
    h.arrows.wx.visible = parts;
    h.arrows.wy.visible = parts;
    h.names.wx.visible = parts;
    h.names.wy.visible = parts;
    if (parts) {
      const along = computed.W * Math.sin(th) * k;
      const across = computed.W * Math.cos(th) * k;
      put('wx', d.x * along, d.y * along);
      put('wy', -n.x * across, -n.y * across);
      h.names.wx.position.set(c.x + d.x * along + 0.9, c.y + d.y * along - 0.15, 0);
      h.names.wy.position.set(c.x - n.x * across - 0.95, c.y - n.y * across - 0.1, 0);
    }
    // The acceleration, along the plane, drawn 1.6 long per g.
    const aLen = 1.6 * (computed.a / G);
    placeArrow(h.acc, c.x + n.x * 1.2, c.y + n.y * 1.2, c.x + n.x * 1.2 + d.x * aLen, c.y + n.y * 1.2 + d.y * aLen, 0.06);
    h.names.a.visible = h.acc.visible;
    h.names.a.position.set(c.x + n.x * 1.6 + d.x * aLen, c.y + n.y * 1.6 + d.y * aLen, 0);
    h.names.w.position.set(c.x + 0.35, c.y - W - 0.2, 0);
    h.names.N.position.set(c.x + n.x * (computed.N * k + 0.35), c.y + n.y * (computed.N * k + 0.35), 0);
    h.names.f.visible = h.arrows.f.visible;
    h.names.f.position.set(contact.x + d.x * fDir * (computed.f * k + 0.35) - n.x * 0.3, contact.y + d.y * fDir * (computed.f * k + 0.35) - n.y * 0.3, 0);
    h.thetaName.position.set(foot.x - 1.4, foot.y + 0.3, 0);
  },
  law(state) {
    if (state.motion === 'rest') return [String.raw`\text{holds when } \mu_s \ge \tan\theta`, String.raw`N = mg\cos\theta`];
    if (state.motion === 'up') return [String.raw`a_{\text{down}} = g(\sin\theta + \mu_k\cos\theta)`, String.raw`N = mg\cos\theta`];
    return [String.raw`a = g(\sin\theta - \mu_k\cos\theta)`, String.raw`N = mg\cos\theta`];
  },
  readoutCells(state, computed) {
    const status = state.motion === 'rest'
      ? (computed.holds ? 'It stays put' : 'It slides: μs is below tan θ')
      : (state.motion === 'up' ? 'Sliding up, slowing' : (computed.a >= 0 ? 'Sliding down' : 'Sliding down, slowing'));
    return [
      ['Acceleration down the slope', `${fmt(computed.a)} m/s²`],
      ['Status', status, state.motion === 'rest' ? (computed.holds ? 'ok' : 'warn') : ''],
      ['Normal force', `${fmt(computed.N)} N, less than mg = ${fmt(computed.W)} N`],
      ['Friction', `${fmt(computed.f)} N`],
      ['tan θ, to compare with μs', fmt(computed.tan, 3)],
    ];
  },
  coach(state, computed) {
    const body = [
      String.raw`The weight splits into $mg\sin\theta$ down the slope and $mg\cos\theta$ into it. The slope pushes back with $N = mg\cos\theta = ${fmt(computed.N, 4)}$ N, so $N$ is less than the weight. Friction is at most $\mu N$ and acts along the slope.`,
    ];
    if (state.motion === 'rest') {
      body.push(String.raw`At rest, static friction matches the pull down the slope as long as it can. It can when $\mu_s mg\cos\theta \ge mg\sin\theta$. The mass cancels: the box holds when $\mu_s \ge \tan\theta$, here $${fmt(state.mu, 3)}$ against $${fmt(computed.tan, 3)}$.`);
    } else {
      body.push(String.raw`Sliding, friction is $\mu_k N$ against the motion. Newton's second law along the slope gives $a = g(\sin\theta ${state.motion === 'up' ? '+' : '-'} \mu_k\cos\theta)$${state.motion === 'up' ? ', downhill, while it slides up' : ''}. The mass cancels, so a heavy rider and a light one accelerate alike.`);
    }
    body.push(String.raw`<b>What the model leaves out.</b> A coefficient of friction is not one number: it changes with the surface, the temperature and the speed. Air drag on a fast rider is left out. The block is a point that does not tip.`);
    return { title: 'Along the plane, and into it', body };
  },
});
