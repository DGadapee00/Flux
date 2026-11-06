import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, dot, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { constraintRows, rankByElimination, rankByMinors, seat, seatIterative } from '@flux/subjects/design/joints.js';

/**
 * Mount: a plate 100 by 50 mm pushed against pins in the plane, with one pin made off size.
 *
 * Shows exact constraint: three well-placed contacts fix a part in the plane, and a pin off size only
 * moves the part a little, with every contact still touching. A fourth contact is redundant: an
 * error now leaves a gap or an interference the part cannot move away from, so it rocks or strains.
 * Too few contacts leave a freedom. The constrained freedoms are the rank of the contact matrix, found
 * by elimination and by minors; the seating is solved by normal equations and by conjugate gradients
 * (packages/subjects/src/design/joints.js).
 */
const W = 100;
const H = 50;
const bottom = (x) => ({ x, y: 0, nx: 0, ny: 1 });
const left = (y) => ({ x: 0, y, nx: 1, ny: 0 });
const right = (y) => ({ x: W, y, nx: -1, ny: 0 });

const LAYOUTS = {
  exact: { name: 'Two below, one at the side', contacts: [bottom(20), bottom(80), left(25)] },
  over: { name: 'Two below, two at the side', contacts: [bottom(20), bottom(80), left(12), left(38)] },
  between: { name: 'Two below, one each side', contacts: [bottom(20), bottom(80), left(25), right(25)] },
  three: { name: 'Three below, none at the side', contacts: [bottom(20), bottom(80), bottom(50)] },
  under: { name: 'Two below only', contacts: [bottom(20), bottom(80)] },
};

const SCENARIOS = [
  { id: 'exact', name: 'Exact constraint, one pin 50 μm off', layout: 'exact', err: 50 },
  { id: 'over', name: 'A fourth pin, 50 μm off', layout: 'over', err: 50 },
  { id: 'between', name: 'Held between two side pins', layout: 'between', err: 50 },
  { id: 'three', name: 'Three pins in a row below', layout: 'three', err: 50 },
  { id: 'under', name: 'Too few pins', layout: 'under', err: 50 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, layout: sc.layout, err: sc.err });
}

