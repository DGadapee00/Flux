import { trussStiffness, unitLoadTruss } from '@flux/subjects/mechanics/virtualwork.js';
import { JOIST_E_PSI } from '../data/joist.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, hidden, label, panes, pinSupport, poly, rollerSupport, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that the unit-load method finds any one displacement of a truss from a table of member
 * forces: put a 1 lb load where the answer is wanted, and each member adds n N L/AE. On a
 * king-post roof truss the rafters and bottom chord make nearly all the ceiling sag, the king post
 * almost none. The heel slides out on the bottom chord's stretch alone: the rafters have n = 0 for
 * that move. A steeper roof sags a third as much, because its members carry far less force.
 *
 * Cited: roof live load 20 psf (IBC Table 1607.1). Members are 2×6, dressed 1.5 × 5.5 in
 * (PS 20), A = 8.25 in². E = 1,400,000 psi is the No. 2 Southern Pine value (src/data/joist.js),
 * taken here for the 2×6 too. The 10 psf roof dead load, 5 psf ceiling, 24 in truss spacing and
 * the geometry are assumed. Recompute: unit-load virtual work. Second method: a direct-stiffness
 * solve of the same truss.
 */

const AE = JOIST_E_PSI * 1.5 * 5.5;
const LIVE = 20;
const DEAD = 10;
const SPACE = 2;
const OUT = 'The joints are pins and the members only stretch. A real truss joint is a toothed steel plate, and its teeth slip and crush the wood a little under load, so a built truss sags several times more than this. Wood also creeps: a roof loaded for years sags further. The rafters carry the roof between joints as beams too, which this joint-load model leaves out of their stress, though not of the truss\'s sag. Snow and wind are separate cases.';

const TARGET = {
  D: { name: 'the ceiling at midspan', dir: [0, -1] },
  B: { name: 'the ridge', dir: [0, -1] },
  C: { name: 'the right heel, sliding out', dir: [1, 0] },
};

const SCENARIOS = [
  { id: 'ceiling', name: 'Ceiling sag, 4:12 roof', at: 'D', pitch: 4, span: 24, ceil: 5 },
  { id: 'ridge', name: 'Ridge drop, 4:12 roof', at: 'B', pitch: 4, span: 24, ceil: 5 },
  { id: 'heel', name: 'Heel spread, 4:12 roof', at: 'C', pitch: 4, span: 24, ceil: 5 },
  { id: 'steep', name: 'Ceiling sag, 8:12 roof', at: 'D', pitch: 8, span: 24, ceil: 5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, at: sc.at, pitch: sc.pitch, span: sc.span, ceil: sc.ceil });
}

/** Inch-pound. Joints A and C are the heels, B the ridge, D the bottom of the king post. */
export function roofTruss(state) {
  const span = (Number(state.span) || 24) * 12;
  const rise = ((Number(state.pitch) || 4) / 12) * (span / 2);
  const roofLb = ((LIVE + DEAD) * SPACE * (span / 12)) / 2;
  const ceilLb = ((Number(state.ceil) || 0) * SPACE * (span / 12)) / 2;
  const truss = {
    joints: { A: { x: 0, y: 0 }, D: { x: span / 2, y: 0 }, C: { x: span, y: 0 }, B: { x: span / 2, y: rise } },
    members: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'C'], ['B', 'D']],
    // Half the roof's load reaches the ridge; the heel shares sit on the walls.
    loads: { B: { y: -roofLb }, D: { y: -ceilLb } },
    supports: { A: 'pin', C: 'rollerY' },
  };
  const at = TARGET[state.at] ? state.at : 'D';
  const v = unitLoadTruss(truss, AE, at, TARGET[at].dir);
  // Unit forces that are zero by statics come out as round-off; call them zero.
  for (const r of v.rows) if (Math.abs(r.n) < 1e-9) { r.n = 0; r.term = 0; }
  const k = trussStiffness(truss, AE);
  const along = k.disp[at].x * TARGET[at].dir[0] + k.disp[at].y * TARGET[at].dir[1];
  const gap = Math.abs(along - v.delta) / Math.max(Math.abs(v.delta), 1e-12);
  return { span, rise, roofLb, ceilLb, truss, at, delta: v.delta, rows: v.rows, disp: k.disp, gap };
}

function member(B, rect, state, c, veiled) {
  const { span, rise, truss } = c;
  const S = sceneIn(B, rect, { x0: -0.08 * span, x1: 1.08 * span, y0: -0.25 * span, y1: rise + 0.12 * span }, 12);
  const big = Math.max(...c.rows.map((r) => Math.abs(r.N)), 1);
  const scale = (0.04 * span) / Math.max(...Object.values(c.disp).map((d) => Math.hypot(d.x, d.y)), 1e-9);
  const P = (j) => [truss.joints[j].x, truss.joints[j].y];
  const Q = (j) => [truss.joints[j].x + scale * c.disp[j].x, truss.joints[j].y + scale * c.disp[j].y];
  c.rows.forEach((r) => {
    const [p, q] = [r.member[0], r.member[1]];
    seg(S, P(p), P(q), { color: alpha(C.text, 0.2), width: 1, dash: [4, 4] });
    const color = r.N > 1e-6 ? C.teal : r.N < -1e-6 ? C.pink : C.muted;
    seg(S, Q(p), Q(q), { color, width: 2 + 5 * (Math.abs(r.N) / big) });
    if (!veiled) {
      const m = [(Q(p)[0] + Q(q)[0]) / 2, (Q(p)[1] + Q(q)[1]) / 2];
      const vertical = Math.abs(truss.joints[p].x - truss.joints[q].x) < 1e-6;
      label(S, `${fig(r.N)}`, m, { color, dx: vertical ? 8 : 0, dy: vertical ? 0 : r.member === 'AD' || r.member === 'DC' ? 12 : -10, align: vertical ? 'left' : 'center' });
    }
  });
  pinSupport(S, P('A'));
  rollerSupport(S, P('C'));
  // The unit load, where the displacement is wanted.
  const tgt = TARGET[c.at];
  const at = Q(c.at);
  const ang = Math.atan2(tgt.dir[1], tgt.dir[0]);
  arrow(S, [at[0] - (tgt.dir[0] * 0.07 * span), at[1] - (tgt.dir[1] * 0.07 * span)], ang, 26, { color: C.yellow });
  if (!veiled) {
    label(S, '1 lb', at, { color: C.yellow, dx: tgt.dir[0] ? 0 : -10, dy: tgt.dir[0] ? -14 : -24, align: tgt.dir[0] ? 'center' : 'right' });
    label(S, `${fig(state.pitch)}:12, ${fig(c.span / 12)} ft · lb, + tension`, [0.5 * span, -0.2 * span], { color: C.dim });
  }
}

