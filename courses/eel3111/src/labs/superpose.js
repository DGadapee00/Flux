import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FIXED, superpose } from '@flux/subjects/em/superposition.js';

/**
 * Superpose: two sources feeding one load, switched on one at a time and then together.
 *
 * Shows that the load's current with both sources on is the sum of the currents each gives alone,
 * but its power is not the sum of the two powers: (I₁ + I₂)² R is more than I₁²R + I₂²R when the
 * parts push the same way, and the two can cancel to no power at all. Each circuit is solved by node
 * voltages and by mesh currents, which must agree (packages/subjects/src/em/superposition.js).
 */
const SCENARIOS = [
  { id: 'aid', name: 'Two sources pushing the same way', V1: 12, V2: 6, RL: 4 },
  { id: 'cancel', name: 'V₂ reversed until the load sees nothing', V1: 12, V2: -9.6, RL: 4 },
  { id: 'oppose', name: 'V₂ reversed, smaller', V1: 12, V2: -4, RL: 4 },
  { id: 'equal', name: 'Equal parts from each', V1: 12, V2: 9.6, RL: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V1: sc.V1, V2: sc.V2, RL: sc.RL, show: 'both' });
}

const KEYS = [['sp-v1', 'V1'], ['sp-v2', 'V2'], ['sp-rl', 'RL']];
const SHOW = { both: 'Both on', one: 'V₁ alone, V₂ a wire', two: 'V₂ alone, V₁ a wire' };
const amps = (x) => `${fig(x)} A`;
const watts = (x) => `${fig(x)} W`;

// The drawing: ground along the bottom, node 1 and node 2 on top, each source on an outer edge.
const N1 = [2, 2];
const N2 = [4, 2];
const RUNS = [
  [[0, 0], [0, 2]], // V₁ and R₁, then a wire to node 1
  [N1, [2, 0]], // R₄
  [N1, N2], // R₃
  [N2, [4, 0]], // R_L
  [[6, 0], [6, 2]], // V₂ and R₂, then a wire to node 2
];

/** A resistor's zigzag, or a source and its resistor, on the straight run from p to q. */
function element(S, p, q, { source, on, color }) {
  const wire = alpha(C.text, 0.7);
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const L = Math.hypot(dx, dy);
  const [ux, uy] = [dx / L, dy / L];
  const [nx, ny] = [-uy, ux];
  const at = (t, off = 0) => [p[0] + ux * t + nx * off, p[1] + uy * t + ny * off];
  const len = Math.min(0.9, 0.7 * L);
  const t0 = (L - len) / 2;
  const zigzag = (a, b, n, amp) => {
    const z = [at(a)];
    for (let k = 1; k < n; k++) z.push(at(a + ((b - a) * k) / n, k % 2 ? amp : -amp));
    z.push(at(b));
    line(S, z, { color, width: 2 });
  };
  if (!source) {
    line(S, [p, at(t0)], { color: wire, width: 2 });
    zigzag(t0, t0 + len, 8, 0.1);
    line(S, [at(t0 + len), q], { color: wire, width: 2 });
    return;
  }
  // The source's circle, or, when it is off, a plain wire where it stood.
  const r = 0.17;
  const c0 = t0 + r;
  line(S, [p, at(c0 - r)], { color: wire, width: 2 });
  if (on) {
    const ring = [];
    for (let k = 0; k <= 32; k++) ring.push(at(c0 + r * Math.cos((2 * Math.PI * k) / 32), r * Math.sin((2 * Math.PI * k) / 32)));
    line(S, ring, { color: C.gold, width: 2 });
    label(S, '+', at(c0 + 0.07), { color: C.gold, bold: true });
  } else {
    line(S, [at(c0 - r), at(c0 + r)], { color: C.blue, width: 2, dash: [3, 3] });
  }
  const z0 = c0 + r + 0.06;
  line(S, [at(c0 + r), at(z0)], { color: wire, width: 2 });
  zigzag(z0, t0 + len, 6, 0.09);
  line(S, [at(t0 + len), q], { color: wire, width: 2 });
}

/** Bars for V₁ alone, V₂ alone, their sum and both on, in one small chart. */
function bars(B, rect, title, vals, unit, { sumMatches }) {
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const span = Math.max(hi - lo, 1e-9);
  const P = plotIn(B, rect, { lo: -0.6, hi: 3.6 }, { lo: lo - (lo < 0 ? 0.25 * span : 0), hi: hi + 0.3 * span }, { left: 52, right: 14, top: 30, bottom: 34 });
  axes(P, { yLabel: `${title} (${unit})`, xFmt: () => '' });
  seg(P, [-0.6, 0], [3.6, 0], { color: alpha(C.text, 0.4), width: 1 });
  const names = ['V₁ alone', 'V₂ alone', 'sum', 'both on'];
  const colors = [C.teal, C.blue, C.gold, sumMatches ? C.green : C.red];
  vals.forEach((v, k) => {
    poly(P, [[k - 0.3, 0], [k + 0.3, 0], [k + 0.3, v], [k - 0.3, v]], { fill: alpha(colors[k], 0.75), stroke: null });
    label(P, fig(v), [k, v], { color: C.text, dy: v >= 0 ? -9 : 10 });
    label(P, names[k], [k, P.Y.lo], { color: C.muted, dy: 12 });
  });
  return P;
}