export default defineLab({
  id: 'mount',
  exam: 'u4',
  title: 'Mount',
  hint: 'Make the last pin off size: with three pins the plate just shifts and every pin still touches. Add a fourth and it has nowhere to go.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('exact', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'err', lo: 0, hi: 100 }),
  controls() {
    return `
      <label class="field"><span>Pins</span><select id="mo-layout">${Object.entries(LAYOUTS).map(([id, l]) => `<option value="${id}">${l.name}</option>`).join('')}</select></label>
      ${slider('mo-e', 'last pin off size (μm)', 50, 0, 100, 1)}
      <p class="tiny">A light force pushes the plate down and to the left onto its pins. The red pin is the one made off size.</p>`;
  },
  bind(api) {
    document.getElementById('mo-layout')?.addEventListener('change', (e) => {
      api.slice().layout = e.target.value;
      api.bump();
    });
    bindSlider('mo-e', (s, v) => { s.err = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('mo-layout');
    if (sel) sel.value = state.layout;
    const el = document.getElementById('mo-e');
    if (el && document.activeElement !== el) el.value = String(state.err);
  },
  compute(state) {
    const contacts = (LAYOUTS[state.layout] || LAYOUTS.exact).contacts;
    const J = constraintRows(contacts);
    const rank = rankByElimination(J);
    const rank2 = rankByMinors(J);
    const bad = contacts.length - 1;
    const err = state.err / 1000; // mm
    const a = seat(contacts, bad, err);
    const n = seatIterative(contacts, bad, err);
    const misfitMax = Math.max(...a.misfit.map(Math.abs));
    let gap = rank === rank2 ? 0 : 1;
    gap = Math.max(gap, ...a.misfit.map((m, i) => Math.abs(m - n.misfit[i]) / Math.max(err, 1e-6)));
    const free = 3 - rank;
    // Which freedoms are free: test the three basic motions against J.
    const moves = ['x', 'y', 'θ'].filter((_, k) => J.every((r) => Math.abs(r[k]) < 1e-12));
    return { contacts, rank, free, redundant: contacts.length - rank, misfit: a.misfit, misfitUm: misfitMax * 1000, shiftUm: Math.hypot(a.d[0], a.d[1]) * 1000, turnUrad: a.d[2] * 1e6, moves, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -62, x1: W + 62, y0: -22, y1: H + 18 }, 16);
    poly(P, [[0, 0], [W, 0], [W, H], [0, H]], { fill: alpha(C.blue, 0.14), stroke: C.blue, width: 2 });
    c.contacts.forEach((p, i) => {
      const bad = i === c.contacts.length - 1 && state.err > 0;
      const cx = p.x - p.nx * 4;
      const cy = p.y - p.ny * 4;
      dot(P, cx, cy, { color: bad ? C.red : C.gold, r: 7 });
      const m = c.misfit[i] * 1000;
      if (Math.abs(m) > 0.5) label(P, m < 0 ? `${fig(-m)} μm interference` : `${fig(m)} μm gap`, [cx, cy], { color: C.red, dx: p.nx ? -10 * p.nx : 0, dy: p.ny ? 16 : -14, align: p.nx > 0 ? 'right' : p.nx < 0 ? 'left' : 'center' });
    });
    arrow(P, [W * 0.7, H * 0.7], Math.atan2(-1, -1), 34, { color: alpha(C.text, 0.6), width: 2 });
    label(P, 'nesting force', [W * 0.7, H * 0.7], { color: C.muted, dx: 10, dy: -10, align: 'left' });
    if (c.moves.includes('x')) {
      seg(P, [W * 0.3, H + 8], [W * 0.7, H + 8], { color: C.pink, width: 2, dash: [5, 4] });
      arrow(P, [W * 0.7, H + 8], 0, 12, { color: C.pink });
      arrow(P, [W * 0.3, H + 8], Math.PI, 12, { color: C.pink });
      label(P, 'free to slide', [W / 2, H + 8], { color: C.pink, dy: -10 });
    }
  },
  law: () => [String.raw`\text{constrained} = \operatorname{rank} J,\quad \text{free} = 3 - \operatorname{rank} J`, String.raw`\text{redundant} = n - \operatorname{rank} J`],
  liveRows(state, c) {
    return [
      kv('contacts', String(c.contacts.length)),
      kv('freedoms held (rank)', String(c.rank)),
      kv('plate shifts by', `${fig(c.shiftUm)} μm`),
      kv('plate turns by', `${fig(c.turnUrad)} μrad`),
      kv('normal equations against conjugate gradients', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['free freedoms', String(c.free)],
      ['redundant pins', String(c.redundant)],
      ['worst misfit', `${fig(c.misfitUm)} μm`],
      ['seats cleanly', c.misfitUm < 0.5 && c.free === 0 ? 'yes' : 'no'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The plate and pins are rigid and the motions small. In three dimensions a part has six freedoms, and the same counting gives the 3-2-1 rule: three points on one face, two on the next, one on the third.`;
    let title = 'Three pins, three freedoms';
    let body = String.raw`Two pins below fix the plate's height and tilt; one at the side fixes its slide. Make a pin ${fig(state.err)} μm off and the plate just shifts ${fig(c.shiftUm)} μm and turns ${fig(c.turnUrad)} μrad, still touching all three.`;
    if (c.free > 0) {
      title = 'A freedom is left';
      body = String.raw`${c.contacts.length} pins hold only ${c.rank} of the plate's three freedoms. It can ${c.moves.includes('x') ? 'slide sideways' : 'move'}, so where it sits depends on friction and luck.${c.redundant ? ` And ${c.redundant} pin is redundant: it fights the others by ${fig(c.misfitUm)} μm.` : ''}`;
    } else if (c.redundant > 0) {
      title = 'One pin too many';
      body = String.raw`Four pins for three freedoms: the plate cannot sit on all of them once one is off. It leaves a ${fig(c.misfitUm)} μm misfit, so it rocks on a gap or strains against an interference, and where it settles changes with every assembly.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
