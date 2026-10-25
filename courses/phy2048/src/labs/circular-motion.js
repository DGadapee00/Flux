/**
 * Shows that a particle going round a circle at a steady speed is accelerating, that its
 * acceleration points at the centre and not along the motion, that it grows as v²/r, and that a
 * change of speed adds a part along the tangent and tips the acceleration off the radius.
 *
 * The particle moves counterclockwise. The closed form is `circularMotion`: a_c = v²/r = ω²r and
 * a_T = dv/dt = αr. The check writes the position x(t), y(t) = r(cos θ, sin θ) with
 * θ = φ + ωt + ½αt², differentiates it twice numerically, and projects the result on the radius and
 * the tangent.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { circularMotion } from '@flux/subjects/mechanics/kinematics.js';
import { RAD_S_PER_RPM } from '@flux/subjects/convert.js';
import { Arrow, M, dot, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const RS = 3.7;
const CY = 0.2;
const RING = 97;

const SCENARIOS = [
  { id: 'roundabout', name: 'A car on a 20 m roundabout at 10 m/s', r: 20, v: 10, aT: 0, phi: 50 },
  { id: 'jet', name: 'A jet turning at 1 g: 134.1 m/s', r: 1833, v: 134.1, aT: 0, phi: 50 },
  { id: 'speeding', name: 'Speeding up on a 2 m circle', r: 2, v: 2.5, aT: 1.5, phi: 50 },
];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export default defineLab({
  id: 'circular-motion',
  exam: 'u2',
  title: 'Circular motion',
  hint: 'Set the radius, the speed and how fast the speed changes. Drag the particle round the circle.',
  orbit: false,
  fit: { w: 11.6, h: 11 },
  camera: { pos: new THREE.Vector3(0, CY, 24), target: new THREE.Vector3(0, CY, 0) },
  toggles: [{ key: 'parts', label: 'Centripetal and tangential parts' }],
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'cm-speed',
      scenario: 'roundabout',
      ask: String.raw`The car goes round the same $20\ \mathrm{m}$ roundabout twice as fast, $20\ \mathrm{m/s}$. What happens to its acceleration and to the time for one lap?`,
      apply(s) { s.v *= 2; },
      watch: [
        { id: 'ac', label: 'the acceleration toward the centre', get: (c) => c.ac, mode: 'factor' },
        { id: 'period', label: 'the time for one lap', get: (c) => c.period, mode: 'factor' },
      ],
      expect: { ac: 4, period: 0.5 },
      why: String.raw`Twice the speed turns the velocity twice as fast, and the velocity being turned is twice as long. The two factors multiply: $a_c = v^2/r$ grows four times. The lap is the same $2\pi r$ at twice the speed, so it takes half the time.`,
    },
    {
      id: 'cm-radius',
      scenario: 'roundabout',
      ask: String.raw`Take a roundabout twice as big, $40\ \mathrm{m}$, at the same $10\ \mathrm{m/s}$. What happens to the acceleration?`,
      apply(s) { s.r *= 2; },
      watch: [{ id: 'ac', label: 'the acceleration toward the centre', get: (c) => c.ac, mode: 'factor' }],
      expect: { ac: 0.5 },
      why: String.raw`On a wider circle the velocity turns more slowly: $\omega = v/r$ halves. The acceleration is $v\omega$, so it halves too. A gentle curve is easy on the tyres for this reason.`,
    },
    {
      id: 'cm-speedup',
      scenario: 'roundabout',
      ask: String.raw`At the moment shown the car still has $10\ \mathrm{m/s}$, but the driver presses the pedal and the speed now grows at $3\ \mathrm{m/s^2}$. What happens to the part of the acceleration that points at the centre, and to the angle between $\vec a$ and $\vec v$?`,
      apply(s) { s.aT = 3; },
      watch: [
        { id: 'ac', label: 'the part pointing at the centre', get: (c) => c.ac },
        { id: 'angle', label: 'the angle between a and v', get: (c) => c.angleFromV },
      ],
      mode: 'dir',
      expect: { ac: 'same', angle: 'smaller' },
      why: String.raw`The centripetal part depends only on the speed and the radius at this instant, so it stays $v^2/r = 5\ \mathrm{m/s^2}$. Speeding up adds a part along $\vec v$. The total tips forward from the radius, so the angle drops below $90^\circ$: here to $59^\circ$.`,
    },
  ],
  defaultState() {
    const state = { show: { parts: true } };
    this.applyScenario('roundabout', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${logSliderRow('cm-r', 'Radius (m)', 20, 0.5, 3000)}${logSliderRow('cm-v', 'Speed at this moment (m/s)', 10, 0.2, 300)}${sliderRow('cm-at', 'Rate the speed changes, dv/dt (m/s²)', 0, -10, 10, 0.1)}${sliderRow('cm-phi', 'Where on the circle (°)', 50, 0, 360, 1)}</div>`;
  },
  bind(api) {
    bindLogSlider(api, 'cm-r', (s, x) => { s.r = x; });
    bindLogSlider(api, 'cm-v', (s, x) => { s.v = x; });
    bindSlider(api, 'cm-at', (s, x) => { s.aT = x; });
    bindSlider(api, 'cm-phi', (s, x) => { s.phi = x; });
  },
  syncControls(state) {
    putLogSlider('cm-r', state.r);
    putLogSlider('cm-v', state.v);
    putSlider('cm-at', state.aT, 2);
    putSlider('cm-phi', state.phi, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ring = [];
    for (let i = 0; i < RING; i += 1) {
      const t = (2 * Math.PI * i) / (RING - 1);
      ring.push(RS * Math.cos(t), CY + RS * Math.sin(t), 0);
    }
    const circle = fatLine(ring, { color: M.greyDark, width: 2.5 });
    const centre = dot(M.grey, 0.08);
    centre.position.set(0, CY, 0);
    const radius = fatLine([0, CY, 0, RS, CY, 0], { color: QUANTITY_COLORS.x, width: 2, opacity: 0.8 });
    const particle = dot(M.white, 0.2);
    const vel = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v);
    const acc = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a);
    const ac = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a, undefined, undefined, 0.016);
    const at = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a, undefined, undefined, 0.016);
    const vName = label('<i>v</i>', 0, 0, 0, 'graph-title');
    const aName = label('<i>a</i>', 0, 0, 0, 'graph-title');
    const acName = label('<i>a</i><sub>c</sub>', 0, 0, 0, 'graph-axis');
    const atName = label('<i>a</i><sub>T</sub>', 0, 0, 0, 'graph-axis');
    const rName = label('', 0, 0, 0, 'graph-axis');
    const spin = label('counterclockwise', 0, CY - RS - 0.55, 0, 'graph-axis');
    group.add(circle, centre, radius, ac, at, acc, vel, particle, vName, aName, acName, atName, rName, spin);
    group.visible = false;
    return { group, radius, particle, vel, acc, ac, at, vName, aName, acName, atName, rName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const m = circularMotion({ r: state.r, v: state.v, aT: state.aT });
    computed.omega = m.omega;
    computed.rpm = m.omega / RAD_S_PER_RPM;
    computed.ac = m.ac;
    computed.aT = m.aT;
    computed.a = m.a;
    computed.alpha = m.alpha;
    computed.angleFromV = m.angleFromV;
    computed.period = m.period;
    computed.gs = m.a / G;
  },
  second(state) {
    // Differentiate the position twice, with Richardson's step-halving, and project on the radius
    // and the tangent at the particle.
    const w = state.v / state.r;
    const al = state.aT / state.r;
    const p0 = state.phi * DEG;
    const pos = (t) => {
      const th = p0 + w * t + 0.5 * al * t * t;
      return [state.r * Math.cos(th), state.r * Math.sin(th)];
    };
    // A step near 0.002 of a radian of turn balances truncation (h⁴) against rounding (1/h²).
    const h = 2e-3 / Math.max(1e-6, Math.abs(w), Math.sqrt(Math.abs(al)));
    const d2 = (k) => {
      const f = (n) => (pos(n * h)[k] - 2 * pos(0)[k] + pos(-n * h)[k]) / (n * h) ** 2;
      return (4 * f(1) - f(2)) / 3;
    };
    const ax = d2(0);
    const ay = d2(1);
    const inward = -(ax * Math.cos(p0) + ay * Math.sin(p0));
    const along = -ax * Math.sin(p0) + ay * Math.cos(p0);
    return {
      ac: inward,
      aT: along,
      a: Math.hypot(ax, ay),
      angleFromV: Math.atan2(inward, along) / DEG,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const p = state.phi * DEG;
    const c = Math.cos(p);
    const s = Math.sin(p);
    const px = RS * c;
    const py = CY + RS * s;
    updateFatLine(h.radius, [0, CY, 0, px, py, 0]);
    h.particle.position.set(px, py, 0.06);
    h.rName.element.innerHTML = `<i>r</i> = ${fmt(state.r, 4)} m`;
    // Beside the radius, near the centre, on the side the velocity points to; the label for a sits on the other.
    h.rName.position.set(0.3 * px - 0.75 * s, CY + 0.3 * (py - CY) + 0.75 * c, 0);
    // The velocity is tangent, counterclockwise, drawn at a fixed length: its direction is the point.
    const tx = -s;
    const ty = c;
    // Drawn a little outside the circle, so it does not hide the tangential part of a.
    const VL = state.v > 0 ? 2.2 : 0;
    const vx0 = px + c * 0.32;
    const vy0 = py + s * 0.32;
    placeArrow(h.vel, vx0, vy0, vx0 + tx * VL, vy0 + ty * VL, 0.05);
    h.vName.visible = VL > 0;
    h.vName.position.set(vx0 + tx * (VL + 0.3) + c * 0.2, vy0 + ty * (VL + 0.3) + s * 0.2, 0);
    // The acceleration, 2.4 long, with its two parts drawn to the same scale.
    const AL = 2.4;
    const k = computed.a > 1e-12 ? AL / computed.a : 0;
    const ix = -c;
    const iy = -s;
    const ax = (computed.ac * ix + computed.aT * tx) * k;
    const ay = (computed.ac * iy + computed.aT * ty) * k;
    placeArrow(h.acc, px, py, px + ax, py + ay, 0.055);
    h.aName.visible = h.acc.visible;
    h.aName.position.set(px + ax * 1.1 - tx * 0.35, py + ay * 1.1 - ty * 0.35, 0);
    const parts = !!state.show?.parts && Math.abs(computed.aT) > 1e-9;
    h.ac.visible = parts;
    h.at.visible = parts;
    h.acName.visible = parts;
    h.atName.visible = parts;
    if (parts) {
      const cl = computed.ac * k;
      const tl = computed.aT * k;
      placeArrow(h.ac, px, py, px + ix * cl, py + iy * cl, 0.045);
      placeArrow(h.at, px, py, px + tx * tl, py + ty * tl, 0.045);
      h.acName.position.set(px + ix * cl * 0.55 + tx * 0.4, py + iy * cl * 0.55 + ty * 0.4, 0);
      h.atName.position.set(px + tx * tl * 1.2 - ix * 0.35, py + ty * tl * 1.2 - iy * 0.35, 0);
    }
  },
  law: () => [
    String.raw`a_c = \dfrac{v^2}{r} = \omega^2 r,\qquad a_T = \dfrac{dv}{dt} = \alpha r`,
    String.raw`|\vec a| = \sqrt{a_c^2 + a_T^2}`,
  ],
  readoutCells(state, computed) {
    return [
      [String.raw`Toward the centre, $a_c$`, `${fmt(computed.ac)} m/s²`],
      [String.raw`Total, $|\vec a|$`, `${fmt(computed.a)} m/s²`],
      ['In units of g', `${fmt(computed.gs, 3)} g`],
      [String.raw`Along the motion, $a_T$`, `${fmt(computed.aT)} m/s²`, computed.aT < 0 ? 'warn' : ''],
      [String.raw`Angle between $\vec a$ and $\vec v$`, `${fmt(computed.angleFromV, 4)}°`],
      [String.raw`Angular speed, $\omega$`, `${fmt(computed.omega)} rad/s, ${fmt(computed.rpm)} rpm`],
      ['One lap at this speed', `${fmt(computed.period)} s`],
    ];
  },
  coach(state, computed) {
    const steady = Math.abs(state.aT) < 1e-9;
    const body = [
      String.raw`The speed is $${fmt(state.v, 4)}$ m/s, but the direction of $\vec v$ turns at $\omega = v/r = ${fmt(computed.omega, 4)}$ rad/s. A turning velocity is a changing velocity, so there is an acceleration: $a_c = v\omega = v^2/r = ${fmt(computed.ac, 4)}\ \mathrm{m/s^2}$, toward the centre.`,
      steady
        ? String.raw`The speed is steady, so that is all of it. The acceleration is at $90^\circ$ to the velocity, so it turns the motion and never speeds it up.`
        : String.raw`The speed is ${state.aT > 0 ? 'growing' : 'falling'} at $${fmt(Math.abs(state.aT), 3)}\ \mathrm{m/s^2}$, which adds a part along the tangent. The total, $\sqrt{a_c^2 + a_T^2} = ${fmt(computed.a, 4)}\ \mathrm{m/s^2}$, sits $${fmt(computed.angleFromV, 3)}^\circ$ from $\vec v$.`,
      String.raw`<b>What the model leaves out.</b> The particle is a point, and the circle is perfect. A real car on a roundabout follows a path whose radius changes, and the tyres have to supply the force for $a_c$. That force is the next unit's work.`,
    ];
    return { title: 'Turning is accelerating', body };
  },
  pointer: {
    down(e, ctx) {
      const hits = ctx.pick(e, [ctx.handle.particle]);
      if (!hits.length) return false;
      ctx.drag = 'particle';
      return true;
    },
    move(e, ctx) {
      if (!ctx.drag) return;
      const q = ctx.onPlane(e);
      if (!q) return;
      let deg = Math.atan2(q.y - CY, q.x) / DEG;
      if (deg < 0) deg += 360;
      ctx.state.phi = clamp(Math.round(deg), 0, 360);
      ctx.bump();
    },
    up(e, ctx) {
      ctx.drag = null;
    },
  },
});
