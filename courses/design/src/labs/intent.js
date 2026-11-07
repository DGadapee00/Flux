import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { sketchClosed, sketchSolve } from '@flux/subjects/design/sketch.js';

/**
 * Design intent: one sensor plate drawn four ways in a parametric sketch, then edited.
 *
 * All four sketches look the same as drawn: an 80 mm plate with two holes 40 mm apart, centred. Edit
 * the plate's width or the sensor's bolt spacing and they part ways. Only the sketch whose dimensions
 * say what the holes are for (centred, spaced S) keeps the sensor bolting on. The holes' positions are
 * written down for each scheme and solved again by Newton's method on the sketch's constraints, the
 * way a CAD solver does it; the sketch's free degrees of freedom come from the constraint Jacobian's
 * rank (packages/subjects/src/design/sketch.js).
 */
const H = 40;
const HOLE = 6;
const SCHEMES = {
  intent: { name: 'By intent: centred, spaced S' },
  chained: { name: 'Chained: 20 from the edge, then 40' },
  eye: { name: 'By eye: 20 and 60 from the edge' },
  loose: { name: 'Under-defined: spaced S, not located' },
};

const SCENARIOS = [
  { id: 'intent', name: 'Drawn by intent', scheme: 'intent', W: 80, S: 40 },
  { id: 'chained', name: 'Drawn as a chain', scheme: 'chained', W: 80, S: 40 },
  { id: 'eye', name: 'Drawn by eye', scheme: 'eye', W: 80, S: 40 },
  { id: 'loose', name: 'Left under-defined', scheme: 'loose', W: 80, S: 40 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, scheme: sc.scheme, W: sc.W, S: sc.S });
}

