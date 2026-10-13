import * as THREE from 'three';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, disposeTree } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { motor } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { fmtI } from '../ui/format.js';
import { fmtB } from './biot.js';
import { label, si } from './device-kit.js';

/**
 * Application: the DC motor (Ch 46). A coil turns between two magnet poles. The two sides that run
 * across the field feel F = NIsB in opposite directions, a couple with torque τ = NIAB|cos φ| here
 * (φ measured from the field). Left alone the coil would rock to rest at the dead point; a split
 * ring (the commutator) reverses its current every half turn, so the torque never changes sign.
 *
 * Colours follow the scene palette: B teal (north pole to south), current gold, force pink. The coil
 * turns slowly for display; the readouts use the real speed.
 */
const SCENARIOS = [
  { id: 'course', name: 'Notes example: 100 turns, 2 A, 10 cm, 0.5 T, 1800 rpm', N: 100, I: 2, s: 0.1, B: 0.5, rpm: 1800 },
  { id: 'toy', name: 'Toy motor: 50 turns, 0.5 A, 2 cm, 0.3 T, 6000 rpm', N: 50, I: 0.5, s: 0.02, B: 0.3, rpm: 6000 },
  { id: 'fan', name: 'Desk fan: 300 turns, 1 A, 6 cm, 0.4 T, 1200 rpm', N: 300, I: 1, s: 0.06, B: 0.4, rpm: 1200 },
];

const HALF = 1.3; // half the coil's side, scene units
const POLE_X = 2.9;
const TURN_S = 3.2; // display seconds per revolution

