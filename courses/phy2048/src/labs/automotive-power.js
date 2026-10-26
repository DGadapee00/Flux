/**
 * Application lab: the power a car needs to hold its speed up a hill, P = F · v.
 *
 * At a steady speed the kinetic energy does not change, so all the engine's work goes into height and
 * into losses. Two ways to count the losses. The book's: a fixed share of the power. The forces': air
 * drag ½ρ(CA)v² and rolling resistance C_rr·mg cos θ, each times v. Climbing takes mgv sin θ, with
 * tan θ the grade. Drag power grows as v³, which is why speed costs fuel.
 *
 * Numbers: OpenStax University Physics Vol. 1 §7.4, "Automotive Power Driving Uphill": 1200 kg, a 15%
 * grade, 90 km/h, 25% of the power lost; the book prints 58 kW, about 78 hp, with g = 9.8 m/s². Drag
 * areas from §6.4's problems: a Toyota Camry 0.70 m², a Hummer H2 2.44 m²; air at 1.21 kg/m³ as in §6.4.
 * The rolling-resistance coefficient, 0.010, is an illustrative value for car tyres on asphalt, not a
 * measured one. The masses, 1500 kg for the sedan and 2900 kg for the SUV, are round illustrative figures. The check counts energy over one kilometre of road and divides by the time it takes.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { climbPower } from '@flux/subjects/mechanics/energy.js';
import { MPS_PER_KMH, W_PER_HP } from '@flux/subjects/convert.js';
import { Arrow, M, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const RHO = 1.21;
const FORCE = QUANTITY_COLORS.a;
/** The power bars' zero line, under the road. */
const BASE = -3.6;

const SCENARIOS = [
  { id: 'book', name: 'The book’s car: 1200 kg up a 15% grade at 90 km/h, 25% lost', model: 'share', m: 1200, grade: 15, kmh: 90, share: 25, CA: 0.7, Crr: 0.01 },
  { id: 'highway', name: 'A Camry on a level highway at 100 km/h', model: 'forces', m: 1500, grade: 0, kmh: 100, share: 25, CA: 0.7, Crr: 0.01 },
  { id: 'hummer', name: 'A Hummer H2 up a 6% grade at 100 km/h', model: 'forces', m: 2900, grade: 6, kmh: 100, share: 25, CA: 2.44, Crr: 0.01 },
];

const MODELS = [['share', 'A fixed share of the power is lost'], ['forces', 'Air drag and rolling resistance']];

function powers(s) {
  const v = s.kmh * MPS_PER_KMH;
  const th = Math.atan(s.grade / 100);
  if (s.model === 'share') {
    const r = climbPower({ mass: s.m, speed: v, grade: s.grade / 100, lossShare: s.share / 100 });
    return { v, theta: r.theta, climb: r.climb, drag: 0, roll: 0, losses: r.losses, total: r.total };
  }
  const Fd = 0.5 * RHO * s.CA * v * v;
  const Fr = s.Crr * s.m * G * Math.cos(th);
  const r = climbPower({ mass: s.m, speed: v, grade: s.grade / 100, lossForce: Fd + Fr });
  return { v, theta: r.theta, climb: r.climb, drag: Fd * v, roll: Fr * v, losses: r.losses, total: r.total, Fd, Fr };
}

