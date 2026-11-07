import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { DUCT, DUCTS, PROPERTIES, followSystem, rateScale, systemAt, transport } from '@flux/subjects/mechanics/transport.js';

/**
 * Transport: a fixed box in a duct, and the water that was in it a moment ago moving on.
 *
 * Shows the Reynolds transport theorem. The system is the water in the box at this instant; the box
 * stays put. The system's rate of change is the build-up inside the box plus the net outflow
 * through its faces. A dye blob entering the box raises the dye in the box, yet the system's dye
 * does not change. Steady flow through a nozzle changes nothing in the box, yet the water in it
 * speeds up and feels a net force. The terms come in closed form (packages/subjects/src/mechanics/
 * transport.js); the second method follows the system's ends by their volume labels, integrates its
 * property by Simpson's rule and differences it in time.
 */
const SCENARIOS = [
  { id: 'blob', name: 'A dye blob entering the box', duct: 'straight', prop: 'dye', k: 0, t: 1, xb: 0.75 },
  { id: 'nozzle', name: 'Steady flow through a nozzle: momentum', duct: 'nozzle', prop: 'momentum', k: 0, t: 1, xb: 0.75 },
  { id: 'surge', name: 'A straight pipe whose flow is growing', duct: 'straight', prop: 'momentum', k: 0.5, t: 1, xb: 0.75 },
  { id: 'both', name: 'A nozzle whose flow is growing', duct: 'nozzle', prop: 'momentum', k: 0.5, t: 1, xb: 0.75 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, duct: sc.duct, prop: sc.prop, k: sc.k, t: sc.t, xb: sc.xb });
}

const params = (s) => ({ duct: s.duct, prop: s.prop, k: s.k, t: s.t, xb: s.xb });
const DT_SHOW = 0.3; // s: how far on the drawn system has moved

