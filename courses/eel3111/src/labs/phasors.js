import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, plotIn, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CIRCUITS, analyse, mag, phaseDeg } from '@flux/subjects/em/phasors.js';

/**
 * Phasors: a sine source driving R, L and C in series, with the voltages drawn as rotating phasors,
 * head to tail, and as the waveforms they project.
 *
 * Shows that Kirchhoff's voltage law holds for phasors, not for amplitudes: 3 V across the resistor
 * and 4 V across the capacitor make 5 V, not 7 V, and at resonance the inductor and capacitor each
 * carry six times the source voltage while cancelling. The phasors come from complex impedance; the
 * second method solves the circuit's differential equation for its periodic steady state
 * (packages/subjects/src/em/phasors.js).
 */
const V_SRC = 5;
const SCENARIOS = [
  { id: 'rc345', name: 'Series RC: 3 V and 4 V make 5 V', circuit: 'rc', f: 1000, R: 1000, Lm: 10, Cu: 1e6 / (2 * Math.PI * 1000 * (4000 / 3)) },
  { id: 'rl', name: 'Series RL at 1 kHz', circuit: 'rl', f: 1000, R: 100, Lm: 10, Cu: 1 },
  { id: 'resonance', name: 'Series RLC at resonance', circuit: 'rlc', f: 1000, R: 10, Lm: 10, Cu: 2.533 },
  { id: 'below', name: 'The same RLC at 500 Hz', circuit: 'rlc', f: 500, R: 10, Lm: 10, Cu: 2.533 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, circuit: sc.circuit, lf: Math.log10(sc.f), lR: Math.log10(sc.R), lL: Math.log10(sc.Lm), lC: Math.log10(sc.Cu), tf: 0.1 });
}

const params = (s) => ({ circuit: s.circuit, V: V_SRC, f: 10 ** s.lf, R: 10 ** s.lR, L: (10 ** s.lL) / 1000, C: (10 ** s.lC) / 1e6 });
const polar = (z) => `${fig(mag(z))} V ∠ ${fig(phaseDeg(z))}°`;

