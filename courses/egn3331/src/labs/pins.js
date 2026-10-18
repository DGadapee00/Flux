import { bearing, pinSegments, pinShear } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, label, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * A bar pinned to a support. Double shear: the bar sits between the two legs of a clevis, so the pin
 * is cut on two planes. Single shear: the bar laps one lug, and the pin is cut once.
 */
const SCENARIOS = [
  { id: 'single', name: 'Single shear, lap joint', P: 10e3, d: 12e-3, t: 12e-3, tc: 12e-3, planes: 1, tauAllow: 100e6, bearAllow: 200e6 },
  { id: 'double', name: 'Double shear, clevis', P: 10e3, d: 12e-3, t: 12e-3, tc: 8e-3, planes: 2, tauAllow: 100e6, bearAllow: 200e6 },
  { id: 'thin', name: 'Clevis on a thin bar', P: 10e3, d: 12e-3, t: 5e-3, tc: 8e-3, planes: 2, tauAllow: 100e6, bearAllow: 200e6 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { ...sc, scenarioId: sc.id });
}

/** The three ways the joint can fail, each as stress and stress over its allowable. */
export function modes(state) {
  const { P, d, t, tc, planes, tauAllow, bearAllow } = state;
  const tau = pinShear(P, d, planes);
  const bBar = bearing(P, d, t);
  // Each clevis leg carries P/2; the single lug carries all of P.
  const bLeg = bearing(P / planes, d, tc);
  return [
    { id: 'shear', name: 'pin shear', stress: tau, allow: tauAllow },
    { id: 'bar', name: 'bar bearing', stress: bBar, allow: bearAllow },
    { id: 'leg', name: planes === 2 ? 'leg bearing' : 'lug bearing', stress: bLeg, allow: bearAllow },
  ].map((m) => ({ ...m, use: m.stress / m.allow }));
}

