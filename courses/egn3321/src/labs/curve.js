import { G } from '@flux/subjects/mechanics/constants.js';
import { bankedCurve, verticalLoop } from '@flux/subjects/mechanics/dynamics.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'bank',
    name: 'Bank, no friction',
    mass: 1200,
    radius: 40,
    theta: 20,
    speed: 12,
    mu: 0,
    phi: 180,
    vb: 5,
  },
  {
    id: 'band',
    name: 'Bank with friction',
    mass: 1000,
    radius: 40,
    theta: 20,
    speed: 12,
    mu: 0.2,
    phi: 180,
    vb: 5,
  },
  {
    id: 'loop',
    name: 'Vertical loop',
    mass: 0.5,
    radius: 0.4,
    theta: 20,
    speed: 12,
    mu: 0,
    phi: 180,
    vb: 5,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.radius = sc.radius;
  state.theta = sc.theta;
  state.speed = sc.speed;
  state.mu = sc.mu;
  state.phi = sc.phi;
  state.vb = sc.vb;
  if (sc.id === 'bank') {
    state.speed = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      mu: 0,
      g: G,
    }).vDesign;
  }
}

/** x–y solve. +x points toward the centre of the curve, +y is up. */
function bankXY(mass, radius, thetaDeg, speed) {
  const th = (thetaDeg * Math.PI) / 180;
  const nx = Math.sin(th);
  const ny = Math.cos(th);
  const dx = Math.cos(th);
  const dy = -Math.sin(th);
  const bx = (mass * speed * speed) / radius;
  const by = mass * G;
  const det = nx * dy - dx * ny;
  return {
    N: (bx * dy - dx * by) / det,
    f: (nx * by - bx * ny) / det,
  };
}

/** Speed from integrating a_t = −g sinφ along the loop. */
function loopSpeed(radius, vb, phiDeg) {
  const phi = (phiDeg * Math.PI) / 180;
  if (!(phi > 1e-8)) return vb;
  const steps = 4000;
  const dphi = phi / steps;
  let v = vb;
  for (let i = 0; i < steps; i++) {
    const mid = (i + 0.5) * dphi;
    const at = -G * Math.sin(mid);
    v = Math.sqrt(Math.max(0, v * v + 2 * at * radius * dphi));
  }
  return v;
}

