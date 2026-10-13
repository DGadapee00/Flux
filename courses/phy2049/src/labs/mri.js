import * as THREE from 'three';
import { defineLab } from './define.js';
import { M, Q, fatLine, disposeTree } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { mriMagnet } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { fmtI, fmtHz } from '../ui/format.js';
import { label, si } from './device-kit.js';

/**
 * Application: the MRI magnet (Ch 47). Modelled as a long solenoid, Ampère's law gives B = μ₀nI
 * inside, uniform, whatever the radius. The field wanted and the current in the wire set the turns
 * per metre; the turns and the radius set how much wire. A scanner is only a few radii long, so the
 * lab also adds up the turns' on-axis fields (Biot–Savart) to show what that n really gives. In copper that wire would turn megawatts into
 * heat, so the coil is superconducting and the current circulates with no supply at all.
 *
 * Inside, each proton's magnetic moment feels a torque τ = μ × B (Ch 46) and precesses about B, at
 * a radio frequency proportional to B. The scene is a cutaway schematic: the coil is drawn with far
 * fewer turns than the real one, and the spins precess slowly.
 */
const SCENARIOS = [
  { id: 'clinical', name: 'Hospital scanner: 1.5 T, 400 A, 1.8 m long', B: 1.5, I: 400, L: 1.8, R: 0.5, Aw: 4e-6 },
  { id: 'research', name: 'Research scanner: 3 T, same coil size', B: 3, I: 400, L: 1.8, R: 0.5, Aw: 4e-6 },
  // The notes give no radius; 1 cm keeps this 10 cm coil long enough for B = μ₀nI to hold within 2%.
  { id: 'course', name: 'The Ch 47 solenoid: 1000 turns, 2 A, 10 cm', B: 4e-7 * Math.PI * 1e4 * 2, I: 2, L: 0.1, R: 0.01, Aw: 1e-6 },
];

const HL = 3.4; // half the drawn length of the solenoid (along x)
const RD = 1.55; // drawn radius
const DRAW_TURNS = 26;
const SPINS = [];
for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) for (const [y, z] of [[-0.25, -0.35], [-0.25, 0.35], [0.2, 0]]) SPINS.push([x, y, z]);

/** The coach's check of the long-solenoid formula against this coil's own length and radius. */
function finite(state, c) {
  const k = c.Bcenter / state.B;
  const radii = (state.L / state.R).toFixed(1);
  if (k > 0.98) return `This coil is ${radii} radii long, so it is close to the long solenoid Ampère's law assumes: adding up its turns' fields (Biot–Savart) gives ${si(c.Bcenter, 'T')} at the center.`;
  return `This coil is only ${radii} radii long, not the long solenoid Ampère's law assumes. Adding up its turns' fields on the axis (Biot–Savart) gives ${si(c.Bcenter, 'T')} at the center, ${Math.round((1 - k) * 100)}% short, and ${si(c.Bend, 'T')} at the ends. A real magnet adds extra turns toward its ends to make up the difference.`;
}

