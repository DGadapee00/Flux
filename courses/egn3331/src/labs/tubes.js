import { bredt, openThin } from '@flux/subjects/mechanics/noncircular.js';
import { polarJ, polarJQuadrature } from '@flux/subjects/mechanics/torsion.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, circle, hidden, label, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a closed tube resists twist because its shear flow runs all the way round, and that
 * one saw cut along its length takes that away: slit, an NPS 3 pipe is 170 times less stiff in
 * torsion and its stress goes up twentyfold. The square HSS is nearly as good as the round pipe
 * for its size, and a solid bar of the same weight is seven times more flexible than the pipe.
 *
 * Cited: NPS 3 Schedule 40 steel pipe, 3.500 in OD, 0.216 in wall (ASME B36.10M). HSS 4×4×1/4 with
 * the AISC design wall 0.93 × 0.250 = 0.233 in (AISC 360, B4.2); its corner radii are ignored.
 * E = 29,000 ksi (AISC); ν = 0.3 is assumed. The torque and length are assumed. Recompute:
 * T ρ/J for the round sections, Bredt's T/(2A_m t) for the HSS, T t/J with J = Σ b t³/3 for the
 * slit. Second method: J by quadrature over the ring, Bredt's J = 4A_m²/∮ds/t written out, and the
 * slit's J as 2πr t³/3.
 */

const G = 29000 / 2.6;
const OD = 3.5;
const WALL = 0.216;
const HSS_B = 4;
const HSS_T = 0.93 * 0.25;
const AREA_PIPE = (Math.PI / 4) * (OD ** 2 - (OD - 2 * WALL) ** 2);
const D_SOLID = Math.sqrt((4 * AREA_PIPE) / Math.PI);
const OUT = 'Each section is perfectly uniform along its length and free to warp. A real HSS has rounded corners, which shrink the enclosed area a little, and its weld seam is as strong as the wall. A slit section twisted with its ends held flat resists by warping as well, so over a short length it is stiffer than St. Venant\'s J says. Stresses here are elastic; steel yields in shear at about 0.6 of its tensile yield.';

const SHAPES = {
  pipe: 'NPS 3 Sch 40 pipe',
  slit: 'The same pipe, slit',
  hss: 'HSS 4×4×1/4',
  solid: 'Solid bar, same weight as the pipe',
};

const SCENARIOS = Object.entries(SHAPES).map(([id, name]) => ({ id, name, shape: id, T: 5, L: 6 }));

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, shape: sc.shape, T: sc.T, L: sc.L });
}

/** J (in⁴), the peak shear (ksi) and the second-method J for one shape under T kip·in. */
function section(shape, T) {
  const rm = (OD - WALL) / 2;
  if (shape === 'pipe') {
    const J = polarJ(OD / 2, OD / 2 - WALL);
    const J2 = polarJQuadrature(OD / 2, OD / 2 - WALL, 4000);
    const thin = bredt(T, Math.PI * rm * rm, [{ len: 2 * Math.PI * rm, t: WALL }], G);
    return { J, J2, tau: (T * (OD / 2)) / J, bredtTau: thin.tauMax };
  }
  if (shape === 'slit') {
    const o = openThin(T, [{ len: 2 * Math.PI * rm, t: WALL }], G);
    return { J: o.J, J2: (2 * Math.PI * rm * WALL ** 3) / 3, tau: o.tauMax };
  }
  if (shape === 'hss') {
    const side = HSS_B - HSS_T;
    const b = bredt(T, side * side, [{ len: 4 * side, t: HSS_T }], G);
    return { J: b.J, J2: (4 * side ** 4 * HSS_T) / (4 * side), tau: b.tauMax };
  }
  const J = polarJ(D_SOLID / 2);
  return { J, J2: polarJQuadrature(D_SOLID / 2, 0, 4000), tau: (T * (D_SOLID / 2)) / J };
}

export function tube(state) {
  const T = Number(state.T) || 0;
  const L = (Number(state.L) || 6) * 12;
  const s = section(state.shape, T);
  const rate = T / (G * s.J);
  const all = Object.fromEntries(Object.keys(SHAPES).map((k) => [k, section(k, T)]));
  return {
    ...s, rate, phiDeg: (rate * L * 180) / Math.PI, perFt: (rate * 12 * 180) / Math.PI, all, gap: Math.abs(s.J2 - s.J) / s.J,
  };
}

