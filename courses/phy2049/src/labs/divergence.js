import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree, Arrow } from '../scene/manim.js';
import { ballField, divergence, divergenceGap, wireField } from '@flux/subjects/em/divergence.js';
import { kv, cells, eq, tex } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';
import { label, si } from './device-kit.js';

/**
 * Maxwell's divergence equations (Ch 53, from Gauss's law in Ch 37). A small sphere sits inside, on
 * the edge of, or outside a ball of uniform charge density ρ. The flux of E out of it is found by
 * summing E·n̂ ΔA over its tiles, and checked against Q_in/ε₀ from the volume the two spheres
 * share. Divided by the small sphere's volume, the flux is ρ/ε₀ inside the ball and 0 outside,
 * though E is not 0 there: that ratio, as the sphere shrinks, is ∇·E. For B, a straight wire's
 * field gives as much flux in as out wherever the sphere sits: ∇·B = 0.
 *
 * A cross-section through both centres. Field arrows: E yellow, B teal. The small sphere's rim is
 * red where flux leaves and blue where it enters.
 */
const SCENARIOS = [
  { id: 'inside', name: 'A small sphere inside the ball', mode: 'ball', r: 0.3, d: 0.4 },
  { id: 'shrink', name: 'Shrink it onto a point: 2 cm', mode: 'ball', r: 0.02, d: 0.5 },
  { id: 'edge', name: 'Half in, half out', mode: 'ball', r: 0.4, d: 1.0 },
  { id: 'outside', name: 'Outside, where E is strong', mode: 'ball', r: 0.3, d: 1.6 },
  { id: 'wire', name: 'B around a wire', mode: 'wire', r: 0.4, d: 0.8 },
  { id: 'wire-through', name: 'B with the wire through the sphere', mode: 'wire', r: 0.5, d: 0.2 },
];

const S = 2.2; // scene units per metre
const R_BALL = 1; // m
const R_MIN_DRAWN = 0.14; // scene units: a 2 cm sphere is drawn this big, and labelled so

/** Three significant figures, plain between 0.01 and 10⁴, otherwise in powers of ten. */
const num = (x) => {
  const a = Math.abs(x);
  return a >= 0.01 && a < 1e4 ? String(Number(x.toPrecision(3))) : sciHTML(x);
};
/** A flux, rounded to 0 when it is below the tile sum's accuracy, 10⁻⁴ of what crosses the surface. */
const flux = (x, scale, mode) => {
  const v = Math.abs(x) < 1e-4 * scale ? 0 : x;
  return `${v === 0 ? '0' : num(v)} ${mode === 'wire' ? 'Wb' : 'N·m²/C'}`;
};
const perVol = (x, mode, zero = false) => `${zero || Math.abs(x) < 1e-9 ? '0' : num(x)} ${mode === 'wire' ? 'T/m' : 'N/(C·m)'}`;
const len = (m) => (m < 0.1 ? `${Number((m * 100).toPrecision(3))} cm` : `${Number(m.toPrecision(3))} m`);

