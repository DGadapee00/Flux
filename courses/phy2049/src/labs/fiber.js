import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree } from '../scene/manim.js';
import { opticalFiber } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: the optical fiber (Ch 58 total internal reflection, Ch 62 fiber optics). A core of
 * index nCore in a cladding of lower index nClad guides any ray that meets the side wall at more than
 * the critical angle. A ray entering the end face from air at θ to the axis refracts to θr and then
 * zigzags. It is guided when θ ≤ θmax, with NA = sin θmax = √(nCore² − nClad²).
 *
 * A flat side view: the fiber runs left to right, the core (white edges) inside the cladding (grey
 * band), the core drawn far wider than to scale. The light (yellow) comes in from the left at the
 * chosen angle; the dashed lines mark the acceptance cone. A guided ray bounces to the far end; a ray
 * outside the cone leaks into the cladding at its first bounce and escapes.
 */
const SCENARIOS = [
  { id: 'notes', name: 'Notes example: telecom silica, 1.475 in 1.460, ray at 8°', nCore: 1.475, nClad: 1.46, theta: 8 },
  { id: 'plastic', name: 'Plastic fiber: acrylic 1.49 in 1.36, ray at 30°', nCore: 1.49, nClad: 1.36, theta: 30 },
  { id: 'leak', name: 'Telecom fiber, ray at 20°: outside the cone, it leaks', nCore: 1.475, nClad: 1.46, theta: 20 },
];

const X0 = -2.6; // the entry face
const X1 = 3.1; // the far end
const RC = 0.6; // core half-width (drawn)
const RW = 1.0; // cladding half-width (drawn)
const N_PH = 24;
const DEG = 180 / Math.PI;
const deg = (r) => `${(r * DEG).toFixed(1)}°`;

/** The ray's path: a polyline from the source, through the end face, bouncing, and out. */
function rayPath(c) {
  const pts = [];
  const tIn = Math.tan(Math.asin(Math.min(1, Math.sin(c.thetaR) * c.nCore)));
  // Incoming, from below-left, hitting the end face at the axis.
  const lead = 1.6;
  const rise = Math.min(lead * tIn, 1.6);
  pts.push({ x: X0 - (tIn > 1e-6 ? rise / tIn : lead), y: -rise });
  pts.push({ x: X0, y: 0 });
  const slope = Math.tan(c.thetaR);
  if (slope < 1e-6) {
    pts.push({ x: X1, y: 0 });
    return { pts, leak: null };
  }
  let x = X0;
  let y = 0;
  let dir = 1;
  for (let k = 0; k < 400; k++) {
    const target = dir * RC;
    const dx = (target - y) / (dir * slope);
    if (x + dx >= X1) {
      pts.push({ x: X1, y: y + dir * slope * (X1 - x) });
      return { pts, leak: null };
    }
    x += dx;
    y = target;
    pts.push({ x, y });
    if (!c.guided) {
      // Refracted into the cladding at its own angle, then lost at the cladding's outer edge (a real
      // fiber's coating absorbs it there).
      const sClad = (c.nCore / c.nClad) * Math.sin(c.wall);
      const aClad = Math.asin(Math.min(1, sClad)); // from the wall's normal
      const run = Math.min((RW - RC) * Math.tan(aClad), X1 - x);
      const ye = y + dir * Math.min(RW - RC, run / Math.max(Math.tan(aClad), 1e-6));
      return { pts, leak: [{ x, y }, { x: x + run, y: ye }] };
    }
    dir = -dir;
  }
  return { pts, leak: null };
}