function member(B, rect, state, c, veiled) {
  const S = sceneIn(B, rect, { x0: -2.6, x1: 2.6, y0: -2.6, y1: 2.6 }, 10);
  const shape = state.shape;
  const flow = (pts, open) => {
    // Shear flow arrows round the wall: one way all round for a closed wall; for an open wall the
    // flow runs out along one face and back along the other.
    const n = pts.length;
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 10))) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      arrow(S, p, ang, Math.max(10, 0.32 * S.k), { color: C.teal, width: 2, head: 6 });
      if (open) arrow(S, [p[0] * 0.86, p[1] * 0.86], ang + Math.PI, Math.max(10, 0.32 * S.k), { color: C.teal, width: 2, head: 6 });
    }
  };
  if (shape === 'pipe' || shape === 'slit') {
    circle(S, [0, 0], OD / 2, { stroke: C.text, fill: alpha(C.text, 0.12), width: 1.5 });
    circle(S, [0, 0], OD / 2 - WALL, { stroke: C.text, fill: alpha(C.bg, 1), width: 1.5 });
    const ring = [];
    for (let i = 0; i < 40; i++) {
      const a = (2 * Math.PI * i) / 40;
      ring.push([(OD / 2 + 0.25) * Math.cos(a), (OD / 2 + 0.25) * Math.sin(a)]);
    }
    if (shape === 'slit') {
      poly(S, [[OD / 2 - WALL - 0.05, -0.04], [OD / 2 + 0.05, -0.04], [OD / 2 + 0.05, 0.04], [OD / 2 - WALL - 0.05, 0.04]], { fill: C.bg, stroke: C.pink });
      flow(ring.slice(2, 38), true);
    } else flow(ring, false);
  } else if (shape === 'hss') {
    const h = HSS_B / 2;
    const i = h - HSS_T;
    poly(S, [[-h, -h], [h, -h], [h, h], [-h, h]], { fill: alpha(C.text, 0.12), stroke: C.text });
    poly(S, [[-i, -i], [i, -i], [i, i], [-i, i]], { fill: C.bg, stroke: C.text });
    const o = h + 0.25;
    const sq = [];
    for (let k = 0; k < 40; k++) {
      const t = (k / 40) * 4;
      const side = Math.floor(t);
      const f = t - side;
      sq.push([[o, -o + 2 * o * f], [o - 2 * o * f, o], [-o, o - 2 * o * f], [-o + 2 * o * f, -o]][side]);
    }
    flow(sq, false);
  } else {
    circle(S, [0, 0], D_SOLID / 2, { stroke: C.text, fill: alpha(C.text, 0.25), width: 1.5 });
    const ring = [];
    for (let k = 0; k < 40; k++) {
      const a = (2 * Math.PI * k) / 40;
      ring.push([(D_SOLID / 2 + 0.25) * Math.cos(a), (D_SOLID / 2 + 0.25) * Math.sin(a)]);
    }
    flow(ring, false);
  }
  if (!veiled) label(S, `τ max ${fig(c.tau)} ksi`, [0, -2.45], { color: C.gold });
}

