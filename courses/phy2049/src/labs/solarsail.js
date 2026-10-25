import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree, Arrow } from '../scene/manim.js';
import { solarSail, SOLAR_CONSTANT } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: the solar sail (Ch 53 momentum of light, Ch 55 intensity). Sunlight of intensity
 * I = 1367 W/m² / r² (r in AU) falls head-on on a mirror of area A. Each photon bounces back, so the
 * light's momentum reverses and the sail feels p = 2I/c: F = 2IA/c on a craft of mass m, a = F/m.
 *
 * A flat side view: the Sun on the left, light (yellow dots) streaming right, the sail (white, edge
 * on) and the craft behind it, and the force (pink) pushing away from the Sun. The number of
 * photons drawn grows with I, and the force arrow's length with log F. Distances are not to scale.
 */
const SCENARIOS = [
  { id: 'notes', name: 'Notes example: 14 m square sail, 300 kg craft, at Earth', A: 196, m: 300, r: 1 },
  { id: 'cubesat', name: 'CubeSat sail: 32 m², 5 kg, at Earth (like LightSail 2)', A: 32, m: 5, r: 1 },
  { id: 'mars', name: 'The notes sail out at Mars, 1.52 AU', A: 196, m: 300, r: 1.52 },
];

const XS = -4.2; // the Sun's center
const RS = 0.9;
const XSAIL = 1.6;
const H = 1.6; // half height of the sail
const N_PH = 60;

const fmtA = (A) => `${Number(A.toPrecision(3))} m²`;
const fmtM = (m) => `${Number(m.toPrecision(3))} kg`;

