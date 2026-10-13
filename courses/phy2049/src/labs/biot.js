import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, disposeTree, markAnswer } from '../scene/manim.js';
import { UNITS_PER_METER, MU0 } from '../physics/constants.js';
import {
  Bpolyline,
  BwireInfinite,
  BwireFinite,
  BloopAxis,
  Bsolenoid,
  BsolenoidFiniteAxis,
  wireAlongY,
  loopPoints,
  helixPoints,
  squarePoints,
  quarterLoopPoints,
  BsquareCenter,
  BarcCenter,
  halfLoopPoints,
  hairpinPoints,
  runPoints,
  sectorPoints,
  rectPoints,
  BrectCenter,
  BsectorCenter,
  BbesideEnd,
} from '../physics/bfield.js';
import { kv, cells, matchClass, qv, eq } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

const SCENARIOS = [
  { id: 'wire', name: 'Straight wire', kind: 'wire', I: 2, R: 0.12, L: 2.4, nTurns: 20, probe: { x: 0.12, y: 0, z: 0 } },
  { id: 'loop', name: 'Current loop, probe on axis', kind: 'loop', I: 3, R: 0.28, L: 0.4, nTurns: 1, probe: { x: 0, y: 0.2, z: 0 } },
  { id: 'solenoid', name: 'Solenoid, probe at center', kind: 'solenoid', I: 1.5, R: 0.16, L: 0.8, nTurns: 24, probe: { x: 0, y: 0, z: 0 } },
  { id: 'quarter', name: 'Quarter loop with straight leads, P at the center', kind: 'quarter', I: 3, R: 0.3, L: 0.6, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
  { id: 'square', name: 'Square loop, P at the center', kind: 'square', I: 3, R: 0.3, L: 0.6, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
  { id: 'half', name: 'Half loop with straight leads (class example)', kind: 'half', I: 3, R: 0.25, L: 0.6, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
  { id: 'end', name: 'Straight wire, P beside one end (class example)', kind: 'wire', I: 2, R: 0.12, L: 1.2, nTurns: 20, probe: { x: 0.15, y: -0.6, z: 0 } },
  { id: 'hairpin', name: 'Hairpin: half loop with two long parallel leads', kind: 'hairpin', I: 3, R: 0.2, L: 0.6, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
  { id: 'sector', name: 'Pie slice: two arcs with radial sides', kind: 'sector', I: 3, R: 0.15, L: 0.4, nTurns: 1, arc: 90, rev: false, probe: { x: 0, y: 0, z: 0 } },
  { id: 'semis', name: 'Two semicircles, radii a and b (Worksheet 4 #15)', kind: 'sector', I: 3, R: 0.15, L: 0.3, nTurns: 1, arc: 180, rev: true, probe: { x: 0, y: 0, z: 0 } },
  { id: 'wireloop', name: 'Loop beside a long wire (Worksheet 4 #14)', kind: 'wireloop', I: 30, R: 0.2, L: 0.4, IL: 0, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
  { id: 'rect', name: 'Rectangle loop, P at the center', kind: 'rect', I: 3, R: 0.3, L: 0.8, nTurns: 1, probe: { x: 0, y: 0, z: 0 } },
];

/** The flat circuits whose closed form is at P, the centre. */
const FLAT = new Set(['square', 'quarter', 'half', 'hairpin', 'sector', 'rect', 'wireloop']);

/**
 * Worksheet 4 #14: a long straight wire (current I, down the page) a distance L to the right of a
 * loop's centre, and the loop (radius R, current IL, + = counterclockwise). On the page, down is +z.
 */
export const WIRELOOP_LEN = 20;
export function wireloopWire(state) {
  const d = state.L;
  return [...runPoints({ x: d, z: -WIRELOOP_LEN }, { x: d, z: 0 }, 60, 'b'), ...runPoints({ x: d, z: 0 }, { x: d, z: WIRELOOP_LEN }, 60, 'a').slice(1)];
}
export function wireloopLoop(state) {
  const pts = loopPoints(state.R, 64);
  return (state.IL ?? 0) < 0 ? [...pts].reverse() : pts;
}
/** The hairpin's straight wires: long compared with R, so each is nearly half an infinite wire. */
const HAIRPIN_LEAD = 20;
/** The pie slice: an arc of `arc` degrees (a quarter turn unless set), inner radius R, outer radius L (kept at least 5 cm outside R). */
export const SECTOR_THETA = Math.PI / 2;
export const sectorTheta = (state) => ((state.arc ?? 90) * Math.PI) / 180;
export const sectorOuter = (state) => Math.max(state.L, state.R + 0.05);

/** The quarter loop's straight leads, each this long (m). */
const LEAD = 0.6;
/** Square and quarter loop: the closed forms hold at the centre, within 1 cm. */
const atCenter = (p) => Math.hypot(p.x, p.y, p.z) < ON_AXIS;

/** Probe counts as "on the axis" within 1 cm — the closed forms for loop and solenoid only hold there. */
const ON_AXIS = 0.01;

export function fmtB(t) {
  if (!Number.isFinite(t)) return '—';
  const a = Math.abs(t);
  if (a >= 1) return `${t.toFixed(3)} T`;
  if (a >= 1e-3) return `${(t * 1e3).toFixed(2)} mT`;
  if (a >= 1e-6) return `${(t * 1e6).toFixed(2)} μT`;
  return `${sciHTML(t)} T`;
}

function wirePoints(state) {
  if (state.kind === 'wire') return wireAlongY(-state.L / 2, state.L / 2, 24);
  if (state.kind === 'loop') return loopPoints(state.R, 48);
  if (state.kind === 'square') return squarePoints(state.L, 24);
  if (state.kind === 'quarter') return quarterLoopPoints(state.R, LEAD).all;
  if (state.kind === 'half') return halfLoopPoints(state.R, LEAD).all;
  if (state.kind === 'hairpin') return hairpinPoints(state.R, HAIRPIN_LEAD).all;
  if (state.kind === 'sector') return sectorPoints(state.R, sectorOuter(state), sectorTheta(state), !!state.rev).all;
  if (state.kind === 'rect') return rectPoints(state.L, state.R);
  if (state.kind === 'wireloop') return wireloopWire(state);
  return helixPoints(state.R, state.L, state.nTurns, 16);
}

/**
 * `exact` is the closed form for this same finite geometry — what Σ dB must reproduce.
 * `ideal` is the textbook limit (infinite wire, long solenoid) shown separately.
 */
function analyticB(state) {
  const p = state.probe;
  const rho = Math.hypot(p.x, p.z);
  const onAxis = rho < ON_AXIS;
  if (state.kind === 'wire') {
    return {
      exact: rho < 1e-6 ? null : BwireFinite(state.I, -state.L / 2, state.L / 2, p),
      exactNote: 'finite wire',
      ideal: rho < 1e-6 ? null : BwireInfinite(state.I, rho),
      idealNote: String.raw`$\mu_0 I/2\pi\rho$, infinite wire`,
      onAxis: true,
    };
  }
  if (state.kind === 'loop') {
    return { exact: onAxis ? BloopAxis(state.I, state.R, p.y) : null, exactNote: 'loop, on axis', ideal: null, onAxis };
  }
  if (state.kind === 'square') {
    const c = atCenter(p);
    return { exact: c ? BsquareCenter(state.I, state.L) : null, exactNote: 'square, at the centre', ideal: null, onAxis: c };
  }
  if (state.kind === 'quarter') {
    const c = atCenter(p);
    return { exact: c ? BarcCenter(state.I, state.R, Math.PI / 2) : null, exactNote: 'quarter loop, at the centre', ideal: null, onAxis: c };
  }
  if (FLAT.has(state.kind)) {
    const c = atCenter(p);
    const { I, R } = state;
    const half = BarcCenter(I, R, Math.PI);
    const exact = {
      half: () => half,
      hairpin: () => half + 2 * BbesideEnd(I, R, HAIRPIN_LEAD),
      sector: () => BsectorCenter(I, R, sectorOuter(state), sectorTheta(state)),
      rect: () => BrectCenter(I, state.L, R),
      wireloop: () => Math.abs((MU0 * I) / (2 * Math.PI * state.L) - (MU0 * (state.IL ?? 0)) / (2 * R)),
    }[state.kind]();
    const note = { half: 'half loop, at the centre', hairpin: 'hairpin (20 m leads)', sector: state.arc === 180 ? 'two semicircles, at the centre' : 'pie slice, at the centre', rect: 'rectangle, at the centre', wireloop: 'net at the loop’s centre' }[state.kind];
    return {
      exact: c ? exact : null,
      exactNote: note,
      ideal: state.kind === 'hairpin' && c ? half + (MU0 * I) / (2 * Math.PI * R) : null,
      idealNote: String.raw`$\mu_0 I/4R + \mu_0 I/2\pi R$, endless leads`,
      onAxis: c,
    };
  }
  const n = state.nTurns / state.L;
  return {
    exact: onAxis ? BsolenoidFiniteAxis(n, state.I, state.L, state.R, p.y) : null,
    exactNote: 'finite solenoid, on axis',
    ideal: Bsolenoid(n, state.I),
    idealNote: String.raw`$\mu_0 n I$, long solenoid`,
    onAxis,
  };
}

function matchPct(num, exact) {
  if (exact == null) return null;
  const rel = Math.abs(num - Math.abs(exact)) / Math.max(Math.abs(exact), 1e-15);
  return Math.max(0, (1 - rel) * 100);
}

/** Cone chevrons along the conductor showing the direction of +I, plus an I label. */
function currentGuides(pts, kind, u) {
  const g = new THREE.Group();
  const count = kind === 'wire' ? 4 : kind === 'loop' || kind === 'square' ? 6 : kind === 'quarter' ? 5 : 10;
  const n = pts.length - 1;
  for (let k = 0; k < count; k++) {
    const i = Math.min(n - 1, Math.floor(((k + 0.5) / count) * n));
    const a = pts[i];
    const c = pts[i + 1];
    const dir = new THREE.Vector3(c.x - a.x, c.y - a.y, c.z - a.z).normalize();
    const mid = new THREE.Vector3(((a.x + c.x) / 2) * u, ((a.y + c.y) / 2) * u, ((a.z + c.z) / 2) * u);
    const L = 0.4;
    g.add(new Arrow(dir, mid.addScaledVector(dir, -L / 2), L, Q.I, 0.3, 0.3, 0.001));
  }
  const el = document.createElement('div');
  el.className = 'circuit-label';
  const label = new CSS2DObject(el);
  const a = pts[Math.floor(n * 0.15)];
  label.position.set(a.x * u + 0.55, a.y * u + 0.35, a.z * u);
  g.add(label);
  g.userData.label = el;
  return g;
}

export default defineLab({
  id: 'biot',
  exam: 'e4',
  title: 'Biot–Savart',
  hint: 'Play the dl sum — B at the probe is Σ dB',
  orbit: true,
  probe: true,
  camera: { pos: new THREE.Vector3(4.8, 3.6, 8.8), target: new THREE.Vector3(0, 0, 0) },
  cameraFor(state) {
    if (state.kind === 'solenoid') return { pos: new THREE.Vector3(8, 3.5, 14), target: new THREE.Vector3(0, 0, 0) };
    if (state.kind === 'loop') return { pos: new THREE.Vector3(5, 4.6, 10), target: new THREE.Vector3(0, 0.9, 0) };
    // Looking down on the flat loops from above and to the side: "out of the page" is up.
    if (state.kind === 'square') return { pos: new THREE.Vector3(3.2, 8.5, 7.5), target: new THREE.Vector3(0, 0, 0) };
    if (state.kind === 'quarter') return { pos: new THREE.Vector3(1.5, 9, 6.5), target: new THREE.Vector3(-1.6, 0, -1.6) };
    if (state.kind === 'half') return { pos: new THREE.Vector3(1.5, 9, 6.5), target: new THREE.Vector3(0, 0, -0.8) };
    if (state.kind === 'hairpin') return { pos: new THREE.Vector3(0.5, 9, 6.5), target: new THREE.Vector3(-1.5, 0, 0) };
    if (state.kind === 'sector') return { pos: new THREE.Vector3(3.5, 9, 6.5), target: new THREE.Vector3(1.3, 0, -1.3) };
    if (state.kind === 'rect') return { pos: new THREE.Vector3(3.2, 9, 7.5), target: new THREE.Vector3(0, 0, 0) };
    if (state.kind === 'wireloop') return { pos: new THREE.Vector3(2.2, 9, 6.5), target: new THREE.Vector3(1.4, 0, 0) };
    // A straight wire: look at the probe's height, so P beside an end stays in view.
    const yP = Math.abs(state.probe.y) > 0.2 ? state.probe.y * UNITS_PER_METER * 0.8 : 0;
    return { pos: new THREE.Vector3(4.8, 3.6 + yP, 8.8), target: new THREE.Vector3(0, yP, 0) };
  },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'wire',
      kind: 'wire',
      I: 2,
      R: 0.12,
      L: 2.4,
      nTurns: 20,
      probe: { x: 0.12, y: 0, z: 0 },
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, kind: sc.kind, I: sc.I, R: sc.R, L: sc.L, nTurns: sc.nTurns, arc: sc.arc ?? 90, rev: !!sc.rev, IL: sc.IL ?? 0 });
    state.probe = { ...sc.probe };
    state.anim = { playing: false, i: 0 };
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Current I</span>
            <div class="slider-row">
              <input type="range" id="biot-I" min="0.2" max="8" step="0.1" value="2" />
              <span class="mono val qI" id="biot-I-val">2.0 A</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-R">
            <span id="biot-R-label">Radius R</span>
            <div class="slider-row">
              <input type="range" id="biot-R" min="0.06" max="0.45" step="0.01" value="0.12" />
              <span class="mono val" id="biot-R-val">0.12 m</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-L">
            <span id="biot-L-label">Length L</span>
            <div class="slider-row">
              <input type="range" id="biot-L" min="0.3" max="3" step="0.05" value="2.4" />
              <span class="mono val" id="biot-L-val">2.40 m</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-IL">
            <span>Loop current I<sub>L</sub> (+ = counterclockwise)</span>
            <div class="slider-row">
              <input type="range" id="biot-IL" min="-10" max="10" step="0.01" value="0" />
              <span class="mono val qI" id="biot-IL-val">0 A</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-N">
            <span>Turns N</span>
            <div class="slider-row">
              <input type="range" id="biot-N" min="4" max="40" step="1" value="24" />
              <span class="mono val" id="biot-N-val">24</span>
            </div>
          </label>
          <button type="button" class="btn ghost" id="btn-biot-axis">Put probe on the axis</button>
          <button type="button" class="btn accent" id="btn-sweep-biot">Play Σ dB</button>
          <p class="tiny">dB = (μ₀/4π) I dl × r̂ / r², μ₀ = 4π×10⁻⁷ T·m/A. Gold chevrons show +I. The teal arrow is B at the probe; click empty floor to move the probe.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const num = (id, key) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump();
      });
    num('biot-I', 'I');
    num('biot-R', 'R');
    num('biot-L', 'L');
    num('biot-N', 'nTurns');
    num('biot-IL', 'IL');
    $('btn-biot-axis').addEventListener('click', () => {
      const s = api.slice();
      s.probe.x = 0;
      s.probe.z = 0;
      if (FLAT.has(s.kind)) s.probe.y = 0; // their closed form is at the centre
      api.bump();
    });
    $('btn-sweep-biot').addEventListener('click', () => api.toggleSweep());
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('biot-I').value = state.I;
    $('biot-I-val').textContent = `${state.I.toFixed(1)} A`;
    $('biot-R').value = state.R;
    $('biot-R-val').textContent = `${state.R.toFixed(2)} m`;
    $('biot-L').value = state.L;
    $('biot-L-val').textContent = `${state.L.toFixed(2)} m`;
    $('biot-N').value = state.nTurns;
    $('biot-N-val').textContent = String(state.nTurns);
    $('wrap-biot-R').hidden = state.kind === 'wire' || state.kind === 'square';
    $('wrap-biot-L').hidden = ['loop', 'quarter', 'half', 'hairpin'].includes(state.kind);
    $('biot-L-label').textContent = { square: 'Side L', sector: 'Outer radius b', rect: 'Width W', wireloop: 'Wire to loop centre, d' }[state.kind] || 'Length L';
    $('biot-R-label').textContent = { sector: 'Inner radius a', rect: 'Height H', wireloop: 'Loop radius R' }[state.kind] || 'Radius R';
    $('wrap-biot-N').hidden = state.kind !== 'solenoid';
    $('wrap-biot-IL').hidden = state.kind !== 'wireloop';
    if (state.kind === 'wireloop') {
      if (document.activeElement !== $('biot-IL')) $('biot-IL').value = state.IL ?? 0;
      $('biot-IL-val').textContent = `${(state.IL ?? 0).toFixed(2)} A ${(state.IL ?? 0) > 0 ? 'ccw' : (state.IL ?? 0) < 0 ? 'cw' : ''}`;
    }
    $('btn-biot-axis').hidden = state.kind === 'wire';
    $('btn-biot-axis').textContent = FLAT.has(state.kind) ? 'Put probe at the centre' : 'Put probe on the axis';
    $('btn-sweep-biot').textContent = state.anim.playing ? 'Stop sum' : 'Play Σ dB';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Barrow = markAnswer(new Arrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, Q.B, 0.32, 0.24, 0.045));
    group.add(Barrow);
    group.visible = false;
    return { group, Barrow, wire: null, guides: null, wireKey: '', guideKey: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.kind === 'wireloop') {
      // Two circuits, two currents: sum each and add.
      const wire = wireloopWire(state);
      const loop = wireloopLoop(state);
      const Bw = Bpolyline(state.I, wire, state.probe, 4);
      const Bl = Bpolyline(Math.abs(state.IL ?? 0), loop, state.probe, 4);
      const Bfull = { x: Bw.x + Bl.x, y: Bw.y + Bl.y, z: Bw.z + Bl.z };
      computed.biot = {
        Bnum: Bfull,
        Bfull,
        Bwire: Bw,
        Bloop: Bl,
        loopPts: loop,
        mag: Math.hypot(Bfull.x, Bfull.y, Bfull.z),
        magFull: Math.hypot(Bfull.x, Bfull.y, Bfull.z),
        an: analyticB(state),
        pts: wire,
        nShow: wire.length,
        playing: false,
        mu0: MU0,
      };
      return;
    }
    const pts = wirePoints(state);
    const playing = state.anim.playing;
    const nShow = playing ? Math.max(2, Math.min(pts.length, Math.floor(state.anim.i))) : pts.length;
    const Bnum = Bpolyline(state.I, pts.slice(0, nShow), state.probe, 4);
    const Bfull = nShow >= pts.length ? Bnum : Bpolyline(state.I, pts, state.probe, 4);
    computed.biot = {
      Bnum,
      Bfull,
      mag: Math.hypot(Bnum.x, Bnum.y, Bnum.z),
      magFull: Math.hypot(Bfull.x, Bfull.y, Bfull.z),
      an: analyticB(state),
      pts,
      nShow,
      playing,
      mu0: MU0,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const b = computed.biot;
    if (!h || !b) return;
    const u = UNITS_PER_METER;

    const geomKey = `${state.kind}|${state.R}|${state.L}|${state.nTurns}`;
    const wireKey = `${geomKey}|${b.nShow}`;
    if (wireKey !== h.wireKey) {
      h.wireKey = wireKey;
      if (h.wire) {
        h.group.remove(h.wire);
        disposeTree(h.wire);
        h.wire = null;
      }
      const flat = [];
      for (let i = 0; i < b.nShow; i++) flat.push(b.pts[i].x * u, b.pts[i].y * u, b.pts[i].z * u);
      if (flat.length >= 6) {
        h.wire = fatLine(flat, { color: Q.I, width: 3.5 });
        h.group.add(h.wire);
      }
    }
    if (geomKey !== h.guideKey) {
      h.guideKey = geomKey;
      if (h.guides) {
        h.group.remove(h.guides);
        disposeTree(h.guides);
      }
      h.guides = currentGuides(b.pts, state.kind, u);
      h.group.add(h.guides);
    }
    h.guides.userData.label.innerHTML = qv('qI', `<i>I</i> = ${state.I.toFixed(1)} A`);
    // Worksheet 4 #14's loop, drawn with its own current's direction.
    const loopKey = state.kind === 'wireloop' ? `${state.R}|${Math.sign(state.IL ?? 0)}` : '';
    if (loopKey !== h.loopKey) {
      h.loopKey = loopKey;
      if (h.loop2) {
        h.group.remove(h.loop2);
        disposeTree(h.loop2);
        h.loop2 = null;
      }
      if (loopKey) {
        const g = new THREE.Group();
        const lp = b.loopPts;
        g.add(fatLine(lp.flatMap((q) => [q.x * u, q.y * u, q.z * u]), { color: Q.I, width: 3.5, opacity: (state.IL ?? 0) === 0 ? 0.35 : 1 }));
        if ((state.IL ?? 0) !== 0) {
          const gd = currentGuides(lp, 'loop', u);
          g.add(gd);
          g.userData.label = gd.userData.label;
        }
        h.loop2 = g;
        h.group.add(g);
      }
    }
    if (h.loop2?.userData.label) h.loop2.userData.label.innerHTML = qv('qI', `<i>I</i><sub>L</sub> = ${Math.abs(state.IL ?? 0).toFixed(2)} A`);

    const B = b.playing ? b.Bnum : b.Bfull;
    const mag = b.playing ? b.mag : b.magFull;
    const Bref = (MU0 * state.I) / (2 * Math.PI * 0.15);
    const p = state.probe;
    h.Barrow.position.set(p.x * u, p.y * u, p.z * u);
    h.Barrow.visible = mag > 1e-15;
    if (h.Barrow.visible) {
      h.Barrow.setDirection(new THREE.Vector3(B.x, B.y, B.z));
      h.Barrow.setLength(0.5 + 1.9 * Math.tanh(mag / Bref), 0.32, 0.24);
    }
    const probe = ctx.pool.probe();
    probe.setVisible(true);
    probe.sync(state.probe, { x: 0, y: 0, z: 0 }, `|B| = ${fmtB(mag).replace(/<[^>]+>/g, '')}`, 'P');
    ctx.grid.visible = true;
  },
  tick(dt, state, computed) {
    if (!state.anim.playing) return false;
    const nMax = computed.biot?.pts.length || 40;
    state.anim.i += dt * Math.max(18, nMax / 5);
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    return true;
  },
  law(state) {
    const dB = String.raw`d\vec{B}=\dfrac{\mu_0}{4\pi}\dfrac{\qI\,d\vec{l}\times\hat{r}}{r^2}`;
    if (state.kind === 'wire') {
      return [dB, String.raw`B=\dfrac{\mu_0\qI}{4\pi\rho}(\sin\theta_2-\sin\theta_1)\;\xrightarrow{\,L\to\infty\,}\;\dfrac{\mu_0\qI}{2\pi\rho}`];
    }
    if (state.kind === 'loop') return [dB, String.raw`B_{\text{axis}}=\dfrac{\mu_0\qI R^2}{2(R^2+z^2)^{3/2}}`];
    if (state.kind === 'square') return [dB, String.raw`B_{\text{centre}} = 4\cdot\dfrac{\mu_0\qI}{4\pi (L/2)}\sqrt2 = \dfrac{2\sqrt2\,\mu_0\qI}{\pi L}`];
    if (state.kind === 'quarter') return [dB, String.raw`B_{\text{centre}} = \dfrac{\mu_0\qI}{4\pi R^2}\cdot\dfrac{\pi R}{2} = \dfrac{\mu_0\qI}{8R}`];
    if (state.kind === 'half') return [dB, String.raw`B_{\text{centre}} = \dfrac{\mu_0\qI}{4\pi R^2}\cdot\pi R = \dfrac{\mu_0\qI}{4R}\ \text{(into)}`];
    if (state.kind === 'hairpin') return [dB, String.raw`B = \dfrac{\mu_0\qI}{4R} + 2\cdot\dfrac{\mu_0\qI}{4\pi R}\ \text{(all into)}`];
    if (state.kind === 'sector') return [dB, state.arc === 180 ? String.raw`B = \dfrac{\mu_0\qI}{4}\left(\dfrac1a - \dfrac1b\right)\ \text{(out)}` : String.raw`B = \dfrac{\mu_0\qI\theta}{4\pi}\left(\dfrac1a - \dfrac1b\right),\ \theta = \tfrac{\pi}{2}`];
    if (state.kind === 'rect') return [dB, String.raw`B_{\text{centre}} = \dfrac{2\mu_0\qI\sqrt{W^2 + H^2}}{\pi W H}`];
    if (state.kind === 'wireloop') return [String.raw`\dfrac{\mu_0 \qI}{2\pi d}\ \text{(wire, into)} = \dfrac{\mu_0 I_L}{2R}\ \text{(loop, out)}`, String.raw`I_L = \dfrac{\qI R}{\pi d}\ \text{counterclockwise}`];
    return [dB, String.raw`B_{\text{axis}}=\dfrac{\mu_0 n\qI}{2}(\cos\alpha_2-\cos\alpha_1)\;\xrightarrow{\,L\gg R\,}\;\mu_0 n\qI`];
  },
  liveRows(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const pct = matchPct(b.magFull, b.an.exact);
    const rows = [kv(String.raw`$I$`, qv('qI', `${state.I.toFixed(2)} A`)), kv(String.raw`Numerical $|\sum d\vec{B}|$`, fmtB(b.magFull))];
    if (b.Bwire) {
      const w = b.Bwire.y;
      const l = b.Bloop.y;
      rows.push(
        kv('From the wire', `${fmtB(Math.abs(w))} ${w < 0 ? 'into the page' : 'out of the page'}`),
        kv('From the loop', `${fmtB(Math.abs(l))} ${Math.abs(l) < 1e-15 ? '' : l < 0 ? 'into the page' : 'out of the page'}`),
        kv('Loop current that cancels', `${((state.I * state.R) / (Math.PI * state.L)).toFixed(3)} A, counterclockwise`),
      );
    }
    if (b.playing) rows.push(kv(`Running $|\\vec{B}|$ (${b.nShow}/${b.pts.length} pieces)`, fmtB(b.mag)));
    rows.push(kv(`Exact: ${b.an.exactNote}`, b.an.exact == null ? '— (move probe to the axis)' : fmtB(Math.abs(b.an.exact))));
    if (pct != null) rows.push(kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`));
    if (b.an.ideal != null) rows.push(kv(`Ideal: ${b.an.idealNote}`, fmtB(b.an.ideal)));
    rows.push(kv(String.raw`$B_x$, $B_y$, $B_z$`, `${fmtB(b.Bfull.x)}, ${fmtB(b.Bfull.y)}, ${fmtB(b.Bfull.z)}`));
    return rows.join('');
  },
  readout(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const pct = matchPct(b.magFull, b.an.exact);
    return cells([
      [String.raw`$|\sum d\vec{B}|$`, fmtB(b.magFull), ''],
      ['Exact', b.an.exact == null ? 'off axis' : fmtB(Math.abs(b.an.exact)), ''],
      ['Match', pct == null ? '—' : `${pct.toFixed(1)}%`, pct == null ? '' : matchClass(pct)],
      ['Ideal limit', b.an.ideal == null ? '—' : fmtB(b.an.ideal), ''],
    ]);
  },
  coach(state, computed) {
    const b = computed.biot;
    if (state.kind === 'wire') {
      const ratio = b?.an.exact && b?.an.ideal ? (b.an.exact / b.an.ideal) * 100 : null;
      return {
        title: 'Right-hand rule around a wire',
        body: [
          String.raw`Thumb along $I$ (the chevrons), fingers curl the way $\vec{B}$ points. For a finite wire`,
          eq(String.raw`B = \frac{\mu_0 I}{4\pi\rho}(\sin\theta_2 - \sin\theta_1) \;\xrightarrow{\;L\to\infty\;}\; \frac{\mu_0 I}{2\pi\rho}`),
          `This finite wire gives ${ratio ? ratio.toFixed(1) : '—'}% of the infinite-wire value — shrink $L$, or move the probe out, and watch that fall.`,
        ],
      };
    }
    if (!b?.an.onAxis) {
      return {
        title: 'Off the axis — no closed form here',
        body: String.raw`The on-axis formula relies on symmetry: every $d\vec{l}$ is the same distance from the probe, and the sideways $d\vec{B}$ pieces cancel. Off the axis they do not, so the numerical $\sum d\vec{B}$ is the answer. Use "Put probe on the axis" to compare with the formula again.`,
      };
    }
    if (state.kind === 'square') {
      return {
        title: 'Square loop: four finite wires',
        body: [
          String.raw`Each side is a straight wire of length $L$ with the centre a distance $L/2$ from its middle, seen out to $45^\circ$ each way. All four sides turn the same way around the centre, so their fields add, all out of the plane:`,
          eq(String.raw`B = 4\cdot\frac{\mu_0 I}{4\pi (L/2)}\left(\sin 45^\circ + \sin 45^\circ\right) = \frac{2\sqrt2\,\mu_0 I}{\pi L}`),
          String.raw`That is $0.90$ of a circular loop of radius $L/2$, $\mu_0 I/L$: the corners are farther away.`,
        ],
      };
    }
    if (state.kind === 'quarter') {
      return {
        title: 'Quarter loop: only the arc counts',
        body: [
          String.raw`Both straight leads lie on lines through the centre, so on them $d\vec L \parallel \hat r$ and $d\vec L\times\hat r = 0$. On the arc every piece is $R$ away and perpendicular to $\hat r$:`,
          eq(String.raw`B = \frac{\mu_0 I}{4\pi R^2}\int_{\text{arc}} dL = \frac{\mu_0 I}{4\pi R^2}\cdot\frac{\pi R}{2} = \frac{\mu_0 I}{8R}`),
          String.raw`A quarter of a full loop's $\mu_0 I/2R$. Move the probe off the centre and the leads start to count.`,
        ],
      };
    }
    const flatCoach = {
      half: {
        title: 'Half loop: the leads point at P',
        body: [
          String.raw`The straight parts lie on a line through P: $d\vec L\parallel\hat r$, so they add nothing. The arc is half a loop:`,
          eq(String.raw`B = \frac{\mu_0 I}{4\pi R^2}\,(\pi R) = \frac{\mu_0 I}{4R}`),
          String.raw`Left to right over the top is clockwise on the page, so $\vec B$ points into the page (down, here).`,
        ],
      },
      hairpin: {
        title: 'Hairpin: here the leads count',
        body: [
          String.raw`These straight wires don't aim at P; P sits a distance $R$ beside each one's end. Each is half of an endless wire, $\mu_0 I/4\pi R$, and all three parts turn the same way round P:`,
          eq(String.raw`B = \frac{\mu_0 I}{4R} + \frac{\mu_0 I}{2\pi R} = \frac{\mu_0 I}{4R}\left(1 + \frac{2}{\pi}\right)`),
        ],
      },
      sector: state.arc === 180 ? {
        title: 'Two semicircles: the inner one wins',
        body: [
          String.raw`The flat pieces lie on the line through P, so they add nothing. Each semicircle gives $\mu_0 I/4r$. The inner one runs counterclockwise (out of the page) and the outer one clockwise (into it); the nearer arc is stronger:`,
          eq(String.raw`B = \frac{\mu_0 I}{4}\left(\frac1a - \frac1b\right)\ \text{out of the page}`),
        ],
      } : {
        title: 'Pie slice: two arcs that oppose',
        body: [
          String.raw`The radial sides aim at P and add nothing. An arc of angle $\theta$ gives $\mu_0 I\theta/4\pi r$. The outer arc runs counterclockwise (out of the page), the inner one clockwise (into it), and the nearer arc is stronger:`,
          eq(String.raw`B = \frac{\mu_0 I\theta}{4\pi}\left(\frac1a - \frac1b\right)\ \text{into the page}`),
        ],
      },
      wireloop: {
        title: 'Cancel the wire’s field at the loop’s centre',
        body: [
          String.raw`The long wire is a distance $d$ from the centre: $B_w = \mu_0 I/2\pi d$. Thumb down the wire: on its left the field points into the page.`,
          String.raw`The loop gives $B_L = \mu_0 I_L/2R$ at its centre, out of the page if it runs counterclockwise. Set them equal:`,
          eq(String.raw`\frac{\mu_0 I_L}{2R} = \frac{\mu_0 I}{2\pi d}\ \Rightarrow\ I_L = \frac{I R}{\pi d}\ \text{counterclockwise}`),
          'Drag the loop-current slider to that value and watch |ΣdB| go to zero.',
        ],
      },
      rect: {
        title: 'Rectangle: two pairs of finite wires',
        body: [
          String.raw`The two sides of length $W$ are $H/2$ from P; the two of length $H$ are $W/2$ away. Each is a finite wire seen to its corners, a distance $d = \tfrac12\sqrt{W^2 + H^2}$ away:`,
          eq(String.raw`B = 2\cdot\frac{\mu_0 I}{4\pi (H/2)}\frac{W}{d} + 2\cdot\frac{\mu_0 I}{4\pi (W/2)}\frac{H}{d} = \frac{2\mu_0 I\sqrt{W^2+H^2}}{\pi W H}`),
        ],
      },
    }[state.kind];
    if (flatCoach) return flatCoach;
    if (state.kind === 'loop') {
      return {
        title: 'Loop on axis',
        body: [
          String.raw`Every $d\vec{l}$ is the same distance from a point on the axis, so the radial $d\vec{B}$ pieces cancel around the ring and the axial ones add:`,
          eq(String.raw`B_{\text{axis}} = \frac{\mu_0 I R^2}{2(R^2+z^2)^{3/2}}`),
          String.raw`— the same $(R^2+z^2)^{3/2}$ that showed up for the charged ring. Current counterclockwise seen from above makes $\vec{B}$ point up.`,
        ],
      };
    }
    const n = state.nTurns / state.L;
    const frac = b?.an.exact && b?.an.ideal ? (b.an.exact / b.an.ideal) * 100 : null;
    return {
      title: String.raw`Solenoid: $\mu_0 n I$ is the long-solenoid limit`,
      body: [
        eq(String.raw`n = \frac{N}{L} = ${n.toFixed(1)}\ \text{turns/m}, \qquad B_{\text{center}} \to \mu_0 n I`),
        `At the center of this coil $B$ is ${frac ? frac.toFixed(1) : '—'}% of $\\mu_0 nI$, because $L$ is only ${(state.L / state.R).toFixed(1)}× $R$. Stretch $L$, adding turns to hold $n$ fixed, and it approaches the limit.`,
        String.raw`Ampère's law with a rectangular loop is the fast route to $\mu_0 nI$; it assumes $B \approx 0$ outside.`,
      ],
    };
  },
});
