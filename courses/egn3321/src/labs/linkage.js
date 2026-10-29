import { G } from '@flux/subjects/mechanics/constants.js';
import { pinnedRelease, slotRelease } from '@flux/subjects/mechanics/rigid-energy.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'bar', name: 'Pinned bar', mode: 'bar', mass: 4, length: 2, theta1: 90, theta2: 0, kappa: 0, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'couple', name: 'Torsional spring', mode: 'bar', mass: 4, length: 2, theta1: 90, theta2: 0, kappa: 15, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'slots', name: 'Two slots', mode: 'slots', mass: 3, length: 1.5, theta1: 60, theta2: 30, kappa: 0, restDeg: 0, k: 0, springRest: 'zero' },
  { id: 'spring', name: 'Spring at the foot', mode: 'slots', mass: 3, length: 1.5, theta1: 60, theta2: 30, kappa: 0, restDeg: 0, k: 40, springRest: 'length' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.mass = sc.mass;
  state.length = sc.length;
  state.theta1 = sc.theta1;
  state.theta2 = sc.theta2;
  state.kappa = sc.kappa;
  state.restDeg = sc.restDeg;
  state.k = sc.k;
  state.springRest = sc.springRest;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Work and energy for rigid bodies (Hibbeler §18.1–18.5): a bar released about a pin, with or without
 * a torsional spring, and a rod sliding down two slots, with or without a spring at its foot. Shows
 * that T = ½ I ω² about the pin, or about the instantaneous centre when the body has no fixed point,
 * gives ω at any position from the release, without a moment equation. Play swings the body from its
 * release, and the chart gives ω at every position.
 *
 * Recompute: T₁ + V₁ + ΣU = T₂ + V₂. Check: the same position reached by the equation of motion,
 * stepped in time (rigid-energy.js).
 */

function clamp(x, lo, hi, fallback) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function barEnd(length, deg) {
  const th = deg * Math.PI / 180;
  return { x: length * Math.sin(th), y: -length * Math.cos(th) };
}

/** A narrow outline, so a bar that lies on a grid axis is still a bar. */
function zigzag(x0, y0, x1, y1, amp) {
  const pts = [];
  const n = 8;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const side = i === 0 || i === n ? 0 : (i % 2 === 0 ? -amp : amp);
    pts.push([x0 + dx * u + px * side, y0 + dy * u + py * side]);
  }
  return pts;
}

const QUIET = {
  omega: 0, vG: 0, T: 0, work: 0, gap: 0, reaches: false,
  gx: 0, gy: 0, ex: 0, ey: 0, vx: 0, vy: 0,
  ax: 0, ay: 0, bx: 0, by: 0, icx: 0, icy: 0,
};

