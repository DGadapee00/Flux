import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree } from '../scene/manim.js';
import { transformer } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: the transformer (Ch 49–50, and impedance matching in Ch 52). Two coils share one iron
 * core, so each turn of either coil links the same changing flux and has the same emf. The voltages
 * go as the turns, V_s/V_p = N_s/N_p; an ideal transformer loses nothing, so the currents go the
 * other way, I_p/I_s = N_s/N_p. The load on the secondary looks R(N_p/N_s)² from the primary.
 *
 * A flat schematic, front on. The core is grey and its flux is teal: the dots surge one way round the
 * core and back, as the AC flux does. Current is gold, its dots sloshing back and forth in each
 * circuit, more of them where more current flows. Each coil is drawn with turns in proportion to its
 * real count, scaled so the bigger coil gets 18.
 */
const SCENARIOS = [
  { id: 'notes', name: 'Notes example: 120 V, 200 → 10 turns, 12 Ω load', Vp: 120, Np: 200, Ns: 10, R: 12 },
  { id: 'pole', name: 'Pole transformer: 7,200 V → 240 V, houses drawing 24 kW', Vp: 7200, Np: 3000, Ns: 100, R: 2.4 },
  { id: 'audio', name: 'Matching an 8 Ω speaker to an 8 kΩ amplifier, 31.6:1', Vp: 100, Np: 316, Ns: 10, R: 8 },
];

const CORE = 2.1; // half the core's outer side
const LEG = 0.55; // core thickness
const XP = -CORE + LEG / 2; // primary leg's centre
const XS = CORE - LEG / 2; // secondary leg's centre
const XSRC = -4.6;
const XLOAD = 4.6;
const YW = 1.45; // wires' height
const N_FLUX = 28;
const N_DOTS = 60;
const MAX_TURNS = 18;
const OMEGA = 2.2; // display rad/s of the AC

/** How many current dots a circuit gets: more current, more dots, on a log scale. */
const dotsFor = (I) => Math.max(3, Math.min(N_DOTS / 2, Math.round(6 + 5 * Math.log10(1 + I / 0.01))));

/** A closed rectangle path (source or load side) as [x, y] corners, walked once round. */
function loopPath(xOuter, xCoil) {
  return [
    [xOuter, -YW],
    [xOuter, YW],
    [xCoil, YW],
    [xCoil, -YW],
    [xOuter, -YW],
  ];
}

/** The point a fraction f (0–1) of the way round a closed polyline. */
function along(path, f) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let s = (((f % 1) + 1) % 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i]) {
      const k = s / seg[i];
      return [path[i][0] + k * (path[i + 1][0] - path[i][0]), path[i][1] + k * (path[i + 1][1] - path[i][1])];
    }
    s -= seg[i];
  }
  return path[0];
}

const CORE_PATH = [
  [XP, -CORE + LEG / 2],
  [XP, CORE - LEG / 2],
  [XS, CORE - LEG / 2],
  [XS, -CORE + LEG / 2],
  [XP, -CORE + LEG / 2],
];

const ratioText = (c) => {
  const r = c.ratio >= 1 ? c.ratio : 1 / c.ratio;
  const s = Number(r.toPrecision(3));
  return c.step === 'none' ? '1:1, no change' : c.step === 'up' ? `step-up, 1:${s}` : `step-down, ${s}:1`;
};