export default defineLab({
  id: 'fiber',
  exam: 'e7',
  title: 'Optical fiber',
  hint: 'Tilt the ray past the acceptance angle and it leaks out of the core',
  orbit: false,
  camera: { pos: new THREE.Vector3(-0.6, -0.2, 20), target: new THREE.Vector3(-0.6, -0.2, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, ...sc, anim: { playing: false, i: 0 } };
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
          ${slider('fb-core', 'Core index <i>n</i><sub>core</sub>', 1.4, 1.6, 0.005)}
          ${slider('fb-clad', 'Cladding index <i>n</i><sub>clad</sub>', 1.3, 1.6, 0.005)}
          ${slider('fb-th', 'Entry angle <i>θ</i> from the axis', 0, 60, 0.5)}
          <p class="tiny">The light enters from air. The core is drawn far wider than to scale: a telecom core is 9 μm across.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const on = (id, fn) =>
      $(id).addEventListener('input', (e) => {
        fn(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('fb-core', (s, v) => {
      s.nCore = v;
      if (s.nClad >= v) s.nClad = Number((v - 0.005).toFixed(3));
    });
    on('fb-clad', (s, v) => {
      s.nClad = Math.min(v, Number((s.nCore - 0.005).toFixed(3)));
    });
    on('fb-th', (s, v) => {
      s.theta = v;
    });
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('fb-core', state.nCore, state.nCore.toFixed(3));
    set('fb-clad', state.nClad, state.nClad.toFixed(3));
    set('fb-th', state.theta, `${state.theta.toFixed(1)}°`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const dots = points(N_PH, Q.E, 7);
    group.add(dots);
    group.visible = false;
    return { group, dots, phase: 0, scene: null, key: '', path: null, n: N_PH };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const f = opticalFiber({ nCore: state.nCore, nClad: state.nClad, thetaIn: state.theta / DEG, L: 1000 });
    computed.fb = { ...f, nCore: state.nCore, nClad: state.nClad };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.fb;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.nCore, state.nClad, state.theta]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // Cladding band and core edges.
    const clad = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 2 * RW), new THREE.MeshBasicMaterial({ color: 0x3a4152, transparent: true, opacity: 0.55, toneMapped: false }));
    clad.position.set((X0 + X1) / 2, 0, -0.03);
    g.add(clad);
    const core = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 2 * RC), new THREE.MeshBasicMaterial({ color: 0x1d2433, transparent: true, opacity: 0.9, toneMapped: false }));
    core.position.set((X0 + X1) / 2, 0, -0.02);
    g.add(core);
    for (const y of [RC, -RC]) g.add(fatLine([X0, y, 0, X1, y, 0], { color: M.white, width: 2 }));
    for (const y of [RW, -RW]) g.add(fatLine([X0, y, 0, X1, y, 0], { color: M.grey, width: 1.5 }));
    g.add(fatLine([X0, -RW, 0, X0, RW, 0], { color: M.grey, width: 2 }));
    g.add(label(`<span class="muted" style="white-space:nowrap">cladding ${c.nClad.toFixed(3)}</span>`, 1.7, RW + 0.35, 0));
    g.add(label(`<span style="white-space:nowrap">core ${c.nCore.toFixed(3)}</span>`, 2.1, -0.3, 0));
    // The acceptance cone, outside the entry face.
    const cone = 1.6;
    const tm = Math.min(c.thetaMax, (80 / DEG));
    for (const sgn of [1, -1]) g.add(fatLine([X0, 0, 0.01, X0 - cone * Math.cos(tm), sgn * cone * Math.sin(tm), 0.01], { color: M.grey, width: 1.5, dashed: true }));
    g.add(label(`<span class="muted" style="white-space:nowrap"><i>θ</i><sub>max</sub> = ${deg(c.thetaMax)}</span>`, X0 - 1.2, 1.5, 0));
    // The ray.
    const { pts, leak } = rayPath(c);
    const flat = [];
    for (const p of pts) flat.push(p.x, p.y, 0.02);
    g.add(fatLine(flat, { color: Q.E, width: 3 }));
    if (leak) {
      const lf = [];
      for (const p of leak) lf.push(p.x, p.y, 0.02);
      g.add(fatLine(lf, { color: Q.E, width: 2.5 }));
      g.add(label('<span style="color:var(--pink,#D147BD);white-space:nowrap">leaks out: below θc at the wall</span>', 0.2, -RW - 0.6, 0));
    } else {
      g.add(label(`<span style="color:var(--yellow,#F4D345);white-space:nowrap">guided: wall angle ${deg(c.wall)} &gt; θc = ${deg(c.thetaC)}</span>`, 0.2, -RW - 0.6, 0));
    }
    g.add(label(`<span style="white-space:nowrap"><i>θ</i> = ${state.theta.toFixed(1)}°</span>`, X0 - 1.1, -1.75, 0));
    // Dots run along the drawn path; unused ones are hidden with setDrawRange.
    const all = leak ? pts.concat(leak.slice(1)) : pts;
    const segs = [];
    let total = 0;
    for (let i = 1; i < all.length; i++) {
      const l = Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y);
      segs.push({ a: all[i - 1], b: all[i], l, s: total });
      total += l;
    }
    h.path = { segs, total };
    h.n = Math.max(6, Math.min(N_PH, Math.round(total / 1.1)));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !h.path || !h.path.total) return;
    h.phase = (h.phase + Math.min(dt, 0.05) * 0.12) % 1;
    const arr = h.dots.geometry.attributes.position.array;
    h.dots.geometry.setDrawRange(0, h.n);
    const { segs, total } = h.path;
    for (let i = 0; i < h.n; i++) {
      const d = ((i / h.n + h.phase) % 1) * total;
      const sg = segs.find((s) => d <= s.s + s.l) || segs[segs.length - 1];
      const u = sg.l ? (d - sg.s) / sg.l : 0;
      arr[i * 3] = sg.a.x + (sg.b.x - sg.a.x) * u;
      arr[i * 3 + 1] = sg.a.y + (sg.b.y - sg.a.y) * u;
      arr[i * 3 + 2] = 0.04;
    }
    h.dots.geometry.attributes.position.needsUpdate = true;
  },
  law() {
    return [String.raw`\sin\theta_c = \dfrac{n_{\text{clad}}}{n_{\text{core}}}`, String.raw`\text{NA} = \sin\theta_{\text{max}} = \sqrt{n_{\text{core}}^2 - n_{\text{clad}}^2}`];
  },
  liveRows(state, computed) {
    const c = computed.fb;
    if (!c) return '';
    return [
      kv(tex(String.raw`\theta_c`), qv('qT', deg(c.thetaC))),
      kv(tex(String.raw`\text{NA}`), c.NA.toFixed(3)),
      kv(tex(String.raw`\theta_{\text{max}}`), deg(c.thetaMax)),
      kv(tex(String.raw`\theta_r\ \text{(in the core)}`), deg(c.thetaR)),
      kv(tex(String.raw`v = c/n_{\text{core}}`), `${si(c.v, 'm')}/s`),
      kv(tex(String.raw`t\ \text{for 1 km}`), si(c.tAxis, 's')),
      kv(tex(String.raw`\text{modal spread, 1 km}`), si(c.modalSpread, 's')),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.fb;
    if (!c) return '';
    return cells([
      [String.raw`Critical angle $\theta_c$`, deg(c.thetaC), 'qT'],
      [String.raw`Numerical aperture`, c.NA.toFixed(3), ''],
      [String.raw`Accepts within $\theta_{\text{max}}$`, deg(c.thetaMax), ''],
      [String.raw`This ray`, c.guided ? 'guided' : 'leaks', ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.fb;
    if (!c) return { title: '', body: '' };
    return {
      title: 'An optical fiber traps light by total internal reflection',
      body: [
        'Light in the core meets the core-cladding wall at a grazing angle. Past the critical angle it cannot refract out, so it reflects totally and zigzags down the fiber:',
        eq(String.raw`\sin\theta_c = \frac{n_{\text{clad}}}{n_{\text{core}}} \Rightarrow \theta_c = \text{${deg(c.thetaC)}}`),
        'At the end face, the light refracts toward the axis. The steeper it enters, the shallower it meets the wall. The widest entry angle that still meets the wall at θc sets the acceptance cone:',
        eq(String.raw`\text{NA} = \sin\theta_{\text{max}} = \sqrt{n_{\text{core}}^2 - n_{\text{clad}}^2} = ${c.NA.toFixed(3)}, \qquad \theta_{\text{max}} = \text{${deg(c.thetaMax)}}`),
        `This ray enters at ${state.theta.toFixed(1)}° and ${c.guided ? 'is guided' : 'leaks into the cladding at its first bounce'}. A bigger index difference opens the cone. Rays at different angles travel different path lengths, so over 1 km the steepest guided ray arrives ${si(c.modalSpread, 's')} after the one on the axis.`,
        '<b>What the course model leaves out.</b> A telecom core is about 9 μm across, only six wavelengths of 1550 nm light. At that size rays are a poor picture: the fiber carries one wave pattern, a single mode, with no modal spread at all. Glass also absorbs a little, about 0.2 dB per km, so signals are amplified every 80 km or so. Different colors travel at different speeds too (Chapter 58), which spreads a pulse even in a single-mode fiber. A bend tighter than a few centimeters lets light escape.',
      ],
    };
  },
});
