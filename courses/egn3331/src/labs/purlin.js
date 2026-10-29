import { tiltedRect } from '@flux/subjects/mechanics/bending.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a beam turned off its principal axes bends sideways too, and the weak axis wins: a
 * 2×6 purlin set square to a 4:12 roof carries gravity at 18.4° to its depth, and its corner
 * stress is twice what the same purlin sees upright. The neutral axis swings to within 13° of the
 * board's depth, nowhere near the 18.4° of the load.
 *
 * Cited: a 2×6 dresses to 1.5 × 5.5 in (American Softwood Lumber Standard, PS 20). The roof live
 * load is 20 psf (IBC Table 1607.1, ordinary roofs). The 5 psf dead load of a metal roof, the 2 ft
 * purlin spacing and the 8 ft span between trusses are assumed. Recompute: split M into its
 * components on the board's own axes. Second method: the general formula with the product of
 * inertia in vertical and horizontal axes, σ = −M(Y I_YY − Z I_YZ)/(I_YY I_ZZ − I_YZ²), at every
 * corner.
 */

const B_IN = 1.5;
const H_IN = 5.5;
const LIVE = 20;
const DEAD = 5;
const OUT = 'The purlin is free to bend sideways. On a real roof the metal panels or sheathing screwed to its top resist that, and much of the downslope part of the load goes into the roof plane instead. That is why the code lets a braced purlin be checked about its strong axis. The roof live load acts on the horizontal projection and may be reduced on steep roofs (IBC 1607.13); snow and wind are separate cases. Wood strength also depends on load duration.';

const SCENARIOS = [
  { id: 'p4', name: '2×6 on a 4:12 roof', pitch: 4, b: B_IN, h: H_IN, L: 8, space: 2 },
  { id: 'flat', name: 'The same purlin upright', pitch: 0, b: B_IN, h: H_IN, L: 8, space: 2 },
  { id: 'p12', name: '12:12 roof', pitch: 12, b: B_IN, h: H_IN, L: 8, space: 2 },
  { id: 'square', name: 'A 4×4 on a 4:12 roof', pitch: 4, b: 3.5, h: 3.5, L: 8, space: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, pitch: sc.pitch, b: sc.b, h: sc.h, L: sc.L, space: sc.space });
}

