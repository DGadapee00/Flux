import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { LAMBDA, NAMES, stack, xrdChecked } from '@flux/subjects/matsci/xrd.js';

/**
* X-ray: copper Kα X-rays on a cubic crystal, with a choice of structure and a slider for the
 * lattice parameter, the diffraction pattern drawn beside the intensity from one stack of planes.
 *
 * Shows that a crystal does not reflect X-rays at every angle: waves from successive planes add only
 * where 2d sin θ is a whole number of wavelengths, and planes that cut the basis out of step cancel.
 * Copper (FCC, 0.3615 nm) gives (111) at 43.3° and (200) at 50.4°, and no (100) or (110) at all.
 * Bragg's law and the selection rules are checked by summing the structure factor over the cell and
 * by maximising the intensity from a stack of 40 planes (packages/subjects/src/matsci/xrd.js).
 */
const SCENARIOS = [
  { id: 'copper', name: 'Copper, FCC, a = 0.3615 nm', struct: 'fcc', a: 0.3615 },
  { id: 'iron', name: 'Iron, BCC, a = 0.2866 nm', struct: 'bcc', a: 0.2866 },
  { id: 'aluminium', name: 'Aluminium, FCC, a = 0.4049 nm', struct: 'fcc', a: 0.4049 },
  { id: 'polonium', name: 'Polonium, simple cubic, a = 0.3359 nm', struct: 'sc', a: 0.3359 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, struct: sc.struct, a: sc.a });
}

const KEYS = [['xr-a', 'a']];

const deg = (x) => `${fig(x)}°`;

function pattern(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 20, hi: 140 }, { lo: 0, hi: 1.25 });
  axes(P, { xLabel: 'diffraction angle 2θ (degrees)', yLabel: 'relative intensity', yFmt: (v) => fig(v) });
  let last = -1e9;
  for (const p of c.peaks) {
    if (p.tt > 140) continue;
    seg(P, [p.tt, 0], [p.tt, p.rel], { color: C.gold, width: 3 });
    if (P.X(p.tt) - last > 40) {
      label(P, `(${p.hkl.split(',')[0]})`, [p.tt, p.rel], { color: C.text, dy: -10 });
      last = P.X(p.tt);
    }
  }
}

function planes(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 20, hi: 140 }, { lo: 0, hi: 1.15 });
  axes(P, { xLabel: 'angle 2θ (degrees)', yLabel: 'in step, share of the most', yFmt: (v) => fig(v) });
  const d = c.first.d;
  const pts = Array.from({ length: 1501 }, (_, i) => {
    const tt = 20 + (120 * i) / 1500;
    return [tt, stack(d, ((tt / 2) * Math.PI) / 180) / 1600];
  });
  line(P, pts, { color: C.blue, width: 1.5 });
  label(P, `planes (${c.first.hkl.split(',')[0]}), d = ${fig(d)} nm`, [140, 1.1], { color: C.blue, align: 'right' });
}

export default defineLab({
  id: 'xrd',
  exam: 'u1',
  title: 'X-ray',
  hint: 'Look for (100) in copper’s pattern: it is not there. Then switch to simple cubic at the same a and watch the missing peaks appear.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('copper', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'a', lo: 0.25, hi: 0.45 }),
  controls() {
    return `
      <label class="field"><span>Structure</span><select id="xr-st">${Object.entries(NAMES).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('xr-a', "Lattice parameter a (nm)", 0.3615, 0.25, 0.45, 0.0005)}
      <p class="tiny">Copper Kα X-rays, λ = 0.15406 nm, on a powder of one cubic metal. Peak heights count only the structure factor and how many planes share a spacing. Top: the pattern, 2θ across. Bottom: the intensity scattered by 40 planes of the first peak’s set, at every angle.</p>`;
  },
  bind(api) {
    document.getElementById('xr-st')?.addEventListener('change', (e) => {
      api.slice().struct = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('xr-st');
      if (el) el.value = String(state.struct);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return xrdChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      pattern(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    pattern(B, a, state, c);
    planes(B, b, state, c);
  },
  law: () => [String.raw`n\lambda = 2d\sin\theta, \qquad d_{hkl} = \frac{a}{\sqrt{h^2 + k^2 + l^2}}`, String.raw`F_{hkl} = \sum_j e^{2\pi i(hx_j + ky_j + lz_j)}`],
  liveRows(state, c) {
    return [
      kv('First peak', `(${c.first.hkl.split(',')[0]}), ${deg(c.first.tt)}`),
      kv('Its spacing d', `${fig(c.first.d)} nm`),
      kv('Peaks below 140°', String(c.peaks.filter((p) => p.tt < 140).length)),
      kv('A (100) peak?', c.present(1, 0, 0) ? 'yes' : 'no'),
      kv('Bragg against the plane stack', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['first peak', deg(c.first.tt)], ['planes', `(${c.first.hkl.split(',')[0]})`], ['d', `${fig(c.first.d)} nm`], ['(100)', c.present(1, 0, 0) ? 'present' : 'absent']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real peak heights also depend on how strongly each atom scatters at that angle, on the beam’s polarisation and on how the powder’s grains are oriented; peaks have width from small crystals and strain.`;
    if (state.struct === 'sc') return { title: 'Simple cubic: every plane reflects', body: `With one atom per cell, nothing cancels: (100), (110), (111) all appear, the first at ${deg(c.first.tt)}. Switch to BCC or FCC at the same a and watch peaks vanish. ${leavesOut}` };
    return { title: 'Only some planes reflect', body: `In ${state.struct.toUpperCase()} the extra atoms in the cell sit halfway between the (100) planes and scatter exactly out of step, so (100) is absent. The first peak is (${c.first.hkl}) at ${deg(c.first.tt)}, from planes ${fig(c.first.d)} nm apart. Between peaks the waves from successive planes cancel: a crystal is not a mirror. ${leavesOut}` };
  },
  app: false,
});