/** A box's outline: centre (cx, cy), w by h, turned by ang. */
function rect(cx, cy, w, h, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

/**
 * Normal and tangential kinetics (Hibbeler §13.5): a car on a banked curve, and a cart in a vertical
 * loop. Shows that the bank alone holds the car at one design speed, that friction opens a band of
 * speeds around it, and that in the loop the normal force is least at the top and can reach zero.
 * The kinetic diagram, m v²/ρ toward the centre, sits beside the forces. Play runs the cart round
 * the loop.
 *
 * Recompute: ΣF_n = m v²/ρ and ΣF_t = m a_t. Check: the bank solved in x–y, and the loop's speed by
 * integrating a_t = −g sin φ.
 */
export default defineLab({
  id: 'curve',
  exam: 'u2',
  title: 'Curve',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: (state) => (state.scenarioId === 'loop' ? { key: 'phi', lo: 0, hi: 180 } : { key: 'speed', lo: 0, hi: 40 }),
  hint: 'Change the speed. Friction opens a band. In the loop the normal force is least at the top.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = { anim: { playing: false }, show: { play: false } };
    apply('bank', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('cv-mass', 'mass (kg)', 1200, 0.2, 2000, 0.1)}
      ${slider('cv-radius', 'ρ (m)', 40, 0.2, 80, 0.1)}
      ${slider('cv-theta', 'θ (deg)', 20, 5, 40, 1)}
      ${slider('cv-speed', 'v (m/s)', 12, 0, 40, 0.1)}
      ${slider('cv-mu', 'μₛ', 0, 0, 0.6, 0.01)}
      ${slider('cv-phi', 'φ from the bottom (deg)', 180, 0, 180, 1)}
      ${slider('cv-vb', 'speed at the bottom (m/s)', 5, 1, 20, 0.1)}
      <p class="tiny">Teal is the normal, pink is friction, grey is weight: the free-body diagram. Purple dashed is m v²/ρ toward the centre, and m aₜ in the loop: the kinetic diagram. Play runs the cart round the loop.</p>`;
  },
  bind(api) {
    bindSlider('cv-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('cv-radius', (s, v) => { s.radius = v; }, api);
    bindSlider('cv-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('cv-speed', (s, v) => { s.speed = v; }, api);
    bindSlider('cv-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('cv-phi', (s, v) => { s.phi = v; }, api);
    bindSlider('cv-vb', (s, v) => { s.vb = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const loop = state.scenarioId === 'loop';
    set('cv-mass', state.mass);
    set('cv-radius', state.radius);
    set('cv-theta', state.theta);
    set('cv-speed', state.speed);
    set('cv-mu', state.mu);
    set('cv-phi', state.phi);
    set('cv-vb', state.vb);
    showField('cv-theta', !loop);
    showField('cv-speed', !loop);
    showField('cv-mu', !loop);
    showField('cv-phi', loop);
    showField('cv-vb', loop);
  },
  tick(dt, state) {
    if (!playing(state) || state.scenarioId !== 'loop') return false;
    // Round the loop at the cart's own speed, a quarter of real time; back to the bottom at the top.
    const row = verticalLoop({ mass: state.mass, radius: state.radius, speedBottom: state.vb, phiDeg: state.phi, g: G });
    const v = row.lost ? 0 : Math.max(row.speed, 0.3);
    let phi = state.phi + ((0.25 * dt * v) / Math.max(state.radius, 0.05)) * (180 / Math.PI);
    if (phi > 180 || row.lost) phi = 0;
    state.phi = phi;
    return true;
  },
  compute(state) {
    const computed = {};
    if (state.scenarioId === 'loop') {
      const row = verticalLoop({
        mass: state.mass,
        radius: state.radius,
        speedBottom: state.vb,
        phiDeg: state.phi,
        g: G,
      });
      const integrated = loopSpeed(state.radius, state.vb, state.phi);
      const speedGap = Math.abs(integrated - row.speed) / Math.max(1, Math.abs(row.speed));
      const phi = (state.phi * Math.PI) / 180;
      const n = { x: -Math.sin(phi), y: Math.cos(phi) };
      const t = { x: Math.cos(phi), y: Math.sin(phi) };
      const an = row.lost ? 0 : row.an;
      const ax = an * n.x + row.at * t.x;
      const ay = an * n.y + row.at * t.y;
      const rx = row.N * n.x - state.mass * ax;
      const ry = row.N * n.y - state.mass * G - state.mass * ay;
      const residual = Math.hypot(rx, ry) / Math.max(1, state.mass * G);
      const top = verticalLoop({
        mass: state.mass,
        radius: state.radius,
        speedBottom: state.vb,
        phiDeg: 180,
        g: G,
      });
      Object.assign(computed, {
        N: row.N,
        f: 0,
        speed: row.speed,
        vMin: 0,
        vMax: 0,
        vDesign: 0,
        holds: !row.leaves,
        lost: row.lost,
        leaves: row.leaves,
        nTop: top.lost ? null : top.N,
        regime: row.lost ? 'short' : row.leaves ? 'leaves' : 'on track',
        gap: row.lost ? 0 : Math.max(speedGap, residual),
        an,
        at: row.at,
        series: Array.from({ length: 73 }, (_, i) => {
          const q = verticalLoop({ mass: state.mass, radius: state.radius, speedBottom: state.vb, phiDeg: i * 2.5, g: G });
          return [i * 2.5, q.lost ? NaN : q.N];
        }),
      });
      return computed;
    }
    const row = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      speed: state.speed,
      mu: state.mu,
      g: G,
    });
    const xy = bankXY(state.mass, state.radius, state.theta, state.speed);
    const gap = Math.hypot(row.N - xy.N, row.f - xy.f) / Math.max(1, state.mass * G);
    const atMax = bankedCurve({
      mass: state.mass,
      radius: state.radius,
      thetaDeg: state.theta,
      speed: Number.isFinite(row.vMax) ? row.vMax : row.vDesign,
      mu: state.mu,
      g: G,
    });
    Object.assign(computed, {
      N: row.N,
      f: row.f,
      speed: state.speed,
      vMin: row.vMin,
      vMax: row.vMax,
      vDesign: row.vDesign,
      holds: row.holds,
      lost: false,
      leaves: false,
      nTop: atMax.N,
      regime: row.regime,
      gap,
      series: Array.from({ length: 81 }, (_, i) => {
        const v = i * 0.5;
        const q = bankXY(state.mass, state.radius, state.theta, v);
        return [v, q.f / q.N];
      }),
    });
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const W = state.mass * G;
    if (state.scenarioId === 'loop') {
      const R = Math.max(state.radius, 0.05);
      const S = sceneIn(B, left, { x0: -1.6 * R, x1: 1.6 * R, y0: -1.5 * R, y1: 1.5 * R });
      circle(S, [0, 0], R, { stroke: alpha(C.text, 0.7), width: 4 });
      const phi = (state.phi * Math.PI) / 180;
      const P = [R * Math.sin(phi), -R * Math.cos(phi)];
      const n = [-Math.sin(phi), Math.cos(phi)];
      const t = [Math.cos(phi), Math.sin(phi)];
      poly(S, rect(P[0] - 0.07 * R * n[0], P[1] - 0.07 * R * n[1], 0.22 * R, 0.12 * R, phi), { fill: alpha(C.blue, 0.4), stroke: C.blue, width: 1.5 });
      const k = (0.6 * R * S.k) / Math.max(W, Math.abs(c.N), 1e-9);
      vec(S, P, [0, -W], k, { color: C.dim, label: 'mg' });
      if (!c.lost && Math.abs(c.N) > 1e-9) vec(S, P, [c.N * n[0], c.N * n[1]], k, { color: C.teal, label: 'N' });
      if (!c.lost) {
        const man = state.mass * c.an;
        const mat = state.mass * c.at;
        const off = [P[0] + 0.25 * R * t[0], P[1] + 0.25 * R * t[1]];
        if (Math.abs(man) > 1e-9) vec(S, off, [man * n[0], man * n[1]], k, { color: C.purple, dash: [5, 4], width: 2, label: 'mv²/ρ' });
        if (Math.abs(mat) > 1e-9) vec(S, off, [mat * t[0], mat * t[1]], k, { color: C.purple, dash: [5, 4], width: 2, label: 'maₜ' });
      }
      dot(S, 0, 0, { color: alpha(C.text, 0.5), r: 3 });
      if (veiled) return;
      const fin = c.series.filter((q) => Number.isFinite(q[1]));
      const lo = Math.min(0, ...fin.map((q) => q[1])) * 1.1;
      const hi = Math.max(W, ...fin.map((q) => q[1])) * 1.1;
      const Pc = chartIn(B, right, { lo: 0, hi: 180 }, { lo, hi });
      axes(Pc, { xLabel: 'φ from the bottom (deg)', yLabel: 'normal force N (N)' });
      line(Pc, [[0, 0], [180, 0]], { color: alpha(C.red, 0.6), width: 1, dash: [4, 4] });
      line(Pc, fin, { color: C.teal, width: 2.5 });
      if (!c.lost) dot(Pc, state.phi, c.N, { color: C.yellow, r: 5 });
      return;
    }
    // The bank's cross-section, looking along the road: the centre of the curve to the left.
    const th = (state.theta * Math.PI) / 180;
    const u = [Math.cos(th), Math.sin(th)];
    const nrm = [-Math.sin(th), Math.cos(th)];
    const S = sceneIn(B, left, { x0: -2.4, x1: 2.4, y0: -1.4, y1: 2 });
    poly(S, [[-2 * u[0], -2 * u[1]], [2 * u[0], 2 * u[1]], [2 * u[0], -1.3], [-2 * u[0], -1.3]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.6), width: 1.5 });
    const car = [0.32 * nrm[0], 0.32 * nrm[1]];
    poly(S, rect(car[0], car[1], 1.1, 0.5, th), { fill: alpha(C.blue, 0.35), stroke: C.blue, width: 1.5 });
    label(S, '← centre of the curve', [-2.3, 1.75], { color: C.muted, align: 'left' });
    const k = (1.1 * S.k) / Math.max(W, 1);
    vec(S, car, [0, -W], k, { color: C.dim, label: 'mg' });
    vec(S, [car[0] - 0.1 * u[0], car[1] - 0.1 * u[1]], [c.N * nrm[0], c.N * nrm[1]], k, { color: C.teal, label: 'N' });
    // f is positive down the bank, toward the centre.
    if (Math.abs(c.f) > 1e-6) vec(S, [car[0] - 0.28 * nrm[0], car[1] - 0.28 * nrm[1]], [-c.f * u[0], -c.f * u[1]], k, { color: C.pink, label: 'f' });
    const man = (state.mass * state.speed * state.speed) / Math.max(state.radius, 1e-6);
    if (man > 1e-6) vec(S, [1.6, 1.2], [-man, 0], k, { color: C.purple, dash: [5, 4], width: 2, label: 'mv²/ρ' });
    if (veiled) return;
    // The friction the car needs at each speed, as a share of N, against the ±μ static friction can give.
    const fs = c.series.map((q) => q[1]);
    const mu = state.mu;
    const lo = Math.min(-0.4, ...fs);
    const hi = Math.max(0.4, ...fs);
    const Pc = chartIn(B, right, { lo: 0, hi: 40 }, { lo, hi });
    axes(Pc, { xLabel: 'speed v (m/s)', yLabel: 'friction needed / N, against ±μ' });
    if (mu > 0) poly(Pc, [[0, -mu], [40, -mu], [40, mu], [0, mu]], { fill: alpha(C.teal, 0.12), stroke: null });
    line(Pc, [[0, 0], [40, 0]], { color: alpha(C.text, 0.4), width: 1 });
    line(Pc, c.series, { color: C.pink, width: 2.5 });
    dot(Pc, c.vDesign, 0, { color: C.text, r: 4 });
    label(Pc, 'design speed', [c.vDesign, 0], { color: C.muted, dy: 14 });
    dot(Pc, state.speed, c.f / Math.max(c.N, 1e-9), { color: C.yellow, r: 5 });
  },
  law(state) {
    if (state.scenarioId === 'loop') {
      return [String.raw`\sum F_n = m\dfrac{v^2}{\rho}`, String.raw`N=m\left(\dfrac{v^2}{\rho}+g\cos\phi\right)`];
    }
    return [String.raw`\sum F_n = m\dfrac{v^2}{\rho}`, String.raw`v=\sqrt{\rho g\tan\theta}`];
  },
  liveRows(state, c) {
    if (state.scenarioId === 'loop') {
      return [
        kv('$N$', `${fig(c.N)} N`),
        kv('$v$', `${fig(c.speed)} m/s`),
        kv('$N_{top}$', `${fig(c.nTop)} N`),
      ].join('');
    }
    return [
      kv('$v$', `${fig(c.speed)} m/s`),
      kv('$v_{min}$', `${fig(c.vMin)} m/s`),
      kv('$v_{max}$', `${fig(c.vMax)} m/s`),
      kv('$N$', `${fig(c.N)} N`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'loop') {
      return cells([
        ['normal', c.lost ? 'does not reach' : `${fig(c.N)} N`],
        ['speed', c.lost ? '—' : `${fig(c.speed)} m/s`],
        ['normal at top', c.nTop && !c.lost ? `${fig(c.nTop)} N` : '—'],
        ['radius', `${fig(state.radius)} m`],
      ]);
    }
    return cells([
      ['speed', `${fig(c.speed)} m/s`],
      ['design', `${fig(c.vDesign)} m/s`],
      ['band', `<span class="lo">${fig(c.vMin)}–</span><span class="hi">${fig(c.vMax)} m/s</span>`, 'stack'],
      ['normal', `${fig(c.N)} N`],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'loop') {
      if (c.lost) {
        return { title: 'It does not reach this angle', body: 'The speed at the bottom is short of the height. Lower the angle or add speed.' };
      }
      if (c.leaves) {
        return {
          title: 'The normal force has dropped through zero',
          body: String.raw`At this angle $N = ${fig(c.N)}\ \mathrm{N}$. A car on the inside of the track needs $N \ge 0$.`,
        };
      }
      return {
        title: 'The normal force is least at the top',
        body: c.nTop == null
          ? 'This start does not reach the top. The normal force still falls as the car climbs.'
          : String.raw`Here $N = ${fig(c.N)}\ \mathrm{N}$. At the top, with this same start, $N = ${fig(c.nTop)}\ \mathrm{N}$.`,
      };
    }
    if (state.mu < 1e-9) {
      const on = Math.abs(c.speed - c.vDesign) < 0.05;
      return {
        title: on ? 'One speed needs no friction' : 'Off the design speed, the car slides',
        body: on
          ? String.raw`With $\mu = 0$, $v = \sqrt{\rho g\tan\theta} = ${fig(c.vDesign)}\ \mathrm{m/s}$.`
          : String.raw`The design speed is $${fig(c.vDesign)}\ \mathrm{m/s}$. This speed is $${fig(c.speed)}\ \mathrm{m/s}$.`,
      };
    }
    return {
      title: c.holds ? 'Inside the friction band' : 'Outside the friction band',
      body: c.holds
        ? String.raw`Static friction holds from $${fig(c.vMin)}\ \mathrm{m/s}$ to $${fig(c.vMax)}\ \mathrm{m/s}$.`
        : String.raw`The band is $${fig(c.vMin)}$ to $${fig(c.vMax)}\ \mathrm{m/s}$. This car is at $${fig(c.speed)}\ \mathrm{m/s}$.`,
    };
  },
});
