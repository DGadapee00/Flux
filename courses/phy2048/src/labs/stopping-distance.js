/**
 * Application lab: a car braking on a dry and a wet road, with a driver who takes time to react.
 *
 * Shows that stopping distance grows with the square of the speed, while the reaction distance is
 * the part that grows only with the speed, and that a slick road lengthens only the braking part.
 *
 * Numbers: OpenStax University Physics Vol. 1 §3.4, example "How Far Does a Car Go?": 30.0 m/s,
 * deceleration 7.00 m/s² on dry concrete and 5.00 m/s² on wet, reaction time 0.500 s. The book's
 * answers are 64.3 m and 90.0 m braking, plus 15.0 m of reaction, so 79.3 m and 105 m in all.
 * The closed form is d = v t_r + v²/(2a). The check steps the stop in small time steps instead.
 */
import * as THREE from 'three';
import { stoppingDistance } from '@flux/subjects/mechanics/kinematics.js';
import { M, createGraph, dot, fatLine, label, niceStep, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'dry', name: 'Dry concrete, 30 m/s', v0: 30, a: 7, tr: 0.5 },
  { id: 'wet', name: 'Wet concrete, 30 m/s', v0: 30, a: 5, tr: 0.5 },
  { id: 'slow', name: 'Dry concrete, 15 m/s', v0: 15, a: 7, tr: 0.5 },
];

const ROAD_W = 11.4;
const ROAD_Y = 3.6;

