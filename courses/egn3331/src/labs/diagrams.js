import { generalBeam, graphicalGap } from '@flux/subjects/mechanics/sections.js';
import { PLAY, playing } from '@flux/shells/engineering/motion.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import {
  C, alpha, arrow, axes, begin, chartIn, couple, dot, hidden, label, line, pinSupport, poly,
  rollerSupport, seg, spread, wall,
} from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the moment peaks where the shear changes sign, because dM/dx = V, and that a beam's
 * diagrams follow from its loads alone: a point load is a step in V and a corner in M, a uniform
 * load is a slope in V and a parabola in M, and a couple is a jump in M with no change in V. An
 * overhang hogs over its support, and a load on the overhang lifts the far end. Play walks the cut
 * along the beam.
 *
 * Recompute: reactions by equilibrium, then V and M by integrating the load (the graphical
 * method). Second method: internalAt, the method of sections, at every station.
 */

const KN = 1000;

const SCENARIOS = [
  { id: 'point', name: 'Point load at midspan', P: 10e3, w: 5e3, L: 4, a: 2, b: 4, M0: 6e3, x: 2 },
  { id: 'uniform', name: 'Uniform load', P: 10e3, w: 5e3, L: 4, a: 2, b: 4, M0: 6e3, x: 2 },
  { id: 'cantilever', name: 'Cantilever, tip load', P: 8e3, w: 5e3, L: 2, a: 1, b: 2, M0: 6e3, x: 0 },
  { id: 'overhang', name: 'Overhang, load on the tip', P: 5e3, w: 4e3, L: 6, a: 2, b: 4, M0: 6e3, x: 4 },
  { id: 'couple', name: 'A couple on the span', P: 10e3, w: 5e3, L: 4, a: 1, b: 4, M0: 6e3, x: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, P: sc.P, w: sc.w, L: sc.L, a: sc.a, b: sc.b, M0: sc.M0, x: sc.x,
    anim: { playing: false }, show: { play: false },
  });
}

/** The beam the scenario describes, with positions kept on the span. */
export function beamOf(state) {
  const L = Math.max(Number(state.L) || 1, 0.5);
  const a = Math.min(Math.max(Number(state.a) || 0, 0.02 * L), 0.98 * L);
  const b = Math.min(Math.max(Number(state.b) || L, 0.4 * L), L);
  switch (state.scenarioId) {
    case 'uniform': return generalBeam({ L, udl: { w: state.w, a: 0, b: L } });
    case 'cantilever': return generalBeam({ L, support: 'cantilever', points: [{ x: L, P: state.P }] });
    case 'overhang': return generalBeam({ L, b, udl: { w: state.w, a: 0, b }, points: [{ x: L, P: state.P }] });
    case 'couple': return generalBeam({ L, couples: [{ x: a, M: state.M0 }] });
    default: return generalBeam({ L, points: [{ x: a, P: state.P }] });
  }
}

