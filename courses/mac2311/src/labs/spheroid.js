/** Shows that a midpoint disk stack overestimates a smooth spheroid, and radial and axial scaling differ. */
import * as THREE from 'three';
import { spheroid } from '@flux/subjects/math/spheroid.js';
import { sceneScale } from '../engine/frame.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { defineLab } from './define.js';
const SCENARIOS = [
  { id: 'oblate', name: 'Equatorial radius 2 · half-height 1', a: 2, c: 1, n: 8 },
  { id: 'sphere', name: 'Unit sphere', a: 1, c: 1, n: 8 },
  { id: 'prolate', name: 'Equatorial radius 1 · half-height 2', a: 1, c: 2, n: 8 },
];
export default defineLab({
  id: 'spheroid',
  exam: 'c3',
  title: 'Spheroid slices',
  frame: true,
  orbit: true,
  extent: (s) => 2 * Math.max(s.a, s.c),
  camera: { pos: new THREE.Vector3(3, 2, 16), target: new THREE.Vector3(0, 0, 0) },
  hint: 'Equal-height disks approximate a changing circular cross-section. Lengths use one consistent unit.',
  scenarios: SCENARIOS,
  defaultState: () => ({ ...SCENARIOS[0], scenarioId: 'oblate', view: { plane: 'xy', upm: 0.5 }, show: {} }),
  applyScenario(id, s) {
    const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    Object.assign(s, sc, { scenarioId: sc.id });
  },
  controls: () =>
    `<div class="lab-block">${[
      ['a', 'Equatorial radius a', 0.5, 3, 0.1],
      ['c', 'Half-height c', 0.5, 3, 0.1],
      ['n', 'Axial slices', 2, 20, 1],
    ]
      .map(
        ([id, label, min, max, step]) =>
          `<label class="field"><span>${label}</span><div class="slider-row"><input id="sph-${id}" type="range" min="${min}" max="${max}" step="${step}"></div></label>`,
      )
      .join('')}</div>`,
  bind(api) {
    for (const k of ['a', 'c', 'n'])
      document.getElementById(`sph-${k}`).addEventListener('input', (e) => {
        api.slice()[k] = Number(e.target.value);
        api.bump();
        api.fitView?.();
      });
  },
  syncControls(s) {
    for (const k of ['a', 'c', 'n']) document.getElementById(`sph-${k}`).value = s[k];
  },
  recompute(s, c) {
    s.n = Math.max(2, Math.round(s.n));
    Object.assign(c, spheroid(s.a, s.c, s.n));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0x58c4dd, transparent: true, opacity: 0.25, wireframe: true }),
    );
    group.add(shell);
    const disks = new THREE.Group();
    group.add(disks);
    return { group, shell, disks, key: '' };
  },
  enter(ctx, h) {
    h.group.visible = true;
  },
  exit(ctx, h) {
    h.group.visible = false;
  },
  syncViews(s, c, ctx) {
    const h = ctx.handle,
      u = sceneScale();
    h.shell.scale.set(s.a * u, s.c * u, s.a * u);
    const key = [s.a, s.c, s.n, u].join('|');
    if (h.key === key) return;
    h.key = key;
    for (const m of [...h.disks.children]) {
      m.geometry.dispose();
      m.material.dispose();
      h.disks.remove(m);
    }
    const dz = (2 * s.c) / s.n;
    for (let i = 0; i < s.n; i++) {
      const z = -s.c + (i + 0.5) * dz,
        r = s.a * Math.sqrt(1 - (z * z) / (s.c * s.c)),
        m = new THREE.Mesh(
          new THREE.CylinderGeometry(r * u, r * u, dz * 0.4 * u, 32),
          new THREE.MeshBasicMaterial({ color: 0xf4d345, transparent: true, opacity: 0.6 }),
        );
      m.position.y = z * u;
      h.disks.add(m);
    }
  },
  law: () => ['A(z)=\\pi a^2(1-z^2/c^2)', 'V=\\int_{-c}^c A(z)\\,dz=4\\pi a^2c/3'],
  liveRows: (s, c) =>
    kv('exact volume', fmt(c.volume)) + kv('disk sum', fmt(c.midpoint)) + kv('sum − volume', fmt(c.error)),
  readout: (s, c) =>
    cells([
      ['volume', fmt(c.volume)],
      ['disk sum', fmt(c.midpoint)],
      ['excess', fmt(c.error)],
    ]),
  coach: () => ({
    title: 'A two-dimensional radius enters twice',
    body: [
      'A slice at height z is a disk of radius a√(1−z²/c²). Squaring this radius gives its cross-sectional area. Integrating from −c to c produces 4πa²c/3.',
      'The area profile is concave downward. A midpoint rectangle overestimates its area, so this midpoint disk stack exceeds the true volume. Refining the stack reduces that excess.',
      'The oblate preset checks 18.01SC, Fall 2010, Session 58, Volume of a Spheroid: 16π/3. The remaining axis choices are teaching variants.',
    ],
  }),
});
