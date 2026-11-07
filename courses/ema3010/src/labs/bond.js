import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { bond, ionicDepth } from '@flux/subjects/matsci/bonding.js';

/**
 * Bond: two atoms on their energy curve. The well's depth E₀ is the energy to pull them apart; its
 * curvature at the bottom is the bond's spring constant. Drag the atoms apart or together and read
 * the force, the slope of the curve.
 *
 * Shows that stiffness follows curvature, not depth: k = nmE₀/r₀², so the shape of the well (n, m)
 * matters as much as its depth. Two model wells with the same bond length make the point: the
 * shallower one is twice as stiff. The closed forms are checked by a second route with none of
 * them in it (packages/subjects/src/matsci/bonding.js): bisection on the force for r₀, the force
 * integrated out to infinity for E₀, and a central difference of the force for k.
 */
const SHAPES = {
  ionic: { n: 1, m: 9, name: 'n = 1, m = 9: an ion pair' },
  lj: { n: 6, m: 12, name: 'n = 6, m = 12: van der Waals' },
  wide: { n: 1, m: 3, name: 'n = 1, m = 3: a wide model well' },
  narrow: { n: 2, m: 6, name: 'n = 2, m = 6: a narrow model well' },
};

/** The Na⁺Cl⁻ depth from Coulomb's law, (ke²/r₀)(1 − 1/9), to the slider's 0.001 eV. */
const NACL = Number(ionicDepth(2.36, 9).toFixed(3));

const SCENARIOS = [
  { id: 'nacl', name: 'An Na⁺Cl⁻ ion pair', shape: 'ionic', r0: 2.36, E0: NACL, x: 1.4 },
  { id: 'argon', name: 'Two argon atoms', shape: 'lj', r0: 3.82, E0: 0.0104, x: 1.15 },
  { id: 'deep', name: 'A deep, wide well', shape: 'wide', r0: 2.5, E0: 4, x: 1 },
  { id: 'shallow', name: 'A shallow, narrow well: stiffer', shape: 'narrow', r0: 2.5, E0: 2, x: 1 },
  { id: 'squeeze', name: 'Squeezed: the atoms push apart', shape: 'ionic', r0: 2.36, E0: NACL, x: 0.85 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, shape: sc.shape, r0: sc.r0, E0: sc.E0, x: sc.x });
}

const X_LO = 0.8;
const X_HI = 3;

const eV = (v) => `${fig(v)} eV`;

