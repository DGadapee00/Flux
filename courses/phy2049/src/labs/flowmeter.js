import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree, Arrow } from '../scene/manim.js';
import { flowMeter } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { sciText } from '../ui/format.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: the electromagnetic flow meter (Ch 48 motional emf, Ch 51 applications). A conducting
 * fluid flows along a pipe of diameter d at speed v, across a field B out of the page. Its ions feel
 * qv×B: positive ones toward the bottom wall, negative ones toward the top. They part until the
 * electric field they build cancels the push, qE = qvB, so the electrodes read V = Ed = Bdv. The flow
 * is Q = v·πd²/4.
 *
 * A flat side view of the pipe, drawn the same size whatever d is. B is teal (⊙, out of the page),
 * E yellow, the flow's ions red (+) and blue (−), drifting right at a speed that grows with v. The
 * charge piled on each wall grows with the voltage, on a log scale.
 */
const SCENARIOS = [
  { id: 'main', name: 'Notes example: a 10 cm water main, 10 mT, 2 m/s', B: 0.01, d: 0.1, v: 2 },
  { id: 'artery', name: 'Blood flow: a 6 mm carotid artery, 20 mT, 0.3 m/s', B: 0.02, d: 0.006, v: 0.3 },
  { id: 'plant', name: 'Treatment plant: a 0.5 m pipe, 5 mT, 3 m/s', B: 0.005, d: 0.5, v: 3 },
];

const X0 = -4; // pipe ends
const X1 = 4;
const YW = 1.3; // wall height
const XM = 1.8; // half width of the field region
const N_IONS = 48;
const N_WALL = 14;

/** Flow in the unit that reads best: L/s for pipes, mL/min for blood vessels. */
const fmtQ = (q) => (q >= 1e-3 ? `${Number((q * 1e3).toPrecision(3))} L/s` : `${Number((q * 6e7).toPrecision(3))} mL/min`);
const fmtLen = (d) => (d >= 1 ? `${Number(d.toPrecision(3))} m` : d >= 0.01 ? `${Number((d * 100).toPrecision(3))} cm` : `${Number((d * 1000).toPrecision(3))} mm`);