/** Inch-pound: psi, in, lbf. */
export function purlin(state) {
  const b = Number(state.b) || B_IN;
  const h = Number(state.h) || H_IN;
  const theta = (Math.atan2(Number(state.pitch) || 0, 12) * 180) / Math.PI;
  const w = ((LIVE + DEAD) * (Number(state.space) || 2)) / 12;
  const L = (Number(state.L) || 8) * 12;
  const M = (w * L * L) / 8;
  const r = tiltedRect(b, h, M, theta);
  const peak = Math.max(Math.abs(r.max), Math.abs(r.min));
  // Second method: the section's inertia in vertical (Y) and horizontal (Z) axes, then the general
  // unsymmetric formula for a moment about Z alone, checked at every corner.
  const t = (theta * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const Iz = r.Iz;
  const Iy = r.Iy;
  const IZZ = Iz * c * c + Iy * s * s;
  const IYY = Iz * s * s + Iy * c * c;
  const IYZ = -s * c * (Iz - Iy);
  const den = IYY * IZZ - IYZ * IYZ;
  let peak2 = 0;
  for (const [yp, zp] of [[h / 2, b / 2], [h / 2, -b / 2], [-h / 2, b / 2], [-h / 2, -b / 2]]) {
    const Y = yp * c + zp * s;
    const Z = -yp * s + zp * c;
    peak2 = Math.max(peak2, Math.abs((M * (Y * IYY - Z * IYZ)) / den));
  }
  const gap = Math.abs(peak2 - peak) / Math.max(peak, 1e-9);
  return {
    M, Mft: M / 12, w, theta, peak, upright: r.upright, ratio: peak / r.upright,
    alpha: r.alpha, naFromLevel: r.alpha - theta, Mz: r.Mz, My: r.My, Iz, Iy, b, h, gap,
  };
}

function member(B, rect, state, c, veiled) {
  const S = sceneIn(B, rect, { x0: -6, x1: 6, y0: -5.2, y1: 5.2 }, 12);
  const t = (c.theta * Math.PI) / 180;
  // The roof line through the purlin's top, sloping up to the left.
  const P = (z, y) => [z * Math.cos(t) - y * Math.sin(t), z * Math.sin(t) + y * Math.cos(t)];
  const hb = c.b / 2;
  const hh = c.h / 2;
  seg(S, P(-5.5, hh), P(5.5, hh), { color: C.muted, width: 3 });
  label(S, `${fig(state.pitch)}:12 roof`, [-5.8, 4.6], { color: C.dim, align: 'left' });
  poly(S, [P(-hb, -hh), P(hb, -hh), P(hb, hh), P(-hb, hh)], { fill: alpha(C.gold, 0.2), stroke: C.gold, width: 1.5 });
  // Gravity, straight down through the centroid.
  arrow(S, [0, -hh - 0.4], -Math.PI / 2, 26, { color: C.pink });
  // The neutral axis: through the centroid, α from the board's width, on the side of the level
  // moment vector (which sits θ below the width in the board's frame) and past it.
  const a = (c.alpha * Math.PI) / 180;
  const na = (k) => P(k * Math.cos(a), -k * Math.sin(a));
  seg(S, na(-4.4), na(4.4), { color: C.teal, width: 2, dash: [6, 4] });
  if (!veiled) {
    label(S, 'neutral axis', na(4.4), { color: C.teal, dx: 4, dy: -8, align: 'left' });
    // The two corners farthest from the neutral axis carry the peak.
    const corners = [[-hb, -hh], [hb, -hh], [hb, hh], [-hb, hh]];
    const dist = ([z, y]) => Math.abs(z * Math.sin(a) + y * Math.cos(a));
    const far = Math.max(...corners.map(dist));
    for (const q of corners) {
      if (dist(q) > far * 0.999) {
        const [x, y] = P(q[0], q[1]);
        dot(S, x, y, { color: C.yellow, r: 5 });
      }
    }
    label(S, `peak ${fig(c.peak)} psi`, [0, -5], { color: C.yellow });
  }
}

export default defineLab({
  id: 'purlin',
  exam: 'u6',
  title: 'Roof purlin',
  app: true,
  hint: 'Split the moment along the board\'s own axes. The weak-axis part is small, but it acts on an I thirteen times smaller.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('p4', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pitch', lo: 0, hi: 12 }),
  controls() {
    return `
      ${slider('pu-p', 'roof pitch (rise per 12)', 4, 0, 12, 0.5)}
      ${slider('pu-l', 'span between trusses (ft)', 8, 4, 12, 0.5)}
      ${slider('pu-s', 'purlin spacing (ft)', 2, 1, 4, 0.25)}
      <p class="tiny">Cited: 2×6 dressed 1.5 × 5.5 in, 4×4 dressed 3.5 × 3.5 in (PS 20). Roof live load 20 psf (IBC Table 1607.1). The 5 psf dead load, the spacing and the span are assumed.</p>`;
  },
  bind(api) {
    bindSlider('pu-p', (s, v) => { s.pitch = v; }, api);
    bindSlider('pu-l', (s, v) => { s.L = v; }, api);
    bindSlider('pu-s', (s, v) => { s.space = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pu-p', state.pitch);
    set('pu-l', state.L);
    set('pu-s', state.space);
  },
  compute(state) {
    return purlin(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.5);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const P = chartIn(B, R, { lo: 0, hi: 12 }, { lo: 0, hi: Math.max(3, c.ratio * 1.15) });
    axes(P, { xLabel: 'roof pitch (rise per 12)', yLabel: 'peak stress / upright stress' });
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const p = (12 * i) / 48;
      pts.push([p, purlin({ ...state, pitch: p }).ratio]);
    }
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[0, 1], [12, 1]], { color: C.teal, width: 1.5, dash: [6, 4] });
    dot(P, Number(state.pitch) || 0, c.ratio, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\sigma = \frac{M\cos\theta\,y}{I_z} + \frac{M\sin\theta\,z}{I_y}`],
  liveRows(state, c) {
    return [
      kv('roof angle', `${fig(c.theta)}°`),
      kv('moment at midspan', `${fig(c.Mft)} lbf·ft`),
      kv('strong-axis part', `${fig(c.Mz / 12)} lbf·ft`),
      kv('weak-axis part', `${fig(c.My / 12)} lbf·ft`),
      kv('peak corner stress', `${fig(c.peak)} psi`),
      kv('upright, same load', `${fig(c.upright)} psi`),
      kv('neutral axis from level', `${fig(c.naFromLevel)}°`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['pitch', `${fig(state.pitch)}:12`],
      ['peak', `${fig(c.peak)} psi`],
      ['× upright', fig(c.ratio)],
      ['N.A. tilt', `${fig(c.naFromLevel)}°`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.theta < 0.5 ? 'Upright: the strong axis alone' : Math.abs(c.b - c.h) < 1e-9 ? 'A square has no weak axis' : 'The weak axis takes over',
    body: c.theta < 0.5
      ? String.raw`On a flat roof the load runs down the board's depth. The ${fig(c.Mft)} lbf·ft gives 6M/bh² = ${fig(c.upright)} psi, and the neutral axis is level.`
      : Math.abs(c.b - c.h) < 1e-9
        ? String.raw`Every axis of a square is principal, so the neutral axis stays level and the peak is ${fig(c.ratio)} times the upright value, from the corner sitting farther from it.`
        : String.raw`Tilted ${fig(c.theta)}°, only ${fig((100 * c.My) / c.M)}% of the moment bends the board flatwise. But flatwise the 2×6 is ${fig(c.Iz / c.Iy)} times less stiff, so that part adds as much stress as the rest. The corner reaches ${fig(c.peak)} psi, ${fig(c.ratio)} times upright. The neutral axis tilts ${fig(c.naFromLevel)}° from level.`,
  })),
});
