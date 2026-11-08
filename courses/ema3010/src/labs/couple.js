import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { COUPLE, galvanicChecked, galvanicClosed } from '@flux/subjects/matsci/galvanic.js';

/**
* Galvanic: steel joined to copper in aerated water, with a slider for the ratio of copper's area to
 * the steel's, the Evans diagram and the steel's corrosion rate drawn.
 *
 * Shows that painting the anode alone is a mistake: a small exposed patch of steel beside a large
 * copper cathode carries the whole cathode's current, and corrodes at 1.4 mm/yr at a ratio of 100
 * against 0.07 mm/yr at equal areas. The mixed-potential closed form is checked by bisection on the
 * net current (packages/subjects/src/matsci/galvanic.js).
 */
const SCENARIOS = [
  { id: 'equal', name: 'Equal areas', lr: 0 },
  { id: 'rivet', name: 'A steel rivet in a copper sheet, 100 : 1', lr: 2 },
  { id: 'scratch', name: 'Painted steel with a scratch, 1000 : 1', lr: 3 },
  { id: 'bigsteel', name: 'A copper fitting on a steel tank, 1 : 100', lr: -2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lr: sc.lr });
}

const KEYS = [['cp-r', 'lr']];

const mmyr = (x) => `${fig(x)} mm/yr`;

function evans(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -12, hi: 3 }, { lo: -0.6, hi: 1 });
  axes(P, { xLabel: 'log₁₀ current (A, per m² of steel)', yLabel: 'potential E (V)', yFmt: (v) => fig(Math.abs(v) < 1e-9 ? 0 : v) });
  const { Ea, ba, i0a, Ec, bc, i0c } = COUPLE;
  const an = [[Math.log10(i0a), Ea], [3, Ea + ba * (3 - Math.log10(i0a))]];
  const lc = Math.log10(c.r * i0c);
  const ca = [[lc, Ec], [3, Ec - bc * (3 - lc)]];
  line(P, an, { color: C.red, width: 2.5 });
  line(P, ca, { color: C.blue, width: 2.5 });
  label(P, 'steel dissolving', an[0], { color: C.red, align: 'left', dy: 14 });
  label(P, 'oxygen reduced on copper', ca[0], { color: C.blue, align: 'left', dy: -10 });
  dot(P, Math.log10(c.ia), c.E, { color: C.pink, r: 6, ring: C.text });
  seg(P, [-12, c.E], [Math.log10(c.ia), c.E], { color: alpha(C.muted, 0.7), width: 1, dash: [3, 3] });
  label(P, `couple settles at ${fig(c.E)} V`, [-12, c.E], { color: C.text, align: 'left', dx: 4, dy: 12 });
}

function rate(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0.01, hi: 1000, log: true }, { lo: 1e-3, hi: 20, log: true });
  axes(P, { xLabel: 'copper area over steel area', yLabel: 'steel corrosion rate (mm/yr)' });
  const pts = Array.from({ length: 101 }, (_, i) => {
    const lr = -2 + (5 * i) / 100;
    return [10 ** lr, galvanicClosed({ lr }).rate];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, c.r, c.rate, { color: C.pink, r: 6, ring: C.text });
  label(P, mmyr(c.rate), [c.r, c.rate], { color: C.text, align: c.r > 30 ? 'right' : 'left', dx: c.r > 30 ? -10 : 10, dy: -8 });
}

export default defineLab({
  id: 'couple',
  exam: 'u5',
  title: 'Galvanic',
  hint: 'Start at equal areas, then shrink the steel: a rivet, then a scratch in paint. Watch the corrosion rate climb.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('equal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lr', lo: -2, hi: 3 }),
  controls() {
    return `
      ${slider('cp-r', "Copper area over steel area, log₁₀", 0, -2, 3, 0.01)}
      <p class="tiny">Model Tafel lines: iron dissolving (E = −0.44 V, 60 mV per decade) and oxygen reduced on copper (E = +0.80 V, 120 mV per decade), per square metre of steel. Left: the Evans diagram, potential against log current. Right: the steel’s corrosion rate against the area ratio.</p>`;
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
    return galvanicChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      rate(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    evans(B, a, state, c);
    rate(B, b, state, c);
  },
  law: () => [String.raw`E_\text{cell} = E_\text{cathode} - E_\text{anode}, \qquad \Delta G = -nFE_\text{cell}`, String.raw`A_a i_{0,a}10^{(E - E_a)/b_a} = A_c i_{0,c}10^{(E_c - E)/b_c}`],
  liveRows(state, c) {
    return [
      kv('Cell voltage, open circuit', `${fig(COUPLE.Ec - COUPLE.Ea)} V`),
      kv('Couple potential', `${fig(c.E)} V`),
      kv('Steel’s current density', `${fig(c.ia)} A/m²`),
      kv('Corrosion rate', mmyr(c.rate)),
      kv('Against equal areas', `×${fig(c.rate / c.rateEqual)}`),
      kv('Closed form against bisection', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['rate', mmyr(c.rate)], ['ratio', `${fig(c.r)} : 1`], ['E', `${fig(c.E)} V`], ['vs equal', `×${fig(c.rate / c.rateEqual)}`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> In still water the oxygen supply, not the Tafel line, often limits the cathode, and then the rate grows in direct proportion to the area ratio; the water’s conductivity also limits how far the current reaches across a large cathode.`;
    if (c.r > 3) return { title: 'A small anode beside a large cathode', body: `All the oxygen reduced on ${fig(c.r)} times as much copper takes its electrons from the steel, so the steel dissolves at ${mmyr(c.rate)}, ${fig(c.rate / c.rateEqual)} times the rate at equal areas. Paint the cathode, or both, never the anode alone. ${leavesOut}` };
    if (c.r < 0.3) return { title: 'A large anode spreads the attack', body: `With ${fig(1 / c.r)} times as much steel as copper, the cathode’s small current is shared over a large area: ${mmyr(c.rate)}. ${leavesOut}` };
    return { title: 'Equal areas', body: `The couple settles at ${fig(c.E)} V, where the steel’s dissolution current equals the copper’s oxygen-reduction current. The steel corrodes at ${mmyr(c.rate)}. Now shrink the steel. ${leavesOut}` };
  },
  app: false,
});
