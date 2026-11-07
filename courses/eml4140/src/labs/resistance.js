import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, showField, slider } from './widgets.js';
import { criticalBySearch, pipe, wall, wallNumeric } from '@flux/subjects/heat/resistance.js';

/**
 * Resistance: heat through layers in series, as resistances.
 *
 * A house wall: drywall, glass wool and brick, with an air film on each face. The temperature drop
 * shares out in proportion to each resistance, so the insulation takes most of it. A pipe: insulation
 * adds resistance as ln r but surface as r, so on a thin pipe or wire it raises the heat loss until the
 * outer radius passes the critical radius k/h. Shows that more insulation does not always cut heat
 * loss. Checked by a finite-volume solve of the wall and a search for the critical radius
 * (packages/subjects/src/heat/resistance.js).
 */
const SCENARIOS = [
  { id: 'house', name: 'A house wall with 90 mm of glass wool', mode: 'wall', ins: 0.09, hOut: 25 },
  { id: 'bare-wall', name: 'The same wall with no insulation', mode: 'wall', ins: 0, hOut: 25 },
  { id: 'wire', name: 'Insulating a 2 mm wire: the loss rises', mode: 'pipe', r1: 0.002, r2: 0.006, k: 0.1, h: 10 },
  { id: 'steam', name: 'Insulating a 50 mm steam pipe: the loss falls', mode: 'pipe', r1: 0.05, r2: 0.08, k: 0.04, h: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mode: sc.mode, ins: sc.ins ?? 0.09, hOut: sc.hOut ?? 25, r1: sc.r1 ?? 0.002, r2: sc.r2 ?? 0.006, k: sc.k ?? 0.1, h: sc.h ?? 10 });
}

/** The wall: drywall, glass wool of thickness ins, brick; 20 °C inside, −5 °C outside, h_in = 8. */
export const houseWall = (ins, hOut) => ({ layers: [{ L: 0.013, k: 0.17, name: 'drywall' }, { L: ins, k: 0.04, name: 'glass wool' }, { L: 0.1, k: 0.7, name: 'brick' }], hIn: 8, hOut, Tin: 20, Tout: -5 });
const LAYER_COLORS = [C.muted, C.gold, C.red];

