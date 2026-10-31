import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { diskSimpson, diskVolume, shellSimpson, shellVolume } from '../math/calc2.js';
import { SolidView } from '../scene/solid.js';
import { defineLab } from './define.js';

const B_MAX = 4;

const SCENARIOS = [
  { id: 'disks', name: 'Disks', method: 'disks', b: 4, n: 6 },
  { id: 'shells', name: 'Shells', method: 'shells', b: 4, n: 5 },
  { id: 'both', name: 'Both ways', method: 'both', b: 4, n: 6 },
];

const FRAME = { xMin: -0.6, xMax: 4.8, yMin: -2.8, yMax: 2.8 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function solidCamera(state) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const xMin = Number.isFinite(state?.xMin) ? state.xMin : FRAME.xMin;
  const xMax = Number.isFinite(state?.xMax) ? state.xMax : FRAME.xMax;
  const yMin = Number.isFinite(state?.yMin) ? state.yMin : FRAME.yMin;
  const yMax = Number.isFinite(state?.yMax) ? state.yMax : FRAME.yMax;
  const cx = ((xMin + xMax) / 2) * u;
  const cy = ((yMin + yMax) / 2) * u;
  const halfW = ((xMax - xMin) / 2) * u;
  const z = (halfW * 1.25) / (Math.tan(Math.PI / 9) * (380 / 780));
  return {
    pos: new THREE.Vector3(cx, cy + z * 0.28, z * 0.92),
    target: new THREE.Vector3(cx, cy, 0),
  };
}

export default defineLab({
  id: 'solids',
  exam: 'u1',
  title: 'Solids',
  hint: 'One solid. Disks and shells must name the same volume.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: solidCamera,
  toggles: [
    { key: 'solid', label: 'Solid' },
    { key: 'slices', label: 'Slices' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'disks',
      method: 'disks',
      b: 4,
      n: 6,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { solid: true, slices: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>right end</span>
          <div class="slider-row">
            <input type="range" id="sol-b" min="1" max="4" step="0.1" value="4" />
          </div>
        </label>
        <label class="field">
          <span>slices</span>
          <div class="slider-row">
            <input type="range" id="sol-n" min="3" max="12" step="1" value="6" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('sol-b').addEventListener('input', (e) => {
      api.slice().b = Number(e.target.value);
      api.bump();
    });
    document.getElementById('sol-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const b = document.getElementById('sol-b');
    const n = document.getElementById('sol-n');
    if (b) b.value = state.b;
    if (n) n.value = state.n;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.method = s.method;
    state.b = s.b;
    state.n = s.n;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    let b = Number.isFinite(state.b) ? state.b : 4;
    b = Math.min(B_MAX, Math.max(1, b));
    let n = Number.isFinite(state.n) ? Math.round(state.n) : 6;
    n = Math.min(12, Math.max(3, n));
    const method = state.method === 'shells' || state.method === 'both' ? state.method : 'disks';
    state.b = b;
    state.n = n;
    state.method = method;
    Object.assign(state, FRAME);
    const disk = diskVolume(b);
    const shell = shellVolume(b);
    computed.disk = disk;
    computed.shell = shell;
    computed.diskNum = diskSimpson(b);
    computed.shellNum = shellSimpson(b);
    computed.overPi = disk / Math.PI;
    computed.agree =
      Math.abs(disk - shell) <= 1e-6 &&
      Math.abs(disk - computed.diskNum) <= 1e-4 &&
      Math.abs(shell - computed.shellNum) <= 1e-4;
  },
  init(ctx) {
    return { view: new SolidView(ctx.scene) };
  },
  enter(ctx, handle) {
    handle.view.setVisible(true);
  },
  exit(ctx, handle) {
    handle.view.setVisible(false);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const method = state.method;
    ctx.handle.view.sync({
      b: state.b,
      n: state.n,
      upm: state.view?.upm || 1,
      showSolid: show.solid !== false,
      showDisks: show.slices !== false && method !== 'shells',
      showShells: show.slices !== false && method !== 'disks',
    });
    void computed;
  },
  law() {
    return [String.raw`V=\pi\int_0^b x\,dx`, String.raw`V=\int_0^{\sqrt{b}} 2\pi y(b-y^2)\,dy`];
  },
  liveRows(state, computed) {
    return (
      kv('b', `$${fmt(state.b)}$`) +
      kv('disks', `$${fmt(computed.disk)}$`) +
      kv('shells', `$${fmt(computed.shell)}$`) +
      kv('volume / π', `$${fmt(computed.overPi)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['disks', `$${fmt(computed.disk)}$`],
      ['shells', `$${fmt(computed.shell)}$`],
      ['V/π', `$${fmt(computed.overPi)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The region under y = √x, from 0 to b, turns about the x-axis.',
      'A disk uses radius √x. A shell uses radius y and length b − y².',
      eq(String.raw`\pi\int_0^{${fmt(state.b)}} x\,dx = ${fmt(computed.disk)}`),
      eq(String.raw`\int_0^{\sqrt{${fmt(state.b)}}} 2\pi y\,(b-y^2)\,dy = ${fmt(computed.shell)}`),
    ];
    if (computed.agree) body.push('The two integrals name one volume. Simpson agrees with both.');
    else body.push('The two integrals disagree. Check the radius and the length of a slice.');
    return { title: 'Same solid, two slicings', body };
  },
  plot() {
    return null;
  },
});