export default defineLab({
  id: 'tubes',
  exam: 'u9',
  title: 'Tubes in torsion',
  app: true,
  hint: 'A closed wall carries one shear flow all the way round, T = 2A_m q. Cut it and the flow must turn back within the wall\'s thickness: J falls to Σ b t³/3.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pipe', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 0.5, hi: 30 }),
  controls() {
    return `
      ${slider('tb-t', 'torque (kip·in)', 5, 0.5, 30, 0.5)}
      ${slider('tb-l', 'length (ft)', 6, 1, 12, 0.5)}
      <p class="tiny">Cited: NPS 3 Sch 40 pipe, 3.500 in OD, 0.216 in wall (ASME B36.10M). HSS 4×4×1/4, design wall 0.233 in (AISC 360, B4.2). E = 29,000 ksi (AISC); ν = 0.3, the torque and length are assumed.</p>`;
  },
  bind(api) {
    bindSlider('tb-t', (s, v) => { s.T = v; }, api);
    bindSlider('tb-l', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('tb-t', state.T);
    set('tb-l', state.L);
  },
  compute(state) {
    return tube(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.45);
    member(B, D, state, c, veiled);
    if (veiled) return;
    // J of each section on a log scale, the current one bright.
    const keys = Object.keys(SHAPES);
    const short = { pipe: 'pipe', slit: 'slit', hss: 'HSS', solid: 'solid' };
    const lo = -2;
    const hi = 2;
    const S = sceneIn(B, R, { x0: -0.2, x1: keys.length + 0.2, y0: lo - 0.9, y1: hi + 0.5 }, 18);
    seg(S, [0, lo], [keys.length, lo], { color: alpha(C.text, 0.5), width: 1 });
    for (let d = lo; d <= hi; d++) {
      seg(S, [0, d], [keys.length, d], { color: alpha(C.text, 0.12), width: 1 });
      label(S, `10${['⁻²', '⁻¹', '⁰', '¹', '²'][d + 2]}`, [0, d], { color: C.dim, dx: -4, align: 'right' });
    }
    label(S, 'J (in⁴), log scale', [0, hi + 0.3], { color: C.muted, align: 'left' });
    keys.forEach((k, i) => {
      const y = Math.max(lo, Math.log10(c.all[k].J));
      const on = k === state.shape;
      poly(S, [[i + 0.2, lo], [i + 0.8, lo], [i + 0.8, y], [i + 0.2, y]], { fill: alpha(on ? C.gold : C.teal, on ? 0.8 : 0.3), stroke: on ? C.gold : C.teal });
      label(S, short[k], [i + 0.5, lo], { color: on ? C.gold : C.muted, dy: 12 });
      label(S, fig(c.all[k].J), [i + 0.5, y], { color: on ? C.gold : C.muted, dy: -10 });
    });
  },
  law: () => [String.raw`T = 2A_m q,\quad J_{\text{closed}} = \frac{4A_m^2}{\oint ds/t}`, String.raw`J_{\text{open}} = \sum \frac{b\,t^3}{3}`],
  liveRows(state, c) {
    return [
      kv('J', `${fig(c.J)} in⁴`),
      kv('peak shear', `${fig(c.tau)} ksi`),
      state.shape === 'pipe' ? kv('Bredt\'s thin-wall estimate', `${fig(c.bredtTau)} ksi`) : '',
      kv('twist per foot', `${fig(c.perFt)}°`),
      kv('twist over the length', `${fig(c.phiDeg)}°`),
      kv('slit pipe vs pipe, stiffness', `1/${fig(c.all.pipe.J / c.all.slit.J)}`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['J', `${fig(c.J)} in⁴`],
      ['τ max', `${fig(c.tau)} ksi`],
      ['twist', `${fig(c.phiDeg)}°`],
      ['vs pipe', `×${fig(c.J / c.all.pipe.J)}`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const p = c.all.pipe;
    const texts = {
      pipe: String.raw`The flow runs all the way round the 3.5 in pipe, so its J is ${fig(c.J)} in⁴ and ${fig(state.T)} kip·in gives ${fig(c.tau)} ksi. Bredt's thin-wall formula, T/(2A_m t), gives ${fig(c.bredtTau)} ksi, close because the wall is thin.`,
      slit: String.raw`One cut and the flow can no longer go round. It must turn back inside the 0.216 in wall, so J drops from ${fig(p.J)} to ${fig(c.J)} in⁴, ${fig(p.J / c.J)} times less. The stress climbs to ${fig(c.tau)} ksi and the twist to ${fig(c.phiDeg)}°.${c.tau > 21 ? ' Mild steel yields in shear near 21 ksi, so past that this elastic answer no longer holds.' : ''}`,
      hss: String.raw`The square tube's flow also runs all the way round: q = T/(2A_m), with A_m the area inside the wall's centreline. Its J is ${fig(c.J)} in⁴, ${fig(c.J / p.J)} times the pipe's, for a section only a little bigger.`,
      solid: String.raw`A solid bar of the pipe's weight is ${fig(D_SOLID)} in across. Its material sits near the centre, where it does little, so J is ${fig(c.J)} in⁴, 1/${fig(p.J / c.J)} of the pipe's, and τ is ${fig(c.tau)} ksi.`,
    };
    return { title: SHAPES[state.shape], body: texts[state.shape] };
  }),
});