export default defineLab({
  id: 'linkage',
  exam: 'u7',
  title: 'Linkage',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: (state) => (state.mode === 'slots' ? { key: 'theta2', lo: 5, hi: 80 } : { key: 'theta2', lo: 0, hi: 180 }),
  hint: 'Write T about the instantaneous centre when that point carries the kinematics.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bar', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('lk-mass', 'mass (kg)', 4, 1, 10, 0.5)}
      ${slider('lk-length', 'length (m)', 2, 0.6, 3, 0.1)}
      ${slider('lk-theta1', 'release (deg)', 90, 0, 180, 1)}
      ${slider('lk-theta2', 'position (deg)', 0, 0, 180, 1)}
      ${slider('lk-kappa', 'κ (N·m/rad)', 0, 0, 30, 0.5)}
      ${slider('lk-k', 'k (N/m)', 0, 0, 80, 1)}
      <p class="tiny">For the pinned bar, 0 hangs straight down. For the rod in the slots, 0 lies on the floor. Gold is the instantaneous centre; the faint bar is the release. Play swings the body from its release; the chart gives ω at every position.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('lk-mass', 'mass');
    link('lk-length', 'length');
    link('lk-theta1', 'theta1');
    link('lk-theta2', 'theta2');
    link('lk-kappa', 'kappa');
    link('lk-k', 'k');
  },
  syncControls(state) {
    const slots = state.mode === 'slots';
    const set = (id, val, max, min) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(max);
      if (min != null) el.min = String(min);
      if (document.activeElement !== el) el.value = String(val);
    };
    set('lk-mass', state.mass);
    set('lk-length', state.length);
    set('lk-theta1', state.theta1, slots ? 80 : 180, slots ? 5 : 0);
    set('lk-theta2', state.theta2, slots ? 80 : 180, slots ? 5 : 0);
    set('lk-kappa', state.kappa);
    set('lk-k', state.k);
    const release = document.querySelector('#lk-theta1-field > span');
    const position = document.querySelector('#lk-theta2-field > span');
    if (release) release.textContent = slots ? 'release, from the floor (deg)' : 'release, from hanging (deg)';
    if (position) position.textContent = slots ? 'position, from the floor (deg)' : 'position, from hanging (deg)';
    showField('lk-kappa', !slots);
    showField('lk-k', slots);
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // From the release toward the bottom (bar) or the floor (slots), then back to the release.
    const slots = state.mode === 'slots';
    const end = slots ? 5 : 0;
    const start = Number(state.theta1) || 0;
    let th = (Number(state.theta2) || 0) - Math.sign(start - end || 1) * 40 * dt;
    if ((start > end && th < end) || (start < end && th > end) || Math.abs(th - start) > Math.abs(end - start) + 1) th = start;
    state.theta2 = th;
    return true;
  },
  compute(state) {
    state = { ...state };
    const computed = {};
    const slots = state.mode === 'slots';
    state.mass = clamp(state.mass, 1, 10, 4);
    state.length = clamp(state.length, 0.6, 3, 2);
    state.kappa = clamp(state.kappa, 0, 30, 0);
    state.k = clamp(state.k, 0, 80, 0);
    state.restDeg = clamp(state.restDeg, 0, 180, 0);
    if (slots) {
      state.theta1 = clamp(state.theta1, 5, 80, 60);
      state.theta2 = clamp(state.theta2, 5, 80, 30);
      const rest = state.springRest === 'length' ? state.length : 0;
      const row = slotRelease({
        mass: state.mass,
        length: state.length,
        theta1Deg: state.theta1,
        theta2Deg: state.theta2,
        k: state.k,
        rest,
      });
      Object.assign(computed, QUIET, {
        omega: row.omega,
        vG: row.vG,
        T: row.T,
        work: 0,
        gap: row.gap,
        reaches: row.reaches,
        gx: row.gx,
        gy: row.gy,
        vx: row.vx,
        vy: row.vy,
        ax: row.ax,
        ay: row.ay,
        bx: row.bx,
        by: row.by,
        icx: row.icx,
        icy: row.icy,
      });
      computed.series = [];
      for (let th = 5; th <= 80; th += 1) {
        const q = slotRelease({ mass: state.mass, length: state.length, theta1Deg: state.theta1, theta2Deg: th, k: state.k, rest });
        computed.series.push([th, q.reaches ? q.omega : NaN]);
      }
      computed.theta2 = state.theta2;
      computed.theta1 = state.theta1;
      return computed;
    }
    state.theta1 = clamp(state.theta1, 0, 180, 90);
    state.theta2 = clamp(state.theta2, 0, 180, 0);
    const row = pinnedRelease({
      mass: state.mass,
      length: state.length,
      theta1Deg: state.theta1,
      theta2Deg: state.theta2,
      kappa: state.kappa,
      restDeg: state.restDeg,
    });
    Object.assign(computed, QUIET, {
      omega: row.omega,
      vG: row.vG,
      T: row.T,
      work: row.work,
      gap: row.gap,
      reaches: row.reaches,
      gx: row.gx,
      gy: row.gy,
      ex: row.ex,
      ey: row.ey,
      vx: row.vx,
      vy: row.vy,
    });
    computed.series = [];
    for (let th = 0; th <= 180; th += 2) {
      const q = pinnedRelease({ mass: state.mass, length: state.length, theta1Deg: state.theta1, theta2Deg: th, kappa: state.kappa, restDeg: state.restDeg });
      computed.series.push([th, q.reaches ? q.omega : NaN]);
    }
    computed.theta2 = state.theta2;
    computed.theta1 = state.theta1;
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const L = Math.max(Number(state.length) || 1, 0.4);
    const slots = state.mode === 'slots';
    const W = (Number(state.mass) || 0) * G;
    const speed = Math.hypot(c.vx, c.vy);
    if (!slots) {
      const S = sceneIn(B, left, { x0: -1.2 * L, x1: 1.2 * L, y0: -1.2 * L, y1: 1.2 * L });
      const ghost = barEnd(L, Number(c.theta1) || 0);
      seg(S, [0, 0], [ghost.x, ghost.y], { color: alpha(C.text, 0.25), width: 5 });
      if (Number(state.kappa) > 0) {
        // The torsional spring, unwound when the bar hangs down: a coil at the pin.
        const pts = Array.from({ length: 60 }, (_, i) => {
          const a = (i / 59) * 4 * Math.PI;
          const r = 0.05 * L + (0.1 * L * i) / 59;
          return [r * Math.cos(a), r * Math.sin(a)];
        });
        line(S, pts, { color: C.pink, width: 1.5 });
      }
      seg(S, [0, 0], [c.ex, c.ey], { color: C.teal, width: 7 });
      dot(S, 0, 0, { color: C.gold, r: 6 });
      dot(S, c.gx, c.gy, { color: C.text, r: 3 });
      const k = (0.3 * L * S.k) / Math.max(W, 1e-6);
      vec(S, [c.gx, c.gy], [0, -W], k, { color: C.dim, label: 'mg' });
      if (speed > 1e-6) vec(S, [c.gx, c.gy], [c.vx, c.vy], (0.35 * L * S.k) / Math.max(speed, 1), { color: C.text, label: veiled ? 'v_G' : `${fig(speed)} m/s` });
    } else {
      const S = sceneIn(B, left, { x0: -0.15 * L, x1: 1.15 * L, y0: -0.2 * L, y1: 1.12 * L });
      poly(S, [[-0.08 * L, -0.06 * L], [1.12 * L, -0.06 * L], [1.12 * L, 0], [0, 0], [0, 1.1 * L], [-0.08 * L, 1.1 * L]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.6), width: 1.5 });
      const th1 = ((Number(c.theta1) || 0) * Math.PI) / 180;
      seg(S, [L * Math.cos(th1), 0], [0, L * Math.sin(th1)], { color: alpha(C.text, 0.25), width: 4 });
      if (Number(state.k) > 0) line(S, zigzag(0, 0.02 * L, c.ax, 0.02 * L, 0.04 * L), { color: C.pink, width: 1.5 });
      seg(S, [c.ax, c.ay], [c.bx, c.by], { color: C.teal, width: 6 });
      seg(S, [c.ax, c.ay], [c.icx, c.icy], { color: alpha(C.gold, 0.55), width: 1, dash: [5, 4] });
      seg(S, [c.bx, c.by], [c.icx, c.icy], { color: alpha(C.gold, 0.55), width: 1, dash: [5, 4] });
      dot(S, c.icx, c.icy, { color: C.gold, r: 6 });
      label(S, 'IC', [c.icx, c.icy], { color: C.gold, dx: 12, dy: -10 });
      dot(S, c.gx, c.gy, { color: C.text, r: 3 });
      const k = (0.25 * L * S.k) / Math.max(W, 1e-6);
      vec(S, [c.gx, c.gy], [0, -W], k, { color: C.dim, label: 'mg' });
      if (speed > 1e-6) vec(S, [c.gx, c.gy], [c.vx, c.vy], (0.3 * L * S.k) / Math.max(speed, 1), { color: C.text, label: veiled ? 'v_G' : `${fig(speed)} m/s` });
    }
    if (veiled) return;
    // ω at every position from this release.
    const fin = c.series.filter((q) => Number.isFinite(q[1]));
    const hi = Math.max(0.5, ...fin.map((q) => q[1])) * 1.15;
    const lo0 = slots ? 5 : 0;
    const hi0 = slots ? 80 : 180;
    const P = chartIn(B, right, { lo: lo0, hi: hi0 }, { lo: 0, hi });
    axes(P, { xLabel: slots ? 'angle from the floor (deg)' : 'angle from hanging (deg)', yLabel: 'ω (rad/s)' });
    line(P, fin, { color: C.teal, width: 2.5 });
    line(P, [[Number(c.theta1), 0], [Number(c.theta1), hi]], { color: alpha(C.text, 0.35), width: 1, dash: [4, 4] });
    label(P, 'release', [Number(c.theta1), hi], { color: C.muted, dy: 10 });
    if (c.reaches) dot(P, Number(c.theta2), c.omega, { color: C.yellow, r: 5 });
  },
  law(state) {
    if (state.mode === 'slots') return [String.raw`T=\tfrac{1}{2}I_{IC}\omega^2`];
    return [String.raw`T=\tfrac{1}{2}I_O\omega^2`];
  },
  liveRows(state, c) {
    const rows = [
      kv('$\\omega$', `${fig(c.omega)} rad/s`),
      kv('T', `${fig(c.T)} J`),
    ];
    if (state.mode !== 'slots' && Number(state.kappa) > 0) rows.push(kv('couple', `${fig(c.work)} J`));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['$\\omega$', fig(c.omega)],
      ['$v_G$', fig(c.vG)],
      ['T', `${fig(c.T)} J`],
    ]);
  },
  coach(state, c) {
    if (!c.reaches) {
      return { title: 'Short of that angle', body: 'The bar stops short of that angle.' };
    }
    if (state.mode !== 'slots' && Number(state.kappa) > 0) {
      return {
        title: 'The spring adds its work',
        body: `The torsional spring is unstretched when the bar hangs down. Its work is ${fig(c.work)} J, and ω is ${fig(c.omega)} rad/s.`,
      };
    }
    if (state.mode !== 'slots') {
      return {
        title: 'The centre drops half the length',
        body: `ω is ${fig(c.omega)} rad/s. The centre moves at ${fig(c.vG)} m/s, because it sits halfway along the bar.`,
      };
    }
    if (Number(state.k) > 0) {
      return {
        title: 'The spring pushes the foot out',
        body: `The natural length equals the rod. The spring starts compressed and pushes the foot outward. ω is ${fig(c.omega)} rad/s.`,
      };
    }
    return {
      title: 'Use the instantaneous centre',
      body: `Gold marks the instantaneous centre. About that corner, I is mL²/3. ω is ${fig(c.omega)} rad/s and the centre moves at ${fig(c.vG)} m/s.`,
    };
  },
});