export default defineLab({
  id: 'resistance',
  exam: 'u1',
  title: 'Resistance',
  hint: 'Take the glass wool out of the wall and read the heat flux. Then wrap insulation round a thin wire: the loss goes up before it comes down.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('house', s);
    return s;
  },
  applyScenario: apply,
  sweep: (s) => (s.mode === 'wall' ? { key: 'ins', lo: 0, hi: 0.2 } : { key: 'r2', lo: s.r1, hi: s.r1 + 0.06 }),
  controls() {
    return `
      ${slider('rs-ins', 'Glass wool thickness (m)', 0.09, 0, 0.2, 0.005)}
      ${slider('rs-hout', 'Outside film h (W/m²·K): calm 5, windy 50', 25, 5, 60, 1)}
      ${slider('rs-r2', 'Insulation outer radius (m)', 0.006, 0.002, 0.11, 0.0005)}
      ${slider('rs-k', 'Insulation k (W/m·K)', 0.1, 0.03, 0.4, 0.005)}
      ${slider('rs-h', 'Surface film h (W/m²·K)', 10, 2, 50, 1)}
      <p class="tiny">Wall: 20 °C inside, −5 °C outside, 13 mm drywall (k 0.17), glass wool (k 0.04), 100 mm brick (k 0.7). Pipe: 50 °C hotter than the air. Typical property values.</p>`;
  },
  bind(api) {
    bindSlider('rs-ins', (s, v) => { s.ins = v; }, api);
    bindSlider('rs-hout', (s, v) => { s.hOut = v; }, api);
    bindSlider('rs-r2', (s, v) => { s.r2 = Math.max(v, s.r1); }, api);
    bindSlider('rs-k', (s, v) => { s.k = v; }, api);
    bindSlider('rs-h', (s, v) => { s.h = v; }, api);
  },
  syncControls(state) {
    const wallMode = state.mode === 'wall';
    for (const id of ['rs-ins', 'rs-hout']) showField(id, wallMode);
    for (const id of ['rs-r2', 'rs-k', 'rs-h']) showField(id, !wallMode);
    for (const [id, v] of [['rs-ins', state.ins], ['rs-hout', state.hOut], ['rs-r2', state.r2], ['rs-k', state.k], ['rs-h', state.h]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    if (state.mode === 'wall') {
      const spec = houseWall(state.ins, state.hOut);
      const w = wall(spec);
      const n = wallNumeric(spec);
      const insIdx = w.used.findIndex((l) => l.name === 'glass wool');
      return { mode: 'wall', spec, ...w, qNum: n.q, insDrop: insIdx >= 0 ? w.drops[insIdx + 1] : 0, gap: Math.abs(n.q - w.q) / w.q };
    }
    const p = pipe({ r1: state.r1, r2: Math.max(state.r2, state.r1), k: state.k, h: state.h, dT: 50 });
    const rSearch = criticalBySearch(state.k, state.h, state.r1);
    return { mode: 'pipe', ...p, rSearch, rising: Math.max(state.r2, state.r1) < p.rCrit, gap: Math.abs(rSearch - p.rCrit) / p.rCrit };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    if (c.mode === 'wall') {
      const total = c.used.reduce((s, l) => s + l.L, 0) * 1000;
      const P = plotIn(B, B.free, { lo: -25, hi: total + 25 }, { lo: -8, hi: 23 });
      axes(P, { xLabel: 'x through the wall (mm)', yLabel: 'T (°C)' });
      let x = 0;
      c.used.forEach((l) => {
        const w = l.L * 1000;
        const col = LAYER_COLORS[c.spec.layers.indexOf(l)];
        poly(P, [[x, -8], [x + w, -8], [x + w, 23], [x, 23]], { fill: alpha(col, 0.14), stroke: null });
        label(P, l.name, [x + w / 2, 21.5], { color: col });
        x += w;
      });
      // Air inside, the film's jump to the surface, a straight run through each layer, the outer film.
      const xs = [0];
      for (const l of c.used) xs.push(xs.at(-1) + l.L * 1000);
      seg(P, [-25, c.T[0]], [0, c.T[0]], { color: C.teal, width: 2 });
      seg(P, [0, c.T[0]], [0, c.T[1]], { color: C.teal, width: 1.5, dash: [3, 3] });
      line(P, xs.map((xx, i) => [xx, c.T[i + 1]]), { color: C.teal, width: 2.5 });
      seg(P, [total, c.T.at(-2)], [total, c.T.at(-1)], { color: C.teal, width: 1.5, dash: [3, 3] });
      seg(P, [total, c.T.at(-1)], [total + 25, c.T.at(-1)], { color: C.teal, width: 2 });
      xs.forEach((xx, i) => dot(P, xx, c.T[i + 1], { color: C.teal, r: 3 }));
      label(P, `q = ${fig(c.q)} W/m²`, [total / 2, -5], { color: C.yellow });
      return;
    }
    const lo = state.r1 * 1000;
    const hi = (state.r1 + 0.06) * 1000;
    const pts = [];
    let qMax = 0;
    for (let i = 0; i <= 200; i++) {
      const r = (lo + ((hi - lo) * i) / 200) / 1000;
      const Q = pipe({ r1: state.r1, r2: r, k: state.k, h: state.h, dT: 50 }).Q;
      qMax = Math.max(qMax, Q);
      pts.push([r * 1000, Q]);
    }
    const P = plotIn(B, B.free, { lo, hi }, { lo: 0, hi: 1.2 * qMax });
    axes(P, { xLabel: 'insulation outer radius (mm)', yLabel: 'heat loss (W per m)' });
    line(P, pts, { color: C.teal, width: 2.5 });
    seg(P, [lo, c.bare], [hi, c.bare], { color: alpha(C.text, 0.5), width: 1, dash: [4, 4] });
    label(P, 'bare pipe', [hi, c.bare], { color: C.muted, align: 'right', dy: -10 });
    if (c.rCrit * 1000 > lo && c.rCrit * 1000 < hi) {
      seg(P, [c.rCrit * 1000, 0], [c.rCrit * 1000, 1.1 * qMax], { color: C.pink, width: 1.5, dash: [3, 3] });
      label(P, `critical radius k/h = ${fig(c.rCrit * 1000)} mm`, [c.rCrit * 1000, 1.13 * qMax], { color: C.pink });
    }
    dot(P, Math.max(state.r2, state.r1) * 1000, c.Q, { color: C.yellow, r: 6, ring: C.text });
  },
  law: (state) =>
    state.mode === 'wall'
      ? [String.raw`q = \frac{T_\text{in} - T_\text{out}}{\sum R}, \qquad R_\text{layer} = \frac{L}{k}, \quad R_\text{film} = \frac{1}{h}`]
      : [String.raw`Q' = \frac{\Delta T}{\dfrac{\ln(r_2/r_1)}{2\pi k} + \dfrac{1}{2\pi r_2 h}}, \qquad r_\text{crit} = \frac{k}{h}`],
  liveRows(state, c) {
    if (c.mode === 'wall') {
      return [
        kv('R, film to film', `${c.R.map((r) => fig(r)).join(' + ')} m²·K/W`),
        kv('ΣR', `${fig(c.Rtot)} m²·K/W`),
        kv('U = 1/ΣR', `${fig(c.U)} W/m²·K`),
        kv('Heat flux', `${fig(c.q)} W/m²`),
        kv('Finite volumes', `${fig(c.qNum)} W/m²`),
        kv('Drop across the wool', `${fig(c.insDrop)} °C`),
        kv('Difference', c.gap.toExponential(1)),
      ].join('');
    }
    return [
      kv('Insulation and film (m·K/W)', `${fig(c.Rins)}, ${fig(c.Rfilm)}`),
      kv('Heat loss per metre', `${fig(c.Q)} W, bare ${fig(c.bare)} W`),
      kv('Critical radius k/h', `${fig(c.rCrit * 1000)} mm`),
      kv('Second route: minimum of ΣR', `${fig(c.rSearch * 1000)} mm`),
      kv('Largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    if (c.mode === 'wall') return cells([['heat flux', `${fig(c.q)} W/m²`], ['U', `${fig(c.U)} W/m²·K`], ['inner surface', `${fig(c.T[1])} °C`], ['across insulation', `${fig(c.insDrop)} °C`]]);
    return cells([['heat loss', `${fig(c.Q)} W/m`], ['bare pipe', `${fig(c.bare)} W/m`], ['critical radius', `${fig(c.rCrit * 1000)} mm`], ['pipe radius', `${fig(state.r1 * 1000)} mm`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Studs, corners and windows, which carry heat round the insulation, and radiation from the outer surface, which adds a second path in parallel with the film.`;
    if (c.mode === 'wall') {
      return state.ins > 0
        ? { title: 'The biggest resistance takes the biggest drop', body: `In series every layer carries the same heat flux, ${fig(c.q)} W/m², so each takes a share of the 25 °C in proportion to its resistance. The glass wool takes ${fig(c.insDrop)} °C of it, and the inner wall stays at ${fig(c.T[1])} °C. ${leavesOut}` }
        : { title: 'Without insulation, the films matter', body: `With no glass wool the total resistance falls to ${fig(c.Rtot)} m²·K/W and the heat flux rises to ${fig(c.q)} W/m². The inside air film is now a large share, and the inner surface drops to ${fig(c.T[1])} °C, cold to the touch. ${leavesOut}` };
    }
    return c.rising
      ? { title: 'Below the critical radius, insulation raises the loss', body: `The outer radius, ${fig(state.r2 * 1000)} mm, is below k/h = ${fig(c.rCrit * 1000)} mm. Each extra millimetre adds more surface for the film than resistance in the shell, so the wire loses ${fig(c.Q)} W/m against ${fig(c.bare)} W/m bare. Electrical insulation cools a wire this way. ${leavesOut}` }
      : { title: 'Past the critical radius, insulation pays', body: `The pipe's radius already exceeds k/h = ${fig(c.rCrit * 1000)} mm, so every layer cuts the loss: ${fig(c.Q)} W/m against ${fig(c.bare)} W/m bare. ${leavesOut}` };
  },
  app: false,
});
