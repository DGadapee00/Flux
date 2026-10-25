/**
 * Shows that the horizontal and vertical motions of a projectile do not affect each other, and that
 * two launch angles that add to 90° land in the same place on level ground and not from a height.
 *
 * Drag is left out, so the acceleration is g, straight down, the whole way. The closed form puts the
 * landing at the later root of y(t) = y_land, a quadratic (`projectile`), or where the path meets a
 * slope through the launch point (`slopeLanding`). The check flies the same launch in small time
 * steps and bisects the last step for the landing, with no quadratic formula.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { projectile, slopeLanding } from '@flux/subjects/mechanics/kinematics.js';
import { Arrow, M, dot, fatLine, label, niceStep, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;

const SCENARIOS = [
  { id: 'level', name: 'A kick on level ground, 12 m/s at 30°', v0: 12, theta: 30, y0: 0, yLand: 0, slope: 0, frac: 0.3 },
  { id: 'height', name: 'The same kick from a 20 m roof', v0: 12, theta: 30, y0: 20, yLand: 0, slope: 0, frac: 0.3 },
  { id: 'cliff', name: 'A rock thrown flat off a 100 m cliff at 15 m/s', v0: 15, theta: 0, y0: 100, yLand: 0, slope: 0, frac: 0.6 },
];

/** The drawing box, in scene units. The world is drawn at one scale on both axes, so angles are true. */
const BOX = { left: -6.1, bottom: -3.2, w: 12.2, h: 7 };
const SAMPLES = 121;

/** Where the launch comes down, by the closed forms. Null when it never reaches the landing surface. */
function landing(s) {
  if (s.slope) {
    const L = slopeLanding({ v0: s.v0, thetaDeg: s.theta, slopeDeg: s.slope, g: G });
    if (!L) return null;
    return { t: L.t, x: L.x, y: s.y0 + L.y, vx: L.vx, vy: L.vy, along: L.d };
  }
  const shot = projectile({ v0: s.v0, thetaDeg: s.theta, g: G, y0: s.y0, yLand: s.yLand });
  if (!shot.land) return null;
  return { t: shot.tFlight, x: shot.range, y: s.yLand, vx: shot.land.vx, vy: shot.land.vy, along: shot.range };
}