export default defineLab({
  id: 'motor',
  exam: 'e4',
  title: 'Motor',
  hint: 'Watch the current flip at the dead point, so the push keeps turning it the same way',
  // A fixed oblique view, so the flat-lab framing fits it to a phone as well as a laptop.
  orbit: false,
  camera: { pos: new THREE.Vector3(8.5, 6.2, 14), target: new THREE.Vector3(0, -0.3, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, ...sc, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const { name, ...sc } = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
  },
  controls() {
    const slider = (id, text, min, max, step) => `
          <label class="field">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          ${slider('mo-N', 'Turns <i>N</i>', 1, 500, 1)}
          ${slider('mo-I', 'Current <i>I</i>', 0.1, 10, 0.1)}
          ${slider('mo-s', 'Coil side <i>s</i>', 0.01, 0.3, 0.005)}
          ${slider('mo-B', 'Field <i>B</i>', 0.05, 2, 0.05)}
          ${slider('mo-rpm', 'Speed', 100, 6000, 50)}
          <p class="tiny">The coil turns slowly for display; the power uses the speed you set.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, f) =>
      document.getElementById(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('mo-N', (s, v) => (s.N = v));
    on('mo-I', (s, v) => (s.I = v));
    on('mo-s', (s, v) => (s.s = v));
    on('mo-B', (s, v) => (s.B = v));
    on('mo-rpm', (s, v) => (s.rpm = v));
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('mo-N', state.N, `${state.N}`);
    set('mo-I', state.I, fmtI(state.I));
    set('mo-s', state.s, `${(state.s * 100).toFixed(1)} cm`);
    set('mo-B', state.B, si(state.B, 'T'));
    set('mo-rpm', state.rpm, `${state.rpm} rpm`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Bfield = new VectorBatch(group, Q.B);
    // The rotor: coil, axle and commutator turn together about the vertical axis.
    const rotor = new THREE.Group();
    group.add(rotor);
    const coil = fatLine([HALF, -HALF, 0, HALF, HALF, 0, -HALF, HALF, 0, -HALF, -HALF, 0], { color: Q.I, width: 5 });
    rotor.add(coil);
    // The coil's leads run down to the commutator: two half rings, split across the coil's plane.
    rotor.add(fatLine([HALF, -HALF, 0, 0.25, -HALF - 0.4, 0], { color: Q.I, width: 3 }));
    rotor.add(fatLine([-HALF, -HALF, 0, -0.25, -HALF - 0.4, 0], { color: Q.I, width: 3 }));
    const ring = (a0) => {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const a = a0 + 0.2 + (i / 24) * (Math.PI - 0.4);
        pts.push(0.32 * Math.cos(a), -HALF - 0.55, 0.32 * Math.sin(a));
      }
      return fatLine(pts, { color: 0xc8904a, width: 6 });
    };
    rotor.add(ring(-Math.PI / 2), ring(Math.PI / 2));
    rotor.add(fatLine([0, -HALF - 0.9, 0, 0, HALF + 0.6, 0], { color: M.grey, width: 3 }));
    // Force arrows on the two sides across the field, and current arrows along them.
    const fA = new Arrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1.4, Q.F, 0.38, 0.3, 0.06);
    const fB = new Arrow(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 1.4, Q.F, 0.38, 0.3, 0.06);
    const iA = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.55, Q.I, 0.3, 0.24, 0.001);
    const iB = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 0.55, Q.I, 0.3, 0.24, 0.001);
    group.add(fA, fB, iA, iB);
    const tauLabel = label('', 0, HALF + 1.2, 0);
    group.add(tauLabel);
    group.visible = false;
    return { group, Bfield, rotor, fA, fB, iA, iB, tauLabel, scene: null, key: '', time: 0 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.mo = motor(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mo;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.N, state.I, state.s, state.B, state.rpm]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The poles: north (red) on the left, south (blue) on the right; B runs from N to S.
    for (const [x, color, name] of [
      [-POLE_X - 0.5, 0xc0504a, 'N'],
      [POLE_X + 0.5, 0x3f7fb0, 'S'],
    ]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(1, 2.8, 2.4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
      pole.position.set(x, 0, 0);
      g.add(pole);
      g.add(label(`<b>${name}</b>`, x, 1.8, 0));
    }
    const dir = new THREE.Vector3(1, 0, 0);
    const o = new THREE.Vector3();
    h.Bfield.begin();
    for (const y of [-1.8, 0, 1.8]) for (const z of [-1.1, 1.1]) h.Bfield.push(o.set(-POLE_X + 0.1, y, z), dir, 2 * POLE_X - 0.3);
    h.Bfield.end(true);
    g.add(label(`<span class="qB"><i>B</i> = ${fmtB(state.B)}, N → S</span>`, 0, -2.6, 1.3));
    g.add(label(qv('qI', `<i>I</i> = ${fmtI(state.I)} · ${state.N} turns`), -2, -2.1, -1.4));
    g.add(label('<span class="muted">commutator</span>', 0.9, -HALF - 0.8, 0.4));
    h.fA.setLength(0.8 + 1.1 * Math.tanh(c.sideForce / 10), 0.36, 0.28);
    h.fB.setLength(0.8 + 1.1 * Math.tanh(c.sideForce / 10), 0.36, 0.28);
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mo;
    if (!h || !c) return;
    h.time = (h.time + Math.min(dt, 0.05)) % TURN_S;
    // φ is the angle of the coil's plane from the field direction (x); it turns counterclockwise
    // seen from above, as the torque drives it.
    const phi = (h.time / TURN_S) * 2 * Math.PI;
    h.rotor.rotation.y = phi;
    // The two sides across the field sit at ±HALF along the coil's plane.
    const r = new THREE.Vector3(HALF * Math.cos(phi), 0, -HALF * Math.sin(phi));
    // The commutator sets each side's current so the push always turns the coil the same way:
    // τ_y = −r_x F_z > 0 needs F_z opposite to r_x, so the side on the +x half carries current up
    // (F along −z) and the other side down. The switch comes at r_x = 0, the dead point, where the
    // coil faces the field square on and the torque is zero.
    const sideAUp = r.x >= 0;
    const up = new THREE.Vector3(0, 1, 0);
    const down = new THREE.Vector3(0, -1, 0);
    h.iA.position.set(r.x, -0.25, r.z);
    h.iA.setDirection(sideAUp ? up : down);
    h.iB.position.set(-r.x, -0.25, -r.z);
    h.iB.setDirection(sideAUp ? down : up);
    // F = I L × B with B along +x: current up (+y) gives F along −z; down gives +z.
    h.fA.position.set(r.x, 0.2, r.z);
    h.fA.setDirection(new THREE.Vector3(0, 0, sideAUp ? -1 : 1));
    h.fB.position.set(-r.x, 0.2, -r.z);
    h.fB.setDirection(new THREE.Vector3(0, 0, sideAUp ? 1 : -1));
    const tau = c.tauAt(phi + Math.PI / 2);
    h.tauLabel.element.innerHTML = `<span style="color:var(--pink,#D147BD)">τ now = ${si(tau, 'N·m')}</span>`;
  },
  law() {
    return [
      String.raw`F = N\qI s B \ \text{on each side across } \vec B`,
      String.raw`\tau = 2F\cdot\tfrac{s}{2}\sin\theta = N\qI AB\sin\theta, \quad A = s^2`,
      String.raw`\bar\tau = \tfrac{2}{\pi}\,N\qI AB \qquad \qP = \bar\tau\,\omega`,
    ];
  },
  liveRows(state, computed) {
    const c = computed.mo;
    if (!c) return '';
    return [
      kv(tex(String.raw`F = N\qI sB`), qv('qF', si(c.sideForce, 'N'))),
      kv(tex(String.raw`\mu = N\qI A`), `${si(c.mu, 'A·m²')}`),
      kv(tex(String.raw`\tau_{\max} = N\qI AB`), `${si(c.tauMax, 'N·m')}`),
      kv(tex(String.raw`\bar\tau = \tfrac{2}{\pi}\tau_{\max}`), `${si(c.tauAvg, 'N·m')}`),
      kv(tex(String.raw`\omega = 2\pi f`), `${c.omega.toFixed(1)} rad/s`),
      kv(tex(String.raw`\qP = \bar\tau\,\omega`), qv('qP', si(c.P, 'W'))),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.mo;
    if (!c) return '';
    return cells([
      [String.raw`Push on a side`, si(c.sideForce, 'N'), 'qF'],
      [String.raw`Peak torque`, si(c.tauMax, 'N·m'), ''],
      [String.raw`Average torque`, si(c.tauAvg, 'N·m'), ''],
      [String.raw`Power at ${state.rpm} rpm`, si(c.P, 'W'), 'qP'],
    ]);
  },
  coach(state, computed) {
    const c = computed.mo;
    if (!c) return { title: '', body: '' };
    return {
      title: 'A motor is the torque on a current loop, kept pointing one way',
      body: [
        'The two sides that cross the field are pushed in opposite directions, $F = NIsB$ each. Offset by the coil’s width, the pair makes a torque:',
        eq(String.raw`\tau = NIAB\sin\theta, \qquad \tau_{\max} = ${si(c.tauMax, 'N·m').replace('·', '\\cdot ')}`),
        'Where the coil faces the field square on, the torque is zero, and past that point it would reverse and rock the coil back. The commutator, a split ring the brushes slide over, reverses the current right there, so the torque keeps turning the coil the same way. It averages $(2/\\pi)\\tau_{\\max}$, and at speed $\\omega$ the motor does work at $P = \\bar\\tau\\omega$.',
        'A magnetic force does no work on a moving charge (Section 8 of the notes), yet the motor does work. The energy comes from the supply. The coil’s charges move with the coil across $\\vec B$, and $q\\vec v\\times\\vec B$ pushes them back against the current: a back emf. The supply does work driving the current against it, and the magnetic forces pass that work on to the coil.',
        '<b>What the course model leaves out.</b> Here the current and the speed are set separately. In a real motor the back emf (Ch 48) grows with speed and cuts the current, until the torque just matches the load. Real motors use many coils on an iron core so the torque barely dips, and brushless motors switch the current electronically instead of with a commutator.',
      ],
    };
  },
});