export default defineLab({
  id: 'pins',
  exam: 'u1',
  title: 'Pins',
  hint: 'A pin fails by shearing across, or by crushing the hole it bears on. The smaller allowable load governs.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('single', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 't', lo: 3e-3, hi: 30e-3 }),
  controls() {
    return `
      <label class="field" id="pn-planes-field"><span>Shear planes</span><select id="pn-planes"><option value="1">single shear (lap)</option><option value="2">double shear (clevis)</option></select></label>
      ${slider('pn-P', 'load P (kN)', 18, 2, 60, 0.5)}
      ${slider('pn-d', 'pin diameter d (mm)', 12, 4, 30, 0.5)}
      ${slider('pn-t', 'bar thickness t (mm)', 12, 3, 30, 0.5)}
      ${slider('pn-tc', 'leg or lug thickness (mm)', 12, 3, 30, 0.5)}
      <p class="tiny">Allowable stresses: τ for the pin, bearing for the plates. Bearing stress is P over the projected area d·t.</p>`;
  },
  bind(api) {
    document.getElementById('pn-planes')?.addEventListener('change', (e) => {
      api.slice().planes = Number(e.target.value);
      api.bump();
    });
    bindSlider('pn-P', (s, v) => { s.P = v * 1e3; }, api);
    bindSlider('pn-d', (s, v) => { s.d = v * 1e-3; }, api);
    bindSlider('pn-t', (s, v) => { s.t = v * 1e-3; }, api);
    bindSlider('pn-tc', (s, v) => { s.tc = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pn-planes', state.planes);
    set('pn-P', Number((state.P / 1e3).toFixed(1)));
    set('pn-d', Number((state.d * 1e3).toFixed(1)));
    set('pn-t', Number((state.t * 1e3).toFixed(1)));
    set('pn-tc', Number((state.tc * 1e3).toFixed(1)));
  },
  compute(state) {
    const list = modes(state);
    const seg = pinSegments(state.P, state.planes);
    const area = (Math.PI * state.d ** 2) / 4;
    // Second method: the shear on each plane from the pin's own segments, over the pin's area.
    const tauSeg = Math.max(...seg.shears) / area;
    const tau = list[0].stress;
    const governs = list.reduce((a, m) => (m.use > a.use ? m : a), list[0]);
    return {
      planes: state.planes,
      tau,
      tauSeg,
      planeShears: seg.shears,
      bearBar: list[1].stress,
      bearLeg: list[2].stress,
      modes: list,
      governs: governs.id,
      bearingGoverns: governs.id !== 'shear',
      FS: 1 / governs.use,
      Pallow: state.P / governs.use,
      gap: Math.max(Math.abs(tauSeg - tau) / tau, seg.residual / state.P),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.52);

    // A section through the pin's axis: the bar in the middle, the legs (or one lug) beside it.
    const d = state.d * 1e3;
    const t = state.t * 1e3;
    const tc = state.tc * 1e3;
    const two = state.planes === 2;
    const parts = two ? [['leg', tc], ['bar', t], ['leg', tc]] : [['bar', t], ['leg', tc]];
    const gap = 1.2;
    const width = parts.reduce((s, [, w]) => s + w, 0) + gap * (parts.length - 1);
    const H = Math.max(3 * d, 30);
    const S = sceneIn(B, top, { x0: -width / 2 - 14, x1: width / 2 + 14, y0: -H / 2 - 10, y1: H / 2 + 14 });
    let x = -width / 2;
    const planesAt = [];
    parts.forEach(([kind, w], i) => {
      const bar = kind === 'bar';
      // The bar is pulled up, the support down, so each plate is drawn shifted toward its pull.
      const shift = bar ? 2 : -2;
      poly(S, [[x, -H / 2 + shift], [x + w, -H / 2 + shift], [x + w, H / 2 + shift], [x, H / 2 + shift]], {
        fill: alpha(bar ? C.gold : C.text, bar ? 0.16 : 0.08),
        stroke: alpha(C.text, 0.6),
      });
      if (w * S.k > 26) label(S, bar ? 'bar' : two ? 'leg' : 'lug', [x + w / 2, H / 2 + shift], { dy: -10, color: C.dim });
      x += w;
      if (i < parts.length - 1) {
        planesAt.push(x + gap / 2);
        x += gap;
      }
    });
    poly(S, [[-width / 2 - 6, -d / 2], [width / 2 + 6, -d / 2], [width / 2 + 6, d / 2], [-width / 2 - 6, d / 2]], { fill: alpha(C.teal, 0.25), stroke: C.teal });
    for (const px of planesAt) seg(S, [px, -d / 2 - 4], [px, d / 2 + 4], { color: C.yellow, width: 2, dash: [3, 3] });
    const barMid = two ? 0 : -width / 2 + t / 2;
    arrow(S, [barMid, H / 2 + 2], Math.PI / 2, 30, { color: C.pink });
    label(S, `P = ${fig(state.P / 1e3)} kN`, [barMid, H / 2 + 2], { dy: -36, color: C.pink });
    label(S, `${c.planes} shear plane${c.planes > 1 ? 's' : ''}, τ = ${fig(c.tau / 1e6)} MPa`, [0, -H / 2], { dy: 18, color: C.teal });

    // Each mode's stress over its allowable. The tallest bar governs.
    const P = plotIn(B, bottom, { lo: 0, hi: 3 }, { lo: 0, hi: Math.max(1.2, ...c.modes.map((m) => m.use)) * 1.12 }, { left: 52, right: 14, top: 20, bottom: 30 });
    axes(P, { yLabel: 'stress / allowable', xFmt: () => '' });
    const { ctx, X, Y } = P;
    c.modes.forEach((m, i) => {
      const x0 = X(i + 0.2);
      const x1 = X(i + 0.8);
      const y = Y(m.use);
      ctx.fillStyle = alpha(m.id === 'shear' ? C.teal : C.gold, m.id === c.governs ? 0.95 : 0.5);
      ctx.fillRect(x0, y, x1 - x0, Y(0) - y);
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillStyle = m.id === c.governs ? C.text : C.dim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(m.name, (x0 + x1) / 2, Y(0) + 5);
      ctx.textBaseline = 'bottom';
      ctx.fillText(fig(m.use), (x0 + x1) / 2, y - 3);
    });
    ctx.save();
    ctx.strokeStyle = C.yellow;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(1));
    ctx.lineTo(X(3), Y(1));
    ctx.stroke();
    ctx.restore();
  },
  law: () => [String.raw`\tau=\frac{P}{n\,\pi d^2/4}`, String.raw`\sigma_b=\frac{P}{d\,t}`],
  liveRows(state, c) {
    return [
      kv('$\\tau$ from each plane\'s $V$', c.planeShears.map((V) => `${fig(V / 1e3)} kN`).join(', ')),
      kv('$\\sigma_b$ on the bar', `${fig(c.bearBar / 1e6)} MPa`),
      kv(state.planes === 2 ? '$\\sigma_b$ on each leg' : '$\\sigma_b$ on the lug', `${fig(c.bearLeg / 1e6)} MPa`),
      kv('allowable load', `${fig(c.Pallow / 1e3)} kN`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['τ pin', `${fig(c.tau / 1e6)} MPa`],
      ['σ_b bar', `${fig(c.bearBar / 1e6)} MPa`],
      ['FS', fig(c.FS)],
      ['P allow', `${fig(c.Pallow / 1e3)} kN`],
    ]);
  },
  coach(state, c) {
    const g = c.modes.find((m) => m.id === c.governs);
    if (c.bearingGoverns) {
      return { title: 'Bearing governs', body: String.raw`The pin is strong enough, but the ${g.name} reaches its allowable first. A thicker plate, not a bigger pin, raises the load most cheaply.` };
    }
    return state.planes === 2
      ? { title: 'Two planes share the load', body: String.raw`Each plane carries $P/2$, so $\tau = ${fig(c.tau / 1e6)}$ MPa, half of what one plane would carry.` }
      : { title: 'One plane carries it all', body: String.raw`The pin is cut once, so $\tau = P/A = ${fig(c.tau / 1e6)}$ MPa. A clevis would halve it.` };
  },
});