export default defineLab({
  id: 'rooftruss',
  exam: 'u10',
  title: 'Roof truss sag',
  app: true,
  hint: 'Put a 1 lb load where you want the displacement. Each member adds n N L/AE: its unit-load force times its real stretch.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ceiling', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pitch', lo: 2, hi: 12 }),
  controls() {
    return `
      ${slider('rt-p', 'roof pitch (rise per 12)', 4, 2, 12, 0.5)}
      ${slider('rt-s', 'span (ft)', 24, 16, 36, 1)}
      ${slider('rt-c', 'ceiling load (psf)', 5, 0, 15, 1)}
      <p class="tiny">Cited: roof live load 20 psf (IBC Table 1607.1). 2×6 members, 1.5 × 5.5 in (PS 20); E = 1,400,000 psi (No. 2 Southern Pine, AWC). Roof dead 10 psf, ceiling load, 24 in spacing and the geometry are assumed.</p>`;
  },
  bind(api) {
    bindSlider('rt-p', (s, v) => { s.pitch = v; }, api);
    bindSlider('rt-s', (s, v) => { s.span = v; }, api);
    bindSlider('rt-c', (s, v) => { s.ceil = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('rt-p', state.pitch);
    set('rt-s', state.span);
    set('rt-c', state.ceil);
  },
  compute(state) {
    return roofTruss(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.55, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    // Each member's share of the displacement: n N L/AE, as bars.
    const rows = c.rows;
    const top = Math.max(...rows.map((r) => Math.abs(r.term)), 1e-12);
    const S = sceneIn(B, R, { x0: -0.35, x1: 1.75, y0: -0.4, y1: rows.length + 0.2 }, 14);
    label(S, `n N L/AE by member (in)`, [-0.35, rows.length + 0.1], { color: C.muted, align: 'left' });
    rows.forEach((r, i) => {
      const y = rows.length - 1 - i;
      const w = r.term / top;
      const color = r.term >= 0 ? C.gold : C.teal;
      poly(S, [[0, y + 0.15], [Math.max(w, 0) || 0, y + 0.15], [Math.max(w, 0) || 0, y + 0.75], [0, y + 0.75]], { fill: alpha(color, 0.7), stroke: color });
      if (w < 0) poly(S, [[w, y + 0.15], [0, y + 0.15], [0, y + 0.75], [w, y + 0.75]], { fill: alpha(C.teal, 0.7), stroke: C.teal });
      label(S, r.member, [0, y + 0.45], { color: C.text, dx: -8, align: 'right' });
      label(S, fig(r.term), [Math.max(w, 0), y + 0.45], { color: C.muted, dx: 6, align: 'left' });
    });
    seg(S, [0, -0.1], [0, rows.length], { color: alpha(C.text, 0.4), width: 1 });
  },
  law: () => [String.raw`1\cdot\Delta = \sum \frac{n\,N\,L}{AE}`],
  liveRows(state, c) {
    return [
      kv('displacement of', TARGET[c.at].name),
      kv('Δ by unit load', `${fig(c.delta)} in`),
      kv('roof load at the ridge', `${fig(c.roofLb)} lb`),
      kv('ceiling load at the king post', `${fig(c.ceilLb)} lb`),
      ...c.rows.map((r) => kv(`${r.member}: N, n`, `${fig(r.N)} lb, ${fig(r.n)}`)),
    ].join('');
  },
  readout(state, c) {
    const rafter = c.rows.find((r) => r.member === 'AB');
    const chord = c.rows.find((r) => r.member === 'AD');
    return cells([
      ['Δ', `${fig(c.delta)} in`],
      ['rafter', `${fig(rafter.N)} lb`],
      ['bottom chord', `${fig(chord.N)} lb`],
      ['king post', `${fig(c.rows.find((r) => r.member === 'BD').N)} lb`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const lead = [...c.rows].sort((a, b) => Math.abs(b.term) - Math.abs(a.term))[0];
    return {
      title: `Unit load at ${c.at}`,
      body: String.raw`A 1 lb load at ${c.at}, along the move wanted, puts force n in each member. The real loads stretch each member by NL/AE. Their products add to ${fig(c.delta)} in for ${TARGET[c.at].name}. ${lead.member} gives the most, ${fig((100 * lead.term) / c.delta)}% of it.${c.rows.some((r) => Math.abs(r.n) < 1e-9) ? ' Members with n = 0 add nothing, however hard they work.' : ''}`,
    };
  }),
});
