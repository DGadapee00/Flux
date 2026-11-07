import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { boltedJoint, boltedJointNetwork } from '@flux/subjects/design/joints.js';

/**
 * Bolted joint: a bolt tightened to a preload, then the joint pulled apart by an external load.
 *
 * Shows that a preloaded bolt feels only its stiffness share C of the external load until the clamped
 * parts separate; the rest goes into unloading the parts. A stiff joint and a high preload protect
 * the bolt. The closed form is the stiffness-share model; the second method solves the two-spring
 * network, members unable to pull, by bisection (packages/subjects/src/design/joints.js).
 */
const SCENARIOS = [
  { id: 'steel', name: 'Steel plates, pulled with 10 kN', Fi: 20, P: 10, ratio: 3 },
  { id: 'steel-rest', name: 'Steel plates, just tightened', Fi: 20, P: 0, ratio: 3 },
  { id: 'gasket', name: 'A soft gasket in the joint', Fi: 20, P: 10, ratio: 0.3 },
  { id: 'separating', name: 'Pulled past separation', Fi: 20, P: 35, ratio: 3 },
  { id: 'loose', name: 'Barely tightened', Fi: 5, P: 10, ratio: 3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Fi: sc.Fi, P: sc.P, ratio: sc.ratio });
}

export default defineLab({
  id: 'bolted',
  exam: 'u4',
  title: 'Bolted joint',
  hint: 'Pull on the joint: the bolt force barely moves until the plates part. Swap in a soft gasket and the bolt takes most of the pull.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'P', lo: 0, hi: 60 }),
  controls() {
    return `
      ${slider('bo-Fi', 'preload Fᵢ (kN)', 20, 2, 40, 0.5)}
      ${slider('bo-P', 'external pull P (kN)', 10, 0, 60, 0.5)}
      ${slider('bo-r', 'member stiffness ÷ bolt stiffness', 3, 0.2, 6, 0.1)}
      <p class="tiny">Steel plates are about three times as stiff as the bolt through them; a gasket is far softer.</p>`;
  },
  bind(api) {
    bindSlider('bo-Fi', (s, v) => { s.Fi = v; }, api);
    bindSlider('bo-P', (s, v) => { s.P = v; }, api);
    bindSlider('bo-r', (s, v) => { s.ratio = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['bo-Fi', state.Fi], ['bo-P', state.P], ['bo-r', state.ratio]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const spec = { Fi: state.Fi, P: state.P, ratio: state.ratio };
    const a = boltedJoint(spec);
    const n = boltedJointNetwork(spec);
    const gap = Math.max(Math.abs(n.Fb - a.Fb), Math.abs(n.Fm - a.Fm)) / Math.max(1, state.Fi);
    const Pmax = Math.max(60, 1.25 * a.Psep);
    const curve = Array.from({ length: 121 }, (_, i) => {
      const P = (i / 120) * Pmax;
      const r = boltedJoint({ ...spec, P });
      return [P, r.Fb, r.Fm];
    });
    return { ...a, Pmax, curve, gap, boltRise: a.Fb - state.Fi };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.36);
    // The joint: two plates, a bolt through them, the pull on each side.
    const S = sceneIn(B, top, { x0: -3, x1: 3, y0: -1.6, y1: 1.6 }, 10);
    const open = c.separated ? 0.15 : 0;
    poly(S, [[-2, 0.05 + open], [2, 0.05 + open], [2, 0.8 + open], [-2, 0.8 + open]], { fill: alpha(C.muted, 0.25), stroke: C.muted });
    poly(S, [[-2, -0.8 - open], [2, -0.8 - open], [2, -0.05 - open], [-2, -0.05 - open]], { fill: alpha(C.muted, 0.25), stroke: C.muted });
    poly(S, [[-0.18, -1.1 - open], [0.18, -1.1 - open], [0.18, 1.1 + open], [-0.18, 1.1 + open]], { fill: alpha(C.gold, 0.6), stroke: C.gold });
    poly(S, [[-0.45, 1.1 + open], [0.45, 1.1 + open], [0.45, 1.35 + open], [-0.45, 1.35 + open]], { fill: alpha(C.gold, 0.6), stroke: C.gold });
    poly(S, [[-0.4, -1.35 - open], [0.4, -1.35 - open], [0.4, -1.1 - open], [-0.4, -1.1 - open]], { fill: alpha(C.gold, 0.6), stroke: C.gold });
    if (state.P > 0) {
      arrow(S, [1.6, 0.8 + open], Math.PI / 2, 14 + 30 * (state.P / c.Pmax), { color: C.pink });
      arrow(S, [1.6, -0.8 - open], -Math.PI / 2, 14 + 30 * (state.P / c.Pmax), { color: C.pink });
      label(S, `P = ${fig(state.P)} kN`, [2.05, 0.9 + open], { color: C.pink, align: 'left' });
    }
    label(S, `bolt ${fig(c.Fb)} kN`, [0.55, 1.2 + open], { color: C.gold, align: 'left' });
    label(S, c.separated ? 'plates apart' : `clamp ${fig(c.Fm)} kN`, [-2.1, 0], { color: c.separated ? C.red : C.teal, align: 'right' });
    // Forces against the pull.
    const top2 = Math.max(...c.curve.map((p) => p[1])) * 1.1;
    const P = plotIn(B, bottom, { lo: 0, hi: c.Pmax }, { lo: 0, hi: top2 });
    axes(P, { xLabel: 'external pull P (kN)', yLabel: 'force (kN)' });
    line(P, c.curve.map(([x, fb]) => [x, fb]), { color: C.gold, width: 2.5 });
    line(P, c.curve.map(([x, , fm]) => [x, fm]), { color: C.teal, width: 2.5 });
    line(P, [[0, 0], [c.Pmax, c.Pmax]], { color: alpha(C.text, 0.35), width: 1, dash: [4, 4] });
    note(P, 'bolt', c.Pmax * 0.05, c.curve[6][1], { color: C.gold, dy: -8 });
    note(P, 'clamp', c.Pmax * 0.05, c.curve[6][2], { color: C.teal, dy: 14 });
    if (c.Psep < c.Pmax) {
      seg(P, [c.Psep, 0], [c.Psep, top2], { color: C.red, width: 1, dash: [3, 4] });
      note(P, 'plates part', c.Psep, top2 * 0.95, { color: C.red });
    }
    dot(P, state.P, c.Fb, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`F_b = F_i + C\,P,\qquad F_m = F_i - (1 - C)\,P`, String.raw`C = \frac{k_b}{k_b + k_m},\qquad P_\text{sep} = \frac{F_i}{1 - C}`],
  liveRows(state, c) {
    return [
      kv('stiffness share $C$', fig(c.C)),
      kv('bolt force rise from the pull', `${fig(c.boltRise)} kN`),
      kv('plates part at', `${fig(c.Psep)} kN`),
      kv('share model against spring network', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['bolt force', `${fig(c.Fb)} kN`],
      ['clamp left', `${fig(c.Fm)} kN`],
      ['share $C$', fig(c.C)],
      ['plates part at', `${fig(c.Psep)} kN`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The pull acts at the bolt's faces and the joint stays elastic. Real loads enter part way through the members, which lowers the bolt's share further, and preload from a torque wrench scatters by ±25% or more with friction.`;
    let title = 'The bolt hardly notices';
    let body = String.raw`A pull of ${fig(state.P)} kN raises the bolt only ${fig(c.boltRise)} kN, its share C = ${fig(c.C)}. The rest of the pull goes into unclamping the plates, which still press together with ${fig(c.Fm)} kN.`;
    if (c.separated) {
      title = 'The plates have parted';
      body = String.raw`Past ${fig(c.Psep)} kN nothing clamps the plates, and the bolt carries the whole pull, ${fig(c.Fb)} kN. A joint that opens leaks, loosens and fatigues the bolt. More preload pushes the parting point up.`;
    } else if (state.ratio < 1) {
      title = 'A soft joint loads the bolt';
      body = String.raw`With members softer than the bolt, its share is ${fig(c.C)}: the pull of ${fig(state.P)} kN raises it ${fig(c.boltRise)} kN. Gaskets cost bolt life; a stiff metal-to-metal joint protects it.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