export default defineLab({
  id: 'diagrams',
  exam: 'u6',
  title: 'Shear and moment',
  hint: 'The moment peaks where the shear crosses zero. A couple jumps the moment and leaves the shear alone. Play walks the cut.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('point', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'uniform' || state.scenarioId === 'overhang') return { key: 'w', lo: 1e3, hi: 20e3 };
    if (state.scenarioId === 'couple') return { key: 'M0', lo: -20e3, hi: 20e3 };
    return { key: 'P', lo: 1e3, hi: 30e3 };
  },
  controls() {
    return `
      ${slider('dg-p', 'point load (kN)', 10, 1, 30, 0.5)}
      ${slider('dg-w', 'uniform load (kN/m)', 5, 1, 20, 0.5)}
      ${slider('dg-m', 'couple, counterclockwise + (kN·m)', 6, -20, 20, 0.5)}
      ${slider('dg-l', 'length (m)', 4, 1, 8, 0.1)}
      ${slider('dg-a', 'load position from the left (m)', 2, 0.2, 8, 0.1)}
      ${slider('dg-b', 'roller position (m)', 4, 0.5, 8, 0.1)}
      ${slider('dg-x', 'cut position (m)', 2, 0, 8, 0.05)}
      <p class="tiny">Top: the beam, its loads in pink and its reactions in white. Below: shear V in teal, moment M in gold, on the same x. The shaded area under V, from the left end to the cut, is M at the cut. On a phone V is in the readout. Sagging M is positive; V is positive when the left piece is pushed up. The dashed line is the cut; Play walks it along the beam.</p>`;
  },
  bind(api) {
    bindSlider('dg-p', (s, v) => { s.P = v * KN; }, api);
    bindSlider('dg-w', (s, v) => { s.w = v * KN; }, api);
    bindSlider('dg-m', (s, v) => { s.M0 = v * KN; }, api);
    bindSlider('dg-l', (s, v) => { s.L = v; }, api);
    bindSlider('dg-a', (s, v) => { s.a = v; }, api);
    bindSlider('dg-b', (s, v) => { s.b = v; }, api);
    bindSlider('dg-x', (s, v) => { s.x = v; }, api);
  },
  syncControls(state) {
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(max);
      if (document.activeElement !== el) el.value = String(val);
    };
    set('dg-p', state.P / KN);
    set('dg-w', state.w / KN);
    set('dg-m', state.M0 / KN);
    set('dg-l', state.L);
    set('dg-a', state.a, state.L);
    set('dg-b', state.b, state.L);
    set('dg-x', Number((Number(state.x) || 0).toFixed(2)), state.L);
    const id = state.scenarioId;
    showField('dg-p', id === 'point' || id === 'cantilever' || id === 'overhang');
    showField('dg-w', id === 'uniform' || id === 'overhang');
    showField('dg-m', id === 'couple');
    showField('dg-a', id === 'point' || id === 'couple');
    showField('dg-b', id === 'overhang');
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // The cut crosses the beam in about four seconds, then starts again at the left end.
    const L = Math.max(Number(state.L) || 1, 0.5);
    let x = (Number(state.x) || 0) + (dt * L) / 4;
    if (x > L) x = 0;
    state.x = x;
    return true;
  },
  compute(state) {
    const beam = beamOf(state);
    const x = Math.min(Math.max(Number(state.x) || 0, 0), beam.L);
    const here = beam.at(x);
    let Mhog = 0;
    for (const p of beam.graphical(120)) Mhog = Math.min(Mhog, p.M);
    const R = beam.reactions;
    return {
      V: here.V,
      M: here.M,
      Vmax: beam.Vmax,
      Mmax: beam.Mmax,
      xM: beam.xM,
      left: R[0].Fy,
      right: R[1]?.Fy ?? 0,
      wallM: R[0].M ?? 0,
      Mhog: -Mhog,
      w: state.w,
      P: state.P,
      L: beam.L,
      x,
      gap: graphicalGap(beam),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const beam = beamOf(state);
    const L = beam.L;
    const f = B.free;
    const H = f.y1 - f.y0;
    // Three rows sharing one x: the beam, then V, then M. On a short screen V moves to the
    // readout and M keeps the room. Hidden values leave only the beam.
    const short = H < 330;
    const rows = veiled ? [1] : short ? [0.38, 0.62] : [0.3, 0.35, 0.35];
    let y = f.y0;
    const rect = rows.map((share) => {
      const r = { ...f, y0: y, y1: y + share * H };
      y = r.y1;
      return r;
    });
    const xr = { lo: -0.04 * L, hi: 1.04 * L };

    // The beam: a bar on its supports, with the loads and the reactions.
    const S = chartIn(B, rect[0], xr, { lo: -1, hi: 1 });
    const top = 0.12;
    poly(S, [[0, -top], [L, -top], [L, top], [0, top]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.7) });
    const cant = beam.support === 'cantilever';
    if (cant) wall(S, 0, -0.55, 0.55, { side: -1 });
    else {
      pinSupport(S, [0, -top], { size: 11 });
      rollerSupport(S, [beam.b, -top], { size: 11 });
    }
    const big = Math.min(36, 0.28 * (S.box.y1 - S.box.y0));
    for (const p of beam.setup.loads) {
      if (p.Fy) arrow(S, [p.x, top], -Math.PI / 2, big, { color: C.pink, tail: true });
      if (p.M) couple(S, [p.x, 0], { ccw: p.M > 0, color: C.pink, r: 13 });
      if (!veiled) label(S, p.Fy ? `${fig(-p.Fy / KN)} kN` : `${fig(Math.abs(p.M) / KN)} kN·m`, [p.x, top], { color: C.pink, dy: -big - 8 });
    }
    for (const d of beam.setup.dist) {
      spread(S, d.a, d.b, top, { px: big * 0.6, color: C.pink, label: veiled ? null : `${fig(-d.w(0) / KN)} kN/m` });
    }
    for (const r of beam.reactions) {
      if (Math.abs(r.Fy) > 1e-6) arrow(S, [r.x, -top - (cant ? 0 : 0.35)], r.Fy > 0 ? Math.PI / 2 : -Math.PI / 2, big * 0.7, { color: C.text, width: 2, tail: r.Fy > 0 });
      if (r.M) couple(S, [r.x + 0.06 * L, 0], { ccw: r.M > 0, color: C.text, r: 11 });
      if (!veiled && Math.abs(r.Fy) > 1e-6) label(S, `${fig(r.Fy / KN)} kN`, [r.x, -top], { color: C.text, dy: big * 0.7 + 22, dx: r.x > L / 2 ? -10 : 10, align: r.x > L / 2 ? 'right' : 'left' });
    }
    seg(S, [c.x, -0.9], [c.x, 0.9], { color: C.yellow, width: 1.5, dash: [4, 4] });
    if (veiled) return;

    // V and M, each scaled to its own range, with the cut marked.
    const pts = beam.graphical(240);
    const range = (vals) => {
      let lo = Math.min(0, ...vals);
      let hi = Math.max(0, ...vals);
      const pad = Math.max(hi - lo, 1e-9) * 0.12;
      return { lo: lo - pad, hi: hi + pad };
    };
    const Vp = pts.map((p) => [p.x, p.V / KN]);
    const Mp = pts.map((p) => [p.x, p.M / KN]);
    if (!short) {
      const PV = chartIn(B, rect[1], xr, range(Vp.map((p) => p[1])));
      axes(PV, { yLabel: 'V (kN)' });
      // The area under V, to the axis: from the left end to the cut it is M at the cut.
      const upto = Vp.filter((p) => p[0] <= c.x + 1e-9);
      if (upto.length > 1) poly(PV, [[upto[0][0], 0], ...upto, [upto[upto.length - 1][0], 0]], { fill: alpha(C.teal, 0.16), stroke: null });
      line(PV, [[xr.lo, 0], [xr.hi, 0]], { color: alpha(C.text, 0.35), width: 1 });
      line(PV, Vp, { color: C.teal, width: 2.5 });
      line(PV, [[c.x, PV.Y.lo], [c.x, PV.Y.hi]], { color: alpha(C.yellow, 0.6), width: 1, dash: [4, 4] });
      dot(PV, c.x, c.V / KN, { color: C.teal, r: 4 });
    }
    const PM = chartIn(B, rect[short ? 1 : 2], xr, range(Mp.map((p) => p[1])));
    axes(PM, { xLabel: 'x (m)', yLabel: 'M (kN·m)' });
    line(PM, [[xr.lo, 0], [xr.hi, 0]], { color: alpha(C.text, 0.35), width: 1 });
    line(PM, Mp, { color: C.gold, width: 2.5 });
    line(PM, [[c.x, PM.Y.lo], [c.x, PM.Y.hi]], { color: alpha(C.yellow, 0.6), width: 1, dash: [4, 4] });
    dot(PM, c.xM, c.Mmax / KN, { color: C.gold, r: 4, ring: alpha(C.gold, 0.5) });
    dot(PM, c.x, c.M / KN, { color: C.yellow, r: 4 });
  },
  law(state) {
    return [String.raw`\frac{dV}{dx}=-w`, String.raw`\frac{dM}{dx}=V`];
  },
  liveRows(state, c) {
    const rows = [
      kv('shear at the cut', `${fig(c.V / KN)} kN`),
      kv('moment at the cut', `${fig(c.M / KN)} kN·m`),
      kv('largest moment', `${fig(c.Mmax / KN)} kN·m at ${fig(c.xM)} m`),
    ];
    rows.push(state.scenarioId === 'cantilever'
      ? kv('wall', `${fig(c.left / KN)} kN, ${fig(c.wallM / KN)} kN·m`)
      : kv('reactions', `${fig(c.left / KN)} kN, ${fig(c.right / KN)} kN`));
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['V cut', `${fig(c.V / KN)} kN`],
      ['M cut', `${fig(c.M / KN)} kN·m`],
      ['V max', `${fig(c.Vmax / KN)} kN`],
      ['M peak', `${fig(c.Mmax / KN)} kN·m`],
    ]);
  },
  coach(state, c) {
    const id = state.scenarioId;
    if (id === 'cantilever') {
      return {
        title: 'The shear never crosses zero',
        body: `The wall moment is ${fig(c.Mmax / KN)} kN·m and the shear is ${fig(c.Vmax / KN)} kN all along the span. dM/dx = V, and V does not change sign, so the extreme moment is at the wall.`,
      };
    }
    if (id === 'couple') {
      return {
        title: 'A couple jumps M and leaves V alone',
        body: `The shear is ${fig(c.left / KN)} kN everywhere: the reactions are a couple of their own, M₀/L. At the couple the moment jumps by ${fig(Math.abs(state.M0) / KN)} kN·m. Slide the couple: the reactions do not change.`,
      };
    }
    if (id === 'overhang') {
      return {
        title: 'The overhang hogs over the roller',
        body: `Over the roller M = ${fig(-c.Mhog / KN)} kN·m: the tip load bends the overhang like a cantilever. The tip load also lifts the left end, so the left reaction is only ${fig(c.left / KN)} kN. Where V crosses zero inside the span, M has its sagging peak.`,
      };
    }
    return {
      title: 'The peak sits on the shear crossing',
      body: `The peak moment is ${fig(c.Mmax / KN)} kN·m, at ${fig(c.xM)} m. Play the cut: M rises while V is positive and falls once V turns negative. The area under V from the left end to the cut is M at the cut.`,
    };
  },
});
