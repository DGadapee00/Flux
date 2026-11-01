/** Shows that accumulated rainfall differs from its current rate, and a full barrel can stop accumulating while rain continues. */
import * as THREE from 'three';
import { M3_PER_GAL_US } from '@flux/subjects/convert.js';
import { rainBarrel } from '@flux/subjects/math/rain-barrel.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt, fmtPlain } from '@flux/shells/math/format.js';
import { defineLab } from './define.js';
const CAPACITY = 50 * M3_PER_GAL_US * 1000;
const SCENARIOS = [
  { id: 'ramp', name: 'Rising inflow · 20 minute storm', profile: 'ramp', peak: 20, T: 20, t: 10 },
  { id: 'sine', name: 'Half-sine storm · overflow by the end', profile: 'sine', peak: 20, T: 20, t: 20 },
  { id: 'full', name: 'Steady rain · barrel already full', profile: 'steady', peak: 20, T: 20, t: 15 },
];
export default defineLab({
  id: 'barrel',
  exam: 'c3',
  title: 'Rain barrel',
  frame: false,
  orbit: true,
  camera: { pos: new THREE.Vector3(3, 2, 16), target: new THREE.Vector3(0, 0, 0) },
  hint: 'A schematic barrel. The water level shows stored volume / capacity; rate is in L/min.',
  scenarios: SCENARIOS,
  defaultState: () => ({ ...SCENARIOS[0], scenarioId: 'ramp', capacity: CAPACITY, initial: 0, show: {} }),
  applyScenario(id, s) {
    const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    Object.assign(s, sc, { scenarioId: sc.id, capacity: CAPACITY, initial: 0 });
  },
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Time t (min)</span><div class="slider-row"><input id="barrel-t" type="range" min="0" max="25" step="0.1"></div></label><label class="field"><span>Peak inflow (L/min)</span><div class="slider-row"><input id="barrel-peak" type="range" min="5" max="40" step="1"></div></label></div>`,
  bind(api) {
    for (const key of ['t', 'peak'])
      document.getElementById(`barrel-${key}`).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump();
      });
  },
  syncControls(s) {
    for (const key of ['t', 'peak']) document.getElementById(`barrel-${key}`).value = s[key];
  },
  recompute(s, c) {
    Object.assign(c, rainBarrel(s));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2.2, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x58c4dd, wireframe: true, transparent: true, opacity: 0.2 }),
    );
    group.add(wall);
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.77, 0.77, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0x58c4dd, transparent: true, opacity: 0.65 }),
    );
    group.add(water);
    const makeLine = (points, color) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))),
        new THREE.LineBasicMaterial({ color }),
      );
      group.add(line);
      return line;
    };
    const inflow = makeLine(
        [
          [0, 2, 0],
          [0, 1.1, 0],
        ],
        0xf4d345,
      ),
      overflow = makeLine(
        [
          [0.8, 1.05, 0],
          [1.1, 0.8, 0],
          [1.1, -1.1, 0],
        ],
        0x58c4dd,
      );
    return { group, water, inflow, overflow };
  },
  enter(ctx, h) {
    h.group.visible = true;
  },
  exit(ctx, h) {
    h.group.visible = false;
  },
  syncViews(s, c, ctx) {
    const h = ctx.handle;
    h.water.visible = c.fraction > 0;
    h.water.scale.y = 2.2 * c.fraction;
    h.water.position.y = -1.1 + 1.1 * c.fraction;
    h.inflow.visible = c.flow > 0;
    h.overflow.visible = c.spill > 0 && c.flow > 0;
  },
  law: () => ['V_{in}(t)=\\int_0^t q(s)\\,ds', 'V=\\min(C,V_0+V_{in})', 'V_{spill}=\\max(0,V_0+V_{in}-C)'],
  liveRows: (s, c) =>
    kv('capacity', `${fmtPlain(s.capacity)} L`) +
    kv('inflow now', `${fmtPlain(c.flow)} L/min`) +
    kv('delivered', `${fmtPlain(c.delivered)} L`) +
    kv('stored', `${fmtPlain(c.stored)} L`) +
    kv('overflow', `${fmtPlain(c.spill)} L`),
  readout: (s, c) =>
    cells([
      ['inflow', `${fmtPlain(c.flow)} L/min`],
      ['stored', `${fmtPlain(c.stored)} L`],
      ['storage rate', `${fmtPlain(c.storageRate)} L/min`],
      ['overflow', `${fmtPlain(c.spill)} L`],
    ]),
  coach: (s, c) => ({
    title: 'A rate is not the water already collected',
    body: [
      'The inlet rate is the height of a flow graph. The volume delivered is its signed area. These storms have nonnegative rates, so delivered volume cannot decrease.',
      'The valve is closed. Before the barrel fills, the derivative of stored volume equals inlet flow. Once full, continuing inflow spills instead: stored volume has zero derivative. Stored plus spilled water still equals initial water plus delivered water.',
      'Capacity: Good Ideas Rain Wizard 50, nominal 50 US gallons, converted with the exact US-gallon definition. Storm peak flows, durations and initial water are chosen teaching inputs, not observed weather. <a href="https://goodideasinc.com/products/rain-wizard-50" target="_blank" rel="noopener">Product specification</a>.',
      '<b>What the course model leaves out.</b> The model prescribes inlet flow and assumes instantaneous, unlimited overflow. It ignores roof losses, gutter capacity, filters, leaks, evaporation and water drawn from the tap. The cylinder is schematic; its shape does not claim the product’s measured dimensions.',
    ],
  }),
});