export default defineLab({
  id: 'mri',
  exam: 'e4',
  title: 'MRI',
  hint: 'B = μ₀nI inside a long solenoid: the field sets the turns, the turns set the wire',
  // A fixed oblique view, so the flat-lab framing fits it to a phone as well as a laptop.
  orbit: false,
  camera: { pos: new THREE.Vector3(4.5, 6.5, 17.5), target: new THREE.Vector3(0.4, -0.3, 0) },
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
          ${slider('mr-B', 'Field wanted <i>B</i> (log)', -2, 0.9, 0.01)}
          ${slider('mr-I', 'Current in the wire <i>I</i> (log)', 0, 2.9, 0.01)}
          ${slider('mr-L', 'Coil length <i>L</i>', 0.05, 2.5, 0.05)}
          ${slider('mr-R', 'Coil radius <i>R</i>', 0.01, 0.9, 0.01)}
          ${slider('mr-Aw', 'Wire cross-section, if copper', 0.5, 20, 0.5)}
          <p class="tiny">A cutaway: the coil is drawn with far fewer turns than the real one, and the spins precess slowly.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, f) =>
      document.getElementById(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('mr-B', (s, v) => (s.B = 10 ** v));
    on('mr-I', (s, v) => (s.I = 10 ** v));
    on('mr-L', (s, v) => (s.L = v));
    on('mr-R', (s, v) => (s.R = v));
    on('mr-Aw', (s, v) => (s.Aw = v * 1e-6));
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('mr-B', Math.log10(state.B), si(state.B, 'T'));
    set('mr-I', Math.log10(state.I), fmtI(state.I));
    set('mr-L', state.L, `${state.L.toFixed(2)} m`);
    set('mr-R', state.R, `${(state.R * 100).toFixed(0)} cm`);
    set('mr-Aw', state.Aw * 1e6, `${(state.Aw * 1e6).toFixed(1)} mm²`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Bfield = new VectorBatch(group, Q.B);
    const spins = new VectorBatch(group, M.lavender);
    group.visible = false;
    return { group, Bfield, spins, scene: null, key: '', time: 0 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.mri = mriMagnet(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mri;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.B, state.I, state.L, state.R, state.Aw]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The coil: a helix along x, drawn only on its far half so the bore stays visible.
    for (let k = 0; k < DRAW_TURNS; k++) {
      const x = -HL + ((k + 0.5) / DRAW_TURNS) * 2 * HL;
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const a = Math.PI * (0.05 + (i / 28) * 1.1);
        pts.push(x + (0.02 * i) / 28, RD * Math.cos(a), -RD * Math.sin(a));
      }
      g.add(fatLine(pts, { color: Q.I, width: 2.5, opacity: 0.85 }));
    }
    // The patient table.
    const table = new THREE.Mesh(new THREE.BoxGeometry(2 * HL + 1.6, 0.12, 1.3), new THREE.MeshBasicMaterial({ color: 0x3a3f4a }));
    table.position.set(0.8, -0.75, 0);
    g.add(table);
    // Uniform B inside: straight, evenly spaced arrows. At the ends it spreads and weakens.
    const o = new THREE.Vector3();
    const dx = new THREE.Vector3(1, 0, 0);
    h.Bfield.begin();
    for (const y of [-0.9, 0, 0.9]) for (const z of [-0.8, 0.8]) h.Bfield.push(o.set(-HL + 0.3, y, z), dx, 2 * HL - 0.6);
    for (const [y, z] of [[1.3, 0], [-1.3, 0], [0, 1.25], [0, -1.25]]) {
      h.Bfield.push(o.set(HL + 0.1, y * 0.8, z * 0.8), new THREE.Vector3(1, y * 0.35, z * 0.35).normalize(), 0.9);
    }
    h.Bfield.end(true);
    g.add(label(`<span class="qB"><i>μ</i>₀<i>nI</i> = ${si(state.B, 'T')} · ${si(c.Bcenter, 'T')} at the center of this coil</span>`, -0.6, RD + 0.55, 0));
    g.add(label(`<span class="qB">${si(c.Bend, 'T')} at the ends</span>`, HL + 1.2, 0.9, 0));
    g.add(label(qv('qI', `${Math.round(c.N).toLocaleString('en-US')} turns · ${fmtI(state.I)}`), -2.4, -RD - 1.1, 0.8));
    g.add(label('<span style="color:var(--lavender,#C7B3DC)">proton spins precess at ' + fmtHz(c.fLarmor) + '</span>', 2.2, -RD - 1.1, 0.8));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mri;
    if (!h || !c) return;
    h.time += Math.min(dt, 0.05);
    // Each spin tilts 25° off B and precesses about it; a stronger field spins them faster
    // (the display rate is slowed, but kept in proportion to B). A proton's moment points along its
    // spin, so dμ/dt = γ μ × B with γ > 0: seen looking back along B it turns clockwise, the angle
    // decreasing.
    const w = -2.2 * Math.min(3, Math.max(0.4, state.B / 1.5));
    const tilt = 0.44;
    const d = new THREE.Vector3();
    const o = new THREE.Vector3();
    h.spins.begin();
    SPINS.forEach(([x, y, z], i) => {
      const a = w * h.time + i * 0.7;
      d.set(Math.cos(tilt), Math.sin(tilt) * Math.cos(a), Math.sin(tilt) * Math.sin(a));
      h.spins.push(o.set(x, y, z), d, 0.5);
    });
    h.spins.end(true);
  },
  law() {
    return [
      String.raw`B = \mu_0 n\,\qI \;\Rightarrow\; n = \dfrac{B}{\mu_0 \qI}, \quad N = nL`,
      String.raw`\text{wire} = N\cdot 2\pi R \qquad \qP_{\text{copper}} = \qI^2\,\dfrac{\rho\,(\text{wire})}{A_w}`,
      String.raw`\tau = \mu B\sin\theta \ \text{on each proton}`,
    ];
  },
  liveRows(state, computed) {
    const c = computed.mri;
    if (!c) return '';
    return [
      kv(tex(String.raw`n = B/\mu_0\qI`), `${Math.round(c.n).toLocaleString('en-US')} turns/m`),
      kv(tex(String.raw`N = nL`), `${Math.round(c.N).toLocaleString('en-US')} turns`),
      kv(tex(String.raw`\text{wire} = N\cdot 2\pi R`), si(c.wire, 'm')),
      kv('As copper: resistance', `${si(c.Rcu, 'Ω')}`),
      kv(tex(String.raw`\text{As copper: } \qI^2\qR`), qv('qP', si(c.Pcu, 'W'))),
      kv('Superconducting', '0 W'),
      kv(tex(String.raw`\text{This coil's center: } \mu_0 n\qI\,\frac{L/2}{\sqrt{(L/2)^2+R^2}}`), si(c.Bcenter, 'T')),
      kv(tex(String.raw`\text{At an end: } \tfrac12\mu_0 n\qI\,\frac{L}{\sqrt{L^2+R^2}}`), si(c.Bend, 'T')),
      kv(tex(String.raw`\tau_{\max} = \mu_p B`), `${(c.tauProton / 1e-26).toFixed(2)}×10⁻²⁶ N·m`),
      kv('Proton precession', fmtHz(c.fLarmor)),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.mri;
    if (!c) return '';
    return cells([
      [String.raw`Field $B$`, si(state.B, 'T'), 'qB'],
      [`Turns`, Math.round(c.N).toLocaleString('en-US'), ''],
      [`Wire`, si(c.wire, 'm'), ''],
      [`If it were copper`, si(c.Pcu, 'W'), 'qP'],
    ]);
  },
  coach(state, computed) {
    const c = computed.mri;
    if (!c) return { title: '', body: '' };
    return {
      title: 'An MRI magnet is a solenoid: $B = \\mu_0 nI$, and a lot of wire',
      body: [
        'Ampère’s law around a long solenoid gives a field that is uniform inside and depends only on the turns per metre and the current, not on the radius:',
        eq(String.raw`n = \frac{B}{\mu_0 I} = ${Math.round(c.n).toLocaleString('en-US')}\ \text{turns/m}, \qquad N = nL = ${Math.round(c.N).toLocaleString('en-US')}`),
        finite(state, c),
        `Wound at a ${(state.R * 100).toFixed(0)} cm radius that is ${si(c.wire, 'm')} of wire. As copper it would have ${si(c.Rcu, 'Ω')} and turn ${si(c.Pcu, 'W')} into heat at ${fmtI(state.I)}. So the coil is a superconductor, cooled by liquid helium: zero resistance, and the current circulates for years with the supply disconnected.`,
        `Each proton in the body is a tiny magnetic dipole. The field twists it, $\\tau = \\mu B\\sin\\theta$, and it precesses about $\\vec B$ at ${fmtHz(c.fLarmor)}, a radio frequency. The scanner tips the protons with a radio pulse and listens to them precess.`,
        '<b>What the course model leaves out.</b> The precession is the torque at work: $\\vec\\tau = \\vec\\mu\\times\\vec B$ turns the proton’s spin sideways, the way gravity makes a tilted top precess instead of falling over. Its rate, $\\mu B$ divided by the spin’s angular momentum, needs that spin, $\\hbar/2$, which is quantum mechanics. Real magnets add shim coils to make the field uniform to parts per million, and gradient coils that vary it on purpose so each spot in the body precesses at its own frequency: that is how the image is made.',
      ],
    };
  },
});