export default defineLab({
  id: 'flowmeter',
  exam: 'e5',
  title: 'Flow meter',
  hint: 'The fluid is the moving rod: V = Bdv across the pipe',
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
          ${slider('fm-B', 'Field <i>B</i> (log)', -3, -0.3, 0.01)}
          ${slider('fm-d', 'Pipe diameter <i>d</i> (log)', -3, 0, 0.01)}
          ${slider('fm-v', 'Flow speed <i>v</i> (log)', -2, 1, 0.01)}
          <p class="tiny">The pipe is drawn the same size at every diameter. Ions drift faster on screen as v grows, slowed for display.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, key) =>
      document.getElementById(id).addEventListener('input', (e) => {
        api.slice()[key] = Number((10 ** Number(e.target.value)).toPrecision(3));
        api.bump();
      });
    on('fm-B', 'B');
    on('fm-d', 'd');
    on('fm-v', 'v');
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('fm-B', Math.log10(state.B), si(state.B, 'T'));
    set('fm-d', Math.log10(state.d), fmtLen(state.d));
    set('fm-v', Math.log10(state.v), `${Number(state.v.toPrecision(3))} m/s`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const pos = points(N_IONS, Q.pos, 7);
    const neg = points(N_IONS, Q.neg, 7);
    const wallPos = points(N_WALL, Q.pos, 7);
    const wallNeg = points(N_WALL, Q.neg, 7);
    group.add(pos, neg, wallPos, wallNeg);
    // Each ion keeps its own height and starting place, so the flow looks the same every frame.
    const seed = (i, k) => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const ions = [];
    for (let i = 0; i < N_IONS; i++) ions.push({ y: -YW + 0.18 + seed(i, 1) * (2 * YW - 0.36), f: seed(i, 2) });
    group.visible = false;
    return { group, pos, neg, wallPos, wallNeg, ions, phase: 0, scene: null, key: '', nWall: 0, speed: 0 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.fm = flowMeter(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.fm;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.B, state.d, state.v]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The fluid and the pipe's walls.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 2 * YW), new THREE.MeshBasicMaterial({ color: 0x14303d }));
    water.position.set(0, 0, -0.05);
    g.add(water);
    g.add(fatLine([X0, YW, 0, X1, YW, 0], { color: M.grey, width: 5 }));
    g.add(fatLine([X0, -YW, 0, X1, -YW, 0], { color: M.grey, width: 5 }));
    // The field region: a dashed outline and ⊙ marks (B out of the page).
    for (let x = -XM; x < XM; x += 0.5) {
      g.add(fatLine([x, YW + 0.3, 0, x + 0.3, YW + 0.3, 0], { color: Q.B, width: 1.5, opacity: 0.6 }));
      g.add(fatLine([x, -YW - 0.3, 0, x + 0.3, -YW - 0.3, 0], { color: Q.B, width: 1.5, opacity: 0.6 }));
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const x = -XM + 0.45 + i * ((2 * XM - 0.9) / 3);
        const y = -0.75 + j * 0.75;
        const ring = [];
        for (let k = 0; k <= 20; k++) ring.push(x + 0.13 * Math.cos((k / 20) * 2 * Math.PI), y + 0.13 * Math.sin((k / 20) * 2 * Math.PI), 0.01);
        g.add(fatLine(ring, { color: Q.B, width: 1.5, opacity: 0.8 }));
        g.add(fatLine([x - 0.02, y, 0.01, x + 0.02, y, 0.01], { color: Q.B, width: 4 }));
      }
    }
    g.add(label(`<span class="qB" style="white-space:nowrap"><i>B</i> = ${si(state.B, 'T')} out of the page</span>`, -1.6, YW + 0.75, 0));
    // Electrodes and the meter's wires: top electrode up and over, bottom one down and round.
    g.add(fatLine([-0.25, YW - 0.05, 0.02, 0.25, YW - 0.05, 0.02], { color: Q.I, width: 7 }));
    g.add(fatLine([-0.25, -YW + 0.05, 0.02, 0.25, -YW + 0.05, 0.02], { color: Q.I, width: 7 }));
    const MX = 3.3;
    const MY = 2.1;
    g.add(fatLine([0.25, YW, 0, 2.2, YW, 0, 2.2, MY, 0, MX - 0.4, MY, 0], { color: Q.I, width: 2, opacity: 0.7 }));
    g.add(fatLine([0.25, -YW, 0, 2.2, -YW, 0, 2.2, -YW - 0.6, 0, 4.4, -YW - 0.6, 0, 4.4, MY, 0, MX + 0.4, MY, 0], { color: Q.I, width: 2, opacity: 0.7 }));
    const dial = [];
    for (let k = 0; k <= 40; k++) dial.push(MX + 0.4 * Math.cos((k / 40) * 2 * Math.PI), MY + 0.4 * Math.sin((k / 40) * 2 * Math.PI), 0.02);
    g.add(fatLine(dial, { color: M.white, width: 2.5 }));
    g.add(label('<b>V</b>', MX, MY, 0));
    g.add(label(qv('qV', `<span style="white-space:nowrap"><i>V</i> = <i>Bdv</i> = ${si(c.V, 'V')}</span>`), MX, MY + 0.75, 0));
    g.add(label('<b style="color:var(--blue,#58C4DD);font-size:1.3em">−</b>', 0, YW - 0.34, 0));
    g.add(label('<b style="color:var(--red,#FC6255);font-size:1.3em">+</b>', 0, -YW + 0.34, 0));
    // E, from the + wall to the − wall.
    g.add(new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.9, -YW + 0.2, 0.03), 2 * YW - 0.4, Q.E, 0.3, 0.22, 0.04));
    g.add(label(`<span style="color:var(--yellow,#F4D345);white-space:nowrap"><i>E</i> = <i>vB</i></span>`, 1.55, 0.35, 0));
    // The flow: v to the right, the diameter, and Q.
    g.add(new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(X0 + 0.3, 0, 0.03), 1.3, Q.v, 0.3, 0.22, 0.04));
    g.add(label(`<span style="white-space:nowrap"><i>v</i> = ${Number(state.v.toPrecision(3))} m/s</span>`, X0 + 1.15, 0.4, 0));
    g.add(fatLine([X0 + 0.15, -YW, 0.02, X0 + 0.15, YW, 0.02], { color: M.white, width: 1.2, opacity: 0.5 }));
    g.add(label(`<span style="white-space:nowrap"><i>d</i> = ${fmtLen(state.d)}</span>`, X0 + 1.15, -0.55, 0));
    g.add(label(`<span style="white-space:nowrap"><span class="muted">flow</span> <i>Q</i> = <i>v</i>·π<i>d</i>²/4 = ${fmtQ(c.Q)}</span>`, -1.6, -YW - 0.75, 0));
    // Charge piled on each wall: more for a bigger voltage, 2 to 14 on a log scale from 1 μV to 1 V.
    h.nWall = Math.max(2, Math.min(N_WALL, Math.round(2 + 2 * (Math.log10(Math.max(c.V, 1e-6)) + 6))));
    h.speed = 0.04 + 0.05 * (Math.log10(state.v) + 2);
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !computed.fm) return;
    h.phase = (h.phase + Math.min(dt, 0.05) * h.speed) % 1;
    const span = X1 - X0 - 0.2;
    const pa = h.pos.geometry.attributes.position.array;
    const na = h.neg.geometry.attributes.position.array;
    // Half the ions positive, half negative, in alternate slots.
    const half = N_IONS / 2;
    h.pos.geometry.setDrawRange(0, half);
    h.neg.geometry.setDrawRange(0, half);
    for (let i = 0; i < half; i++) {
      for (const [arr, ion] of [
        [pa, h.ions[2 * i]],
        [na, h.ions[2 * i + 1]],
      ]) {
        arr[i * 3] = X0 + 0.1 + ((ion.f + h.phase) % 1) * span;
        arr[i * 3 + 1] = ion.y;
        arr[i * 3 + 2] = 0.04;
      }
    }
    h.pos.geometry.attributes.position.needsUpdate = true;
    h.neg.geometry.attributes.position.needsUpdate = true;
    // The separated charge sits still on the walls inside the field region.
    const wp = h.wallPos.geometry.attributes.position.array;
    const wn = h.wallNeg.geometry.attributes.position.array;
    h.wallPos.geometry.setDrawRange(0, h.nWall);
    h.wallNeg.geometry.setDrawRange(0, h.nWall);
    for (let i = 0; i < h.nWall; i++) {
      const x = -XM + 0.15 + ((i + 0.5) / h.nWall) * (2 * XM - 0.3);
      wp[i * 3] = x;
      wp[i * 3 + 1] = -YW + 0.14;
      wp[i * 3 + 2] = 0.05;
      wn[i * 3] = x;
      wn[i * 3 + 1] = YW - 0.14;
      wn[i * 3 + 2] = 0.05;
    }
    h.wallPos.geometry.attributes.position.needsUpdate = true;
    h.wallNeg.geometry.attributes.position.needsUpdate = true;
  },
  law() {
    return [String.raw`q\,E = q\,vB \;\Rightarrow\; \qV = Ed = Bdv`, String.raw`Q = v\,\dfrac{\pi d^2}{4} \;\Rightarrow\; \qV = \dfrac{4B\,Q}{\pi d}`];
  },
  liveRows(state, computed) {
    const c = computed.fm;
    if (!c) return '';
    return [
      kv(tex(String.raw`E = vB`), `${si(c.E, 'V')}/m`),
      kv(tex(String.raw`\qV = Bdv`), qv('qV', si(c.V, 'V'))),
      kv(tex(String.raw`A = \pi d^2/4`), `${c.A >= 1e-3 ? Number(c.A.toPrecision(3)) : sciText(c.A)} m²`),
      kv(tex(String.raw`Q = vA`), fmtQ(c.Q)),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.fm;
    if (!c) return '';
    return cells([
      [String.raw`Electrodes $V$`, si(c.V, 'V'), 'qV'],
      [String.raw`Field in the fluid $E$`, `${si(c.E, 'V')}/m`, ''],
      [String.raw`Flow $Q$`, fmtQ(c.Q), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.fm;
    if (!c) return { title: '', body: '' };
    return {
      title: 'A flow meter is the moving rod of Ch 48, made of fluid',
      body: [
        'The fluid carries ions. Moving at $v$ across $B$, each feels $q\\vec v\\times\\vec B$: positive ions toward one wall, negative toward the other. They pile up until the electric field between the walls cancels the push:',
        eq(String.raw`qE = qvB \;\Rightarrow\; V = Ed = Bdv = \text{${si(c.V, 'V')}}`),
        `The flow is $Q = v\\,\\pi d^2/4$ = ${fmtQ(c.Q)}. The reading is proportional to the speed: double the flow and the voltage doubles. A wider pipe at the same speed gives more voltage and much more flow, since $Q$ grows as $d^2$. The meter has no moving parts and nothing in the stream.`,
        '<b>What the course model leaves out.</b> The fluid does not move at one speed: it is fastest in the middle of the pipe and still at the walls, and the meter reads close to the average. The fluid must conduct, so oil and pure water won’t do. Real meters reverse the field many times a second, because a steady voltage would polarize the electrodes and drift. And the electronics must draw almost no current: the fluid between the electrodes has a large resistance.',
      ],
    };
  },
});