export default defineLab({
  id: 'transformer',
  exam: 'e5',
  title: 'Transformer',
  hint: 'Voltage goes as the turns, current the other way: the power through stays the same',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, -0.2, 22), target: new THREE.Vector3(0, -0.2, 0) },
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
          ${slider('tf-Vp', 'Primary voltage <i>V<sub>p</sub></i> (log, rms)', 0, 4.3, 0.01)}
          ${slider('tf-Np', 'Primary turns <i>N<sub>p</sub></i> (log)', 0, 4.2, 0.01)}
          ${slider('tf-Ns', 'Secondary turns <i>N<sub>s</sub></i> (log)', 0, 4.2, 0.01)}
          ${slider('tf-R', 'Load <i>R</i> (log)', -0.5, 4, 0.01)}
          <p class="tiny">An ideal transformer on AC. On DC the flux would not change and the secondary would give nothing.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, f) =>
      document.getElementById(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('tf-Vp', (s, v) => (s.Vp = Number((10 ** v).toPrecision(3))));
    on('tf-Np', (s, v) => (s.Np = Math.max(1, Math.round(10 ** v))));
    on('tf-Ns', (s, v) => (s.Ns = Math.max(1, Math.round(10 ** v))));
    on('tf-R', (s, v) => (s.R = Number((10 ** v).toPrecision(3))));
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('tf-Vp', Math.log10(state.Vp), si(state.Vp, 'V'));
    set('tf-Np', Math.log10(state.Np), `${state.Np}`);
    set('tf-Ns', Math.log10(state.Ns), `${state.Ns}`);
    set('tf-R', Math.log10(state.R), si(state.R, 'Ω'));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const flux = points(N_FLUX, Q.B, 7);
    const dotsP = points(N_DOTS / 2, Q.I, 6);
    const dotsS = points(N_DOTS / 2, Q.I, 6);
    group.add(flux, dotsP, dotsS);
    group.visible = false;
    return { group, flux, dotsP, dotsS, time: 0, scene: null, key: '', nP: 3, nS: 3 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.tf = transformer(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.tf;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.Vp, state.Np, state.Ns, state.R]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The iron core: a square frame.
    const iron = new THREE.MeshBasicMaterial({ color: 0x4a4f5a });
    for (const [x, y, w, hgt] of [
      [0, CORE - LEG / 2, 2 * CORE, LEG],
      [0, -CORE + LEG / 2, 2 * CORE, LEG],
      [XP, 0, LEG, 2 * CORE - 2 * LEG],
      [XS, 0, LEG, 2 * CORE - 2 * LEG],
    ]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), iron);
      m.position.set(x, y, -0.05);
      g.add(m);
    }
    // Coils: turns in proportion to N, the larger coil drawn with MAX_TURNS.
    const big = Math.max(state.Np, state.Ns);
    const drawn = (n) => Math.max(1, Math.round((MAX_TURNS * n) / big));
    const coil = (xc, n) => {
      const k = drawn(n);
      const span = 2 * CORE - 2 * LEG - 0.5;
      for (let i = 0; i < k; i++) {
        const y = k === 1 ? 0 : -span / 2 + (i * span) / (k - 1);
        g.add(fatLine([xc - LEG / 2 - 0.12, y - 0.05, 0.02, xc + LEG / 2 + 0.12, y + 0.05, 0.02], { color: Q.I, width: 3 }));
      }
    };
    coil(XP, state.Np);
    coil(XS, state.Ns);
    // Wires: source to primary, secondary to load.
    const xpw = XP - LEG / 2 - 0.12;
    const xsw = XS + LEG / 2 + 0.12;
    for (const path of [loopPath(XSRC, xpw), loopPath(XLOAD, xsw)]) {
      g.add(fatLine(path.flatMap(([x, y]) => [x, y, 0]), { color: Q.I, width: 2, opacity: 0.55 }));
    }
    // The AC source: a ring with a sine inside.
    const ring = [];
    for (let i = 0; i <= 40; i++) ring.push(XSRC + 0.5 * Math.cos((i / 40) * 2 * Math.PI), 0.5 * Math.sin((i / 40) * 2 * Math.PI), 0.03);
    g.add(fatLine(ring, { color: M.white, width: 2.5 }));
    const sine = [];
    for (let i = 0; i <= 24; i++) sine.push(XSRC - 0.3 + (0.6 * i) / 24, 0.18 * Math.sin((i / 24) * 2 * Math.PI), 0.04);
    g.add(fatLine(sine, { color: M.white, width: 2 }));
    const bg = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), new THREE.MeshBasicMaterial({ color: M.bg }));
    bg.position.set(XSRC, 0, 0.01);
    g.add(bg);
    // The load: a zigzag resistor.
    const zig = [XLOAD, 0.75, 0.03];
    for (let i = 1; i <= 8; i++) zig.push(XLOAD + (i % 2 ? 0.22 : -0.22), 0.75 - (1.5 * i) / 9, 0.03);
    zig.push(XLOAD, -0.75, 0.03);
    const bgL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.6), new THREE.MeshBasicMaterial({ color: M.bg }));
    bgL.position.set(XLOAD, 0, 0.01);
    g.add(bgL, fatLine(zig, { color: M.white, width: 2.5 }));
    // Labels.
    g.add(label(`<span class="muted">source</span><br><span style="white-space:nowrap">${qv('qV', si(state.Vp, 'V'))} · ${qv('qI', si(c.Ip, 'A'))}</span>`, (XSRC + XP) / 2 - 0.3, -CORE - 0.75, 0));
    g.add(label(`<span class="muted">load ${si(state.R, 'Ω')}</span><br><span style="white-space:nowrap">${qv('qV', si(c.Vs, 'V'))} · ${qv('qI', si(c.Is, 'A'))}</span>`, (XLOAD + XS) / 2 + 0.3, -CORE - 0.75, 0));
    g.add(label(`<i>N<sub>p</sub></i> = ${state.Np}`, XP, CORE + 0.4, 0));
    g.add(label(`<i>N<sub>s</sub></i> = ${state.Ns}`, XS, CORE + 0.4, 0));
    g.add(label(`<span class="qB">Φ in the iron</span>`, 0, 0, 0));
    g.add(label(`<span style="white-space:nowrap">${ratioText(c)} · ${qv('qP', si(c.P, 'W'))} through</span>`, 0, CORE + 1.15, 0));
    h.nP = dotsFor(c.Ip);
    h.nS = dotsFor(c.Is);
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !computed.tf) return;
    h.time += Math.min(dt, 0.05);
    const wt = OMEGA * h.time;
    // Flux dots: spread round the core, swinging a quarter of the way round and back.
    const fp = h.flux.geometry.attributes.position.array;
    const swing = 0.12 * Math.sin(wt);
    for (let i = 0; i < N_FLUX; i++) {
      const [x, y] = along(CORE_PATH, i / N_FLUX + swing);
      fp[i * 3] = x;
      fp[i * 3 + 1] = y;
      fp[i * 3 + 2] = 0.06;
    }
    h.flux.geometry.attributes.position.needsUpdate = true;
    // Current dots: slosh back and forth round each circuit. The secondary's current runs opposite
    // to the primary's (Lenz), so its swing has the opposite sign.
    const xpw = XP - LEG / 2 - 0.12;
    const xsw = XS + LEG / 2 + 0.12;
    const slosh = (pts, n, path, sign) => {
      const a = pts.geometry.attributes.position.array;
      pts.geometry.setDrawRange(0, n);
      for (let i = 0; i < n; i++) {
        const [x, y] = along(path, i / n + sign * 0.06 * Math.cos(wt));
        a[i * 3] = x;
        a[i * 3 + 1] = y;
        a[i * 3 + 2] = 0.07;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    };
    slosh(h.dotsP, h.nP, loopPath(XSRC, xpw), 1);
    slosh(h.dotsS, h.nS, loopPath(XLOAD, xsw), -1);
  },
  law() {
    return [String.raw`\dfrac{\qV_s}{\qV_p} = \dfrac{N_s}{N_p} = \dfrac{\qI_p}{\qI_s} \qquad \qI_p\qV_p = \qI_s\qV_s`, String.raw`\qR_{\text{seen}} = \qR\left(\dfrac{N_p}{N_s}\right)^2`];
  },
  liveRows(state, computed) {
    const c = computed.tf;
    if (!c) return '';
    return [
      kv(tex(String.raw`\qV_s = \qV_p N_s/N_p`), qv('qV', si(c.Vs, 'V'))),
      kv(tex(String.raw`\qI_s = \qV_s/\qR`), qv('qI', si(c.Is, 'A'))),
      kv(tex(String.raw`\qI_p = \qI_s N_s/N_p`), qv('qI', si(c.Ip, 'A'))),
      kv(tex(String.raw`\qP = \qI_s\qV_s = \qI_p\qV_p`), qv('qP', si(c.P, 'W'))),
      kv(tex(String.raw`\text{Seen from the primary } \qV_p/\qI_p`), si(c.Zin, 'Ω')),
      kv('Turns ratio', ratioText(c)),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.tf;
    if (!c) return '';
    return cells([
      [String.raw`Secondary $V_s$`, si(c.Vs, 'V'), 'qV'],
      [String.raw`Secondary $I_s$`, si(c.Is, 'A'), 'qI'],
      [String.raw`Primary $I_p$`, si(c.Ip, 'A'), 'qI'],
      [String.raw`Power`, si(c.P, 'W'), 'qP'],
    ]);
  },
  coach(state, computed) {
    const c = computed.tf;
    if (!c) return { title: '', body: '' };
    const r = Number((state.Np / state.Ns).toPrecision(3));
    return {
      title: 'A transformer trades voltage for current: the power through stays the same',
      body: [
        'Both coils wind the same iron core, so every turn links the same changing flux and has the same emf $d\\Phi/dt$. The coil with more turns has the bigger voltage:',
        eq(String.raw`\frac{V_s}{V_p} = \frac{N_s}{N_p} \quad\Rightarrow\quad V_s = \text{${si(state.Vp, 'V')}}\times\frac{${state.Ns}}{${state.Np}} = \text{${si(c.Vs, 'V')}}`),
        `The load draws $I_s = V_s/R$ = ${si(c.Is, 'A')}. An ideal transformer wastes nothing, so $I_pV_p = I_sV_s$ = ${si(c.P, 'W')}, and the primary draws only ${si(c.Ip, 'A')}. A step-down transformer steps the current up, and a step-up one steps it down.`,
        `From the source, the ${si(state.R, 'Ω')} load looks like $R(N_p/N_s)^2$ = ${si(c.Zin, 'Ω')}: the turns ratio, ${r}, squared. That is how a transformer matches a speaker to an amplifier, and why a pole transformer lets the street's line carry a thirtieth of the houses' current.`,
        '<b>What the course model leaves out.</b> A real transformer loses 1–2% of the power, more in small ones: $I^2R$ in its copper windings, and eddy currents and magnetic hysteresis in its iron core, which is built of thin insulated sheets to cut the eddy currents. Some flux leaks out of the core and misses the secondary. And the primary draws a small magnetizing current even with no load, to keep the core’s flux swinging.',
      ],
    };
  },
});
