/**
 * Shows that a banked road lets a car turn with no friction at one speed, the design speed
 * v = √(rg tan θ), and that friction widens that one speed into a band: it points down the bank above
 * the design speed and up the bank below it. On a flat road friction alone supplies mv²/r.
 *
 * The closed form resolves the forces along and across the road (`bankedCurve`). The check writes
 * ΣF = ma in horizontal and vertical components and solves the 2×2 system for N and f by Cramer's
 * rule, then confirms that the residual ΣF − ma is zero.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { bankedCurve } from '@flux/subjects/mechanics/dynamics.js';
import { Arrow, M, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const FORCE = QUANTITY_COLORS.a;

const SCENARIOS = [
  { id: 'flat', name: 'A 900 kg car on a flat 500 m curve at 25 m/s', m: 900, r: 500, theta: 0, v: 25, mu: 1.0 },
  { id: 'banked', name: 'A 31° banked 100 m curve at 24.3 m/s, dry', m: 1000, r: 100, theta: 31, v: 24.3, mu: 1.0 },
  { id: 'fast', name: 'The same banked curve at 40 m/s', m: 1000, r: 100, theta: 31, v: 40, mu: 1.0 },
];

export default defineLab({
  id: 'banked-curve',
  exam: 'u3',
  title: 'Banked curve',
  hint: 'Change the speed, the bank and the grip. Friction points whichever way the road needs.',
  orbit: false,
  fit: { w: 12.4, h: 9.6 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'bank-ice',
      scenario: 'banked',
      ask: String.raw`The car takes the $31^\circ$ bank at its design speed, $24.3\ \mathrm{m/s}$. The road ices over, and $\mu$ drops from 1.0 to 0.05. Does the car still hold its line?`,
      apply(s) { s.mu = 0.05; },
      watch: [{ id: 'holds', label: 'it holds the curve', get: (c) => c.holds, mode: 'bool' }],
      expect: { holds: true },
      why: String.raw`At the design speed the normal force alone supplies $mv^2/r$: its horizontal part turns the car and its vertical part holds up the weight. Friction is not needed, so losing it changes nothing. Any other speed on ice slides.`,
    },
    {
      id: 'bank-speed',
      scenario: 'flat',
      ask: String.raw`On the flat curve the car speeds up from $25$ to $50\ \mathrm{m/s}$. By what factor does the friction it needs change?`,
      apply(s) { s.v *= 2; },
      watch: [{ id: 'f', label: 'the friction needed', get: (c) => Math.abs(c.f), mode: 'factor' }],
      expect: { f: 4 },
      why: String.raw`On a flat road friction is the whole centripetal force, $f = mv^2/r$. Twice the speed needs four times the friction, so the coefficient it needs goes from 0.13 to 0.51.`,
    },
    {
      id: 'bank-mass',
      scenario: 'banked',
      ask: String.raw`A loaded truck twice the car's mass takes the same banked curve. What happens to the highest speed friction can hold?`,
      apply(s) { s.m *= 2; },
      watch: [{ id: 'vMax', label: 'the highest safe speed', get: (c) => c.vMax }],
      mode: 'dir',
      expect: { vMax: 'same' },
      why: String.raw`The force needed, $mv^2/r$, and the grip available, $\mu N$, both grow with the mass. It cancels from $v_{\max}^2 = rg(\sin\theta + \mu\cos\theta)/(\cos\theta - \mu\sin\theta)$. Heavier vehicles do not get a lower limit from this model.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('banked', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('bc-v', 'Speed (m/s)', 24.3, 0, 80, 0.1)}${sliderRow('bc-theta', 'Bank angle (°)', 31, 0, 60, 1)}${sliderRow('bc-r', 'Radius of the curve (m)', 100, 10, 1000, 5)}${sliderRow('bc-mu', 'Coefficient of static friction', 1, 0, 1.2, 0.01)}${sliderRow('bc-m', 'Mass (kg)', 1000, 100, 5000, 50)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'bc-v', (s, x) => { s.v = x; });
    bindSlider(api, 'bc-theta', (s, x) => { s.theta = x; });
    bindSlider(api, 'bc-r', (s, x) => { s.r = x; });
    bindSlider(api, 'bc-mu', (s, x) => { s.mu = x; });
    bindSlider(api, 'bc-m', (s, x) => { s.m = x; });
  },
  syncControls(state) {
    putSlider('bc-v', state.v, 1);
    putSlider('bc-theta', state.theta, 0);
    putSlider('bc-r', state.r, 0);
    putSlider('bc-mu', state.mu, 2);
    putSlider('bc-m', state.m, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const road = fatLine([0, 0, 0, 1, 0, 0], { color: M.grey, width: 3 });
    const level = fatLine([0, 0, 0, 1, 0, 0], { color: M.greyDark, width: 1.5 });
    const car = fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
    const arrows = {};
    for (const key of ['W', 'N', 'f']) arrows[key] = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE);
    arrows.net = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const centre = new Arrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(-0.2, 4.2, 0), 1.4, M.grey, undefined, undefined, 0.014);
    const centreName = label('toward the centre of the curve', 3.1, 4.2, 0, 'graph-axis');
    const names = {};
    for (const [key, html] of [['W', '<i>mg</i>'], ['N', '<i>N</i>'], ['f', '<i>f</i>'], ['net', 'net: <i>mv</i>²/<i>r</i>'], ['theta', 'θ']]) {
      names[key] = label(html, 0, 0, 0, key === 'net' ? 'graph-axis' : 'graph-title');
    }
    group.add(level, road, car, centre, centreName, ...Object.values(arrows), ...Object.values(names));
    group.visible = false;
    return { group, road, level, car, arrows, names };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const b = bankedCurve({ mass: state.m, radius: state.r, thetaDeg: state.theta, speed: state.v, mu: state.mu, g: G });
    computed.N = b.N;
    computed.f = b.f;
    computed.holds = b.holds;
    computed.vDesign = b.vDesign;
    computed.vMin = b.vMin;
    computed.vMax = b.vMax;
    computed.Fc = state.m * b.an;
    computed.muNeeded = b.N > 0 ? Math.abs(b.f) / b.N : Infinity;
    computed.regime = b.regime;
  },
  second(state) {
    // x toward the centre, y up. N = N(sin θ, cos θ), friction down the bank f(cos θ, −sin θ) is toward
    // the centre and down. ΣFx = m v²/r and ΣFy = 0: two equations in N and f.
    const th = state.theta * DEG;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const Fx = (state.m * state.v * state.v) / state.r;
    const Fy = state.m * G;
    const det = s * -s - c * c;
    const N = (Fx * -s - c * Fy) / det;
    const f = (s * Fy - c * Fx) / det;
    const residual = Math.hypot(N * s + f * c - Fx, N * c - f * s - Fy);
    const holds = Math.abs(f) <= state.mu * N + 1e-8 * Math.max(1, N);
    // A nonzero residual would show up as a disagreement in N, which labs-check compares.
    return { N: N + residual, f, holds, vDesign: Math.sqrt(state.r * G * Math.tan(th)) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const th = state.theta * DEG;
    // The road rises to the right, away from the centre, through the contact point.
    const p = { x: 0.6, y: -1.9 };
    const u = { x: Math.cos(th), y: Math.sin(th) };
    const n = { x: -Math.sin(th), y: Math.cos(th) };
    updateFatLine(h.road, [p.x - 5 * u.x, p.y - 5 * u.y, 0, p.x + 4 * u.x, p.y + 4 * u.y, 0]);
    updateFatLine(h.level, [p.x - 5, p.y - 5 * u.y, 0, p.x + 4, p.y - 5 * u.y, 0]);
    const w = 1.8;
    const ht = 0.9;
    const c = { x: p.x + n.x * ht * 0.5, y: p.y + n.y * ht * 0.5 };
    const corner = (a, b) => [p.x + u.x * a + n.x * b, p.y + u.y * a + n.y * b, 0.02];
    updateFatLine(h.car, [...corner(-w / 2, 0), ...corner(w / 2, 0), ...corner(w / 2, ht), ...corner(-w / 2, ht), ...corner(-w / 2, 0)]);
    const k = 2.4 / Math.max(state.m * G, computed.N, Math.abs(computed.f), computed.Fc, 1e-9);
    placeArrow(h.arrows.W, c.x, c.y, c.x, c.y - state.m * G * k, 0.05);
    placeArrow(h.arrows.N, c.x, c.y, c.x + n.x * computed.N * k, c.y + n.y * computed.N * k, 0.05);
    // f > 0 points down the bank, toward the centre.
    placeArrow(h.arrows.f, p.x, p.y, p.x - u.x * computed.f * k, p.y - u.y * computed.f * k, 0.05);
    placeArrow(h.arrows.net, c.x, c.y + 2.9, c.x - computed.Fc * k, c.y + 2.9, 0.05);
    h.names.W.position.set(c.x + 0.4, c.y - state.m * G * k * 0.75, 0);
    h.names.N.position.set(c.x + n.x * (computed.N * k + 0.35), c.y + n.y * (computed.N * k + 0.35), 0);
    h.names.f.visible = h.arrows.f.visible;
    h.names.f.position.set(p.x - u.x * computed.f * k * 1.1 + n.x * -0.35, p.y - u.y * computed.f * k * 1.1 + n.y * -0.35, 0);
    h.names.net.visible = h.arrows.net.visible;
    h.names.net.position.set(c.x - computed.Fc * k * 0.5, c.y + 3.3, 0);
    h.names.theta.visible = state.theta > 2;
    h.names.theta.position.set(p.x - 3.2, p.y - 5 * u.y + 0.35, 0);
  },
  law: () => [
    String.raw`N\sin\theta + f\cos\theta = \dfrac{mv^2}{r},\qquad N\cos\theta - f\sin\theta = mg`,
    String.raw`v_{\text{design}} = \sqrt{rg\tan\theta}`,
  ],
  readoutCells(state, computed) {
    const fDir = Math.abs(computed.f) < 1e-6 * state.m ? 'none needed' : (computed.f > 0 ? 'down the bank' : 'up the bank');
    return [
      ['Friction needed', `${fmt(Math.abs(computed.f))} N, ${fDir}`],
      ['Status', computed.holds ? 'It holds the curve' : `It ${computed.regime}`, computed.holds ? 'ok' : 'warn'],
      ['μ it needs, |f|/N', fmt(computed.muNeeded, 3)],
      ['Design speed, no friction', `${fmt(computed.vDesign)} m/s`],
      ['Speeds friction can hold', `${fmt(computed.vMin, 3)} to ${Number.isFinite(computed.vMax) ? `${fmt(computed.vMax, 3)} m/s` : 'any speed'}`],
      ['Normal force', `${fmt(computed.N)} N`],
    ];
  },
  coach(state, computed) {
    const body = [
      String.raw`The car goes round a horizontal circle, so it needs a net force $mv^2/r = ${fmt(computed.Fc, 4)}$ N toward the centre, and none up or down. The road supplies it. On a bank the normal force leans toward the centre and does part of the job.`,
      Math.abs(computed.f) < 1e-6 * state.m
        ? String.raw`This is the design speed: the normal force alone does it, and friction is zero.`
        : String.raw`Here friction makes up the rest, ${computed.f > 0 ? 'pointing down the bank because the car is faster than the design speed' : 'pointing up the bank because the car is slower than the design speed'}. It needs $\mu \ge ${fmt(computed.muNeeded, 3)}$.`,
      String.raw`<b>What the model leaves out.</b> No force pushes the car outward in the road's frame of the ground: there is no centrifugal force on this diagram. The car is a point, so tipping, load transfer between the wheels and tyre slip angles are left out.`,
    ];
    return { title: 'Turning needs a force toward the centre', body };
  },
});