export default defineLab({
  id: 'solarsail',
  exam: 'e6',
  title: 'Solar sail',
  hint: 'Reflected light pushes twice as hard as absorbed light: F = 2IA/c',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 20), target: new THREE.Vector3(0, 0, 0) },
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
          ${slider('ss-A', 'Sail area <i>A</i> (log)', 0, 4, 0.01)}
          ${slider('ss-m', 'Craft mass <i>m</i> (log)', 0, 3, 0.01)}
          ${slider('ss-r', 'Distance from the Sun <i>r</i> (AU)', 0.3, 5, 0.01)}
          <p class="tiny">1 AU is Earth's distance from the Sun, 1.5 × 10¹¹ m. Nothing is drawn to scale.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const log = (id, key) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number((10 ** Number(e.target.value)).toPrecision(3));
        api.bump();
      });
    log('ss-A', 'A');
    log('ss-m', 'm');
    $('ss-r').addEventListener('input', (e) => {
      api.slice().r = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('ss-A', Math.log10(state.A), fmtA(state.A));
    set('ss-m', Math.log10(state.m), fmtM(state.m));
    set('ss-r', state.r, `${Number(state.r.toPrecision(3))} AU`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const inc = points(N_PH, Q.E, 6);
    const back = points(N_PH, Q.E, 5);
    back.material.opacity = 0.45;
    group.add(inc, back);
    const seed = (i, k) => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const ph = [];
    for (let i = 0; i < N_PH; i++) ph.push({ y: -H + 0.15 + seed(i, 1) * (2 * H - 0.3), f: seed(i, 2) });
    group.visible = false;
    return { group, inc, back, ph, phase: 0, scene: null, key: '', n: N_PH };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.ss = solarSail(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.ss;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.A, state.m, state.r]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The Sun: a filled disc with a ring.
    const sun = new THREE.Mesh(new THREE.CircleGeometry(RS, 48), new THREE.MeshBasicMaterial({ color: 0xf4b63f, toneMapped: false }));
    sun.position.set(XS, 0, -0.02);
    g.add(sun);
    g.add(label('<b>Sun</b>', XS, -RS - 0.45, 0));
    // The sail, edge on, and the craft behind it on a short boom.
    g.add(fatLine([XSAIL, -H, 0.02, XSAIL, H, 0.02], { color: M.white, width: 6 }));
    g.add(fatLine([XSAIL, 0, 0.02, XSAIL + 0.6, 0, 0.02], { color: M.grey, width: 2 }));
    g.add(fatLine([XSAIL + 0.6, -0.25, 0.02, XSAIL + 1.1, -0.25, 0.02, XSAIL + 1.1, 0.25, 0.02, XSAIL + 0.6, 0.25, 0.02, XSAIL + 0.6, -0.25, 0.02], { color: M.grey, width: 2.5 }));
    g.add(label(`<span style="white-space:nowrap">sail ${fmtA(state.A)} (${si(c.side, 'm')} square)</span>`, XSAIL, H + 0.45, 0));
    g.add(label(`<span class="muted" style="white-space:nowrap">craft ${fmtM(state.m)}</span>`, XSAIL + 1.35, -0.7, 0));
    // The push, away from the Sun: length grows with log F, from 1 μN to 1 N.
    const len = 0.5 + 0.3 * Math.max(0, Math.min(6, Math.log10(c.F) + 6));
    g.add(new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(XSAIL + 1.15, 0, 0.03), len, Q.F, 0.3, 0.22, 0.04));
    g.add(label(qv('qF', `<span style="color:var(--pink,#D147BD);white-space:nowrap"><i>F</i> = ${si(c.F, 'N')}</span>`), XSAIL + 1.15 + len / 2, 0.45, 0));
    g.add(label(`<span style="color:var(--yellow,#F4D345);white-space:nowrap"><i>I</i> = ${Number(c.I.toPrecision(3))} W/m² at ${Number(state.r.toPrecision(3))} AU</span>`, -1.3, -H - 0.45, 0));
    // More light drawn where the light is stronger.
    h.n = Math.max(8, Math.min(N_PH, Math.round(N_PH * Math.sqrt(c.I / (4 * SOLAR_CONSTANT)))));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !computed.ss) return;
    h.phase = (h.phase + Math.min(dt, 0.05) * 0.35) % 1;
    const x0 = XS + RS + 0.1;
    const span = XSAIL - 0.08 - x0;
    const ia = h.inc.geometry.attributes.position.array;
    const ba = h.back.geometry.attributes.position.array;
    h.inc.geometry.setDrawRange(0, h.n);
    h.back.geometry.setDrawRange(0, h.n);
    for (let i = 0; i < h.n; i++) {
      const p = h.ph[i];
      const t = (p.f + h.phase) % 1;
      ia[i * 3] = x0 + t * span;
      ia[i * 3 + 1] = p.y * (0.35 + 0.65 * t);
      ia[i * 3 + 2] = 0.04;
      // The reflected light heads back toward the Sun.
      const u = (p.f + 0.5 + h.phase) % 1;
      ba[i * 3] = XSAIL - 0.08 - u * span * 0.6;
      ba[i * 3 + 1] = p.y * (1 + 0.2 * u);
      ba[i * 3 + 2] = 0.03;
    }
    h.inc.geometry.attributes.position.needsUpdate = true;
    h.back.geometry.attributes.position.needsUpdate = true;
  },
  law() {
    return [String.raw`I = \dfrac{1367\ \text{W/m}^2}{r^2}\ (r\text{ in AU}),\quad p = \dfrac{2I}{c}`, String.raw`F = \dfrac{2IA}{c},\quad a = \dfrac{F}{m}`];
  },
  liveRows(state, computed) {
    const c = computed.ss;
    if (!c) return '';
    return [
      kv(tex(String.raw`I = I_1/r^2`), `${Number(c.I.toPrecision(3))} W/m²`),
      kv(tex(String.raw`p = 2I/c`), si(c.p, 'Pa')),
      kv(tex(String.raw`F = 2IA/c`), qv('qF', si(c.F, 'N'))),
      kv(tex(String.raw`a = F/m`), `${si(c.a, 'm')}/s²`),
      kv(tex(String.raw`\Delta v\text{ in a year}`), `${si(c.dvYear, 'm')}/s`),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.ss;
    if (!c) return '';
    return cells([
      [String.raw`Force $F$`, si(c.F, 'N'), 'qF'],
      [String.raw`Acceleration $a$`, `${si(c.a, 'm')}/s²`, ''],
      [String.raw`$\Delta v$ in a year`, `${si(c.dvYear, 'm')}/s`, ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.ss;
    if (!c) return { title: '', body: '' };
    return {
      title: 'A solar sail rides on the momentum of light',
      body: [
        'Light carries momentum $p = E/c$. A beam of intensity $I$ delivers momentum $I/c$ per second per square meter. A mirror sends the light straight back, so the momentum reverses and the push doubles:',
        eq(String.raw`F = \frac{2IA}{c} = \text{${si(c.F, 'N')}}, \qquad a = \frac{F}{m} = \text{${si(c.a, 'm')}/s}^2`),
        `The push is tiny, but it never stops and needs no fuel: held for a year it adds ${si(c.dvYear, 'm')}/s. Double the area and the force doubles. Light falls off as $1/r^2$, so twice as far from the Sun the push is a quarter. A light craft with a big sail wins: what counts is the area per kilogram.`,
        '<b>What the course model leaves out.</b> A real sail reflects about 90% of the light and absorbs the rest, so the push is a little under $2IA/c$. Facing the Sun head-on only pushes outward; to steer, a sail tilts, which trades some push for a sideways component. The Sun’s gravity pulls the other way, and for most sails it is stronger than the light. In orbit around Earth, air drag and Earth’s shadow matter too.',
      ],
    };
  },
});
