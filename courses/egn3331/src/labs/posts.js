import { eulerLoad, secantColumn, tangentModulus, tangentModulusStress, tubeSection } from '@flux/subjects/mechanics/buckling.js';
import { JOIST_E_PSI } from '../data/joist.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a real column fails below Euler's load for two reasons. A deck post with its beam
 * bolted to one side carries the load 3.25 in off its axis, and the secant formula puts its peak
 * stress at seven times P/A, far below any buckling load. A stocky aluminium tube yields gradually,
 * so its stiffness at the buckling stress is the tangent modulus, and Euler overstates it.
 *
 * Cited: deck live load 40 psf (IRC Table R301.5); a 4×4 dresses to 3.5 × 3.5 in and a 2×10 to
 * 1.5 in thick (PS 20); E = 1,400,000 psi (No. 2 Southern Pine, src/data/joist.js), taken for the
 * 4×4 too. 6061-T6: minimum yield 35 ksi (Aluminum Association), E = 10,000 ksi. The deck's 10 psf
 * dead load, the area each post carries, the post height, the tube size and the Ramberg–Osgood
 * exponent n = 20 are assumed. Recompute: the secant formula, and Engesser's tangent-modulus
 * equation. Second method: the beam-column equation EI y'' = −P(y + e) integrated by Runge–Kutta
 * from the base, and the buckling condition σ = π²E_t/(KL/r)² checked at the root.
 */

const POST = 3.5;
const E_WOOD = JOIST_E_PSI;
const E_AL = 10e6;
const FY_AL = 35e3;
const N_RO = 20;
const TUBE = tubeSection(2, 0.125);
const OUT = 'The secant formula takes the same offset at both ends. A side-bolted deck post bears centrally on its footing, so its moment tapers to zero at the base and it bows about half as much; its peak stress, near the top bolt, is still several times P/A. The post is otherwise straight, its wood elastic and uniform, its ends true pins. Real posts have knots, checks and a little crook, which act like extra eccentricity. Wood\'s strength in compression along the grain also depends on moisture and load duration. The tube\'s stress–strain curve is a fitted Ramberg–Osgood shape with n assumed; a real alloy\'s curve comes from a test. Welds near a tube\'s ends soften 6061-T6 a good deal.';

const SCENARIOS = [
  { id: 'cap', name: 'Deck post, beam on a post cap', mode: 'post', H: 8, trib: 48, e: 0 },
  { id: 'side', name: 'Deck post, beam bolted to its side', mode: 'post', H: 8, trib: 48, e: 3.25 },
  { id: 'tall', name: 'Side-bolted, 12 ft post', mode: 'post', H: 12, trib: 48, e: 3.25 },
  { id: 'tube', name: '6061-T6 tube, 3 ft long', mode: 'tube', L: 36 },
  { id: 'tubelong', name: '6061-T6 tube, 8 ft long', mode: 'tube', L: 96 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, mode: sc.mode, H: sc.H ?? 8, trib: sc.trib ?? 48, e: sc.e ?? 0, L: sc.L ?? 36,
  });
}

