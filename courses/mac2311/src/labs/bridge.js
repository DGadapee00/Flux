/** Shows that doubling cable sag does not double total cable length, while polygon chords underestimate it. */
import * as THREE from 'three';
import { parabolicCable } from '@flux/subjects/math/parabolic-cable.js';
import { M_PER_FT } from '@flux/subjects/convert.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt, fmtPlain } from '@flux/shells/math/format.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';
const L = 4200 * M_PER_FT;
const SCENARIOS = [
  { id: 'shallow', name: 'Main span · assumed 50 m sag', L, d: 50, n: 16 },
  { id: 'deep', name: 'Main span · assumed 100 m sag', L, d: 100, n: 16 },
  { id: 'model', name: '10 m teaching model · 1 m sag', L: 10, d: 1, n: 8 },
];
const apply = (id, s) =>
  Object.assign(s, SCENARIOS.find((x) => x.id === id) || SCENARIOS[0], {
    scenarioId: id,
    view: { plane: 'xy', upm: 1 },
  });
export default defineLab({
  id: 'bridge',
  exam: 'c4',
  title: 'Bridge cable',
  frame: true,
  orbit: false,
  hint: 'Horizontal coordinate and height are in metres. Teal cable, gold polygon, white deck and hangers.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = { show: {} };
    apply('shallow', s);
    return s;
  },
  applyScenario: apply,
  extent: (s) => 0.65 * s.L,
  cameraFor(s) {
    const z = typeof window !== 'undefined' && window.innerWidth <= 720 ? 25 : 14;
    return { pos: new THREE.Vector3(0, 1, z), target: new THREE.Vector3(0, 1, 0) };
  },
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Sag / span</span><div class="slider-row"><input id="bridge-ratio" type="range" min="0.01" max="0.2" step="0.005"></div></label><label class="field"><span>Polygon segments</span><div class="slider-row"><input id="bridge-n" type="range" min="4" max="64" step="4"></div></label></div>`,
  bind(api) {
    document.getElementById('bridge-ratio').addEventListener('input', (e) => {
      api.slice().d = Number(e.target.value) * api.slice().L;
      api.bump();
    });
    document.getElementById('bridge-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(s) {
    document.getElementById('bridge-ratio').value = s.d / s.L;
    document.getElementById('bridge-n').value = s.n;
  },
  recompute(s, c) {
    Object.assign(c, parabolicCable(s.L, s.d, s.n));
  },
  init(ctx) {
    return { view: new GraphView(ctx.scene), members: new GraphView(ctx.scene) };
  },
  enter(ctx, h) {
    h.view.setVisible(true);
    h.members.setVisible(true);
  },
  exit(ctx, h) {
    h.view.setVisible(false);
    h.members.setVisible(false);
  },
  syncViews(s, c, ctx) {
    const { view, members } = ctx.handle;
    const y = (x) => s.d / 4 + (4 * s.d * x * x) / (s.L * s.L);
    view.syncCurve('curve', y, -s.L / 2, s.L / 2);
    view.syncPath(
      'poly',
      Array.from({ length: s.n + 1 }, (_, i) => ({
        x: -s.L / 2 + (i * s.L) / s.n,
        y: y(-s.L / 2 + (i * s.L) / s.n),
      })),
    );
    const points = [];
    for (let i = 0; i <= 12; i++) {
      const x = -s.L / 2 + (i * s.L) / 12;
      points.push({ x, y: 0 }, { x, y: y(x) }, { x, y: 0 });
    }
    points.push(
      { x: -s.L / 2, y: 0 },
      { x: -s.L / 2, y: 1.4 * s.d },
      { x: -s.L / 2, y: 0 },
      { x: s.L / 2, y: 0 },
      { x: s.L / 2, y: 1.4 * s.d },
    );
    members.syncPath('poly', points);
    members.poly.material.color.setHex(0xcccccc);
  },
  law: () => [String.raw`y=y_0+4dx^2/L^2`, String.raw`\ell=\int_{-L/2}^{L/2}\sqrt{1+(8dx/L^2)^2}\,dx`],
  liveRows: (s, c) =>
    kv('span', `${fmtPlain(s.L)} m`) +
    kv('assumed sag', `${fmtPlain(s.d)} m`) +
    kv('cable length', `${fmtPlain(c.length)} m`) +
    kv('extra beyond span', `${fmtPlain(c.extra)} m`) +
    kv('polygon shortfall', `${fmtPlain(c.error)} m`),
  readout: (s, c) =>
    cells([
      ['cable', `${fmtPlain(c.length)} m`],
      ['extra', `${fmtPlain(c.extra)} m`],
      ['polygon', `${fmtPlain(c.polygon)} m`],
      ['shortfall', `${fmtPlain(c.error)} m`],
    ]),
  coach: () => ({
    title: 'Sag adds a slant, not another vertical leg',
    body: [
      'For each horizontal strip, the cable uses √(1+y′²) times its width. Connecting sampled points gives chords, whose total is below the smooth cable length. More segments improve this approximation without changing the cable.',
      'The Golden Gate Bridge district lists the main span as 4,200 ft (rounded there to 1,280 m). This lab converts 4,200 ft using the exact foot definition: 1,280.16 m. <a href="https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/" target="_blank" rel="noopener">Official design statistics</a>. The 50 m and 100 m sags are chosen assumptions, not as-built measurements.',
      '<b>What the course model leaves out.</b> The shape assumes equal-height supports and uniform deck load per horizontal metre. Cable self-weight instead leads to a catenary. Stretch, temperature, wind, unequal loads, anchors, strength and safety margins are excluded. The drawing is a schematic single cable.',
    ],
  }),
});
