/** Shows that inner and outer points share a revolution time but have different linear speeds; changing RPM does not change a circle's tangent at a fixed angle. */
import * as THREE from 'three';
import { turntable } from '@flux/subjects/math/turntable.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { sceneScale } from '../engine/frame.js';
import { defineLab } from './define.js';
const SCENARIOS = [
  { id: 'lp', name: '33⅓ RPM · outer teaching point', rpm: 100 / 3, r: 0.14, t: 0.45 },
  { id: 'single', name: '45 RPM · same angle', rpm: 45, r: 0.14, t: 1 / 3 },
  { id: 'inner', name: '33⅓ RPM · inner teaching point', rpm: 100 / 3, r: 0.07, t: 0.45 },
];
const apply = (id, s) =>
  Object.assign(s, SCENARIOS.find((x) => x.id === id) || SCENARIOS[0], {
    scenarioId: id,
    theta0: 0,
    show: {},
  });
export default defineLab({
  id: 'record',
  exam: 'c5',
  title: 'Record player',
  frame: true,
  extent: () => 0.23,
  orbit: false,
  cameraFor() {
    const z = typeof window !== 'undefined' && window.innerWidth <= 720 ? 22 : 14;
    return { pos: new THREE.Vector3(0, 0, z), target: new THREE.Vector3(0, 0, 0) };
  },
  camera: { pos: new THREE.Vector3(0, 0, 16), target: new THREE.Vector3(0, 0, 0) },
  hint: 'Schematic top view; axes are metres. The gold arrow shows relative velocity. Time is seconds.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('lp', s);
    return s;
  },
  applyScenario: apply,
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Radius (m)</span><div class="slider-row"><input id="record-r" type="range" min="0.03" max="0.14" step="0.005"></div></label><label class="field"><span>Time (s)</span><div class="slider-row"><input id="record-t" type="range" min="0" max="1.8" step="0.01"></div></label><label class="field"><span>Speed</span><select id="record-rpm"><option value="33.333333333333336">33⅓ RPM</option><option value="45">45 RPM</option></select></label></div>`,
  bind(api) {
    for (const k of ['r', 't', 'rpm'])
      document.getElementById('record-' + k).addEventListener('input', (e) => {
        api.slice()[k] = Number(e.target.value);
        api.bump();
      });
  },
  syncControls(s) {
    for (const k of ['r', 't', 'rpm']) document.getElementById('record-' + k).value = s[k];
  },
  recompute(s, c) {
    Object.assign(c, turntable(s.r, s.rpm, s.t, s.theta0));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const platter = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 96),
      new THREE.MeshBasicMaterial({ color: 0x15343c, side: THREE.DoubleSide }),
    );
    group.add(platter);
    for (const r of [0.8, 1.4, 2.3]) {
      const pts = Array.from(
        { length: 97 },
        (_, i) =>
          new THREE.Vector3(r * Math.cos((2 * Math.PI * i) / 96), r * Math.sin((2 * Math.PI * i) / 96), 0.02),
      );
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x58c4dd, transparent: true, opacity: 0.45 }),
        ),
      );
    }
    const arm = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(2.5, 2.4, 0.05),
        new THREE.Vector3(1.7, 1.7, 0.05),
        new THREE.Vector3(1.5, 0.5, 0.05),
      ]),
      new THREE.LineBasicMaterial({ color: 0xcccccc }),
    );
    group.add(arm);
    const mark = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 24),
      new THREE.MeshBasicMaterial({ color: 0xf4d345 }),
    );
    mark.position.z = 0.08;
    group.add(mark);
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(),
      1,
      0xf4d345,
      0.2,
      0.12,
    );
    group.add(arrow);
    return { group, mark, arrow };
  },
  enter(ctx, h) {
    h.group.visible = true;
  },
  exit(ctx, h) {
    h.group.visible = false;
  },
  syncViews(s, c, ctx) {
    const h = ctx.handle,
      scale = 15;
    h.group.scale.setScalar(sceneScale() / 15);
    h.mark.position.set(c.x * scale, c.y * scale, 0.08);
    h.arrow.position.copy(h.mark.position);
    h.arrow.setDirection(new THREE.Vector3(c.vx, c.vy, 0).normalize());
    h.arrow.setLength((0.6 * c.speed) / turntable(0.14, 100 / 3, 0).speed, 0.18, 0.1);
  },
  law: () => [
    String.raw`\theta=\omega t,\quad (x,y)=(r\cos\theta,r\sin\theta)`,
    String.raw`(\dot x,\dot y)=(-r\omega\sin\theta,r\omega\cos\theta)`,
    String.raw`v=r\omega,\quad T=2\pi/\omega`,
  ],
  liveRows: (s, c) =>
    kv('angle', `${fmt(c.theta)} rad`) +
    kv('speed', `${fmt(c.speed)} m/s`) +
    kv('period', `${fmt(c.period)} s`) +
    kv('path distance', `${fmt(c.distance)} m`) +
    kv('swept area', `${fmt(c.area)} m²`) +
    kv('tangent slope', c.slope == null ? 'vertical' : fmt(c.slope)),
  readout: (s, c) =>
    cells([
      ['speed', `${fmt(c.speed)} m/s`],
      ['period', `${fmt(c.period)} s`],
      ['distance', `${fmt(c.distance)} m`],
      ['area', `${fmt(c.area)} m²`],
    ]),
  coach: () => ({
    title: 'One angular speed, many linear speeds',
    body: [
      'The gold mark is a material point on a rigid record, viewed from above. The gold tangent arrow shows velocity direction and relative speed. The fixed tonearm is schematic; the mark is not the stylus. Inner points travel shorter circles in the same revolution time.',
      'Audio-Technica specifies 33⅓ and 45 RPM for the AT-LP60X. <a href="https://www.audio-technica.com/en-us/at-lp60x" target="_blank" rel="noopener">Manufacturer specifications</a>. The 0.14 m and 0.07 m marked radii are chosen teaching inputs, not measured groove or stylus dimensions. Angles start at the positive x direction and increase counterclockwise; this mathematical orientation does not claim the product’s playing direction.',
      '<b>What the course model leaves out.</b> The record is rigid and spins at exactly constant RPM. Belt compliance, startup, wow, flutter, eccentric grooves and the stylus’s slow inward spiral are excluded. Area is accumulated sector area; after one turn it counts covered regions again.',
    ],
  }),
});