/** The bow of a pinned beam-column by RK4 from the base: y(0) = 0, y'(0) found by shooting. */
function bowByShooting(P, e, EI, L) {
  const k2 = P / EI;
  const run = (s0) => {
    let y = 0;
    let s = s0;
    const n = 2000;
    const h = L / n;
    let mid = 0;
    const f = (yy) => -k2 * (yy + e);
    for (let i = 0; i < n; i++) {
      const k1y = s;
      const k1s = f(y);
      const k2y = s + (h / 2) * k1s;
      const k2s = f(y + (h / 2) * k1y);
      const k3y = s + (h / 2) * k2s;
      const k3s = f(y + (h / 2) * k2y);
      const k4y = s + h * k3s;
      const k4s = f(y + h * k3y);
      y += (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      s += (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
      if (i === n / 2 - 1) mid = y;
    }
    return { end: y, mid };
  };
  // y(L) is linear in the starting slope, so two shots find the one that lands at zero.
  const a = run(0);
  const b = run(1);
  const s0 = -a.end / (b.end - a.end);
  return run(s0).mid;
}

export function column(state) {
  if (state.mode === 'tube') {
    const L = Number(state.L) || 36;
    const r = Math.sqrt(TUBE.I / TUBE.A);
    const slender = L / r;
    const t = tangentModulusStress(slender, E_AL, FY_AL, N_RO);
    const resid = Math.abs(t.sigma - (Math.PI ** 2 * tangentModulus(t.sigma, E_AL, FY_AL, N_RO)) / slender ** 2) / t.sigma;
    return {
      mode: 'tube', L, r, slender, sigma: t.sigma, Et: t.Et, euler: t.euler, Pcr: t.sigma * TUBE.A, Peuler: Math.min(t.euler, 1e12) * TUBE.A,
      over: t.euler / t.sigma, gap: resid,
    };
  }
  const A = POST * POST;
  const I = POST ** 4 / 12;
  const L = (Number(state.H) || 8) * 12;
  const P = (40 + 10) * (Number(state.trib) || 0);
  const e = Number(state.e) || 0;
  const s = secantColumn(P, e, POST / 2, A, I, E_WOOD, L);
  const Pcr = eulerLoad(E_WOOD, I, L);
  const bow2 = e > 0 ? bowByShooting(P, e, E_WOOD * I, L) : 0;
  const gap = e > 0 ? Math.abs(bow2 - s.bow) / Math.max(s.bow, 1e-12) : 0;
  return {
    mode: 'post', P, e, L, A, I, sigma: s.sigma, plain: P / A, ratio: s.sigma / (P / A), bow: s.bow, Mmax: s.Mmax, Pcr, use: P / Pcr, gap,
  };
}

function member(B, rect, state, c, veiled) {
  if (c.mode === 'tube') {
    const S = sceneIn(B, rect, { x0: -60, x1: 60, y0: -6, y1: 140 }, 12);
    const h = c.L;
    const k = 100 / h;
    const amp = 6;
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const y = (h * i) / 30;
      pts.push([amp * Math.sin((Math.PI * y) / h), y * k]);
    }
    for (let i = 1; i < pts.length; i++) seg(S, pts[i - 1], pts[i], { color: C.gold, width: 5 });
    seg(S, [0, 0], [0, h * k], { color: alpha(C.text, 0.25), width: 1, dash: [4, 4] });
    arrow(S, [0, h * k + 14], -Math.PI / 2, 22, { color: C.pink });
    if (!veiled) {
      label(S, `${fig(c.L)} in, KL/r ${fig(c.slender)}`, [0, 0], { color: C.dim, dy: 14 });
      label(S, `buckles at ${fig(c.Pcr / 1000)} kip`, [0, h * k], { color: C.pink, dy: -36 });
    }
    return;
  }
  const L = c.L;
  const S = sceneIn(B, rect, { x0: -0.45 * L, x1: 0.45 * L, y0: -0.08 * L, y1: L + 62 }, 12);
  const w = POST;
  const bowPx = (0.06 * L) / Math.max(c.bow, 1e-9);
  const k = c.e > 0 ? Math.min(bowPx, 200) : 0;
  const shape = (side) => {
    const out = [];
    for (let i = 0; i <= 30; i++) {
      const y = (L * i) / 30;
      const b = c.e > 0 ? k * c.bow * Math.sin((Math.PI * y) / L) : 0;
      out.push([side * (w / 2) * 3 - b, y]);
    }
    return out;
  };
  const left = shape(-1);
  const right = shape(1);
  poly(S, [...left, ...right.reverse()], { fill: alpha(C.gold, 0.25), stroke: C.gold, width: 1.5 });
  // The beam: on top in a post cap, or bolted to the side.
  const bw = 4.5;
  const bx = c.e > 0 ? 1.5 * w + bw / 2 : 0;
  poly(S, [[bx - bw / 2 - (c.e > 0 ? 0 : 6), L - (c.e > 0 ? 20 : 0)], [bx + bw / 2 + (c.e > 0 ? 0 : 6), L - (c.e > 0 ? 20 : 0)], [bx + bw / 2 + (c.e > 0 ? 0 : 6), L + 9.25], [bx - bw / 2 - (c.e > 0 ? 0 : 6), L + 9.25]], { fill: alpha(C.muted, 0.35), stroke: C.muted });
  arrow(S, [bx, L + 9.25 + 22], -Math.PI / 2, 20, { color: C.pink });
  if (!veiled) {
    label(S, `${fig(c.P)} lb`, [bx, L + 9.25 + 22], { color: C.pink, dy: -12 });
    label(S, c.e > 0 ? `e ${fig(c.e)} in · bow ×${fig(k)}` : 'e 0', [0, 0], { color: C.dim, dy: 14 });
  }
}

export default defineLab({
  id: 'posts',
  exam: 'u11',
  title: 'Real columns',
  app: true,
  hint: 'An offset load bends a column from the start: σ = (P/A)[1 + (ec/r²) sec(L/2r √(P/EA))]. Past the proportional limit, use E_t, not E.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('side', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => (state.mode === 'tube' ? { key: 'L', lo: 14, hi: 120 } : { key: 'trib', lo: 8, hi: 120 }),
  controls() {
    return `
      ${slider('po-a', 'deck area on the post (ft²)', 48, 8, 120, 2)}
      ${slider('po-e', 'eccentricity (in)', 3.25, 0, 6, 0.25)}
      ${slider('po-h', 'post height (ft)', 8, 4, 14, 0.5)}
      ${slider('po-l', 'tube length (in)', 36, 14, 120, 2)}
      <p class="tiny">Cited: deck 40 psf live (IRC Table R301.5); 4×4 is 3.5 × 3.5 in, 2×10 is 1.5 in thick (PS 20); E = 1,400,000 psi (No. 2 Southern Pine). 6061-T6, 35 ksi yield (Aluminum Association), E = 10,000 ksi. Dead load 10 psf, the areas, heights, the 2 × 0.125 in tube and n = 20 are assumed.</p>`;
  },
  bind(api) {
    bindSlider('po-a', (s, v) => { s.trib = v; }, api);
    bindSlider('po-e', (s, v) => { s.e = v; }, api);
    bindSlider('po-h', (s, v) => { s.H = v; }, api);
    bindSlider('po-l', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('po-a', state.trib);
    set('po-e', state.e);
    set('po-h', state.H);
    set('po-l', state.L);
    const tube = state.mode === 'tube';
    showField('po-a', !tube);
    showField('po-e', !tube);
    showField('po-h', !tube);
    showField('po-l', tube);
  },
  compute(state) {
    return column(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    if (c.mode === 'tube') {
      const P = chartIn(B, R, { lo: 20, hi: 160 }, { lo: 0, hi: 60 });
      axes(P, { xLabel: 'slenderness KL/r', yLabel: 'buckling stress (ksi)' });
      const eu = [];
      const tm = [];
      // From KL/r = 20: stockier than that, the fitted curve hardens past yield and the tube crushes.
      for (let i = 0; i <= 80; i++) {
        const s = 20 + (140 * i) / 80;
        eu.push([s, Math.min((Math.PI ** 2 * E_AL) / s ** 2 / 1000, 60)]);
        tm.push([s, tangentModulusStress(s, E_AL, FY_AL, N_RO).sigma / 1000]);
      }
      line(P, eu, { color: C.muted, width: 1.5, dash: [6, 4] });
      line(P, [[20, FY_AL / 1000], [160, FY_AL / 1000]], { color: C.yellow, width: 1.5, dash: [6, 4] });
      line(P, tm, { color: C.gold, width: 3 });
      dot(P, c.slender, c.sigma / 1000, { color: C.gold, r: 5 });
      return;
    }
    const Pmax = c.Pcr * 0.95;
    const sMax = secantColumn(Pmax, c.e, POST / 2, c.A, c.I, E_WOOD, c.L).sigma;
    const top = Math.min(Math.max(c.sigma * 1.4, 1500), Math.max(sMax, 1500));
    const P = chartIn(B, R, { lo: 0, hi: Pmax / 1000 }, { lo: 0, hi: top });
    axes(P, { xLabel: 'post load (kip)', yLabel: 'peak stress (psi)' });
    const sec = [];
    const flat = [];
    for (let i = 0; i <= 80; i++) {
      const p = (Pmax * i) / 80;
      sec.push([p / 1000, Math.min(secantColumn(p, c.e, POST / 2, c.A, c.I, E_WOOD, c.L).sigma, top * 1.5)]);
      flat.push([p / 1000, p / c.A]);
    }
    line(P, flat, { color: C.teal, width: 1.5, dash: [6, 4] });
    line(P, sec, { color: C.gold, width: 3 });
    dot(P, c.P / 1000, c.sigma, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\sigma_{\max} = \frac{P}{A}\left[1+\frac{ec}{r^2}\sec\!\left(\frac{L}{2r}\sqrt{\frac{P}{EA}}\right)\right]`, String.raw`\sigma_{cr} = \frac{\pi^2 E_t}{(KL/r)^2}`],
  liveRows(state, c) {
    if (c.mode === 'tube') {
      return [
        kv('slenderness KL/r', fig(c.slender)),
        kv('Euler stress', `${fig(Math.min(c.euler, 1e9) / 1000)} ksi`),
        kv('tangent-modulus stress', `${fig(c.sigma / 1000)} ksi`),
        kv('E_t at that stress', `${fig(c.Et / 1000)} ksi`),
        kv('buckling load', `${fig(c.Pcr / 1000)} kip`),
      ].join('');
    }
    return [
      kv('load on the post', `${fig(c.P)} lb`),
      kv('P/A', `${fig(c.plain)} psi`),
      kv('peak stress (secant)', `${fig(c.sigma)} psi`),
      kv('times P/A', fig(c.ratio)),
      kv('bow at mid-height', `${fig(c.bow)} in`),
      kv('Euler load', `${fig(c.Pcr)} lb (${fig(100 * c.use)}% used)`),
    ].join('');
  },
  readout(state, c) {
    return c.mode === 'tube'
      ? cells([['KL/r', fig(c.slender)], ['σ_cr', `${fig(c.sigma / 1000)} ksi`], ['Euler', `${fig(Math.min(c.euler, 1e9) / 1000)} ksi`], ['P_cr', `${fig(c.Pcr / 1000)} kip`]])
      : cells([['P', `${fig(c.P)} lb`], ['P/A', `${fig(c.plain)} psi`], ['peak', `${fig(c.sigma)} psi`], ['× P/A', fig(c.ratio)]]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (c.mode === 'tube') {
      return {
        title: c.over > 1.02 ? 'Stocky: the tangent modulus governs' : 'Slender: Euler holds',
        body: c.over > 1.02
          ? String.raw`At KL/r = ${fig(c.slender)}, Euler's stress would be ${fig(Math.min(c.euler, 1e9) / 1000)} ksi, ${c.euler > FY_AL ? 'above the 35 ksi yield' : 'near the 35 ksi yield'}. The alloy has already softened there: E_t is ${fig(c.Et / 1000)} ksi, so the tube buckles at ${fig(c.sigma / 1000)} ksi, ${fig(c.Pcr / 1000)} kip.`
          : String.raw`At KL/r = ${fig(c.slender)} the tube buckles at ${fig(c.sigma / 1000)} ksi, well under yield, where E_t is still E. Euler's ${fig(c.Pcr / 1000)} kip is the answer.`,
      };
    }
    return {
      title: c.e > 0 ? 'The offset bends the post from the start' : 'Concentric: P/A',
      body: c.e > 0
        ? String.raw`Bolted to the side, the beam's ${fig(c.P)} lb acts ${fig(c.e)} in off the post's axis. That moment bows the post ${fig(c.bow)} in, which adds to the arm. The peak stress is ${fig(c.sigma)} psi, ${fig(c.ratio)} times P/A, though the load is only ${fig(100 * c.use)}% of Euler's.`
        : String.raw`With the beam on a post cap the load runs down the axis: ${fig(c.plain)} psi, ${fig(100 * c.use)}% of the Euler load of ${fig(c.Pcr)} lb.`,
    };
  }),
});