export default defineLab({
  id: 'transport',
  exam: 'u3',
  title: 'Transport',
  hint: 'The dashed box stays put; the gold water was in it a moment ago. The box term plus the net outflow is the system’s rate, whatever the flow does.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('blob', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 't', lo: 0, hi: 3 }),
  controls() {
    const opts = (o) => Object.entries(o).map(([id, v]) => `<option value="${id}">${v.name}</option>`).join('');
    return `
      <label class="field"><span>Duct</span><select id="tr-duct">${opts(DUCTS)}</select></label>
      <label class="field"><span>Property B</span><select id="tr-prop">${opts(PROPERTIES)}</select></label>
      ${slider('tr-k', 'inflow growth k (per second)', 0, 0, 1, 0.05)}
      ${slider('tr-t', 'time t (s)', 1, 0, 3, 0.05)}
      ${slider('tr-x', 'box starts at x (m)', 0.75, 0.1, 1.4, 0.05)}
      <p class="tiny">Water, 1000 kg/m³. The duct is 2 m long and its area falls in a straight line from 0.02 m². The inflow is 10 L/s × (1 + kt). The box holds 0.5 m of duct. The dye is 1 g/L at the blob’s centre.</p>`;
  },
  bind(api) {
    document.getElementById('tr-duct')?.addEventListener('change', (e) => {
      api.slice().duct = e.target.value;
      api.bump();
    });
    document.getElementById('tr-prop')?.addEventListener('change', (e) => {
      api.slice().prop = e.target.value;
      api.bump();
    });
    bindSlider('tr-k', (s, v) => { s.k = v; }, api);
    bindSlider('tr-t', (s, v) => { s.t = v; }, api);
    bindSlider('tr-x', (s, v) => { s.xb = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['tr-duct', state.duct], ['tr-prop', state.prop]]) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    }
    for (const [id, val] of [['tr-k', state.k], ['tr-t', state.t], ['tr-x', state.xb]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = params(state);
    const r = transport(p);
    const follow = followSystem(p);
    const scale = rateScale({ prop: p.prop, ...r });
    const gap = Math.abs(follow - r.sysRate) / scale;
    // The drawn system a moment on, kept inside the duct.
    let dt = DT_SHOW;
    let later = systemAt(p, dt);
    while (later.xz > DUCT.L && dt > 0.01) {
      dt /= 2;
      later = systemAt(p, dt);
    }
    const tiny = 1e-6 * scale;
    return { ...r, follow, scale, gap, later, dtShown: dt, steady: Math.abs(r.boxRate) < tiny, noFlux: Math.abs(r.outflow) < tiny, fixed: Math.abs(r.sysRate) < tiny, changes: Math.abs(r.sysRate) >= tiny };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const [top, bottom] = split(B.free, wide ? 0.55 : 0.36);
    const F = c.F;
    const depth = 0.1; // m: the drawing shows A as a height A/depth
    const half = (x) => F.A(Math.min(Math.max(x, 0), F.L)) / depth / 2;
    const S = sceneIn(B, top, { x0: -0.05, x1: F.L + 0.05, y0: -0.16, y1: 0.16 }, 16);
    const xs = (a, b, n = 40) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
    const band = (a, b) => [...xs(a, b).map((x) => [x, half(x)]), ...xs(a, b).reverse().map((x) => [x, -half(x)])];
    poly(S, band(0, F.L), { fill: alpha(C.blue, 0.12), stroke: null });
    if (state.prop === 'dye') {
      for (let i = 0; i < 120; i++) {
        const a = (i / 120) * F.L;
        const b = ((i + 1) / 120) * F.L;
        const share = F.dye((a + b) / 2, state.t) / 1000;
        if (share > 0.02) poly(S, band(a, b), { fill: alpha(C.pink, 0.75 * share), stroke: null });
      }
    }
    // The system a moment on, then the fixed box over it.
    poly(S, band(c.later.xa, c.later.xz), { fill: alpha(C.gold, 0.22), stroke: C.gold, width: 1.5 });
    const hb = 0.13;
    poly(S, [[c.x1, -hb], [c.x2, -hb], [c.x2, hb], [c.x1, hb]], { fill: null, stroke: C.text, width: 1.5, dash: [6, 4] });
    line(S, xs(0, F.L).map((x) => [x, half(x)]), { color: C.muted, width: 2.5 });
    line(S, xs(0, F.L).map((x) => [x, -half(x)]), { color: C.muted, width: 2.5 });
    label(S, 'box, fixed', [c.x1, hb], { color: C.text, align: 'left', dy: -8 });
    label(S, `system ${fig(c.dtShown)} s later`, [c.later.xz, -hb], { color: C.gold, align: 'right', dy: 10 });
    const aLen = (u) => 14 + 10 * Math.min(u, 4);
    arrow(S, [c.x1, 0], 0, aLen(c.uIn), { color: C.teal, tail: true });
    arrow(S, [c.x2, 0], 0, aLen(c.uOut), { color: C.teal, tail: true });
    seg(S, [0, -0.15], [F.L, -0.15], { color: alpha(C.text, 0.2), width: 1 });

    // The three rates as bars: box term + net outflow = system.
    const unit = PROPERTIES[state.prop].rateUnit;
    const vals = [c.boxRate, c.outflow, c.sysRate];
    const m = Math.max(...vals.map(Math.abs), 0.05 * c.scale);
    const P = plotIn(B, bottom, { lo: 0, hi: 3 }, { lo: -1.15 * m, hi: 1.15 * m });
    axes(P, { yLabel: unit, xFmt: () => '' });
    const names = ['box term', 'net outflow', 'system'];
    const colours = [C.text, C.teal, C.gold];
    vals.forEach((v, i) => {
      const x0 = i + 0.22;
      const x1 = i + 0.78;
      poly(P, [[x0, 0], [x1, 0], [x1, v], [x0, v]], { fill: alpha(colours[i], 0.55), stroke: colours[i], width: 1.5 });
      label(P, names[i], [i + 0.5, -1.15 * m], { color: colours[i], dy: 14 });
      label(P, fig(v), [i + 0.5, v], { color: C.text, dy: v >= 0 ? -10 : 10 });
    });
    seg(P, [0, 0], [3, 0], { color: C.axis, width: 1 });
  },
  law: () => [String.raw`\frac{dB_\text{sys}}{dt} = \frac{d}{dt}\int_\text{box}\rho b\,dV + \big[\rho\,b\,u\,A\big]_\text{in}^\text{out}`, String.raw`b = 1,\quad b = u,\quad \rho b = c_\text{dye}`],
  liveRows(state, c) {
    const P = PROPERTIES[state.prop];
    return [
      kv('flow Q', `${fig(c.Q * 1000)} L/s`),
      kv('speed in, out', `${fig(c.uIn)}, ${fig(c.uOut)} m/s`),
      kv(`${P.name.toLowerCase()} in the box`, `${fig(c.inBox)} ${P.unit}`),
      kv('box term', `${fig(c.boxRate)} ${P.rateUnit}`),
      kv('net outflow', `${fig(c.outflow)} ${P.rateUnit}`),
      kv('system, following it', `${fig(c.follow)} ${P.rateUnit}`),
      kv('two methods differ by', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    const u = PROPERTIES[state.prop].rateUnit;
    return cells([
      ['box term', `${fig(c.boxRate)} ${u}`],
      ['net outflow', `${fig(c.outflow)} ${u}`],
      ['system', `${fig(c.sysRate)} ${u}`],
      ['flow', `${fig(c.Q * 1000)} L/s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The flow is one-dimensional, one speed across each section, with no friction at the walls. Real dye also spreads by diffusion, so its system changes slowly too.`;
    let title;
    let body;
    if (state.prop === 'dye') {
      title = 'The box changes; the system does not';
      body = String.raw`The dye in the box is changing at ${fig(c.boxRate)} g/s as the blob ${c.boxRate >= 0 ? 'arrives' : 'leaves'}. But the dye rides with the water, so the water that was in the box keeps all its dye. The net outflow, ${fig(c.outflow)} g/s, cancels the box term exactly.`;
    } else if (state.prop === 'mass') {
      title = 'Mass: nothing builds up, nothing is lost';
      body = String.raw`Water is incompressible and the box is rigid, so the box holds the same mass and what enters each second leaves. Both terms are zero, and so is the system’s rate: mass is conserved.`;
    } else if (c.steady) {
      title = 'Steady, and still a net force';
      body = String.raw`Nothing in the box changes: the box term is zero. But the water leaves at ${fig(c.uOut)} m/s and came in at ${fig(c.uIn)} m/s, so momentum flows out faster than it flows in. The system speeds up, and the net force on it is the outflow term, ${fig(c.sysRate)} N.`;
    } else if (c.noFlux) {
      title = 'No net outflow, still a net force';
      body = String.raw`The duct is straight, so the water leaves as fast as it entered and the momentum fluxes cancel. But the flow is growing, so every bit of water in the box is speeding up: the box term ρQ′w = ${fig(c.boxRate)} N is the whole force.`;
    } else {
      title = 'Both terms at once';
      body = String.raw`The growing flow adds ${fig(c.boxRate)} N inside the box, and the narrowing duct sends out ${fig(c.outflow)} N more momentum than comes in. The net force on the water is the sum, ${fig(c.sysRate)} N.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
