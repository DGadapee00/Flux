import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, dot, label, line, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CIRCUITS, build } from '../data/circuits.js';
import { analyse } from '@flux/subjects/em/networks.js';

/**
 * Nodes: one circuit solved by node voltages and by mesh currents, side by side.
 *
 * Nodal analysis writes Kirchhoff's current law at every node but ground: G v = i. Mesh analysis
 * writes the voltage law round every window: R I = v. Shows that one method is not right for every
 * circuit: the two agree on every current, but four branches across two rails need one nodal
 * equation against three mesh equations, and a single loop the other way round. The routes check
 * each other: the lab requires every branch current to agree (packages/subjects/src/em/networks.js).
 */
const SCENARIOS = [
  { id: 'parallel', name: 'Four branches across two rails: nodes win', circuit: 'parallel', V: 10, Rx: 4 },
  { id: 'series', name: 'One loop: meshes win', circuit: 'series', V: 12, Rx: 3 },
  { id: 'bridge', name: 'A bridge: three each', circuit: 'bridge', V: 12, Rx: 5 },
  { id: 'balanced', name: 'A balanced bridge: no current across', circuit: 'bridge', V: 12, Rx: 5, balance: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, circuit: sc.circuit, V: sc.V, Rx: sc.Rx, balance: !!sc.balance });
}

/** The balanced bridge: R1/R3 = R2/R4 with R4 = 6 Ω instead of 2 Ω. */
function circuitFor(state) {
  const c = build(state.circuit, state.V, state.Rx);
  if (state.circuit === 'bridge' && state.balance) c.branches[4] = { ...c.branches[4], R: 6 };
  return c;
}

const matrix = (M) => `[${M.map((r) => r.map((v) => fig(Math.abs(v) < 1e-12 ? 0 : v)).join(', ')).join('; ')}]`;

/** A resistor's zigzag, or a source's circle, in the middle of a straight run from p to q. */
function element(S, p, q, br, color) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const at = (t, off = 0) => [p[0] + ux * t + nx * off, p[1] + uy * t + ny * off];
  const len = Math.min(0.9, 0.6 * L);
  const t0 = (L - len) / 2;
  if (br.V !== 0) {
    // A source in series with its resistor: circle, then a short zigzag.
    const r = 0.16;
    const cTop = t0 + r;
    line(S, [p, at(cTop - r)], { color: alpha(C.text, 0.7), width: 2 });
    const circle = [];
    for (let k = 0; k <= 32; k++) circle.push(at(cTop + r * Math.cos((2 * Math.PI * k) / 32), r * Math.sin((2 * Math.PI * k) / 32)));
    line(S, circle, { color: C.gold, width: 2 });
    label(S, '+', at(cTop + 0.07, 0), { color: C.gold, bold: true });
    const z0 = cTop + r + 0.05;
    const z1 = t0 + len;
    const zig = [at(z0)];
    for (let k = 1; k < 6; k++) zig.push(at(z0 + ((z1 - z0) * k) / 6, k % 2 ? 0.09 : -0.09));
    zig.push(at(z1));
    line(S, [at(cTop + r), at(z0)], { color: alpha(C.text, 0.7), width: 2 });
    line(S, zig, { color, width: 2 });
    line(S, [at(z1), q], { color: alpha(C.text, 0.7), width: 2 });
    return at(L / 2, 0.32);
  }
  const zig = [at(t0)];
  for (let k = 1; k < 8; k++) zig.push(at(t0 + (len * k) / 8, k % 2 ? 0.1 : -0.1));
  zig.push(at(t0 + len));
  line(S, [p, at(t0)], { color: alpha(C.text, 0.7), width: 2 });
  line(S, zig, { color, width: 2 });
  line(S, [at(t0 + len), q], { color: alpha(C.text, 0.7), width: 2 });
  return at(L / 2, 0.3);
}

