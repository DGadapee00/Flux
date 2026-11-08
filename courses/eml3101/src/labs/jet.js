import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CORE, jetChecked, jetClosed } from '@flux/subjects/thermo/jet.js';

/**
* Bypass: one engine core adding 40 MW to the air at 250 m/s, with a slider for the bypass ratio,
 * thrust and propulsive efficiency drawn.
 *
 * Shows that a faster jet is not a better engine: with the same power, a turbojet's 929 m/s jet gives
 * 68 kN at 42% propulsive efficiency, while a bypass ratio of 10 gives 130 kN at 81%, from a 368 m/s
 * jet. More air at a lower speed leaves less energy in the wake. The momentum thrust is checked
 * against the energy route, F = η_p P/V₀ (packages/subjects/src/thermo/jet.js).
 */
const SCENARIOS = [
  { id: 'turbojet', name: 'A turbojet, bypass 0', B: 0 },
  { id: 'low', name: 'Low bypass, 1', B: 1 },
  { id: 'modern', name: 'A modern turbofan, bypass 10', B: 10 },
  { id: 'mid', name: 'Bypass 5', B: 5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, B: sc.B });
}

const KEYS = [['jt-b', 'B']];

const kN = (f) => `${fig(f / 1000)} kN`;

function thrust(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 12 }, { lo: 0, hi: 160 });
  axes(P, { xLabel: 'bypass ratio', yLabel: 'thrust (kN)' });
  line(P, Array.from({ length: 121 }, (_, i) => [i / 10, jetClosed({ B: i / 10 }).F / 1000]), { color: C.gold, width: 2.5 });
  seg(P, [0, (CORE.P / CORE.V0) / 1000], [12, (CORE.P / CORE.V0) / 1000], { color: alpha(C.muted, 0.7), width: 1, dash: [5, 4] });
  label(P, 'limit P/V₀, an infinite fan', [12, (CORE.P / CORE.V0) / 1000], { color: C.muted, align: 'right', dy: -10 });
  dot(P, state.B, c.F / 1000, { color: C.pink, r: 6, ring: C.text });
  label(P, kN(c.F), [state.B, c.F / 1000], { color: C.text, align: 'left', dx: 10, dy: 14 });
}

function eff(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 12 }, { lo: 0, hi: 1 });
  axes(P, { xLabel: 'bypass ratio', yLabel: 'propulsive efficiency', yFmt: (v) => `${Math.round(v * 100)}%` });
  line(P, Array.from({ length: 121 }, (_, i) => [i / 10, jetClosed({ B: i / 10 }).eta]), { color: C.green, width: 2.5 });
  dot(P, state.B, c.eta, { color: C.pink, r: 6, ring: C.text });
  label(P, `jet ${fig(c.Ve)} m/s`, [state.B, c.eta], { color: C.text, align: 'left', dx: 10, dy: 14 });
}

export default defineLab({
  id: 'jet',
  exam: 'u2',
  title: 'Bypass',
  hint: 'Raise the bypass ratio from 0 to 10 and read the thrust. The engine’s power has not changed.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('turbojet', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'B', lo: 0, hi: 12 }),
  controls() {
    return `
      ${slider('jt-b', "Bypass ratio", 0, 0, 12, 0.1)}
      <p class="tiny">Flight at 250 m/s; 100 kg/s through the core; the same 40 MW of jet power whatever the bypass ratio, shared by core and fan air, which leave at one speed. Left: thrust against bypass ratio. Right: propulsive efficiency, and the jet’s speed.</p>`;
  },
  bind(api) {

    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {

    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return jetChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      thrust(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    thrust(B, a, state, c);
    eff(B, b, state, c);
  },
  law: () => [String.raw`F = \dot m\,(V_e - V_0), \qquad P = \tfrac12\dot m\,(V_e^2 - V_0^2)`, String.raw`\eta_p = \frac{FV_0}{P} = \frac{2}{1 + V_e/V_0}`],
  liveRows(state, c) {
    return [
      kv('Air handled', `${fig(c.m)} kg/s`),
      kv('Jet speed', `${fig(c.Ve)} m/s`),
      kv('Thrust', kN(c.F)),
      kv('Propulsive efficiency', `${fig(100 * c.eta)}%`),
      kv('Power left in the wake', `${fig(c.wake / 1e6)} MW`),
      kv('Momentum against energy', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['thrust', kN(c.F)], ['η_p', `${fig(100 * c.eta)}%`], ['jet', `${fig(c.Ve)} m/s`], ['bypass', fig(state.B)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The thermal efficiency of the core, the fan’s own losses, and the weight and drag of a large fan, which set a practical limit near a bypass ratio of 10 to 12.`;
    if (state.B < 0.5) return { title: 'A fast jet wastes energy', body: `All 40 MW goes into 100 kg/s, which leaves at ${fig(c.Ve)} m/s, far faster than the aircraft. ${fig(c.wake / 1e6)} MW stays in the wake as kinetic energy: propulsive efficiency ${fig(100 * c.eta)}%. ${leavesOut}` };
    return { title: 'More air, slower jet, more thrust', body: `At bypass ${fig(state.B)} the same 40 MW accelerates ${fig(c.m)} kg/s to only ${fig(c.Ve)} m/s, closer to the flight speed. Thrust rises to ${kN(c.F)} and the wake keeps only ${fig(c.wake / 1e6)} MW. ${leavesOut}` };
  },
  app: false,
});