export default defineLab({
  id: 'intent',
  exam: 'u3',
  title: 'Design intent',
  hint: 'All four sketches look the same until you edit one. Widen the plate or change the sensor’s bolt spacing, then switch sketches.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('chained', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'W', lo: 60, hi: 120 }),
  controls() {
    return `
      <label class="field"><span>Sketch</span><select id="in-scheme">${Object.entries(SCHEMES).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('')}</select></label>
      ${slider('in-W', 'plate width W (mm)', 80, 60, 120, 1)}
      ${slider('in-S', 'sensor’s bolt spacing S (mm)', 40, 30, 60, 1)}
      <p class="tiny">The sensor bolts on centred. Its holes are dashed; the plate’s holes are solid.</p>`;
  },
  bind(api) {
    document.getElementById('in-scheme')?.addEventListener('change', (e) => {
      api.slice().scheme = e.target.value;
      api.bump();
    });
    bindSlider('in-W', (s, v) => { s.W = v; }, api);
    bindSlider('in-S', (s, v) => { s.S = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('in-scheme');
    if (sel) sel.value = state.scheme;
    for (const [id, val] of [['in-W', state.W], ['in-S', state.S]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const dims = { W: state.W, H, S: state.S };
    const a = sketchClosed(state.scheme, dims);
    const n = sketchSolve(state.scheme, dims);
    let gap = n.residual + Math.abs(n.dof - a.dof);
    if (a.x1 != null) gap = Math.max(gap, Math.abs(n.x1 - a.x1), Math.abs(n.x2 - a.x2));
    const x1 = n.x1;
    const x2 = n.x2;
    const want1 = (state.W - state.S) / 2;
    const want2 = (state.W + state.S) / 2;
    const misalign = Math.max(Math.abs(x1 - want1), Math.abs(x2 - want2));
    const edge = Math.min(x1, state.W - x2);
    return {
      x1, x2, y: H / 2, dof: n.dof, want1, want2,
      spacingError: Math.abs(x2 - x1 - state.S),
      offCentre: Math.abs((x1 + x2) / 2 - state.W / 2),
      misalign,
      edge,
      fits: misalign < 0.5 && edge >= 1.5 * HOLE,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -8, x1: 128, y0: -24, y1: H + 22 }, 16);
    poly(P, [[0, 0], [state.W, 0], [state.W, H], [0, H]], { fill: alpha(C.blue, 0.14), stroke: C.blue, width: 2 });
    const circle = (x, y, r) => Array.from({ length: 41 }, (_, i) => [x + r * Math.cos((i / 40) * 2 * Math.PI), y + r * Math.sin((i / 40) * 2 * Math.PI)]);
    for (const x of [c.want1, c.want2]) line(P, circle(x, c.y, HOLE / 2 + 1.5), { color: C.gold, width: 1.5, dash: [3, 3] });
    for (const x of [c.x1, c.x2]) poly(P, circle(x, c.y, HOLE / 2), { fill: alpha(c.fits ? C.teal : C.red, 0.6), stroke: c.fits ? C.teal : C.red });
    // The sketch's dimensions, drawn the way the scheme states them.
    const dimY = -10;
    const dim = (a, b, text, y = dimY) => {
      seg(P, [a, y], [b, y], { color: C.muted, width: 1 });
      seg(P, [a, y - 2], [a, y + 2], { color: C.muted, width: 1 });
      seg(P, [b, y - 2], [b, y + 2], { color: C.muted, width: 1 });
      label(P, text, [(a + b) / 2, y], { color: C.muted, dy: 10 });
    };
    if (state.scheme === 'intent') {
      dim(c.x1, c.x2, `S = ${fig(state.S)}`);
      seg(P, [state.W / 2, -4], [state.W / 2, H + 4], { color: alpha(C.gold, 0.6), width: 1, dash: [8, 3, 2, 3] });
      label(P, 'symmetric', [state.W / 2, H + 4], { color: C.gold, dy: -8 });
    } else if (state.scheme === 'chained') {
      dim(0, c.x1, '20');
      dim(c.x1, c.x2, '40', dimY - 10);
    } else if (state.scheme === 'eye') {
      dim(0, c.x1, '20');
      dim(0, c.x2, '60', dimY - 10);
    } else {
      dim(c.x1, c.x2, `S = ${fig(state.S)}`);
      label(P, 'nothing fixes where', [(c.x1 + c.x2) / 2, H + 4], { color: C.pink, dy: -8 });
    }
    label(P, `W = ${fig(state.W)}`, [state.W / 2, H], { color: C.blue, dy: -22 });
    dot(P, 0, 0, { color: C.muted, r: 2 });
  },
  law: () => [String.raw`\text{sketch DOF} = 4 - \operatorname{rank} J`, String.raw`x_{1,2} = \frac{W \mp S}{2}\ \ \text{(by intent)}`],
  liveRows(state, c) {
    return [
      kv('holes at', `${fig(c.x1)} and ${fig(c.x2)} mm`),
      kv('sensor needs', `${fig(c.want1)} and ${fig(c.want2)} mm`),
      kv('spacing error', `${fig(c.spacingError)} mm`),
      kv('off centre by', `${fig(c.offCentre)} mm`),
      kv('nearest edge', `${fig(c.edge)} mm (want ≥ ${fig(1.5 * HOLE)})`),
      kv('written down against the solver', `${fig(c.gap)} mm`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['sensor bolts on', c.fits ? 'yes' : 'no'],
      ['worst hole off', `${fig(c.misalign)} mm`],
      ['nearest edge', `${fig(c.edge)} mm`],
      ['sketch DOF', String(c.dof)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real part has many features that refer to each other, and the order they were built in matters too: a fillet on an edge that a later change removes breaks the model.`;
    let title = 'The dimensions say what the holes are for';
    let body = String.raw`Centred and spaced S: change the plate or the sensor and the holes follow, ${fig(c.edge)} mm from the edge.`;
    if (state.scheme === 'loose') {
      title = 'Under-defined: the solver guesses';
      body = String.raw`The sketch has ${c.dof} degree of freedom left, so the solver puts the holes wherever its last guess was: ${fig(c.offCentre)} mm off centre here. CAD shows such geometry in another colour for a reason.`;
    } else if (state.scheme !== 'intent' && !c.fits) {
      title = 'It looked right as drawn';
      body = String.raw`The typed numbers match the first plate, not the reason for them. After the edit the holes are ${fig(c.misalign)} mm from where the sensor needs them${c.edge < 1.5 * HOLE ? `, and only ${fig(c.edge)} mm from an edge` : ''}.`;
    } else if (state.scheme !== 'intent') {
      title = 'Right for now';
      body = String.raw`At this width and spacing the typed numbers happen to match. Change either and the holes stay where they were typed.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
