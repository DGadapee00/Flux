/**
 * Shows how to read motion from a potential-energy curve: the body can be only where E ≥ U, it turns
 * round where E = U, the force F = −dU/dx points down the slope, and it can rest where the slope is
 * zero. A minimum is stable; a maximum is not.
 *
 * Three curves: the double well U = 2(x⁴ − x²) J, from OpenStax §8.4, a spring, U = ½kx², and the quartic
 * U = ¼cx⁴ of §8.2's "Force due to a Quartic Potential Energy". The total
 * energy E is a horizontal line. The turning points, the force and the period come from the curve:
 * T = 2∫dx/v with v = √(2(E − U)/m). The check releases the body from rest at a turning point and
 * steps F = ma in time (velocity Verlet), reading off how far it goes and how long a round trip takes.
 */
import * as THREE from 'three';
import { equilibria, forceFrom, period, simulate, turningPoints, wellAround } from '@flux/subjects/mechanics/potential.js';
import { Arrow, M, createGraph, dot, fatLine, graphSegment, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const CURVES = {
  well: { name: 'Double well, 2(x⁴ − x²)', span: 1.2, lo: -0.6, hi: 1.2, U: () => (x) => 2 * (x ** 4 - x * x), F: () => (x) => -2 * (4 * x ** 3 - 2 * x) },
  spring: { name: 'Spring, ½kx²', span: 2, lo: -0.4, hi: 4.4, U: (s) => (x) => 0.5 * s.k * x * x, F: (s) => (x) => -s.k * x },
  quartic: { name: 'Quartic, ¼cx⁴ (c = k)', span: 1.6, lo: -0.4, hi: 4.4, U: (s) => (x) => 0.25 * s.k * x ** 4, F: (s) => (x) => -s.k * x ** 3 },
};

const SCENARIOS = [
  { id: 'well', name: 'In the right-hand well, E = −0.25 J', curve: 'well', E: -0.25, x0: 0.5, m: 1, k: 2 },
  { id: 'over', name: 'Above the barrier, E = +0.25 J', curve: 'well', E: 0.25, x0: 0.5, m: 1, k: 2 },
  { id: 'spring', name: 'A spring of 2 N/m, E = 1 J', curve: 'spring', E: 1, x0: 0, m: 1, k: 2 },
  { id: 'quartic', name: 'The book’s quartic, c = 8 N/m³, E = 2 J', curve: 'quartic', E: 2, x0: 0, m: 1, k: 8 },
];

/** The search range for turning points: wider than the drawn one, so none is missed. */
const REACH = 4;

function read(s) {
  const c = CURVES[s.curve];
  const U = c.U(s);
  const x0 = Math.max(-c.span, Math.min(c.span, s.x0));
  const U0 = U(x0);
  const K = s.E - U0;
  const well = wellAround(U, s.E, x0, -REACH, REACH);
  return { c, U, x0, U0, K, well };
}

export default defineLab({
  id: 'energy-diagram',
  exam: 'u4',
  title: 'Energy diagram',
  hint: 'Set the total energy and where the body is. Read the motion off the curve.',
  orbit: false,
  fit: { w: 13.2, h: 9.4 },
  camera: { pos: new THREE.Vector3(0, -0.3, 24), target: new THREE.Vector3(0, -0.3, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'ed-barrier',
      scenario: 'well',
      ask: String.raw`Raise the total energy from $-0.25$ to $+0.25\ \mathrm{J}$. The hump at $x = 0$ is $U = 0$. Can the body now reach the left-hand well?`,
      apply(s) { s.E = 0.25; },
      watch: [{ id: 'left', label: 'it reaches the left-hand well', get: (c) => c.a !== null && c.a < 0, mode: 'bool' }],
      expect: { left: true },
      why: String.raw`The body can be wherever $E \ge U$. With $E$ above the top of the hump, that is true right across it, so the body runs from one outer wall to the other. It slows over the hump and speeds up in each well.`,
    },
    {
      id: 'ed-push',
      scenario: 'well',
      ask: String.raw`The body is at $x = 0.5\ \mathrm{m}$, where the force pushes it toward $+x$. Look at it again at $x = 0.9\ \mathrm{m}$, past the bottom of the well. Does the force still point toward $+x$?`,
      apply(s) { s.x0 = 0.9; },
      watch: [{ id: 'plus', label: 'the force points toward +x', get: (c) => c.F > 0, mode: 'bool' }],
      expect: { plus: false },
      why: String.raw`$F = -dU/dx$: the force points downhill on the curve. At $0.5$ the curve falls to the right, so $F$ is toward $+x$. Past the bottom, at $x = 1/\sqrt2 = 0.707$, the curve rises, so $F$ points back toward $-x$. That restoring force is what makes the bottom stable.`,
    },
    {
      id: 'ed-spring',
      scenario: 'spring',
      ask: String.raw`Double the spring's energy, from $1$ to $2\ \mathrm{J}$. What happens to the time for one round trip, and to how far it swings?`,
      apply(s) { s.E *= 2; },
      watch: [
        { id: 'T', label: 'the period', get: (c) => c.T, mode: 'factor' },
        { id: 'b', label: 'how far it swings', get: (c) => c.b, mode: 'dir' },
      ],
      expect: { T: 1, b: 'bigger' },
      why: String.raw`The swing grows as $\sqrt E$, by $\sqrt2$. But a stretched spring pulls harder in proportion, so the body covers the longer swing faster. The period stays $2\pi\sqrt{m/k}$. Only this parabola does that; the double well's period changes with $E$.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('well', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    const curves = Object.entries(CURVES).map(([id, c]) => [id, c.name]);
    return `<div class="lab-block">${selectRow('ed-curve', 'Potential energy', curves, 'well')}${sliderRow('ed-E', 'Total energy E (J)', -0.25, -0.5, 3.5, 0.01)}${sliderRow('ed-x0', 'Where the body is, x (m)', 0.5, -2, 2, 0.01)}${sliderRow('ed-m', 'Mass (kg)', 1, 0.1, 5, 0.1)}${sliderRow('ed-k', 'Spring constant k (N/m), or c for the quartic (N/m³)', 2, 0.5, 10, 0.1)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'ed-curve', (s, v) => { s.curve = v; });
    bindSlider(api, 'ed-E', (s, x) => { s.E = x; });
    bindSlider(api, 'ed-x0', (s, x) => { s.x0 = x; });
    bindSlider(api, 'ed-m', (s, x) => { s.m = x; });
    bindSlider(api, 'ed-k', (s, x) => { s.k = x; });
  },
  syncControls(state) {
    putSelect('ed-curve', state.curve);
    putSlider('ed-E', state.E, 2);
    putSlider('ed-x0', state.x0, 2);
    putSlider('ed-m', state.m, 1);
    putSlider('ed-k', state.k, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.8, y: -3.6, w: 11.6, h: 7, color: QUANTITY_COLORS.x, name: '', xName: 'position <i>x</i> (m)' });
    const title = label('<i>U</i> (J)', 4.6, 3.75, 0, 'graph-title');
    const energy = fatLine([0, 0, 0, 1, 0, 0], { color: M.yellow, width: 2.5 });
    const energyName = label('<i>E</i>', 0, 0, 0, 'graph-title');
    const kinetic = fatLine([0, 0, 0, 0, 1, 0], { color: M.white, width: 4 });
    const kName = label('<i>K</i>', 0, 0, 0, 'graph-axis');
    const turns = [dot(M.yellow, 0.1), dot(M.yellow, 0.1)];
    const rests = Array.from({ length: 4 }, () => dot(M.teal, 0.09));
    const push = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a, undefined, undefined, 0.016);
    const fName = label('<i>F</i>', 0, 0, 0, 'graph-title');
    const warn = label('E < U here: the body cannot be at this x', 0, 2.6, 0, 'graph-axis');
    group.add(title, energy, energyName, kinetic, kName, ...turns, ...rests, push, fName, warn);
    group.visible = false;
    return { group, graph, energy, energyName, kinetic, kName, turns, rests, push, fName, warn };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const r = read(state);
    computed.U0 = r.U0;
    computed.K = r.K;
    computed.allowed = r.K >= -1e-12;
    computed.v = computed.allowed ? Math.sqrt((2 * Math.max(0, r.K)) / state.m) : null;
    computed.F = forceFrom(r.U, r.x0);
    const bounded = r.well && Number.isFinite(r.well.a) && Number.isFinite(r.well.b);
    computed.a = bounded ? r.well.a : null;
    computed.b = bounded ? r.well.b : null;
    computed.T = bounded ? period(r.U, state.E, state.m, r.well.a, r.well.b, 20000) : null;
    computed.Fb = bounded ? forceFrom(r.U, r.well.b) : null;
    computed.rests = equilibria(r.U, -r.c.span, r.c.span);
  },
  second(state) {
    // Release from rest at the right turning point and step F = ma. The force is the curve's own
    // derivative, written out, not the numerical slope used above.
    const r = read(state);
    const out = { F: r.c.F(state)(r.x0), K: state.E - r.U(r.x0) };
    if (!r.well || !Number.isFinite(r.well.a) || !Number.isFinite(r.well.b)) return { ...out, a: null, b: null, T: null, Fb: null };
    const run = simulate(r.U, state.m, r.well.b, { dt: 1e-4, tMax: 200 });
    return { ...out, a: run.lo, b: run.hi, T: run.period, Fb: r.c.F(state)(run.hi) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const r = read(state);
    const { span, lo, hi } = r.c;
    const g = h.graph;
    g.set({ t0: -span, t1: span, lo, hi, f: (x) => Math.min(hi, r.U(x)) });
    const Ey = Math.min(hi, Math.max(lo, state.E));
    graphSegment(h.energy, g, { t0: -span, v0: Ey, t1: span, v1: Ey, lo, hi });
    h.energyName.position.set(g.sx(span) - 0.3, g.sy(Ey) + 0.3, 0);
    // The kinetic energy is the gap between the line and the curve, drawn at the body.
    g.mark(r.x0, r.U0);
    h.kinetic.visible = computed.allowed && r.K > 1e-9;
    if (h.kinetic.visible) updateFatLine(h.kinetic, [g.sx(r.x0), g.sy(r.U0), 0.04, g.sx(r.x0), g.sy(Ey), 0.04]);
    h.kName.visible = h.kinetic.visible;
    h.kName.position.set(g.sx(r.x0) + 0.3, g.sy(0.5 * (r.U0 + Ey)), 0);
    h.warn.visible = !computed.allowed;
    [computed.a, computed.b].forEach((x, i) => {
      h.turns[i].visible = x !== null && Math.abs(x) <= span;
      if (h.turns[i].visible) h.turns[i].position.set(g.sx(x), g.sy(state.E), 0.06);
    });
    h.rests.forEach((d, i) => {
      const e = computed.rests[i];
      d.visible = !!e;
      if (!e) return;
      d.material.color.setHex(e.stable ? M.teal : M.red);
      d.position.set(g.sx(e.x), g.sy(e.U), 0.06);
    });
    // The force at the body, along x, drawn just above the energy line.
    const big = Math.max(...Array.from({ length: 41 }, (_, i) => Math.abs(r.c.F(state)(-span + (2 * span * i) / 40))), 1e-9);
    // At least half a unit long, so a small force still shows its direction.
    const len = Math.abs(computed.F) < 1e-9 ? 0 : Math.sign(computed.F) * (0.5 + (1.3 * Math.abs(computed.F)) / big);
    const y = g.sy(Ey) + 0.55;
    placeArrow(h.push, g.sx(r.x0), y, g.sx(r.x0) + len, y, 0.06);
    h.fName.visible = h.push.visible;
    h.fName.position.set(g.sx(r.x0) + len + Math.sign(len) * 0.3, y, 0);
  },
  law: () => [
    String.raw`E = K + U(x),\qquad F = -\dfrac{dU}{dx}`,
    String.raw`T = 2\int_a^b \dfrac{dx}{\sqrt{2(E - U)/m}}`,
  ],
  readoutCells(state, computed) {
    return [
      ['Speed here', computed.allowed ? `${fmt(computed.v)} m/s` : 'not allowed: E < U', computed.allowed ? '' : 'warn'],
      ['Force here', Math.abs(computed.F) < 1e-9 ? 'none: a rest point' : `${fmt(computed.F)} N, toward ${computed.F > 0 ? '+x' : '−x'}`],
      ['Kinetic energy, E − U', `${fmt(computed.K)} J`],
      ['Turning points', computed.a === null ? 'none' : `x = ${fmt(computed.a, 3)} m and ${fmt(computed.b, 3)} m`],
      ['Time for a round trip', computed.T === null ? '—' : `${fmt(computed.T)} s`],
      ['Rest points', computed.rests.map((e) => `${fmt(e.x, 3)} m, ${e.stable ? 'stable' : 'unstable'}`).join('; ') || 'none'],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Read the motion off the curve',
      body: [
        String.raw`The yellow line is the total energy. Where it is above the curve, the gap is the kinetic energy, so the body moves there. Where the line meets the curve, $K = 0$: the body stops and turns back. Here that is at $x = ${computed.a === null ? '—' : fmt(computed.a, 3)}$ and $${computed.b === null ? '—' : fmt(computed.b, 3)}$ m.`,
        String.raw`The force is $F = -dU/dx$, so it points downhill on the curve. At a bottom (teal) the force on either side points back: a stable rest point. At a top (red) it points away: unstable.`,
        String.raw`<b>What the model leaves out.</b> No friction, so $E$ never changes and the body swings for ever. The double well is a made-up curve; a molecule's bond, or a ball between two dips, has the same shape.`,
      ],
    };
  },
});
