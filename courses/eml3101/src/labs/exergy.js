import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ROOM, T0, exergyChecked, exergyClosed } from '@flux/subjects/thermo/exergy.js';

/**
* Exergy: one kilojoule of heat at a temperature you set, from furnace heat down to near the 10 °C
 * surroundings, with the work it could give and what is lost using it to warm a room.
 *
 * Shows that a kilojoule is not a kilojoule: at 1500 K it could give 0.81 kJ of work, at 320 K only
 * 0.12, and at the surroundings' temperature nothing. Burning fuel at 1500 K to warm a room at 22 °C
 * throws away 95% of that potential. The stream's closed form is checked by summing the work of
 * Carnot engines on each slice of the stream (packages/subjects/src/thermo/exergy.js).
 */
const SCENARIOS = [
  { id: 'furnace', name: 'Furnace heat, 1500 K', TK: 1500 },
  { id: 'steam', name: 'Steam, 600 K', TK: 600 },
  { id: 'warm', name: 'Warm water, 350 K', TK: 350 },
  { id: 'lukewarm', name: 'Barely warm, 320 K', TK: 320 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, TK: sc.TK });
}

const KEYS = [['ex-t', 'TK']];

function worth(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 283, hi: 2000 }, { lo: 0, hi: 1 });
  axes(P, { xLabel: 'temperature of the heat (K)', yLabel: 'work from 1 kJ (kJ)' });
  const Ts = Array.from({ length: 172 }, (_, i) => 290 + 10 * i);
  line(P, Ts.map((T) => [T, exergyClosed({ TK: T }).fr]), { color: C.gold, width: 2.5 });
  line(P, Ts.map((T) => [T, exergyClosed({ TK: T }).fs]), { color: C.blue, width: 2.5 });
  label(P, 'held at T', [2000, exergyClosed({ TK: 2000 }).fr], { color: C.gold, align: 'right', dy: -10 });
  label(P, 'stream cooling from T', [2000, exergyClosed({ TK: 2000 }).fs], { color: C.blue, align: 'right', dy: 18 });
  dot(P, state.TK, c.fr, { color: C.pink, r: 6, ring: C.text });
  dot(P, state.TK, c.fs, { color: C.pink, r: 5 });
}

function room(B, rect, state, c) {
  const left = Math.max(0, 1 - T0 / ROOM);
  const bars = [['energy', 1, C.muted], ['work potential', Math.max(0, c.fr), C.gold], ['left in the room', state.TK > ROOM ? left : 0, C.green], ['destroyed', state.TK > ROOM ? Math.max(0, c.fr - left) : 0, C.red]];
  const P = plotIn(B, rect, { lo: -0.5, hi: 3.5 }, { lo: 0, hi: 1.15 });
  axes(P, { xLabel: '1 kJ at T, used to warm a room at 22 °C', yLabel: 'kJ', xFmt: (v) => (Math.abs(v - Math.round(v)) < 1e-6 ? ['energy', 'potential', 'kept', 'destroyed'][Math.round(v)] ?? '' : '') });
  bars.forEach(([name, v, col], i) => {
    poly(P, [[i - 0.32, 0], [i + 0.32, 0], [i + 0.32, v], [i - 0.32, v]], { fill: alpha(col, 0.75), stroke: null });
    label(P, fig(v), [i, v], { color: C.text, dy: -8 });
  });
}

export default defineLab({
  id: 'exergy',
  exam: 'u3',
  title: 'Exergy',
  hint: 'Slide the temperature from 1500 K down toward 283 K and watch the work potential vanish, though the energy is still one kilojoule.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('furnace', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'TK', lo: 290, hi: 2000 }),
  controls() {
    return `
      ${slider('ex-t', "Temperature of the heat (K)", 1500, 290, 2000, 1)}
      <p class="tiny">Surroundings at 10 °C, 283 K. Left: the work one kilojoule could give, drawn from a reservoir held at T (gold) or from a stream cooling from T to the surroundings (blue). Right: one kilojoule at T used to warm a room at 22 °C.</p>`;
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
    return exergyChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      worth(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    worth(B, a, state, c);
    room(B, b, state, c);
  },
  law: () => [String.raw`X = Q\left(1 - \frac{T_0}{T}\right)`, String.raw`X_\text{stream} = Q\left[1 - \frac{T_0\ln(T/T_0)}{T - T_0}\right]`, String.raw`X_\text{destroyed} = T_0 S_\text{gen}`],
  liveRows(state, c) {
    return [
      kv('Work from 1 kJ held at T', `${fig(c.fr)} kJ`),
      kv('Work from 1 kJ of a cooling stream', `${fig(c.fs)} kJ`),
      kv('Warming the room: entropy generated', `${fig(1000 * c.sgen)} J/K`),
      kv('Warming the room: work destroyed', `${fig(c.destroyed)} kJ`),
      kv('Closed form against the Carnot sum', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['work potential', `${fig(c.fr)} kJ`], ['stream', `${fig(c.fs)} kJ`], ['destroyed', `${fig(c.destroyed)} kJ`], ['T', `${fig(state.TK)} K`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The dead state is a choice: the same heat is worth more on a cold day, and nothing on a day as warm as the heat. Chemical exergy, the work in a fuel before it burns, is a separate term.`;
    if (state.TK < 340) return { title: 'Low-temperature heat is worth little', body: `A kilojoule at ${fig(state.TK)} K could give only ${fig(c.fr)} kJ of work against surroundings at 283 K. It is still a kilojoule of energy; its quality is low. ${leavesOut}` };
    return { title: 'A kilojoule is not a kilojoule', body: `At ${fig(state.TK)} K a kilojoule could give ${fig(c.fr)} kJ of work. Used to warm a room at 22 °C, ${fig(c.destroyed)} kJ of that is destroyed, ${fig((100 * c.destroyed) / Math.max(1e-9, c.fr))}% of it: a heat pump would deliver the same warmth for far less work. ${leavesOut}` };
  },
  app: false,
});
