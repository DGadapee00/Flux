/**
 * Shows that the velocity you measure depends on the frame you measure it from, that where a boat
 * points (its heading) and where it goes (its track) differ in a current, and that to reach the
 * point straight across you aim upstream and pay for it in time.
 *
 * Velocities add tip to tail: v_PG = v_PF + v_FG, the velocity of P over the ground is its velocity
 * in the moving frame F plus the frame's velocity over the ground. Seen from a moving observer, the
 * observer's velocity is subtracted instead. The primary computation adds components. The check
 * solves the same triangle with the law of cosines for its length and the sine rule for its angle.
 */
import * as THREE from 'three';
import { add, angle2D, fromAngle2D, mag, scale } from '@flux/subjects/mechanics/vectors.js';
import { relativeVelocity } from '@flux/subjects/mechanics/kinematics.js';
import { Arrow, M, label, labelBeside, placeArrow, QUANTITY_COLORS } from '../scene/kit.js';
import { bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const FRAME = M.teal;
const RESULT = M.gold;

/** What each arrow is, by scenario. `minus` means the second velocity is the observer's, and is subtracted. */
const NAMES = {
  river: { u: 'boat in the water', w: 'current', r: 'boat over the ground', minus: false },
  plane: { u: 'plane in the air', w: 'wind', r: 'plane over the ground', minus: false },
  truck: { u: 'car over the ground', w: 'minus the truck', r: 'car seen from the truck', minus: true },
};

const SCENARIOS = [
  { id: 'river', name: 'A boat crossing a 60 m river', kind: 'river', unit: 'm/s', u: { s: 4.5, dir: 90 }, w: { s: 3, dir: 0 }, width: 60 },
  { id: 'plane', name: 'A plane in a wind from the northeast', kind: 'plane', unit: 'km/h', u: { s: 300, dir: 77.75 }, w: { s: 90, dir: 225 }, width: 0 },
  { id: 'truck', name: 'A car seen from a truck', kind: 'truck', unit: 'km/h', u: { s: 80, dir: 0 }, w: { s: 70, dir: 270 }, width: 0 },
];

/** The second arrow of the triangle: the frame's velocity, or minus the observer's. */
function secondArrow(state) {
  const w = fromAngle2D(state.w.s, state.w.dir);
  return NAMES[state.kind].minus ? scale(w, -1) : w;
}

const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

export default defineLab({
  id: 'relative-motion',
  exam: 'u2',
  title: 'Relative motion',
  hint: 'Two velocities add tip to tail. Turn the heading, change the current, and watch the track.',
  orbit: false,
  fit: { w: 12, h: 10.6 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'rm-current',
      scenario: 'river',
      ask: String.raw`The boat points straight across. After a storm the current doubles, from $3$ to $6\ \mathrm{m/s}$. What happens to the time to cross and to how far downstream it lands?`,
      apply(s) { s.w.s = 6; },
      watch: [
        { id: 'crossTime', label: 'the time to cross', get: (c) => c.crossTime },
        { id: 'drift', label: 'how far downstream it lands', get: (c) => c.drift },
      ],
      mode: 'dir',
      expect: { crossTime: 'same', drift: 'bigger' },
      why: String.raw`Only the part of the velocity across the river gets the boat over, and that part is the boat's own $4.5\ \mathrm{m/s}$. The current runs along the river, so it cannot speed the crossing up or slow it down. It only carries the boat farther downstream in the same $13.3\ \mathrm{s}$.`,
    },
    {
      id: 'rm-aim',
      scenario: 'river',
      ask: String.raw`To land closer to the point straight across, the pilot aims $20^\circ$ upstream. What happens to the time to cross and to the drift downstream?`,
      apply(s) { s.u.dir = 110; },
      watch: [
        { id: 'crossTime', label: 'the time to cross', get: (c) => c.crossTime },
        { id: 'drift', label: 'how far downstream it lands', get: (c) => c.drift },
      ],
      mode: 'dir',
      expect: { crossTime: 'bigger', drift: 'smaller' },
      why: String.raw`Aiming upstream spends part of the boat's speed fighting the current. Less of it is left to go across, $4.5\cos 20^\circ = 4.23\ \mathrm{m/s}$, so the crossing takes longer. In return the drift shrinks. Aim $41.8^\circ$ upstream and it vanishes.`,
    },
    {
      id: 'rm-truck',
      scenario: 'truck',
      ask: String.raw`The truck turns round and drives north at the same $70\ \mathrm{km/h}$, away from the crossing. Does the car's speed as seen from the truck change?`,
      apply(s) { s.w.dir = 90; },
      watch: [{ id: 'speed', label: 'the car’s speed seen from the truck', get: (c) => c.speed }],
      mode: 'dir',
      expect: { speed: 'same' },
      why: String.raw`Seen from the truck the car moves at $\vec v_{CE} - \vec v_{TE}$. The two velocities are still at right angles, so the size is still $\sqrt{80^2 + 70^2} = 106\ \mathrm{km/h}$. Only the direction flips, from north of east to south of east.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('river', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, structuredClone(sc), { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${logSliderRow('rm-us', 'White arrow: speed', 4.5, 0.1, 1000)}${sliderRow('rm-ud', 'White arrow: direction (° from east, counterclockwise)', 90, 0, 360, 1)}${logSliderRow('rm-ws', 'Teal arrow: speed (current, wind, or truck)', 3, 0.1, 1000)}${sliderRow('rm-wd', 'Teal arrow: direction (° from east, counterclockwise)', 0, 0, 360, 1)}${sliderRow('rm-width', 'Width of the river (m)', 60, 10, 500, 5)}</div>`;
  },
  bind(api) {
    bindLogSlider(api, 'rm-us', (s, x) => { s.u.s = x; });
    bindSlider(api, 'rm-ud', (s, x) => { s.u.dir = x; });
    bindLogSlider(api, 'rm-ws', (s, x) => { s.w.s = x; });
    bindSlider(api, 'rm-wd', (s, x) => { s.w.dir = x; });
    bindSlider(api, 'rm-width', (s, x) => { s.width = x; });
  },
  syncControls(state) {
    putLogSlider('rm-us', state.u.s);
    putSlider('rm-ud', state.u.dir, 2);
    putLogSlider('rm-ws', state.w.s);
    putSlider('rm-wd', state.w.dir, 2);
    putSlider('rm-width', state.width || 60, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const uArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v);
    const wArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FRAME);
    const rArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, RESULT, undefined, undefined, 0.04);
    const uName = label('', 0, 0, 0, 'graph-axis');
    const wName = label('', 0, 0, 0, 'graph-axis');
    const rName = label('', 0, 0, 0, 'graph-axis');
    const north = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(4.6, 3.4, 0), 0.9, M.grey, undefined, undefined, 0.014);
    const nName = label('N', 4.6, 4.65, 0, 'graph-axis');
    group.add(rArrow, uArrow, wArrow, uName, wName, rName, north, nName);
    group.visible = false;
    return { group, uArrow, wArrow, rArrow, uName, wName, rName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const u = fromAngle2D(state.u.s, state.u.dir);
    const w = fromAngle2D(state.w.s, state.w.dir);
    // Through the frame: P over the ground is P in the frame plus the frame over the ground. Seen from
    // a moving observer O: P relative to O is P over the ground minus O over the ground.
    const r = NAMES[state.kind].minus ? relativeVelocity(u, w) : add(u, w);
    computed.rx = r.x;
    computed.ry = r.y;
    computed.speed = mag(r);
    computed.dirDeg = angle2D(r);
    computed.driftDeg = wrap180(computed.dirDeg - state.u.dir);
    computed.compass = (((90 - computed.dirDeg) % 360) + 360) % 360;
    // The river runs east, along +x, and the far bank is north. Only v_y carries the boat across.
    const crossing = state.kind === 'river' && r.y > 1e-9;
    computed.crossTime = crossing ? state.width / r.y : NaN;
    computed.drift = crossing ? r.x * computed.crossTime : NaN;
  },
  second(state) {
    // The triangle by its sides and angles: Δ is the angle between the two arrows placed tip to tail.
    const a = state.u.s;
    const second = secondArrow(state);
    const b = mag(second);
    const delta = (angle2D(second) - state.u.dir) * DEG;
    const S = Math.sqrt(Math.max(0, a * a + b * b + 2 * a * b * Math.cos(delta)));
    // The sine rule gives the angle from the first arrow to the sum, up to its obtuse twin.
    let beta = S > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, (b * Math.sin(delta)) / S))) : 0;
    if (a + b * Math.cos(delta) < 0) beta = Math.sign(beta || 1) * Math.PI - beta;
    const out = { speed: S, driftDeg: wrap180(beta / DEG) };
    if (state.kind === 'river') {
      const across = S * Math.sin(state.u.dir * DEG + beta);
      const along = S * Math.cos(state.u.dir * DEG + beta);
      out.crossTime = across > 1e-9 ? state.width / across : NaN;
      out.drift = across > 1e-9 ? (along * state.width) / across : NaN;
    }
    return out;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const u = fromAngle2D(state.u.s, state.u.dir);
    const w = secondArrow(state);
    const r = { x: computed.rx, y: computed.ry };
    // Fit the triangle O, A = u, B = u + w in a 8.4 by 7.6 box, centred.
    const xs = [0, u.x, r.x];
    const ys = [0, u.y, r.y];
    const lo = { x: Math.min(...xs), y: Math.min(...ys) };
    const hi = { x: Math.max(...xs), y: Math.max(...ys) };
    const k = Math.min(6.6 / Math.max(hi.x - lo.x, 1e-9), 7.2 / Math.max(hi.y - lo.y, 1e-9));
    const cx = -0.5 * (lo.x + hi.x) * k + 0.1;
    const cy = -0.5 * (lo.y + hi.y) * k - 0.2;
    const P = (p) => [cx + p.x * k, cy + p.y * k];
    const [ox, oy] = P({ x: 0, y: 0 });
    const [axp, ayp] = P(u);
    const [bx, by] = P(r);
    // A flat triangle (the two velocities in line) would draw the sum on top of them: slide it aside.
    const flat = Math.abs((axp - ox) * (by - oy) - (ayp - oy) * (bx - ox)) < 0.4;
    const L = Math.hypot(bx - ox, by - oy) || 1;
    const sx = flat ? ((by - oy) / L) * 0.32 : 0;
    const sy = flat ? (-(bx - ox) / L) * 0.32 : 0;
    placeArrow(h.uArrow, ox, oy, axp, ayp, 0.05);
    placeArrow(h.wArrow, axp, ayp, bx, by, 0.05);
    placeArrow(h.rArrow, ox + sx, oy + sy, bx + sx, by + sy, 0.04);
    const names = NAMES[state.kind];
    labelBeside(h.uName, `${names.u}<br>${fmt(state.u.s, 3)} ${state.unit}`, ox, oy, axp, ayp, bx, by);
    labelBeside(h.wName, `${names.w}<br>${fmt(state.w.s, 3)} ${state.unit}`, axp, ayp, bx, by, ox, oy);
    labelBeside(h.rName, `${names.r}<br>${fmt(computed.speed, 3)} ${state.unit}`, ox + sx, oy + sy, bx + sx, by + sy, axp, ayp, -1);
  },
  law: (state) => (state && NAMES[state.kind]?.minus
    ? [String.raw`\vec v_{CT} = \vec v_{CE} + \vec v_{ET} = \vec v_{CE} - \vec v_{TE}`]
    : [String.raw`\vec v_{PG} = \vec v_{PF} + \vec v_{FG}`, String.raw`t_{\text{cross}} = \dfrac{w}{v_{\perp}}`]),
  readoutCells(state, computed) {
    const names = NAMES[state.kind];
    const rows = [
      [`Speed of the ${names.r}`, `${fmt(computed.speed, 4)} ${state.unit}`],
      ['Direction, from east', `${fmt(computed.dirDeg, 4)}°`],
      ['Compass bearing', `${fmt(computed.compass, 4)}°`],
      ['Angle from the white arrow to the gold one', `${fmt(computed.driftDeg, 4)}°`],
    ];
    if (state.kind === 'river') {
      rows.push(['Time to cross', `${fmt(computed.crossTime, 4)} s`]);
      rows.push(['Lands downstream by', `${fmt(computed.drift, 4)} m`]);
    }
    return rows;
  },
  coach(state, computed) {
    const names = NAMES[state.kind];
    const body = names.minus
      ? [
        String.raw`Each vehicle has a velocity over the ground. Seen from the truck, the ground itself moves at $-\vec v_{TE}$, so the car's velocity there is $\vec v_{CE} - \vec v_{TE}$: $${fmt(computed.speed, 4)}$ ${state.unit}. Subtracting a velocity is adding its opposite, the teal arrow.`,
      ]
      : [
        String.raw`The white arrow is where the ${state.kind === 'river' ? 'boat points' : 'plane points'}: its heading. The gold arrow is where it goes: its track. They differ by $${fmt(computed.driftDeg, 3)}^\circ$ because the ${names.w} carries it sideways.`,
      ];
    if (state.kind === 'river') {
      body.push(String.raw`Only the part of the gold arrow across the river, $${fmt(computed.ry, 3)}$ m/s, gets the boat over: $t = w/v_\perp = ${fmt(computed.crossTime, 4)}$ s. In that time the part along the river carries it $${fmt(computed.drift, 4)}$ m downstream.`);
    }
    body.push(String.raw`<b>What the model leaves out.</b> Each velocity is taken as one steady vector. A real river runs faster in the middle than at the banks, and a real wind changes with height and from minute to minute. The frames move at constant velocity, so they agree on every acceleration.`);
    return { title: 'Heading and track', body };
  },
});
