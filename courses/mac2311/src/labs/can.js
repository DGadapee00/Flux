/** Shows that the least-metal can does not have the smallest radius, and a lid changes the optimum. */
import * as THREE from 'three';
import { cylinderDesign } from '@flux/subjects/math/containers.js';
import { sceneScale } from '../engine/frame.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { defineLab } from './define.js';
const SCENARIOS = [
  { id: 'closed', name: '330 mL drink can · two ends', V: 330, r: 3.3, k: 2 },
  { id: 'open', name: '330 mL open cup · one end', V: 330, r: 3.3, k: 1 },
  { id: 'design', name: '500 mL teaching design · two ends', V: 500, r: 4, k: 2 },
];
export default defineLab({
  id: 'can',
  exam: 'c2',
  title: 'Drink can',
  orbit: true,
  frame: true,
  extent: (s) => Math.max(s.r * 3, cylinderDesign(s.V, s.r, s.k).h),
  camera: { pos: new THREE.Vector3(3, 2, 16), target: new THREE.Vector3(0, 0, 0) },
  hint: 'Change radius while holding volume fixed. The can must get taller or shorter.',
  scenarios: SCENARIOS,
  defaultState: () => ({ ...SCENARIOS[0], scenarioId: 'closed', view: { plane: 'xy', upm: 0.25 }, show: {} }),
  applyScenario(id, s) {
    const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    Object.assign(s, sc, { scenarioId: sc.id });
  },
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Radius r (cm)</span><div class="slider-row"><input id="can-r" type="range" min="1.5" max="7" step="0.05"></div></label></div>`,
  bind(api) {
    document.getElementById('can-r').addEventListener('input', (e) => {
      api.slice().r = Number(e.target.value);
      api.bump();
      api.fitView?.();
    });
  },
  syncControls(s) {
    document.getElementById('can-r').value = s.r;
  },
  recompute(s, c) {
    Object.assign(c, cylinderDesign(s.V, s.r, s.k));
    c.heightSlope = (-2 * c.h) / s.r;
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const side = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x58c4dd, wireframe: true, transparent: true, opacity: 0.35 }),
    );
    group.add(side);
    const ends = [-1, 1].map(() => {
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(1, 48),
        new THREE.MeshBasicMaterial({
          color: 0xf4d345,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
      return mesh;
    });
    return { group, side, ends };
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
    h.side.scale.set(s.r * u, c.h * u, s.r * u);
    h.ends.forEach((end, i) => {
      end.scale.setScalar(s.r * u);
      end.position.y = ((i ? 1 : -1) * c.h * u) / 2;
      end.visible = !i || s.k === 2;
    });
  },
  law: () => ['h=V/(\\pi r^2)', 'A=2V/r+k\\pi r^2', "A'=-2V/r^2+2k\\pi r"],
  liveRows: (s, c) =>
    kv('capacity', `${fmt(s.V)} cm³`) +
    kv('height', `${fmt(c.h)} cm`) +
    kv('area', `${fmt(c.area)} cm²`) +
    kv('dA/dr', `${fmt(c.slope)} cm`),
  readout: (s, c) =>
    cells([
      ['height', `${fmt(c.h)} cm`],
      ['least-area radius', `${fmt(c.optR)} cm`],
      ['area excess', `${fmt(c.excess)}%`],
    ]),
  coach: (s, c) => ({
    title: 'A constraint changes the optimization',
    body: [
      'The volume constraint removes height as an independent variable. The wall area is 2V/r, while the circular ends cost kπr². A larger radius saves wall area but adds end area.',
      `At the unique minimum, r³=V/(kπ) and h=kr. Here k=${s.k}. Check both the derivative and the end behavior: the area grows without bound for very small or very large radii.`,
      'The 330 mL capacity follows the Coca-Cola GB’s linked 330 mL can listing; 1 mL equals 1 cm³. The chosen radius is a teaching input, not a measured product dimension. The 500 mL preset is a hypothetical design. <a href="https://www.yourcoca-cola.co.uk/coca-cola-lemon-24-x-330ml/15227578.html" target="_blank" rel="noopener">Package source</a>.',
      '<b>What the course model leaves out.</b> Uniform sheet thickness, flat ends and a perfect cylinder replace the rolled rim, concave base, opening and neck. Strength, stacking, grip and manufacturing can favor a taller commercial can. Material mass is proportional to area only under the uniform-thickness assumption.',
    ],
  }),
});