export default defineLab({
  id: 'automotive-power',
  exam: 'u4',
  title: 'Automotive power',
  app: true,
  hint: 'Change the speed, the grade and the car. See where the engine’s power goes.',
  orbit: false,
  fit: { w: 8.4, h: 9.6 },
  camera: { pos: new THREE.Vector3(0, -0.4, 24), target: new THREE.Vector3(0, -0.4, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'ap-speed',
      scenario: 'book',
      ask: String.raw`The book's car climbs the same hill at $180\ \mathrm{km/h}$ instead of $90$, still losing a quarter of its power. What happens to the power it needs?`,
      apply(s) { s.kmh *= 2; },
      watch: [{ id: 'total', label: 'the power', get: (c) => c.total }],
      mode: 'factor',
      expect: { total: 2 },
      why: String.raw`Climbing takes $mgv\sin\theta$: the same height gained in half the time. In this model the losses are a fixed share, so they double too. The forces model says otherwise: drag would grow far faster.`,
    },
    {
      id: 'ap-drag',
      scenario: 'highway',
      ask: String.raw`On the level highway, drive at $200\ \mathrm{km/h}$ instead of $100$. What happens to the power that goes into air drag?`,
      apply(s) { s.kmh *= 2; },
      watch: [{ id: 'drag', label: 'the power lost to drag', get: (c) => c.drag }],
      mode: 'factor',
      factors: [8, 4, 2, 1],
      expect: { drag: 8 },
      why: String.raw`Drag force is $\tfrac12\rho CAv^2$, four times as big at twice the speed. Power is force times speed, so another factor of two: eight times. That is why fuel use climbs so steeply above highway speeds.`,
    },
    {
      id: 'ap-grade',
      scenario: 'hummer',
      ask: String.raw`The Hummer meets a $12\%$ grade instead of $6\%$, at the same speed. Does climbing take a bigger share of its power?`,
      apply(s) { s.grade = 12; },
      watch: [{ id: 'part', label: 'the share of the power spent climbing', get: (c) => c.climb / c.total }],
      mode: 'dir',
      expect: { part: 'bigger' },
      why: String.raw`Climbing power is $mgv\sin\theta$, which nearly doubles with the grade. Drag does not care about the hill, and rolling resistance falls a little, as $\cos\theta$. So climbing takes a larger share of a larger total.`,
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
    return `<div class="lab-block">${selectRow('ap-model', 'Losses', MODELS, 'share')}${sliderRow('ap-kmh', 'Speed (km/h)', 90, 10, 200, 1)}${sliderRow('ap-grade', 'Grade (%)', 15, 0, 30, 0.5)}${sliderRow('ap-m', 'Mass with passengers (kg)', 1200, 600, 3500, 10)}${sliderRow('ap-share', 'Share of the power lost (%)', 25, 0, 60, 1)}${sliderRow('ap-CA', 'Drag area, C·A (m²)', 0.7, 0.3, 3, 0.01)}${sliderRow('ap-Crr', 'Rolling-resistance coefficient', 0.01, 0, 0.03, 0.001)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'ap-model', (s, v) => { s.model = v; });
    bindSlider(api, 'ap-kmh', (s, x) => { s.kmh = x; });
    bindSlider(api, 'ap-grade', (s, x) => { s.grade = x; });
    bindSlider(api, 'ap-m', (s, x) => { s.m = x; });
    bindSlider(api, 'ap-share', (s, x) => { s.share = x; });
    bindSlider(api, 'ap-CA', (s, x) => { s.CA = x; });
    bindSlider(api, 'ap-Crr', (s, x) => { s.Crr = x; });
  },
  syncControls(state) {
    putSelect('ap-model', state.model);
    putSlider('ap-kmh', state.kmh, 0);
    putSlider('ap-grade', state.grade, 1);
    putSlider('ap-m', state.m, 0);
    putSlider('ap-share', state.share, 0);
    putSlider('ap-CA', state.CA, 2);
    putSlider('ap-Crr', state.Crr, 3);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const road = fatLine(new Array(4 * 3).fill(0), { color: M.grey, width: 2.5 });
    const body = fatLine(new Array(9 * 3).fill(0), { color: M.blue, width: 3 });
    const wheels = [0, 1].map(() => fatLine(new Array(25 * 3).fill(0), { color: M.grey, width: 2.5 }));
    const arrows = {};
    for (const key of ['w', 'D', 'R', 'T']) arrows[key] = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE);
    const vel = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const names = {};
    for (const [key, html] of [['w', '<i>mg</i> sin θ'], ['D', 'drag'], ['R', 'rolling'], ['T', 'drive'], ['v', '<i>v</i>']]) names[key] = label(html, 0, 0, 0, 'graph-axis');
    const base = fatLine([-3.2, BASE, 0, 3.2, BASE, 0], { color: M.greyDark, width: 1.5 });
    const keys = [['climb', 'climb', FORCE], ['drag', 'drag', FORCE], ['roll', 'rolling', FORCE], ['losses', 'losses', FORCE], ['total', 'total', M.yellow]];
    const bars = keys.map(([, , color]) => fatLine([0, 0, 0, 0, 1, 0], { color, width: 16 }));
    const barNames = keys.map(([, html]) => label(html, 0, 0, 0, 'graph-axis'));
    const barValues = keys.map(() => label('', 0, 0, 0, 'graph-tick x'));
    // Under the bar names, where no bar or value can reach it.
    const title = label('power (kW)', 0, BASE - 0.95, 0, 'graph-title');
    group.add(road, body, ...wheels, vel, base, title, ...Object.values(arrows), ...Object.values(names), ...bars, ...barNames, ...barValues);
    group.visible = false;
    return { group, road, body, wheels, arrows, vel, names, bars, barNames, barValues, keys };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    Object.assign(computed, powers(state));
    computed.hp = computed.total / W_PER_HP;
  },
  second(state) {
    // Energy over one kilometre of road, divided by the time to drive it.
    const d = 1000;
    const v = state.kmh / 3.6;
    const rise = (d * (state.grade / 100)) / Math.sqrt(1 + (state.grade / 100) ** 2);
    const dU = state.m * G * rise;
    const t = d / v;
    if (state.model === 'share') return { climb: dU / t, total: dU / t / (1 - state.share / 100) };
    const cos = 1 / Math.sqrt(1 + (state.grade / 100) ** 2);
    const Wd = 0.5 * RHO * state.CA * v * v * d;
    const Wr = state.Crr * state.m * G * cos * d;
    return { climb: dU / t, drag: Wd / t, roll: Wr / t, total: (dU + Wd + Wr) / t };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const th = (computed.theta * Math.PI) / 180;
    const L = 6.6;
    const x0 = -3.3;
    const y0 = 0.5;
    const top = { x: x0 + L * Math.cos(th), y: y0 + L * Math.sin(th) };
    updateFatLine(h.road, [x0, y0, 0, top.x, y0, 0, top.x, top.y, 0, x0, y0, 0]);
    const u = { x: Math.cos(th), y: Math.sin(th) };
    const n = { x: -Math.sin(th), y: Math.cos(th) };
    const at = (a, b) => ({ x: x0 + u.x * a + n.x * b, y: y0 + u.y * a + n.y * b });
    // A side view of a car: body from 2.4 m to 4.6 m along the road, wheels under it.
    const shape = [[2.3, 0.3], [4.7, 0.3], [4.7, 0.75], [4.2, 0.85], [3.8, 1.25], [2.9, 1.25], [2.6, 0.85], [2.3, 0.75], [2.3, 0.3]];
    updateFatLine(h.body, shape.flatMap(([a, b]) => { const p = at(a, b); return [p.x, p.y, 0.02]; }));
    [2.75, 4.25].forEach((a, i) => {
      const c = at(a, 0.22);
      const pts = [];
      for (let k = 0; k <= 24; k += 1) pts.push(c.x + 0.22 * Math.cos((k / 24) * 2 * Math.PI), c.y + 0.22 * Math.sin((k / 24) * 2 * Math.PI), 0.02);
      updateFatLine(h.wheels[i], pts);
    });
    // Forces along the road, on a common scale; the drive force balances them at a steady speed.
    const Fw = state.m * G * Math.sin(th);
    const Fd = state.model === 'forces' ? computed.Fd : 0;
    const Fr = state.model === 'forces' ? computed.Fr : 0;
    const Ft = computed.total / computed.v;
    const k = 2.2 / Math.max(Ft, 1e-9);
    const c = at(3.5, 0.75);
    const back = (len) => ({ x: c.x - u.x * len, y: c.y - u.y * len });
    const pw = back(Fw * k);
    placeArrow(h.arrows.w, c.x, c.y, pw.x, pw.y, 0.05);
    const cd = at(4.7, 1.0);
    placeArrow(h.arrows.D, cd.x + u.x * Fd * k, cd.y + u.y * Fd * k, cd.x, cd.y, 0.05);
    const cr = at(2.75, 0.0);
    placeArrow(h.arrows.R, cr.x, cr.y, cr.x - u.x * Fr * k, cr.y - u.y * Fr * k, 0.05);
    const ct = at(4.25, 0.0);
    placeArrow(h.arrows.T, ct.x, ct.y, ct.x + u.x * Ft * k, ct.y + u.y * Ft * k, 0.05);
    const cv = at(3.5, 1.9);
    placeArrow(h.vel, cv.x - u.x * 0.7, cv.y - u.y * 0.7, cv.x + u.x * 0.7, cv.y + u.y * 0.7, 0.05);
    // Each name sits past its arrow's tip: weight's above the car, drag's ahead of it, the wheels' below the road.
    const put = (key, a, b) => {
      const p = at(a, b);
      h.names[key].position.set(p.x, p.y, 0);
    };
    put('w', 3.5 - Fw * k * 0.5, 1.6);
    h.names.w.visible = h.arrows.w.visible;
    put('D', 4.7 + Fd * k + 0.5, 1.0);
    h.names.D.visible = h.arrows.D.visible;
    put('R', 2.75 - Fr * k - 0.6, -0.35);
    h.names.R.visible = h.arrows.R.visible;
    put('T', 4.25 + Ft * k + 0.5, -0.35);
    put('v', 4.6, 1.9);
    // Bars in kilowatts. The share model has no split of its losses; the forces model has no lump.
    const vals = [computed.climb, computed.drag, computed.roll, state.model === 'share' ? computed.losses : 0, computed.total];
    const scale = 2.9 / Math.max(computed.total, 1e-9);
    vals.forEach((val, i) => {
      const x = -2.6 + i * 1.3;
      const y1 = BASE + val * scale;
      const shown = !(state.model === 'share' && (i === 1 || i === 2)) && !(state.model === 'forces' && i === 3);
      h.bars[i].visible = shown;
      h.barNames[i].visible = shown;
      h.barValues[i].visible = shown;
      if (Math.abs(val * scale) < 0.02) h.bars[i].visible = false;
      else updateFatLine(h.bars[i], [x, BASE, 0.01, x, y1, 0.01]);
      h.barNames[i].position.set(x, BASE - 0.45, 0);
      h.barValues[i].element.textContent = String(fmt(val / 1000, 3));
      h.barValues[i].position.set(x, y1 + 0.3, 0);
    });
  },
  law: () => [
    String.raw`P = \vec F\cdot\vec v = mgv\sin\theta + P_{\text{loss}},\qquad \tan\theta = \text{grade}`,
    String.raw`P_{\text{drag}} = \tfrac12\rho\,CA\,v^3,\qquad P_{\text{roll}} = C_{rr}\,mg\cos\theta\,v`,
  ],
  readoutCells(state, computed) {
    const cells = [
      ['Power needed', `${fmt(computed.total / 1000)} kW, ${fmt(computed.hp, 3)} hp`],
      ['Spent climbing', `${fmt(computed.climb / 1000)} kW`],
      ['Angle of the road', `${fmt(computed.theta, 3)}°`],
      ['Speed', `${fmt(computed.v, 4)} m/s`],
    ];
    if (state.model === 'forces') {
      cells.push(['Lost to air drag', `${fmt(computed.drag / 1000)} kW, from ${fmt(computed.Fd, 3)} N`]);
      cells.push(['Lost to rolling resistance', `${fmt(computed.roll / 1000)} kW, from ${fmt(computed.Fr, 3)} N`]);
    } else {
      cells.push(['Lost to air and friction', `${fmt(computed.losses / 1000)} kW`]);
    }
    return cells;
  },
  coach(state, computed) {
    return {
      title: 'At a steady speed, power goes into height and losses',
      body: [
        String.raw`The speed does not change, so the net work is zero and the drive force balances gravity's pull down the slope and the losses. Power is force times speed: climbing takes $mgv\sin\theta = ${fmt(computed.climb / 1000, 3)}$ kW of the $${fmt(computed.total / 1000, 3)}$ kW.`,
        state.model === 'share'
          ? String.raw`The book lumps every loss into a quarter of the power, so $0.75P = mgv\sin\theta$. That is a fair figure for one hill at one speed. It cannot tell you what happens at another speed.`
          : String.raw`Drag needs $\tfrac12\rho CAv^2 \times v$: it grows as the cube of the speed. Rolling resistance needs $C_{rr}mg\cos\theta \times v$, which grows only in proportion. At highway speed drag is the bigger loss for most cars.`,
        String.raw`<b>What the model leaves out.</b> This is the power at the wheels. The engine burns about three times as much, because most of the fuel's energy leaves as heat through the radiator and the exhaust. Wind, and the drivetrain's own friction, are left out. The rolling-resistance coefficient and the two highway cars' masses are illustrative values.`,
      ],
    };
  },
});