export default defineLab({
  id: 'phasors',
  exam: 'u2',
  title: 'Phasors',
  hint: 'Read the amplitudes across R and C: 3 V and 4 V, yet the source is 5 V. Turn the RLC to resonance and the capacitor carries six times the source.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rc345', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lf', lo: 1, hi: 5 }),
  controls() {
    return `
      <label class="field"><span>Circuit</span><select id="ph-c">${Object.entries(CIRCUITS).map(([id, c]) => `<option value="${id}">${c.name}</option>`).join('')}</select></label>
      ${slider('ph-f', 'Frequency, log₁₀ f (Hz)', 3, 1, 5, 0.01)}
      ${slider('ph-r', 'Resistance, log₁₀ R (Ω)', 3, 1, 3.7, 0.01)}
      ${slider('ph-l', 'Inductance, log₁₀ L (mH)', 1, 0, 2, 0.01)}
      ${slider('ph-cap', 'Capacitance, log₁₀ C (µF)', 0, -1, 2, 0.01)}
      ${slider('ph-t', 'Time, as a share of one period', 0.1, 0, 1, 0.01)}
      <p class="tiny">Source 5 cos ωt volts. f from 10 Hz to 100 kHz, R from 10 Ω to 5 kΩ, L from 1 to 100 mH, C from 0.1 to 100 µF. The phasors turn at ω; their shadows on the horizontal axis are the voltages at that instant.</p>`;
  },
  bind(api) {
    document.getElementById('ph-c')?.addEventListener('change', (e) => {
      api.slice().circuit = e.target.value;
      api.bump();
    });
    for (const [id, key] of [['ph-f', 'lf'], ['ph-r', 'lR'], ['ph-l', 'lL'], ['ph-cap', 'lC'], ['ph-t', 'tf']]) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const c = document.getElementById('ph-c');
    if (c) c.value = state.circuit;
    for (const [id, key] of [['ph-f', 'lf'], ['ph-r', 'lR'], ['ph-l', 'lL'], ['ph-cap', 'lC'], ['ph-t', 'tf']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const p = params(state);
    const r = analyse(p);
    const VRm = mag(r.VR);
    const VLm = mag(r.VL);
    const VCm = mag(r.VC);
    return { ...r, p, VRm, VLm, VCm, Im: mag(r.I), magSum: VRm + VLm + VCm, exceeds: Math.max(VLm, VCm) > V_SRC };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const [left, right] = H > 420 && W < 1.5 * H ? split(B.free, 0.55) : [{ ...B.free, x1: B.free.x0 + W * 0.45 }, { ...B.free, x0: B.free.x0 + W * 0.45 }];
    const th = 2 * Math.PI * state.tf;
    const rot = (z) => [z[0] * Math.cos(th) - z[1] * Math.sin(th), z[0] * Math.sin(th) + z[1] * Math.cos(th)];
    // V_L first, then V_R, then V_C: at resonance the chain is a U, not one line traced twice.
    const parts = [['V_L', c.VL, C.pink], ['V_R', c.VR, C.gold], ['V_C', c.VC, C.teal]].filter(([, z]) => mag(z) > 1e-9);
    // Head-to-tail chain and its reach, for the scale.
    let tip = [0, 0];
    const chain = parts.map(([n, z, col]) => {
      const a = tip;
      tip = [tip[0] + rot(z)[0], tip[1] + rot(z)[1]];
      return [n, a, tip, col];
    });
    const reach = Math.max(V_SRC, ...chain.flatMap(([, a, b]) => [Math.hypot(...a), Math.hypot(...b)]));
    const M = 1.15 * reach;
    const S = sceneIn(B, left, { x0: -M, x1: M, y0: -M, y1: M }, 16);
    seg(S, [-M, 0], [M, 0], { color: alpha(C.text, 0.3), width: 1 });
    seg(S, [0, -M], [0, M], { color: alpha(C.text, 0.15), width: 1 });
    const pix = (v) => v * S.k;
    chain.forEach(([n, a, b, col], i) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (pix(len) > 6) arrow(S, b, ang, pix(len), { color: col, width: 2.5, tail: true });
      // Labels sit beside their arrows, on alternating sides, so a V_L and V_C that overlap stay readable.
      const side = i % 2 ? -1 : 1;
      label(S, n, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { color: col, dx: -side * 14 * Math.sin(ang), dy: -side * 14 * Math.cos(ang) });
    });
    const vs = rot([V_SRC, 0]);
    arrow(S, vs, th, pix(V_SRC), { color: C.text, width: 1.5, tail: true });
    seg(S, vs, [vs[0], 0], { color: alpha(C.text, 0.5), width: 1, dash: [3, 3] });
    dot(S, vs[0], 0, { color: C.text, r: 3 });
    label(S, 'source', vs, { color: C.text, dx: 8, dy: 10, align: 'left' });

    // The waveforms over one period, with the instant marked.
    const T = 1;
    const wave = (z) => Array.from({ length: 121 }, (_, i) => {
      const t = i / 120;
      return [t, z[0] * Math.cos(2 * Math.PI * t) - z[1] * Math.sin(2 * Math.PI * t)];
    });
    const top = 1.1 * Math.max(V_SRC, c.VRm, c.VLm, c.VCm);
    const P = plotIn(B, right, { lo: 0, hi: T }, { lo: -top, hi: top });
    axes(P, { xLabel: 't / period', yLabel: 'volts' });
    line(P, wave([V_SRC, 0]), { color: C.text, width: 2 });
    for (const [, z, col] of parts) line(P, wave(z), { color: col, width: 1.8 });
    seg(P, [state.tf, -top], [state.tf, top], { color: alpha(C.text, 0.45), width: 1, dash: [3, 3] });
  },
  law: () => [String.raw`Z_R = R,\quad Z_L = j\omega L,\quad Z_C = \frac{1}{j\omega C}`, String.raw`\mathbf I = \frac{\mathbf V}{Z_R + Z_L + Z_C}, \qquad \mathbf V_R + \mathbf V_L + \mathbf V_C = \mathbf V`],
  liveRows(state, c) {
    return [
      kv('f, ω', `${fig(c.p.f)} Hz, ${fig(c.w)} rad/s`),
      kv('Impedance Z', `${fig(mag(c.Z))} Ω ∠ ${fig(phaseDeg(c.Z))}°`),
      kv('Current I', `${fig(c.Im * 1000)} mA ∠ ${fig(phaseDeg(c.I))}°`),
      kv('V_R', polar(c.VR)),
      ...(c.spec.L ? [kv('V_L', polar(c.VL))] : []),
      ...(c.spec.C ? [kv('V_C', polar(c.VC))] : []),
      kv('Amplitudes added up', `${fig(c.magSum)} V, against the source’s 5 V`),
      ...(c.f0 ? [kv('Resonance f₀ = 1/(2π√LC)', `${fig(c.f0)} Hz`)] : []),
      kv('Phasors against the ODE’s steady state', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['|V_R|', `${fig(c.VRm)} V`],
      [c.spec.L ? '|V_L|' : '|I|', c.spec.L ? `${fig(c.VLm)} V` : `${fig(c.Im * 1000)} mA`],
      [c.spec.C ? '|V_C|' : 'phase of I', c.spec.C ? `${fig(c.VCm)} V` : `${fig(phaseDeg(c.I))}°`],
      ['f', `${fig(c.p.f)} Hz`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Ideal parts and the steady state only: real inductors have resistance, real capacitors leak, and when the source is switched on there is a transient before these sines take over.`;
    if (c.f0 && Math.abs(c.p.f / c.f0 - 1) < 0.02) {
      return { title: 'Resonance', body: `At ${fig(c.p.f)} Hz, ωL = 1/(ωC), so V_L and V_C are equal and opposite and cancel. The whole source drives the resistor, the current peaks at ${fig(c.Im * 1000)} mA, and the inductor and capacitor each carry ${fig(c.VCm)} V, ${fig(c.VCm / V_SRC)} times the source. ${leavesOut}` };
    }
    return {
      title: 'Phasors add, amplitudes do not',
      body: `The amplitudes add to ${fig(c.magSum)} V, but the source is 5 V: each voltage peaks at a different moment, so only the phasors, head to tail, sum to the source. The current leads the source by ${fig(phaseDeg(c.I))}°${phaseDeg(c.I) < 0 ? ' (it lags)' : ''}. ${leavesOut}`,
    };
  },
  app: false,
});
