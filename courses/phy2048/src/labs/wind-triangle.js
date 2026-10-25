/**
 * Application lab: a pilot who must fly a set course in a wind.
 *
 * Shows that to hold a track you point the nose into the wind, by an angle set by the crosswind
 * alone, and that a crosswind costs ground speed too, because part of the airspeed is spent
 * cancelling it.
 *
 * Numbers: OpenStax University Physics Vol. 1 §4.5, "Flying a Plane in a Wind": 300 km/h in still
 * air, a 90 km/h wind from the northeast, a track due north. The book prints a heading 12° east of
 * north and a ground speed of 230 km/h; unrounded they are 12.25° and 229.5 km/h. A Cessna 172
 * cruises at about 120 kn true airspeed (Cessna 172S Pilot's Operating Handbook, cruise
 * performance). An airliner such as the Boeing 737-800 cruises at Mach 0.785, about 450 kn at
 * 35 000 ft (Boeing 737 airport planning document), where the jet stream can blow at 150 kn and
 * more (NOAA National Weather Service, JetStream). The closed form is `headingForTrack`, by
 * components. The check is the pilot's sine rule: sin(WCA) = crosswind / airspeed, and
 * ground speed = airspeed · cos(WCA) − headwind.
 */
import * as THREE from 'three';
import { MPS_PER_KMH, MPS_PER_KNOT } from '@flux/subjects/convert.js';
import { headingForTrack } from '@flux/subjects/mechanics/kinematics.js';
import { fromAngle2D } from '@flux/subjects/mechanics/vectors.js';
import { Arrow, M, label, labelBeside, placeArrow, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const FRAME = M.teal;
const RESULT = M.gold;
/** Knots to km/h, through the exact definitions. */
const kn = (x) => Number(((x * MPS_PER_KNOT) / MPS_PER_KMH).toFixed(1));

const SCENARIOS = [
  { id: 'book', name: 'The book’s plane: 300 km/h, wind from the northeast', air: 300, wind: 90, from: 45, track: 0, leg: 300 },
  { id: 'cessna', name: 'A Cessna 172 in a 20 kn crosswind', air: kn(120), wind: kn(20), from: 270, track: 0, leg: 150 },
  { id: 'airliner', name: 'An airliner into a 150 kn jet stream', air: kn(450), wind: kn(150), from: 270, track: 270, leg: 1000 },
];

/** Compass bearing (clockwise from north) to the lab's math angle (counterclockwise from east), and back. */
const toMath = (bearing) => 90 - bearing;
const toBearing = (deg) => ((((90 - deg) % 360) + 360) % 360);
const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

/** The wind as a velocity: it blows toward the bearing opposite the one it comes from. */
const windVector = (s) => fromAngle2D(s.wind, toMath(s.from + 180));

export default defineLab({
  id: 'wind-triangle',
  exam: 'u2',
  title: 'Wind triangle',
  app: true,
  hint: 'Set the airspeed, the wind and the course. The lab finds the heading that holds the course.',
  orbit: false,
  fit: { w: 12, h: 10.6 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'wt-headwind',
      scenario: 'book',
      ask: String.raw`The same $90\ \mathrm{km/h}$ wind swings round to blow from due north, straight down the course. What happens to the correction the pilot needs and to the ground speed?`,
      apply(s) { s.from = 0; },
      watch: [
        { id: 'correction', label: 'the heading correction', get: (c) => c.correction },
        { id: 'ground', label: 'the ground speed', get: (c) => c.ground },
      ],
      mode: 'dir',
      expect: { correction: 'smaller', ground: 'smaller' },
      why: String.raw`The correction cancels the crosswind, and a wind straight down the course has none, so the nose points due north. All $90\ \mathrm{km/h}$ now pushes against the plane: $300 - 90 = 210\ \mathrm{km/h}$, down from $229.5$.`,
    },
    {
      id: 'wt-crosswind',
      scenario: 'cessna',
      ask: String.raw`The Cessna flies at $222\ \mathrm{km/h}$ through the air, and the wind blows straight across its course. The wind neither helps nor hinders along the course. Is the ground speed equal to the airspeed?`,
      apply() {},
      watch: [{ id: 'equal', label: 'the ground speed equals the airspeed', get: (c, s) => Math.abs(c.ground - s.air) < 1e-6, mode: 'bool' }],
      expect: { equal: false },
      why: String.raw`To hold the course the nose turns into the wind, so part of the airspeed points across the course to cancel the wind. Only $v_{\text{air}}\cos(\text{WCA})$ is left along it: $\sqrt{222.2^2 - 37.0^2} = 219.1\ \mathrm{km/h}$. A crosswind always costs some ground speed.`,
    },
    {
      id: 'wt-turn',
      scenario: 'airliner',
      ask: String.raw`The jet stream turns to blow from the south, straight across the westbound course, at the same $278\ \mathrm{km/h}$. What happens to the ground speed and to the heading correction?`,
      apply(s) { s.from = 180; },
      watch: [
        { id: 'ground', label: 'the ground speed', get: (c) => c.ground },
        { id: 'correction', label: 'the heading correction', get: (c) => c.correction },
      ],
      mode: 'dir',
      expect: { ground: 'bigger', correction: 'bigger' },
      why: String.raw`Head on, the whole wind subtracts: $833 - 278 = 556\ \mathrm{km/h}$. Across the course the airliner turns $19.5^\circ$ into it and keeps $833\cos 19.5^\circ = 786\ \mathrm{km/h}$. A crosswind costs much less than a headwind of the same speed.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('book', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('wt-air', 'Airspeed (km/h)', 300, 100, 1000, 1)}${sliderRow('wt-wind', 'Wind speed (km/h)', 90, 0, 400, 1)}${sliderRow('wt-from', 'Wind from (compass °)', 45, 0, 360, 1)}${sliderRow('wt-track', 'Course to fly (compass °)', 0, 0, 360, 1)}${sliderRow('wt-leg', 'Length of the leg (km)', 300, 10, 2000, 10)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'wt-air', (s, x) => { s.air = x; });
    bindSlider(api, 'wt-wind', (s, x) => { s.wind = x; });
    bindSlider(api, 'wt-from', (s, x) => { s.from = x; });
    bindSlider(api, 'wt-track', (s, x) => { s.track = x; });
    bindSlider(api, 'wt-leg', (s, x) => { s.leg = x; });
  },
  syncControls(state) {
    putSlider('wt-air', state.air, 1);
    putSlider('wt-wind', state.wind, 1);
    putSlider('wt-from', state.from, 0);
    putSlider('wt-track', state.track, 0);
    putSlider('wt-leg', state.leg, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const air = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v);
    const wind = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FRAME);
    const ground = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, RESULT, undefined, undefined, 0.04);
    const airName = label('', 0, 0, 0, 'graph-axis');
    const windName = label('', 0, 0, 0, 'graph-axis');
    const groundName = label('', 0, 0, 0, 'graph-axis');
    const north = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(4.6, 3.4, 0), 0.9, M.grey, undefined, undefined, 0.014);
    const nName = label('N', 4.6, 4.65, 0, 'graph-axis');
    group.add(ground, air, wind, airName, windName, groundName, north, nName);
    group.visible = false;
    return { group, air, wind, ground, airName, windName, groundName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const sol = headingForTrack({ airspeed: state.air, wind: windVector(state), trackDeg: toMath(state.track) });
    computed.ok = !!sol;
    computed.heading = sol ? toBearing(sol.headingDeg) : NaN;
    // A correction to the right of the course (clockwise) is positive: the compass turns the other way to the maths.
    computed.correction = sol ? -sol.correctionDeg : NaN;
    computed.ground = sol ? sol.groundSpeed : NaN;
    computed.minutes = sol && sol.groundSpeed > 0 ? (60 * state.leg) / sol.groundSpeed : NaN;
    const rel = (state.from - state.track) * DEG;
    computed.headwind = state.wind * Math.cos(rel);
    computed.crosswind = state.wind * Math.sin(rel);
    computed.airVec = sol ? sol.air : null;
    computed.groundVec = sol ? sol.ground : null;
  },
  second(state) {
    // The sine rule in the triangle of airspeed, wind and ground speed.
    const rel = (state.from - state.track) * DEG;
    const cross = state.wind * Math.sin(rel);
    const head = state.wind * Math.cos(rel);
    if (Math.abs(cross) > state.air) return { ok: false };
    const wca = Math.asin(cross / state.air);
    const ground = state.air * Math.cos(wca) - head;
    return {
      ok: true,
      correction: wca / DEG,
      heading: toBearing(toMath(state.track + wca / DEG)),
      ground,
      minutes: ground > 0 ? (60 * state.leg) / ground : NaN,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const on = computed.ok;
    for (const o of [h.air, h.wind, h.ground, h.airName, h.windName, h.groundName]) o.visible = on;
    if (!on) return;
    const a = computed.airVec;
    const g = computed.groundVec;
    const xs = [0, a.x, g.x];
    const ys = [0, a.y, g.y];
    const lo = { x: Math.min(...xs), y: Math.min(...ys) };
    const hi = { x: Math.max(...xs), y: Math.max(...ys) };
    const k = Math.min(6.6 / Math.max(hi.x - lo.x, 1e-9), 7.2 / Math.max(hi.y - lo.y, 1e-9));
    const cx = -0.5 * (lo.x + hi.x) * k + 0.1;
    const cy = -0.5 * (lo.y + hi.y) * k - 0.2;
    const P = (p) => [cx + p.x * k, cy + p.y * k];
    const [ox, oy] = P({ x: 0, y: 0 });
    const [ax, ay] = P(a);
    const [gx, gy] = P(g);
    placeArrow(h.air, ox, oy, ax, ay, 0.05);
    placeArrow(h.wind, ax, ay, gx, gy, 0.05);
    placeArrow(h.ground, ox, oy, gx, gy, 0.04);
    labelBeside(h.airName, `heading ${fmt(computed.heading, 3)}°<br>${fmt(state.air, 3)} km/h`, ox, oy, ax, ay, gx, gy);
    labelBeside(h.windName, `wind<br>${fmt(state.wind, 3)} km/h`, ax, ay, gx, gy, ox, oy);
    labelBeside(h.groundName, `course ${fmt(state.track, 3)}°<br>${fmt(computed.ground, 4)} km/h`, ox, oy, gx, gy, ax, ay);
  },
  law: () => [
    String.raw`\vec v_{PG} = \vec v_{PA} + \vec v_{AG}`,
    String.raw`\sin(\text{WCA}) = \dfrac{w_\perp}{v_{PA}},\qquad v_{PG} = v_{PA}\cos(\text{WCA}) - w_\parallel`,
  ],
  readoutCells(state, computed) {
    if (!computed.ok) {
      return [
        ['Heading to hold the course', 'none: the crosswind is faster than the plane'],
        ['Crosswind', `${fmt(Math.abs(computed.crosswind), 4)} km/h`],
      ];
    }
    return [
      ['Heading to hold the course', `${fmt(computed.heading, 4)}°`],
      ['Ground speed', `${fmt(computed.ground, 4)} km/h`],
      ['Turn into the wind by', `${fmt(Math.abs(computed.correction), 4)}° ${computed.correction >= 0 ? 'right' : 'left'} of the course`],
      ['Time for the leg', `${fmt(computed.minutes, 4)} min`],
      ['Headwind part of the wind', `${fmt(computed.headwind, 4)} km/h`, computed.headwind > 0 ? 'warn' : ''],
      ['Crosswind part of the wind', `${fmt(Math.abs(computed.crosswind), 4)} km/h`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Point into the wind, fly the course',
      body: [
        String.raw`The plane's velocity over the ground is its velocity through the air plus the wind's: $\vec v_{PG} = \vec v_{PA} + \vec v_{AG}$. The wind is given; the pilot chooses only where the nose points. To stay on the course, the airspeed must cancel the wind's part across it: $v_{PA}\sin(\text{WCA}) = w_\perp$. Here that is $${fmt(Math.abs(computed.crosswind), 3)}$ km/h, so the nose turns $${fmt(Math.abs(computed.correction), 3)}^\circ$ into the wind.`,
        String.raw`What is left of the airspeed points along the course, $v_{PA}\cos(\text{WCA})$, and the wind's other part adds or subtracts: a ground speed of $${fmt(computed.ground, 4)}$ km/h. Flight planners compute this triangle for every leg, because the ground speed sets the fuel.`,
        String.raw`<b>What the course model leaves out.</b> The wind here is one steady vector. A real wind changes with height and along the route, so pilots take a forecast for each leg and correct in flight. Airspeed is the true airspeed; the instrument reads less at altitude, where the air is thin. Compass headings need the local magnetic variation added. Over long legs the shortest route on the curved Earth is a great circle whose course changes as the plane flies. Climb and descent are left out.`,
      ],
    };
  },
});