export default defineLab({
  id: 'divergence',
  exam: 'e6',
  title: 'Divergence',
  hint: 'Move the small sphere in and out of the ball, then shrink it onto a point',
  orbit: false,
  camera: { pos: new THREE.Vector3(2.2, 0, 19), target: new THREE.Vector3(2.2, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, ...sc, R: R_BALL, rho: 1e-6, I: 10, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const { name, ...sc } = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, R: R_BALL, rho: 1e-6, I: 10 });
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
          <div class="seg" id="dv-mode">
            <button type="button" data-mode="ball">E of a charged ball</button>
            <button type="button" data-mode="wire">B of a wire</button>
          </div>
          ${slider('dv-r', 'Small sphere’s radius <i>r</i>', 0.01, 1, 0.01)}
          ${slider('dv-d', 'Its centre’s distance <i>d</i>', 0, 2, 0.01)}
          <div id="dv-rho-wrap">${slider('dv-rho', 'Charge density <i>ρ</i>', 0.2, 5, 0.1)}</div>
          <div id="dv-I-wrap">${slider('dv-I', 'Current <i>I</i>', 1, 100, 1)}</div>
          <p class="tiny">A slice through both centres. The ball has radius 1 m. The rim is red where flux leaves the small sphere and blue where it enters.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('dv-mode').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      api.slice().mode = b.dataset.mode;
      api.bump();
    });
    const on = (id, f) =>
      $(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('dv-r', (s, v) => (s.r = v));
    on('dv-d', (s, v) => (s.d = v));
    on('dv-rho', (s, v) => (s.rho = v * 1e-6));
    on('dv-I', (s, v) => (s.I = v));
  },
  syncControls(state) {
    document.querySelectorAll('#dv-mode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('dv-r', state.r, len(state.r));
    set('dv-d', state.d, len(state.d));
    set('dv-rho', state.rho * 1e6, `${Number((state.rho * 1e6).toPrecision(3))} μC/m³`);
    set('dv-I', state.I, `${Math.round(state.I)} A`);
    const rho = document.getElementById('dv-rho-wrap');
    if (rho) rho.hidden = state.mode === 'wire';
    const I = document.getElementById('dv-I-wrap');
    if (I) I.hidden = state.mode !== 'wire';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    group.visible = false;
    return { group, scene: null, key: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const dv = divergence(state);
    dv.gap = divergenceGap(dv);
    computed.dv = dv;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.dv;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.mode, state.r, state.d, state.rho, state.I]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    const wire = state.mode === 'wire';
    const field = wire ? (p) => wireField(p, state.I) : (p) => ballField(p, R_BALL, state.rho);
    const RB = R_BALL * S;
    if (wire) {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ color: Q.I, toneMapped: false }));
      dot.position.set(0, 0, 0.03);
      g.add(dot);
      const ring = [];
      for (let k = 0; k <= 48; k++) ring.push(0.26 * Math.cos((2 * Math.PI * k) / 48), 0.26 * Math.sin((2 * Math.PI * k) / 48), 0.03);
      g.add(fatLine(ring, { color: Q.I, width: 2 }));
    } else {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(RB, 96), new THREE.MeshBasicMaterial({ color: M.red, transparent: true, opacity: 0.16, depthWrite: false }));
      disc.position.set(0, 0, -0.03);
      g.add(disc);
      const rim = [];
      for (let k = 0; k <= 128; k++) rim.push(RB * Math.cos((2 * Math.PI * k) / 128), RB * Math.sin((2 * Math.PI * k) / 128), -0.02);
      g.add(fatLine(rim, { color: M.red, width: 2, opacity: 0.6 }));
    }
    // Field arrows on a grid, length growing as the square root of the magnitude.
    const pts = [];
    for (let x = -2.2; x <= 6.61; x += 0.8) for (let y = -2.4; y <= 2.41; y += 0.8) pts.push([x, y]);
    const mags = pts.map(([x, y]) => {
      const F = field({ x: x / S, y: y / S, z: 0 });
      return Math.hypot(F.x, F.y);
    });
    const ref = wire ? (2e-7 * state.I) / 0.5 : (state.rho * R_BALL) / (3 * 8.85e-12);
    pts.forEach(([x, y], i) => {
      if (wire && Math.hypot(x, y) < 0.45) return;
      const F = field({ x: x / S, y: y / S, z: 0 });
      const L = 0.62 * Math.min(1, Math.sqrt(mags[i] / ref));
      if (L < 0.08) return;
      const dir = new THREE.Vector3(F.x, F.y, 0).normalize();
      const o = new THREE.Vector3(x, y, 0.01).addScaledVector(dir, -L / 2);
      g.add(new Arrow(dir, o, L, wire ? Q.B : Q.E, 0.18, 0.14, 0.022));
    });
    // The small sphere's rim, coloured by the field's normal component.
    const cx = state.d * S;
    const rD = Math.max(state.r * S, R_MIN_DRAWN);
    const N = 160;
    const fn = [];
    for (let k = 0; k <= N; k++) {
      const t = (2 * Math.PI * k) / N;
      const nx = Math.cos(t);
      const ny = Math.sin(t);
      const F = field({ x: state.d + state.r * nx, y: state.r * ny, z: 0 });
      fn.push(F.x * nx + F.y * ny);
    }
    const big = Math.max(...fn.map(Math.abs), 1e-30);
    const pos = [];
    const col = [];
    const out = new THREE.Color(M.red);
    const inn = new THREE.Color(M.blue);
    const grey = new THREE.Color(M.grey);
    fn.forEach((f, k) => {
      const t = (2 * Math.PI * k) / N;
      pos.push(cx + rD * Math.cos(t), rD * Math.sin(t), 0.05);
      const cc = grey.clone().lerp(f >= 0 ? out : inn, Math.min(1, Math.abs(f) / big + 0.25));
      col.push(cc.r, cc.g, cc.b);
    });
    g.add(fatLine(pos, { colors: col, width: 5 }));
    const centre = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: M.white }));
    centre.position.set(cx, 0, 0.06);
    g.add(centre);
    const drawnBigger = state.r * S < R_MIN_DRAWN;
    const what = wire ? `wire, <i>I</i> = ${Math.round(state.I)} A out of the page` : `ball, <i>R</i> = 1 m, <i>ρ</i> = ${Number((state.rho * 1e6).toPrecision(3))} μC/m³`;
    g.add(label(`<span class="muted">${what} · sphere <i>r</i> = ${len(state.r)}${drawnBigger ? ' (drawn larger)' : ''}, <i>d</i> = ${len(state.d)}</span>`, 2.2, -3.05, 0));
  },
  law(state) {
    return state.mode === 'wire'
      ? [String.raw`\oint \vec B\cdot d\vec A = 0`, String.raw`\nabla\cdot\vec B = \lim_{V\to 0}\dfrac{1}{V}\oint \vec B\cdot d\vec A = 0`]
      : [String.raw`\oint \vec E\cdot d\vec A = \dfrac{Q_{\text{in}}}{\varepsilon_0} = \dfrac{\rho\,V_{\text{in}}}{\varepsilon_0}`, String.raw`\nabla\cdot\vec E = \lim_{V\to 0}\dfrac{1}{V}\oint \vec E\cdot d\vec A = \dfrac{\rho}{\varepsilon_0}`];
  },
  liveRows(state, computed) {
    const c = computed.dv;
    if (!c) return '';
    const scale = Math.max(c.numeric.out, c.numeric.in);
    if (c.mode === 'wire') {
      return [
        kv(tex(String.raw`\text{Flux out}`), flux(c.numeric.out, scale, 'wire')),
        kv(tex(String.raw`\text{Flux in}`), flux(c.numeric.in, scale, 'wire')),
        kv(tex(String.raw`\textstyle\sum \vec B\cdot\hat n\,\Delta A`), flux(c.numeric.net, scale, 'wire')),
        kv(tex(String.raw`|\vec B| \text{ at the centre}`), si(c.fieldAtCentre, 'T')),
        kv('The wire', c.through ? 'passes through the sphere' : 'is outside the sphere'),
      ].join('');
    }
    return [
      kv(tex(String.raw`\textstyle\sum \vec E\cdot\hat n\,\Delta A`), flux(c.numeric.net, scale, 'ball')),
      kv(tex(String.raw`Q_{\text{in}}/\varepsilon_0`), flux(c.closed, scale, 'ball')),
      kv('Tile sum against Gauss', c.gap < 1e-9 ? 'agree' : `agree to ${sciHTML(c.gap)} of the flux`),
      kv(tex(String.raw`Q_{\text{in}} = \rho V_{\text{in}}`), `${si(c.Qin, 'C')} (${Math.round(c.share * 100)}% of the sphere is inside)`),
      kv(tex(String.raw`\text{Flux out} / \text{in}`), `${flux(c.numeric.out, scale, 'ball')} / ${flux(c.numeric.in, scale, 'ball')}`),
      kv(tex(String.raw`\Phi/V`), perVol(c.perVolume, 'ball', Math.abs(c.numeric.net) < 1e-4 * scale)),
      kv(tex(String.raw`\rho/\varepsilon_0 \text{ at the centre}`), perVol(c.pointLaw, 'ball')),
      kv(tex(String.raw`|\vec E| \text{ at the centre}`), si(c.fieldAtCentre, 'N/C')),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.dv;
    if (!c) return '';
    const scale = Math.max(c.numeric.out, c.numeric.in);
    if (c.mode === 'wire') {
      return cells([
        ['Flux out', flux(c.numeric.out, scale, 'wire'), ''],
        ['Flux in', flux(c.numeric.in, scale, 'wire'), ''],
        [String.raw`Net $\Phi_B$`, flux(c.numeric.net, scale, 'wire'), ''],
        [String.raw`$\Phi_B/V$`, perVol(c.perVolume, 'wire', Math.abs(c.numeric.net) < 1e-4 * scale), ''],
      ]);
    }
    return cells([
      [String.raw`$\Phi_E$ from tiles`, flux(c.numeric.net, scale, 'ball'), ''],
      [String.raw`$Q_{\text{in}}/\varepsilon_0$`, flux(c.closed, scale, 'ball'), ''],
      [String.raw`$\Phi_E/V$`, perVol(c.perVolume, 'ball', Math.abs(c.numeric.net) < 1e-4 * scale), ''],
      [String.raw`$\rho/\varepsilon_0$ here`, perVol(c.pointLaw, 'ball'), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.dv;
    if (!c) return { title: '', body: '' };
    const leavesOut =
      '<b>What the course model leaves out.</b> Real charge is not smooth: it sits on atoms, and ρ is an average over a volume large enough to hold many of them. The limit V → 0 means "small next to the scale the charge varies on", not smaller than an atom. And no one has found a magnetic monopole, but ∇·B = 0 is a law found by experiment, not proved.';
    if (c.mode === 'wire') {
      return {
        title: c.through ? 'Even with the wire inside, as much B flux goes in as comes out' : 'B flux in equals B flux out',
        body: [
          `The field circles the wire. On one side of the sphere it enters, on the other it leaves, and the two match: ${flux(c.numeric.out, c.numeric.out, 'wire')} out, the same in. There is no magnetic charge for a line to start or end on.`,
          eq(String.raw`\oint \vec B\cdot d\vec A = 0 \quad\Longrightarrow\quad \nabla\cdot\vec B = 0`),
          c.through
            ? 'A current inside the sphere does not change that. Current makes B circle around it, not spread out from it.'
            : 'Move the sphere so the wire passes through it. The net flux stays 0.',
          leavesOut,
        ],
      };
    }
    if (c.share >= 1 - 1e-12) {
      return {
        title: 'Inside the ball, the flux per volume is ρ/ε₀',
        body: [
          `All of the small sphere is in the ball, so it holds charge $\\rho V$ and Gauss's law gives $\\Phi = \\rho V/\\varepsilon_0$. Divide by $V$ and the size drops out:`,
          eq(String.raw`\frac{\Phi}{V} = \frac{\rho}{\varepsilon_0} \quad\text{for any } r`),
          'Shrink the sphere onto its centre and this ratio becomes the divergence of E at that point. That is Gauss’s law at a point: field lines spread out wherever there is charge, in proportion to how much.',
          leavesOut,
        ],
      };
    }
    if (c.share <= 1e-12) {
      return {
        title: 'Outside the ball, E is strong but its divergence is 0',
        body: [
          `The field here is ${si(c.fieldAtCentre, 'N/C')}, yet the net flux out of the small sphere is 0. As much field enters on the side facing the ball as leaves on the far side. No charge inside means no net flux.`,
          eq(String.raw`\nabla\cdot\vec E = 0 \quad\text{where } \rho = 0`),
          'Divergence measures field lines starting or ending, not how strong the field is.',
          leavesOut,
        ],
      };
    }
    return {
      title: 'Half in, half out: the flux counts only the charge inside',
      body: [
        `${Math.round(c.share * 100)}% of the small sphere is in the ball, so the flux per volume is ${Math.round(c.share * 100)}% of ρ/ε₀. The tile sum and Gauss's law agree, though nothing here is symmetric enough to find E from Gauss's law.`,
        'Shrink the sphere onto a point inside the ball and Φ/V goes to ρ/ε₀. Shrink it onto a point outside and it goes to 0. At a point on the edge, the divergence jumps.',
        leavesOut,
      ],
    };
  },
});