export default defineLab({
  id: 'superpose',
  exam: 'u3',
  title: 'Superpose',
  hint: 'Read the load current from each source alone, then with both: the currents add. Now do the same with the power. Then reverse V₂ until the load sees nothing.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('aid', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V2', lo: -24, hi: 24 }),
  controls() {
    return `
      <label class="field"><span>Show</span><select id="sp-show">${Object.entries(SHOW).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select></label>
      ${slider('sp-v1', 'Source V₁ (volts)', 12, -24, 24, 0.1)}
      ${slider('sp-v2', 'Source V₂ (volts)', 6, -24, 24, 0.1)}
      ${slider('sp-rl', 'Load R_L (Ω)', 4, 1, 20, 0.5)}
      <p class="tiny">R₁ = ${FIXED.R1} Ω, R₄ = ${FIXED.R4} Ω, R₃ = ${FIXED.R3} Ω, R₂ = ${FIXED.R2} Ω. Each source pushes current up, into the top of its side. A source switched off becomes a wire, drawn dashed; its resistor stays. Gold arrows: branch currents. The pink resistor is the load.</p>`;
  },
  bind(api) {
    document.getElementById('sp-show')?.addEventListener('change', (e) => {
      api.slice().show = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('sp-show');
    if (el) el.value = state.show;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const r = superpose(state);
    const I = [r.one.I, r.two.I, r.one.I + r.two.I, r.both.I];
    const P = [r.one.P, r.two.P, r.powerSum, r.both.P];
    return {
      ...r,
      I,
      P,
      IL: r.both.I,
      PL: r.both.P,
      powerRatio: r.powerSum > 1e-12 ? r.both.P / r.powerSum : null,
      powersAdd: Math.abs(r.both.P - r.powerSum) <= 1e-9 * Math.max(r.both.P, r.powerSum, 1e-9),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    let top = B.free;
    let bottom = null;
    if (wide) {
      top = { ...B.free, x1: B.free.x0 + 0.55 * W };
      bottom = { ...B.free, x0: top.x1 };
    } else if (both) {
      top = { ...B.free, y1: B.free.y0 + 0.5 * H };
      bottom = { ...B.free, y0: top.y1 };
    }
    const shown = state.show === 'one' ? c.one : state.show === 'two' ? c.two : c.both;
    const S = sceneIn(B, top, { x0: -1.2, x1: 7.2, y0: -0.6, y1: 3 }, 14);
    seg(S, [0, 0], [6, 0], { color: alpha(C.text, 0.7), width: 2 });
    seg(S, [0, 2], N1, { color: alpha(C.text, 0.7), width: 2 });
    seg(S, [6, 2], N2, { color: alpha(C.text, 0.7), width: 2 });
    const on = [state.show !== 'two', state.show !== 'one'];
    // Two short lines beside each upright element: its name, then its value.
    const names = [['R₁', `${FIXED.R1} Ω`], ['R₄', `${FIXED.R4} Ω`], ['R₃', `${FIXED.R3} Ω`], ['load', `${fig(state.RL)} Ω`], ['R₂', `${FIXED.R2} Ω`]];
    const big = Math.max(...shown.i.map(Math.abs), 1e-12);
    RUNS.forEach(([p, q], k) => {
      const source = k === 0 || k === 4;
      const isOn = k === 0 ? on[0] : k === 4 ? on[1] : true;
      element(S, p, q, { source, on: isOn, color: k === 3 ? C.pink : C.teal });
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const vertical = Math.abs(p[0] - q[0]) < 1e-9;
      // Values on the outside of the outer branches, beside the inner ones.
      const outward = k === 0 ? -1 : 1;
      const at = vertical ? [mid[0] + 0.32 * outward, mid[1]] : [mid[0], mid[1] + 0.32];
      const align = outward < 0 ? 'right' : 'left';
      if (vertical) {
        const [name, value] = names[k];
        label(S, source ? `${name} ${value}` : name, [at[0], at[1] + 0.13], { color: k === 3 ? C.pink : C.muted, align });
        if (source) label(S, isOn ? `${fig(k === 0 ? state.V1 : state.V2)} V` : 'off', [at[0], at[1] - 0.15], { color: isOn ? C.gold : C.blue, align });
        else label(S, value, [at[0], at[1] - 0.15], { color: k === 3 ? C.pink : C.muted, align });
      } else {
        label(S, names[k].join(' '), at, { color: C.muted });
      }
      // The branch current, along the run, the way it flows. Branch k runs from p to q as drawn,
      // except the sources, whose current flows up from ground, the same way.
      const i = shown.i[k];
      if (Math.abs(i) > 1e-9 * big) {
        const sgn = Math.sign(i);
        const ang = Math.atan2((q[1] - p[1]) * sgn, (q[0] - p[0]) * sgn);
        const side = vertical ? [mid[0] - 0.3 * outward, mid[1]] : [mid[0], mid[1] - 0.28];
        arrow(S, side, ang, 12 + 20 * Math.sqrt(Math.abs(i) / big), { color: C.gold, width: 2, head: 7 });
      }
    });
    dot(S, 0, 0, { color: C.blue, r: 4 });
    label(S, '0 V', [3, 0], { color: C.blue, dy: 14 });
    // Node voltages above each node, set outward, clear of R₃'s label between them.
    for (const [n, P, dx, align] of [[1, N1, -4, 'right'], [2, N2, 4, 'left']]) {
      dot(S, P[0], P[1], { color: C.text, r: 4 });
      label(S, `${fig(shown.v[n])} V`, P, { color: C.text, dx, dy: -13, align });
    }
    label(S, SHOW[state.show], [3, 2.85], { color: C.text, bold: true });
    if (!bottom) return;
    // Two charts: the load's current, then its power.
    const bw = bottom.x1 - bottom.x0;
    const bh = bottom.y1 - bottom.y0;
    const [r1, r2] = bh >= bw * 0.8
      ? [{ ...bottom, y1: bottom.y0 + bh / 2 }, { ...bottom, y0: bottom.y0 + bh / 2 }]
      : [{ ...bottom, x1: bottom.x0 + bw / 2 }, { ...bottom, x0: bottom.x0 + bw / 2 }];
    bars(B, r1, 'load current', c.I, 'A', { sumMatches: true });
    bars(B, r2, 'load power', c.P, 'W', { sumMatches: c.powersAdd });
  },
  law: () => [String.raw`I_L = I_{L1} + I_{L2}`, String.raw`P_L = R_L\,(I_{L1} + I_{L2})^2`, String.raw`\phantom{P_L} = P_1 + P_2 + 2R_L I_{L1} I_{L2}`],
  liveRows(state, c) {
    return [
      kv('Load current: V₁ alone, V₂ alone', `${amps(c.one.I)}, ${amps(c.two.I)}`),
      kv('Their sum, and both on', `${amps(c.one.I + c.two.I)}, ${amps(c.both.I)}`),
      kv('Load power: V₁ alone, V₂ alone', `${watts(c.one.P)}, ${watts(c.two.P)}`),
      kv('Their sum, and both on', `${watts(c.powerSum)}, ${watts(c.both.P)}`),
      kv('The cross term, both on less the two alone', watts(c.cross)),
      kv('V₂ that cancels the load current', `${fig(c.cancelV2)} V`),
      kv('Nodes against meshes, largest difference', c.routeGap.toExponential(0)),
      kv('Both on against the sum of parts', c.sumGap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['load current', amps(c.both.I)],
      ['sum of parts', amps(c.one.I + c.two.I)],
      ['load power', watts(c.both.P)],
      ['sum of powers', watts(c.powerSum)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Current sources, which turn off into a break rather than a wire, and dependent sources, which stay on. Superposition also fails for anything nonlinear: a diode, a lamp whose resistance rises as it heats.`;
    if (Math.abs(c.both.I) < 1e-6 * Math.max(Math.abs(c.one.I), 1e-9)) {
      return { title: 'Two powers, no power', body: `V₁ alone puts ${watts(c.one.P)} into the load and V₂ alone ${watts(c.two.P)}. Together their currents, ${amps(c.one.I)} and ${amps(c.two.I)}, cancel, and the load gets nothing. Powers do not add. ${leavesOut}` };
    }
    if (c.one.I * c.two.I < 0) {
      return { title: 'Opposing parts', body: `The parts push opposite ways: ${amps(c.one.I)} and ${amps(c.two.I)} make ${amps(c.both.I)}. The load gets ${watts(c.both.P)}, less than the ${watts(c.powerSum)} the powers would add to; the cross term is ${watts(c.cross)}. ${leavesOut}` };
    }
    return { title: 'Currents add, powers do not', body: `${amps(c.one.I)} from V₁ and ${amps(c.two.I)} from V₂ make ${amps(c.both.I)} with both on. The powers alone are ${watts(c.one.P)} and ${watts(c.two.P)}, but with both on the load takes ${watts(c.both.P)}: the square of a sum is more than the sum of the squares. Add the currents first, then square. ${leavesOut}` };
  },
  app: false,
});