export default defineLab({
  id: 'projectile',
  exam: 'u2',
  title: 'Projectile',
  hint: 'Drag is left out. Set the speed, the angle and the heights, and move through the flight.',
  orbit: false,
  fit: { w: 13.8, h: 9.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 24), target: new THREE.Vector3(0, 0.2, 0) },
  toggles: [
    { key: 'parts', label: 'Velocity components' },
    { key: 'twin', label: 'The other angle, 90° − θ' },
  ],
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'projectile-complement',
      scenario: 'level',
      ask: String.raw`On level ground, change the launch angle from $30^\circ$ to $60^\circ$ at the same speed. What happens to the range and to the highest point?`,
      apply(s) { s.theta = 60; },
      watch: [
        { id: 'range', label: 'the range', get: (c) => c.range },
        { id: 'hMax', label: 'the highest point', get: (c) => c.hMax },
      ],
      mode: 'dir',
      expect: { range: 'same', hMax: 'bigger' },
      why: String.raw`On level ground $R = v_0^2\sin 2\theta/g$, and $\sin 60^\circ = \sin 120^\circ$, so the two ranges match. The height is $v_0^2\sin^2\theta/(2g)$, and the steeper launch has the larger vertical part.`,
    },
    {
      id: 'projectile-speed',
      scenario: 'level',
      ask: String.raw`Double the launch speed, from $12$ to $24\ \mathrm{m/s}$. Keep the angle at $30^\circ$.`,
      apply(s) { s.v0 *= 2; },
      watch: [
        { id: 'range', label: 'the range', get: (c) => c.range, mode: 'factor' },
        { id: 'tFlight', label: 'the time in the air', get: (c) => c.tFlight, mode: 'factor' },
      ],
      expect: { range: 4, tFlight: 2 },
      why: String.raw`Both components of the launch double. The time in the air is $2v_0\sin\theta/g$, so it doubles. The range is the horizontal speed times that time, two doublings, so it is four times as far.`,
    },
    {
      id: 'projectile-roof',
      scenario: 'height',
      ask: String.raw`Now the kick is from a $20\ \mathrm{m}$ roof. Change the angle from $30^\circ$ to $60^\circ$ again. Is the range still the same?`,
      apply(s) { s.theta = 60; },
      watch: [{ id: 'range', label: 'how far from the wall it lands', get: (c) => c.range }],
      mode: 'dir',
      expect: { range: 'smaller' },
      why: String.raw`The rule that $\theta$ and $90^\circ - \theta$ tie holds only when the launch and the landing are at one height. From a roof the ball has $20\ \mathrm{m}$ more to fall. The flatter launch has more horizontal speed to spend in that extra time, so it lands farther out: $28.3\ \mathrm{m}$ against $20.0\ \mathrm{m}$.`,
    },
    {
      id: 'projectile-flat',
      scenario: 'cliff',
      ask: String.raw`Throw the rock flat off the cliff twice as fast, $30\ \mathrm{m/s}$ instead of $15$. What happens to its time in the air and to how far out it lands?`,
      apply(s) { s.v0 *= 2; },
      watch: [
        { id: 'tFlight', label: 'the time in the air', get: (c) => c.tFlight, mode: 'factor' },
        { id: 'range', label: 'how far out it lands', get: (c) => c.range, mode: 'factor' },
      ],
      expect: { tFlight: 1, range: 2 },
      why: String.raw`A flat throw starts with no vertical speed, so its fall is the same $100\ \mathrm{m}$ drop from rest whatever the horizontal speed: $\sqrt{2h/g} = 4.52\ \mathrm{s}$. The horizontal motion does not change the vertical one. Twice the speed for the same time is twice as far.`,
    },
  ],
  defaultState() {
    const state = { show: { parts: true, twin: false } };
    this.applyScenario('level', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('pj-v0', 'Launch speed (m/s)', 12, 1, 80, 0.5)}${sliderRow('pj-theta', 'Angle above the horizontal (°)', 30, -45, 85, 1)}${sliderRow('pj-y0', 'Height of the launch (m)', 0, 0, 120, 0.5)}${sliderRow('pj-yland', 'Height of the landing (m)', 0, 0, 40, 0.5)}${sliderRow('pj-slope', 'Slope from the launch point (°, 0 for none)', 0, -40, 40, 1)}${sliderRow('pj-frac', 'Moment in the flight (% of the time)', 50, 0, 100, 1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'pj-v0', (s, x) => { s.v0 = x; });
    bindSlider(api, 'pj-theta', (s, x) => { s.theta = x; });
    bindSlider(api, 'pj-y0', (s, x) => { s.y0 = x; });
    bindSlider(api, 'pj-yland', (s, x) => { s.yLand = x; });
    bindSlider(api, 'pj-slope', (s, x) => { s.slope = x; });
    bindSlider(api, 'pj-frac', (s, x) => { s.frac = x / 100; });
  },
  syncControls(state) {
    putSlider('pj-v0', state.v0, 2);
    putSlider('pj-theta', state.theta, 2);
    putSlider('pj-y0', state.y0, 1);
    putSlider('pj-yland', state.yLand, 1);
    putSlider('pj-slope', state.slope, 1);
    putSlider('pj-frac', state.frac * 100, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ground = fatLine(new Array(8 * 3).fill(0), { color: M.grey, width: 2.5 });
    const path = fatLine(new Array(SAMPLES * 3).fill(0), { color: QUANTITY_COLORS.x, width: 3.5 });
    const twin = fatLine(new Array(SAMPLES * 3).fill(0), { color: M.white, width: 2, opacity: 0.45 });
    const ball = dot(M.white, 0.16);
    const apex = dot(QUANTITY_COLORS.mark, 0.11);
    const vel = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v);
    const vx = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const vy = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const acc = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a);
    const vName = label('<i>v</i>', 0, 0, 0, 'graph-title');
    const gName = label('<i>g</i>', 0, 0, 0, 'graph-title');
    const apexName = label('', 0, 0, 0, 'graph-axis');
    const xTicks = Array.from({ length: 9 }, () => label('', 0, 0, 0, 'graph-tick x'));
    const yTicks = Array.from({ length: 6 }, () => label('', 0, 0, 0, 'graph-tick y'));
    const xName = label('<i>x</i> (m)', BOX.left + BOX.w - 0.5, BOX.bottom - 0.85, 0, 'graph-axis');
    const yName = label('<i>y</i> (m)', BOX.left + 0.1, BOX.bottom + BOX.h + 0.45, 0, 'graph-axis');
    group.add(ground, twin, path, apex, ball, vx, vy, vel, acc, vName, gName, apexName, xName, yName, ...xTicks, ...yTicks);
    group.visible = false;
    return { group, ground, path, twin, ball, apex, vel, vx, vy, acc, vName, gName, apexName, xTicks, yTicks };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const th = state.theta * DEG;
    const v0x = state.v0 * Math.cos(th);
    const v0y = state.v0 * Math.sin(th);
    const L = landing(state);
    computed.v0x = v0x;
    computed.v0y = v0y;
    computed.lands = !!L;
    computed.tFlight = L ? L.t : NaN;
    computed.range = L ? L.x : NaN;
    computed.yEnd = L ? L.y : NaN;
    computed.along = L ? L.along : NaN;
    computed.speed = L ? Math.hypot(L.vx, L.vy) : NaN;
    computed.landAngle = L ? Math.atan2(-L.vy, L.vx) / DEG : NaN;
    // The top: the instant v_y = 0, if it comes before the landing.
    const tTop = v0y > 0 ? v0y / G : 0;
    computed.tTop = L && tTop <= L.t ? tTop : 0;
    computed.xTop = v0x * computed.tTop;
    computed.hMax = state.y0 + v0y * computed.tTop - 0.5 * G * computed.tTop ** 2;
    // The moment the slider picks.
    const t = L ? Math.min(1, Math.max(0, state.frac)) * L.t : 0;
    computed.t = t;
    computed.x = v0x * t;
    computed.y = state.y0 + v0y * t - 0.5 * G * t * t;
    computed.vx = v0x;
    computed.vy = v0y - G * t;
    computed.speedNow = Math.hypot(computed.vx, computed.vy);
  },
  second(state) {
    // Fly it in steps of 1 ms. With a constant acceleration each step is exact, so the error is only
    // rounding. Bisect the step that crosses the landing surface, and the one where v_y changes sign.
    const th = state.theta * DEG;
    const vx = state.v0 * Math.cos(th);
    const surface = (x) => (state.slope ? state.y0 + x * Math.tan(state.slope * DEG) : state.yLand);
    const h = 1e-3;
    let x = 0;
    let y = state.y0;
    let vy = state.v0 * Math.sin(th);
    let t = 0;
    let top = { t: 0, y: state.y0 };
    let land = null;
    let above = y - surface(x) > 1e-9;
    const at = (x0, y0, vy0, tau) => ({ x: x0 + vx * tau, y: y0 + vy0 * tau - 0.5 * G * tau * tau, vy: vy0 - G * tau });
    for (let i = 0; i < 1e6 && !land; i += 1) {
      const next = at(x, y, vy, h);
      if (vy > 0 && next.vy <= 0) {
        let lo = 0;
        let hi = h;
        for (let k = 0; k < 60; k += 1) {
          const mid = 0.5 * (lo + hi);
          if (at(x, y, vy, mid).vy > 0) lo = mid;
          else hi = mid;
        }
        top = { t: t + lo, y: at(x, y, vy, lo).y };
      }
      const gapNext = next.y - surface(next.x);
      if (above && gapNext <= 0) {
        let lo = 0;
        let hi = h;
        for (let k = 0; k < 60; k += 1) {
          const mid = 0.5 * (lo + hi);
          const p = at(x, y, vy, mid);
          if (p.y - surface(p.x) > 0) lo = mid;
          else hi = mid;
        }
        const p = at(x, y, vy, hi);
        land = { t: t + hi, x: p.x, y: p.y, vy: p.vy };
        break;
      }
      if (gapNext > 0) above = true;
      x = next.x;
      y = next.y;
      vy = next.vy;
      t += h;
      if (y < -1e4) break;
    }
    if (!land) return { lands: false };
    if (top.t > land.t) top = { t: 0, y: state.y0 };
    return {
      lands: true,
      tFlight: land.t,
      range: land.x,
      hMax: top.y,
      tTop: top.t,
      speed: Math.hypot(vx, land.vy),
      landAngle: Math.atan2(-land.vy, vx) / DEG,
    };
  },
  syncViews(state, computed, ctx) {
    const hd = ctx.handle;
    if (!hd) return;
    ctx.grid.visible = false;
    const T = computed.lands ? computed.tFlight : Math.max(0.5, (2 * Math.max(0, computed.v0y)) / G);
    const pos = (t, vx0, vy0) => [vx0 * t, state.y0 + vy0 * t - 0.5 * G * t * t];
    // The world box: the whole flight, the launch and the ground, with a little room.
    const xEnd = Math.max(1, computed.lands ? computed.range : computed.v0x * T);
    let yLo = Math.min(0, state.yLand, computed.lands ? computed.yEnd : 0);
    let yHi = Math.max(1, computed.hMax, state.y0, state.yLand);
    const twinOn = !!state.show?.twin && state.theta > 0 && state.theta < 90;
    let twinT = 0;
    let twinVx = 0;
    let twinVy = 0;
    if (twinOn) {
      const other = landing({ ...state, theta: 90 - state.theta });
      twinVx = state.v0 * Math.cos((90 - state.theta) * DEG);
      twinVy = state.v0 * Math.sin((90 - state.theta) * DEG);
      twinT = other ? other.t : 0;
      yHi = Math.max(yHi, state.y0 + (twinVy * twinVy) / (2 * G));
      if (other) yLo = Math.min(yLo, other.y);
    }
    const xLo = -0.08 * xEnd;
    const xHi = Math.max(xEnd, twinOn ? twinVx * twinT : 0) * 1.06;
    const span = yHi - yLo;
    yLo -= 0.05 * span;
    yHi += 0.08 * span;
    const k = Math.min(BOX.w / (xHi - xLo), BOX.h / (yHi - yLo));
    const ox = BOX.left - xLo * k;
    const oy = BOX.bottom - yLo * k;
    const sx = (x) => ox + x * k;
    const sy = (y) => oy + y * k;

    // The ground: a ledge at the launch height, then the slope, or the floor and any raised landing.
    const g = [];
    if (state.slope) {
      const tan = Math.tan(state.slope * DEG);
      g.push(xLo, state.y0, 0, 0, state.y0, 0, xHi, state.y0 + xHi * tan, 0);
    } else {
      g.push(xLo, state.y0, 0, 0, state.y0, 0, 0, 0, 0);
      if (state.yLand > 0 && computed.lands) {
        const vy0 = computed.v0y;
        const disc = vy0 * vy0 - 2 * G * (state.yLand - state.y0);
        const tUp = disc >= 0 ? (vy0 - Math.sqrt(disc)) / G : 0;
        const xStep = 0.5 * (Math.max(0, computed.v0x * tUp) + computed.range);
        g.push(xStep, 0, 0, xStep, state.yLand, 0, xHi, state.yLand, 0);
      } else {
        g.push(xHi, 0, 0);
      }
    }
    while (g.length < 8 * 3) g.push(g[g.length - 3], g[g.length - 2], g[g.length - 1]);
    for (let i = 0; i < g.length; i += 3) {
      g[i] = sx(g[i]);
      g[i + 1] = sy(g[i + 1]);
      g[i + 2] = 0.01;
    }
    updateFatLine(hd.ground, g);

    const pts = new Array(SAMPLES * 3);
    for (let i = 0; i < SAMPLES; i += 1) {
      const [x, y] = pos((T * i) / (SAMPLES - 1), computed.v0x, computed.v0y);
      pts[i * 3] = sx(x);
      pts[i * 3 + 1] = sy(y);
      pts[i * 3 + 2] = 0.02;
    }
    updateFatLine(hd.path, pts);
    hd.twin.visible = twinOn && twinT > 0;
    if (hd.twin.visible) {
      for (let i = 0; i < SAMPLES; i += 1) {
        const [x, y] = pos((twinT * i) / (SAMPLES - 1), twinVx, twinVy);
        pts[i * 3] = sx(x);
        pts[i * 3 + 1] = sy(y);
      }
      updateFatLine(hd.twin, pts);
    }

    // The top of the flight.
    hd.apex.visible = computed.tTop > 0;
    hd.apexName.visible = hd.apex.visible;
    if (hd.apex.visible) {
      hd.apex.position.set(sx(computed.xTop), sy(computed.hMax), 0.05);
      hd.apexName.element.innerHTML = `top, ${fmt(computed.hMax, 3)} m`;
      hd.apexName.position.set(sx(computed.xTop), sy(computed.hMax) + 0.42, 0);
    }

    // The ball at the chosen moment, its velocity, its parts, and g.
    const bx = sx(computed.x);
    const by = sy(computed.y);
    hd.ball.position.set(bx, by, 0.06);
    const per = 1.9 / Math.max(state.v0, 1e-9);
    placeArrow(hd.vel, bx, by, bx + computed.vx * per, by + computed.vy * per, 0.05);
    const parts = !!state.show?.parts;
    hd.vx.visible = parts;
    hd.vy.visible = parts;
    if (parts) {
      placeArrow(hd.vx, bx, by, bx + computed.vx * per, by, 0.045);
      placeArrow(hd.vy, bx, by, bx, by + computed.vy * per, 0.045);
    }
    placeArrow(hd.acc, bx, by, bx, by - 1.1, 0.05);
    hd.vName.position.set(bx + computed.vx * per + 0.3, by + computed.vy * per + 0.25, 0);
    hd.vName.visible = hd.vel.visible;
    hd.gName.position.set(bx + 0.3, by - 1.0, 0);

    // Ticks in metres along the floor and up the left side.
    const stepX = niceStep(xHi - xLo, 5);
    let n = 0;
    for (let x = Math.ceil(xLo / stepX) * stepX; x <= xHi + 1e-9 && n < hd.xTicks.length; x += stepX) {
      const tick = hd.xTicks[n++];
      tick.visible = true;
      tick.element.textContent = String(Number(x.toPrecision(3))).replace('-', '−');
      tick.position.set(sx(x), BOX.bottom - 0.32, 0);
    }
    for (; n < hd.xTicks.length; n += 1) hd.xTicks[n].visible = false;
    const stepY = niceStep(yHi - yLo, 4);
    n = 0;
    for (let y = Math.ceil(yLo / stepY) * stepY; y <= yHi + 1e-9 && n < hd.yTicks.length; y += stepY) {
      const tick = hd.yTicks[n++];
      tick.visible = true;
      tick.element.textContent = String(Number(y.toPrecision(3))).replace('-', '−');
      tick.position.set(BOX.left - 0.42, sy(y), 0);
    }
    for (; n < hd.yTicks.length; n += 1) hd.yTicks[n].visible = false;
  },
  law: () => [
    String.raw`x = v_0\cos\theta\,t,\qquad y = y_0 + v_0\sin\theta\,t - \tfrac12 g t^2`,
    String.raw`R = \dfrac{v_0^2\sin 2\theta}{g}\quad\text{(launch and landing at one height)}`,
  ],
  readoutCells(state, computed) {
    const rows = [
      ['Lands this far out', computed.lands ? `${fmt(computed.range)} m` : 'never reaches it'],
      ['Time in the air', `${fmt(computed.tFlight)} s`],
      ['Highest point', `${fmt(computed.hMax)} m, at ${fmt(computed.tTop, 3)} s`],
      ['Landing speed', `${fmt(computed.speed)} m/s, ${fmt(computed.landAngle, 3)}° below the horizontal`],
      [String.raw`At $t = ${fmt(computed.t, 3)}$ s`, String.raw`$v_x = ${fmt(computed.vx, 3)}$, $v_y = ${fmt(computed.vy, 3)}$ m/s`],
    ];
    if (state.slope) rows.splice(1, 0, ['Distance along the slope', `${fmt(computed.along)} m`]);
    return rows;
  },
  coach(state, computed) {
    const level = !state.slope && Math.abs(state.y0 - state.yLand) < 1e-9;
    const body = [
      String.raw`Sideways nothing pushes, so $v_x = ${fmt(computed.v0x, 4)}$ m/s from launch to landing: watch its arrow keep its length. Up and down it is free fall, with $v_y$ falling by $9.81$ m/s every second. The only thing the two motions share is the time.`,
    ];
    if (!computed.lands) body.push(String.raw`This launch never gets up to the landing height, so it has no landing point.`);
    else if (level) body.push(String.raw`Launch and landing are at one height, so $R = v_0^2\sin 2\theta/g = ${fmt(computed.range, 4)}$ m. The angle $90^\circ - \theta$ lands in the same place. Turn on the other angle to see it.`);
    else body.push(String.raw`Launch and landing are at different heights, so the level-ground range formula does not apply. The landing time is the later root of $y(t) = y_{\text{land}}$: here $${fmt(computed.tFlight, 4)}$ s, and the ball lands $${fmt(computed.range, 4)}$ m out.`);
    body.push(String.raw`<b>What the model leaves out.</b> Air drag. A real ball loses speed to the air, most of it at high speed, so it falls short of these numbers and comes down steeper than it went up. Spin, wind and the curve of the Earth are left out too.`);
    return { title: 'Two motions, one clock', body };
  },
});