export default defineLab({
  id: 'stopping-distance',
  exam: 'u1',
  title: 'Stopping distance',
  app: true,
  hint: 'A driver sees a red light. Set the speed, the road and the reaction time.',
  orbit: false,
  fit: { w: 12.8, h: 10.6 },
  camera: { pos: new THREE.Vector3(0, 0.4, 22), target: new THREE.Vector3(0, 0.4, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'sd-speed',
      scenario: 'slow',
      ask: 'Double the speed, from $15$ to $30\\ \\mathrm{m/s}$, on the same dry road. What happens to the two parts of the stop?',
      apply(s) { s.v0 = 30; },
      watch: [
        { id: 'braking', label: 'the braking distance', get: (c) => c.braking, mode: 'factor' },
        { id: 'reaction', label: 'the distance while the driver reacts', get: (c) => c.reaction, mode: 'factor' },
      ],
      expect: { braking: 4, reaction: 2 },
      why: String.raw`While the driver reacts the car holds its speed, so that distance is $v t_r$ and doubles. Braking removes $\tfrac12 m v^2$ of kinetic energy at a steady rate, so the distance is $v^2/(2a)$ and quadruples.`,
    },
    {
      id: 'sd-wet',
      scenario: 'dry',
      ask: 'It rains. The road changes from dry ($7.00\\ \\mathrm{m/s^2}$) to wet ($5.00\\ \\mathrm{m/s^2}$). What happens to the two parts of the stop?',
      apply(s) { s.a = 5; },
      watch: [
        { id: 'reaction', label: 'the distance while the driver reacts', get: (c) => c.reaction },
        { id: 'braking', label: 'the braking distance', get: (c) => c.braking },
      ],
      mode: 'dir',
      expect: { reaction: 'same', braking: 'bigger' },
      why: String.raw`The driver reacts before the brakes touch the road, so the road cannot change that distance. Braking distance is $v^2/(2a)$, and a smaller $a$ makes it longer.`,
    },
    {
      id: 'sd-react',
      scenario: 'dry',
      ask: 'The driver is distracted, and the reaction time grows from $0.5$ to $1.5\\ \\mathrm{s}$. What happens to the two parts?',
      apply(s) { s.tr = 1.5; },
      watch: [
        { id: 'reaction', label: 'the distance while the driver reacts', get: (c) => c.reaction, mode: 'factor' },
        { id: 'braking', label: 'the braking distance', get: (c) => c.braking, mode: 'factor' },
      ],
      factors: [1, 2, 3, 4],
      expect: { reaction: 3, braking: 1 },
      why: String.raw`The car travels at $30\ \mathrm{m/s}$ for the whole reaction time, so three times the time is three times the distance. Braking starts at the same speed with the same $a$, so its distance does not change at all.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('dry', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('sd-v', 'Speed (m/s)', 30, 5, 40, 1)}${sliderRow('sd-a', 'Braking deceleration (m/s²)', 7, 1, 9, 0.25)}${sliderRow('sd-tr', 'Reaction time (s)', 0.5, 0, 2.5, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'sd-v', (s, v) => { s.v0 = v; });
    bindSlider(api, 'sd-a', (s, v) => { s.a = v; });
    bindSlider(api, 'sd-tr', (s, v) => { s.tr = v; });
  },
  syncControls(state) {
    putSlider('sd-v', state.v0, 0);
    putSlider('sd-a', state.a, 2);
    putSlider('sd-tr', state.tr, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const road = fatLine([-ROAD_W / 2, ROAD_Y, 0, ROAD_W / 2, ROAD_Y, 0], { color: M.greyDark, width: 2 });
    const reactionBar = fatLine([0, 0, 0, 1, 0, 0], { color: QUANTITY_COLORS.mark, width: 11 });
    const brakingBar = fatLine([0, 0, 0, 1, 0, 0], { color: QUANTITY_COLORS.a, width: 11 });
    const stopLine = fatLine([0, ROAD_Y - 0.5, 0, 0, ROAD_Y + 0.3, 0], { color: M.white, width: 2.5 });
    const car = dot(M.blue, 0.2);
    const ticks = Array.from({ length: 9 }, () => label('', 0, 0, 0, 'graph-tick x'));
    const reactionLabel = label('', 0, ROAD_Y + 0.7, 0, 'graph-axis');
    const brakingLabel = label('', 0, ROAD_Y + 0.7, 0, 'graph-axis');
    const stopLabel = label('', 0, ROAD_Y + 1.25, 0, 'graph-axis');
    const startLabel = label('light turns red', -ROAD_W / 2 + 1.05, ROAD_Y + 1.25, 0, 'graph-axis');
    group.add(road, reactionBar, brakingBar, stopLine, car, reactionLabel, brakingLabel, stopLabel, startLabel, ...ticks);
    const graph = createGraph(group, { x: -ROAD_W / 2, y: -3.4, w: ROAD_W, h: 3.4, color: QUANTITY_COLORS.v, name: String.raw`<i>v</i> (m/s)`, xName: 'time <i>t</i> (s)' });
    group.visible = false;
    return { group, road, reactionBar, brakingBar, stopLine, car, ticks, reactionLabel, brakingLabel, stopLabel, graph };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const r = stoppingDistance({ v0: state.v0, a: state.a, tReact: state.tr });
    computed.reaction = r.reaction;
    computed.braking = r.braking;
    computed.total = r.total;
    computed.tBrake = r.tBrake;
    computed.tTotal = r.tTotal;
    computed.kmh = state.v0 * 3.6;
    // The same stop as the area under the velocity graph.
    computed.area = state.v0 * state.tr + 0.5 * state.v0 * r.tBrake;
  },
  second(state) {
    // A time-stepped stop: constant speed while the driver reacts, then constant deceleration to rest.
    const h = 1e-5;
    let x = 0;
    let v = state.v0;
    let t = 0;
    let xReact = 0;
    while (v > 0) {
      const a = t < state.tr - 1e-12 ? 0 : -state.a;
      const next = Math.max(0, v + a * h);
      x += 0.5 * (v + next) * h;
      if (t < state.tr - 1e-12) xReact = x;
      v = next;
      t += h;
    }
    return { total: x, reaction: xReact, braking: x - xReact };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const L = Math.max(10, niceStep(computed.total * 1.1, 1) * Math.ceil((computed.total * 1.1) / niceStep(computed.total * 1.1, 1)));
    const sx = (m) => -ROAD_W / 2 + (m / L) * ROAD_W;
    const xr = sx(computed.reaction);
    const xs = sx(computed.total);
    updateFatLine(h.reactionBar, [sx(0), ROAD_Y, 0.02, xr, ROAD_Y, 0.02]);
    updateFatLine(h.brakingBar, [xr, ROAD_Y, 0.02, xs, ROAD_Y, 0.02]);
    updateFatLine(h.stopLine, [xs, ROAD_Y - 0.5, 0, xs, ROAD_Y + 0.3, 0]);
    h.car.position.set(sx(0), ROAD_Y, 0.05);
    h.reactionLabel.element.innerHTML = computed.reaction > 0.3 ? `reaction ${fmt(computed.reaction, 3)} m` : '';
    h.reactionLabel.position.set(sx(computed.reaction / 2), ROAD_Y - 0.55, 0);
    h.brakingLabel.element.innerHTML = `braking ${fmt(computed.braking, 3)} m`;
    h.brakingLabel.position.set((xr + xs) / 2, ROAD_Y - 0.55, 0);
    h.stopLabel.element.innerHTML = `stops after ${fmt(computed.total, 3)} m`;
    h.stopLabel.position.set(Math.min(xs, ROAD_W / 2 - 1.4), ROAD_Y + 1.15, 0);
    const step = niceStep(L, 5);
    h.ticks.forEach((t, i) => {
      const m = i * step;
      t.visible = m <= L + 1e-9;
      t.element.textContent = `${m}`;
      t.position.set(sx(m), ROAD_Y + 0.5, 0);
    });
    h.graph.set({
      t0: 0,
      t1: computed.tTotal * 1.04,
      lo: -state.v0 * 0.06,
      hi: state.v0 * 1.12,
      f: (t) => (t < state.tr ? state.v0 : Math.max(0, state.v0 - state.a * (t - state.tr))),
    });
    h.graph.mark(computed.tTotal, 0);
  },
  law: () => [
    String.raw`d = v\,t_r + \dfrac{v^2}{2a}`,
    String.raw`0 = v^2 - 2a\,d_{\text{braking}}`,
  ],
  readoutCells(state, computed) {
    return [
      ['Total stopping distance', `${fmt(computed.total, 3)} m`],
      ['Braking distance', `${fmt(computed.braking, 3)} m`],
      ['Distance during the reaction', `${fmt(computed.reaction, 3)} m`],
      ['Time to stop', `${fmt(computed.tTotal, 3)} s`],
      ['Speed', `${fmt(computed.kmh, 3)} km/h`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'A car braking at a red light',
      body: [
        String.raw`For the first $${fmt(state.tr, 3)}$ s the driver has not yet touched the brake, so the car keeps its speed and covers $v t_r = ${fmt(computed.reaction, 3)}$ m. Then the brakes slow it at a steady $a$. Setting the final speed to zero in $v^2 = v_0^2 - 2 a d$ gives the braking distance $v_0^2/(2a) = ${fmt(computed.braking, 3)}$ m. The area under the velocity graph is the whole stop, ${fmt(computed.area, 3)} m.`,
        String.raw`Speed enters the two parts differently. The reaction part grows with the speed. The braking part grows with its square, so a car at twice the speed needs four times the braking distance. That is why the speed limit near a school is low.`,
        String.raw`<b>What the course model leaves out.</b> The deceleration here is a constant, taken from the book's example. On a real road it is set by the friction between tyre and road, so it changes with the tyres, the surface and the slope, and it fades if the brakes overheat. Air drag helps a little at highway speed. Driver reaction time is not one number: it is about half a second for an alert driver and longer for a tired or distracted one. The 7.00 and 5.00 m/s² are the book's dry and wet values.`,
      ],
    };
  },
});