export default defineLab({
  id: 'nodes',
  exam: 'u1',
  title: 'Nodes',
  hint: 'Count the equations each method needs: one nodal equation for the rails, one mesh equation for the loop. The currents always agree.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('parallel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Rx', lo: 0.5, hi: 20 }),
  controls() {
    return `
      <label class="field"><span>Circuit</span><select id="nd-circ">${Object.entries(CIRCUITS).map(([id, c]) => `<option value="${id}">${c.name}</option>`).join('')}</select></label>
      ${slider('nd-V', 'First source V (volts)', 10, 0, 24, 0.5)}
      ${slider('nd-Rx', 'Marked resistor (Ω)', 4, 0.5, 20, 0.5)}
      <p class="tiny">Each source drawn with a + is in series with its own resistor. Node 0, ground, is the bottom left (the bottom rail, the bottom corner). Gold arrows: branch currents.</p>`;
  },
  bind(api) {
    document.getElementById('nd-circ')?.addEventListener('change', (e) => {
      const s = api.slice();
      s.circuit = e.target.value;
      s.balance = false;
      api.bump();
    });
    bindSlider('nd-V', (s, v) => { s.V = v; }, api);
    bindSlider('nd-Rx', (s, v) => { s.Rx = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('nd-circ');
    if (el) el.value = state.circuit;
    for (const [id, v] of [['nd-V', state.V], ['nd-Rx', state.Rx]]) {
      const s = document.getElementById(id);
      if (s && document.activeElement !== s) s.value = String(v);
    }
  },
  compute(state) {
    const c = circuitFor(state);
    const r = analyse(c);
    const bridgeI = state.circuit === 'bridge' ? r.nodal.i[5] : null;
    return { circuit: c, nodal: r.nodal, mesh: r.mesh, gap: r.gap, nodalCount: r.nodal.equations, meshCount: r.mesh.equations, bridgeI, sourceI: r.nodal.i[c.branches.findIndex((b) => b.source)] };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const ckt = c.circuit;
    const xs = ckt.branches.flatMap((b) => b.path.map((p) => p[0]));
    const ys = ckt.branches.flatMap((b) => b.path.map((p) => p[1]));
    const S = sceneIn(B, B.free, { x0: Math.min(...xs) - 0.8, x1: Math.max(...xs) + 0.8, y0: Math.min(...ys) - 0.9, y1: Math.max(...ys) + 0.9 }, 14);
    for (const [p, q] of ckt.rails) seg(S, p, q, { color: alpha(C.text, 0.7), width: 2 });
    const big = Math.max(...c.nodal.i.map(Math.abs), 1e-12);
    const centre = [ckt.nodeAt.reduce((t, p) => t + p[0], 0) / ckt.nodeAt.length, ckt.nodeAt.reduce((t, p) => t + p[1], 0) / ckt.nodeAt.length];
    ckt.branches.forEach((br, k) => {
      // Draw the element on the branch's longest straight run, plain wire elsewhere.
      let longest = 0;
      for (let j = 1; j < br.path.length; j++) {
        const L = Math.hypot(br.path[j][0] - br.path[j - 1][0], br.path[j][1] - br.path[j - 1][1]);
        const Lb = Math.hypot(br.path[longest + 1][0] - br.path[longest][0], br.path[longest + 1][1] - br.path[longest][1]);
        if (L > Lb) longest = j - 1;
      }
      if (br.run != null) longest = br.run;
      for (let j = 1; j < br.path.length; j++) if (j - 1 !== longest) seg(S, br.path[j - 1], br.path[j], { color: alpha(C.text, 0.7), width: 2 });
      const p = br.path[longest];
      const q = br.path[longest + 1];
      element(S, p, q, br, br.x ? C.pink : C.teal);
      // The current on the side of the run away from the circuit's middle, the resistor's value on
      // the side toward it, so the two never meet.
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      let nrm = [-(q[1] - p[1]) / L, (q[0] - p[0]) / L];
      const out = nrm[0] * (mid[0] - centre[0]) + nrm[1] * (mid[1] - centre[1]);
      if (out < 0 || (Math.abs(out) < 1e-9 && nrm[1] < 0)) nrm = [-nrm[0], -nrm[1]];
      // A source on the circuit's edge keeps its value outside, clear of the nodes, and its current inside.
      if (br.source) nrm = [-nrm[0], -nrm[1]];
      const side = (d) => [mid[0] + d * nrm[0], mid[1] + d * nrm[1]];
      label(S, `${fig(br.R)} Ω${br.V ? `, ${fig(br.V)} V` : ''}`, side(-0.42), { color: br.x ? C.pink : C.muted });
      // The branch current, as an arrow along the run, pointing the way it flows.
      const i = c.nodal.i[k];
      if (Math.abs(i) > 1e-9 * big) {
        const sgn = Math.sign(i);
        const ang = Math.atan2((q[1] - p[1]) * sgn, (q[0] - p[0]) * sgn);
        const len = 12 + 22 * Math.sqrt(Math.abs(i) / big);
        arrow(S, side(0.28), ang, len, { color: C.gold, width: 2, head: 7, tail: false });
        // On a small screen the values would crowd the drawing; the panel lists them instead.
        if (S.k >= 70) label(S, `${fig(Math.abs(i))} A`, side(0.6), { color: C.gold });
      }
    });
    ckt.nodeAt.forEach(([x, y], n) => {
      dot(S, x, y, { color: n === 0 ? C.blue : C.text, r: 4 });
      label(S, n === 0 ? '0 V' : `${fig(c.nodal.v[n])} V`, [x, y], { color: n === 0 ? C.blue : C.text, dx: 10, dy: -10, align: 'left' });
    });
  },
  law: () => [String.raw`\text{nodes: } G\,\mathbf v = \mathbf i, \quad G_{kk} = \sum \frac{1}{R}, \; G_{kj} = -\frac{1}{R_{kj}}`, String.raw`\text{meshes: } R\,\mathbf I = \mathbf v, \qquad \#\text{meshes} = b - n + 1`],
  liveRows(state, c) {
    return [
      kv('Nodal equations (nodes − 1)', String(c.nodalCount)),
      kv('G', matrix(c.nodal.G)),
      kv('Mesh equations (b − n + 1)', String(c.meshCount)),
      kv('R', matrix(c.mesh.Z)),
      kv('Loop currents', c.mesh.I.map((v) => `${fig(v)} A`).join(', ')),
      kv('Branch currents', c.nodal.i.map((v, k) => `${fig(c.circuit.branches[k].R)} Ω: ${fig(Math.abs(v))} A`).join(', ')),
      kv('Source current', `${fig(c.sourceI)} A`),
      kv('Nodes against meshes, largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['nodal equations', String(c.nodalCount)],
      ['mesh equations', String(c.meshCount)],
      ['source current', `${fig(c.sourceI)} A`],
      [state.circuit === 'bridge' ? 'across the bridge' : 'top node', state.circuit === 'bridge' ? `${fig(c.bridgeI)} A` : `${fig(c.nodal.v[1])} V`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Ideal sources and supernodes. A voltage source alone between two nodes fixes their difference and joins them into a supernode; a current source shared by two meshes makes a supermesh. Simulators such as SPICE use modified nodal analysis, which adds one unknown per voltage source.`;
    let title = 'Count the equations before you start';
    let body = `Nodal analysis needs ${c.nodalCount} equation${c.nodalCount > 1 ? 's' : ''} here, mesh analysis ${c.meshCount}. Both give the same currents, to ${c.gap.toExponential(0)}.`;
    if (state.circuit === 'parallel') {
      title = 'Two rails: one node voltage does it';
      body = `Every branch sits between the same two nodes, so one unknown, the top rail's voltage, settles everything: ${fig(c.nodal.v[1])} V. Mesh analysis needs a loop current for each of the ${c.meshCount} windows. ${body}`;
    } else if (state.circuit === 'series') {
      title = 'One loop: one mesh current does it';
      body = `One current flows all the way round: ${fig(c.mesh.I[0])} A. Nodal analysis needs a voltage at each of the ${c.nodalCount} nodes above ground. ${body}`;
    } else if (Math.abs(c.bridgeI) < 1e-9) {
      title = 'A balanced bridge: no current across';
      body = `With R₁/R₃ = R₂/R₄ the two middle nodes sit at the same voltage, so nothing flows through the bridge resistor, whatever its value. This is how a strain-gauge bridge reads zero until the gauge stretches.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