export default defineLab({
  id: 'bond',
  exam: 'u1',
  title: 'Bond',
  hint: 'Slide the atoms along their energy curve. Then compare the deep well with the shallow one: the shallow one is stiffer.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('nacl', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x', lo: X_LO, hi: X_HI }),
  controls() {
    return `
      <label class="field"><span>Shape of the well</span><select id="bd-shape">${Object.entries(SHAPES)
        .map(([id, s]) => `<option value="${id}">${s.name}</option>`)
        .join('')}</select></label>
      ${slider('bd-E0', 'Well depth E₀ (eV)', 4, 0.01, 10, 0.001)}
      ${slider('bd-r0', 'Bond length r₀ (Å)', 2.5, 1, 5, 0.01)}
      ${slider('bd-x', 'Separation r, as a multiple of r₀', 1, X_LO, X_HI, 0.01)}
      <p class="tiny">U(r) = −A/rⁿ + B/rᵐ, with A and B set so the well bottoms out at r₀ with depth E₀. 1 eV/Å² is 16.0 N/m.</p>`;
  },
  bind(api) {
    document.getElementById('bd-shape')?.addEventListener('change', (e) => {
      api.slice().shape = e.target.value;
      api.bump();
    });
    bindSlider('bd-E0', (s, v) => { s.E0 = v; }, api);
    bindSlider('bd-r0', (s, v) => { s.r0 = v; }, api);
    bindSlider('bd-x', (s, v) => { s.x = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('bd-shape');
    if (sel) sel.value = state.shape;
    for (const [id, v] of [['bd-E0', state.E0], ['bd-r0', state.r0], ['bd-x', state.x]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(v);
    }
  },
  compute(state) {
    const { n, m } = SHAPES[state.shape] || SHAPES.ionic;
    const b = bond({ E0: state.E0, r0: state.r0, n, m, r: state.x * state.r0 });
    const zone = Math.abs(state.x - 1) < 0.005 ? 'rest' : state.x < 1 ? 'push' : 'pull';
    return { n, m, A: b.A, B: b.B, r: b.r, Ur: b.Ur, Fr: b.Fr, k: b.k, kN: b.kN, E0: b.E0, r0: b.r0, numeric: b.numeric, gap: b.gap, zone, curve: b.U };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.68);
    const yHi = 1.1 * c.E0;
    const P = plotIn(B, top, { lo: X_LO * c.r0, hi: X_HI * c.r0 }, { lo: -1.25 * c.E0, hi: yHi });
    axes(P, { xLabel: 'r (Å)', yLabel: 'U (eV)' });
    seg(P, [X_LO * c.r0, 0], [X_HI * c.r0, 0], { color: alpha(C.text, 0.35), width: 1, dash: [4, 4] });
    // The curve, from where it comes down into the plot.
    const pts = [];
    const para = [];
    for (let i = 0; i <= 400; i++) {
      const r = c.r0 * (X_LO + ((X_HI - X_LO) * i) / 400);
      const U = c.curve(r);
      if (U <= yHi) pts.push([r, U]);
      const Up = -c.E0 + 0.5 * c.k * (r - c.r0) ** 2;
      if (Up <= 0.6 * c.E0) para.push([r, Up]);
    }
    line(P, para, { color: alpha(C.gold, 0.85), width: 1.5, dash: [5, 4] });
    line(P, pts, { color: C.teal, width: 2.5 });
    // The depth, marked at the bottom of the well.
    seg(P, [c.r0, 0], [c.r0, -c.E0], { color: C.yellow, width: 1.5, dash: [3, 3] });
    label(P, `E₀ = ${eV(c.E0)}`, [c.r0, -c.E0 / 2], { color: C.yellow, dx: 8, align: 'left' });
    label(P, 'dashed: a spring with the same curvature', [c.r0 * 1.5, 0.55 * c.E0], { color: C.gold, align: 'left' });
    dot(P, c.r, Math.min(c.Ur, yHi), { color: C.yellow, r: 6 });

    // The two atoms, to scale with the bond length, and the force on each.
    const S = sceneIn(B, bottom, { x0: -0.2 * c.r0, x1: (X_HI + 0.2) * c.r0, y0: -0.5 * c.r0, y1: 0.5 * c.r0 }, 14);
    const rad = Math.max(6, Math.min(26, 0.3 * c.r0 * S.k));
    dot(S, 0, 0, { color: C.blue, r: rad });
    dot(S, c.r, 0, { color: C.red, r: rad });
    seg(S, [0, 0], [c.r, 0], { color: alpha(C.text, 0.3), width: 1, dash: [3, 3] });
    const Fmax = Math.max(1e-12, Math.abs(c.curve(c.r0 * 0.9) - c.curve(c.r0 * 0.88)) / (0.02 * c.r0));
    let len = Math.abs(c.Fr) < 1e-9 * Fmax ? 0 : 14 + 46 * Math.min(1, Math.sqrt(Math.abs(c.Fr) / Fmax));
    // Pulled together, each arrow points at the other atom: keep the two from crossing.
    if (c.Fr < 0) len = Math.min(len, Math.max(0, 0.45 * c.r * S.k - 2));
    if (len > 0) {
      const apart = c.Fr > 0;
      arrow(S, [c.r, 0], apart ? 0 : Math.PI, len, { color: C.pink, tail: false });
      arrow(S, [0, 0], apart ? Math.PI : 0, len, { color: C.pink, tail: false });
    }
    label(S, `r = ${fig(c.r)} Å · ${c.zone === 'rest' ? 'at rest: no force' : c.zone === 'push' ? 'pushed apart' : 'pulled together'}`, [c.r / 2, 0.42 * c.r0], { color: C.muted });
  },
  law: () => [String.raw`U(r) = -\frac{A}{r^n} + \frac{B}{r^m},\qquad F = -\frac{dU}{dr}`, String.raw`k = U''(r_0) = \frac{n\,m\,E_0}{r_0^2}`],
  liveRows(state, c) {
    return [
      kv('U at r', eV(c.Ur)),
      kv('Force on each atom', `${fig(Math.abs(c.Fr))} eV/Å, ${c.zone === 'rest' ? 'none' : c.zone === 'push' ? 'apart' : 'together'}`),
      kv('Stiffness k = nmE₀/r₀²', `${fig(c.k)} eV/Å² = ${fig(c.kN)} N/m`),
      kv('Second route: r₀ by bisection', `${fig(c.numeric.r0)} Å`),
      kv('Second route: E₀ = ∫ F dr out to ∞', eV(c.numeric.depth)),
      kv('Second route: k by finite difference', `${fig(c.numeric.k)} eV/Å²`),
      kv('Largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['depth E₀', eV(c.E0)],
      ['bond length', `${fig(c.r0)} Å`],
      ['stiffness k', `${fig(c.kN)} N/m`],
      ['force at r', `${fig(Math.abs(c.Fr))} eV/Å`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One pair of atoms. In a crystal each atom has many neighbours, and an ion feels every other ion's charge, so the lattice energy and the solid's stiffness come from a sum over all of them. The power-law repulsion is a fit, not a law.`;
    let title = 'The bottom of the well is the bond';
    let body = `At r₀ the attraction and the repulsion balance, so the force is zero and the atoms rest there. Pulling them apart costs E₀ = ${eV(c.E0)}. Near the bottom the curve is a parabola: the bond is a spring with k = ${fig(c.kN)} N/m.`;
    if (state.scenarioId === 'shallow' || state.scenarioId === 'deep') {
      title = 'Stiffness follows the curvature, not the depth';
      body = `Both wells bottom out at 2.5 Å. The deep one is 4 eV but wide, n = 1 and m = 3, so k = 1·3·4/2.5² = 1.92 eV/Å². The shallow one is 2 eV but narrow, n = 2 and m = 6, so k = 2·6·2/2.5² = 3.84 eV/Å². Half the depth, twice the stiffness. Depth sets how hot the solid melts; curvature sets how much it stretches.`;
    } else if (c.zone === 'push') {
      title = 'Squeezed together, the atoms push apart';
      body = `Inside r₀ the repulsion, which grows as 1/rᵐ, wins. The curve climbs steeply, so a small squeeze takes a large force: ${fig(Math.abs(c.Fr))} eV/Å here. That steep wall is why solids barely compress.`;
    } else if (c.zone === 'pull') {
      title = 'Pulled apart, the atoms pull back';
      body = `Outside r₀ the curve slopes up toward zero, so the force is attractive: ${fig(Math.abs(c.Fr))} eV/Å here. Keep pulling and the force peaks, then fades: past the steepest point of the curve the bond lets go. ${state.shape === 'lj' ? 'The argon well is about 0.01 eV deep, below the thermal energy at room temperature, which is why argon is a gas.' : ''}`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
